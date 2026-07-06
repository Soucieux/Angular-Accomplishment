import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import {
	VAULT_NODE_ACCOUNT,
	VAULT_NODE_EMAIL,
	VAULT_NODE_PHONE,
	VAULT_NODE_NOTES,
	VAULT_GRADIENT_VERIFIED
} from '../../../common/constants';
import {
	DIALOG_BTN_CANCEL,
	DIALOG_BTN_NEXT,
	DIALOG_BTN_BACK,
	VAULT_DIALOG_TITLE,
	VAULT_DIALOG_TITLE_START,
	VAULT_DIALOG_TITLE_IDENTIFIER,
	VAULT_DIALOG_SUBTITLE,
	VAULT_DIALOG_KIND_LABEL,
	VAULT_DIALOG_KIND_ACCOUNT_LABEL,
	VAULT_DIALOG_KIND_ACCOUNT_HINT,
	VAULT_DIALOG_KIND_OTHER_LABEL,
	VAULT_DIALOG_KIND_OTHER_HINT,
	VAULT_DIALOG_TYPE_LABEL,
	VAULT_DIALOG_IDENTIFIER_NAME_LABEL,
	VAULT_DIALOG_PLACEHOLDER_EMAIL,
	VAULT_DIALOG_PLACEHOLDER_PHONE,
	VAULT_DIALOG_PLACEHOLDER_NOTES,
	VAULT_DIALOG_DUPLICATE_NODE,
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
	VAULT_DIALOG_DUPLICATE_NAME,
	VAULT_CATEGORY_DUPLICATE_NAME,
	VAULT_DIALOG_VERIFIED_LABEL,
	VAULT_FILTER_EMAIL,
	VAULT_FILTER_PHONE,
	VAULT_FILTER_LINK,
	VAULT_FILTER_NOTES
} from '../../../common/locale/locale-strings';
import {
	AddAccountDialogData,
	NewAccountData,
	VaultCategoryDef,
	VaultConnectionInput,
	VaultNodeType,
	VAULT_CATEGORY_OTHER,
	VAULT_CATEGORY_SWATCHES,
	VAULT_CONNECTION_TYPES,
	VAULT_EMAIL_META,
	VAULT_PHONE_META
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

	protected readonly VAULT_DIALOG_SUBTITLE = VAULT_DIALOG_SUBTITLE;
	protected readonly VAULT_DIALOG_KIND_LABEL = VAULT_DIALOG_KIND_LABEL;
	protected readonly VAULT_DIALOG_KIND_ACCOUNT_LABEL = VAULT_DIALOG_KIND_ACCOUNT_LABEL;
	protected readonly VAULT_DIALOG_KIND_ACCOUNT_HINT = VAULT_DIALOG_KIND_ACCOUNT_HINT;
	protected readonly VAULT_DIALOG_KIND_OTHER_LABEL = VAULT_DIALOG_KIND_OTHER_LABEL;
	protected readonly VAULT_DIALOG_KIND_OTHER_HINT = VAULT_DIALOG_KIND_OTHER_HINT;
	protected readonly VAULT_DIALOG_TYPE_LABEL = VAULT_DIALOG_TYPE_LABEL;
	protected readonly VAULT_DIALOG_IDENTIFIER_NAME_LABEL = VAULT_DIALOG_IDENTIFIER_NAME_LABEL;
	protected readonly VAULT_DIALOG_DUPLICATE_NODE = VAULT_DIALOG_DUPLICATE_NODE;
	protected readonly DIALOG_BTN_NEXT = DIALOG_BTN_NEXT;
	protected readonly DIALOG_BTN_BACK = DIALOG_BTN_BACK;
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
	protected readonly VAULT_DIALOG_DUPLICATE_NAME = VAULT_DIALOG_DUPLICATE_NAME;
	protected readonly VAULT_CATEGORY_DUPLICATE_NAME = VAULT_CATEGORY_DUPLICATE_NAME;
	protected readonly VAULT_DIALOG_VERIFIED_LABEL = VAULT_DIALOG_VERIFIED_LABEL;
	protected readonly DIALOG_BTN_CANCEL = DIALOG_BTN_CANCEL;

	protected visible = false;
	// Wizard step: 1 = pick account / non-account kind, 2 = the (full or partial) form.
	protected step = 1;
	// Whether the account kind is chosen on step 1 — drives which fields step 2 shows.
	protected isAccountKind = true;
	// Resolved primary node type: 'account' for the account kind, else the chosen identifier type.
	protected nodeType: VaultNodeType = VAULT_NODE_ACCOUNT;
	protected name = '';
	protected verified = false;
	protected selectedCategoryKeys = new Set<string>();
	protected connections: VaultConnectionInput[] = [{ value: '', type: VAULT_NODE_EMAIL }];
	protected existingCategories: VaultCategoryDef[] = [];
	// Trimmed, lowercased names of existing accounts — used to reject a duplicate before submit.
	private existingNames = new Set<string>();
	protected showNewCategory = false;
	protected newCategoryName = '';
	protected pendingNewCategory: { label: string; hex: string; gradient: string } | null = null;
	private submitCallback?: (data: NewAccountData) => void;

	/**
	 * Returns true when the form has a non-empty, non-duplicate account name and can be submitted.
	 *
	 * @returns Whether the form is in a submittable state.
	 */
	protected get isValid(): boolean {
		return this.name.trim().length > 0 && !this.isDuplicateName;
	}

	/**
	 * Returns true when the entered name matches an existing account (trimmed, case-insensitive),
	 * so the inline duplicate warning shows and submit is blocked.
	 *
	 * @returns Whether the current name duplicates an existing account.
	 */
	protected get isDuplicateName(): boolean {
		const nameKey = this.name.trim().toLowerCase();
		return nameKey.length > 0 && this.existingNames.has(nameKey);
	}

	/**
	 * Returns true when the typed new-category name matches an existing category or the pending new
	 * one (trimmed, case-insensitive), so the inline warning shows and the category is not created.
	 *
	 * @returns Whether the new-category name duplicates an existing category.
	 */
	protected get isDuplicateCategory(): boolean {
		const nameKey = this.newCategoryName.trim().toLowerCase();
		if (!nameKey) return false;
		return (
			this.existingCategories.some(
				(categoryDef) => categoryDef.categoryLabel.trim().toLowerCase() === nameKey
			) || this.pendingNewCategory?.label.trim().toLowerCase() === nameKey
		);
	}

	/**
	 * Opens the dialog in add mode, resetting every field to its default and registering
	 * the submit callback invoked with the validated form data.
	 *
	 * @param submitCallback - The callback invoked with the collected account data on submit.
	 * @param dialogData - The assignable categories plus existing account names used to reject duplicates.
	 */
	public openDialog(
		submitCallback: (data: NewAccountData) => void,
		dialogData: AddAccountDialogData
	): void {
		this.submitCallback = submitCallback;
		this.existingCategories = dialogData.categories ?? [];
		this.existingNames = new Set(
			(dialogData.existingNames ?? []).map((existingName) => existingName.trim().toLowerCase())
		);
		this.step = 1;
		this.isAccountKind = true;
		this.nodeType = VAULT_NODE_ACCOUNT;
		this.name = '';
		this.verified = false;
		this.selectedCategoryKeys = new Set<string>();
		this.connections = [{ value: '', type: VAULT_NODE_EMAIL }];
		this.showNewCategory = false;
		this.newCategoryName = '';
		this.pendingNewCategory = null;
		this.visible = true;
	}

	/**
	 * Selects the node kind on step 1: the account kind, or the non-account kind (which defaults its
	 * primary type to email so the step-2 type dropdown starts on a real identifier type).
	 *
	 * @param isAccount - Whether the account kind was chosen.
	 */
	protected selectKind(isAccount: boolean): void {
		this.isAccountKind = isAccount;
		this.nodeType = isAccount ? VAULT_NODE_ACCOUNT : VAULT_NODE_EMAIL;
	}

	/**
	 * Advances the wizard from the step-1 kind chooser to the step-2 form.
	 */
	protected goToForm(): void {
		this.step = 2;
	}

	/**
	 * Navigates the wizard back to the step-1 kind chooser, keeping entered form values intact.
	 */
	protected goBack(): void {
		this.step = 1;
	}

	/**
	 * Toggles the given existing custom category on or off for the new account. Leaving every
	 * category off submits the account as Uncategorized.
	 *
	 * @param categoryKey - The key of the category to toggle.
	 */
	protected toggleCategory(categoryKey: string): void {
		if (this.selectedCategoryKeys.has(categoryKey)) {
			this.selectedCategoryKeys.delete(categoryKey);
		} else {
			this.selectedCategoryKeys.add(categoryKey);
		}
	}

	/**
	 * Discards the freshly created custom category so it is no longer attached to the account.
	 */
	protected clearPendingNewCategory(): void {
		this.pendingNewCategory = null;
	}

	/**
	 * Opens the inline new-category name input.
	 */
	protected openNewCategory(): void {
		this.showNewCategory = true;
		this.newCategoryName = '';
	}

	/**
	 * Commits the inline new category: assigns a unique random color swatch, selects it, and closes
	 * the input. An empty name cancels; a duplicate name keeps the input open so its warning shows.
	 */
	protected commitNewCategory(): void {
		const label = this.newCategoryName.trim();
		if (!label) {
			this.cancelNewCategory();
			return;
		}
		if (this.isDuplicateCategory) return;
		this.showNewCategory = false;
		this.newCategoryName = '';
		const swatch = this.pickUniqueSwatch();
		this.pendingNewCategory = { label, hex: swatch.hex, gradient: swatch.gradient };
	}

	/**
	 * Picks a color swatch not already used by an existing category or by the graph legend (account,
	 * email, phone, verified), so each category keeps a unique color that can't be mistaken for a
	 * node-type swatch. Falls back to a fully random swatch only when every swatch is already taken.
	 *
	 * @returns The chosen swatch (hex plus gradient).
	 */
	private pickUniqueSwatch(): { hex: string; gradient: string } {
		const used = new Set(this.existingCategories.map((categoryDef) => categoryDef.hex));
		if (this.pendingNewCategory) used.add(this.pendingNewCategory.hex);
		// Gradients whose colors the legend already shows — skip any swatch that reuses one so its
		// category chip can't be confused with an account / email / phone / verified swatch.
		const legendGradients = [
			VAULT_CATEGORY_OTHER.gradient,
			VAULT_EMAIL_META.gradient,
			VAULT_PHONE_META.gradient,
			VAULT_GRADIENT_VERIFIED
		];
		const available = VAULT_CATEGORY_SWATCHES.filter(
			(swatch) =>
				!used.has(swatch.hex) &&
				!legendGradients.some(
					(gradient) => gradient === swatch.gradient || gradient.includes(swatch.hex)
				)
		);
		const pool = available.length > 0 ? available : VAULT_CATEGORY_SWATCHES;
		return pool[Math.floor(Math.random() * pool.length)];
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
			nodeType: this.isAccountKind ? VAULT_NODE_ACCOUNT : this.nodeType,
			name: this.name.trim(),
			verified: this.isAccountKind ? this.verified : false,
			categories: this.isAccountKind ? [...this.selectedCategoryKeys] : [],
			connections: this.connections
				.map((connection) => ({ value: connection.value.trim(), type: connection.type }))
				.filter((connection) => connection.value.length > 0),
			newCategory: this.isAccountKind ? (this.pendingNewCategory ?? undefined) : undefined
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
	 * Gets the dialog header title for the current step: the start prompt on the kind chooser, the
	 * account title on the account step, or the identifier title on the non-account step.
	 *
	 * @returns The localized header title.
	 */
	protected get headerTitle(): string {
		if (this.step === 1) return VAULT_DIALOG_TITLE_START;
		return this.isAccountKind ? VAULT_DIALOG_TITLE : VAULT_DIALOG_TITLE_IDENTIFIER;
	}

	/**
	 * Gets the non-account name placeholder matching the currently selected identifier type.
	 *
	 * @returns The localized placeholder for the selected type.
	 */
	protected get identifierPlaceholder(): string {
		if (this.nodeType === VAULT_NODE_PHONE) return VAULT_DIALOG_PLACEHOLDER_PHONE;
		if (this.nodeType === VAULT_NODE_NOTES) return VAULT_DIALOG_PLACEHOLDER_NOTES;
		return VAULT_DIALOG_PLACEHOLDER_EMAIL;
	}

	/**
	 * Gets the toggleable category chips — the preset and custom categories — each with its icon and
	 * flagged with whether it is currently selected. Selecting none submits the account as Uncategorized.
	 *
	 * @returns The category chip view-models.
	 */
	protected get categoryChips(): { key: string; label: string; icon: string; hex: string; isSelected: boolean }[] {
		return this.existingCategories.map((categoryDef) => ({
			key: categoryDef.key,
			label: categoryDef.categoryLabel,
			icon: categoryDef.icon,
			hex: categoryDef.hex,
			isSelected: this.selectedCategoryKeys.has(categoryDef.key)
		}));
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
		if (type === VAULT_NODE_NOTES) return VAULT_FILTER_NOTES;
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
