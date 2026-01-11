import { Component, Inject, PLATFORM_ID } from '@angular/core';
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
import { FirebaseService } from '../service/firebase-service/firebase.service';
import { Subscription } from 'rxjs';
import { LOG } from '../app.logs';
import { COMPONENT_DESTROY, FIRST_TABLE, SECOND_TABLE } from '../app.utilities';

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
		Tooltip
	],
	templateUrl: './remainder.component.html',
	styleUrl: './remainder.component.css'
})
export class RemainderComponent {
	private readonly className = 'RemainderComponent';
	private isLoggedIn!: boolean;
	protected loading = true;
	private finalizedCells = new Set<string>();
	protected originalFirstTable!: any[];
	protected updatedFirstTable!: any[];
	protected currentDay!: number;
	protected fields: Array<string> = ['first', 'second', 'third', 'fourth'];
	protected originalSecondTable!: any[];
	protected updatedSecondTable!: any[];
	protected firstSub?: Subscription;
	protected secondSub?: Subscription;

	constructor(@Inject(PLATFORM_ID) private platformId: Object, private firebaseService: FirebaseService) {
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
						if (this.updatedFirstTable[index][field] < this.currentDay) {
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
		}
	}

	ngOnDestroy() {
		this.firstSub?.unsubscribe();
		this.secondSub?.unsubscribe();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	onNumberChange(event: KeyboardEvent) {
		const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
		if (allowedKeys.includes(event.key)) return;

		if (!/^[0-9]$/.test(event.key)) {
			this.preventKeyin(event);
		}
	}

	onValueChange(rowIndex: number, field: string) {
		// Reset value if it reaches threshold
		let currentValue = this.updatedFirstTable[rowIndex][field];
		if (Number(currentValue) > 31) {
			this.updatedFirstTable[rowIndex][field] = this.originalFirstTable[rowIndex][field];
			return;
		} else if (rowIndex !== 0) {
			const previousValue = this.updatedFirstTable[rowIndex - 1][field];
			if ((rowIndex == 1 || rowIndex == 3) && Number(currentValue) - Number(previousValue) < 2) {
				this.updatedFirstTable[rowIndex][field] = this.originalFirstTable[rowIndex][field];
				return;
			} else if ((rowIndex == 2 || rowIndex == 4) && Number(currentValue) - Number(previousValue) < 6) {
				this.updatedFirstTable[rowIndex][field] = this.originalFirstTable[rowIndex][field];
				return;
			}
		}

		// Convert it to number
		this.updatedFirstTable[rowIndex][field] = Number(this.updatedFirstTable[rowIndex][field]);

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
		this.updatedFirstTable[rowIndex + 1][field] = Number(this.updatedFirstTable[rowIndex][field]) + 6;

		this.updatedFirstTable[rowIndex + 1][field] =
			this.updatedFirstTable[rowIndex + 1][field] > 31
				? 31
				: this.updatedFirstTable[rowIndex + 1][field];
	}

	// 0 -> 1 && 2 -> 3
	private twoDayDiff(rowIndex: number, field: string) {
		this.updatedFirstTable[rowIndex + 1][field] = Number(this.updatedFirstTable[rowIndex][field]) + 2;

		this.updatedFirstTable[rowIndex + 1][field] =
			this.updatedFirstTable[rowIndex + 1][field] > 31
				? 31
				: this.updatedFirstTable[rowIndex + 1][field];
	}

	protected resetFirstTable() {
		this.updatedFirstTable = [
			{ first: 1, second: 1, third: 1, fourth: 1 },
			{ first: 3, second: 3, third: 3, fourth: 3 },
			{ first: 9, second: 9, third: 9, fourth: 9 },
			{ first: 11, second: 11, third: 11, fourth: 11 },
			{ first: 17, second: 17, third: 17, fourth: 17 }
		];
		// Update table to firebase
		this.firebaseService.updateFirstRemainderTable(FIRST_TABLE, this.updatedFirstTable);
	}

	protected updateSecondTable(rowIndex: number, key: string) {
		const newValue = this.updatedSecondTable[rowIndex].value[key];

		if (newValue !== this.originalSecondTable[rowIndex].value[key]) {
			this.firebaseService.updateSecondRemainderTable(SECOND_TABLE, rowIndex, key, newValue);
		}
	}

	protected updateSecondTableWithNewDate(rowIndex: number, date: Date, item: any) {
		item.value.date = date.toISOString().slice(0, 10);
		this.updateSecondTable(rowIndex, 'date');
	}

	protected preventKeyin(event: KeyboardEvent) {
		event.preventDefault();
	}

	protected updateDebt(index: number) {
		this.updatedSecondTable[index].value.debt =
			Math.round((this.updatedSecondTable[index].value.debt - 998.05) * 100) / 100;
		this.updateSecondTable(index, 'debt');
	}

	protected setDefaultDebt(rowIndex: number) {
		if (this.updatedSecondTable[rowIndex].value.paid) {
			this.updatedSecondTable[rowIndex].value.original = this.updatedSecondTable[rowIndex].value.debt;
			this.updatedSecondTable[rowIndex].value.paid = false;
			this.firebaseService.updateSecondRemainderTable(
				SECOND_TABLE,
				rowIndex,
				'value',
				this.updatedSecondTable[rowIndex].value
			);
		} else {
			this.updatedSecondTable[rowIndex].value.debt = this.updatedSecondTable[rowIndex].value.original;
			this.updateSecondTable(rowIndex, 'debt');
		}
	}
}
