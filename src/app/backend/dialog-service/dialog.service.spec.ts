import { TestBed } from '@angular/core/testing';
import { ViewContainerRef } from '@angular/core';
import { MessageService } from 'primeng/api';

import { DIALOG_CONFIRM, DIALOG_RETRY } from '../../common/constants';
import { MSG_DIALOG_ALREADY_OPEN } from '../../common/locale/locale-strings';
import { DialogService } from './dialog.service';

describe('DialogService', () => {
	let service: DialogService;
	let messageService: jasmine.SpyObj<MessageService>;

	beforeEach(() => {
		const messageSpy = jasmine.createSpyObj('MessageService', ['add']);

		TestBed.configureTestingModule({
			providers: [
				DialogService,
				{ provide: MessageService, useValue: messageSpy }
			]
		});
		service = TestBed.inject(DialogService);
		messageService = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	// ── showToast ──────────────────────────────────────────────────────────

	describe('showToast', () => {
		it('calls messageService.add with the correct severity and summary', () => {
			service.showToast('success', 'Saved');
			expect(messageService.add).toHaveBeenCalledWith(
				jasmine.objectContaining({ severity: 'success', summary: 'Saved' })
			);
		});

		it('passes the optional detail to messageService.add', () => {
			service.showToast('error', 'Failed', 'Something went wrong');
			expect(messageService.add).toHaveBeenCalledWith(
				jasmine.objectContaining({ detail: 'Something went wrong' })
			);
		});
	});

	// ── handleError ────────────────────────────────────────────────────────

	describe('handleError', () => {
		let mockContainer: jasmine.SpyObj<ViewContainerRef>;

		beforeEach(() => {
			mockContainer = jasmine.createSpyObj('ViewContainerRef', ['createComponent']);
			spyOn(service, 'showUnexpectedError');
		});

		it('calls showUnexpectedError for any other error', () => {
			service.handleError(mockContainer, new Error('Something went wrong'));
			expect(service.showUnexpectedError).toHaveBeenCalledWith(mockContainer);
		});

		it('calls showUnexpectedError for non-Error thrown values', () => {
			service.handleError(mockContainer, 'plain string error');
			expect(service.showUnexpectedError).toHaveBeenCalledWith(mockContainer);
		});
	});

	// ── ensurePermission ───────────────────────────────────────────────────

	describe('ensurePermission', () => {
		let mockContainer: jasmine.SpyObj<ViewContainerRef>;

		beforeEach(() => {
			mockContainer = jasmine.createSpyObj('ViewContainerRef', ['createComponent']);
			spyOn(service, 'showPermissionError');
		});

		it('returns false and shows permission error when permission is denied', () => {
			spyOn(service, 'ensurePermission').and.callThrough();

			// checkPermission returns false when no user is signed in
			const result = service.ensurePermission(mockContainer, 'some-other-user-id');
			expect(result).toBeFalse();
			expect(service.showPermissionError).toHaveBeenCalledWith(mockContainer);
		});
	});

	// ── openDialog ─────────────────────────────────────────────────────────

	describe('openDialog', () => {
		it('throws when the container reference is null', () => {
			expect(() => service.openDialog(null as unknown as ViewContainerRef, 'confirm', () => {}, [])).toThrow();
		});

		it('throws when the same non-error dialog type is already open', () => {
			const mockContainer = jasmine.createSpyObj('ViewContainerRef', ['createComponent']);
			(service as unknown as { openedDialogs: Map<string, unknown> }).openedDialogs.set(DIALOG_CONFIRM, {});
			expect(() => service.openDialog(mockContainer, 'confirm', () => {}, []))
				.toThrowError(MSG_DIALOG_ALREADY_OPEN);
		});
	});

	// ── runBlocking ─────────────────────────────────────────────────────────

	describe('runBlocking', () => {
		it('propagates a rejected write after the blocking dialog closes', async () => {
			const mockContainer = jasmine.createSpyObj<ViewContainerRef>('ViewContainerRef', ['createComponent']);
			const writeError = new Error('write failed');
			const blockingDialogService = service as unknown as {
				openDialog(
					dialogContainerRef: ViewContainerRef,
					dialogType: 'block',
					task: () => Promise<void>,
					message: string
				): Promise<void>;
			};
			spyOn(blockingDialogService, 'openDialog').and.returnValue(Promise.reject(writeError));

			await expectAsync(service.runBlocking(mockContainer, 'Saving', async () => {}))
				.toBeRejectedWith(writeError);
		});
	});

	// ── loading-timeout ownership ───────────────────────────────────────────

	describe('showLoadingTimeout / closeLoadingTimeout', () => {
		/** Exposes the private registry the service tracks open dialogs in. */
		const getOpenedDialogs = (): Map<string, unknown> =>
			(service as unknown as { openedDialogs: Map<string, unknown> }).openedDialogs;

		/** Builds a stand-in for an open retry dialog, recording whether it gets resolved away. */
		const makeRetryDialog = () => ({ instance: { resolve: jasmine.createSpy('resolve') } });

		it('leaves a session-expired dialog alone, since it shares the retry type', () => {
			const mockContainer = jasmine.createSpyObj<ViewContainerRef>('ViewContainerRef', [
				'createComponent'
			]);
			/* A retry dialog is already on screen, raised by session expiry rather than a slow load.
			   Retry is stackable, so openDialog silently skips it — the loading timeout must not then
			   treat that dialog as its own and close a state the user still has to act on. */
			const sessionExpiredDialog = makeRetryDialog();
			getOpenedDialogs().set(DIALOG_RETRY, sessionExpiredDialog);

			service.showLoadingTimeout(mockContainer);
			service.closeLoadingTimeout();

			expect(mockContainer.createComponent).not.toHaveBeenCalled();
			expect(sessionExpiredDialog.instance.resolve).not.toHaveBeenCalled();
		});

		it('resolves the dialog the loading timeout itself opened', () => {
			const timeoutDialog = makeRetryDialog();
			(service as unknown as { isLoadingTimeoutOpen: boolean }).isLoadingTimeoutOpen = true;
			getOpenedDialogs().set(DIALOG_RETRY, timeoutDialog);

			service.closeLoadingTimeout();

			expect(timeoutDialog.instance.resolve).toHaveBeenCalledTimes(1);
		});

		it('does nothing when no loading-timeout dialog is open', () => {
			expect(() => service.closeLoadingTimeout()).not.toThrow();
		});
	});
});
