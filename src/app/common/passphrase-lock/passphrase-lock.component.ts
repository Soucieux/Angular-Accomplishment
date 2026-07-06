import { ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LOG } from '../app.logs';
import { DatabaseService } from '../../backend/database-service/database.service';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import {
	PASSPHRASE_MIN_LENGTH,
	PASSPHRASE_LOCK_STATE_SETUP,
	PASSPHRASE_LOCK_STATE_LOCKED,
	PASSPHRASE_LOCK_LOG_CALL_FAILED
} from '../constants';
import {
	PASSPHRASE_LOCK_SETUP_TITLE,
	PASSPHRASE_LOCK_SETUP_BODY,
	PASSPHRASE_LOCK_LOCKED_TITLE,
	PASSPHRASE_LOCK_LOCKED_BODY,
	PASSPHRASE_LOCK_PLACEHOLDER,
	PASSPHRASE_LOCK_CONFIRM_PLACEHOLDER,
	PASSPHRASE_LOCK_ERROR_WRONG,
	PASSPHRASE_LOCK_ERROR_MISMATCH,
	PASSPHRASE_LOCK_ERROR_TOO_SHORT,
	PASSPHRASE_LOCK_ERROR_GENERIC,
	PASSPHRASE_LOCK_BTN_SET,
	PASSPHRASE_LOCK_BTN_UNLOCK,
	PASSPHRASE_LOCK_BTN_VERIFYING,
	PASSPHRASE_LOCK_FOOTER
} from '../locale/locale-strings';

/**
 * Generic passphrase gate shown in front of a protected page's real content. Reusable across any
 * page — the host passes a unique featureKey and listens for (unlocked). Shows a first-time setup
 * screen when no passphrase has been set yet for that key, otherwise an unlock prompt. The host is
 * expected to re-render this component on every entry to its page, since the gate re-checks and
 * re-prompts every time.
 */
@Component({
	selector: 'passphrase-lock',
	standalone: true,
	imports: [FormsModule],
	templateUrl: './passphrase-lock.component.html',
	styleUrl: './passphrase-lock.component.css'
})
export class PassphraseLockComponent implements OnInit {
	private readonly className = 'PassphraseLockComponent';
	@Input({ required: true }) featureKey!: string;
	@Output() readonly unlocked = new EventEmitter<void>();

	protected readonly PASSPHRASE_LOCK_SETUP_TITLE = PASSPHRASE_LOCK_SETUP_TITLE;
	protected readonly PASSPHRASE_LOCK_SETUP_BODY = PASSPHRASE_LOCK_SETUP_BODY;
	protected readonly PASSPHRASE_LOCK_LOCKED_TITLE = PASSPHRASE_LOCK_LOCKED_TITLE;
	protected readonly PASSPHRASE_LOCK_LOCKED_BODY = PASSPHRASE_LOCK_LOCKED_BODY;
	protected readonly PASSPHRASE_LOCK_PLACEHOLDER = PASSPHRASE_LOCK_PLACEHOLDER;
	protected readonly PASSPHRASE_LOCK_CONFIRM_PLACEHOLDER = PASSPHRASE_LOCK_CONFIRM_PLACEHOLDER;
	protected readonly PASSPHRASE_LOCK_BTN_SET = PASSPHRASE_LOCK_BTN_SET;
	protected readonly PASSPHRASE_LOCK_BTN_UNLOCK = PASSPHRASE_LOCK_BTN_UNLOCK;
	protected readonly PASSPHRASE_LOCK_BTN_VERIFYING = PASSPHRASE_LOCK_BTN_VERIFYING;
	protected readonly PASSPHRASE_LOCK_FOOTER = PASSPHRASE_LOCK_FOOTER;
	protected readonly PASSPHRASE_LOCK_STATE_SETUP = PASSPHRASE_LOCK_STATE_SETUP;
	protected readonly PASSPHRASE_LOCK_STATE_LOCKED = PASSPHRASE_LOCK_STATE_LOCKED;

