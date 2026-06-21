import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { AccountRateLimitedError } from '../../../common/error/account-rate-limited.error';
import { SessionExpiredError } from '../../../common/error/session-expired.error';
import { WrongOldPasswordError } from '../../../common/error/wrong-old-password.error';
import {
	ACCOUNT_DIALOG_DELETE_BTN,
	ACCOUNT_DIALOG_DELETE_CANCEL_BTN,
	ACCOUNT_DIALOG_DELETE_ERROR_WRONG_PWD,
	ACCOUNT_DIALOG_DELETE_HEADER,
	ACCOUNT_DIALOG_DELETE_MSG,
	ACCOUNT_DIALOG_DELETE_PWD_PLACEHOLDER,
	MSG_UNEXPECTED_ERROR
} from '../../../common/app.constant';

@Component({
	selector: 'delete-account-dialog',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [DialogModule, FormsModule],
	templateUrl: './delete-account.component.html',
	styleUrl: './delete-account.component.css'
})
export class DeleteAccountDialogComponent {
	@Output() closed$ = new EventEmitter<void>();
	@Output() sessionExpired$ = new EventEmitter<void>();

	protected readonly ACCOUNT_DIALOG_DELETE_HEADER = ACCOUNT_DIALOG_DELETE_HEADER;
	protected readonly ACCOUNT_DIALOG_DELETE_MSG = ACCOUNT_DIALOG_DELETE_MSG;
	protected readonly ACCOUNT_DIALOG_DELETE_PWD_PLACEHOLDER = ACCOUNT_DIALOG_DELETE_PWD_PLACEHOLDER;
	protected readonly ACCOUNT_DIALOG_DELETE_BTN = ACCOUNT_DIALOG_DELETE_BTN;
	protected readonly ACCOUNT_DIALOG_DELETE_CANCEL_BTN = ACCOUNT_DIALOG_DELETE_CANCEL_BTN;

	protected visible = false;
	protected passwordInput = '';
	protected errorMessage = '';
	protected isSubmitting = false;
	private submitCallback?: (password: string) => Promise<void>;

	constructor(private readonly cdr: ChangeDetectorRef) {}

	// ── Dialog API ────────────────────────────────────────────────────────

	/**
	 * Opens the delete-account dialog and stores the submit callback.
	 *
	 * @param submitCallback - The async callback invoked with the confirmed password on submit.
	 */
	public openDialog(submitCallback: (password: string) => Promise<void>): void {
		// Step 1: Store the callback and reset all transient state before revealing the dialog —
		// resetting first prevents the previous error message from flashing on screen during open animation
		this.submitCallback = submitCallback;
		this.passwordInput = '';
		this.errorMessage = '';
		this.isSubmitting = false;

		// Step 2: Reveal the dialog only after state is clean
		this.visible = true;
	}

	// ── User actions ──────────────────────────────────────────────────────

	/**
	 * Submits the deletion request by invoking the callback with the entered password.
	 * Sets an inline error message on wrong-password failures without closing the dialog.
	 * Closes the dialog only on a successful callback resolution.
	 */
	protected async onSubmit(): Promise<void> {
		// Step 1: Guard — reject empty input and prevent double-submission
		if (!this.passwordInput || this.isSubmitting) return;

		// Step 2: Lock the UI and clear any previous error before invoking the callback —
		// markForCheck is required here because OnPush won't detect these field mutations automatically
		this.isSubmitting = true;
		this.errorMessage = '';
		this.cdr.markForCheck();

		try {
			// Step 3: Delegate to the caller-provided callback; success closes the dialog
			await this.submitCallback?.(this.passwordInput);
			this.onDialogClosed();
		} catch (error: unknown) {
			// Step 4: Unlock and surface a typed error message — the dialog stays open so
			// the user can correct their password without re-opening; isSubmitting must be
			// reset here (not in finally) because the success path closes before this branch runs
			this.isSubmitting = false;
			if (error instanceof WrongOldPasswordError) {
				this.errorMessage = ACCOUNT_DIALOG_DELETE_ERROR_WRONG_PWD;
			} else if (error instanceof AccountRateLimitedError) {
				this.errorMessage = (error as Error).message;
			} else if (error instanceof SessionExpiredError) {
				this.onDialogClosed();
				this.sessionExpired$.emit();
				return;
			} else {
				this.errorMessage = MSG_UNEXPECTED_ERROR;
			}
			this.cdr.markForCheck();
		}
	}

	/**
	 * Closes the dialog and emits the closed event so DialogService can
	 * destroy the component and remove it from the open-dialogs map.
	 */
	protected onDialogClosed(): void {
		this.visible = false;
		this.closed$.emit();
	}
}
