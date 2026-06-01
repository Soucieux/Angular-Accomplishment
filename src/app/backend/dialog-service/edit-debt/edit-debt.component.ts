import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import {
	DEBT_CURRENCY_CAD,
	DEBT_CURRENCY_CNY,
	DEBT_DIALOG_LABEL_BALANCE,
	DEBT_DIALOG_LABEL_CANCEL,
	DEBT_DIALOG_LABEL_CURRENCY_CAD,
	DEBT_DIALOG_LABEL_CURRENCY_CNY,
	DEBT_DIALOG_LABEL_EDIT,
	DEBT_DIALOG_LABEL_SAVE,
	DEBT_DIALOG_PLACEHOLDER_AMOUNT
} from '../../../common/app.constant';
import { EditDebtData } from './edit-debt.model';

@Component({
	selector: 'edit-debt-dialog',
	standalone: true,
	imports: [DialogModule, FormsModule, DatePickerModule],
	templateUrl: './edit-debt.component.html',
	styleUrl: './edit-debt.component.scss'
})
export class EditDebtDialogComponent {
	@Output() closed$ = new EventEmitter<void>();

	protected readonly DEBT_DIALOG_LABEL_EDIT = DEBT_DIALOG_LABEL_EDIT;
	protected readonly DEBT_DIALOG_LABEL_BALANCE = DEBT_DIALOG_LABEL_BALANCE;
	protected readonly DEBT_DIALOG_PLACEHOLDER_AMOUNT = DEBT_DIALOG_PLACEHOLDER_AMOUNT;
	protected readonly DEBT_DIALOG_LABEL_SAVE = DEBT_DIALOG_LABEL_SAVE;
	protected readonly DEBT_DIALOG_LABEL_CANCEL = DEBT_DIALOG_LABEL_CANCEL;
	protected readonly DEBT_DIALOG_LABEL_CURRENCY_CNY = DEBT_DIALOG_LABEL_CURRENCY_CNY;
	protected readonly DEBT_DIALOG_LABEL_CURRENCY_CAD = DEBT_DIALOG_LABEL_CURRENCY_CAD;
	protected readonly DEBT_CURRENCY_CNY = DEBT_CURRENCY_CNY;
	protected readonly DEBT_CURRENCY_CAD = DEBT_CURRENCY_CAD;

	protected visible = false;
	protected amount = '';
	protected dueDateObj: Date | null = null;
	protected selectedCurrency = DEBT_CURRENCY_CNY;
	private submitCallback?: (data: EditDebtData) => void;

	/**
	 * Returns true when the form has a valid positive amount.
	 *
	 * @returns Whether the form is in a submittable state.
	 */
	protected get isValid(): boolean {
		return parseFloat(this.amount) > 0;
	}

	/**
	 * Opens the dialog pre-filled with the current debt's editable values and
	 * stores the submit callback to be invoked on confirmation.
	 *
	 * @param prefill - The current amount, due date string, and currency to pre-populate.
	 * @param submitCallback - The callback invoked with the updated form data on submit.
	 */
	public openDialog(prefill: EditDebtData, submitCallback: (data: EditDebtData) => void): void {
		this.submitCallback = submitCallback;
		this.amount = String(prefill.amount);
		this.selectedCurrency = prefill.currency;
		this.dueDateObj = this.parseDateString(prefill.dueDate);
		this.visible = true;
	}

	/**
	 * Validates the form, invokes the submit callback with the collected
	 * data, and closes the dialog.
	 */
	protected onSubmit(): void {
		if (!this.isValid) return;
		this.submitCallback?.({
			amount: parseFloat(this.amount),
			dueDate: this.dueDateObj ? this.formatDateObj(this.dueDateObj) : '',
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

	/**
	 * Parses a YYYY-MM-DD date string into a local-midnight Date object.
	 * Returns null when the input is empty or malformed.
	 *
	 * @param dateStr - The date string in YYYY-MM-DD format.
	 * @returns A Date at local midnight, or null.
	 */
	private parseDateString(dateStr: string): Date | null {
		if (!dateStr) return null;
		const parts = dateStr.split('-');
		if (parts.length !== 3) return null;
		return new Date(+parts[0], +parts[1] - 1, +parts[2]);
	}

	/**
	 * Formats a Date object into a YYYY-MM-DD string using local time.
	 *
	 * @param date - The date to format.
	 * @returns The date as a YYYY-MM-DD string.
	 */
	private formatDateObj(date: Date): string {
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
	}
}
