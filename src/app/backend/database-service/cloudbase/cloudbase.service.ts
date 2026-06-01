import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { shareReplay, switchMap, take, filter } from 'rxjs/operators';
import { MovieItemVO } from '../../../fontend/entertainment/movieItem.vo';
import { CLOUDBASE, CloudbaseApp, DatabaseService } from '../database.service';
import { LOG } from '../../../common/app.logs';
import { Utilities } from '../../../common/app.utilities';
import { environment } from '../../../../environment/environment';
import {
	DATABASE_DATE_CALCULATOR,
	DATABASE_DEBT_SONATA,
	DATABASE_HISTORY,
	DATABASE_MOVIES,
	DATABASE_PATCH_NOTES,
	DATABASE_QUOTES,
	DATABASE_REMINDER,
	DATABASE_STATISTICS,
	DATABASE_RECIPES,
	DATABASE_USEFUL_LINKS,
	USEFUL_LINK_TYPE_LINK,
	USEFUL_LINK_TYPE_CATEGORY,
	ACTIVITY_TYPE_UPDATED,
	GENRE_FAVOURITE,
	HISTORY_STATUS_ADDED,
	HISTORY_STATUS_DELETED,
	RATE_DECREASED,
	RATE_INCREASED,
	REMINDER_TABLE_MESSAGES,
	SEARCH,
	STATS_CAP_ACTIVITY_LOG,
	STATS_FIELD_PATCH_IN_PROGRESS,
	STATS_FIELD_RECENT_MOVIE,
	STATS_FIELD_RECENT_PATCH,
	STATS_FIELD_RECENT_REMINDER,
	STATS_FIELD_RECENT_RESONANCE,
	STATS_FIELD_TOTAL_RECIPES,
	STATUS_IN_PROGRESS,
	ERROR_PERMISSION_DENIED,
	ROLE_ADMIN,
	STATS_FIELD_RECENT_DEBT
} from '../../../common/app.constant';
import { SearchStreamService } from '../../dialog-service/search/search-stream.service';
import { Recipe } from '../../../fontend/recipe/recipe.model';

@Injectable({ providedIn: 'root' })
export class CloudbaseService extends DatabaseService {
	private readonly className = 'CloudbaseService';
	// any: CloudBase SDK does not provide TypeScript types for its database instance
	private database: any;
	// any: CloudBase SDK returns document IDs as untyped values
	private statId: any;
	private static userId: string;
	private static userRole: string;
	private static userName: string;
	// any: '_' is a reserved keyword in the CloudBase SDK used to access its command builder
	private _!: any;
	private tempUrlCache = new Map<string, string>();
	private static _authReady$ = new ReplaySubject<boolean>(1);
	private static _loginState$ = new BehaviorSubject<boolean>(false);

	/**
	 * Emits only true — watchers must never receive false, or they would start
	 * a CloudBase .watch() with anonymous credentials after sign-out.
	 */
	static get authReady$() {
		return CloudbaseService._authReady$.asObservable().pipe(filter((v) => v === true));
	}

	/**
	 * Emits every real login-state change (true = non-anonymous user signed in,
	 * false = signed out or anonymous). Starts as false so new subscribers always
	 * get the correct initial state without waiting for a replay.
	 */
	static get loginState$() {
		return CloudbaseService._loginState$.asObservable();
	}

	/**
	 * Signals that auth state is confirmed, unblocking all watchers waiting for credentials.
	 */
	static markAuthReady() {
		this._authReady$.next(true);
	}

