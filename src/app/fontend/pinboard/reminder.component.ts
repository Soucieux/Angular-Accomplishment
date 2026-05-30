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
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DatePickerModule } from 'primeng/datepicker';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
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
	DATABASE_FIRST_TABLE,
	DATABASE_SECOND_TABLE,
	DIALOG_CONFIRM,
	ERROR_PERMISSION_DENIED,
	FAILURE,
	REMINDER_ITEM_EXPENSE,
	REMINDER_TABLE_ACCOUNT_EXPENSES,
	REMINDER_TABLE_DATE_CALCULATOR,
	STATS_FIELD_RECENT_REMINDER,
	STATS_FIELD_REMINDER_UPCOMING,
	SUCCESS,
	REMINDER_MSG_RESET_CONFIRM,
	REMINDER_DIALOG_RESET_BTN,
	REMINDER_DIALOG_CONFIRM_BTN,
	REMINDER_LABEL_CURRENT_MONTH,
	REMINDER_LABEL_NEXT_MONTH,
	REMINDER_LABEL_RESET,
	REMINDER_LABEL_CELL_CONFIRM,
	REMINDER_LABEL_CELL_DONE,
	REMINDER_LABEL_CELL_TODAY,
	REMINDER_LABEL_CONFIRMED,
	REMINDER_VALUE_KEY_DEBT,
	REMINDER_VALUE_KEY_DATE,
	REMINDER_VALUE_KEY_CONTENT
} from '../../common/app.constant';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { DatabaseService } from '../../backend/database-service/database.service';
import { AccessDeniedComponent } from '../../common/access-denied/access-denied.component';

