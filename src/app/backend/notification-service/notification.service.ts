import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwPush } from '@angular/service-worker';
import { map, Observable } from 'rxjs';
import { DatabaseService } from '../database-service/database.service';
import { environment } from '../../../environment/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
	/**
	 * Emits true when a push subscription is active in the browser,
	 * false when unsubscribed. Distinct from notification permission —
	 * permission stays 'granted' even after unsubscribing.
	 */
	public readonly isSubscribed$: Observable<boolean> = this.swPush.subscription.pipe(
		map(sub => sub !== null)
	);

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
		return this.isBrowserWithNotifications && this.swPush.isEnabled;
	}

	/**
	 * Gets the current browser notification permission state.
	 *
	 * @returns The NotificationPermission value, or 'denied' on unsupported platforms.
	 */
	public getPermission(): NotificationPermission {
		if (!this.isBrowserWithNotifications) return 'denied';
		return Notification.permission;
	}

	/**
	 * Gets whether this code is running in a browser that supports the
	 * Notification API. Guards both {@link isSupported} and {@link getPermission}.
	 *
	 * @returns True on browser platforms with Notification API support.
	 */
	private get isBrowserWithNotifications(): boolean {
		return isPlatformBrowser(this.platformId) && 'Notification' in window;
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
