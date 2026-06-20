import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { shareReplay, switchMap, take, filter } from 'rxjs/operators';
import { MovieItemVO } from '../../../fontend/entertainment/movieItem.vo';
import { CLOUDBASE, CloudbaseApp, DatabaseService } from '../database.service';
import { LOG } from '../../../common/app.logs';
import { Utilities } from '../../../common/utilities/app.utilities';
import { environment } from '../../../../environment/environment';
import {
	DATABASE_DATE_CALCULATOR,
	DATABASE_DEBT_SONATA,
	DATABASE_HISTORY,
	DATABASE_MOVIES,
	DATABASE_PATCH_NOTES,
	DATABASE_RELEASE_NOTES,
	DATABASE_QUOTES,
	DATABASE_REMINDER,
	DATABASE_STATISTICS,
	DATABASE_RECIPES,
	DATABASE_USEFUL_LINKS,
	DATABASE_PUSH_SUBSCRIPTIONS,
	USEFUL_LINK_TYPE_LINK,
	USEFUL_LINK_TYPE_CATEGORY,
	ACTIVITY_TYPE_UPDATED,
	GENRE_FAVOURITE,
	HISTORY_STATUS_ADDED,
	HISTORY_STATUS_DELETED,
	RATE_DECREASED,
	RATE_INCREASED,
	SEARCH,
	STATS_CAP_ACTIVITY_LOG,
	STATS_FIELD_ACTIVITY_STREAK,
	STATS_FIELD_ACTIVITY_STREAK_DATE,
	STATS_FIELD_IS_USER_STATS,
	STATS_FIELD_RECENT_ACTIVITIES,
	STATS_FIELD_TOTAL_DEBTS,
	STATS_FIELD_TOTAL_REMINDERS,
	STATS_FIELD_TOTAL_FILMS,
	STATS_FIELD_TOTAL_LINKS,
	STATS_FIELD_TOTAL_QUOTES,
	STATS_FIELD_TOTAL_RECIPES,
	ROLE_ADMIN,
	ACTIVITY_SOURCE_DEBT,
	ACTIVITY_SOURCE_LINK,
	ACTIVITY_SOURCE_MOVIE,
	ACTIVITY_SOURCE_PATCH,
	ACTIVITY_SOURCE_RECIPE,
	ACTIVITY_SOURCE_REMINDER,
	ACTIVITY_SOURCE_RESONANCE,
	ACTIVITY_TYPE_BUG_LOGGED,
	ACTIVITY_TYPE_RESET,
	DEBT_VALUE_KEY_DEBT,
	DEBT_VALUE_KEY_PAID,
	DEBT_VALUE_KEY_PAYMENTS,
	ACTIVITY_SOURCE_DATE_CALCULATOR,
	ACTIVITY_SOURCE_DEFAULT,
	ERROR_NO_DOCUMENT_UPDATED,
	ACTIVITY_TYPE_STATUS_CHANGED,
	ACTIVITY_TYPE_EDITED,
	ACTIVITY_TYPE_RATE_UPDATED,
	ACTIVITY_TYPE_GENRE_UPDATED,
	ACTIVITY_TYPE_FAVOURITE_UPDATED,
	ACTIVITY_TYPE_CATEGORY_UPDATED,
	ACTIVITY_TYPE_CATEGORY_DELETED,
	ACTIVITY_TYPE_PAYMENT_REMOVED,
	ACTIVITY_TYPE_CATEGORY_ADDED,
	ACTIVITY_TYPE_CALCULATOR_UPDATED,
	ACTIVITY_TYPE_LOCK_UPDATED,
	STATS_FIELD_MILESTONES,
	MILESTONE_KEY_ACCOUNT_CREATED,
	MILESTONE_DOMAIN_FILM,
	MILESTONE_DOMAIN_QUOTE,
	MILESTONE_DOMAIN_RECIPE,
	MILESTONE_DOMAIN_REMINDER,
	MILESTONE_DOMAIN_DEBT,
	MILESTONE_DOMAIN_LINK,
	MILESTONE_DOMAIN_STREAK
} from '../../../common/app.constant';
import { SearchStreamService } from '../../dialog-service/search/search-stream.service';
import { Recipe } from '../../../fontend/recipe/recipe.model';

@Injectable({ providedIn: 'root' })
export class CloudbaseService extends DatabaseService {
	private readonly className = 'CloudbaseService';
	private database: any;
	private statId: any;
	private static userId: string;
	private static userRole: string;
	private static userName: string;
	// '_' is a reserved keyword in the CloudBase SDK used to access its command builder
	private _!: any;
	private tempUrlCache = new Map<string, string>();
	// Serializes activity log writes so each read-before-write completes before the next begins.
	private activityLogQueue: Promise<void> = Promise.resolve();
	private static _authReady$ = new ReplaySubject<boolean>(1);
	private static _loginState$ = new BehaviorSubject<boolean>(false);

	/**
	 * Emits only true — watchers must never receive false, or they would start
	 * a CloudBase .watch() with anonymous credentials after sign-out.
	 *
	 * @returns The observable that emits true once the CloudBase auth library is ready.
	 */
	static get authReady$() {
		return CloudbaseService._authReady$.asObservable().pipe(filter((isReady) => isReady === true));
	}

