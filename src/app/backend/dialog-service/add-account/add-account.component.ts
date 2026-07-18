import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { Utilities } from '../../../common/utilities/app.utilities';
import {
	VAULT_NODE_ACCOUNT,
	VAULT_NODE_EMAIL,
	VAULT_NODE_PHONE,
	VAULT_NODE_NOTES,
	VAULT_GRADIENT_VERIFIED,
	VAULT_DIALOG_KIND_ACCOUNT,
	VAULT_DIALOG_KIND_OTHER,
	VAULT_DIALOG_KIND_CATEGORY
} from '../../../common/constants';
import {
	DIALOG_BTN_CANCEL,
	DIALOG_BTN_NEXT,
	DIALOG_BTN_BACK,
	VAULT_DIALOG_TITLE,
	VAULT_DIALOG_TITLE_START,
	VAULT_DIALOG_TITLE_IDENTIFIER_EMAIL,
	VAULT_DIALOG_TITLE_IDENTIFIER_PHONE,
	VAULT_DIALOG_TITLE_CATEGORY,
	VAULT_DIALOG_SUBTITLE,
	VAULT_DIALOG_KIND_LABEL,
	VAULT_DIALOG_KIND_ACCOUNT_LABEL,
	VAULT_DIALOG_KIND_ACCOUNT_HINT,
	VAULT_DIALOG_KIND_OTHER_LABEL,
	VAULT_DIALOG_KIND_OTHER_HINT,
	VAULT_DIALOG_KIND_CATEGORY_LABEL,
	VAULT_DIALOG_KIND_CATEGORY_HINT,
	VAULT_DIALOG_TYPE_LABEL,
	VAULT_DIALOG_PLACEHOLDER_EMAIL,
	VAULT_DIALOG_PLACEHOLDER_PHONE,
	VAULT_DIALOG_DUPLICATE_NODE,
	VAULT_DIALOG_NAME_LABEL,
	VAULT_DIALOG_NAME_PLACEHOLDER,
	VAULT_DIALOG_CATEGORY_LABEL,
	VAULT_DIALOG_CATEGORY_NAME_LABEL,
	VAULT_DIALOG_CONNECTIONS_LABEL,
	VAULT_DIALOG_CONNECTIONS_HINT,
	VAULT_DIALOG_CONNECTION_PLACEHOLDER,
	VAULT_DIALOG_ADD_CONNECTION,
	VAULT_DIALOG_BACKUPS_LABEL,
	VAULT_DIALOG_BACKUPS_HINT,
	VAULT_DIALOG_BACKUP_PLACEHOLDER,
	VAULT_DIALOG_ADD_BACKUP,
	VAULT_DIALOG_SUBMIT,
	VAULT_DIALOG_SUBMIT_CATEGORY,
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
	AddAccountDialogSubmitData,
	VaultCategoryDef,
	VaultConnectionInput,
	VaultDialogKind,
	VaultNodeType,
	VAULT_BACKUP_CONNECTION_TYPES,
	VAULT_CATEGORY_OTHER,
	VAULT_CATEGORY_SWATCHES,
	VAULT_CONNECTION_TYPES,
	VAULT_EMAIL_META,
	VAULT_PHONE_META
} from '../../../fontend/vault/vault.model';
import { VAULT_ICON_OPTIONS } from '../../../fontend/vault/vault-category-icons.data';
import { VaultIconPickerComponent } from '../vault-icon-picker/vault-icon-picker.component';
import { VaultNodeNameFieldComponent } from '../vault-node-name-field/vault-node-name-field.component';
import { VaultConnectionRowsComponent } from '../vault-connection-rows/vault-connection-rows.component';

