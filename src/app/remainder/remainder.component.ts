import { Component, Inject, PLATFORM_ID, ViewChild, ViewContainerRef } from '@angular/core';
import { isPlatformBrowser, NgStyle } from '@angular/common';
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
import { FirebaseService } from '../service/firebase-service/firebase.service';
import { Subscription } from 'rxjs';
import { LOG } from '../app.logs';
import { COMPONENT_DESTROY, FIRST_TABLE, SECOND_TABLE, THIRD_TABLE, Utilities } from '../app.utilities';
import { DialogService } from '../service/dialog-service/dialog.service';

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
		PopoverModule
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
	private isLoggedIn!: boolean;
	protected loading = true;
	protected isHoverCapable!: boolean;
	private finalizedCells = new Set<string>();
	protected originalFirstTable!: any[];
	protected updatedFirstTable!: any[];
	protected currentDay!: number;
	protected fields: Array<string> = ['first', 'second', 'third', 'fourth'];
	protected updatedSecondTable!: any[];
	protected originalSecondTable!: any[];
	protected updatedThirdTable!: any[];
    protected originalThirdTable!: any[];
    protected activeItem!: any;
	protected firstSub?: Subscription;
	protected secondSub?: Subscription;
	protected thirdSub?: Subscription;
	protected SECOND_TABLE: string = SECOND_TABLE;
	protected THIRD_TABLE: string = THIRD_TABLE;

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		private dialogService: DialogService,
		private firebaseService: FirebaseService
	) {
		if (isPlatformBrowser(this.platformId)) {
			this.isLoggedIn = JSON.parse(localStorage.getItem('permission') || 'false');
		}
	}
	async ngOnInit() {
		if (isPlatformBrowser(this.platformId) && this.isLoggedIn) {
			this.isHoverCapable = Utilities.checkIfHoverCapable();
			this.currentDay = new Date().getDate();

			// Get the data of the first table
			this.firstSub = this.firebaseService.getFirstRemainderTableDetails().subscribe((rows) => {
				// Need deep copy here so that we are not copying references
				this.originalFirstTable = structuredClone(rows);
				this.updatedFirstTable = structuredClone(rows);

				this.loading = false;

				// Loop through to determine disabled fields
				for (let index = 0; index < this.updatedFirstTable.length; index++) {
					for (const field of this.fields) {
						if (this.updatedFirstTable[index][field].value < this.currentDay) {
							this.updatedFirstTable[index][field].isCharged = true;
							this.finalizedCells.add(`${index}-${field}`);
						}
					}
				}
			});

			// Get the data of the second table
			this.secondSub = this.firebaseService.getSecondRemainderTableDetails().subscribe((rows) => {
				this.updatedSecondTable = structuredClone(rows);
				this.originalSecondTable = structuredClone(rows);
			});

			// Get the data of the third table
			this.thirdSub = this.firebaseService.getThirdRemainderTableDetails().subscribe((rows) => {
				this.updatedThirdTable = structuredClone(rows);
				this.originalThirdTable = structuredClone(rows);
			});
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

	onValueChange(rowIndex: number, field: string) {
		let originalValue = this.originalFirstTable[rowIndex][field].value;

		// Do nothing if the value does not change
		if (this.updatedFirstTable[rowIndex][field].value == originalValue) return;

		// Reset value if it reaches threshold
		if (Number(this.updatedFirstTable[rowIndex][field].value) > 31) {
			this.updatedFirstTable[rowIndex][field].value = originalValue;
			return;
		} else if (rowIndex !== 0) {
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
		for (let index = rowIndex; index < this.updatedFirstTable.length; index++) {
			if (index == 0 || index == 2) {
				this.twoDayDiff(index, field);
			} else if (index == 1 || index == 3) {
				this.sixDaysDiff(index, field);
			}
		}

		// Update table to firebase
		this.firebaseService.updateFirstRemainderTable(FIRST_TABLE, this.updatedFirstTable);
	}

	protected isDisabled(rowIndex: number, field: string): boolean {
		return this.finalizedCells.has(`${rowIndex}-${field}`);
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

	protected setIsCharged(rowIndex: number, field: string) {
		if (!this.updatedFirstTable[rowIndex][field].isCharged) {
			this.updatedFirstTable[rowIndex][field].isCharged = true;

			// Update table to firebase
			this.firebaseService.updateFirstRemainderTable(FIRST_TABLE, this.updatedFirstTable);
		}
	}

	protected openResetConfirmationDialog() {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			'reset',
			() => {
				this.resetFirstTable();
			},
			`Are you sure you want to reset the dates?`,
			`Reset`
		);
	}

	private resetFirstTable() {
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
		// Update table to firebase
		this.firebaseService.updateFirstRemainderTable(FIRST_TABLE, this.updatedFirstTable);
	}

	///////////////////////////////////SECOND TABLE///////////////////////////////////
	protected preventKeyin(event: KeyboardEvent) {
		event.preventDefault();
	}

	protected updateDebt(entryKey: string, currentDebt: number) {
		this.findUpdatedObject(SECOND_TABLE, entryKey).debt = Math.round((currentDebt - 998.05) * 100) / 100;
		this.updateTableSingleValue(SECOND_TABLE, entryKey, 'debt');
	}

	protected setDefaultDebt(entryKey: string, isPaid: boolean) {
		const existingRecord = this.findUpdatedObject(SECOND_TABLE, entryKey);
		if (isPaid) {
			const newRecord = {
				original: existingRecord.debt,
				paid: false
			};
			this.firebaseService.updateRemainderTable(SECOND_TABLE, entryKey, 'content', newRecord);
		} else {
			existingRecord.debt = existingRecord.original;
			this.updateTableSingleValue(SECOND_TABLE, entryKey, 'debt');
		}
	}

	///////////////////////////////////THIRD TABLE///////////////////////////////////
	protected updateLink(entryKey: string, link: string) {
		let linkInLowerCase = link.toLowerCase();
		if (linkInLowerCase.startsWith('www.')) {
			linkInLowerCase = 'https://' + linkInLowerCase;
		} else if (linkInLowerCase.startsWith('https://') || linkInLowerCase.startsWith('http://')) {
			linkInLowerCase = linkInLowerCase;
		} else {
			linkInLowerCase = 'https://www.' + linkInLowerCase;
		}
		this.findUpdatedObject(THIRD_TABLE, entryKey).link = linkInLowerCase;
		this.updateTableSingleValue(THIRD_TABLE, entryKey, 'link');
	}

	protected openDeleteConfirmationDialog(key: string) {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			'delete',
			() => {
				this.firebaseService.removeRecordFromRemainderTable(THIRD_TABLE, key);
			},
			`Are you sure you want to delete this entry?`,
			`Delete`
		);
    }
    
    protected openPopover(event: Event, item: any) {
        this.activeItem = item;
        this.op2.toggle(event);
        
    }

	////////////////////////////////COMMON METHODS////////////////////////////////

	protected updateTableSingleValue(tableName: string, entryKey: string, valueKey: string) {
		const newValue = this.findUpdatedObject(tableName, entryKey)[valueKey];
		if (newValue !== this.findOriginalObject(tableName, entryKey)[valueKey]) {
			this.firebaseService.updateRemainderTable(tableName, entryKey, valueKey, newValue);
		}
	}

	protected updateTableWithNewDate(tableName: string, entryKey: string, date: Date) {
		this.findUpdatedObject(tableName, entryKey).date = date.toISOString().slice(0, 10);
		this.updateTableSingleValue(tableName, entryKey, 'date');
	}

	private findUpdatedObject(tableName: string, entryKey: string) {
		if (tableName === SECOND_TABLE) {
			return this.updatedSecondTable.find((item) => item.key === entryKey).content;
		} else if (tableName === THIRD_TABLE) {
			return this.updatedThirdTable.find((item) => item.key === entryKey);
		}
	}

	private findOriginalObject(tableName: string, entryKey: string) {
		if (tableName === SECOND_TABLE) {
			return this.originalSecondTable.find((item) => item.key === entryKey).content;
		} else if (tableName === THIRD_TABLE) {
			return this.originalThirdTable.find((item) => item.key === entryKey);
		}
	}
}
