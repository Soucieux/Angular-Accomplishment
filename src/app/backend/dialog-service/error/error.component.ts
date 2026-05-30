import { Component, EventEmitter, inject, Output } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import {
	ERROR_DIALOG_BTN_LABEL,
	ERROR_DIALOG_HEADER,
	ERROR_DIALOG_ICON_CLASS,
	ERROR_DIALOG_MSG_CLASS
} from '../../../common/app.constant';

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
	/**
	 * Opens an error dialog displaying the given error message.
	 *
	 * @param errorMessage - The error message to display.
	 */
	public openDialog(errorMessage: string) {
		this.confirmationService.confirm({
			message: `<div class="${ERROR_DIALOG_MSG_CLASS}">${errorMessage}</div>`,
			header: ERROR_DIALOG_HEADER,
			icon: ERROR_DIALOG_ICON_CLASS,
			rejectVisible: false,
			acceptButtonProps: {
				label: ERROR_DIALOG_BTN_LABEL,
				severity: 'danger',
				style: { width: '100px' }
			}
		});
    }
    
	/**
	 * Handles the dialog closed event by emitting the closed event.
	 */
	protected onDialogClosed() {
		this.closed$.emit();
	}
}
