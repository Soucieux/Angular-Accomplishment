import { CloudbaseService } from '../service/backend-service/cloudbase/cloudbase.service';
import { SearchStreamService } from './../service/dialog-service/search/search-stream.service';
import {
	COMPONENT_DESTROY,
	RATE_DECREASED,
	RATE_INCREASED,
	SEARCH_CANCEL,
	SEARCH_COMPELTE,
	NO_RATE,
	Utilities,
	GENRE_FAVOURITE,
	CN
} from './../app.utilities';
import { MovieIdNotFoundError } from './../error/movie-id-not-found.error';
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
import { LOG } from '../app.logs';
import { DoubanService } from '../service/douban-service/douban.service';
import { FirebaseService } from '../service/backend-service/firebase/firebase.service';
import { MovieItemVO } from './entertainment.movieitem.vo';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatRippleModule } from '@angular/material/core';
import { DialogService } from '../service/dialog-service/dialog.service';
import { MovieAlreadyExistsError } from '../error/movie-already-exists-error';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
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
	// TODO This value has to be true initially so that the page will not show access denied page on refresh
	protected isLoggedIn!: boolean;
	protected isSearching: boolean = false;
	private sessionId: number = 0;
	protected movieList$!: Observable<MovieItemVO[]>;
	protected selectedGenres$ = new BehaviorSubject<string>('');
	protected filteredMovieList$!: Observable<MovieItemVO[]>;
	protected statistics$!: Observable<any>;
	private tempMovieItemVO!: MovieItemVO;
	private searchSummary!: Map<string, string[]>;
	protected editedItems = new Map<string, { original: string; genre: string }>();
	protected genres: { genre: string }[] = [
		{ genre: '刑侦' },
		{ genre: '古装' },
		{ genre: '悬疑' },
		{ genre: '校园' },
		{ genre: '现代' },
		{ genre: '谍战' }
	];
	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		private elRef: ElementRef<HTMLElement>,
		private renderer: Renderer2,
		private doubanService: DoubanService,
		private firebaseService: FirebaseService,
		private cloudbaseService: CloudbaseService,
		private dialogService: DialogService,
		protected utilities: Utilities,
		private searchStreamService: SearchStreamService
	) {
		if (isPlatformBrowser(this.platformId)) {
			this.isLoggedIn = JSON.parse(localStorage.getItem('permission') || 'false');
		}
	}

	/**
	 * Anything that needs to be done when the component is initialized.
	 */
	async ngOnInit() {
		// Server has to access this line as well. Without it, movieList$ will be empty and this component will be destoryed immediately.
		// Only logged in user can access the movie list
		if (isPlatformBrowser(this.platformId) && this.isLoggedIn) {
			// Get the movie list (Observable) and statistics (Observable) from firebase or cloudbase
			if (this.utilities.getCurrentRegion() === CN) {
				this.statistics$ = this.cloudbaseService.getStatistics();
			} else {
				this.statistics$ = this.firebaseService.getStatistics();
			}

			// One-time pre-check to make sure user have permission to read data in the database
			await firstValueFrom(this.statistics$.pipe(take(1)));
			// Below part will be executed only if there is no error reading data in the database
			if (this.utilities.getCurrentRegion() === CN) {
				this.movieList$ = this.cloudbaseService.getMovieList();
			} else {
				this.movieList$ = this.firebaseService.getMovieList();
			}
			// Create a filter to listen for genre changes
			this.filteredMovieList$ = combineLatest([this.movieList$, this.selectedGenres$]).pipe(
				map(([movieList, selectedGenres]) => {
					if (selectedGenres === '') {
						return movieList;
					}
					if (selectedGenres === GENRE_FAVOURITE) {
						return movieList.filter((movie) => movie.getIsFavourite());
					}
					return movieList.filter((movie) => movie.getMovieGenre().includes(selectedGenres));
				})
			);
		}
	}

	/**
	 * Anything that needs to be done when the component is destroyed.
	 */
	ngOnDestroy() {
		this.selectedGenres$.complete();
		this.dialogComponentContainer?.clear();
		this.isSearching = false;
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	public ngAfterViewChecked() {
		if (isPlatformBrowser(this.platformId) && this.isLoggedIn) {
			this.updateGridLayout();
		}
	}

	/**
	 * Update the grid layout of the page container when the window is resized.
	 */
	@HostListener('window:resize')
	protected onResize() {
		if (isPlatformBrowser(this.platformId) && this.isLoggedIn) {
			this.updateGridLayout();
		}
	}

	/**
	 * Update all movies' rate in the database.
	 *
	 * Only "Search" button can trigger this function.
	 * Only currently filtered movie will be updated.
	 */
	protected async updateAllMoviesRate() {
		// Step 1: Get the movie list (one-time retrieval) from current movieList$
		let movieListVOs = await firstValueFrom(this.filteredMovieList$);
		await this.firebaseService.updateHistoryWithNewSearchActivity();

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
					await this.firebaseService.updateMovieRateToFirebase(movieItemVO);
				}

				// If the search is cancelled, then break the loop.
				if (currentSessionId !== this.sessionId || !this.isSearching) {
					break;
				}
				// Otherwise, save movie name to corresponding array if movie rate changes.
				else if (this.searchStreamService.checkLastLogDecreasedOrIncreased() === RATE_DECREASED) {
					rateDecreasedArray?.push(movieItemVO.getMovieName());
				} else if (this.searchStreamService.checkLastLogDecreasedOrIncreased() === RATE_INCREASED) {
					rateIncreasedArray?.push(movieItemVO.getMovieName());
				}
				searchCount++;
			} catch (error) {
				LOG.error(
					this.className,
					`Error while updating movie rate for ${movieItemVO.getMovieName()}`,
					error as Error
				);
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
	 * Get the latest movie rate from Douban API with a given movie ID.
	 *
	 * @param movieItemVO - The movie item to search for.
	 * @param retrieveOtherData - false
	 * @param retrieveYearAndTitle - false
	 */
	private async getMovieRateOnly(movieItemVO: MovieItemVO) {
		// Latest rate can be retrieved only if the searching is still executing and there is no concurrent processes
		if (this.isSearching && movieItemVO.getSessionId() === this.sessionId) {
			await this.getMovieData(movieItemVO, false, false);
		}
	}

	/**
	 * Get the latest movie rate, first release date, total episode number, and movie cover image link.
	 *
	 * @param movieItemVO - The movie item to search for.
	 * @param retrieveOtherData - true
	 * @param retrieveYearAndTitle - false
	 */
	private async getNewMovieDataGivenYearAndTitle(movieItemVO: MovieItemVO) {
		await this.getMovieData(movieItemVO, true, false);
	}

	/**
	 * Get the latest movie rate, first release date, total episode number, and movie cover image link.
	 *
	 * @param movieItemVO - The movie item to search for.
	 * @param retrieveOtherData - true
	 * @param retrieveYearAndTitle - true
	 */
	private async getNewMovieDataGivenMovieId(movieItemVO: MovieItemVO) {
		await this.getMovieData(movieItemVO, true, true);
	}

	/**
	 * Invoke retrieve movie API to get required data
	 *
	 * @param movieId The movie Id to search for
	 * @returns A JSON object containing the required data & A boolean value whether it is from third-part API
	 */
	private async invokeRetrieveMovieApi(movieId: number) {
		let movieData = null;
		let movieDataWebpage = null;

		movieData = await firstValueFrom(this.doubanService.searchMovieByThirdPartyApi(movieId));
		if (!movieData) {
			movieDataWebpage = await firstValueFrom(this.doubanService.searchMovieByWebpage(movieId));
			return { movieWebpageAsData: movieDataWebpage, thirdPartyApi: false };
		}
		movieData = JSON.parse(movieData);
		return { movieWebpageAsData: movieData, thirdPartyApi: true };
	}

	/**
	 * Get the movie webpage from Douban API with a given movie ID.
	 * Then, get the movie rate, first release date, and total episode number, if the corresponding flag is true.
	 *
	 * @param movieItemVO - The movie item to search for.
	 * @param retrieveOtherData - Whether to retrieve movie cover image, first release date, and total episode number.
	 * @param retrieveYearAndTitle - Whether to retrieve movie year and title.
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
				const movieRate = movieWebpageAsData.match(regexForMovieRate)[1];
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
					firstReleaseDate = movieWebpageAsData.match(regexForFirstReleaseDate)[1];
				}

				firstReleaseDate = firstReleaseDate.substring(0, 10).replace(/-/g, '.');
				movieItemVO.setMovieFirstReleaseDate(firstReleaseDate);
				LOG.info(
					this.className,
					`First release date for ${movieItemVO.getMovieName()} is ${firstReleaseDate}`
				);

				// Step 4.1: Retrieve year and title if the flag is true
				if (retrieveYearAndTitle) {
					const year = firstReleaseDate.substring(0, 4);
					movieItemVO.setMovieYear(Number(year));

					let title = '';
					if (thirdPartyApi) {
						title = movieWebpageAsData['originalName'];
					} else {
						const regexForTitle = new RegExp('<meta property="og:title" content="(.*?)" />', 'i');
						title = movieWebpageAsData.match(regexForTitle)[1];
					}
					movieItemVO.setMovieName(title);
				}

				// Step 5: Get the total episode number for the current movie
				let episodeNumber = 0;
				if (thirdPartyApi) {
					episodeNumber = movieWebpageAsData['episodes'];
				} else {
					const regexForEpisodeNumber = new RegExp('<span class="pl">集数:</span> (.*?)<br/>', 'i');
					episodeNumber = movieWebpageAsData.match(regexForEpisodeNumber)[1];
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
					movieCoverImageLink = movieWebpageAsData.match(regexForCoverImageLink)[1];
				}
				await this.getMovieCoverImageByLink(movieCoverImageLink, movieItemVO);
			}
		} catch (error) {
			LOG.error(
				this.className,
				`Error while retrieving movie webpage for movie ${movieItemVO.getMovieName()}`,
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
	 * @param movieItemVO - The movie item to search for.
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
	 * Get and upload the movie cover obtained to firebase storage.
	 *
	 * @param movieCoverImageLink - The link of the movie cover.
	 * @param movieItemVO - The movie item to search for.
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
	 * Upload the movie cover to firebase and get the downloadable link.
	 *
	 * @param movieItemVO - The movie item to search for.
	 */
	private async uploadMovieImageAndGetDownloadableLink(movieItemVO: MovieItemVO) {
		try {
			const downloadableLink = await this.firebaseService.uploadImageAndGetDownloadLink(
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
	 * Calculate the font size of the movie name.
	 *
	 * @param length - The length of the movie name.
	 * @returns A string that represents the font size.
	 */
	protected calculateFontSize(length: number) {
		if (this.utilities.isMobile()) {
			return length <= 8 ? '18px' : String(18 - (length - 8) * 2 + 'px');
		}
		return length <= 9 ? '20px' : String(20 - (length - 8.5) * 2 + 'px');
	}

	/**
	 * Update the grid layout of the page container.
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

	//////////////////////Below are Event Handlers triggered by user actions///////////////////////
	/**
	 * Triggered by any genre button click event on the "Entertaiment" page
	 *
	 * @param genre genre to display
	 */
	public filterByGenre(genre: string) {
		const currentGenre = this.selectedGenres$.getValue();
		this.selectedGenres$.next(currentGenre === genre ? '' : genre);
	}

	/**
	 * Triggered by the "Search" button click event on the "Entertainment" page
	 */
	protected openSearchDialog() {
		this.dialogService.openDialog(this.dialogComponentContainer, 'search', this.cancelSearch.bind(this));
		this.updateAllMoviesRate();
	}

	/**
	 * Triggered by the "Stop" button click event on the "Search Dialog"
	 */
	private cancelSearch() {
		this.searchStreamService.addSearchLog('Search cancel requested');
		this.isSearching = false;
	}

	/**
	 * Triggered by the "Remove" button click event on the "Entertainment" page
	 *
	 * @param movieItemVO movie to be removed
	 */
	protected openDeleteConfirmationDialog(movieItemVO: MovieItemVO) {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			'confirm',
			() => {
				this.firebaseService.removeMovieFromDatabase(movieItemVO);
			},
			[
				`Are you sure you want to delete ${movieItemVO.getMovieName()}?`,
				'Delete Movie',
				'Delete',
				'Movie deleted',
				true
			]
		);
	}

	/**
	 * Triggered by the "Add" button click event on the "Entertainment" page
	 */
	protected openAddNewMovieDialog() {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			'add',
			// "Submit" button in the "Add New Movie" dialog
			this.handleAddDialogSubmit.bind(this),
			// "Search" button in the "Add New Movie" dialog
			this.handleAddDialogSearch.bind(this)
		);
	}

	/**
	 * Helper function to handle "Submit" button on the "Add New Movie" dialog.
	 */
	private async handleAddDialogSubmit() {
		// Upload movie cover image to firebase storage and generate downloadable link
		// The downloadable link needs to be acquired first and it will be uploaded to firebase in the next step
		await this.uploadMovieImageAndGetDownloadableLink(this.tempMovieItemVO);
		// Save new movie data to firebase and update movie statistics
		await this.firebaseService.addNewMovieDataAndUpdateStatistics(this.tempMovieItemVO);
		this.tempMovieItemVO = new MovieItemVO();
	}

	/**
	 * Helper function to handle "Search" button on the "Add New Movie" dialog.
	 *
	 * @param newMovieItemVO - New movie item to search for.
	 * @returns The movie cover image.
	 */
	private async handleAddDialogSearch(newMovieItemVO: MovieItemVO): Promise<Blob> {
		if (
			await this.firebaseService.isMovieAlreadyAdded(
				newMovieItemVO.getMovieName(),
				newMovieItemVO.getMovieYear(),
				newMovieItemVO.getMovieId()
			)
		) {
			throw new MovieAlreadyExistsError(newMovieItemVO.getMovieName());
		}
		await this.searchNewMovie(newMovieItemVO);
		this.tempMovieItemVO = newMovieItemVO;
		LOG.info(this.className, 'New movie details retrieved.');
		return newMovieItemVO.getMovieCoverImage();
	}

	/**
	 * Search movie data for a new movie, store it to firebase, and update the movie statistics.
	 *
	 * Only the "Search" button on the "Add New Movie" dialog can trigger this function.
	 *
	 * Either of the following conditions need to be met:
	 *
	 * 1. The movie ID is NOT given but title and year are given in the "Add New Movie" dialog.
	 * In this case, the movie ID will be searched first, if no movie ID is found, an error will be thrown.
	 * If the movie ID is found, then the movie details will be retrieved.
	 *
	 * 2. The movie ID is given but title and year are NOT given in the "Add New Movie" dialog.
	 * In this case, the movie details will be retrieved directly.
	 *
	 * @param newMovieItemVO - New movie item to search for.
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
	 * Triggered by the "History" button click event on the "Entertainment" page
	 */
	protected openHistoryDialog() {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			'history',
			async (movieToRestore: MovieItemVO) => {
				await this.handleAddDialogSearch(movieToRestore);
				await this.handleAddDialogSubmit();
			},
			this.utilities.getCurrentRegion() === CN
				? this.cloudbaseService.getHistory()
				: this.firebaseService.getHistory()
		);
	}

	/**
	 * Start editing a movie
	 *
	 * @param movie The selected movie
	 */
	protected startEdit(movie: MovieItemVO) {
		this.editedItems.set(movie.getMovieKey(), {
			original: movie.getMovieGenre(),
			genre: movie.getMovieGenre()
		});
	}

	/**
	 * Complete editing a movie
	 *
	 * @param movie The selected movie
	 */
	protected completeEdit(movie: MovieItemVO) {
		const genreData = this.editedItems.get(movie.getMovieKey());
		if (genreData) {
			if (genreData.original !== genreData.genre) {
				this.firebaseService.updateMovieGenreToFirebase(
					movie.getMovieKey(),
					genreData.original,
					genreData.genre
				);
			}
			this.editedItems.delete(movie.getMovieKey());
		}
	}

	/**
	 * Set favourite
	 *
	 * @param movie The movie to set
	 */
	protected setIsFavourite(movie: MovieItemVO) {
		this.firebaseService.updateMovieFavouriteToFirebase(movie.getMovieKey(), !movie.getIsFavourite());
	}
}
