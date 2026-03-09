import { Component, EventEmitter, inject, Output } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { Utilities } from '../../../common/app.utilities';
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
	constructor(private utilities: Utilities) {}
	openDialog(errorMessage: string) {
		this.confirmationService.confirm({
			message: `<div class="error-dialog-message">${errorMessage}</div>`,
			header: 'Error',
			icon: 'pi pi-times-circle text-red-500',
			rejectVisible: false,
			acceptButtonProps: {
				label: 'OK',
				severity: 'danger',
				...(this.utilities.isMobile()
					? {
							style: {
								width: '100px'
							}
					  }
					: {
							style: {
								width: '100px',
								'margin-right': '100px'
							}
					  })
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