@Component({
	selector: 'add-account-dialog',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		DialogModule,
		FormsModule,
		SelectModule,
		VaultIconPickerComponent,
		VaultNodeNameFieldComponent,
		VaultConnectionRowsComponent
	],
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
	protected readonly VAULT_DIALOG_KIND_CATEGORY_LABEL = VAULT_DIALOG_KIND_CATEGORY_LABEL;
	protected readonly VAULT_DIALOG_KIND_CATEGORY_HINT = VAULT_DIALOG_KIND_CATEGORY_HINT;
	protected readonly VAULT_DIALOG_TYPE_LABEL = VAULT_DIALOG_TYPE_LABEL;
	protected readonly VAULT_DIALOG_DUPLICATE_NODE = VAULT_DIALOG_DUPLICATE_NODE;
	protected readonly DIALOG_BTN_NEXT = DIALOG_BTN_NEXT;
	protected readonly DIALOG_BTN_BACK = DIALOG_BTN_BACK;
	protected readonly VAULT_DIALOG_NAME_LABEL = VAULT_DIALOG_NAME_LABEL;
	protected readonly VAULT_DIALOG_NAME_PLACEHOLDER = VAULT_DIALOG_NAME_PLACEHOLDER;
	protected readonly VAULT_DIALOG_CATEGORY_LABEL = VAULT_DIALOG_CATEGORY_LABEL;
	protected readonly VAULT_DIALOG_CATEGORY_NAME_LABEL = VAULT_DIALOG_CATEGORY_NAME_LABEL;
	protected readonly VAULT_DIALOG_SUBMIT = VAULT_DIALOG_SUBMIT;
	protected readonly VAULT_DIALOG_SUBMIT_CATEGORY = VAULT_DIALOG_SUBMIT_CATEGORY;
	protected readonly VAULT_DIALOG_NEW_CATEGORY = VAULT_DIALOG_NEW_CATEGORY;
	protected readonly VAULT_DIALOG_NEW_CATEGORY_PLACEHOLDER = VAULT_DIALOG_NEW_CATEGORY_PLACEHOLDER;
	protected readonly VAULT_DIALOG_DUPLICATE_NAME = VAULT_DIALOG_DUPLICATE_NAME;
	protected readonly VAULT_CATEGORY_DUPLICATE_NAME = VAULT_CATEGORY_DUPLICATE_NAME;
	protected readonly VAULT_DIALOG_VERIFIED_LABEL = VAULT_DIALOG_VERIFIED_LABEL;
	protected readonly DIALOG_BTN_CANCEL = DIALOG_BTN_CANCEL;
	protected readonly VAULT_DIALOG_KIND_ACCOUNT = VAULT_DIALOG_KIND_ACCOUNT;
	protected readonly VAULT_DIALOG_KIND_OTHER = VAULT_DIALOG_KIND_OTHER;
	protected readonly VAULT_DIALOG_KIND_CATEGORY = VAULT_DIALOG_KIND_CATEGORY;

	protected visible = false;
	// Wizard step: 1 = pick account / non-account / category kind, 2 = the (full or partial) form.
	protected step = 1;
	// Chosen node kind on step 1 — drives which fields step 2 shows.
	protected kind: VaultDialogKind = VAULT_DIALOG_KIND_ACCOUNT;
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
	protected pendingNewCategory: { label: string; hex: string; gradient: string; icon: string } | null = null;
	protected selectedIcon = '';
	// Computed once — VAULT_CONNECTION_TYPES/VAULT_BACKUP_CONNECTION_TYPES never change for the dialog's lifetime.
	protected readonly connectionTypeOptions: { value: VaultNodeType; label: string }[] = VAULT_CONNECTION_TYPES.map(
		(entry) => ({ value: entry.value, label: this.labelForType(entry.value) })
	);
	protected readonly identifierTypeOptions: { value: VaultNodeType; label: string }[] =
		VAULT_BACKUP_CONNECTION_TYPES.map((entry) => ({ value: entry.value, label: this.labelForType(entry.value) }));
	private submitCallback?: (data: AddAccountDialogSubmitData) => void | Promise<void>;

	// ── Dialog lifecycle ─────────────────────────────────────────────────────

	/**
	 * Opens the dialog in add mode, resetting every field to its default and registering
	 * the submit callback invoked with the validated form data.
	 *
	 * @param submitCallback - The callback invoked with the collected account or category data on submit.
	 * @param dialogData - The assignable categories plus existing account names used to reject duplicates.
	 */
	public openDialog(
		submitCallback: (data: AddAccountDialogSubmitData) => void | Promise<void>,
		dialogData: AddAccountDialogData
	): void {
		this.submitCallback = submitCallback;
		this.existingCategories = dialogData.categories ?? [];
		this.existingNames = new Set(
			(dialogData.existingNames ?? []).map((existingName) => existingName.trim().toLowerCase())
		);
		this.step = 1;
		this.kind = VAULT_DIALOG_KIND_ACCOUNT;
		this.nodeType = VAULT_NODE_ACCOUNT;
		this.name = '';
		this.verified = false;
		this.selectedCategoryKeys = new Set<string>();
		this.connections = [{ value: '', type: VAULT_NODE_EMAIL }];
		this.showNewCategory = false;
		this.newCategoryName = '';
		this.pendingNewCategory = null;
		this.selectedIcon = '';
		this.visible = true;
	}

	/**
	 * Selects the node kind on step 1: the account kind, the non-account kind (which defaults its
	 * primary type to email so the step-2 type dropdown starts on a real identifier type), or the
	 * standalone category kind.
	 *
	 * @param kind - The chosen step-1 kind.
	 */
	protected selectKind(kind: VaultDialogKind): void {
		this.kind = kind;
		if (kind !== VAULT_DIALOG_KIND_CATEGORY) {
			this.nodeType = kind === VAULT_DIALOG_KIND_ACCOUNT ? VAULT_NODE_ACCOUNT : VAULT_NODE_EMAIL;
		}
	}

	/**
	 * Advances the wizard from the step-1 kind chooser to the step-2 form, resetting the category-step
	 * fields (name and default icon) when the category kind was chosen.
	 */
	protected goToForm(): void {
		this.step = 2;
		if (this.kind === VAULT_DIALOG_KIND_CATEGORY) {
			this.newCategoryName = '';
			this.selectedIcon = this.pickUniqueIcon();
		}
	}

	/**
	 * Navigates the wizard back to the step-1 kind chooser, keeping entered form values intact.
	 */
	protected goBack(): void {
		this.step = 1;
	}

	/**
	 * Closes the dialog and emits the closed event so DialogService can destroy the component.
	 */
	protected onDialogClosed(): void {
		this.visible = false;
		this.closed$.emit();
	}

	// ── Category management ──────────────────────────────────────────────────

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
	 * Opens the inline new-category name input and defaults its icon to one not already in use.
	 */
	protected openNewCategory(): void {
		this.showNewCategory = true;
		this.newCategoryName = '';
		this.selectedIcon = this.pickUniqueIcon();
	}

	/**
	 * Commits the inline new category: assigns a unique random color swatch, keeps the selected icon,
	 * and closes the input. An empty name cancels; a duplicate name keeps the input open so its warning shows.
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
		this.pendingNewCategory = { label, hex: swatch.hex, gradient: swatch.gradient, icon: this.selectedIcon };
	}

	/**
	 * Closes the inline new-category input without creating a category, clearing the selected icon too.
	 */
	protected cancelNewCategory(): void {
		this.showNewCategory = false;
		this.newCategoryName = '';
		this.selectedIcon = '';
	}

	// ── Form submission ───────────────────────────────────────────────────────

	/**
	 * Toggles the new account's verified state.
	 */
	protected toggleVerified(): void {
		this.verified = !this.verified;
	}

	/**
	 * Validates the form, invokes the submit callback with the collected account, identifier, or
	 * standalone-category data (trimmed name, selected category, and non-empty connections), then closes.
	 */
	protected async onSubmit(): Promise<void> {
		if (!this.isValid) return;

		let payload: AddAccountDialogSubmitData;
		if (this.kind === VAULT_DIALOG_KIND_CATEGORY) {
			const swatch = this.pickUniqueSwatch();
			payload = {
				kind: VAULT_DIALOG_KIND_CATEGORY,
				label: this.newCategoryName.trim(),
				hex: swatch.hex,
				gradient: swatch.gradient,
				icon: this.selectedIcon
			};
		} else {
			const isAccount = this.kind === VAULT_DIALOG_KIND_ACCOUNT;
			payload = {
				kind: isAccount ? VAULT_DIALOG_KIND_ACCOUNT : VAULT_DIALOG_KIND_OTHER,
				nodeType: isAccount ? VAULT_NODE_ACCOUNT : this.nodeType,
				name: this.name.trim(),
				verified: isAccount ? this.verified : false,
				categories: isAccount ? [...this.selectedCategoryKeys] : [],
				connections: this.connections
					.map((connection) => ({ value: connection.value.trim(), type: connection.type }))
					.filter((connection) => connection.value.length > 0),
				newCategory: isAccount ? (this.pendingNewCategory ?? undefined) : undefined
			};
		}

		/* Await the caller's work so the dialog stays open under the blocking overlay and both close
		   together when the save settles (consistent with the undo flow). finally guarantees the
		   dialog still closes even if submitCallback throws — never leaves it stuck open. */
		try {
			await this.submitCallback?.(payload);
		} finally {
			this.onDialogClosed();
		}
	}

	// ── Private helpers ───────────────────────────────────────────────────────

	/**
	 * Picks a color swatch not already used by an existing category or by the graph legend (account,
	 * email, phone, verified), so each category keeps a unique color that can't be mistaken for a
	 * node-type swatch. Falls back to a fully random swatch only when every swatch is already taken.
	 *
	 * {@link commitNewCategory} - Assigns a swatch when the inline category is committed.
	 * {@link onSubmit} - Assigns a swatch when a standalone category is submitted.
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
		return Utilities.pickRandomElement(pool);
	}

	/**
	 * Picks an icon not already used by an existing category, so a new category's icon reads distinctly at a glance.
	 * Falls back to the full icon pool only if every option is already taken.
	 *
	 * {@link goToForm} - Defaults the category-step icon when advancing the wizard.
	 * {@link openNewCategory} - Defaults the icon when opening the inline new-category input.
	 *
	 * @returns The chosen icon's Material Symbols ligature name.
	 */
	private pickUniqueIcon(): string {
		const used = new Set(this.existingCategories.map((categoryDef) => categoryDef.icon));
		const available = VAULT_ICON_OPTIONS.filter((option) => !used.has(option.name));
		const pool = available.length > 0 ? available : VAULT_ICON_OPTIONS;
		return Utilities.pickRandomElement(pool).name;
	}

	// ── Template helpers ──────────────────────────────────────────────────────

	/**
	 * Returns true when the current step-2 form can be submitted: a non-empty, non-duplicate category
	 * name for the category kind, or a non-empty, non-duplicate account/identifier name otherwise.
	 *
	 * @returns Whether the form is in a submittable state.
	 */
	protected get isValid(): boolean {
		if (this.kind === VAULT_DIALOG_KIND_CATEGORY) {
			return this.newCategoryName.trim().length > 0 && !this.isDuplicateCategory;
		}
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
	 * Gets the dialog header title for the current step: the start prompt on the kind chooser, the
	 * account title on the account step, the category title on the category step, or the identifier
	 * title matching the selected type (email/phone) on the non-account step.
	 *
	 * @returns The localized header title.
	 */
	protected get headerTitle(): string {
		if (this.step === 1) return VAULT_DIALOG_TITLE_START;
		if (this.kind === VAULT_DIALOG_KIND_ACCOUNT) return VAULT_DIALOG_TITLE;
		if (this.kind === VAULT_DIALOG_KIND_CATEGORY) return VAULT_DIALOG_TITLE_CATEGORY;
		return this.nodeType === VAULT_NODE_PHONE ? VAULT_DIALOG_TITLE_IDENTIFIER_PHONE : VAULT_DIALOG_TITLE_IDENTIFIER_EMAIL;
	}

	/**
	 * Gets the non-account name placeholder matching the currently selected identifier type. The
	 * non-account primary type is restricted to email/phone (identifierTypeOptions), so notes is never
	 * a reachable value here.
	 *
	 * @returns The localized placeholder for the selected type.
	 */
	protected get identifierPlaceholder(): string {
		return this.nodeType === VAULT_NODE_PHONE ? VAULT_DIALOG_PLACEHOLDER_PHONE : VAULT_DIALOG_PLACEHOLDER_EMAIL;
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
	 * Gets the footer submit button label for the current step-2 kind.
	 *
	 * @returns The localized submit label.
	 */
	protected get submitLabel(): string {
		return this.kind === VAULT_DIALOG_KIND_CATEGORY ? VAULT_DIALOG_SUBMIT_CATEGORY : VAULT_DIALOG_SUBMIT;
	}

	/**
	 * Gets the copy and type options for the shared connections/backups row list, switching between
	 * the account-kind wording ("connections") and the non-account-kind wording ("backups").
	 *
	 * @returns The section label, hint, add-button label, row placeholder, and type options to bind.
	 */
	protected get connectionRowsCopy(): {
		label: string;
		hint: string;
		addLabel: string;
		placeholder: string;
		typeOptions: { value: VaultNodeType; label: string }[];
	} {
		const isAccount = this.kind === VAULT_DIALOG_KIND_ACCOUNT;
		return {
			label: isAccount ? VAULT_DIALOG_CONNECTIONS_LABEL : VAULT_DIALOG_BACKUPS_LABEL,
			hint: isAccount ? VAULT_DIALOG_CONNECTIONS_HINT : VAULT_DIALOG_BACKUPS_HINT,
			addLabel: isAccount ? VAULT_DIALOG_ADD_CONNECTION : VAULT_DIALOG_ADD_BACKUP,
			placeholder: isAccount ? VAULT_DIALOG_CONNECTION_PLACEHOLDER : VAULT_DIALOG_BACKUP_PLACEHOLDER,
			typeOptions: isAccount ? this.connectionTypeOptions : this.identifierTypeOptions
		};
	}
}
