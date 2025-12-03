import { Component, EventEmitter, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
	selector: 'search-dialog',
	imports: [DialogModule, ButtonModule],
	templateUrl: './search.component.html',
	styleUrl: './search.component.css'
})
export class SearchDialogComponent {
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
