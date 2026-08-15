import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { TimeoutService } from './timeout.service';
import { Utilities } from '../utilities/app.utilities';
import { DatabaseService } from '../../backend/database-service/database.service';
import {
	AUTH_SETTLE_MAX_WAIT_MS,
	DATA_READY_MAX_WAIT_MS,
	RECOVERY_STATUS_EXPIRED,
	RECOVERY_STATUS_RECOVERED
} from '../constants';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { SessionRecoveryService } from '../../backend/session-recovery/session-recovery.service';
import { RecoveryStatus } from '../../backend/session-recovery/session-recovery.model';

describe('TimeoutService', () => {
	let service: TimeoutService;
	let mockUtilities: jasmine.SpyObj<Utilities>;
	let mockDatabaseService: jasmine.SpyObj<DatabaseService>;
	let mockSessionRecoveryService: jasmine.SpyObj<SessionRecoveryService>;
	let mockDialogService: jasmine.SpyObj<DialogService>;
	let authSettled$: BehaviorSubject<boolean>;
	let dataReady$: BehaviorSubject<boolean>;
	let recoveryOutcomes$: ReplaySubject<RecoveryStatus>;

	/**
	 * Builds the service with controllable auth-settled and data-ready streams.
	 *
	 * @param isUserAlive - What getIsUserAlive() reports once the guard checks it.
	 * @param isAuthSettled - Whether auth has already settled before start() is called.
	 * @param isDataReady - Whether the data layer already reports ready before start() is called.
	 * @param recoveryStatus - The completed central recovery outcome, or null to keep it pending.
	 */
	function setup(
		isUserAlive: boolean,
		isAuthSettled = true,
		isDataReady = true,
		recoveryStatus: RecoveryStatus | null = RECOVERY_STATUS_RECOVERED
	): void {
		authSettled$ = new BehaviorSubject<boolean>(isAuthSettled);
		dataReady$ = new BehaviorSubject<boolean>(isDataReady);
		recoveryOutcomes$ = new ReplaySubject<RecoveryStatus>(1);
		if (recoveryStatus !== null) recoveryOutcomes$.next(recoveryStatus);

		mockUtilities = jasmine.createSpyObj<Utilities>('Utilities', [
			'getIsUserAlive',
			'getIsAuthSettled$'
		]);
		mockUtilities.getIsUserAlive.and.returnValue(isUserAlive);
		mockUtilities.getIsAuthSettled$.and.returnValue(authSettled$.pipe(filter(Boolean)));

		mockDatabaseService = jasmine.createSpyObj<DatabaseService>('DatabaseService', [
			'getIsDataLayerReady$'
		]);
		mockDatabaseService.getIsDataLayerReady$.and.returnValue(dataReady$.pipe(filter(Boolean)));
		mockSessionRecoveryService = jasmine.createSpyObj<SessionRecoveryService>(
			'SessionRecoveryService',
			['getRecoveryOutcomes$']
		);
		mockSessionRecoveryService.getRecoveryOutcomes$.and.returnValue(recoveryOutcomes$.asObservable());
		mockDialogService = jasmine.createSpyObj<DialogService>('DialogService', ['closeLoadingTimeout']);

		TestBed.configureTestingModule({
			providers: [
				TimeoutService,
				{ provide: Utilities, useValue: mockUtilities },
				{ provide: DatabaseService, useValue: mockDatabaseService },
				{ provide: SessionRecoveryService, useValue: mockSessionRecoveryService },
				{ provide: DialogService, useValue: mockDialogService }
			]
		});

		service = TestBed.inject(TimeoutService);
	}

	it('should create', () => {
		setup(true);
		expect(service).toBeTruthy();
	});

	// ── start ────────────────────────────────────────────────────────────────────

	describe('start', () => {
		it('does not invoke the callback when the user is not signed in', fakeAsync(() => {
			setup(false);
			const callback = jasmine.createSpy('callback');

			service.start('key', callback, 100);
			tick(200);

			expect(callback).not.toHaveBeenCalled();
		}));

		it('invokes the callback after the countdown once auth is settled and the data layer is ready', fakeAsync(() => {
			setup(true);
			const callback = jasmine.createSpy('callback');

			service.start('key', callback, 100);
			tick(99);
			expect(callback).not.toHaveBeenCalled();

			tick(1);
			expect(callback).toHaveBeenCalledOnceWith();
		}));

		it('holds the countdown until the data layer signals ready, even when auth is already settled', fakeAsync(() => {
			// The post-sign-in redirect path: auth is already settled the instant the guard arms, but the
			// data layer is still connecting. The countdown must not start until the data layer is ready,
			// so the retry dialog cannot race a cold connection.
			setup(true, true, false);
			const callback = jasmine.createSpy('callback');

			service.start('key', callback, 100);

			// The whole countdown could elapse while the data layer is still connecting — nothing fires.
			tick(100);
			expect(callback).not.toHaveBeenCalled();

			// Data layer connects; only now does the countdown begin.
			dataReady$.next(true);
			tick(99);
			expect(callback).not.toHaveBeenCalled();

			tick(1);
			expect(callback).toHaveBeenCalledOnceWith();
		}));

		it('holds the existing data-ready flow until central recovery completes', fakeAsync(() => {
			setup(true, true, true, null);
			const callback = jasmine.createSpy('callback');

			service.start('key', callback, 100);
			tick(200);
			expect(callback).not.toHaveBeenCalled();

			recoveryOutcomes$.next(RECOVERY_STATUS_RECOVERED);
			tick(99);
			expect(callback).not.toHaveBeenCalled();

			tick(1);
			expect(callback).toHaveBeenCalledOnceWith();
		}));

		it('does not arm the page countdown after central recovery confirms expiry', fakeAsync(() => {
			setup(true, true, true, RECOVERY_STATUS_EXPIRED);
			const callback = jasmine.createSpy('callback');

			service.start('key', callback, 100);
			tick(200);

			expect(callback).not.toHaveBeenCalled();
			expect(mockDatabaseService.getIsDataLayerReady$).not.toHaveBeenCalled();
		}));

		it('waits past a replayed expiry for the next signed-in session recovery', fakeAsync(() => {
			setup(true, true, true, RECOVERY_STATUS_EXPIRED);
			const callback = jasmine.createSpy('callback');

			service.start('key', callback, 100);
			tick(200);
			expect(callback).not.toHaveBeenCalled();

			recoveryOutcomes$.next(RECOVERY_STATUS_RECOVERED);
			tick(100);

			expect(callback).toHaveBeenCalledOnceWith();
		}));

		it('clears an existing timer for the same key before starting a new one', fakeAsync(() => {
			setup(true);
			const first = jasmine.createSpy('first');
			const second = jasmine.createSpy('second');

			service.start('key', first, 100);
			tick(50);
			service.start('key', second, 100);
			tick(100);

			expect(first).not.toHaveBeenCalled();
			expect(second).toHaveBeenCalledOnceWith();
		}));

		it('runs independent timers for different keys concurrently', fakeAsync(() => {
			setup(true);
			const callbackA = jasmine.createSpy('callbackA');
			const callbackB = jasmine.createSpy('callbackB');

			service.start('a', callbackA, 100);
			service.start('b', callbackB, 200);
			tick(100);

			expect(callbackA).toHaveBeenCalledOnceWith();
			expect(callbackB).not.toHaveBeenCalled();

			tick(100);
			expect(callbackB).toHaveBeenCalledOnceWith();
		}));

		it('does not start the countdown until auth has settled', fakeAsync(() => {
			setup(true, false);
			const callback = jasmine.createSpy('callback');

			service.start('key', callback, 100);

			// The countdown cannot start while auth is still pending, even though the data layer is ready.
			tick(100);
			expect(callback).not.toHaveBeenCalled();

			authSettled$.next(true);
			tick(99);
			expect(callback).not.toHaveBeenCalled();

			tick(1);
			expect(callback).toHaveBeenCalledOnceWith();
		}));

		it('starts the countdown anyway once the auth wait cap elapses', fakeAsync(() => {
			setup(true, false);
			const callback = jasmine.createSpy('callback');

			service.start('key', callback, 100);
			tick(AUTH_SETTLE_MAX_WAIT_MS);
			expect(callback).not.toHaveBeenCalled();

			tick(100);
			expect(callback).toHaveBeenCalledOnceWith();
		}));

		it('starts the countdown anyway once the data-ready wait cap elapses', fakeAsync(() => {
			// The data layer never signals ready (a genuinely stuck connection); the cap must still let the
			// countdown run so the retry dialog is surfaced rather than spinning forever.
			setup(true, true, false);
			const callback = jasmine.createSpy('callback');

			service.start('key', callback, 100);
			tick(DATA_READY_MAX_WAIT_MS);
			expect(callback).not.toHaveBeenCalled();

			tick(100);
			expect(callback).toHaveBeenCalledOnceWith();
		}));
	});

	// ── clear ────────────────────────────────────────────────────────────────────

	describe('clear', () => {
		it('cancels an active timer so the callback never fires', fakeAsync(() => {
			setup(true);
			const callback = jasmine.createSpy('callback');

			service.start('key', callback, 100);
			service.clear('key');
			tick(200);

			expect(callback).not.toHaveBeenCalled();
		}));

		it('is safe to call when no timer is running for the key', () => {
			setup(true);
			expect(() => service.clear('nonexistent')).not.toThrow();
		});

		it('closes a retry dialog raised by an earlier countdown once the data arrives', fakeAsync(() => {
			setup(true);
			const callback = jasmine.createSpy('callback');

			service.start('key', callback, 100);
			tick(200);
			service.clear('key');

			expect(callback).toHaveBeenCalledOnceWith();
			expect(mockDialogService.closeLoadingTimeout).toHaveBeenCalled();
		}));

		it('does not affect timers registered under other keys', fakeAsync(() => {
			setup(true);
			const callback = jasmine.createSpy('callback');

			service.start('a', callback, 100);
			service.clear('b');
			tick(100);

			expect(callback).toHaveBeenCalledOnceWith();
		}));

		it('cancels a start that is still waiting on auth', fakeAsync(() => {
			setup(true, false);
			const callback = jasmine.createSpy('callback');

			service.start('key', callback, 100);
			service.clear('key');

			// Auth settling after the page already loaded must not arm the cancelled timer.
			authSettled$.next(true);
			tick(200);

			expect(callback).not.toHaveBeenCalled();
		}));
	});
});
