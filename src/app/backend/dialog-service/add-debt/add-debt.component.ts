import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import {
	DEBT_CAT_CARD,
	DEBT_CAT_HOME,
	DEBT_CAT_PERSON,
	DEBT_CAT_SHOPPING,
	DEBT_CURRENCY_CAD,
	DEBT_CURRENCY_CNY,
	DEBT_DIALOG_LABEL_ADD,
	DEBT_DIALOG_LABEL_CANCEL,
	DEBT_DIALOG_LABEL_CURRENCY_CAD,
	DEBT_DIALOG_LABEL_CURRENCY_CNY,
	DEBT_DIALOG_LABEL_PERMANENT,
	DEBT_DIALOG_LABEL_PERMANENT_DESC,
	DEBT_DIALOG_PLACEHOLDER_AMOUNT,
	DEBT_DIALOG_PLACEHOLDER_NAME,
	DEBT_DIALOG_TITLE
} from '../../../common/app.constant';
import { DebtCategoryDef, NewDebtData } from './add-debt.model';

@Component({
	selector: 'add-debt-dialog',
	standalone: true,
	imports: [DialogModule, FormsModule],
	templateUrl: './add-debt.component.html',
	styleUrl: './add-debt.component.scss'
})
export class AddDebtDialogComponent {
	@Output() closed$ = new EventEmitter<void>();

	protected readonly DEBT_DIALOG_TITLE = DEBT_DIALOG_TITLE;
	protected readonly DEBT_DIALOG_PLACEHOLDER_NAME = DEBT_DIALOG_PLACEHOLDER_NAME;
	protected readonly DEBT_DIALOG_PLACEHOLDER_AMOUNT = DEBT_DIALOG_PLACEHOLDER_AMOUNT;
	protected readonly DEBT_DIALOG_LABEL_ADD = DEBT_DIALOG_LABEL_ADD;
	protected readonly DEBT_DIALOG_LABEL_CANCEL = DEBT_DIALOG_LABEL_CANCEL;
	protected readonly DEBT_DIALOG_LABEL_PERMANENT = DEBT_DIALOG_LABEL_PERMANENT;
	protected readonly DEBT_DIALOG_LABEL_PERMANENT_DESC = DEBT_DIALOG_LABEL_PERMANENT_DESC;
	protected readonly DEBT_DIALOG_LABEL_CURRENCY_CNY = DEBT_DIALOG_LABEL_CURRENCY_CNY;
	protected readonly DEBT_DIALOG_LABEL_CURRENCY_CAD = DEBT_DIALOG_LABEL_CURRENCY_CAD;
	protected readonly DEBT_CURRENCY_CNY = DEBT_CURRENCY_CNY;
	protected readonly DEBT_CURRENCY_CAD = DEBT_CURRENCY_CAD;
	protected readonly categoryOptions: DebtCategoryDef[] = [
		{
			key: DEBT_CAT_CARD,
			icon: 'credit_card',
			label: 'Credit card',
			grad: 'linear-gradient(90deg,#e91e8c,#f7971e)'
		},
		{
			key: DEBT_CAT_PERSON,
			icon: 'handshake',
			label: 'Personal',
			grad: 'linear-gradient(90deg,#fda085,#f6d365)'
		},
		{
			key: DEBT_CAT_SHOPPING,
			icon: 'shopping_bag',
			label: 'Financing',
			grad: 'linear-gradient(90deg,#8e54e9,#e91e8c)'
		},
		{
			key: DEBT_CAT_HOME,
			icon: 'home',
			label: 'Mortgage',
			grad: 'linear-gradient(90deg,#11998e,#38ef7d)'
		}
	];

	protected visible = false;
	protected name = '';
	protected selectedCategoryKey = DEBT_CAT_CARD;
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
		return this.name.trim().length > 0 && parseFloat(this.amount) > 0;
	}

	/**
	 * Opens the dialog, resets all form fields to defaults, and stores the
	 * submit callback to be invoked when the user confirms.
	 *
	 * @param submitCallback - The callback invoked with the validated form data on submit.
	 */
	public openDialog(submitCallback: (data: NewDebtData) => void): void {
		this.submitCallback = submitCallback;
		this.name = '';
		this.selectedCategoryKey = DEBT_CAT_CARD;
		this.amount = '';
		this.dueDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
		this.selectedCurrency = DEBT_CURRENCY_CNY;
		this.isPermanent = false;
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
