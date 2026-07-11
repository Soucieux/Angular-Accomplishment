import { TestBed, fakeAsync } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BehaviorSubject, ReplaySubject } from 'rxjs';

import { AppComponent } from './app.component';
import { AuthService } from './backend/authentication-service/auth.service';
import { CloudbaseService } from './backend/database-service/cloudbase/cloudbase.service';

describe('AppComponent', () => {
    let mockAuth: jasmine.SpyObj<AuthService>;

    beforeEach(async () => {
        mockAuth = jasmine.createSpyObj<AuthService>('AuthService', [
            'getCurrentUser',
            'logout',
            'signOut'
        ]);
        mockAuth.getCurrentUser.and.returnValue(new BehaviorSubject(null).asObservable());
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
        it('signs out through the CloudBase auth provider', fakeAsync(async () => {
            const fixture = TestBed.createComponent(AppComponent);
            await (fixture.componentInstance as any).logout();
            expect(mockAuth.signOut).toHaveBeenCalled();
        }));
    });
});
