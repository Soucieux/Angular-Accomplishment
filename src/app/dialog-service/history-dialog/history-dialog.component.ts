import { Component, Output, EventEmitter } from '@angular/core';
import { DialogModule } from 'primeng/dialog';

@Component({
	selector: 'history-dialog',
	imports: [DialogModule],
	templateUrl: './history-dialog.component.html',
	styleUrl: './history-dialog.component.css'
})
export class HistoryDialogComponent {
	@Output() closed$ = new EventEmitter<void>();
	visible: boolean = false;

	protected openDialog(message: string, acceptCallback: () => void) {
		this.visible = true;
	}

	protected onDialogClosed() {
		this.closed$.emit();
		this.visible = false;
	}
}
