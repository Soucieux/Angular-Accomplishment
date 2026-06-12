import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwPush } from '@angular/service-worker';
import { DatabaseService } from '../database-service/database.service';
import { environment } from '../../../environment/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
	constructor(
		private readonly swPush: SwPush,
		private readonly databaseService: DatabaseService,
		@Inject(PLATFORM_ID) private readonly platformId: object
	) {}

	/**
	 * Gets whether Web Push is supported and the Angular service worker is active.
	 * Returns false in dev mode (SW is disabled) and on unsupported browsers.
	 *
	 * @returns True when push notifications can be requested on this device.
	 */
	public isSupported(): boolean {
		return isPlatformBrowser(this.platformId) && this.swPush.isEnabled && 'Notification' in window;
	}

	/**
	 * Gets the current browser notification permission state.
	 *
	 * @returns The NotificationPermission value, or 'denied' on unsupported platforms.
	 */
	public getPermission(): NotificationPermission {
		if (!isPlatformBrowser(this.platformId) || !('Notification' in window)) {
			return 'denied';
		}
		return Notification.permission;
	}

	/**
	 * Requests push notification permission from the browser, then saves the
	 * resulting subscription to the database for server-side dispatch.
	 */
	public async subscribe(): Promise<void> {
		const sub = await this.swPush.requestSubscription({
			serverPublicKey: environment.vapidPublicKey
		});
		await this.databaseService.savePushSubscription(sub.toJSON() as PushSubscriptionJSON);
	}

	/**
	 * Cancels the active push subscription in the browser and removes it from
	 * the database so the server stops dispatching messages to this device.
	 */
	public async unsubscribe(): Promise<void> {
		await this.swPush.unsubscribe();
		await this.databaseService.deletePushSubscription();
	}
}
