import { Component, EventEmitter, inject, Output } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
	selector: 'error-dialog',
	styleUrl: './error.component.scss',
	template: `<p-confirmdialog
		styleClass="error-dialog"
		[closable]="false"
		(onHide)="onDialogClosed()"></p-confirmdialog> `,
	standalone: true,
	imports: [ConfirmDialogModule],
	providers: [ConfirmationService]
})
export class ErrorDialogComponent {
	@Output() closed$ = new EventEmitter<void>();
	private confirmationService = inject(ConfirmationService);
	constructor() {}
	/**
	 * Open an error dialog displaying the given error message.
	 *
	 * @param errorMessage - The error message to display.
	 */
	public openDialog(errorMessage: string) {
		this.confirmationService.confirm({
			message: `<div class="error-dialog-message">${errorMessage}</div>`,
			header: 'Error',
			icon: 'pi pi-times-circle text-red-500',
			rejectVisible: false,
			acceptButtonProps: {
				label: 'OK',
				severity: 'danger',
				style: { width: '100px' }
			}
		});
    }
    
	/**
	 * Handle the dialog closed event
	 */
	protected onDialogClosed() {
		this.closed$.emit();
	}
}
