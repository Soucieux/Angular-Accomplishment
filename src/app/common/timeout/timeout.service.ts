import { Injectable } from '@angular/core';
import { race, Subscription, timer } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { AUTH_SETTLE_MAX_WAIT_MS, DATA_READY_MAX_WAIT_MS, LOADING_TIMEOUT_MS } from '../constants';
import { Utilities } from '../utilities/app.utilities';
import { DatabaseService } from '../../backend/database-service/database.service';

@Injectable({ providedIn: 'root' })
export class TimeoutService {
	private readonly guards = new Map<string, Subscription>();

	constructor(
		private readonly utilities: Utilities,
		private readonly databaseService: DatabaseService
	) {}

	/**
	 * Starts a loading guard for the given key, held until auth has settled and the data layer has
	 * signalled it is ready to deliver data, so a freshly authenticated session's cold connection
	 * cannot trip the countdown. No-ops when the user is not signed in once auth settles — timers are
	 * only meaningful for authenticated sessions. If a guard already exists for that key it is cleared
	 * before the new one starts. When the countdown elapses, `onTimeout` is invoked.
	 *
	 * @param key - Unique identifier for this timer (use a TIMEOUT_KEY_* constant).
	 * @param onTimeout - Callback invoked when the countdown elapses.
	 * @param countdownMs - Milliseconds to count down once the session is ready (default: LOADING_TIMEOUT_MS).
	 */
	public start(key: string, onTimeout: () => void, countdownMs = LOADING_TIMEOUT_MS): void {
		this.clear(key);

		/* Pages arm this during ngOnInit. On a reload getIsUserAlive() is already true from the
		   localStorage presence hint while auth is still unconfirmed, so the countdown is held until
		   auth settles — racing that against a max wait keeps the guard honest, since an auth that
		   never settles still surfaces the dialog rather than spinning forever.

		   Auth settling is not enough on its own: on the post-sign-in redirect auth is already settled
		   the instant the guard arms, so the countdown would race a brand-new, cold data connection and
		   fire the retry dialog before the first realtime snapshot arrives. So the countdown also waits
		   for the data layer's own readiness signal (CloudBase watch-ready / Realtime Database
		   connected), again raced against a max wait so a data layer that never connects still surfaces
		   the dialog. A healthy load clears the guard long before either wait or the countdown elapses. */
		const guard = race(this.utilities.getIsAuthSettled$(), timer(AUTH_SETTLE_MAX_WAIT_MS))
			.pipe(
				take(1),
				filter(() => this.utilities.getIsUserAlive()),
				switchMap(() =>
					race(this.databaseService.getIsDataLayerReady$(), timer(DATA_READY_MAX_WAIT_MS)).pipe(take(1))
				),
				switchMap(() => timer(countdownMs))
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
