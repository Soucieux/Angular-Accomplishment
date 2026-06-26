import { Injectable } from '@angular/core';
import { firstValueFrom, Subscription } from 'rxjs';
import { LOG } from '../../common/app.logs';
import { Utilities } from '../../common/utilities/app.utilities';
import { DatabaseService } from '../database-service/database.service';
import { NotificationService } from './notification.service';
import {
	NOTIF_BODY_SEPARATOR,
	NOTIF_DAILY_HOUR,
	NOTIF_INTERVAL_MS,
	NOTIF_KEY_3DAY,
	NOTIF_KEY_DUE,
	NOTIF_SCHEDULER_INIT_ERROR,
	REMINDER_NOTIF_TITLE_3DAY,
	REMINDER_NOTIF_TITLE_TODAY
} from '../../common/app.constant';

@Injectable({ providedIn: 'root' })
export class NotificationSchedulerService {
	private readonly className = 'NotificationSchedulerService';
	private readonly notifiedKeys = new Set<string>();
	private readonly lastKnownDates = new Map<string, string | null>();
	private subscribed = false;
	private dailyTimer?: ReturnType<typeof setTimeout>;
	private dailyInterval?: ReturnType<typeof setInterval>;
	private subscriptionSub?: Subscription;

	constructor(
		private readonly notificationService: NotificationService,
		private readonly databaseService: DatabaseService
	) {}

	/**
	 * Starts the scheduler. Loads the persisted notification preference first, then
	 * runs an immediate scan when notifications are enabled, re-runs whenever the
	 * user enables them, and sets up a recurring daily scan at {@link NOTIF_DAILY_HOUR}.
	 */
	public start(): void {
		this.notificationService.init()
			.then(() => {
				this.subscriptionSub = this.notificationService.isSubscribed$.subscribe((subscribed) => {
					this.subscribed = subscribed;
					if (subscribed) this.runScheduledChecks().catch(() => {});
				});
				this.dailyTimer = setTimeout(() => {
					this.runScheduledChecks().catch(() => {});
					this.dailyInterval = setInterval(() => {
						this.runScheduledChecks().catch(() => {});
					}, NOTIF_INTERVAL_MS);
				}, this.getMsUntilDailyHour());
			})
			.catch((error: unknown) => LOG.error(this.className, NOTIF_SCHEDULER_INIT_ERROR, error as Error));
	}

	/**
	 * Stops the scheduler by cancelling all active subscriptions and timers.
	 */
	public stop(): void {
		this.subscriptionSub?.unsubscribe();
		clearTimeout(this.dailyTimer);
		clearInterval(this.dailyInterval);
	}

	/**
	 * Fetches all scheduled items from the database and fires push notifications for
	 * items due today or in exactly 3 days. Each item fires at most two notifications
	 * per session — one at the 3-day mark ({@link NOTIF_KEY_3DAY}) and one on the due
	 * date ({@link NOTIF_KEY_DUE}). Dedup state is reset when an item's date changes.
	 */
	private async runScheduledChecks(): Promise<void> {
		if (!this.subscribed) return;

		const raw = await firstValueFrom(this.databaseService.getReminderTableDetails());
		const records = raw as Array<{ key?: string; text?: string; date?: unknown }>;

		// Step 1: Remove dedup entries for items that were deleted
		const currentKeys = new Set(records.map((r) => r.key ?? ''));
		for (const key of this.lastKnownDates.keys()) {
			if (!currentKeys.has(key)) this.lastKnownDates.delete(key);
		}

		for (const record of records) {
			const itemKey = record.key ?? '';
			const date = record.date != null ? Utilities.coerceDateToString(record.date) : null;

			// Step 2: Reset dedup state when the item's date has changed since last check
			const lastDate = this.lastKnownDates.get(itemKey);
			if (lastDate !== date) {
				this.notifiedKeys.delete(`${itemKey}${NOTIF_KEY_3DAY}`);
				this.notifiedKeys.delete(`${itemKey}${NOTIF_KEY_DUE}`);
				this.lastKnownDates.set(itemKey, date);
			}

			if (!date) continue;
			const days = Utilities.getDaysUntilNumber(date);
			if (days === null) continue;

			const body = `${record.text ?? ''}${NOTIF_BODY_SEPARATOR}${date.replace(/-/g, '.')}`;

			if (days === 3) this.sendOnce(`${itemKey}${NOTIF_KEY_3DAY}`, REMINDER_NOTIF_TITLE_3DAY, body);
			if (days === 0) this.sendOnce(`${itemKey}${NOTIF_KEY_DUE}`, REMINDER_NOTIF_TITLE_TODAY, body);
		}
	}

	/**
	 * Sends a push notification for the given dedup key if it has not already fired
	 * this session. Adds the key to the notified set on send.
	 *
	 * @param notifKey - The composite session-dedup key (item key + suffix).
	 * @param title - The notification title reflecting the urgency level.
	 * @param body - The notification body text.
	 */
	private sendOnce(notifKey: string, title: string, body: string): void {
		if (this.notifiedKeys.has(notifKey)) return;
		this.notifiedKeys.add(notifKey);
		this.notificationService.sendNotification(title, body).catch(() => {});
	}

	/**
	 * Gets the milliseconds remaining until the next occurrence of {@link NOTIF_DAILY_HOUR}.
	 * If the current time is already past that hour today, targets tomorrow.
	 *
	 * @returns The number of milliseconds until the next daily notification hour.
	 */
	private getMsUntilDailyHour(): number {
		const now = new Date();
		const next = new Date(now);
		next.setHours(NOTIF_DAILY_HOUR, 0, 0, 0);
		if (next <= now) next.setDate(next.getDate() + 1);
		return next.getTime() - now.getTime();
	}
}
