import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { isPlatformBrowser } from '@angular/common';
import { FirebaseService } from '../service/firebase-service/firebase.service';
import { SkeletonModule } from 'primeng/skeleton';
import { Subscription } from 'rxjs';
import { LOG } from '../app.logs';
import { COMPONENT_DESTROY } from '../app.utilities';
import { DatePickerModule } from 'primeng/datepicker';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumber } from "primeng/inputnumber";

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
    InputNumber
],
	templateUrl: './remainder.component.html',
	styleUrl: './remainder.component.css'
})
export class RemainderComponent {
	private readonly className = 'RemainderComponent';
	private isLoggedIn!: boolean;
	protected remainderSub?: Subscription;
	protected loading = true;
	private finalizedCells = new Set<string>();
	protected originalFirstRows!: any[];
	protected updatedFirstRows!: any[];
	protected currentDay!: number;
	protected fields: Array<string> = ['first', 'second', 'third', 'fourth'];
	protected secondRows!: any[];

	constructor(@Inject(PLATFORM_ID) private platformId: Object, private firebaseService: FirebaseService) {
		if (isPlatformBrowser(this.platformId)) {
			this.isLoggedIn = JSON.parse(localStorage.getItem('permission') || 'false');
			this.secondRows = [
				{
					key: 'MBNA',
					value: {
						debt: 6529.98,
						date: '2026-01-12'
					}
				},
				{
					key: 'ROGERS',
					value: {
						debt: 0,
						date: '2026-01-12'
					}
				},
				{
					key: 'RBC(1219)',
					value: {
						debt: 0,
						date: '2026-01-12'
					}
				},
				{
					key: 'RBC(2239)',
					value: {
						debt: 0,
						date: '2026-01-12'
					}
				},
				{
					key: 'CIBC',
					value: {
						debt: 0,
						date: '2026-01-12'
					}
				},
				{
					key: 'SCOTIABANK',
					value: {
						debt: 0,
						date: '2026-01-12'
					}
				},
				{
					key: 'TRIANGLE',
					value: {
						debt: 0,
						date: '2026-01-12'
					}
				}
			];
		}
	}

	async ngOnInit() {
		if (isPlatformBrowser(this.platformId) && this.isLoggedIn) {
			this.currentDay = new Date().getDate();

			this.remainderSub = this.firebaseService.getRemainderTableDetails().subscribe((rows) => {
				// Need deep copy here so that we are not copying references
				this.originalFirstRows = structuredClone(rows);
				this.updatedFirstRows = structuredClone(rows);

				this.loading = false;

				// Loop through to determine disabled fields
				for (let index = 0; index < this.updatedFirstRows.length; index++) {
					for (const field of this.fields) {
						if (this.updatedFirstRows[index][field] < this.currentDay) {
							this.finalizedCells.add(`${index}-${field}`);
						}
					}
				}
			});
		}
	}

	ngOnDestroy() {
		this.remainderSub?.unsubscribe();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	onNumberChange(event: KeyboardEvent) {
		const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
		if (allowedKeys.includes(event.key)) return;

		if (!/^[0-9]$/.test(event.key)) {
			event.preventDefault();
		}
	}

	onValueChange(rowIndex: number, field: string) {
		// Reset value if it reaches threshold
		let currentValue = this.updatedFirstRows[rowIndex][field];
		if (Number(currentValue) > 31) {
			this.updatedFirstRows[rowIndex][field] = this.originalFirstRows[rowIndex][field];
			return;
		} else if (rowIndex !== 0) {
			const previousValue = this.updatedFirstRows[rowIndex - 1][field];
			if ((rowIndex == 1 || rowIndex == 3) && Number(currentValue) - Number(previousValue) < 2) {
				this.updatedFirstRows[rowIndex][field] = this.originalFirstRows[rowIndex][field];
				return;
			} else if ((rowIndex == 2 || rowIndex == 4) && Number(currentValue) - Number(previousValue) < 6) {
				this.updatedFirstRows[rowIndex][field] = this.originalFirstRows[rowIndex][field];
				return;
			}
		}

		// Convert it to number
		this.updatedFirstRows[rowIndex][field] = Number(this.updatedFirstRows[rowIndex][field]);

		// Update other values in the same column
		for (let index = rowIndex; index < this.updatedFirstRows.length; index++) {
			if (index == 0 || index == 2) {
				this.twoDayDiff(index, field);
			} else if (index == 1 || index == 3) {
				this.sixDaysDiff(index, field);
			}
		}

		// Update table to firebase
		this.firebaseService.updateRemainderTableDetails(this.updatedFirstRows);
	}

	isDisabled(rowIndex: number, field: string): boolean {
		return this.finalizedCells.has(`${rowIndex}-${field}`);
	}

	// 1 -> 2 && 3 -> 4
	private sixDaysDiff(rowIndex: number, field: string) {
		this.updatedFirstRows[rowIndex + 1][field] = Number(this.updatedFirstRows[rowIndex][field]) + 6;

		this.updatedFirstRows[rowIndex + 1][field] =
			this.updatedFirstRows[rowIndex + 1][field] > 31 ? 31 : this.updatedFirstRows[rowIndex + 1][field];
	}

	// 0 -> 1 && 2 -> 3
	private twoDayDiff(rowIndex: number, field: string) {
		this.updatedFirstRows[rowIndex + 1][field] = Number(this.updatedFirstRows[rowIndex][field]) + 2;

		this.updatedFirstRows[rowIndex + 1][field] =
			this.updatedFirstRows[rowIndex + 1][field] > 31 ? 31 : this.updatedFirstRows[rowIndex + 1][field];
	}
}
