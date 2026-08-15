import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { EnvironmentInjector } from '@angular/core';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, ReplaySubject } from 'rxjs';

import { AuthService } from './auth.service';
import { CLOUDBASE, FIREBASE_AUTH } from '../database-service/database.service';
import { CloudbaseService } from '../database-service/cloudbase/cloudbase.service';
import { Utilities } from '../../common/utilities/app.utilities';
import {
	AUTH_BACKEND_CLOUDBASE,
	CLOUDBASE_ERR_PERMISSION_DENIED,
	CLOUDBASE_ERROR_INVALID_CREDENTIALS,
	FIREBASE_ERROR_NETWORK_REQUEST_FAILED,
	FIREBASE_ERROR_USER_DISABLED,
	FIREBASE_ERROR_USER_TOKEN_EXPIRED,
    LS_AUTH_BACKEND,
    LS_AUTH_HINT_KEY,
    RECOVERY_AUTH_EXPIRED,
    RECOVERY_AUTH_UNKNOWN,
    RECOVERY_AUTH_VALID,
    RECOVERY_PROBE_TIMEOUT_MS
} from '../../common/constants';
import { WrongCredentialsError } from '../../common/error/wrong-credentials.error';
import { UnexpectedError } from '../../common/error/unexpected.error';
import { AuthValidationStatus } from '../session-recovery/session-recovery.model';

