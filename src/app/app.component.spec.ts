import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';

import { AppComponent } from './app.component';
import { AuthService } from './backend/authentication-service/auth.service';
import { CloudbaseService } from './backend/database-service/cloudbase/cloudbase.service';
import { DatabaseService } from './backend/database-service/database.service';
import { DialogService } from './backend/dialog-service/dialog.service';
import { NotificationService } from './backend/notification-service/notification.service';
import { SessionRecoveryService } from './backend/session-recovery/session-recovery.service';
import { RECOVERY_INACTIVITY_THRESHOLD_MS } from './common/constants';
import { UnexpectedError } from './common/error/unexpected.error';
import { Utilities } from './common/utilities/app.utilities';

describe('AppComponent', () => {
	let mockAuthService: jasmine.SpyObj<AuthService>;
	let mockDatabaseService: jasmine.SpyObj<DatabaseService>;
	let mockSessionRecoveryService: jasmine.SpyObj<SessionRecoveryService>;
	let sessionExpiredSubject: Subject<void>;
	let watchErrorsSubject: Subject<unknown>;
	let writeErrorsSubject: Subject<unknown>;
	let currentUserSubject: BehaviorSubject<unknown>;

	beforeEach(async () => {
		sessionExpiredSubject = new Subject<void>();
		watchErrorsSubject = new Subject<unknown>();
		writeErrorsSubject = new Subject<unknown>();
		currentUserSubject = new BehaviorSubject<unknown>(null);
		mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', [
			'getCurrentUser',
			'signOut',
			'confirmRemoteSignOut',
			'getSessionExpired$'
		]);
		mockAuthService.getCurrentUser.and.returnValue(currentUserSubject.asObservable());
		mockAuthService.getSessionExpired$.and.returnValue(sessionExpiredSubject.asObservable());
		mockAuthService.signOut.and.resolveTo();
		mockAuthService.confirmRemoteSignOut.and.resolveTo();
		mockDatabaseService = jasmine.createSpyObj<DatabaseService>('DatabaseService', [
			'getWatchErrors$',
			'getWriteErrors$',
			'clearSessionState'
		]);
		mockDatabaseService.getWatchErrors$.and.returnValue(watchErrorsSubject.asObservable());
		mockDatabaseService.getWriteErrors$.and.returnValue(writeErrorsSubject.asObservable());
		mockSessionRecoveryService = jasmine.createSpyObj<SessionRecoveryService>(
			'SessionRecoveryService',
			['recover', 'expireConfirmedSession']
		);
		mockSessionRecoveryService.recover.and.resolveTo('recovered');
		mockSessionRecoveryService.expireConfirmedSession.and.returnValue('expired');

		await TestBed.configureTestingModule({
			imports: [AppComponent],
			providers: [
				provideRouter([]),
				MessageService,
				{ provide: AuthService, useValue: mockAuthService },
				{ provide: DatabaseService, useValue: mockDatabaseService },
				{ provide: SessionRecoveryService, useValue: mockSessionRecoveryService }
			]
		}).compileComponents();
		spyOn(TestBed.inject(Utilities), 'getIsUserAlive').and.returnValue(true);
	});

	afterEach(() => {
		CloudbaseService['userId'] = '';
		CloudbaseService['userRole'] = [];
		CloudbaseService['userName'] = '';
		CloudbaseService['_authReady$'] = new ReplaySubject<boolean>(1);
		CloudbaseService['_loginState$'] = new BehaviorSubject<boolean>(false);
	});

	it('should create the app', () => {
		const fixture = TestBed.createComponent(AppComponent);
		const app = fixture.componentInstance;

		expect(app).toBeTruthy();
	});

	// ── Session recovery triggers ─────────────────────────────────────────────

	describe('session recovery triggers', () => {
		it('does not recover lifecycle events when no authenticated session is expected', () => {
			(TestBed.inject(Utilities).getIsUserAlive as jasmine.Spy).and.returnValue(false);
			const fixture = TestBed.createComponent(AppComponent);
			const app = fixture.componentInstance as any;
			fixture.detectChanges();

			app.recoverAfterConnectivityReturn();
			app.recordBrowserInactivity();
			app.inactivityStartedAt = Date.now() - RECOVERY_INACTIVITY_THRESHOLD_MS;
			app.recoverBrowserSessionAfterInactivity();

			expect(mockSessionRecoveryService.recover).not.toHaveBeenCalled();
		});

		it('starts central recovery during browser startup', () => {
			const fixture = TestBed.createComponent(AppComponent);

			fixture.detectChanges();

			expect(mockSessionRecoveryService.recover).toHaveBeenCalledWith('startup');
		});

		it('recovers on focus only after at least five minutes of inactivity', fakeAsync(() => {
			const fixture = TestBed.createComponent(AppComponent);
			const app = fixture.componentInstance as any;
			let currentTimestamp = 1_000;
			spyOn(Date, 'now').and.callFake(() => currentTimestamp);
			fixture.detectChanges();
			flushMicrotasks();
			mockSessionRecoveryService.recover.calls.reset();

			app.recordBrowserInactivity();
			currentTimestamp += RECOVERY_INACTIVITY_THRESHOLD_MS - 1;
			app.recoverBrowserSessionAfterInactivity();
			expect(mockSessionRecoveryService.recover).not.toHaveBeenCalled();

			currentTimestamp += 1;
			app.recoverBrowserSessionAfterInactivity();
			expect(mockSessionRecoveryService.recover).not.toHaveBeenCalled();

			app.recordBrowserInactivity();
			currentTimestamp += RECOVERY_INACTIVITY_THRESHOLD_MS;
			app.recoverBrowserSessionAfterInactivity();
			expect(mockSessionRecoveryService.recover).toHaveBeenCalledOnceWith('resume');
		}));

		it('measures repeated inactivity signals from the earliest event', fakeAsync(() => {
			const fixture = TestBed.createComponent(AppComponent);
			const app = fixture.componentInstance as any;
			let currentTimestamp = 1_000;
			spyOn(Date, 'now').and.callFake(() => currentTimestamp);
			fixture.detectChanges();
			flushMicrotasks();
			mockSessionRecoveryService.recover.calls.reset();

			app.recordBrowserInactivity();
			currentTimestamp += RECOVERY_INACTIVITY_THRESHOLD_MS - 1_000;
			app.recordBrowserInactivity();
			currentTimestamp += 1_000;
			app.recoverBrowserSessionAfterInactivity();

			expect(mockSessionRecoveryService.recover).toHaveBeenCalledOnceWith('resume');
		}));

		it('recovers when browser connectivity returns', fakeAsync(() => {
			const fixture = TestBed.createComponent(AppComponent);
			const app = fixture.componentInstance as any;
			fixture.detectChanges();
			flushMicrotasks();
			mockSessionRecoveryService.recover.calls.reset();

			app.recoverAfterConnectivityReturn();

			expect(mockSessionRecoveryService.recover).toHaveBeenCalledOnceWith('online');
		}));

		it('recovers after a central realtime watcher error', fakeAsync(() => {
			const fixture = TestBed.createComponent(AppComponent);
			fixture.detectChanges();
			flushMicrotasks();
			mockSessionRecoveryService.recover.calls.reset();

			watchErrorsSubject.next(new Error('watch failed'));

			expect(mockSessionRecoveryService.recover).toHaveBeenCalledOnceWith('watch-error');
		}));

		it('recovers silently after a database write error', fakeAsync(() => {
			const fixture = TestBed.createComponent(AppComponent);
			fixture.detectChanges();
			flushMicrotasks();
			mockSessionRecoveryService.recover.calls.reset();

			writeErrorsSubject.next(new Error('write failed'));

			expect(mockSessionRecoveryService.recover).toHaveBeenCalledOnceWith('write-error');
		}));

		it('does not stack a retry dialog over the write owner when write recovery remains offline', fakeAsync(() => {
			const fixture = TestBed.createComponent(AppComponent);
			const dialogService = TestBed.inject(DialogService);
			const showLoadingTimeoutSpy = spyOn(dialogService, 'showLoadingTimeout');
			fixture.detectChanges();
			flushMicrotasks();
			mockSessionRecoveryService.recover.calls.reset();
			mockSessionRecoveryService.recover.and.resolveTo('offline');

			writeErrorsSubject.next(new Error('write failed'));
			flushMicrotasks();

			expect(showLoadingTimeoutSpy).not.toHaveBeenCalled();
		}));

		it('stops watcher-error recovery after component destruction', fakeAsync(() => {
			const fixture = TestBed.createComponent(AppComponent);
			fixture.detectChanges();
			flushMicrotasks();
			mockSessionRecoveryService.recover.calls.reset();

			fixture.destroy();
			watchErrorsSubject.next(new Error('watch failed'));

			expect(mockSessionRecoveryService.recover).not.toHaveBeenCalled();
		}));

		it('releases user and document listeners after component destruction', fakeAsync(() => {
			const removeEventListenerSpy = spyOn(document, 'removeEventListener').and.callThrough();
			const fixture = TestBed.createComponent(AppComponent);
			fixture.detectChanges();
			flushMicrotasks();
			mockSessionRecoveryService.recover.calls.reset();

			fixture.destroy();
			currentUserSubject.next({ id: 'user-123' });

			expect(mockSessionRecoveryService.recover).not.toHaveBeenCalled();
			expect(removeEventListenerSpy).toHaveBeenCalledWith(
				'scroll',
				jasmine.any(Function),
				true
			);
		}));

		it('navigates to login after confirmed expiry while preserving the current return URL', fakeAsync(() => {
			mockSessionRecoveryService.recover.and.resolveTo('expired');
			const fixture = TestBed.createComponent(AppComponent);
			const router = TestBed.inject(Router);
			const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

			fixture.detectChanges();
			flushMicrotasks();

			expect(navigateSpy).toHaveBeenCalledWith(
				['/login'],
				jasmine.objectContaining({
					queryParams: jasmine.objectContaining({ returnUrl: jasmine.any(String) })
				})
			);
		}));

		it('shows one retry dialog when simultaneous runtime recovery triggers remain offline', fakeAsync(() => {
			const fixture = TestBed.createComponent(AppComponent);
			const dialogService = TestBed.inject(DialogService);
			const showLoadingTimeoutSpy = spyOn(dialogService, 'showLoadingTimeout');
			fixture.detectChanges();
			flushMicrotasks();
			mockSessionRecoveryService.recover.calls.reset();

			let resolveRecovery!: (status: 'offline') => void;
			mockSessionRecoveryService.recover.and.returnValue(
				new Promise<'offline'>((resolve) => {
					resolveRecovery = resolve;
				})
			);
			(fixture.componentInstance as any).recoverAfterConnectivityReturn();
			watchErrorsSubject.next(new Error('watch failed'));

			expect(mockSessionRecoveryService.recover).toHaveBeenCalledTimes(1);
			resolveRecovery('offline');
			flushMicrotasks();

			expect(showLoadingTimeoutSpy).toHaveBeenCalledTimes(1);
		}));

		it('routes spontaneous authentication expiry through central recovery', fakeAsync(() => {
			const fixture = TestBed.createComponent(AppComponent);
			fixture.detectChanges();
			flushMicrotasks();
			mockSessionRecoveryService.recover.calls.reset();

			sessionExpiredSubject.next();
			flushMicrotasks();

			expect(mockSessionRecoveryService.expireConfirmedSession).toHaveBeenCalledOnceWith();
		}));

		it('queues provider expiry that arrives during startup recovery and navigates once', fakeAsync(() => {
			let resolveStartupRecovery!: (status: 'recovered') => void;
			mockSessionRecoveryService.recover.and.returnValue(
				new Promise<'recovered'>((resolve) => {
					resolveStartupRecovery = resolve;
				})
			);
			const fixture = TestBed.createComponent(AppComponent);
			const router = TestBed.inject(Router);
			const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);
			fixture.detectChanges();

			sessionExpiredSubject.next();
			resolveStartupRecovery('recovered');
			flushMicrotasks();

			expect(mockSessionRecoveryService.recover).toHaveBeenCalledTimes(1);
			expect(mockSessionRecoveryService.expireConfirmedSession).toHaveBeenCalledOnceWith();
			expect(navigateSpy).toHaveBeenCalledTimes(1);
		}));
	});

	// ── Login navigation ─────────────────────────────────────────────────────────

	describe('navigateToLogin', () => {
		it('navigates to /login with the current URL as returnUrl', () => {
			const fixture = TestBed.createComponent(AppComponent);
			const router = TestBed.inject(Router);
			const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

			(fixture.componentInstance as any).navigateToLogin();

			expect(navigateSpy).toHaveBeenCalledWith(
				['/login'],
				jasmine.objectContaining({
					queryParams: jasmine.objectContaining({ returnUrl: jasmine.any(String) })
				})
			);
		});

		it('does not replace an existing login return URL with the login route itself', () => {
			const fixture = TestBed.createComponent(AppComponent);
			const router = TestBed.inject(Router);
			spyOnProperty(router, 'url', 'get').and.returnValue('/login?returnUrl=%2Freminder');
			const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

			(fixture.componentInstance as any).navigateToLogin();

			expect(navigateSpy).not.toHaveBeenCalled();
		});
	});

	// ── Sign out ──────────────────────────────────────────────────────────────

	describe('logout', () => {
		it('clears database session state only after remote sign-out succeeds', async () => {
			const fixture = TestBed.createComponent(AppComponent);
			const transitionOrder: string[] = [];
			mockAuthService.confirmRemoteSignOut.and.callFake(async () => {
				transitionOrder.push('remote');
			});
			mockSessionRecoveryService.expireConfirmedSession.and.callFake(() => {
				transitionOrder.push('local');
				return 'expired';
			});

			await (fixture.componentInstance as any).logout();

			expect(mockAuthService.confirmRemoteSignOut).toHaveBeenCalled();
			expect(mockSessionRecoveryService.expireConfirmedSession).toHaveBeenCalledOnceWith();
			expect(transitionOrder).toEqual(['remote', 'local']);
		});

		it('shares one logout operation across rapid repeated requests', async () => {
			const fixture = TestBed.createComponent(AppComponent);
			let resolveSignOut!: () => void;
			mockAuthService.confirmRemoteSignOut.and.returnValue(
				new Promise<void>((resolve) => (resolveSignOut = resolve))
			);

			const firstLogout = (fixture.componentInstance as any).logout();
			const secondLogout = (fixture.componentInstance as any).logout();

			expect(secondLogout).toBe(firstLogout);
			expect(mockAuthService.confirmRemoteSignOut).toHaveBeenCalledTimes(1);
			resolveSignOut();
			await firstLogout;
		});

		it('leaves the protected account route after CloudBase sign-out succeeds', async () => {
			spyOn(Utilities, 'isFirebaseBackend').and.returnValue(false);
			const fixture = TestBed.createComponent(AppComponent);
			const router = TestBed.inject(Router);
			spyOnProperty(router, 'url', 'get').and.returnValue('/account');
			const navigateByUrlSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);

			await (fixture.componentInstance as any).logout();

			expect(navigateByUrlSpy).toHaveBeenCalledOnceWith('/');
		});

		it('restores notifications and preserves database state when remote sign-out fails', async () => {
			const fixture = TestBed.createComponent(AppComponent);
			const dialogService = TestBed.inject(DialogService);
			const notificationService = TestBed.inject(NotificationService);
			(notificationService as any)._isSubscribed.set(true);
			spyOn(notificationService, 'unsubscribe').and.callFake(async () => {
				(notificationService as any)._isSubscribed.set(false);
			});
			const restoreSubscriptionSpy = spyOn(notificationService, 'restoreSubscription').and.callFake(
				async () => {
					(notificationService as any)._isSubscribed.set(true);
				}
			);
			spyOn(dialogService, 'handleError');
			mockAuthService.confirmRemoteSignOut.and.rejectWith(new UnexpectedError());

			await expectAsync((fixture.componentInstance as any).logout()).toBeRejectedWithError(
				UnexpectedError
			);

			expect(restoreSubscriptionSpy).toHaveBeenCalledOnceWith();
			expect(notificationService.isSubscribed()).toBeTrue();
			expect(mockDatabaseService.clearSessionState).not.toHaveBeenCalled();
			expect(mockSessionRecoveryService.expireConfirmedSession).not.toHaveBeenCalled();
			expect(dialogService.handleError).toHaveBeenCalled();
		});

		it('releases the logout guard when notification unsubscribe fails', async () => {
			const fixture = TestBed.createComponent(AppComponent);
			const dialogService = TestBed.inject(DialogService);
			const notificationService = TestBed.inject(NotificationService);
			(notificationService as any)._isSubscribed.set(true);
			const unsubscribeSpy = spyOn(notificationService, 'unsubscribe').and.rejectWith(
				new UnexpectedError()
			);
			spyOn(notificationService, 'restoreSubscription').and.resolveTo();
			spyOn(dialogService, 'handleError');

			await expectAsync((fixture.componentInstance as any).logout()).toBeRejectedWithError(
				UnexpectedError
			);
			unsubscribeSpy.and.resolveTo();
			await (fixture.componentInstance as any).logout();

			expect(unsubscribeSpy).toHaveBeenCalledTimes(2);
			expect(mockAuthService.confirmRemoteSignOut).toHaveBeenCalledTimes(1);
			expect(dialogService.handleError).toHaveBeenCalledTimes(1);
		});

		it('preserves the original sign-out failure when notification restoration rejects', async () => {
			const fixture = TestBed.createComponent(AppComponent);
			const dialogService = TestBed.inject(DialogService);
			const notificationService = TestBed.inject(NotificationService);
			const signOutError = new UnexpectedError();
			(notificationService as any)._isSubscribed.set(true);
			spyOn(notificationService, 'unsubscribe').and.callFake(async () => {
				(notificationService as any)._isSubscribed.set(false);
			});
			spyOn(notificationService, 'restoreSubscription').and.rejectWith(
				new Error('restore failed')
			);
			spyOn(dialogService, 'handleError');
			mockAuthService.confirmRemoteSignOut.and.rejectWith(signOutError);

			await expectAsync((fixture.componentInstance as any).logout()).toBeRejectedWith(signOutError);

			expect(dialogService.handleError).toHaveBeenCalledWith(
				(fixture.componentInstance as any).dialogComponentContainer,
				signOutError
			);
		});
	});
});
