import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import {
	DIALOG_BTN_CANCEL,
	DIALOG_BTN_DELETE,
	DIALOG_BTN_SAVE,
	VAULT_DIALOG_CATEGORY_NAME_LABEL,
	VAULT_DIALOG_NEW_CATEGORY_PLACEHOLDER,
	VAULT_EDIT_CATEGORY_TITLE
} from '../../../common/locale/locale-strings';
import { EditVaultCategoryData } from '../../../fontend/vault/vault.model';
import { VaultIconPickerComponent } from '../vault-icon-picker/vault-icon-picker.component';

@Component({
	selector: 'edit-vault-category-dialog',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [DialogModule, FormsModule, VaultIconPickerComponent],
	templateUrl: './edit-vault-category.component.html',
	styleUrl: './edit-vault-category.component.scss'
})
export class EditVaultCategoryDialogComponent {
	@Output() closed$ = new EventEmitter<void>();

	protected readonly VAULT_EDIT_CATEGORY_TITLE = VAULT_EDIT_CATEGORY_TITLE;
	protected readonly VAULT_DIALOG_CATEGORY_NAME_LABEL = VAULT_DIALOG_CATEGORY_NAME_LABEL;
	protected readonly VAULT_DIALOG_NEW_CATEGORY_PLACEHOLDER = VAULT_DIALOG_NEW_CATEGORY_PLACEHOLDER;
	protected readonly DIALOG_BTN_CANCEL = DIALOG_BTN_CANCEL;
	protected readonly DIALOG_BTN_SAVE = DIALOG_BTN_SAVE;
	protected readonly DIALOG_BTN_DELETE = DIALOG_BTN_DELETE;

	protected visible = false;
	protected name = '';
	protected icon = '';
	private submitCallback?: (data: EditVaultCategoryData) => void;
	protected deleteCallback?: () => void;

	// ── Dialog lifecycle ─────────────────────────────────────────────────────

	/**
	 * Opens the dialog prefilled with the category's current name and icon, so the user edits existing values
	 * rather than starting blank. Stores the submit callback and optional delete callback.
	 *
	 * @param submitCallback - The callback invoked with the edited label and icon on submit.
	 * @param options - The category's current name and icon, plus an optional delete callback.
	 * @param options.name - The category's current display name, prefilled into the name field.
	 * @param options.icon - The category's current icon, prefilled into the icon picker.
	 * @param options.onDelete - Optional callback invoked when the user triggers deletion.
	 */
	public openDialog(
		submitCallback: (data: EditVaultCategoryData) => void,
		options: { name: string; icon: string; onDelete?: () => void }
	): void {
		this.submitCallback = submitCallback;
		this.deleteCallback = options.onDelete;
		this.name = options.name;
		this.icon = options.icon;
		this.visible = true;
	}

	/**
	 * Closes the dialog and emits the closed event so DialogService can
	 * destroy the component and remove it from the open-dialogs map.
	 */
	protected onDialogClosed(): void {
		this.visible = false;
		this.closed$.emit();
	}

	// ── User action handlers ─────────────────────────────────────────────────

	/**
	 * Validates the form, closes the dialog, then invokes the submit callback with the edited label and icon.
	 */
	protected onSubmit(): void {
		if (!this.isValid) return;
		this.onDialogClosed();
		this.submitCallback?.({ label: this.name.trim(), icon: this.icon });
	}

	/**
	 * Closes the dialog first so it is dismissed before the caller opens the
	 * confirm dialog, then invokes the delete callback.
	 */
	protected onDeleteRequested(): void {
		this.onDialogClosed();
		this.deleteCallback?.();
	}

	// ── Template helpers ──────────────────────────────────────────────────────

	/**
	 * Returns true when the name field contains at least one non-whitespace character.
	 *
	 * @returns Whether the form is in a submittable state.
	 */
	protected get isValid(): boolean {
		return this.name.trim().length > 0;
	}
}
