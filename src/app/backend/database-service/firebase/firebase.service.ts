import { Utilities } from '../../../common/app.utilities';
import {
	DATABASE_DATE_CALCULATOR,
	DATABASE_DEBT_SONATA,
	DATABASE_HISTORY,
	DATABASE_PATCH_NOTES,
	DATABASE_QUOTES,
	DATABASE_REMINDER,
	GENRE_FAVOURITE,
	HISTORY_STATUS_ADDED,
	HISTORY_STATUS_DELETED,
	RATE_DECREASED,
	RATE_INCREASED,
	REMINDER_TABLE_MESSAGES,
	SEARCH,
	STATS_CAP_ACTIVITY_LOG,
	STATS_FIELD_RECENT_MOVIE,
	STATS_FIELD_RECENT_PATCH,
	STATS_FIELD_RECENT_REMINDER,
	STATS_FIELD_RECENT_RESONANCE
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
import { Observable, map, of } from 'rxjs';
import { MovieItemVO } from '../../../fontend/entertainment/movieItem.vo';
import { Recipe } from '../../../fontend/recipe/recipe.model';
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
		private searchStreamService: SearchStreamService
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
	 * Returns the movie list from Firebase as a reactive observable.
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
	 * Returns the statistics from Firebase as a reactive observable.
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
	 * Adds a new entry to history stating that a new search activity has been initialized.
	 */
	public async updateHistoryWithNewSearchActivity() {
		await this.addNewHistoryEntry(SEARCH);
	}

	/**
	 * Updates the movie rate in Firebase.
	 *
	 * @param movieItemVO - The movie item to update.
	 */
	public async updateMovieRate(movieItemVO: MovieItemVO): Promise<void> {
		try {
			// Step 1 : Gather necessary info
			const movieRef = dbRef(this.db, `movies/${movieItemVO.getMovieKey()}`);
			const snapshot = await get(movieRef);
			const oldRate = snapshot.exists() ? snapshot.val().rate : undefined;

			// Step 2 : Compare latest rate with the one stored in the database
			if (oldRate !== undefined && oldRate !== movieItemVO.getMovieRate()) {
				await update(movieRef, { rate: movieItemVO.getMovieRate() });
				const rateDifference = Number((movieItemVO.getMovieRate() - oldRate).toFixed(2));
				this.searchStreamService.addSearchLog(
					`The rate of ${movieItemVO.getMovieName()} is <span ${
						rateDifference > 0 ? 'class="rate-up"' : 'class="rate-down"'
					}>${rateDifference > 0 ? RATE_INCREASED : RATE_DECREASED} by ${Math.abs(
						rateDifference
					)}</span> to ${movieItemVO.getMovieRate()}`
				);
			} else {
				this.searchStreamService.addSearchLog(
					`The rate of ${movieItemVO.getMovieName()} stays the same`
				);
			}
		} catch (error) {
			LOG.error(this.className, 'Error while updating movie rate', error as Error);
			throw error;
		}
	}

	/**
	 * Updates the movie genre in Firebase.
	 *
	 * @param movieKey - The key of the movie to update.
	 * @param oldGenre - The old genre value.
	 * @param newGenre - The new genre value.
	 */
	public updateMovieGenre(movieKey: string, oldGenre: string, newGenre: string): Promise<void> {
		const movieRef = dbRef(this.db, `movies/${movieKey}`);

		// Step 1 : Update movie genre
		return update(movieRef, { genre: newGenre })
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
			})
			.catch((error: Error) => {
				LOG.error(this.className, 'Error while updating movie genre', error);
				throw error;
			});
	}

	/**
	 * Updates the isFavourite flag for the given movie in Firebase.
	 *
	 * @param movieKey - The key of the movie to update.
	 * @param isFavourite - The boolean value to set.
	 */
	public updateMovieFavourite(movieKey: string, isFavourite: boolean): Promise<void> {
		const movieRef = dbRef(this.db, `movies/${movieKey}`);

		// Step 1 : Update movie favourite
		return update(movieRef, { isFavourite })
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
			})
			.catch((error: Error) => {
				LOG.error(this.className, 'Error while updating movie favourite', error);
				throw error;
			});
	}

	/**
	 * Adds new movie data to Firebase and updates the statistics accordingly.
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
			await this.addNewHistoryEntry(HISTORY_STATUS_ADDED, movieItemVO);

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
	 * Removes the movie from the database and its cover from storage.
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
			await this.addNewHistoryEntry(HISTORY_STATUS_DELETED, movieItemVO);

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
	 * Returns the reusable keys from the database.
	 *
	 * @returns The array of reusable key strings.
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
	 * Saves the reusable keys to the database.
	 *
	 * @param keys - The reusable keys to persist.
	 */
	private saveReusableKeys(keys: string[]): Promise<void> {
		return update(dbRef(this.db, 'statistics'), { reusableKeys: keys })
			.then(() => {
				LOG.info(this.className, `Reusable keys have been updated`);
			})
			.catch((error: Error) => {
				LOG.error(this.className, 'Error while saving reusable keys', error);
				throw error;
			});
	}

	/**
	 * Checks whether a given movie has already been added to the database.
	 *
	 * @param movieName - The movie name to check.
	 * @param movieYear - The movie year to check.
	 * @param movieId - The movie ID to check.
	 * @returns True if the movie already exists, otherwise false.
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
	 * Adds a new history entry with the given status and optional movie data.
	 *
	 * @param status - The status of the activity.
	 * @param movieItemVO - The movie item to update.
	 */
	protected async addNewHistoryEntry(status: string, movieItemVO?: MovieItemVO): Promise<void> {
		try {
			// Capture timestamp once so the same value is used in the history message
			// and in the statistics update below.
			const timestamp = Utilities.getCurrentFormattedTime(true);
			if (movieItemVO) {
				await push(dbRef(this.db, DATABASE_HISTORY), {
					id: movieItemVO.getMovieId(),
					status: status,
					message: this.buildHistoryMessage(status, timestamp, movieItemVO)
				});

				// Keep statistics in sync: record the most recently added movie.
				if (status === HISTORY_STATUS_ADDED) {
					await update(this.statisticsRef, {
						lastAdded: {
							title: movieItemVO.getMovieName(),
							genre: movieItemVO.getMovieGenre(),
							rate: movieItemVO.getMovieRate(),
							timestamp
						}
					});
					this.appendToActivityLog(STATS_FIELD_RECENT_MOVIE, {
						type: HISTORY_STATUS_ADDED,
						title: movieItemVO.getMovieName(),
						genre: movieItemVO.getMovieGenre(),
						timestamp
					}).catch(() => {});
				}
			} else {
				await push(dbRef(this.db, DATABASE_HISTORY), {
					status: status,
					message: this.buildHistoryMessage(status, timestamp)
				});

				// Keep statistics in sync: record the most recent rate-search timestamp.
				await update(this.statisticsRef, { lastRateSearch: { timestamp } });
				this.appendToActivityLog(STATS_FIELD_RECENT_MOVIE, { type: SEARCH, timestamp }).catch(
					() => {}
				);
			}
			LOG.info(this.className, 'New history entry has been added');
		} catch (error) {
			LOG.error(this.className, 'Error while adding new history entry', error as Error);
			throw error;
		}
	}

	/**
	 * Returns the history list from Firebase as a reactive observable.
	 *
	 * @returns An observable that emits the history list.
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
	 * Adds a new record to the patch notes collection.
	 *
	 * @param newRecord - The record to add.
	 */
	public addNewRecordToPatchNotes(newRecord: any): Promise<void> {
		return push(dbRef(this.db, DATABASE_PATCH_NOTES), {
			// Normalize text casing so patch note entries have consistent formatting
			// regardless of how the user typed them.
			component: Utilities.capitalizeFirstLetterOnEachWord(newRecord.component),
			element: Utilities.capitalizeFirstLetterWithOthersUnchanged(newRecord.element.trim()),
			details: Utilities.capitalizeFirstLetterWithOthersUnchanged(newRecord.details.trim()),
			status: newRecord.status,
			timestamp: newRecord.timestamp,
			isBug: newRecord.isBug
		})
			.then(() => {
				LOG.info(this.className, 'New patch notes record has been added');
			})
			.catch((error: Error) => {
				LOG.error(this.className, 'Error while adding new patch notes record', error);
				throw error;
			});
	}

	/**
	 * Updates an existing record in the patch notes collection.
	 *
	 * @param key - The key associated with the record
	 * @param updatedRecord - The record to update.
	 */
	public updateExistingRecordToPatchNotes(key: string, updatedRecord: any): Promise<void> {
		return update(dbRef(this.db, `${DATABASE_PATCH_NOTES}/${key}`), { ...updatedRecord })
			.then(() => {
				LOG.info(this.className, 'Patch notes record has been updated');
			})
			.catch((error: Error) => {
				LOG.error(this.className, 'Error while updating patch notes record', error);
				throw error;
			});
	}

	/**
	 * Returns the patch notes from Firebase as a reactive observable.
	 *
	 * @returns An observable that emits the patch notes.
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

	// ── Remove existing record from table ─────────────────────────────────────────

	/**
	 * Removes a record from debt table.
	 *
	 * @param key - The key of the record to remove.
	 */
	public async removeRecordFromDebtTable(key: string): Promise<void> {
		this.removeSingleItemFromDatabase(DATABASE_DEBT_SONATA, key);
	}

	/**
	 * Removes a record from reminder table.
	 *
	 * @param key - The key of the record to remove.
	 */
	public async removeRecordFromReminderTable(key: string): Promise<void> {
		this.removeSingleItemFromDatabase(DATABASE_REMINDER, key);
	}

	/**
	 * Remove record from patch notes
	 *
	 * @param key - The key associated with the record
	 */
	public removeSingleItemFromDatabase(tablePath: string, key: string): Promise<void> {
		return remove(dbRef(this.db, `${tablePath}/${key}`))
			.then(() => {
				LOG.info(this.className, `Record has been removed from ${tablePath}`);
			})
			.catch((error: Error) => {
				LOG.error(this.className, `Error while removing record from ${tablePath}`, error);
				throw error;
			});
	}

	/**
	 * Returns the first reminder table details from Firebase as a reactive observable.
	 *
	 * @returns An observable that emits the date calculator table details.
	 */
	public getDateCalculatorTableDetails(): Observable<any[]> {
		return new Observable((observer) => {
			runInInjectionContext(this.ei, () => {
				const unsub = onValue(dbRef(this.db, DATABASE_DATE_CALCULATOR), (snapshot) => {
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
	 * Returns the Account Expenses (debt sonata) table details from Firebase as a reactive observable.
	 *
	 * @returns An observable that emits the Account Expenses table details.
	 */
	public getDebtSonataTableDetails(): Observable<any[]> {
		return runInInjectionContext(this.ei, () =>
			// list() reads once + subscribes to changes; pipe+map transforms
			// each snapshot into {key, ...fields} for the table component.
			list(dbRef(this.db, DATABASE_DEBT_SONATA)).pipe(
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
	 * Returns the reminder table details from Firebase as a reactive observable.
	 *
	 * @returns An observable that emits the reminder table details.
	 */
	public getReminderTableDetails(): Observable<any[]> {
		return runInInjectionContext(this.ei, () =>
			// Content shape is {text, date, link}.
			list(dbRef(this.db, DATABASE_REMINDER)).pipe(
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

	// ── Update existing record to table ─────────────────────────────────────────

	/**
	 * Updates value in Reminder table
	 *
	 * @param entryKey - The key of the entry to update.
	 * @param valueKey - The key of the value to update.
	 * @param value - The new value to store.
	 */
	public async updateReminderTable(entryKey: string, valueKey: string, value: any): Promise<void> {
		this.updateExistingRecordToTable(DATABASE_REMINDER, entryKey, valueKey, value);
	}

	/**
	 * Updates value in Debt table
	 *
	 * @param entryKey - The key of the entry to update.
	 * @param valueKey - The key of the value to update.
	 * @param value - The new value to store.
	 */
	public async updateDebtTable(entryKey: string, valueKey: string, value: any): Promise<void> {
		this.updateExistingRecordToTable(DATABASE_DEBT_SONATA, entryKey, valueKey, value);
	}

	/**
	 * Updates a single value in  a given table.
	 *
	 * @param tableName - The name of the table to update.
	 * @param entryKey - The key of the entry to update.
	 * @param valueKey - The key of the value to update.
	 * @param value - The new value to be stored.
	 */
	private async updateExistingRecordToTable(
		tableName: string,
		entryKey: string,
		valueKey: string,
		value: any
	): Promise<void> {
		try {
			await update(dbRef(this.db, `${tableName}/${entryKey}`), {
				[valueKey]: value
			});
			LOG.info(this.className, `Record on ${tableName} has been updated`);
		} catch (error) {
			LOG.error(this.className, `Error while updating ${tableName}`, error as Error);
			throw error;
		}
	}

	/**
	 * Updates date calculator table with the given data in nexus page
	 *
	 * @param updatedTable - The updated table data.
	 */
	public updateDateCalculatorTable(updatedTable: any): Promise<void> {
		return update(dbRef(this.db, DATABASE_DATE_CALCULATOR), { ...updatedTable })
			.then(() => {
				LOG.info(this.className, 'Table record has been updated');
			})
			.catch((error: Error) => {
				LOG.error(this.className, 'Error while updating first reminder table', error);
				throw error;
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
		try {
			await push(dbRef(this.db, DATABASE_QUOTES), { text, author, timestamp });
			LOG.info(this.className, 'New quote has been added');
			// Update statistics: record latest quote and increment total count.
			await runTransaction(this.statisticsRef, (currentData) => {
				currentData = currentData ?? {};
				currentData.latestQuote = { text, author, timestamp };
				currentData.totalQuotes = (currentData.totalQuotes ?? 0) + 1;
				return currentData;
			});
			this.appendToActivityLog(STATS_FIELD_RECENT_RESONANCE, {
				type: HISTORY_STATUS_ADDED,
				author,
				timestamp
			}).catch(() => {});
		} catch (error) {
			LOG.error(this.className, 'Error while adding quote', error as Error);
			throw error;
		}
	}

	/**
	 * Remove a quote from the database.
	 *
	 * @param key - The key of the quote to remove.
	 */
	public async removeQuote(key: string, _text: string, author: string): Promise<void> {
		try {
			await this.removeSingleItemFromDatabase(DATABASE_QUOTES, key);
			// Update statistics: decrement total quote count.
			// latestQuote is intentionally left as-is; it refreshes on the next submission.
			const deletedTimestamp = Utilities.getCurrentFormattedTime(true);
			await runTransaction(this.statisticsRef, (currentData) => {
				currentData = currentData ?? {};
				currentData.totalQuotes = Math.max(0, (currentData.totalQuotes ?? 1) - 1);
				return currentData;
			});
			this.appendToActivityLog(STATS_FIELD_RECENT_RESONANCE, {
				type: HISTORY_STATUS_DELETED,
				author,
				timestamp: deletedTimestamp
			}).catch(() => {});
		} catch (error) {
			LOG.error(this.className, `Error while removing quote ${key}`, error as Error);
			throw error;
		}
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

	/**
	 * Prepend a new entry to a named activity-log array in the statistics
	 * document, keeping at most STATS_CAP_ACTIVITY_LOG entries (newest first).
	 * Used for movie, patch, reminder and resonance activity feeds.
	 *
	 * @param fieldName - The statistics field that holds the array — use a STATS_FIELD_* constant.
	 * @param activity - The activity object to record.
	 */
	public async appendToActivityLog(fieldName: string, activity: any): Promise<void> {
		try {
			await runTransaction(this.statisticsRef, (currentData) => {
				currentData = currentData ?? {};
				const existing: any[] = Array.isArray(currentData[fieldName]) ? currentData[fieldName] : [];
				currentData[fieldName] = [activity, ...existing].slice(0, STATS_CAP_ACTIVITY_LOG);
				return currentData;
			});
		} catch (error) {
			LOG.error(this.className, 'Error while appending activity log', error as Error);
		}
	}

	/**
	 * Prepend a new entry to the `recentPatchActivities` list in the statistics
	 * document, keeping at most STATS_CAP_ACTIVITY_LOG entries (newest first).
	 *
	 * @param activity - The activity object to record.
	 */
	public async appendToPatchActivityLog(activity: any): Promise<void> {
		return this.appendToActivityLog(STATS_FIELD_RECENT_PATCH, activity);
	}

	// ── Add new record to table ─────────────────────────────────────────

	/**
	 * Adds a new entry to reminder table.
	 *
	 * @param newRecord - The new entry to add.
	 */
	public async addNewRecordToReminderTable(newRecord: any): Promise<void> {
		this.addNewRecordToTable(DATABASE_REMINDER, newRecord);
	}

	/**
	 * Adds a new entry to debt table
	 *
	 * @param tableName - The corresponding collection name.
	 * @param newRecord - The new entry to add.
	 */
	public async addNewRecordToDebtTable(newRecord: any): Promise<void> {
		this.addNewRecordToTable(DATABASE_DEBT_SONATA, newRecord);
	}

	/**
	 * Adds a new entry to the given reminder table. Used by the third table only.
	 *
	 * @param tableName - The name of the table.
	 * @param newRecord - The new entry to add.
	 */
	private addNewRecordToTable(tableName: string, newRecord: any): Promise<void> {
		return push(dbRef(this.db, tableName), {
			content: { ...newRecord }
		})
			.then(() => {
				LOG.info(this.className, 'Table record has been updated');
				if (tableName === DATABASE_REMINDER) {
					this.appendToActivityLog(STATS_FIELD_RECENT_REMINDER, {
						type: HISTORY_STATUS_ADDED,
						table: REMINDER_TABLE_MESSAGES,
						text: newRecord.text ?? '',
						timestamp: Utilities.getCurrentFormattedTime(true)
					}).catch(() => {});
				}
			})
			.catch((error: Error) => {
				LOG.error(this.className, 'Error while adding new record for reminder table', error);
				throw error;
			});
	}

	/**
	 * Removes a patch note by key from the Firebase database.
	 *
	 * @param key - The document key of the patch note to remove.
	 */
	public removePatchNote(key: string): Promise<void> {
		return this.removeSingleItemFromDatabase(DATABASE_PATCH_NOTES, key);
	}

	/**
	 * Get the useful links from the database.
	 *
	 * @returns An observable that emits the useful links list.
	 */
	public getUsefulLinks(): Observable<any[]> {
		return of([]);
	}

	/**
	 * Add a new useful link to the database.
	 *
	 * @param link - The link object to add.
	 */
	public addUsefulLink(_link: {
		url: string;
		title: string;
		category: string;
		visitCount: number;
		createdAt: string;
	}): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Update an existing useful link in the database.
	 *
	 * @param key - The key of the link to update.
	 * @param updates - The fields to update.
	 */
	public updateUsefulLink(
		_key: string,
		_updates: Partial<{ url: string; title: string; category: string }>
	): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Increment the visit count for a useful link.
	 *
	 * @param key - The key of the link.
	 * @param currentCount - The current visit count.
	 */
	public incrementLinkVisit(_key: string, _currentCount: number): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Remove a useful link from the database.
	 *
	 * @param key - The key of the link to remove.
	 */
	public removeUsefulLink(_key: string): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Get the link categories from the database.
	 *
	 * @returns An observable that emits the link categories list.
	 */
	public getLinkCategories(): Observable<any[]> {
		return of([]);
	}

	/**
	 * Add a new link category to the database.
	 *
	 * @param category - The category object to add.
	 */
	public addLinkCategory(_category: { name: string; color: string; order: number }): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Update an existing link category in the database.
	 *
	 * @param key - The key of the category to update.
	 * @param updates - The fields to update.
	 */
	public updateLinkCategory(
		_key: string,
		_updates: Partial<{ name: string; color: string; order: number }>
	): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Remove a link category from the database.
	 *
	 * @param key - The key of the category to remove.
	 */
	public removeLinkCategory(_key: string): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Not implemented for Firebase — returns an empty response.
	 *
	 * @param _url - The URL to proxy (unused in this backend).
	 * @returns A resolved promise with empty content and contentType.
	 */
	public proxyFetch(_url: string): Promise<{ content: string; contentType: string }> {
		return Promise.resolve({ content: '', contentType: '' });
	}

	////////////////////// Below are Recipe stubs (not implemented for Firebase) ////////////////////

	/** @inheritdoc */
	public getRecipes(): Observable<Recipe[]> {
		return of([]);
	}

	/** @inheritdoc */
	public addRecipe(_recipe: Recipe): Promise<void> {
		return Promise.resolve();
	}

	/** @inheritdoc */
	public updateRecipe(_recipe: Recipe): Promise<void> {
		return Promise.resolve();
	}

	/** @inheritdoc */
	public removeRecipe(_recipeId: string): Promise<void> {
		return Promise.resolve();
	}
}
