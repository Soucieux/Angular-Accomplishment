import {
	ChangeDetectorRef,
	Component,
	EventEmitter,
	OnDestroy,
	OnInit,
	Output,
	ViewChild,
	ViewContainerRef
} from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
import { FormsModule, NgForm } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { MovieItemVO } from '../../../fontend/entertainment/movieItem.vo';
import { CommonModule } from '@angular/common';
import { MovieIdNotFoundError } from '../../../common/error/movie-id-not-found.error';
import { MovieAlreadyExistsError } from '../../../common/error/movie-already-exists-error';
import { LOG } from '../../../common/app.logs';
import { Checkbox } from 'primeng/checkbox';
import { DialogService } from '../dialog.service';
import {
	DIALOG_ERROR,
	ENT_MSG_ADD_DIALOG_SEARCH_FAILED
} from '../../../common/constants';
import {
	ENT_DIALOG_TITLE_ADD_MOVIE,
	ADD_MOVIE_SUBTITLE,
	ADD_MOVIE_LABEL_GENRE,
	genreLabel,
	ADD_MOVIE_LABEL_FAVOURITE,
	ADD_MOVIE_LABEL_NAME,
	ADD_MOVIE_LABEL_NAME_REQUIRED,
	ADD_MOVIE_LABEL_YEAR,
	ADD_MOVIE_LABEL_YEAR_REQUIRED,
	ADD_MOVIE_LABEL_ID,
	ADD_MOVIE_LABEL_ID_REQUIRED,
	ADD_MOVIE_BTN_SEARCH,
	ADD_MOVIE_BTN_SUBMIT,
	DIALOG_BTN_CANCEL
} from '../../../common/locale/locale-strings';
import { AddMovieFormValue } from './add-movie.model';
import { MOVIE_GENRES } from '../../../fontend/entertainment/entertainment.model';

@Component({
	selector: 'add-dialog',
	standalone: true,
	imports: [
		DialogModule,
		AvatarModule,
		FormsModule,
		SelectModule,
		ProgressBarModule,
		CommonModule,
		Checkbox
	],
	templateUrl: './add-movie.component.html',
	styleUrl: './add-movie.component.scss',
	providers: []
})
export class AddDialogComponent implements OnInit, OnDestroy {
	private readonly className = 'AddDialogComponent';
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	@ViewChild('addMovieForm') private addMovieForm!: NgForm;
	@Output() closed$ = new EventEmitter<void>();
	protected readonly ENT_DIALOG_TITLE_ADD_MOVIE = ENT_DIALOG_TITLE_ADD_MOVIE;
	protected readonly ADD_MOVIE_SUBTITLE = ADD_MOVIE_SUBTITLE;
	protected readonly ADD_MOVIE_LABEL_GENRE = ADD_MOVIE_LABEL_GENRE;
	protected readonly ADD_MOVIE_LABEL_FAVOURITE = ADD_MOVIE_LABEL_FAVOURITE;
	protected readonly ADD_MOVIE_LABEL_NAME = ADD_MOVIE_LABEL_NAME;
	protected readonly ADD_MOVIE_LABEL_NAME_REQUIRED = ADD_MOVIE_LABEL_NAME_REQUIRED;
	protected readonly ADD_MOVIE_LABEL_YEAR = ADD_MOVIE_LABEL_YEAR;
	protected readonly ADD_MOVIE_LABEL_YEAR_REQUIRED = ADD_MOVIE_LABEL_YEAR_REQUIRED;
	protected readonly ADD_MOVIE_LABEL_ID = ADD_MOVIE_LABEL_ID;
	protected readonly ADD_MOVIE_LABEL_ID_REQUIRED = ADD_MOVIE_LABEL_ID_REQUIRED;
	protected readonly ADD_MOVIE_BTN_SEARCH = ADD_MOVIE_BTN_SEARCH;
	protected readonly ADD_MOVIE_BTN_SUBMIT = ADD_MOVIE_BTN_SUBMIT;
	protected readonly DIALOG_BTN_CANCEL = DIALOG_BTN_CANCEL;
	private submitCallback?: (movie: MovieItemVO) => void;
	private searchCallback?: (movie: MovieItemVO) => Promise<Blob | null>;
	private movieItemVO: MovieItemVO = new MovieItemVO();
	protected visible: boolean = false;
	protected isLoading: boolean = false;
	protected canSubmit: boolean = false;
	protected years: { year: string }[] | undefined;
	protected genres: { genre: string; label: string }[] | undefined;
	protected isFavourite: boolean = false;
	protected movieImageUrl: string | null = null;

	constructor(
		private dialogService: DialogService,
		private cdr: ChangeDetectorRef
	) {}