@Component({
	selector: 'reminder',
	imports: [
		TableModule,
		InputTextModule,
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
	templateUrl: './reminder.component.html',
	styleUrls: ['../../common/page.card.css', './reminder.component.css']
})
export class ReminderComponent implements OnInit, OnDestroy, AfterViewChecked {
	private readonly className = 'ReminderComponent';
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	protected readonly REMINDER_LABEL_CURRENT_MONTH = REMINDER_LABEL_CURRENT_MONTH;
	protected readonly REMINDER_LABEL_NEXT_MONTH = REMINDER_LABEL_NEXT_MONTH;
	protected readonly REMINDER_LABEL_RESET = REMINDER_LABEL_RESET;
	protected readonly REMINDER_LABEL_CELL_CONFIRM = REMINDER_LABEL_CELL_CONFIRM;
	protected readonly REMINDER_LABEL_CELL_DONE = REMINDER_LABEL_CELL_DONE;
	protected readonly REMINDER_LABEL_CELL_TODAY = REMINDER_LABEL_CELL_TODAY;
	protected readonly REMINDER_LABEL_CONFIRMED = REMINDER_LABEL_CONFIRMED;
	protected readonly DATABASE_FIRST_TABLE = DATABASE_FIRST_TABLE;
	protected readonly DATABASE_SECOND_TABLE = DATABASE_SECOND_TABLE;
	protected loading = true;
	protected isHoverCapable!: boolean;
	private chargedCells = new Set<string>();
	// any: First-table rows are schema-less CloudBase documents with no fixed TypeScript type
	protected originalFirstTable!: any[];
	// any: First-table rows are schema-less CloudBase documents with no fixed TypeScript type
	protected updatedFirstTable!: any[];
	protected firstTableConfirmedCount = 0;
	protected currentDay!: number;
	protected fields: Array<string> = ['first', 'second', 'third', 'fourth'];
	// any: Second-table rows are schema-less CloudBase documents with no fixed TypeScript type
	protected updatedSecondTable!: any[];
	// any: Second-table rows are schema-less CloudBase documents with no fixed TypeScript type
	protected originalSecondTable!: any[];
	private firstSub?: Subscription;
	private secondSub?: Subscription;
	/** Cached upcoming expenses — synced to statistics on every second-table emission.
	 *  any: Expense items are schema-less CloudBase documents with no fixed TypeScript type */
	private upcomingExpenses: any[] = [];
	protected saveIndicators: Record<string, boolean> = {
		[DATABASE_FIRST_TABLE]: false,
		[DATABASE_SECOND_TABLE]: false
	};
	// any: setTimeout return type varies by environment (browser vs Node); ReturnType<typeof setTimeout> unifies both
	private saveIndicatorTimeouts: Record<string, any> = {};
	private syncStatTimer: ReturnType<typeof setTimeout> | null = null;
	private chargedCellsInitialized = false;
	protected isNextMonth!: boolean;

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
	 * Initialises the component: checks hover capability, determines the current
	 * day, and subscribes to the first and second reminder table observables. Each
	 * subscription populates its respective data arrays and syncs upcoming items to
	 * the statistics collection so the home-page reminder widget stays current.
	 */
	ngOnInit() {
		if (isPlatformBrowser(this.platformId)) {
			this.isHoverCapable = this.utilities.checkIfHoverCapable();
			this.currentDay = new Date().getDate();

			// Get the data of the first table
			const getFirstObservable = this.databaseService.getFirstReminderTableDetails();
			this.firstSub = getFirstObservable.subscribe(async (rows) => {
				// Need deep copy here so that we are not copying references
				this.originalFirstTable = structuredClone(rows);
				this.updatedFirstTable = structuredClone(rows).slice(0, -1);
				this.isNextMonth = this.originalFirstTable[5]['isNextMonth'];

				if (!this.chargedCellsInitialized) {
					// Loop through to determine disabled fields
					await this.updateChargedCells();
					this.chargedCellsInitialized = true;
				}
				this.refreshConfirmedCount();
				// await inside this callback suspends Zone.js tracking — detectChanges
				// restores template sync after the async updateChargedCells resolves.
				this.cdr.detectChanges();
			});

			// Get the data of the second table
			const getSecondObservable = this.databaseService.getSecondReminderTableDetails();
			this.secondSub = getSecondObservable.subscribe((rows) => {
				this.updatedSecondTable = structuredClone(rows);
				this.originalSecondTable = structuredClone(rows);
				this.loading = false;
				// CloudBase subscription callbacks may emit outside Angular's zone — detectChanges ensures the template updates.
				this.cdr.detectChanges();

				// Sync unpaid expenses that have a due date into statistics (fire-and-forget).
				// Stopped automatically when secondSub is unsubscribed in ngOnDestroy.
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
	 * Recomputes and caches the count of first-table cells marked as charged.
	 * Called whenever updatedFirstTable or any cell's isCharged flag changes.
	 */
	private refreshConfirmedCount(): void {
		this.firstTableConfirmedCount = (this.updatedFirstTable ?? [])
			.flatMap((row: any) => this.fields.map((field: string) => row[field] as { isCharged: boolean }))
			.filter((cell) => cell?.isCharged === true).length;
	}

	/**
	 * Total number of editable cells in the first table (rows × 4 columns).
	 *
	 * @returns Total cell count.
	 */
	protected get firstTableTotalCount(): number {
		return (this.updatedFirstTable?.length ?? 0) * this.fields.length;
	}

	/**
	 * Sets the active month view and refreshes charged-cell state.
	 *
	 * @param isNext - True to switch to next-month view; false for current month.
	 */
	protected setMonth(isNext: boolean): void {
		this.isNextMonth = isNext;
		void this.updateChargedCells();
	}

	/**
	 * Updates the charged/uncharged state of first-table cells based on
	 * the current month direction and the current day of the month.
	 * Persists the change to the database when called after initialisation.
	 */
	protected async updateChargedCells() {
		if (this.chargedCellsInitialized) {
			const returnCode = this.checkPermission(DATABASE_FIRST_TABLE, '0');
			// Rollback
			if (returnCode === FAILURE) {
				setTimeout(() => {
					this.isNextMonth = !this.isNextMonth;
				});
				return;
			}
		}

		if (this.isNextMonth) {
			this.chargedCells.clear();
		}

		for (let index = 0; index < this.updatedFirstTable.length; index++) {
			for (const field of this.fields) {
				if (this.isNextMonth && this.chargedCellsInitialized) {
					this.updatedFirstTable[index][field].isCharged = false;
				} else if (
					!this.isNextMonth &&
					this.updatedFirstTable[index][field].value < this.currentDay
				) {
					// Fieldes are no longer being set as charged so that its color is only changed on user input
					// this.updatedFirstTable[index][field].isCharged = true;
					this.chargedCells.add(`${index}-${field}`);
				}
			}
		}

		this.refreshConfirmedCount();
		if (this.chargedCellsInitialized) {
			await this.updateFirstTableSingleValue();
		}
	}

	/**
	 * Unsubscribes from both reminder table subscriptions and logs the
	 * component destruction event. Unsubscribing also stops the periodic
	 * statistics syncs that are driven by those subscriptions.
	 */
	ngOnDestroy() {
		this.firstSub?.unsubscribe();
		this.secondSub?.unsubscribe();
		this.dialogComponentContainer?.clear();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	////////////////////// Below are first reminder table interaction handlers ////////////////////
	/**
	 * Prevent non-numeric input in first-table number fields. Allows
	 * navigation and deletion keys to pass through.
	 *
	 * @param event - The keyboard event to validate.
	 */
	protected onNumberChange(event: KeyboardEvent) {
		const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
		if (allowedKeys.includes(event.key)) return;

		if (!/^[0-9]$/.test(event.key)) {
			this.preventKeyin(event);
		}
	}

	/**
	 * Validate and propagate a date value change in the first table.
	 * Enforces minimum day gaps between rows (2-day and 6-day), caps values
	 * at 31, and cascades the change to downstream rows via twoDayDiff/sixDaysDiff.
	 *
	 * @param rowIndex - The index of the row being changed.
	 * @param field - The column key (first, second, third, fourth) being changed.
	 */
	protected async onValueChange(rowIndex: number, field: string) {
		const originalValue = this.originalFirstTable[rowIndex][field].value;

		// Do nothing if the value does not change
		if (this.updatedFirstTable[rowIndex][field].value == originalValue) return;

		const returnCode = this.checkPermission(DATABASE_FIRST_TABLE, '0');
		// Rollback OR reset value if it reaches threshold
		if (returnCode === FAILURE || Number(this.updatedFirstTable[rowIndex][field].value) > 31) {
			this.updatedFirstTable[rowIndex][field].value = originalValue;
			return;
		}

		if (rowIndex !== 0) {
			const previousValue = this.updatedFirstTable[rowIndex - 1][field].value;

			// Get the difference
			let requiredDiff: number | null = null;
			if (rowIndex === 1 || rowIndex === 3) {
				requiredDiff = 2;
			} else if (rowIndex === 2 || rowIndex === 4) {
				requiredDiff = 6;
			}

			if (
				requiredDiff !== null &&
				Number(this.updatedFirstTable[rowIndex][field].value) - Number(previousValue) < requiredDiff
			) {
				this.updatedFirstTable[rowIndex][field].value = originalValue;
				return;
			}
		}

		// Convert it to number
		this.updatedFirstTable[rowIndex][field].value = Number(this.updatedFirstTable[rowIndex][field].value);

		// Mark it as unCharged
		this.updatedFirstTable[rowIndex][field].isCharged = false;

		// Update other values in the same column
		for (let index = rowIndex; index < this.updatedFirstTable.length - 1; index++) {
			if (index == 0 || index == 2) {
				this.twoDayDiff(index, field);
			} else if (index == 1 || index == 3) {
				this.sixDaysDiff(index, field);
			}
		}

		// Re-evaluate grey background for every cell in this column —
		// cascading may have shifted values above or below currentDay.
		for (let i = 0; i < this.updatedFirstTable.length; i++) {
			const key = `${i}-${field}`;
			if (!this.isNextMonth && this.updatedFirstTable[i][field].value < this.currentDay) {
				this.chargedCells.add(key);
			} else {
				this.chargedCells.delete(key);
			}
		}

		await this.updateFirstTableSingleValue();
	}

	/**
	 * Check whether a first-table cell is in the charged set and should
	 * be displayed as disabled.
	 *
	 * @param rowIndex - The row index of the cell.
	 * @param field - The column key of the cell.
	 * @returns true if the cell is charged (disabled).
	 */
	protected isDisabled(rowIndex: number, field: string): boolean {
		return this.chargedCells.has(`${rowIndex}-${field}`);
	}

	/**
	 * Cascade a 6-day difference from the current row to the next row
	 * (row 1 → row 2, row 3 → row 4). Caps the result at 31.
	 *
	 * @param rowIndex - The source row index (1 or 3).
	 * @param field - The column key to cascade.
	 */
	private sixDaysDiff(rowIndex: number, field: string) {
		this.updatedFirstTable[rowIndex + 1][field].value =
			Number(this.updatedFirstTable[rowIndex][field].value) + 6;
		this.updatedFirstTable[rowIndex + 1][field].isCharged = false;

		this.isValueGreaterThan31(rowIndex, field);
	}

	/**
	 * Cascade a 2-day difference from the current row to the next row
	 * (row 0 → row 1, row 2 → row 3). Caps the result at 31.
	 *
	 * @param rowIndex - The source row index (0 or 2).
	 * @param field - The column key to cascade.
	 */
	private twoDayDiff(rowIndex: number, field: string) {
		this.updatedFirstTable[rowIndex + 1][field].value =
			Number(this.updatedFirstTable[rowIndex][field].value) + 2;
		this.updatedFirstTable[rowIndex + 1][field].isCharged = false;
		this.isValueGreaterThan31(rowIndex, field);
	}

	/**
	 * Clamp the cascaded value at 31 — days cannot exceed 31.
	 *
	 * @param rowIndex - The row index being cascaded to.
	 * @param field - The column key.
	 */
	private isValueGreaterThan31(rowIndex: number, field: string) {
		this.updatedFirstTable[rowIndex + 1][field].value =
			this.updatedFirstTable[rowIndex + 1][field].value > 31
				? 31
				: this.updatedFirstTable[rowIndex + 1][field].value;
	}

	/**
	 * Toggle a first-table cell to the charged state and persist to the database.
	 * No-ops if the cell is already charged or the user lacks permission.
	 *
	 * @param rowIndex - The row index of the cell.
	 * @param field - The column key of the cell.
	 */
	protected async setIsCharged(rowIndex: number, field: string) {
		const returnCode = this.checkPermission(DATABASE_FIRST_TABLE, '0');
		// Rollback
		if (returnCode === FAILURE) return;

		if (!this.updatedFirstTable[rowIndex][field].isCharged) {
			this.updatedFirstTable[rowIndex][field].isCharged = true;
			this.refreshConfirmedCount();
			// Update table to database
			await this.updateFirstTableSingleValue();
		}
	}

	/**
	 * Opens a confirmation dialog before resetting the first table dates
	 * to their default sequence (1, 3, 9, 11, 17).
	 */
	protected openResetConfirmationDialog() {
		const returnCode = this.checkPermission(DATABASE_FIRST_TABLE, '0');
		// Rollback
		if (returnCode === FAILURE) return;

		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_CONFIRM,
			() => {
				this.resetFirstTable();
			},
			[REMINDER_MSG_RESET_CONFIRM, REMINDER_DIALOG_RESET_BTN, REMINDER_DIALOG_CONFIRM_BTN]
		);
	}

	/**
	 * Resets all values in the first table to their default sequence
	 * (1, 3, 9, 11, 17), sets all cells to uncharged, and persists the reset
	 * state to the database.
	 */
	private async resetFirstTable() {
		const values = [1, 3, 9, 11, 17];
		this.updatedFirstTable = this.originalFirstTable.slice(0, 5).map((original, index) => ({
			_id: original._id,
			_openid: original._openid,
			first: { value: values[index], isCharged: false },
			second: { value: values[index], isCharged: false },
			third: { value: values[index], isCharged: false },
			fourth: { value: values[index], isCharged: false }
		}));
		this.refreshConfirmedCount();
		await this.updateFirstTableSingleValue();
	}

	/**
	 * Persists the current state of the first table (including the isNextMonth
	 * flag) to the database. Shows a save indicator on success or an error
	 * dialog on failure.
	 */
	private async updateFirstTableSingleValue() {
		try {
			const payload = [
				...this.updatedFirstTable,
				{
					_id: this.originalFirstTable[5]._id,
					_openid: this.originalFirstTable[5]._openid,
					isNextMonth: this.isNextMonth
				}
			];
			await this.databaseService.updateFirstReminderTable(DATABASE_FIRST_TABLE, payload);
			this.triggerSaveIndicator(DATABASE_FIRST_TABLE);
			// Fire-and-forget: surface this change in the Recent Activity widget.
			this.databaseService
				.appendToActivityLog(STATS_FIELD_RECENT_REMINDER, {
					type: ACTIVITY_TYPE_UPDATED,
					table: REMINDER_TABLE_DATE_CALCULATOR,
					text: '',
					timestamp: Utilities.getCurrentFormattedTime(true)
				})
				.catch(() => {});
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
		}
	}

	////////////////////// Below are second reminder table interaction handlers ///////////////////
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
	 * Calculates and updates the debt value for a given second-table entry by
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
	 * Sets or resets a default debt record for a second-table entry. When marking
	 * as paid, stores the original debt value and persists a new unpaid record.
	 * When unmarking, restores the original debt value and persists the change.
	 *
	 * @param entryKey - The unique key identifying the entry in the second table.
	 * @param isPaid - Whether the entry is being marked as paid.
	 */
	protected async setDefaultDebt(entryKey: string, isPaid: boolean) {
		const item = this.findUpdatedItem(DATABASE_SECOND_TABLE, entryKey);
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
					DATABASE_SECOND_TABLE,
					entryKey,
					REMINDER_VALUE_KEY_CONTENT,
					newRecord
				);
				this.triggerSaveIndicator(DATABASE_SECOND_TABLE);
			} catch (error) {
				this.dialogService.handleError(this.dialogComponentContainer, error);
			}
		} else {
			// Reset value
			existingRecord.debt = existingRecord.original;
			await this.updateTableSingleValue(DATABASE_SECOND_TABLE, entryKey, REMINDER_VALUE_KEY_DEBT);
		}
	}

	////////////////////// Below are shared data methods for second table ///////////////////////
	/**
	 * Calls the database directly and rolls back changes if an error occurs.
	 *
	 * {@link updateDebt} - Decrements debt by a constant for the second table.
	 * {@link setDefaultDebt} - Resets the default debt for the second table.
	 * {@link updateTableWithNewDate} - Updates the date for the second table.
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
				// The human-readable identifier for the second table is the account `name` field.
				const itemText = this.findUpdatedItem(DATABASE_SECOND_TABLE, entryKey)?.name ?? '';
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
	 * Finds an item in the updated (working) copy of the second table by its entry key.
	 *
	 * @param tableName - The name of the table to search.
	 * @param entryKey - The unique key identifying the item to find.
	 * @returns The matching item from the updated second table, or undefined if not found.
	 */
	private findUpdatedItem(tableName: string, entryKey: string) {
		if (tableName === DATABASE_SECOND_TABLE) {
			return this.updatedSecondTable.find((item) => item.key === entryKey);
		}
	}

	/**
	 * Finds an item in the original (server-state) copy of the second table by its entry key.
	 * Used for comparing current edits against the original data.
	 *
	 * @param tableName - The name of the table to search.
	 * @param entryKey - The unique key identifying the item to find.
	 * @returns The matching item from the original second table, or undefined if not found.
	 */
	private findOriginalItem(tableName: string, entryKey: string) {
		if (tableName === DATABASE_SECOND_TABLE) {
			return this.originalSecondTable.find((item) => item.key === entryKey);
		}
	}

	/**
	 * Writes the latest upcoming expenses to the statistics collection.
	 * Called after secondSub emits. Fire-and-forget.
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
	 * widget immediately after the user interacts with the second table.
	 */
	private resyncUpcomingFromLocalData(): void {
		this.upcomingExpenses = this.updatedSecondTable
			.filter((item: any) => item.content?.date && !item.content?.paid)
			.map((item: any) => ({ type: REMINDER_ITEM_EXPENSE, name: item.name, date: item.content.date }));
		this.syncStatistics();
	}

	////////////////////// Below are common utility methods used across all tables //////////////
	/**
	 * Resolves the owner openid for the given table and entry, then delegates
	 * the permission check to Utilities.checkPermission.
	 * Intended only for button handlers and dialogs, to avoid redundant database calls.
	 *
	 * @param tableName - The table whose write permission is being checked.
	 * @param entryKey - The key of the specific entry (unused for the first table — pass '0').
	 * @returns SUCCESS if permitted, FAILURE otherwise.
	 */
	private checkPermission(tableName: string, entryKey: string): string {
		// Resolve the owner ID: first table always uses row[0]; second/third tables
		// look up the specific entry being modified.
		const openid =
			tableName === DATABASE_FIRST_TABLE
				? (this.updatedFirstTable[0]?._openid ?? '')
				: (this.findUpdatedItem(tableName, entryKey)?._openid ?? '');
		return this.dialogService.ensurePermission(this.dialogComponentContainer, openid) ? SUCCESS : FAILURE;
	}

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
