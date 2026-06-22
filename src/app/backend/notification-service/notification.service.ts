import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwPush } from '@angular/service-worker';
import { invoke } from '@tauri-apps/api/tauri';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { DatabaseService } from '../database-service/database.service';
import { environment } from '../../../environment/environment';
import { NOTIF_ENABLED_BODY, NOTIF_ENABLED_TITLE } from '../../common/app.constant';

@Injectable({ providedIn: 'root' })
export class NotificationService {
	private readonly tauriSubscribed = new BehaviorSubject<boolean>(false);

	/**
	 * Emits true when a push subscription is active. For Tauri this reflects a
	 * user-chosen preference; for PWA it reflects the Web Push subscription state.
	 */
	public readonly isSubscribed$: Observable<boolean> = this.isTauri
		? this.tauriSubscribed.asObservable()
		: this.swPush.subscription.pipe(map((sub) => sub !== null));

	constructor(
		private readonly swPush: SwPush,
		private readonly databaseService: DatabaseService,
		@Inject(PLATFORM_ID) private readonly platformId: object
	) {}

	/**
	 * Gets whether push notifications are available on this device. Returns true
	 * for the Tauri desktop app and for installed PWAs in standalone mode only.
	 *
	 * @returns True when notifications can be requested.
	 */
	public isSupported(): boolean {
		if (this.isTauri) return true;
		return this.hasBrowserNotificationApi && this.swPush.isEnabled && this.isStandalonePwa;
	}

	/**
	 * Gets the current notification permission state. Always returns 'default'
	 * for Tauri because macOS permission is requested implicitly on first send.
	 *
	 * @returns The NotificationPermission value, or 'denied' on unsupported platforms.
	 */
	public getPermission(): NotificationPermission {
		if (this.isTauri) return 'default';
		if (!this.hasBrowserNotificationApi) return 'denied';
		return Notification.permission;
	}

	/**
	 * Activates the subscription. For Tauri, marks the subscription as active and
	 * fires a fire-and-forget confirmation notification. For PWA, creates a Web Push
	 * subscription and saves it to the database.
	 */
	public async subscribe(): Promise<void> {
		if (this.isTauri) {
			this.tauriSubscribed.next(true);
			this.sendNotification(NOTIF_ENABLED_TITLE, NOTIF_ENABLED_BODY).catch(() => {});
			return;
		}
		const sub = await this.swPush.requestSubscription({ serverPublicKey: environment.vapidPublicKey });
		await this.databaseService.addPushSubscription(sub.toJSON() as PushSubscriptionJSON);
	}

	/**
	 * Deactivates the subscription. For Tauri, resets the local preference (OS
	 * permission is not revoked — that requires System Settings). For PWA, cancels
	 * the Web Push subscription and removes it from the database.
	 */
	public async unsubscribe(): Promise<void> {
		if (this.isTauri) {
			this.tauriSubscribed.next(false);
			return;
		}
		await this.swPush.unsubscribe();
		await this.databaseService.deletePushSubscription();
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

	/**
	 * Gets whether the app is running as an installed PWA added to the home screen.
	 *
	 * @returns True when display-mode is standalone.
	 */
	private get isStandalonePwa(): boolean {
		return window.matchMedia('(display-mode: standalone)').matches;
	}

	/**
	 * Gets whether the platform is a browser with the Notification API available.
	 *
	 * @returns True on browser platforms with Notification API support.
	 */
	private get hasBrowserNotificationApi(): boolean {
		return isPlatformBrowser(this.platformId) && 'Notification' in window;
	}
}
