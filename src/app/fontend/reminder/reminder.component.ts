/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-unused-vars, @typescript-eslint/no-base-to-string, prefer-const */
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
import { DatePickerModule } from 'primeng/datepicker';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { Checkbox } from 'primeng/checkbox';
import { Tooltip } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { PopoverModule } from 'primeng/popover';
import { PaginatorModule } from 'primeng/paginator';
import { Subscription } from 'rxjs';
import { LOG } from '../../common/app.logs';
import { Utilities } from '../../common/app.utilities';
import {
	ACCOUNT_DEBT_DECREMENT,
	ACTIVITY_TYPE_UPDATED,
	COMPONENT_DESTROY,
	DATABASE_FIRST_TABLE,
	DATABASE_SECOND_TABLE,
	DATABASE_THIRD_TABLE,
	DIALOG_CONFIRM,
	ERROR_PERMISSION_DENIED,
	FAILURE,
	HISTORY_STATUS_DELETED,
	REMINDER_ITEM_EXPENSE,
	REMINDER_ITEM_MESSAGE,
	REMINDER_TABLE_ACCOUNT_EXPENSES,
	REMINDER_TABLE_DATE_CALCULATOR,
	REMINDER_TABLE_MESSAGES,
	STATS_FIELD_RECENT_REMINDER,
	STATS_FIELD_REMINDER_TOTAL,
	STATS_FIELD_REMINDER_UPCOMING,
	SUCCESS,
	REMINDER_MSG_RESET_CONFIRM,
	REMINDER_DIALOG_RESET_BTN,
	REMINDER_DIALOG_CONFIRM_BTN,
	REMINDER_MSG_DELETE_CONFIRM,
	REMINDER_DIALOG_DELETE_BTN,
	REMINDER_LABEL_CURRENT_MONTH,
	REMINDER_LABEL_NEXT_MONTH,
	REMINDER_LABEL_RESET,
	REMINDER_LABEL_CELL_CONFIRM,
	REMINDER_LABEL_CELL_DONE,
	REMINDER_LABEL_CELL_TODAY,
	REMINDER_LABEL_CONFIRMED
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
		PaginatorModule,
		PopoverModule,
		AccessDeniedComponent
	],
	templateUrl: './reminder.component.html',
	styleUrls: ['../../common/page.card.css', './reminder.component.css']
})
export class ReminderComponent implements OnInit, OnDestroy, AfterViewChecked {
	private readonly className = 'ReminderComponent';
	protected readonly labelCurrentMonth = REMINDER_LABEL_CURRENT_MONTH;
	protected readonly labelNextMonth = REMINDER_LABEL_NEXT_MONTH;
	protected readonly labelReset = REMINDER_LABEL_RESET;
	protected readonly labelCellConfirm = REMINDER_LABEL_CELL_CONFIRM;
	protected readonly labelCellDone = REMINDER_LABEL_CELL_DONE;
	protected readonly labelCellToday = REMINDER_LABEL_CELL_TODAY;
	protected readonly labelConfirmed = REMINDER_LABEL_CONFIRMED;
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	@ViewChild('op2') protected op2!: any;
	protected loading = true;
	protected isHoverCapable!: boolean;
	private chargedCells = new Set<string>();
	protected originalFirstTable!: any[];
	protected updatedFirstTable!: any[];
	protected firstTableConfirmedCount = 0;
	protected currentDay!: number;
	protected fields: Array<string> = ['first', 'second', 'third', 'fourth'];
	protected updatedSecondTable!: any[];
	protected originalSecondTable!: any[];
	protected pagedThirdTable!: any[];
	protected originalThirdTable!: any[];
	private firstSub?: Subscription;
	private secondSub?: Subscription;
	private thirdSub?: Subscription;
	/**
	 * Cached items per table — merged before each statistics write.
	 */
	private upcomingExpenses: any[] = [];
	private upcomingMessages: any[] = [];
	protected FIRST_TABLE: string = DATABASE_FIRST_TABLE;
	protected SECOND_TABLE: string = DATABASE_SECOND_TABLE;
	protected THIRD_TABLE: string = DATABASE_THIRD_TABLE;
	protected thirdTableActiveItem: any;
	protected thirdTableNewText: string = '';
	protected thirdTableIndexOfFirstItem: number = 0;
	protected thirdTableItemsPerPage: number = 10;
	protected saveIndicators: Record<string, boolean> = {
		FIRST_TABLE: false,
		SECOND_TABLE: false,
		THIRD_TABLE: false
	};
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
	public ngAfterViewChecked(): void {
		if (isPlatformBrowser(this.platformId)) {
			document
				.querySelectorAll<HTMLElement>('.container.page-card')
				.forEach((el) => Utilities.attachScrollAutoHide(el));
		}
	}

