import { SearchStreamService } from '../../backend/dialog-service/search/search-stream.service';
import { Utilities } from '../../common/app.utilities';
import {
	COMPONENT_DESTROY,
	RATE_DECREASED,
	RATE_INCREASED,
	SEARCH_CANCEL,
	SEARCH_COMPELTE,
	NO_RATE,
	GENRE_FAVOURITE,
	SEARCH,
	ERROR_PERMISSION_DENIED,
	MOVIE_GENRES
} from '../../common/app.constant';
import { MovieIdNotFoundError } from '../../common/error/movie-id-not-found.error';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
	Component,
	ElementRef,
	HostListener,
	Inject,
	PLATFORM_ID,
	Renderer2,
	ViewChild,
	ViewContainerRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Observable, timer, BehaviorSubject, combineLatest, map, take } from 'rxjs';
import { LOG } from '../../common/app.logs';
import { DoubanService } from '../../backend/douban-service/douban.service';
import { MovieItemVO } from '../../common/movieitem.vo';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { MovieAlreadyExistsError } from '../../common/error/movie-already-exists-error';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatabaseService } from '../../backend/database-service/database.service';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { MovieFetchFailedError } from '../../common/error/movie-fetch-failed-error';
@Component({
	selector: 'entertainment',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		MatIconModule,
		MatButtonModule,
		MatButtonToggleModule,
		MatRippleModule,
		MatTooltipModule,
		ButtonModule,
		SelectModule
	],
	templateUrl: './entertainment.component.html',
	styleUrl: './entertainment.component.css'
})
export class EntertainmentComponent {
	private readonly className = 'EntertainmentComponent';
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	protected readonly NO_RATE = NO_RATE;
	protected readonly GENRE_FAVOURITE = GENRE_FAVOURITE;
	protected isSearching: boolean = false;
	private sessionId: number = 0;
	protected movieList$!: Observable<MovieItemVO[]>;
	protected selectedGenres$ = new BehaviorSubject<string>('');
	protected searchQuery$ = new BehaviorSubject<string>('');
	protected searchText: string = '';
	protected filteredMovieList$!: Observable<MovieItemVO[]>;
	protected statistics$!: Observable<any>;
	private searchSummary!: Map<string, string[]>;
	protected editedItems = new Map<string, { original: string; genre: string }>();
	protected genres = MOVIE_GENRES;
	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		private elRef: ElementRef<HTMLElement>,
		private renderer: Renderer2,
		private doubanService: DoubanService,
		private databaseService: DatabaseService,
		private dialogService: DialogService,
		protected utilities: Utilities,
		private searchStreamService: SearchStreamService
	) {}

	/**
	 * Anything that needs to be done when the component is initialized.
	 */
	async ngOnInit() {
		// Server has to access this line as well. Without it, movieList$ will be empty and this component will be destoryed immediately.
		// Only logged in user can access the movie list
		if (isPlatformBrowser(this.platformId)) {
			// Get the movie list (Observable) and statistics (Observable) from firebase or cloudbase
			this.statistics$ = this.databaseService.getStatistics();

			// One-time pre-check to make sure user have permission to read data in the database
			await firstValueFrom(this.statistics$.pipe(take(1)));
			// Below part will be executed only if there is no error reading data in the database
			this.movieList$ = this.databaseService.getMovieList();

			// Create a filter that reacts to genre selection and text search simultaneously
			this.filteredMovieList$ = combineLatest([
				this.movieList$,
				this.selectedGenres$,
				this.searchQuery$
			]).pipe(
				map(([movieList, selectedGenres, searchQuery]) => {
					let filtered = movieList;

					// Genre filter
					if (selectedGenres === GENRE_FAVOURITE) {
						filtered = filtered.filter((movie) => movie.getIsFavourite());
					} else if (selectedGenres !== '') {
						filtered = filtered.filter((movie) => movie.getMovieGenre().includes(selectedGenres));
					}

					// Text search filter
					const query = searchQuery.trim();
					if (query !== '') {
						filtered = filtered.filter((movie) => movie.getMovieName().includes(query));
					}

					return filtered;
				})
			);

			if (isPlatformBrowser(this.platformId)) {
				this.updateGridLayout();
			}
		}
	}

	/**
	 * Anything that needs to be done when the component is destroyed.

	ngOnDestroy() {
			this.selectedGenres$.complete();
			this.searchQuery$.complete();
			this.dialogComponentContainer?.clear();
			this.isSearching = false;
			LOG.info(this.className, COMPONENT_DESTROY);
	}

	/**
	 * Handles the window resize event by recalculating the CSS grid layout
	 * so that the content container always displays the optimal number of columns.
	 */
	@HostListener('window:resize')
	protected onResize() {
		if (isPlatformBrowser(this.platformId)) {
			this.updateGridLayout();
		}
	}

	/**
	 * Iterates through every movie in the currently filtered movie list, fetches
	 * the latest rating for each from the Douban API with a delay between requests,
	 * and updates the database with any changed ratings. Tracks which movies had
	 * their ratings increase or decrease and logs a summary when complete.
	 *
	 * Only the "Search" button triggers this function. The process can be cancelled
	 * mid-flight by calling cancelSearch, which sets isSearching to false.
	 */
	protected async updateAllMoviesRate() {
		// Step 1: Get the movie list (one-time retrieval) from current movieList$
		let movieListVOs = await firstValueFrom(this.filteredMovieList$);
		await this.databaseService.updateHistoryWithNewSearchActivity();

		// Initialize required data
		this.isSearching = true;
		this.searchSummary = new Map<string, string[]>([
			[RATE_INCREASED, []],
			[RATE_DECREASED, []]
		]);
		const rateIncreasedArray = this.searchSummary.get(RATE_INCREASED);
		const rateDecreasedArray = this.searchSummary.get(RATE_DECREASED);
		const currentSessionId: number = ++this.sessionId;
		let searchCount = 0;

		// Step 2: Loop through the movieList to get latest movie details
		for (let movieItemVO of movieListVOs) {
			this.searchStreamService.addSearchLog(`Start searching for ${movieItemVO.getMovieName()}`);
			movieItemVO.setSessionId(currentSessionId);

			try {
				// Step 3: Delay 2 seconds for every movie
				await firstValueFrom(timer(2000));

				// Step 4: Get movie rate
				await this.getMovieRateOnly(movieItemVO);

				// Step 5: Update movie rate
				if (currentSessionId === this.sessionId && this.isSearching) {
					await this.databaseService.updateMovieRate(movieItemVO);
				}

				// If the search is cancelled, then break the loop.
				if (currentSessionId !== this.sessionId || !this.isSearching) {
					break;
				}
				// Otherwise, save movie name to corresponding array if movie rate changes.
				else {
					const rateChange = this.searchStreamService.checkLastLogDecreasedOrIncreased();
					if (rateChange === RATE_DECREASED) {
						rateDecreasedArray?.push(movieItemVO.getMovieName());
					} else if (rateChange === RATE_INCREASED) {
						rateIncreasedArray?.push(movieItemVO.getMovieName());
					}
				}
				searchCount++;
			} catch (error) {
				if (error instanceof Error && error.message === ERROR_PERMISSION_DENIED) {
					this.openPermissionErrorDialog();
				} else {
					this.openUnexpectedErrorDialog();
					LOG.error(
						this.className,
						`Error while updating movie rate for ${movieItemVO.getMovieName()}`
					);
				}
			}
		}

		// Prevent race condition
		if (currentSessionId === this.sessionId) {
			if (this.isSearching) this.searchStreamService.addSearchLog(SEARCH_COMPELTE);
			else {
				this.searchStreamService.addSearchLog(SEARCH_CANCEL);
			}
			// Summary
			const rateIncreaseLength = rateIncreasedArray?.length ?? 0;
			const rateDecreaseLength = rateDecreasedArray?.length ?? 0;
			let summary = `---------------------------------\n📊 Search Summary (${searchCount})\n`;
			summary += `⬆ Rate Increased (${rateIncreaseLength}): `;
			if ((rateIncreasedArray?.length ?? 0) > 0) {
				summary += rateIncreasedArray?.join(', ');
				summary += '.\n';
			} else {
				summary += 'None\n';
			}
			summary += `⬇ Rate Decreased (${rateDecreaseLength}): `;
			if ((rateDecreasedArray?.length ?? 0) > 0) {
				summary += rateDecreasedArray?.join(', ');
				summary += '.\n';
			} else {
				summary += 'None\n';
			}
			this.searchStreamService.addSearchLog(summary);
		}
	}

	/**
	 * Retrieves only the latest rating for a given movie from the Douban API
	 * without fetching any additional metadata (release date, episodes, cover image, etc.).
	 *
	 * Only proceeds if the search is still active and no concurrent session has started.
	 *
	 * @param movieItemVO - The movie item whose rate should be updated.
	 */
	private async getMovieRateOnly(movieItemVO: MovieItemVO) {
		// Latest rate can be retrieved only if the searching is still executing and there is no concurrent processes
		if (this.isSearching && movieItemVO.getSessionId() === this.sessionId) {
			await this.getMovieData(movieItemVO, false, false);
		}
	}

	/**
	 * Retrieves the latest rating, first release date, total episode count,
	 * and cover image for a movie from the Douban API. Uses the movie's existing
	 * name and year to locate the correct Douban page, but does not overwrite
	 * the name or year on the movie item.
	 *
	 * @param movieItemVO - The movie item to populate with retrieved data.
	 */
	private async getNewMovieDataGivenYearAndTitle(movieItemVO: MovieItemVO) {
		await this.getMovieData(movieItemVO, true, false);
	}

	/**
	 * Retrieves full movie data (rating, release date, episode count, cover image,
	 * name, and year) from the Douban API using the movie's existing ID. Also
	 * overwrites the movie name and year with the values returned by the API.
	 *
	 * @param movieItemVO - The movie item to populate with retrieved data.
	 */
	private async getNewMovieDataGivenMovieId(movieItemVO: MovieItemVO) {
		await this.getMovieData(movieItemVO, true, true);
	}

	/**
	 * Calls the Douban third-party API to retrieve movie data. If that fails or
	 * returns no data, falls back to scraping the Douban movie webpage directly.
	 *
	 * @param movieId - The Douban movie ID to look up.
	 * @returns An object containing the movie data (movieWebpageAsData) and a flag
	 *          (thirdPartyApi) indicating whether the data came from the third-party API.
	 */
	private async invokeRetrieveMovieApi(movieId: number) {
		let movieData = null;
		let movieDataWebpage = null;

		try {
			// Try the third-party API first; if it returns nothing (rate-limited or down),
			// fall back to parsing the Douban webpage HTML directly. The webpage parse
			// is more brittle but works when the API is unavailable.
			movieData = await firstValueFrom(this.doubanService.searchMovieByThirdPartyApi(movieId));
			if (!movieData) {
				movieDataWebpage = await firstValueFrom(this.doubanService.searchMovieByWebpage(movieId));
				return { movieWebpageAsData: movieDataWebpage, thirdPartyApi: false };
			}
			movieData = JSON.parse(movieData);
			return { movieWebpageAsData: movieData, thirdPartyApi: true };
		} catch (error) {
			throw new MovieFetchFailedError(movieId);
		}
	}

	/**
	 * Core data retrieval method. Fetches the movie webpage or API response from
	 * Douban for the given movie, extracts the rating, and optionally extracts
	 * additional metadata (release date, episode count, cover image, actors,
	 * description, year, and title) based on the provided flags.
	 *
	 * @param movieItemVO - The movie item to populate with retrieved data.
	 * @param retrieveOtherData - If true, also retrieves release date, episode count,
	 *                            cover image, actors, and description.
	 * @param retrieveYearAndTitle - If true, also retrieves and overwrites the movie's
	 *                               year and title.
	 */
	private async getMovieData(
		movieItemVO: MovieItemVO,
		retrieveOtherData: boolean,
		retrieveYearAndTitle: boolean
	) {
		try {
			// Step 1: Get the movie webpage as text
			const { movieWebpageAsData, thirdPartyApi } = await this.invokeRetrieveMovieApi(
				movieItemVO.getMovieId()
			);

			// Step 2: Get the latest movie rate for the current movie
			if (thirdPartyApi) {
				movieItemVO.setMovieRate(movieWebpageAsData['doubanRating']);
			} else {
				const regexForMovieRate = new RegExp(
					'<strong class="ll rating_num" property="v:average">(.*?)</strong>',
					'i'
				);
				const movieRate = movieWebpageAsData.match(regexForMovieRate)?.[1];
				movieItemVO.setMovieRate(movieRate);
			}

			// Step 3: Retrieve other data if the flag is true
			if (retrieveOtherData) {
				// Step 4: Get the first release date for the current movie
				let firstReleaseDate = '';
				if (thirdPartyApi) {
					firstReleaseDate = movieWebpageAsData['dateReleased'];
				} else {
					const regexForFirstReleaseDate = new RegExp(
						'<span class="pl">首播:</span> <span property="v:initialReleaseDate" content="(.*?)">(.*?)</span><br/>',
						'i'
					);
					firstReleaseDate = movieWebpageAsData.match(regexForFirstReleaseDate)?.[1];
				}

				firstReleaseDate = firstReleaseDate.substring(0, 10).replace(/-/g, '.');
				movieItemVO.setMovieFirstReleaseDate(firstReleaseDate);
				LOG.info(
					this.className,
					`First release date for ${movieItemVO.getMovieName()} is ${firstReleaseDate}`
				);

				// Step 4.1: Retrieve year and title if the flag is true
				if (retrieveYearAndTitle) {
					let title = '';
					let year = '';
					if (thirdPartyApi) {
						title = movieWebpageAsData['originalName'];
						year = movieWebpageAsData['year'];
					} else {
						year = firstReleaseDate.substring(0, 4);

						const regexForTitle = new RegExp('<meta property="og:title" content="(.*?)" />', 'i');
						title = movieWebpageAsData.match(regexForTitle)?.[1];
					}

					movieItemVO.setMovieYear(Number(year));
					movieItemVO.setMovieName(title);
				}

				// Step 5: Get the total episode number for the current movie
				let episodeNumber = 0;
				if (thirdPartyApi) {
					episodeNumber = movieWebpageAsData['episodes'];
				} else {
					const regexForEpisodeNumber = new RegExp('<span class="pl">集数:</span> (.*?)<br/>', 'i');
					episodeNumber = movieWebpageAsData.match(regexForEpisodeNumber)?.[1];
				}

				movieItemVO.setMovieEpisodeNumber(episodeNumber);
				LOG.info(
					this.className,
					`Total episode number for ${movieItemVO.getMovieName()} is ${episodeNumber}`
				);

				// Step 6: Get movie actors and movie description
				if (thirdPartyApi) {
					movieItemVO.setDescription(movieWebpageAsData['data'][0]['description']);
					let actors = movieWebpageAsData['actor'];

					const allActors = actors
						.map((actor: any) => actor.data.find((d: any) => d.lang === 'Cn')?.name)
						.filter(Boolean);

					const actorRetrieved =
						allActors.length > 10
							? allActors.slice(0, 10).join(', ') + ' 等'
							: allActors.join(', ');

					movieItemVO.setActors(actorRetrieved);
				}

				// Step 7: Get the movie cover for the current movie and upload it to firebase storage
				let movieCoverImageLink;

				if (thirdPartyApi) {
					movieCoverImageLink = movieWebpageAsData['data'][0]['poster'];
				} else {
					const regexForCoverImageLink = new RegExp('<img class="media" src="(.*?)" />', 'i');
					movieCoverImageLink = movieWebpageAsData.match(regexForCoverImageLink)?.[1];
				}
				await this.getMovieCoverImageByLink(movieCoverImageLink, movieItemVO);
			}
		} catch (error) {
			if (error instanceof MovieFetchFailedError) {
				this.dialogService.openDialog(this.dialogComponentContainer, 'error', error.message);
			}
			LOG.error(
				this.className,
				`Error while retrieving movie webpage for movie ${movieItemVO.getMovieName()}`,
				error as Error
			);
			throw error;
		}
	}

	/**
	 * Searches the Douban API for a movie ID matching the given movie's name and year.
	 * If the API returns empty data (usually due to rate limiting), a MovieIdNotFoundError
	 * is thrown. If data is returned, iterates through results to find an exact match
	 * on both title and year, then sets the movie ID on the provided movie item.
	 *
	 * @param movieItemVO - The movie item whose name and year are used to look up
	 *                      the Douban ID. The ID is set directly on this object on success.
	 * @throws MovieIdNotFoundError if the API returns no data or no matching movie is found.
	 */
	private async getMovieId(movieItemVO: MovieItemVO) {
		Utilities.checkMovieItemVO(movieItemVO);
		// Step 1: searchMovie returns a Promise and wait for the retrieval to complete
		const extractedData = await firstValueFrom(
			this.doubanService.searchMovieJSON(movieItemVO.getMovieName())
		);
		// Step 2: If empty data is received, it means the API is not responding due to too many requests.
		if (extractedData == null || extractedData.length === 0) {
			LOG.warn(this.className, 'API responded with empty data due to too many requests');
			// throw the error to let the calling method knows that the movie ID cannot be retrieved at this time.
			throw new MovieIdNotFoundError(movieItemVO.getMovieName());
		} else {
			// Step 2: If data is received, then loop through the extracted data to get the correct movie ID
			// as the result is retrieved by regex.
			for (const movieData of extractedData) {
				//This means that NEW movie must have title and year
				// Movie name and year must be exactly the same
				if (
					movieData.title === movieItemVO.getMovieName() &&
					movieData.year == movieItemVO.getMovieYear()
				) {
					// Step 3: Set the movie ID to the movie item VO
					movieItemVO.setMovieId(movieData.id);
					LOG.info(
						this.className,
						`Movie ID retrieved for ${movieItemVO.getMovieName()} with ID ${movieData.id}`
					);
					return;
				}
			}
			// throw the error to let the calling method knows that no matching movie ID has been found.
			LOG.warn(
				this.className,
				`Movie ID not found for ${movieItemVO.getMovieName()}. Possible wrong name and year combination.`
			);
			throw new MovieIdNotFoundError(movieItemVO.getMovieName());
		}
	}

	/**
	 * Downloads the movie cover image from the given Douban URL and stores the
	 * resulting Blob on the provided movie item. The image is not yet uploaded
	 * to storage at this stage -- that happens separately via
	 * uploadMovieImageAndGetDownloadableLink.
	 *
	 * @param movieCoverImageLink - The URL of the cover image on Douban's servers.
	 * @param movieItemVO - The movie item on which to store the downloaded cover image.
	 */
	private async getMovieCoverImageByLink(movieCoverImageLink: string, movieItemVO: MovieItemVO) {
		LOG.info(this.className, `${(this.platformId as string).toUpperCase()} is searching movie cover`);
		try {
			// searchMovieCover returns a Promise and we wait for the retrieval to complete
			const movieCoverImage = await firstValueFrom(
				this.doubanService.searchMovieCover(movieCoverImageLink, movieItemVO.getMovieName())
			);
			movieItemVO.setMovieCoverImage(movieCoverImage);
			LOG.info(this.className, `Movie cover retrieved for ${movieItemVO.getMovieName()}`);
		} catch (error) {
			LOG.error(
				this.className,
				`Error while retrieving movie cover for ${movieItemVO.getMovieName()} from Douban`,
				error as Error
			);
			throw error;
		}
	}

	/**
	 * Uploads the movie cover image (stored as a Blob on the movie item) to
	 * cloud storage and sets the resulting downloadable URL back on the movie item.
	 *
	 * @param movieItemVO - The movie item containing the cover image blob to upload.
	 *                      The downloadable link is set on this object on success.
	 */
	private async uploadMovieImageAndGetDownloadableLink(movieItemVO: MovieItemVO) {
		try {
			// Upload the cover image Blob to cloud storage, then get the resultant
			// downloadable URL. These are separate operations in Firebase/CloudBase.
			const downloadableLink = await this.databaseService.uploadImageAndGetDownloadLink(
				movieItemVO.getMovieCoverImage(),
				movieItemVO.getMovieName()
			);
			movieItemVO.setMovieCoverImageDownloadableLink(downloadableLink);
			LOG.info(this.className, `Movie cover uploaded for ${movieItemVO.getMovieName()}`);
		} catch (error) {
			LOG.error(
				this.className,
				`Error while uploading image to firebase or getting download link for ${movieItemVO.getMovieName()}`,
				error as Error
			);
			throw error;
		}
	}

	//////////////////////Below are Utilities Functions used by HTML template///////////////////////
	/**
	 * Calculates a responsive font size for displaying a movie name, shrinking the
	 * text as the name gets longer to prevent overflow. Uses different base sizes
	 * for mobile and desktop viewports.
	 *
	 * @param length - The character length of the movie name.
	 * @returns A CSS font-size string (e.g., "18px").
	 */
	protected calculateFontSize(length: number) {
		if (this.utilities.isMobile()) {
			return length <= 8 ? '18px' : String(18 - (length - 8) * 2 + 'px');
		}
		return length <= 9 ? '20px' : String(20 - (length - 8.5) * 2 + 'px');
	}

	/**
	 * Recalculates the CSS grid column count for the content container based on
	 * the current container width and the item dimensions defined in CSS custom
	 * properties (--individual-item-width and --individual-item-gap). Ensures
	 * the grid always fits as many columns as possible without overflow.
	 */
	private updateGridLayout() {
		// Get item width and item gap from css
		const host = this.elRef.nativeElement;
		const itemsWidth = getComputedStyle(host).getPropertyValue('--individual-item-width').trim();
		const itemsGap = getComputedStyle(host).getPropertyValue('--individual-item-gap').trim();

		const contentContainer = host.querySelector('.content-container');
		if (contentContainer) {
			let componentWidth = contentContainer.clientWidth;
			let itemsPerRow = Math.floor(
				(componentWidth - parseInt(itemsGap)) / (parseInt(itemsWidth) + parseInt(itemsGap))
			);
			this.renderer.setStyle(
				contentContainer,
				'grid-template-columns',
				`repeat(${itemsPerRow}, minmax(${parseInt(itemsWidth)}px, 1fr))`
			);
		}
	}

	/**
	 * Pushes the current search input text into the searchQuery$ stream, which
	 * triggers a re-filter of the filteredMovieList$ observable to only show
	 * movies whose name contains the search text.
	 *
	 * @param value - The current text value from the search input field.
	 */
	protected updateSearchQuery(value: string) {
		this.searchQuery$.next(value);
	}

	//////////////////////Below are Event Handlers triggered by user actions///////////////////////
	/**
	 * Toggles the genre filter. If the given genre is already selected, it deselects
	 * it (showing all movies). Otherwise, it selects the given genre, filtering the
	 * movie list to only show movies matching that genre.
	 *
	 * @param genre - The genre to toggle as the active filter.
	 */
	public filterByGenre(genre: string) {
		const currentGenre = this.selectedGenres$.getValue();
		this.selectedGenres$.next(currentGenre === genre ? '' : genre);
	}

	/**
	 * Opens the search progress dialog and starts the process of updating all
	 * movie ratings by fetching the latest data from the Douban API for every
	 * movie currently visible in the filtered list.
	 */
	protected openSearchDialog() {
		this.dialogService.openDialog(this.dialogComponentContainer, SEARCH, this.cancelSearch.bind(this));
		this.updateAllMoviesRate();
	}

	/**
	 * Cancels an ongoing search by setting the isSearching flag to false.
	 * This causes the search loop in updateAllMoviesRate to stop at the next
	 * iteration and prevents any further movie data from being fetched.
	 */
	private cancelSearch() {
		this.searchStreamService.addSearchLog('Search cancel requested');
		this.isSearching = false;
	}

	/**
	 * Opens a confirmation dialog asking the user to confirm deletion of the
	 * specified movie. If confirmed, the movie is removed from the database.
	 *
	 * @param movieItemVO - The movie item to be deleted upon confirmation.
	 */
	protected openDeleteConfirmationDialog(movieItemVO: MovieItemVO) {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			'confirm',
			() => {
				this.databaseService.removeMovieFromDatabase(movieItemVO);
			},
			[`Are you sure you want to delete ${movieItemVO.getMovieName()}?`, 'Delete Movie', 'Delete']
		);
	}

	/**
	 * Opens the "Add New Movie" dialog. The dialog provides two actions:
	 * "Search" which looks up the movie on Douban and retrieves its data, and
	 * "Submit" which uploads the cover image and saves the new movie to the database.
	 */
	protected openAddNewMovieDialog() {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			'add',
			// "Submit" button in the "Add New Movie" dialog
			async (movie: MovieItemVO) => {
				this.dialogService.openDialog(
					this.dialogComponentContainer,
					'block',
					async () => await this.handleAddDialogSubmit(movie),
					'Adding movie...'
				);
			},
			// "Search" button in the "Add New Movie" dialog
			this.handleAddDialogSearch.bind(this)
		);
	}

	/**
	 * Handles the submission of a new movie from the "Add New Movie" dialog.
	 * First uploads the movie's cover image to cloud storage and obtains a
	 * downloadable link, then saves the complete movie data to the database
	 * and updates the statistics.
	 *
	 * @param newMovieItemVO - The new movie item to save to the database.
	 */
	private async handleAddDialogSubmit(newMovieItemVO: MovieItemVO) {
		// Upload movie cover image to firebase storage and generate downloadable link
		// The downloadable link needs to be acquired first and it will be uploaded to firebase in the next step
		await this.uploadMovieImageAndGetDownloadableLink(newMovieItemVO);
		// Save new movie data to firebase and update movie statistics
		await this.databaseService.addNewMovieDataAndUpdateStatistics(newMovieItemVO);
	}

	/**
	 * Handles the "Search" action on the "Add New Movie" dialog. Checks if the
	 * movie already exists in the database (throwing MovieAlreadyExistsError if so),
	 * then searches for the movie on Douban to retrieve its full data and cover image.
	 *
	 * @param newMovieItemVO - The new movie item to search for and populate.
	 * @returns The movie cover image as a Blob.
	 * @throws MovieAlreadyExistsError if the movie is already in the database.
	 */
	private async handleAddDialogSearch(newMovieItemVO: MovieItemVO): Promise<Blob> {
		// Check for duplicates BEFORE searching — avoids unnecessary API calls
		// for movies already in the database.
		if (
			await this.databaseService.isMovieAlreadyAdded(
				newMovieItemVO.getMovieName(),
				newMovieItemVO.getMovieYear(),
				newMovieItemVO.getMovieId()
			)
		) {
			throw new MovieAlreadyExistsError(newMovieItemVO.getMovieName());
		}
		await this.searchNewMovie(newMovieItemVO);
		LOG.info(this.className, 'New movie details retrieved.');
		return newMovieItemVO.getMovieCoverImage();
	}

	/**
	 * Routes new movie search to the appropriate strategy based on what data is available.
	 *
	 * If the movie ID is not provided (equals -1), the movie name and year are used to
	 * first look up the Douban ID via getMovieId, then fetch full data via
	 * getNewMovieDataGivenYearAndTitle. If the movie ID is already provided, data is
	 * fetched directly via getNewMovieDataGivenMovieId.
	 *
	 * Only the "Search" button on the "Add New Movie" dialog triggers this function.
	 *
	 * @param newMovieItemVO - The new movie item containing either a movie ID or a
	 *                         name and year to search with.
	 */
	private async searchNewMovie(newMovieItemVO: MovieItemVO) {
		// Condition 1
		if (newMovieItemVO.getMovieId() === -1) {
			LOG.info(this.className, `Movie ID not given, start searching for it.`);
			await this.getMovieId(newMovieItemVO);
			await this.getNewMovieDataGivenYearAndTitle(newMovieItemVO);
		}

		// Condition 2
		else {
			await this.getNewMovieDataGivenMovieId(newMovieItemVO);
		}
	}

	/**
	 * Opens the history dialog showing previously deleted or modified movies.
	 * The user can restore a movie from history, which re-searches its data
	 * on Douban and re-adds it to the database.
	 */
	protected openHistoryDialog() {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			'history',
			// Restore flow: re-search the movie on Douban, then re-add to database.
			// The inner block dialog keeps the UI locked during the restore.
			async (movieToRestore: MovieItemVO) => {
				await this.dialogService.openDialog(
					this.dialogComponentContainer,
					'block',
					async () => {
						await this.handleAddDialogSearch(movieToRestore);
						await this.handleAddDialogSubmit(movieToRestore);
					},
					'Restoring movie...'
				);
			},
			this.databaseService.getHistory()
		);
	}

	/**
	 * Begins editing a movie's genre by storing a snapshot of the current genre
	 * value in the editedItems map. The original value is preserved so that
	 * completeEdit can detect whether a change was actually made.
	 *
	 * @param movie - The movie whose genre is being edited.
	 */
	protected startEdit(movie: MovieItemVO) {
		this.editedItems.set(movie.getMovieKey(), {
			original: movie.getMovieGenre(),
			genre: movie.getMovieGenre()
		});
	}

	/**
	 * Finalizes editing of a movie's genre. If the genre value has changed from
	 * the original snapshot stored by startEdit, the new genre is persisted to the
	 * database. If no change was made, the edit entry is simply discarded.
	 *
	 * @param movie - The movie whose genre edit is being completed.
	 */
	protected async completeEdit(movie: MovieItemVO) {
		const genreData = this.editedItems.get(movie.getMovieKey());
		try {
			if (genreData) {
				if (genreData.original !== genreData.genre) {
					await this.databaseService.updateMovieGenre(
						movie.getMovieKey(),
						genreData.original,
						genreData.genre
					);
				}
				this.editedItems.delete(movie.getMovieKey());
			}
		} catch (error) {
			if (error instanceof Error && error.message === ERROR_PERMISSION_DENIED) {
				this.openPermissionErrorDialog();
			} else {
				this.openUnexpectedErrorDialog();
				LOG.error(this.className, 'Error while updaing genre');
			}
		}
	}

	/**
	 * Toggles the favourite status of a movie in the database. The new status
	 * is the inverse of the current isFavourite value on the movie item.
	 *
	 * @param movie - The movie whose favourite status should be toggled.
	 */
	protected async setIsFavourite(movie: MovieItemVO) {
		try {
			// Toggle: pass the inverse of the current state. If currently true, set false;
			// if currently false, set true. The database only stores the final boolean.
			await this.databaseService.updateMovieFavourite(movie.getMovieKey(), !movie.getIsFavourite());
		} catch (error) {
			if (error instanceof Error && error.message === ERROR_PERMISSION_DENIED) {
				this.openPermissionErrorDialog();
			} else {
				this.openUnexpectedErrorDialog();
				LOG.error(this.className, 'Error while set favourite');
			}
		}
	}

	/**
	 * Opens a dialog informing the user that a permission error has occurred,
	 * typically when the user lacks read/write access to the database.
	 */
	private openPermissionErrorDialog() {
		this.dialogService.showPermissionError(this.dialogComponentContainer);
	}

	/**
	 * Opens a dialog informing the user that an unexpected error has occurred.
	 * Used as a generic fallback for errors that are not specifically handled
	 * (e.g., errors other than permission denied).
	 */
	private openUnexpectedErrorDialog() {
		this.dialogService.showUnexpectedError(this.dialogComponentContainer);
	}
}
