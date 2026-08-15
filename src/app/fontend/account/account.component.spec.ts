import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AccountComponent } from './account.component';
import { AuthService } from '../../backend/authentication-service/auth.service';
import { DatabaseService } from '../../backend/database-service/database.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { SessionRecoveryService } from '../../backend/session-recovery/session-recovery.service';
import { UnexpectedError } from '../../common/error/unexpected.error';
import { Utilities } from '../../common/utilities/app.utilities';
import {
	DIALOG_BLOCK,
	LOGIN_URL_DEFAULT_RETURN,
	RECOVERY_STATUS_EXPIRED
} from '../../common/constants';

describe('AccountComponent', () => {
	let mockAuthService: jasmine.SpyObj<AuthService>;
	let mockDatabaseService: jasmine.SpyObj<DatabaseService>;
	let mockDialogService: jasmine.SpyObj<DialogService>;
	let mockSessionRecoveryService: jasmine.SpyObj<SessionRecoveryService>;

	beforeEach(async () => {
		mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', ['deleteUser']);
		mockDatabaseService = jasmine.createSpyObj<DatabaseService>('DatabaseService', ['getUserStats']);
		mockDialogService = jasmine.createSpyObj<DialogService>('DialogService', [
			'closeLoadingTimeout',
			'confirmThenBlock',
			'handleError',
			'openDialog'
		]);
		mockSessionRecoveryService = jasmine.createSpyObj<SessionRecoveryService>(
			'SessionRecoveryService',
			['expireConfirmedSession']
		);
		mockSessionRecoveryService.expireConfirmedSession.and.returnValue(RECOVERY_STATUS_EXPIRED);

		await TestBed.configureTestingModule({
			imports: [AccountComponent],
			providers: [
				provideRouter([]),
				{ provide: AuthService, useValue: mockAuthService },
				{ provide: DatabaseService, useValue: mockDatabaseService },
				{ provide: DialogService, useValue: mockDialogService },
				{ provide: SessionRecoveryService, useValue: mockSessionRecoveryService }
			]
		}).compileComponents();
	});

	// ── Account deletion ──────────────────────────────────────────────────────

	it('keeps Firebase deletion failed when the provider rejects', async () => {
		spyOn(Utilities, 'isFirebaseBackend').and.returnValue(true);
		const deletionError = new UnexpectedError();
		mockAuthService.deleteUser.and.rejectWith(deletionError);
		const fixture = TestBed.createComponent(AccountComponent);
		const component = fixture.componentInstance as any;
		component.dialogComponentContainer = { clear: jasmine.createSpy('clear') };

		component.openDeleteConfirmationDialog();
		const deletionWork = mockDialogService.confirmThenBlock.calls.mostRecent().args[3];

		await expectAsync(deletionWork()).toBeRejectedWith(deletionError);
		expect(mockDialogService.handleError).toHaveBeenCalledOnceWith(
			component.dialogComponentContainer,
			deletionError
		);
		expect(mockSessionRecoveryService.expireConfirmedSession).not.toHaveBeenCalled();
	});

	it('clears local state and leaves Account after CloudBase deletion succeeds', async () => {
		spyOn(Utilities, 'isFirebaseBackend').and.returnValue(false);
		mockAuthService.deleteUser.and.resolveTo();
		mockDialogService.openDialog.and.callFake(((container: unknown, dialogType: string, work: unknown) => {
			if (dialogType === DIALOG_BLOCK) return (work as () => Promise<void>)();
			return undefined;
		}) as any);
		const fixture = TestBed.createComponent(AccountComponent);
		const component = fixture.componentInstance as any;
		component.dialogComponentContainer = { clear: jasmine.createSpy('clear') };
		const router = TestBed.inject(Router);
		const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

		component.openDeleteConfirmationDialog();
		const passwordSubmit = mockDialogService.openDialog.calls.first().args[2] as unknown as (
			password: string
		) => Promise<void>;
		await passwordSubmit('password');

		expect(mockAuthService.deleteUser).toHaveBeenCalledOnceWith('password');
		expect(mockSessionRecoveryService.expireConfirmedSession).toHaveBeenCalledOnceWith();
		expect(navigateSpy).toHaveBeenCalledOnceWith([LOGIN_URL_DEFAULT_RETURN]);
	});
});
