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
	@ViewChild('addMovieForm') addMovieForm!: NgForm;
	@Output() closed$ = new EventEmitter<void>();
	private submitCallback?: (movie: MovieItemVO) => void;
	private searchCallback?: (movie: MovieItemVO) => Blob;
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
	public ngOnInit() {
		this.years = Array.from({ length: 8 }, (_, i) => ({ year: (2026 - i).toString() }));
		this.genres = [
			{ genre: '刑侦' },
			{ genre: '古装' },
			{ genre: '悬疑' },
			{ genre: '校园' },
			{ genre: '现代' },
			{ genre: '谍战' }
		];
	}

	/**
	 * Clears any dynamically attached dialog components from the container
	 * to prevent memory leaks when this dialog is destroyed.
	 */
	public ngOnDestroy() {
		this.dialogComponentContainer?.clear();
	}

	/**
	 * Open the add dialog and store the submit and search callbacks.
	 *
	 * @param submitCallback - The callback to call when the form is submitted.
	 * @param searchCallback - The callback to call to search for a movie and return its cover image blob.
	 */
	public openDialog(
		submitCallback: (movie: MovieItemVO) => void,
		searchCallback: (movie: MovieItemVO) => Blob
	) {
		this.visible = true;
		this.submitCallback = submitCallback;
		this.searchCallback = searchCallback;
	}

	/**
	 * Search for the current movie using the form data, populate the movie
	 * item VO, and fetch the cover image via the search callback.
	 *
	 * @param newMovieData - The form values from the add movie form.
	 */
	protected async searchCurrentMovie(newMovieData: NgForm['value']) {
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
			this.movieItemVO.setMovieGenre(newMovieData.genres.genre);

			const movieImage = await this.searchCallback?.(this.movieItemVO);
			this.movieImageUrl = movieImage ? URL.createObjectURL(movieImage) : null;
			this.canSubmit = true;
		} catch (error) {
			// Each error type maps to a specific user-facing message;
			// the dialog is shown in-place (not thrown) because this is a search flow.
			if (error instanceof MovieIdNotFoundError || error instanceof MovieAlreadyExistsError) {
				this.dialogService.openDialog(this.dialogComponentContainer, 'error', error.message);
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
	 * Handle changes to the movie ID input field. Resets the name and year
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
	 * Handle changes to the movie name or year input fields by resetting
	 * the submit state.
	 */
	protected onNameAndYearChange() {
		this.canSubmit = false;
	}

	/**
	 * Submit the add movie form, close the dialog, and call the submit
	 * callback with the populated movie item VO.
	 */
	protected onSubmit() {
		this.onDialogClosed();
		this.movieItemVO.setIsFavourite(this.isFavourite);
		this.submitCallback?.(this.movieItemVO);
		this.movieItemVO = new MovieItemVO();
	}

	/**
	 * Handle the dialog closed event by emitting the closed event.
	 */
	protected onDialogClosed() {
		this.closed$.emit();
		this.visible = false;
	}
}
