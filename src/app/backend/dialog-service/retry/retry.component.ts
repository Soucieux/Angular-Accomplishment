import { Component, EventEmitter, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { Button } from 'primeng/button';

@Component({
	selector: 'retry-dialog',
	standalone: true,
	imports: [DialogModule, Button],
	templateUrl: './retry.component.html',
	styleUrl: './retry.component.scss'
})
export class RetryDialogComponent {
	@Output() closed$ = new EventEmitter<void>();
	protected visible = false;
	protected message = '';

	/**
	 * Opens the retry dialog with the given message.
	 *
	 * @param message - The message displayed above the retry button.
	 */
	public openDialog(message: string): void {
		this.message = message;
		this.visible = true;
	}

	/**
	 * Reloads the page when the user clicks the retry button, and emits
	 * the closed event so the dialog service cleans up the component ref.
	 */
	protected onRetry(): void {
		this.closed$.emit();
		window.location.reload();
	}
}
