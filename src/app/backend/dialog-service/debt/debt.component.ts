import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import {
	DEBT_CATEGORY_CARD,
	DEBT_CATEGORY_HOME,
	DEBT_CATEGORY_PERSON,
	DEBT_CATEGORY_SHOPPING,
	DEBT_CURRENCY_CAD,
	DEBT_CURRENCY_CNY,
	DEBT_DIALOG_LABEL_ADD,
	DEBT_DIALOG_LABEL_BALANCE,
	DEBT_DIALOG_LABEL_CANCEL,
	DEBT_DIALOG_LABEL_CURRENCY_CAD,
	DEBT_DIALOG_LABEL_CURRENCY_CNY,
	DEBT_DIALOG_LABEL_EDIT,
	DEBT_DIALOG_LABEL_PERMANENT,
	DEBT_DIALOG_LABEL_PERMANENT_DESC,
	DEBT_DIALOG_LABEL_SAVE,
	DEBT_DIALOG_PLACEHOLDER_AMOUNT,
	DEBT_DIALOG_PLACEHOLDER_NAME,
	DEBT_DIALOG_TITLE,
	DEBT_CATEGORY_LABEL_CARD,
	DEBT_CATEGORY_LABEL_PERSON,
	DEBT_CATEGORY_LABEL_SHOPPING,
	DEBT_CATEGORY_LABEL_HOME,
	DEBT_CATEGORY_ICON_CARD,
	DEBT_CATEGORY_ICON_PERSON,
	DEBT_CATEGORY_ICON_SHOPPING,
	DEBT_CATEGORY_ICON_HOME,
	DEBT_CATEGORY_GRADIENT_CARD,
	DEBT_CATEGORY_GRADIENT_PERSON,
	DEBT_CATEGORY_GRADIENT_SHOPPING,
	DEBT_CATEGORY_GRADIENT_HOME
} from '../../../common/app.constant';
import { DebtCategoryDef, NewDebtData } from '../../../fontend/debt/debt.model';

@Component({
	selector: 'add-debt-dialog',
	standalone: true,
	imports: [DialogModule, FormsModule],
	templateUrl: './debt.component.html',
	styleUrl: './debt.component.scss'
})
export class AddDebtDialogComponent {
	@Output() closed$ = new EventEmitter<void>();

	protected readonly DEBT_DIALOG_TITLE = DEBT_DIALOG_TITLE;
	protected readonly DEBT_DIALOG_PLACEHOLDER_NAME = DEBT_DIALOG_PLACEHOLDER_NAME;
	protected readonly DEBT_DIALOG_PLACEHOLDER_AMOUNT = DEBT_DIALOG_PLACEHOLDER_AMOUNT;
	protected readonly DEBT_DIALOG_LABEL_EDIT = DEBT_DIALOG_LABEL_EDIT;
	protected readonly DEBT_DIALOG_LABEL_ADD = DEBT_DIALOG_LABEL_ADD;
	protected readonly DEBT_DIALOG_LABEL_SAVE = DEBT_DIALOG_LABEL_SAVE;
	protected readonly DEBT_DIALOG_LABEL_BALANCE = DEBT_DIALOG_LABEL_BALANCE;
	protected readonly DEBT_DIALOG_LABEL_CANCEL = DEBT_DIALOG_LABEL_CANCEL;
	protected readonly DEBT_DIALOG_LABEL_PERMANENT = DEBT_DIALOG_LABEL_PERMANENT;
	protected readonly DEBT_DIALOG_LABEL_PERMANENT_DESC = DEBT_DIALOG_LABEL_PERMANENT_DESC;
	protected readonly DEBT_DIALOG_LABEL_CURRENCY_CNY = DEBT_DIALOG_LABEL_CURRENCY_CNY;
	protected readonly DEBT_DIALOG_LABEL_CURRENCY_CAD = DEBT_DIALOG_LABEL_CURRENCY_CAD;
	protected readonly DEBT_CURRENCY_CNY = DEBT_CURRENCY_CNY;
	protected readonly DEBT_CURRENCY_CAD = DEBT_CURRENCY_CAD;
	protected readonly categoryOptions: DebtCategoryDef[] = [
		{
			key: DEBT_CATEGORY_CARD,
			icon: DEBT_CATEGORY_ICON_CARD,
			label: DEBT_CATEGORY_LABEL_CARD,
			gradient: DEBT_CATEGORY_GRADIENT_CARD
		},
		{
			key: DEBT_CATEGORY_PERSON,
			icon: DEBT_CATEGORY_ICON_PERSON,
			label: DEBT_CATEGORY_LABEL_PERSON,
			gradient: DEBT_CATEGORY_GRADIENT_PERSON
		},
		{
			key: DEBT_CATEGORY_SHOPPING,
			icon: DEBT_CATEGORY_ICON_SHOPPING,
			label: DEBT_CATEGORY_LABEL_SHOPPING,
			gradient: DEBT_CATEGORY_GRADIENT_SHOPPING
		},
		{
			key: DEBT_CATEGORY_HOME,
			icon: DEBT_CATEGORY_ICON_HOME,
			label: DEBT_CATEGORY_LABEL_HOME,
			gradient: DEBT_CATEGORY_GRADIENT_HOME
		}
	];

