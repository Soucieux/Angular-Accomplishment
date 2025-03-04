import { CommonModule, isPlatformBrowser, isPlatformServer, NgFor, NgIf } from '@angular/common';
import {
	Component,
	ElementRef,
	HostListener,
	Inject,
	isDevMode,
	PLATFORM_ID,
	Renderer2
} from '@angular/core';
import { Database, ref as dbRef, get, listVal, ref, update } from '@angular/fire/database';
import { firstValueFrom, Observable, timer } from 'rxjs';
import { LOG } from '../log';
import { DoubanService } from './douban.service';
import { FirebaseStorageService } from './firebase.storage.service';
import { MovieItem } from './movie.item';
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
		private db: Database,
		private doubanService: DoubanService,
		private firebaseStorageService: FirebaseStorageService
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

	/**
	 * Search all movies in the database and update the movie details with a delay of 20 seconds for every 5 movies.
	 * If the movie ID does not exist, then search for the movie ID first and then update the movie rate and movie ID.
	 * If the movie ID already exists, then update the movie rate.
	 *
	 * @returns A Promise that resolves to void.
	 */
	private async searchAllMovies() {
		// Step 1: Get the movie list (one-time retrieval) from firebase
		let movieListSnapshot = await get(this.moviesRef);
		// Step 2: Loop through the movieList to get latest movie details
		// In development mode, only server is doing the work.
		if (isDevMode() && isPlatformServer(this.platformId)) {
			let countMovies = 0;
			for (const movieKey in movieListSnapshot.val()) {
				// Delay 20 seconds for every 5 movies
				countMovies++;
				if (countMovies % 5 == 0) {
					LOG.warn(this.className, 'Delay 20 seconds for every 5 movies');
					await firstValueFrom(timer(20000));
				}
				const movieItem = movieListSnapshot.val()[movieKey];
				//Step 3: Start searching for the specific movie
				LOG.info(this.className, `Start searching for ${movieItem.title}`);
				let movieId = movieItem.id;
				const movieIdAlreadyExist = movieItem.id ? true : false;
				!movieId && LOG.info(this.className, `Movie ID not found, start searching for it.`);
				// Step 3.1: If the movie ID is undefined in the database, then search for the movie ID first.
				if (!movieId && !(movieId = await this.searchMovieId(movieItem.title))) {
					//Step 3.2: If the result of searching movie ID is null, it means the server blocks the request
					//due to too many requests, then skip the current iteration.
					LOG.warn(this.className, `Skip movie rate search for ${movieItem.title}`);
					continue;
				}
				// Step 5: Either the movie ID exists in the database or the movie ID is retrieved from Douban API.
				try {
					LOG.info(this.className, `Movie ID found for ${movieItem.title}`);
					const movieRate = await this.searchMovieRateWithId(movieId, movieItem.title);
					if (movieIdAlreadyExist) {
						await update(dbRef(this.db, `movies/${movieKey}`), {
							rate: movieRate
						}).then(() => {
							LOG.info(this.className, `Movie rate for ${movieItem.title} has been updated`);
						});
					} else {
						await update(dbRef(this.db, `movies/${movieKey}`), {
							rate: movieRate,
							id: movieId
						}).then(() => {
							LOG.info(
								this.className,
								`Movie rate and movie ID for ${movieItem.title} have been updated`
							);
						});
					}
				} catch (error) {
					LOG.error(
						this.className,
						`Error while updating movie rate for ${movieItem.title}`,
						error as Error
					);
				}
			}
		}
	}

	/**
	 * Get the movie webpage from Douban API with given movie ID.
	 *
	 * @param movieId - The ID of the movie to search for.
	 * @param movieName - The name of the movie to search for.
	 * @returns A Promise that resolves to the movie rate as a string.
	 */
	private async searchMovieRateWithId(movieId: string, movieName: string): Promise<string> {
		// Step 6: Get the movie webpage as a string
		const movieWebpageAsString = await firstValueFrom(this.doubanService.searchMovie(movieId));

		// Step 7: Retrieves movie cover and then upload them to firebase storage
		const regexForCoverImage = new RegExp('<img class="media" src="(.*?)" />', 'i');
		const regexMatchForCoverImage = movieWebpageAsString.match(regexForCoverImage);
		const coverImageId = regexMatchForCoverImage[1].substring(
			regexMatchForCoverImage[1].lastIndexOf('/') + 1
		);
		await this.searchMovieCoverById(coverImageId, movieName);

		// Step 8: Get the movie rate for the current movie
		const regexForMovieId = new RegExp(
			'<strong class="ll rating_num" property="v:average">(.*?)</strong>',
			'i'
		);
		const movieRate = movieWebpageAsString.match(regexForMovieId)[1];
		LOG.info(this.className, `Movie rate for ${movieName} is ${movieRate}`);
		return movieRate;
	}

	/**
	 * Search for the movie ID from the Douban API.
	 * If the API responds with empty data, then it is due to too many requests.
	 * If the API responds with data, then extracts the movie ID from the JSON object.
	 *
	 * @param movieName - The name of the movie to search for.
	 * @returns A Promise that resolves to the movie ID.
	 */
	private async searchMovieId(movieName: string): Promise<string | null> {
		// Step 4: Search for the movie ID from the Douban API
		try {
			LOG.info(
				this.className,
				`${(this.platformId as string).toUpperCase()} is retrieving movie ID from API`
			);
			// Step 4: searchMovie returns a Promise and wait for the retrieval to complete
			const extractedData = await firstValueFrom(this.doubanService.searchMovieJSON(movieName));
			// Step 4.1: If empty data is received, it means the API is not responding due to too many requests.
			if (extractedData == null || extractedData.length === 0) {
				LOG.warn(this.className, 'API responded with empty data due to too many requests');
				return null;
			} else {
				// Step 4.2: If data is received, then extract the movie ID from the JSON object.
				LOG.info(
					this.className,
					`Movie ID retrieved for ${movieName} with ID ${extractedData[0]['id']}`
				);
				// TODO: Here is assuming the first element is the desired movie details.
				return extractedData[0]['id'];
			}
		} catch (error) {
			LOG.error(this.className, `Error while retrieving movie ID for ${movieName}`, error as Error);
			return null;
		}
	}

	/**
	 * Get and upload the movie cover obtained from Douban API to firebase storage.
	 *
	 * @param coverImageId - The ID of the movie cover to search for.
	 * @param movieName - The name of the movie to search for.
	 */
	private async searchMovieCoverById(coverImageId: string, movieName: string): Promise<void> {
		LOG.info(this.className, `${(this.platformId as string).toUpperCase()} is searching movie cover`);
		try {
			// Step 6: searchMovieCover returns a Promise and wait for the retrieval to complete
			const coverImage = await firstValueFrom(this.doubanService.searchMovieCover(coverImageId));
			LOG.info(this.className, `Movie cover retrieved for ${movieName}`);

			// Step 7: Uploads the movie cover to firebase storage
			await this.firebaseStorageService.uploadImageToFirebase(coverImageId, coverImage, movieName);
			LOG.info(this.className, `Movie cover uploaded for ${movieName}`);
		} catch (error) {
			LOG.error(this.className, `Error while processing movie cover for ${movieName}`, error as Error);
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
		const itemsWidth = getComputedStyle(pageContainer).getPropertyValue('--individual-item-width');
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