	/* Renders the unlock card immediately (optimistic) instead of a blank loading gate: returning users
	   already have a passphrase, so the entry screen paints with no Cloud Function wait. ngOnInit
	   corrects to the setup screen for the rare first-time user whose passphrase is not yet set. */
	protected state: string = PASSPHRASE_LOCK_STATE_LOCKED;
	protected passphraseInput = '';
	protected confirmInput = '';
	protected errorMessage = '';
	protected shake = false;
	protected isSubmitting = false;

	constructor(
		private databaseService: DatabaseService,
		private ngZone: NgZone,
		private cdr: ChangeDetectorRef
	) {}

	/**
	 * Loads whether the caller already has a passphrase set for this featureKey, to decide between
	 * the first-time setup screen and the unlock prompt. The Cloud Function call can resolve outside
	 * Angular's zone, so the state update is re-entered into the zone and change detection is forced —
	 * otherwise the view stays on its initial state until an unrelated event triggers a CD pass.
	 */
	async ngOnInit(): Promise<void> {
		try {
			const status = await (this.databaseService as CloudbaseService).getPassphraseLockStatus(this.featureKey);
			this.ngZone.run(() => {
				this.state = status.isSet ? PASSPHRASE_LOCK_STATE_LOCKED : PASSPHRASE_LOCK_STATE_SETUP;
				this.cdr.detectChanges();
			});
		} catch (error: unknown) {
			this.ngZone.run(() => {
				LOG.error(this.className, PASSPHRASE_LOCK_LOG_CALL_FAILED, error as Error);
				this.state = PASSPHRASE_LOCK_STATE_LOCKED;
				this.showError(PASSPHRASE_LOCK_ERROR_GENERIC);
				this.cdr.detectChanges();
			});
		}
	}

	/**
	 * Validates and submits a new passphrase during first-time setup, then emits (unlocked) on success.
	 */
	protected async submitSetup(): Promise<void> {
		if (this.isSubmitting) return;
		if (this.passphraseInput.length < PASSPHRASE_MIN_LENGTH) {
			this.showError(PASSPHRASE_LOCK_ERROR_TOO_SHORT);
			return;
		}
		if (this.passphraseInput !== this.confirmInput) {
			this.showError(PASSPHRASE_LOCK_ERROR_MISMATCH);
			return;
		}

		this.isSubmitting = true;
		try {
			const result = await (this.databaseService as CloudbaseService).setPassphraseLock(
				this.featureKey,
				this.passphraseInput
			);
			this.ngZone.run(() => {
				this.isSubmitting = false;
				if (result.success) {
					this.unlocked.emit();
				} else {
					this.showError(PASSPHRASE_LOCK_ERROR_WRONG);
				}
				this.cdr.detectChanges();
			});
		} catch (error: unknown) {
			this.ngZone.run(() => {
				this.isSubmitting = false;
				LOG.error(this.className, PASSPHRASE_LOCK_LOG_CALL_FAILED, error as Error);
				this.showError(PASSPHRASE_LOCK_ERROR_GENERIC);
				this.cdr.detectChanges();
			});
		}
	}

	/**
	 * Verifies a passphrase attempt against the caller's stored hash, then emits (unlocked) on success.
	 */
	protected async submitUnlock(): Promise<void> {
		if (this.isSubmitting) return;

		this.isSubmitting = true;
		try {
			const result = await (this.databaseService as CloudbaseService).verifyPassphraseLock(
				this.featureKey,
				this.passphraseInput
			);
			this.ngZone.run(() => {
				this.isSubmitting = false;
				if (result.success) {
					this.unlocked.emit();
				} else {
					this.showError(PASSPHRASE_LOCK_ERROR_WRONG);
				}
				this.cdr.detectChanges();
			});
		} catch (error: unknown) {
			this.ngZone.run(() => {
				this.isSubmitting = false;
				LOG.error(this.className, PASSPHRASE_LOCK_LOG_CALL_FAILED, error as Error);
				this.showError(PASSPHRASE_LOCK_ERROR_GENERIC);
				this.cdr.detectChanges();
			});
		}
	}

	/**
	 * Shows an inline error message and briefly triggers the card's shake animation.
	 *
	 * @param message - The error message to display.
	 */
	private showError(message: string): void {
		this.errorMessage = message;
		this.shake = true;
		setTimeout(() => {
			this.shake = false;
		}, 520);
	}
}
