import { Component, Output, EventEmitter } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'blocking-dialog',
	standalone: true,
	imports: [DialogModule, CommonModule],
	templateUrl: './block.component.html',
	styleUrl: './block.component.scss'
})
export class BlockDialogComponent {
	@Output() closed$ = new EventEmitter<void>();
	visible: boolean = false;
	message: string = '';

	constructor() {}

	async openDialog(task: () => Promise<void>, message: string) {
		this.message = message;
		this.visible = true;
		try {
			await task();
		} catch (error) {
			throw error;
		} finally {
			this.visible = false;
			this.closed$.emit();
		}
	}

	onDialogClosed() {
		this.closed$.emit();
		this.visible = false;
	}
}
