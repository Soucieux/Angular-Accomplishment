import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, firstValueFrom, from } from 'rxjs';
import { take, timeout } from 'rxjs/operators';

import { AuthService } from '../authentication-service/auth.service';
import { DatabaseService } from '../database-service/database.service';
import { RecoveryStatus, RecoveryTrigger } from './session-recovery.model';
import {
	LOADING_TIMEOUT_MS,
	RECOVERY_AUTH_EXPIRED,
	RECOVERY_AUTH_UNKNOWN,
	RECOVERY_PROBE_TIMEOUT_MS,
	RECOVERY_STATUS_EXPIRED,
	RECOVERY_STATUS_OFFLINE,
	RECOVERY_STATUS_RECOVERED,
	RECOVERY_TRIGGER_STARTUP
} from '../../common/constants';
import { SessionExpiredError } from '../../common/error/session-expired.error';
import { NotificationService } from '../notification-service/notification.service';

@Injectable({ providedIn: 'root' })
export class SessionRecoveryService {
	private readonly recoveryOutcomesSubject = new ReplaySubject<RecoveryStatus>(1);
	private recoveryPromise?: Promise<RecoveryStatus>;

	constructor(
		private authService: AuthService,
		private databaseService: DatabaseService,
		private notificationService: NotificationService
	) {}

	// ── Recovery workflow ────────────────────────────────────────────────

	/**
	 * Recovers authentication and active realtime streams through one shared in-flight workflow.
	 *
	 * @param trigger - The lifecycle or data-layer event requesting recovery.
	 * @returns The recovered, expired, or retryable offline outcome.
	 */
	public recover(trigger: RecoveryTrigger): Promise<RecoveryStatus> {
		if (this.recoveryPromise) return this.recoveryPromise;

		this.recoveryPromise = this.runRecovery(trigger);
		return this.recoveryPromise;
	}

	/**
	 * Gets completed central recovery outcomes, replaying the latest result to later subscribers.
	 *
	 * @returns An observable that emits every completed recovery status.
	 */
	public getRecoveryOutcomes$(): Observable<RecoveryStatus> {
		return this.recoveryOutcomesSubject.asObservable();
	}

	/**
	 * Clears every local user layer after the authentication provider explicitly confirms expiry.
	 *
	 * @returns The confirmed-expiry recovery status.
	 */
	public expireConfirmedSession(): RecoveryStatus {
		const recoveryStatus = this.clearConfirmedExpiredSession();
		this.recoveryOutcomesSubject.next(recoveryStatus);
		return recoveryStatus;
	}

	/**
	 * Validates the session, probes the database, and refreshes realtime streams in sequence.
	 *
	 * @param trigger - The lifecycle or data-layer event requesting recovery.
	 * @returns The recovered, expired, or retryable offline outcome.
	 */
	private async runRecovery(trigger: RecoveryTrigger): Promise<RecoveryStatus> {
		let recoveryStatus: RecoveryStatus = RECOVERY_STATUS_OFFLINE;
		try {
			// Step 1: Distinguishes confirmed expiry from retryable transport uncertainty
			const authValidationStatus = await this.waitWithinTimeout(
				this.authService.validateSession(),
				RECOVERY_PROBE_TIMEOUT_MS
			);
			if (authValidationStatus === RECOVERY_AUTH_EXPIRED) {
				recoveryStatus = this.clearConfirmedExpiredSession();
			} else if (authValidationStatus !== RECOVERY_AUTH_UNKNOWN) {
				// Step 2: Uses a real authenticated database read instead of auth readiness as the health proof
				await this.waitWithinTimeout(
					this.databaseService.checkConnection(),
					RECOVERY_PROBE_TIMEOUT_MS
				);

				/* Step 3: Subscribes to the fresh-snapshot signal before restarting streams so a
				   synchronous first emission cannot be missed. Startup leaves fresh-data proof to
				   the routed page's existing seven-second loading guard. */
				const freshSnapshotPromise =
					trigger === RECOVERY_TRIGGER_STARTUP
						? undefined
						: firstValueFrom(
							this.databaseService
								.getFreshSnapshot$()
								.pipe(take(1), timeout(LOADING_TIMEOUT_MS))
						);
				this.databaseService.restartRealtimeStreams();

				if (freshSnapshotPromise) {
					await freshSnapshotPromise;
				}
				recoveryStatus = RECOVERY_STATUS_RECOVERED;
			}
		} catch (error: unknown) {
			if (error instanceof SessionExpiredError) {
				recoveryStatus = this.clearConfirmedExpiredSession();
			}
		} finally {
			this.recoveryPromise = undefined;
		}
		this.recoveryOutcomesSubject.next(recoveryStatus);
		return recoveryStatus;
	}

	/**
	 * Clears database state before publishing the locally signed-out authentication state.
	 *
	 * @returns The confirmed-expiry recovery status.
	 */
	private clearConfirmedExpiredSession(): RecoveryStatus {
		this.notificationService.clearPendingRestore();
		this.databaseService.clearSessionState();
		this.authService.expireLocalSession();
		return RECOVERY_STATUS_EXPIRED;
	}

	/**
	 * Gets a promise result within the supplied timeout window.
	 *
	 * @param operation - The asynchronous operation to await.
	 * @param timeoutMs - The maximum duration to wait in milliseconds.
	 * @returns The resolved operation value.
	 */
	private async waitWithinTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
		return await firstValueFrom(from(operation).pipe(timeout(timeoutMs)));
	}
}