	protected isEditMode = false;
	protected visible = false;
	protected name = '';
	protected selectedCategoryKey = DEBT_CATEGORY_CARD;
	protected amount = '';
	protected dueDate = '';
	protected selectedCurrency = DEBT_CURRENCY_CNY;
	protected isPermanent = false;
	private submitCallback?: (data: NewDebtData) => void;

	/**
	 * Returns true when the form has enough valid data to submit:
	 * name must be non-empty and amount must be a positive number.
	 *
	 * @returns Whether the form is in a submittable state.
	 */
	protected get isValid(): boolean {
		if (this.isEditMode) return parseFloat(this.amount) > 0;
		return this.name.trim().length > 0 && parseFloat(this.amount) > 0;
	}

	/**
	 * Opens the dialog in add mode (null prefill) or edit mode (object prefill).
	 * When prefillData is not null, sets isEditMode to true and pre-populates
	 * amount, due date, and currency; name, category, and permanent toggle are hidden.
	 *
	 * @param submitCallback - The callback invoked with the validated form data on submit.
	 * @param prefillData - Prefill values for edit mode, or null for add mode.
	 */
	public openDialog(
		submitCallback: (data: NewDebtData) => void,
		prefillData: Partial<NewDebtData> | null
	): void {
		this.submitCallback = submitCallback;
		this.isEditMode = prefillData !== null;
		if (prefillData) {
			// Edit mode: only populate the fields the user can change (balance, due date, currency);
			// name, category, and permanent toggle are hidden in this mode
			this.amount = String(prefillData.amount ?? '');
			this.dueDate = prefillData.dueDate ?? '';
			this.selectedCurrency = prefillData.currency ?? DEBT_CURRENCY_CNY;
		} else {
			// Add mode: reset all fields and default due date to 30 days from now
			this.name = '';
			this.selectedCategoryKey = DEBT_CATEGORY_CARD;
			this.amount = '';
			this.dueDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
			this.selectedCurrency = DEBT_CURRENCY_CNY;
			this.isPermanent = false;
		}
		this.visible = true;
	}

	/**
	 * Validates the form, invokes the submit callback with the collected
	 * debt data, and closes the dialog.
	 */
	protected onSubmit(): void {
		if (!this.isValid) return;
		this.submitCallback?.({
			name: this.name.trim(),
			amount: parseFloat(this.amount),
			dueDate: this.dueDate,
			isPermanent: this.isPermanent,
			category: this.selectedCategoryKey,
			currency: this.selectedCurrency
		});
		this.onDialogClosed();
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
