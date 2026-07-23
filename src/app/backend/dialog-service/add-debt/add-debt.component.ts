import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { Utilities } from '../../../common/utilities/app.utilities';
import {
	DEBT_CURRENCY_CAD,
	DEBT_CURRENCY_CNY,
	DEBT_DIALOG_PLACEHOLDER_AMOUNT,
	DEBT_ICON_LOCK,
	DEBT_ICON_LOCK_OPEN,
	DEBT_ICON_NEW_CYCLE
} from '../../../common/constants';
import {
	DEBT_DIALOG_LABEL_ADD,
	DEBT_DIALOG_LABEL_BALANCE,
	DEBT_DIALOG_LABEL_CANCEL,
	DEBT_DIALOG_LABEL_CURRENCY_CAD,
	DEBT_DIALOG_LABEL_CURRENCY_CNY,
	DEBT_DIALOG_LABEL_EDIT,
	DEBT_DIALOG_LABEL_PERMANENT,
	DEBT_DIALOG_LABEL_PERMANENT_DESC,
	DEBT_DIALOG_LABEL_NEW_CYCLE,
	DEBT_DIALOG_LABEL_NEW_CYCLE_DESC,
	DEBT_DIALOG_LABEL_SAVE,
	DEBT_DIALOG_PLACEHOLDER_NAME,
	DEBT_DIALOG_TITLE,
	LABEL_NAME,
	LABEL_CATEGORY,
	ADD_DEBT_LABEL_AMOUNT,
	ADD_DEBT_LABEL_CURRENCY,
	ADD_DEBT_LABEL_DUE_DATE,
	DEBT_CATEGORY_LABELS
} from '../../../common/locale/locale-strings';
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
	protected readonly DEBT_DIALOG_LABEL_NEW_CYCLE = DEBT_DIALOG_LABEL_NEW_CYCLE;
	protected readonly DEBT_DIALOG_LABEL_NEW_CYCLE_DESC = DEBT_DIALOG_LABEL_NEW_CYCLE_DESC;
	protected readonly DEBT_ICON_LOCK = DEBT_ICON_LOCK;
	protected readonly DEBT_ICON_LOCK_OPEN = DEBT_ICON_LOCK_OPEN;
	protected readonly DEBT_ICON_NEW_CYCLE = DEBT_ICON_NEW_CYCLE;
	protected readonly DEBT_DIALOG_LABEL_CURRENCY_CNY = DEBT_DIALOG_LABEL_CURRENCY_CNY;
	protected readonly DEBT_DIALOG_LABEL_CURRENCY_CAD = DEBT_DIALOG_LABEL_CURRENCY_CAD;
	protected readonly LABEL_NAME = LABEL_NAME;
	protected readonly LABEL_CATEGORY = LABEL_CATEGORY;
	protected readonly ADD_DEBT_LABEL_AMOUNT = ADD_DEBT_LABEL_AMOUNT;
	protected readonly ADD_DEBT_LABEL_CURRENCY = ADD_DEBT_LABEL_CURRENCY;
	protected readonly ADD_DEBT_LABEL_DUE_DATE = ADD_DEBT_LABEL_DUE_DATE;
	protected readonly DEBT_CURRENCY_CNY = DEBT_CURRENCY_CNY;
	protected readonly DEBT_CURRENCY_CAD = DEBT_CURRENCY_CAD;
	protected readonly categoryDefs = DEBT_CATEGORY_DEFS.map((categoryDef) => ({
		...categoryDef,
		label: DEBT_CATEGORY_LABELS[categoryDef.key] ?? '',
	}));

	protected isEditMode = false;
	protected visible = false;
	protected name = '';
	protected selectedCategoryKey = DEBT_CATEGORY_DEFS[0].key;
	protected amount = '';
	protected dueDateModel: Date | null = null;
	protected selectedCurrency = '';
	protected isPermanent = false;
	protected isNewCycle = false;
	private submitCallback?: (data: NewDebtData) => void | Promise<void>;

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
	 * amount, due date, and currency; name, category, and the permanent toggle are
	 * hidden, while the new-cycle toggle is shown and reset to off.
	 *
	 * @param submitCallback - The callback invoked with the validated form data on submit.
	 * @param prefillData - Prefill values for edit mode, or null for add mode.
	 */
	public openDialog(
		submitCallback: (data: NewDebtData) => void | Promise<void>,
		prefillData: Partial<NewDebtData> | null
	): void {
		// Step 1: Register the callback and derive the mode from whether prefill data was supplied
		this.submitCallback = submitCallback;
		this.isEditMode = prefillData !== null;

		if (prefillData) {
			/* Step 2 (edit mode): Populate only the editable fields — balance, due date, and currency.
			   The 'T00:00' suffix forces local-midnight parsing; omitting it causes a UTC offset
			   that shifts the displayed date by one day in negative-offset timezones. */
			this.amount = String(prefillData.amount ?? '');
			this.dueDateModel = prefillData.dueDate ? new Date(prefillData.dueDate + 'T00:00') : null;
			this.selectedCurrency = prefillData.currency ?? DEBT_CURRENCY_CNY;
			this.isNewCycle = false;
		} else {
			// Step 2 (add mode): Reset every field and seed due date 30 days out as a sensible default
			this.name = '';
			this.selectedCategoryKey = DEBT_CATEGORY_DEFS[0].key;
			this.amount = '';
			this.dueDateModel = new Date(Date.now() + 30 * 86400000);
			this.selectedCurrency = '';
			this.isPermanent = false;
		}

		// Step 3: Make the dialog visible only after state is fully initialised to avoid a blank flash
		this.visible = true;
	}

	/**
	 * Validates the form, invokes the submit callback with the collected
	 * debt data, and closes the dialog.
	 */
	protected async onSubmit(): Promise<void> {
		// Step 1: Guard — the template disables the button, but this prevents keyboard/programmatic bypass
		if (!this.isValid) return;

		/* Step 2: Build the payload and await the caller's work so the dialog stays open under the
		   blocking overlay and both close together when the save settles (consistent with undo).
		   dueDate falls back to an empty string (not null) so the database field stays consistent
		   across records regardless of whether the user set a date. */
		await this.submitCallback?.({
			name: this.name.trim(),
			amount: parseFloat(this.amount),
			dueDate: this.dueDateModel ? Utilities.formatDateForStorage(this.dueDateModel) : '',
			isPermanent: this.isPermanent,
			category: this.selectedCategoryKey,
			currency: this.selectedCurrency,
			isNewCycle: this.isNewCycle
		});

		// Step 3: Close after the callback so the caller receives data before the component tears down
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
