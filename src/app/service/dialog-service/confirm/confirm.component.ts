import { Component, EventEmitter, inject, Output } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Utilities } from '../../../app.utilities';

@Component({
	selector: 'confirm-dialog',
	template: ` <p-confirmdialog (onHide)="onDialogClosed()" /> `,
	styleUrl: './confirm.component.scss',
	standalone: true,
	imports: [ConfirmDialogModule],
	providers: [ConfirmationService]
})
export class ConfirmDialogComponent {
	@Output() closed$ = new EventEmitter<void>();
	private confirmationService = inject(ConfirmationService);
	private messageService = inject(MessageService);

	constructor(private utilities: Utilities) {}

	/**
	 * Open the delete dialog
	 *
	 * @param dialogType - The type of dialog to open
	 * @param acceptCallback - The callback to call when the dialog is accepted
	 * @param message - The message to display in the dialog
	 * @param header - The header to display in the dialog
	 */
	openDialog(dialogType: string, acceptCallback: () => void, message: string, header: string) {
		this.confirmationService.confirm({
			message: message,
			header: header,
			closable: true,
			closeOnEscape: true,
			icon: 'pi pi-info-circle',
			rejectButtonProps: {
				label: 'Cancel',
				severity: 'secondary',
				outlined: true
			},
			acceptButtonProps: {
				label: dialogType === 'delete' ? 'Delete' : 'Reset',
				severity: 'danger'
			},

			accept: () => {
				if (!this.utilities.isMobile()) {
					this.messageService.add({
						severity: 'info',
						summary: 'Confirmed',
						detail: dialogType === 'delete' ? 'Record deleted' : 'Data reset'
					});
				}
				acceptCallback();
			},
			reject: () => {
				if (!this.utilities.isMobile()) {
					this.messageService.add({
						severity: 'info',
						summary: 'Cancelled',
						detail: 'Operation cancelled'
					});
				}
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
