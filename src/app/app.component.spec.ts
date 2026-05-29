import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BehaviorSubject, ReplaySubject } from 'rxjs';

import { CN } from './common/app.constant';
import { Utilities } from './common/app.utilities';
import { AppComponent } from './app.component';
import { AuthService } from './backend/authentication-service/auth.service';
import { CloudbaseService } from './backend/database-service/cloudbase/cloudbase.service';

describe('AppComponent', () => {
    let mockAuth: jasmine.SpyObj<AuthService>;

    beforeEach(async () => {
        mockAuth = jasmine.createSpyObj<AuthService>('AuthService', [
            'cloudbaseGetCurrentUser',
            'firebaseGetCurrentUser',
            'logout',
            'signOut'
        ]);
        mockAuth.cloudbaseGetCurrentUser.and.returnValue(new BehaviorSubject(null).asObservable());
        mockAuth.firebaseGetCurrentUser.and.returnValue(new BehaviorSubject(null).asObservable());
        mockAuth.logout.and.stub();
        mockAuth.signOut.and.returnValue(Promise.resolve());

        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: [
                provideRouter([]),
                MessageService,
                { provide: AuthService, useValue: mockAuth }
            ]
        }).compileComponents();
    });

    afterEach(() => {
        CloudbaseService['userId'] = '';
        CloudbaseService['userRole'] = '';
        CloudbaseService['userName'] = '';
        CloudbaseService['_authReady$'] = new ReplaySubject<boolean>(1);
        CloudbaseService['_loginState$'] = new BehaviorSubject<boolean>(false);
    });

    it('should create the app', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });

    // ── isCN ───────────────────────────────────────────────────────────────

    describe('isCN', () => {
        it('returns true when the current country is CN', () => {
            const fixture = TestBed.createComponent(AppComponent);
            spyOn(Utilities, 'getCurrentCountry').and.returnValue(CN);
            expect((fixture.componentInstance as any).isCN()).toBeTrue();
        });

        it('returns false when the current country is not CN', () => {
            const fixture = TestBed.createComponent(AppComponent);
            spyOn(Utilities, 'getCurrentCountry').and.returnValue('US');
            expect((fixture.componentInstance as any).isCN()).toBeFalse();
        });
    });

    // ── navigateToLogin ─────────────────────────────────────────────────────

    describe('navigateToLogin', () => {
        it('navigates to /login with the current URL as returnUrl', () => {
            const fixture = TestBed.createComponent(AppComponent);
            const router = TestBed.inject(Router);
            const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
            (fixture.componentInstance as any).navigateToLogin();
            expect(navigateSpy).toHaveBeenCalledWith(
                ['/login'],
                jasmine.objectContaining({ queryParams: jasmine.objectContaining({ returnUrl: jasmine.any(String) }) })
            );
        });
    });

    // ── logout ──────────────────────────────────────────────────────────────

    describe('logout', () => {
        it('calls authService.signOut when the country is CN', fakeAsync(async () => {
            const fixture = TestBed.createComponent(AppComponent);
            spyOn(Utilities, 'getCurrentCountry').and.returnValue(CN);
            await (fixture.componentInstance as any).logout();
            expect(mockAuth.signOut).toHaveBeenCalled();
        }));

        it('calls authService.logout when the country is not CN', async () => {
            const fixture = TestBed.createComponent(AppComponent);
            spyOn(Utilities, 'getCurrentCountry').and.returnValue('US');
            await (fixture.componentInstance as any).logout();
            expect(mockAuth.logout).toHaveBeenCalled();
        });
    });
});
