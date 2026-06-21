import { Component, OnDestroy, Output, EventEmitter, ViewChild, ViewContainerRef } from '@angular/core';
import { MovieItemVO } from '../../../fontend/entertainment/movieItem.vo';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { Observable } from 'rxjs';
import { DialogService } from '../dialog.service';
import { MovieAlreadyExistsError } from '../../../common/error/movie-already-exists-error';
import { LOG } from '../../../common/app.logs';
import {
	DIALOG_BTN_CONFIRM,
	DIALOG_CONFIRM,
	DIALOG_ERROR,
	ENT_MSG_ADD_DIALOG_SEARCH_FAILED,
	HISTORY_DIALOG_TITLE,
	HISTORY_DIALOG_UNDO_BTN,
	HISTORY_MOVIE_ID_UNKNOWN,
	HISTORY_MSG_UNDO_CONFIRM,
	HISTORY_STATUS_ADDED,
	HISTORY_STATUS_DELETED,
	HISTORY_STYLE_ADDED,
	HISTORY_STYLE_DELETED
} from '../../../common/app.constant';
import { MovieIdNotFoundError } from '../../../common/error/movie-id-not-found.error';
import { HistoryEntry } from './history.model';

@Component({
	selector: 'history-dialog',
	imports: [DialogModule, CommonModule, DividerModule],
	templateUrl: './history.component.html',
	styleUrl: './history.component.css'
})
export class HistoryDialogComponent implements OnDestroy {
	private readonly className = 'HistoryDialogComponent';
	protected readonly HISTORY_DIALOG_TITLE = HISTORY_DIALOG_TITLE;
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	@Output() closed$ = new EventEmitter<void>();
	protected visible: boolean = false;
	protected entries$!: Observable<HistoryEntry[]>;
	private revertDataCallback!: (movie: MovieItemVO) => Promise<void>;

	constructor(private dialogService: DialogService) {}

	/**
	 * Opens the history dialog and stores the revert callback and entries observable.
	 *
	 * @param revertDataCallback - The callback to call to restore a deleted movie.
	 * @param entries - The observable that emits the history entries.
	 */
	public openDialog(revertDataCallback: (movie: MovieItemVO) => Promise<void>, entries: Observable<HistoryEntry[]>): void {
		this.visible = true;
		this.entries$ = entries;
		this.revertDataCallback = revertDataCallback;
	}

	/**
	 * Gets the CSS background-color string for a history entry based on its status.
	 *
	 * @param status - The status of the history entry.
	 * @returns The CSS border-style string, or empty string if the status is unrecognized.
	 */
	protected getBackgroundColor(status: string): string {
		if (status === HISTORY_STATUS_ADDED) {
			return HISTORY_STYLE_ADDED;
		} else if (status === HISTORY_STATUS_DELETED) {
			return HISTORY_STYLE_DELETED;
		}
		return '';
	}

	/**
	 * Opens a confirmation dialog to restore the deleted movie associated with the given history entry.
	 *
	 * @param entry - The history entry whose associated movie will be restored.
	 */
	protected openRestoreEntryDialog(entry: HistoryEntry) {

		// Step 1: Wrap the restore logic inside a confirmation dialog so the user must acknowledge before reverting
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_CONFIRM,
			async () => {
				try {
					if (!entry.id || !entry.message) throw new MovieIdNotFoundError(HISTORY_MOVIE_ID_UNKNOWN);

					/* Step 2: Reconstruct a MovieItemVO from the history message string.
					   Full movie data is not stored in history — only the human-readable message.
					   Format: "MovieName - Genre (Rate: X) was status on YYYY.MM.DD HH:mm:ss"
					   Positional splitting is fragile; field order in the message must never change. */
					const movieToRestore = new MovieItemVO();
					movieToRestore.setMovieId(entry.id);
					const msg = entry.message;
					const movieName = msg.split(' - ')[0];
					const genre = msg.split(' - ')[1]?.split(' ')[0]?.trim() ?? '';
					const year = Number(msg.split(' ')[7]?.split('.')[0] ?? '0');
					movieToRestore.setMovieName(movieName);
					movieToRestore.setMovieYear(year);
					movieToRestore.setMovieGenre(genre);

					// Step 3: Invoke the caller-supplied revert callback to persist the restoration
					await this.revertDataCallback?.(movieToRestore);
				} catch (error) {
					// Known domain errors surface as user-facing dialogs; everything else is logged as unexpected
					if (error instanceof MovieIdNotFoundError || error instanceof MovieAlreadyExistsError) {
						this.dialogService.openDialog(this.dialogComponentContainer, DIALOG_ERROR, error.message);
					} else {
						LOG.error(
							this.className,
							ENT_MSG_ADD_DIALOG_SEARCH_FAILED,
							error as Error
						);
						this.dialogService.showUnexpectedError(this.dialogComponentContainer);
					}
				}
			},
			[HISTORY_MSG_UNDO_CONFIRM, HISTORY_DIALOG_UNDO_BTN, DIALOG_BTN_CONFIRM]
		);
	}

	/**
	 * Handles the dialog closed event by emitting the closed event.
	 */
	protected onDialogClosed() {
		this.closed$.emit();
		this.visible = false;
	}

	/**
	 * Clears any dynamically attached nested dialog components from the container
	 * to prevent memory leaks when this dialog is destroyed.
	 */
	ngOnDestroy() {
		this.dialogComponentContainer?.clear();
	}
}