	/**
	 * Initialises the year and genre selection dropdown options used in the add-movie form.
	 */
	ngOnInit() {
		const currentYear = new Date().getFullYear();
		this.years = Array.from({ length: 8 }, (_, i) => ({ year: (currentYear - i).toString() }));
		this.genres = MOVIE_GENRES.map((movieGenre) => ({
			genre: movieGenre.genre,
			label: genreLabel(movieGenre.genre)
		}));
	}

	/**
	 * Clears any dynamically attached dialog components from the container
	 * to prevent memory leaks when this dialog is destroyed.
	 */
	ngOnDestroy() {
		this.dialogComponentContainer?.clear();
	}

	/**
	 * Opens the add dialog and stores the submit and search callbacks.
	 *
	 * @param submitCallback - The callback to call when the form is submitted.
	 * @param searchCallback - The callback to call to search for a movie and return its cover image blob.
	 */
	public openDialog(
		submitCallback: (movie: MovieItemVO) => void,
		searchCallback: (movie: MovieItemVO) => Promise<Blob | null>
	) {
		this.visible = true;
		this.submitCallback = submitCallback;
		this.searchCallback = searchCallback;
	}

	/**
	 * Searches for the current movie using the form data, populates the movie
	 * item VO, and fetches the cover image via the search callback.
	 *
	 * @param newMovieData - The form values from the add movie form.
	 */
	protected async searchCurrentMovie(newMovieData: AddMovieFormValue) {
		this.isLoading = true;
		try {
			// Step 1: Populate the VO using whichever search strategy the user chose
			/* Two input strategies: if movieName is provided, search by name+year;
			   if id is provided instead, search by numeric Douban ID. */
			if (newMovieData.movieName) {
				this.movieItemVO.setMovieName(newMovieData.movieName);
				this.movieItemVO.setMovieYear(Number(newMovieData.years));
			} else if (newMovieData.id) {
				this.movieItemVO.setMovieId(Number(newMovieData.id));
			}
			this.movieItemVO.setMovieGenre(newMovieData.genres?.genre ?? '');

			// Step 2: Fetch the cover image and convert the blob to an object URL for display
			const movieImage = await this.searchCallback?.(this.movieItemVO);
			this.movieImageUrl = movieImage ? URL.createObjectURL(movieImage) : null;
			this.canSubmit = true;
		} catch (error: unknown) {
			// Step 3: Surface domain errors inline; unknown errors go to the unexpected-error dialog
			/* Each error type maps to a specific user-facing message;
			   the dialog is shown in-place (not thrown) because this is a search flow. */
			if (error instanceof MovieIdNotFoundError || error instanceof MovieAlreadyExistsError) {
				this.dialogService.openDialog(this.dialogComponentContainer, DIALOG_ERROR, error.message);
			} else {
				LOG.error(this.className, ENT_MSG_ADD_DIALOG_SEARCH_FAILED, error instanceof Error ? error : new Error(String(error)));
				this.dialogService.showUnexpectedError(this.dialogComponentContainer);
			}
		} finally {
			// Step 4: Always clear the loading flag and force CD — isLoading must clear even on error
			this.isLoading = false;
			this.cdr.detectChanges();
		}
	}

	/**
	 * Handles changes to the movie ID input field. Resets the name and year
	 * fields if a value is entered.
	 *
	 * @param value - The new value of the ID input.
	 */
	protected onIdChange(value: string) {
		// Step 1: Clear name+year fields when an ID is typed — the two strategies are mutually exclusive
		if (value && value.trim() !== '') {
			this.addMovieForm.controls['movieName']?.reset();
			this.addMovieForm.controls['years']?.reset();
		}

		// Step 2: Invalidate any previous search result so the user must re-search before submitting
		this.canSubmit = false;
	}

	/**
	 * Handles changes to the movie name or year input fields by resetting
	 * the submit state.
	 */
	protected onNameAndYearChange() {
		this.canSubmit = false;
	}

	/**
	 * Submits the add movie form, closes the dialog, and calls the submit
	 * callback with the populated movie item VO.
	 */
	protected onSubmit() {
		// Step 1: Close the dialog first so the UI hides immediately while the callback runs
		this.onDialogClosed();

		// Step 2: Stamp the favourite flag onto the VO and hand it to the caller
		this.movieItemVO.setIsFavourite(this.isFavourite);
		this.submitCallback?.(this.movieItemVO);

		// Step 3: Reset the VO so a re-opened dialog starts clean rather than carrying stale data
		this.movieItemVO = new MovieItemVO();
	}

	/**
	 * Handles the dialog closed event by emitting the closed event.
	 */
	protected onDialogClosed() {
		this.closed$.emit();
		this.visible = false;
	}
}
