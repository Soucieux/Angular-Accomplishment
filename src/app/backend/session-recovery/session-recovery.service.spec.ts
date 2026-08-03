import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { AuthService } from '../authentication-service/auth.service';
import { DatabaseService } from '../database-service/database.service';
import { SessionRecoveryService } from './session-recovery.service';
import { LOADING_TIMEOUT_MS, RECOVERY_PROBE_TIMEOUT_MS } from '../../common/constants';
import { SessionExpiredError } from '../../common/error/session-expired.error';
import { NotificationService } from '../notification-service/notification.service';

describe('SessionRecoveryService', () => {
	let service: SessionRecoveryService;
	let mockAuthService: jasmine.SpyObj<AuthService>;
	let mockDatabaseService: jasmine.SpyObj<DatabaseService>;
	let mockNotificationService: jasmine.SpyObj<NotificationService>;
	let freshSnapshotSubject: Subject<void>;

	beforeEach(() => {
		freshSnapshotSubject = new Subject<void>();
		mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', [
			'validateSession',
			'expireLocalSession'
		]);
		mockDatabaseService = jasmine.createSpyObj<DatabaseService>('DatabaseService', [
			'checkConnection',
			'restartRealtimeStreams',
			'clearSessionState',
			'getFreshSnapshot$'
		]);
		mockDatabaseService.checkConnection.and.resolveTo();
		mockDatabaseService.getFreshSnapshot$.and.returnValue(freshSnapshotSubject.asObservable());
		mockNotificationService = jasmine.createSpyObj<NotificationService>('NotificationService', [
			'clearPendingRestore'
		]);

		TestBed.configureTestingModule({
			providers: [
				SessionRecoveryService,
				{ provide: AuthService, useValue: mockAuthService },
				{ provide: DatabaseService, useValue: mockDatabaseService },
				{ provide: NotificationService, useValue: mockNotificationService }
			]
		});
		service = TestBed.inject(SessionRecoveryService);
	});

	// ── Recovery workflow ────────────────────────────────────────────────

	describe('recover', () => {
		it('clears all local layers immediately for a provider-confirmed expiry', () => {
			const cleanupOrder: string[] = [];
			mockDatabaseService.clearSessionState.and.callFake(() => cleanupOrder.push('database'));
			mockAuthService.expireLocalSession.and.callFake(() => cleanupOrder.push('authentication'));

			const result = service.expireConfirmedSession();

			expect(result).toBe('expired');
			expect(mockNotificationService.clearPendingRestore).toHaveBeenCalledOnceWith();
			expect(cleanupOrder).toEqual(['database', 'authentication']);
		});

		it('publishes an immediate provider-confirmed expiry outcome', () => {
			let recoveryStatus: string | undefined;
			service.getRecoveryOutcomes$().subscribe((outcome) => {
				recoveryStatus = outcome;
			});

			service.expireConfirmedSession();

			expect(recoveryStatus).toBe('expired');
		});

		it('validates startup auth and connection before restarting realtime streams', async () => {
			mockAuthService.validateSession.and.resolveTo('valid');

			const result = await service.recover('startup');

			expect(result).toBe('recovered');
			expect(mockDatabaseService.checkConnection).toHaveBeenCalledOnceWith();
			expect(mockDatabaseService.restartRealtimeStreams).toHaveBeenCalledOnceWith();
			expect(mockDatabaseService.getFreshSnapshot$).not.toHaveBeenCalled();
		});

		it('replays the latest completed recovery outcome to later subscribers', async () => {
			mockAuthService.validateSession.and.resolveTo('valid');

			await service.recover('startup');
			let replayedStatus: string | undefined;
			service.getRecoveryOutcomes$().subscribe((recoveryStatus) => {
				replayedStatus = recoveryStatus;
			});

			expect(replayedStatus).toBe('recovered');
		});

		it('waits for a fresh snapshot after a resume recovery', fakeAsync(() => {
			mockAuthService.validateSession.and.resolveTo('valid');
			let result: string | undefined;

			service.recover('resume').then((recoveryStatus) => {
				result = recoveryStatus;
			});
			flushMicrotasks();

			expect(mockDatabaseService.restartRealtimeStreams).toHaveBeenCalledOnceWith();
			expect(result).toBeUndefined();

			freshSnapshotSubject.next();
			flushMicrotasks();

			expect(result).toBe('recovered');
		}));

		it('releases the fresh-snapshot listener when its runtime recovery times out', fakeAsync(() => {
			mockAuthService.validateSession.and.resolveTo('valid');
			let result: string | undefined;

			service.recover('resume').then((recoveryStatus) => {
				result = recoveryStatus;
			});
			flushMicrotasks();
			expect(freshSnapshotSubject.observed).toBeTrue();

			tick(LOADING_TIMEOUT_MS);
			flushMicrotasks();

			expect(result).toBe('offline');
			expect(freshSnapshotSubject.observed).toBeFalse();
		}));

		it('clears database state before expiring a confirmed invalid session', async () => {
			const cleanupOrder: string[] = [];
			mockAuthService.validateSession.and.resolveTo('expired');
			mockDatabaseService.clearSessionState.and.callFake(() => cleanupOrder.push('database'));
			mockAuthService.expireLocalSession.and.callFake(() => cleanupOrder.push('authentication'));

			const result = await service.recover('online');

			expect(result).toBe('expired');
			expect(cleanupOrder).toEqual(['database', 'authentication']);
			expect(mockDatabaseService.checkConnection).not.toHaveBeenCalled();
		});

		it('preserves local state when authentication cannot be validated', async () => {
			mockAuthService.validateSession.and.resolveTo('unknown');

			const result = await service.recover('online');

			expect(result).toBe('offline');
			expect(mockDatabaseService.clearSessionState).not.toHaveBeenCalled();
			expect(mockAuthService.expireLocalSession).not.toHaveBeenCalled();
		});

		it('clears all local layers when the database probe confirms session expiry', async () => {
			mockAuthService.validateSession.and.resolveTo('valid');
			mockDatabaseService.checkConnection.and.rejectWith(new SessionExpiredError());

			const result = await service.recover('online');

			expect(result).toBe('expired');
			expect(mockDatabaseService.clearSessionState).toHaveBeenCalledOnceWith();
			expect(mockAuthService.expireLocalSession).toHaveBeenCalledOnceWith();
		});

		it('treats an authentication probe timeout as offline without clearing session state', fakeAsync(() => {
			mockAuthService.validateSession.and.returnValue(new Promise(() => {}));
			let result: string | undefined;

			service.recover('online').then((recoveryStatus) => {
				result = recoveryStatus;
			});
			tick(RECOVERY_PROBE_TIMEOUT_MS);
			flushMicrotasks();

			expect(result).toBe('offline');
			expect(mockDatabaseService.clearSessionState).not.toHaveBeenCalled();
			expect(mockAuthService.expireLocalSession).not.toHaveBeenCalled();
		}));

		it('shares one in-flight recovery across simultaneous triggers', fakeAsync(() => {
			let resolveValidation!: (status: 'valid') => void;
			mockAuthService.validateSession.and.returnValue(
				new Promise<'valid'>((resolve) => {
					resolveValidation = resolve;
				})
			);

			const firstRecovery = service.recover('resume');
			const secondRecovery = service.recover('watch-error');

			expect(firstRecovery).toBe(secondRecovery);
			expect(mockAuthService.validateSession).toHaveBeenCalledTimes(1);

			resolveValidation('valid');
			flushMicrotasks();
			freshSnapshotSubject.next();
			flushMicrotasks();
		}));

	});
});
