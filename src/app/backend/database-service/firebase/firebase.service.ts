import { Utilities } from '../../../common/utilities/app.utilities';
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
	SEARCH,
	STATS_CAP_ACTIVITY_LOG,
	STATS_FIELD_RECENT_ACTIVITIES,
	ACTIVITY_SOURCE_DEBT,
	ACTIVITY_SOURCE_MOVIE,
	ACTIVITY_SOURCE_PATCH,
	ACTIVITY_SOURCE_REMINDER,
	ACTIVITY_SOURCE_RESONANCE,
	ACTIVITY_TYPE_UPDATED,
	ACTIVITY_TYPE_CALCULATOR_UPDATED,
	ACTIVITY_TYPE_RATE_UPDATED,
	ACTIVITY_TYPE_GENRE_UPDATED,
	ACTIVITY_TYPE_FAVOURITE_UPDATED,
	DATABASE_USER_PREFERENCES,
	STATS_FIELD_TAURI_NOTIF_ENABLED,
	STATS_FIELD_MINIMIZE_ON_CLOSE,
	STATS_FIELD_LOCALE,
	LOCALE_KEY_EN,
	LOCALE_KEY_ZH,
	ENT_LOG_SPAN_CLASS_RATE_DOWN,
	ENT_LOG_SPAN_CLASS_RATE_UP
} from '../../../common/constants';
import {
	REMINDER_TABLE_MESSAGES,
	ENT_LOG_RATE_PRE,
	ENT_LOG_RATE_IS,
	ENT_LOG_RATE_BY,
	ENT_LOG_RATE_TO,
	ENT_LOG_RATE_SAME,
	ENT_LOG_RATE_UP,
	ENT_LOG_RATE_DOWN
} from '../../../common/locale/locale-strings';
import { SearchStreamService } from '../../dialog-service/search/search-stream.service';
import { Inject, Injectable } from '@angular/core';
import {
	FirebaseStorage,
	ref as storageRef,
	getDownloadURL,
	uploadBytes,
	deleteObject
} from 'firebase/storage';
import { LOG } from '../../../common/app.logs';
import {
	Database,
	DataSnapshot,
	Query,
	ref as dbRef,
	onValue,
	runTransaction,
	update,
	remove,
	get,
	push,
	set
} from 'firebase/database';
import type { Auth } from 'firebase/auth';
import { Observable, map, of } from 'rxjs';
import { MovieItemVO } from '../../../fontend/entertainment/movieItem.vo';
import { Recipe } from '../../../fontend/recipe/recipe.model';
import { DatabaseService, FIREBASE_AUTH, FIREBASE_DATABASE, FIREBASE_STORAGE } from '../database.service';

@Injectable({
	providedIn: 'root'
})
export class FirebaseService extends DatabaseService {
	private readonly className = 'FirebaseService';
	private moviesRef: any;
	private statisticsRef: any;

	constructor(
		@Inject(FIREBASE_STORAGE) private storage: FirebaseStorage,
		@Inject(FIREBASE_DATABASE) private db: Database,
		@Inject(FIREBASE_AUTH) private firebaseAuth: Auth,
		private searchStreamService: SearchStreamService
	) {
		super();
		this.moviesRef = dbRef(this.db, 'movies');
		this.statisticsRef = dbRef(this.db, 'statistics');
	}

	// ── Retrieval methods ────────────────────────────────────────────────────

	/**
	 * Gets the statistics from Firebase as a reactive observable.
	 *
	 * @returns An observable that emits the statistics.
	 */
	public getStatistics(): Observable<any> {
		return new Observable((observer) => {
			const unsub = onValue(
				this.statisticsRef,
				(snapshot) => observer.next(snapshot.val()),
				(error) => observer.error(error)
			);
			return () => unsub();
		});
	}

	/**
	 * Gets the current user's per-user stats document as a real-time observable.
	 * Firebase deployment does not use per-user stat documents — returns an empty observable.
	 *
	 * @returns An observable that never emits.
	 */
	public getUserStats(): Observable<any> {
		return of(null);
	}

	/**
	 * Gets the date calculator table details from Firebase as a reactive observable.
	 *
	 * @returns An observable that emits the date calculator table details.
	 */
	public getDateCalculatorTableDetails(): Observable<any[]> {
		return new Observable((observer) => {
			const unsub = onValue(
				dbRef(this.db, DATABASE_DATE_CALCULATOR),
				(snapshot) => {
					const data = snapshot.val();
					/* Firebase stores the collection as an object keyed by push ID;
					   Object.values() converts it to an array for PrimeNG table binding. */
					observer.next(data ? Object.values(data) : []);
				},
				(error) => observer.error(error)
			);
			return () => unsub();
		});
	}

	/**
	 * Not implemented for Firebase — returns an empty observable.
	 *
	 * @returns An observable that emits an empty useful links list.
	 */
	public getUsefulLinks(): Observable<any[]> {
		return of([]);
	}

