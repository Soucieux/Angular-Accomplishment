import { AccessDeniedComponent } from '../../common/access-denied/access-denied.component';
import { SearchStreamService } from '../../backend/dialog-service/search/search-stream.service';
import { Utilities } from '../../common/app.utilities';
import {
	COMPONENT_DESTROY,
	DIALOG_ADD,
	DIALOG_BLOCK,
	DIALOG_CONFIRM,
	DIALOG_ERROR,
	DIALOG_HISTORY,
	RATE_DECREASED,
	RATE_INCREASED,
	SEARCH_CANCEL,
	SEARCH_COMPLETE,
	NO_RATE,
	GENRE_FAVOURITE,
	SEARCH,
	MOVIE_GENRES,
	ENT_MSG_DELETE_CONFIRM_PREFIX,
	ENT_DIALOG_TITLE_DELETE_MOVIE,
	ENT_DIALOG_BTN_DELETE,
	ENT_MSG_ADDING,
	ENT_MSG_RESTORING,
	CN,
	ENT_TOOLTIP_REFRESH,
	ENT_TOOLTIP_ADD,
	ENT_TOOLTIP_HISTORY,
	ENT_SEARCH_PLACEHOLDER,
	ENT_LABEL_FILMS,
	ENT_LABEL_TO_WATCH,
	ENT_CORK_PIN_COLORS,
	ENT_CORK_ROTATIONS,
	ENT_CORK_BLOCKS,
	ENT_VTA_STYLE_ID,
	ENT_VT_CLASS_LEAVING,
	ENT_VT_CLASS_ENTERING,
	ENT_MSG_UPDATE_GENRE_FAILED,
	ENT_MSG_UPDATE_RATE_FAILED_PREFIX,
	ENT_MSG_API_EMPTY_RESPONSE,
	ENT_MSG_FETCH_FAILED_PREFIX,
	ENT_MSG_RETRIEVE_RATE_FAILED_PREFIX,
	ENT_MSG_RETRIEVE_WEBPAGE_FAILED_PREFIX,
	ENT_LOG_SEARCH_CANCEL_REQUESTED,
	ENT_LOG_MOVIE_DETAILS_RETRIEVED,
	ENT_LOG_UPDATE_FAVOURITE_FAILED
} from '../../common/app.constant';
import { MovieIdNotFoundError } from '../../common/error/movie-id-not-found.error';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Inject,
	OnDestroy,
	OnInit,
	PLATFORM_ID,
	Renderer2,
	ViewChild,
	ViewContainerRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Observable, Subscription, timer, BehaviorSubject, combineLatest, map, take } from 'rxjs';
import { LOG } from '../../common/app.logs';
import { DoubanService } from '../../backend/douban-service/douban.service';
import { MovieItemVO } from './movieItem.vo';
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
import { MovieFetchFailedError } from '../../common/error/movie-fetch-failed-error';

/**
 * View Transition styles injected directly into <head> at runtime.
 * They cannot live in the component stylesheet because Angular's
 * ViewEncapsulation.Emulated prefixes ::view-transition-* selectors with an
 * attribute selector, preventing them from matching the browser-generated
 * pseudo-elements on the document root.
 */
