import { Component, Output, EventEmitter } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { Observable } from 'rxjs';

@Component({
	selector: 'history-dialog',
	imports: [DialogModule, CommonModule, DividerModule],
	templateUrl: './history.component.html',
	styleUrl: './history.component.css'
})
export class HistoryDialogComponent {
	@Output() closed$ = new EventEmitter<void>();
	protected visible: boolean = false;
	protected entries$!: Observable<any>;

	protected openDialog(acceptCallback: () => void, entries: Observable<any>) {
		this.visible = true;
		this.entries$ = entries;
	}

	protected setBackgroundColor(status: string) {
		if (status === 'added') {
			return 'solid green';
		} else if (status === 'deleted') {
			return 'solid red';
		}
		return '';
	}

	protected onDialogClosed() {
		this.closed$.emit();
		this.visible = false;
	}
}
