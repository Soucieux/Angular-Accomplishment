import { Component, EventEmitter, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { DIALOG_BTN_CANCEL } from '../../../common/locale/locale-strings';

@Component({
	selector: 'confirm-dialog',
	standalone: true,
	imports: [DialogModule],
	templateUrl: './confirm.component.html',
	styleUrl: './confirm.component.scss'
})
export class ConfirmDialogComponent {
	@Output() closed$ = new EventEmitter<void>();

	protected readonly DIALOG_BTN_CANCEL = DIALOG_BTN_CANCEL;

	protected visible = false;
	protected message = '';
	protected header = '';
	protected acceptLabel = '';

	private acceptCallback!: () => Promise<void>;

	/**
	 * Opens the confirm dialog with the given message, header, and accept label.
	 *
	 * @param acceptCallback - The async callback to invoke when the user confirms.
	 * @param data - The display data for the dialog (fixed three-element array).
	 * @param data[0] - The message to display in the dialog body.
	 * @param data[1] - The header title of the dialog.
	 * @param data[2] - The accept button label.
	 */
	public openDialog(acceptCallback: () => Promise<void>, data: string[]): void {
		this.message = data[0];
		this.header = data[1];
		this.acceptLabel = data[2];
		this.acceptCallback = acceptCallback;
		this.visible = true;
	}

	/**
	 * Backup focus call for the accept button, in case its native autofocus attribute
	 * did not take (e.g. the browser suppressed it since the dialog opens via a JS
	 * event rather than a page load). The button lives inside the p-dialog footer's
	 * <ng-template>, which is rendered by p-dialog's own view, not this component's —
	 * a ViewChild query here cannot reliably resolve it, so a direct DOM lookup is used
	 * instead. With [focusOnShow]="false" on p-dialog, nothing else competes for focus.
	 */
	protected focusAcceptButton(): void {
		document.querySelector<HTMLButtonElement>('.confirm-dialog-button-gradient')?.focus();
	}

	/**
	 * Invokes the accept callback, then closes the dialog.
	 */
	protected async onAccept(): Promise<void> {
		await this.acceptCallback();
		this.visible = false;
	}

	/**
	 * Closes the dialog without invoking the accept callback.
	 */
	protected onReject(): void {
		this.visible = false;
	}

	/**
	 * Handles the dialog closed event by emitting the closed event.
	 */
	protected onDialogClosed(): void {
		this.closed$.emit();
	}
}