	/**
	 * Sets the real login state. True only for non-anonymous authenticated users.
	 *
	 * @param loggedIn - Whether a real (non-anonymous) user is signed in.
	 */
	static setLoginState(loggedIn: boolean) {
		this._loginState$.next(loggedIn);
	}

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		@Inject(CLOUDBASE) private cloudbase: CloudbaseApp,
		private searchStreamService: SearchStreamService
	) {
		super();
		if (isPlatformBrowser(this.platformId)) {
			this.database = this.cloudbase.database();
			this._ = this.database.command;

			const fetchStatId = () =>
				this.database
					.collection(DATABASE_STATISTICS)
					.limit(1)
					.get()
					.then((response: any) => {
						const id = response.data?.[0]?._id;
						if (id) this.statId = id;
					})
					.catch(() => {});

			// Attempt to resolve statId immediately (anonymous session may succeed);
			// retry once auth confirms so authenticated callers always have it ready
			fetchStatId();
			// Retry after auth confirms so statId is set before addQuote/removeQuote are called
			CloudbaseService.authReady$.pipe(take(1)).subscribe(() => fetchStatId());
		}
	}

	/**
	 * Gets the CloudBase authentication instance.
	 *
	 * @returns The CloudBase auth object.
	 */
	public getCloudbaseAuth() {
		return this.cloudbase.auth();
	}

	/**
	 * Sets the current user ID statically.
	 *
	 * @param userId - The user ID to set.
	 */
	public static setUseId(userId: string) {
		this.userId = userId;
		this._authReady$.next(!!userId);
	}

	/**
	 * Gets the current user ID.
	 *
	 * @returns The current user ID.
	 */
	public static getUseId() {
		return this.userId;
	}

	/**
	 * Sets the current user role statically.
	 *
	 * @param userRole - The user role to set.
	 */
	public static setUserRole(userRole: string) {
		this.userRole = userRole;
	}

	/**
	 * Sets the current user name statically.
	 *
	 * @param userName - The user name to set.
	 */
	public static setUserName(userName: string) {
		this.userName = userName;
	}

	/**
	 * Shorthand reference to the single statistics document.
	 * All stat reads and writes should go through this getter so the collection
	 * name and document ID never need to be repeated across methods.
	 */
	private get statisticsRef() {
		return this.database.collection(DATABASE_STATISTICS).doc(this.statId);
	}

	/**
	 * Gets the current user name.
	 *
	 * @returns The current user name.
	 */
	public static getUserName() {
		return this.userName;
	}

	/**
	 * Checks whether the current user has administrator rights.
	 *
	 * @returns True if the user is an administrator, otherwise false.
	 */
	public static userHasAllRights() {
		return this.userRole === ROLE_ADMIN;
	}

	/**
	 * Creates a real-time CloudBase watcher for a collection and exposes it as an Observable.
	 * All watchers follow the same authReady → switchMap → watcher.close() lifecycle;
	 * this helper eliminates the boilerplate so each public getter only supplies the
	 * collection name, a mapping function, and an optional error-propagation flag.
	 *
	 * @param collectionName - The CloudBase collection to watch.
	 * @param mapper - Transforms the raw docs array into the emitted value T.
	 * @param propagateErrors - When true, onError forwards the error to the observer
	 *   (in addition to logging it). Defaults to false so unexpected watcher errors
	 *   do not terminate subscriptions in components that lack an error handler.
	 * @returns A shared, replayed Observable that emits on every collection change.
	 */
	private watchCollection<T>(
		collectionName: string,
		mapper: (docs: any[]) => T,
		propagateErrors = false,
		queryBuilder?: (col: any) => any
	): Observable<T> {
		return CloudbaseService.authReady$
			.pipe(
				take(1),
				switchMap(
					() =>
						new Observable<T>((observer) => {
							const col = this.database.collection(collectionName);
							const query = queryBuilder ? queryBuilder(col) : col;
							const watcher = query.watch({
								onChange: (snapshot: any) => {
									observer.next(mapper(snapshot.docs));
								},
								onError: (err: any) => {
									LOG.error(
										this.className,
										`Error watching collection ${collectionName}`,
										err
									);
									if (propagateErrors) observer.error(err);
								}
							});
							return () => watcher.close();
						})
				)
			)
			.pipe(shareReplay(1));
	}

	/**
	 * Gets the movie list from CloudBase as a real-time observable.
	 *
	 * @returns An observable that emits the movie list.
	 */
	public getMovieList(): Observable<MovieItemVO[]> {
		return CloudbaseService.authReady$
			.pipe(
				take(1),
				switchMap(
					() =>
						new Observable<MovieItemVO[]>((observer) => {
							const watcher = this.database.collection(DATABASE_MOVIES).watch({
								onChange: (snapshot: any) => {
									const movies = snapshot.docs.map((doc: any) => {
										const movieItemVO = new MovieItemVO(doc.title, Number(doc.year));
										movieItemVO.setMovieKey(doc._id);
										movieItemVO.setMovieId(doc.id);
										movieItemVO.setMovieGenre(doc.genre);
										movieItemVO.setMovieRate(doc.rate);
										movieItemVO.setMovieCoverImageDownloadableLink(
											doc.coverImageLink ?? ''
										);
										movieItemVO.setMovieFirstReleaseDate(doc.firstReleaseDate);
										movieItemVO.setMovieEpisodeNumber(doc.episodeNumber);
										movieItemVO.setIsFavourite(doc.isFavourite);
										movieItemVO.setDescription(doc.description);
										movieItemVO.setActors(doc.actors);
										return movieItemVO;
									});

									movies.sort((a: MovieItemVO, b: MovieItemVO) =>
										a
											.getMovieFirstReleaseDate()
											.localeCompare(b.getMovieFirstReleaseDate())
									);

									// Resolve any Cloud IDs to signed temp URLs before emitting to the component
									this.resolveMovieCoverUrls(movies)
										.then((resolvedMovies) => observer.next(resolvedMovies))
										.catch((err) => {
											LOG.error(
												this.className,
												'Error resolving cover image URLs',
												err
											);
											observer.next(movies); // emit with unresolved links rather than nothing
										});
								},
								onError: (err: any) => {
									LOG.error(this.className, 'Error while retrieving movie list', err);
								}
							});
							return () => watcher.close();
						})
				)
			)
			.pipe(shareReplay(1));
	}

	/**
	 * Resolves CloudBase file IDs (cloud://…) in a movie list to signed temporary URLs.
	 * Results are cached in-memory so repeated watch emissions only resolve new / unseen file IDs.
	 * Any link that is not a valid cloud:// ID (e.g. null, empty, stale value) resolves to empty string.
	 *
	 * @param movies - The movie list to resolve in-place.
	 * @returns The same array with cloud:// IDs replaced by displayable temp URLs.
	 */
	private async resolveMovieCoverUrls(movies: MovieItemVO[]): Promise<MovieItemVO[]> {
		// Collect unique cloud:// IDs not yet in cache
		const toResolve = [
			...new Set(
				movies
					.map((m) => m.getMovieCoverImageDownloadableLink())
					.filter((link) => link?.startsWith('cloud://') && !this.tempUrlCache.has(link))
			)
		];

		if (toResolve.length > 0) {
			// CloudBase allows at most 50 file IDs per call
			for (let i = 0; i < toResolve.length; i += 50) {
				const batch = toResolve.slice(i, i + 50);
				try {
					const result: any = await this.cloudbase.getTempFileURL({ fileList: batch });
					for (const file of result.fileList) {
						// CloudBase SDK (CLOUD_API mode) returns each item with:
						//   { fileid, download_url }            on success
						//   { fileid, code: '<ERROR_CODE>' }   on failure (e.g. STORAGE_FILE_NONEXIST)
						if (file.download_url) {
							this.tempUrlCache.set(file.fileid, file.download_url);
						} else {
							LOG.warn(
								this.className,
								`No temp URL for ${file.fileid} (code: ${file.code ?? 'unknown'})`
							);
						}
					}
				} catch (error) {
					LOG.error(this.className, 'Error while getting temp file URLs', error as Error);
				}
			}
		}
		// Apply resolved URLs in-place; anything that isn't a resolved "cloud://" ID becomes empty string
		for (const movie of movies) {
			const link = movie.getMovieCoverImageDownloadableLink();
			movie.setMovieCoverImageDownloadableLink(
				link?.startsWith('cloud://') ? (this.tempUrlCache.get(link) ?? '') : ''
			);
		}

		return movies;
	}

	/**
	 * Gets the statistics from CloudBase as a real-time observable.
	 *
	 * @returns An observable that emits the statistics.
	 */
	public getStatistics(): Observable<any> {
		return this.watchCollection(DATABASE_STATISTICS, (docs) => docs[0]);
	}

	/**
	 * Gets the history list from CloudBase as a real-time observable.
	 *
	 * @returns The history list
	 */
	public getHistory(): Observable<any[]> {
		return this.watchCollection(DATABASE_HISTORY, (docs) =>
			docs
				.map((doc: any) => {
					const { _id, ...rest } = doc;
					return { key: _id, ...rest };
				})
				.reverse()
		);
	}

	/**
	 * Gets the patch notes from CloudBase as a real-time observable.
	 *
	 * @returns Patch notes
	 */
	public getPatchNotes(): Observable<any[]> {
		return this.watchCollection(DATABASE_PATCH_NOTES, (docs) => {
			const patchNotes = docs.map((doc: any) => {
				const { _id, ...rest } = doc;
				return { key: _id, ...rest } as {
					key: string;
					component: string;
					element: string;
					details: string;
					status: string;
					timestamp: string;
					isBug: boolean;
				};
			});
			// CloudBase watch order is insertion order, not timestamp order — explicit sort needed.
			patchNotes.sort((a: any, b: any) => a.timestamp.localeCompare(b.timestamp));
			return patchNotes;
		});
	}

	/**
	 * Gets the first reminder table details from CloudBase as a real-time observable.
	 *
	 * @returns Reminder table details
	 */
	public getDateCalculatorTableDetails(): Observable<any[]> {
		// Date calculator rows are flat — emit as-is. Fallback to [] prevents
		// downstream .length errors when the collection is empty.
		return this.watchCollection(DATABASE_DATE_CALCULATOR, (docs) => docs ?? []);
	}

	/**
	 * Gets the Account Expenses (debt sonata) table details from CloudBase as a real-time observable.
	 *
	 * @returns Account Expenses table details
	 */
	public getDebtSonataTableDetails(): Observable<any[]> {
		// Map CloudBase _id → key so Angular *ngFor can trackBy it;
		// name and content fields pass through as-is.
		return this.watchCollection(DATABASE_DEBT_SONATA, (docs) =>
			docs.map((doc: any) => {
				const { _id, ...rest } = doc;
				return { key: _id, ...rest } as {
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
		);
	}

	/**
	 * Gets the reminder table details from CloudBase as a real-time observable.
	 *
	 * @returns Reminder table details
	 */
	public getReminderTableDetails(): Observable<any[]> {
		// Content shape is {text, date, link}.
		return this.watchCollection(DATABASE_REMINDER, (docs) =>
			docs.map((doc: any) => {
				const { _id, ...rest } = doc;
				return { key: _id, ...rest } as {
					key: string;
					content: {
						text: string;
						date: string;
						link: string;
					};
				};
			})
		);
	}

	/**
	 * Uploads the movie cover to CloudBase Storage via a cloud function and returns the cloud:// file ID.
	 * The upload is done server-side (cloud function → COS) to avoid browser CORS restrictions on COS.
	 * The returned file ID is later resolved to a signed temp URL by resolveMovieCoverUrls().
	 *
	 * @param coverImage - The movie cover blob to upload.
	 * @param movieName - The name of the movie (used as the filename in storage).
	 * @returns The cloud:// file ID on success, or an empty string on failure.
	 */
	public async uploadImageAndGetDownloadLink(coverImage: Blob, movieName: string): Promise<string> {
		try {
			// Convert Blob to a raw base64 string (no data-URL prefix) for the function payload
			const base64 = await this.blobToBase64(coverImage);

			const result: any = await this.cloudbase.callFunction({
				name: 'uploadCoverImage',
				data: {
					accessToken: environment.cloudbase.accessToken,
					image: base64,
					movieName
				}
			});

			if (!result?.result?.success || !result?.result?.fileID) {
				throw new Error(result?.result?.error ?? 'uploadCoverImage did not return a fileID');
			}

			LOG.info(this.className, `Movie cover image uploaded successfully for ${movieName}`);

			// Return the cloud:// file ID; the display layer resolves it to a temp URL
			return result.result.fileID;
		} catch (error: any) {
			LOG.error(
				this.className,
				`Error while uploading image to CloudBase for ${movieName}: ${error?.message}`,
				error as Error
			);
			return '';
		}
	}

	/**
	 * Convert a Blob to a raw base64 string (without the data-URL prefix).
	 * Uses FileReader which handles large blobs without blowing the call stack.
	 *
	 * @param blob - The Blob to convert.
	 * @returns A promise that resolves to the raw base64 string.
	 */
	private blobToBase64(blob: Blob): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				const dataUrl = reader.result as string;
				// dataUrl format: "data:image/jpeg;base64,<base64data>"
				const base64 = dataUrl.split(',')[1];
				if (!base64) {
					reject(new Error('FileReader produced an unexpected data URL'));
				} else {
					resolve(base64);
				}
			};
			reader.onerror = () => reject(new Error('FileReader failed to read blob'));
			reader.readAsDataURL(blob);
		});
	}

	/**
	 * Adds a new entry to history stating that a new search activity has been initialized.
	 */
	public async updateHistoryWithNewSearchActivity(): Promise<void> {
		await this.addNewHistoryEntry(SEARCH);
	}

	/**
	 * Updates the movie rate in CloudBase.
	 *
	 * @param movieItemVO - The movie item to update.
	 */
	public async updateMovieRate(movieItemVO: MovieItemVO): Promise<void> {
		try {
			// Use .where() so the query satisfies the "doc._openid == auth.uid" security rule.
			const movieRef = this.database
				.collection(DATABASE_MOVIES)
				.where(this.buildWhereClause(movieItemVO.getMovieKey()));
			const movieData = await movieRef.get();
			const oldRate = movieData.data?.[0]?.rate;
			if (oldRate === undefined)
				throw new Error(`Movie document not found for key ${movieItemVO.getMovieKey()}`);

			if (oldRate !== movieItemVO.getMovieRate()) {
				const result = await movieRef.update({
					rate: movieItemVO.getMovieRate()
				});

				// CloudBase returns a non-empty result.code when the operation failed
				// (e.g. permission denied, document not found).
				if (result.code) throw new Error(result.message);

				// Fire-and-forget: record this rate update in stats for Recent Activity.
				const updatedTimestamp = Utilities.getCurrentFormattedTime(true);
				this.statisticsRef
					.update({
						lastMovieUpdated: {
							title: movieItemVO.getMovieName(),
							timestamp: updatedTimestamp
						}
					})
					.catch((err: any) =>
						LOG.error(this.className, 'Failed to update lastMovieUpdated stat', err)
					);
				this.appendToActivityLog(STATS_FIELD_RECENT_MOVIE, {
					type: ACTIVITY_TYPE_UPDATED,
					title: movieItemVO.getMovieName(),
					timestamp: updatedTimestamp
				}).catch(() => {});

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
	 * Updates the movie genre in CloudBase.
	 *
	 * @param movieKey - The key of the movie to update.
	 * @param oldGenre - The old genre value.
	 * @param newGenre - The new genre value.
	 */
	public async updateMovieGenre(movieKey: string, oldGenre: string, newGenre: string): Promise<void> {
		try {
			// Use .where() so the query satisfies the "doc._openid == auth.uid" security rule.
			const movieRes = await this.database
				.collection(DATABASE_MOVIES)
				.where(this.buildWhereClause(movieKey))
				.update({ genre: newGenre });
			if (movieRes.code) throw new Error(movieRes.message);
			LOG.info(this.className, `Movie genre has been updated`);

			// Step 2 : Update movie statistics
			const statRes = await this.statisticsRef.update({
				[`genre.${oldGenre}`]: this._.inc(-1),
				[`genre.${newGenre}`]: this._.inc(1)
			});
			if (statRes.code) throw new Error(statRes.message);
			LOG.info(this.className, `Movie statistics have been updated`);
		} catch (error) {
			LOG.error(this.className, 'Error while updating movie genre', error as Error);
			throw error;
		}
	}

	/**
	 * Updates the isFavourite flag for the given movie in CloudBase.
	 *
	 * @param movieKey - The key of the movie to update.
	 * @param isFavourite - The boolean value to set.
	 */
	public async updateMovieFavourite(movieKey: string, isFavourite: boolean): Promise<void> {
		try {
			// Use .where() so the query satisfies the "doc._openid == auth.uid" security rule.
			const movieRes = await this.database
				.collection(DATABASE_MOVIES)
				.where(this.buildWhereClause(movieKey))
				.update({ isFavourite });
			if (movieRes.code) throw new Error(movieRes.message);
			LOG.info(this.className, `Movie favourite tag has been updated`);

			// Step 2 : Update movie statistics
			const updatedData: any = {};
			if (isFavourite) {
				updatedData[`genre.${GENRE_FAVOURITE}`] = this._.inc(1);
			} else {
				updatedData[`genre.${GENRE_FAVOURITE}`] = this._.inc(-1);
			}
			const statRes = await this.statisticsRef.update(updatedData);
			if (statRes.code) throw new Error(statRes.message);
			LOG.info(this.className, `Movie statistics have been updated`);
		} catch (error) {
			LOG.error(this.className, 'Error while updating movie favourite', error as Error);
			throw error;
		}
	}

	/**
	 * Adds new movie data to CloudBase and updates the statistics accordingly.
	 *
	 * @param movieItemVO - The movie item to update.
	 */
	public async addNewMovieDataAndUpdateStatistics(movieItemVO: MovieItemVO): Promise<void> {
		try {
			// Add new movie data
			const userId = CloudbaseService.userHasAllRights() ? { _openid: CloudbaseService.userId } : {};
			const addMovieRes = await this.database.collection(DATABASE_MOVIES).add({
				...userId,
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
			if (addMovieRes.code) {
				throw new Error(addMovieRes.message);
			}

			// Add new entry to history
			await this.addNewHistoryEntry(HISTORY_STATUS_ADDED, movieItemVO);

			const timestamp = Utilities.getCurrentFormattedTime(true);
			const updatedData: any = {};
			updatedData[`genre.${movieItemVO.getMovieGenre()}`] = this._.inc(1);
			updatedData[`totalNumber`] = this._.inc(1);
			updatedData['lastAdded'] = {
				title: movieItemVO.getMovieName(),
				genre: movieItemVO.getMovieGenre(),
				timestamp
			};

			if (movieItemVO.getIsFavourite()) {
				updatedData[`genre.${GENRE_FAVOURITE}`] = this._.inc(1);
			}

			// Update the movie statistics (single call — no race condition with watcher)
			const statRes = await this.statisticsRef.update(updatedData);
			if (statRes.code) throw new Error(statRes.message);

			// Append to activity log so multiple adds are all visible in Recent Activity
			this.appendToActivityLog(STATS_FIELD_RECENT_MOVIE, {
				type: HISTORY_STATUS_ADDED,
				title: movieItemVO.getMovieName(),
				genre: movieItemVO.getMovieGenre(),
				timestamp
			}).catch(() => {});

			LOG.info(this.className, `Movie added and statistics have been updated`);
		} catch (error) {
			LOG.error(
				this.className,
				`Error while adding new movie data for ${movieItemVO.getMovieName()}`,
				error as Error
			);
			throw error;
		}
	}

	/**
	 * Removes a movie from the database, its cover image from CloudBase Storage,
	 * and update the statistics accordingly.
	 *
	 * @param movieItemVO - The movie item to remove.
	 */
	public async removeMovieFromDatabase(movieItemVO: MovieItemVO): Promise<void> {
		try {
			const removeRes = await this.database
				.collection(DATABASE_MOVIES)
				.where(this.buildWhereClause(movieItemVO.getMovieKey()))
				.remove();
			if (removeRes.code) throw new Error(removeRes.message);

			LOG.info(this.className, `Movie document removed for ${movieItemVO.getMovieName()}`);

			// Step 2: Remove the cover image from CloudBase Storage
			const coverRes: any = await this.cloudbase.callFunction({
				name: 'removeMovieCover',
				data: {
					accessToken: environment.cloudbase.accessToken,
					movieName: movieItemVO.getMovieName()
				}
			});
			if (!coverRes?.result?.success) {
				// Log but do not throw — a missing cover should not block the removal
				LOG.warn(
					this.className,
					`Cover image removal failed for ${movieItemVO.getMovieName()}: ${coverRes?.result?.error ?? 'unknown error'}`
				);
			} else {
				LOG.info(this.className, `Cover image removed for ${movieItemVO.getMovieName()}`);
			}

			// Step 3: Add a history entry
			await this.addNewHistoryEntry(HISTORY_STATUS_DELETED, movieItemVO);

			// Step 4: Decrement statistics (single call — no race condition with watcher)
			const timestamp = Utilities.getCurrentFormattedTime(true);
			const updatedData: any = {};
			updatedData[`genre.${movieItemVO.getMovieGenre()}`] = this._.inc(-1);
			updatedData[`totalNumber`] = this._.inc(-1);
			updatedData['lastDeleted'] = {
				title: movieItemVO.getMovieName(),
				genre: movieItemVO.getMovieGenre(),
				timestamp
			};

			if (movieItemVO.getIsFavourite()) {
				updatedData[`genre.${GENRE_FAVOURITE}`] = this._.inc(-1);
			}

			const statRes = await this.statisticsRef.update(updatedData);
			if (statRes.code) throw new Error(statRes.message);

			// Append to activity log so multiple deletes are all visible in Recent Activity
			this.appendToActivityLog(STATS_FIELD_RECENT_MOVIE, {
				type: HISTORY_STATUS_DELETED,
				title: movieItemVO.getMovieName(),
				genre: movieItemVO.getMovieGenre(),
				timestamp
			}).catch(() => {});

			LOG.info(this.className, `Statistics updated after removing ${movieItemVO.getMovieName()}`);
		} catch (error) {
			LOG.error(
				this.className,
				`Error while removing movie ${movieItemVO.getMovieName()}`,
				error as Error
			);
			throw error;
		}
	}

	/**
	 * Checks whether a given movie has already been added to the database.
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
			const result = await this.database
				.collection(DATABASE_MOVIES)
				.where({ id: movieId })
				.limit(1)
				.get();
			if (result.data?.length) return true;

			// Fallback: id-based query may miss entries where the external API returned
			// a different id for the same movie. A title+year query catches edge cases.
			const nameResult = await this.database
				.collection(DATABASE_MOVIES)
				.where({ title: movieName, year: movieYear })
				.limit(1)
				.get();
			return !!nameResult.data?.length;
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
	 * Adds a history entry with the given status and optional movie data.
	 *
	 * @param status - The status of the activity.
	 * @param movieItemVO - The movie item to update.
	 */
	protected async addNewHistoryEntry(status: string, movieItemVO?: MovieItemVO): Promise<void> {
		try {
			const userId = CloudbaseService.userHasAllRights() ? { _openid: CloudbaseService.userId } : {};
			// Capture timestamp once so the same value is used in the history message
			// and in the statistics update below (no need to parse it back from the string).
			const timestamp = Utilities.getCurrentFormattedTime(true);
			if (movieItemVO) {
				const result = await this.database.collection(DATABASE_HISTORY).add({
					...userId,
					id: movieItemVO.getMovieId(),
					status: status,
					message: this.buildHistoryMessage(status, timestamp, movieItemVO)
				});
				// CloudBase returns a non-empty result.code when the operation failed
				// (e.g. permission denied, document not found).
				if (result.code) throw new Error(result.message);
				// lastAdded / lastDeleted are updated together with genre/totalNumber
				// in the calling function (single statisticsRef.update call) to avoid
				// triggering the CloudBase watcher twice per operation.
			} else {
				// No movie VO means this is a search activity — record without movie metadata
				const result = await this.database.collection(DATABASE_HISTORY).add({
					...userId,
					status: status,
					message: this.buildHistoryMessage(status, timestamp)
				});
				// CloudBase returns a non-empty result.code when the operation failed
				// (e.g. permission denied, document not found).
				if (result.code) throw new Error(result.message);

				// Keep statistics in sync: record the most recent rate-search timestamp.
				await this.statisticsRef.update({ lastRateSearch: { timestamp } });
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
	 * Adds a new record to the patch notes collection.
	 *
	 * @param newRecord - The record to add.
	 */
	public async addNewRecordToPatchNotes(newRecord: any): Promise<void> {
		try {
			const userId = CloudbaseService.userHasAllRights() ? { _openid: CloudbaseService.userId } : {};
			const result = await this.database.collection(DATABASE_PATCH_NOTES).add({
				...userId,
				component: newRecord.component,
				element: Utilities.capitalizeFirstLetterWithOthersUnchanged(newRecord.element.trim()),
				details: Utilities.capitalizeFirstLetterWithOthersUnchanged(newRecord.details.trim()),
				status: newRecord.status,
				timestamp: newRecord.timestamp,
				isBug: newRecord.isBug
			});
			if (result.code) throw new Error(result.message);
			LOG.info(this.className, 'New patch notes record has been added');
			// Sync patchInProgress so the home-page widget reflects the new note
			// immediately without waiting for the subscription tap to run.
			this.syncPatchInProgressStat();
		} catch (error) {
			LOG.error(this.className, 'Error while adding new patch notes', error as Error);
			throw error;
		}
	}

	/**
	 * Updates an existing record in the patch notes collection.
	 *
	 * @param key - The key associated with the record
	 * @param updatedRecord - The record to update.
	 */
	public async updateExistingRecordToPatchNotes(key: string, updatedRecord: any): Promise<void> {
		try {
			const result = await this.database
				.collection(DATABASE_PATCH_NOTES)
				.where(this.buildWhereClause(key))
				.update({ ...updatedRecord });
			if (result.code) throw new Error(result.message);
			LOG.info(this.className, 'Patch notes record has been updated');
			// Sync patchInProgress so status-change edits reflect on the home-page
			// widget without waiting for the subscription tap.
			this.syncPatchInProgressStat();
		} catch (error) {
			LOG.error(this.className, 'Error while updating patch notes record', error as Error);
			throw error;
		}
	}

	/**
	 * Removes a patch note by key and resyncs the patchInProgress statistics field.
	 * so the home-page widget is up to date without waiting for the subscription tap.
	 *
	 * @param key - The document key of the patch note to remove.
	 */
	async removePatchNote(key: string): Promise<void> {
		try {
			const res = await this.database
				.collection(DATABASE_PATCH_NOTES)
				.where(this.buildWhereClause(key))
				.remove();
			if (res.code) throw new Error(res.message);
			LOG.info(this.className, `Record has been removed from ${DATABASE_PATCH_NOTES}`);
			this.syncPatchInProgressStat();
		} catch (error) {
			LOG.error(this.className, `Error while removing patch note ${key}`, error as Error);
			throw error;
		}
	}

	/**
	 * Queries all patch notes and rewrites the patchInProgress statistics field.
	 * Called after any mutation (add, update, delete) so the home-page widget
	 * always shows current data even when the Patch Notes page is not open.
	 */
	private syncPatchInProgressStat(): void {
		this.database
			.collection(DATABASE_PATCH_NOTES)
			.limit(1000)
			.get()
			.then((result: any) => {
				const allNotes: any[] = result.data ?? [];
				const inProgress = allNotes
					.filter((note: any) => note.status === STATUS_IN_PROGRESS)
					.map((note: any) => ({
						component: note.component,
						element: note.element,
						details: note.details,
						isBug: !!note.isBug
					}));
				return this.statisticsRef.update({ [STATS_FIELD_PATCH_IN_PROGRESS]: inProgress });
			})
			.catch((err: any) => LOG.error(this.className, 'Failed to sync patchInProgress stat', err));
	}

	////////////////////// Below are Update methods for database table records /////////////////

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
	 * Updates value to a given table
	 *
	 * @param tableName - The corresponding table name.
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
			// Branch on valueKey: "content" replaces entire content object (bulk edit);
			// any other key updates a single nested field inside content (e.g. toggling paid).
			const valueToUpdate =
				valueKey === 'content' ? { content: { ...value } } : { content: { [valueKey]: value } };
			const result = await this.database
				.collection(tableName)
				.where(this.buildWhereClause(entryKey))
				.update(valueToUpdate);
			if (result.updated === 0) throw new Error(ERROR_PERMISSION_DENIED);
			else if (result.code) throw new Error(result.message);
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
	public async updateDateCalculatorTable(updatedTable: any): Promise<void> {
		try {
			// CloudBase has no batch document update API — rows are updated individually.
			// _id and _openid are stripped since they are CloudBase metadata.
			// Promise.all runs all updates in parallel to avoid sequential round-trip latency.
			await Promise.all(
				updatedTable.map(async (data: any) => {
					const { _id, _openid, ...rest } = data;
					const result = await this.database
						.collection(DATABASE_DATE_CALCULATOR)
						.where(this.buildWhereClause(_id))
						.update(rest);
					if (result.code) throw new Error(ERROR_PERMISSION_DENIED);
				})
			);
			LOG.info(this.className, 'Reminder table has been updated');
		} catch (error) {
			LOG.error(this.className, 'Error while updating first reminder table', error as Error);
			throw error;
		}
	}

	////////////////////// Below are Removal methods for database table records ////////////////

	/**
	 * Removes a record from debt table.
	 *
	 * @param key - The key of the record to remove.
	 */
	public async removeRecordFromDebtTable(key: string): Promise<void> {
		this.removeRecordFromTable(DATABASE_DEBT_SONATA, key);
	}

	/**
	 * Removes a record from reminder table.
	 *
	 * @param key - The key of the record to remove.
	 */
	public async removeRecordFromReminderTable(key: string): Promise<void> {
		this.removeRecordFromTable(DATABASE_REMINDER, key);
	}

	/**
	 * Removes a record from a given table.
	 *
	 * @param tableName - Corresponding collection name
	 * @param key - The key of the record to remove
	 */
	private async removeRecordFromTable(tableName: string, key: string): Promise<void> {
		try {
			const result = await this.database
				.collection(tableName)
				.where(this.buildWhereClause(key))
				.remove();
			if (result.code) throw new Error(result.message);
			LOG.info(this.className, `Record has been removed from ${tableName}`);
		} catch (error) {
			LOG.error(this.className, `Error while removing a record from ${tableName}`);
			throw error;
		}
	}

	/**
	 * Removes an item from CloudBase by entry key.
	 *
	 * @param collectionName - The collection name in cloudbase
	 * @param key - The key associated with the record
	 */
	public async removeSingleItemFromDatabase(collectionName: string, key: string): Promise<void> {
		try {
			const result = await this.database
				.collection(collectionName)
				.where({ _id: key, _openid: CloudbaseService.getUseId() })
				.remove();
			if (result.code) throw new Error(result.message);
			LOG.info(this.className, `Record has been removed from ${collectionName}`);
		} catch (error) {
			LOG.error(this.className, `Error while removing record from ${collectionName}`, error as Error);
			throw error;
		}
	}

	/**
	 * Builds a where-clause for update or remove operations.
	 * Admin users bypass the _openid ownership constraint so they can modify any
	 * document regardless of who created it. Non-admin users are restricted to
	 * documents they own. All collections with the "doc._openid == auth.uid" write
	 * rule must use this clause to satisfy the security-rule subset requirement.
	 *
	 * @param id - The document _id to target.
	 * @returns A where clause with or without _openid based on the current user role.
	 */
	private buildWhereClause(id: string): { _id: string; _openid?: string } {
		return CloudbaseService.userHasAllRights()
			? { _id: id }
			: { _id: id, _openid: CloudbaseService.getUseId() };
	}

	////////////////////// Below are Add methods for database table records ////////////////////────

	/**
	 * Adds a new entry to reminder table.
	 *
	 * @param newRecord - The new entry to add.
	 */
	public async addNewRecordToReminderTable(newRecord: any): Promise<void> {
		this.addNewRecordToTable(DATABASE_REMINDER, STATS_FIELD_RECENT_REMINDER, newRecord);
	}

	/**
	 * Adds a new entry to the debt table.
	 *
	 * @param newRecord - The new entry to add.
	 */
	public async addNewRecordToDebtTable(newRecord: any): Promise<void> {
		this.addNewRecordToTable(DATABASE_DEBT_SONATA, STATS_FIELD_RECENT_DEBT, newRecord);
	}

	/**
	 * Adds a new entry to debt table
	 *
	 * @param tableName - The corresponding collection name.
	 * @param newRecord - The new entry to add.
	 */
	private async addNewRecordToTable(tableName: string, statsField: string, newRecord: any): Promise<void> {
		try {
			const userId = CloudbaseService.userHasAllRights() ? { _openid: CloudbaseService.userId } : {};
			const result = await this.database.collection(tableName).add({
				...userId,
				...newRecord
			});
			if (result.code) throw new Error(result.message);
			LOG.info(this.className, `${tableName} table has been updated`);
			// Fire-and-forget: record table additions in stats so the
			// home-page Recent Activity widget can surface them immediately.
			this.appendToActivityLog(statsField, {
				type: HISTORY_STATUS_ADDED,
				text: newRecord.text ?? '',
				timestamp: Utilities.getCurrentFormattedTime(true)
			}).catch(() => {});
		} catch (error) {
			LOG.error(this.className, `Error while adding new record to ${tableName}`, error as Error);
			throw error;
		}
	}

	/**
	 * Gets the quotes from the database as a real-time observable.
	 *
	 * @returns An observable that emits the quotes list.
	 */
	public getQuotes(): Observable<any[]> {
		return this.watchCollection(
			DATABASE_QUOTES,
			(docs) => {
				const quotes = docs.map((doc: any) => {
					const { _id, ...rest } = doc;
					return { key: _id, ...rest };
				});
				quotes.sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp));
				return quotes;
			},
			true
		);
	}

	/**
	 * Adds a new quote to the database.
	 *
	 * @param text - The quote text.
	 * @param author - The author of the quote.
	 * @param timestamp - The timestamp of the quote.
	 */
	public async addQuote(text: string, author: string, timestamp: string): Promise<void> {
		try {
			// Attach _openid whenever a user is authenticated so they can later delete their own quotes.
			// Falls back to empty object for anonymous users (no delete permission).
			const userId = CloudbaseService.getUseId() ? { _openid: CloudbaseService.getUseId() } : {};
			const result = await this.database.collection(DATABASE_QUOTES).add({
				...userId,
				text,
				author,
				timestamp
			});
			if (result.code) throw new Error(result.message);
			LOG.info(this.className, 'New quote has been added');
			// Update statistics: record latest quote and increment total count.
			await this.statisticsRef.update({
				latestQuote: { text, author, timestamp },
				totalQuotes: this._.inc(1)
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
	 * Removes a quote from the database and updates statistics.
	 *
	 * @param key - The key of the quote to remove.
	 * @param text - The text of the deleted quote (written to lastQuoteDeleted stat).
	 * @param author - The author of the deleted quote (written to lastQuoteDeleted stat).
	 */
	public async removeQuote(key: string, text: string, author: string): Promise<void> {
		try {
			// Admins may delete any quote regardless of ownership — bypass the _openid constraint.
			if (CloudbaseService.userHasAllRights()) {
				const result = await this.database.collection(DATABASE_QUOTES).where({ _id: key }).remove();
				if (result.code) throw new Error(result.message);
				LOG.info(this.className, `Record has been removed from ${DATABASE_QUOTES}`);
			} else {
				await this.removeSingleItemFromDatabase(DATABASE_QUOTES, key);
			}
			// Re-query remaining quotes so that latestQuote always reflects
			// the most recently added quote still in the collection.
			const remaining = await this.database.collection(DATABASE_QUOTES).limit(1000).get();
			const quotes: any[] = remaining.data ?? [];
			quotes.sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp));
			const latest = quotes[0];
			const deletedTimestamp = Utilities.getCurrentFormattedTime(true);
			await this.statisticsRef.update({
				totalQuotes: this._.inc(-1),
				latestQuote: latest
					? { text: latest.text, author: latest.author, timestamp: latest.timestamp }
					: null,
				lastQuoteDeleted: { text, author, timestamp: deletedTimestamp }
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
	 * Updates specific fields in the statistics document.
	 * Called by page components (Reminder, Patch) while they are active to sync
	 * live data into the shared statistics collection. The call stops naturally
	 * when the component is destroyed and its subscriptions are torn down.
	 *
	 * @param fields - Fields to merge into the statistics document.
	 */
	public async updateStatisticsFields(fields: Record<string, any>): Promise<void> {
		// statId is resolved asynchronously after auth confirms; skip silently if not yet ready.
		if (!this.statId) return;
		try {
			const result = await this.statisticsRef.update(fields);
			if (result.code) throw new Error(result.message ?? 'Failed to update statistics collection');
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
			const doc = await this.database.collection(DATABASE_STATISTICS).doc(this.statId).get();
			const raw = doc.data?.[0]?.[fieldName];
			const existing: any[] = raw ? (Array.isArray(raw) ? raw : Object.values(raw)) : [];
			// Dedup: remove any entries that share both type and timestamp with the new
			// activity before prepending. Guards against the read-write race that can
			// produce duplicate entries when two operations fire in the same second.
			const deduped = existing.filter(
				(e) => !(e.type === activity.type && e.timestamp === activity.timestamp)
			);
			// Prepend the new item and trim to the cap so CloudBase storage stays bounded.
			const updated = [activity, ...deduped].slice(0, STATS_CAP_ACTIVITY_LOG);
			const result = await this.statisticsRef.update({ [fieldName]: updated });
			if (result.code || result.updated === 0)
				throw new Error(
					result.message ??
						`No document updated for field "${fieldName}" — check CloudBase write permissions on statistics collection`
				);
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

	/**
	 * Gets the useful links from the database as a real-time observable.
	 *
	 * @returns An observable that emits the useful links list.
	 */
	public getUsefulLinks(): Observable<any[]> {
		// Filter to link-type documents only (excludes category docs in the same collection)
		return this.watchCollection(
			DATABASE_USEFUL_LINKS,
			(docs) =>
				docs
					.filter((doc: any) => doc.type !== USEFUL_LINK_TYPE_CATEGORY)
					.map((doc: any) => ({ ...doc })),
			true,
			(col) => col.where({ _openid: CloudbaseService.getUseId() })
		);
	}

	/**
	 * Adds a new useful link to the database.
	 *
	 * @param link - The link object to add.
	 */
	public async addUsefulLink(link: {
		url: string;
		title: string;
		category: string;
		visitCount: number;
		createdAt: string;
	}): Promise<void> {
		try {
			const userId = CloudbaseService.getUseId() ? { _openid: CloudbaseService.getUseId() } : {};
			const result = await this.database.collection(DATABASE_USEFUL_LINKS).add({
				...userId,
				type: USEFUL_LINK_TYPE_LINK,
				...link
			});
			if (result.code) throw new Error(result.message);
			LOG.info(this.className, 'New useful link has been added');
		} catch (error) {
			LOG.error(this.className, 'Error while adding useful link', error as Error);
			throw error;
		}
	}

	/**
	 * Updates an existing useful link in the database.
	 *
	 * @param key - The key of the link to update.
	 * @param updates - The fields to update.
	 */
	public async updateUsefulLink(
		key: string,
		updates: Partial<{ url: string; title: string; category: string }>
	): Promise<void> {
		try {
			const result = await this.database
				.collection(DATABASE_USEFUL_LINKS)
				.where({ _id: key, _openid: CloudbaseService.getUseId() })
				.update({ ...updates });
			if (result.code) throw new Error(result.message);
			LOG.info(this.className, 'Useful link has been updated');
		} catch (error) {
			LOG.error(this.className, `Error while updating useful link ${key}`, error as Error);
			throw error;
		}
	}

	/**
	 * Increment the visit count for a useful link.
	 *
	 * @param key - The key of the link.
	 * @param currentCount - The current visit count.
	 */
	public async incrementLinkVisit(key: string, currentCount: number): Promise<void> {
		try {
			const result = await this.database
				.collection(DATABASE_USEFUL_LINKS)
				.where({ _id: key, _openid: CloudbaseService.getUseId() })
				.update({ visitCount: currentCount + 1, lastVisited: new Date().toISOString() });
			if (result.code) throw new Error(result.message);
			LOG.info(this.className, 'Link visit count has been incremented');
		} catch (error) {
			LOG.error(this.className, `Error while incrementing visit count for link ${key}`, error as Error);
			throw error;
		}
	}

	/**
	 * Removes a useful link from the database.
	 *
	 * @param key - The key of the link to remove.
	 */
	public async removeUsefulLink(key: string): Promise<void> {
		await this.removeSingleItemFromDatabase(DATABASE_USEFUL_LINKS, key);
	}

	/**
	 * Gets the link categories from the database as a real-time observable.
	 *
	 * @returns An observable that emits the link categories list.
	 */
	public getLinkCategories(): Observable<any[]> {
		// Filter to category-type documents only (shares collection with links)
		return this.watchCollection(
			DATABASE_USEFUL_LINKS,
			(docs) =>
				docs
					.filter((doc: any) => doc.type === USEFUL_LINK_TYPE_CATEGORY)
					.map((doc: any) => ({ ...doc })),
			true,
			(col) => col.where({ _openid: CloudbaseService.getUseId() })
		);
	}

	/**
	 * Adds a new link category to the database.
	 *
	 * @param category - The category object to add.
	 */
	public async addLinkCategory(category: { name: string; color: string; order: number }): Promise<void> {
		try {
			const userId = CloudbaseService.getUseId() ? { _openid: CloudbaseService.getUseId() } : {};
			const result = await this.database.collection(DATABASE_USEFUL_LINKS).add({
				...userId,
				type: USEFUL_LINK_TYPE_CATEGORY,
				...category
			});
			if (result.code) throw new Error(result.message);
			LOG.info(this.className, 'New link category has been added');
		} catch (error) {
			LOG.error(this.className, 'Error while adding link category', error as Error);
			throw error;
		}
	}

	/**
	 * Updates an existing link category in the database.
	 *
	 * @param key - The key of the category to update.
	 * @param updates - The fields to update.
	 */
	public async updateLinkCategory(
		key: string,
		updates: Partial<{ name: string; color: string; order: number }>
	): Promise<void> {
		try {
			const result = await this.database
				.collection(DATABASE_USEFUL_LINKS)
				.where({ _id: key, _openid: CloudbaseService.getUseId() })
				.update({ ...updates });
			if (result.code) throw new Error(result.message);
			LOG.info(this.className, 'Link category has been updated');
		} catch (error) {
			LOG.error(this.className, `Error while updating link category ${key}`, error as Error);
			throw error;
		}
	}

	/**
	 * Removes a link category from the database.
	 *
	 * @param key - The key of the category to remove.
	 */
	public async removeLinkCategory(key: string): Promise<void> {
		await this.removeSingleItemFromDatabase(DATABASE_USEFUL_LINKS, key);
	}

	/**
	 * Proxy an HTTP GET request server-side to bypass browser CORS restrictions.
	 *
	 * Strategy (in order):
	 *  1. Call the Express server's `/api/fetch-url` endpoint — zero CloudBase
	 *     overhead, same Node.js process as the Angular SSR server.
	 *  2. Fall back to the `fetchUrl` CloudBase function if the server endpoint
	 *     is unavailable (e.g. running against a remote CloudBase-only deploy).
	 *
	 * @param url - The fully-qualified http/https URL to fetch.
	 * @returns The response body and Content-Type header value.
	 */
	public async proxyFetch(url: string): Promise<{ content: string; contentType: string }> {
		// Step 1: Try own Express server endpoint (production SSR server only)

		// The endpoint only exists when the compiled Express server is running.
		// In `ng serve` dev mode Angular intercepts all requests and returns HTML,
		// so we guard on Content-Type before attempting to parse JSON — this keeps
		// the dev experience clean with no spurious warnings.
		try {
			const res = await fetch(`/api/fetch-url?url=${encodeURIComponent(url)}`);
			if (res.ok && (res.headers.get('content-type') ?? '').includes('application/json')) {
				const json = (await res.json()) as {
					success: boolean;
					content?: string;
					contentType?: string;
					error?: string;
				};
				if (json.success) {
					return { content: json.content ?? '', contentType: json.contentType ?? '' };
				}
				// Endpoint exists but reported an error — log and fall through to CloudBase.
				LOG.warn(this.className, `/api/fetch-url error for ${url}: ${json.error}`);
			}
			// Non-JSON response means the Express server is not running (ng serve).
			// Fall through silently to CloudBase.
		} catch {
			// Network error reaching /api/fetch-url — fall through silently.
		}

		// Step 2: CloudBase callFunction (dev mode and CloudBase-only deploys)
		try {
			const result: any = await this.cloudbase.callFunction({
				name: 'fetchUrl',
				data: { accessToken: environment.cloudbase.accessToken, url }
			});
			if (!result?.result?.success) {
				throw new Error(result?.result?.error ?? 'fetchUrl returned an error');
			}
			return {
				content: result.result.content ?? '',
				contentType: result.result.contentType ?? ''
			};
		} catch (error) {
			LOG.error(this.className, `Error while proxying fetch for ${url}`, error as Error);
			throw error;
		}
	}

	////////////////////// Below are Recipe table methods (read, write, remove) ///////////////

	/**
	 * Watch the recipes collection and emit all recipes on every change.
	 * Read access is enforced by the database security rule (non-anonymous
	 * authenticated users only); no additional client-side owner filter is applied
	 * so that all users see the full shared recipe list.
	 *
	 * @returns An observable that emits the full recipe list whenever the collection changes.
	 */
	public getRecipes(): Observable<Recipe[]> {
		return this.watchCollection(
			DATABASE_RECIPES,
			(docs) =>
				docs.map((doc: any) => ({
					id: doc._id,
					openid: doc._openid ?? '',
					name: doc.name,
					detailName: doc.detailName,
					category: doc.category,
					bandClass: doc.bandClass,
					cookTimeMin: doc.cookTimeMin ?? 0,
					baseServings: doc.baseServings ?? 1,
					badges: doc.badges ?? [],
					groups: doc.groups ?? [],
					steps: (doc.steps ?? []).map((s: any) => ({ ...s, done: false })),
					notes: doc.notes ?? ''
				})) as Recipe[],
			true
		);
	}

	/**
	 * Adds a new recipe to the database for the current user.
	 *
	 * @param recipe - The recipe to persist.
	 */
	public async addRecipe(recipe: Recipe): Promise<void> {
		try {
			const { id: _, ...payload } = recipe;
			const userId = CloudbaseService.getUseId() ? { _openid: CloudbaseService.getUseId() } : {};
			const result = await this.database.collection(DATABASE_RECIPES).add({
				...userId,
				...payload,
				steps: payload.steps.map((s) => ({ ...s, done: false }))
			});
			if (result.code) throw new Error(result.message);
			LOG.info(this.className, `Recipe added: "${recipe.name}"`);
			// Fire-and-forget: keep totalRecipes in sync so the home stat chip updates in realtime.
			this.statisticsRef.update({ [STATS_FIELD_TOTAL_RECIPES]: this._.inc(1) }).catch(() => {});
		} catch (error) {
			LOG.error(this.className, `Error while adding recipe "${recipe.name}"`, error as Error);
			throw error;
		}
	}

	/**
	 * Updates an existing recipe in the database.
	 * Uses `recipe.id` to locate the document.
	 *
	 * @param recipe - The recipe with updated fields. `recipe.id` must match an existing document.
	 */
	public async updateRecipe(recipe: Recipe): Promise<void> {
		try {
			const { id, ...payload } = recipe;
			const result = await this.database
				.collection(DATABASE_RECIPES)
				.where(this.buildWhereClause(id))
				.update({
					...payload,
					steps: payload.steps.map((s) => ({ ...s, done: false }))
				});
			if (result.updated === 0) throw new Error(ERROR_PERMISSION_DENIED);
			LOG.info(this.className, `Recipe updated: "${recipe.name}"`);
		} catch (error) {
			LOG.error(this.className, `Error while updating recipe "${recipe.name}"`, error as Error);
			throw error;
		}
	}

	/**
	 * Removes a recipe from the database.
	 *
	 * @param recipeId - The `_id` of the recipe document to delete.
	 */
	public async removeRecipe(recipeId: string): Promise<void> {
		try {
			const res = await this.database
				.collection(DATABASE_RECIPES)
				.where(this.buildWhereClause(recipeId))
				.remove();
			if (res.code) throw new Error(res.message);
			LOG.info(this.className, `Recipe removed: ${recipeId}`);
			// Fire-and-forget: keep totalRecipes in sync so the home stat chip updates in realtime.
			this.statisticsRef.update({ [STATS_FIELD_TOTAL_RECIPES]: this._.inc(-1) }).catch(() => {});
		} catch (error) {
			LOG.error(this.className, `Error while removing recipe ${recipeId}`, error as Error);
			throw error;
		}
	}
}
