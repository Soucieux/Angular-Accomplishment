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
	private isResolved = false;

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
	 * Closes the dialog because the awaited data arrived after the countdown had already elapsed,
	 * and latches the retry action so a click landing in the same moment cannot still reload the
	 * page. Hiding the dialog alone is not enough: a click dispatched just before the close is
	 * applied would otherwise discard a page that has finished loading.
	 */
	public resolve(): void {
		this.isResolved = true;
		this.visible = false;
		this.closed$.emit();
	}

	/**
	 * Reloads the page when the user clicks the retry button, and emits
	 * the closed event so the dialog service cleans up the component ref.
	 * Does nothing once the awaited data has already arrived.
	 */
	protected onRetry(): void {
		if (this.isResolved) return;
		this.closed$.emit();
		window.location.reload();
	}
}
