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
	protected visible: boolean = false;
	protected message: string = '';

	/**
	 * Opens the blocking dialog, runs the given task, and closes automatically when it settles.
	 *
	 * @param task - The async task to execute while the dialog is visible.
	 * @param message - The message to display in the dialog.
	 * @returns The promise from the task.
	 */
	public async openDialog(task: () => Promise<void>, message: string): Promise<void> {
		this.message = message;
		this.visible = true;
		try {
			await task();
		} finally {
			this.visible = false;
			this.closed$.emit();
		}
	}

	/**
	 * Handles the dialog closed event by emitting the closed event.
	 */
	protected onDialogClosed() {
		this.closed$.emit();
		this.visible = false;
	}
}
