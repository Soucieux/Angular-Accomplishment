import { Component, EventEmitter, inject, Output } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
	selector: 'confirm-dialog',
	template: ` <p-confirmdialog styleClass="confirm-dialog" (onHide)="onDialogClosed()" />`,
	styleUrl: './confirm.component.scss',
	standalone: true,
	imports: [ConfirmDialogModule],
	providers: [ConfirmationService]
})
export class ConfirmDialogComponent {
	@Output() closed$ = new EventEmitter<void>();
	private confirmationService = inject(ConfirmationService);

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
		this.confirmationService.confirm({
			message: data[0],
			header: data[1],
			closable: false,
			closeOnEscape: true,
			icon: 'pi pi-info-circle',
			rejectButtonProps: {
				label: 'Cancel',
				severity: 'secondary',
				outlined: true
			},
			acceptButtonProps: {
				label: data[2],
				severity: 'danger'
			},

			accept: async () => {
				await acceptCallback();
			},
			reject: () => {}
		});
	}

	/**
	 * Handles the dialog closed event by emitting the closed event.
	 */
	protected onDialogClosed() {
		this.closed$.emit();
	}
}
