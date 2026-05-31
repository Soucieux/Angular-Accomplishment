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
import { DatePickerModule } from 'primeng/datepicker';
import { Subscription } from 'rxjs';
import { LOG } from '../../common/app.logs';
import { Utilities } from '../../common/app.utilities';
import {
	ACTIVITY_TYPE_UPDATED,
	COMPONENT_DESTROY,
	DATABASE_DEBT_SONATA,
	DEBT_ARMED_TIMEOUT_MS,
	DEBT_PRESET_LARGE,
	DEBT_PRESET_SMALL,
	ERROR_PERMISSION_DENIED,
	MONTH_NAMES_SHORT,
	REMINDER_ITEM_EXPENSE,
	REMINDER_TABLE_ACCOUNT_EXPENSES,
	REMINDER_VALUE_KEY_CONTENT,
	REMINDER_VALUE_KEY_DATE,
	REMINDER_VALUE_KEY_DEBT,
	REMINDER_VALUE_KEY_PAID,
	STATS_FIELD_RECENT_REMINDER,
	STATS_FIELD_REMINDER_UPCOMING
} from '../../common/app.constant';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { DatabaseService } from '../../backend/database-service/database.service';
import { AccessDeniedComponent } from '../../common/access-denied/access-denied.component';

/** A single recorded payment entry, tracked in-memory per session. */
interface PaymentEntry {
	amount: number;
	balance: number;
	ts: number;
}

/** Category visual definition: icon ligature, display label, and gradient CSS value. */
interface CategoryDef {
	icon: string;
	label: string;
	grad: string;
}

