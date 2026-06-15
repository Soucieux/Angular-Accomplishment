import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { Utilities } from '../../../common/app.utilities';
import {
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
	DEBT_DIALOG_TITLE
} from '../../../common/app.constant';
import { DEBT_CATEGORY_DEFS, NewDebtData } from '../../../fontend/debt/debt.model';

@Component({
	selector: 'add-debt-dialog',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [DialogModule, FormsModule, DatePickerModule],
	templateUrl: './add-debt.component.html',
	styleUrl: './add-debt.component.scss'
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
	protected readonly DEBT_CATEGORY_DEFS = DEBT_CATEGORY_DEFS;

	protected isEditMode = false;
	protected visible = false;
	protected name = '';
	protected selectedCategoryKey = 'card';
	protected amount = '';
	protected dueDateModel: Date | null = null;
	protected selectedCurrency = '';
	protected isPermanent = false;
	private submitCallback?: (data: NewDebtData) => void;

	/**
	 * Returns true when the form has enough valid data to submit.
	 * Edit mode: amount must be a non-negative number.
	 * Add mode: name must be non-empty, amount non-negative, and a currency selected.
	 *
	 * @returns Whether the form is in a submittable state.
	 */
	protected get isValid(): boolean {
		if (this.isEditMode) return parseFloat(this.amount) >= 0;
		return this.name.trim().length > 0 && parseFloat(this.amount) >= 0 && this.selectedCurrency !== '';
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
			/* Edit mode: only populate the fields the user can change (balance, due date, currency);
			   name, category, and permanent toggle are hidden in this mode */
			this.amount = String(prefillData.amount ?? '');
			this.dueDateModel = prefillData.dueDate ? new Date(prefillData.dueDate + 'T00:00') : null;
			this.selectedCurrency = prefillData.currency ?? DEBT_CURRENCY_CNY;
		} else {
			// Add mode: reset all fields and default due date to 30 days from now
			this.name = '';
			this.selectedCategoryKey = 'card';
			this.amount = '';
			this.dueDateModel = new Date(Date.now() + 30 * 86400000);
			this.selectedCurrency = '';
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
			dueDate: this.dueDateModel ? Utilities.formatDateForStorage(this.dueDateModel) : '',
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
