import { Utilities } from '../../../common/app.utilities';
import {
	FIRST_TABLE,
	GENRE_FAVOURITE,
	NO_RATE,
	SECOND_TABLE,
	THIRD_TABLE,
	RATE_DECREASED,
	RATE_INCREASED,
	SEARCH,
	DATABASE_HISTORY,
	DATABASE_PATCH_NOTES,
	DATABASE_QUOTES,
	DATABASE_REMINDER
} from '../../../common/app.constant';
import { SearchStreamService } from '../../dialog-service/search/search-stream.service';
import { EnvironmentInjector, Inject, Injectable, runInInjectionContext } from '@angular/core';
import { Storage, ref as storageRef, getDownloadURL, uploadBytes, deleteObject } from '@angular/fire/storage';
import { LOG } from '../../../common/app.logs';
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
import { MovieItemVO } from '../../../common/movieitem.vo';
import { DatabaseService } from '../database.service';

@Injectable({
	providedIn: 'root'
})
export class FirebaseService extends DatabaseService {
	private readonly className = 'FirebaseService';
	private moviesRef: any;
	private statisticsRef: any;

	constructor(
		@Inject(Storage) private storage: Storage,
		@Inject(Database) private db: Database,
		@Inject(EnvironmentInjector) private ei: EnvironmentInjector,
		private searchStreamService: SearchStreamService,
		private utilities: Utilities
	) {
		super();
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
			// Firebase Storage separates upload from URL generation:
			// first upload the Blob, then get a downloadable link.
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
				const unsub = onValue(this.statisticsRef, (snapshot) => {
					observer.next(snapshot.val());
				});
				return () => unsub();
			});
		});
	}

	/**
	 * Add new entry to history stating that a new search activity has been initialized
	 */
	public async updateHistoryWithNewSearchActivity() {
		await this.addNewHistoryEntry(SEARCH);
	}

	/**
	 * Update the movie rate to firebase.
	 *
	 * @param movieItemVO - The movie item to update.
	 */
	public async updateMovieRate(movieItemVO: MovieItemVO): Promise<void> {
		// Step 1 : Gather necessary info
		const movieRef = dbRef(this.db, `movies/${movieItemVO.getMovieKey()}`);
		const snapshot = await get(movieRef);
		const oldRate = snapshot.exists() ? snapshot.val().rate : undefined;

		// Step 2 : Compare latest rate with the one stored in the database
		if (oldRate !== undefined && oldRate !== movieItemVO.getMovieRate()) {
			await update(movieRef, {
				rate: movieItemVO.getMovieRate()
			});
			const rateDifference = Number((movieItemVO.getMovieRate() - oldRate).toFixed(2));
			this.searchStreamService.addSearchLog(
				`The rate of ${movieItemVO.getMovieName()} is <span ${
					rateDifference > 0 ? 'class="rate-up"' : 'class="rate-down"'
				}>${rateDifference > 0 ? RATE_INCREASED : RATE_DECREASED} by ${Math.abs(
					rateDifference
				)}</span> to ${movieItemVO.getMovieRate()}`
			);
		} else {
			this.searchStreamService.addSearchLog(`The rate of ${movieItemVO.getMovieName()} stays the same`);
		}
	}

	/**
	 * Update the movie genre to firebase
	 *
	 * @param movieKey The given movie key
	 * @param oldGenre The old genre
	 * @param newGenre The new genre
	 */
	public updateMovieGenre(movieKey: string, oldGenre: string, newGenre: string): Promise<void> {
		const movieRef = dbRef(this.db, `movies/${movieKey}`);

		// Step 1 : Update movie genre
		return update(movieRef, {
			genre: newGenre
		})
			.then(() => {
				LOG.info(this.className, `Movie genre has been updated`);

				// Step 2 : Update movie statistics
				return runTransaction(dbRef(this.db, `statistics`), (currentData) => {
					currentData.genre[oldGenre] = currentData.genre[oldGenre] - 1;
					currentData.genre[newGenre] = (currentData.genre[newGenre] ?? 0) + 1;
					return currentData;
				});
			})
			.then(() => {
				LOG.info(this.className, `Movie statistics have been updated`);
				return;
			});
	}

	/**
	 * Update isFavourite for the given movie to firebase
	 *
	 * @param movieKey The given movie key
	 * @param isFavourite The boolean value set
	 */
	public updateMovieFavourite(movieKey: string, isFavourite: boolean): Promise<void> {
		const movieRef = dbRef(this.db, `movies/${movieKey}`);

		// Step 1 : Update movie favourite
		return update(movieRef, {
			isFavourite: isFavourite
		})
			.then(() => {
				LOG.info(this.className, `Movie favourite tag has been updated`);

				// Step 2 : Update movie statistics
				return runTransaction(dbRef(this.db, `statistics`), (currentData) => {
					if (isFavourite) {
						currentData.genre[GENRE_FAVOURITE] = (currentData.genre[GENRE_FAVOURITE] ?? 0) + 1;
					} else {
						currentData.genre[GENRE_FAVOURITE] = currentData.genre[GENRE_FAVOURITE] - 1;
					}
					return currentData;
				});
			})
			.then(() => {
				LOG.info(this.className, `Movie statistics have been updated`);
				return;
			});
	}

	/**
	 * Update all movie data and statistics to firebase.
	 *
	 * @param movieItemVO - The movie item to update.
	 */
	public async addNewMovieDataAndUpdateStatistics(movieItemVO: MovieItemVO): Promise<void> {
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
			});

			// Add new entry to history
			await this.addNewHistoryEntry('added', movieItemVO);

			// Update the movie statistics
			await runTransaction(dbRef(this.db, `statistics`), (currentData) => {
				currentData.genre[movieItemVO.getMovieGenre()] =
					(currentData.genre[movieItemVO.getMovieGenre()] ?? 0) + 1;
				if (movieItemVO.getIsFavourite()) {
					currentData.genre[GENRE_FAVOURITE] = (currentData.genre[GENRE_FAVOURITE] ?? 0) + 1;
				}

				currentData.totalNumber = (currentData.totalNumber ?? 0) + 1;
				return currentData;
			});
			LOG.info(this.className, `Movie added and statistics have been updated`);
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
	public async removeMovieFromDatabase(movieItemVO: MovieItemVO): Promise<void> {
		try {
			// Remove the movie cover from the storage
			const storageRefer = storageRef(this.storage, `/movies/${movieItemVO.getMovieName()}`);
			await deleteObject(storageRefer);

			// Remove the movie info from the database
			await remove(dbRef(this.db, `movies/${movieItemVO.getMovieKey()}`));

			// Add new entry to history
			await this.addNewHistoryEntry('deleted', movieItemVO);

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
			});
			LOG.info(this.className, `Movie removed and statistics have been updated`);
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
			return snapshot.exists() ? (Object.values(snapshot.val()) as string[]) : [];
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
	private saveReusableKeys(keys: string[]): Promise<void> {
		return update(dbRef(this.db, 'statistics'), { reusableKeys: keys }).then(() => {
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
			// Firebase Realtime DB does not support server-side .where() queries
			// like CloudBase, so we must iterate all movies to check for duplicates.
			const allMovies = snapshot.val();

			if (!allMovies) throw new Error('Movie list empty');

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
	protected async addNewHistoryEntry(status: string, movieItemVO?: MovieItemVO): Promise<void> {
		// Capture timestamp once so the same value is used in the history message
		// and in the statistics update below.
		const timestamp = this.utilities.getCurrentFormattedTime(true);
		if (movieItemVO) {
			await push(dbRef(this.db, DATABASE_HISTORY), {
				id: movieItemVO.getMovieId(),
				status: status,
				message: `${movieItemVO.getMovieName()} - ${movieItemVO.getMovieGenre()} (Rate: ${
					movieItemVO.getMovieRate() == 0 ? NO_RATE : movieItemVO.getMovieRate()
				}) was ${status} on ${timestamp}`
			});

			// Keep statistics in sync: record the most recently added movie.
			if (status === 'added') {
				await update(this.statisticsRef, {
					lastAdded: {
						title: movieItemVO.getMovieName(),
						genre: movieItemVO.getMovieGenre(),
						rate: movieItemVO.getMovieRate(),
						timestamp
					}
				});
				this.appendToActivityLog('recentMovieActivities', {
					type: 'added',
					title: movieItemVO.getMovieName(),
					genre: movieItemVO.getMovieGenre(),
					timestamp
				}).catch(() => {});
			}
		} else {
			await push(dbRef(this.db, DATABASE_HISTORY), {
				status: status,
				message: `New rate search was started on ${timestamp}`
			});

			// Keep statistics in sync: record the most recent rate-search timestamp.
			await update(this.statisticsRef, { lastRateSearch: { timestamp } });
			this.appendToActivityLog('recentMovieActivities', { type: 'search', timestamp }).catch(() => {});
		}
		LOG.info(this.className, 'New history entry has been added');
	}

	/**
	 * Retrieve history list
	 *
	 * @returns The history list
	 */
	public getHistory(): Observable<any[]> {
		return runInInjectionContext(this.ei, () =>
			list(dbRef(this.db, DATABASE_HISTORY)).pipe(
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
	public addNewRecordToPatchNotes(newRecord: any): Promise<void> {
		return push(dbRef(this.db, DATABASE_PATCH_NOTES), {
			// Normalize text casing so patch note entries have consistent formatting
			// regardless of how the user typed them.
			component: this.utilities.capitalizeFirstLetterOnEachWord(newRecord.component),
			element: this.utilities.capitalizeFirstLetterWithOthersUnchanged(newRecord.element.trim()),
			details: this.utilities.capitalizeFirstLetterWithOthersUnchanged(newRecord.details.trim()),
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
	public updateExistingRecordToPatchNotes(key: string, updatedRecord: any): Promise<void> {
		return update(dbRef(this.db, `${DATABASE_PATCH_NOTES}/${key}`), {
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
			list(dbRef(this.db, DATABASE_PATCH_NOTES)).pipe(
				map((snapshots: any[]) =>
					snapshots
						.map(
							(snapshot: any) =>
								({
									key: snapshot.snapshot.key,
									...snapshot.snapshot.val()
								}) as {
									key: string;
									component: string;
									element: string;
									details: string;
									status: string;
									timestamp: string;
									isBug: boolean;
								}
						)
						// Sort by timestamp ascending — list() returns insertion order,
						// not timestamp order, so an explicit sort is needed.
						.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
				)
			)
		);
	}

	/**
	 * Remove record from reminder table
	 *
	 * @param tableName - The name of the table
	 * @param index - The index of the record to remove
	 */
	public removeRecordFromReminderTable(tableName: string, key: string): Promise<void> {
		return this.removeSingleItemFromDatabase(`${DATABASE_REMINDER}/${tableName}`, key);
	}

	/**
	 * Remove record from patch notes
	 *
	 * @param key - The key associated with the record
	 */
	public removeSingleItemFromDatabase(tablePath: string, key: string): Promise<void> {
		return remove(dbRef(this.db, `${tablePath}/${key}`)).then(() => {
			LOG.info(this.className, 'Patch notes record has been removed');
		});
	}

	/**
	 * Get first reminder table details
	 *
	 * @returns Reminder table details
	 */
	public getFirstReminderTableDetails(): Observable<any[]> {
		return new Observable((observer) => {
			runInInjectionContext(this.ei, () => {
				const unsub = onValue(dbRef(this.db, `${DATABASE_REMINDER}/${FIRST_TABLE}`), (snapshot) => {
					const data = snapshot.val();
					// Firebase stores the collection as an object keyed by push ID;
					// Object.values() converts it to an array for PrimeNG table binding.
					observer.next(data ? Object.values(data) : []);
				});
				return () => unsub();
			});
		});
	}

	/**
	 * Get second reminder table details
	 *
	 * @returns Second reminder table details
	 */
	public getSecondReminderTableDetails(): Observable<any[]> {
		return runInInjectionContext(this.ei, () =>
			// list() reads once + subscribes to changes; pipe+map transforms
			// each snapshot into {key, ...fields} for the table component.
			list(dbRef(this.db, `${DATABASE_REMINDER}/${SECOND_TABLE}`)).pipe(
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
	 * Get third reminder table details
	 *
	 * @returns Third reminder table details
	 */
	public getThirdReminderTableDetails(): Observable<any[]> {
		return runInInjectionContext(this.ei, () =>
			// Same list()+pipe+map pipeline as second table, but third table
			// content shape is {text, date, link} so mapping differs accordingly.
			list(dbRef(this.db, `${DATABASE_REMINDER}/${THIRD_TABLE}`)).pipe(
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
	 * Update reminder table details
	 *
	 * @param entryKey - The key of the entire entry
	 * @param valueKey - The key associated with the new value.
	 * @param value - The new value to be stored.
	 * @param tableName - The name of the table to update.
	 */
	public async updateReminderTable(
		tableName: string,
		entryKey: string,
		valueKey: string,
		value: any
	): Promise<void> {
		if (tableName === SECOND_TABLE) {
			const valueToUpdate = valueKey === 'content' ? { ...value } : { [valueKey]: value };

			await update(dbRef(this.db, `${DATABASE_REMINDER}/${tableName}/${entryKey}/content`), {
				...valueToUpdate
			});
			LOG.info(this.className, 'Reminder table has been updated');
		} else if (tableName === THIRD_TABLE) {
			await update(dbRef(this.db, `${DATABASE_REMINDER}/${tableName}/${entryKey}`), {
				[valueKey]: value
			});
			LOG.info(this.className, 'Reminder table has been updated');
		}
	}

	/**
	 * Update reminder table details
	 *
	 * @param tableName - The name of the table to update.
	 * @param updatedTable - The table to update
	 */
	public updateFirstReminderTable(tableName: string, updatedTable: any): Promise<void> {
		return update(dbRef(this.db, `${DATABASE_REMINDER}/${tableName}`), {
			...updatedTable
		}).then(() => {
			LOG.info(this.className, 'Reminder table has been updated');
		});
	}

	/**
	 * Get the quotes from the database.
	 *
	 * @returns An observable that emits the quotes list.
	 */
	public getQuotes(): Observable<any[]> {
		return runInInjectionContext(this.ei, () =>
			list(dbRef(this.db, DATABASE_QUOTES)).pipe(
				map((snapshots: any[]) =>
					snapshots
						.map((snapshot: any) => ({
							key: snapshot.snapshot.key,
							...snapshot.snapshot.val()
						}))
						.sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp))
				)
			)
		);
	}

	/**
	 * Add a new quote to the database.
	 *
	 * @param text - The quote text.
	 * @param author - The author of the quote.
	 * @param timestamp - The timestamp of the quote.
	 */
	public async addQuote(text: string, author: string, timestamp: string): Promise<void> {
		await push(dbRef(this.db, DATABASE_QUOTES), { text, author, timestamp });
		LOG.info(this.className, 'New quote has been added');

		// Update statistics: record latest quote and increment total count.
		await runTransaction(this.statisticsRef, (currentData) => {
			currentData = currentData ?? {};
			currentData.latestQuote = { text, author, timestamp };
			currentData.totalQuotes = (currentData.totalQuotes ?? 0) + 1;
			return currentData;
		});
		this.appendToActivityLog('recentResonanceActivities', { type: 'added', author, timestamp }).catch(() => {});
	}

	/**
	 * Remove a quote from the database.
	 *
	 * @param key - The key of the quote to remove.
	 */
	public async removeQuote(key: string, _text: string, author: string): Promise<void> {
		await this.removeSingleItemFromDatabase(DATABASE_QUOTES, key);
		// Update statistics: decrement total quote count.
		// latestQuote is intentionally left as-is; it refreshes on the next submission.
		const deletedTimestamp = this.utilities.getCurrentFormattedTime(true);
		await runTransaction(this.statisticsRef, (currentData) => {
			currentData = currentData ?? {};
			currentData.totalQuotes = Math.max(0, (currentData.totalQuotes ?? 1) - 1);
			return currentData;
		});
		this.appendToActivityLog('recentResonanceActivities', { type: 'deleted', author, timestamp: deletedTimestamp }).catch(() => {});
	}

	/**
	 * Update specific fields in the statistics document.
	 * Called by page components (Reminder, Patch) while they are active to sync
	 * live data into the shared statistics collection. The call stops naturally
	 * when the component is destroyed and its subscriptions are torn down.
	 *
	 * @param fields - Fields to merge into the statistics document.
	 */
	public async updateStatisticsFields(fields: Record<string, any>): Promise<void> {
		try {
			await update(this.statisticsRef, fields);
		} catch (error) {
			LOG.error(this.className, 'Error while updating statistics fields', error as Error);
		}
	}

	public async appendToActivityLog(fieldName: string, activity: any): Promise<void> {
		try {
			await runTransaction(this.statisticsRef, (currentData) => {
				currentData = currentData ?? {};
				const existing: any[] = Array.isArray(currentData[fieldName])
					? currentData[fieldName]
					: [];
				currentData[fieldName] = [activity, ...existing].slice(0, 5);
				return currentData;
			});
		} catch (error) {
			LOG.error(this.className, 'Error while appending activity log', error as Error);
		}
	}

	public async appendToPatchActivityLog(activity: any): Promise<void> {
		return this.appendToActivityLog('recentPatchActivities', activity);
	}

	/**
	 * Add a new entry to a given reminder table.
	 * Note: This is used by third table only.
	 *
	 * @param tableName - The name of the table.
	 * @param newRecord - The new entry to add.
	 */
	public addNewRecordForReminderTable(tableName: string, newRecord: any): Promise<void> {
		return push(dbRef(this.db, `${DATABASE_REMINDER}/${tableName}`), {
			content: { ...newRecord }
		}).then(() => {
			LOG.info(this.className, 'Reminder table has been updated');
			if (tableName === THIRD_TABLE) {
				this.appendToActivityLog('recentReminderActivities', {
					type: 'added',
					table: THIRD_TABLE,
					text: newRecord.text ?? '',
					timestamp: this.utilities.getCurrentFormattedTime(true)
				}).catch(() => {});
			}
		});
	}

	public removePatchNote(key: string): Promise<void> {
		return this.removeSingleItemFromDatabase(DATABASE_PATCH_NOTES, key);
	}
}
