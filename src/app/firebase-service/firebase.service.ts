import {
	EnvironmentInjector,
	inject,
	Inject,
	Injectable,
	Injector,
	runInInjectionContext
} from '@angular/core';
import { Storage, ref as storageRef, getDownloadURL, uploadBytes, deleteObject } from '@angular/fire/storage';
import { LOG } from '../log';
import {
	Database,
	ref as dbRef,
	list,
	onValue,
	runTransaction,
	update,
	remove,
	get
} from '@angular/fire/database';
import { map, Observable } from 'rxjs';
import { MovieItemVO } from '../entertainment/movie.item.vo';

@Injectable({
	providedIn: 'root'
})
export class FirebaseService {
	private readonly className = 'FirebaseService';
	private moviesRef!: any;
	private statisticsRef!: any;

	constructor(
		@Inject(Storage) private storage: Storage,
		@Inject(Database) private db: Database,
		@Inject(EnvironmentInjector) private ei: EnvironmentInjector
	) {
		this.moviesRef = dbRef(this.db, 'movies');
		this.statisticsRef = dbRef(this.db, 'statistics');
	}

	/**
	 * Upload the movie cover to firebase storage and return the downloadable link.
	 *
	 * @param coverImage - The movie cover to upload.
	 * @param movieName - The name of the movie to upload.
	 * @returns A string that represents the downloadable link of the movie cover.
	 */
	public async uploadImageAndGetDownloadLink(coverImage: Blob, movieName: string): Promise<string> {
		try {
			const storageRefer = storageRef(this.storage, `/movies/${movieName}`);
			await uploadBytes(storageRefer, coverImage, {
				contentType: 'image/jpeg'
			});
			return await getDownloadURL(storageRefer);
		} catch (error) {
			LOG.error(
				this.className,
				`Error while uploading image to firebase or getting download link for ${movieName}`,
				error as Error
			);
			return '';
		}
	}

	/**
	 * Get the movie list from firebase.
	 *
	 * @returns An observable that emits the movie list.
	 */
	public getMovieList(): Observable<MovieItemVO[]> {
		const list$ = list(this.moviesRef).pipe(
			map((snapshots: any[]) =>
				snapshots.map((snapshot: any) => {
					const movie = snapshot.snapshot.val();
					const movieItemVO = new MovieItemVO(movie.title, Number(movie.year));
					movieItemVO.setMovieKey(snapshot.snapshot.key);
					movieItemVO.setMovieId(movie.id);
					movieItemVO.setMovieGenre(movie.genre);
					movieItemVO.setMovieRate(movie.rate);
					movieItemVO.setMovieCoverImageDownloadableLink(movie.coverImageLink);
					movieItemVO.setMovieFirstReleaseDate(movie.firstReleaseDate);
					movieItemVO.setMovieEpisodeNumber(movie.episodeNumber);
					return movieItemVO;
				})
			)
		);

		// Sort movies by first release date
		// Note: By using this method, make sure the first release date has the format of YYYY.MM.DD
		return list$.pipe(
			map((movies) =>
				movies.sort((a, b) =>
					a.getMovieFirstReleaseDate().localeCompare(b.getMovieFirstReleaseDate())
				)
			)
		);
	}

	/**
	 * Get the statistics from firebase.
	 *
	 * @returns An observable that emits the statistics.
	 */
	public getStatistics(): Observable<any> {
		return new Observable((observer) => {
			runInInjectionContext(this.ei, () => {
				onValue(this.statisticsRef, (snapshot) => {
					observer.next(snapshot.val());
				});
			});
		});
	}

	/**
	 * Update the movie rate to firebase.
	 *
	 * @param movieItemVO - The movie item to update.
	 */
	public async updateMovieRateToFirebase(movieItemVO: MovieItemVO) {
		await update(dbRef(this.db, `movies/${movieItemVO.getMovieKey()}`), {
			rate: movieItemVO.getMovieRate()
		}).then(() => {
			LOG.info(this.className, `Movie rate for ${movieItemVO.getMovieTitle()} has been updated`);
		});
	}

