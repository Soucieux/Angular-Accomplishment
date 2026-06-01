import {
	AfterViewChecked,
	ChangeDetectorRef,
	Component,
	Inject,
	OnDestroy,
	OnInit,
	PLATFORM_ID,
	ViewChild,
	ViewContainerRef
} from '@angular/core';
import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SkeletonModule } from 'primeng/skeleton';
import { Subscription } from 'rxjs';
import { LOG } from '../../common/app.logs';
import { Utilities } from '../../common/app.utilities';
import {
	ACTIVITY_TYPE_UPDATED,
	COMPONENT_DESTROY,
	DATABASE_DEBT_SONATA,
	DEBT_PROMPT_TIMEOUT_MS,
	DEBT_CAT_CARD,
	DEBT_CAT_HOME,
	DEBT_CAT_PERSON,
	DEBT_CAT_SHOPPING,
	DEBT_CURRENCY_CNY,
	DEBT_EMPTY_STATE_BTN,
	DEBT_EMPTY_STATE_MSG,
	DEBT_CUSTOM_INPUT_PLACEHOLDER,
	DEBT_LABEL_DELETE_CONFIRM,
	DEBT_PRESET_LARGE,
	DEBT_PRESET_SMALL,
	DEBT_TYPE_GOAL,
	DEBT_TYPE_PERMANENT,
	DEBT_ITEM_EXPENSE,
	DEBT_STATS_UPCOMING,
	DEBT_TABLE_ACCOUNT_EXPENSES,
	DEBT_VALUE_KEY_CUR,
	DEBT_VALUE_KEY_DATE,
	DEBT_VALUE_KEY_DEBT,
	DEBT_VALUE_KEY_ORIGINAL,
	DEBT_VALUE_KEY_PAID,
	DEBT_VALUE_KEY_TYPE,
	DIALOG_ADD_DEBT,
	DIALOG_EDIT_DEBT,
	ERROR_PERMISSION_DENIED,
	MONTH_NAMES_SHORT,
	STATS_FIELD_RECENT_DEBT
} from '../../common/app.constant';
import { NewDebtData } from '../../backend/dialog-service/add-debt/add-debt.model';
import { EditDebtData } from '../../backend/dialog-service/edit-debt/edit-debt.model';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { DatabaseService } from '../../backend/database-service/database.service';
import { AccessDeniedComponent } from '../../common/access-denied/access-denied.component';

/** A single recorded payment entry, tracked in-memory per session. */
interface PaymentEntry {
	amount: number;
	balance: number;
	ts: number;
}

/** Category visual definition: key identifier, icon ligature, display label, and gradient CSS value. */
interface CategoryDef {
	key: string;
	icon: string;
	label: string;
	grad: string;
}

@Component({
	selector: 'debt',
	imports: [DecimalPipe, FormsModule, SkeletonModule, AccessDeniedComponent],
	templateUrl: './debt.component.html',
	styleUrls: ['../../common/page.card.css', './debt.component.css']
})
export class DebtComponent implements OnInit, OnDestroy, AfterViewChecked {
	private readonly className = 'DebtComponent';
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	protected readonly DATABASE_DEBT_SONATA = DATABASE_DEBT_SONATA;
	protected readonly DEBT_PRESET_SMALL = DEBT_PRESET_SMALL;
	protected readonly DEBT_PRESET_LARGE = DEBT_PRESET_LARGE;
	protected readonly DEBT_EMPTY_STATE_MSG = DEBT_EMPTY_STATE_MSG;
	protected readonly DEBT_EMPTY_STATE_BTN = DEBT_EMPTY_STATE_BTN;
	protected readonly DEBT_CUSTOM_INPUT_PLACEHOLDER = DEBT_CUSTOM_INPUT_PLACEHOLDER;
	protected readonly DEBT_LABEL_DELETE_CONFIRM = DEBT_LABEL_DELETE_CONFIRM;
	protected loading = true;
	protected isHoverCapable!: boolean;
	// any: Account Expenses rows are schema-less CloudBase documents with no fixed TypeScript type
	protected updatedDebtSonataItems!: any[];
	// any: Account Expenses rows are schema-less CloudBase documents with no fixed TypeScript type
	protected originalDebtSonataItems!: any[];
	protected expandedItems: Record<string, boolean> = {};
	protected balanceBumpItems: Record<string, boolean> = {};
	protected isPromptedReset: Record<string, boolean> = {};
	protected isPromptedDelete: Record<string, boolean> = {};
	protected customInputState: Record<string, string | null> = {};
	protected saveIndicators: boolean = false;
	private debtSonataSub?: Subscription;
	private upcomingExpenses: any[] = [];
	private paymentHistoryMap: Record<string, PaymentEntry[]> = {};
	private promptedResetTimers: Record<string, ReturnType<typeof setTimeout>> = {};
	private promptedDeleteTimers: Record<string, ReturnType<typeof setTimeout>> = {};
	private balanceBumpTimers: Record<string, ReturnType<typeof setTimeout>> = {};
	// any: setTimeout return type varies by environment (browser vs Node)
	private saveIndicatorTimeout: ReturnType<typeof setTimeout> | null = null;
	private syncStatTimer: ReturnType<typeof setTimeout> | null = null;
	private readonly categoryDefs: CategoryDef[] = [
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

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		private dialogService: DialogService,
		private databaseService: DatabaseService,
		private cdr: ChangeDetectorRef,
		protected utilities: Utilities
	) {}

