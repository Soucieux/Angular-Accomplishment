import { Component, Output, EventEmitter, ViewChild, ViewContainerRef } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { Observable } from 'rxjs';
import { DialogService } from '../dialog.service';

@Component({
	selector: 'history-dialog',
	imports: [DialogModule, CommonModule, DividerModule],
	templateUrl: './history.component.html',
	styleUrl: './history.component.css'
})
export class HistoryDialogComponent {
	@Output() closed$ = new EventEmitter<void>();
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	protected visible: boolean = false;
	protected entries$!: Observable<any>;
	private acceptCallback!: () => void;

	constructor(private dialogService: DialogService) {}

	protected openDialog(acceptCallback: () => void, entries: Observable<any>) {
		this.visible = true;
		this.entries$ = entries;
		this.acceptCallback = acceptCallback;
	}

	protected setBackgroundColor(status: string) {
		if (status === 'added') {
			return 'solid green';
		} else if (status === 'deleted') {
			return 'solid red';
		}
		return '';
	}

	protected onMessageClick(entry: any) {
		console.log(entry);
		this.dialogService.openDialog(this.dialogComponentContainer, 'confirm', () => {}, [
			'Undo this deletion?',
			'Undo',
			'Confirm',
			'Movie recovered'
		]);
	}

	protected onDialogClosed() {
		this.closed$.emit();
		this.visible = false;
	}

	ngOnDestroy() {
		this.dialogComponentContainer?.clear();
	}
}
