import {
	ChangeDetectorRef,
	Component,
	Inject,
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
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { Subscription } from 'rxjs';
import { LOG } from '../../common/app.logs';
import { Utilities } from '../../common/app.utilities';
import {
	COMPONENT_DESTROY,
	DATABASE_REMAINDER_FIRST,
	DATABASE_REMAINDER_SECOND,
	DATABASE_REMAINDER_THIRD,
	ERROR_PERMISSION_DENIED,
	FAILURE,
	FIRST_TABLE,
	SECOND_TABLE,
	SUCCESS,
	THIRD_TABLE
} from '../../common/app.constant';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { DatabaseService } from '../../backend/database-service/database.service';
import { format } from 'date-fns';

@Component({
	selector: 'remainder',
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
		ToggleSwitchModule
	],
	templateUrl: './remainder.component.html',
	styleUrl: './remainder.component.css'
})
export class RemainderComponent {
	private readonly className = 'RemainderComponent';
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	@ViewChild('op2') op2!: any;
	protected loading = true;
	protected isHoverCapable!: boolean;
	private chargedCells = new Set<string>();
	protected originalFirstTable!: any[];
	protected updatedFirstTable!: any[];
	protected currentDay!: number;
	protected fields: Array<string> = ['first', 'second', 'third', 'fourth'];
	protected updatedSecondTable!: any[];
	protected originalSecondTable!: any[];
	protected pagedThirdTable!: any[];
	protected originalThirdTable!: any[];
	protected firstSub?: Subscription;
	protected secondSub?: Subscription;
	protected thirdSub?: Subscription;
	protected FIRST_TABLE: string = FIRST_TABLE;
	protected SECOND_TABLE: string = SECOND_TABLE;
	protected THIRD_TABLE: string = THIRD_TABLE;
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
	private chargedCellsInitialized = false;
	protected isNextMonth!: boolean;

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		private dialogService: DialogService,
		private databaseService: DatabaseService,
		private cdr: ChangeDetectorRef,
		private utilities: Utilities
	) {}

	ngOnInit() {
		if (isPlatformBrowser(this.platformId) && this.utilities.getIsUserAlive()) {
			this.isHoverCapable = Utilities.checkIfHoverCapable();
			this.currentDay = new Date().getDate();

			// Get the data of the first table
			const getFirstObservable = this.databaseService.getFirstRemainderTableDetails();
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
				this.cdr.detectChanges();
			});

			// Get the data of the second table
			const getSecondObservable = this.databaseService.getSecondRemainderTableDetails();
			this.secondSub = getSecondObservable.subscribe((rows) => {
				this.updatedSecondTable = structuredClone(rows);
				this.originalSecondTable = structuredClone(rows);
				this.cdr.detectChanges();
			});

			// Get the data of the third table
			const getThirdObservable = this.databaseService.getThirdRemainderTableDetails();
			this.thirdSub = getThirdObservable.subscribe((rows) => {
				this.originalThirdTable = structuredClone(rows);
				this.pagedThirdTable = this.updatePagedThirdTable();
				this.loading = false;
				this.cdr.detectChanges();
			});
		}
	}

	protected async updateChargedCells() {
		if (this.chargedCellsInitialized) {
			const returnCode = await this.checkPermissionForFirstTable();
			// Rollback
			if (returnCode === FAILURE) {
				this.isNextMonth = !this.isNextMonth;
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
					this.updatedFirstTable[index][field].isCharged = true;
					this.chargedCells.add(`${index}-${field}`);
				}
			}
		}

		if (this.chargedCellsInitialized) {
			this.updatedFirstTable.push({ isNextMonth: this.isNextMonth });
			await this.callDatabaseForFirstTable();
		}
	}

	ngOnDestroy() {
		this.firstSub?.unsubscribe();
		this.secondSub?.unsubscribe();
		this.thirdSub?.unsubscribe();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	///////////////////////////////////FIRST TABLE///////////////////////////////////
	onNumberChange(event: KeyboardEvent) {
		const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
		if (allowedKeys.includes(event.key)) return;

		if (!/^[0-9]$/.test(event.key)) {
			this.preventKeyin(event);
		}
	}

	async onValueChange(rowIndex: number, field: string) {
		let originalValue = this.originalFirstTable[rowIndex][field].value;

		// Do nothing if the value does not change
		if (this.updatedFirstTable[rowIndex][field].value == originalValue) return;

		const returnCode = await this.checkPermissionForFirstTable();
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
		await this.callDatabaseForFirstTable();
	}

	protected isDisabled(rowIndex: number, field: string): boolean {
		return this.chargedCells.has(`${rowIndex}-${field}`);
	}

	// 1 -> 2 && 3 -> 4
	private sixDaysDiff(rowIndex: number, field: string) {
		this.updatedFirstTable[rowIndex + 1][field].value =
			Number(this.updatedFirstTable[rowIndex][field].value) + 6;
		this.updatedFirstTable[rowIndex + 1][field].isCharged = false;

		this.isValueGreaterThan31(rowIndex, field);
	}

	// 0 -> 1 && 2 -> 3
	private twoDayDiff(rowIndex: number, field: string) {
		this.updatedFirstTable[rowIndex + 1][field].value =
			Number(this.updatedFirstTable[rowIndex][field].value) + 2;
		this.updatedFirstTable[rowIndex + 1][field].isCharged = false;
		this.isValueGreaterThan31(rowIndex, field);
	}

	private isValueGreaterThan31(rowIndex: number, field: string) {
		this.updatedFirstTable[rowIndex + 1][field].value =
			this.updatedFirstTable[rowIndex + 1][field].value > 31
				? 31
				: this.updatedFirstTable[rowIndex + 1][field].value;
	}

	protected async setIsCharged(rowIndex: number, field: string) {
		const returnCode = await this.checkPermissionForFirstTable();
		// Rollback
		if (returnCode === FAILURE) return;

		if (!this.updatedFirstTable[rowIndex][field].isCharged) {
			this.updatedFirstTable[rowIndex][field].isCharged = true;

			// Update table to database
			await this.callDatabaseForFirstTable();
		}
	}

	protected async openResetConfirmationDialog() {
		const returnCode = await this.checkPermissionForFirstTable();
		// Rollback
		if (returnCode === FAILURE) return;

		this.dialogService.openDialog(
			this.dialogComponentContainer,
			'confirm',
			() => {
				this.resetFirstTable();
			},
			['Are you sure you want to reset the dates?', 'Reset', 'Confirm', 'Dates reset', true]
		);
	}

	protected setStyle(isCharged: boolean, value: number) {
		if (value === this.currentDay) {
			return 'color: red';
		} else if (isCharged) {
			return 'color: orange';
		}
		return '';
	}

	private async resetFirstTable() {
		this.updatedFirstTable = [
			{
				first: { value: 1, isCharged: false },
				second: { value: 1, isCharged: false },
				third: { value: 1, isCharged: false },
				fourth: { value: 1, isCharged: false }
			},
			{
				first: { value: 3, isCharged: false },
				second: { value: 3, isCharged: false },
				third: { value: 3, isCharged: false },
				fourth: { value: 3, isCharged: false }
			},
			{
				first: { value: 9, isCharged: false },
				second: { value: 9, isCharged: false },
				third: { value: 9, isCharged: false },
				fourth: { value: 9, isCharged: false }
			},
			{
				first: { value: 11, isCharged: false },
				second: { value: 11, isCharged: false },
				third: { value: 11, isCharged: false },
				fourth: { value: 11, isCharged: false }
			},
			{
				first: { value: 17, isCharged: false },
				second: { value: 17, isCharged: false },
				third: { value: 17, isCharged: false },
				fourth: { value: 17, isCharged: false }
			}
		];

		await this.callDatabaseForFirstTable();
	}

	///////////////////////////////////SECOND TABLE///////////////////////////////////
	protected preventKeyin(event: KeyboardEvent) {
		event.preventDefault();
	}

	protected async updateDebt(tableName: string, entryKey: string, currentDebt: number) {
		const collectionName = this.convertTableNameToCollectionName(tableName);
		const returnCode = await this.checkPermission(collectionName, entryKey);
		if (returnCode === FAILURE) return;

		this.findUpdatedItem(SECOND_TABLE, entryKey).content.debt =
			Math.round((currentDebt - 998.05) * 100) / 100;
		this.updateTableSingleValue(SECOND_TABLE, entryKey, 'debt');
	}

	protected async setDefaultDebt(entryKey: string, isPaid: boolean) {
		const collectionName = this.convertTableNameToCollectionName(SECOND_TABLE);
		const returnCode = await this.checkPermission(collectionName, entryKey);
		if (returnCode === FAILURE) return;

		const existingRecord = this.findUpdatedItem(SECOND_TABLE, entryKey).content;
		if (isPaid) {
			// Set default value
			const newRecord = {
				original: existingRecord.debt,
				paid: false
			};

			await this.databaseService.updateRemainderTable(collectionName, entryKey, 'content', newRecord);
			this.triggerSaveIndicator(SECOND_TABLE);
		} else {
			// Reset value
			existingRecord.debt = existingRecord.original;
			this.updateTableSingleValue(SECOND_TABLE, entryKey, 'debt');
		}
	}

	///////////////////////////////////THIRD TABLE///////////////////////////////////
	protected updatePagedThirdTable() {
		return structuredClone(
			this.originalThirdTable.slice(
				this.thirdTableIndexOfFirstItem,
				this.thirdTableIndexOfFirstItem + this.thirdTableItemsPerPage
			)
		);
	}
	protected async updateLink(tableName: string, entryKey: string, link: string) {
		const updatedItem = this.findUpdatedItem(THIRD_TABLE, entryKey);
		const oldItem = this.findOriginalItem(THIRD_TABLE, entryKey);
		if (JSON.stringify(updatedItem) === JSON.stringify(oldItem)) return;

		const collectionName = this.convertTableNameToCollectionName(tableName);
		const returnCode = await this.checkPermission(collectionName, entryKey);
		if (returnCode === FAILURE) {
			updatedItem.content = structuredClone(oldItem.content);
			return;
		}

		let linkInLowerCase = link.toLowerCase();
		if (linkInLowerCase.startsWith('www.')) {
			linkInLowerCase = 'https://' + linkInLowerCase;
		} else if (linkInLowerCase.startsWith('https://') || linkInLowerCase.startsWith('http://')) {
			// do nothing
		} else {
			linkInLowerCase = 'https://www.' + linkInLowerCase;
		}
		updatedItem.content.link = linkInLowerCase;
		this.updateTableSingleValue(THIRD_TABLE, entryKey, 'link');
	}

	protected async openDeleteConfirmationDialog(entryKey: string) {
		const collectionName = this.convertTableNameToCollectionName(THIRD_TABLE);
		const returnCode = await this.checkPermission(collectionName, entryKey);
		//Rollback
		if (returnCode === FAILURE) return;

		this.dialogService.openDialog(
			this.dialogComponentContainer,
			'confirm',
			() => {
				this.databaseService.removeRecordFromRemainderTable(
					this.convertTableNameToCollectionName(THIRD_TABLE),
					entryKey
				);
				this.triggerSaveIndicator(THIRD_TABLE);
			},
			['Are you sure you want to delete this entry?', 'Delete', 'Confirm', 'Entry deleted', true]
		);
	}

	protected addNewTextOnly() {
		if (this.thirdTableNewText.trim() !== '') {
			this.databaseService.addNewRecordForRemainderTable(
				this.convertTableNameToCollectionName(THIRD_TABLE),
				{
					text: this.thirdTableNewText
				}
			);
			this.triggerSaveIndicator(THIRD_TABLE);
			this.thirdTableNewText = '';
		}
	}

	protected addNewEntry() {
		if (this.thirdTableNewText.trim() !== '') {
			let newContent = Object.fromEntries(
				Object.entries(this.thirdTableActiveItem.content).filter(([_, value]) => value !== '')
			);
			newContent['text'] = this.thirdTableNewText;
			this.databaseService.addNewRecordForRemainderTable(
				this.convertTableNameToCollectionName(THIRD_TABLE),
				newContent
			);
			this.triggerSaveIndicator(THIRD_TABLE);
			this.thirdTableNewText = '';
			this.op2.hide();
		}
	}

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

	thirdTablePageChange(event: any) {
		this.thirdTableIndexOfFirstItem = event.first;
		this.pagedThirdTable = this.updatePagedThirdTable();
	}

	////////////////////////////////COMMON METHODS////////////////////////////////

	protected async updateTableSingleValue(tableName: string, entryKey: string, valueKey: string) {
		const updatedItem = this.findUpdatedItem(tableName, entryKey).content[valueKey];
		const oldItem = this.findOriginalItem(tableName, entryKey).content[valueKey];

		if (JSON.stringify(updatedItem) !== JSON.stringify(oldItem)) {
			const collectionName = this.convertTableNameToCollectionName(tableName);
			await this.databaseService.updateRemainderTable(collectionName, entryKey, valueKey, updatedItem);
			this.triggerSaveIndicator(tableName);
		}
	}

	protected async checkAndUpdateTableSingleValue(tableName: string, entryKey: string, valueKey: string) {
		const updatedItem = this.findUpdatedItem(tableName, entryKey);
		const oldItem = this.findOriginalItem(tableName, entryKey);
		if (JSON.stringify(updatedItem) === JSON.stringify(oldItem)) return;

		const collectionName = this.convertTableNameToCollectionName(tableName);
		const returnCode = await this.checkPermission(collectionName, entryKey);
		if (returnCode === FAILURE) {
			// Rollback
			updatedItem.content = structuredClone(oldItem.content);
			return;
		}
		this.updateTableSingleValue(tableName, entryKey, valueKey);
	}

	protected async updateTableWithNewDate(tableName: string, entryKey: string, date: Date) {
		const updatedItem = this.findUpdatedItem(tableName, entryKey);
		const oldItem = this.findOriginalItem(tableName, entryKey);
		if (JSON.stringify(updatedItem) === JSON.stringify(oldItem)) return;

		const collectionName = this.convertTableNameToCollectionName(tableName);
		const returnCode = await this.checkPermission(collectionName, entryKey);
		if (returnCode === FAILURE) {
			if (oldItem.content.date) updatedItem.content.date = oldItem.content.date;
			else this.thirdTableActiveItem.content.date = '';
			return;
		}

		updatedItem.content.date = format(date, 'yyyy-MM-dd');
		this.updateTableSingleValue(tableName, entryKey, 'date');
	}

	private findUpdatedItem(tableName: string, entryKey: string) {
		if (tableName === SECOND_TABLE) {
			return this.updatedSecondTable.find((item) => item.key === entryKey);
		} else if (tableName === THIRD_TABLE) {
			return this.pagedThirdTable.find((item) => item.key === entryKey);
		}
	}

	private findOriginalItem(tableName: string, entryKey: string) {
		if (tableName === SECOND_TABLE) {
			return this.originalSecondTable.find((item) => item.key === entryKey);
		} else if (tableName === THIRD_TABLE) {
			return this.originalThirdTable.find((item) => item.key === entryKey);
		}
	}

	private async checkPermission(collectionName: string, entryKey: string) {
		try {
			await this.databaseService.checkPermission(collectionName, entryKey);
			return SUCCESS;
		} catch (error) {
			if (error instanceof Error && error.message === ERROR_PERMISSION_DENIED) {
				this.openErrorDialog();
			}
			return FAILURE;
		}
	}

	private async checkPermissionForFirstTable() {
		return await this.checkPermission(
			this.convertTableNameToCollectionName(FIRST_TABLE),
			this.updatedFirstTable[0]._id
		);
	}

	private async callDatabaseForFirstTable() {
		try {
			await this.databaseService.updateFirstRemainderTable(FIRST_TABLE, this.updatedFirstTable);
			this.triggerSaveIndicator(FIRST_TABLE);
		} catch (error) {
			LOG.error(this.className, 'Unexpected error occurred', error as Error);
		}
	}

	private triggerSaveIndicator(tableName: string) {
		this.saveIndicators[tableName] = true;

		if (this.saveIndicatorTimeouts[tableName]) {
			clearTimeout(this.saveIndicatorTimeouts[tableName]);
		}

		this.saveIndicatorTimeouts[tableName] = setTimeout(() => {
			this.saveIndicators[tableName] = false;
		}, 1000);
	}

	/**
	 * Open error confirmation dialog
	 */
	private openErrorDialog() {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			'error',
			'User does not have permission'
		);
	}

	/**
	 * Get corresponding table name in the database
	 *
	 * @param tableName table name
	 */
	private convertTableNameToCollectionName(tableName: string): string {
		switch (tableName) {
			case FIRST_TABLE:
				return DATABASE_REMAINDER_FIRST;
			case SECOND_TABLE:
				return DATABASE_REMAINDER_SECOND;
			case THIRD_TABLE:
				return DATABASE_REMAINDER_THIRD;
			default:
				return '';
		}
	}
}
