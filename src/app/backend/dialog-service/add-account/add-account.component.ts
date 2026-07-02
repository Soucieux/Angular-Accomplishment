import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { VAULT_NODE_EMAIL, VAULT_NODE_PHONE } from '../../../common/constants';
import {
	DIALOG_BTN_CANCEL,
	VAULT_DIALOG_TITLE,
	VAULT_DIALOG_SUBTITLE,
	VAULT_DIALOG_NAME_LABEL,
	VAULT_DIALOG_NAME_PLACEHOLDER,
	VAULT_DIALOG_CATEGORY_LABEL,
	VAULT_DIALOG_CONNECTIONS_LABEL,
	VAULT_DIALOG_CONNECTIONS_OPTIONAL,
	VAULT_DIALOG_CONNECTIONS_HINT,
	VAULT_DIALOG_CONNECTION_PLACEHOLDER,
	VAULT_DIALOG_ADD_CONNECTION,
	VAULT_DIALOG_SUBMIT,
	VAULT_DIALOG_NEW_CATEGORY,
	VAULT_DIALOG_NEW_CATEGORY_PLACEHOLDER,
	VAULT_DIALOG_VERIFIED_LABEL,
	VAULT_FILTER_EMAIL,
	VAULT_FILTER_PHONE,
	VAULT_FILTER_LINK,
	VAULT_CATEGORY_UNCATEGORIZED_LABEL
} from '../../../common/locale/locale-strings';
import {
	NewAccountData,
	VaultCategoryDef,
	VaultConnectionInput,
	VaultNodeType,
	VAULT_CATEGORY_DEFS,
	VAULT_CATEGORY_OTHER,
	VAULT_CATEGORY_SWATCHES,
	VAULT_CONNECTION_TYPES
} from '../../../fontend/vault/vault.model';

@Component({
	selector: 'add-account-dialog',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [DialogModule, FormsModule, SelectModule],
	templateUrl: './add-account.component.html',
	styleUrl: './add-account.component.scss'
})
export class AddAccountDialogComponent {
	@Output() closed$ = new EventEmitter<void>();

	protected readonly VAULT_DIALOG_TITLE = VAULT_DIALOG_TITLE;
	protected readonly VAULT_DIALOG_SUBTITLE = VAULT_DIALOG_SUBTITLE;
	protected readonly VAULT_DIALOG_NAME_LABEL = VAULT_DIALOG_NAME_LABEL;
	protected readonly VAULT_DIALOG_NAME_PLACEHOLDER = VAULT_DIALOG_NAME_PLACEHOLDER;
	protected readonly VAULT_DIALOG_CATEGORY_LABEL = VAULT_DIALOG_CATEGORY_LABEL;
	protected readonly VAULT_DIALOG_CONNECTIONS_LABEL = VAULT_DIALOG_CONNECTIONS_LABEL;
	protected readonly VAULT_DIALOG_CONNECTIONS_OPTIONAL = VAULT_DIALOG_CONNECTIONS_OPTIONAL;
	protected readonly VAULT_DIALOG_CONNECTIONS_HINT = VAULT_DIALOG_CONNECTIONS_HINT;
	protected readonly VAULT_DIALOG_CONNECTION_PLACEHOLDER = VAULT_DIALOG_CONNECTION_PLACEHOLDER;
	protected readonly VAULT_DIALOG_ADD_CONNECTION = VAULT_DIALOG_ADD_CONNECTION;
	protected readonly VAULT_DIALOG_SUBMIT = VAULT_DIALOG_SUBMIT;
	protected readonly VAULT_DIALOG_NEW_CATEGORY = VAULT_DIALOG_NEW_CATEGORY;
	protected readonly VAULT_DIALOG_NEW_CATEGORY_PLACEHOLDER = VAULT_DIALOG_NEW_CATEGORY_PLACEHOLDER;
	protected readonly VAULT_DIALOG_VERIFIED_LABEL = VAULT_DIALOG_VERIFIED_LABEL;
	protected readonly DIALOG_BTN_CANCEL = DIALOG_BTN_CANCEL;

	protected visible = false;
	protected name = '';
	protected verified = false;
	protected selectedCategoryKey = VAULT_CATEGORY_OTHER.key;
	protected connections: VaultConnectionInput[] = [{ value: '', type: VAULT_NODE_EMAIL }];
	protected existingCategories: VaultCategoryDef[] = [];
	protected showNewCategory = false;
	protected newCategoryName = '';
	protected pendingNewCategory: { label: string; hex: string; gradient: string } | null = null;
	protected isNewSelected = false;
	private submitCallback?: (data: NewAccountData) => void;

	/**
	 * Returns true when the form has a non-empty account name and can be submitted.
	 *
	 * @returns Whether the form is in a submittable state.
	 */
	protected get isValid(): boolean {
		return this.name.trim().length > 0;
	}

	/**
	 * Opens the dialog in add mode, resetting every field to its default and registering
	 * the submit callback invoked with the validated form data.
	 *
	 * @param submitCallback - The callback invoked with the collected account data on submit.
	 */
	public openDialog(
		submitCallback: (data: NewAccountData) => void,
		existingCategories: VaultCategoryDef[]
	): void {
		this.submitCallback = submitCallback;
		this.existingCategories = existingCategories ?? [];
		this.name = '';
		this.verified = false;
		this.selectedCategoryKey = VAULT_CATEGORY_OTHER.key;
		this.connections = [{ value: '', type: VAULT_NODE_EMAIL }];
		this.showNewCategory = false;
		this.newCategoryName = '';
		this.pendingNewCategory = null;
		this.isNewSelected = false;
		this.visible = true;
	}

