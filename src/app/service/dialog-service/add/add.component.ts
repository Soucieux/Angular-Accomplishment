import { Component, EventEmitter, inject, Output, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
import { FormsModule, NgForm } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { MovieItemVO } from '../../../entertainment/entertainment.movieitem.vo';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CommonModule } from '@angular/common';
import { MovieIdNotFoundError } from '../../../error/movie-id-not-found.error';
import { MovieAlreadyExistsError } from '../../../error/movie-already-exists-error';
import { LOG } from '../../../app.logs';
import { Utilities } from '../../../app.utilities';
import { Checkbox } from 'primeng/checkbox';

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
		ConfirmDialogModule,
		CommonModule,
		Checkbox
	],
	templateUrl: './add.component.html',
	styleUrl: './add.component.scss',
	providers: [ConfirmationService]
})
export class AddDialogComponent {
	private readonly className = 'AddDialogComponent';
	@ViewChild('addMovieForm') addMovieForm!: NgForm;
	@Output() closed$ = new EventEmitter<void>();
	private messageService = inject(MessageService);
	private confirmationService = inject(ConfirmationService);
	private submitCallback?: () => void;
	private searchCallback?: (movie: MovieItemVO) => Blob;
	visible: boolean = false;
    isLoading: boolean = false;
	canSubmit: boolean = false;
	years: { year: string }[] | undefined;
	genres: { genre: string }[] | undefined;
	isFavourite: boolean = false;
	movieImageUrl: string | null = null;

	constructor(private utilities: Utilities) {}

	protected ngOnInit() {
		this.years = Array.from({ length: 8 }, (_, i) => ({ year: (2025 - i).toString() }));
		this.genres = [
			{ genre: '刑侦' },
			{ genre: '古装' },
			{ genre: '悬疑' },
			{ genre: '校园' },
			{ genre: '现代' },
			{ genre: '谍战' }
		];
	}

	protected openDialog(submitCallback: () => void, searchCallback: (movie: MovieItemVO) => Blob) {
		this.visible = true;
		this.submitCallback = submitCallback;
		this.searchCallback = searchCallback;
	}

	protected async searchCurrentMovie(newMovieData: NgForm['value']) {
		this.isLoading = true;
		try {
			const movieItemVO = new MovieItemVO();
			if (newMovieData.movieName) {
				movieItemVO.setMovieName(newMovieData.movieName);
				movieItemVO.setMovieYear(Number(newMovieData.years));
			} else if (newMovieData.id) {
				movieItemVO.setMovieId(Number(newMovieData.id));
			}
			movieItemVO.setMovieGenre(newMovieData.genres.genre);
			movieItemVO.setIsFavourite(this.isFavourite);
			const movieImage = await this.searchCallback?.(movieItemVO);
			this.movieImageUrl = movieImage ? URL.createObjectURL(movieImage) : null;
			this.canSubmit = true;
		} catch (error) {
			let errorMessage = '';
			if (error instanceof MovieIdNotFoundError) {
				errorMessage = 'Movie ID not found\nPlease try again or enter manually';
			} else if (error instanceof MovieAlreadyExistsError) {
				errorMessage = 'Movie already exists';
			} else {
				errorMessage = 'Error while searching movie';
				LOG.error(this.className, 'Error while searching new movie from add dialog', error as Error);
			}
			this.confirmationService.confirm({
				message: `<div class="error-dialog-message">${errorMessage}</div>`,
				header: 'Error',
				icon: 'pi pi-times-circle text-red-500',
				rejectVisible: false,
				acceptButtonProps: {
					label: 'OK',
					severity: 'danger',
					...(this.utilities.isMobile()
						? {
								style: {
									width: '100px'
								}
						  }
						: {
								style: {
									width: '100px',
									'margin-right': '100px'
								}
						  })
				}
			});
		} finally {
			this.isLoading = false;
		}
	}

	protected onIdChange(value: string) {
		if (value && value.trim() !== '') {
			this.addMovieForm.controls['movieName']?.reset();
			this.addMovieForm.controls['years']?.reset();
        }
        this.canSubmit = false;
	}

	protected onNameAndYearChange() {
		this.canSubmit = false;
	}

	protected onSubmit() {
		this.onDialogClosed();
		this.submitCallback?.();
		this.messageService.add({
			severity: 'info',
			summary: 'Movie added',
			detail: 'Movie added to the list'
		});
	}

	protected onDialogClosed() {
		this.closed$.emit();
		this.visible = false;
	}
}
