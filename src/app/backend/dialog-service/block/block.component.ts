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

	/**
	 * Open the blocking dialog and execute the given task. The dialog
	 * stays visible until the task completes or fails, then closes automatically.
	 *
	 * @param task - The async task to execute while the dialog is visible.
	 * @param message - The message to display in the dialog.
	 * @returns The promise from the task.
	 */
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

	/**
	 * Handle the dialog closed event by emitting the closed event.
	 */
	onDialogClosed() {
		this.closed$.emit();
		this.visible = false;
	}
}
