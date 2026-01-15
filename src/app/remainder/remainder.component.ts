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
	private isLoggedIn!: boolean;
	protected loading = true;
	protected isHoverCapable = Utilities.checkIfHoverCapable();
	private finalizedCells = new Set<string>();
	protected originalFirstTable!: any[];
	protected updatedFirstTable!: any[];
	protected currentDay!: number;
	protected fields: Array<string> = ['first', 'second', 'third', 'fourth'];
	protected originalSecondTable!: any[];
	protected updatedSecondTable!: any[];
	protected originalThirdTable!: any[];
	protected updatedThirdTable!: any[];
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
			this.currentDay = new Date().getDate();

			// Get the data of the first table
			this.firstSub = this.firebaseService.getRemainderTableDetails(FIRST_TABLE).subscribe((rows) => {
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
			this.secondSub = this.firebaseService.getRemainderTableDetails(SECOND_TABLE).subscribe((rows) => {
				this.originalSecondTable = structuredClone(rows);
				this.updatedSecondTable = structuredClone(rows);
			});

			// Get the data of the third table
			this.thirdSub = this.firebaseService.getRemainderTableDetails(THIRD_TABLE).subscribe((rows) => {
				this.originalThirdTable = structuredClone(rows);
				this.updatedThirdTable = structuredClone(rows);
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

	protected openConfirmationDialog() {
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

    protected updateDebt(index: number) {
        if(this.isHoverCapable)
		this.updatedSecondTable[index].content.debt =
			Math.round((this.updatedSecondTable[index].content.debt - 998.05) * 100) / 100;
		this.updateTable(SECOND_TABLE, index, 'debt');
	}

	protected setDefaultDebt(rowIndex: number) {
		if (this.updatedSecondTable[rowIndex].content.paid) {
			this.updatedSecondTable[rowIndex].content.original =
				this.updatedSecondTable[rowIndex].content.debt;
			this.updatedSecondTable[rowIndex].content.paid = false;
			this.firebaseService.updateRemainderTable(
				SECOND_TABLE,
				rowIndex,
				'content',
				this.updatedSecondTable[rowIndex].content
			);
		} else {
			this.updatedSecondTable[rowIndex].content.debt =
				this.updatedSecondTable[rowIndex].content.original;
			this.updateTable(SECOND_TABLE, rowIndex, 'debt');
		}
	}

	///////////////////////////////////THIRD TABLE///////////////////////////////////
	protected showDatepickerOnIconClick(dp: any) {
		dp.toggle();
	}

	protected updateThirdTableWithNewDate(date: Date, item: any) {
		item.date = date.toISOString().slice(0, 10);
	}

	////////////////////////////////COMMON METHODS////////////////////////////////

	protected updateTable(tableName: string, rowIndex: number, key: string) {
		const newValue =
			tableName === SECOND_TABLE
				? this.updatedSecondTable[rowIndex].content[key]
				: this.updatedThirdTable[rowIndex][key];

		if (
			newValue !== this.originalSecondTable[rowIndex].content[key] ||
			newValue !== this.originalThirdTable[rowIndex][key]
		) {
			this.firebaseService.updateRemainderTable(tableName, rowIndex, key, newValue);
		}
	}

	protected updateTableWithNewDate(tableName: string, rowIndex: number, date: Date, item: any) {
		if (tableName == SECOND_TABLE) {
			item.content.date = date.toISOString().slice(0, 10);
		} else if (tableName == THIRD_TABLE) {
			item.date = date.toISOString().slice(0, 10);
		}
		this.updateTable(tableName, rowIndex, 'date');
	}
}
