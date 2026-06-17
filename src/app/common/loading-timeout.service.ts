import { Injectable } from '@angular/core';
import { LOADING_TIMEOUT_MS } from './app.constant';

@Injectable({ providedIn: 'root' })
export class LoadingTimeoutService {
	private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

	/**
	 * Starts a loading guard timer for the given key. If a timer already exists
	 * for that key it is cleared before the new one starts. When the delay
	 * elapses, `onTimeout` is invoked.
	 *
	 * @param key - Unique identifier for this timer (use a TIMEOUT_KEY_* constant).
	 * @param onTimeout - Callback invoked when the delay elapses.
	 * @param delay - Milliseconds to wait before firing (default: LOADING_TIMEOUT_MS).
	 */
	public start(key: string, onTimeout: () => void, delay = LOADING_TIMEOUT_MS): void {
		this.clear(key);
		this.timers.set(key, setTimeout(onTimeout, delay));
	}

	/**
	 * Cancels the active timer for the given key. Safe to call even when
	 * no timer is running for that key.
	 *
	 * @param key - The timer key to cancel.
	 */
	public clear(key: string): void {
		const timer = this.timers.get(key);
		if (timer !== undefined) {
			clearTimeout(timer);
			this.timers.delete(key);
		}
	}
}
