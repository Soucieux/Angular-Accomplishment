import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { shareReplay, switchMap, take, filter } from 'rxjs/operators';
import { MovieItemVO } from '../../../common/movieitem.vo';
import { CLOUDBASE, CloudbaseApp, DatabaseService } from '../database.service';
import { LOG } from '../../../common/app.logs';
import { Utilities } from '../../../common/app.utilities';
import { environment } from '../../../../environment/environment';
import {
	DATABASE_FIRST_TABLE,
	DATABASE_HISTORY,
	DATABASE_MOVIES,
	DATABASE_PATCH_NOTES,
	DATABASE_QUOTES,
	DATABASE_REMINDER_FIRST,
	DATABASE_REMINDER_SECOND,
	DATABASE_REMINDER_THIRD,
	DATABASE_SECOND_TABLE,
	DATABASE_STATISTICS,
	DATABASE_THIRD_TABLE,
	ERROR_PERMISSION_DENIED,
	GENRE_FAVOURITE,
	HISTORY_STATUS_ADDED,
	HISTORY_STATUS_DELETED,
	NO_RATE,
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
	STATUS_IN_PROGRESS
} from '../../../common/app.constant';

@Injectable({ providedIn: 'root' })
export class CloudbaseService extends DatabaseService {
	private readonly className = 'CloudbaseService';
	private database: any;
	private statId: any;
	private static userId: string;
	private static userRole: string;
	private static userName: string;
	private _!: any;
	private searchStreamService: any;
	private tempUrlCache = new Map<string, string>();
	private static _authReady$ = new ReplaySubject<boolean>(1);

	/**
	 * Emits only true — watchers must never receive false, or they would start
	 * a CloudBase .watch() with anonymous credentials after sign-out.
	 */
	static get authReady$() {
		return CloudbaseService._authReady$.asObservable().pipe(filter((v) => v === true));
	}

	/**
	 * Emits every auth-state change (true / false) — for components that need
	 * to react to sign-out by hiding data or switching views.
	 */
	static get loginState$() {
		return CloudbaseService._authReady$.asObservable();
	}

	/** Signal auth state confirmed — unblocks all watchers waiting for credentials. */
	static markAuthReady() {
		this._authReady$.next(true);
	}

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		@Inject(CLOUDBASE) private cloudbase: CloudbaseApp,
		private utilities: Utilities
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

			fetchStatId();
			// Retry after auth confirms so statId is set before addQuote/removeQuote are called
			CloudbaseService.authReady$.pipe(take(1)).subscribe(() => fetchStatId());