	/**
	 * Selects the given existing custom category for the new account.
	 *
	 * @param categoryKey - The key of the category to select.
	 */
	protected selectCategory(categoryKey: string): void {
		this.selectedCategoryKey = categoryKey;
		this.isNewSelected = false;
	}

	/**
	 * Selects the freshly created custom category as the account's category.
	 */
	protected selectPendingNewCategory(): void {
		this.isNewSelected = true;
	}

	/**
	 * Opens the inline new-category name input.
	 */
	protected openNewCategory(): void {
		this.showNewCategory = true;
		this.newCategoryName = '';
	}

	/**
	 * Commits the inline new category: assigns a random color swatch, selects it, and
	 * closes the input. An empty name simply cancels.
	 */
	protected commitNewCategory(): void {
		const label = this.newCategoryName.trim();
		this.showNewCategory = false;
		this.newCategoryName = '';
		if (!label) return;
		const swatch = VAULT_CATEGORY_SWATCHES[Math.floor(Math.random() * VAULT_CATEGORY_SWATCHES.length)];
		this.pendingNewCategory = { label, hex: swatch.hex, gradient: swatch.gradient };
		this.isNewSelected = true;
	}

	/**
	 * Closes the inline new-category input without creating a category.
	 */
	protected cancelNewCategory(): void {
		this.showNewCategory = false;
		this.newCategoryName = '';
	}

	/**
	 * Toggles the new account's verified state.
	 */
	protected toggleVerified(): void {
		this.verified = !this.verified;
	}

	/**
	 * Appends an empty connection input row.
	 */
	protected addConnectionRow(): void {
		this.connections = [...this.connections, { value: '', type: VAULT_NODE_EMAIL }];
	}

	/**
	 * Removes the connection row at the given index, keeping at least one empty row.
	 *
	 * @param index - The index of the connection row to remove.
	 */
	protected removeConnectionRow(index: number): void {
		const remaining = this.connections.filter((_, rowIndex) => rowIndex !== index);
		this.connections = remaining.length > 0 ? remaining : [{ value: '', type: VAULT_NODE_EMAIL }];
	}

	/**
	 * Validates the form, invokes the submit callback with the collected account
	 * data (trimmed name, selected category, and non-empty connections), then closes.
	 */
	protected onSubmit(): void {
		if (!this.isValid) return;
		this.submitCallback?.({
			name: this.name.trim(),
			verified: this.verified,
			category: this.isNewSelected ? '' : this.selectedCategoryKey,
			connections: this.connections
				.map((connection) => ({ value: connection.value.trim(), type: connection.type }))
				.filter((connection) => connection.value.length > 0),
			newCategory: this.isNewSelected && this.pendingNewCategory ? this.pendingNewCategory : undefined
		});
		this.onDialogClosed();
	}

	/**
	 * Closes the dialog and emits the closed event so DialogService can destroy the component.
	 */
	protected onDialogClosed(): void {
		this.visible = false;
		this.closed$.emit();
	}

	/**
	 * Tracks connection rows by their index so @for re-renders only changed rows.
	 *
	 * @param index - The row index supplied by the @for loop.
	 * @returns The index used as the track key.
	 */
	protected trackByIndex(index: number): number {
		return index;
	}

	/**
	 * Gets the selectable category chips — the existing custom categories — each
	 * flagged with whether it is the current selection.
	 *
	 * @returns The category chip view-models.
	 */
	protected get categoryChips(): { key: string; label: string; hex: string; isSelected: boolean }[] {
		return [
			// Uncategorized is the default category, always offered first as a selectable chip.
			{
				key: VAULT_CATEGORY_OTHER.key,
				label: VAULT_CATEGORY_UNCATEGORIZED_LABEL,
				hex: VAULT_CATEGORY_OTHER.hex,
				isSelected: !this.isNewSelected && this.selectedCategoryKey === VAULT_CATEGORY_OTHER.key
			},
			...[...VAULT_CATEGORY_DEFS, ...this.existingCategories].map((categoryDef) => ({
				key: categoryDef.key,
				label: categoryDef.label,
				hex: categoryDef.hex,
				isSelected: !this.isNewSelected && this.selectedCategoryKey === categoryDef.key
			}))
		];
	}

	/**
	 * Gets the localized label for a connection type.
	 *
	 * @param type - The connection node type.
	 * @returns The display label.
	 */
	protected labelForType(type: VaultNodeType): string {
		if (type === VAULT_NODE_EMAIL) return VAULT_FILTER_EMAIL;
		if (type === VAULT_NODE_PHONE) return VAULT_FILTER_PHONE;
		return VAULT_FILTER_LINK;
	}

	/**
	 * Gets the Material Symbols icon for a connection type.
	 *
	 * @param type - The connection node type.
	 * @returns The icon ligature name.
	 */
	protected iconForType(type: VaultNodeType): string {
		const match = VAULT_CONNECTION_TYPES.find((entry) => entry.value === type);
		return match ? match.icon : VAULT_CONNECTION_TYPES[0].icon;
	}

	/**
	 * Gets the connection-type dropdown options (value plus localized label).
	 *
	 * @returns The dropdown option list.
	 */
	protected get connectionTypeOptions(): { value: VaultNodeType; label: string }[] {
		return VAULT_CONNECTION_TYPES.map((entry) => ({
			value: entry.value,
			label: this.labelForType(entry.value)
		}));
	}
}
