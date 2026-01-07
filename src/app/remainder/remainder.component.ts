import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { isPlatformBrowser } from '@angular/common';
import { FirebaseService } from '../service/firebase-service/firebase.service';

@Component({
	selector: 'remainder',
	imports: [TableModule, InputTextModule, FormsModule, Button],
	templateUrl: './remainder.component.html',
	styleUrl: './remainder.component.css'
})
export class RemainderComponent {
	private isLoggedIn!: boolean;
	protected originalRows!: any[];
	protected updatedRows!: any[];

	constructor(@Inject(PLATFORM_ID) private platformId: Object, private firebaseService: FirebaseService) {
		if (isPlatformBrowser(this.platformId)) {
			this.isLoggedIn = JSON.parse(localStorage.getItem('permission') || 'false');
		}
	}

	async ngOnInit() {
		if (isPlatformBrowser(this.platformId) && this.isLoggedIn) {
			this.firebaseService.getRemainderTableDetails().subscribe((rows) => {
				// Need deep copy here so that we are not copying references
				this.originalRows = structuredClone(rows);
				this.updatedRows = structuredClone(rows);
			});
		}
	}

	onNumberChange(rowIndex: number, field: 'first' | 'second' | 'third' | 'fourth', event: KeyboardEvent) {
		const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
		if (allowedKeys.includes(event.key)) return;

		if (!/^[0-9]$/.test(event.key)) {
			event.preventDefault();
		}
	}

	onValueChange(rowIndex: number, field: 'first' | 'second' | 'third' | 'fourth') {
		let currentValue = this.updatedRows[rowIndex][field];
		if (Number(currentValue) > 31) {
			this.updatedRows[rowIndex][field] = this.originalRows[rowIndex][field];
			return;
		} else if (rowIndex !== 0) {
			const previousValue = this.updatedRows[rowIndex - 1][field];
			if ((rowIndex == 1 || rowIndex == 3) && Number(currentValue) - Number(previousValue) < 2) {
				this.updatedRows[rowIndex][field] = this.originalRows[rowIndex][field];
			} else if ((rowIndex == 2 || rowIndex == 4) && Number(currentValue) - Number(previousValue) < 6) {
				this.updatedRows[rowIndex][field] = this.originalRows[rowIndex][field];
			}
			return;
		}

		for (let index = rowIndex; index < this.updatedRows.length; index++) {
			if (index == 0 || index == 2) {
				this.twoDayDiff(index, field);
			} else if (index == 1 || index == 3) {
				this.sixDaysDiff(index, field);
			}
        }
        
        this.firebaseService.updateRemainderTableDetails(this.updatedRows);
	}

	// 1 -> 2 && 3 -> 4
	private sixDaysDiff(rowIndex: number, field: 'first' | 'second' | 'third' | 'fourth') {
		this.updatedRows[rowIndex + 1][field] = Number(this.updatedRows[rowIndex][field]) + 6;

		this.updatedRows[rowIndex + 1][field] =
			this.updatedRows[rowIndex + 1][field] > 31 ? 31 : this.updatedRows[rowIndex + 1][field];
	}

	// 0 -> 1 && 2 -> 3
	private twoDayDiff(rowIndex: number, field: 'first' | 'second' | 'third' | 'fourth') {
		this.updatedRows[rowIndex + 1][field] = Number(this.updatedRows[rowIndex][field]) + 2;

		this.updatedRows[rowIndex + 1][field] =
			this.updatedRows[rowIndex + 1][field] > 31 ? 31 : this.updatedRows[rowIndex + 1][field];
	}
}
