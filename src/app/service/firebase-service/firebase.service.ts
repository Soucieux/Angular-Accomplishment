import {
	FIRST_TABLE,
	GENRE_FAVOURITE,
	NO_RATE,
	SECOND_TABLE,
	THIRD_TABLE,
	Utilities
} from './../../app.utilities';
import { SearchStreamService } from './../dialog-service/search/search-stream.service';
import { EnvironmentInjector, Inject, Injectable, runInInjectionContext } from '@angular/core';
import { Storage, ref as storageRef, getDownloadURL, uploadBytes, deleteObject } from '@angular/fire/storage';
import { LOG } from '../../app.logs';
import {
	Database,
	ref as dbRef,
	list,
	onValue,
	runTransaction,
	update,
	remove,
	get,
	push
} from '@angular/fire/database';
import { Observable, map } from 'rxjs';
import { MovieItemVO } from '../../entertainment/entertainment.movieitem.vo';
import { RATE_DECREASED, RATE_INCREASED } from '../../app.utilities';

@Injectable({
	providedIn: 'root'
})
export class FirebaseService {
	private readonly className = 'FirebaseService';
	private moviesRef: any;
	private statisticsRef: any;

	constructor(
		@Inject(Storage) private storage: Storage,
		@Inject(Database) private db: Database,
		@Inject(EnvironmentInjector) private ei: EnvironmentInjector,
		private searchStreamService: SearchStreamService,
		private Utilities: Utilities
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
			LOG.info(this.className, `Movie cover image uploaded`);
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
		return runInInjectionContext(this.ei, () =>
			list(this.moviesRef).pipe(
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
						movieItemVO.setIsFavourite(movie.isFavourite);
						movieItemVO.setDescription(movie.description);
						movieItemVO.setActors(movie.actors);
						return movieItemVO;
					})
				),
				map((movies) =>
					// Sort movies by first release date
					// Note: By using this method, make sure the first release date has the format of YYYY.MM.DD
					movies.sort((a, b) =>
						a.getMovieFirstReleaseDate().localeCompare(b.getMovieFirstReleaseDate())
					)
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
	 * Add new entry to history stating that a new search activity has been initialized
	 */
	public async updateHistoryWithNewSearchActivity() {
		await this.updateHistory('search');
	}

	/**
	 * Update the movie rate to firebase.
	 *
	 * @param movieItemVO - The movie item to update.
	 */
	public async updateMovieRateToFirebase(movieItemVO: MovieItemVO) {
		// Step 1 : Gather necessary info
		const movieRef = dbRef(this.db, `movies/${movieItemVO.getMovieKey()}`);
		const snapshot = await get(movieRef);
		const oldRate = snapshot.exists() ? snapshot.val().rate : undefined;

		// Step 2 : Compare latest rate with the one stored in the database
		if (oldRate !== undefined && oldRate !== movieItemVO.getMovieRate()) {
			await update(movieRef, {
				rate: movieItemVO.getMovieRate()
			}).then(() => {
				const rateDifference = Number((movieItemVO.getMovieRate() - oldRate).toFixed(2));
				this.searchStreamService.addSearchLog(
					`The rate of ${movieItemVO.getMovieName()} is <span ${
						rateDifference > 0 ? 'class="rate-up"' : 'class="rate-down"'
					}>${rateDifference > 0 ? RATE_INCREASED : RATE_DECREASED} by ${Math.abs(
						rateDifference
					)}</span> to ${movieItemVO.getMovieRate()}`
				);
			});
		} else {
			this.searchStreamService.addSearchLog(`The rate of ${movieItemVO.getMovieName()} stays the same`);
		}
	}

	public async updateMovieGenreToFirebase(movieKey: string, oldGenre: string, newGenre: string) {
		const movieRef = dbRef(this.db, `movies/${movieKey}`);

		// Step 1 : Update movie genre
		await update(movieRef, {
			genre: newGenre
		}).then(() => {
			LOG.info(this.className, `Movie genre has been updated`);
		});

		// Step 2 : Update movie statistics
		await runTransaction(dbRef(this.db, `statistics`), (currentData) => {
			currentData.genre[oldGenre] = currentData.genre[oldGenre] - 1;
			currentData.genre[newGenre] = (currentData.genre[newGenre] ?? 0) + 1;;
			return currentData;
		}).then(() => {
			LOG.info(this.className, `Movie statistics have been updated`);
		});
	}

	/**
	 * Update all movie data and statistics to firebase.
	 *
	 * @param movieItemVO - The movie item to update.
	 */
	public async addNewMovieDataAndUpdateStatistics(movieItemVO: MovieItemVO) {
		try {
			// Get reusable keys for movies
			const keys = await this.getReusableKeys();
			let movieKey: string;

			if (keys.length > 0) {
				movieKey = keys.shift()!; // Take the first reusable key
				await this.saveReusableKeys(keys); // Update the reusable keys
			} else {
				const snapshot = await get(this.moviesRef);
				movieKey = (Object.keys(snapshot.val()).length + 1).toString();
			}

			// Add new movie data
			await update(dbRef(this.db, `movies/${movieKey}`), {
				title: movieItemVO.getMovieName(),
				year: movieItemVO.getMovieYear(),
				genre: movieItemVO.getMovieGenre(),
				rate: movieItemVO.getMovieRate(),
				id: movieItemVO.getMovieId(),
				coverImageLink: movieItemVO.getMovieCoverImageDownloadableLink(),
				firstReleaseDate: movieItemVO.getMovieFirstReleaseDate(),
				episodeNumber: movieItemVO.getMovieEpisodeNumber(),
				isFavourite: movieItemVO.getIsFavourite(),
				description: movieItemVO.getDescription(),
				actors: movieItemVO.getActors()
			}).then(async () => {
				// Add new entry to history
				await this.updateHistory('added', movieItemVO);
			});

			// Update the movie statistics
			await runTransaction(dbRef(this.db, `statistics`), (currentData) => {
				currentData.genre[movieItemVO.getMovieGenre()] =
					(currentData.genre[movieItemVO.getMovieGenre()] ?? 0) + 1;
				if (movieItemVO.getIsFavourite()) {
					currentData.genre[GENRE_FAVOURITE] = (currentData.genre[GENRE_FAVOURITE] ?? 0) + 1;
				}

				currentData.totalNumber = (currentData.totalNumber ?? 0) + 1;
				return currentData;
			}).then(() => {
				LOG.info(this.className, `Movie added and statistics have been updated`);
			});
		} catch (error) {
			LOG.error(
				this.className,
				`Error while adding new movie data for ${movieItemVO.getMovieName()}`,
				error as Error
			);
		}
	}

	/**
	 * Remove the movie from the database.
	 *
	 * @param movieItemVO - The movie item to remove.
	 */
	public async removeMovieFromDatabase(movieItemVO: MovieItemVO) {
		try {
			// Remove the movie cover from the storage
			const storageRefer = storageRef(this.storage, `/movies/${movieItemVO.getMovieName()}`);
			await deleteObject(storageRefer);

			// Remove the movie info from the database
			await remove(dbRef(this.db, `movies/${movieItemVO.getMovieKey()}`));

			// Add new entry to history
			await this.updateHistory('deleted', movieItemVO);

			// Save the movie key to the reusable keys array for later use
			const keys = await this.getReusableKeys();
			keys.push(movieItemVO.getMovieKey());
			await this.saveReusableKeys(keys);

			// Update the movie statistics
			await runTransaction(dbRef(this.db, `statistics`), (currentData) => {
				currentData.genre[movieItemVO.getMovieGenre()] =
					currentData.genre[movieItemVO.getMovieGenre()] - 1 > 0
						? currentData.genre[movieItemVO.getMovieGenre()] - 1
						: 0;
				if (movieItemVO.getIsFavourite()) {
					currentData.genre[GENRE_FAVOURITE] =
						currentData.genre[GENRE_FAVOURITE] - 1 > 0
							? currentData.genre[GENRE_FAVOURITE] - 1
							: 0;
				}
				currentData.totalNumber = currentData.totalNumber - 1 > 0 ? currentData.totalNumber - 1 : 0;
				return currentData;
			}).then(() => {
				LOG.info(this.className, `Movie removed and statistics have been updated`);
			});
		} catch (error) {
			LOG.error(
				this.className,
				`Error while deleting movie from database for ${movieItemVO.getMovieName()}`,
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
			const snapshot = await get(dbRef(this.db, 'statistics/reusableKeys'));
			LOG.info(this.className, `Reusable keys retrieved`);
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
		await update(dbRef(this.db, 'statistics'), { reusableKeys: keys }).then(() => {
			LOG.info(this.className, `Reusable keys have been updated`);
		});
	}

	/**
	 * Check if a given movie has already been added in the databse
	 *
	 * @param movieName Movie name to check
	 * @param movieYear Movie year to check
	 * @param movieId Movie ID to check
	 * @returns true if the movie already exists, otherwise, false.
	 */
	public async isMovieAlreadyAdded(
		movieName: string,
		movieYear: number,
		movieId: number
	): Promise<boolean> {
		try {
			const snapshot = await runInInjectionContext(this.ei, () => get(this.moviesRef));
			const allMovies = snapshot.val();
			for (const key of Object.keys(allMovies)) {
				const movie = allMovies[key];
				if ((movie.title === movieName && movie.year === movieYear) || movie.id === movieId) {
					return true;
				}
			}
			return false;
		} catch (error) {
			LOG.error(
				this.className,
				`Error while checking if current movie exists in the database for movie ${movieName}`,
				error as Error
			);
			return false;
		}
	}

	/**
	 * Update history with new activity
	 *
	 * @param status - The status of the activity.
	 * @param movieItemVO - The movie item to update.
	 */
	private async updateHistory(status: string, movieItemVO?: MovieItemVO) {
		if (movieItemVO) {
			await push(dbRef(this.db, 'history'), {
				id: movieItemVO.getMovieId(),
				status: status,
				message: `${movieItemVO.getMovieName()} - ${movieItemVO.getMovieGenre()} (Rate: ${
					movieItemVO.getMovieRate() == 0 ? NO_RATE : movieItemVO.getMovieRate()
				}) was ${status} on ${this.Utilities.getCurrentFormattedTime(true)}`
			}).then(() => {
				LOG.info(this.className, 'New history entry has been added');
			});
		} else {
			await push(dbRef(this.db, 'history'), {
				status: status,
				message: `New rate search was started on ${this.Utilities.getCurrentFormattedTime(true)}`
			}).then(() => {
				LOG.info(this.className, 'New history entry has been added');
			});
		}
	}

	/**
	 * Retrieve history list
	 *
	 * @returns The history list
	 */
	public getHistory(): Observable<any[]> {
		return runInInjectionContext(this.ei, () =>
			list(dbRef(this.db, 'history')).pipe(
				map((snapshots: any[]) =>
					snapshots
						.map((snapshot: any) => ({
							key: snapshot.snapshot.key,
							...snapshot.snapshot.val()
						}))
						.reverse()
				)
			)
		);
	}

	/**
	 * Add new record to patch notes
	 *
	 * @param newRecord - The record to add.
	 */
	public async addNewRecordToPatchNotes(newRecord: any) {
		await push(dbRef(this.db, 'patch_notes'), {
			component: this.Utilities.capitalizeFirstLetterOnEachWord(newRecord.component),
			element: this.Utilities.capitalizeFirstLetterWithOthersUnchanged(newRecord.element.trim()),
			details: this.Utilities.capitalizeFirstLetterWithOthersUnchanged(newRecord.details.trim()),
			status: newRecord.status,
			timestamp: newRecord.timestamp,
			isBug: newRecord.isBug
		}).then(() => {
			LOG.info(this.className, 'New patch notes record has been added');
		});
	}

	/**
	 * Update existing record to patch notes
	 *
	 * @param key - The key associated with the record
	 * @param updatedRecord - The record to update.
	 */
	public async updateExistingRecordToPatchNotes(key: string, updatedRecord: any) {
		await update(dbRef(this.db, `patch_notes/${key}`), {
			...updatedRecord
		}).then(() => {
			LOG.info(this.className, 'Patch notes record has been updated');
		});
	}

	/**
	 * Get patch notes
	 *
	 * @returns Patch notes
	 */
	public getPatchNotes(): Observable<any[]> {
		return runInInjectionContext(this.ei, () =>
			list(dbRef(this.db, 'patch_notes')).pipe(
				map((snapshots: any[]) =>
					snapshots
						.map(
							(snapshot: any) =>
								({
									key: snapshot.snapshot.key,
									...snapshot.snapshot.val()
								} as {
									key: string;
									component: string;
									element: string;
									details: string;
									status: string;
									timestamp: string;
									isBug: boolean;
								})
						)
						.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
				)
			)
		);
	}

	/**
	 * Remove record from patch notes
	 *
	 * @param key - The key associated with the record
	 */
	public async removePatchNotes(key: string) {
		return remove(dbRef(this.db, `patch_notes/${key}`)).then(() => {
			LOG.info(this.className, 'Patch notes record has been removed');
		});
	}

	/**
	 * Get remainder table details
	 *
	 * @returns Remainder table details
	 */
	public getFirstRemainderTableDetails(): Observable<any[]> {
		return new Observable((observer) => {
			runInInjectionContext(this.ei, () => {
				onValue(dbRef(this.db, `remainder/${FIRST_TABLE}`), (snapshot) => {
					const data = snapshot.val();
					observer.next(data ? Object.values(data) : []);
				});
			});
		});
	}

	/**
	 * Get third remainder table details
	 *
	 * @returns Third remainder table details
	 */
	public getSecondRemainderTableDetails(): Observable<any[]> {
		return runInInjectionContext(this.ei, () =>
			list(dbRef(this.db, `remainder/${SECOND_TABLE}`)).pipe(
				map((snapshots: any[]) =>
					snapshots.map((snapshot: any) => {
						return {
							key: snapshot.snapshot.key,
							...snapshot.snapshot.val()
						} as {
							key: string;
							name: string;
							content: {
								date: string;
								debt: number;
								original: number;
								paid: boolean;
							};
						};
					})
				)
			)
		);
	}

	/**
	 * Get third remainder table details
	 *
	 * @returns Third remainder table details
	 */
	public getThirdRemainderTableDetails(): Observable<any[]> {
		return runInInjectionContext(this.ei, () =>
			list(dbRef(this.db, `remainder/${THIRD_TABLE}`)).pipe(
				map((snapshots: any[]) =>
					snapshots.map((snapshot: any) => {
						return {
							key: snapshot.snapshot.key,
							...snapshot.snapshot.val()
						} as {
							key: string;
							content: string;
							date: string;
							link: string;
						};
					})
				)
			)
		);
	}

	/**
	 * Update remainder table details
	 *
	 * @param entryKey - The key of the entire entry
	 * @param valueKey - The key associated with the new value.
	 * @param value - The new value to be stored.
	 * @param tableName - The name of the table to update.
	 */
	public async updateRemainderTable(tableName: string, entryKey: string, valueKey: string, value: any) {
		if (tableName === SECOND_TABLE) {
			const valueToUpdate = valueKey === 'content' ? { ...value } : { [valueKey]: value };

			await update(dbRef(this.db, `remainder/${tableName}/${entryKey}/content`), {
				...valueToUpdate
			}).then(() => {
				LOG.info(this.className, 'Remainder table has been updated');
			});
		} else if (tableName === THIRD_TABLE) {
			await update(dbRef(this.db, `remainder/${tableName}/${entryKey}`), {
				[valueKey]: value
			}).then(() => {
				LOG.info(this.className, 'Remainder table has been updated');
			});
		}
	}

	/**
	 * Update remainder table details
	 *
	 * @param tableName - The name of the table to update.
	 * @param updatedTable - The table to update
	 */
	public async updateFirstRemainderTable(tableName: string, updatedTable: any) {
		await update(dbRef(this.db, `remainder/${tableName}`), {
			...updatedTable
		}).then(() => {
			LOG.info(this.className, 'Remainder table has been updated');
		});
	}

	/**
	 * Remove record from remainder table
	 *
	 * @param tableName - The name of the table
	 * @param index - The index of the record to remove
	 */
	public async removeRecordFromRemainderTable(tableName: string, key: string) {
		return remove(dbRef(this.db, `remainder/${tableName}/${key}`)).then(() => {
			LOG.info(this.className, 'Remainder table record has been removed');
		});
	}

	public async addNewRecordForRemainderTable(tableName: string, newRecord: any) {
		await push(dbRef(this.db, `remainder/${tableName}`), {
			...newRecord
		}).then(() => {
			LOG.info(this.className, 'Remainder table has been updated');
		});
	}
}
