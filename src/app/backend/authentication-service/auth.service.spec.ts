import { TestBed } from '@angular/core/testing';
import { EnvironmentInjector } from '@angular/core';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of, ReplaySubject } from 'rxjs';

import { AuthService } from './auth.service';
import { CLOUDBASE, FIREBASE_AUTH } from '../database-service/database.service';
import { CloudbaseService } from '../database-service/cloudbase/cloudbase.service';
import { Utilities } from '../../common/utilities/app.utilities';
import { CLOUDBASE_ERROR_INVALID_CREDENTIALS } from '../../common/constants';
import { WrongCredentialsError } from '../../common/error/wrong-credentials.error';

describe('AuthService', () => {
    let service: AuthService;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockUtilities: jasmine.SpyObj<Utilities>;
    let mockCloudbaseAuth: any;
    let mockFirebaseAuth: any;

    beforeEach(() => {
        mockCloudbaseAuth = {
            signInAnonymously: jasmine.createSpy('signInAnonymously').and.returnValue(Promise.resolve()),
            getVerification: jasmine.createSpy('getVerification').and.returnValue(Promise.resolve({ verification_id: 'vid' })),
            verify: jasmine.createSpy('verify').and.returnValue(Promise.resolve({ verification_token: 'tok' })),
            signUp: jasmine.createSpy('signUp').and.returnValue(Promise.resolve()),
            signInWithPassword: jasmine.createSpy('signInWithPassword').and.returnValue(Promise.resolve({ error: null })),
            getUser: jasmine.createSpy('getUser').and.returnValue(Promise.resolve({ data: { user: null } })),
            signOut: jasmine.createSpy('signOut').and.returnValue(Promise.resolve())
        };

        /* AuthService resolves both auth SDKs from the environment injector in its constructor,
           so the tokens themselves are stubbed rather than any database service. */
        mockFirebaseAuth = {
            currentUser: null,
            authStateReady: () => Promise.resolve()
        };

        mockRouter = jasmine.createSpyObj<Router>('Router', ['navigate']);
        mockRouter.navigate.and.returnValue(Promise.resolve(true));

        mockUtilities = jasmine.createSpyObj<Utilities>('Utilities', ['setIsUserAlive', 'checkIfHoverCapable']);
        mockUtilities.setIsUserAlive.and.stub();

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

        it('emits null when the user has no username metadata', async () => {
            mockCloudbaseAuth.getUser.and.returnValue(
                Promise.resolve({ data: { user: { id: 'uid', user_metadata: {} } } })
            );
            const result = service.getCurrentUser();
            let emitted: unknown;
            result.subscribe((v) => (emitted = v));
            await Promise.resolve(); // flush microtask
            expect(emitted).toBeNull();
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
    });

    // ── signOut ──────────────────────────────────────────────────────────────

    describe('signOut', () => {
        it('calls cloudbaseAuth.signOut', async () => {
            await service.signOut();
            expect(mockCloudbaseAuth.signOut).toHaveBeenCalled();
        });

        it('sets isUserAlive to false after sign-out', async () => {
            await service.signOut();
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
