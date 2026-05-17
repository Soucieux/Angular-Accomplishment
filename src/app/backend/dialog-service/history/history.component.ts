import { Component, OnDestroy, Output, EventEmitter, ViewChild, ViewContainerRef } from '@angular/core';
import { MovieItemVO } from '../../../fontend/entertainment/movieItem.vo';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { Observable } from 'rxjs';
import { DialogService } from '../dialog.service';
import { MovieAlreadyExistsError } from '../../../common/error/movie-already-exists-error';
import { LOG } from '../../../common/app.logs';
import { HISTORY_STATUS_ADDED, HISTORY_STATUS_DELETED } from '../../../common/app.constant';
import { MovieIdNotFoundError } from '../../../common/error/movie-id-not-found.error';

@Component({
	selector: 'history-dialog',
	imports: [DialogModule, CommonModule, DividerModule],
	templateUrl: './history.component.html',
	styleUrl: './history.component.css'
})
export class HistoryDialogComponent implements OnDestroy {
	private readonly className = 'HistoryDialogComponent';
	@Output() closed$ = new EventEmitter<void>();
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	protected visible: boolean = false;
	protected entries$!: Observable<any>;
	private revertDataCallback!: (movie: MovieItemVO) => void;

	constructor(private dialogService: DialogService) {}

	/**
	 * Open the history dialog and store the revert callback and entries observable.
	 *
	 * @param revertDataCallback - The callback to call to restore a deleted movie.
	 * @param entries - The observable that emits the history entries.
	 */
	protected openDialog(revertDataCallback: (movie: MovieItemVO) => void, entries: Observable<any>) {
		this.visible = true;
		this.entries$ = entries;
		this.revertDataCallback = revertDataCallback;
	}

	/**
	 * Get the background color for a history entry based on its status.
	 *
	 * @param status - The status of the history entry.
	 * @returns A CSS color string, or empty string if the status is unrecognized.
	 */
	protected setBackgroundColor(status: string) {
		if (status === HISTORY_STATUS_ADDED) {
			return 'solid green';
		} else if (status === HISTORY_STATUS_DELETED) {
			return 'solid red';
		}
		return '';
	}

	/**
	 * Handle a click on a history entry by opening a confirmation dialog
	 * to restore (undo) the associated movie deletion.
	 *
	 * @param entry - The history entry to potentially restore.
	 */
	protected async onMessageClick(entry: any) {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			'confirm',
			async () => {
				try {
					let movieToRestore = new MovieItemVO();
					movieToRestore.setMovieId(entry.id);
					// Reconstruct MovieItemVO from the history message string.
					// Format: "MovieName - Genre (Rate: X) was status on YYYY.MM.DD HH:mm:ss"
					// This string-based reconstruction is brittle but avoids storing full movie data in history.
					const movieName = entry.message.split(' - ')[0];
					const genre = entry.message.split(' - ')[1].split(' ')[0].trim();
					const year = entry.message.split(' ')[7].split('.');
					movieToRestore.setMovieName(movieName);
					movieToRestore.setMovieYear(year);
					movieToRestore.setMovieGenre(genre);
					await this.revertDataCallback?.(movieToRestore);
				} catch (error) {
					let errorMessage = '';
					if (error instanceof MovieIdNotFoundError || error instanceof MovieAlreadyExistsError) {
						errorMessage = error.message;
					} else {
						errorMessage = 'Error while searching movie';
						LOG.error(
							this.className,
							'Error while searching new movie from add dialog',
							error as Error
						);
					}
					this.dialogService.openDialog(this.dialogComponentContainer, 'error', errorMessage);
				}
			},
			['Undo this deletion?', 'Undo', 'Confirm']
		);
	}

	/**
	 * Handle the dialog closed event by emitting the closed event.
	 */
	protected onDialogClosed() {
		this.closed$.emit();
		this.visible = false;
	}

	/**
	 * Clears any dynamically attached nested dialog components from the container
	 * to prevent memory leaks when this dialog is destroyed.
	 */
	public ngOnDestroy() {
		this.dialogComponentContainer?.clear();
	}
}
