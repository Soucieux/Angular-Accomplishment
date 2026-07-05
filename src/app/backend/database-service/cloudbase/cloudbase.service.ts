import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, combineLatest, from, of } from 'rxjs';
import {
	shareReplay,
	switchMap,
	take,
	filter,
	map,
	startWith,
	catchError,
	distinctUntilChanged
} from 'rxjs/operators';
import { MovieItemVO } from '../../../fontend/entertainment/movieItem.vo';
import {
	CLOUDBASE,
	CloudbaseApp,
	ConnectResult,
	ConnectedMember,
	DatabaseService,
	PassphraseLockStatus
} from '../database.service';
import { LOG } from '../../../common/app.logs';
import { Utilities } from '../../../common/utilities/app.utilities';
import { LocaleService } from '../../../common/locale/locale.service';
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
	REMINDER_VALUE_KEY_SHARED,
	DATABASE_STATISTICS,
	DATABASE_USERS,
	DATABASE_RECIPES,
	DATABASE_USEFUL_LINKS,
	DATABASE_VAULT,
	VAULT_KIND_NODE,
	VAULT_KIND_EDGE,
	VAULT_KIND_CATEGORY,
	VAULT_VALUE_KEY_KIND,
	VAULT_VALUE_KEY_NODE_TYPE,
	VAULT_VALUE_KEY_NAME,
	VAULT_VALUE_KEY_CATEGORIES,
	VAULT_VALUE_KEY_SOURCE_ID,
	VAULT_VALUE_KEY_TARGET_ID,
	VAULT_VALUE_KEY_RELATION,
	VAULT_VALUE_KEY_LABEL,
	VAULT_VALUE_KEY_HEX,
	VAULT_VALUE_KEY_GRADIENT,
	VAULT_VALUE_KEY_VERIFIED,
	STATS_FIELD_TAURI_NOTIF_ENABLED,
	STATS_FIELD_MINIMIZE_ON_CLOSE,
	STATS_FIELD_LOCALE,
	STATS_FIELD_TODAY_ITEMS,
	DB_LOG_TODAY_ITEMS_FAILED,
	LOCALE_KEY_EN,
	LOCALE_KEY_ZH,
	USEFUL_LINK_TYPE_LINK,
	USEFUL_LINK_TYPE_CATEGORY,
	ACTIVITY_TYPE_UPDATED,
	GENRE_FAVOURITE,
	HISTORY_STATUS_ADDED,
	HISTORY_STATUS_DELETED,
	HISTORY_STATUS_COMPLETED,
	ENT_LOG_SPAN_CLASS_RATE_DOWN,
	ENT_LOG_SPAN_CLASS_RATE_UP,
	SEARCH,
	STATS_CAP_ACTIVITY_LOG,
	STATS_FIELD_ACTIVITY_STREAK,
	STATS_FIELD_ACTIVITY_STREAK_DATE,
	STATS_FIELD_IS_USER_STATS,
	STATS_FIELD_IS_GROUP,
	STATS_FIELD_SHARED_WITH,
	STATS_FIELD_CONNECTIONS,
	STATS_FIELD_SHARED_REV,
	STATS_FIELD_SHARED_RECENT_ACTIVITY,
	STATS_FIELD_CONNECT_CODE,
	STATS_FIELD_OUTGOING_REQUESTS,
	CONNECT_CODE_ALPHABET,
	CONNECT_CODE_LENGTH,
	STATS_FIELD_RECENT_ACTIVITIES,
	STATS_FIELD_TOTAL_DEBTS,
	STATS_FIELD_TOTAL_REMINDERS,
	STATS_FIELD_COMPLETED_PRIVATE,
	STATS_FIELD_COMPLETED_SHARED,
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
	SHARED_REMINDER_ACTION_DELETE,
	SHARED_REMINDER_ACTION_COMPLETE,
	ACTIVITY_SOURCE_VAULT,
	ACTIVITY_SOURCE_RESONANCE,
	ACTIVITY_TYPE_BUG_LOGGED,
	ACTIVITY_TYPE_RESET,
	DEBT_VALUE_KEY_DEBT,
	DEBT_VALUE_KEY_PAID,
	DEBT_VALUE_KEY_PAYMENTS,
	ACTIVITY_SOURCE_DATE_CALCULATOR,
	ACTIVITY_SOURCE_DEFAULT,
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
	MILESTONE_DOMAIN_STREAK,
	CLOUDBASE_ERR_PERMISSION_DENIED,
	DB_LOG_MOVIE_LIST_FAILED,
	DB_LOG_TEMP_URLS_FAILED,
	DB_LOG_DATE_CALC_UPDATED,
	DB_LOG_DATE_CALC_UPDATE_FAILED,
	DB_LOG_MOVIE_RATE_UPDATE_FAILED,
	DB_LOG_MOVIE_GENRE_UPDATE_FAILED,
	DB_LOG_MOVIE_FAVOURITE_UPDATE_FAILED,
	DB_LOG_STATS_UPDATE_FAILED,
	DB_LOG_HISTORY_ADDED,
	DB_LOG_HISTORY_ADD_FAILED,
	DB_LOG_ACTIVITY_UPDATE_FAILED,
	DB_LOG_USER_STAT_UPDATE_FAILED,
	DB_LOG_USER_STATS_SEEDED,
	DB_LOG_USER_STATS_SEED_FAILED,
	DB_LOG_USER_STATS_MIGRATED,
	DB_LOG_USER_STATS_MIGRATE_FAILED,
	DB_LOG_MOVIE_GENRE_UPDATED,
	DB_LOG_MOVIE_STATS_UPDATED,
	DB_LOG_MOVIE_FAVOURITE_UPDATED,
	DB_LOG_TAURI_PREF_FAILED,
	DB_LOG_MINIMIZE_PREF_FAILED,
	DB_LOG_LOCALE_PREF_FAILED,
	DB_LOG_MOVIE_ADDED,
	DB_LOG_VISIT_INCREMENTED,
	DB_LOG_RECORD_TABLE_UPDATED,
	DB_LOG_TABLE_UPDATE_FAILED,
	DB_LOG_RECORD_REMOVED_FROM,
	DB_LOG_MOVIE_DOC_REMOVED,
	DB_LOG_COVER_REMOVED,
	DB_LOG_STATS_AFTER_REMOVE,
	DB_LOG_RECORD_REMOVE_FAILED,
	DB_LOG_HAS_BEEN_UPDATED,
	DB_LOG_RECORD_ADD_FAILED,
	DB_LOG_VISIT_INCREMENT_FAILED,
	DB_LOG_COVER_UPLOADED,
	DB_LOG_FETCH_URL_ERROR,
	DB_LOG_PROXY_FETCH_FAILED
} from '../../../common/constants';
import {
	ERROR_NO_DOCUMENT_UPDATED,
	ENT_LOG_RATE_PRE,
	ENT_LOG_RATE_IS,
	ENT_LOG_RATE_BY,
	ENT_LOG_RATE_TO,
	ENT_LOG_RATE_SAME,
	ENT_LOG_RATE_UP,
	ENT_LOG_RATE_DOWN,
	ACTIVITY_INVALID_TABLE_TEXT
} from '../../../common/locale/locale-strings';
import { SearchStreamService } from '../../dialog-service/search/search-stream.service';
import { Recipe } from '../../../fontend/recipe/recipe.model';
import { VaultRecord, VaultNodeType } from '../../../fontend/vault/vault.model';
import { TodayTask } from '../../../fontend/today/today.model';
import { SessionExpiredError } from '../../../common/error/session-expired.error';
import { UnexpectedError } from '../../../common/error/unexpected.error';

