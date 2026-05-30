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
import { ButtonModule } from 'primeng/button';
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
import { DIALOG_ERROR, MOVIE_GENRES } from '../../../common/app.constant';

interface AddMovieFormValue {
	movieName?: string;
	id?: string;
	years?: string;
	genres?: { genre: string };
}

@Component({
	selector: 'add-dialog',
	standalone: true,
	imports: [
		DialogModule,
		ButtonModule,
		AvatarModule,
		FormsModule,
		SelectModule,
		ProgressBarModule,
		CommonModule,
		Checkbox
	],
	templateUrl: './add.component.html',
	styleUrl: './add.component.scss',
	providers: []
})
export class AddDialogComponent implements OnInit, OnDestroy {
	private readonly className = 'AddDialogComponent';
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	@ViewChild('addMovieForm') private addMovieForm!: NgForm;
	@Output() closed$ = new EventEmitter<void>();
	private submitCallback?: (movie: MovieItemVO) => void;
	private searchCallback?: (movie: MovieItemVO) => Promise<Blob | null>;
	private movieItemVO: MovieItemVO = new MovieItemVO();
	protected visible: boolean = false;
	protected isLoading: boolean = false;
	protected canSubmit: boolean = false;
	protected years: { year: string }[] | undefined;
	protected genres: { genre: string }[] | undefined;
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
		this.genres = MOVIE_GENRES;
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
			// Two input strategies: if movieName is provided, search by name+year;
			// if id is provided instead, search by numeric Douban ID.
			if (newMovieData.movieName) {
				this.movieItemVO.setMovieName(newMovieData.movieName);
				this.movieItemVO.setMovieYear(Number(newMovieData.years));
			} else if (newMovieData.id) {
				this.movieItemVO.setMovieId(Number(newMovieData.id));
			}
			this.movieItemVO.setMovieGenre(newMovieData.genres?.genre ?? '');

			const movieImage = await this.searchCallback?.(this.movieItemVO);
			this.movieImageUrl = movieImage ? URL.createObjectURL(movieImage) : null;
			this.canSubmit = true;
		} catch (error) {
			// Each error type maps to a specific user-facing message;
			// the dialog is shown in-place (not thrown) because this is a search flow.
			if (error instanceof MovieIdNotFoundError || error instanceof MovieAlreadyExistsError) {
				this.dialogService.openDialog(this.dialogComponentContainer, DIALOG_ERROR, error.message);
			} else {
				LOG.error(this.className, 'Error while searching new movie from add dialog', error as Error);
				this.dialogService.showUnexpectedError(this.dialogComponentContainer);
			}
		} finally {
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
		if (value && value.trim() !== '') {
			this.addMovieForm.controls['movieName']?.reset();
			this.addMovieForm.controls['years']?.reset();
		}
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
		this.onDialogClosed();
		this.movieItemVO.setIsFavourite(this.isFavourite);
		this.submitCallback?.(this.movieItemVO);
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
