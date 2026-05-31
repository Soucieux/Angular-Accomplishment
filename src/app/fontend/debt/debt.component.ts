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
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DatePickerModule } from 'primeng/datepicker';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumber } from 'primeng/inputnumber';
import { Checkbox } from 'primeng/checkbox';
import { Tooltip } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { LOG } from '../../common/app.logs';
import { Utilities } from '../../common/app.utilities';
import {
	ACCOUNT_DEBT_DECREMENT,
	ACTIVITY_TYPE_UPDATED,
	COMPONENT_DESTROY,
	DATABASE_DEBT_SONATA,
	ERROR_PERMISSION_DENIED,
	REMINDER_ITEM_EXPENSE,
	REMINDER_TABLE_ACCOUNT_EXPENSES,
	STATS_FIELD_RECENT_REMINDER,
	STATS_FIELD_REMINDER_UPCOMING,
	REMINDER_VALUE_KEY_DEBT,
	REMINDER_VALUE_KEY_DATE,
	REMINDER_VALUE_KEY_CONTENT
} from '../../common/app.constant';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { DatabaseService } from '../../backend/database-service/database.service';
import { AccessDeniedComponent } from '../../common/access-denied/access-denied.component';

@Component({
	selector: 'debt',
	imports: [
		FormsModule,
		Button,
		SkeletonModule,
		DatePickerModule,
		InputGroupModule,
		InputGroupAddonModule,
		InputNumber,
		Checkbox,
		Tooltip,
		AccessDeniedComponent
	],
	templateUrl: './debt.component.html',
	styleUrls: ['../../common/page.card.css', './debt.component.css']
})
export class DebtComponent implements OnInit, OnDestroy, AfterViewChecked {
	private readonly className = 'DebtComponent';
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	protected readonly DATABASE_DEBT_SONATA = DATABASE_DEBT_SONATA;
	protected loading = true;
	protected isHoverCapable!: boolean;
	// any: Account Expenses rows are schema-less CloudBase documents with no fixed TypeScript type
	protected updatedDebtSonataItems!: any[];
	// any: Account Expenses rows are schema-less CloudBase documents with no fixed TypeScript type
	protected originalDebtSonataItems!: any[];
	private debtSonataSub?: Subscription;
	/** Cached upcoming expenses — synced to statistics on every Account Expenses data emission.
	 *  any: Expense items are schema-less CloudBase documents with no fixed TypeScript type */
	private upcomingExpenses: any[] = [];
	protected saveIndicators: Record<string, boolean> = {
		[DATABASE_DEBT_SONATA]: false
	};
	// any: setTimeout return type varies by environment (browser vs Node); ReturnType<typeof setTimeout> unifies both
	private saveIndicatorTimeouts: Record<string, any> = {};
	private syncStatTimer: ReturnType<typeof setTimeout> | null = null;

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
	 * Account Expenses observable. The subscription populates the data arrays
	 * and syncs upcoming items to the statistics collection so the home-page
	 * reminder widget stays current.
	 */
	ngOnInit() {
		if (isPlatformBrowser(this.platformId)) {
			this.isHoverCapable = this.utilities.checkIfHoverCapable();

			// Get the Account Expenses data
			this.debtSonataSub = this.databaseService.getDebtSonataTableDetails().subscribe((rows) => {
				this.updatedDebtSonataItems = structuredClone(rows);
				this.originalDebtSonataItems = structuredClone(rows);
				this.loading = false;
				// CloudBase subscription callbacks may emit outside Angular's zone — detectChanges ensures the template updates.
				this.cdr.detectChanges();

				// Sync unpaid expenses that have a due date into statistics (fire-and-forget).
				// Stopped automatically when debtSonataSub is unsubscribed in ngOnDestroy.
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
	 * Unsubscribes from the Account Expenses subscription and logs the
	 * component destruction event. Unsubscribing also stops the periodic
	 * statistics syncs that are driven by the subscription.
	 */
	ngOnDestroy() {
		this.debtSonataSub?.unsubscribe();
		this.dialogComponentContainer?.clear();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	////////////////////// Below are Account Expenses interaction handlers //////////////////////
	/**
	 * Prevents the default action of a keyboard event, effectively blocking the
	 * keystroke from being entered into an input field.
	 *
	 * @param event - The keyboard event whose default action should be blocked.
	 */
	protected preventKeyin(event: KeyboardEvent) {
		event.preventDefault();
	}

	/**
	 * Calculates and updates the debt value for a given Account Expenses entry by
	 * subtracting a constant base amount (998.05) from the provided current debt,
	 * then persists the change to the database.
	 *
	 * @param tableName - The name of the table containing the entry.
	 * @param entryKey - The unique key identifying the entry to update.
	 * @param currentDebt - The current debt value from which to calculate the new debt.
	 */
	protected async updateDebt(tableName: string, entryKey: string, currentDebt: number) {
		const item = this.findUpdatedItem(tableName, entryKey);
		if (!item) return;
		item.content.debt = Math.round((currentDebt - ACCOUNT_DEBT_DECREMENT) * 100) / 100;
		await this.updateTableSingleValue(tableName, entryKey, REMINDER_VALUE_KEY_DEBT);
	}

	/**
	 * Sets or resets a default debt record for an Account Expenses entry. When marking
	 * as paid, stores the original debt value and persists a new unpaid record.
	 * When unmarking, restores the original debt value and persists the change.
	 *
	 * @param entryKey - The unique key identifying the entry in the Account Expenses table.
	 * @param isPaid - Whether the entry is being marked as paid.
	 */
	protected async setDefaultDebt(entryKey: string, isPaid: boolean) {
		const item = this.findUpdatedItem(DATABASE_DEBT_SONATA, entryKey);
		if (!item) return;
		const existingRecord = item.content;
		if (isPaid) {
			try {
				// Set default value
				const newRecord = {
					original: existingRecord.debt,
					paid: false
				};
				await this.databaseService.updateReminderTable(
					DATABASE_DEBT_SONATA,
					entryKey,
					REMINDER_VALUE_KEY_CONTENT,
					newRecord
				);
				this.triggerSaveIndicator(DATABASE_DEBT_SONATA);
			} catch (error) {
				this.dialogService.handleError(this.dialogComponentContainer, error);
			}
		} else {
			// Reset value
			existingRecord.debt = existingRecord.original;
			await this.updateTableSingleValue(DATABASE_DEBT_SONATA, entryKey, REMINDER_VALUE_KEY_DEBT);
		}
	}

	////////////////////// Below are shared data methods for Account Expenses ///////////////////
	/**
	 * Calls the database directly and rolls back changes if an error occurs.
	 *
	 * {@link updateDebt} - Decrements debt by a constant for the Account Expenses table.
	 * {@link setDefaultDebt} - Resets the default debt for the Account Expenses table.
	 * {@link updateTableWithNewDate} - Updates the date for the Account Expenses table.
	 */
	protected async updateTableSingleValue(tableName: string, entryKey: string, valueKey: string) {
		const updatedItem = this.findUpdatedItem(tableName, entryKey);
		const originalItem = this.findOriginalItem(tableName, entryKey);
		if (!updatedItem || !originalItem) return;
		const updatedValue = updatedItem.content[valueKey];
		const oldValue = originalItem.content[valueKey];
		try {
			if (updatedValue !== oldValue) {
				await this.databaseService.updateReminderTable(tableName, entryKey, valueKey, updatedValue);
				this.triggerSaveIndicator(tableName);
				// Fire-and-forget: surface this change in the Recent Activity widget.
				// The human-readable identifier for the Account Expenses table is the account `name` field.
				const itemText = this.findUpdatedItem(DATABASE_DEBT_SONATA, entryKey)?.name ?? '';
				this.databaseService
					.appendToActivityLog(STATS_FIELD_RECENT_REMINDER, {
						type: ACTIVITY_TYPE_UPDATED,
						table: REMINDER_TABLE_ACCOUNT_EXPENSES,
						text: itemText,
						timestamp: Utilities.getCurrentFormattedTime(true)
					})
					.catch(() => {});
			}
		} catch (error) {
			// Rollback on permission denied before showing the dialog
			if (error instanceof Error && error.message === ERROR_PERMISSION_DENIED) {
				const rollbackUpdated = this.findUpdatedItem(tableName, entryKey);
				const rollbackOriginal = this.findOriginalItem(tableName, entryKey);
				if (rollbackUpdated && rollbackOriginal) {
					rollbackUpdated.content[valueKey] = rollbackOriginal.content[valueKey];
				}
			}
			this.dialogService.handleError(this.dialogComponentContainer, error);
		}
	}
	/**
	 * Formats a Date object to a "yyyy-MM-dd" string and updates the date field
	 * for the specified table entry, then persists the change to the database.
	 *
	 * @param tableName - The name of the table containing the entry.
	 * @param entryKey - The unique key identifying the entry to update.
	 * @param date - The Date value to format and store.
	 */
	protected async updateTableWithNewDate(tableName: string, entryKey: string, date: Date) {
		const updatedItem = this.findUpdatedItem(tableName, entryKey);
		// Always format to 'YYYY-MM-DD' string — never store a raw Date object.
		// The previous guard `if (updatedItem.content.date)` caused first-time date
		// saves to bypass formatting, persisting a Date/Timestamp object to CloudBase.
		updatedItem.content.date = Utilities.formatDateForStorage(date);
		await this.updateTableSingleValue(tableName, entryKey, REMINDER_VALUE_KEY_DATE);
		// Immediately reflect the date change (or removal) in the home-page reminder
		// widget without waiting for the CloudBase subscription to fire.
		this.resyncUpcomingFromLocalData();
	}

	/**
	 * Finds an item in the updated (working) copy of the Account Expenses table by its entry key.
	 *
	 * @param tableName - The name of the table to search.
	 * @param entryKey - The unique key identifying the item to find.
	 * @returns The matching item from the updated Account Expenses table, or undefined if not found.
	 */
	private findUpdatedItem(tableName: string, entryKey: string) {
		if (tableName === DATABASE_DEBT_SONATA) {
			return this.updatedDebtSonataItems.find((item) => item.key === entryKey);
		}
	}

	/**
	 * Finds an item in the original (server-state) copy of the Account Expenses table by its entry key.
	 * Used for comparing current edits against the original data.
	 *
	 * @param tableName - The name of the table to search.
	 * @param entryKey - The unique key identifying the item to find.
	 * @returns The matching item from the original Account Expenses table, or undefined if not found.
	 */
	private findOriginalItem(tableName: string, entryKey: string) {
		if (tableName === DATABASE_DEBT_SONATA) {
			return this.originalDebtSonataItems.find((item) => item.key === entryKey);
		}
	}

	/**
	 * Writes the latest upcoming expenses to the statistics collection.
	 * Called after debtSonataSub emits. Fire-and-forget.
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
	 * Immediately recomputes `upcomingExpenses` from the current local data and
	 * writes the result to the statistics collection without waiting for a
	 * CloudBase subscription callback.
	 *
	 * Used to reflect date mutations and date removals in the home-page reminder
	 * widget immediately after the user interacts with the Account Expenses table.
	 */
	private resyncUpcomingFromLocalData(): void {
		this.upcomingExpenses = this.updatedDebtSonataItems
			.filter((item: any) => item.content?.date && !item.content?.paid)
			.map((item: any) => ({ type: REMINDER_ITEM_EXPENSE, name: item.name, date: item.content.date }));
		this.syncStatistics();
	}

	////////////////////// Below are common utility methods used across all tables //////////////

	/**
	 * Shows a save-confirmation indicator for the given table and automatically
	 * hides it after one second. If a previous timeout for the same table is
	 * still active, it is cleared and restarted to avoid overlapping triggers.
	 *
	 * @param tableName - The name of the table for which to show the indicator.
	 */
	private triggerSaveIndicator(tableName: string) {
		this.saveIndicators[tableName] = true;
		// Change must be reflected immediately before the setTimeout delay begins.
		this.cdr.detectChanges();

		// Clear any previous timeout before setting a new one — rapid successive
		// saves should restart the indicator timer rather than flash on/off.
		if (this.saveIndicatorTimeouts[tableName]) {
			clearTimeout(this.saveIndicatorTimeouts[tableName]);
		}

		this.saveIndicatorTimeouts[tableName] = setTimeout(() => {
			this.saveIndicators[tableName] = false;
			// setTimeout runs outside Angular's zone — detectChanges required to hide the indicator.
			this.cdr.detectChanges();
		}, 1000);
	}

	/**
	 * Delegates to Utilities.checkIfChinese to check whether the text contains
	 * at least one Chinese character, keeping the regex in a single place.
	 *
	 * @param text - The text string to check.
	 * @returns True if the text contains at least one Chinese character.
	 */
	protected checkIfChinese(text: string): boolean {
		return Utilities.checkIfChinese(text);
	}

	/**
	 * Safely coerces any date value to a 'yyyy-MM-dd' display string.
	 * Delegates to Utilities.coerceDateToString so the logic is not duplicated
	 * between the Reminder and Home pages.
	 *
	 * @param date - Any date representation (string, Date, CloudBase timestamp, or falsy).
	 * @returns A 'yyyy-MM-dd' string, or empty string if the value is falsy or unparseable.
	 */
	protected formatDate(date: any): string {
		// any: CloudBase date values arrive as Timestamp objects, plain strings, or null — no shared type
		return Utilities.coerceDateToString(date);
	}
}
