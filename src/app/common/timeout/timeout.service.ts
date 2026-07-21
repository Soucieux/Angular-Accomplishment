import { Injectable } from '@angular/core';
import { race, Subscription, timer } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { AUTH_SETTLE_MAX_WAIT_MS, LOADING_TIMEOUT_MS } from '../constants';
import { Utilities } from '../utilities/app.utilities';

@Injectable({ providedIn: 'root' })
export class TimeoutService {
	private readonly guards = new Map<string, Subscription>();

	constructor(private readonly utilities: Utilities) {}

	/**
	 * Starts a loading guard timer for the given key, held until the auth layer has answered.
	 * No-ops when the user is not signed in once auth settles — timers are only meaningful for
	 * authenticated sessions. If a guard already exists for that key it is cleared before the new
	 * one starts. When the delay elapses, `onTimeout` is invoked.
	 *
	 * @param key - Unique identifier for this timer (use a TIMEOUT_KEY_* constant).
	 * @param onTimeout - Callback invoked when the delay elapses.
	 * @param delay - Milliseconds to wait before firing (default: LOADING_TIMEOUT_MS).
	 */
	public start(key: string, onTimeout: () => void, delay = LOADING_TIMEOUT_MS): void {
		this.clear(key);

		/* Pages arm this during ngOnInit, before auth has answered, and getIsUserAlive() is already
		   true by then because it is seeded from the localStorage presence hint. Counting the delay
		   from here would spend the whole budget waiting on auth and raise the retry dialog on a
		   perfectly healthy load. So the countdown only begins once auth settles; racing that against
		   a max wait keeps the guard honest — an auth that never settles still surfaces the dialog
		   rather than spinning forever. */
		const guard = race(this.utilities.getIsAuthSettled$(), timer(AUTH_SETTLE_MAX_WAIT_MS))
			.pipe(
				take(1),
				filter(() => this.utilities.getIsUserAlive()),
				switchMap(() => timer(delay))
			)
			.subscribe(() => onTimeout());
		this.guards.set(key, guard);
	}

	/**
	 * Cancels the guard for the given key, whether it is still waiting on auth or already
	 * counting down. Safe to call even when no guard is running for that key.
	 *
	 * @param key - The timer key to cancel.
	 */
	public clear(key: string): void {
		const guard = this.guards.get(key);
		if (guard !== undefined) {
			guard.unsubscribe();
			this.guards.delete(key);
		}
	}
}
