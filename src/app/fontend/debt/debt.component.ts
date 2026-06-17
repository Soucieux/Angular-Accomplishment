import {
	ChangeDetectorRef,
	Component,
	Inject,
	NgZone,
	OnDestroy,
	OnInit,
	PLATFORM_ID,
	ViewChild,
	ViewContainerRef
} from '@angular/core';
import { AsyncPipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SkeletonModule } from 'primeng/skeleton';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LOG } from '../../common/app.logs';
import { Utilities } from '../../common/utilities/app.utilities';
import {
	COMPONENT_DESTROY,
	DATABASE_DEBT_SONATA,
	DEBT_PROMPT_TIMEOUT_MS,
	DEBT_CURRENCY_CAD,
	DEBT_CURRENCY_CNY,
	DEBT_EMPTY_STATE_BTN,
	DEBT_EMPTY_STATE_MSG,
	DEBT_CUSTOM_INPUT_PLACEHOLDER,
	DEBT_LABEL_DELETE_CONFIRM,
	DEBT_PRESET_LARGE,
	DEBT_PRESET_SMALL,
	DEBT_TYPE_TEMP,
	DEBT_TYPE_PERMANENT,
	DEBT_ITEM_EXPENSE,
	DEBT_VALUE_KEY_CATEGORY,
	DEBT_VALUE_KEY_CURRENCY,
	DEBT_VALUE_KEY_DATE,
	DEBT_VALUE_KEY_DEBT,
	DEBT_VALUE_KEY_ORIGINAL,
	DEBT_VALUE_KEY_PAID,
	DEBT_VALUE_KEY_TYPE,
	DIALOG_DEBT,
	ERROR_PERMISSION_DENIED,
	STATS_CAP_ACTIVITY_LOG,
	STATS_FIELD_DEBT_TOTAL,
	STATS_FIELD_DEBT_UPCOMING,
	DEBT_DUE_LABEL_NONE,
	DEBT_DUE_LABEL_TODAY,
	DEBT_DUE_LABEL_TOMORROW,
	DEBT_CURRENCY_SYMBOL_CNY,
	DEBT_CURRENCY_SYMBOL_CAD,
	DEBT_DUE_CLASS_OVERDUE,
	DEBT_DUE_CLASS_SOON,
	DEBT_DUE_ICON_OVERDUE,
	DEBT_DUE_ICON_DEFAULT,
	DEBT_SKELETON_COUNT,
	DEBT_VALUE_KEY_PAYMENTS,
	DEBT_MSG_PAYING,
	DEBT_MSG_DELETING_PAYMENT,
	DEBT_MSG_RESETTING,
	DEBT_CONFIRM_DELETE_PAYMENT_MSG,
	DEBT_CONFIRM_DELETE_PAYMENT_HEADER,
	DEBT_CONFIRM_DELETE_PAYMENT_BTN,
	TIMEOUT_KEY_DEBT
} from '../../common/app.constant';
import {
	DEBT_CATEGORY_DEFS,
	DebtCategoryDef,
	MONTH_NAMES_SHORT,
	NewDebtData,
	PaymentEntry
} from './debt.model';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { TimeoutService } from '../../common/timeout/timeout.service';
import { DatabaseService } from '../../backend/database-service/database.service';
import { AccessDeniedComponent } from '../../common/access-denied/access-denied.component';
@Component({
	selector: 'debt',
	imports: [AsyncPipe, FormsModule, SkeletonModule, AccessDeniedComponent],
	templateUrl: './debt.component.html',
	styleUrls: ['./debt.component.css']
})
export class DebtComponent implements OnInit, OnDestroy {
	private readonly className = 'DebtComponent';
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	protected readonly DATABASE_DEBT_SONATA = DATABASE_DEBT_SONATA;
	protected readonly DEBT_CURRENCY_CNY = DEBT_CURRENCY_CNY;
	protected readonly DEBT_PRESET_SMALL = DEBT_PRESET_SMALL;
	protected readonly DEBT_PRESET_LARGE = DEBT_PRESET_LARGE;
	protected readonly DEBT_EMPTY_STATE_MSG = DEBT_EMPTY_STATE_MSG;
	protected readonly DEBT_EMPTY_STATE_BTN = DEBT_EMPTY_STATE_BTN;
	protected readonly DEBT_CUSTOM_INPUT_PLACEHOLDER = DEBT_CUSTOM_INPUT_PLACEHOLDER;
	protected readonly DEBT_LABEL_DELETE_CONFIRM = DEBT_LABEL_DELETE_CONFIRM;
	protected readonly DEBT_CONFIRM_DELETE_PAYMENT_MSG = DEBT_CONFIRM_DELETE_PAYMENT_MSG;
	protected readonly DEBT_CONFIRM_DELETE_PAYMENT_HEADER = DEBT_CONFIRM_DELETE_PAYMENT_HEADER;
	protected readonly DEBT_CONFIRM_DELETE_PAYMENT_BTN = DEBT_CONFIRM_DELETE_PAYMENT_BTN;
	protected loading = true;
	protected isHoverCapable!: boolean;
	protected updatedDebtSonataItems: any[] = [];
	protected originalDebtSonataItems!: any[];
	protected expandedItems: Record<string, boolean> = {};
	protected balanceBumpItems: Record<string, boolean> = {};
	protected isPromptedReset: Record<string, boolean> = {};
	protected isPromptedDelete: Record<string, boolean> = {};
	protected customInputState: Record<string, string | null> = {};
	protected saveIndicator = false;
	protected debtItems$!: Observable<any[]>;
	private upcomingExpenses: any[] = [];
	private paymentsData: Record<string, Record<number, PaymentEntry>> = {};
	private activeWriteKeys = new Set<string>();
	private promptedResetTimers: Record<string, ReturnType<typeof setTimeout>> = {};
	private promptedDeleteTimers: Record<string, ReturnType<typeof setTimeout>> = {};
	private balanceBumpTimers: Record<string, ReturnType<typeof setTimeout>> = {};
	private saveIndicatorTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};
	private syncStatTimer: ReturnType<typeof setTimeout> | null = null;
	private readonly categoryDefs: DebtCategoryDef[] = DEBT_CATEGORY_DEFS;

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		private dialogService: DialogService,
		private timeoutService: TimeoutService,
		private databaseService: DatabaseService,
		private cdr: ChangeDetectorRef,
		private ngZone: NgZone,
		protected utilities: Utilities
	) {}

	/**
	 * Initialises the component: checks hover capability and builds the Account
	 * Expenses observable. The tap side-effect populates the display and
	 * original-value arrays and syncs upcoming items to the statistics collection.
	 * Items in activeWriteKeys are shielded from overwrite to prevent the
	 * optimistic-update flip caused by CloudBase echoing stale data mid-write.
	 * The tap body runs inside ngZone.run() because CloudBase WebSocket callbacks
	 * fire outside Angular's zone. The async pipe in the template manages the
	 * subscription lifecycle and triggers change detection — no explicit
	 * detectChanges() call is needed or safe here.
	 */
	ngOnInit() {
		if (isPlatformBrowser(this.platformId)) {
			this.timeoutService.start(TIMEOUT_KEY_DEBT, () => {
				this.dialogService.showLoadingTimeout(this.dialogComponentContainer);
			});

			// Step 1 : Check device hover capability
			this.isHoverCapable = this.utilities.checkIfHoverCapable();

			/* Step 2 : Handle auto-open-dialog state from router navigation.
			   history.state retains the router state passed via Router.navigate({ state: ... }).
			   Immediately clear the state so a page refresh does not re-trigger the dialog. */
			if (history.state?.openAddDialog) {
				history.replaceState({}, '');
				setTimeout(() => this.openNewDebtDialog(), 0);
			}

			// Step 3 : Build the Account Expenses observable with tap side-effects
			this.debtItems$ = this.databaseService.getDebtSonataTableDetails().pipe(
				tap((rows) => {
					this.ngZone.run(() => {
						this.originalDebtSonataItems = structuredClone(rows);
						const currentByKey = new Map(
							this.updatedDebtSonataItems.map((item) => [item.key, item])
						);
						this.updatedDebtSonataItems = rows.map((row: any) =>
							this.activeWriteKeys.has(row.key)
								? (currentByKey.get(row.key) ?? structuredClone(row))
								: structuredClone(row)
						);
						this.timeoutService.clear(TIMEOUT_KEY_DEBT);
						this.loading = false;
						this.paymentsData = rows.reduce(
							(acc: Record<string, Record<number, PaymentEntry>>, item: any) => ({
								...acc,
								[item.key]: this.activeWriteKeys.has(item.key)
									? (this.paymentsData[item.key] ?? {})
									: (item.payments ?? {})
							}),
							{}
						);
						this.upcomingExpenses = rows
							.filter((item: any) => item.date && !item.paid)
							.map((item: any) => this.toUpcomingExpense(item));
						this.syncStatistics();
					});
				})
			);
		}
	}

	/**
	 * Unsubscribes from the Account Expenses subscription and clears all
	 * prompted-button and balance-bump timers.
	 */
	ngOnDestroy() {
		this.timeoutService.clear(TIMEOUT_KEY_DEBT);
		this.dialogComponentContainer?.clear();
		Object.values(this.promptedResetTimers).forEach(clearTimeout);
		Object.values(this.promptedDeleteTimers).forEach(clearTimeout);
		Object.values(this.balanceBumpTimers).forEach(clearTimeout);
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	////////////////////// Below are Preset chip payment interaction handlers ///////////////////

	/**
	 * Subtracts the given amount from the item's debt balance and persists
	 * the change, including writing the payment entry to the DB.
	 * The balance may go negative (overpayment is allowed).
	 * Auto-marks the item as paid when the balance reaches zero or below.
	 * Opens a block dialog during the DB write to prevent duplicate submissions.
	 * Briefly scales the balance display via the is-bump CSS class for 360 ms.
	 *
	 * @param entryKey - The unique key of the Account Expenses entry to pay.
	 * @param amount - The positive amount to subtract from the current balance.
	 */
	protected async payDebt(entryKey: string, amount: number): Promise<void> {
		if (
			!this.dialogService.ensurePermission(
				this.dialogComponentContainer,
				this.findUpdatedItem(entryKey)?._openid ?? ''
			)
		)
			return;
		const item = this.findUpdatedItem(entryKey);
		if (!item || amount <= 0 || this.isPayDisabled(item)) return;
		// Step 1 : Compute new balance and build the payment entry
		// Round to 2 decimal places to avoid floating-point drift accumulating over multiple payments
		const currentDebt: number = item.debt ?? 0;
		const newDebt = Math.round((currentDebt - amount) * 100) / 100;
		const isPaidOff = this.isDebtFullySettled(newDebt);
		const currentPayments = this.paymentsData[entryKey] ?? {};
		const keys = Object.keys(currentPayments);
		const nextIndex = keys.length === 0 ? 0 : Math.max(...keys.map(Number)) + 1;
		const newEntry: PaymentEntry = {
			amount,
			balance: newDebt,
			timestamp: Utilities.getCurrentFormattedTime(true)
		};
		// Step 2 : Persist payment and balance update via block dialog
		await this.openBlockDialog(async () => {
			/* Apply mutations synchronously before any DB write — immune to subscription replacements.
			   activeWriteKeys shields this entry from subscription overwrites until the write settles. */
			this.activeWriteKeys.add(entryKey);
			item.debt = newDebt;
			if (isPaidOff) item.paid = true;
			try {
				const paymentFields: Record<string, unknown> = {
					[DEBT_VALUE_KEY_DEBT]: newDebt,
					[DEBT_VALUE_KEY_PAYMENTS]: { ...currentPayments, [nextIndex]: newEntry }
				};
				if (isPaidOff) paymentFields[DEBT_VALUE_KEY_PAID] = true;
				await this.databaseService.updateDebtFields(entryKey, paymentFields);
				this.triggerSaveIndicator();
			} catch (error) {
				this.dialogService.handleError(this.dialogComponentContainer, error);
			} finally {
				this.activeWriteKeys.delete(entryKey);
			}
		}, DEBT_MSG_PAYING);
		this.paymentsData = {
			...this.paymentsData,
			[entryKey]: { ...currentPayments, [nextIndex]: newEntry }
		};
		// Step 3 : Trigger the balance-bump animation, then clear the flag after the CSS transition completes
		this.balanceBumpItems = { ...this.balanceBumpItems, [entryKey]: true };
		this.cdr.detectChanges();
		if (this.balanceBumpTimers[entryKey]) clearTimeout(this.balanceBumpTimers[entryKey]);
		this.balanceBumpTimers[entryKey] = setTimeout(() => {
			this.balanceBumpItems = { ...this.balanceBumpItems, [entryKey]: false };
			this.cdr.detectChanges();
		}, 360);
		this.resyncUpcomingFromLocalData();
	}

	/**
	 * Shows the custom-amount chip input for the given entry, clearing any previous
	 * value, then focuses the input after Angular renders it into the DOM.
	 *
	 * @param entryKey - The unique key of the entry to show custom input for.
	 */
	protected toggleCustomInput(entryKey: string): void {
		this.customInputState = { ...this.customInputState, [entryKey]: '' };
		setTimeout(() => {
			document.querySelector<HTMLInputElement>(`[data-pay-key="${entryKey}"]`)?.focus();
		}, 0);
	}

	/**
	 * Reads the custom input value for the given entry, submits a payment
	 * if the parsed amount is positive, then closes the custom input.
	 *
	 * @param entryKey - The unique key of the entry to pay with a custom amount.
	 */
	protected submitCustomPay(entryKey: string): void {
		if (this.customInputState[entryKey] == null) return;
		const raw = this.customInputState[entryKey] ?? '';
		const amount = parseFloat(raw);
		if (amount > 0) {
			this.payDebt(entryKey, amount).catch(() => {});
		}
		this.cancelCustomPay(entryKey);
	}

	/**
	 * Closes the custom-amount chip input for the given entry without
	 * submitting a payment.
	 *
	 * @param entryKey - The unique key of the entry whose custom input to close.
	 */
	protected cancelCustomPay(entryKey: string): void {
		this.customInputState = { ...this.customInputState, [entryKey]: null };
	}

	////////////////////// Below are Two-step confirm interaction handlers //////////////////////

	/**
	 * First call prompts the Reset button; second call within 2.6 s executes
	 * the reset. Prompted state auto-dismisses after the timeout.
	 *
	 * @param entryKey - The unique key of the entry to reset.
	 */
	protected promptOrConfirmReset(entryKey: string): void {
		if (
			!this.dialogService.ensurePermission(
				this.dialogComponentContainer,
				this.findUpdatedItem(entryKey)?._openid ?? ''
			)
		)
			return;
		if (this.isPromptedReset[entryKey]) {
			clearTimeout(this.promptedResetTimers[entryKey]);
			this.isPromptedReset = { ...this.isPromptedReset, [entryKey]: false };
			this.resetDebt(entryKey).catch(() => {});
		} else {
			this.isPromptedReset = { ...this.isPromptedReset, [entryKey]: true };
			this.promptedResetTimers[entryKey] = setTimeout(() => {
				this.isPromptedReset = { ...this.isPromptedReset, [entryKey]: false };
				this.cdr.detectChanges();
			}, DEBT_PROMPT_TIMEOUT_MS);
		}
	}

	/**
	 * First call prompts the Delete button; second call within 2.6 s removes
	 * the entry from CloudBase. Prompted state auto-dismisses after the timeout.
	 *
	 * @param entryKey - The unique key of the entry to delete.
	 */
	protected promptOrConfirmDelete(entryKey: string): void {
		if (
			!this.dialogService.ensurePermission(
				this.dialogComponentContainer,
				this.findUpdatedItem(entryKey)?._openid ?? ''
			)
		)
			return;
		if (this.isPromptedDelete[entryKey]) {
			clearTimeout(this.promptedDeleteTimers[entryKey]);
			this.isPromptedDelete = { ...this.isPromptedDelete, [entryKey]: false };
			this.removeDebt(entryKey).catch(() => {});
		} else {
			this.isPromptedDelete = { ...this.isPromptedDelete, [entryKey]: true };
			this.promptedDeleteTimers[entryKey] = setTimeout(() => {
				this.isPromptedDelete = { ...this.isPromptedDelete, [entryKey]: false };
				this.cdr.detectChanges();
			}, DEBT_PROMPT_TIMEOUT_MS);
		}
	}

	////////////////////// Below are History panel interaction handlers //////////////////////////

	/**
	 * Toggles the payment history panel for the given entry open or closed.
	 *
	 * @param entryKey - The unique key of the entry to expand or collapse.
	 */
	protected toggleHistory(entryKey: string): void {
		this.expandedItems = {
			...this.expandedItems,
			[entryKey]: !this.expandedItems[entryKey]
		};
	}

	/**
	 * Returns true when the current user owns the given debt item.
	 * Delegates to the shared utilities ownership check, which also covers admin rights.
	 *
	 * @param item - The debt entry to check ownership for.
	 * @returns True if the current user is permitted to act on the item.
	 */
	protected isOwner(item: any): boolean {
		return Utilities.checkPermission(item._openid);
	}

	/**
	 * Handles a click on a history row. Opens a confirmation dialog for owners;
	 * silently ignores the click for non-owners.
	 *
	 * @param item - The debt entry that owns the payment history row.
	 * @param entry - The indexed payment entry the user clicked.
	 */
	protected onHistoryRowClick(item: any, entry: { index: number; value: PaymentEntry }): void {
		if (!this.isOwner(item)) return;
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			'confirm',
			() => this.deletePaymentEntry(item.key, entry.index).catch(() => {}),
			[
				DEBT_CONFIRM_DELETE_PAYMENT_MSG,
				DEBT_CONFIRM_DELETE_PAYMENT_HEADER,
				DEBT_CONFIRM_DELETE_PAYMENT_BTN
			]
		);
	}

	/**
	 * Removes the payment at the given index from the debt entry, refunds its
	 * amount to the balance, and persists both changes via a block dialog.
	 *
	 * @param entryKey - The unique key of the debt entry that owns the payment.
	 * @param index - The integer key of the payment to remove in the payments record.
	 */
	protected async deletePaymentEntry(entryKey: string, index: number): Promise<void> {
		const item = this.findUpdatedItem(entryKey);
		const currentItem = this.paymentsData[entryKey];

		// Step 1 : Compute restored balance and filtered payment history
		const originalDebt = item.debt;
		const updatedDebt = item.debt + currentItem[index].amount;

		// Filter out the selected entry from history
		const remainingPayments: Record<number, PaymentEntry> = Object.fromEntries(
			Object.entries(currentItem).filter(([k]) => Number(k) !== index)
		) as Record<number, PaymentEntry>;

		// Step 2 : Persist removal via block dialog to prevent duplicate DB calls
		await this.openBlockDialog(async () => {
			this.activeWriteKeys.add(entryKey);

			item.debt = updatedDebt;
			this.paymentsData = { ...this.paymentsData, [entryKey]: remainingPayments };

			try {
				await this.databaseService.removeSingleHistoryFromDebt(
					entryKey,
					index,
					updatedDebt,
					item.name
				);
			} catch (error) {
				// Rollback
				item.debt = originalDebt;
				this.paymentsData = { ...this.paymentsData, [entryKey]: currentItem };
				this.dialogService.handleError(this.dialogComponentContainer, error);
			} finally {
				this.activeWriteKeys.delete(entryKey);
			}
		}, DEBT_MSG_DELETING_PAYMENT);

		// Step 3 : Refresh the open history panel — paymentsData changed inside the block dialog
		this.cdr.detectChanges();
	}

	////////////////////// Below are Dialog opener methods for user-triggered dialogs ///////////

	/**
	 * Opens the add-debt dialog and wires the submit callback to persist
	 * the new entry to CloudBase.
	 */
	protected openNewDebtDialog(): void {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_DEBT,
			(debtData: NewDebtData) => this.addNewDebt(debtData).catch(() => {}),
			null
		);
	}

	/**
	 * Opens the Set-debt dialog pre-filled with the entry's current balance,
	 * due date, and currency. Wires the submit callback to persist the new cycle
	 * values to CloudBase via {@link setDebtForNewCycle}.
	 *
	 * @param entryKey - The unique key of the entry to set.
	 */
	protected openSetDebtDialog(entryKey: string): void {
		if (
			!this.dialogService.ensurePermission(
				this.dialogComponentContainer,
				this.findUpdatedItem(entryKey)?._openid ?? ''
			)
		)
			return;
		const item = this.findUpdatedItem(entryKey);
		if (!item) return;
		const prefillData: Partial<NewDebtData> = {
			amount: item.debt ?? 0,
			dueDate: item.date ?? '',
			currency: this.isCnyCurrency(item) ? DEBT_CURRENCY_CNY : DEBT_CURRENCY_CAD
		};
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_DEBT,
			(data: NewDebtData) => this.setDebtForNewCycle(entryKey, data).catch(() => {}),
			prefillData
		);
	}

	////////////////////// Below are Internal data methods for CloudBase writes /////////////////

	/**
	 * Creates a new debt record in CloudBase from the data returned by the add-debt dialog.
	 *
	 * @param debtData - The validated form data submitted from the add-debt dialog.
	 */
	private async addNewDebt(debtData: NewDebtData): Promise<void> {
		try {
			await this.databaseService.addNewRecordToDebt({
				name: debtData.name,
				[DEBT_VALUE_KEY_DEBT]: debtData.amount,
				[DEBT_VALUE_KEY_ORIGINAL]: debtData.amount,
				[DEBT_VALUE_KEY_DATE]: debtData.dueDate,
				[DEBT_VALUE_KEY_PAID]: this.isDebtFullySettled(debtData.amount),
				[DEBT_VALUE_KEY_TYPE]: debtData.isPermanent ? DEBT_TYPE_PERMANENT : DEBT_TYPE_TEMP,
				[DEBT_VALUE_KEY_CATEGORY]: debtData.category,
				[DEBT_VALUE_KEY_CURRENCY]: debtData.currency
			});
			this.triggerSaveIndicator();
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
		}
	}

	/**
	 * Toggles the lock state of a debt entry between 'goal' and 'permanent'.
	 * Permanent debts are protected from deletion. Rolls back on failure.
	 *
	 * @param entryKey - The unique key of the entry to toggle.
	 */
	protected async toggleLock(entryKey: string): Promise<void> {
		if (
			!this.dialogService.ensurePermission(
				this.dialogComponentContainer,
				this.findUpdatedItem(entryKey)?._openid ?? ''
			)
		)
			return;
		const item = this.findUpdatedItem(entryKey);
		if (!item) return;
		const newType =
			(item.type ?? DEBT_TYPE_TEMP) === DEBT_TYPE_PERMANENT ? DEBT_TYPE_TEMP : DEBT_TYPE_PERMANENT;
		item[DEBT_VALUE_KEY_TYPE] = newType;
		await this.updateTableSingleValue(entryKey, DEBT_VALUE_KEY_TYPE);
	}

	/**
	 * Resets the debt balance to its original amount. Paid state is derived from
	 * the original amount via {@link isDebtFullySettled} — if the original amount
	 * is zero or below, the entry is marked as paid rather than unpaid.
	 *
	 * @param entryKey - The unique key of the entry to reset.
	 */
	private async resetDebt(entryKey: string): Promise<void> {
		const item = this.findUpdatedItem(entryKey);
		const original = this.findOriginalItem(entryKey);
		if (!item || !original) return;
		const originalAmount: number = original.original ?? item.original ?? 0;

		// Guard: skip DB write when debt is already at original and no payments exist
		const hasPayments = Object.keys(this.paymentsData[entryKey] ?? {}).length > 0;
		if (!hasPayments && (item.debt ?? 0) === originalAmount) return;

		const newPaid = this.isDebtFullySettled(originalAmount);
		const previousDebt = item.debt ?? 0;
		const previousPaid = item.paid ?? false;
		const previousPayments = { ...(this.paymentsData[entryKey] ?? {}) };
		await this.openBlockDialog(async () => {
			this.activeWriteKeys.add(entryKey);
			item.debt = originalAmount;
			item.paid = newPaid;
			try {
				await this.databaseService.resetDebtRecord(
					entryKey,
					originalAmount,
					newPaid,
					item.name ?? ''
				);
				this.triggerSaveIndicator();
			} catch (error) {
				item.debt = previousDebt;
				item.paid = previousPaid;
				this.paymentsData = { ...this.paymentsData, [entryKey]: previousPayments };
				this.dialogService.handleError(this.dialogComponentContainer, error);
			} finally {
				this.activeWriteKeys.delete(entryKey);
			}
		}, DEBT_MSG_RESETTING);
		this.paymentsData = { ...this.paymentsData, [entryKey]: {} };
		this.resyncUpcomingFromLocalData();
		this.cdr.detectChanges();
	}

	/**
	 * Removes the entry from the CloudBase collection. The realtime
	 * subscription will update the display arrays automatically.
	 *
	 * @param entryKey - The unique key of the entry to remove.
	 */
	private async removeDebt(entryKey: string): Promise<void> {
		const debtName = this.findUpdatedItem(entryKey)?.name ?? '';
		try {
			await this.databaseService.removeRecordFromDebtTable(entryKey, debtName);
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
		}
	}

	/**
	 * Reads the updated value for the given field and writes it to CloudBase.
	 * Skips the write when the value has not changed. Rolls back the local change
	 * on permission error before showing the dialog.
	 *
	 * All values are captured before the first await so that a realtime subscription
	 * callback mid-flight cannot corrupt the comparison or rollback targets.
	 *
	 * {@link toggleLock} - Persists the toggled goal/permanent type.
	 *
	 * @param entryKey - The unique key of the entry to update.
	 * @param valueKey - The field name inside the entry's object.
	 */
	private async updateTableSingleValue(entryKey: string, valueKey: string): Promise<void> {
		const updatedItem = this.findUpdatedItem(entryKey);
		const originalItem = this.findOriginalItem(entryKey);
		if (!updatedItem || !originalItem) return;
		const updatedValue = updatedItem[valueKey];
		const oldValue = originalItem[valueKey];
		this.activeWriteKeys.add(entryKey);
		try {
			if (updatedValue !== oldValue) {
				await this.databaseService.updateSingleValueForDebtTable(entryKey, valueKey, updatedValue, updatedItem.name);
				this.triggerSaveIndicator();
			}
		} catch (error) {
			if (error instanceof Error && error.message === ERROR_PERMISSION_DENIED) {
				updatedItem[valueKey] = oldValue;
			}
			this.dialogService.handleError(this.dialogComponentContainer, error);
		} finally {
			this.activeWriteKeys.delete(entryKey);
		}
	}

	/**
	 * Opens the block dialog with the given message and executes the callback,
	 * blocking the UI until the callback settles to prevent duplicate DB calls.
	 *
	 * {@link payDebt} - Blocks while payment chip DB writes are in-flight.
	 * {@link deletePaymentEntry} - Blocks while the history-delete DB write is in-flight.
	 *
	 * @param callback - The async operation to run while the dialog is open.
	 * @param message - The loading message to display in the block dialog.
	 * @returns A promise that resolves when the callback completes.
	 */
	private openBlockDialog(callback: () => Promise<void>, message: string): Promise<void> {
		return this.dialogService.openDialog(this.dialogComponentContainer, 'block', callback, message);
	}

	/**
	 * Returns true when the given amount should be treated as fully settled.
	 * Any amount at or below zero is considered paid off.
	 * Single source of truth for the settled threshold used across all write paths.
	 *
	 * {@link payDebt} - Checks the balance remaining after a chip payment.
	 * {@link addNewDebt} - Checks the amount on a newly created record.
	 * {@link setDebtForNewCycle} - Checks the amount entered via the Set dialog.
	 * {@link resetDebt} - Checks the original amount restored by the reset action.
	 *
	 * @param amount - The debt amount to evaluate.
	 * @returns Whether the amount qualifies as fully settled.
	 */
	private isDebtFullySettled(amount: number): boolean {
		return amount <= 0;
	}

	/**
	 * Finds an item in the updated (working) copy of the Account Expenses table.
	 *
	 * @param entryKey - The unique key of the item to find.
	 * @returns The matching item, or undefined if not found.
	 */
	private findUpdatedItem(entryKey: string): any {
		return (this.updatedDebtSonataItems ?? []).find((item) => item.key === entryKey);
	}

	/**
	 * Finds an item in the original (server-state) copy of the Account Expenses table.
	 *
	 * @param entryKey - The unique key of the item to find.
	 * @returns The matching item, or undefined if not found.
	 */
	private findOriginalItem(entryKey: string): any {
		return (this.originalDebtSonataItems ?? []).find((item) => item.key === entryKey);
	}

	/**
	 * Writes the latest upcoming expenses to the statistics collection.
	 * Called after subscription emits. Fire-and-forget.
	 */
	private syncStatistics(): void {
		if (this.syncStatTimer !== null) clearTimeout(this.syncStatTimer);
		this.syncStatTimer = setTimeout(() => {
			this.syncStatTimer = null;
			this.databaseService.updateStatisticsFields({
				[STATS_FIELD_DEBT_UPCOMING]: this.upcomingExpenses.slice(0, STATS_CAP_ACTIVITY_LOG),
				[STATS_FIELD_DEBT_TOTAL]: this.upcomingExpenses.length
			});
		}, 0);
	}

	/**
	 * Maps a raw database row to the upcoming-expense shape used by the statistics sync.
	 *
	 * @param item - The raw debt record from the database.
	 * @returns The normalized upcoming-expense object.
	 */
	private toUpcomingExpense(item: any): {
		type: string;
		name: string;
		date: string;
		debt: number;
		original: number;
		category: string;
	} {
		return {
			type: DEBT_ITEM_EXPENSE,
			name: item.name,
			date: item.date,
			debt: item.debt ?? 0,
			original: item.original ?? 0,
			category: item.category ?? ''
		};
	}

	/**
	 * Recomputes upcoming expenses from local data and syncs to statistics
	 * without waiting for a CloudBase subscription callback.
	 */
	private resyncUpcomingFromLocalData(): void {
		this.upcomingExpenses = (this.updatedDebtSonataItems ?? [])
			.filter((item: any) => item.date && !item.paid)
			.map((item: any) => this.toUpcomingExpense(item));
		this.syncStatistics();
	}

	/**
	 * Shows the save-confirmation indicator and hides it after one second.
	 * Clears any active timeout before restarting so rapid saves do not flash.
	 */
	private triggerSaveIndicator(): void {
		this.saveIndicator = true;
		this.cdr.detectChanges();
		if (this.saveIndicatorTimeouts[DATABASE_DEBT_SONATA]) clearTimeout(this.saveIndicatorTimeouts[DATABASE_DEBT_SONATA]);
		this.saveIndicatorTimeouts[DATABASE_DEBT_SONATA] = setTimeout(() => {
			this.saveIndicator = false;
			this.cdr.detectChanges();
		}, 1000);
	}

	/**
	 * Gets a stable category index for the given item based on a
	 * hash of the item's name, ensuring the same name always maps to the
	 * same category gradient regardless of sort order.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns The index into {@link categoryDefs} for the item's deterministic category.
	 */
	private getCategoryIndexForItem(item: any): number {
		const name: string = item.name ?? '';
		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = (hash * 31 + name.charCodeAt(i)) | 0;
		}
		return Math.abs(hash) % this.categoryDefs.length;
	}

	/**
	 * Computes the due-date status for a date string.
	 *
	 * @param dateStr - An ISO date string or falsy value.
	 * @returns Object with overdue and soon boolean flags.
	 */
	private getDueStatus(dateStr: string | null | undefined): { overdue: boolean; soon: boolean } {
		if (!dateStr) return { overdue: false, soon: false };
		const diff = Utilities.getDaysUntilNumber(dateStr) ?? 0;
		return { overdue: diff < 0, soon: diff >= 0 && diff <= 14 };
	}

	/**
	 * Applies the Set-debt dialog submission as a fresh cycle: always resets
	 * the original ceiling to the entered amount, sets the paid flag to true
	 * when the entered amount is zero and false otherwise, and persists currency
	 * and due date when they changed. Clears the in-session payment history
	 * when the amount changes.
	 *
	 * Both `item` and `original` are captured before any await so that realtime
	 * subscription callbacks (which replace updatedDebtSonataItems and
	 * originalDebtSonataItems mid-flight) cannot corrupt the comparison values.
	 * All comparisons use `original.*` against `data.*` directly.
	 *
	 * @param entryKey - The unique key of the entry to update.
	 * @param data - The validated form data returned by the Set dialog.
	 */
	private async setDebtForNewCycle(entryKey: string, data: NewDebtData): Promise<void> {
		const item = this.findUpdatedItem(entryKey);
		const original = this.findOriginalItem(entryKey);
		if (!item || !original) return;

		/* Step 1 : Apply all local mutations synchronously before any DB write so the UI
		   reflects the intended state regardless of subscription timing.
		   activeWriteKeys shields this entry from subscription overwrites until the write settles. */
		const newPaid = this.isDebtFullySettled(data.amount);
		const amountChanged = data.amount !== original.debt;
		this.activeWriteKeys.add(entryKey);
		if (data.currency !== original[DEBT_VALUE_KEY_CURRENCY])
			item[DEBT_VALUE_KEY_CURRENCY] = data.currency;
		item[DEBT_VALUE_KEY_DEBT] = data.amount;
		item[DEBT_VALUE_KEY_ORIGINAL] = data.amount;
		item[DEBT_VALUE_KEY_PAID] = newPaid;
		if (data.dueDate !== original.date) item[DEBT_VALUE_KEY_DATE] = data.dueDate;
		if (amountChanged) {
			this.paymentsData = { ...this.paymentsData, [entryKey]: [] };
		}

		// Step 2 : Build a single update object with only changed fields — one round-trip instead of up to five.
		const fields = this.buildDebtCycleDiff(data, original, newPaid);
		// Step 3 : Persist changed fields and resync local state
		try {
			if (Object.keys(fields).length > 0) {
				await this.databaseService.updateDebtFields(entryKey, fields, item.name ?? '');
				this.triggerSaveIndicator();
			}
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
		} finally {
			this.activeWriteKeys.delete(entryKey);
		}
		this.resyncUpcomingFromLocalData();
		this.cdr.detectChanges();
	}

	/**
	 * Builds the set of changed fields to persist for a new debt cycle.
	 * Compares incoming data against the original record and returns only the fields
	 * whose values differ — so callers issue a single round-trip update instead of up to five.
	 *
	 * {@link setDebtForNewCycle} - The sole caller; applies the returned diff to the database.
	 *
	 * @param data - The new cycle values supplied by the user via the Set dialog.
	 * @param original - The unmodified debt record as last received from the database.
	 * @param newPaid - Whether the new amount is fully settled.
	 * @returns A record of field keys to new values, containing only changed fields.
	 */
	private buildDebtCycleDiff(
		data: NewDebtData,
		original: any,
		newPaid: boolean
	): Record<string, unknown> {
		const fields: Record<string, unknown> = {};
		const amountChanged = data.amount !== original.debt;
		if (data.currency !== original[DEBT_VALUE_KEY_CURRENCY])
			fields[DEBT_VALUE_KEY_CURRENCY] = data.currency;
		if (amountChanged) {
			fields[DEBT_VALUE_KEY_DEBT] = data.amount;
			fields[DEBT_VALUE_KEY_PAYMENTS] = {};
		}
		if (data.amount !== original.original) fields[DEBT_VALUE_KEY_ORIGINAL] = data.amount;
		if (original.paid !== newPaid) fields[DEBT_VALUE_KEY_PAID] = newPaid;
		if (data.dueDate !== original.date) fields[DEBT_VALUE_KEY_DATE] = data.dueDate;
		return fields;
	}

	////////////////////// Below are Template helper methods for the HTML template ///////////////

	/**
	 * Returns the array of indices used to render skeleton loading cards,
	 * sized to match the fixed skeleton count for this page.
	 *
	 * @returns Array of 0-based indices with length equal to DEBT_SKELETON_COUNT.
	 */
	protected get skeletonItems(): number[] {
		return Array.from({ length: DEBT_SKELETON_COUNT }, (_, i) => i);
	}

	/**
	 * Groups Account Expenses items by currency (CNY for Chinese names,
	 * CAD otherwise) and computes totals and progress for the summary bar.
	 *
	 * @returns An array of per-currency summary objects.
	 */
	protected get currencyGroups(): {
		code: string;
		symbol: string;
		owed: number;
		original: number;
		paid: number;
		pct: number;
	}[] {
		const groups: Record<string, { owed: number; original: number }> = {};
		for (const item of this.updatedDebtSonataItems ?? []) {
			const code = this.isCnyCurrency(item) ? 'CNY' : 'CAD';
			if (!groups[code]) groups[code] = { owed: 0, original: 0 };
			groups[code].owed += item.debt ?? 0;
			groups[code].original += item.original ?? 0;
		}
		return Object.entries(groups).map(([code, g]) => {
			const paidAmount = Math.max(0, g.original - g.owed);
			const pct = g.original > 0 ? Math.min(100, Math.round((paidAmount / g.original) * 100)) : 0;
			return {
				code,
				symbol: code === 'CNY' ? DEBT_CURRENCY_SYMBOL_CNY : DEBT_CURRENCY_SYMBOL_CAD,
				owed: g.owed,
				original: g.original,
				paid: paidAmount,
				pct
			};
		});
	}

	/**
	 * Counts Account Expenses items that are not yet paid.
	 *
	 * @returns The number of unpaid items.
	 */
	protected get activeCount(): number {
		return (this.updatedDebtSonataItems ?? []).filter((item: any) => !item.paid).length;
	}

	/**
	 * Counts Account Expenses items that have been marked as paid.
	 *
	 * @returns The number of paid items.
	 */
	protected get paidCount(): number {
		return (this.updatedDebtSonataItems ?? []).filter((item: any) => item.paid).length;
	}

	/**
	 * Counts active items whose due date falls within the next 14 days.
	 *
	 * @returns The count of items due within 14 days.
	 */
	protected get dueSoonCount(): number {
		return (this.updatedDebtSonataItems ?? []).filter((item: any) => {
			if (item.paid) return false;
			const s = this.getDueStatus(item.date);
			return s.soon && !s.overdue;
		}).length;
	}

	/**
	 * Counts active items whose due date has already passed.
	 *
	 * @returns The count of overdue items.
	 */
	protected get overdueCount(): number {
		return (this.updatedDebtSonataItems ?? []).filter((item: any) => {
			if (item.paid) return false;
			return this.getDueStatus(item.date).overdue;
		}).length;
	}

	/**
	 * Gets the total number of payments recorded in-session across all items.
	 *
	 * @returns The sum of all history entry counts.
	 */
	protected get totalPayments(): number {
		return Object.values(this.paymentsData).reduce((sum, h) => sum + Object.keys(h).length, 0);
	}

	/**
	 * Gets the category definition for the given item, assigned
	 * deterministically via a hash of the item's name.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns The DebtCategoryDef containing icon, label, and gradient.
	 */
	protected getCategoryForItem(item: any): DebtCategoryDef {
		if (item[DEBT_VALUE_KEY_CATEGORY]) {
			const stored = this.categoryDefs.find(
				(categoryDef) => categoryDef.key === item[DEBT_VALUE_KEY_CATEGORY]
			);
			if (stored) return stored;
		}
		return this.categoryDefs[this.getCategoryIndexForItem(item)];
	}

	/**
	 * Gets a human-readable due-date label for display in the due chip.
	 * Shows "Nd overdue", "N days left", "Due today/tomorrow", or a
	 * formatted month-day-year string for dates further than 30 days out.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns The due label string.
	 */
	protected getDueLabelForItem(item: any): string {
		const dateStr: string | null | undefined = item.date;
		if (!dateStr) return DEBT_DUE_LABEL_NONE;
		const diffDays = Utilities.getDaysUntilNumber(dateStr);
		if (diffDays === null) return DEBT_DUE_LABEL_NONE;
		if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
		if (diffDays === 0) return DEBT_DUE_LABEL_TODAY;
		if (diffDays === 1) return DEBT_DUE_LABEL_TOMORROW;
		if (diffDays <= 30) return `${diffDays}d left`;
		// More than 30 days out — show the full calendar date instead of a relative count
		const due = new Date(dateStr + 'T00:00');
		const m = MONTH_NAMES_SHORT[due.getMonth()];
		return `${m} ${due.getDate()}, ${due.getFullYear()}`;
	}

	/**
	 * Gets the Material Symbols icon name for the given item's due chip.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns The icon ligature string.
	 */
	protected getDueIconForItem(item: any): string {
		const status = this.getDueStatus(item.date);
		if (status.overdue) return DEBT_DUE_ICON_OVERDUE;
		return DEBT_DUE_ICON_DEFAULT;
	}

	/**
	 * Gets the CSS modifier class for the given item's due chip.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns 'is-over', 'is-soon', or empty string.
	 */
	protected getDueClassForItem(item: any): string {
		const status = this.getDueStatus(item.date);
		if (status.overdue) return DEBT_DUE_CLASS_OVERDUE;
		if (status.soon) return DEBT_DUE_CLASS_SOON;
		return '';
	}

	/**
	 * Formats an amount as a currency string with 0–2 decimal places.
	 * Places the minus sign before the symbol for negative values (e.g. -¥50).
	 * Uses ¥ for Chinese items, $ for all others.
	 *
	 * @param amount - The numeric value to format.
	 * @param isChinese - Whether to use the ¥ symbol.
	 * @returns A formatted currency string.
	 */
	protected formatMoney(amount: number, isChinese: boolean): string {
		const symbol = isChinese ? DEBT_CURRENCY_SYMBOL_CNY : DEBT_CURRENCY_SYMBOL_CAD;
		const formatted = Math.abs(amount).toLocaleString('en-US', {
			minimumFractionDigits: 0,
			maximumFractionDigits: 2
		});
		return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
	}

	/**
	 * Formats an amount as a compact currency string (e.g. $1k for 1000).
	 * Used for the preset chip labels.
	 *
	 * @param amount - The numeric value to format.
	 * @param isChinese - Whether to use the ¥ symbol.
	 * @returns A compact currency label string.
	 */
	protected formatCompact(amount: number, isChinese: boolean): string {
		const symbol = isChinese ? DEBT_CURRENCY_SYMBOL_CNY : DEBT_CURRENCY_SYMBOL_CAD;
		if (amount >= 1000) return `${symbol}${Math.floor(amount / 1000)}k`;
		return `${symbol}${amount}`;
	}

	/**
	 * Computes the repayment progress percentage for a single item.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns A whole-number percentage between 0 and 100.
	 */
	protected getDebtProgress(item: any): number {
		const original: number = item.original ?? 0;
		if (original <= 0) return item.paid ? 100 : 0;
		const repaid = Math.max(0, original - (item.debt ?? 0));
		return Math.min(100, Math.round((repaid / original) * 100));
	}

	/**
	 * Delegates to Utilities to get the short month-day label from a payment timestamp string.
	 *
	 * @param timestamp - The payment timestamp in `'YYYY.MM.DD HH:mm:ss'` format.
	 * @returns A formatted date string such as "Jun 13".
	 */
	protected formatTimestampDate(timestamp: string): string {
		return Utilities.getTimestampMonthDay(timestamp);
	}

	/**
	 * Delegates to Utilities to get the HH:mm portion from a payment timestamp string.
	 *
	 * @param timestamp - The payment timestamp in `'YYYY.MM.DD HH:mm:ss'` format.
	 * @returns A formatted time string such as "09:27".
	 */
	protected formatTimestampTime(timestamp: string): string {
		return Utilities.getTimestampTime(timestamp);
	}

	/**
	 * Returns true when the given item is marked as a permanent account,
	 * meaning it is protected from deletion until unlocked.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns Whether the item has type 'permanent'.
	 */
	protected isItemPermanent(item: any): boolean {
		return item.type === DEBT_TYPE_PERMANENT;
	}

	/**
	 * Returns true when the item's currency is CNY. Uses the stored currency
	 * field as the authoritative source; falls back to Chinese-character detection
	 * on the item name for legacy records that pre-date explicit currency selection.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns Whether the item's currency is CNY.
	 */
	protected isCnyCurrency(item: any): boolean {
		const stored = item[DEBT_VALUE_KEY_CURRENCY];
		if (stored) return stored === DEBT_CURRENCY_CNY;
		return Utilities.checkIfChinese(item.name ?? '');
	}

	/**
	 * Returns true when the payment chips for the given item should be disabled.
	 * Chips are disabled when the item is marked paid or when the remaining balance
	 * is zero or negative — there is nothing left to subtract.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns Whether the payment chips should be in a disabled state.
	 */
	protected isPayDisabled(item: any): boolean {
		return item.paid || item.debt <= 0;
	}

	/**
	 * Gets the indexed payment history entries for the given entry key,
	 * preserving the integer index so the delete action can target the
	 * correct field in the payments record.
	 *
	 * @param key - The unique key of the entry.
	 * @returns An array of objects containing the integer index and the payment entry value.
	 */
	protected getHistoryEntries(key: string): { index: number; value: PaymentEntry }[] {
		return Object.entries(this.paymentsData[key] ?? {}).map(([i, v]) => ({ index: +i, value: v }));
	}
}