const ENT_VTA_CSS = `
::view-transition-old(*),::view-transition-new(*){mix-blend-mode:normal}
::view-transition-old(*.${ENT_VT_CLASS_LEAVING}){animation:420ms ease-in both vt-fade-out}
::view-transition-new(*.${ENT_VT_CLASS_ENTERING}){animation:420ms ease-out both vt-fade-in}
::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}
@keyframes vt-fade-out{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(0.88)}}
@keyframes vt-fade-in{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}
`;

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
		SelectModule,
		AccessDeniedComponent
	],
	templateUrl: './entertainment.component.html',
	styleUrl: './entertainment.component.css'
})
export class EntertainmentComponent implements OnInit, OnDestroy {
	private readonly className = 'EntertainmentComponent';
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	protected readonly NO_RATE = NO_RATE;
	protected readonly GENRE_FAVOURITE = GENRE_FAVOURITE;
	protected readonly ENT_TOOLTIP_REFRESH = ENT_TOOLTIP_REFRESH;
	protected readonly ENT_TOOLTIP_ADD = ENT_TOOLTIP_ADD;
	protected readonly ENT_TOOLTIP_HISTORY = ENT_TOOLTIP_HISTORY;
	protected readonly ENT_SEARCH_PLACEHOLDER = ENT_SEARCH_PLACEHOLDER;
	protected readonly ENT_LABEL_FILMS = ENT_LABEL_FILMS;
	protected readonly ENT_LABEL_TO_WATCH = ENT_LABEL_TO_WATCH;
	protected isSearching: boolean = false;
	private sessionId: number = 0;
	protected movieList$!: Observable<MovieItemVO[]>;
	protected selectedGenres$ = new BehaviorSubject<string>('');
	protected searchQuery$ = new BehaviorSubject<string>('');
	protected searchText: string = '';
	protected filteredMovieList$!: Observable<MovieItemVO[]>;
	protected statistics$!: Observable<any>;
	private searchSummary!: Map<string, string[]>;
	protected editedItems = new Map<string, { originalGenre: string; genre: string }>();
	protected genres = MOVIE_GENRES;
	private latestMovieList: MovieItemVO[] = [];
	private readonly vtClassMap = new Map<string, string>();
	private movieListSub?: Subscription;
	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		@Inject(DOCUMENT) private doc: Document,
		private elRef: ElementRef<HTMLElement>,
		private renderer: Renderer2,
		private cdr: ChangeDetectorRef,
		private doubanService: DoubanService,
		private databaseService: DatabaseService,
		private dialogService: DialogService,
		protected utilities: Utilities,
		private searchStreamService: SearchStreamService
	) {}

	/**
	 * Initialises the component: injects View Transition styles, wires the movie-list
	 * and statistics observables, builds the combined filter stream, and auto-opens
	 * the add or search dialog when navigated from a home quick-action button.
	 */
	async ngOnInit() {
		// Server has to access this line as well. Without it, movieList$ will be empty and this component will be destoryed immediately.
		// Only logged in user can access the movie list
		if (isPlatformBrowser(this.platformId)) {
			const vtaStyle = this.doc.createElement('style');
			vtaStyle.id = ENT_VTA_STYLE_ID;
			vtaStyle.textContent = ENT_VTA_CSS;
			this.doc.head.appendChild(vtaStyle);

			// Get the movie list (Observable) and statistics (Observable) from firebase or cloudbase
			this.statistics$ = this.databaseService.getStatistics();

			// One-time pre-check to make sure user have permission to read data in the database
			await firstValueFrom(this.statistics$.pipe(take(1)));
			// Below part will be executed only if there is no error reading data in the database
			this.movieList$ = this.databaseService.getMovieList();
			this.movieListSub = this.movieList$.subscribe(list => {
				this.latestMovieList = list;
			});

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

			this.updateGridLayout();

			// If navigated from the home quick-action buttons, auto-open the relevant dialog.
			// history.state retains the router state passed via Router.navigate({ state: ... }).
			// Immediately clear the state so a page refresh does not re-trigger the dialog.
			const navState = history.state;
			if (navState?.openAddDialog || navState?.openSearchDialog) {
				history.replaceState({}, '');
				if (navState.openAddDialog) setTimeout(() => this.openAddNewMovieDialog(), 0);
				else setTimeout(() => this.openSearchDialog(), 0);
			}
		}
	}

	/**
	 * Completes the genre and search query subjects, clears any open dialogs,
	 * resets the searching flag, and logs the component destruction event.
	 */
	ngOnDestroy() {
		this.doc.getElementById(ENT_VTA_STYLE_ID)?.remove();
		this.movieListSub?.unsubscribe();
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
				this.dialogService.handleError(this.dialogComponentContainer, error);
				LOG.error(this.className, `${ENT_MSG_UPDATE_RATE_FAILED_PREFIX}${movieItemVO.getMovieName()}`);
			}
		}

		// Prevent race condition
		if (currentSessionId === this.sessionId) {
			if (this.isSearching) this.searchStreamService.addSearchLog(SEARCH_COMPLETE);
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
						.map((actor: any) => actor.data.find((d: any) => d.lang === CN)?.name)
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
            // For search dialog, record it inside.
			if (!retrieveOtherData && !retrieveYearAndTitle) {
				if (error instanceof MovieFetchFailedError) {
					this.searchStreamService.addSearchLog(
						`${ENT_MSG_FETCH_FAILED_PREFIX}${movieItemVO.getMovieName()}. SKIPPING.`
					);
				} else {
					this.searchStreamService.addSearchLog(
						`${ENT_MSG_RETRIEVE_RATE_FAILED_PREFIX}${movieItemVO.getMovieName()}. SKIPPING.`
					);
				}
            } else {
                // For other places, show the error dialog
				if (error instanceof MovieFetchFailedError) {
					this.dialogService.openDialog(this.dialogComponentContainer, DIALOG_ERROR, error.message);
				} else {
					LOG.error(
						this.className,
						`${ENT_MSG_RETRIEVE_WEBPAGE_FAILED_PREFIX}${movieItemVO.getMovieName()}`,
						error as Error
					);
					throw error;
				}
			}
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
			LOG.warn(this.className, ENT_MSG_API_EMPTY_RESPONSE);
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
		LOG.info(this.className, `${(this.platformId as unknown as string).toUpperCase()} is searching movie cover`);
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
				movieItemVO.getMovieCoverImage()!,
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

	////////////////////// Below are Utilities Functions used by HTML template /////////////////////
	/**
	 * Returns the human-readable quality label for a movie rate ("Excellent", "Good",
	 * "Average", or "Poor") by delegating to the shared utility method.
	 *
	 * @param rate - The numeric movie rate.
	 * @returns A quality label string.
	 */
	protected getRateLabel(rate: number): string {
		return Utilities.getMovieRateLabel(rate);
	}

	/**
	 * Returns the pushpin colour for a corkboard category card, cycling through
	 * ENT_CORK_PIN_COLORS by card index.
	 *
	 * @param index - The zero-based position of the card in the category row.
	 * @returns A CSS colour string.
	 */
	protected getGenreColor(index: number): string {
		return ENT_CORK_PIN_COLORS[index % ENT_CORK_PIN_COLORS.length];
	}

	/**
	 * Returns the CSS rotation value for a corkboard category card, cycling through
	 * ENT_CORK_ROTATIONS by card index.
	 *
	 * @param index - The zero-based position of the card in the category row.
	 * @returns A CSS rotation string (e.g. "-2.4deg").
	 */
	protected getGenreRotation(index: number): string {
		return ENT_CORK_ROTATIONS[index % ENT_CORK_ROTATIONS.length] + 'deg';
	}

	/**
	 * Delegates to Utilities.filledBlocks using the cork-board block count.
	 *
	 * @param count - The number of titles in this genre.
	 * @param max - The maximum count across all genres, used as the scale denominator.
	 * @returns A boolean array of length ENT_CORK_BLOCKS.
	 */
	protected getFilledBlocks(count: number, max: number): boolean[] {
		return Utilities.filledBlocks(count, max, ENT_CORK_BLOCKS);
	}

	/**
	 * Computes the maximum genre count from the statistics genre map.
	 * Used as the denominator when scaling the corkboard progress bar.
	 *
	 * @param genre - The genre map keyed by genre name with count values.
	 * @returns The highest count, or 1 when the map is empty.
	 */
	protected getCorkMax(genre: Record<string, number>): number {
		const values = Object.values(genre ?? {}).map(Number).filter((n) => !isNaN(n));
		return values.length > 0 ? Math.max(...values) : 1;
	}

	/**
	 * Returns the background style for a category card. Inactive cards use a
	 * plain white background; the active card gets a gradient built from its
	 * own pin colour for per-card colour variety.
	 *
	 * @param index - The zero-based position of the card in the category row.
	 * @param isActive - Whether this card is currently selected.
	 * @returns A CSS background string.
	 */
	protected getCardBackground(index: number, isActive: boolean): string {
		if (!isActive) return '#ffffff';
		const color = this.getGenreColor(index);
		return `linear-gradient(135deg, ${color}ee 0%, ${color}99 100%)`;
	}

	/**
	 * Returns the box-shadow style for a category card. Inactive cards get an
	 * empty string (falling back to the CSS default shadow); the active card
	 * gets a coloured glow matching its own pin colour.
	 *
	 * @param index - The zero-based position of the card in the category row.
	 * @param isActive - Whether this card is currently selected.
	 * @returns A CSS box-shadow string.
	 */
	protected getCardShadow(index: number, isActive: boolean): string {
		if (!isActive) return '';
		const color = this.getGenreColor(index);
		return `0 10px 10px ${color}66, inset 0 1px 0 rgba(255,255,255,0.35)`;
	}

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
			return length <= 6 ? '21px' : String(18 - (length - 8) * 2 + 'px');
		}
		return length <= 7 ? '23px' : String(20 - (length - 8.5) * 2 + 'px');
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

	////////////////////// Below are Event Handlers triggered by user actions ////////////////////
	/**
	 * Toggles the genre filter with a View Transition animation.
	 * Movies leaving the visible set are tagged vt-leaving (fade out + scale);
	 * movies entering are tagged vt-entering (fade in + scale);
	 * movies that stay use the browser's default FLIP crossfade.
	 *
	 * @param genre The genre string whose category card was clicked.
	 */
	protected filterByGenre(genre: string): void {
		const currentGenre = this.selectedGenres$.getValue();
		const newGenre = currentGenre === genre ? '' : genre;
		this.computeVtClassMap(currentGenre, newGenre);
		this.cdr.detectChanges();
		const toggle = () => {
			this.selectedGenres$.next(newGenre);
		};
		if ('startViewTransition' in document) {
			(document as Document & { startViewTransition: (cb: () => unknown) => void }).startViewTransition(
				async () => {
					toggle();
					await new Promise<void>(resolve => setTimeout(resolve));
				}
			);
		} else {
			toggle();
		}
	}

	/**
	 * Populates vtClassMap with ENT_VT_CLASS_LEAVING for movies visible under
	 * currentGenre but not newGenre, and ENT_VT_CLASS_ENTERING for the reverse.
	 * Staying movies (visible in both) are omitted so they use the default FLIP.
	 *
	 * @param currentGenre - The genre filter currently active.
	 * @param newGenre - The genre filter that will be active after the transition.
	 */
	private computeVtClassMap(currentGenre: string, newGenre: string): void {
		this.vtClassMap.clear();
		for (const movie of this.latestMovieList) {
			const inCurrent = this.isMovieInGenre(movie, currentGenre);
			const inNew = this.isMovieInGenre(movie, newGenre);
			if (inCurrent && !inNew) {
				this.vtClassMap.set(movie.getMovieKey(), ENT_VT_CLASS_LEAVING);
			} else if (!inCurrent && inNew) {
				this.vtClassMap.set(movie.getMovieKey(), ENT_VT_CLASS_ENTERING);
			}
		}
	}

	/**
	 * Returns whether the given movie should be visible under the specified genre filter.
	 *
	 * @param movie - The movie to test.
	 * @param genre - The genre filter value; empty string means no filter (show all).
	 * @returns True if the movie is visible under the filter.
	 */
	private isMovieInGenre(movie: MovieItemVO, genre: string): boolean {
		if (genre === '') return true;
		if (genre === GENRE_FAVOURITE) return movie.getIsFavourite();
		return movie.getMovieGenre().includes(genre);
	}

	/**
	 * Returns the view-transition-class value for a movie card, used by the
	 * template to tag leaving and entering elements before the VTA snapshot.
	 *
	 * @param movie - The movie card to query.
	 * @returns The CSS class string, or null if no transition class is needed.
	 */
	protected getMovieVtClass(movie: MovieItemVO): string | null {
		return this.vtClassMap.get(movie.getMovieKey()) ?? null;
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
		this.searchStreamService.addSearchLog(ENT_LOG_SEARCH_CANCEL_REQUESTED);
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
			DIALOG_CONFIRM,
			async () => {
				try {
					await this.databaseService.removeMovieFromDatabase(movieItemVO);
				} catch (error) {
					this.dialogService.showUnexpectedError(this.dialogComponentContainer);
				}
			},
			[`${ENT_MSG_DELETE_CONFIRM_PREFIX}${movieItemVO.getMovieName()}?`, ENT_DIALOG_TITLE_DELETE_MOVIE, ENT_DIALOG_BTN_DELETE]
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
			DIALOG_ADD,
			// "Submit" button in the "Add New Movie" dialog
			async (movie: MovieItemVO) => {
				this.openBlockDialog(async () => await this.handleAddDialogSubmit(movie), ENT_MSG_ADDING);
			},
			// "Search" button in the "Add New Movie" dialog
			this.handleAddDialogSearch.bind(this)
		);
	}

	/**
	 * Open a blocking progress dialog that prevents user interaction while the
	 * given async callback executes. Used during add and restore flows to lock
	 * the UI while uploading covers and writing to the database.
	 *
	 * @param callback - The async operation to run while the dialog is shown.
	 * @param message - The status message displayed inside the dialog.
	 */
	private openBlockDialog(callback: () => Promise<void>, message: string): Promise<void> {
		return this.dialogService.openDialog(this.dialogComponentContainer, DIALOG_BLOCK, callback, message);
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
	private async handleAddDialogSearch(newMovieItemVO: MovieItemVO): Promise<Blob | null> {
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
		LOG.info(this.className, ENT_LOG_MOVIE_DETAILS_RETRIEVED);
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
			DIALOG_HISTORY,
			// Restore flow: re-search the movie on Douban, then re-add to database.
			// The inner block dialog keeps the UI locked during the restore.
			async (movieToRestore: MovieItemVO) => {
				await this.openBlockDialog(async () => {
					await this.handleAddDialogSearch(movieToRestore);
					await this.handleAddDialogSubmit(movieToRestore);
				}, ENT_MSG_RESTORING);
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
			originalGenre: movie.getMovieGenre(),
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
				if (genreData.originalGenre !== genreData.genre) {
					await this.databaseService.updateMovieGenre(
						movie.getMovieKey(),
						genreData.originalGenre,
						genreData.genre
					);
				}
				this.editedItems.delete(movie.getMovieKey());
			}
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
			LOG.error(this.className, ENT_MSG_UPDATE_GENRE_FAILED);
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
			this.dialogService.handleError(this.dialogComponentContainer, error);
			LOG.error(this.className, ENT_LOG_UPDATE_FAVOURITE_FAILED);
		}
	}
}
