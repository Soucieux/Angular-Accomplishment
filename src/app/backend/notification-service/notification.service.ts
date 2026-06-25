import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { invoke } from '@tauri-apps/api/tauri';
import { BehaviorSubject, Observable } from 'rxjs';
import { DatabaseService } from '../database-service/database.service';
import { NOTIF_ENABLED_BODY, NOTIF_ENABLED_TITLE } from '../../common/app.constant';

@Injectable({ providedIn: 'root' })
export class NotificationService {
	private readonly tauriSubscribed = new BehaviorSubject<boolean>(false);

	/**
	 * Emits true when the Tauri notification preference is enabled.
	 */
	public readonly isSubscribed$: Observable<boolean> = this.tauriSubscribed.asObservable();

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
		this.tauriSubscribed.next(enabled);
	}

	/**
	 * Activates the Tauri notification preference, persists it to the database,
	 * and fires a confirmation notification.
	 */
	public async subscribe(): Promise<void> {
		await this.databaseService.setTauriNotifEnabled(true);
		this.tauriSubscribed.next(true);
		this.sendNotification(NOTIF_ENABLED_TITLE, NOTIF_ENABLED_BODY).catch(() => {});
	}

	/**
	 * Deactivates the Tauri notification preference and removes it from the database.
	 */
	public async unsubscribe(): Promise<void> {
		await this.databaseService.setTauriNotifEnabled(false);
		this.tauriSubscribed.next(false);
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
