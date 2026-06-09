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
import { Utilities } from '../../common/app.utilities';
import {
	ACTIVITY_SOURCE_DEBT,
	ACTIVITY_TYPE_RESET,
	ACTIVITY_TYPE_UPDATED,
	COMPONENT_DESTROY,
	DATABASE_DEBT_SONATA,
	DEBT_PROMPT_TIMEOUT_MS,
	DEBT_CATEGORY_CARD,
	DEBT_CATEGORY_HOME,
	DEBT_CATEGORY_PERSON,
	DEBT_CATEGORY_SHOPPING,
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
	DEBT_TABLE_ACCOUNT_EXPENSES,
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
	HISTORY_STATUS_ADDED,
	HISTORY_STATUS_DELETED,
	STATS_FIELD_DEBT_TOTAL,
	STATS_FIELD_DEBT_UPCOMING,
	STATS_FIELD_RECENT_ACTIVITIES,
	DEBT_CATEGORY_LABEL_CARD,
	DEBT_CATEGORY_LABEL_PERSON,
	DEBT_CATEGORY_LABEL_SHOPPING,
	DEBT_CATEGORY_LABEL_HOME,
	DEBT_DUE_LABEL_NONE,
	DEBT_DUE_LABEL_TODAY,
	DEBT_DUE_LABEL_TOMORROW,
	DEBT_CURRENCY_SYMBOL_CNY,
	DEBT_CURRENCY_SYMBOL_CAD,
	DEBT_DUE_CLASS_OVERDUE,
	DEBT_DUE_CLASS_SOON,
	DEBT_DUE_ICON_OVERDUE,
	DEBT_DUE_ICON_DEFAULT,
	DEBT_CATEGORY_ICON_CARD,
	DEBT_CATEGORY_ICON_PERSON,
	DEBT_CATEGORY_ICON_SHOPPING,
	DEBT_CATEGORY_ICON_HOME,
	DEBT_CATEGORY_GRADIENT_CARD,
	DEBT_CATEGORY_GRADIENT_PERSON,
	DEBT_CATEGORY_GRADIENT_SHOPPING,
	DEBT_CATEGORY_GRADIENT_HOME,
	DEBT_SKELETON_COUNT
} from '../../common/app.constant';
import { DebtCategoryDef, MONTH_NAMES_SHORT, NewDebtData, PaymentEntry } from './debt.model';
import { DialogService } from '../../backend/dialog-service/dialog.service';
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
	protected loading = true;
	protected isHoverCapable!: boolean;
	protected updatedDebtSonataItems: any[] = [];
	protected originalDebtSonataItems!: any[];
	protected expandedItems: Record<string, boolean> = {};
	protected balanceBumpItems: Record<string, boolean> = {};
	protected isPromptedReset: Record<string, boolean> = {};
	protected isPromptedDelete: Record<string, boolean> = {};
	protected customInputState: Record<string, string | null> = {};
	protected saveIndicators: boolean = false;
	protected debtItems$!: Observable<any[]>;
	private upcomingExpenses: any[] = [];
	private paymentHistoryMap: Record<string, PaymentEntry[]> = {};
	private pendingWriteKeys = new Set<string>();
	private promptedResetTimers: Record<string, ReturnType<typeof setTimeout>> = {};
	private promptedDeleteTimers: Record<string, ReturnType<typeof setTimeout>> = {};
	private balanceBumpTimers: Record<string, ReturnType<typeof setTimeout>> = {};
	private saveIndicatorTimeout: ReturnType<typeof setTimeout> | null = null;
	private syncStatTimer: ReturnType<typeof setTimeout> | null = null;
	private readonly categoryDefs: DebtCategoryDef[] = [
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

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		private dialogService: DialogService,
		private databaseService: DatabaseService,
		private cdr: ChangeDetectorRef,
		private ngZone: NgZone,
		protected utilities: Utilities
	) {}


	/**
	 * Initialises the component: checks hover capability and builds the Account
	 * Expenses observable. The tap side-effect populates the display and
	 * original-value arrays and syncs upcoming items to the statistics collection.
	 * Items in pendingWriteKeys are shielded from overwrite to prevent the
	 * optimistic-update flip caused by CloudBase echoing stale data mid-write.
	 * The tap body runs inside ngZone.run() because CloudBase WebSocket callbacks
	 * fire outside Angular's zone. The async pipe in the template manages the
	 * subscription lifecycle and triggers change detection — no explicit
	 * detectChanges() call is needed or safe here.
	 */
	ngOnInit() {
		if (isPlatformBrowser(this.platformId)) {
			this.isHoverCapable = this.utilities.checkIfHoverCapable();

			/* If navigated from the home quick-action buttons, auto-open the add dialog.
			   history.state retains the router state passed via Router.navigate({ state: ... }).
			   Immediately clear the state so a page refresh does not re-trigger the dialog. */
			if (history.state?.openAddDialog) {
				history.replaceState({}, '');
				setTimeout(() => this.openNewDebtDialog(), 0);
			}

			this.debtItems$ = this.databaseService.getDebtSonataTableDetails().pipe(
				tap((rows) => {
					this.ngZone.run(() => {
						this.originalDebtSonataItems = structuredClone(rows);
						const currentByKey = new Map(
							this.updatedDebtSonataItems.map((item) => [item.key, item])
						);
						this.updatedDebtSonataItems = rows.map((row: any) =>
							this.pendingWriteKeys.has(row.key)
								? (currentByKey.get(row.key) ?? structuredClone(row))
								: structuredClone(row)
						);
						this.loading = false;
						this.upcomingExpenses = rows
							.filter((item: any) => item.date && !item.paid)
							.map((item: any) => ({
								type: DEBT_ITEM_EXPENSE,
								name: item.name,
								date: item.date
							}));
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
		this.dialogComponentContainer?.clear();
		Object.values(this.promptedResetTimers).forEach(clearTimeout);
		Object.values(this.promptedDeleteTimers).forEach(clearTimeout);
		Object.values(this.balanceBumpTimers).forEach(clearTimeout);
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	////////////////////// Below are Preset chip payment interaction handlers ///////////////////

	/**
	 * Subtracts the given amount from the item's debt balance and persists
	 * the change. The balance may go negative (overpayment is allowed).
	 * Auto-marks the item as paid when the balance reaches zero or below.
	 * Tracks the payment in the in-session history map and briefly scales the
	 * balance display via the is-bump CSS class for 360 ms.
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
		// Round to 2 decimal places to avoid floating-point drift accumulating over multiple payments
		const currentDebt: number = item.debt ?? 0;
		const newDebt = Math.round((currentDebt - amount) * 100) / 100;
		const isPaidOff = this.isDebtFullySettled(newDebt);
		/* Apply mutations synchronously before any DB write — immune to subscription replacements.
		   pendingWriteKeys shields this entry from subscription overwrites until the write settles. */
		this.pendingWriteKeys.add(entryKey);
		item.debt = newDebt;
		if (isPaidOff) item.paid = true;
		/* Write debt before paid so a subscription callback between the two writes shows
		   100% progress (debt=0, paid=false) rather than a transient 0% state (paid=true, debt=old) */
		try {
			await this.databaseService.updateDebtTable(entryKey, DEBT_VALUE_KEY_DEBT, newDebt);
			if (isPaidOff) {
				await this.databaseService.updateDebtTable(entryKey, DEBT_VALUE_KEY_PAID, true);
			}
			this.triggerSaveIndicator();
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
		} finally {
			this.pendingWriteKeys.delete(entryKey);
		}
		// Track per-entry payment history in-session so the history panel can display it without a DB read
		this.paymentHistoryMap = {
			...this.paymentHistoryMap,
			[entryKey]: [
				...(this.paymentHistoryMap[entryKey] ?? []),
				{ amount, balance: newDebt, timestamp: Date.now() }
			]
		};
		// Trigger the balance-bump animation, then clear the flag after the CSS transition completes
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

	////////////////////// Below are Internal data methods for CloudBase writes /////////////////

	/**
	 * Creates a new debt record in CloudBase from the data returned by the add-debt dialog.
	 *
	 * @param debtData - The validated form data submitted from the add-debt dialog.
	 */
	private async addNewDebt(debtData: NewDebtData): Promise<void> {
		try {
			await this.databaseService.addNewRecordToDebtTable({
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
			this.databaseService
				.appendToActivityLog(STATS_FIELD_RECENT_ACTIVITIES, {
					source: ACTIVITY_SOURCE_DEBT,
					type: HISTORY_STATUS_ADDED,
					name: debtData.name,
					timestamp: Utilities.getCurrentFormattedTime(true)
				})
				.catch(() => {});
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
		const newPaid = this.isDebtFullySettled(originalAmount);
		this.pendingWriteKeys.add(entryKey);
		item.debt = originalAmount;
		item.paid = newPaid;
		try {
			await this.databaseService.updateDebtTableFields(entryKey, {
				[DEBT_VALUE_KEY_DEBT]: originalAmount,
				[DEBT_VALUE_KEY_PAID]: newPaid
			});
			this.triggerSaveIndicator();
			this.databaseService
				.appendToActivityLog(STATS_FIELD_RECENT_ACTIVITIES, {
					source: ACTIVITY_SOURCE_DEBT,
					type: ACTIVITY_TYPE_RESET,
					name: item.name ?? '',
					timestamp: Utilities.getCurrentFormattedTime(true)
				})
				.catch(() => {});
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
		} finally {
			this.pendingWriteKeys.delete(entryKey);
		}
		this.paymentHistoryMap = { ...this.paymentHistoryMap, [entryKey]: [] };
		this.resyncUpcomingFromLocalData();
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
			await this.databaseService.removeRecordFromDebtTable(entryKey);
			this.databaseService
				.appendToActivityLog(STATS_FIELD_RECENT_ACTIVITIES, {
					source: ACTIVITY_SOURCE_DEBT,
					type: HISTORY_STATUS_DELETED,
					name: debtName,
					timestamp: Utilities.getCurrentFormattedTime(true)
				})
				.catch(() => {});
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
		this.pendingWriteKeys.add(entryKey);
		try {
			if (updatedValue !== oldValue) {
				await this.databaseService.updateDebtTable(entryKey, valueKey, updatedValue);
				this.triggerSaveIndicator();
			}
		} catch (error) {
			if (error instanceof Error && error.message === ERROR_PERMISSION_DENIED) {
				updatedItem[valueKey] = oldValue;
			}
			this.dialogService.handleError(this.dialogComponentContainer, error);
		} finally {
			this.pendingWriteKeys.delete(entryKey);
		}
	}

	/**
	 * Returns true when the given amount should be treated as fully settled.
	 * Any amount at or below zero is considered paid off.
	 * Single source of truth for the settled threshold used across all write paths.
	 *
	 * {@link payDebt} - Checks the balance remaining after a chip payment.
	 * {@link addNewDebt} - Checks the amount on a newly created record.
	 * {@link setDebtForCycle} - Checks the amount entered via the Set dialog.
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
	 * Recomputes upcoming expenses from local data and syncs to statistics
	 * without waiting for a CloudBase subscription callback.
	 */
	private resyncUpcomingFromLocalData(): void {
		this.upcomingExpenses = (this.updatedDebtSonataItems ?? [])
			.filter((item: any) => item.date && !item.paid)
			.map((item: any) => ({
				type: DEBT_ITEM_EXPENSE,
				name: item.name,
				date: item.date
			}));
		this.syncStatistics();
	}

	/**
	 * Shows a save-confirmation indicator for the given table and hides
	 * it after one second. Clears any active timeout before starting a new one.
	 */
	private triggerSaveIndicator(): void {
		this.saveIndicators = true;
		this.cdr.detectChanges();
		if (this.saveIndicatorTimeout) {
			clearTimeout(this.saveIndicatorTimeout);
		}
		this.saveIndicatorTimeout = setTimeout(() => {
			this.saveIndicators = false;
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
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		const due = new Date(dateStr + 'T00:00');
		const diffDays = Math.round((due.getTime() - now.getTime()) / 86400000);
		return { overdue: diffDays < 0, soon: diffDays >= 0 && diffDays <= 14 };
	}

	////////////////////// Below are Template helper methods for the HTML template ///////////////

	/**
	 * Groups Account Expenses items by currency (CNY for Chinese names,
	 * CAD otherwise) and computes totals and progress for the summary bar.
	 *
	 * @returns An array of per-currency summary objects.
	 */
	/**
	 * Returns the array of indices used to render skeleton loading cards,
	 * sized to match the fixed skeleton count for this page.
	 *
	 * @returns Array of 0-based indices with length equal to DEBT_SKELETON_COUNT.
	 */
	protected get skeletonItems(): number[] {
		return Array.from({ length: DEBT_SKELETON_COUNT }, (_, i) => i);
	}

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
		return Object.values(this.paymentHistoryMap).reduce((sum, h) => sum + h.length, 0);
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
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		const due = new Date(dateStr + 'T00:00');
		const diffDays = Math.round((due.getTime() - now.getTime()) / 86400000);
		if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
		if (diffDays === 0) return DEBT_DUE_LABEL_TODAY;
		if (diffDays === 1) return DEBT_DUE_LABEL_TOMORROW;
		if (diffDays <= 30) return `${diffDays}d left`;
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
	 * Gets the in-session payment history for the given entry key.
	 *
	 * @param entryKey - The unique key of the entry.
	 * @returns The array of payment entries recorded this session.
	 */
	protected getHistoryForItem(entryKey: string): PaymentEntry[] {
		return this.paymentHistoryMap[entryKey] ?? [];
	}

	/**
	 * Formats a Unix timestamp as a human-readable datetime string
	 * in the form "Mon D · h:mm AM" for the payment history list.
	 *
	 * @param timestamp - The Unix timestamp in milliseconds.
	 * @returns A formatted date-time string.
	 */
	protected formatTimestamp(timestamp: number): string {
		const date = new Date(timestamp);
		const month = MONTH_NAMES_SHORT[date.getMonth()];
		const day = date.getDate();
		const hours = date.getHours();
		const minutes = date.getMinutes().toString().padStart(2, '0');
		const ampm = hours >= 12 ? 'PM' : 'AM';
		const h12 = hours % 12 || 12;
		return `${month} ${day} · ${h12}:${minutes} ${ampm}`;
	}

	/**
	 * Delegates to Utilities.checkIfChinese to check whether the text
	 * contains at least one Chinese character.
	 *
	 * @param text - The text string to check.
	 * @returns True if the text contains at least one Chinese character.
	 */
	protected checkIfChinese(text: string): boolean {
		return Utilities.checkIfChinese(text);
	}

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
	 * values to CloudBase via {@link setDebtForCycle}.
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
			(data: NewDebtData) => this.setDebtForCycle(entryKey, data).catch(() => {}),
			prefillData
		);
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
	private async setDebtForCycle(entryKey: string, data: NewDebtData): Promise<void> {
		const item = this.findUpdatedItem(entryKey);
		const original = this.findOriginalItem(entryKey);
		if (!item || !original) return;

		/* Apply all local mutations synchronously before any DB write so the UI
		   reflects the intended state regardless of subscription timing.
		   pendingWriteKeys shields this entry from subscription overwrites until the write settles. */
		const newPaid = this.isDebtFullySettled(data.amount);
		this.pendingWriteKeys.add(entryKey);
		if (data.currency !== original[DEBT_VALUE_KEY_CURRENCY])
			item[DEBT_VALUE_KEY_CURRENCY] = data.currency;
		item[DEBT_VALUE_KEY_DEBT] = data.amount;
		item[DEBT_VALUE_KEY_ORIGINAL] = data.amount;
		item[DEBT_VALUE_KEY_PAID] = newPaid;
		if (data.dueDate !== original.date) item[DEBT_VALUE_KEY_DATE] = data.dueDate;
		if (data.amount !== original.debt) {
			this.paymentHistoryMap = { ...this.paymentHistoryMap, [entryKey]: [] };
		}

		// Build a single update object with only changed fields — one round-trip instead of up to five.
		const fields: Record<string, unknown> = {};
		if (data.currency !== original[DEBT_VALUE_KEY_CURRENCY])
			fields[DEBT_VALUE_KEY_CURRENCY] = data.currency;
		if (data.amount !== original.debt) fields[DEBT_VALUE_KEY_DEBT] = data.amount;
		if (data.amount !== original.original) fields[DEBT_VALUE_KEY_ORIGINAL] = data.amount;
		if (original.paid !== newPaid) fields[DEBT_VALUE_KEY_PAID] = newPaid;
		if (data.dueDate !== original.date) fields[DEBT_VALUE_KEY_DATE] = data.dueDate;
		try {
			if (Object.keys(fields).length > 0) {
				await this.databaseService.updateDebtTableFields(entryKey, fields);
				this.triggerSaveIndicator();
			}
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
		} finally {
			this.pendingWriteKeys.delete(entryKey);
		}
		this.resyncUpcomingFromLocalData();
		this.databaseService
			.appendToActivityLog(STATS_FIELD_RECENT_ACTIVITIES, {
				source: ACTIVITY_SOURCE_DEBT,
				type: ACTIVITY_TYPE_UPDATED,
				name: item.name ?? '',
				timestamp: Utilities.getCurrentFormattedTime(true)
			})
			.catch(() => {});
		this.cdr.detectChanges();
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
}