	/**
	 * Not implemented for Firebase — returns an empty observable.
	 *
	 * @returns An observable that emits an empty link categories list.
	 */
	public getLinkCategories(): Observable<any[]> {
		return of([]);
	}

	/**
	 * Gets the quotes from the database as a reactive observable.
	 *
	 * @returns An observable that emits the quotes list.
	 */
	public getQuotes(): Observable<any[]> {
		return this.listAsObservable(dbRef(this.db, DATABASE_QUOTES)).pipe(
			map((snapshots: any[]) =>
				snapshots
					.map((snapshot: any) => ({
						key: snapshot.key,
						...snapshot.val()
					}))
					.sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp))
			)
		);
	}

	/**
	 * Not implemented for Firebase — returns an empty observable.
	 *
	 * @returns An observable that emits an empty recipe list.
	 */
	public getRecipes(): Observable<Recipe[]> {
		return of([]);
	}

	/**
	 * Gets the movie list from Firebase as a reactive observable.
	 *
	 * @returns An observable that emits the movie list.
	 */
	public getMovieList(): Observable<MovieItemVO[]> {
		return this.listAsObservable(this.moviesRef).pipe(
			map((snapshots: any[]) =>
				snapshots.map((snapshot: any) => {
					const movie = snapshot.val();
					const movieItemVO = new MovieItemVO(movie.title, Number(movie.year));
					movieItemVO.setMovieKey(snapshot.key);
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
				/* Sort movies by first release date
				   Note: By using this method, make sure the first release date has the format of YYYY.MM.DD */
				movies.sort((a, b) =>
					a.getMovieFirstReleaseDate().localeCompare(b.getMovieFirstReleaseDate())
				)
			)
		);
	}

	/**
	 * Gets the history list from Firebase as a reactive observable.
	 *
	 * @returns An observable that emits the history list.
	 */
	public getHistory(): Observable<any[]> {
		return this.listAsObservable(dbRef(this.db, DATABASE_HISTORY)).pipe(
			map((snapshots: any[]) =>
				snapshots
					.map((snapshot: any) => ({
						key: snapshot.key,
						...snapshot.val()
					}))
					.reverse()
			)
		);
	}

	/**
	 * Gets the reminder table details from Firebase as a reactive observable.
	 *
	 * @returns An observable that emits the reminder table details.
	 */
	public getReminderTableDetails(): Observable<any[]> {
		// Content shape is {text, date, link}.
		return this.listAsObservable(dbRef(this.db, DATABASE_REMINDER)).pipe(
			map((snapshots: any[]) =>
				snapshots.map((snapshot: any) => {
					return {
						key: snapshot.key,
						...snapshot.val()
					} as {
						key: string;
						content: string;
						date: string;
						link: string;
					};
				})
			)
		);
	}

	/**
	 * Gets the Account Expenses (debt sonata) table details from Firebase as a reactive observable.
	 *
	 * @returns An observable that emits the Account Expenses table details.
	 */
	public getDebtSonataTableDetails(): Observable<any[]> {
		/* listAsObservable() reads once + subscribes to changes; pipe+map transforms
		   each snapshot into {key, ...fields} for the table component. */
		return this.listAsObservable(dbRef(this.db, DATABASE_DEBT_SONATA)).pipe(
			map((snapshots: any[]) =>
				snapshots.map((snapshot: any) => {
					return {
						key: snapshot.key,
						...snapshot.val()
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
		);
	}

	/**
	 * Gets the release notes. Firebase is not used in production; returns an empty list.
	 *
	 * @returns An observable that immediately emits an empty array.
	 */
	public getReleaseNotes(): Observable<any[]> {
		return of([]);
	}

	/**
	 * Gets the patch notes from Firebase as a reactive observable.
	 *
	 * @returns An observable that emits the patch notes.
	 */
	public getPatchNotes(): Observable<any[]> {
		return this.listAsObservable(dbRef(this.db, DATABASE_PATCH_NOTES)).pipe(
			map((snapshots: any[]) =>
				snapshots
					.map(
						(snapshot: any) =>
							({
								key: snapshot.key,
								...snapshot.val()
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
					/* Sort by timestamp ascending — onValue returns insertion order,
					   not timestamp order, so an explicit sort is needed. */
					.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
			)
		);
	}

	/**
	 * Gets a reactive observable of the child snapshots under the given query.
	 * Replaces the RxFire list() helper that was removed alongside @angular/fire —
	 * wraps onValue and re-emits all children as snapshot rows on every change.
	 *
	 * {@link getMovieList} - Streams the movies collection into MovieItemVO rows.
	 * {@link getHistory} - Streams the history collection newest-first.
	 * {@link getPatchNotes} - Streams the patch notes sorted by timestamp.
	 * {@link getDebtSonataTableDetails} - Streams the Account Expenses table rows.
	 * {@link getReminderTableDetails} - Streams the reminder table rows.
	 * {@link getQuotes} - Streams the quotes sorted newest-first.
	 *
	 * @param query - The database query or reference to observe.
	 * @returns An observable that emits the array of child snapshots.
	 */
	private listAsObservable(query: Query): Observable<DataSnapshot[]> {
		return new Observable((observer) => {
			const unsubscribe = onValue(
				query,
				(snapshot) => {
					const rows: DataSnapshot[] = [];
					snapshot.forEach((child) => {
						rows.push(child);
					});
					observer.next(rows);
				},
				(error) => observer.error(error)
			);
			return () => unsubscribe();
		});
	}

	// ── Update methods ───────────────────────────────────────────────────────

	/**
	 * Updates the date calculator table in the Firebase Realtime Database.
	 * Merges the entire table as a single flat object via one `update()` call —
	 * Firebase's tree structure allows this in a single round-trip, unlike CloudBase
	 * which requires a separate update per document.
	 *
	 * @param updatedTable - The object representing the full table to merge.
	 */
	public async updateDateCalculatorTable(updatedTable: any): Promise<void> {
		try {
			await update(dbRef(this.db, DATABASE_DATE_CALCULATOR), { ...updatedTable });
			LOG.info(this.className, 'Table record has been updated');
			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_REMINDER,
				type: ACTIVITY_TYPE_CALCULATOR_UPDATED
			}).catch(() => {});
		} catch (error: unknown) {
			LOG.error(this.className, 'Error while updating date calculator table', error as Error);
			throw error;
		}
	}

	/**
	 * Not implemented for Firebase — resolves immediately.
	 *
	 * @param _key - The key of the link to update (unused in this backend).
	 * @param _updates - The fields to update (unused in this backend).
	 * @param _domain - The hostname of the updated link (unused in this backend).
	 */
	public updateUsefulLink(
		_key: string,
		_updates: Partial<{ url: string; title: string; category: string; isPinned: boolean }>,
		_domain: string
	): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Not implemented for Firebase — resolves immediately.
	 *
	 * @param _key - The key of the category to update (unused in this backend).
	 * @param _updates - The fields to update (unused in this backend).
	 */
	public updateLinkCategory(
		_key: string,
		_updates: Partial<{ name: string; color: string; order: number }>,
		_name: string
	): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Not implemented for Firebase — resolves immediately.
	 *
	 * @param _recipe - The recipe to update (unused in this backend).
	 */
	public updateRecipe(_recipe: Recipe): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Records a new rate-search event in the history collection.
	 */
	public async updateHistoryWithNewSearchActivity(): Promise<void> {
		await this.addNewHistoryEntry(SEARCH);
	}

	/**
	 * Updates the movie rate in the database.
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
				this.appendToActivityLog({
					source: ACTIVITY_SOURCE_MOVIE,
					type: ACTIVITY_TYPE_RATE_UPDATED,
					title: movieItemVO.getMovieName()
				}).catch(() => {});
				const rateDifference = Number((movieItemVO.getMovieRate() - oldRate).toFixed(2));
				this.searchStreamService.addSearchLog(
					`${ENT_LOG_RATE_PRE}${movieItemVO.getMovieName()}${ENT_LOG_RATE_IS}<span ${
						rateDifference > 0 ? ENT_LOG_SPAN_CLASS_RATE_UP : ENT_LOG_SPAN_CLASS_RATE_DOWN
					}>${rateDifference > 0 ? ENT_LOG_RATE_UP : ENT_LOG_RATE_DOWN}${ENT_LOG_RATE_BY}${Math.abs(
						rateDifference
					)}${ENT_LOG_RATE_TO}${movieItemVO.getMovieRate()}`
				);
			} else {
				this.searchStreamService.addSearchLog(
					`${ENT_LOG_RATE_PRE}${movieItemVO.getMovieName()}${ENT_LOG_RATE_SAME}`
				);
			}
		} catch (error) {
			LOG.error(this.className, 'Error while updating movie rate', error as Error);
			throw error;
		}
	}

	/**
	 * Updates the movie genre in the database, updates genre statistics, and records the change
	 * in the activity log.
	 *
	 * @param movieKey - The key of the movie to update.
	 * @param oldGenre - The old genre value.
	 * @param newGenre - The new genre value.
	 * @param title - The movie title, recorded in the activity log.
	 */
	public updateMovieGenre(
		movieKey: string,
		oldGenre: string,
		newGenre: string,
		title: string
	): Promise<void> {
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
				this.appendToActivityLog({
					source: ACTIVITY_SOURCE_MOVIE,
					type: ACTIVITY_TYPE_GENRE_UPDATED,
					title
				}).catch(() => {});
			})
			.catch((error: Error) => {
				LOG.error(this.className, 'Error while updating movie genre', error);
				throw error;
			});
	}

	/**
	 * Updates the isFavourite flag for the given movie in the database, updates genre statistics,
	 * and records the change in the activity log.
	 *
	 * @param movieKey - The key of the movie to update.
	 * @param isFavourite - The boolean value to set.
	 * @param title - The movie title, recorded in the activity log.
	 */
	public updateMovieFavourite(movieKey: string, isFavourite: boolean, title: string): Promise<void> {
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
				this.appendToActivityLog({
					source: ACTIVITY_SOURCE_MOVIE,
					type: ACTIVITY_TYPE_FAVOURITE_UPDATED,
					title
				}).catch(() => {});
			})
			.catch((error: Error) => {
				LOG.error(this.className, 'Error while updating movie favourite', error);
				throw error;
			});
	}

	/**
	 * Updates a single field value in the reminder table and records the change in the activity log.
	 *
	 * @param entryKey - The key of the entry to update.
	 * @param valueKey - The key of the value to update.
	 * @param value - The new value to store.
	 * @param text - The reminder text, recorded in the activity log.
	 */
	public async updateReminderTable(
		entryKey: string,
		valueKey: string,
		value: any,
		text: string
	): Promise<void> {
		await this.updateTableExistingFields(DATABASE_REMINDER, entryKey, { [valueKey]: value });
		this.appendToActivityLog({
			source: ACTIVITY_SOURCE_REMINDER,
			type: ACTIVITY_TYPE_UPDATED,
			text
		}).catch(() => {});
	}

	/**
	 * Not implemented for Firebase — updates a single field value in the debt table
	 * without recording an activity log entry.
	 *
	 * @param entryKey - The key of the entry to update.
	 * @param valueKey - The key of the value to update.
	 * @param value - The new value to store.
	 * @param _ - The debt entry name (unused in this backend).
	 * @param _type - The activity log type (unused in this backend).
	 */
	public updateSingleValueForDebtTable(entryKey: string, valueKey: string, value: any, _: string, _type?: string): Promise<void> {
		return this.updateTableExistingFields(DATABASE_DEBT_SONATA, entryKey, { [valueKey]: value });
	}

	/**
	 * Updates multiple fields on a single debt record in one round-trip.
	 * Appends an activity log entry when a name is provided.
	 *
	 * @param entryKey - The key of the entry to update.
	 * @param fields - A record of field names and their new values.
	 * @param name - The debt entry name, recorded in the activity log. Omit to skip logging.
	 */
	public async updateDebtFields(
		entryKey: string,
		fields: Record<string, unknown>,
		name?: string
	): Promise<void> {
		await this.updateTableExistingFields(DATABASE_DEBT_SONATA, entryKey, fields);
		if (name !== undefined) {
			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_DEBT,
				type: ACTIVITY_TYPE_UPDATED,
				name
			}).catch(() => {});
		}
	}

	/**
	 * Not implemented for Firebase — throws immediately.
	 *
	 * @param _entryKey - The key of the entry to reset (unused in this backend).
	 * @param _originalAmount - The original debt amount to restore (unused in this backend).
	 * @param _paid - The paid status to restore (unused in this backend).
	 * @param _name - The debt entry name (unused in this backend).
	 */
	public resetDebtRecord(
		_entryKey: string,
		_originalAmount: number,
		_paid: boolean,
		_name: string
	): Promise<void> {
		throw new Error('Method not implemented.');
	}

	/**
	 * Updates the status of an existing record in the patch notes collection.
	 *
	 * @param key - The document key of the patch note to update.
	 * @param updatedRecord - The updated record data.
	 * @param _component - Unused in Firebase; present for interface compatibility.
	 * @param _element - Unused in Firebase; present for interface compatibility.
	 * @param _noteIndex - Unused in Firebase; present for interface compatibility.
	 */
	public updateStatusForOnePatchNote(
		key: string,
		updatedRecord: any,
		_component: string,
		_element: string,
		_noteIndex: number
	): Promise<void> {
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
	 * Updates the details of an existing record in the patch notes collection.
	 *
	 * @param _key - Unused in Firebase; present for interface compatibility.
	 * @param _updatedRecord - Unused in Firebase; present for interface compatibility.
	 * @param _component - Unused in Firebase; present for interface compatibility.
	 * @param _element - Unused in Firebase; present for interface compatibility.
	 * @param _noteIndex - Unused in Firebase; present for interface compatibility.
	 */
	public updateDetailsForOnePatchNote(
		_key: string,
		_updatedRecord: any,
		_component: string,
		_element: string,
		_noteIndex: number
	): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Updates specific fields in the statistics document.
	 * Used by page components to sync their data into the shared statistics collection
	 * while the page is active. The call is naturally lifecycle-scoped — components
	 * unsubscribe (or lose their subscription) on destroy, stopping further updates.
	 *
	 * @param fields - A flat or nested record of fields to merge into the statistics document.
	 */
	public async updateStatisticsFields(fields: Record<string, any>): Promise<void> {
		try {
			await update(this.statisticsRef, fields);
		} catch (error) {
			LOG.error(this.className, 'Error while updating statistics fields', error as Error);
		}
	}

	/**
	 * Prepends a new entry to the array named recent activity in the statistics document
	 * keeping at most STATS_CAP_ACTIVITY_LOG entries (newest first).
	 * Used for the unified recentActivities feed and any legacy per-source fields.
	 *
	 * @param activity - The activity object to record.
	 */
	private async appendToActivityLog(activity: any): Promise<void> {
		const timestamp = Utilities.getCurrentFormattedTime(true);
		const entry = { ...activity, timestamp };
		try {
			await runTransaction(this.statisticsRef, (currentData) => {
				currentData = currentData ?? {};
				const existing: any[] = Array.isArray(currentData[STATS_FIELD_RECENT_ACTIVITIES])
					? currentData[STATS_FIELD_RECENT_ACTIVITIES]
					: [];
				currentData[STATS_FIELD_RECENT_ACTIVITIES] = [entry, ...existing].slice(
					0,
					STATS_CAP_ACTIVITY_LOG
				);
				return currentData;
			});
		} catch (error) {
			LOG.error(this.className, 'Error while appending activity log', error as Error);
		}
	}

	/**
	 * Updates multiple fields in a single table record in one round-trip.
	 *
	 * {@link updateReminderTable} - Updates a single field value in the reminder table.
	 * {@link updateSingleValueForDebtTable} - Updates a single field value in the debt table.
	 * {@link updateDebtFields} - Updates multiple debt fields in one round-trip.
	 *
	 * @param tableName - The database collection name.
	 * @param entryKey - The key of the entry to update.
	 * @param fields - A record of field names and their new values.
	 */
	private async updateTableExistingFields(
		tableName: string,
		entryKey: string,
		fields: Record<string, unknown>
	): Promise<void> {
		try {
			await update(dbRef(this.db, `${tableName}/${entryKey}`), fields);
			LOG.info(this.className, `Record on ${tableName} has been updated`);
		} catch (error) {
			LOG.error(this.className, `Error while updating ${tableName}`, error as Error);
			throw error;
		}
	}

	// ── Removal methods ──────────────────────────────────────────────────────

	/**
	 * Not implemented for Firebase — resolves immediately.
	 *
	 * @param _key - The key of the link to remove (unused in this backend).
	 * @param _domain - The hostname of the removed link (unused in this backend).
	 */
	public removeUsefulLink(_key: string, _domain: string): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Not implemented for Firebase — resolves immediately.
	 *
	 * @param _key - The key of the category to remove (unused in this backend).
	 */
	public removeLinkCategory(_key: string, _name: string): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Removes a quote from the database and decrements the statistics total.
	 *
	 * @param key - The key of the quote to remove.
	 * @param author - The author of the quote (used for activity log).
	 */
	public async removeQuote(key: string, author: string): Promise<void> {
		try {
			await this.removeSingleItemFromDatabase(DATABASE_QUOTES, key);
			/* Update statistics: decrement total quote count.
			   latestQuote is intentionally left as-is; it refreshes on the next submission. */
			await runTransaction(this.statisticsRef, (currentData) => {
				currentData = currentData ?? {};
				currentData.totalQuotes = Math.max(0, (currentData.totalQuotes ?? 1) - 1);
				return currentData;
			});
			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_RESONANCE,
				type: HISTORY_STATUS_DELETED,
				author
			}).catch(() => {});
		} catch (error) {
			LOG.error(this.className, `Error while removing quote ${key}`, error as Error);
			throw error;
		}
	}

	/**
	 * Not implemented for Firebase — resolves immediately.
	 *
	 * @param _recipeId - The database ID of the recipe to delete (unused in this backend).
	 * @param _name - The recipe name (unused in this backend).
	 */
	public removeRecipe(_recipeId: string, _name: string): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Removes the movie from the database and its cover from storage.
	 *
	 * @param movieItemVO - The movie item to remove.
	 */
	public async removeMovieFromDatabase(movieItemVO: MovieItemVO): Promise<void> {
		try {
			// Step 1 : Remove cover image from storage
			const storageRefer = storageRef(this.storage, `/movies/${movieItemVO.getMovieName()}`);
			await deleteObject(storageRefer);

			// Step 2 : Remove movie document from database
			await remove(dbRef(this.db, `movies/${movieItemVO.getMovieKey()}`));

			// Step 3 : Add history entry
			await this.addNewHistoryEntry(HISTORY_STATUS_DELETED, movieItemVO);

			// Step 4 : Reclaim movie key for reuse
			const keys = await this.getReusableKeys();
			keys.push(movieItemVO.getMovieKey());
			await this.saveReusableKeys(keys);

			// Step 5 : Update movie statistics
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
				currentData.totalFilms = currentData.totalFilms - 1 > 0 ? currentData.totalFilms - 1 : 0;
				return currentData;
			});
			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_MOVIE,
				type: HISTORY_STATUS_DELETED,
				title: movieItemVO.getMovieName()
			}).catch(() => {});
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
	 * Removes a record from the reminder table and records the deletion in the activity log.
	 *
	 * @param key - The key of the record to remove.
	 * @param text - The reminder text, recorded in the activity log.
	 */
	public async removeRecordFromReminderTable(key: string, text: string): Promise<void> {
		await this.removeSingleItemFromDatabase(DATABASE_REMINDER, key);
		this.appendToActivityLog({
			source: ACTIVITY_SOURCE_REMINDER,
			type: HISTORY_STATUS_DELETED,
			text
		}).catch(() => {});
	}

	/**
	 * Removes a record from the debt table and records the deletion in the activity log.
	 *
	 * @param key - The key of the record to remove.
	 * @param name - The debt entry name, recorded in the activity log.
	 */
	public async removeRecordFromDebtTable(key: string, name: string): Promise<void> {
		await this.removeSingleItemFromDatabase(DATABASE_DEBT_SONATA, key);
		this.appendToActivityLog({
			source: ACTIVITY_SOURCE_DEBT,
			type: HISTORY_STATUS_DELETED,
			name
		}).catch(() => {});
	}

	/**
	 * Not implemented for Firebase — throws immediately.
	 *
	 * @param _entryKey - The key of the debt record (unused in this backend).
	 * @param _index - The index of the payment history entry to remove (unused in this backend).
	 */
	public removeSingleHistoryFromDebt(
		_entryKey: string,
		_index: number,
		_updatedDebt: number,
		_name: string
	): Promise<void> {
		throw new Error('Method not implemented.');
	}

	/**
	 * Removes a patch note from the database and records the deletion in the activity log.
	 *
	 * @param key - The document key of the patch note to remove.
	 * @param component - The component name of the deleted note, recorded in the activity log.
	 * @param element - The element name of the deleted note, recorded in the activity log.
	 * @param noteIndex - The 1-based display index of the deleted note, recorded in the activity log.
	 */
	public async removePatchNote(
		key: string,
		component: string,
		element: string,
		noteIndex: number
	): Promise<void> {
		await this.removeSingleItemFromDatabase(DATABASE_PATCH_NOTES, key);
		this.appendToActivityLog({
			source: ACTIVITY_SOURCE_PATCH,
			type: HISTORY_STATUS_DELETED,
			component,
			element,
			noteIndex
		}).catch(() => {});
	}

	/**
	 * Gets whether Tauri desktop notifications are enabled for the current user
	 * by reading the flag from the user's preferences node.
	 *
	 * @returns True when the Tauri notification flag is set in the user's preferences.
	 */
	public async getTauriNotifEnabled(): Promise<boolean> {
		const uid = this.firebaseAuth.currentUser?.uid;
		if (!uid) return false;
		const snap = await get(dbRef(this.db, `${DATABASE_USER_PREFERENCES}/${uid}`));
		return snap.val()?.[STATS_FIELD_TAURI_NOTIF_ENABLED] === true;
	}

	/**
	 * Persists the Tauri desktop notification preference for the current user
	 * by updating the flag in the user's preferences node.
	 *
	 * @param enabled - The desired enabled state.
	 */
	public async setTauriNotifEnabled(enabled: boolean): Promise<void> {
		const uid = this.firebaseAuth.currentUser?.uid;
		if (!uid) return;
		/* update() merges into the node — set() would overwrite the entire preferences object,
		   erasing minimize-on-close and locale fields stored at the same path. */
		await update(
			dbRef(this.db, `${DATABASE_USER_PREFERENCES}/${uid}`),
			{ [STATS_FIELD_TAURI_NOTIF_ENABLED]: enabled }
		);
	}

	/**
	 * Gets whether the desktop app minimizes to Dock on close for the current user.
	 *
	 * @returns True when the minimize-on-close flag is set in the user's preferences.
	 */
	public async getMinimizeOnClose(): Promise<boolean> {
		const uid = this.firebaseAuth.currentUser?.uid;
		if (!uid) return true;
		const snap = await get(dbRef(this.db, `${DATABASE_USER_PREFERENCES}/${uid}`));
		return snap.val()?.[STATS_FIELD_MINIMIZE_ON_CLOSE] === true;
	}

	/**
	 * Persists the minimize-on-close preference for the current user
	 * by updating the flag in the user's preferences node.
	 *
	 * @param enabled - The desired enabled state.
	 */
	public async setMinimizeOnClose(enabled: boolean): Promise<void> {
		const uid = this.firebaseAuth.currentUser?.uid;
		if (!uid) return;
		await update(
			dbRef(this.db, `${DATABASE_USER_PREFERENCES}/${uid}`),
			{ [STATS_FIELD_MINIMIZE_ON_CLOSE]: enabled }
		);
	}

	/**
	 * Gets the display locale preference for the current user from the user preferences node.
	 *
	 * @returns The stored locale ('en' or 'zh'), or null when not yet set.
	 */
	public async getLocale(): Promise<'en' | 'zh' | null> {
		const uid = this.firebaseAuth.currentUser?.uid;
		if (!uid) return null;
		const snap = await get(dbRef(this.db, `${DATABASE_USER_PREFERENCES}/${uid}`));
		const value = snap.val()?.[STATS_FIELD_LOCALE];
		return value === LOCALE_KEY_EN || value === LOCALE_KEY_ZH ? value : null;
	}

	/**
	 * Persists the display locale preference for the current user
	 * by updating the field in the user's preferences node.
	 *
	 * @param locale - The locale key to store: 'en' or 'zh'.
	 */
	public async setLocale(locale: 'en' | 'zh'): Promise<void> {
		const uid = this.firebaseAuth.currentUser?.uid;
		if (!uid) return;
		await update(
			dbRef(this.db, `${DATABASE_USER_PREFERENCES}/${uid}`),
			{ [STATS_FIELD_LOCALE]: locale }
		);
	}

	/**
	 * Removes a single record from the given table path by key.
	 *
	 * {@link removeRecordFromReminderTable} - Removes a reminder table record.
	 * {@link removeRecordFromDebtTable} - Removes a debt table record.
	 * {@link removeQuote} - Removes a quote from the quotes collection.
	 * {@link removePatchNote} - Removes a patch note by key.
	 *
	 * @param tablePath - The database collection path.
	 * @param key - The key of the record to remove.
	 */
	private removeSingleItemFromDatabase(tablePath: string, key: string): Promise<void> {
		return remove(dbRef(this.db, `${tablePath}/${key}`))
			.then(() => {
				LOG.info(this.className, `Record has been removed from ${tablePath}`);
			})
			.catch((error: Error) => {
				LOG.error(this.className, `Error while removing record from ${tablePath}`, error);
				throw error;
			});
	}

	// ── Add methods ──────────────────────────────────────────────────────────

	/**
	 * Not implemented for Firebase — resolves immediately.
	 *
	 * @param _link - The link object to add (unused in this backend).
	 */
	public addUsefulLink(_link: {
		url: string;
		title: string;
		category: string;
		visitCount: number;
		createdAt: string;
		isPinned: boolean;
	}): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Not implemented for Firebase — resolves immediately.
	 *
	 * @param _category - The category object to add (unused in this backend).
	 */
	public addLinkCategory(_category: { name: string; color: string; order: number }): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Adds a new quote to the database and updates the statistics collection.
	 *
	 * @param text - The quote text.
	 * @param author - The author of the quote.
	 * @param timestamp - The timestamp of the quote.
	 */
	public async addQuote(text: string, author: string, timestamp: string): Promise<void> {
		try {
			await push(dbRef(this.db, DATABASE_QUOTES), { text, author, timestamp });
			LOG.info(this.className, 'New quote has been added');
			await runTransaction(this.statisticsRef, (currentData) => {
				currentData = currentData ?? {};
				currentData.totalQuotes = (currentData.totalQuotes ?? 0) + 1;
				return currentData;
			});
			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_RESONANCE,
				type: HISTORY_STATUS_ADDED,
				author
			}).catch(() => {});
		} catch (error) {
			LOG.error(this.className, 'Error while adding quote', error as Error);
			throw error;
		}
	}

	/**
	 * Not implemented for Firebase — resolves immediately.
	 *
	 * @param _recipe - The recipe to persist (unused in this backend).
	 */
	public addRecipe(_recipe: Recipe): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Adds new movie data and updates the statistics accordingly.
	 *
	 * @param movieItemVO - The movie item to add.
	 */
	public async addNewMovieDataAndUpdateStatistics(movieItemVO: MovieItemVO): Promise<void> {
		try {
			// Step 1 : Acquire movie key (reusable or auto-incremented)
			const keys = await this.getReusableKeys();
			let movieKey: string;

			if (keys.length > 0) {
				movieKey = keys.shift()!; // Take the first reusable key
				await this.saveReusableKeys(keys); // Update the reusable keys
			} else {
				const snapshot = await get(this.moviesRef);
				movieKey = (Object.keys(snapshot.val()).length + 1).toString();
			}

			// Step 2 : Persist movie document
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

			// Step 3 : Add history entry
			await this.addNewHistoryEntry(HISTORY_STATUS_ADDED, movieItemVO);

			// Step 4 : Update movie statistics
			await runTransaction(dbRef(this.db, `statistics`), (currentData) => {
				currentData.genre[movieItemVO.getMovieGenre()] =
					(currentData.genre[movieItemVO.getMovieGenre()] ?? 0) + 1;
				if (movieItemVO.getIsFavourite()) {
					currentData.genre[GENRE_FAVOURITE] = (currentData.genre[GENRE_FAVOURITE] ?? 0) + 1;
				}

				currentData.totalFilms = (currentData.totalFilms ?? 0) + 1;
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
	 * Adds a new history entry with the given status and optional movie data.
	 *
	 * @param status - The status of the activity.
	 * @param movieItemVO - The movie item associated with the activity.
	 */
	protected async addNewHistoryEntry(status: string, movieItemVO?: MovieItemVO): Promise<void> {
		try {
			/* Capture timestamp once so the same value is used in the history message
			   and in the statistics update below. */
			const timestamp = Utilities.getCurrentFormattedTime(true);
			if (movieItemVO) {
				await push(dbRef(this.db, DATABASE_HISTORY), {
					id: movieItemVO.getMovieId(),
					status: status,
					message: this.buildHistoryMessage(status, timestamp, movieItemVO)
				});

				if (status === HISTORY_STATUS_ADDED) {
					this.appendToActivityLog({
						source: ACTIVITY_SOURCE_MOVIE,
						type: HISTORY_STATUS_ADDED,
						title: movieItemVO.getMovieName()
					}).catch(() => {});
				}
			} else {
				await push(dbRef(this.db, DATABASE_HISTORY), {
					status: status,
					message: this.buildHistoryMessage(status, timestamp)
				});

				this.appendToActivityLog({
					source: ACTIVITY_SOURCE_MOVIE,
					type: SEARCH
				}).catch(() => {});
			}
			LOG.info(this.className, 'New history entry has been added');
		} catch (error) {
			LOG.error(this.className, 'Error while adding new history entry', error as Error);
			throw error;
		}
	}

	/**
	 * Adds a new record to the reminder collection.
	 *
	 * @param newRecord - The new record to add.
	 */
	public addNewRecordToReminder(newRecord: any): Promise<void> {
		return this.addNewRecordToTable(DATABASE_REMINDER, newRecord);
	}

	/**
	 * Adds a new record to the debt collection.
	 *
	 * @param newRecord - The new record to add.
	 */
	public addNewRecordToDebt(newRecord: any): Promise<void> {
		return this.addNewRecordToTable(DATABASE_DEBT_SONATA, newRecord);
	}

	/**
	 * Adds a new record to the patch notes collection.
	 *
	 * @param newRecord - The record to add.
	 */
	public addNewRecordToPatchNotes(newRecord: any): Promise<void> {
		return push(dbRef(this.db, DATABASE_PATCH_NOTES), {
			/* Normalize text casing so patch note entries have consistent formatting
			   regardless of how the user typed them. */
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
	 * Pushes a new record under the given table in Firebase Realtime Database.
	 *
	 * {@link addNewRecordToReminder} - Adds a new record to the reminder collection.
	 * {@link addNewRecordToDebt} - Adds a new record to the debt collection.
	 *
	 * @param tableName - The database collection name.
	 * @param newRecord - The new record data to persist.
	 */
	private addNewRecordToTable(tableName: string, newRecord: any): Promise<void> {
		return push(dbRef(this.db, tableName), {
			content: { ...newRecord }
		})
			.then(() => {
				LOG.info(this.className, 'Table record has been updated');
				if (tableName === DATABASE_REMINDER) {
					this.appendToActivityLog({
						source: ACTIVITY_SOURCE_REMINDER,
						type: HISTORY_STATUS_ADDED,
						table: REMINDER_TABLE_MESSAGES,
						text: newRecord.text ?? ''
					}).catch(() => {});
				}
			})
			.catch((error: Error) => {
				LOG.error(this.className, 'Error while adding new record for reminder table', error);
				throw error;
			});
	}

	// ── Utility methods ───────────────────────────────────────────────────────

	/**
	 * Not implemented for Firebase — resolves immediately.
	 *
	 * @param _key - The key of the link (unused in this backend).
	 * @param _currentCount - The current visit count (unused in this backend).
	 */
	public incrementLinkVisit(_key: string, _currentCount: number): Promise<void> {
		return Promise.resolve();
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
			const snapshot = await get(this.moviesRef);
			/* Firebase Realtime DB does not support server-side .where() queries
			   like CloudBase, so we must iterate all movies to check for duplicates. */
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
	 * Uploads the movie cover to Firebase Storage and returns the downloadable link.
	 *
	 * @param coverImage - The movie cover to upload.
	 * @param movieName - The name of the movie to upload.
	 * @returns A string that represents the downloadable link of the movie cover.
	 */
	public async uploadImageAndGetDownloadLink(coverImage: Blob, movieName: string): Promise<string> {
		try {
			const storageRefer = storageRef(this.storage, `/movies/${movieName}`);
			/* Firebase Storage separates upload from URL generation:
			   first upload the Blob, then get a downloadable link. */
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
	 * Not implemented for Firebase — returns an empty response.
	 *
	 * @param _url - The URL to proxy (unused in this backend).
	 * @returns A resolved promise with empty content and contentType.
	 */
	public proxyFetch(_url: string): Promise<{ content: string; contentType: string }> {
		return Promise.resolve({ content: '', contentType: '' });
	}

	/**
	 * Gets the reusable keys from the database.
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
}
