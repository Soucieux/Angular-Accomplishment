import { Injectable } from '@angular/core';
import { AuthService } from '../authentication-service/auth.service';
import { DatabaseService } from '../database-service/database.service';
import { CloudbaseService } from '../database-service/cloudbase/cloudbase.service';
import { LOG } from '../../common/app.logs';
import { LOG_ANONYMOUS_SESSION_FAILED } from '../../common/constants';

/**
 * Opens and releases the read-only anonymous session a public page needs when a visitor arrives
 * without one.
 *
 * The sequence is order-dependent and easy to get wrong, which is why it lives here rather than in
 * each page: credentials must exist before any watch connects, `markAuthReady` releases the watches
 * waiting on them, and the realtime streams must be re-armed because session recovery treats a
 * visitor with no session as expired and tears them down — leaving every watch short-circuited on a
 * null generation.
 */
@Injectable({ providedIn: 'root' })
export class AnonymousSessionService {
	private readonly className = 'AnonymousSessionService';

	constructor(
		private authService: AuthService,
		private databaseService: DatabaseService
	) {}

	/**
	 * Opens an anonymous session when the visitor has none, so a public page's watches can connect.
	 * Does nothing when a session already exists, named or otherwise.
	 *
	 * @returns Whether this call opened the session — the caller passes it back to {@link release}.
	 */
	public async openIfNeeded(): Promise<boolean> {
		if (CloudbaseService.getUserId()) return false;
		try {
			await this.authService.signInAnonymously();
		} catch (error: unknown) {
			/* Logged here so no caller has to: the page still builds its observables, which fall back to
			   their empty state, and the loading watchdog surfaces a genuinely stuck load. */
			LOG.error(this.className, LOG_ANONYMOUS_SESSION_FAILED, error as Error);
			return false;
		}
		CloudbaseService.markAuthReady();
		this.databaseService.restartRealtimeStreams();
		return true;
	}

	/**
	 * Releases a session opened by {@link openIfNeeded}, and only then. The anonymous-versus-named
	 * check happens at teardown inside the auth service, so a named session restored after the
	 * anonymous sign-in began is never signed out by a public page.
	 *
	 * @param wasOpenedHere - Whether the caller opened the session, as returned by {@link openIfNeeded}.
	 * @returns A promise that resolves once the session has been released, or deliberately kept.
	 */
	public async release(wasOpenedHere: boolean): Promise<void> {
		if (!wasOpenedHere) return;
		await this.authService.signOutIfStillAnonymous();
	}
}
