import { fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { skip } from 'rxjs/operators';

import { ROLE_ADMIN } from '../../../common/app.constant';
import { CloudbaseService } from './cloudbase.service';

describe('CloudbaseService', () => {
    beforeEach(() => {
        // Reset static subjects so each test starts with a clean observable state.
        (CloudbaseService as any)._authReady$ = new ReplaySubject<boolean>(1);
        (CloudbaseService as any)._loginState$ = new BehaviorSubject<boolean>(false);
        // Reset static scalar fields without going through setUseId (which would emit onto _authReady$).
        (CloudbaseService as any).userId = undefined;
        (CloudbaseService as any).userRole = undefined;
        (CloudbaseService as any).userName = undefined;
    });

    // ── User identity ──────────────────────────────────────────────────────────

    describe('setUseId / getUseId', () => {
        it('stores and retrieves a user ID', () => {
            // Arrange / Act
            CloudbaseService.setUseId('user-123');

            // Assert
            expect(CloudbaseService.getUseId()).toBe('user-123');
        });

        it('stores an empty string when cleared', () => {
            // Arrange
            CloudbaseService.setUseId('user-123');

            // Act
            CloudbaseService.setUseId('');

            // Assert
            expect(CloudbaseService.getUseId()).toBe('');
        });
    });

    // ── Role and permissions ───────────────────────────────────────────────────

    describe('userHasAllRights', () => {
        it('returns true when role is ROLE_ADMIN', () => {
            // Arrange / Act
            CloudbaseService.setUserRole(ROLE_ADMIN);

            // Assert
            expect(CloudbaseService.userHasAllRights()).toBeTrue();
        });

        it('returns false when role is not ROLE_ADMIN', () => {
            // Arrange / Act
            CloudbaseService.setUserRole('viewer');

            // Assert
            expect(CloudbaseService.userHasAllRights()).toBeFalse();
        });

        it('returns false when role has not been set', () => {
            expect(CloudbaseService.userHasAllRights()).toBeFalse();
        });
    });

    // ── User name ──────────────────────────────────────────────────────────────

    describe('setUserName / getUserName', () => {
        it('stores and retrieves a user name', () => {
            // Arrange / Act
            CloudbaseService.setUserName('Alice');

            // Assert
            expect(CloudbaseService.getUserName()).toBe('Alice');
        });
    });

    // ── loginState$ ────────────────────────────────────────────────────────────

    describe('loginState$', () => {
        it('emits false as the initial value', (done) => {
            // loginState$ is backed by a BehaviorSubject — always emits current state on subscribe.
            CloudbaseService.loginState$.subscribe((value) => {
                expect(value).toBeFalse();
                done();
            });
        });

        it('emits true after setLoginState(true)', (done) => {
            // Skip the initial BehaviorSubject emission so we only assert on the new value.
            CloudbaseService.loginState$.pipe(skip(1)).subscribe((value) => {
                expect(value).toBeTrue();
                done();
            });

            CloudbaseService.setLoginState(true);
        });

        it('emits false after setLoginState(false)', (done) => {
            CloudbaseService.setLoginState(true);

            CloudbaseService.loginState$.pipe(skip(1)).subscribe((value) => {
                expect(value).toBeFalse();
                done();
            });

            CloudbaseService.setLoginState(false);
        });
    });

    // ── authReady$ ─────────────────────────────────────────────────────────────

    describe('authReady$', () => {
        it('emits when setUseId is called with a non-empty user ID', (done) => {
            CloudbaseService.authReady$.subscribe(() => {
                expect(CloudbaseService.getUseId()).toBe('user-456');
                done();
            });

            CloudbaseService.setUseId('user-456');
        });

        it('does not emit when setUseId is called with an empty string', fakeAsync(() => {
            let emitted = false;

            CloudbaseService.authReady$.subscribe(() => {
                emitted = true;
            });

            CloudbaseService.setUseId('');
            tick(100);

            expect(emitted).toBeFalse();
        }));

        it('emits when markAuthReady is called directly', (done) => {
            CloudbaseService.authReady$.subscribe(() => {
                expect(true).toBeTrue();
                done();
            });

            CloudbaseService.markAuthReady();
        });
    });
});
