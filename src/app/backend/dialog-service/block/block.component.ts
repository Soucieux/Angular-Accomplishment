import { ChangeDetectorRef, Component, Output, EventEmitter } from '@angular/core';
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

	constructor(private readonly cdr: ChangeDetectorRef) {}

	/**
	 * Opens the blocking dialog, runs the given task, and closes automatically when it settles.
	 * Calls detectChanges before the task so Angular renders the dialog even when the caller's
	 * async chain uses Promises that Zone.js does not track.
	 *
	 * @param task - The async task to execute while the dialog is visible.
	 * @param message - The message to display in the dialog.
	 * @returns The promise from the task.
	 */
	public async openDialog(task: () => Promise<void>, message: string): Promise<void> {
		// Step 1: Show the dialog before the task starts
		this.message = message;
		this.visible = true;

		/*
		 * Step 2: Force a synchronous change-detection cycle so PrimeNG renders the dialog
		 * immediately — Promises outside Zone.js will not trigger automatic detection.
		 */
		this.cdr.detectChanges();

		try {
			// Step 3: Run the caller's async work while the dialog is visible
			await task();
		} finally {
			// Step 4: Always hide the dialog and notify listeners, even on error
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