	/**
	 * Update all movie data and statistics to firebase.
	 *
	 * @param movieItemVO - The movie item to update.
	 */
	public async addNewMovieDataAndUpdateStatistics(movieItemVO: MovieItemVO) {
		// Get the reusable keys
		const keys = await this.getReusableKeys();
		let movieKey: string;

		if (keys.length > 0) {
			movieKey = keys.shift()!; // Take the first reusable key
			await this.saveReusableKeys(keys); // Update the reusable keys
		} else {
			const snapshot = await get(this.moviesRef);
			movieKey = (Object.keys(snapshot.val()).length + 1).toString();
		}

		// Update the movie statistics
		await runTransaction(dbRef(this.db, `statistics`), (currentData) => {
			currentData.genre[movieItemVO.getMovieGenre()] =
				(currentData.genre[movieItemVO.getMovieGenre()] ?? 0) + 1;
			currentData.totalNumber = (currentData.totalNumber ?? 0) + 1;
			return currentData;
		}).then(() => {
			LOG.info(this.className, `Movie statistics has been updated`);
		});

		// Add new movie data
		await update(dbRef(this.db, `movies/${movieKey}`), {
			title: movieItemVO.getMovieTitle(),
			year: movieItemVO.getMovieYear(),
			genre: movieItemVO.getMovieGenre(),
			rate: movieItemVO.getMovieRate(),
			id: movieItemVO.getMovieId(),
			coverImageLink: movieItemVO.getMovieCoverImageDownloadableLink(),
			firstReleaseDate: movieItemVO.getMovieFirstReleaseDate(),
			episodeNumber: movieItemVO.getMovieEpisodeNumber()
		}).then(() => {
			LOG.info(this.className, `Movie details for ${movieItemVO.getMovieTitle()} has been updated`);
		});
	}

	/**
	 * Remove the movie from the database.
	 *
	 * @param movieItemVO - The movie item to remove.
	 */
	public async removeMovieFromDatabase(movieItemVO: MovieItemVO) {
		try {
			// Remove the movie cover from the storage
			const storageRefer = storageRef(this.storage, `/movies/${movieItemVO.getMovieTitle()}`);
			await deleteObject(storageRefer);

			// Remove the movie info from the database
			await remove(dbRef(this.db, `movies/${movieItemVO.getMovieKey()}`));

			// Save the movie key to the reusable keys array for later use
			const keys = await this.getReusableKeys();
			keys.push(movieItemVO.getMovieKey());
			await this.saveReusableKeys(keys);

			LOG.info(this.className, `${movieItemVO.getMovieTitle()} has been DELETED from the database`);

			// Update the movie statistics
			await runTransaction(dbRef(this.db, `statistics`), (currentData) => {
				currentData.genre[movieItemVO.getMovieGenre()] =
					currentData.genre[movieItemVO.getMovieGenre()] - 1 > 0
						? currentData.genre[movieItemVO.getMovieGenre()] - 1
						: 0;
				currentData.totalNumber = currentData.totalNumber - 1 > 0 ? currentData.totalNumber - 1 : 0;
				return currentData;
			}).then(() => {
				LOG.info(this.className, `Movie statistics has been updated`);
			});
		} catch (error) {
			LOG.error(
				this.className,
				`Error while deleting movie from database for ${movieItemVO.getMovieTitle()}`,
				error as Error
			);
		}
	}

	/**
	 * Get the reusable keys from the database.
	 *
	 * @returns An array of reusable keys.
	 */
	private async getReusableKeys(): Promise<string[]> {
		try {
			const snapshot = await get(dbRef(this.db, 'reusableKeys'));
			return snapshot.exists() ? Object.values(snapshot.val()) : [];
		} catch (error) {
			LOG.error(this.className, `Error while getting reusable keys`, error as Error);
			return [];
		}
	}

	/**
	 * Save the reusable keys to the database.
	 *
	 * @param keys - The keys to save.
	 */
	private async saveReusableKeys(keys: string[]) {
		await update(dbRef(this.db), { reusableKeys: keys }).then(() => {
			LOG.info(this.className, `Reusable keys have been updated`);
		});
	}
}
