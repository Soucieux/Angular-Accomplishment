import { Component, EventEmitter, inject, Output } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { FormsModule, NgForm } from '@angular/forms';
import { SelectModule } from 'primeng/select';

@Component({
	selector: 'add-dialog',
	standalone: true,
	imports: [DialogModule, ButtonModule, AvatarModule, FormsModule, SelectModule],
	templateUrl: './add.dialog.component.html',
	styleUrl: './add.dialog.component.scss',
	providers: [ConfirmationService]
})
export class AddDialogComponent {
	@Output() closed$ = new EventEmitter<void>();
	private messageService = inject(MessageService);
	visible: boolean = false;
	years: { year: number }[] | undefined;

	ngOnInit() {
		this.years = Array.from({ length: 8 }, (_, i) => ({ year: 2025 - i }));
	}

	openDialog(message: string, acceptCallback: () => void) {
		this.visible = true;
	}

	searchCurrentMovie(arg0: any) {
		console.log(arg0);
	}

	onSubmit(addMovieForm: NgForm) {
		this.onDialogClosed();
		console.log(addMovieForm.value);
	}

	onDialogClosed() {
		this.closed$.emit();
		this.visible = false;
	}
}