	/**
	 * Emits every real login-state change (true = non-anonymous user signed in,
	 * false = signed out or anonymous). Starts as false so new subscribers always
	 * get the correct initial state without waiting for a replay.
	 *
	 * @returns The observable that emits the current login boolean state.
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

			/* Attempt to resolve statId immediately (anonymous session may succeed);
			   retry once auth confirms so authenticated callers always have it ready */
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
	public static getUserId() {
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

	////////////////////// Below are Retrieval methods for database records ////////////////

	/**
	 * Gets the statistics from CloudBase as a real-time observable.
	 *
	 * @returns An observable that emits the statistics document.
	 */
	public getStatistics(): Observable<any> {
		return this.watchCollection(DATABASE_STATISTICS, (docs) => docs[0]);
	}

	/**
	 * Gets the current user's per-user stats document as a real-time observable.
	 *
	 * @returns An observable that emits the user's stats document, or undefined when absent.
	 */
	public getUserStats(): Observable<any> {
		return this.watchCollection(
			DATABASE_STATISTICS,
			(docs) => docs[0],
			false,
			(col) => col.where(this.getUserStatsFilter())
		);
	}

	/**
	 * Gets the date calculator details from CloudBase as a real-time observable.
	 *
	 * @returns An observable that emits the date calculator row list.
	 */
	public getDateCalculatorTableDetails(): Observable<any[]> {
		/* Date calculator rows are flat — emit as-is. Fallback to [] prevents
		   downstream .length errors when the collection is empty. */
		return this.watchCollection(DATABASE_DATE_CALCULATOR, (docs) => docs ?? []);
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
			(col) => col.where({ _openid: CloudbaseService.getUserId() })
		);
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
			(col) => col.where({ _openid: CloudbaseService.getUserId() })
		);
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
					steps: (doc.steps ?? []).map((step: any) => ({ ...step, done: false })),
					notes: doc.notes ?? ''
				})) as Recipe[],
			true
		);
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
										movieItemVO.setOpenId(doc._openid ?? '');
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
	 * Gets the history list from CloudBase as a real-time observable.
	 *
	 * @returns An observable that emits the history list.
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
	 * Gets the reminder details from CloudBase as a real-time observable.
	 *
	 * @returns An observable that emits the reminder details list.
	 */
	public getReminderTableDetails(): Observable<any[]> {
		return this.watchCollection(DATABASE_REMINDER, (docs) =>
			docs.map((doc: any) => {
				const { _id, ...rest } = doc;
				return { key: _id, ...rest } as {
					key: string;
					text: string;
					date: string;
					link: string;
					tags: string[];
				};
			})
		);
	}

	/**
	 * Gets the Account Expenses (debt sonata) details from CloudBase as a real-time observable.
	 *
	 * @returns An observable that emits the Account Expenses details list.
	 */
	public getDebtSonataTableDetails(): Observable<any[]> {
		/* Map CloudBase _id → key so Angular *ngFor can trackBy it;
		   name and content fields pass through as-is. */
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
	 * Gets the release notes from CloudBase as a one-shot observable, ordered newest first.
	 *
	 * @returns An observable that emits the release notes list once and completes.
	 */
	public getReleaseNotes(): Observable<any[]> {
		return new Observable<any[]>((observer) => {
			CloudbaseService.authReady$.pipe(take(1)).subscribe(() => {
				this.database
					.collection(DATABASE_RELEASE_NOTES)
					.orderBy('order', 'desc')
					.get()
					.then((res: any) => {
						const docs: any[] = res.data ?? [];
						observer.next(
							docs.map((doc: any) => {
								const { _id, _openid, order, ...rest } = doc;
								return rest;
							})
						);
						observer.complete();
					})
					.catch((error: unknown) => observer.error(error));
			});
		}).pipe(shareReplay(1));
	}

	/**
	 * Gets the patch notes from CloudBase as a real-time observable.
	 *
	 * @returns An observable that emits the patch notes list.
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
	 * @param queryBuilder - Optional function to add filters or ordering to the collection query.
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
	 * Resolves CloudBase file IDs (cloud://…) in a movie list to signed temporary URLs.
	 * Results are cached in-memory so repeated watch emissions only resolve new / unseen file IDs.
	 * Any link that is not a valid cloud:// ID (e.g. null, empty, stale value) resolves to empty string.
	 *
	 * @param movies - The movie list whose cover links are to be resolved.
	 * @returns The same array with cloud:// IDs replaced by displayable temp URLs.
	 */
	private async resolveMovieCoverUrls(movies: MovieItemVO[]): Promise<MovieItemVO[]> {
		// Collect unique cloud:// IDs not yet in cache
		const toResolve = [
			...new Set(
				movies
					.map((movie) => movie.getMovieCoverImageDownloadableLink())
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
						/* CloudBase SDK (CLOUD_API mode) returns each item with:
						     { fileid, download_url }            on success
						     { fileid, code: '<ERROR_CODE>' }   on failure (e.g. STORAGE_FILE_NONEXIST) */
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

	////////////////////// Below are Update methods for database records /////////////////////

	/**
	 * Updates the date calculator table rows in the database.
	 * Strips CloudBase metadata (_id, _openid) before updating and runs all row
	 * updates in parallel to avoid sequential round-trip latency.
	 *
	 * @param updatedTable - The array of row objects to persist.
	 */
	public async updateDateCalculatorTable(updatedTable: any): Promise<void> {
		try {
			/* CloudBase has no batch document update API — rows are updated individually.
			   _id and _openid are stripped since they are CloudBase metadata.
			   Promise.all runs all updates in parallel to avoid sequential round-trip latency. */
			await Promise.all(
				updatedTable.map(async (data: any) => {
					const { _id, _openid, ...rest } = data;
					const result = await this.database
						.collection(DATABASE_DATE_CALCULATOR)
						.where(this.buildWhereClause(_id))
						.update(rest);
					if (result.code) throw new Error(result.message);
				})
			);
			LOG.info(this.className, 'Date calculator has been updated');
			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_DATE_CALCULATOR,
				type: ACTIVITY_TYPE_CALCULATOR_UPDATED
			}).catch(() => {});
		} catch (error) {
			LOG.error(this.className, 'Error while updating date calculator table', error as Error);
			throw error;
		}
	}

	/**
	 * Updates an existing useful link in the database and records the change in the activity log.
	 *
	 * @param entryKey - The document key of the link to update.
	 * @param updates - The fields to update.
	 * @param domain - The hostname of the updated link, recorded in the activity log.
	 */
	public async updateUsefulLink(
		entryKey: string,
		updates: Partial<{ url: string; title: string; category: string; isPinned: boolean }>,
		domain: string
	): Promise<void> {
		await this.updateTableExistingFields(DATABASE_USEFUL_LINKS, entryKey, { ...updates });
		this.appendToActivityLog({
			source: ACTIVITY_SOURCE_LINK,
			type: ACTIVITY_TYPE_UPDATED,
			domain
		}).catch(() => {});
	}

	/**
	 * Updates an existing link category in the database and records the change in the activity log.
	 *
	 * @param entryKey - The document key of the category to update.
	 * @param updates - The fields to update.
	 * @param name - The category name, recorded in the activity log.
	 */
	public async updateLinkCategory(
		entryKey: string,
		updates: Partial<{ name: string; color: string; order: number }>,
		name: string
	): Promise<void> {
		await this.updateTableExistingFields(DATABASE_USEFUL_LINKS, entryKey, { ...updates });
		this.appendToActivityLog({
			source: ACTIVITY_SOURCE_LINK,
			type: ACTIVITY_TYPE_CATEGORY_UPDATED,
			domain: name
		}).catch(() => {});
	}

	/**
	 * Updates an existing recipe in the database.
	 *
	 * @param recipe - The recipe with updated fields. The `id` field identifies the document.
	 */
	public async updateRecipe(recipe: Recipe): Promise<void> {
		const { id, ...payload } = recipe;
		await this.updateTableExistingFields(DATABASE_RECIPES, id, {
			...payload,
			steps: payload.steps.map((step) => ({ ...step, done: false }))
		});
		this.appendToActivityLog({
			source: ACTIVITY_SOURCE_RECIPE,
			type: ACTIVITY_TYPE_UPDATED,
			name: recipe.name
		}).catch(() => {});
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

				/* CloudBase returns a non-empty result.code when the operation failed
				   (e.g. permission denied, document not found). */
				if (result.code) throw new Error(result.message);

				// Fire-and-forget: record this rate update in stats for Recent Activity.
				this.appendToActivityLog({
					source: ACTIVITY_SOURCE_MOVIE,
					type: ACTIVITY_TYPE_RATE_UPDATED,
					title: movieItemVO.getMovieName()
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
	 * Updates the movie genre in the database, updates genre statistics, and records the change
	 * in the activity log.
	 *
	 * @param movieKey - The key of the movie to update.
	 * @param oldGenre - The old genre value.
	 * @param newGenre - The new genre value.
	 * @param title - The movie title, recorded in the activity log.
	 */
	public async updateMovieGenre(
		movieKey: string,
		oldGenre: string,
		newGenre: string,
		title: string
	): Promise<void> {
		try {
			// Step 1 : Update movie genre
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

			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_MOVIE,
				type: ACTIVITY_TYPE_GENRE_UPDATED,
				title
			}).catch(() => {});
		} catch (error) {
			LOG.error(this.className, 'Error while updating movie genre', error as Error);
			throw error;
		}
	}

	/**
	 * Updates the isFavourite flag for the given movie in the database, updates genre statistics,
	 * and records the change in the activity log.
	 *
	 * @param movieKey - The key of the movie to update.
	 * @param isFavourite - The boolean value to set.
	 * @param title - The movie title, recorded in the activity log.
	 */
	public async updateMovieFavourite(movieKey: string, isFavourite: boolean, title: string): Promise<void> {
		try {
			// Step 1 : Update isFavourite flag on movie document
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

			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_MOVIE,
				type: ACTIVITY_TYPE_FAVOURITE_UPDATED,
				title
			}).catch(() => {});
		} catch (error) {
			LOG.error(this.className, 'Error while updating movie favourite', error as Error);
			throw error;
		}
	}

	/**
	 * Updates a single field value in the reminder table and records the change in the activity log.
	 *
	 * @param entryKey - The key of the entry to update.
	 * @param valueKey - The field name to update.
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
	 * Updates a single field value in the debt table and records the change in the activity log.
	 *
	 * @param entryKey - The key of the entry to update.
	 * @param valueKey - The field name to update.
	 * @param value - The new value to store.
	 * @param name - The debt entry name, recorded in the activity log.
	 * @param type - The activity log type. Defaults to ACTIVITY_TYPE_LOCK_UPDATED.
	 */
	public async updateSingleValueForDebtTable(
		entryKey: string,
		valueKey: string,
		value: any,
		name: string,
		type = ACTIVITY_TYPE_LOCK_UPDATED
	): Promise<void> {
		await this.updateTableExistingFields(DATABASE_DEBT_SONATA, entryKey, { [valueKey]: value });
		this.appendToActivityLog({
			source: ACTIVITY_SOURCE_DEBT,
			type,
			name
		}).catch(() => {});
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
	 * Resets a debt record to its original amount and removes all payment history
	 * in a single round-trip. Uses the CloudBase remove command to delete the payments
	 * field entirely, since update() is a merge and passing {} would be a no-op.
	 * Records the reset in the activity log.
	 *
	 * @param entryKey - The key of the entry to reset.
	 * @param originalAmount - The original debt amount to restore.
	 * @param paid - The paid status to restore.
	 * @param name - The debt entry name, recorded in the activity log.
	 */
	public async resetDebtRecord(
		entryKey: string,
		originalAmount: number,
		paid: boolean,
		name: string
	): Promise<void> {
		await this.updateTableExistingFields(DATABASE_DEBT_SONATA, entryKey, {
			[DEBT_VALUE_KEY_DEBT]: originalAmount,
			[DEBT_VALUE_KEY_PAID]: paid,
			[DEBT_VALUE_KEY_PAYMENTS]: this._.remove()
		});
		this.appendToActivityLog({
			source: ACTIVITY_SOURCE_DEBT,
			type: ACTIVITY_TYPE_RESET,
			name
		}).catch(() => {});
	}

	/**
	 * Updates the status of an existing record in the patch notes collection
	 * and records the change in the activity log.
	 *
	 * @param key - The document key of the patch note to update.
	 * @param updatedRecord - The updated record data.
	 * @param component - The component the note belongs to, recorded in the activity log.
	 * @param element - The element the note belongs to, recorded in the activity log.
	 * @param noteIndex - The 1-based position of the note in the table.
	 */
	public async updateStatusForOnePatchNote(
		key: string,
		updatedRecord: any,
		component: string,
		element: string,
		noteIndex: number
	): Promise<void> {
		await this.updateOnePatchNote(
			key,
			updatedRecord,
			component,
			element,
			noteIndex,
			ACTIVITY_TYPE_STATUS_CHANGED
		);
	}

	/**
	 * Updates the details of an existing record in the patch notes collection
	 * and records the change in the activity log.
	 *
	 * @param key - The document key of the patch note to update.
	 * @param updatedRecord - The updated record data.
	 * @param component - The component the note belongs to, recorded in the activity log.
	 * @param element - The element the note belongs to, recorded in the activity log.
	 * @param noteIndex - The 1-based position of the note in the table.
	 */
	public async updateDetailsForOnePatchNote(
		key: string,
		updatedRecord: any,
		component: string,
		element: string,
		noteIndex: number
	): Promise<void> {
		await this.updateOnePatchNote(
			key,
			updatedRecord,
			component,
			element,
			noteIndex,
			ACTIVITY_TYPE_EDITED
		);
	}

	/**
	 * Writes updated fields to a patch note document and appends an activity log entry.
	 * Shared by {@link updateStatusForOnePatchNote} and {@link updateDetailsForOnePatchNote},
	 * which differ only in the activity type they record.
	 *
	 * @param key - The document key of the patch note to update.
	 * @param updatedRecord - The updated record data.
	 * @param component - The component the note belongs to, recorded in the activity log.
	 * @param element - The element the note belongs to, recorded in the activity log.
	 * @param noteIndex - The 1-based position of the note in the table.
	 * @param activityType - The activity type constant to record in the log.
	 */
	private async updateOnePatchNote(
		key: string,
		updatedRecord: any,
		component: string,
		element: string,
		noteIndex: number,
		activityType: string
	): Promise<void> {
		await this.updateTableExistingFields(DATABASE_PATCH_NOTES, key, { ...updatedRecord });
		this.appendToActivityLog({
			source: ACTIVITY_SOURCE_PATCH,
			type: activityType,
			component,
			element,
			noteIndex
		}).catch(() => {});
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
	 * Updates specific fields in the current user's per-user stats document.
	 * Targets the document matched by {@link getUserStatsFilter} (owned by the current user,
	 * flagged with `isUserStats: true`) — distinct from the shared statistics document.
	 *
	 * @param fields - Fields to merge into the per-user stats document.
	 * @returns A promise that resolves when the update completes.
	 */
	public async updateUserStatsFields(fields: Record<string, any>): Promise<void> {
		try {
			const result = await this.database
				.collection(DATABASE_STATISTICS)
				.where(this.getUserStatsFilter())
				.update(fields);
			if (result.code) throw new Error(result.message ?? 'Failed to update user stats document');
		} catch (error) {
			LOG.error(this.className, 'Error while updating user stats fields', error as Error);
		}
	}

	/**
	 * Updates multiple fields in a single table record in one round-trip.
	 *
	 * {@link updateDateCalculatorTable} - Each individual row update delegates here.
	 * {@link updateUsefulLink} - Updates link fields in the useful-links collection.
	 * {@link updateLinkCategory} - Updates category fields in the useful-links collection.
	 * {@link updateRecipe} - Updates recipe fields in the recipes collection.
	 * {@link updateReminderTable} - Updates a single field in the reminder collection.
	 * {@link updateSingleValueForDebtTable} - Updates a single field in the debt collection.
	 * {@link updateDebtFields} - Updates multiple fields in the debt collection.
	 * {@link resetDebtRecord} - Resets debt amount and removes payment history.
	 * {@link updateStatusForOnePatchNote} - Updates a patch note record.
	 * {@link removeSingleHistoryFromDebt} - Uses the CloudBase remove command via an update call.
	 *
	 * @param tableName - The database collection name.
	 * @param entryKey - The document key of the entry to update.
	 * @param fields - A record of field names and their new values.
	 */
	private async updateTableExistingFields(
		tableName: string,
		entryKey: string,
		fields: Record<string, unknown>
	): Promise<void> {
		try {
			const result = await this.database
				.collection(tableName)
				.where(this.buildWhereClause(entryKey))
				.update(fields);
			if (result.updated === 0) throw new Error(ERROR_NO_DOCUMENT_UPDATED);
			else if (result.code) throw new Error(result.message);
			LOG.info(this.className, `Record on ${tableName} has been updated`);
		} catch (error) {
			LOG.error(this.className, `Error while updating ${tableName}`, error as Error);
			throw error;
		}
	}

	////////////////////// Below are Removal methods for database records ////////////////

	/**
	 * Removes a useful link from the database and records the deletion in the activity log.
	 *
	 * @param key - The document key of the link to remove.
	 * @param domain - The hostname of the removed link, recorded in the activity log.
	 */
	public async removeUsefulLink(key: string, domain: string): Promise<void> {
		await this.removeRecordFromDB(DATABASE_USEFUL_LINKS, {
			entryKey: key,
			type: HISTORY_STATUS_DELETED,
			domain
		});
		this.updateUserStatCount(STATS_FIELD_TOTAL_LINKS, -1).catch(() => {});
	}

	/**
	 * Removes a link category from the database and records the deletion in the activity log.
	 *
	 * @param key - The document key of the category to remove.
	 * @param name - The category name, recorded in the activity log.
	 */
	public async removeLinkCategory(key: string, name: string): Promise<void> {
		await this.removeRecordFromDB(DATABASE_USEFUL_LINKS, {
			entryKey: key,
			type: ACTIVITY_TYPE_CATEGORY_DELETED,
			domain: name
		});
	}

	/**
	 * Removes a quote from the database and updates statistics.
	 *
	 * @param entryKey - The document key of the quote to remove.
	 * @param author - The author of the deleted quote (used for the activity log).
	 */
	public async removeQuote(entryKey: string, author: string): Promise<void> {
		this.removeRecordFromDB(DATABASE_QUOTES, { entryKey, author });

		await this.statisticsRef.update({ [STATS_FIELD_TOTAL_QUOTES]: this._.inc(-1) });
		this.updateUserStatCount(STATS_FIELD_TOTAL_QUOTES, -1).catch(() => {});
	}

	/**
	 * Removes a recipe from the database, decrements the total recipe count in statistics,
	 * and records the deletion in the activity log.
	 *
	 * @param recipeKey - The database key of the recipe to delete.
	 * @param name - The recipe name, recorded in the activity log.
	 */
	public async removeRecipe(recipeKey: string, name: string): Promise<void> {
		this.removeRecordFromDB(DATABASE_RECIPES, { entryKey: recipeKey, name });

		// Fire-and-forget: keep totalRecipes in sync so the home stat chip updates in realtime.
		this.statisticsRef.update({ [STATS_FIELD_TOTAL_RECIPES]: this._.inc(-1) }).catch(() => {});
		this.updateUserStatCount(STATS_FIELD_TOTAL_RECIPES, -1).catch(() => {});
	}

	/**
	 * Removes a movie from the database, its cover image from CloudBase Storage,
	 * and updates the statistics accordingly.
	 *
	 * @param movieItemVO - The movie item to remove.
	 */
	public async removeMovieFromDatabase(movieItemVO: MovieItemVO): Promise<void> {
		try {
			// Step 1 : Remove movie document from database
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
			const updatedData: any = {};
			updatedData[`genre.${movieItemVO.getMovieGenre()}`] = this._.inc(-1);
			updatedData[STATS_FIELD_TOTAL_FILMS] = this._.inc(-1);

			if (movieItemVO.getIsFavourite()) {
				updatedData[`genre.${GENRE_FAVOURITE}`] = this._.inc(-1);
			}

			const statRes = await this.statisticsRef.update(updatedData);
			if (statRes.code) throw new Error(statRes.message);

			// Append to activity log so multiple deletes are all visible in Recent Activity
			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_MOVIE,
				type: HISTORY_STATUS_DELETED,
				title: movieItemVO.getMovieName()
			}).catch(() => {});
			this.updateUserStatCount(STATS_FIELD_TOTAL_FILMS, -1).catch(() => {});

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
	 * Removes a record from the reminder table and records the deletion in the activity log.
	 *
	 * @param key - The document key of the record to remove.
	 * @param text - The reminder text, recorded in the activity log.
	 */
	public async removeRecordFromReminderTable(key: string, text: string): Promise<void> {
		await this.removeRecordFromDB(DATABASE_REMINDER, { entryKey: key, text });
		this.updateUserStatCount(STATS_FIELD_TOTAL_REMINDERS, -1).catch(() => {});
	}

	/**
	 * Removes a record from the debt table and records the deletion in the activity log.
	 *
	 * @param key - The document key of the record to remove.
	 * @param name - The debt entry name, recorded in the activity log.
	 */
	public async removeRecordFromDebtTable(key: string, name: string): Promise<void> {
		await this.removeRecordFromDB(DATABASE_DEBT_SONATA, { entryKey: key, name });
		this.updateUserStatCount(STATS_FIELD_TOTAL_DEBTS, -1).catch(() => {});
	}

	/**
	 * Removes the payment entry at the given index from a debt document and restores the
	 * debt balance, both in a single DB write. Records the removal in the activity log.
	 *
	 * @param entryKey - The document key of the debt record to update.
	 * @param index - The integer key of the payment entry to remove.
	 * @param updatedDebt - The restored debt balance after the payment is removed.
	 * @param name - The debt name, recorded in the activity log.
	 */
	public async removeSingleHistoryFromDebt(
		entryKey: string,
		index: number,
		updatedDebt: number,
		name: string
	): Promise<void> {
		await this.updateTableExistingFields(DATABASE_DEBT_SONATA, entryKey, {
			[`${DEBT_VALUE_KEY_PAYMENTS}.${index}`]: this._.remove(),
			[DEBT_VALUE_KEY_DEBT]: updatedDebt
		});
		this.appendToActivityLog({
			source: ACTIVITY_SOURCE_DEBT,
			type: ACTIVITY_TYPE_PAYMENT_REMOVED,
			name
		}).catch(() => {});
	}

	/**
	 * Removes a patch note from the database and records the deletion in the activity log.
	 *
	 * @param entryKey - The document key of the patch note to remove.
	 * @param component - The component name of the deleted note, recorded in the activity log.
	 * @param element - The element name of the deleted note, recorded in the activity log.
	 * @param noteIndex - The 1-based display index of the deleted note, recorded in the activity log.
	 */
	public async removePatchNote(
		entryKey: string,
		component: string,
		element: string,
		noteIndex: number
	): Promise<void> {
		await this.removeRecordFromDB(DATABASE_PATCH_NOTES, {
			entryKey,
			component,
			element,
			noteIndex
		});
	}

	/**
	 * Removes a record from a given table by document key.
	 *
	 * {@link removeUsefulLink} - Removes a link from the useful-links collection.
	 * {@link removeLinkCategory} - Removes a category from the useful-links collection.
	 * {@link removeQuote} - Removes a quote from the quotes collection.
	 * {@link removeRecipe} - Removes a recipe from the recipes collection.
	 * {@link removeRecordFromReminderTable} - Removes a record from the reminder collection.
	 * {@link removeRecordFromDebtTable} - Removes a record from the debt collection.
	 * {@link removePatchNote} - Removes a patch note from the patch notes collection.
	 *
	 * @param tableName - The database collection name.
	 * @param entryKey - The document key of the record to remove.
	 */
	private async removeRecordFromDB(tableName: string, newRecord: any): Promise<void> {
		try {
			const result = await this.database
				.collection(tableName)
				.where(this.buildWhereClause(newRecord.entryKey))
				.remove();
			if (result.code) throw new Error(result.message);
			LOG.info(this.className, `Record has been removed from ${tableName}`);
			this.appendToActivityLog({
				...this.getRecentActivitySubtitle(tableName, newRecord),
				type: newRecord.type ?? HISTORY_STATUS_DELETED
			}).catch(() => {});
		} catch (error) {
			LOG.error(this.className, `Error while removing a record from ${tableName}`);
			throw error;
		}
	}

	/**
	 * Removes the current user's push subscription from the database, stopping
	 * future notifications until the user re-subscribes.
	 */
	public async deletePushSubscription(): Promise<void> {
		try {
			await this.deleteExistingSubscription();
			LOG.info(this.className, `Push subscription deleted`);
		} catch (error: unknown) {
			LOG.error(this.className, `Error deleting push subscription`, error as Error);
			throw error;
		}
	}

	/**
	 * Fetches the current user's push subscription document (if any) and removes it.
	 * Limits the fetch to one record to avoid an unbounded read.
	 *
	 * {@link addPushSubscription} - Calls this before adding a new subscription to ensure at most one record.
	 * {@link deletePushSubscription} - Calls this to remove the active subscription on sign-out.
	 */
	private async deleteExistingSubscription(): Promise<void> {
		const existing = await this.database.collection(DATABASE_PUSH_SUBSCRIPTIONS).limit(1).get();
		if (existing.data?.length > 0) {
			await this.database.collection(DATABASE_PUSH_SUBSCRIPTIONS).doc(existing.data[0]._id).remove();
		}
	}

	////////////////////// Below are Add methods for database records /////////////////////

	/**
	 * Adds a new useful link to the database.
	 *
	 * @param link - The link object to add.
	 */
	public async addUsefulLink(link: any): Promise<void> {
		this.updateUserStatCount(STATS_FIELD_TOTAL_LINKS, 1)
			.then(() => this.checkAndWriteDomainMilestone(STATS_FIELD_TOTAL_LINKS, MILESTONE_DOMAIN_LINK))
			.catch(() => {});
		return this.addNewRecordToDB(DATABASE_USEFUL_LINKS, { type: USEFUL_LINK_TYPE_LINK, ...link });
	}

	/**
	 * Adds a new link category to the database.
	 *
	 * @param category - The category object to add.
	 */
	public async addLinkCategory(category: { name: string; color: string; order: number }): Promise<void> {
		return this.addNewRecordToDB(DATABASE_USEFUL_LINKS, { type: USEFUL_LINK_TYPE_CATEGORY, ...category });
	}

	/**
	 * Adds a new quote to the database and increments the total quote count in statistics.
	 *
	 * @param text - The quote text.
	 * @param author - The author of the quote.
	 * @param timestamp - The timestamp of the quote.
	 */
	public async addQuote(text: string, author: string, timestamp: string): Promise<void> {
		this.addNewRecordToDB(DATABASE_QUOTES, { text, author, timestamp });
		await this.statisticsRef.update({ [STATS_FIELD_TOTAL_QUOTES]: this._.inc(1) });
		this.updateUserStatCount(STATS_FIELD_TOTAL_QUOTES, 1)
			.then(() => this.checkAndWriteDomainMilestone(STATS_FIELD_TOTAL_QUOTES, MILESTONE_DOMAIN_QUOTE))
			.catch(() => {});
	}

	/**
	 * Adds a new recipe to the database for the current user.
	 * Steps are persisted with `done: false` so the cooking state is always reset on load.
	 *
	 * @param recipe - The recipe to persist. The `id` field is ignored; the database assigns one.
	 */
	public async addRecipe(recipe: Recipe): Promise<void> {
		const { id: _, ...payload } = recipe;
		this.addNewRecordToDB(DATABASE_RECIPES, {
			...payload,
			steps: payload.steps.map((step) => ({ ...step, done: false }))
		});
		this.statisticsRef.update({ [STATS_FIELD_TOTAL_RECIPES]: this._.inc(1) }).catch(() => {});
		this.updateUserStatCount(STATS_FIELD_TOTAL_RECIPES, 1)
			.then(() => this.checkAndWriteDomainMilestone(STATS_FIELD_TOTAL_RECIPES, MILESTONE_DOMAIN_RECIPE))
			.catch(() => {});
	}

	/**
	 * Adds new movie data to the database and updates the statistics accordingly.
	 *
	 * @param movieItemVO - The movie item to add.
	 */
	public async addNewMovieDataAndUpdateStatistics(movieItemVO: MovieItemVO): Promise<void> {
		try {
			// Step 1 : Add new movie document
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

			// Step 2 : Add history entry
			await this.addNewHistoryEntry(HISTORY_STATUS_ADDED, movieItemVO);

			// Step 3 : Update movie statistics (single call — no race condition with watcher)
			const updatedData: any = {};
			updatedData[`genre.${movieItemVO.getMovieGenre()}`] = this._.inc(1);
			updatedData[STATS_FIELD_TOTAL_FILMS] = this._.inc(1);

			if (movieItemVO.getIsFavourite()) {
				updatedData[`genre.${GENRE_FAVOURITE}`] = this._.inc(1);
			}

			const statRes = await this.statisticsRef.update(updatedData);
			if (statRes.code) throw new Error(statRes.message);

			// Append to activity log so multiple adds are all visible in Recent Activity
			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_MOVIE,
				type: HISTORY_STATUS_ADDED,
				title: movieItemVO.getMovieName()
			}).catch(() => {});
			this.updateUserStatCount(STATS_FIELD_TOTAL_FILMS, 1)
				.then(() => this.checkAndWriteDomainMilestone(STATS_FIELD_TOTAL_FILMS, MILESTONE_DOMAIN_FILM))
				.catch(() => {});

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
	 * Adds a history entry with the given status and optional movie data.
	 *
	 * @param status - The activity status label (e.g. added, deleted, search).
	 * @param movieItemVO - The movie item associated with the activity.
	 */
	protected async addNewHistoryEntry(status: string, movieItemVO?: MovieItemVO): Promise<void> {
		try {
			const userId = CloudbaseService.userHasAllRights() ? { _openid: CloudbaseService.userId } : {};
			/* Capture timestamp once so the same value is used in the history message
			   and in the statistics update below (no need to parse it back from the string). */
			const timestamp = Utilities.getCurrentFormattedTime(true);
			if (movieItemVO) {
				const result = await this.database.collection(DATABASE_HISTORY).add({
					...userId,
					id: movieItemVO.getMovieId(),
					status: status,
					message: this.buildHistoryMessage(status, timestamp, movieItemVO)
				});
				/* CloudBase returns a non-empty result.code when the operation failed
				   (e.g. permission denied, document not found). */
				if (result.code) throw new Error(result.message);
				/* lastAdded / lastDeleted are updated together with genre/totalFilms
				   in the calling function (single statisticsRef.update call) to avoid
				   triggering the CloudBase watcher twice per operation. */
			} else {
				// No movie VO means this is a search activity — record without movie metadata
				const result = await this.database.collection(DATABASE_HISTORY).add({
					...userId,
					status: status,
					message: this.buildHistoryMessage(status, timestamp)
				});
				/* CloudBase returns a non-empty result.code when the operation failed
				   (e.g. permission denied, document not found). */
				if (result.code) throw new Error(result.message);

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
	public async addNewRecordToReminder(newRecord: any): Promise<void> {
		this.updateUserStatCount(STATS_FIELD_TOTAL_REMINDERS, 1)
			.then(() => this.checkAndWriteDomainMilestone(STATS_FIELD_TOTAL_REMINDERS, MILESTONE_DOMAIN_REMINDER))
			.catch(() => {});
		return this.addNewRecordToDB(DATABASE_REMINDER, newRecord);
	}

	/**
	 * Adds a new record to the debt collection.
	 *
	 * @param newRecord - The new record to add.
	 */
	public async addNewRecordToDebt(newRecord: any): Promise<void> {
		this.updateUserStatCount(STATS_FIELD_TOTAL_DEBTS, 1)
			.then(() => this.checkAndWriteDomainMilestone(STATS_FIELD_TOTAL_DEBTS, MILESTONE_DOMAIN_DEBT))
			.catch(() => {});
		return this.addNewRecordToDB(DATABASE_DEBT_SONATA, newRecord);
	}

	/**
	 * Adds a new record to the patch notes collection.
	 *
	 * @param newRecord - The record to add, with a noteIndex field appended by the caller.
	 */
	public async addNewRecordToPatchNotes(newRecord: any): Promise<void> {
		return this.addNewRecordToDB(DATABASE_PATCH_NOTES, {
			...newRecord,
			element: Utilities.capitalizeFirstLetterWithOthersUnchanged(newRecord.element.trim()),
			details: Utilities.capitalizeFirstLetterWithOthersUnchanged(newRecord.details.trim())
		});
	}

	/**
	 * Saves the user's Web Push subscription to the database so the server-side
	 * notification function can dispatch push messages on their behalf.
	 *
	 * @param subscription - The serialised PushSubscription from the browser Push API.
	 */
	public async addPushSubscription(subscription: PushSubscriptionJSON): Promise<void> {
		try {
			await this.deleteExistingSubscription();
			const result = await this.database.collection(DATABASE_PUSH_SUBSCRIPTIONS).add({
				endpoint: subscription.endpoint,
				keys: subscription.keys,
				createdAt: Utilities.getCurrentFormattedTime(true)
			});
			if (result.code) throw new Error(result.message);
			LOG.info(this.className, `Push subscription saved`);
		} catch (error: unknown) {
			LOG.error(this.className, `Error saving push subscription`, error as Error);
			throw error;
		}
	}

	/**
	 * Adds a new entry to the specified database collection and records an activity log entry.
	 *
	 * {@link addUsefulLink} - Adds a link to the useful-links collection.
	 * {@link addLinkCategory} - Adds a category to the useful-links collection.
	 * {@link addQuote} - Adds a quote to the quotes collection.
	 * {@link addRecipe} - Adds a recipe to the recipes collection.
	 * {@link addNewRecordToReminder} - Adds a record to the reminder collection.
	 * {@link addNewRecordToDebt} - Adds a record to the debt collection.
	 * {@link addNewRecordToPatchNotes} - Adds a record to the patch notes collection.
	 *
	 * @param tableName - The database collection name.
	 * @param newRecord - The new record to add.
	 */
	private async addNewRecordToDB(tableName: string, newRecord: any): Promise<void> {
		try {
			const userId = CloudbaseService.userHasAllRights() ? { _openid: CloudbaseService.userId } : {};
			const result = await this.database.collection(tableName).add({
				...userId,
				...newRecord
			});
			if (result.code) throw new Error(result.message);
			LOG.info(this.className, `${tableName} has been updated`);

			/* Links and categories share the same collection — detect a category add by
			   checking the type is not a plain link, so the activity log gets the right discriminator. */
			const isCategoryAdd =
				tableName === DATABASE_USEFUL_LINKS && newRecord.type !== USEFUL_LINK_TYPE_LINK;
			this.appendToActivityLog({
				...this.getRecentActivitySubtitle(tableName, newRecord),
				type: newRecord.isBug
					? ACTIVITY_TYPE_BUG_LOGGED
					: isCategoryAdd
						? ACTIVITY_TYPE_CATEGORY_ADDED
						: HISTORY_STATUS_ADDED
			}).catch(() => {});
		} catch (error) {
			LOG.error(this.className, `Error while adding new record to ${tableName}`, error as Error);
			throw error;
		}
	}

	/**
	 * Gets the source tag and subtitle field for an activity log entry based on the target table.
	 * Quotes surfaces the author; debt surfaces the record name; reminder surfaces the record text.
	 *
	 * @param tableName - The database collection name of the record being added.
	 * @param newRecord - The record that was just persisted.
	 * @returns An object with a source string and a display field appropriate for the table.
	 */
	private getRecentActivitySubtitle(tableName: string, newRecord: any): Record<string, string> {
		switch (tableName) {
			case DATABASE_QUOTES:
				return { source: ACTIVITY_SOURCE_RESONANCE, author: newRecord.author };
			case DATABASE_DEBT_SONATA:
				return { source: ACTIVITY_SOURCE_DEBT, name: newRecord.name };
			case DATABASE_REMINDER:
				return { source: ACTIVITY_SOURCE_REMINDER, text: newRecord.text };
			case DATABASE_PATCH_NOTES:
				return {
					source: ACTIVITY_SOURCE_PATCH,
					component: newRecord.component,
					element: newRecord.element,
					noteIndex: newRecord.noteIndex
				};
			case DATABASE_USEFUL_LINKS:
				if (newRecord.type === USEFUL_LINK_TYPE_LINK)
					return {
						source: ACTIVITY_SOURCE_LINK,
						domain: Utilities.getDomain(newRecord.url)
					};
				else if (newRecord.type === USEFUL_LINK_TYPE_CATEGORY) {
					return {
						source: ACTIVITY_SOURCE_LINK,
						domain: newRecord.name
					};
				} else if (
					newRecord.type === HISTORY_STATUS_DELETED ||
					newRecord.type === ACTIVITY_TYPE_CATEGORY_DELETED
				) {
					return {
						source: ACTIVITY_SOURCE_LINK,
						domain: newRecord.domain
					};
				} else {
					return { source: ACTIVITY_SOURCE_DEFAULT, text: 'Invalid database name' };
				}
			case DATABASE_RECIPES:
				return { source: ACTIVITY_SOURCE_RECIPE, name: newRecord.name };
			default:
				return { source: ACTIVITY_SOURCE_DEFAULT, text: 'Invalid database name' };
		}
	}

	////////////////////// Below are Utility methods for database records /////////////////////

	/**
	 * Increment the visit count for a useful link.
	 *
	 * @param key - The document key of the link.
	 * @param currentCount - The current visit count.
	 */
	public async incrementLinkVisit(key: string, currentCount: number): Promise<void> {
		try {
			const result = await this.database
				.collection(DATABASE_USEFUL_LINKS)
				.where({ _id: key, _openid: CloudbaseService.getUserId() })
				.update({ visitCount: currentCount + 1, lastVisited: new Date().toISOString() });
			if (result.code) throw new Error(result.message);
			LOG.info(this.className, 'Link visit count has been incremented');
		} catch (error) {
			LOG.error(this.className, `Error while incrementing visit count for link ${key}`, error as Error);
			throw error;
		}
	}

	/**
	 * Checks whether a given movie has already been added to the database.
	 * Performs an ID-based lookup first, then falls back to a title-and-year query
	 * to catch entries where the external API returned a different ID for the same movie.
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
			const result = await this.database
				.collection(DATABASE_MOVIES)
				.where({ id: movieId })
				.limit(1)
				.get();
			if (result.data?.length) return true;

			/* Fallback: id-based query may miss entries where the external API returned
			   a different id for the same movie. A title+year query catches edge cases. */
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
	 * Enqueues an activity log entry for sequential writing.
	 * Serializes calls through a promise chain so each read-before-write completes
	 * before the next begins, eliminating stale-read overwrites under concurrent writes.
	 *
	 * @param activity - The activity object to record.
	 */
	private appendToActivityLog(activity: any): Promise<void> {
		const next = this.activityLogQueue.then(() => this.writeActivityLogEntry(activity));
		// Keep the queue alive even when a write fails so subsequent entries still run.
		this.activityLogQueue = next.catch(() => {});
		return next;
	}

	/**
	 * Performs the actual read-then-write for a single activity log entry.
	 * Prepends the entry to the stored array and trims to STATS_CAP_ACTIVITY_LOG.
	 * Reads and updates the persistent activity streak in the per-user stats document.
	 *
	 * {@link appendToActivityLog} - The queue wrapper that serializes all calls here.
	 *
	 * @param activity - The activity object to record.
	 */
	private async writeActivityLogEntry(activity: any): Promise<void> {
		const timestamp = Utilities.getCurrentFormattedTime(true);
		const entry = { ...activity, timestamp };
		try {
			const [generalDoc, userStatsRes] = await Promise.all([
				this.database.collection(DATABASE_STATISTICS).doc(this.statId).get(),
				this.database.collection(DATABASE_STATISTICS).where(this.getUserStatsFilter()).get()
			]);
			const raw = generalDoc.data?.[0]?.[STATS_FIELD_RECENT_ACTIVITIES];
			const existing: any[] = raw ? (Array.isArray(raw) ? raw : Object.values(raw)) : [];
			// Prepend the new item and trim to the cap so CloudBase storage stays bounded.
			const updated = [entry, ...existing].slice(0, STATS_CAP_ACTIVITY_LOG);
			const result = await this.statisticsRef.update({ [STATS_FIELD_RECENT_ACTIVITIES]: updated });
			if (result.code) throw new Error(result.message ?? 'Recent activity data update failed');
			// Compute and persist the updated streak to the per-user stats doc (source of truth).
			const today = Utilities.formatDateForStorage(new Date());
			const userDoc = userStatsRes.data?.[0];
			const storedStreak = (userDoc?.[STATS_FIELD_ACTIVITY_STREAK] as number) ?? 0;
			const storedDate = (userDoc?.[STATS_FIELD_ACTIVITY_STREAK_DATE] as string) ?? '';
			let newStreak: number;
			if (storedDate === today) {
				newStreak = storedStreak;
			} else {
				const yesterday = new Date();
				yesterday.setDate(yesterday.getDate() - 1);
				newStreak = storedDate === Utilities.formatDateForStorage(yesterday) ? storedStreak + 1 : 1;
			}
			this.database
				.collection(DATABASE_STATISTICS)
				.where(this.getUserStatsFilter())
				.update({
					[STATS_FIELD_ACTIVITY_STREAK]: newStreak,
					[STATS_FIELD_ACTIVITY_STREAK_DATE]: today
				})
				.catch(() => {});
			this.checkAndWriteCountMilestone(MILESTONE_DOMAIN_STREAK, newStreak, userDoc).catch(() => {});
		} catch (error) {
			LOG.error(this.className, 'Error while updating activity data', error as Error);
			throw error;
		}
	}

	/**
	 * Atomically increments or decrements a single counter field on the current user's
	 * stats document in the statistics collection. Errors are logged but not propagated —
	 * all callers treat stat updates as fire-and-forget.
	 *
	 * @param field - The field name constant to update (e.g. STATS_FIELD_TOTAL_FILMS).
	 * @param delta - The amount to change the counter — pass 1 to increment, -1 to decrement.
	 * @returns A promise that resolves when the update completes.
	 */
	public async updateUserStatCount(field: string, delta: 1 | -1): Promise<void> {
		const result = await this.database
			.collection(DATABASE_STATISTICS)
			.where(this.getUserStatsFilter())
			.update({ [field]: this._.inc(delta) });
		if (result.code) {
			LOG.error(this.className, result.message ?? 'User stat update failed');
		}
	}

	/**
	 * Checks whether a per-user stats document exists and seeds it if absent.
	 * Uses a one-time `.get()` so the check is not watcher-dependent — safe to call on every
	 * page load because it exits immediately when the doc already exists.
	 *
	 * @returns A promise that resolves when the check (and optional seed) completes.
	 */
	public async ensureUserStatsExist(): Promise<void> {
		const result = await this.database
			.collection(DATABASE_STATISTICS)
			.where(this.getUserStatsFilter())
			.get();
		if (!result.data?.length) {
			await this.seedUserStats();
		}
	}

	/**
	 * Seeds the current user's per-user stats document with live counts from each collection.
	 * Intended to be called once from the browser to initialise the stats doc, then removed.
	 *
	 * @returns A promise that resolves when the seed write completes.
	 */
	public async seedUserStats(): Promise<void> {
		const userId = CloudbaseService.getUserId();
		const [films, quotes, recipes, reminders, debts, links] = await Promise.all([
			this.database.collection(DATABASE_MOVIES).where({ _openid: userId }).get(),
			this.database.collection(DATABASE_QUOTES).where({ _openid: userId }).get(),
			this.database.collection(DATABASE_RECIPES).where({ _openid: userId }).get(),
			this.database.collection(DATABASE_REMINDER).where({ _openid: userId }).get(),
			this.database.collection(DATABASE_DEBT_SONATA).where({ _openid: userId }).get(),
			this.database
				.collection(DATABASE_USEFUL_LINKS)
				.where({ _openid: userId, type: USEFUL_LINK_TYPE_LINK })
				.get()
		]);
		const payload = {
			_openid: userId,
			[STATS_FIELD_IS_USER_STATS]: true,
			[STATS_FIELD_TOTAL_FILMS]: films.data?.length ?? 0,
			[STATS_FIELD_TOTAL_QUOTES]: quotes.data?.length ?? 0,
			[STATS_FIELD_TOTAL_RECIPES]: recipes.data?.length ?? 0,
			[STATS_FIELD_TOTAL_REMINDERS]: reminders.data?.length ?? 0,
			[STATS_FIELD_TOTAL_DEBTS]: debts.data?.length ?? 0,
			[STATS_FIELD_TOTAL_LINKS]: links.data?.length ?? 0,
			[STATS_FIELD_ACTIVITY_STREAK]: 0,
			[STATS_FIELD_ACTIVITY_STREAK_DATE]: '',
			[STATS_FIELD_MILESTONES]: { [MILESTONE_KEY_ACCOUNT_CREATED]: Utilities.formatDateForStorage(new Date()) }
		};
		try {
			const result = await this.database.collection(DATABASE_STATISTICS).add(payload);
			if (result.code) throw new Error(result.message ?? 'Seed user stats failed');
			LOG.info(this.className, 'User stats seeded successfully');
		} catch (error) {
			LOG.error(this.className, 'Error while seeding user stats', error as Error);
			throw error;
		}
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

		/* The endpoint only exists when the compiled Express server is running.
		   In `ng serve` dev mode Angular intercepts all requests and returns HTML,
		   so we guard on Content-Type before attempting to parse JSON — this keeps
		   the dev experience clean with no spurious warnings. */
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
			/* Non-JSON response means the Express server is not running (ng serve).
			   Fall through silently to CloudBase. */
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
			: { _id: id, _openid: CloudbaseService.getUserId() };
	}

	/**
	 * Gets the CloudBase where-clause object that identifies the current user's stats document.
	 * Used by all per-user stats reads and writes to ensure consistency.
	 *
	 * @returns The where-clause object with _openid and isUserStats fields.
	 */
	private getUserStatsFilter(): Record<string, unknown> {
		return { _openid: CloudbaseService.getUserId(), [STATS_FIELD_IS_USER_STATS]: true };
	}

	/**
	 * Reads the current per-user stats doc, derives the count from `field`, then delegates
	 * to {@link checkAndWriteCountMilestone} to record the milestone if the threshold is met.
	 * Called fire-and-forget after each domain stat increment via a `.then()` chain.
	 *
	 * @param field - The per-user stats field to read the count from.
	 * @param domain - The milestone domain prefix (e.g. MILESTONE_DOMAIN_FILM).
	 */
	private async checkAndWriteDomainMilestone(field: string, domain: string): Promise<void> {
		const res = await this.database.collection(DATABASE_STATISTICS).where(this.getUserStatsFilter()).get();
		const doc = res?.data?.[0];
		if (!doc) return;
		const count = (doc[field] as number) ?? 0;
		await this.checkAndWriteCountMilestone(domain, count, doc);
	}

	/**
	 * Checks whether `count` is a milestone threshold (count === 1 or multiple of 5) and,
	 * if the key is not already in the per-user milestones map, writes the current date.
	 *
	 * {@link checkAndWriteDomainMilestone} - Calls this after reading the count from the doc.
	 *
	 * @param domain - The milestone domain prefix (e.g. "film", "streak").
	 * @param count - The new count value to evaluate.
	 * @param doc - Pre-loaded per-user stats document.
	 */
	private async checkAndWriteCountMilestone(domain: string, count: number, doc: any): Promise<void> {
		const key = Utilities.getMilestoneKey(domain, count);
		if (!key || !doc) return;
		const milestones = (doc[STATS_FIELD_MILESTONES] as Record<string, string>) ?? {};
		if (milestones[key]) return;
		await this.database
			.collection(DATABASE_STATISTICS)
			.where(this.getUserStatsFilter())
			.update({ [`${STATS_FIELD_MILESTONES}.${key}`]: Utilities.formatDateForStorage(new Date()) });
	}

	/**
	 * Converts a Blob to a raw base64 string (without the data-URL prefix).
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
}