@Component({
	selector: 'debt',
	imports: [DecimalPipe, FormsModule, SkeletonModule, DatePickerModule, AccessDeniedComponent],
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
	protected loading = true;
	protected isHoverCapable!: boolean;
	// any: Account Expenses rows are schema-less CloudBase documents with no fixed TypeScript type
	protected updatedDebtSonataItems!: any[];
	// any: Account Expenses rows are schema-less CloudBase documents with no fixed TypeScript type
	protected originalDebtSonataItems!: any[];
	protected expandedItems: Record<string, boolean> = {};
	protected isArmedReset: Record<string, boolean> = {};
	protected isArmedDelete: Record<string, boolean> = {};
	protected showCustomInput: Record<string, boolean> = {};
	protected customInputValues: Record<string, string> = {};
	protected showDuePicker: Record<string, boolean> = {};
	protected saveIndicators: Record<string, boolean> = { [DATABASE_DEBT_SONATA]: false };
	private debtSonataSub?: Subscription;
	private upcomingExpenses: any[] = [];
	private paymentHistoryMap: Record<string, PaymentEntry[]> = {};
	private armedResetTimers: Record<string, ReturnType<typeof setTimeout>> = {};
	private armedDeleteTimers: Record<string, ReturnType<typeof setTimeout>> = {};
	// any: setTimeout return type varies by environment (browser vs Node)
	private saveIndicatorTimeouts: Record<string, any> = {};
	private syncStatTimer: ReturnType<typeof setTimeout> | null = null;
	private readonly categoryDefs: CategoryDef[] = [
		{ icon: 'credit_card', label: 'Credit card', grad: 'linear-gradient(90deg,#e91e8c,#f7971e)' },
		{ icon: 'handshake', label: 'Personal', grad: 'linear-gradient(90deg,#fda085,#f6d365)' },
		{ icon: 'shopping_bag', label: 'Financing', grad: 'linear-gradient(90deg,#8e54e9,#e91e8c)' },
		{ icon: 'home', label: 'Mortgage', grad: 'linear-gradient(90deg,#11998e,#38ef7d)' }
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
						type: REMINDER_ITEM_EXPENSE,
						name: item.name,
						date: item.content.date
					}));
				this.syncStatistics();
			});
		}
	}

	/**
	 * Unsubscribes from the Account Expenses subscription and clears armed-button timers.
	 */
	ngOnDestroy() {
		this.debtSonataSub?.unsubscribe();
		this.dialogComponentContainer?.clear();
		Object.values(this.armedResetTimers).forEach(clearTimeout);
		Object.values(this.armedDeleteTimers).forEach(clearTimeout);
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	// ── Preset chip interactions ──────────────────────────────────────────────

	/**
	 * Subtracts the given amount from the item's debt balance and persists
	 * the change. Auto-marks the item as paid when the balance reaches zero.
	 * Tracks the payment in the in-session history map.
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
		try {
			if (isPaidOff) {
				await this.databaseService.updateReminderTable(
					DATABASE_DEBT_SONATA,
					entryKey,
					REMINDER_VALUE_KEY_CONTENT,
					{ ...item.content, debt: newDebt, paid: true }
				);
			} else {
				await this.databaseService.updateReminderTable(
					DATABASE_DEBT_SONATA,
					entryKey,
					REMINDER_VALUE_KEY_DEBT,
					newDebt
				);
			}
			this.triggerSaveIndicator(DATABASE_DEBT_SONATA);
			this.paymentHistoryMap = {
				...this.paymentHistoryMap,
				[entryKey]: [
					...(this.paymentHistoryMap[entryKey] ?? []),
					{ amount, balance: newDebt, ts: Date.now() }
				]
			};
			this.resyncUpcomingFromLocalData();
			this.databaseService
				.appendToActivityLog(STATS_FIELD_RECENT_REMINDER, {
					type: ACTIVITY_TYPE_UPDATED,
					table: REMINDER_TABLE_ACCOUNT_EXPENSES,
					text: item.name ?? '',
					timestamp: Utilities.getCurrentFormattedTime(true)
				})
				.catch(() => {});
		} catch (error) {
			item.content.debt = currentDebt;
			if (isPaidOff) item.content.paid = false;
			this.dialogService.handleError(this.dialogComponentContainer, error);
		}
	}

	/**
	 * Shows the custom-amount chip input for the given entry,
	 * clearing any previous value.
	 *
	 * @param entryKey - The unique key of the entry to show custom input for.
	 */
	protected toggleCustomInput(entryKey: string): void {
		this.showCustomInput = { ...this.showCustomInput, [entryKey]: true };
		this.customInputValues = { ...this.customInputValues, [entryKey]: '' };
	}

	/**
	 * Reads the custom input value for the given entry, submits a payment
	 * if the parsed amount is positive, then closes the custom input.
	 *
	 * @param entryKey - The unique key of the entry to pay with a custom amount.
	 */
	protected submitCustomPay(entryKey: string): void {
		if (!this.showCustomInput[entryKey]) return;
		const raw = this.customInputValues[entryKey] ?? '';
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
		this.showCustomInput = { ...this.showCustomInput, [entryKey]: false };
		this.customInputValues = { ...this.customInputValues, [entryKey]: '' };
	}

	// ── Two-step confirm interactions ─────────────────────────────────────────

	/**
	 * First call arms the Reset button; second call within 2.6 s executes
	 * the reset. Arms auto-disarm after the timeout.
	 *
	 * @param entryKey - The unique key of the entry to reset.
	 */
	protected armOrConfirmReset(entryKey: string): void {
		if (this.isArmedReset[entryKey]) {
			clearTimeout(this.armedResetTimers[entryKey]);
			this.isArmedReset = { ...this.isArmedReset, [entryKey]: false };
			this.resetDebt(entryKey).catch(() => {});
		} else {
			this.isArmedReset = { ...this.isArmedReset, [entryKey]: true };
			this.armedResetTimers[entryKey] = setTimeout(() => {
				this.isArmedReset = { ...this.isArmedReset, [entryKey]: false };
				this.cdr.detectChanges();
			}, DEBT_ARMED_TIMEOUT_MS);
		}
	}

	/**
	 * First call arms the Delete button; second call within 2.6 s removes
	 * the entry from CloudBase. Arms auto-disarm after the timeout.
	 *
	 * @param entryKey - The unique key of the entry to delete.
	 */
	protected armOrConfirmDelete(entryKey: string): void {
		if (this.isArmedDelete[entryKey]) {
			clearTimeout(this.armedDeleteTimers[entryKey]);
			this.isArmedDelete = { ...this.isArmedDelete, [entryKey]: false };
			this.deleteDebt(entryKey).catch(() => {});
		} else {
			this.isArmedDelete = { ...this.isArmedDelete, [entryKey]: true };
			this.armedDeleteTimers[entryKey] = setTimeout(() => {
				this.isArmedDelete = { ...this.isArmedDelete, [entryKey]: false };
				this.cdr.detectChanges();
			}, DEBT_ARMED_TIMEOUT_MS);
		}
	}

	// ── Due date editing interactions ─────────────────────────────────────────

	/**
	 * Shows the PrimeNG date picker for the given entry's due chip.
	 *
	 * @param entryKey - The unique key of the entry to start editing.
	 */
	protected startDueDateEdit(entryKey: string): void {
		this.showDuePicker = { ...this.showDuePicker, [entryKey]: true };
	}

	/**
	 * Closes the PrimeNG date picker for the given entry without saving.
	 *
	 * @param entryKey - The unique key of the entry to cancel editing for.
	 */
	protected cancelDueDateEdit(entryKey: string): void {
		this.showDuePicker = { ...this.showDuePicker, [entryKey]: false };
	}

	/**
	 * Formats the selected Date to a 'yyyy-MM-dd' string, persists the
	 * change to CloudBase, and closes the date picker.
	 *
	 * @param tableName - The CloudBase collection name.
	 * @param entryKey - The unique key of the entry to update.
	 * @param date - The Date value selected by the user.
	 */
	protected async completeDueDateEdit(tableName: string, entryKey: string, date: Date): Promise<void> {
		const item = this.findUpdatedItem(entryKey);
		if (!item) return;
		item.content.date = Utilities.formatDateForStorage(date);
		this.showDuePicker = { ...this.showDuePicker, [entryKey]: false };
		await this.updateTableSingleValue(tableName, entryKey, REMINDER_VALUE_KEY_DATE);
		this.resyncUpcomingFromLocalData();
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
		try {
			const newContent = { ...item.content, debt: originalAmount, paid: false };
			await this.databaseService.updateReminderTable(
				DATABASE_DEBT_SONATA,
				entryKey,
				REMINDER_VALUE_KEY_CONTENT,
				newContent
			);
			item.content.debt = originalAmount;
			item.content.paid = false;
			this.paymentHistoryMap = { ...this.paymentHistoryMap, [entryKey]: [] };
			this.triggerSaveIndicator(DATABASE_DEBT_SONATA);
			this.resyncUpcomingFromLocalData();
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
		}
	}

	/**
	 * Removes the entry from the CloudBase collection. The realtime
	 * subscription will update the display arrays automatically.
	 *
	 * @param entryKey - The unique key of the entry to delete.
	 */
	private async deleteDebt(entryKey: string): Promise<void> {
		try {
			await this.databaseService.removeRecordFromReminderTable(DATABASE_DEBT_SONATA, entryKey);
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
		}
	}

	/**
	 * Reads the updated value for the given field and writes it to CloudBase.
	 * Rolls back the local change on permission error before showing the dialog.
	 *
	 * @param tableName - The CloudBase collection name.
	 * @param entryKey - The unique key of the entry to update.
	 * @param valueKey - The field name inside the entry's content object.
	 */
	private async updateTableSingleValue(
		tableName: string,
		entryKey: string,
		valueKey: string
	): Promise<void> {
		const updatedItem = this.findUpdatedItem(entryKey);
		const originalItem = this.findOriginalItem(entryKey);
		if (!updatedItem || !originalItem) return;
		const updatedValue = updatedItem.content[valueKey];
		const oldValue = originalItem.content[valueKey];
		try {
			if (updatedValue !== oldValue) {
				await this.databaseService.updateReminderTable(tableName, entryKey, valueKey, updatedValue);
				this.triggerSaveIndicator(tableName);
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
				[STATS_FIELD_REMINDER_UPCOMING]: [...this.upcomingExpenses]
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
				type: REMINDER_ITEM_EXPENSE,
				name: item.name,
				date: item.content.date
			}));
		this.syncStatistics();
	}

	/**
	 * Shows a save-confirmation indicator for the given table and hides
	 * it after one second. Clears any active timeout before starting a new one.
	 *
	 * @param tableName - The name of the table for which to show the indicator.
	 */
	private triggerSaveIndicator(tableName: string): void {
		this.saveIndicators[tableName] = true;
		this.cdr.detectChanges();
		if (this.saveIndicatorTimeouts[tableName]) {
			clearTimeout(this.saveIndicatorTimeouts[tableName]);
		}
		this.saveIndicatorTimeouts[tableName] = setTimeout(() => {
			this.saveIndicators[tableName] = false;
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
	 * Returns the Account Expenses items sorted for display: active debts
	 * first (ordered by due date, overdue first), paid-off items at the bottom.
	 *
	 * @returns A new sorted array of Account Expenses items.
	 */
	protected get sortedItems(): any[] {
		return [...(this.updatedDebtSonataItems ?? [])].sort((a, b) => {
			const aDone: boolean = !!a.content?.paid;
			const bDone: boolean = !!b.content?.paid;
			if (aDone !== bDone) return aDone ? 1 : -1;
			const aDate = a.content?.date ? new Date(a.content.date + 'T00:00').getTime() : Infinity;
			const bDate = b.content?.date ? new Date(b.content.date + 'T00:00').getTime() : Infinity;
			return aDate - bDate;
		});
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
	 * Opens the dialog for creating a new debt entry.
	 */
	protected openNewDebtDialog(): void {
		// TODO: implement new debt creation dialog
	}

	/**
	 * Prevents the default action of a keyboard event, blocking input
	 * into the due-date picker field.
	 *
	 * @param event - The keyboard event whose default action should be blocked.
	 */
	protected preventKeyin(event: KeyboardEvent): void {
		event.preventDefault();
	}
}
