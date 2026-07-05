import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { AccountRateLimitedError } from '../../../common/error/account-rate-limited.error';
import { SessionExpiredError } from '../../../common/error/session-expired.error';
import { WrongOldPasswordError } from '../../../common/error/wrong-old-password.error';
import {
	DIALOG_BTN_DELETE,
	DIALOG_BTN_CANCEL,
	ACCOUNT_LABEL_DELETE_ACCOUNT,
	ACCOUNT_DIALOG_DELETE_MSG,
	ACCOUNT_DIALOG_DELETE_PWD_PLACEHOLDER,
	MSG_UNEXPECTED_ERROR
} from '../../../common/locale/locale-strings';

/** Overridable title and warning text for the password-confirm dialog, so it can serve actions other
 * than account deletion (e.g. removing the vault passphrase). Omitted → the delete-account defaults. */
export interface DeleteConfirmText {
	title: string;
	message: string;
}

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

	protected readonly ACCOUNT_DIALOG_DELETE_PWD_PLACEHOLDER = ACCOUNT_DIALOG_DELETE_PWD_PLACEHOLDER;
	protected readonly DIALOG_BTN_DELETE = DIALOG_BTN_DELETE;
	protected readonly DIALOG_BTN_CANCEL = DIALOG_BTN_CANCEL;

	// Title and warning default to the delete-account copy; openDialog overrides them for other actions.
	protected dialogTitle = ACCOUNT_LABEL_DELETE_ACCOUNT;
	protected dialogMessage = ACCOUNT_DIALOG_DELETE_MSG;
	protected visible = false;
	protected passwordInput = '';
	protected errorMessage = '';
	protected isSubmitting = false;
	private submitCallback?: (password: string) => Promise<void>;

	constructor(private readonly cdr: ChangeDetectorRef) {}

	// ── Dialog API ────────────────────────────────────────────────────────

	/**
	 * Opens the password-confirm dialog and stores the submit callback. Optional text overrides let the
	 * same dialog serve other password-gated actions (e.g. removing the vault passphrase); when omitted
	 * the title and warning fall back to the delete-account defaults.
	 *
	 * @param submitCallback - The async callback invoked with the confirmed password on submit.
	 * @param text - Optional title and warning overrides; defaults to the delete-account copy.
	 */
	public openDialog(submitCallback: (password: string) => Promise<void>, text?: DeleteConfirmText): void {
		// Step 1: Store the callback and reset all transient state before revealing the dialog —
		// resetting first prevents the previous error message from flashing on screen during open animation
		this.submitCallback = submitCallback;
		this.dialogTitle = text?.title ?? ACCOUNT_LABEL_DELETE_ACCOUNT;
		this.dialogMessage = text?.message ?? ACCOUNT_DIALOG_DELETE_MSG;
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
				this.errorMessage = error.message;
			} else if (error instanceof AccountRateLimitedError) {
				this.errorMessage = error.message;
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