	/**
	 * Attaches the auto-hide scroll listener to the page container after each view check.
	 */
	ngAfterViewChecked(): void {
		if (isPlatformBrowser(this.platformId)) {
			document
				.querySelectorAll<HTMLElement>('.container.page-card')
				.forEach((el) => Utilities.attachScrollAutoHide(el));
		}
	}

	/**
	 * Initialises the component: checks hover capability and subscribes to the
	 * Account Expenses observable. The subscription populates both the display
	 * and original-value arrays and syncs upcoming items to the statistics collection.
	 */
	ngOnInit() {
		if (isPlatformBrowser(this.platformId)) {
			this.isHoverCapable = this.utilities.checkIfHoverCapable();
			this.debtSonataSub = this.databaseService.getDebtSonataTableDetails().subscribe((rows) => {
				this.updatedDebtSonataItems = structuredClone(rows);
				this.originalDebtSonataItems = structuredClone(rows);
				this.loading = false;
				this.cdr.detectChanges();
				this.upcomingExpenses = rows
					.filter((item: any) => item.content?.date && !item.content?.paid)
					.map((item: any) => ({
						type: DEBT_ITEM_EXPENSE,
						name: item.name,
						date: item.content.date
					}));
				this.syncStatistics();
			});
		}
	}

	/**
	 * Unsubscribes from the Account Expenses subscription and clears all
	 * prompted-button and balance-bump timers.
	 */
	ngOnDestroy() {
		this.debtSonataSub?.unsubscribe();
		this.dialogComponentContainer?.clear();
		Object.values(this.promptedResetTimers).forEach(clearTimeout);
		Object.values(this.promptedDeleteTimers).forEach(clearTimeout);
		Object.values(this.balanceBumpTimers).forEach(clearTimeout);
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	// ── Preset chip interactions ──────────────────────────────────────────────

	/**
	 * Subtracts the given amount from the item's debt balance and persists
	 * the change. Auto-marks the item as paid when the balance reaches zero.
	 * Tracks the payment in the in-session history map and briefly scales the
	 * balance display via the is-bump CSS class for 360 ms.
	 *
	 * @param entryKey - The unique key of the Account Expenses entry to pay.
	 * @param amount - The positive amount to subtract from the current balance.
	 */
	protected async payDebt(entryKey: string, amount: number): Promise<void> {
		const item = this.findUpdatedItem(entryKey);
		if (!item || amount <= 0 || item.content?.paid) return;
		const currentDebt: number = item.content?.debt ?? 0;
		const newDebt = Math.max(0, Math.round((currentDebt - amount) * 100) / 100);
		const isPaidOff = newDebt === 0;
		item.content.debt = newDebt;
		if (isPaidOff) item.content.paid = true;
		await this.updateTableSingleValue(entryKey, DEBT_VALUE_KEY_DEBT);
		if (isPaidOff) {
			await this.updateTableSingleValue(entryKey, DEBT_VALUE_KEY_PAID);
		}
		this.paymentHistoryMap = {
			...this.paymentHistoryMap,
			[entryKey]: [
				...(this.paymentHistoryMap[entryKey] ?? []),
				{ amount, balance: newDebt, ts: Date.now() }
			]
		};
		this.balanceBumpItems = { ...this.balanceBumpItems, [entryKey]: true };
		this.cdr.detectChanges();
		if (this.balanceBumpTimers[entryKey]) clearTimeout(this.balanceBumpTimers[entryKey]);
		this.balanceBumpTimers[entryKey] = setTimeout(() => {
			this.balanceBumpItems = { ...this.balanceBumpItems, [entryKey]: false };
			this.cdr.detectChanges();
		}, 360);
		this.resyncUpcomingFromLocalData();
		this.databaseService
			.appendToActivityLog(STATS_FIELD_RECENT_DEBT, {
				type: ACTIVITY_TYPE_UPDATED,
				table: DEBT_TABLE_ACCOUNT_EXPENSES,
				text: item.name ?? '',
				timestamp: Utilities.getCurrentFormattedTime(true)
			})
			.catch(() => {});
	}

	/**
	 * Shows the custom-amount chip input for the given entry,
	 * clearing any previous value.
	 *
	 * @param entryKey - The unique key of the entry to show custom input for.
	 */
	protected toggleCustomInput(entryKey: string): void {
		this.customInputState = { ...this.customInputState, [entryKey]: '' };
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

	// ── Two-step confirm interactions ─────────────────────────────────────────

	/**
	 * First call prompts the Reset button; second call within 2.6 s executes
	 * the reset. Prompted state auto-dismisses after the timeout.
	 *
	 * @param entryKey - The unique key of the entry to reset.
	 */
	protected promptOrConfirmReset(entryKey: string): void {
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
		if (this.isPromptedDelete[entryKey]) {
			clearTimeout(this.promptedDeleteTimers[entryKey]);
			this.isPromptedDelete = { ...this.isPromptedDelete, [entryKey]: false };
			this.deleteDebt(entryKey).catch(() => {});
		} else {
			this.isPromptedDelete = { ...this.isPromptedDelete, [entryKey]: true };
			this.promptedDeleteTimers[entryKey] = setTimeout(() => {
				this.isPromptedDelete = { ...this.isPromptedDelete, [entryKey]: false };
				this.cdr.detectChanges();
			}, DEBT_PROMPT_TIMEOUT_MS);
		}
	}

	// ── History panel interaction ─────────────────────────────────────────────

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

	// ── Internal data methods ─────────────────────────────────────────────────

	/**
	 * Creates a new debt record in CloudBase from the data returned by the
	 * add-debt dialog. The category, currency, and permanent type are
	 * stored in the content object alongside the initial balance.
	 *
	 * @param debtData - The validated form data submitted from the add-debt dialog.
	 */
	private async addNewDebt(debtData: NewDebtData): Promise<void> {
		try {
			await this.databaseService.addNewRecordToDebtTable({
				name: debtData.name,
				debt: debtData.amount,
				original: debtData.amount,
				date: debtData.dueDate,
				paid: false,
				type: debtData.isPermanent ? DEBT_TYPE_PERMANENT : DEBT_TYPE_GOAL,
				cat: debtData.category,
				cur: debtData.currency
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
		const item = this.findUpdatedItem(entryKey);
		if (!item) return;
		const newType =
			(item.content?.type ?? DEBT_TYPE_GOAL) === DEBT_TYPE_PERMANENT
				? DEBT_TYPE_GOAL
				: DEBT_TYPE_PERMANENT;
		item.content = { ...item.content, type: newType };
		await this.updateTableSingleValue(entryKey, DEBT_VALUE_KEY_TYPE);
	}

	/**
	 * Resets the debt balance to its original amount and marks the entry as
	 * unpaid. Writes the full content object to CloudBase in one operation.
	 *
	 * @param entryKey - The unique key of the entry to reset.
	 */
	private async resetDebt(entryKey: string): Promise<void> {
		const item = this.findUpdatedItem(entryKey);
		const original = this.findOriginalItem(entryKey);
		if (!item || !original) return;
		const originalAmount: number = original.content?.original ?? item.content?.original ?? 0;
		item.content.debt = originalAmount;
		item.content.paid = false;
		await this.updateTableSingleValue(entryKey, DEBT_VALUE_KEY_DEBT);
		await this.updateTableSingleValue(entryKey, DEBT_VALUE_KEY_PAID);
		this.paymentHistoryMap = { ...this.paymentHistoryMap, [entryKey]: [] };
		this.resyncUpcomingFromLocalData();
	}

	/**
	 * Removes the entry from the CloudBase collection. The realtime
	 * subscription will update the display arrays automatically.
	 *
	 * @param entryKey - The unique key of the entry to delete.
	 */
	private async deleteDebt(entryKey: string): Promise<void> {
		try {
			await this.databaseService.removeRecordFromDebtTable(entryKey);
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
		}
	}

	/**
	 * Reads the updated value for the given field and writes it to CloudBase.
	 * Skips the write when the value has not changed. Rolls back the local change
	 * on permission error before showing the dialog. All field-level updates in
	 * this class route through here — only add and delete operations call the
	 * database service directly.
	 *
	 * {@link payDebt} - Persists the new debt balance, and the paid flag when zeroed.
	 * {@link resetDebt} - Restores debt and paid flag to original values.
	 * {@link toggleLock} - Persists the toggled goal/permanent type.
	 * {@link editDebt} - Persists the updated balance, original, due date, and currency from the edit dialog.
	 *
	 * @param entryKey - The unique key of the entry to update.
	 * @param valueKey - The field name inside the entry's content object.
	 */
	private async updateTableSingleValue(entryKey: string, valueKey: string): Promise<void> {
		const updatedItem = this.findUpdatedItem(entryKey);
		const originalItem = this.findOriginalItem(entryKey);
		if (!updatedItem || !originalItem) return;
		const updatedValue = updatedItem.content[valueKey];
		const oldValue = originalItem.content[valueKey];
		try {
			if (updatedValue !== oldValue) {
				await this.databaseService.updateDebtTable(entryKey, valueKey, updatedValue);
				this.triggerSaveIndicator();
			}
		} catch (error) {
			if (error instanceof Error && error.message === ERROR_PERMISSION_DENIED) {
				const rollback = this.findUpdatedItem(entryKey);
				const rollbackOriginal = this.findOriginalItem(entryKey);
				if (rollback && rollbackOriginal) {
					rollback.content[valueKey] = rollbackOriginal.content[valueKey];
				}
			}
			this.dialogService.handleError(this.dialogComponentContainer, error);
		}
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
				[DEBT_STATS_UPCOMING]: [...this.upcomingExpenses]
			});
		}, 0);
	}

	/**
	 * Recomputes upcoming expenses from local data and syncs to statistics
	 * without waiting for a CloudBase subscription callback.
	 */
	private resyncUpcomingFromLocalData(): void {
		this.upcomingExpenses = (this.updatedDebtSonataItems ?? [])
			.filter((item: any) => item.content?.date && !item.content?.paid)
			.map((item: any) => ({
				type: DEBT_ITEM_EXPENSE,
				name: item.name,
				date: item.content.date
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
	 * Returns a stable category definition for the given item based on a
	 * hash of the item's name, ensuring the same name always maps to the
	 * same category gradient regardless of sort order.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns A CategoryDef with icon, label, and gradient CSS value.
	 */
	private getCategoryIndexForItem(item: any): number {
		// any: item mirrors the schema-less CloudBase document structure
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

	// ── Template helpers ──────────────────────────────────────────────────────

	/**
	 * Returns the Account Expenses items in their original database order,
	 * preserving position regardless of paid status.
	 *
	 * @returns The Account Expenses items array.
	 */
	protected get sortedItems(): any[] {
		return this.updatedDebtSonataItems ?? [];
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
			const isCN = Utilities.checkIfChinese(item.name ?? '');
			const code = isCN ? 'CNY' : 'CAD';
			if (!groups[code]) groups[code] = { owed: 0, original: 0 };
			groups[code].owed += item.content?.debt ?? 0;
			groups[code].original += item.content?.original ?? 0;
		}
		return Object.entries(groups).map(([code, g]) => {
			const paidAmount = Math.max(0, g.original - g.owed);
			const pct = g.original > 0 ? Math.min(100, Math.round((paidAmount / g.original) * 100)) : 0;
			return {
				code,
				symbol: code === 'CNY' ? '¥' : '$',
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
		return (this.updatedDebtSonataItems ?? []).filter((item: any) => !item.content?.paid).length;
	}

	/**
	 * Counts Account Expenses items that have been marked as paid.
	 *
	 * @returns The number of paid items.
	 */
	protected get paidCount(): number {
		return (this.updatedDebtSonataItems ?? []).filter((item: any) => item.content?.paid).length;
	}

	/**
	 * Counts active items whose due date falls within the next 14 days.
	 *
	 * @returns The count of items due within 14 days.
	 */
	protected get dueSoonCount(): number {
		return (this.updatedDebtSonataItems ?? []).filter((item: any) => {
			if (item.content?.paid) return false;
			const s = this.getDueStatus(item.content?.date);
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
			if (item.content?.paid) return false;
			return this.getDueStatus(item.content?.date).overdue;
		}).length;
	}

	/**
	 * Returns the total number of payments recorded in-session across all items.
	 *
	 * @returns The sum of all history entry counts.
	 */
	protected get totalPayments(): number {
		return Object.values(this.paymentHistoryMap).reduce((sum, h) => sum + h.length, 0);
	}

	/**
	 * Returns the category definition for the given item, assigned
	 * deterministically via a hash of the item's name.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns The CategoryDef containing icon, label, and grad.
	 */
	protected getCategoryForItem(item: any): CategoryDef {
		if (item.content?.cat) {
			const stored = this.categoryDefs.find((c) => c.key === item.content.cat);
			if (stored) return stored;
		}
		return this.categoryDefs[this.getCategoryIndexForItem(item)];
	}

	/**
	 * Returns a human-readable due-date label for display in the due chip.
	 * Shows "Nd overdue", "N days left", "Due today/tomorrow", or a
	 * formatted month-day-year string for dates further than 30 days out.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns The due label string.
	 */
	protected getDueLabelForItem(item: any): string {
		const dateStr: string | null | undefined = item.content?.date;
		if (!dateStr) return 'No due date';
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		const due = new Date(dateStr + 'T00:00');
		const diffDays = Math.round((due.getTime() - now.getTime()) / 86400000);
		if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
		if (diffDays === 0) return 'Due today';
		if (diffDays === 1) return 'Due tomorrow';
		if (diffDays <= 30) return `${diffDays}d left`;
		const m = MONTH_NAMES_SHORT[due.getMonth()];
		return `${m} ${due.getDate()}, ${due.getFullYear()}`;
	}

	/**
	 * Returns the Material Symbols icon name for the given item's due chip.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns The icon ligature string.
	 */
	protected getDueIconForItem(item: any): string {
		const status = this.getDueStatus(item.content?.date);
		if (status.overdue) return 'error';
		return 'event';
	}

	/**
	 * Returns the CSS modifier class for the given item's due chip.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns 'is-over', 'is-soon', or empty string.
	 */
	protected getDueClassForItem(item: any): string {
		const status = this.getDueStatus(item.content?.date);
		if (status.overdue) return 'is-over';
		if (status.soon) return 'is-soon';
		return '';
	}

	/**
	 * Formats an amount as a currency string with two decimal places.
	 * Uses ¥ for Chinese items, $ for all others.
	 *
	 * @param amount - The numeric value to format.
	 * @param isChinese - Whether to use the ¥ symbol.
	 * @returns A formatted currency string.
	 */
	protected fmtMoney(amount: number, isChinese: boolean): string {
		const sym = isChinese ? '¥' : '$';
		return `${sym}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	/**
	 * Formats an amount as a compact currency string (e.g. $1k for 1000).
	 * Used for the preset chip labels.
	 *
	 * @param amount - The numeric value to format.
	 * @param isChinese - Whether to use the ¥ symbol.
	 * @returns A compact currency label string.
	 */
	protected fmtCompact(amount: number, isChinese: boolean): string {
		const sym = isChinese ? '¥' : '$';
		if (amount >= 1000) return `${sym}${Math.floor(amount / 1000)}k`;
		return `${sym}${amount}`;
	}

	/**
	 * Computes the repayment progress percentage for a single item.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns A whole-number percentage between 0 and 100.
	 */
	protected getDebtProgress(item: any): number {
		const original: number = item.content?.original ?? 0;
		if (original <= 0) return 0;
		const repaid = Math.max(0, original - (item.content?.debt ?? 0));
		return Math.min(100, Math.round((repaid / original) * 100));
	}

	/**
	 * Returns the in-session payment history for the given entry key.
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
	 * @param ts - Unix timestamp in milliseconds.
	 * @returns A formatted date-time string.
	 */
	protected formatTs(ts: number): string {
		const d = new Date(ts);
		const month = MONTH_NAMES_SHORT[d.getMonth()];
		const day = d.getDate();
		const hours = d.getHours();
		const minutes = d.getMinutes().toString().padStart(2, '0');
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
			DIALOG_ADD_DEBT,
			(debtData: NewDebtData) => this.addNewDebt(debtData).catch(() => {})
		);
	}

	/**
	 * Opens the edit-debt dialog pre-filled with the entry's current balance,
	 * due date, and currency. Wires the submit callback to persist any changed
	 * fields to CloudBase via {@link editDebt}.
	 *
	 * @param entryKey - The unique key of the entry to edit.
	 */
	protected openEditDebtDialog(entryKey: string): void {
		const item = this.findUpdatedItem(entryKey);
		if (!item) return;
		const prefill: EditDebtData = {
			amount: item.content?.debt ?? 0,
			dueDate: item.content?.date ?? '',
			currency: item.content?.cur ?? DEBT_CURRENCY_CNY
		};
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_EDIT_DEBT,
			prefill,
			(data: EditDebtData) => this.editDebt(entryKey, data).catch(() => {})
		);
	}

	/**
	 * Applies the changes submitted from the edit-debt dialog. Writes only
	 * the fields that actually changed — currency, balance, original total
	 * (when the new amount exceeds the old original), and due date.
	 *
	 * @param entryKey - The unique key of the entry to update.
	 * @param data - The validated form data returned by the edit-debt dialog.
	 */
	private async editDebt(entryKey: string, data: EditDebtData): Promise<void> {
		const item = this.findUpdatedItem(entryKey);
		if (!item) return;
		if (data.currency !== item.content?.cur) {
			item.content = { ...item.content, cur: data.currency };
			await this.updateTableSingleValue(entryKey, DEBT_VALUE_KEY_CUR);
		}
		if (data.amount !== item.content?.debt) {
			const oldOriginal: number = item.content?.original ?? 0;
			const newOriginal = Math.max(data.amount, oldOriginal);
			item.content = { ...item.content, debt: data.amount, original: newOriginal };
			await this.updateTableSingleValue(entryKey, DEBT_VALUE_KEY_DEBT);
			if (newOriginal !== oldOriginal) {
				await this.updateTableSingleValue(entryKey, DEBT_VALUE_KEY_ORIGINAL);
			}
		}
		if (data.dueDate !== item.content?.date) {
			item.content = { ...item.content, date: data.dueDate };
			await this.updateTableSingleValue(entryKey, DEBT_VALUE_KEY_DATE);
		}
		this.resyncUpcomingFromLocalData();
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
		return item.content?.type === DEBT_TYPE_PERMANENT;
	}

	/**
	 * Returns true when the item's currency is CNY, checking the stored
	 * currency field first and falling back to Chinese-character detection
	 * on the name for legacy records without a stored currency.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns Whether the item's currency is CNY.
	 */
	protected isCnyCurrency(item: any): boolean {
		if (item.content?.cur) return item.content.cur === DEBT_CURRENCY_CNY;
		return Utilities.checkIfChinese(item.name ?? '');
	}
}
