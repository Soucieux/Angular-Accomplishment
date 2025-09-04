import { Component, EventEmitter, inject, Output } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
	selector: 'dialog',
	template: ` <p-confirmdialog (onHide)="onDialogClosed()" /> `,
	standalone: true,
	imports: [ConfirmDialogModule],
	providers: [ConfirmationService]
})
export class DeleteDialogComponent {
	@Output() closed$ = new EventEmitter<void>();
	private confirmationService = inject(ConfirmationService);
	private messageService = inject(MessageService);

	/**
	 * Open the delete dialog
	 *
	 * @param message - The message to display in the dialog
	 * @param acceptCallback - The callback to call when the dialog is accepted
	 */
	openDialog(message: string, acceptCallback: () => void) {
		this.confirmationService.confirm({
			message: message,
			header: 'Delete Movie',
			closable: true,
			closeOnEscape: true,
			icon: 'pi pi-info-circle',
			rejectButtonProps: {
				label: 'Cancel',
				severity: 'secondary',
				outlined: true
			},
			acceptButtonProps: {
				label: 'Delete',
				severity: 'danger'
			},

			accept: () => {
				this.messageService.add({ severity: 'info', summary: 'Confirmed', detail: 'Record deleted' });
				acceptCallback();
			},
			reject: () => {
				this.messageService.add({
					severity: 'info',
					summary: 'Cancelled',
					detail: 'Operation cancelled'
				});
			}
		});
	}

	/**
	 * Handle the dialog closed event
	 */
	onDialogClosed() {
		this.closed$.emit();
	}
}
