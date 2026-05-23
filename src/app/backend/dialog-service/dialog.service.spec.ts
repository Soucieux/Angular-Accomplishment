import { TestBed } from '@angular/core/testing';
import { ViewContainerRef } from '@angular/core';
import { MessageService } from 'primeng/api';

import { DIALOG_CONFIRM, ERROR_PERMISSION_DENIED } from '../../common/app.constant';
import { DialogService } from './dialog.service';

describe('DialogService', () => {
	let service: DialogService;
	let messageService: jasmine.SpyObj<MessageService>;

	beforeEach(() => {
		const msgSpy = jasmine.createSpyObj('MessageService', ['add']);

		TestBed.configureTestingModule({
			providers: [
				DialogService,
				{ provide: MessageService, useValue: msgSpy }
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
			spyOn(service, 'showPermissionError');
			spyOn(service, 'showUnexpectedError');
		});

		it('calls showPermissionError when the error message is ERROR_PERMISSION_DENIED', () => {
			service.handleError(mockContainer, new Error(ERROR_PERMISSION_DENIED));
			expect(service.showPermissionError).toHaveBeenCalledWith(mockContainer);
			expect(service.showUnexpectedError).not.toHaveBeenCalled();
		});

		it('calls showUnexpectedError for any other error', () => {
			service.handleError(mockContainer, new Error('Something went wrong'));
			expect(service.showUnexpectedError).toHaveBeenCalledWith(mockContainer);
			expect(service.showPermissionError).not.toHaveBeenCalled();
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
			spyOn(service as any, 'ensurePermission').and.callThrough();
			// checkPermission returns false when no user is signed in
			const result = service.ensurePermission(mockContainer, 'some-other-user-id');
			expect(result).toBeFalse();
			expect(service.showPermissionError).toHaveBeenCalledWith(mockContainer);
		});
	});

	// ── openDialog ─────────────────────────────────────────────────────────

	describe('openDialog', () => {
		it('throws when the container reference is null', () => {
			expect(() => service.openDialog(null as any, 'confirm', () => {}, [])).toThrow();
		});

		it('throws when the same non-error dialog type is already open', () => {
			const mockContainer = jasmine.createSpyObj('ViewContainerRef', ['createComponent']);
			(service as any).openedDialogs.set(DIALOG_CONFIRM, {});
			expect(() => service.openDialog(mockContainer, 'confirm', () => {}, []))
				.toThrowError('Dialog already opened');
		});
	});
});
