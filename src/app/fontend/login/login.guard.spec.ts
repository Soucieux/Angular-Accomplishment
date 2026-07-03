import { TestBed } from '@angular/core/testing';
import { GuardResult, MaybeAsync, Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';

import { loginGuard } from './login.guard';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';

describe('loginGuard', () => {
	let mockRouter: jasmine.SpyObj<Router>;

	function runGuard(): MaybeAsync<GuardResult> {
		return TestBed.runInInjectionContext(() => loginGuard({} as any, {} as any));
	}

	describe('in a browser environment', () => {
		beforeEach(() => {
			mockRouter = jasmine.createSpyObj<Router>('Router', ['parseUrl']);
			mockRouter.parseUrl.and.returnValue({ queryParams: {} } as any);

			TestBed.configureTestingModule({
				providers: [
					{ provide: PLATFORM_ID, useValue: 'browser' },
					{ provide: Router, useValue: mockRouter }
				]
			});
		});

		it('returns true when the user is not signed in', () => {
			spyOn(CloudbaseService, 'getUserId').and.returnValue('');
			const result = runGuard();
			expect(result).toBeTrue();
		});

		it('calls router.parseUrl("/") when the user is already signed in', () => {
			spyOn(CloudbaseService, 'getUserId').and.returnValue('user-id-123');
			runGuard();
			expect(mockRouter.parseUrl).toHaveBeenCalledWith('/');
		});
	});

	describe('in a server environment', () => {
		beforeEach(() => {
			TestBed.configureTestingModule({
				providers: [
					{ provide: PLATFORM_ID, useValue: 'server' }
				]
			});
		});

		it('returns true regardless of auth state', () => {
			spyOn(CloudbaseService, 'getUserId').and.returnValue('user-id-123');
			const result = runGuard();
			expect(result).toBeTrue();
		});
	});
});
