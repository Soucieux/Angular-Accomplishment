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
import { firstValueFrom, Observable, timer, BehaviorSubject, combineLatest, map } from 'rxjs';
import { LOG } from '../log';
import { DoubanService } from '../douban-service/douban.service';
import { FirebaseService } from '../firebase-service/firebase.service';
import { MovieItemVO } from './movie.item.vo';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatRippleModule } from '@angular/material/core';
import { DialogService } from '../dialog-service/dialog.service';
import { MovieAlreadyExistsError } from '../error/movie-already-exists-error';
@Component({
	selector: 'entertainment',
	standalone: true,
	imports: [CommonModule, MatIconModule, MatButtonModule, MatButtonToggleModule, MatRippleModule],
	templateUrl: './entertainment.component.html',
	styleUrl: './entertainment.component.css'
})
export class EntertainmentComponent {
	private readonly className = 'EntertainmentComponent';
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is assigned to ViewContainerRef (a predefined keyword) automatically after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	// This value has to be true initially so that the page will not show access denied page on refresh
	protected isLoggedIn: boolean = true;
	protected isSearching: boolean = false;
	private contentContainer!: any;
	protected movieList$!: Observable<MovieItemVO[]>;
	protected selectedGenres$ = new BehaviorSubject<string>('');
	protected filteredMovieList$!: Observable<MovieItemVO[]>;
	protected statistics$!: Observable<any>;
	private tempMovieItemVO!: MovieItemVO;
	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		private elRef: ElementRef,
		private renderer: Renderer2,
		private doubanService: DoubanService,
		private firebaseService: FirebaseService,
		private dialogService: DialogService
	) {
		// Server has to access this line as well. Without it, movieList$ will be empty and this component will be destoryed immediately.
		// Only logged in user can access the movie list
		if (isPlatformBrowser(this.platformId) && this.isLoggedIn) {
			// Get the movie list (Observable) and statistics (Observable) from firebase
			this.movieList$ = this.firebaseService.getMovieList();
			this.statistics$ = this.firebaseService.getStatistics();
			// Create a filter to listen for genre changes
			this.filteredMovieList$ = combineLatest([this.movieList$, this.selectedGenres$]).pipe(
				map(([movieList, selectedGenres]) => {
					if (selectedGenres === '') {
						return movieList;
					}
					return movieList.filter((movie) => movie.getMovieGenre().includes(selectedGenres));
				})
			);
			// TODO: If the user is not logged in, and you set the read access on firebase to any,
			// then this line has to commented out as isLoggedIn will never be stored when the user is not logged in.
			this.isLoggedIn = JSON.parse(localStorage.getItem('isLoggedIn') || 'null');
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
	 * Update all movies' rate in the database.
	 *
	 * Only "Search" button can trigger this function.
	 * Only currently filtered movie will be updated.
	 */
	protected async updateAllMoviesRate() {
		// Step 1: Get the movie list (one-time retrieval) from current movieList$
		let movieListVOs = await firstValueFrom(this.filteredMovieList$);
		this.isSearching = true;

		// Step 2: Loop through the movieList to get latest movie details
		for (let movieItemVO of movieListVOs) {
			// If the search is cancelled, then break the loop.
			if (!this.isSearching) {
				LOG.warn(this.className, 'Search cancelled');
				break;
			}

			LOG.info(this.className, `Start searching for ${movieItemVO.getMovieTitle()}`);

			// Step 3: Delay 2 seconds for every movie
			await firstValueFrom(timer(2000));

			try {
				// Step 4: Get movie rate
				await this.getMovieRateOnly(movieItemVO);
				// Step 5: Update movie rate
				await this.firebaseService.updateMovieRateToFirebase(movieItemVO);
			} catch (error) {
				LOG.error(
					this.className,
					`Error while updating movie rate for ${movieItemVO.getMovieTitle()}`,
					error as Error
				);
			}
		}
		LOG.info(this.className, 'Searching completes');
	}

	/**
	 * Get the latest movie rate from Douban API with a given movie ID.
	 *
	 * @param movieItemVO - The movie item to search for.
	 * @param retrieveOtherData - false
	 */
	private async getMovieRateOnly(movieItemVO: MovieItemVO) {
		await this.getMovieData(movieItemVO, false);
	}

	/**
	 * Get the latest movie rate, first release date, total episode number, and movie cover image link.
	 *
	 * @param movieItemVO - The movie item to search for.
	 * @param retrieveOtherData - true
	 */
	private async getNewMovieData(movieItemVO: MovieItemVO) {
		await this.getMovieData(movieItemVO, true);
	}

	/**
	 * Get the movie webpage from Douban API with a given movie ID.
	 * Then, get the movie rate, first release date, and total episode number, if the corresponding flag is true.
	 *
	 * @param movieItemVO - The movie item to search for.
	 * @param retrieveOtherData - Whether to retrieve movie cover image, first release date, and total episode number.
	 */
	private async getMovieData(movieItemVO: MovieItemVO, retrieveOtherData: boolean) {
		try {
			// Step 1: Get the movie webpage as text
			const movieWebpageAsString = await firstValueFrom(
				this.doubanService.searchMovieWebpage(movieItemVO.getMovieId())
			);

			// Step 2: Get the latest movie rate for the current movie
			const regexForMovieRate = new RegExp(
				'<strong class="ll rating_num" property="v:average">(.*?)</strong>',
				'i'
			);
			const movieRate = movieWebpageAsString.match(regexForMovieRate)[1];
			movieItemVO.setMovieRate(movieRate);
			LOG.info(
				this.className,
				`Movie rate retrieved for ${movieItemVO.getMovieTitle()} is ${movieRate}`
			);

			// Step 3: Retrieve other data if the flag is true
			if (retrieveOtherData) {
				// Step 4: Get the first release date for the current movie
				const regexForFirstReleaseDate = new RegExp(
					'<span class="pl">首播:</span> <span property="v:initialReleaseDate" content="(.*?)">(.*?)</span><br/>',
					'i'
				);
				let firstReleaseDate = movieWebpageAsString.match(regexForFirstReleaseDate)[1];
				firstReleaseDate = firstReleaseDate.substring(0, 10).replace(/-/g, '.');
				movieItemVO.setMovieFirstReleaseDate(firstReleaseDate);
				LOG.info(
					this.className,
					`First release date for ${movieItemVO.getMovieTitle()} is ${firstReleaseDate}`
				);

				// Step 5: Get the total episode number for the current movie
				const regexForEpisodeNumber = new RegExp('<span class="pl">集数:</span> (.*?)<br/>', 'i');
				const episodeNumber = movieWebpageAsString.match(regexForEpisodeNumber)[1];
				movieItemVO.setMovieEpisodeNumber(episodeNumber);
				LOG.info(
					this.className,
					`Total episode number for ${movieItemVO.getMovieTitle()} is ${episodeNumber}`
				);

				// Step 6: Get the movie cover for the current movie and upload it to firebase storage
				const regexForCoverImageLink = new RegExp('<img class="media" src="(.*?)" />', 'i');
				const movieCoverImageLink = movieWebpageAsString.match(regexForCoverImageLink)[1];
				await this.getMovieCoverImageByLink(movieCoverImageLink, movieItemVO);
			}
		} catch (error) {
			LOG.error(
				this.className,
				`Error while retrieving movie webpage for movie ${movieItemVO.getMovieTitle()}`,
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
		try {
			EntertainmentComponent.checkMovieItemVO(movieItemVO);
			// Step 1: searchMovie returns a Promise and wait for the retrieval to complete
			const extractedData = await firstValueFrom(
				this.doubanService.searchMovieJSON(movieItemVO.getMovieTitle())
			);
			// Step 2: If empty data is received, it means the API is not responding due to too many requests.
			if (extractedData == null || extractedData.length === 0) {
				LOG.warn(this.className, 'API responded with empty data due to too many requests');
				// throw the error to let the calling method knows that the movie ID cannot be retrieved at this time.
				throw new MovieIdNotFoundError(movieItemVO.getMovieTitle());
			} else {
				// Step 2: If data is received, then loop through the extracted data to get the correct movie ID
				// as the result is retrieved by regex.
				for (const movieData of extractedData) {
					//This means that NEW movie must have title and year
					// Movie name and year must be exactly the same
					if (
						movieData.title === movieItemVO.getMovieTitle() &&
						movieData.year == movieItemVO.getMovieYear()
					) {
						// Step 3: Set the movie ID to the movie item VO
						movieItemVO.setMovieId(movieData.id);
						LOG.info(
							this.className,
							`Movie ID retrieved for ${movieItemVO.getMovieTitle()} with ID ${movieData.id}`
						);
					}
				}
			}
		} catch (error) {
			LOG.error(
				this.className,
				`Error while retrieving movie ID for ${movieItemVO.getMovieTitle()}`,
				error as Error
			);
			throw error;
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
				this.doubanService.searchMovieCover(movieCoverImageLink, movieItemVO.getMovieTitle())
			);
			movieItemVO.setMovieCoverImage(movieCoverImage);
			LOG.info(this.className, `Movie cover retrieved for ${movieItemVO.getMovieTitle()}`);
		} catch (error) {
			LOG.error(
				this.className,
				`Error while retrieving movie cover for ${movieItemVO.getMovieTitle()} from Douban`,
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
				movieItemVO.getMovieTitle()
			);
			movieItemVO.setMovieCoverImageDownloadableLink(downloadableLink);
			LOG.info(this.className, `Movie cover uploaded for ${movieItemVO.getMovieTitle()}`);
		} catch (error) {
			LOG.error(
				this.className,
				`Error while uploading image to firebase or getting download link for ${movieItemVO.getMovieTitle()}`,
				error as Error
			);
			throw error;
		}
	}

	//////////////////////Below are Utilities Functions used by HTML template///////////////////////
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
	 * @param contentContainer - The page container to update the grid layout.
	 */
	private updateGridLayout(contentContainer: any) {
		// Get item width from css
		const itemsWidth = getComputedStyle(contentContainer).getPropertyValue('--individual-item-width');
		const itemsGap = getComputedStyle(contentContainer).getPropertyValue('--individual-item-gap');

		if (contentContainer) {
			let componentWidth = (contentContainer as HTMLElement).clientWidth;
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

	//////////////////////Below are Event Handlers triggered by user actions///////////////////////
	/**
	 * Triggered by the "Cancel Search" button click event on the "Entertainment" page
	 */
	protected cancelSearch() {
		LOG.warn(this.className, 'Search cancel requested');
		this.isSearching = false;
	}

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
	 * Triggered by the "Remove" button click event on the "Entertainment" page
	 *
	 * @param movieItemVO movie to be removed
	 */
	protected openDeleteConfirmationDialog(movieItemVO: MovieItemVO) {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			'delete',
			`Are you sure you want to delete ${movieItemVO.getMovieTitle()}?`,
			() => {
				this.firebaseService.removeMovieFromDatabase(movieItemVO);
			}
		);
	}

	/**
	 * Triggered by the "Add" button click event on the "Entertainment" page
	 */
	protected openAddNewMovieDialog() {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			'add',
			'',
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
	}

	/**
	 * Helper functino to handle "Search" button on the "Add New Movie" dialog.
	 *
	 * @param newMovieItemVO - New movie item to search for.
	 * @returns The movie cover image.
	 */
	private async handleAddDialogSearch(newMovieItemVO: MovieItemVO): Promise<Blob> {
		if (await this.firebaseService.isMovieAlreadyAdded(newMovieItemVO.getMovieTitle())) {
			throw new MovieAlreadyExistsError(newMovieItemVO.getMovieTitle());
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
	 * @param newMovieItemVO - New movie item to search for.
	 */
	private async searchNewMovie(newMovieItemVO: MovieItemVO) {
		// Step 1: If the movie ID is not entered in the "Add New Movie" dialog, then search for the movie ID first.
		if (newMovieItemVO.getMovieId() === -1) {
			LOG.info(this.className, `Movie ID not given, start searching for it.`);
			await this.getMovieId(newMovieItemVO);
		}
		// Step 2 : After successful retrieval of movie ID or movie ID is already given, get all the movie details.
		await this.getNewMovieData(newMovieItemVO);
	}

	/**
	 * Triggered by the "History" button click event on the "Entertainment" page
	 */
	protected openHistoryDialog() {
		this.dialogService.openDialog(this.dialogComponentContainer, 'history', '', () => {});
	}

	////////////////////////////////Below are Helper Functions////////////////////////////////
	/**
	 * Check if the current device is a mobile device.
	 * Note: This only works for iPhone 16 Pro or other devices with a width of 430px.
	 *
	 * @returns A boolean value that indicates if the current device is a mobile device.
	 */
	private isMobile() {
		return window.innerWidth <= 430;
	}

	/**
	 * Check if the movie item is valid.
	 *
	 * @param movieItemVO - The movie item to check.
	 */
	private static checkMovieItemVO(movieItemVO: MovieItemVO) {
		if (movieItemVO.getMovieTitle() === '' || movieItemVO.getMovieYear() === -1) {
			throw new Error('Movie item VO is invalid');
		}
	}
}
