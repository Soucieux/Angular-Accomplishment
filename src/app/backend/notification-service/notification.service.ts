import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { invoke } from '@tauri-apps/api/core';
import { DatabaseService } from '../database-service/database.service';
import { LOG } from '../../common/app.logs';
import { NOTIF_SEND_FAILED, NOTIF_SUBSCRIBE_FAILED, NOTIF_UNSUBSCRIBE_FAILED } from '../../common/constants';
import { NOTIF_ENABLED_BODY, NOTIF_ENABLED_TITLE } from '../../common/locale/locale-strings';

@Injectable({ providedIn: 'root' })
export class NotificationService {
	private readonly className = 'NotificationService';
	private readonly _isSubscribed = signal(false);

	/**
	 * Gets whether the Tauri notification preference is enabled.
	 *
	 * @returns A readonly signal that is true when notifications are enabled.
	 */
	public readonly isSubscribed = this._isSubscribed.asReadonly();

	constructor(
		private readonly databaseService: DatabaseService,
		@Inject(PLATFORM_ID) private readonly platformId: object
	) {}

	/**
	 * Gets whether push notifications are available on this device. Returns true
	 * only for the Tauri desktop app.
	 *
	 * @returns True when running inside the Tauri runtime.
	 */
	public isSupported(): boolean {
		return this.isTauri;
	}

	/**
	 * Loads the persisted notification preference from the database and applies it.
	 * No-op on non-Tauri platforms.
	 */
	public async init(): Promise<void> {
		if (!this.isTauri) return;
		const enabled = await this.databaseService.getTauriNotifEnabled();
		this._isSubscribed.set(enabled);
	}

	/**
	 * Activates the Tauri notification preference. Flips state immediately and
	 * fires the confirmation notification before the DB write so neither can
	 * block the other. Reverts state if the DB write fails.
	 */
	public async subscribe(): Promise<void> {
		this._isSubscribed.set(true);
		this.sendNotification(NOTIF_ENABLED_TITLE, NOTIF_ENABLED_BODY).catch((error: unknown) => {
			LOG.error(this.className, NOTIF_SEND_FAILED, error as Error);
		});
		try {
			await this.databaseService.setTauriNotifEnabled(true);
		} catch (error: unknown) {
			LOG.error(this.className, NOTIF_SUBSCRIBE_FAILED, error as Error);
			this._isSubscribed.set(false);
		}
	}

	/**
	 * Deactivates the Tauri notification preference. Flips state immediately so
	 * the button responds without waiting for the DB write. Reverts on failure.
	 */
	public async unsubscribe(): Promise<void> {
		this._isSubscribed.set(false);
		try {
			await this.databaseService.setTauriNotifEnabled(false);
		} catch (error: unknown) {
			LOG.error(this.className, NOTIF_UNSUBSCRIBE_FAILED, error as Error);
			this._isSubscribed.set(true);
		}
	}

	/**
	 * Sends a native OS notification via the Tauri Rust command. No-op on
	 * non-Tauri platforms.
	 *
	 * @param title - The notification title.
	 * @param body - The notification body text.
	 */
	public async sendNotification(title: string, body: string): Promise<void> {
		if (!this.isTauri) return;
		await invoke<void>('send_notification', { title, body });
	}

	/**
	 * Gets whether the app is running inside the Tauri desktop wrapper.
	 *
	 * @returns True when the Tauri runtime is present.
	 */
	private get isTauri(): boolean {
		return isPlatformBrowser(this.platformId) && '__TAURI__' in window;
	}
}
