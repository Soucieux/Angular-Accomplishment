import { Component, EventEmitter, inject, Output } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Utilities } from '../../../common/app.utilities';

@Component({
	selector: 'confirm-dialog',
	template: ` <p-confirmdialog (onHide)="onDialogClosed()" />`,
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
	 * @param acceptCallback - The callback to call when the dialog is accepted
	 * @param data - The data required to display in the dialog
	 * @param data[0] - The message to display in the dialog
	 * @param data[1] - The header to display in the dialog
	 * @param data[2] - The accept button label to display in the dialog
	 * @param data[3] - The message to display after accepting the dialog
	 */
	openDialog(acceptCallback: () => Promise<void>, data: any[]) {
		this.confirmationService.confirm({
			message: data[0],
			header: data[1],
			closable: true,
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
				try {
					await acceptCallback();

					if (!this.utilities.isMobile() && data[4]) {
						this.messageService.add({
							severity: 'info',
							summary: 'Confirmed',
							detail: data[3]
						});
					}
				} catch (error) {
					throw error;
				}
			},
			reject: () => {
				if (!this.utilities.isMobile() && data[4]) {
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