	/**
	 * Initialises the component: checks hover capability, determines the current
	 * day, and subscribes to all three reminder table observables. Each subscription
	 * populates its respective data arrays and immediately syncs upcoming items to
	 * the statistics collection so the home-page reminder widget stays current.
	 */
	public ngOnInit() {
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
				this.cdr.detectChanges();
			});

			// Get the data of the second table
			const getSecondObservable = this.databaseService.getSecondReminderTableDetails();
			this.secondSub = getSecondObservable.subscribe((rows) => {
				this.updatedSecondTable = structuredClone(rows);
				this.originalSecondTable = structuredClone(rows);
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
				this.syncReminderStatistics();
			});

			// Get the data of the third table
			const getThirdObservable = this.databaseService.getThirdReminderTableDetails();
			this.thirdSub = getThirdObservable.subscribe((rows) => {
				this.originalThirdTable = structuredClone(rows);
				this.pagedThirdTable = this.updatePagedThirdTable();
				this.loading = false;
				this.cdr.detectChanges();

				// Sync messages that have a due date into statistics (fire-and-forget).
				// Stopped automatically when thirdSub is unsubscribed in ngOnDestroy.
				this.upcomingMessages = rows
					.filter((item: any) => item.content?.date)
					.map((item: any) => ({
						type: REMINDER_ITEM_MESSAGE,
						name: item.content.text ?? '',
						date: item.content.date,
						link: item.content.link ?? ''
					}));
				this.syncReminderStatistics();
			});
		}
	}

	/**
	 * Recompute and cache the count of first-table cells marked as charged.
	 * Call this whenever updatedFirstTable or any cell's isCharged flag changes.
	 */
	private refreshConfirmedCount(): void {
		this.firstTableConfirmedCount = (this.updatedFirstTable ?? [])
			.flatMap((row: any) => this.fields.map((f: string) => row[f] as { isCharged: boolean }))
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
	 * Set the active month view and refresh charged-cell state.
	 *
	 * @param isNext - True to switch to next-month view; false for current month.
	 */
	protected setMonth(isNext: boolean): void {
		this.isNextMonth = isNext;
		void this.updateChargedCells();
	}

	/**
	 * Update the charged/unCharged state of first-table cells based on
	 * the current month direction and the current day of the month.
	 * Persists the change to the database when called after initialization.
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
	 * Unsubscribes from all three reminder table subscriptions and logs the
	 * component destruction event. Unsubscribing also stops the periodic
	 * statistics syncs that are driven by those subscriptions.
	 */
	public ngOnDestroy() {
		this.firstSub?.unsubscribe();
		this.secondSub?.unsubscribe();
		this.thirdSub?.unsubscribe();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	///////////////////////////////////FIRST TABLE///////////////////////////////////
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
		let originalValue = this.originalFirstTable[rowIndex][field].value;

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

	// 1 -> 2 && 3 -> 4
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

	// 0 -> 1 && 2 -> 3
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
	 * Open a confirmation dialog before resetting the first table dates
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

	///////////////////////////////////SECOND TABLE///////////////////////////////////
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
		await this.updateTableSingleValue(tableName, entryKey, 'debt');
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
					'content',
					newRecord
				);
				this.triggerSaveIndicator(DATABASE_SECOND_TABLE);
			} catch (error) {
				this.dialogService.handleError(this.dialogComponentContainer, error);
			}
		} else {
			// Reset value
			existingRecord.debt = existingRecord.original;
			await this.updateTableSingleValue(DATABASE_SECOND_TABLE, entryKey, 'debt');
		}
	}

	///////////////////////////////////THIRD TABLE///////////////////////////////////
	/**
	 * Clones and returns a subset of the original third table data based on the
	 * current pagination window, defined by thirdTableIndexOfFirstItem and
	 * thirdTableItemsPerPage.
	 *
	 * @returns A deep-cloned array of rows for the current page of the third table.
	 */
	protected updatePagedThirdTable() {
		return structuredClone(
			this.originalThirdTable.slice(
				this.thirdTableIndexOfFirstItem,
				this.thirdTableIndexOfFirstItem + this.thirdTableItemsPerPage
			)
		);
	}
	/**
	 * Normalizes and updates the link value for a third-table entry. Prepends
	 * "https://" or "https://www." as needed to ensure the link is a valid URL,
	 * then persists the change if it differs from the original.
	 *
	 * @param tableName - The name of the table containing the entry.
	 * @param entryKey - The unique key identifying the entry to update.
	 * @param link - The raw link text to normalize and store.
	 */
	protected async updateLink(tableName: string, entryKey: string, link: string) {
		const updatedItem = this.findUpdatedItem(DATABASE_THIRD_TABLE, entryKey);
		const oldItem = this.findOriginalItem(DATABASE_THIRD_TABLE, entryKey);
		if (JSON.stringify(updatedItem) === JSON.stringify(oldItem)) return;

		updatedItem.content.link = Utilities.normalizeWebUrl(link);

		await this.updateTableSingleValue(tableName, entryKey, 'link');
	}

	/**
	 * Open a confirmation dialog before deleting a third-table entry.
	 * Guards with a permission check before showing the dialog.
	 *
	 * @param entryKey - The key of the entry to delete.
	 */
	protected openDeleteConfirmationDialog(entryKey: string) {
		const returnCode = this.checkPermission(DATABASE_THIRD_TABLE, entryKey);
		//Rollback
		if (returnCode === FAILURE) return;

		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_CONFIRM,
			async () => {
				await this.removeRecordFromDatabase(entryKey);
			},
			[REMINDER_MSG_DELETE_CONFIRM, REMINDER_DIALOG_DELETE_BTN, REMINDER_DIALOG_CONFIRM_BTN]
		);
	}

	/**
	 * Removes a single record from the third reminder table in the database and
	 * shows a save indicator on success. Handles permission-denied and unexpected
	 * errors by showing the appropriate dialog.
	 *
	 * @param entryKey - The unique key identifying the record to remove.
	 */
	private async removeRecordFromDatabase(entryKey: string) {
		// Capture the item text before the delete so the stat can describe what was removed.
		const itemText =
			this.findUpdatedItem(DATABASE_THIRD_TABLE, entryKey)?.content?.text ??
			this.originalThirdTable.find((i: any) => i.key === entryKey)?.content?.text ??
			'';
		try {
			await this.databaseService.removeRecordFromReminderTable(DATABASE_THIRD_TABLE, entryKey);
			this.triggerSaveIndicator(DATABASE_THIRD_TABLE);
			// Fire-and-forget: surface the deletion in the Recent Activity widget.
			this.databaseService
				.appendToActivityLog(STATS_FIELD_RECENT_REMINDER, {
					type: HISTORY_STATUS_DELETED,
					table: REMINDER_TABLE_MESSAGES,
					text: itemText,
					timestamp: Utilities.getCurrentFormattedTime(true)
				})
				.catch(() => {});
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
		}
	}

	/**
	 * Add a plain-text entry to the third reminder table.
	 */
	protected async addNewTextOnly() {
		if (this.thirdTableNewText.trim() !== '') {
			try {
				await this.databaseService.addNewRecordForReminderTable(DATABASE_THIRD_TABLE, {
					text: this.thirdTableNewText
				});
				this.triggerSaveIndicator(DATABASE_THIRD_TABLE);
				this.thirdTableNewText = '';
			} catch (error) {
				this.dialogService.handleError(this.dialogComponentContainer, error);
			}
		}
	}

	/**
	 * Add a new entry to the third reminder table using the active popover
	 * item as a template. Filters out empty fields before saving.
	 * If the new entry includes a due date, the home-page reminder widget is
	 * updated immediately without waiting for the subscription to fire.
	 */
	protected async addNewEntry() {
		if (this.thirdTableNewText.trim() !== '') {
			let newContent = Object.fromEntries(
				Object.entries(this.thirdTableActiveItem.content).filter(([_, value]) => value !== '')
			);
			newContent['text'] = this.thirdTableNewText;
			if (newContent['date'] instanceof Date) {
				newContent['date'] = Utilities.formatDateForStorage(newContent['date']);
			}
			try {
				await this.databaseService.addNewRecordForReminderTable(DATABASE_THIRD_TABLE, newContent);
				this.triggerSaveIndicator(DATABASE_THIRD_TABLE);
				// If the new entry has a due date, push it into the local messages cache
				// so the reminder widget reflects it before the CloudBase round-trip ends.
				if (newContent['date']) {
					this.upcomingMessages.push({
						type: REMINDER_ITEM_MESSAGE,
						name: String(newContent['text'] ?? ''),
						date: String(newContent['date']),
						link: String(newContent['link'] ?? '')
					});
					this.syncReminderStatistics();
				}
				this.thirdTableNewText = '';
				this.op2.hide();
			} catch (error) {
				this.dialogService.handleError(this.dialogComponentContainer, error);
			}
		}
	}

	/**
	 * Open the popover for adding or editing a third-table entry.
	 * If no item is provided, initializes an empty template.
	 *
	 * @param event - The triggering DOM event (used for popover positioning).
	 * @param item - The existing entry to edit, or undefined for a new entry.
	 */
	protected openPopover(event: Event, item: any) {
		if (!item) {
			this.thirdTableActiveItem = {
				content: { link: '', date: '' }
			};
		} else {
			this.thirdTableActiveItem = item;
		}

		this.op2.hide();

		setTimeout(() => {
			this.op2.show(event);
		}, 140);
	}

	/**
	 * Handle a page-change event from the third-table paginator. Updates the
	 * first-item index and refreshes the paged data slice.
	 *
	 * @param event - The PrimeNG paginator event containing the new `first` index.
	 */
	protected thirdTablePageChange(event: any) {
		this.thirdTableIndexOfFirstItem = event.first;
		this.pagedThirdTable = this.updatePagedThirdTable();
	}

	///////////////////////////////////SECOND & THIRD TABLE/////////////////////////
	/**
	 * This method calls database directly and rollback changes if an error occurs
	 *
	 * {@link updateDebt} - Update debt by decrement a constant value for second table
	 * {@link setDefaultDebt} - Button to set defult debt for second table
	 * {@link updateLink} - Update link for third table
	 * {@link updateTableWithNewDate} - Update date for both second table and third table
	 */
	protected async updateTableSingleValue(tableName: string, entryKey: string, valueKey: string) {
		const updatedItem = this.findUpdatedItem(tableName, entryKey);
		const originalItem = this.findOriginalItem(tableName, entryKey);
		if (!updatedItem || !originalItem) return;
		let updatedValue = updatedItem.content[valueKey];
		const oldValue = originalItem.content[valueKey];
		try {
			if (updatedValue !== oldValue) {
				await this.databaseService.updateReminderTable(tableName, entryKey, valueKey, updatedValue);
				this.triggerSaveIndicator(tableName);
				// Fire-and-forget: surface this change in the Recent Activity widget.
				const tableLabel =
					tableName === DATABASE_SECOND_TABLE
						? REMINDER_TABLE_ACCOUNT_EXPENSES
						: REMINDER_TABLE_MESSAGES;
				// For the second table the human-readable identifier is the account `name` field;
				// for the third table it is the message text inside `content.text`.
				const itemText =
					tableName === DATABASE_SECOND_TABLE
						? (this.findUpdatedItem(DATABASE_SECOND_TABLE, entryKey)?.name ?? '')
						: tableName === DATABASE_THIRD_TABLE
							? (this.findUpdatedItem(DATABASE_THIRD_TABLE, entryKey)?.content?.text ?? '')
							: '';
				this.databaseService
					.appendToActivityLog(STATS_FIELD_RECENT_REMINDER, {
						type: ACTIVITY_TYPE_UPDATED,
						table: tableLabel,
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
		await this.updateTableSingleValue(tableName, entryKey, 'date');
		// Immediately reflect the date change (or removal) in the home-page reminder
		// widget without waiting for the CloudBase subscription to fire.
		this.resyncUpcomingFromLocalData();
	}

	/**
	 * Finds an item in the updated (working) copy of either the second or third
	 * table by its entry key.
	 *
	 * @param tableName - The name of the table to search (SECOND_TABLE or THIRD_TABLE).
	 * @param entryKey - The unique key identifying the item to find.
	 * @returns The matching item from the updated table, or undefined if not found.
	 */
	private findUpdatedItem(tableName: string, entryKey: string) {
		if (tableName === DATABASE_SECOND_TABLE) {
			return this.updatedSecondTable.find((item) => item.key === entryKey);
		} else if (tableName === DATABASE_THIRD_TABLE) {
			return this.pagedThirdTable.find((item) => item.key === entryKey);
		}
	}

	/**
	 * Finds an item in the original (server-state) copy of either the second or
	 * third table by its entry key. Used for comparing current edits against the
	 * original data.
	 *
	 * @param tableName - The name of the table to search (SECOND_TABLE or THIRD_TABLE).
	 * @param entryKey - The unique key identifying the item to find.
	 * @returns The matching item from the original table, or undefined if not found.
	 */
	private findOriginalItem(tableName: string, entryKey: string) {
		if (tableName === DATABASE_SECOND_TABLE) {
			return this.originalSecondTable.find((item) => item.key === entryKey);
		} else if (tableName === DATABASE_THIRD_TABLE) {
			return this.originalThirdTable.find((item) => item.key === entryKey);
		}
	}

	/**
	 * Merge the latest expense and message arrays into a single reminderUpcoming
	 * array and write it to the statistics collection.
	 * Called after either secondSub or thirdSub emits so the merged list is always
	 * current. Fire-and-forget — errors are swallowed inside updateStatisticsFields.
	 */
	private syncReminderStatistics(): void {
		// Debounce: both secondSub and thirdSub emit on init in the same tick.
		// Defer the write so a single CloudBase call is made after both have settled.
		if (this.syncStatTimer !== null) clearTimeout(this.syncStatTimer);
		this.syncStatTimer = setTimeout(() => {
			this.syncStatTimer = null;
			const totalReminders =
				(this.originalSecondTable?.length ?? 0) + (this.originalThirdTable?.length ?? 0);
			this.databaseService.updateStatisticsFields({
				[STATS_FIELD_REMINDER_UPCOMING]: [...this.upcomingExpenses, ...this.upcomingMessages],
				[STATS_FIELD_REMINDER_TOTAL]: totalReminders
			});
		}, 0);
	}

	/**
	 * Immediately recomputes both `upcomingExpenses` and `upcomingMessages` from
	 * the current local data and writes the merged result to the statistics
	 * collection without waiting for a CloudBase subscription callback.
	 *
	 * For the second table, expenses are derived from `updatedSecondTable` (the
	 * working copy kept in sync with every date edit).  For the third table,
	 * `pagedThirdTable` edits are merged on top of `originalThirdTable` so that
	 * any change on the current page is visible before the server round-trip
	 * completes.
	 *
	 * Used to reflect date mutations and date removals in the home-page reminder
	 * widget immediately after the user interacts.
	 */
	private resyncUpcomingFromLocalData(): void {
		// Recompute expenses from the working copy of the second table.
		this.upcomingExpenses = this.updatedSecondTable
			.filter((item: any) => item.content?.date && !item.content?.paid)
			.map((item: any) => ({ type: REMINDER_ITEM_EXPENSE, name: item.name, date: item.content.date }));

		// Merge pagedThirdTable edits into a full view of the third table so that
		// in-progress changes on the current page are visible before the subscription fires.
		const pagedKeys = new Set(this.pagedThirdTable.map((i: any) => i.key));
		const mergedThird = [
			...this.originalThirdTable.filter((i: any) => !pagedKeys.has(i.key)),
			...this.pagedThirdTable
		];

		this.upcomingMessages = mergedThird
			.filter((item: any) => item.content?.date)
			.map((item: any) => ({
				type: REMINDER_ITEM_MESSAGE,
				name: item.content.text ?? '',
				date: item.content.date,
				link: item.content.link ?? ''
			}));

		this.syncReminderStatistics();
	}

	////////////////////////////////COMMON METHODS////////////////////////////////
	/**
	 * Resolve the owner openid for the given table and entry, then delegate
	 * the actual permission check to Utilities.checkPermission.
	 * Use this method ONLY for buttons and dialogs to avoid multiple database calls.
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
		this.cdr.detectChanges();

		// Clear any previous timeout before setting a new one — rapid successive
		// saves should restart the indicator timer rather than flash on/off.
		if (this.saveIndicatorTimeouts[tableName]) {
			clearTimeout(this.saveIndicatorTimeouts[tableName]);
		}

		this.saveIndicatorTimeouts[tableName] = setTimeout(() => {
			this.saveIndicators[tableName] = false;
			this.cdr.detectChanges();
		}, 1000);
	}

	/**
	 * Template helper \u2014 delegates to Utilities.checkIfChinese so the regex
	 * lives in a single place.
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
		return Utilities.coerceDateToString(date);
	}

	/**
	 * Persist a link change from the popover editor for the active third-table entry.
	 * No-ops when the popover was opened in "add new" mode (no key yet).
	 */
	protected onPopoverLinkChange(): void {
		if (this.thirdTableActiveItem?.key) {
			this.updateLink(
				this.THIRD_TABLE,
				this.thirdTableActiveItem.key,
				this.thirdTableActiveItem.content.link
			);
		}
	}

	/**
	 * Persist a due-date change from the popover date-picker for the active
	 * third-table entry. No-ops when in "add new" mode (no key yet).
	 *
	 * @param date - The Date value selected in the date-picker.
	 */
	protected onPopoverDateChange(date: Date): void {
		if (this.thirdTableActiveItem?.key) {
			this.updateTableWithNewDate(this.THIRD_TABLE, this.thirdTableActiveItem.key, date);
		}
	}

	/**
	 * Handle the primary action button in the popover: deletes the entry when
	 * editing an existing item, or adds a new entry when in "add new" mode.
	 */
	protected onPopoverActionClick(): void {
		if (this.thirdTableActiveItem?.key) {
			this.openDeleteConfirmationDialog(this.thirdTableActiveItem.key);
		} else {
			this.addNewEntry();
		}
	}
}
