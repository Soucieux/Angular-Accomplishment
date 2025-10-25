import { Component, EventEmitter, inject, Output } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { NgIf } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
import { FormsModule, NgForm } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { MovieItemVO } from '../../entertainment/movie.item.vo';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

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
		NgIf,
		ConfirmDialogModule
	],
	templateUrl: './add.dialog.component.html',
	styleUrl: './add.dialog.component.scss',
	providers: [ConfirmationService]
})
export class AddDialogComponent {
	@Output() closed$ = new EventEmitter<void>();
	private messageService = inject(MessageService);
	private confirmationService = inject(ConfirmationService);
	private submitCallback?: () => void;
	private searchCallback?: (movie: MovieItemVO) => void;
	visible: boolean = false;
	isLoading: boolean = false;
	years: { year: number }[] | undefined;
	genres: { genre: string }[] | undefined;

	ngOnInit() {
		this.years = Array.from({ length: 8 }, (_, i) => ({ year: 2025 - i }));
		this.genres = [
			{ genre: '刑侦' },
			{ genre: '古装' },
			{ genre: '悬疑' },
			{ genre: '校园' },
			{ genre: '现代' },
			{ genre: '谍战' }
		];
	}

	openDialog(submitCallback?: () => void, searchCallback?: (movie: MovieItemVO) => void) {
		this.visible = true;
		this.submitCallback = submitCallback;
		this.searchCallback = searchCallback;
	}

	async searchCurrentMovie(newMovieData: NgForm['value']) {
		this.isLoading = true;
		try {
			const movieItemVO = new MovieItemVO(newMovieData.movieName, Number(newMovieData.years.year));
			movieItemVO.setMovieId(newMovieData.id);
			movieItemVO.setMovieGenre(newMovieData.genres.genre);
			await this.searchCallback?.(movieItemVO);
		} catch (error) {
			this.confirmationService.confirm({
				message: 'No Movie was found with given info',
				header: 'Error',
				icon: 'pi pi-times-circle text-red-500',
				rejectVisible: false,
				acceptButtonProps: {
					label: 'OK',
					severity: 'danger'
				},
				accept: () => {}
			});
		} finally {
			this.isLoading = false;
		}
	}

	onSubmit() {
		this.onDialogClosed();
		this.submitCallback?.();
		this.messageService.add({
			severity: 'info',
			summary: 'Movie added',
			detail: 'Movie added to the list'
		});
	}

	onDialogClosed() {
		this.closed$.emit();
		this.visible = false;
	}
}
