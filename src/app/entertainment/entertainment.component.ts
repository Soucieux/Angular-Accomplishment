import {
	Component,
	ElementRef,
	HostListener,
	PLATFORM_ID,
	Renderer2,
	Inject,
	isDevMode
} from '@angular/core';
import { MovieItem } from './movie.list';
import { isPlatformBrowser, isPlatformServer, NgFor, NgIf, CommonModule } from '@angular/common';
import { Database, listVal, ref as dbRef, update, ref, get } from '@angular/fire/database';
import { DoubanService } from './douban.service';
import { LOG } from '../log';
import { Observable, firstValueFrom, timer } from 'rxjs';
import { Storage, ref as storageRef, uploadBytesResumable } from '@angular/fire/storage';
@Component({
	selector: 'entertainment',
	standalone: true,
	imports: [NgFor, NgIf, CommonModule],
	templateUrl: './entertainment.component.html',
	styleUrl: './entertainment.component.css'
})
export class EntertainmentComponent {
	private readonly className = 'EntertainmentComponent';
	private pageContainer?: any;
	private moviesRef?: any;
	protected movieList$: Observable<MovieItem[]>;

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		private elRef: ElementRef,
		private renderer: Renderer2,
		private doubanService: DoubanService,
		private db: Database,
		private storage: Storage
	) {
		// Get the movie list (Observable) from firebase
		this.moviesRef = ref(this.db, 'movies');
		this.movieList$ = listVal(this.moviesRef);
	}

	ngOnInit() {
		//elRef is to get a collection, cannot modify the content directly.
		this.pageContainer = this.elRef.nativeElement.getElementsByClassName('page-container')[0];
		this.searchAllMovies();
	}

	private async searchAllMovies() {
		// Step 1: Get the movie list (one-time retrieval) from firebase
		let movieListSnapshot = await get(this.moviesRef);
		// Step 2: Loop through the movieList to get latest movie details
		let count = 0;
		if (isDevMode() && isPlatformServer(this.platformId)) {
			for (const movieKey in movieListSnapshot.val()) {
				// Delay 20 seconds for every 5 movies
				count++;
				if (count % 5 == 0) {
					LOG.warn(this.className, 'Delay 20 seconds for every 5 movies');
					await firstValueFrom(timer(20000));
				}
				const movie = movieListSnapshot.val()[movieKey];
				//Step 3: Searches for the specific movie and get the movie rate
				LOG.info(this.className, `Get movie details for ${movie.title}`);
				await this.searchMovie(movie.title).then((updatedMovieRate) => {
					// Step 10: Updates the movie rate to firebase if the movie rate is found
					updatedMovieRate === null
						? LOG.warn(this.className, `Movie rate for ${movie.title} is not found`)
						: update(dbRef(this.db, `movies/${movieKey}`), {
								rate: updatedMovieRate
						  })
								.then(() => {
									LOG.info(
										this.className,
										`Movie rate for ${movie.title} is updated to ${updatedMovieRate}`
									);
								})
								.catch((error) =>
									LOG.error(
										this.className,
										`Error while updating movie rate for ${movie.title}`,
										error as Error
									)
								);
				});
			}
		}
	}

	private async searchMovie(movieName: string): Promise<string | null> {
		try {
			LOG.info(
				this.className,
				`${(this.platformId as string).toUpperCase()} is retrieving data from API`
			);
			// Step 4: searchMovie returns a Promise and wait for the retrieval to complete
			const extractedData = await firstValueFrom(
				this.doubanService.searchMovieJSON(movieName)
			);
			if (extractedData == null || extractedData.length === 0) {
				LOG.warn(this.className, 'Data is either null or empty');
			} else {
				LOG.info(
					this.className,
					`Data received for ${movieName}. Extracting movie details.`
				);
				// Step 5: Extracts movie details
				const movieDetails = extractedData[0];
				let coverImageLink = movieDetails['img'].replace('\\', '');
				let coverImageId = coverImageLink.substring(coverImageLink.lastIndexOf('/') + 1);
				let movieId = movieDetails['id'];

				// Step 6: Retrieves movie cover and then upload them to firebase storage
				await this.searchMovieCover(coverImageId, movieName);
				return await this.searchMovieRate(movieId);
			}
			return null;
		} catch (error) {
			LOG.error(
				this.className,
				`Error while retrieving data for ${movieName}`,
				error as Error
			);
			return null;
		}
	}

	private async searchMovieRate(movieId: any) {
		const movieWebpageAsString = await firstValueFrom(this.doubanService.searchMovie(movieId));
		const regex = new RegExp(
			'<strong class="ll rating_num" property="v:average">(.*?)</strong>',
			'i'
		);
		const regexMatch = movieWebpageAsString.match(regex);
		// Step 9: Returns the movie rate
		return regexMatch[1];
	}

	private async searchMovieCover(coverImageId: string, movieName: string): Promise<void> {
		LOG.info(
			this.className,
			`${(this.platformId as string).toUpperCase()} is searching movie cover`
		);
		try {
			// Step 7: searchMovieCover returns a Promise and wait for the retrieval to complete
			const coverImage = await firstValueFrom(
				this.doubanService.searchMovieCover(coverImageId)
			);

			// Step 8: Uploads the movie cover to firebase storage
			const storageRefer = storageRef(this.storage, `/movies/${coverImageId}`);
			const uploadTask = uploadBytesResumable(storageRefer, coverImage);
			uploadTask.on(
				'state_changed',
				null,
				(error) => {
					LOG.error(
						this.className,
						`Error while uploading movie cover for ${movieName} to firebase`,
						error
					);
				},
				() => {
					LOG.info(this.className, `Image upload for ${movieName} has completed`);
				}
			);
		} catch (error) {
			LOG.error(
				this.className,
				`Error while retrieving movie cover for ${movieName}`,
				error as Error
			);
		}
	}

	@HostListener('window:resize')
	onResize() {
		this.updateGridLayout(this.pageContainer);
	}

	ngAfterViewInit() {
		if (isPlatformBrowser(this.platformId)) {
			this.updateGridLayout(this.pageContainer);
		}
	}

	protected calculateFontSize(length: number) {
		return length < 9 ? '20px' : String(20 - (length - 8) * 2 + 'px');
	}

	private updateGridLayout(pageContainer: any) {
		// Get item width from css
		const itemsWidth =
			getComputedStyle(pageContainer).getPropertyValue('--individual-item-width');
		const itemsGap = getComputedStyle(pageContainer).getPropertyValue('--individual-item-gap');

		if (pageContainer) {
			let componentWidth = (pageContainer as HTMLElement).clientWidth;
			let itemsPerRow = Math.floor(
				(componentWidth - parseInt(itemsGap)) / (parseInt(itemsWidth) + parseInt(itemsGap))
			);

			this.renderer.setStyle(
				//document is to directly get HTML DOM which can be modified directly
				document.getElementsByClassName('page-container')[0] as HTMLElement,
				'grid-template-columns',
				`repeat(${itemsPerRow}, minmax(${parseInt(itemsWidth)}px, 1fr))`
			);
		}
	}
}