@Injectable({ providedIn: 'root' })
export class CloudbaseService extends DatabaseService {
	private readonly className = 'CloudbaseService';
	private database: any;
	private statId: any;
	private static userId: string;
	private static userRole: string[];
	private static userName: string;
	// '_' is a reserved keyword in the CloudBase SDK used to access its command builder
	private _!: any;
	// Single shared watch on the current user's document — reused by every getUserStats() caller so
	// CloudBase never opens duplicate watches on the same doc (duplicates cause dropped "nextevent ignored").
	private userStats$?: Observable<any>;
	// Memoized reminder stream — kept warm so navigating back to the reminder page replays instantly
	// instead of rebuilding the (refCount) watch from scratch on every visit.
	private reminderDetails$?: Observable<any[]>;
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
		private searchStreamService: SearchStreamService,
		private ngZone: NgZone,
		private localeService: LocaleService
	) {
		super();
		if (isPlatformBrowser(this.platformId)) {
			this.database = this.cloudbase.database();
			this._ = this.database.command;

			const fetchStatId = () =>
				this.database
					.collection(DATABASE_STATISTICS)
					.where(this.getGlobalStatsFilter())
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
	public static setUserRole(userRole: string[]) {
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
		return this.userRole?.some((r) => r.includes(ROLE_ADMIN)) ?? false;
	}

	/**
	 * Shorthand reference to the single statistics document.
	 * All stat reads and writes should go through this getter so the collection
	 * name and document ID never need to be repeated across methods.
	 */
	private get statisticsRef() {
		return this.database.collection(DATABASE_STATISTICS).doc(this.statId);
	}

	// ── Retrieval methods ────────────────────────────────────────────────────

	/**
	 * Gets the statistics from CloudBase as a real-time observable.
	 *
	 * @returns An observable that emits the statistics document.
	 */
	public getStatistics(): Observable<any> {
		// Scope to the global stats doc (isGroup != true). Group docs are members-only,
		// so watching the whole collection would fail the security rule.
		return this.watchCollection(
			DATABASE_STATISTICS,
			(docs) => docs[0],
			false,
			(col) => col.where(this.getGlobalStatsFilter())
		);
	}

	/**
	 * Gets the current user's per-user stats document as a real-time observable.
	 *
	 * @returns An observable that emits the user's stats document, or undefined when absent.
	 */
	public getUserStats(): Observable<any> {
		// Memoized so all consumers (account page, reminder toggle, shared-reminder watcher) share one
		// watch on the user document; watchCollection already applies shareReplay(1) to fan it out.
		return (this.userStats$ ??= this.watchCollection(
			DATABASE_USERS,
			(docs) => docs[0],
			false,
			(col) => col.where(this.getUserStatsFilter())
		));
	}

	/**
	 * Gets the date calculator details from CloudBase as a real-time observable.
	 *
	 * @returns An observable that emits the date calculator row list.
	 */
	public getDateCalculatorTableDetails(): Observable<any[]> {
		/* Date calculator rows are flat — emit as-is. Fallback to [] prevents downstream .length errors
		   when the collection is empty. The watch is scoped to the caller's own documents: an unscoped
		   whole-collection watch is denied by the ownership rule and fails init with an opaque SDK error
		   ("Cannot read property 'code' of undefined"). getUserId() is read inside the builder so it
		   resolves after watchCollection's authReady gate. */
		return this.watchCollection(
			DATABASE_DATE_CALCULATOR,
			(docs) => docs ?? [],
			false,
			(col) => col.where({ _openid: CloudbaseService.getUserId() })
		);
	}

	/**
	 * Gets the useful links from the database as a real-time observable.
	 *
	 * @returns An observable that emits the useful links list.
	 */
	public getUsefulLinks(): Observable<any[]> {
		/* No _openid filter: returns every user's links, since the read rule allows any
		   non-anonymous user to read the full collection. The portal component splits the
		   result into Shared / My Links by the persisted `isShared` flag. */
		return this.watchCollection(
			DATABASE_USEFUL_LINKS,
			(docs) =>
				docs
					.filter((doc: any) => doc.type !== USEFUL_LINK_TYPE_CATEGORY)
					.map((doc: any) => ({ ...doc })),
			true
		);
	}

	/**
	 * Gets the link categories from the database as a real-time observable.
	 *
	 * @returns An observable that emits the link categories list.
	 */
	public getLinkCategories(): Observable<any[]> {
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
				// Step 1: Remap CloudBase _id → key so templates can trackBy without touching private fields
				const quotes = docs.map((doc: any) => {
					const { _id, ...rest } = doc;
					return { key: _id, ...rest };
				});

				// Step 2: Sort newest-first — CloudBase watch() emits in insertion order, not timestamp order
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
									// Step 1: Map raw CloudBase docs to typed MovieItemVO instances
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

									// Step 2: Sort by release date — watcher emits in insertion order
									movies.sort((a: MovieItemVO, b: MovieItemVO) =>
										a
											.getMovieFirstReleaseDate()
											.localeCompare(b.getMovieFirstReleaseDate())
									);

									// Step 3: Resolve cloud:// file IDs to signed temp URLs before emitting
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
									LOG.error(this.className, DB_LOG_MOVIE_LIST_FAILED, err);
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
	 * Merges two sources: reminders the user owns (a live watch), and the shared reminders of the
	 * accounts the user is connected to. CloudBase realtime watch cannot reliably push another user's
	 * documents, so the shared set is fetched through an admin Cloud Function and re-fetched whenever
	 * the live user document signals a change — either the connection set (sharedWith) or a connection's
	 * shared-reminder edit (sharedRev). The shared source is fail-safe: any rejection yields an empty
	 * list so the owned-reminders stream is never affected.
	 *
	 * @returns An observable that emits the merged reminder details list.
	 */
	public getReminderTableDetails(): Observable<any[]> {
		if (this.reminderDetails$) return this.reminderDetails$;

		const mapDocs = (docs: any[]) =>
			docs.map((doc: any) => {
				const { _id, ...rest } = doc;
				return { key: _id, ...rest };
			});

		// getUserId() is read inside the query builder so it resolves after watchCollection's authReady
		// gate — capturing it here would use an undefined openid on a cold reminder load and the watch
		// would silently never emit, hanging the loading state.
		const owned$ = this.watchCollection(DATABASE_REMINDER, mapDocs, false, (col) =>
			col.where({ _openid: CloudbaseService.getUserId() })
		);

		/* Shared reminders, signal-driven: the live user document carries both the connection set and a
		   sharedRev counter that connections bump on any shared-reminder change. On either signal, re-fetch
		   the shared set via the admin Cloud Function. startWith keeps owned reminders flowing before the
		   first fetch; catchError guards any rejection so an empty list means only owned reminders show. */
		const shared$ = this.getUserStats().pipe(
			map((doc) => ({
				// sharedWith comes from an unordered watch() snapshot; sort so distinctUntilChanged
				// compares membership by content, not position, avoiding spurious shared re-fetches.
				members: [...((doc?.[STATS_FIELD_SHARED_WITH] as string[]) ?? [])].sort(),
				rev: (doc?.[STATS_FIELD_SHARED_REV] as number) ?? 0
			})),
			distinctUntilChanged(
				(a, b) =>
					a.rev === b.rev &&
					a.members.length === b.members.length &&
					a.members.every((id, i) => id === b.members[i])
			),
			switchMap((signal) =>
				signal.members.length ? from(this.getSharedReminders()) : of([] as any[])
			),
			startWith([] as any[]),
			catchError(() => of([] as any[]))
		);

		// De-duplicate by key so a reminder the user both owns and is shared into appears once. shareReplay
		// keeps the merged stream (and its underlying watch) warm across navigations for instant re-entry.
		this.reminderDetails$ = combineLatest([owned$, shared$]).pipe(
			map(([owned, shared]) => Utilities.uniqueByKey([...owned, ...shared], (item) => item.key)),
			shareReplay(1)
		);
		return this.reminderDetails$;
	}

	/**
	 * Gets the shared reminders of the current user's connected accounts via the admin Cloud Function,
	 * mapped to the same view shape as owned reminders (CloudBase _id → key).
	 *
	 * {@link getReminderTableDetails} - Merges these with the user's owned reminders.
	 *
	 * @returns A promise resolving to the connected accounts' shared reminder view models.
	 */
	private async getSharedReminders(): Promise<any[]> {
		const response: any = await this.cloudbase.callFunction({ name: 'getSharedReminders', data: {} });
		return Utilities.toArray(response?.result?.items).map((doc: any) => {
			const { _id, ...rest } = doc;
			return { key: _id, ...rest };
		});
	}

	/**
	 * Edits a single field on a connected account's shared reminder via the admin Cloud Function. The
	 * reminder collection rule is own-only, so a non-owner's write must go through the function, which
	 * re-checks the link server-side before writing. Signals connections on success.
	 *
	 * @param entryKey - The reminder document id to update.
	 * @param valueKey - The field to update.
	 * @param value - The new value for the field.
	 * @param text - The reminder text, recorded in the caller's shared activity feed.
	 * @returns A promise resolving to the edit result ({ success, error }).
	 */
	public async updateSharedReminderField(
		entryKey: string,
		valueKey: string,
		value: unknown,
		text: string
	): Promise<ConnectResult> {
		const response: any = await this.cloudbase.callFunction({
			name: 'editSharedReminder',
			data: { entryKey, updates: { [valueKey]: value } }
		});
		const result: ConnectResult = response?.result ?? { success: false };
		if (result.success) {
			// Records the edit on the caller's own shared feed so connections see "who changed what".
			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_REMINDER,
				type: ACTIVITY_TYPE_UPDATED,
				text,
				isShared: true,
				element: valueKey
			}).catch(() => {});
			this.notifySharedChange();
		}
		return result;
	}

	/**
	 * Deletes a connected account's shared reminder via the admin Cloud Function, which re-checks the
	 * link server-side before removing it. Signals connections on success.
	 *
	 * @param entryKey - The reminder document id to delete.
	 * @param text - The reminder text, recorded in the caller's shared activity feed.
	 * @returns A promise resolving to the delete result ({ success, error }).
	 */
	public async removeSharedReminder(entryKey: string, text: string): Promise<ConnectResult> {
		const response: any = await this.cloudbase.callFunction({
			name: 'editSharedReminder',
			data: { entryKey, action: SHARED_REMINDER_ACTION_DELETE }
		});
		const result: ConnectResult = response?.result ?? { success: false };
		if (result.success) {
			// Records the deletion on the caller's own shared feed so connections see who removed it.
			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_REMINDER,
				type: HISTORY_STATUS_DELETED,
				text,
				isShared: true
			}).catch(() => {});
			this.notifySharedChange();
		}
		return result;
	}

	/**
	 * Completes a shared reminder: the Cloud Function removes the document and bumps the
	 * shared-completed counter for every linked member (owner plus everyone in their link), so the
	 * caller's own completedShared is incremented server-side — never here, to avoid double-counting.
	 * Records the completion on the caller's shared feed and signals connections to re-fetch.
	 *
	 * @param entryKey - The document key of the shared reminder being completed.
	 * @param text - The reminder text, recorded in the shared activity log.
	 * @returns The Cloud Function result indicating whether the completion succeeded.
	 */
	public async completeSharedReminder(entryKey: string, text: string): Promise<ConnectResult> {
		const response: any = await this.cloudbase.callFunction({
			name: 'editSharedReminder',
			data: { entryKey, action: SHARED_REMINDER_ACTION_COMPLETE }
		});
		const result: ConnectResult = response?.result ?? { success: false };
		if (result.success) {
			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_REMINDER,
				type: HISTORY_STATUS_COMPLETED,
				text,
				isShared: true
			}).catch(() => {});
			this.notifySharedChange();
		}
		return result;
	}

	/**
	 * Signals the current user's connections that a shared reminder changed, via the Cloud Function
	 * (it bumps sharedRev on each connection's own document, which their live user-document watch then
	 * observes and re-fetches on). Fire-and-forget — a failure only delays their next refresh.
	 *
	 * {@link addNewRecordToReminder} - Signals after creating a shared reminder.
	 * {@link updateReminderTable} - Signals after editing a shared reminder.
	 * {@link removeRecordFromReminderTable} - Signals after deleting a shared reminder.
	 */
	private notifySharedChange(): void {
		this.cloudbase.callFunction({ name: 'notifySharedChange', data: {} }).catch(() => {});
	}

	/**
	 * Gets the shared activity feed for the current user — the user's own and their connections'
	 * mutations to shared reminders, aggregated by the Cloud Function (admin context reads each
	 * connection's document). Merged with the user's personal recent activity to form the home feed.
	 *
	 * @returns A promise resolving to the shared activity entries, empty when the user has no connections.
	 */
	public async getSharedRecentActivity(): Promise<any[]> {
		const response: any = await this.cloudbase.callFunction({ name: 'getSharedActivity', data: {} });
		return Utilities.toArray(response?.result?.activity);
	}

	/**
	 * Sends a connect request to the account owning the given connect code, via the Cloud Function
	 * (admin context — clients cannot look up or write another user's document directly).
	 *
	 * @param code - The target account's connect code.
	 * @returns A promise resolving to the request result.
	 */
	public async sendConnectRequest(code: string): Promise<ConnectResult> {
		const response: any = await this.cloudbase.callFunction({
			name: 'sendConnectRequest',
			data: { code, name: CloudbaseService.getUserName() }
		});
		return response?.result ?? { success: false };
	}

	/**
	 * Cancels a still-pending connect request the user sent, via the Cloud Function — it withdraws the
	 * request from both the sender's outgoing list and the target's incoming list (admin context).
	 *
	 * @param toOpenid - The target openid the request was sent to.
	 * @returns A promise resolving to the cancel result.
	 */
	public async cancelConnectRequest(toOpenid: string): Promise<ConnectResult> {
		const response: any = await this.cloudbase.callFunction({
			name: 'cancelConnectRequest',
			data: { toOpenid }
		});
		return response?.result ?? { success: false };
	}

	/**
	 * Dismisses one of the user's own sent connect requests by the target openid (owner write —
	 * the entry is removed from their own outgoingRequests array). Used to clear a resolved
	 * "connected" / "declined" notice from the sent-requests list.
	 *
	 * @param toOpenid - The target openid of the outgoing request to remove.
	 * @returns A promise that resolves when the update completes.
	 */
	public async clearOutgoingRequest(toOpenid: string): Promise<void> {
		const res = await this.database
			.collection(DATABASE_USERS)
			.where(this.getUserStatsFilter())
			.limit(1)
			.get();
		const existing = Utilities.toArray(res.data?.[0]?.[STATS_FIELD_OUTGOING_REQUESTS]) as Array<{
			toOpenid?: string;
		}>;
		const remaining = existing.filter((entry) => entry.toOpenid !== toOpenid);
		await this.updateUserStatsFields({ [STATS_FIELD_OUTGOING_REQUESTS]: remaining });
	}

	/**
	 * Approves or declines a pending connect request, via the Cloud Function (the approval adds the
	 * bidirectional connection in admin context).
	 *
	 * @param fromOpenid - The openid of the requesting account.
	 * @param accept - True to approve and link, false to decline.
	 * @returns A promise resolving to the response result.
	 */
	public async respondConnectRequest(fromOpenid: string, accept: boolean): Promise<ConnectResult> {
		const response: any = await this.cloudbase.callFunction({
			name: 'respondConnectRequest',
			data: { fromOpenid, accept, name: CloudbaseService.getUserName() }
		});
		return response?.result ?? { success: false };
	}

	/**
	 * Leaves a single connection, via the Cloud Function (admin context — it removes the pairwise edge
	 * and flips both accounts' connection records to 'leave').
	 *
	 * @param otherOpenid - The openid of the connected account to leave.
	 * @returns A promise resolving to the disconnect result.
	 */
	public async disconnect(otherOpenid: string): Promise<ConnectResult> {
		const response: any = await this.cloudbase.callFunction({
			name: 'disconnect',
			data: { otherOpenid }
		});
		return response?.result ?? { success: false };
	}

	/**
	 * Reports whether the caller has already set a passphrase for the given generic passphrase-lock
	 * feature key (e.g. 'vault'). Used to decide whether a page shows its first-time setup screen or
	 * its unlock prompt.
	 *
	 * @param featureKey - The generic passphrase-lock feature identifier.
	 * @returns A promise resolving to the status result.
	 */
	public async getPassphraseLockStatus(featureKey: string): Promise<PassphraseLockStatus> {
		const response: any = await this.cloudbase.callFunction({
			name: 'getPassphraseLockStatus',
			data: { featureKey }
		});
		return response?.result ?? { success: false, isSet: false };
	}

	/**
	 * Sets or replaces the caller's own passphrase for the given generic passphrase-lock feature key.
	 * Used for both first-time setup and later changes.
	 *
	 * @param featureKey - The generic passphrase-lock feature identifier.
	 * @param passphrase - The new plaintext passphrase.
	 * @returns A promise resolving to the set result.
	 */
	public async setPassphraseLock(featureKey: string, passphrase: string): Promise<ConnectResult> {
		const response: any = await this.cloudbase.callFunction({
			name: 'setPassphraseLock',
			data: { featureKey, passphrase }
		});
		return response?.result ?? { success: false };
	}

	/**
	 * Verifies a passphrase attempt against the caller's stored hash for the given generic
	 * passphrase-lock feature key. The hash never leaves the server.
	 *
	 * @param featureKey - The generic passphrase-lock feature identifier.
	 * @param passphrase - The plaintext passphrase attempt.
	 * @returns A promise resolving to the verify result.
	 */
	public async verifyPassphraseLock(featureKey: string, passphrase: string): Promise<ConnectResult> {
		const response: any = await this.cloudbase.callFunction({
			name: 'verifyPassphraseLock',
			data: { featureKey, passphrase }
		});
		return response?.result ?? { success: false };
	}

	/**
	 * Clears a resolved connection record (status 'leave') from the user's own connections list — an
	 * owner write, since it only touches the current user's document.
	 *
	 * @param otherOpenid - The openid of the connection record to remove.
	 * @returns A promise that resolves when the update completes.
	 */
	public async clearConnection(otherOpenid: string): Promise<void> {
		const connections = await this.getMyConnections();
		const remaining = connections.filter((entry) => entry.openid !== otherOpenid);
		await this.updateUserStatsFields({ [STATS_FIELD_CONNECTIONS]: remaining });
	}

	/**
	 * Gets the Account Expenses (debt sonata) details from CloudBase as a real-time observable.
	 *
	 * @returns An observable that emits the Account Expenses details list.
	 */
	public getDebtSonataTableDetails(): Observable<any[]> {
		/* Map CloudBase _id → key so Angular *ngFor can trackBy it;
		   name and content fields pass through as-is. */
		return this.watchCollection(
			DATABASE_DEBT_SONATA,
			(docs) =>
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
				}),
			false,
			(col) => col.where({ _openid: CloudbaseService.getUserId() })
		);
	}

	/**
	 * Gets the current user's vault graph from CloudBase as a real-time observable.
	 *
	 * @returns An observable that emits the vault records list (nodes, edges, and custom categories).
	 */
	public getVault(): Observable<VaultRecord[]> {
		return this.watchCollection(
			DATABASE_VAULT,
			(docs) =>
				docs.map((doc: any) => {
					const { _id, ...rest } = doc;
					return { key: _id, ...rest } as VaultRecord;
				}),
			false,
			(col) => col.where({ _openid: CloudbaseService.getUserId() })
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
						const locale = this.localeService.currentLocale;
						observer.next(
							docs
								.filter((doc: any) => (doc.lang ?? 'en') === locale)
								.map((doc: any) => {
									const { _id, _openid, order, lang, ...rest } = doc;
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
		return (
			CloudbaseService.authReady$
				.pipe(
					take(1),
					switchMap(
						() =>
							new Observable<T>((observer) => {
								const col = this.database.collection(collectionName);
								const query = queryBuilder ? queryBuilder(col) : col;
								const watcher = query.watch({
									onChange: (snapshot: any) => {
										// Emit inside Angular's zone — CloudBase fires watch callbacks outside it, so
										// otherwise Default change detection never runs and the view only updates on the
										// next user interaction (e.g. the reminder list staying blank after a refresh).
										this.ngZone.run(() => observer.next(mapper(snapshot.docs)));
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
				/* shareReplay keeps each watch warm for the app's lifetime so navigating away and back replays
			   the last snapshot instantly instead of tearing the CloudBase watch down and rebuilding it —
			   the rebuild churns the realtime socket and can fail watch init with a transient SDK error
			   ("Cannot read property 'code' of undefined"). refCount is intentionally omitted: under the
			   adjacency model no consumer re-keys a watch via switchMap (shared reminders now read through a
			   Cloud Function, not a watch), so warm watches never stack the duplicates refCount guarded against. */
				.pipe(shareReplay(1))
		);
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
					LOG.error(this.className, DB_LOG_TEMP_URLS_FAILED, error as Error);
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

	// ── Update methods ───────────────────────────────────────────────────────

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
					this.throwIfCloudbaseError(result);
				})
			);
			LOG.info(this.className, DB_LOG_DATE_CALC_UPDATED);
			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_DATE_CALCULATOR,
				type: ACTIVITY_TYPE_CALCULATOR_UPDATED
			}).catch(() => {});
		} catch (error) {
			LOG.error(this.className, DB_LOG_DATE_CALC_UPDATE_FAILED, error as Error);
			this.rethrowCaught(error);
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
		await this.updateTableExistingFields(DATABASE_USEFUL_LINKS, {
			entryKey,
			fields: { ...updates },
			source: ACTIVITY_SOURCE_LINK,
			type: ACTIVITY_TYPE_UPDATED,
			domain
		});
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
		updates: Partial<{ name: string; order: number }>,
		name: string
	): Promise<void> {
		await this.updateTableExistingFields(DATABASE_USEFUL_LINKS, {
			entryKey,
			fields: { ...updates },
			source: ACTIVITY_SOURCE_LINK,
			type: ACTIVITY_TYPE_CATEGORY_UPDATED,
			domain: name
		});
	}

	/**
	 * Updates an existing recipe in the database.
	 *
	 * @param recipe - The recipe with updated fields. The `id` field identifies the document.
	 */
	public async updateRecipe(recipe: Recipe): Promise<void> {
		const { id, ...payload } = recipe;
		await this.updateTableExistingFields(DATABASE_RECIPES, {
			entryKey: id,
			fields: { ...payload, steps: payload.steps.map((step) => ({ ...step, done: false })) },
			source: ACTIVITY_SOURCE_RECIPE,
			type: ACTIVITY_TYPE_UPDATED,
			name: recipe.name
		});
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
			/* Step 1: Fetch the current rate — must read before write so we can detect
			   a no-op (same rate) and compute the delta for the search stream log. */
			// Use .where() so the query satisfies the "doc._openid == auth.uid" security rule.
			const movieRef = this.database
				.collection(DATABASE_MOVIES)
				.where(this.buildWhereClause(movieItemVO.getMovieKey()));
			const movieData = await movieRef.get();
			const oldRate = movieData.data?.[0]?.rate;
			if (oldRate === undefined)
				throw new Error(`Movie document not found for key ${movieItemVO.getMovieKey()}`);

			if (oldRate !== movieItemVO.getMovieRate()) {
				// Step 2: Persist the new rate only when it has actually changed
				const result = await movieRef.update({
					rate: movieItemVO.getMovieRate()
				});

				/* CloudBase returns a non-empty result.code when the operation failed
				   (e.g. permission denied, document not found). */
				this.throwIfCloudbaseError(result);

				// Step 3: Record the change in the activity log and push a diff message to the search stream
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
			LOG.error(this.className, DB_LOG_MOVIE_RATE_UPDATE_FAILED, error as Error);
			this.rethrowCaught(error);
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
			this.throwIfCloudbaseError(movieRes);
			LOG.info(this.className, DB_LOG_MOVIE_GENRE_UPDATED);

			// Step 2 : Update movie statistics
			const statRes = await this.statisticsRef.update({
				[`genre.${oldGenre}`]: this._.inc(-1),
				[`genre.${newGenre}`]: this._.inc(1)
			});
			this.throwIfCloudbaseError(statRes);
			LOG.info(this.className, DB_LOG_MOVIE_STATS_UPDATED);

			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_MOVIE,
				type: ACTIVITY_TYPE_GENRE_UPDATED,
				title
			}).catch(() => {});
		} catch (error) {
			LOG.error(this.className, DB_LOG_MOVIE_GENRE_UPDATE_FAILED, error as Error);
			this.rethrowCaught(error);
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
			this.throwIfCloudbaseError(movieRes);
			LOG.info(this.className, DB_LOG_MOVIE_FAVOURITE_UPDATED);

			// Step 2 : Update movie statistics
			const updatedData: any = {};
			if (isFavourite) {
				updatedData[`genre.${GENRE_FAVOURITE}`] = this._.inc(1);
			} else {
				updatedData[`genre.${GENRE_FAVOURITE}`] = this._.inc(-1);
			}
			const statRes = await this.statisticsRef.update(updatedData);
			this.throwIfCloudbaseError(statRes);
			LOG.info(this.className, DB_LOG_MOVIE_STATS_UPDATED);

			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_MOVIE,
				type: ACTIVITY_TYPE_FAVOURITE_UPDATED,
				title
			}).catch(() => {});
		} catch (error) {
			LOG.error(this.className, DB_LOG_MOVIE_FAVOURITE_UPDATE_FAILED, error as Error);
			this.rethrowCaught(error);
		}
	}

	/**
	 * Updates a single field value in the reminder table and records the change in the activity log.
	 *
	 * @param entryKey - The key of the entry to update.
	 * @param valueKey - The field name to update.
	 * @param value - The new value to store.
	 * @param text - The reminder text, recorded in the activity log.
	 * @param isShared - Whether the reminder is shared, so its activity routes to the group feed.
	 */
	public async updateReminderTable(
		entryKey: string,
		valueKey: string,
		value: any,
		text: string,
		isShared: boolean
	): Promise<void> {
		await this.updateTableExistingFields(DATABASE_REMINDER, {
			entryKey,
			fields: { [valueKey]: value },
			source: ACTIVITY_SOURCE_REMINDER,
			type: ACTIVITY_TYPE_UPDATED,
			text,
			isShared,
			// Records which field changed so the shared feed can say "who changed the date of what".
			element: valueKey
		});

		// Editing a shared item must reach connections, who can't watch it live — signal them to re-fetch.
		if (isShared) this.notifySharedChange();
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
		await this.updateTableExistingFields(DATABASE_DEBT_SONATA, {
			entryKey,
			fields: { [valueKey]: value },
			source: ACTIVITY_SOURCE_DEBT,
			type,
			name
		});
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
		await this.updateTableExistingFields(DATABASE_DEBT_SONATA, {
			entryKey,
			fields,
			// Include the activity values only when a name is supplied so no entry is logged otherwise.
			...(name !== undefined ? { source: ACTIVITY_SOURCE_DEBT, type: ACTIVITY_TYPE_UPDATED, name } : {})
		});
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
		await this.updateTableExistingFields(DATABASE_DEBT_SONATA, {
			entryKey,
			fields: {
				[DEBT_VALUE_KEY_DEBT]: originalAmount,
				[DEBT_VALUE_KEY_PAID]: paid,
				[DEBT_VALUE_KEY_PAYMENTS]: this._.remove()
			},
			source: ACTIVITY_SOURCE_DEBT,
			type: ACTIVITY_TYPE_RESET,
			name
		});
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
		await this.updateTableExistingFields(DATABASE_PATCH_NOTES, {
			entryKey: key,
			fields: { ...updatedRecord },
			source: ACTIVITY_SOURCE_PATCH,
			type: activityType,
			component,
			element,
			noteIndex
		});
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
			this.throwIfCloudbaseError(result);
		} catch (error) {
			LOG.error(this.className, DB_LOG_STATS_UPDATE_FAILED, error as Error);
		}
	}

	/**
	 * Updates specific fields in the current user's per-user stats document in the users collection.
	 * Targets the document matched by {@link getUserStatsFilter} (owned by the current user).
	 *
	 * @param fields - Fields to merge into the per-user stats document.
	 * @returns A promise that resolves when the update completes.
	 */
	public async updateUserStatsFields(fields: Record<string, any>): Promise<void> {
		const result = await this.database
			.collection(DATABASE_USERS)
			.where(this.getUserStatsFilter())
			.update(fields);
		this.throwIfCloudbaseError(result);
	}

	/**
	 * Updates the given fields on a single table record in one round-trip, then records the supplied
	 * activity entry. Mirrors {@link addNewRecordToDB} and {@link removeRecordFromDB} — the document
	 * key, the fields to write, and the activity payload are all passed as one record descriptor, so
	 * callers no longer record activity themselves.
	 *
	 * {@link updateUsefulLink} - Updates link fields in the useful-links collection.
	 * {@link updateLinkCategory} - Updates category fields in the useful-links collection.
	 * {@link updateRecipe} - Updates recipe fields in the recipes collection.
	 * {@link updateReminderTable} - Updates a single field in the reminder collection.
	 * {@link updateSingleValueForDebtTable} - Updates a single field in the debt collection.
	 * {@link updateDebtFields} - Updates multiple fields in the debt collection.
	 * {@link resetDebtRecord} - Resets debt amount and removes payment history.
	 * {@link updateOnePatchNote} - Updates a patch note record.
	 * {@link removeSingleHistoryFromDebt} - Uses the CloudBase remove command via an update call.
	 *
	 * @param tableName - The database collection name.
	 * @param newRecord - The update descriptor: the document key (entryKey), the fields to write
	 *   (fields), and the activity values to record (source, type, and subtitle) as flat sibling
	 *   properties. When no activity property is supplied, no entry is logged.
	 */
	private async updateTableExistingFields(tableName: string, newRecord: any): Promise<void> {
		const { entryKey, fields, ...activity } = newRecord;
		try {
			const result = await this.database
				.collection(tableName)
				.where(this.buildWhereClause(entryKey))
				.update(fields);
			if (result.updated === 0) throw new Error(ERROR_NO_DOCUMENT_UPDATED);
			else this.throwIfCloudbaseError(result);
			LOG.info(this.className, `${DB_LOG_RECORD_TABLE_UPDATED} ${tableName}`);
			if (Object.keys(activity).length > 0) {
				this.appendToActivityLog(activity).catch(() => {});
			}
		} catch (error) {
			LOG.error(this.className, `${DB_LOG_TABLE_UPDATE_FAILED} ${tableName}`, error as Error);
			this.rethrowCaught(error);
		}
	}

	// ── Removal methods ──────────────────────────────────────────────────────

	/**
	 * Removes a useful link from the database and records the deletion in the activity log.
	 *
	 * @param key - The document key of the link to remove.
	 * @param domain - The hostname of the removed link, recorded in the activity log.
	 * @param ownerOpenid - The _openid of the link's owner, so only the owner's counter is decremented.
	 */
	public async removeUsefulLink(key: string, domain: string, ownerOpenid: string): Promise<void> {
		await this.removeRecordFromDB(DATABASE_USEFUL_LINKS, {
			entryKey: key,
			type: HISTORY_STATUS_DELETED,
			domain
		});
		this.decrementOwnStatCount(STATS_FIELD_TOTAL_LINKS, ownerOpenid);
	}

	/**
	 * Removes a link category from the database and records the deletion in the activity log.
	 *
	 * @param key - The document key of the category to remove.
	 * @param name - The category name, recorded in the activity log.
	 */
	public async removeLinkCategory(key: string, name: string): Promise<void> {
		try {
			/* Delete via the ownership where-clause, like every other removal. A bare doc(key).remove()
			   sends only { _id }, which fails CloudBase's security-rule subset check (the delete rule
			   requires _openid == auth.uid) and is denied. Categories are always read back scoped to the
			   user's _openid (see getLinkCategories), so this clause always matches the row being deleted. */
			const result = await this.database
				.collection(DATABASE_USEFUL_LINKS)
				.where(this.buildWhereClause(key))
				.remove();
			this.throwIfCloudbaseError(result);
			LOG.info(this.className, `${DB_LOG_RECORD_REMOVED_FROM} ${DATABASE_USEFUL_LINKS}`);
			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_LINK,
				domain: name,
				type: ACTIVITY_TYPE_CATEGORY_DELETED
			}).catch(() => {});
		} catch (error) {
			LOG.error(
				this.className,
				`Error while removing a record from ${DATABASE_USEFUL_LINKS}`,
				error as Error
			);
			this.rethrowCaught(error);
		}
	}

	/**
	 * Removes a quote from the database and updates statistics.
	 *
	 * @param entryKey - The document key of the quote to remove.
	 * @param author - The author of the deleted quote (used for the activity log).
	 * @param ownerOpenid - The _openid of the quote's owner, so only the owner's counter is decremented.
	 */
	public async removeQuote(entryKey: string, author: string, ownerOpenid: string): Promise<void> {
		this.removeRecordFromDB(DATABASE_QUOTES, { entryKey, author });

		await this.statisticsRef.update({ [STATS_FIELD_TOTAL_QUOTES]: this._.inc(-1) });
		this.decrementOwnStatCount(STATS_FIELD_TOTAL_QUOTES, ownerOpenid);
	}

	/**
	 * Removes a recipe from the database, decrements the total recipe count in statistics,
	 * and records the deletion in the activity log.
	 *
	 * @param recipeKey - The database key of the recipe to delete.
	 * @param name - The recipe name, recorded in the activity log.
	 * @param ownerOpenid - The _openid of the recipe's owner, so only the owner's counter is decremented.
	 */
	public async removeRecipe(recipeKey: string, name: string, ownerOpenid: string): Promise<void> {
		this.removeRecordFromDB(DATABASE_RECIPES, { entryKey: recipeKey, name });

		// Fire-and-forget: keep totalRecipes in sync so the home stat chip updates in realtime.
		this.statisticsRef.update({ [STATS_FIELD_TOTAL_RECIPES]: this._.inc(-1) }).catch(() => {});
		this.decrementOwnStatCount(STATS_FIELD_TOTAL_RECIPES, ownerOpenid);
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
			this.throwIfCloudbaseError(removeRes);

			LOG.info(this.className, `${DB_LOG_MOVIE_DOC_REMOVED} ${movieItemVO.getMovieName()}`);

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
				LOG.info(this.className, `${DB_LOG_COVER_REMOVED} ${movieItemVO.getMovieName()}`);
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
			this.throwIfCloudbaseError(statRes);

			// Append to activity log so multiple deletes are all visible in Recent Activity
			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_MOVIE,
				type: HISTORY_STATUS_DELETED,
				title: movieItemVO.getMovieName()
			}).catch(() => {});
			this.decrementOwnStatCount(STATS_FIELD_TOTAL_FILMS, movieItemVO.getOpenId());

			LOG.info(this.className, `${DB_LOG_STATS_AFTER_REMOVE} ${movieItemVO.getMovieName()}`);
		} catch (error) {
			LOG.error(
				this.className,
				`Error while removing movie ${movieItemVO.getMovieName()}`,
				error as Error
			);
			this.rethrowCaught(error);
		}
	}

	/**
	 * Removes a record from the reminder table and records the deletion in the activity log.
	 *
	 * @param key - The document key of the record to remove.
	 * @param text - The reminder text, recorded in the activity log.
	 * @param isShared - Whether the reminder is shared, so its deletion routes to the group feed.
	 * @param ownerOpenid - The _openid of the reminder's owner, so only the owner's counter is decremented.
	 */
	public async removeRecordFromReminderTable(
		key: string,
		text: string,
		isShared: boolean,
		ownerOpenid: string
	): Promise<void> {
		await this.removeRecordFromDB(DATABASE_REMINDER, { entryKey: key, text, isShared });
		this.decrementOwnStatCount(STATS_FIELD_TOTAL_REMINDERS, ownerOpenid);

		// Deleting a shared item must reach connections, who can't watch it live — signal them to re-fetch.
		if (isShared) this.notifySharedChange();
	}

	/**
	 * Completes the current user's own (private) reminder: removes the document, logs the completion as
	 * a distinct 'completed' activity (not a deletion), decrements the total-reminders count, and bumps
	 * the monotonic private-completed counter. Shared reminders use {@link completeSharedReminder} instead.
	 *
	 * @param key - The document key of the reminder being completed.
	 * @param text - The reminder text, recorded in the activity log.
	 */
	public async completeReminder(key: string, text: string): Promise<void> {
		await this.removeRecordFromDB(DATABASE_REMINDER, {
			entryKey: key,
			text,
			type: HISTORY_STATUS_COMPLETED
		});
		this.updateUserStatCount(STATS_FIELD_TOTAL_REMINDERS, -1).catch(() => {});
		this.updateUserStatCount(STATS_FIELD_COMPLETED_PRIVATE, 1).catch(() => {});
	}

	/**
	 * Removes a record from the debt table and records the deletion in the activity log.
	 *
	 * @param key - The document key of the record to remove.
	 * @param name - The debt entry name, recorded in the activity log.
	 * @param ownerOpenid - The _openid of the debt's owner, so only the owner's counter is decremented.
	 */
	public async removeRecordFromDebtTable(key: string, name: string, ownerOpenid: string): Promise<void> {
		await this.removeRecordFromDB(DATABASE_DEBT_SONATA, { entryKey: key, name });
		this.decrementOwnStatCount(STATS_FIELD_TOTAL_DEBTS, ownerOpenid);
	}

	/**
	 * Removes a link (edge) from the vault collection.
	 *
	 * @param key - The document key of the edge to remove.
	 */
	public async removeVaultEdge(key: string): Promise<void> {
		try {
			const result = await this.database
				.collection(DATABASE_VAULT)
				.where(this.buildWhereClause(key))
				.remove();
			this.throwIfCloudbaseError(result);
			LOG.info(this.className, `${DB_LOG_RECORD_REMOVED_FROM} ${DATABASE_VAULT}`);
		} catch (error) {
			LOG.error(this.className, `${DB_LOG_RECORD_REMOVE_FAILED} ${DATABASE_VAULT}`, error as Error);
			this.rethrowCaught(error);
		}
	}

	/**
	 * Removes a vault node and every edge connected to it, then records the removal
	 * in the activity log. Edges are cleaned up first so none is ever left pointing
	 * at a deleted node.
	 *
	 * @param nodeId - The document key of the node to remove.
	 * @param connectedEdgeIds - The document keys of every edge attached to this node.
	 * @param name - The node's display name, recorded in the activity log.
	 */
	public async removeVaultNode(nodeId: string, connectedEdgeIds: string[], name: string): Promise<void> {
		try {
			await Promise.all(connectedEdgeIds.map((edgeId) => this.removeVaultEdge(edgeId)));
			const result = await this.database
				.collection(DATABASE_VAULT)
				.where(this.buildWhereClause(nodeId))
				.remove();
			this.throwIfCloudbaseError(result);
			LOG.info(this.className, `${DB_LOG_RECORD_REMOVED_FROM} ${DATABASE_VAULT}`);
			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_VAULT,
				name,
				type: HISTORY_STATUS_DELETED
			}).catch(() => {});
		} catch (error) {
			LOG.error(this.className, `${DB_LOG_RECORD_REMOVE_FAILED} ${DATABASE_VAULT}`, error as Error);
			this.rethrowCaught(error);
		}
	}

	/**
	 * This is done by updating the data in DB.
	 *
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
		await this.updateTableExistingFields(DATABASE_DEBT_SONATA, {
			entryKey,
			fields: {
				[`${DEBT_VALUE_KEY_PAYMENTS}.${index}`]: this._.remove(),
				[DEBT_VALUE_KEY_DEBT]: updatedDebt
			},
			source: ACTIVITY_SOURCE_DEBT,
			type: ACTIVITY_TYPE_PAYMENT_REMOVED,
			name
		});
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
	 * {@link removeQuote} - Removes a quote from the quotes collection.
	 * {@link removeRecipe} - Removes a recipe from the recipes collection.
	 * {@link removeRecordFromReminderTable} - Removes a record from the reminder collection.
	 * {@link removeRecordFromDebtTable} - Removes a record from the debt collection.
	 * {@link removePatchNote} - Removes a patch note from the patch notes collection.
	 *
	 * @param tableName - The database collection name.
	 * @param newRecord - The record descriptor identifying which document to remove and how to log it.
	 */
	private async removeRecordFromDB(tableName: string, newRecord: any): Promise<void> {
		try {
			const result = await this.database
				.collection(tableName)
				.where(this.buildWhereClause(newRecord.entryKey))
				.remove();
			this.throwIfCloudbaseError(result);
			LOG.info(this.className, `${DB_LOG_RECORD_REMOVED_FROM} ${tableName}`);
			this.appendToActivityLog({
				...this.getRecentActivitySubtitle(tableName, newRecord),
				type: newRecord.type ?? HISTORY_STATUS_DELETED,
				// Carry the shared flag so reminder deletions route to the group feed (ignored elsewhere).
				...(newRecord.isShared ? { isShared: true } : {})
			}).catch(() => {});
		} catch (error) {
			LOG.error(this.className, `${DB_LOG_RECORD_REMOVE_FAILED} ${tableName}`, error as Error);
			this.rethrowCaught(error);
		}
	}

	/**
	 * Gets whether Tauri desktop notifications are enabled for the current user
	 * by reading the flag from the per-user statistics document.
	 *
	 * @returns True when the Tauri notification flag is set on the user's stats document.
	 */
	public async getTauriNotifEnabled(): Promise<boolean> {
		try {
			return (await this.readUserStatField(STATS_FIELD_TAURI_NOTIF_ENABLED)) === true;
		} catch (error: unknown) {
			LOG.error(this.className, DB_LOG_TAURI_PREF_FAILED, error as Error);
			return false;
		}
	}

	/**
	 * Persists the Tauri desktop notification preference for the current user
	 * by updating the flag on the per-user statistics document.
	 *
	 * @param enabled - The desired enabled state.
	 */
	public async setTauriNotifEnabled(enabled: boolean): Promise<void> {
		await this.updateUserStatsFields({ [STATS_FIELD_TAURI_NOTIF_ENABLED]: enabled });
	}

	/**
	 * Gets whether the desktop app minimizes to Dock on close for the current user.
	 *
	 * @returns True when the minimize-on-close flag is set on the user's stats document.
	 */
	public async getMinimizeOnClose(): Promise<boolean> {
		try {
			return (await this.readUserStatField(STATS_FIELD_MINIMIZE_ON_CLOSE)) === true;
		} catch (error: unknown) {
			LOG.error(this.className, DB_LOG_MINIMIZE_PREF_FAILED, error as Error);
			return true;
		}
	}

	/**
	 * Persists the minimize-on-close preference for the current user
	 * by updating the flag on the per-user statistics document.
	 *
	 * @param enabled - The desired enabled state.
	 */
	public async setMinimizeOnClose(enabled: boolean): Promise<void> {
		await this.updateUserStatsFields({ [STATS_FIELD_MINIMIZE_ON_CLOSE]: enabled });
	}

	/**
	 * Gets the display locale preference for the current user from the per-user stats document.
	 *
	 * @returns The stored locale ('en' or 'zh'), or null when not yet set.
	 */
	public async getLocale(): Promise<'en' | 'zh' | null> {
		try {
			const value = await this.readUserStatField(STATS_FIELD_LOCALE);
			return value === LOCALE_KEY_EN || value === LOCALE_KEY_ZH ? value : null;
		} catch (error: unknown) {
			LOG.error(this.className, DB_LOG_LOCALE_PREF_FAILED, error as Error);
			return null;
		}
	}

	/**
	 * Persists the display locale preference for the current user
	 * by updating the field on the per-user statistics document.
	 *
	 * @param locale - The locale key to store: 'en' or 'zh'.
	 */
	public async setLocale(locale: 'en' | 'zh'): Promise<void> {
		await this.updateUserStatsFields({ [STATS_FIELD_LOCALE]: locale });
	}

	/**
	 * Gets the backed-up Today page items for the current user from the per-user stats document.
	 *
	 * @returns The stored Today items, or an empty array when none are backed up or the read fails.
	 */
	public async getTodayItems(): Promise<TodayTask[]> {
		try {
			const value = await this.readUserStatField(STATS_FIELD_TODAY_ITEMS);
			return Array.isArray(value) ? (value as TodayTask[]) : [];
		} catch (error: unknown) {
			LOG.error(this.className, DB_LOG_TODAY_ITEMS_FAILED, error as Error);
			return [];
		}
	}

	/**
	 * Persists the full set of locally created Today items for the current user
	 * by replacing the backup field on the per-user stats document.
	 *
	 * @param items - The complete list of Today items to store; an empty array clears the backup.
	 */
	public async saveTodayItems(items: TodayTask[]): Promise<void> {
		await this.updateUserStatsFields({ [STATS_FIELD_TODAY_ITEMS]: items });
	}

	/**
	 * Reads a single field value from the current user's stats document in the users collection.
	 *
	 * {@link getTauriNotifEnabled} - Reads the Tauri notification flag.
	 * {@link getMinimizeOnClose} - Reads the minimize-on-close flag.
	 * {@link getLocale} - Reads the display locale preference.
	 * {@link getTodayItems} - Reads the Today page items backup.
	 *
	 * @param field - The field name to read from the stats document.
	 * @returns The field value, or undefined when the document or field does not exist.
	 */
	private async readUserStatField(field: string): Promise<unknown> {
		const result = await this.database
			.collection(DATABASE_USERS)
			.where(this.getUserStatsFilter())
			.limit(1)
			.get();
		return result.data?.[0]?.[field];
	}

	// ── Add methods ──────────────────────────────────────────────────────────

	/**
	 * Adds a new useful link to the database.
	 * CloudBase always auto-stamps `_openid` from the caller's identity — it cannot be
	 * omitted client-side. Shared links are instead flagged with `isShared: true`, which
	 * the portal reads to classify links into the Shared and Private sections regardless
	 * of who created them. Shared links never carry a `category`, since categories are a
	 * personal-organization concept that does not apply once a link is shared.
	 *
	 * @param link - The link object to add. `isShared` is persisted as a top-level flag.
	 */
	public async addUsefulLink(link: any): Promise<void> {
		this.updateUserStatCount(STATS_FIELD_TOTAL_LINKS, 1)
			.then(() => this.checkAndWriteDomainMilestone(STATS_FIELD_TOTAL_LINKS, MILESTONE_DOMAIN_LINK))
			.catch(() => {});
		const { isShared, category, ...linkData } = link;
		return this.addNewRecordToDB(DATABASE_USEFUL_LINKS, {
			type: USEFUL_LINK_TYPE_LINK,
			...linkData,
			...(isShared ? { isShared: true } : { category })
		});
	}

	/**
	 * Adds a new link category to the database.
	 *
	 * @param category - The category object to add.
	 */
	public async addLinkCategory(category: { name: string; order: number }): Promise<void> {
		return this.addNewRecordToDB(DATABASE_USEFUL_LINKS, {
			_openid: CloudbaseService.getUserId(),
			type: USEFUL_LINK_TYPE_CATEGORY,
			...category
		});
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
			this.throwIfCloudbaseError(addMovieRes);

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
			this.throwIfCloudbaseError(statRes);

			// Append to activity log so multiple adds are all visible in Recent Activity
			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_MOVIE,
				type: HISTORY_STATUS_ADDED,
				title: movieItemVO.getMovieName()
			}).catch(() => {});
			this.updateUserStatCount(STATS_FIELD_TOTAL_FILMS, 1)
				.then(() => this.checkAndWriteDomainMilestone(STATS_FIELD_TOTAL_FILMS, MILESTONE_DOMAIN_FILM))
				.catch(() => {});

			LOG.info(this.className, DB_LOG_MOVIE_ADDED);
		} catch (error) {
			LOG.error(
				this.className,
				`Error while adding new movie data for ${movieItemVO.getMovieName()}`,
				error as Error
			);
			this.rethrowCaught(error);
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
				// Step 1 (movie path): Write the history doc with full movie metadata
				const result = await this.database.collection(DATABASE_HISTORY).add({
					...userId,
					id: movieItemVO.getMovieId(),
					status: status,
					message: this.buildHistoryMessage(status, timestamp, movieItemVO)
				});
				/* CloudBase returns a non-empty result.code when the operation failed
				   (e.g. permission denied, document not found). */
				this.throwIfCloudbaseError(result);
				/* lastAdded / lastDeleted are updated together with genre/totalFilms
				   in the calling function (single statisticsRef.update call) to avoid
				   triggering the CloudBase watcher twice per operation. */
			} else {
				// Step 1 (search path): Write a lightweight history doc with no movie metadata
				const result = await this.database.collection(DATABASE_HISTORY).add({
					...userId,
					status: status,
					message: this.buildHistoryMessage(status, timestamp)
				});
				/* CloudBase returns a non-empty result.code when the operation failed
				   (e.g. permission denied, document not found). */
				this.throwIfCloudbaseError(result);

				// Step 2 (search path): Also append a search activity entry — callers for movie adds/removes do this themselves
				this.appendToActivityLog({
					source: ACTIVITY_SOURCE_MOVIE,
					type: SEARCH
				}).catch(() => {});
			}
			LOG.info(this.className, DB_LOG_HISTORY_ADDED);
		} catch (error) {
			LOG.error(this.className, DB_LOG_HISTORY_ADD_FAILED, error as Error);
			this.rethrowCaught(error);
		}
	}

	/**
	 * Adds a new record to the reminder collection.
	 *
	 * @param newRecord - The new record to add.
	 */
	public async addNewRecordToReminder(newRecord: any): Promise<void> {
		this.updateUserStatCount(STATS_FIELD_TOTAL_REMINDERS, 1)
			.then(() =>
				this.checkAndWriteDomainMilestone(STATS_FIELD_TOTAL_REMINDERS, MILESTONE_DOMAIN_REMINDER)
			)
			.catch(() => {});
		await this.addNewRecordToDB(DATABASE_REMINDER, newRecord);

		// A shared item must reach connections, who can't watch it live — signal them to re-fetch.
		if (newRecord[REMINDER_VALUE_KEY_SHARED]) this.notifySharedChange();
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
	 * Adds a new node (account, email, or phone) to the vault collection.
	 *
	 * @param node - The node content to persist.
	 * @returns The database id of the newly created node document.
	 */
	public async addVaultNode(node: {
		nodeType: VaultNodeType;
		name: string;
		categories: string[];
		verified: boolean;
	}): Promise<string> {
		const nodeId = await this.addVaultRecord({
			[VAULT_VALUE_KEY_KIND]: VAULT_KIND_NODE,
			[VAULT_VALUE_KEY_NODE_TYPE]: node.nodeType,
			[VAULT_VALUE_KEY_NAME]: node.name,
			[VAULT_VALUE_KEY_CATEGORIES]: node.categories,
			[VAULT_VALUE_KEY_VERIFIED]: node.verified
		});
		this.appendToActivityLog({
			source: ACTIVITY_SOURCE_VAULT,
			name: node.name,
			type: HISTORY_STATUS_ADDED
		}).catch(() => {});
		return nodeId;
	}

	/**
	 * Adds a new link between two vault nodes.
	 *
	 * @param edge - The edge content to persist.
	 */
	public async addVaultEdge(edge: { sourceId: string; targetId: string; relation: string }): Promise<void> {
		await this.addVaultRecord({
			[VAULT_VALUE_KEY_KIND]: VAULT_KIND_EDGE,
			[VAULT_VALUE_KEY_SOURCE_ID]: edge.sourceId,
			[VAULT_VALUE_KEY_TARGET_ID]: edge.targetId,
			[VAULT_VALUE_KEY_RELATION]: edge.relation
		});
	}

	/**
	 * Adds a new custom account category to the vault collection.
	 *
	 * @param category - The category content to persist.
	 * @returns The database id of the newly created category document.
	 */
	public async addVaultCategory(category: {
		label: string;
		hex: string;
		gradient: string;
	}): Promise<string> {
		return this.addVaultRecord({
			[VAULT_VALUE_KEY_KIND]: VAULT_KIND_CATEGORY,
			[VAULT_VALUE_KEY_LABEL]: category.label,
			[VAULT_VALUE_KEY_HEX]: category.hex,
			[VAULT_VALUE_KEY_GRADIENT]: category.gradient
		});
	}

	/**
	 * Removes a custom account category and pulls its key from every account that carried it.
	 * Each affected account's new category list is written by _id (the safe owner-scoped write path)
	 * before the category record itself is removed, so no account is left pointing at a category
	 * that no longer exists.
	 *
	 * @param categoryKey - The document id of the category to remove.
	 * @param accountUpdates - The affected accounts, each with its category list already stripped of the removed key.
	 * @returns A promise that resolves when the category is removed and its accounts updated.
	 */
	public async removeVaultCategory(
		categoryKey: string,
		accountUpdates: { id: string; categories: string[] }[]
	): Promise<void> {
		try {
			await Promise.all(
				accountUpdates.map((account) =>
					this.database
						.collection(DATABASE_VAULT)
						.where(this.buildWhereClause(account.id))
						.update({ [VAULT_VALUE_KEY_CATEGORIES]: account.categories })
				)
			);
			const result = await this.database
				.collection(DATABASE_VAULT)
				.where(this.buildWhereClause(categoryKey))
				.remove();
			this.throwIfCloudbaseError(result);
			LOG.info(this.className, `${DB_LOG_RECORD_REMOVED_FROM} ${DATABASE_VAULT}`);
		} catch (error) {
			LOG.error(this.className, `${DB_LOG_RECORD_REMOVE_FAILED} ${DATABASE_VAULT}`, error as Error);
			this.rethrowCaught(error);
		}
	}

	/**
	 * Replaces an account node's category list with the given keys. Writes by _id (the owner-scoped
	 * path), used to re-categorize an account from the inline picker.
	 *
	 * @param nodeId - The id of the account node to update.
	 * @param categoryKeys - The full list of category keys to store on the account.
	 * @returns A promise that resolves when the account's categories are updated.
	 */
	public async updateVaultNodeCategories(nodeId: string, categoryKeys: string[]): Promise<void> {
		await this.updateOneVaultRecord(nodeId, { [VAULT_VALUE_KEY_CATEGORIES]: categoryKeys });
	}

	/**
	 * Sets an account node's verified flag. Writes by _id (the owner-scoped path), used by the inline
	 * verified toggle in the list view.
	 *
	 * @param nodeId - The id of the account node to update.
	 * @param verified - The new verified state to store on the account.
	 * @returns A promise that resolves when the account's verified flag is updated.
	 */
	public async updateVaultNodeVerified(nodeId: string, verified: boolean): Promise<void> {
		await this.updateOneVaultRecord(nodeId, { [VAULT_VALUE_KEY_VERIFIED]: verified });
	}

	/**
	 * Sets an account node's display name. Writes by _id (the owner-scoped path), used by the inline
	 * name edit in the list view.
	 *
	 * @param nodeId - The id of the account node to update.
	 * @param name - The new display name to store on the account.
	 * @returns A promise that resolves when the account's name is updated.
	 */
	public async updateVaultNodeName(nodeId: string, name: string): Promise<void> {
		await this.updateOneVaultRecord(nodeId, { [VAULT_VALUE_KEY_NAME]: name });
	}

	/**
	 * Renames a custom account category by updating its stored label. Writes by _id (the owner-scoped
	 * path), used by the vault category edit dialog.
	 *
	 * @param categoryKey - The document id of the category to rename.
	 * @param label - The new category label.
	 * @returns A promise that resolves when the category label is updated.
	 */
	public async updateVaultCategoryLabel(categoryKey: string, label: string): Promise<void> {
		await this.updateOneVaultRecord(categoryKey, { [VAULT_VALUE_KEY_LABEL]: label });
	}

	/**
	 * Writes the given fields to a single vault document by _id (the owner-scoped write path). Shared by
	 * the vault field-update methods, which differ only in which field they set.
	 *
	 * {@link updateVaultNodeCategories} - Replaces an account's category list.
	 * {@link updateVaultNodeVerified} - Sets an account's verified flag.
	 * {@link updateVaultNodeName} - Sets an account's display name.
	 * {@link updateVaultCategoryLabel} - Renames a custom category.
	 *
	 * @param recordId - The document id of the vault record to update.
	 * @param fields - The content fields to overwrite on the record.
	 * @returns A promise that resolves when the record is updated.
	 */
	private async updateOneVaultRecord(recordId: string, fields: Record<string, unknown>): Promise<void> {
		try {
			const result = await this.database
				.collection(DATABASE_VAULT)
				.where(this.buildWhereClause(recordId))
				.update(fields);
			this.throwIfCloudbaseError(result);
			LOG.info(this.className, `${DB_LOG_RECORD_TABLE_UPDATED} ${DATABASE_VAULT}`);
		} catch (error) {
			LOG.error(this.className, `${DB_LOG_TABLE_UPDATE_FAILED} ${DATABASE_VAULT}`, error as Error);
			this.rethrowCaught(error);
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
			/* Step 1: Inject _openid only for admin users — non-admin users let CloudBase set it
			   automatically from auth context. Manually overriding for admins allows inserting
			   records on behalf of another user without breaking ownership queries. */
			const userId = CloudbaseService.userHasAllRights() ? { _openid: CloudbaseService.userId } : {};
			const result = await this.database.collection(tableName).add({
				...userId,
				...newRecord
			});
			this.throwIfCloudbaseError(result);
			LOG.info(this.className, `${tableName} ${DB_LOG_HAS_BEEN_UPDATED}`);

			/* Step 2: Derive the correct activity type before enqueueing the log entry.
			   Links and categories share the same collection — detect a category add by checking
			   the type field, so the activity log gets the right discriminator instead of ADDED. */
			const isCategoryAdd =
				tableName === DATABASE_USEFUL_LINKS && newRecord.type !== USEFUL_LINK_TYPE_LINK;
			this.appendToActivityLog({
				...this.getRecentActivitySubtitle(tableName, newRecord),
				type: newRecord.isBug
					? ACTIVITY_TYPE_BUG_LOGGED
					: isCategoryAdd
						? ACTIVITY_TYPE_CATEGORY_ADDED
						: HISTORY_STATUS_ADDED,
				// Carry the shared flag so a new shared reminder routes to the group feed (ignored elsewhere).
				...(newRecord.isShared ? { isShared: true } : {})
			}).catch(() => {});
		} catch (error) {
			LOG.error(this.className, `${DB_LOG_RECORD_ADD_FAILED} ${tableName}`, error as Error);
			this.rethrowCaught(error);
		}
	}

	/**
	 * Adds a vault document and returns its new id. Injects _openid for admin users so they can
	 * manage another user's vault; non-admins let CloudBase set ownership from the auth context.
	 *
	 * {@link addVaultNode} - Adds an account / email / phone node.
	 * {@link addVaultEdge} - Adds a link between two nodes.
	 * {@link addVaultCategory} - Adds a custom category.
	 *
	 * @param content - The document content with its kind discriminator and value fields.
	 * @returns The database id of the newly created document.
	 */
	private async addVaultRecord(content: Record<string, unknown>): Promise<string> {
		try {
			const userId = CloudbaseService.userHasAllRights() ? { _openid: CloudbaseService.userId } : {};
			const result = await this.database.collection(DATABASE_VAULT).add({ ...userId, ...content });
			this.throwIfCloudbaseError(result);
			LOG.info(this.className, `${DATABASE_VAULT} ${DB_LOG_HAS_BEEN_UPDATED}`);
			return result.id;
		} catch (error) {
			LOG.error(this.className, `${DB_LOG_RECORD_ADD_FAILED} ${DATABASE_VAULT}`, error as Error);
			this.rethrowCaught(error);
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
	private getRecentActivitySubtitle(tableName: string, newRecord: unknown): Record<string, string> {
		switch (tableName) {
			case DATABASE_QUOTES:
				return {
					source: ACTIVITY_SOURCE_RESONANCE,
					author: String((newRecord as { author?: string }).author ?? '')
				};
			case DATABASE_DEBT_SONATA:
				return {
					source: ACTIVITY_SOURCE_DEBT,
					name: String((newRecord as { name?: string }).name ?? '')
				};
			case DATABASE_REMINDER:
				return {
					source: ACTIVITY_SOURCE_REMINDER,
					text: String((newRecord as { text?: string }).text ?? '')
				};
			case DATABASE_PATCH_NOTES:
				return {
					source: ACTIVITY_SOURCE_PATCH,
					component: String((newRecord as { component?: string }).component ?? ''),
					element: String((newRecord as { element?: string }).element ?? ''),
					noteIndex: String((newRecord as { noteIndex?: string }).noteIndex ?? '')
				};
			case DATABASE_USEFUL_LINKS: {
				/* Links and categories share the same collection; the `type` field distinguishes
				   them at write time — links carry a URL, categories carry a name, deletions carry
				   the previous domain string from the history document. */
				const rec = newRecord as { type?: string; url?: string; name?: string; domain?: string };
				if (rec.type === USEFUL_LINK_TYPE_LINK)
					return {
						source: ACTIVITY_SOURCE_LINK,
						domain: Utilities.getDomain(String(rec.url ?? ''))
					};
				else if (rec.type === USEFUL_LINK_TYPE_CATEGORY)
					return { source: ACTIVITY_SOURCE_LINK, domain: String(rec.name ?? '') };
				else if (rec.type === HISTORY_STATUS_DELETED || rec.type === ACTIVITY_TYPE_CATEGORY_DELETED)
					return { source: ACTIVITY_SOURCE_LINK, domain: String(rec.domain ?? '') };
				else return { source: ACTIVITY_SOURCE_DEFAULT, text: ACTIVITY_INVALID_TABLE_TEXT };
			}
			case DATABASE_RECIPES:
				return {
					source: ACTIVITY_SOURCE_RECIPE,
					name: String((newRecord as { name?: string }).name ?? '')
				};
			default:
				return { source: ACTIVITY_SOURCE_DEFAULT, text: ACTIVITY_INVALID_TABLE_TEXT };
		}
	}

	// ── Utility methods ───────────────────────────────────────────────────────

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
				.update({
					visitCount: currentCount + 1,
					lastVisited: Utilities.getCurrentFormattedTime(true)
				});
			this.throwIfCloudbaseError(result);
			LOG.info(this.className, DB_LOG_VISIT_INCREMENTED);
		} catch (error) {
			LOG.error(this.className, `${DB_LOG_VISIT_INCREMENT_FAILED} ${key}`, error as Error);
			this.rethrowCaught(error);
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
			/* Step 1: Convert the Blob to a raw base64 string.
			   The cloud function cannot receive a binary Blob over HTTP — base64 is the
			   only format that survives JSON serialisation without data loss. */
			const base64 = await this.blobToBase64(coverImage);

			// Step 2: Invoke the cloud function to upload the image to CloudBase Storage server-side
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

			LOG.info(this.className, `${DB_LOG_COVER_UPLOADED} ${movieName}`);

			// Step 3: Return the cloud:// file ID — callers resolve it to a signed temp URL via resolveMovieCoverUrls()
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
	 * Performs the actual read-then-write for a single activity log entry, and updates the
	 * persistent activity streak. The entry lives in exactly one array on the user's own document:
	 * mutations to a shared reminder go to sharedRecentActivity (aggregated into each connection's
	 * home feed); all other entries go to the user's personal activity. The streak always updates.
	 *
	 * {@link appendToActivityLog} - The queue wrapper that serializes all calls here.
	 *
	 * @param activity - The activity object to record.
	 */
	private async writeActivityLogEntry(activity: any): Promise<void> {
		const timestamp = Utilities.getCurrentFormattedTime(true);
		const entry = { ...activity, timestamp };
		const userStatsFilter = this.getUserStatsFilter();
		try {
			// Step 1: Fetch the per-user stats doc — both activity arrays and the streak live here.
			const userStatsRes = await this.database.collection(DATABASE_USERS).where(userStatsFilter).get();
			const userDoc = userStatsRes.data?.[0];

			/* Step 2: Compute the new streak value, regardless of where the entry is stored.
			   If the stored date is today, the streak is unchanged (multiple activities on the same day count once).
			   If it was yesterday, the streak extends. Otherwise a break is detected and the streak resets to 1. */
			const today = Utilities.formatDateForStorage(new Date());
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

			/* Step 3: Route the entry to a single array on the user's own document — the shared activity
			   feed when the mutated reminder is itself shared, otherwise personal activity. The shared
			   feed is aggregated into connections' home feeds by the getSharedActivity Cloud Function. */
			// Reminder is currently the only shared domain; extend this check if another is added.
			const field =
				entry.source === ACTIVITY_SOURCE_REMINDER && !!entry.isShared
					? STATS_FIELD_SHARED_RECENT_ACTIVITY
					: STATS_FIELD_RECENT_ACTIVITIES;
			const updated = Utilities.prependCapped(userDoc?.[field], entry, STATS_CAP_ACTIVITY_LOG);
			await this.updateUserStatsFields({
				[field]: updated,
				[STATS_FIELD_ACTIVITY_STREAK]: newStreak,
				[STATS_FIELD_ACTIVITY_STREAK_DATE]: today
			});
			this.checkAndWriteCountMilestone(MILESTONE_DOMAIN_STREAK, newStreak, userDoc).catch(() => {});
		} catch (error) {
			LOG.error(this.className, DB_LOG_ACTIVITY_UPDATE_FAILED, error as Error);
			this.rethrowCaught(error);
		}
	}

	/**
	 * Atomically increments or decrements a single counter field on the current user's
	 * stats document in the users collection. Errors are logged but not propagated —
	 * all callers treat stat updates as fire-and-forget.
	 *
	 * @param field - The field name constant to update (e.g. STATS_FIELD_TOTAL_FILMS).
	 * @param delta - The amount to change the counter — pass 1 to increment, -1 to decrement.
	 * @returns A promise that resolves when the update completes.
	 */
	public async updateUserStatCount(field: string, delta: 1 | -1): Promise<void> {
		const result = await this.database
			.collection(DATABASE_USERS)
			.where(this.getUserStatsFilter())
			.update({ [field]: this._.inc(delta) });
		if (result.code) {
			LOG.error(this.className, result.message ?? DB_LOG_USER_STAT_UPDATE_FAILED);
		}
	}

	/**
	 * Decrements the current user's own item total for a removed item, but only when the item belongs
	 * to them. When a permitted user (e.g. an admin) removes another user's item, this user's counter
	 * is left untouched — the owner's totals self-heal on their next account load via reconcileUserStats.
	 *
	 * {@link removeUsefulLink} - Decrements the owner's link total after a link is removed.
	 * {@link removeQuote} - Decrements the owner's quote total after a quote is removed.
	 * {@link removeRecipe} - Decrements the owner's recipe total after a recipe is removed.
	 * {@link removeMovieFromDatabase} - Decrements the owner's film total after a movie is removed.
	 * {@link removeRecordFromReminderTable} - Decrements the owner's reminder total after a reminder is removed.
	 * {@link removeRecordFromDebtTable} - Decrements the owner's debt total after a debt is removed.
	 *
	 * @param field - The stats field to decrement.
	 * @param ownerOpenid - The _openid of the removed item's owner.
	 */
	private decrementOwnStatCount(field: string, ownerOpenid: string): void {
		if (ownerOpenid !== CloudbaseService.getUserId()) return;
		this.updateUserStatCount(field, -1).catch(() => {});
	}

	/**
	 * Checks whether a per-user stats document exists in the users collection and provisions it
	 * if absent — migrating a legacy statistics document when one exists, otherwise seeding fresh.
	 * Uses a one-time `.get()` so the check is not watcher-dependent — safe to call on every
	 * page load because it exits immediately when the doc already exists.
	 *
	 * @returns A promise that resolves when the check (and optional migration or seed) completes.
	 */
	public async ensureUserStatsExist(): Promise<void> {
		const result = await this.database.collection(DATABASE_USERS).where(this.getUserStatsFilter()).get();
		const existing = result.data?.[0];
		if (existing) {
			// Backfill a connect code for documents created before the connect feature, so the live
			// stats stream always carries one (the account page reads connectCode from that stream).
			if (!existing[STATS_FIELD_CONNECT_CODE]) {
				await this.database
					.collection(DATABASE_USERS)
					.doc(CloudbaseService.getUserId())
					.update({
						[STATS_FIELD_CONNECT_CODE]: Utilities.randomCode(
							CONNECT_CODE_LENGTH,
							CONNECT_CODE_ALPHABET
						)
					})
					.catch(() => {});
			}
			return;
		}
		// No users doc yet — migrate a legacy statistics doc if one exists, otherwise seed fresh.
		const migrated = await this.migrateLegacyUserStats();
		if (!migrated) await this.seedUserStats();
	}

	/**
	 * Recomputes the current user's item totals from the authoritative per-collection counts and
	 * corrects any drifted stat field on the user's own document. Uses cheap server-side counts scoped
	 * to the user's _openid, so no documents are transferred. This is the self-heal that keeps a user's
	 * counters accurate even when a permitted user (e.g. an admin) removed one of their items: the
	 * remover never writes the owner's counter, so the owner's totals reconcile here on their next
	 * account-page load. Only the fields that differ are written.
	 *
	 * @returns A promise that resolves when any drifted totals have been corrected.
	 */
	public async reconcileUserStats(): Promise<void> {
		const filter = this.getUserStatsFilter();
		const [reminders, debts, films, quotes, recipes, links] = await Promise.all([
			this.countOwnedRecords(DATABASE_REMINDER, filter),
			this.countOwnedRecords(DATABASE_DEBT_SONATA, filter),
			this.countOwnedRecords(DATABASE_MOVIES, filter),
			this.countOwnedRecords(DATABASE_QUOTES, filter),
			this.countOwnedRecords(DATABASE_RECIPES, filter),
			// useful_links holds both links and categories — count only link-type rows toward totalLinks.
			this.countOwnedRecords(DATABASE_USEFUL_LINKS, { ...filter, type: USEFUL_LINK_TYPE_LINK })
		]);

		const statsResult = await this.database.collection(DATABASE_USERS).where(filter).get();
		const stats = statsResult.data?.[0];
		if (!stats) return;

		const actualCounts: Record<string, number> = {
			[STATS_FIELD_TOTAL_REMINDERS]: reminders,
			[STATS_FIELD_TOTAL_DEBTS]: debts,
			[STATS_FIELD_TOTAL_FILMS]: films,
			[STATS_FIELD_TOTAL_QUOTES]: quotes,
			[STATS_FIELD_TOTAL_RECIPES]: recipes,
			[STATS_FIELD_TOTAL_LINKS]: links
		};
		const corrections: Record<string, number> = {};
		for (const [field, count] of Object.entries(actualCounts)) {
			if (stats[field] !== count) corrections[field] = count;
		}
		if (Object.keys(corrections).length > 0) {
			await this.updateUserStatsFields(corrections);
		}
	}

	/**
	 * Gets the authoritative document count for a collection matching the given owner filter, using a
	 * server-side count so no documents are transferred.
	 *
	 * @param collection - The collection name to count within.
	 * @param filter - The where-clause selecting the owner's documents.
	 * @returns The matching document count.
	 */
	private async countOwnedRecords(collection: string, filter: Record<string, unknown>): Promise<number> {
		const result = await this.database.collection(collection).where(filter).count();
		return result.total ?? 0;
	}

	/**
	 * Copies a legacy per-user stats document from the statistics collection into the users
	 * collection, preserving recent activity, milestones, totals, and streak. The new document is
	 * keyed by `_id == _openid` to satisfy the users-collection security rule.
	 *
	 * {@link ensureUserStatsExist} - Calls this before falling back to a fresh seed.
	 *
	 * @returns A promise resolving to true when a legacy document was migrated, otherwise false.
	 */
	private async migrateLegacyUserStats(): Promise<boolean> {
		const userId = CloudbaseService.getUserId();
		const legacy = await this.database
			.collection(DATABASE_STATISTICS)
			.where({ _openid: userId, [STATS_FIELD_IS_USER_STATS]: true })
			.get();
		const doc = legacy.data?.[0];
		if (!doc) return false;

		// Strip CloudBase-managed _id and the legacy discriminator; the new doc is keyed by _id == _openid.
		const fields: Record<string, any> = { ...doc };
		delete fields['_id'];
		delete fields[STATS_FIELD_IS_USER_STATS];
		// Legacy docs predate the connect code — generate one so migrated users can be linked.
		const connectCode =
			fields[STATS_FIELD_CONNECT_CODE] ??
			Utilities.randomCode(CONNECT_CODE_LENGTH, CONNECT_CODE_ALPHABET);
		try {
			const result = await this.database
				.collection(DATABASE_USERS)
				.doc(userId)
				.set({ ...fields, _openid: userId, [STATS_FIELD_CONNECT_CODE]: connectCode });
			this.throwIfCloudbaseError(result);
			LOG.info(this.className, DB_LOG_USER_STATS_MIGRATED);
			return true;
		} catch (error) {
			LOG.error(this.className, DB_LOG_USER_STATS_MIGRATE_FAILED, error as Error);
			return false;
		}
	}

	/**
	 * Seeds the current user's per-user stats document in the users collection with live counts
	 * from each collection. Called by {@link ensureUserStatsExist} when no document exists and no
	 * legacy document is available to migrate. The document is keyed by `_id == _openid`.
	 *
	 * @returns A promise that resolves when the seed write completes.
	 */
	public async seedUserStats(): Promise<void> {
		// Step 1: Fetch live counts from all collections in parallel to avoid sequential round-trips
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

		/* Step 2: Build the seed payload.
		   Links are filtered to USEFUL_LINK_TYPE_LINK only (categories share the collection).
		   MILESTONE_KEY_ACCOUNT_CREATED is seeded with today so the account-creation milestone
		   is visible immediately without waiting for the first stat increment. */
		const payload = {
			_openid: userId,
			[STATS_FIELD_TOTAL_FILMS]: films.data?.length ?? 0,
			[STATS_FIELD_TOTAL_QUOTES]: quotes.data?.length ?? 0,
			[STATS_FIELD_TOTAL_RECIPES]: recipes.data?.length ?? 0,
			[STATS_FIELD_TOTAL_REMINDERS]: reminders.data?.length ?? 0,
			[STATS_FIELD_COMPLETED_PRIVATE]: 0,
			[STATS_FIELD_COMPLETED_SHARED]: 0,
			[STATS_FIELD_TOTAL_DEBTS]: debts.data?.length ?? 0,
			[STATS_FIELD_TOTAL_LINKS]: links.data?.length ?? 0,
			[STATS_FIELD_ACTIVITY_STREAK]: 0,
			[STATS_FIELD_ACTIVITY_STREAK_DATE]: '',
			[STATS_FIELD_CONNECT_CODE]: Utilities.randomCode(CONNECT_CODE_LENGTH, CONNECT_CODE_ALPHABET),
			[STATS_FIELD_MILESTONES]: {
				[MILESTONE_KEY_ACCOUNT_CREATED]: Utilities.formatDateForStorage(new Date())
			}
		};

		// Step 3: Write the document keyed by _id == _openid; fail loudly so the caller knows seeding did not complete
		try {
			const result = await this.database.collection(DATABASE_USERS).doc(userId).set(payload);
			this.throwIfCloudbaseError(result);
			LOG.info(this.className, DB_LOG_USER_STATS_SEEDED);
		} catch (error) {
			LOG.error(this.className, DB_LOG_USER_STATS_SEED_FAILED, error as Error);
			this.rethrowCaught(error);
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
				LOG.warn(this.className, `${DB_LOG_FETCH_URL_ERROR} ${url}: ${json.error}`);
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
			LOG.error(this.className, `${DB_LOG_PROXY_FETCH_FAILED} ${url}`, error as Error);
			this.rethrowCaught(error);
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
	 * Gets the CloudBase where-clause object that identifies the current user's stats document
	 * within the users collection. Used by all per-user stats reads and writes to ensure consistency.
	 *
	 * @returns The where-clause object matching the current user's document by _openid.
	 */
	private getUserStatsFilter(): Record<string, unknown> {
		return { _openid: CloudbaseService.getUserId() };
	}

	/**
	 * Gets the CloudBase where-clause object that identifies the single global stats
	 * document — the one document in the statistics collection with its isGroup flag unset.
	 * Mirrors {@link getUserStatsFilter}.
	 *
	 * @returns The where-clause object matching the global stats document.
	 */
	private getGlobalStatsFilter(): Record<string, unknown> {
		return { [STATS_FIELD_IS_GROUP]: this._.neq(true) };
	}

	/**
	 * Reads the current user's connection records from their own document — { openid, name, status }
	 * for every account they have connected to or left.
	 *
	 * {@link clearConnection} - Removes a left record from this list.
	 *
	 * @returns A promise resolving to the connection records, or an empty array when none exist.
	 */
	private async getMyConnections(): Promise<ConnectedMember[]> {
		const res = await this.database
			.collection(DATABASE_USERS)
			.where(this.getUserStatsFilter())
			.limit(1)
			.get();
		return Utilities.toArray(res.data?.[0]?.[STATS_FIELD_CONNECTIONS]) as ConnectedMember[];
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
		const res = await this.database.collection(DATABASE_USERS).where(this.getUserStatsFilter()).get();
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
		// Step 1: Derive the milestone key — returns null when count is not a milestone threshold
		const key = Utilities.getMilestoneKey(domain, count);
		if (!key || !doc) return;

		/* Step 2: Guard against duplicate writes — if the key already exists in the milestones map,
		   the milestone was already reached on a prior action and must not be overwritten. */
		const milestones = (doc[STATS_FIELD_MILESTONES] as Record<string, string>) ?? {};
		if (milestones[key]) return;

		// Step 3: Write only the new milestone key using dot-notation to avoid overwriting sibling keys
		await this.database
			.collection(DATABASE_USERS)
			.where(this.getUserStatsFilter())
			.update({ [`${STATS_FIELD_MILESTONES}.${key}`]: Utilities.formatDateForStorage(new Date()) });
	}

	/**
	 * Throws a typed error when a CloudBase result object signals a failure.
	 * Maps permission_denied to SessionExpiredError so callers get the correct
	 * retry dialog; all other error codes throw UnexpectedError.
	 *
	 * @param result - The CloudBase SDK result object to inspect.
	 */
	private throwIfCloudbaseError(result: { code?: string; message?: string }): void {
		if (result.code === CLOUDBASE_ERR_PERMISSION_DENIED) throw new SessionExpiredError();
		if (result.code) throw new UnexpectedError();
	}

	/**
	 * Re-throws SessionExpiredError as-is so callers can handle it; wraps
	 * everything else in UnexpectedError to avoid leaking raw SDK errors.
	 *
	 * @param error - The caught value from a catch block.
	 */
	private rethrowCaught(error: unknown): never {
		if (error instanceof SessionExpiredError) throw error;
		throw new UnexpectedError();
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
