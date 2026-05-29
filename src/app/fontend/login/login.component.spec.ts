import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BehaviorSubject, ReplaySubject } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../backend/authentication-service/auth.service';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { Utilities } from '../../common/app.utilities';
import { CN, LOGIN_URL_DEFAULT_RETURN } from '../../common/app.constant';
import { WrongCredentialsError } from '../../common/error/wrong-credentials.error';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let mockAuth: jasmine.SpyObj<AuthService>;

    beforeEach(async () => {
        mockAuth = jasmine.createSpyObj<AuthService>('AuthService', [
            'signIn',
            'signUp',
            'emailPasswordLogin',
            'googleLogin',
            'getVerificationCodeEmail'
        ]);
        mockAuth.signIn.and.returnValue(Promise.resolve());
        mockAuth.signUp.and.returnValue(Promise.resolve());
        mockAuth.emailPasswordLogin.and.returnValue(Promise.resolve());
        mockAuth.googleLogin.and.stub();
        mockAuth.getVerificationCodeEmail.and.returnValue(Promise.resolve());

        await TestBed.configureTestingModule({
            imports: [LoginComponent],
            providers: [
                provideRouter([]),
                MessageService,
                { provide: AuthService, useValue: mockAuth }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        CloudbaseService['userId'] = '';
        CloudbaseService['userRole'] = '';
        CloudbaseService['userName'] = '';
        CloudbaseService['_authReady$'] = new ReplaySubject<boolean>(1);
        CloudbaseService['_loginState$'] = new BehaviorSubject<boolean>(false);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // ── Form initialisation ────────────────────────────────────────────────

    describe('form initialisation', () => {
        it('creates a form with username, email, password, and verificationCode controls', () => {
            const form = (component as any).loginForm;
            expect(form.get('username')).toBeTruthy();
            expect(form.get('email')).toBeTruthy();
            expect(form.get('password')).toBeTruthy();
            expect(form.get('verificationCode')).toBeTruthy();
        });

        it('marks username as required', () => {
            const ctrl = (component as any).loginForm.get('username');
            ctrl.setValue('');
            expect(ctrl.valid).toBeFalse();
        });

        it('marks password as required', () => {
            const ctrl = (component as any).loginForm.get('password');
            ctrl.setValue('');
            expect(ctrl.valid).toBeFalse();
        });

        it('starts with a valid form state once required fields are filled', () => {
            const form = (component as any).loginForm;
            form.get('username').setValue('user@example.com');
            form.get('password').setValue('secret');
            expect(form.valid).toBeTrue();
        });
    });

    // ── isInvalid ──────────────────────────────────────────────────────────

    describe('isInvalid', () => {
        it('returns false before the form is submitted', () => {
            expect((component as any).isInvalid('username')).toBeFalsy();
        });

        it('returns true after submission when the control is empty', () => {
            (component as any).formSubmitted = true;
            const ctrl = (component as any).loginForm.get('username');
            ctrl.setValue('');
            expect((component as any).isInvalid('username')).toBeTrue();
        });

        it('returns false after submission when the control is valid', () => {
            (component as any).formSubmitted = true;
            const ctrl = (component as any).loginForm.get('username');
            ctrl.setValue('user@example.com');
            expect((component as any).isInvalid('username')).toBeFalsy();
        });
    });

    // ── mode toggle ────────────────────────────────────────────────────────

    describe('initial mode', () => {
        it('starts in sign-in mode (isSignUp = false)', () => {
            expect((component as any).isSignUp).toBeFalse();
        });

        it('starts with formSubmitted = false', () => {
            expect((component as any).formSubmitted).toBeFalse();
        });
    });

    // ── toggleMode ─────────────────────────────────────────────────────────

    describe('toggleMode', () => {
        it('switches isSignUp from false to true after the animation delay', fakeAsync(() => {
            expect((component as any).isSignUp).toBeFalse();
            (component as any).toggleMode();
            tick(280);
            expect((component as any).isSignUp).toBeTrue();
        }));

        it('switches isSignUp from true to false on a second toggle', fakeAsync(() => {
            (component as any).isSignUp = true;
            (component as any).toggleMode();
            tick(280);
            expect((component as any).isSignUp).toBeFalse();
        }));

        it('resets formSubmitted to false after toggle', fakeAsync(() => {
            (component as any).formSubmitted = true;
            (component as any).toggleMode();
            tick(280);
            expect((component as any).formSubmitted).toBeFalse();
        }));

        it('resets codeSent to false after toggle', fakeAsync(() => {
            (component as any).codeSent = true;
            (component as any).toggleMode();
            tick(280);
            expect((component as any).codeSent).toBeFalse();
        }));
    });

    // ── getVerificationCodeEmail ───────────────────────────────────────────

    describe('getVerificationCodeEmail', () => {
        it('calls authService.getVerificationCodeEmail with the form email value', async () => {
            (component as any).loginForm.get('email').setValue('a@b.com');
            await (component as any).getVerificationCodeEmail();
            expect(mockAuth.getVerificationCodeEmail).toHaveBeenCalledWith('a@b.com');
        });

        it('does not call authService if sendingCode is already true', async () => {
            (component as any).sendingCode = true;
            await (component as any).getVerificationCodeEmail();
            expect(mockAuth.getVerificationCodeEmail).not.toHaveBeenCalled();
        });

        it('sets codeSent to true on success', async () => {
            await (component as any).getVerificationCodeEmail();
            expect((component as any).codeSent).toBeTrue();
        });

        it('resets sendingCode to false after completion', async () => {
            await (component as any).getVerificationCodeEmail();
            expect((component as any).sendingCode).toBeFalse();
        });

        it('sets codeSent to false when authService throws', async () => {
            mockAuth.getVerificationCodeEmail.and.returnValue(Promise.reject(new Error('fail')));
            await (component as any).getVerificationCodeEmail();
            expect((component as any).codeSent).toBeFalse();
        });
    });

    // ── onSubmit ───────────────────────────────────────────────────────────

    describe('onSubmit', () => {
        it('sets formSubmitted to true', async () => {
            await (component as any).onSubmit();
            expect((component as any).formSubmitted).toBeTrue();
        });

        it('does not call any auth method when the form is invalid', async () => {
            await (component as any).onSubmit();
            expect(mockAuth.signIn).not.toHaveBeenCalled();
            expect(mockAuth.emailPasswordLogin).not.toHaveBeenCalled();
            expect(mockAuth.signUp).not.toHaveBeenCalled();
        });

        it('calls authService.signIn when country is CN and in sign-in mode', async () => {
            spyOn(Utilities, 'getCurrentCountry').and.returnValue(CN);
            const form = (component as any).loginForm;
            form.get('username').setValue('user');
            form.get('password').setValue('pass');
            await (component as any).onSubmit();
            expect(mockAuth.signIn).toHaveBeenCalledWith('user', 'pass', LOGIN_URL_DEFAULT_RETURN);
        });

        it('calls authService.emailPasswordLogin when country is not CN and in sign-in mode', async () => {
            spyOn(Utilities, 'getCurrentCountry').and.returnValue('US');
            const form = (component as any).loginForm;
            form.get('username').setValue('user@test.com');
            form.get('password').setValue('pass');
            await (component as any).onSubmit();
            expect(mockAuth.emailPasswordLogin).toHaveBeenCalled();
        });

        it('calls authService.signUp when in sign-up mode', async () => {
            (component as any).isSignUp = true;
            // Set required sign-up validators
            const form = (component as any).loginForm;
            form.get('username').setValue('newuser');
            form.get('email').setValue('new@test.com');
            form.get('password').setValue('pass123');
            form.get('verificationCode').setValue('123456');
            // Force form valid
            form.get('email').setValidators([]);
            form.get('verificationCode').setValidators([]);
            form.get('email').updateValueAndValidity();
            form.get('verificationCode').updateValueAndValidity();
            await (component as any).onSubmit();
            expect(mockAuth.signUp).toHaveBeenCalled();
        });
    });

    // ── googleLogin ────────────────────────────────────────────────────────

    describe('googleLogin', () => {
        it('delegates to authService.googleLogin', () => {
            (component as any).googleLogin();
            expect(mockAuth.googleLogin).toHaveBeenCalled();
        });
    });
});
