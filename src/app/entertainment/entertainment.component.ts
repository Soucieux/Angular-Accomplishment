import { AuthService } from './../authentication/auth.service';
import { CommonModule, isPlatformBrowser, isPlatformServer, NgFor } from '@angular/common';
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
import { firstValueFrom, Observable, of, timer } from 'rxjs';
import { LOG } from '../log';
import { DoubanService } from '../douban/douban.service';
import { FirebaseStorageService } from '../firebaseStorage/firebase-storage.service';
import { MovieItem } from './movie.item';

@Component({
	selector: 'entertainment',
	standalone: true,
	imports: [NgFor, CommonModule],
	templateUrl: './entertainment.component.html',
	styleUrl: './entertainment.component.css'
})
export class EntertainmentComponent {
	private readonly className = 'EntertainmentComponent';
	// This value has to be true initially so that the page will not show access denied page on refresh
	protected isLoggedIn: boolean = true;
	private pageContainer!: any;
	private moviesRef!: any;
	protected movieList$: Observable<MovieItem[]> = of([]);

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		private elRef: ElementRef,
		private renderer: Renderer2,
		private db: Database,
		private doubanService: DoubanService,
		private firebaseStorageService: FirebaseStorageService,
		private authService: AuthService
	) {
		// This line has to on the top as server is also using it to get a reference on movie list
		this.moviesRef = ref(this.db, 'movies');
		// Server has to access this line as well. Without it, movieList$ will be empty and this component will be destoryed immediately.
		// Only logged in user can access the movie list
		if (this.isLoggedIn) {
			// Get the movie list (Observable) from firebase
			this.movieList$ = listVal<MovieItem>(this.moviesRef);
		} else {
			LOG.error(this.className, 'User does not have permission to access the movie list');
		}

		// Server has no access to local storage
		if (isPlatformBrowser(this.platformId)) {
			this.isLoggedIn = JSON.parse(localStorage.getItem('isLoggedIn') || 'null');
		}
	}

	/**
	 * Anything that needs to be done when the component is initialized.
	 */
	ngOnInit() {}

	/**
	 * Anything that needs to be done when the component is destroyed.
	 */
	ngOnDestroy() {
		LOG.info(this.className, 'Component destroyed');
	}

	/**
	 * Anything that needs to be done after the view is initialized.
	 */
	protected ngAfterViewInit() {
		//elRef is to get a collection, cannot modify the content directly.
		if (isPlatformBrowser(this.platformId) && this.isLoggedIn) {
			// Always put DOM manipulation in ngOnInit or ngAfterViewInit as it requires an element reference
			this.pageContainer = this.elRef.nativeElement.getElementsByClassName('page-container')[0];
			this.updateGridLayout(this.pageContainer);
		}
	}

	/**
	 * Update the grid layout of the page container when the window is resized.
	 */
	@HostListener('window:resize')
	protected onResize() {
		if (isPlatformBrowser(this.platformId) && this.isLoggedIn) {
			this.updateGridLayout(this.pageContainer);
		}
	}

	/**
	 * Only "Search All Movies" button can trigger this function.
	 *
	 * Search all movies in the database and update the movie details with a delay of 20 seconds for every 5 movies.
	 * If the movie ID does not exist, then search for the movie ID first and then update the movie rate and movie ID.
	 * If the movie ID already exists, then update the movie rate.
	 *
	 * @returns A Promise that resolves to void.
	 */
	protected async searchAllMovies() {
		// Step 1: Get the movie list (one-time retrieval) from firebase
		let movieListSnapshot = await get(this.moviesRef);

		// Step 2: Loop through the movieList to get latest movie details
		let countMovies = 0;
		for (const movieKey in movieListSnapshot.val()) {
			// TODO:Temporary solution to retrieve only the first movie
			if (countMovies == 1) break;
			// Delay 20 seconds for every 5 movies
			countMovies++;
			if (countMovies % 5 == 0) {
				LOG.warn(this.className, 'Delay 20 seconds for every 5 movies');
				await firstValueFrom(timer(20000));
			}
			const movieItem = movieListSnapshot.val()[movieKey];

			////////////////////////////////////////////////////////////////////////////////////
			// TODO: A temporary solution to update data in firebase database or to skip some movies
			// if (movieItem.coverImageLink) {
			// 	await update(dbRef(this.db, `movies/${movieKey}`), {
			// 		coverImageLink: movieItem.coverImageLink,
			// 	});
			// 	continue;
			// }
			////////////////////////////////////////////////////////////////////////////////////

			//Step 3: Start searching for the specific movie
			LOG.info(this.className, `Start searching for ${movieItem.title}`);
			let movieId = movieItem.id;
			const movieImageAlreadyExist = movieItem.coverImageLink ? true : false;
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
				const [movieRate, coverImageLink] = await this.searchMovieCoverAndMovieRate(
					movieId,
					movieItem.title,
					movieImageAlreadyExist
				);
				if (movieId) {
					await update(dbRef(this.db, `movies/${movieKey}`), {
						rate: movieRate
					}).then(() => {
						LOG.info(this.className, `Movie rate for ${movieItem.title} has been updated`);
					});
				} else {
					await update(dbRef(this.db, `movies/${movieKey}`), {
						rate: movieRate,
						id: movieId,
						coverImageLink: coverImageLink
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

	/**
	 * Get the movie webpage from Douban API with a given movie ID.
	 * Then, get the movie cover and upload it to firebase storage if not exists already.
	 * Finally, get the movie rate.
	 *
	 * @param movieId - The ID of the movie to search for.
	 * @param movieName - The name of the movie to search for.
	 * @param movieImageAlreadyExist - Whether the movie image exists in firebase storage.
	 * @returns A Promise that resolves to the movie rate and movie cover ID.
	 */
	private async searchMovieCoverAndMovieRate(
		movieId: string,
		movieName: string,
		movieImageAlreadyExist: boolean
	): Promise<[string, string]> {
		// Step 6: Get the movie webpage as a string
		const movieWebpageAsString = await firstValueFrom(this.doubanService.searchMovieWebpage(movieId));

		// Step 7: Get the movie rate for the current movie
		const regexForMovieId = new RegExp(
			'<strong class="ll rating_num" property="v:average">(.*?)</strong>',
			'i'
		);
		const movieRate = movieWebpageAsString.match(regexForMovieId)[1];
		LOG.info(this.className, `Movie rate retrieved for ${movieName} is ${movieRate}`);

		// Step 8.1:Check if the movie cover already exists in firebase storage before searching
		let coverImageLink = '';
		if (movieImageAlreadyExist) {
			LOG.warn(this.className, `Movie cover for ${movieName} already exists`);
		} else {
			// Step 8.2: If the movie cover does not exist, then retrieves movie cover ID from the movie webpage and then upload the movie cover
			const regexForCoverImage = new RegExp('<img class="media" src="(.*?)" />', 'i');
			const regexMatchForCoverImage = movieWebpageAsString.match(regexForCoverImage);
			const coverImageId = regexMatchForCoverImage[1].substring(
				regexMatchForCoverImage[1].lastIndexOf('/') + 1
			);
			coverImageLink = await this.searchAndUpdateMovieCoverById(coverImageId, movieName);
		}

		return [movieRate, coverImageLink];
	}

	/**
	 * Search for the movie ID from the Douban API with a given movie name.
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
	 * Get and upload the movie cover obtained to firebase storage.
	 *
	 * @param coverImageId - The ID of the movie cover to search for.
	 * @param movieName - The name of the movie to search for.
	 * @returns A Promise that resolves to the downloadable link of the movie cover.
	 */
	private async searchAndUpdateMovieCoverById(coverImageId: string, movieName: string): Promise<string> {
		LOG.info(this.className, `${(this.platformId as string).toUpperCase()} is searching movie cover`);
		try {
			// Step 9: searchMovieCover returns a Promise and wait for the retrieval to complete
			const coverImage = await firstValueFrom(this.doubanService.searchMovieCover(coverImageId));
			LOG.info(this.className, `Movie cover retrieved for ${movieName}`);

			// Step 10: Uploads the movie cover to firebase and get the downloadable link
			const downloadLink = await this.firebaseStorageService.uploadImageAndGetDownloadLink(
				coverImageId,
				coverImage,
				movieName
			);
			LOG.info(this.className, `Movie cover uploaded for ${movieName}`);
			return downloadLink;
		} catch (error) {
			LOG.error(this.className, `Error while processing movie cover for ${movieName}`, error as Error);
			return '';
		}
	}

	/**
	 * Calculate the font size of the movie title.
	 *
	 * @param length - The length of the movie title.
	 * @returns A string that represents the font size.
	 */
	protected calculateFontSize(length: number) {
		return length < 8 ? '20px' : String(20 - (length - 7) * 2 + 'px');
	}

	/**
	 * Update the grid layout of the page container.
	 *
	 * @param pageContainer - The page container to update the grid layout.
	 */
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