			// this.tempHelpFunction();
		}
	}

	/**
	 * Get the CloudBase authentication instance.
	 *
	 * @returns The CloudBase auth object.
	 */
	public getCloudbaseAuth() {
		return this.cloudbase.auth();
	}

	/**
	 * Set the current user ID statically.
	 *
	 * @param userId - The user ID to set.
	 */
	public static setUseId(userId: string) {
		this.userId = userId;
		this._authReady$.next(!!userId);
	}

	/**
	 * Get the current user ID.
	 *
	 * @returns The current user ID.
	 */
	public static getUseId() {
		return this.userId;
	}

	/**
	 * Set the current user role statically.
	 *
	 * @param userRole - The user role to set.
	 */
	public static setUserRole(userRole: string) {
		this.userRole = userRole;
	}

	/**
	 * Set the current user name statically.
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
	 * Get the current user name.
	 *
	 * @returns The current user name.
	 */
	public static getUserName() {
		return this.userName;
	}

	/**
	 * Check if the current user has administrator rights.
	 *
	 * @returns true if the user is an administrator, otherwise false.
	 */
	public static userHasAllRights() {
		return this.userRole === '管理员';
	}

	/**
	 * Temporary helper function to migrate movie cover image links to cloud:// file IDs.
	 * Fetches all movie documents and updates their coverImageLink to the cloud:// format.
	 */
	public async tempHelpFunction() {
		// Step 1: Fetch all movie documents
		const data = await this.database.collection(DATABASE_MOVIES).get();
		const movies: any[] = data.data;
		LOG.info(this.className, `Fetched ${movies.length} movies from database`);

		// Step 2: Update each movie's coverImageLink to the cloud:// file ID.
		// The format mirrors what the uploadCoverImage cloud function returns:
		//   cloud://[envId].[bucket]/movies/[title].jpeg
		// The files are already in CloudBase Storage — no re-upload is needed.
		let updated = 0;

		for (const movie of movies) {
			const fileID = `cloud://${environment.cloudbase.envId}.${environment.cloudbase.bucket}/movies/${movie.title}.jpeg`;
			await this.database
				.collection(DATABASE_MOVIES)
				.where({
					_id: movie._id,
					_openid: CloudbaseService.getUseId()
				})
				.update({
					coverImageLink: fileID
				});
			updated++;
			LOG.info(this.className, `[${updated}/${movies.length}] ${movie.title} → ${fileID}`);
		}

		LOG.info(
			this.className,
			`Migration complete: updated ${updated} movie cover links to cloud:// file IDs`
		);
	}

	/**
	 * Get the movie list from cloudbase.
	 *
	 * @returns An observable that emits the movie list.
	 */
	public override getMovieList(): Observable<MovieItemVO[]> {
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
	 * Resolve CloudBase file IDs (cloud://…) in a movie list to signed temporary URLs.
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
	 * Get the statistics from cloudbase.
	 *
	 * @returns An observable that emits the statistics.
	 */
	public getStatistics(): Observable<any> {
		return CloudbaseService.authReady$
			.pipe(
				take(1),
				switchMap(
					() =>
						new Observable<any>((observer) => {
							const watcher = this.database.collection(DATABASE_STATISTICS).watch({
								onChange: (snapshot: any) => {
									observer.next(snapshot.docs[0]);
								},
								onError: (err: any) => {
									LOG.error(this.className, 'Error while retrieving statistics', err);
								}
							});
							return () => watcher.close();
						})
				)
			)
			.pipe(shareReplay(1));
	}

	/**
	 * Retrieve history list
	 *
	 * @returns The history list
	 */
	public getHistory(): Observable<any[]> {
		return CloudbaseService.authReady$
			.pipe(
				take(1),
				switchMap(
					() =>
						new Observable<any[]>((observer) => {
							const watcher = this.database.collection(DATABASE_HISTORY).watch({
								onChange: (snapshot: any) => {
									const history = snapshot.docs
										.map((doc: any) => {
											const { _id, ...rest } = doc;
											return {
												key: _id,
												...rest
											};
										})
										.reverse();

									observer.next(history);
								}
							});
							return () => watcher.close();
						})
				)
			)
			.pipe(shareReplay(1));
	}

	/**
	 * Get patch notes
	 *
	 * @returns Patch notes
	 */
	public getPatchNotes(): Observable<any[]> {
		return CloudbaseService.authReady$
			.pipe(
				take(1),
				switchMap(
					() =>
						new Observable<any[]>((observer) => {
							const watcher = this.database.collection(DATABASE_PATCH_NOTES).watch({
								onChange: (snapshot: any) => {
									const patchNotes = snapshot.docs.map((doc: any) => {
										const { _id, ...rest } = doc;
										return {
											key: _id,
											...rest
										} as {
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
									patchNotes.sort((a: any, b: any) =>
										a.timestamp.localeCompare(b.timestamp)
									);

									observer.next(patchNotes);
								}
							});
							return () => watcher.close();
						})
				)
			)
			.pipe(shareReplay(1));
	}

	/**
	 * Get reminder table details
	 *
	 * @returns Reminder table details
	 */
	public getFirstReminderTableDetails(): Observable<any[]> {
		return CloudbaseService.authReady$
			.pipe(
				take(1),
				switchMap(
					() =>
						new Observable<any[]>((observer) => {
							const watcher = this.database.collection(DATABASE_REMINDER_FIRST).watch({
								onChange: (snapshot: any) => {
									// First table rows are flat — emit as-is. Fallback to [] prevents
									// downstream .length errors when the collection is empty.
									const data = snapshot.docs;
									observer.next(data ? data : []);
								}
							});
							return () => watcher.close();
						})
				)
			)
			.pipe(shareReplay(1));
	}

	/**
	 * Get second reminder table details
	 *
	 * @returns Second reminder table details
	 */
	public getSecondReminderTableDetails(): Observable<any[]> {
		return CloudbaseService.authReady$
			.pipe(
				take(1),
				switchMap(
					() =>
						new Observable<any[]>((observer) => {
							const watcher = this.database.collection(DATABASE_REMINDER_SECOND).watch({
								onChange: (snapshot: any) => {
									// Map CloudBase _id → key so Angular *ngFor can trackBy it;
									// name and content fields pass through as-is.
									const secondTable = snapshot.docs.map((doc: any) => {
										const { _id, ...rest } = doc;
										return {
											key: _id,
											...rest
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
									});
									observer.next(secondTable);
								}
							});
							return () => watcher.close();
						})
				)
			)
			.pipe(shareReplay(1));
	}

	/**
	 * Get third reminder table details
	 *
	 * @returns Third reminder table details
	 */
	public getThirdReminderTableDetails(): Observable<any[]> {
		return CloudbaseService.authReady$
			.pipe(
				take(1),
				switchMap(
					() =>
						new Observable<any[]>((observer) => {
							const watcher = this.database.collection(DATABASE_REMINDER_THIRD).watch({
								onChange: (snapshot: any) => {
									// Same watch→map→emit pattern as second table, but third table
									// content shape is {text, date, link} so mapping differs accordingly.
									const thirdTable = snapshot.docs.map((doc: any) => {
										const { _id, ...rest } = doc;
										return {
											key: _id,
											...rest
										} as {
											key: string;
											content: {
												text: string;
												date: string;
												link: string;
											};
										};
									});
									observer.next(thirdTable);
								}
							});
							return () => watcher.close();
						})
				)
			)
			.pipe(shareReplay(1));
	}

	/**
	 * Upload the movie cover to CloudBase Storage via a cloud function and return the cloud:// file ID.
	 * The upload is done server-side (cloud function → COS) to avoid browser CORS restrictions on COS.
	 * The returned file ID is later resolved to a signed temp URL by resolveMovieCoverUrls().
	 *
	 * @param coverImage - The movie cover blob to upload.
	 * @param movieName - The name of the movie (used as the filename in storage).
	 * @returns The cloud:// file ID on success, or an empty string on failure.
	 */
	public override async uploadImageAndGetDownloadLink(coverImage: Blob, movieName: string): Promise<string> {
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
	 * Add new entry to history stating that a new search activity has been initialized
	 */
	public override async updateHistoryWithNewSearchActivity(): Promise<void> {
		await this.addNewHistoryEntry(SEARCH);
	}

	/**
	 * Update the movie rate to cloudbase.
	 *
	 * @param movieItemVO - The movie item to update.
	 */
	public override async updateMovieRate(movieItemVO: MovieItemVO): Promise<void> {
		// Step 1 : Gather necessary info
		const movieRef = this.database.collection(DATABASE_MOVIES).doc(movieItemVO.getMovieKey());
		const oldRate = movieRef.exists() ? movieRef.get().rate : undefined;

		try {
			// Step 2 : Compare latest rate with the one stored in the database
			if (oldRate !== undefined && oldRate !== movieItemVO.getMovieRate()) {
				const result = await movieRef.update({
					rate: movieItemVO.getMovieRate()
				});

				// CloudBase returns a non-empty result.code when the operation failed
				// (e.g. permission denied, document not found).
				if (result.code) throw new Error(result.message);

				// Fire-and-forget: record this rate update in stats for Recent Activity.
				const updatedTimestamp = this.utilities.getCurrentFormattedTime(true);
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
					type: 'updated',
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
			LOG.error(this.className, 'Error while updaing movie rate', error as Error);
			throw error;
		}
	}

	/**
	 * Update the movie genre to cloudbase.
	 *
	 * @param movieKey - The key of the movie to update.
	 * @param oldGenre - The old genre value.
	 * @param newGenre - The new genre value.
	 */
	public override updateMovieGenre(movieKey: string, oldGenre: string, newGenre: string): Promise<void> {
		const movieRef = this.database.collection(DATABASE_MOVIES).doc(movieKey);
		// Step 1 : Update movie genre
		return movieRef
			.update({
				genre: newGenre
			})
			.then((result: any) => {
				// CloudBase returns a non-empty result.code when the operation failed
				// (e.g. permission denied, document not found).
				if (result.code) throw new Error(result.message);

				LOG.info(this.className, `Movie genre has been updated`);

				// Step 2 : Update movie statistics
				return this.statisticsRef.update({
					[`genre.${oldGenre}`]: this._.inc(-1),
					[`genre.${newGenre}`]: this._.inc(1)
				});
			})
			.then((result: any) => {
				// CloudBase returns a non-empty result.code when the operation failed
				// (e.g. permission denied, document not found).
				if (result.code) throw new Error(result.message);

				LOG.info(this.className, `Movie statistics have been updated`);
			});
	}

	/**
	 * Update isFavourite for the given movie to cloudbase.
	 *
	 * @param movieKey - The key of the movie to update.
	 * @param isFavourite - The boolean value to set.
	 */
	public override updateMovieFavourite(movieKey: string, isFavourite: boolean): Promise<void> {
		const movieRef = this.database.collection(DATABASE_MOVIES).doc(movieKey);
		// Step 1 : Update movie favourite
		return movieRef
			.update({
				isFavourite: isFavourite
			})
			.then((result: any) => {
				// CloudBase returns a non-empty result.code when the operation failed
				// (e.g. permission denied, document not found).
				if (result.code) throw new Error(result.message);

				LOG.info(this.className, `Movie favourite tag has been updated`);

				// Step 2 : Update movie statistics
				const updatedData: any = {};

				if (isFavourite) {
					updatedData[`genre.${GENRE_FAVOURITE}`] = this._.inc(1);
				} else {
					updatedData[`genre.${GENRE_FAVOURITE}`] = this._.inc(-1);
				}

				return this.statisticsRef.update(updatedData);
			})
			.then((result: any) => {
				// CloudBase returns a non-empty result.code when the operation failed
				// (e.g. permission denied, document not found).
				if (result.code) throw new Error(result.message);

				LOG.info(this.className, `Movie statistics have been updated`);
			});
	}

	/**
	 * Update all movie data and statistics to cloudbase.
	 *
	 * @param movieItemVO - The movie item to update.
	 */
	public override async addNewMovieDataAndUpdateStatistics(movieItemVO: MovieItemVO): Promise<void> {
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

			const timestamp = this.utilities.getCurrentFormattedTime(true);
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
				type: 'added',
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
	 * Remove a movie from the database, its cover image from CloudBase Storage,
	 * and update the statistics accordingly.
	 *
	 * @param movieItemVO - The movie item to remove.
	 */
	public override async removeMovieFromDatabase(movieItemVO: MovieItemVO): Promise<void> {
		try {
			// Step 1: Remove the movie document from the database
			const removeRes = await this.database
				.collection(DATABASE_MOVIES)
				.where({ _id: movieItemVO.getMovieKey(), _openid: CloudbaseService.getUseId() })
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
			const timestamp = this.utilities.getCurrentFormattedTime(true);
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
				type: 'deleted',
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
	 * Check if a given movie has already been added in the databse
	 *
	 * @param movieName Movie name to check
	 * @param movieYear Movie year to check
	 * @param movieId Movie ID to check
	 * @returns true if the movie already exists, otherwise, false.
	 */
	public override async isMovieAlreadyAdded(movieName: string, movieYear: number, movieId: number): Promise<boolean> {
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
	 * Add history with new activity
	 *
	 * @param status - The status of the activity.
	 * @param movieItemVO - The movie item to update.
	 */
	protected async addNewHistoryEntry(status: string, movieItemVO?: MovieItemVO): Promise<void> {
		try {
			const userId = CloudbaseService.userHasAllRights() ? { _openid: CloudbaseService.userId } : {};
			// Capture timestamp once so the same value is used in the history message
			// and in the statistics update below (no need to parse it back from the string).
			const timestamp = this.utilities.getCurrentFormattedTime(true);
			if (movieItemVO) {
				const result = await this.database.collection(DATABASE_HISTORY).add({
					...userId,
					id: movieItemVO.getMovieId(),
					status: status,
					message: `${movieItemVO.getMovieName()} - ${movieItemVO.getMovieGenre()} (Rate: ${
						movieItemVO.getMovieRate() == 0 ? NO_RATE : movieItemVO.getMovieRate()
					}) was ${status} on ${timestamp}`
				});
				// CloudBase returns a non-empty result.code when the operation failed
				// (e.g. permission denied, document not found).
				if (result.code) throw new Error(result.message);
				// lastAdded / lastDeleted are updated together with genre/totalNumber
				// in the calling function (single statisticsRef.update call) to avoid
				// triggering the CloudBase watcher twice per operation.
			} else {
				const result = await this.database.collection(DATABASE_HISTORY).add({
					...userId,
					status: status,
					message: `New rate search was started on ${timestamp}`
				});
				// CloudBase returns a non-empty result.code when the operation failed
				// (e.g. permission denied, document not found).
				if (result.code) throw new Error(result.message);

				// Keep statistics in sync: record the most recent rate-search timestamp.
				await this.statisticsRef.update({ lastRateSearch: { timestamp } });
				this.appendToActivityLog(STATS_FIELD_RECENT_MOVIE, { type: 'search', timestamp }).catch(
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
	 * Add new record to patch notes
	 *
	 * @param newRecord - The record to add.
	 */
	public override addNewRecordToPatchNotes(newRecord: any): Promise<void> {
		const userId = CloudbaseService.userHasAllRights() ? { _openid: CloudbaseService.userId } : {};
		return this.database
			.collection(DATABASE_PATCH_NOTES)
			.add({
				...userId,
				component: newRecord.component,
				element: this.utilities.capitalizeFirstLetterWithOthersUnchanged(newRecord.element.trim()),
				details: this.utilities.capitalizeFirstLetterWithOthersUnchanged(newRecord.details.trim()),
				status: newRecord.status,
				timestamp: newRecord.timestamp,
				isBug: newRecord.isBug
			})
			.then((result: any) => {
				if (result.code) {
					LOG.error(
						this.className,
						'Error while adding new patch notes',
						new Error(result.message)
					);
					throw new Error(result.message);
				}
				LOG.info(this.className, 'New patch notes record has been added');
				// Sync patchInProgress so the home-page widget reflects the new note
				// immediately without waiting for the subscription tap to run.
				this.syncPatchInProgressStat();
			});
	}

	/**
	 * Update existing record to patch notes
	 *
	 * @param key - The key associated with the record
	 * @param updatedRecord - The record to update.
	 */
	public override updateExistingRecordToPatchNotes(key: string, updatedRecord: any): Promise<void> {
		return this.database
			.collection(DATABASE_PATCH_NOTES)
			.where({
				_id: key,
				_openid: CloudbaseService.getUseId()
			})
			.update({
				...updatedRecord
			})
			.then((result: any) => {
				// CloudBase returns a non-empty result.code when the operation failed
				// (e.g. permission denied, document not found).
				if (result.code) throw new Error(result.message);

				LOG.info(this.className, 'Patch notes record has been updated');
				// Sync patchInProgress so status-change edits reflect on the home-page
				// widget without waiting for the subscription tap.
				this.syncPatchInProgressStat();
			});
	}

	/**
	 * Remove a patch note by key and resync the patchInProgress statistics field
	 * so the home-page widget is up to date without waiting for the subscription tap.
	 *
	 * @param key - The document key of the patch note to remove.
	 */
	async removePatchNote(key: string): Promise<void> {
		await this.removeSingleItemFromDatabase(DATABASE_PATCH_NOTES, key);
		this.syncPatchInProgressStat();
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

	/**
	 * Update reminder table details
	 * Note: This method is used by second table and third table
	 *
	 * @param tableName - Corresponding collection name
	 * @param entryKey - The key of the entire entry
	 * @param valueKey - The key associated with the new value.
	 * @param value - The new value to be stored.
	 */
	public override updateReminderTable(tableName: string, entryKey: string, valueKey: string, value: any): Promise<void> {
		const collectionName = this.convertTableNameToCollectionName(tableName);

		// Branch on valueKey: "content" replaces entire content object (bulk edit);
		// any other key updates a single nested field inside content (e.g. toggling paid).
		let valueToUpdate;
		if (valueKey === 'content') {
			valueToUpdate = { content: { ...value } };
		} else {
			valueToUpdate = { content: { [valueKey]: value } };
		}
		return this.database
			.collection(collectionName)
			.where({
				_id: entryKey,
				_openid: CloudbaseService.getUseId()
			})
			.update(valueToUpdate)
			.then((result: any) => {
				if (result.updated === 0) throw new Error(ERROR_PERMISSION_DENIED);
				// CloudBase returns a non-empty result.code when the operation failed
				// (e.g. permission denied, document not found).
				else if (result.code) throw new Error(result.message);

				LOG.info(this.className, 'Reminder table has been updated');
			});
	}

	/**
	 * Update reminder table details
	 *
	 * @param tableName - The name of the table to update.
	 * @param updatedTable - The table to update
	 */
	public override async updateFirstReminderTable(tableName: string, updatedTable: any): Promise<void> {
		const collectionName = this.convertTableNameToCollectionName(tableName);
		const tableRef = this.database.collection(collectionName);

		// CloudBase has no batch document update API — each row must be updated
		// individually. _id and _openid are stripped since they are CloudBase metadata.
		for (const data of updatedTable) {
			const { _id, _openid, ...rest } = data;
			const result = await this.database
				.collection(collectionName)
				.where({
					_id: _id,
					_openid: CloudbaseService.getUseId()
				})
				.update(rest);
			if (result.code) throw new Error(ERROR_PERMISSION_DENIED);
		}

		LOG.info(this.className, 'Reminder table has been updated');
	}

	/**
	 * Remove record from reminder table
	 * Note: This is used by third table only
	 *
	 * @param tableName - Corresponding collection name
	 * @param key - The key of the record to remove
	 */
	public override async removeRecordFromReminderTable(tableName: string, key: string): Promise<void> {
		try {
			const collectionName = this.convertTableNameToCollectionName(tableName);
			// Delegate to the shared helper so error handling (result.code check)
			// and logging stay consistent across all collections.
			return await this.removeSingleItemFromDatabase(collectionName, key);
		} catch (error) {
			LOG.error(this.className, 'Error while removing a record from reminder table');
			throw error;
		}
	}

	/**
	 * Remove an item from cloudbase
	 *
	 * @param collectionName - The collection name in cloudbase
	 * @param key - The key associated with the record
	 */
	public override async removeSingleItemFromDatabase(collectionName: string, key: string): Promise<void> {
		const result = await this.database
			.collection(collectionName)
			.where({ _id: key, _openid: CloudbaseService.getUseId() })
			.remove();
		// CloudBase returns a non-empty result.code when the operation failed
		// (e.g. permission denied, document not found).
		if (result.code) throw new Error(result.message);
		LOG.info(this.className, `Record has been removed from ${collectionName}`);
	}

	/**
	 * Add a new entry to a given reminder table.
	 * Note: This is used by third table only.
	 *
	 * @param tableName - The corresponding collection name.
	 * @param newRecord - The new entry to add.
	 */
	public override addNewRecordForReminderTable(tableName: string, newRecord: any): Promise<void> {
		const collectionName = this.convertTableNameToCollectionName(tableName);
		const userId = CloudbaseService.userHasAllRights() ? { _openid: CloudbaseService.userId } : {};
		return this.database
			.collection(collectionName)
			.add({
				...userId,
				content: { ...newRecord }
			})
			.then((result: any) => {
				if (result.code) {
					LOG.error(this.className, 'Error while adding new record for reminder table');
					throw new Error(result.message);
				}
				LOG.info(this.className, 'Reminder table has been updated');
				// Fire-and-forget: record third-table additions in stats so the
				// home-page Recent Activity widget can surface them immediately.
				if (tableName === DATABASE_THIRD_TABLE) {
					this.appendToActivityLog(STATS_FIELD_RECENT_REMINDER, {
						type: 'added',
						table: REMINDER_TABLE_MESSAGES,
						text: newRecord.text ?? '',
						timestamp: this.utilities.getCurrentFormattedTime(true)
					}).catch(() => {});
				}
			});
	}

	/**
	 * Get the quotes from the database.
	 *
	 * @returns An observable that emits the quotes list.
	 */
	public override getQuotes(): Observable<any[]> {
		return CloudbaseService.authReady$
			.pipe(
				take(1),
				switchMap(
					() =>
						new Observable<any[]>((observer) => {
							const watcher = this.database.collection(DATABASE_QUOTES).watch({
								onChange: (snapshot: any) => {
									const quotes = snapshot.docs.map((doc: any) => {
										const { _id, ...rest } = doc;
										return { key: _id, ...rest };
									});
									quotes.sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp));
									observer.next(quotes);
								},
								onError: (err: any) => {
									LOG.error(this.className, 'Error while retrieving quotes', err);
									observer.error(err);
								}
							});
							return () => watcher.close();
						})
				)
			)
			.pipe(shareReplay(1));
	}

	/**
	 * Add a new quote to the database.
	 *
	 * @param text - The quote text.
	 * @param author - The author of the quote.
	 * @param timestamp - The timestamp of the quote.
	 */
	public override async addQuote(text: string, author: string, timestamp: string): Promise<void> {
		// Attach _openid whenever a user is authenticated so they can later delete their own quotes.
		// Falls back to empty object for anonymous users (no delete permission).
		const userId = CloudbaseService.getUseId() ? { _openid: CloudbaseService.getUseId() } : {};
		const result = await this.database.collection(DATABASE_QUOTES).add({
			...userId,
			text,
			author,
			timestamp
		});
		// CloudBase returns a non-empty result.code when the operation failed
		// (e.g. permission denied, document not found).
		if (result.code) throw new Error(result.message);
		LOG.info(this.className, 'New quote has been added');

		// Update statistics: record latest quote and increment total count.
		await this.statisticsRef.update({
			latestQuote: { text, author, timestamp },
			totalQuotes: this._.inc(1)
		});
		this.appendToActivityLog(STATS_FIELD_RECENT_RESONANCE, { type: 'added', author, timestamp }).catch(
			() => {}
		);
	}

	/**
	 * Remove a quote from the database and update statistics.
	 *
	 * @param key - The key of the quote to remove.
	 * @param text - The text of the deleted quote (written to lastQuoteDeleted stat).
	 * @param author - The author of the deleted quote (written to lastQuoteDeleted stat).
	 */
	public override async removeQuote(key: string, text: string, author: string): Promise<void> {
		await this.removeSingleItemFromDatabase(DATABASE_QUOTES, key);

		// Re-query remaining quotes so that latestQuote always reflects
		// the most recently added quote still in the collection.
		const remaining = await this.database.collection(DATABASE_QUOTES).limit(1000).get();
		const quotes: any[] = remaining.data ?? [];
		quotes.sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp));
		const latest = quotes[0];

		const deletedTimestamp = this.utilities.getCurrentFormattedTime(true);
		await this.statisticsRef.update({
			totalQuotes: this._.inc(-1),
			latestQuote: latest
				? { text: latest.text, author: latest.author, timestamp: latest.timestamp }
				: null,
			lastQuoteDeleted: {
				text,
				author,
				timestamp: deletedTimestamp
			}
		});
		this.appendToActivityLog(STATS_FIELD_RECENT_RESONANCE, {
			type: 'deleted',
			author,
			timestamp: deletedTimestamp
		}).catch(() => {});
	}

	/**
	 * Update specific fields in the statistics document.
	 * Called by page components (Reminder, Patch) while they are active to sync
	 * live data into the shared statistics collection. The call stops naturally
	 * when the component is destroyed and its subscriptions are torn down.
	 *
	 * @param fields - Fields to merge into the statistics document.
	 */
	public override async updateStatisticsFields(fields: Record<string, any>): Promise<void> {
		try {
			const result = await this.statisticsRef.update(fields);
			if (result.code || result.updated === 0)
				throw new Error(
					result.message ??
						'No document updated — check CloudBase write permissions on statistics collection'
				);
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
	public override async appendToActivityLog(fieldName: string, activity: any): Promise<void> {
		try {
			const doc = await this.database.collection(DATABASE_STATISTICS).doc(this.statId).get();
			const raw = doc.data?.[0]?.[fieldName];
			const existing: any[] = raw ? (Array.isArray(raw) ? raw : Object.values(raw)) : [];
			// Prepend the new item and trim to the cap so CloudBase storage stays bounded.
			const updated = [activity, ...existing].slice(0, STATS_CAP_ACTIVITY_LOG);
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
	public override async appendToPatchActivityLog(activity: any): Promise<void> {
		return this.appendToActivityLog(STATS_FIELD_RECENT_PATCH, activity);
	}

	/**
	 * Convert a table name to its corresponding CloudBase collection name.
	 *
	 * @param tableName - The table name to convert.
	 * @returns The corresponding collection name.
	 */
	private convertTableNameToCollectionName(tableName: string): string {
		switch (tableName) {
			case DATABASE_FIRST_TABLE:
				return DATABASE_REMINDER_FIRST;
			case DATABASE_SECOND_TABLE:
				return DATABASE_REMINDER_SECOND;
			case DATABASE_THIRD_TABLE:
				return DATABASE_REMINDER_THIRD;
			default:
				return '';
		}
	}
}
