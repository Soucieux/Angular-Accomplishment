import { BlockedCardComponent } from '../../common/blocked-card/blocked-card.component';
import { SearchStreamService } from '../../backend/dialog-service/search/search-stream.service';
import { Utilities } from '../../common/utilities/app.utilities';
import {
	COMPONENT_DESTROY,
	DIALOG_ADD,
	DIALOG_BLOCK,
	DIALOG_ERROR,
	DIALOG_HISTORY,
	RATE_DECREASED,
	RATE_INCREASED,
	NO_RATE,
	GENRE_FAVOURITE,
	SEARCH,
	CN,
	ENT_CORK_BLOCKS,
	ENT_VTA_STYLE_ID,
	ENT_VT_CLASS_LEAVING,
	ENT_VT_CLASS_ENTERING,
	ENT_VT_NAME_PREFIX,
	ENT_DOUBAN_MOVIE_URL_PREFIX,
	ENT_MOVIE_RATE_UNRESOLVED,
	ENT_MSG_UPDATE_GENRE_FAILED,
	ENT_MSG_UPDATE_RATE_FAILED_PREFIX,
	ENT_MSG_API_EMPTY_RESPONSE,
	ENT_MSG_FETCH_FAILED_PREFIX,
	ENT_MSG_RETRIEVE_RATE_FAILED_PREFIX,
	ENT_MSG_RETRIEVE_MOVIE_DATA_FAILED_PREFIX,
	ENT_LOG_SEARCH_CANCEL_REQUESTED,
	ENT_LOG_MOVIE_DETAILS_RETRIEVED,
	ENT_LOG_UPDATE_FAVOURITE_FAILED,
	ENT_LOG_COVER_RETRIEVED,
	ENT_LOG_COVER_UPLOADED,
	ENT_LOG_SEARCHING_MOVIE_ID,
	ENT_LOG_MOVIE_DETAILS_FAILED,
	DB_LOG_IMAGE_UPLOAD_FAILED,
	ENT_LOG_RELEASE_DATE,
	ENT_LOG_EPISODE_NUMBER,
	ENT_LOG_MOVIE_ID_RETRIEVED,
	ENT_LOG_MOVIE_ID_NOT_FOUND,
	ENT_LOG_MOVIE_ID_NOT_FOUND_HINT
} from '../../common/constants';
import {
	SEARCH_CANCEL,
	SEARCH_COMPLETE,
	MSG_DELETING,
	DIALOG_BTN_DELETE,
	ENT_MSG_DELETE_CONFIRM_PREFIX,
	ENT_DIALOG_TITLE_DELETE_MOVIE,
	ENT_MSG_LOADING,
	ENT_MSG_ADDING,
	ENT_MSG_RESTORING,
	ENT_TOOLTIP_REFRESH,
	ENT_TOOLTIP_ADD,
	ENT_TOOLTIP_HISTORY,
	ENT_TITLE_PAGE,
	ENT_SEARCH_PLACEHOLDER,
	ENT_LABEL_GENRE,
	ENT_LABEL_EPISODES,
	ENT_LABEL_YEAR,
	ENT_LABEL_SYNOPSIS,
	ENT_LABEL_CAST,
	ENT_LABEL_FILMS,
	ENT_LABEL_TO_WATCH,
	ENT_ARIA_DOUBAN_LINK,
	genreLabel as resolveGenreLabel,
	ENT_LOG_START_SEARCHING,
	ENT_LOG_SUMMARY_HEADER,
	ENT_LOG_RATE_INCREASED_LABEL,
	ENT_LOG_RATE_DECREASED_LABEL,
	ENT_LOG_NONE,
	ENT_LOG_SKIPPING
} from '../../common/locale/locale-strings';
import { MovieIdNotFoundError } from '../../common/error/movie-id-not-found.error';
import {
	ENT_CORK_PIN_COLORS,
	ENT_CORK_ROTATIONS,
	ENT_MOVIE_ENTRANCE_BASE_DELAY_MS,
	ENT_MOVIE_ENTRANCE_MAX_DELAY_MS,
	ENT_MOVIE_ENTRANCE_STEP_MS,
	MOVIE_GENRES
} from './entertainment.model';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
	ChangeDetectorRef,
	Component,
	Inject,
	OnDestroy,
	OnInit,
	PLATFORM_ID,
	ViewChild,
	ViewContainerRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	firstValueFrom,
	Observable,
	Subscription,
	timer,
	BehaviorSubject,
	combineLatest,
	map,
	take
} from 'rxjs';
import { LOG } from '../../common/app.logs';
import { DoubanService, MovieDetails } from '../../backend/douban-service/douban.service';
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
import { UnexpectedError } from '../../common/error/unexpected.error';
import { SessionExpiredError } from '../../common/error/session-expired.error';

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
		BlockedCardComponent
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
	protected readonly ENT_TITLE_PAGE = ENT_TITLE_PAGE;
	protected readonly ENT_SEARCH_PLACEHOLDER = ENT_SEARCH_PLACEHOLDER;
	protected readonly ENT_LABEL_GENRE = ENT_LABEL_GENRE;
	protected readonly ENT_LABEL_EPISODES = ENT_LABEL_EPISODES;
	protected readonly ENT_LABEL_YEAR = ENT_LABEL_YEAR;
	protected readonly ENT_LABEL_SYNOPSIS = ENT_LABEL_SYNOPSIS;
	protected readonly ENT_LABEL_CAST = ENT_LABEL_CAST;
	protected readonly ENT_MSG_LOADING = ENT_MSG_LOADING;
	protected readonly ENT_LABEL_FILMS = ENT_LABEL_FILMS;
	protected readonly ENT_LABEL_TO_WATCH = ENT_LABEL_TO_WATCH;
	protected readonly ENT_ARIA_DOUBAN_LINK = ENT_ARIA_DOUBAN_LINK;
	protected readonly ENT_VT_NAME_PREFIX = ENT_VT_NAME_PREFIX;
	protected readonly ENT_DOUBAN_MOVIE_URL_PREFIX = ENT_DOUBAN_MOVIE_URL_PREFIX;
	protected isMoviesLoading = true;
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
	protected genres = MOVIE_GENRES.map((movieGenre) => ({
		label: resolveGenreLabel(movieGenre.genre),
		value: movieGenre.genre
	}));
	private latestMovieList: MovieItemVO[] = [];
	private readonly vtClassMap = new Map<string, string>();
	private movieListSub?: Subscription;

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
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
		/* Server has to access this line as well. Without it, movieList$ will be empty and this component will be destoryed immediately.
		   Only logged in user can access the movie list */
		if (isPlatformBrowser(this.platformId)) {
			// Step 1: Inject View Transition animation styles into <head> at runtime.
			/* ViewEncapsulation.Emulated would prefix ::view-transition-* selectors with
			   an attribute hash, breaking the browser-generated pseudo-elements on the root. */
			Utilities.injectGlobalStyleOnce(ENT_VTA_STYLE_ID, ENT_VTA_CSS);

			// Step 2: Wire statistics and do a permission pre-check before subscribing to the movie list.
			/* Statistics is read first as a one-shot probe — if the database rejects the read
			   (e.g. unauthenticated user), we bail early before subscribing to the live movie stream. */
			this.statistics$ = this.databaseService.getStatistics();
			try {
				await firstValueFrom(this.statistics$.pipe(take(1)));
			} catch {
				this.isMoviesLoading = false;
				return;
			}

			// Step 3: Subscribe to the live movie list and cache the latest snapshot for VTA class computation.
			this.movieList$ = this.databaseService.getMovieList();
			this.movieListSub = this.movieList$.subscribe((list) => {
				this.latestMovieList = list;
				if (this.isMoviesLoading) this.isMoviesLoading = false;
			});

			// Step 4: Build the combined filter stream that reacts to genre selection and text search simultaneously.
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

			/* Step 5: If navigated from the home quick-action buttons, auto-open the relevant dialog.
			   history.state retains the router state passed via Router.navigate({ state: ... }).
			   The state is cleared immediately so a page refresh does not re-trigger the dialog.
			   setTimeout defers the dialog open by one tick, giving the view time to initialise
			   ViewContainerRef before DialogService tries to render into it. */
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
		this.movieListSub?.unsubscribe();
		this.selectedGenres$.complete();
		this.searchQuery$.complete();
		this.dialogComponentContainer?.clear();
		this.isSearching = false;
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	// ── Movie rate update and data retrieval ─────────────────────────────────

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
			this.searchStreamService.addSearchLog(`${ENT_LOG_START_SEARCHING}${movieItemVO.getMovieName()}`);
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
				LOG.error(
					this.className,
					`${ENT_MSG_UPDATE_RATE_FAILED_PREFIX}${movieItemVO.getMovieName()}`
				);
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
			let summary = `---------------------------------\n${ENT_LOG_SUMMARY_HEADER} (${searchCount})\n`;
			summary += `${ENT_LOG_RATE_INCREASED_LABEL} (${rateIncreaseLength}): `;
			if ((rateIncreasedArray?.length ?? 0) > 0) {
				summary += rateIncreasedArray?.join(', ');
				summary += '.\n';
			} else {
				summary += `${ENT_LOG_NONE}\n`;
			}
			summary += `${ENT_LOG_RATE_DECREASED_LABEL} (${rateDecreaseLength}): `;
			if ((rateDecreasedArray?.length ?? 0) > 0) {
				summary += rateDecreasedArray?.join(', ');
				summary += '.\n';
			} else {
				summary += `${ENT_LOG_NONE}\n`;
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
	 * Retrieves the latest rating, first release date, year, total episode count,
	 * and cover image for a movie from the Douban API. Uses the movie's existing
	 * name and year to locate the correct Douban page, and refreshes every field
	 * except the movie name.
	 *
	 * @param movieItemVO - The movie item to populate with retrieved data.
	 */
	private async getNewMovieDataGivenYearAndTitle(movieItemVO: MovieItemVO) {
		await this.getMovieData(movieItemVO, true, false);
	}

	/**
	 * Retrieves full movie data (rating, release date, year, episode count, cover image,
	 * and name) from the Douban API using the movie's existing ID. This is the only path
	 * that also overwrites the movie name with the value returned by the API.
	 *
	 * @param movieItemVO - The movie item to populate with retrieved data.
	 */
	private async getNewMovieDataGivenMovieId(movieItemVO: MovieItemVO) {
		await this.getMovieData(movieItemVO, true, true);
	}

	/**
	 * Calls the Douban third-party API to retrieve movie data.
	 *
	 * @param movieId - The Douban movie ID to look up.
	 * @returns The parsed movie data object from the third-party API.
	 * @throws MovieFetchFailedError if the API returns no data or the request fails.
	 */
	private async invokeRetrieveMovieApi(movieId: number) {
		try {
			const movieData = await firstValueFrom(
				this.doubanService.searchMovieByThirdPartyApi(movieId)
			);
			if (!movieData) {
				throw new MovieFetchFailedError(movieId);
			}
			return JSON.parse(movieData);
		} catch (error) {
			throw new MovieFetchFailedError(movieId);
		}
	}

	/**
	 * Retrieves a movie's rating and release date from Firecrawl. Used as the fallback for the add
	 * and restore flows when the third-party API left either field empty. A failure degrades to
	 * empty values rather than aborting the add — every other field is already retrieved by then.
	 *
	 * @param movieId - The Douban movie ID to look up.
	 * @returns The scraped rating and release date, or empty values when the lookup fails.
	 */
	private async retrieveMovieDetails(movieId: number): Promise<MovieDetails> {
		try {
			return await firstValueFrom(this.doubanService.searchMovieDetails(movieId));
		} catch (error) {
			/* Logged rather than swallowed silently: the degraded result is indistinguishable from a
			   genuinely unrated title, so a dead Firecrawl key or exhausted quota would otherwise
			   write -1 across every movie added for as long as it stayed broken. */
			LOG.error(this.className, `${ENT_LOG_MOVIE_DETAILS_FAILED} ${movieId}`, error as Error);
			return { rate: ENT_MOVIE_RATE_UNRESOLVED, releaseDate: '' };
		}
	}

	/**
	 * Core data retrieval method. Fetches the movie data from the Douban
	 * third-party API for the given movie, extracts the rating, and optionally
	 * extracts additional metadata (release date, episode count, cover image,
	 * actors, description, year, and title) based on the provided flags.
	 *
	 * @param movieItemVO - The movie item to populate with retrieved data.
	 * @param retrieveOtherData - If true, also retrieves release date, year, episode count,
	 *                            cover image, actors, and description.
	 * @param retrieveTitle - If true, also overwrites the movie's title with the API's.
	 * @throws UnexpectedError if the retrieval fails outside the search-dialog flow and the cause
	 *                         is not a MovieFetchFailedError, which is shown in a dialog instead.
	 */
	private async getMovieData(
		movieItemVO: MovieItemVO,
		retrieveOtherData: boolean,
		retrieveTitle: boolean
	) {
		try {
			// Step 1: Get the movie data from the third-party API
			const movieData = await this.invokeRetrieveMovieApi(movieItemVO.getMovieId());

			/* Step 2: Take the rate from the third-party API — the bulk refresh relies on this alone.
			   setMovieRate normalises an unrated title's empty string to the -1 sentinel, so no
			   caller has to reason about the API's "no rating" representation. */
			movieItemVO.setMovieRate(movieData['doubanRating']);

			// Step 3: Retrieve other data if the flag is true
			if (retrieveOtherData) {
				let dateReleased = movieData['dateReleased'];
				let isCoverRetrieved = false;

				/* Step 3.1: The API leaves both the rating and the release date empty for some titles
				   (upcoming series especially), and Douban blocks the plain proxy, so one Firecrawl
				   scrape backfills whichever is missing. When the scrape finds no rating either, the
				   sentinel stays put — that is a title that genuinely has no rating yet. */
				const isRateMissing = !movieItemVO.hasRate();
				if (isRateMissing || !dateReleased) {
					/* The cover download shares no data with the scrape, so it is started first and
					   both are awaited together — otherwise the add waits out the scrape's render
					   delay and the download back to back. Awaited here rather than at Step 7 so
					   there is no window in which a rejection could go unhandled. */
					const coverDownload = this.getMovieCoverImageByLink(
						movieData['data'][0]['poster'],
						movieItemVO
					);
					const [scrapedDetails] = await Promise.all([
						this.retrieveMovieDetails(movieItemVO.getMovieId()),
						coverDownload
					]);
					if (isRateMissing) {
						movieItemVO.setMovieRate(scrapedDetails.rate);
					}
					dateReleased = dateReleased || scrapedDetails.releaseDate;
					isCoverRetrieved = true;
				}

				// Step 4: Get the first release date for the current movie
				const firstReleaseDate = dateReleased.substring(0, 10).replace(/-/g, '.');
				movieItemVO.setMovieFirstReleaseDate(firstReleaseDate);
				LOG.info(
					this.className,
					`${ENT_LOG_RELEASE_DATE} ${movieItemVO.getMovieName()}: ${firstReleaseDate}`
				);

				/* Step 4.1: The year is refreshed from the API on every full retrieval. Nothing displays
				   it — the card's "Year:" label shows the first release date — but it is the match key
				   for a later name-based ID lookup. Only the title stays behind the flag, so a
				   name-based search keeps the name the user typed rather than replacing it. */
				movieItemVO.setMovieYear(Number(movieData['year']));
				if (retrieveTitle) {
					movieItemVO.setMovieName(movieData['originalName']);
				}

				// Step 5: Get the total episode number for the current movie
				const episodeNumber = movieData['episodes'];
				movieItemVO.setMovieEpisodeNumber(episodeNumber);
				LOG.info(
					this.className,
					`${ENT_LOG_EPISODE_NUMBER} ${movieItemVO.getMovieName()}: ${episodeNumber}`
				);

				// Step 6: Get movie actors and movie description
				movieItemVO.setDescription(movieData['data'][0]['description']);
				const allActors = movieData['actor']
					.map((actor: any) => actor.data.find((d: any) => d.lang === CN)?.name)
					.filter(Boolean);
				const actorRetrieved =
					allActors.length > 10
						? allActors.slice(0, 10).join(', ') + ' 等'
						: allActors.join(', ');
				movieItemVO.setActors(actorRetrieved);

				// Step 7: Get the movie cover, unless Step 3.1 already fetched it alongside the scrape
				if (!isCoverRetrieved) {
					await this.getMovieCoverImageByLink(movieData['data'][0]['poster'], movieItemVO);
				}
			}
		} catch (error) {
			// For search dialog, record it inside.
			if (!retrieveOtherData && !retrieveTitle) {
				if (error instanceof MovieFetchFailedError) {
					this.searchStreamService.addSearchLog(
						`${ENT_MSG_FETCH_FAILED_PREFIX}${movieItemVO.getMovieName()}${ENT_LOG_SKIPPING}`
					);
				} else {
					this.searchStreamService.addSearchLog(
						`${ENT_MSG_RETRIEVE_RATE_FAILED_PREFIX}${movieItemVO.getMovieName()}${ENT_LOG_SKIPPING}`
					);
				}
			} else {
				// For other places, show the error dialog
				if (error instanceof MovieFetchFailedError) {
					this.dialogService.openDialog(this.dialogComponentContainer, DIALOG_ERROR, error.message);
				} else {
					LOG.error(
						this.className,
						`${ENT_MSG_RETRIEVE_MOVIE_DATA_FAILED_PREFIX}${movieItemVO.getMovieName()}`,
						error as Error
					);
					/* Already-typed errors pass through unchanged: SessionExpiredError so handleError
					   can route it to the retry dialog (flattening it would silently break that
					   branch the moment a databaseService call is added inside this try), and
					   UnexpectedError so an inner conversion is not wrapped a second time. */
					if (error instanceof SessionExpiredError || error instanceof UnexpectedError) {
						throw error;
					}
					throw new UnexpectedError();
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
				/* This means that NEW movie must have title and year
				   Movie name and year must be exactly the same */
				if (
					movieData.title === movieItemVO.getMovieName() &&
					movieData.year == movieItemVO.getMovieYear()
				) {
					// Step 3: Set the movie ID to the movie item VO
					movieItemVO.setMovieId(movieData.id);
					LOG.info(
						this.className,
						`${ENT_LOG_MOVIE_ID_RETRIEVED} ${movieItemVO.getMovieName()}: ${movieData.id}`
					);
					return;
				}
			}
			// throw the error to let the calling method knows that no matching movie ID has been found.
			LOG.warn(
				this.className,
				`${ENT_LOG_MOVIE_ID_NOT_FOUND} ${movieItemVO.getMovieName()}. ${ENT_LOG_MOVIE_ID_NOT_FOUND_HINT}`
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
	 * @throws UnexpectedError if the cover image cannot be downloaded.
	 */
	private async getMovieCoverImageByLink(movieCoverImageLink: string, movieItemVO: MovieItemVO) {
		LOG.info(
			this.className,
			`${(this.platformId as unknown as string).toUpperCase()} is searching movie cover`
		);
		try {
			// searchMovieCover returns a Promise and we wait for the retrieval to complete
			const movieCoverImage = await firstValueFrom(
				this.doubanService.searchMovieCover(movieCoverImageLink, movieItemVO.getMovieName())
			);
			movieItemVO.setMovieCoverImage(movieCoverImage);
			LOG.info(this.className, `${ENT_LOG_COVER_RETRIEVED} ${movieItemVO.getMovieName()}`);
		} catch (error) {
			// searchMovieCover already logged the failure with the movie name — only the type is added here.
			throw new UnexpectedError();
		}
	}

	/**
	 * Uploads the movie cover image (stored as a Blob on the movie item) to
	 * cloud storage and sets the resulting downloadable URL back on the movie item.
	 *
	 * A failed upload is not fatal — the movie is still added, just without a cover — so the
	 * empty string the database service returns on failure is left unstored rather than saved
	 * as a link, which would render as a broken image on the card.
	 *
	 * @param movieItemVO - The movie item containing the cover image blob to upload.
	 *                      The downloadable link is set on this object on success.
	 */
	private async uploadMovieImageAndGetDownloadableLink(movieItemVO: MovieItemVO) {
		/* Upload the cover image Blob to cloud storage, then get the resultant
		   downloadable URL. These are separate operations in Firebase/CloudBase. */
		const downloadableLink = await this.databaseService.uploadImageAndGetDownloadLink(
			movieItemVO.getMovieCoverImage()!,
			movieItemVO.getMovieName()
		);
		if (!downloadableLink) {
			LOG.warn(this.className, `${DB_LOG_IMAGE_UPLOAD_FAILED} ${movieItemVO.getMovieName()}`);
			return;
		}
		movieItemVO.setMovieCoverImageDownloadableLink(downloadableLink);
		LOG.info(this.className, `${ENT_LOG_COVER_UPLOADED} ${movieItemVO.getMovieName()}`);
	}

	// ── Event Handlers triggered by user actions ─────────────────────────────
	/**
	 * Toggles the genre filter with a View Transition animation.
	 * Movies leaving the visible set are tagged vt-leaving (fade out + scale);
	 * movies entering are tagged vt-entering (fade in + scale);
	 * movies that stay use the browser's default FLIP crossfade.
	 *
	 * @param genre The genre string whose category card was clicked.
	 */
	protected filterByGenre(genre: string): void {
		// Step 1: Determine the next genre value (clicking the active genre deselects it).
		const currentGenre = this.selectedGenres$.getValue();
		const newGenre = currentGenre === genre ? '' : genre;

		/* Step 2: Pre-compute which cards are leaving / entering BEFORE the transition snapshot.
		   detectChanges flushes the vtClassMap to the DOM so the browser can read the
		   view-transition-class attributes during the snapshot phase. */
		this.computeVtClassMap(currentGenre, newGenre);
		this.cdr.detectChanges();
		const toggle = () => {
			this.selectedGenres$.next(newGenre);
		};

		// Step 3: Run the genre change inside a View Transition if the API is available, otherwise apply it directly.
		/* The inner await new Promise gives Angular one microtask to propagate the
		   BehaviorSubject emission to the template before the browser captures the new state. */
		if ('startViewTransition' in document) {
			(document as Document & { startViewTransition: (cb: () => unknown) => void }).startViewTransition(
				async () => {
					toggle();
					await new Promise<void>((resolve) => setTimeout(resolve));
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
		// Step 1: Reset the map so stale transition classes from a previous filter do not bleed through.
		this.vtClassMap.clear();

		// Step 2: Classify each movie as leaving, entering, or staying (no entry = default FLIP crossfade).
		/* Movies visible in both the old and new genre are intentionally omitted — they use
		   the browser's built-in FLIP crossfade and do not need an explicit class. */
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
	 * Returns true when the given movie should be visible under the specified genre filter.
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
	 * Gets the view-transition-class value for a movie card, used by the
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
		this.updateAllMoviesRate().catch(() => {});
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
	 * specified movie. The delete then runs behind the blocking overlay so a
	 * repeat click cannot fire a duplicate database call.
	 *
	 * @param movieItemVO - The movie item to be deleted upon confirmation.
	 */
	protected openDeleteConfirmationDialog(movieItemVO: MovieItemVO) {
		if (!this.dialogService.ensurePermission(this.dialogComponentContainer, movieItemVO.getOpenId()))
			return;
		this.dialogService.confirmThenBlock(
			this.dialogComponentContainer,
			[
				`${ENT_MSG_DELETE_CONFIRM_PREFIX}${movieItemVO.getMovieName()}?`,
				ENT_DIALOG_TITLE_DELETE_MOVIE,
				DIALOG_BTN_DELETE
			],
			MSG_DELETING,
			async () => {
				try {
					await this.databaseService.removeMovieFromDatabase(movieItemVO);
				} catch (error: unknown) {
					this.dialogService.showUnexpectedError(this.dialogComponentContainer);
					throw error;
				}
			}
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
				await this.dialogService.runBlocking(this.dialogComponentContainer, ENT_MSG_ADDING, () =>
					this.handleAddDialogSubmit(movie)
				);
			},
			// "Search" button in the "Add New Movie" dialog
			this.handleAddDialogSearch.bind(this)
		);
	}

	/**
	 * Opens a blocking progress dialog that prevents user interaction while the
	 * given async callback executes, returning its promise so the restore flow can
	 * await completion before the history dialog callback resolves.
	 *
	 * @param callback - The async operation to run while the dialog is shown.
	 * @param message - The status message displayed inside the dialog.
	 * @returns A promise that resolves when the callback completes.
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
		/* Upload movie cover image to firebase storage and generate downloadable link
		   The downloadable link needs to be acquired first and it will be uploaded to firebase in the next step */
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
		/* Step 1: Guard against duplicates BEFORE hitting the Douban API.
		   The check uses name, year, AND ID so that re-adding a deleted movie
		   with a known ID is blocked just as reliably as a name-only match. */
		if (
			await this.databaseService.isMovieAlreadyAdded(
				newMovieItemVO.getMovieName(),
				newMovieItemVO.getMovieYear(),
				newMovieItemVO.getMovieId()
			)
		) {
			throw new MovieAlreadyExistsError(newMovieItemVO.getMovieName());
		}

		// Step 2: Fetch full movie data (rating, cover, release date, etc.) from Douban.
		await this.searchNewMovie(newMovieItemVO);
		LOG.info(this.className, ENT_LOG_MOVIE_DETAILS_RETRIEVED);

		// Step 3: Return the cover image Blob so the dialog can render a preview before the user submits.
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
		/* Branch A: No Douban ID supplied (sentinel value -1) — resolve the ID from name + year first.
		   getNewMovieDataGivenYearAndTitle is called after, NOT getNewMovieDataGivenMovieId, because
		   the ID was resolved from the search index and the year/title on the VO are already correct. */
		if (newMovieItemVO.getMovieId() === -1) {
			LOG.info(this.className, ENT_LOG_SEARCHING_MOVIE_ID);
			await this.getMovieId(newMovieItemVO);
			await this.getNewMovieDataGivenYearAndTitle(newMovieItemVO);
		}

		// Branch B: Douban ID already provided — fetch full data directly by ID (overwrites name and year from API).
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
			/* Restore flow: re-search the movie on Douban, then re-add to database.
			   The inner block dialog keeps the UI locked during the restore. */
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
		if (!this.dialogService.ensurePermission(this.dialogComponentContainer, movie.getOpenId())) return;
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
		// Step 1: Retrieve the snapshot captured when the user opened the genre dropdown.
		const genreData = this.editedItems.get(movie.getMovieKey());
		try {
			if (genreData) {
				// Step 2: Only write to the database if the genre value actually changed.
				/* Skipping the write when nothing changed avoids a redundant network call
				   and prevents an unnecessary activity log entry in the database. */
				if (genreData.originalGenre !== genreData.genre) {
					await this.databaseService.updateMovieGenre(
						movie.getMovieKey(),
						genreData.originalGenre,
						genreData.genre,
						movie.getMovieName()
					);
				}

				// Step 3: Remove the edit entry regardless of whether a write occurred.
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
			/* Toggle: pass the inverse of the current state. If currently true, set false;
			   if currently false, set true. The database only stores the final boolean. */
			await this.databaseService.updateMovieFavourite(
				movie.getMovieKey(),
				!movie.getIsFavourite(),
				movie.getMovieName()
			);
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
			LOG.error(this.className, ENT_LOG_UPDATE_FAVOURITE_FAILED);
		}
	}

	// ── Utilities Functions used by HTML template ────────────────────────────
	/**
	 * Gets the human-readable quality label for a movie rate ("Excellent", "Good",
	 * "Average", or "Poor") by delegating to the shared utility method.
	 *
	 * @param rate - The numeric movie rate.
	 * @returns A quality label string.
	 */
	protected getRateLabel(rate: number): string {
		return Utilities.getMovieRateLabel(rate);
	}

	/**
	 * Gets the localized display label for a movie genre, keyed by its stored value.
	 *
	 * @param genre - The stored genre value (Chinese key).
	 * @returns The localized genre label, or the raw value if unmapped.
	 */
	protected genreLabel(genre: string): string {
		return resolveGenreLabel(genre);
	}

	/**
	 * Gets the pushpin colour for a corkboard category card, cycling through
	 * ENT_CORK_PIN_COLORS by card index.
	 *
	 * @param index - The zero-based position of the card in the category row.
	 * @returns A CSS colour string.
	 */
	protected getGenreColor(index: number): string {
		return ENT_CORK_PIN_COLORS[index % ENT_CORK_PIN_COLORS.length];
	}

	/**
	 * Gets the CSS rotation value for a corkboard category card, cycling through
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
		const values = Object.values(genre ?? {})
			.map(Number)
			.filter((n) => !isNaN(n));
		return values.length > 0 ? Math.max(...values) : 1;
	}

	/**
	 * Gets the background style for a category card. Inactive cards use a
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
	 * Gets the box-shadow style for a category card. Inactive cards get an
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
	 * Pushes the current search input text into the searchQuery$ stream, which
	 * triggers a re-filter of the filteredMovieList$ observable to only show
	 * movies whose name contains the search text.
	 *
	 * @param value - The current text value from the search input field.
	 */
	protected updateSearchQuery(value: string) {
		this.searchQuery$.next(value);
	}

	/**
	 * Gets the staggered entrance-animation delay for a movie card, capped so a
	 * long movie list doesn't leave the last cards waiting too long to appear.
	 *
	 * @param index - The zero-based position of the movie card in the list.
	 * @returns The animation delay in milliseconds.
	 */
	protected getMovieEntranceDelay(index: number): number {
		return Math.min(
			ENT_MOVIE_ENTRANCE_MAX_DELAY_MS,
			ENT_MOVIE_ENTRANCE_BASE_DELAY_MS + index * ENT_MOVIE_ENTRANCE_STEP_MS
		);
	}
}
