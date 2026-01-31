import { Component, Output, EventEmitter, ViewChild, ViewContainerRef } from '@angular/core';
import { MovieItemVO } from '../../../entertainment/entertainment.movieitem.vo';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { Observable } from 'rxjs';
import { DialogService } from '../dialog.service';
import { MovieAlreadyExistsError } from '../../../error/movie-already-exists-error';

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
	private revertDataCallback!: (movie: MovieItemVO) => void;

	constructor(private dialogService: DialogService) {}

	protected openDialog(revertDataCallback: (movie: MovieItemVO) => void, entries: Observable<any>) {
		this.visible = true;
		this.entries$ = entries;
		this.revertDataCallback = revertDataCallback;
	}

	protected setBackgroundColor(status: string) {
		if (status === 'added') {
			return 'solid green';
		} else if (status === 'deleted') {
			return 'solid red';
		}
		return '';
	}

	protected async onMessageClick(entry: any) {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			'confirm',
			async () => {
				try {
					let movieToRestore = new MovieItemVO();
					movieToRestore.setMovieId(entry.id);
					const genre = entry.message.split(' - ')[1].split(' ')[0].trim();
					movieToRestore.setMovieGenre(genre);
					await this.revertDataCallback?.(movieToRestore);
				} catch (error) {
					if (error instanceof MovieAlreadyExistsError) {
						this.dialogService.openDialog(
							this.dialogComponentContainer,
							'error',
							'Movie already exists'
						);
					}
				}
			},
			['Undo this deletion?', 'Undo', 'Confirm', 'Movie recovered', false]
		);
	}

	protected onDialogClosed() {
		this.closed$.emit();
		this.visible = false;
	}

	ngOnDestroy() {
		this.dialogComponentContainer?.clear();
	}
}
