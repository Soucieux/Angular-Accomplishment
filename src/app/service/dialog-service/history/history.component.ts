import { Component, Output, EventEmitter } from '@angular/core';
import { DialogModule } from 'primeng/dialog';

@Component({
	selector: 'history-dialog',
	imports: [DialogModule],
	templateUrl: './history.component.html',
	styleUrl: './history.component.css'
})
export class HistoryDialogComponent {
	@Output() closed$ = new EventEmitter<void>();
	visible: boolean = false;

	protected openDialog(acceptCallback: () => void) {
		this.visible = true;
	}

	protected onDialogClosed() {
		this.closed$.emit();
		this.visible = false;
	}
}
