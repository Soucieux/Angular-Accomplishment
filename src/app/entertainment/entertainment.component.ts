import { CommonModule, isPlatformBrowser, NgFor } from '@angular/common';
import { Component, ElementRef, HostListener, Inject, PLATFORM_ID, Renderer2 } from '@angular/core';
import { Database, ref as dbRef, get, listVal, ref, update } from '@angular/fire/database';
import { firstValueFrom, Observable, of, timer } from 'rxjs';
import { LOG } from '../log';
import { DoubanService } from '../douban/douban.service';
import { FirebaseStorageService } from '../firebaseStorage/firebase-storage.service';
import { MovieItem } from './movie.item';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
	selector: 'entertainment',
	standalone: true,
	imports: [NgFor, CommonModule, MatIconModule, MatButtonModule],
	templateUrl: './entertainment.component.html',
	styleUrl: './entertainment.component.css'
})
export class EntertainmentComponent {
	private readonly className = 'EntertainmentComponent';
	// This value has to be true initially so that the page will not show access denied page on refresh
	protected isLoggedIn: boolean = true;
	protected isSearching: boolean = false;
	private contentContainer!: any;
	private moviesRef!: any;
	protected movieList$: Observable<MovieItem[]> = of([]);

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		private elRef: ElementRef,
		private renderer: Renderer2,
		private db: Database,
		private doubanService: DoubanService,
		private firebaseStorageService: FirebaseStorageService
	) {
		// This line has to on the top as server is also using it to get a reference on movie list
		this.moviesRef = ref(this.db, 'movies');
		// Server has to access this line as well. Without it, movieList$ will be empty and this component will be destoryed immediately.
		// Only logged in user can access the movie list
		if (isPlatformBrowser(this.platformId) && this.isLoggedIn) {
			// Get the movie list (Observable) from firebase
			this.movieList$ = listVal<MovieItem>(this.moviesRef);
			// TODO: If the user is not logged in, and you set the read access on firebase to any,
			// then this line has to commented out as isLoggedIn will never be stored when the user is not logged in.
			// this.isLoggedIn = JSON.parse(localStorage.getItem('isLoggedIn') || 'null');
		} else {
			LOG.error(this.className, 'User does not have permission to access the movie list');
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
			this.contentContainer = this.elRef.nativeElement.getElementsByClassName('content-container')[0];
			this.updateGridLayout(this.contentContainer);
		}
	}

	/**
	 * Update the grid layout of the page container when the window is resized.
	 */
	@HostListener('window:resize')
	protected onResize() {
		if (isPlatformBrowser(this.platformId) && this.isLoggedIn) {
			this.updateGridLayout(this.contentContainer);
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
		this.isSearching = true;

		// Step 2: Loop through the movieList to get latest movie details
		for (const movieKey in movieListSnapshot.val()) {
			// If the search is cancelled, then break the loop.
			if (!this.isSearching) {
				LOG.warn(this.className, 'Search cancelled');
				break;
			}
			// Delay 2 seconds for every movie
			await firstValueFrom(timer(2000));
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
			const movieIdAlreadyExist = movieId ? true : false;
			const movieImageAlreadyExist = movieItem.coverImageLink ? true : false;
			!movieId && LOG.info(this.className, `Movie ID not found, start searching for it.`);
			// Step 3.1: If the movie ID is undefined in the database, then search for the movie ID first.
			if (
				!movieIdAlreadyExist &&
				!(movieId = await this.searchMovieId(movieItem.title, movieItem.year))
			) {
				//Step 3.2: If the result of searching movie ID is null, it means the server blocks the request
				//due to too many requests, then skip the current iteration.
				LOG.warn(this.className, `${movieItem.title} not found`);
				continue;
			}
			// Step 5: Either the movie ID exists in the database or the movie ID is retrieved from Douban API.
			try {
				LOG.info(this.className, `Movie ID found for ${movieItem.title}`);
				const [movieRate, coverImageLink, firstReleaseDate, episodeNumber] =
					await this.searchMovieData(movieId, movieItem.title, movieImageAlreadyExist);
				if (movieIdAlreadyExist) {
					await update(dbRef(this.db, `movies/${movieKey}`), {
						rate: movieRate,
						// TODO: This is needed in devlopment to store other info on existing movies
						firstReleaseDate: firstReleaseDate,
						episodeNumber: episodeNumber
					}).then(() => {
						LOG.info(this.className, `Movie rate for ${movieItem.title} has been updated`);
					});
				} else {
					await update(dbRef(this.db, `movies/${movieKey}`), {
						rate: movieRate,
						id: movieId,
						coverImageLink: coverImageLink,
						firstReleaseDate: firstReleaseDate,
						episodeNumber: episodeNumber
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
	 * Finally, get the movie rate, first release date, and total episode number.
	 *
	 * @param movieId - The ID of the movie to search for.
	 * @param movieName - The name of the movie to search for.
	 * @param movieImageAlreadyExist - Whether the movie image exists in firebase storage.
	 * @returns A Promise that resolves to the movie rate, first release date, and total episode number.
	 */
	private async searchMovieData(
		movieId: string,
		movieName: string,
		movieImageAlreadyExist: boolean
	): Promise<[string, string, string, string]> {
		try {
			// Step 6: Get the movie webpage as a string
			const movieWebpageAsString = await firstValueFrom(this.doubanService.searchMovieWebpage(movieId));

			// Step 7.1: Get the movie rate for the current movie
			const regexForMovieRate = new RegExp(
				'<strong class="ll rating_num" property="v:average">(.*?)</strong>',
				'i'
			);
			const movieRate = movieWebpageAsString.match(regexForMovieRate)[1];
			LOG.info(this.className, `Movie rate retrieved for ${movieName} is ${movieRate}`);

			// Step 7.2: Get the first release date for the current movie
			const regexForFirstReleaseDate = new RegExp(
				'<span class="pl">首播:</span> <span property="v:initialReleaseDate" content="(.*?)">(.*?)</span><br/>',
				'i'
			);
			let firstReleaseDate = movieWebpageAsString.match(regexForFirstReleaseDate)[1];
			firstReleaseDate = firstReleaseDate.substring(0, 10).replace(/-/g, '.');
			LOG.info(this.className, `First release date for ${movieName} is ${firstReleaseDate}`);

			// Step 7.3: Get the total episode number for the current movie
			const regexForEpisodeNumber = new RegExp('<span class="pl">集数:</span> (.*?)<br/>', 'i');
			const episodeNumber = movieWebpageAsString.match(regexForEpisodeNumber)[1];
			LOG.info(this.className, `Total episode number for ${movieName} is ${episodeNumber}`);

			// Step 8.1:Check if the movie cover already exists in firebase storage before searching
			let coverImageFirebaseLink = '';
			if (movieImageAlreadyExist) {
				LOG.warn(this.className, `Movie cover for ${movieName} already exists`);
			} else {
				// Step 8.2: If the movie cover does not exist, then retrieves movie cover ID from the movie webpage and then upload the movie cover
				const regexForCoverImageLink = new RegExp('<img class="media" src="(.*?)" />', 'i');
				const coverImageLink = movieWebpageAsString.match(regexForCoverImageLink)[1];
				coverImageFirebaseLink = await this.searchAndUpdateMovieCoverById(coverImageLink, movieName);
			}

			return [movieRate, coverImageFirebaseLink, firstReleaseDate, episodeNumber];
		} catch (error) {
			LOG.error(
				this.className,
				`Error while retrieving movie webpage for ${movieName}`,
				error as Error
			);
			throw error;
		}
	}

	/**
	 * Search for the movie ID from the Douban API with a given movie name.
	 * If the API responds with empty data, then it is due to too many requests.
	 * If the API responds with data, then extracts the movie ID from the JSON object.
	 *
	 * @param movieName - The name of the movie to search for.
	 * @param movieYear - The year of the movie to search for.
	 * @returns A Promise that resolves to the movie ID.
	 */
	private async searchMovieId(movieName: string, movieYear: number): Promise<string | null> {
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
				// Step 4.3: Loop through the extracted data to get the correct movie ID as the result is retrieved by regex
				for (const movie of extractedData) {
					// Movie name must be exactly the same
					if (movie.title === movieName && movie.year === movieYear) {
						return movie.id;
					}
				}
				return null;
			}
		} catch (error) {
			LOG.error(this.className, `Error while retrieving movie ID for ${movieName}`, error as Error);
			throw error;
		}
	}

	/**
	 * Get and upload the movie cover obtained to firebase storage.
	 *
	 * @param coverImageLink - The link of the movie cover to search for.
	 * @param movieName - The name of the movie to search for.
	 * @returns A Promise that resolves to the downloadable link of the movie cover.
	 */
	private async searchAndUpdateMovieCoverById(coverImageLink: string, movieName: string): Promise<string> {
		LOG.info(this.className, `${(this.platformId as string).toUpperCase()} is searching movie cover`);
		try {
			// Step 9: searchMovieCover returns a Promise and wait for the retrieval to complete
			const coverImage = await firstValueFrom(
				this.doubanService.searchMovieCover(coverImageLink, movieName)
			);
			LOG.info(this.className, `Movie cover retrieved for ${movieName}`);

			// Extract the movie cover ID from the movie cover link
			const coverImageId = coverImageLink.substring(coverImageLink.lastIndexOf('/') + 1);

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
			throw error;
		}
	}

	/**
	 * Cancel the search with a button click
	 */
	protected cancelSearch() {
		LOG.warn(this.className, 'Search cancel requested');
		this.isSearching = false;
	}

	/**
	 * Calculate the font size of the movie title.
	 *
	 * @param length - The length of the movie title.
	 * @returns A string that represents the font size.
	 */
	protected calculateFontSize(length: number) {
		if (this.isMobile()) {
			return length <= 8 ? '18px' : String(18 - (length - 8) * 2 + 'px');
		}
		return length <= 9 ? '20px' : String(20 - (length - 8.5) * 2 + 'px');
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
				document.getElementsByClassName('content-container')[0] as HTMLElement,
				'grid-template-columns',
				`repeat(${itemsPerRow}, minmax(${parseInt(itemsWidth)}px, 1fr))`
			);
		}
	}

	/**
	 * Note: This only works for iPhone 12 Pro or other devices with a width of 420px.
	 * Check if the current device is a mobile device.
	 *
	 * @returns A boolean value that indicates if the current device is a mobile device.
	 */
	private isMobile() {
		return window.innerWidth <= 420;
	}
}