describe('AuthService', () => {
    let service: AuthService;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockUtilities: jasmine.SpyObj<Utilities>;
    let mockCloudbaseAuth: any;
    let mockFirebaseAuth: any;
    let firebaseAuthStateCallback: ((user: any) => void) | undefined;

    beforeEach(() => {
        mockCloudbaseAuth = {
            signInAnonymously: jasmine.createSpy('signInAnonymously').and.returnValue(Promise.resolve()),
            getVerification: jasmine.createSpy('getVerification').and.returnValue(Promise.resolve({ verification_id: 'vid' })),
            verify: jasmine.createSpy('verify').and.returnValue(Promise.resolve({ verification_token: 'tok' })),
            signUp: jasmine.createSpy('signUp').and.returnValue(Promise.resolve()),
            signInWithPassword: jasmine.createSpy('signInWithPassword').and.returnValue(Promise.resolve({ error: null })),
            getSession: jasmine.createSpy('getSession').and.returnValue(Promise.resolve({ data: null, error: null })),
			getUser: jasmine.createSpy('getUser').and.returnValue(Promise.resolve({ data: { user: null } })),
			deleteUser: jasmine.createSpy('deleteUser').and.resolveTo({ error: null }),
			signOut: jasmine.createSpy('signOut').and.returnValue(Promise.resolve()),
            onLoginStateExpired: jasmine.createSpy('onLoginStateExpired')
        };

        /* AuthService resolves both auth SDKs from the environment injector in its constructor,
           so the tokens themselves are stubbed rather than any database service. */
        mockFirebaseAuth = {
            currentUser: null,
            authStateReady: jasmine.createSpy('authStateReady').and.returnValue(Promise.resolve()),
            onAuthStateChanged: jasmine.createSpy('onAuthStateChanged').and.callFake((callback: (user: any) => void) => {
                firebaseAuthStateCallback = callback;
                return () => {};
            }),
            signOut: jasmine.createSpy('signOut').and.returnValue(Promise.resolve())
        };

        mockRouter = jasmine.createSpyObj<Router>('Router', ['navigate']);
        mockRouter.navigate.and.returnValue(Promise.resolve(true));

		mockUtilities = jasmine.createSpyObj<Utilities>('Utilities', [
			'setIsUserAlive',
			'getIsUserAlive',
			'checkIfHoverCapable'
		]);
		mockUtilities.getIsUserAlive.and.returnValue(false);
        mockUtilities.setIsUserAlive.and.callFake((isUserAlive: boolean) => {
            if (!isUserAlive) localStorage.removeItem(LS_AUTH_HINT_KEY);
        });

        // Default to the CloudBase backend so cloudbaseGetCurrentUser is the active path
        spyOn(Utilities, 'isFirebaseBackend').and.returnValue(false);

        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                AuthService,
                { provide: Router, useValue: mockRouter },
                { provide: Utilities, useValue: mockUtilities },
                { provide: CLOUDBASE, useValue: { auth: () => mockCloudbaseAuth } },
                { provide: FIREBASE_AUTH, useValue: mockFirebaseAuth }
            ]
        });

        service = TestBed.inject(AuthService);
        // Inject cloudbaseAuth manually since DI cannot reach the private field
        (service as any).cloudbaseAuth = mockCloudbaseAuth;
    });

    afterEach(() => {
        CloudbaseService['userId'] = '';
        CloudbaseService['userRole'] = [];
        CloudbaseService['userName'] = '';
        CloudbaseService['_authReady$'] = new ReplaySubject<boolean>(1);
        CloudbaseService['_loginState$'] = new BehaviorSubject<boolean>(false);
        localStorage.removeItem(LS_AUTH_BACKEND);
        localStorage.removeItem(LS_AUTH_HINT_KEY);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // ── signInAnonymously ────────────────────────────────────────────────────

    describe('signInAnonymously', () => {
        it('calls cloudbaseAuth.signInAnonymously', async () => {
            await service.signInAnonymously();
            expect(mockCloudbaseAuth.signInAnonymously).toHaveBeenCalled();
        });
    });

    // ── getVerificationCodeEmail ─────────────────────────────────────────────

    describe('getVerificationCodeEmail', () => {
        it('calls cloudbaseAuth.getVerification with the provided email', async () => {
            await service.getVerificationCodeEmail('user@test.com');
            expect(mockCloudbaseAuth.getVerification).toHaveBeenCalledWith({ email: 'user@test.com' });
        });
    });

    // ── signUp ───────────────────────────────────────────────────────────────

    describe('signUp', () => {
        it('calls verify and signUp on the cloudbaseAuth', async () => {
            (service as any).verification = { verification_id: 'vid' };
            await service.signUp('test@test.com', 'pass', 'username', 123456);
            expect(mockCloudbaseAuth.verify).toHaveBeenCalledWith(
                jasmine.objectContaining({ verification_id: 'vid', verification_code: 123456 })
            );
            expect(mockCloudbaseAuth.signUp).toHaveBeenCalled();
        });

        it('throws wrongVerificationCodeError when the error code matches CLOUDBASE_ERROR_INVALID_ARGUMENT', async () => {
            const error = { code: 'INVALID_ARGUMENT' };
            mockCloudbaseAuth.verify.and.returnValue(Promise.reject(error));
            (service as any).verification = { verification_id: 'vid' };

            // Dynamically import to access the constant
            const { CLOUDBASE_ERROR_INVALID_ARGUMENT } = await import('../../common/constants');
            const cloudbaseError = { code: CLOUDBASE_ERROR_INVALID_ARGUMENT };
            mockCloudbaseAuth.verify.and.returnValue(Promise.reject(cloudbaseError));

            await expectAsync(service.signUp('t@t.com', 'p', 'u', 0)).toBeRejected();
        });
    });

    // ── signIn ───────────────────────────────────────────────────────────────

    describe('signIn', () => {
        it('calls cloudbaseAuth.signInWithPassword with username and password', async () => {
            await service.signIn('user', 'pass');
            expect(mockCloudbaseAuth.signInWithPassword).toHaveBeenCalledWith({
                username: 'user',
                password: 'pass'
            });
        });

        it('navigates to the return URL after successful sign-in', async () => {
            await service.signIn('user', 'pass', '/home');
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
        });

        it('throws WrongCredentialsError when the error category matches CLOUDBASE_ERROR_INVALID_CREDENTIALS', async () => {
            mockCloudbaseAuth.signInWithPassword.and.returnValue(
                Promise.resolve({ error: { category: CLOUDBASE_ERROR_INVALID_CREDENTIALS } })
            );
            await expectAsync(service.signIn('user', 'wrong')).toBeRejectedWithError(WrongCredentialsError as unknown as string);
        });

        it('throws a generic Error when a non-credential error is returned', async () => {
            mockCloudbaseAuth.signInWithPassword.and.returnValue(
                Promise.resolve({ error: { category: 'OTHER_ERROR' } })
            );
            await expectAsync(service.signIn('user', 'pass')).toBeRejected();
        });
    });

    // ── getCurrentUser (CN context — delegates to CloudBase) ─────────────────

	describe('getCurrentUser', () => {
		it('returns an observable', () => {
            const result = service.getCurrentUser();
            expect(result).toBeDefined();
			expect(typeof result.subscribe).toBe('function');
		});

		it('shares one Firebase auth-state listener across multiple current-user subscribers', () => {
			(Utilities.isFirebaseBackend as jasmine.Spy).and.returnValue(true);

			service.getCurrentUser().subscribe();
			service.getCurrentUser().subscribe();

			expect(mockFirebaseAuth.onAuthStateChanged).toHaveBeenCalledTimes(1);
		});

		it('emits null only after the user lookup resolves without username metadata', async () => {
			let resolveUser!: (response: unknown) => void;
			mockCloudbaseAuth.getUser.and.returnValue(
				new Promise((resolve) => {
					resolveUser = resolve;
				})
			);
			const emittedUsers: unknown[] = [];

			service.getCurrentUser().subscribe((user) => emittedUsers.push(user));

			expect(emittedUsers).toEqual([]);
			resolveUser({ data: { user: { id: 'uid', user_metadata: {} } } });
			await Promise.resolve();

			expect(emittedUsers).toEqual([null]);
		});

		it('settles an initially signed-out CloudBase session without reporting expiry', async () => {
			let didExpire = false;
			service.getSessionExpired$().subscribe(() => (didExpire = true));
			mockCloudbaseAuth.getUser.and.resolveTo({ data: { user: null } });

			service.getCurrentUser().subscribe();
			await Promise.resolve();

			expect(didExpire).toBeFalse();
			expect(mockUtilities.setIsUserAlive).toHaveBeenCalledWith(false);
		});

        it('emits the user when username is present in metadata', async () => {
            const mockUser = {
                id: 'uid123',
                user_metadata: { username: 'testuser', name: 'admin' }
            };
            mockCloudbaseAuth.getUser.and.returnValue(
                Promise.resolve({ data: { user: mockUser } })
            );
            const result = service.getCurrentUser();
            let emitted: unknown;
            result.subscribe((v) => (emitted = v));
            await Promise.resolve();
            expect(emitted).toBe(mockUser);
        });

		it('preserves local state when the CloudBase user lookup fails transiently', async () => {
            mockCloudbaseAuth.getUser.and.returnValue(Promise.reject(new Error('offline')));
            CloudbaseService.setUseId('user-id');
            CloudbaseService.setLoginState(true);
            mockUtilities.setIsUserAlive.calls.reset();

            service.getCurrentUser().subscribe();
            await Promise.resolve();

            expect(mockUtilities.setIsUserAlive).not.toHaveBeenCalled();
            expect(CloudbaseService.getUserId()).toBe('user-id');
			expect(CloudbaseService['_loginState$'].getValue()).toBeTrue();
		});

		it('publishes the CloudBase user when recovery succeeds after a transient startup lookup', async () => {
			const recoveredUser = {
				id: 'user-id',
				user_metadata: { username: 'user' }
			};
			const emittedUsers: unknown[] = [];
			mockCloudbaseAuth.getUser.and.rejectWith(new Error('offline'));

			service.getCurrentUser().subscribe((user) => emittedUsers.push(user));
			await Promise.resolve();
			expect(emittedUsers).toEqual([]);

			mockCloudbaseAuth.getSession.and.resolveTo({ data: { session: {} }, error: null });
			mockCloudbaseAuth.getUser.and.resolveTo({ data: { user: recoveredUser }, error: null });
			await service.validateSession();

			expect(emittedUsers).toEqual([recoveredUser]);
		});

        it('emits central expiry without partially clearing state for explicit CloudBase auth failure', async () => {
            let didExpire = false;
            service.getSessionExpired$().subscribe(() => (didExpire = true));
            mockCloudbaseAuth.getUser.and.returnValue(
                Promise.reject({ category: CLOUDBASE_ERROR_INVALID_CREDENTIALS })
            );
            CloudbaseService.setUseId('user-id');
            CloudbaseService.setLoginState(true);
            mockUtilities.setIsUserAlive.calls.reset();

            service.getCurrentUser().subscribe();
            await Promise.resolve();
			await Promise.resolve();

            expect(didExpire).toBeTrue();
            expect(mockUtilities.setIsUserAlive).not.toHaveBeenCalled();
            expect(CloudbaseService.getUserId()).toBe('user-id');
            expect(CloudbaseService['_loginState$'].getValue()).toBeTrue();
        });
    });

    // ── Session validation ──────────────────────────────────────────────────

    describe('validateSession', () => {
        it('classifies a confirmed CloudBase account session as valid', async () => {
            const expectedStatus: AuthValidationStatus = RECOVERY_AUTH_VALID;
            mockCloudbaseAuth.getSession.and.returnValue(
                Promise.resolve({ data: { session: {} }, error: null })
            );
            mockCloudbaseAuth.getUser.and.returnValue(
                Promise.resolve({ data: { user: { user_metadata: { username: 'user' } } }, error: null })
            );

            const status = await service.validateSession();

            expect(status).toBe(expectedStatus);
        });

        it('classifies an explicitly missing CloudBase session as expired', async () => {
            const expectedStatus: AuthValidationStatus = RECOVERY_AUTH_EXPIRED;
            mockCloudbaseAuth.getSession.and.returnValue(Promise.resolve({ data: null, error: null }));

            const status = await service.validateSession();

            expect(status).toBe(expectedStatus);
            expect(mockCloudbaseAuth.getUser).not.toHaveBeenCalled();
        });

        it('classifies a transient CloudBase failure as unknown', async () => {
            const expectedStatus: AuthValidationStatus = RECOVERY_AUTH_UNKNOWN;
            mockCloudbaseAuth.getSession.and.returnValue(Promise.reject(new Error('offline')));

            const status = await service.validateSession();

            expect(status).toBe(expectedStatus);
        });

		it('classifies an explicit CloudBase credentials error as expired', async () => {
            const expectedStatus: AuthValidationStatus = RECOVERY_AUTH_EXPIRED;
            mockCloudbaseAuth.getSession.and.returnValue(
                Promise.resolve({ data: null, error: { category: CLOUDBASE_ERROR_INVALID_CREDENTIALS } })
            );

            const status = await service.validateSession();

            expect(status).toBe(expectedStatus);
        });

        it('force-refreshes the Firebase token before classifying the session as valid', async () => {
            const expectedStatus: AuthValidationStatus = RECOVERY_AUTH_VALID;
            const getIdToken = jasmine.createSpy('getIdToken').and.returnValue(Promise.resolve('token'));
            (Utilities.isFirebaseBackend as jasmine.Spy).and.returnValue(true);
            mockFirebaseAuth.currentUser = { getIdToken };

            const status = await service.validateSession();

            expect(status).toBe(expectedStatus);
            expect(mockFirebaseAuth.authStateReady).toHaveBeenCalled();
            expect(getIdToken).toHaveBeenCalledWith(true);
        });

        it('classifies an explicitly missing Firebase user as expired', async () => {
            const expectedStatus: AuthValidationStatus = RECOVERY_AUTH_EXPIRED;
            (Utilities.isFirebaseBackend as jasmine.Spy).and.returnValue(true);
            mockFirebaseAuth.currentUser = null;

            const status = await service.validateSession();

            expect(status).toBe(expectedStatus);
            expect(mockFirebaseAuth.authStateReady).toHaveBeenCalled();
        });

        it('classifies a Firebase network failure as unknown', async () => {
            const expectedStatus: AuthValidationStatus = RECOVERY_AUTH_UNKNOWN;
            const getIdToken = jasmine.createSpy('getIdToken').and.returnValue(
                Promise.reject({ code: FIREBASE_ERROR_NETWORK_REQUEST_FAILED })
            );
            (Utilities.isFirebaseBackend as jasmine.Spy).and.returnValue(true);
            mockFirebaseAuth.currentUser = { getIdToken };

            const status = await service.validateSession();

            expect(status).toBe(expectedStatus);
        });

		it('classifies an explicitly expired Firebase token as expired', async () => {
            const expectedStatus: AuthValidationStatus = RECOVERY_AUTH_EXPIRED;
            const getIdToken = jasmine.createSpy('getIdToken').and.returnValue(
                Promise.reject({ code: FIREBASE_ERROR_USER_TOKEN_EXPIRED })
            );
            (Utilities.isFirebaseBackend as jasmine.Spy).and.returnValue(true);
            mockFirebaseAuth.currentUser = { getIdToken };

            const status = await service.validateSession();

			expect(status).toBe(expectedStatus);
		});

		it('keeps a generic CloudBase permission denial retryable', async () => {
			mockCloudbaseAuth.getSession.and.resolveTo({
				data: null,
				error: { code: CLOUDBASE_ERR_PERMISSION_DENIED }
			});

			const status = await service.validateSession();

			expect(status).toBe(RECOVERY_AUTH_UNKNOWN);
		});

		it('classifies a disabled Firebase account as expired', async () => {
			const getIdToken = jasmine.createSpy('getIdToken').and.rejectWith({
				code: FIREBASE_ERROR_USER_DISABLED
			});
			(Utilities.isFirebaseBackend as jasmine.Spy).and.returnValue(true);
			mockFirebaseAuth.currentUser = { getIdToken };

			const status = await service.validateSession();

			expect(status).toBe(RECOVERY_AUTH_EXPIRED);
		});
    });

	// ── Session expiry ──────────────────────────────────────────────────────

	describe('session expiry', () => {
		it('suppresses provider expiry between account deletion and coordinated local cleanup', async () => {
			let expiryCount = 0;
			service.getSessionExpired$().subscribe(() => expiryCount++);
			CloudbaseService.setUseId('user-id');
			const expiryCallback = mockCloudbaseAuth.onLoginStateExpired.calls.mostRecent().args[0];

			await service.deleteUser('password');
			expiryCallback();

			expect(expiryCount).toBe(0);
			service.expireLocalSession();
			expiryCallback();
			expect(expiryCount).toBe(0);
		});

		it('emits an expiry signal without partially clearing local authentication state', () => {
			let didExpire = false;
			service.getSessionExpired$().subscribe(() => (didExpire = true));
			localStorage.setItem(LS_AUTH_BACKEND, AUTH_BACKEND_CLOUDBASE);
			CloudbaseService.setUseId('user-id');
			mockUtilities.setIsUserAlive.calls.reset();

            const expiryCallback = mockCloudbaseAuth.onLoginStateExpired.calls.mostRecent().args[0];
            expiryCallback();

            expect(didExpire).toBeTrue();
            expect(localStorage.getItem(LS_AUTH_BACKEND)).toBe(AUTH_BACKEND_CLOUDBASE);
            expect(mockUtilities.setIsUserAlive).not.toHaveBeenCalled();
        });

		it('deduplicates provider expiry callbacks until a valid session resets the guard', async () => {
			let expiryCount = 0;
			service.getSessionExpired$().subscribe(() => expiryCount++);
			CloudbaseService.setUseId('user-id');
			const expiryCallback = mockCloudbaseAuth.onLoginStateExpired.calls.mostRecent().args[0];

			expiryCallback();
			expiryCallback();
			expect(expiryCount).toBe(1);

			mockCloudbaseAuth.getUser.and.resolveTo({
				data: { user: { id: 'user-id', user_metadata: { username: 'user' } } }
			});
			service.getCurrentUser().subscribe();
			await Promise.resolve();
			expiryCallback();

			expect(expiryCount).toBe(2);
		});

        it('clears every locally owned authentication value atomically after confirmed expiry', () => {
            localStorage.setItem(LS_AUTH_BACKEND, AUTH_BACKEND_CLOUDBASE);
            localStorage.setItem(LS_AUTH_HINT_KEY, '1');
            CloudbaseService.setUseId('user-id');
            CloudbaseService.setUserRole(['administrator']);
            CloudbaseService.setUserName('user');
            CloudbaseService.setLoginState(true);
            (service as any).cloudbaseUserSubject.next({ id: 'user-id' });
            (service as any).firebaseUserSubject.next({ uid: 'user-id' });

            service.expireLocalSession();

            expect(localStorage.getItem(LS_AUTH_BACKEND)).toBeNull();
            expect(localStorage.getItem(LS_AUTH_HINT_KEY)).toBeNull();
            expect(mockUtilities.setIsUserAlive).toHaveBeenCalledWith(false);
            expect(CloudbaseService.getUserId()).toBe('');
            expect(CloudbaseService.getUserName()).toBe('');
            expect(CloudbaseService['userRole']).toEqual([]);
            expect(CloudbaseService['_loginState$'].getValue()).toBeFalse();
            expect((service as any).cloudbaseUserSubject.getValue()).toBeNull();
            expect((service as any).firebaseUserSubject.getValue()).toBeNull();
        });

		it('emits central expiry without partial cleanup when Firebase signs out spontaneously', () => {
            let didExpire = false;
            (Utilities.isFirebaseBackend as jasmine.Spy).and.returnValue(true);
			service.getSessionExpired$().subscribe(() => (didExpire = true));
			service.getCurrentUser().subscribe();
			firebaseAuthStateCallback?.({ uid: 'user-id', displayName: 'User' });
			mockUtilities.setIsUserAlive.calls.reset();

            firebaseAuthStateCallback?.(null);

            expect(didExpire).toBeTrue();
			expect(mockUtilities.setIsUserAlive).not.toHaveBeenCalled();
		});

		it('settles an initially signed-out Firebase session without reporting expiry', () => {
			let didExpire = false;
			(Utilities.isFirebaseBackend as jasmine.Spy).and.returnValue(true);
			service.getSessionExpired$().subscribe(() => (didExpire = true));
			service.getCurrentUser().subscribe();

			firebaseAuthStateCallback?.(null);

			expect(didExpire).toBeFalse();
			expect(mockUtilities.setIsUserAlive).toHaveBeenCalledWith(false);
		});
    });

    // ── signOut ──────────────────────────────────────────────────────────────

    describe('signOut', () => {
        it('calls cloudbaseAuth.signOut', async () => {
            await service.signOut();
            expect(mockCloudbaseAuth.signOut).toHaveBeenCalled();
        });

        /* fakeAsync so the RECOVERY_PROBE_TIMEOUT_MS guard inside waitWithinTimeout becomes a virtual
           timer. On a real clock a loaded runner can stall past those five seconds, letting the guard
           win the race against an already-resolved mock: sign-out then rejects before it ever clears
           local state, and this assertion fails for reasons unrelated to the behaviour under test. */
        it('sets isUserAlive to false after sign-out', fakeAsync(() => {
            service.signOut();
            flushMicrotasks();

            expect(mockUtilities.setIsUserAlive).toHaveBeenCalledWith(false);
        }));

        it('preserves local authentication state and rejects when remote sign-out is unresolved', async () => {
            localStorage.setItem(LS_AUTH_BACKEND, AUTH_BACKEND_CLOUDBASE);
            CloudbaseService.setUseId('user-id');
            CloudbaseService.setUserName('user');
            CloudbaseService.setLoginState(true);
            mockUtilities.setIsUserAlive.calls.reset();
            mockCloudbaseAuth.signOut.and.returnValue(Promise.reject(new Error('offline')));
            mockCloudbaseAuth.getSession.and.returnValue(
                Promise.resolve({ data: { session: {} }, error: null })
            );
            mockCloudbaseAuth.getUser.and.returnValue(
                Promise.resolve({ data: { user: { user_metadata: { username: 'user' } } }, error: null })
            );

            await expectAsync(service.signOut()).toBeRejectedWithError(UnexpectedError);

            expect(localStorage.getItem(LS_AUTH_BACKEND)).toBe(AUTH_BACKEND_CLOUDBASE);
            expect(CloudbaseService.getUserId()).toBe('user-id');
            expect(CloudbaseService.getUserName()).toBe('user');
            expect(CloudbaseService['_loginState$'].getValue()).toBeTrue();
            expect(mockUtilities.setIsUserAlive).not.toHaveBeenCalled();
            expect(mockCloudbaseAuth.getSession).toHaveBeenCalled();
        });

        it('preserves local authentication state when sign-out revalidation remains unknown', async () => {
            localStorage.setItem(LS_AUTH_BACKEND, AUTH_BACKEND_CLOUDBASE);
            CloudbaseService.setUseId('user-id');
            CloudbaseService.setLoginState(true);
            mockUtilities.setIsUserAlive.calls.reset();
            mockCloudbaseAuth.signOut.and.returnValue(Promise.reject(new Error('timeout')));
            mockCloudbaseAuth.getSession.and.returnValue(Promise.reject(new Error('offline')));

            await expectAsync(service.signOut()).toBeRejectedWithError(UnexpectedError);

            expect(localStorage.getItem(LS_AUTH_BACKEND)).toBe(AUTH_BACKEND_CLOUDBASE);
            expect(CloudbaseService.getUserId()).toBe('user-id');
            expect(CloudbaseService['_loginState$'].getValue()).toBeTrue();
            expect(mockUtilities.setIsUserAlive).not.toHaveBeenCalled();
        });

		it('stops waiting when remote sign-out and revalidation both remain unresolved', fakeAsync(() => {
			let signOutError: unknown;
			mockCloudbaseAuth.signOut.and.returnValue(new Promise(() => {}));
			mockCloudbaseAuth.getSession.and.returnValue(new Promise(() => {}));

			service.signOut().catch((error: unknown) => {
				signOutError = error;
			});
			tick(RECOVERY_PROBE_TIMEOUT_MS * 2);
			flushMicrotasks();

			expect(signOutError).toBeInstanceOf(UnexpectedError);
			expect(mockUtilities.setIsUserAlive).not.toHaveBeenCalled();
		}));

        it('clears local state when revalidation confirms a timed-out sign-out reached the server', async () => {
            localStorage.setItem(LS_AUTH_BACKEND, AUTH_BACKEND_CLOUDBASE);
            CloudbaseService.setUseId('user-id');
            CloudbaseService.setLoginState(true);
            mockCloudbaseAuth.signOut.and.returnValue(Promise.reject(new Error('timeout')));
            mockCloudbaseAuth.getSession.and.returnValue(Promise.resolve({ data: null, error: null }));

            await service.signOut();

            expect(mockCloudbaseAuth.getSession).toHaveBeenCalled();
            expect(localStorage.getItem(LS_AUTH_BACKEND)).toBeNull();
            expect(CloudbaseService.getUserId()).toBe('');
            expect(CloudbaseService['_loginState$'].getValue()).toBeFalse();
            expect(mockUtilities.setIsUserAlive).toHaveBeenCalledWith(false);
        });

        it('suppresses partial Firebase cleanup while remote sign-out remains unresolved', async () => {
            let didExpire = false;
            const getIdToken = jasmine.createSpy('getIdToken').and.returnValue(Promise.resolve('token'));
            (Utilities.isFirebaseBackend as jasmine.Spy).and.returnValue(true);
            mockFirebaseAuth.currentUser = { getIdToken };
            service.getSessionExpired$().subscribe(() => (didExpire = true));
            service.getCurrentUser().subscribe();
            mockFirebaseAuth.signOut.and.callFake(() => {
                firebaseAuthStateCallback?.(null);
                return Promise.reject(new Error('offline'));
            });
            mockUtilities.setIsUserAlive.calls.reset();

            await expectAsync(service.signOut()).toBeRejectedWithError(UnexpectedError);

            expect(didExpire).toBeFalse();
            expect(mockUtilities.setIsUserAlive).not.toHaveBeenCalled();
        });

		it('clears local authentication state when remote sign-out confirms the session is already expired', async () => {
            localStorage.setItem(LS_AUTH_BACKEND, AUTH_BACKEND_CLOUDBASE);
            CloudbaseService.setUseId('user-id');
            CloudbaseService.setLoginState(true);
			mockCloudbaseAuth.signOut.and.returnValue(
				Promise.reject({ category: CLOUDBASE_ERROR_INVALID_CREDENTIALS })
			);

            await service.signOut();

            expect(localStorage.getItem(LS_AUTH_BACKEND)).toBeNull();
            expect(CloudbaseService.getUserId()).toBe('');
            expect(CloudbaseService['_loginState$'].getValue()).toBeFalse();
            expect(mockUtilities.setIsUserAlive).toHaveBeenCalledWith(false);
        });
    });

    // ── googleLogin ──────────────────────────────────────────────────────────

    describe('googleLogin', () => {
        it('is a function on the service', () => {
            expect(typeof service.googleLogin).toBe('function');
        });
    });
});
