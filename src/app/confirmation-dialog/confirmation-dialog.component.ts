import { Component, inject, Inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
	selector: 'confirm-dialog-basic-demo',
	templateUrl: './confirmation-dialog.component.html',
	standalone: true,
	imports: [ConfirmDialogModule, ToastModule, ButtonModule],
	providers: [ConfirmationService, MessageService]
})
export class ConfirmationDialogComponent {
	private confirmationService = inject(ConfirmationService);
	private messageService = inject(MessageService);

	confirm(
		event: Event,
		message: string = 'Do you want to delete this record?',
		header: string = 'Danger Zone',
		acceptLabel: string = 'Delete',
		rejectLabel: string = 'Cancel'
	) {
		this.confirmationService.confirm({
			target: event.target as EventTarget,
			message: message,
			header: header,
			closable: true,
			closeOnEscape: true,
			icon: 'pi pi-info-circle',
			rejectLabel: rejectLabel,
			rejectButtonProps: {
				label: rejectLabel,
				severity: 'secondary',
				outlined: true
			},
			acceptButtonProps: {
				label: acceptLabel,
				severity: 'danger'
			},

			accept: () => {
				this.messageService.add({ severity: 'info', summary: 'Confirmed', detail: 'Record deleted' });
			},
			reject: () => {
				this.messageService.add({
					severity: 'error',
					summary: 'Rejected',
					detail: 'You have rejected'
				});
			}
		});
	}
}
