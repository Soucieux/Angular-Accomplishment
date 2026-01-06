import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { isPlatformBrowser } from '@angular/common';
import { FirebaseService } from '../service/firebase-service/firebase.service';
import { Observable } from 'rxjs';

@Component({
	selector: 'remainder',
	imports: [TableModule, InputTextModule, FormsModule, Button],
	templateUrl: './remainder.component.html',
	styleUrl: './remainder.component.css'
})
export class RemainderComponent {
	private isLoggedIn!: boolean;
	protected rows!: any[];

	constructor(@Inject(PLATFORM_ID) private platformId: Object, private firebaseService: FirebaseService) {
		if (isPlatformBrowser(this.platformId)) {
			this.isLoggedIn = JSON.parse(localStorage.getItem('permission') || 'false');
		}
	}

	async ngOnInit() {
		if (isPlatformBrowser(this.platformId) && this.isLoggedIn) {
			this.firebaseService.getRemainderTableDetails().subscribe((rows) => {
				this.rows = rows;
			});
		}
	}

	onNumberChange(rowIndex: number, field: 'first' | 'second' | 'third' | 'fourth', event: KeyboardEvent) {
		const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
		if (allowedKeys.includes(event.key)) return;

		if (!/^[0-9]$/.test(event.key)) {
			event.preventDefault();
		}

		if (Number(this.rows[rowIndex][field].toString() + event.key) > 31) {
			event.preventDefault();
		}
	}

	onValueChange(rowIndex: number, field: 'first' | 'second' | 'third' | 'fourth') {
		for (let index = rowIndex; index < this.rows.length; index++) {
			if (index == 0 || index == 2) {
				this.twoDayDiff(index, field);
			} else if (index == 1 || index == 3) {
				this.sixDaysDiff(index, field);
			}
		}
	}

	// 1 -> 2 && 3 -> 4
	private sixDaysDiff(rowIndex: number, field: 'first' | 'second' | 'third' | 'fourth') {
		this.rows[rowIndex + 1][field] = Number(this.rows[rowIndex][field]) + 6;

		this.rows[rowIndex + 1][field] =
			this.rows[rowIndex + 1][field] > 31 ? 31 : this.rows[rowIndex + 1][field];
	}

	// 0 -> 1 && 2 -> 3
	private twoDayDiff(rowIndex: number, field: 'first' | 'second' | 'third' | 'fourth') {
		this.rows[rowIndex + 1][field] = Number(this.rows[rowIndex][field]) + 2;

		this.rows[rowIndex + 1][field] =
			this.rows[rowIndex + 1][field] > 31 ? 31 : this.rows[rowIndex + 1][field];
	}
}
