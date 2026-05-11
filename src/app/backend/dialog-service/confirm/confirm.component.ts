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

	constructor() {}

	/**
	 * Open the confirm dialog.
	 *
	 * @param acceptCallback - The callback to call when the dialog is accepted.
	 * @param data - The data required to display in the dialog.
	 * @param data[0] - The message to display in the dialog.
	 * @param data[1] - The header to display in the dialog.
	 * @param data[2] - The accept button label to display in the dialog.
	 */
	public openDialog(acceptCallback: () => Promise<void>, data: any[]) {
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
	 * Handle the dialog closed event
	 */
	protected onDialogClosed() {
		this.closed$.emit();
	}
}
