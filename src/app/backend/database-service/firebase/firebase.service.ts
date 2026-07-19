import { Utilities } from '../../../common/utilities/app.utilities';
import {
	DATABASE_DATE_CALCULATOR,
	DATABASE_DEBT_SONATA,
	DATABASE_HISTORY,
	DATABASE_PATCH_NOTES,
	DATABASE_QUOTES,
	DATABASE_RECIPES,
	DATABASE_RELEASE_NOTES,
	DATABASE_REMINDER,
	DATABASE_USEFUL_LINKS,
	DATABASE_VAULT,
	VAULT_VALUE_KEY_CATEGORIES,
	GENRE_FAVOURITE,
	HISTORY_STATUS_ADDED,
	HISTORY_STATUS_DELETED,
	HISTORY_STATUS_COMPLETED,
	SEARCH,
	STATS_CAP_ACTIVITY_LOG,
	STATS_FIELD_RECENT_ACTIVITIES,
	STATS_FIELD_ACTIVITY_STREAK,
	STATS_FIELD_ACTIVITY_STREAK_DATE,
	STATS_FIELD_MILESTONES,
	STATS_FIELD_TOTAL_REMINDERS,
	STATS_FIELD_TOTAL_DEBTS,
	STATS_FIELD_TOTAL_QUOTES,
	STATS_FIELD_TOTAL_FILMS,
	STATS_FIELD_TOTAL_RECIPES,
	STATS_FIELD_TOTAL_LINKS,
	STATS_FIELD_COMPLETED_PRIVATE,
	STATS_FIELD_COMPLETED_SHARED,
	MILESTONE_KEY_ACCOUNT_CREATED,
	DATABASE_USERS,
	DB_MOVIE_LIST_EMPTY,
	MIME_IMAGE_JPEG,
	MILESTONE_DOMAIN_STREAK,
	MILESTONE_DOMAIN_REMINDER,
	MILESTONE_DOMAIN_DEBT,
	MILESTONE_DOMAIN_QUOTE,
	MILESTONE_DOMAIN_FILM,
	MILESTONE_DOMAIN_RECIPE,
	MILESTONE_DOMAIN_LINK,
	USEFUL_LINK_TYPE_LINK,
	USEFUL_LINK_TYPE_CATEGORY,
	DEBT_VALUE_KEY_DEBT,
	DEBT_VALUE_KEY_PAID,
	DEBT_VALUE_KEY_PAYMENTS,
	ACTIVITY_SOURCE_DEBT,
	ACTIVITY_SOURCE_LINK,
	ACTIVITY_SOURCE_MOVIE,
	ACTIVITY_SOURCE_PATCH,
	ACTIVITY_SOURCE_RECIPE,
	ACTIVITY_SOURCE_REMINDER,
	ACTIVITY_SOURCE_RESONANCE,
	ACTIVITY_SOURCE_VAULT,
	ACTIVITY_SOURCE_DEFAULT,
	ACTIVITY_SOURCE_DATE_CALCULATOR,
	ACTIVITY_TYPE_UPDATED,
	ACTIVITY_TYPE_BUG_LOGGED,
	ACTIVITY_TYPE_CATEGORY_ADDED,
	ACTIVITY_TYPE_CALCULATOR_UPDATED,
	ACTIVITY_TYPE_CATEGORY_DELETED,
	ACTIVITY_TYPE_PAYMENT_REMOVED,
	ACTIVITY_TYPE_RATE_UPDATED,
	ACTIVITY_TYPE_GENRE_UPDATED,
	ACTIVITY_TYPE_FAVOURITE_UPDATED,
	ACTIVITY_TYPE_RESET,
	STATS_FIELD_TAURI_NOTIF_ENABLED,
	STATS_FIELD_MINIMIZE_ON_CLOSE,
	STATS_FIELD_LOCALE,
	STATS_FIELD_TODAY_ITEMS,
	LOCALE_KEY_EN,
	LOCALE_KEY_ZH,
	ENT_LOG_SPAN_CLASS_RATE_DOWN,
	ENT_LOG_SPAN_CLASS_RATE_UP,
	DB_LOG_TABLE_RECORD_UPDATED,
	DB_LOG_VAULT_ADD_FAILED,
	DB_LOG_DATE_CALC_UPDATE_FAILED,
	DB_LOG_MOVIE_RATE_UPDATE_FAILED,
	DB_LOG_MOVIE_GENRE_UPDATED,
	DB_LOG_MOVIE_STATS_UPDATED,
	DB_LOG_MOVIE_GENRE_UPDATE_FAILED,
	DB_LOG_MOVIE_FAVOURITE_UPDATED,
	DB_LOG_MOVIE_FAVOURITE_UPDATE_FAILED,
	DB_LOG_PATCH_NOTES_UPDATED,
	DB_LOG_PATCH_NOTES_UPDATE_FAILED,
	DB_LOG_STATS_UPDATE_FAILED,
	DB_LOG_USER_STATS_UPDATE_FAILED,
	DB_LOG_CLOUD_FUNCTION_CALL_FAILED,
	DB_LOG_PROXY_FETCH_FAILED,
	DB_LOG_STAT_COUNT_UPDATE_FAILED,
	DB_LOG_MILESTONE_WRITE_FAILED,
	DB_LOG_ACTIVITY_APPEND_FAILED,
	DB_LOG_RECORD_TABLE_UPDATED,
	DB_LOG_TABLE_UPDATE_FAILED,
	DB_LOG_QUOTE_REMOVE_FAILED,
	DB_LOG_MOVIE_REMOVED,
	DB_LOG_RECORD_REMOVED_FROM,
	DB_LOG_RECORD_REMOVE_FAILED,
	DB_LOG_MOVIE_DELETE_FAILED,
	DB_LOG_MOVIE_ADD_FAILED,
	DB_LOG_MOVIE_EXISTS_CHECK_FAILED,
	DB_LOG_IMAGE_UPLOAD_FAILED,
	DB_LOG_QUOTE_ADDED,
	DB_LOG_QUOTE_ADD_FAILED,
	DB_LOG_MOVIE_ADDED,
	DB_LOG_HISTORY_ADDED,
	DB_LOG_HISTORY_ADD_FAILED,
	DB_LOG_REMINDER_RECORD_ADD_FAILED,
	DB_LOG_COVER_UPLOADED,
	DB_LOG_REUSABLE_KEYS_RETRIEVED,
	DB_LOG_REUSABLE_KEYS_GET_FAILED,
	DB_LOG_REUSABLE_KEYS_UPDATED,
	DB_LOG_REUSABLE_KEYS_SAVE_FAILED
} from '../../../common/constants';
import {
	ACTIVE_LOCALE,
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
	set,
	push
} from 'firebase/database';
import type { Auth } from 'firebase/auth';
import { Observable, map, of } from 'rxjs';
import { MovieItemVO } from '../../../fontend/entertainment/movieItem.vo';
import { Recipe } from '../../../fontend/recipe/recipe.model';
import { VaultRecord } from '../../../fontend/vault/vault.model';
import { TodayTask } from '../../../fontend/today/today.model';
import {
	ConnectResult,
	DatabaseService,
	FIREBASE_AUTH,
	FIREBASE_DATABASE,
	FIREBASE_STORAGE,
	PassphraseLockStatus
} from '../database.service';

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
	 * Gets the current user's per-user document as a real-time observable — the users/<uid>
	 * node holding preferences, counters, and milestones, mirroring the CloudBase users
	 * collection where each user owns exactly one entry.
	 *
	 * @returns An observable that emits the user's document, or null when signed out or absent.
	 */
	public getUserStats(): Observable<any> {
		const uid = this.firebaseAuth.currentUser?.uid;
		if (!uid) return of(null);
		return new Observable((observer) => {
			const unsub = onValue(
				dbRef(this.db, `${DATABASE_USERS}/${uid}`),
				(snapshot) => observer.next(snapshot.val()),
				(error) => observer.error(error)
			);
			return () => unsub();
		});
	}

	/**
	 * Gets the date calculator table details from Firebase as a reactive observable.
	 *
	 * @returns An observable that emits the date calculator table details.
	 */
	public getDateCalculatorTableDetails(): Observable<any[]> {
		/* Scoped per user by path — each user owns a date_calculator/<uid> node, mirroring the
		   CloudBase per-owner row scoping. Rows under it are keyed by index; Object.values()
		   converts them back to the flat array the table binds to. */
		const uid = this.firebaseAuth.currentUser?.uid;
		if (!uid) return of([]);
		return new Observable((observer) => {
			const unsub = onValue(
				dbRef(this.db, `${DATABASE_DATE_CALCULATOR}/${uid}`),
				(snapshot) => {
					const data = snapshot.val();
					observer.next(data ? Object.values(data) : []);
				},
				(error) => observer.error(error)
			);
			return () => unsub();
		});
	}

	/**
	 * Gets the useful links from the database as a reactive observable.
	 * Category rows are filtered out so only actual links remain.
	 *
	 * @returns An observable that emits the useful links list.
	 */
	public getUsefulLinks(): Observable<any[]> {
		return this.listAsObservable(dbRef(this.db, DATABASE_USEFUL_LINKS)).pipe(
			map((snapshots: any[]) =>
				snapshots
					.map((snapshot: any) => this.toOwnedDoc(snapshot))
					.filter((link: any) => link.type !== USEFUL_LINK_TYPE_CATEGORY)
			)
		);
	}

	/**
	 * Gets the current user's link categories from the database as a reactive observable.
	 * Only the caller's own category rows are kept — categories are per-user on CloudBase, so the
	 * same per-owner scoping applies here (rows stamped with the caller's uid); actual links are
	 * filtered out.
	 *
	 * @returns An observable that emits the link categories list.
	 */
	public getLinkCategories(): Observable<any[]> {
		const uid = this.firebaseAuth.currentUser?.uid;
		return this.listAsObservable(dbRef(this.db, DATABASE_USEFUL_LINKS)).pipe(
			map((snapshots: any[]) =>
				snapshots
					.map((snapshot: any) => this.toOwnedDoc(snapshot))
					.filter(
						(category: any) =>
							category.type === USEFUL_LINK_TYPE_CATEGORY && category._openid === uid
					)
			)
		);
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
					.map((snapshot: any) => this.toOwnedDoc(snapshot))
					.sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp))
			)
		);
	}

	/**
	 * Gets the recipes from the database as a reactive observable.
	 * Each snapshot is mapped to the Recipe shape, with every step reset to not-done.
	 *
	 * @returns An observable that emits the recipe list.
	 */
	public getRecipes(): Observable<Recipe[]> {
		return this.listAsObservable(dbRef(this.db, DATABASE_RECIPES)).pipe(
			map(
				(snapshots: any[]) =>
					snapshots.map((snapshot: any) => {
						const recipe = snapshot.val();
						return {
							id: snapshot.key,
							openid: recipe.uid ?? '',
							name: recipe.name,
							detailName: recipe.detailName,
							category: recipe.category,
							bandClass: recipe.bandClass,
							cookTimeMin: recipe.cookTimeMin ?? 0,
							baseServings: recipe.baseServings ?? 1,
							badges: recipe.badges ?? [],
							groups: recipe.groups ?? [],
							steps: (recipe.steps ?? []).map((step: any) => ({ ...step, done: false })),
							notes: recipe.notes ?? ''
						};
					}) as Recipe[]
			)
		);
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
					movieItemVO.setOpenId(movie.uid ?? '');
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
	 * Gets the current user's reminder table details from Firebase as a reactive observable.
	 * Reminders are private per user on CloudBase, so the same per-owner scoping applies here (rows stamped with the caller's uid) —
	 * only the caller's own rows are emitted.
	 *
	 * @returns An observable that emits the reminder table details.
	 */
	public getReminderTableDetails(): Observable<any[]> {
		// Content shape is {text, date, link}.
		const uid = this.firebaseAuth.currentUser?.uid;
		return this.listAsObservable(dbRef(this.db, DATABASE_REMINDER)).pipe(
			map((snapshots: any[]) =>
				snapshots
					.map(
						(snapshot: any) =>
							this.toOwnedDoc(snapshot) as {
								key: string;
								content: string;
								date: string;
								link: string;
							}
					)
					.filter((reminder: any) => reminder._openid === uid)
			)
		);
	}

	/* ─────────────────────────────────────────
	   Shared reminders & account-connect stubs

	   These are documented no-ops on the Firebase backend by design, not oversight. Account linking and
	   shared reminders are a CloudBase-hosted, cross-account feature whose Cloud Functions authenticate
	   the caller via CloudBase's auth context (getCallerOpenid) and read/write CloudBase's own
	   users/reminder collections. A Firebase-backend session authenticates through Firebase and holds no
	   CloudBase identity, so it cannot invoke those functions as itself — delegating to them would run
	   under an anonymous/foreign openid and operate on data the user does not own. True parity would
	   require a cross-cloud identity bridge (or native Firebase Functions), tracked as separate work.
	───────────────────────────────────────── */

	/**
	 * Gets the shared activity feed for the current user and their connections. Account linking is a
	 * CloudBase-only feature (see the boundary note above), so the Firebase backend always resolves
	 * to an empty list.
	 *
	 * @returns A promise resolving to an empty activity list.
	 */
	public getSharedRecentActivity(): Promise<any[]> {
		return Promise.resolve([]);
	}

	/**
	 * Sends a connect request. Account linking is CloudBase-only, so the Firebase backend reports
	 * failure without contacting any function.
	 *
	 * @param _code - The target account's connect code (unused).
	 * @returns A promise resolving to a failed result.
	 */
	public sendConnectRequest(_code: string): Promise<ConnectResult> {
		return Promise.resolve({ success: false });
	}

	/**
	 * Dismisses a sent connect request. CloudBase-only feature — resolves immediately.
	 *
	 * @param _toOpenid - The target openid (unused).
	 * @returns A promise that resolves immediately.
	 */
	public clearOutgoingRequest(_toOpenid: string): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Cancels a sent connect request. CloudBase-only feature — resolves to a failed result.
	 *
	 * @param _toOpenid - The target openid (unused).
	 * @returns A promise resolving to a failed result.
	 */
	public cancelConnectRequest(_toOpenid: string): Promise<ConnectResult> {
		return Promise.resolve({ success: false });
	}

	/**
	 * Responds to a connect request. CloudBase-only feature — resolves to a failed result.
	 *
	 * @param _fromOpenid - The requesting account openid (unused).
	 * @param _accept - Whether to approve (unused).
	 * @returns A promise resolving to a failed result.
	 */
	public respondConnectRequest(_fromOpenid: string, _accept: boolean): Promise<ConnectResult> {
		return Promise.resolve({ success: false });
	}

	/**
	 * Leaves a connection. CloudBase-only feature — resolves to a failed result.
	 *
	 * @param _otherOpenid - The connected account openid (unused).
	 * @returns A promise resolving to a failed result.
	 */
	public disconnect(_otherOpenid: string): Promise<ConnectResult> {
		return Promise.resolve({ success: false });
	}

	/**
	 * Clears a left connection record. CloudBase-only feature — resolves immediately.
	 *
	 * @param _otherOpenid - The connection openid (unused).
	 * @returns A promise that resolves immediately.
	 */
	public clearConnection(_otherOpenid: string): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Reports whether the caller has already set a passphrase for the given feature key, via the
	 * getPassphraseLockStatus callable — the Firebase mirror of the CloudBase Cloud Function.
	 * Never exposes the stored hash, only a boolean.
	 *
	 * @param featureKey - The generic passphrase-lock feature identifier.
	 * @returns A promise resolving to the status result.
	 */
	public async getPassphraseLockStatus(featureKey: string): Promise<PassphraseLockStatus> {
		const result = await this.callCloudFunction<PassphraseLockStatus>('getPassphraseLockStatus', {
			featureKey
		});
		return result ?? { success: false, isSet: false };
	}

	/**
	 * Sets or replaces the caller's own passphrase for the given feature key via the
	 * setPassphraseLock callable, which hashes it server-side. Used for both first-time setup and
	 * later changes.
	 *
	 * @param featureKey - The generic passphrase-lock feature identifier.
	 * @param passphrase - The new plaintext passphrase.
	 * @returns A promise resolving to the set result.
	 */
	public async setPassphraseLock(featureKey: string, passphrase: string): Promise<ConnectResult> {
		const result = await this.callCloudFunction<ConnectResult>('setPassphraseLock', {
			featureKey,
			passphrase
		});
		return result ?? { success: false };
	}

	/**
	 * Verifies a passphrase attempt against the caller's stored hash via the verifyPassphraseLock
	 * callable. The hash never leaves the server — only a boolean result returns.
	 *
	 * @param featureKey - The generic passphrase-lock feature identifier.
	 * @param passphrase - The plaintext passphrase attempt.
	 * @returns A promise resolving to the verify result.
	 */
	public async verifyPassphraseLock(featureKey: string, passphrase: string): Promise<ConnectResult> {
		const result = await this.callCloudFunction<ConnectResult>('verifyPassphraseLock', {
			featureKey,
			passphrase
		});
		return result ?? { success: false };
	}

	/**
	 * Removes the caller's passphrase for the given feature key via the removePassphraseLock
	 * callable. Only that feature's entry is deleted — other features' passphrases and the
	 * feature's own data are never touched, so the page returns to first-time setup.
	 *
	 * @param featureKey - The generic passphrase-lock feature identifier.
	 * @returns A promise resolving to the removal result.
	 */
	public async removePassphraseLock(featureKey: string): Promise<ConnectResult> {
		const result = await this.callCloudFunction<ConnectResult>('removePassphraseLock', {
			featureKey
		});
		return result ?? { success: false };
	}

	/**
	 * Gets the current user's Account Expenses (debt sonata) table details from Firebase as a
	 * reactive observable. Debt rows are private per user on CloudBase, so the same per-owner
	 * scoping applies here (rows stamped with the caller's uid) — only the caller's own rows
	 * are emitted.
	 *
	 * @returns An observable that emits the Account Expenses table details.
	 */
	public getDebtSonataTableDetails(): Observable<any[]> {
		/* listAsObservable() reads once + subscribes to changes; pipe+map transforms
		   each snapshot into {key, ...fields} for the table component. */
		const uid = this.firebaseAuth.currentUser?.uid;
		return this.listAsObservable(dbRef(this.db, DATABASE_DEBT_SONATA)).pipe(
			map((snapshots: any[]) =>
				snapshots
					.map(
						(snapshot: any) =>
							this.toOwnedDoc(snapshot) as {
								key: string;
								name: string;
								content: {
									date: string;
									debt: number;
									original: number;
									paid: boolean;
								};
							}
					)
					.filter((debt: any) => debt._openid === uid)
			)
		);
	}

	/**
	 * Gets the current user's vault graph from Firebase as a reactive observable. The vault is
	 * private per user on CloudBase, so the same per-owner scoping applies here (rows stamped with the caller's uid) — only the
	 * caller's own nodes, edges, and categories are emitted.
	 *
	 * @returns An observable that emits the vault records list (nodes, edges, and custom categories).
	 */
	public getVault(): Observable<VaultRecord[]> {
		const uid = this.firebaseAuth.currentUser?.uid;
		return this.listAsObservable(dbRef(this.db, DATABASE_VAULT)).pipe(
			map((snapshots: any[]) =>
				snapshots
					.map((snapshot: any) => this.toOwnedDoc(snapshot) as VaultRecord)
					.filter((record: any) => record._openid === uid)
			)
		);
	}

	/**
	 * Gets the release notes for the active locale from the release_notes node, ordered newest first.
	 * Mirrors cloudbase.getReleaseNotes: filters by the document's lang, sorts by order descending, and
	 * strips the internal key/_openid/order/lang fields from each emitted entry.
	 *
	 * @returns An observable of the locale-filtered, order-sorted release-note entries.
	 */
	public getReleaseNotes(): Observable<any[]> {
		return this.listAsObservable(dbRef(this.db, DATABASE_RELEASE_NOTES)).pipe(
			map((snapshots: any[]) =>
				snapshots
					.map((snapshot: any) => ({ key: snapshot.key, ...snapshot.val() }))
					.filter((doc: any) => (doc.lang ?? 'en') === ACTIVE_LOCALE)
					.sort((a: any, b: any) => (b.order ?? 0) - (a.order ?? 0))
					.map((doc: any) => {
						const { key, _openid, uid, order, lang, ...rest } = doc;
						return rest;
					})
			)
		);
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
							this.toOwnedDoc(snapshot) as {
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
			/* Written to the caller's own date_calculator/<uid> node — the same per-user path the
			   read streams from — so users can never overwrite each other's rows. */
			const uid = this.firebaseAuth.currentUser?.uid;
			if (!uid) return;
			await update(dbRef(this.db, `${DATABASE_DATE_CALCULATOR}/${uid}`), { ...updatedTable });
			LOG.info(this.className, DB_LOG_TABLE_RECORD_UPDATED);
			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_DATE_CALCULATOR,
				type: ACTIVITY_TYPE_CALCULATOR_UPDATED
			}).catch(() => {});
		} catch (error: unknown) {
			LOG.error(this.className, DB_LOG_DATE_CALC_UPDATE_FAILED, error as Error);
			this.rethrowCaught(error);
		}
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
				LOG.info(this.className, DB_LOG_MOVIE_GENRE_UPDATED);

				// Step 2 : Update movie statistics
				return runTransaction(dbRef(this.db, `statistics`), (currentData) => {
					currentData.genre[oldGenre] = currentData.genre[oldGenre] - 1;
					currentData.genre[newGenre] = (currentData.genre[newGenre] ?? 0) + 1;
					return currentData;
				});
			})
			.then(() => {
				LOG.info(this.className, DB_LOG_MOVIE_STATS_UPDATED);
				this.appendToActivityLog({
					source: ACTIVITY_SOURCE_MOVIE,
					type: ACTIVITY_TYPE_GENRE_UPDATED,
					title
				}).catch(() => {});
			})
			.catch((error: Error) => {
				LOG.error(this.className, DB_LOG_MOVIE_GENRE_UPDATE_FAILED, error);
				this.rethrowCaught(error);
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
				LOG.info(this.className, DB_LOG_MOVIE_FAVOURITE_UPDATED);

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
				LOG.info(this.className, DB_LOG_MOVIE_STATS_UPDATED);
				this.appendToActivityLog({
					source: ACTIVITY_SOURCE_MOVIE,
					type: ACTIVITY_TYPE_FAVOURITE_UPDATED,
					title
				}).catch(() => {});
			})
			.catch((error: Error) => {
				LOG.error(this.className, DB_LOG_MOVIE_FAVOURITE_UPDATE_FAILED, error);
				this.rethrowCaught(error);
			});
	}

	/**
	 * Updates a single field value in the reminder table and records the change in the activity log.
	 *
	 * @param entryKey - The key of the entry to update.
	 * @param valueKey - The key of the value to update.
	 * @param value - The new value to store.
	 * @param text - The reminder text, recorded in the activity log.
	 * @param isShared - Whether the reminder is shared, so its activity routes to the group feed.
	 */
	public async updateReminderTable(
		entryKey: string,
		valueKey: string,
		value: any,
		text: string,
		isShared?: boolean
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
	}

	/**
	 * Resets a debt record to its original amount and removes all payment history
	 * in a single round-trip. Setting the payments field to null deletes that child node
	 * entirely, the RTDB analogue of CloudBase's remove command. Records the reset in the
	 * activity log.
	 *
	 * @param entryKey - The key of the entry to reset.
	 * @param originalAmount - The original debt amount to restore.
	 * @param paid - The paid status to restore.
	 * @param name - The debt entry name, recorded in the activity log.
	 */
	public resetDebtRecord(
		entryKey: string,
		originalAmount: number,
		paid: boolean,
		name: string
	): Promise<void> {
		return this.updateTableExistingFields(DATABASE_DEBT_SONATA, {
			entryKey,
			fields: {
				[DEBT_VALUE_KEY_DEBT]: originalAmount,
				[DEBT_VALUE_KEY_PAID]: paid,
				[DEBT_VALUE_KEY_PAYMENTS]: null
			},
			source: ACTIVITY_SOURCE_DEBT,
			type: ACTIVITY_TYPE_RESET,
			name
		});
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
	protected async updateOnePatchNote(
		key: string,
		updatedRecord: any,
		component: string,
		element: string,
		noteIndex: number,
		activityType: string
	): Promise<void> {
		try {
			await update(dbRef(this.db, `${DATABASE_PATCH_NOTES}/${key}`), { ...updatedRecord });
			LOG.info(this.className, DB_LOG_PATCH_NOTES_UPDATED);
			this.appendToActivityLog({
				source: ACTIVITY_SOURCE_PATCH,
				type: activityType,
				component,
				element,
				noteIndex
			}).catch(() => {});
		} catch (error) {
			LOG.error(this.className, DB_LOG_PATCH_NOTES_UPDATE_FAILED, error as Error);
			this.rethrowCaught(error);
		}
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
			LOG.error(this.className, DB_LOG_STATS_UPDATE_FAILED, error as Error);
		}
	}

	/**
	 * Merges the given fields into the current user's users/<uid> node — the same per-user
	 * document that holds preferences and milestones, mirroring the CloudBase users collection
	 * so per-user values never collide across accounts.
	 *
	 * @param fields - Fields to merge into the per-user document.
	 * @returns A promise that resolves when the update completes.
	 */
	public async updateUserStatsFields(fields: Record<string, any>): Promise<void> {
		const uid = this.firebaseAuth.currentUser?.uid;
		if (!uid) return;
		try {
			await update(dbRef(this.db, `${DATABASE_USERS}/${uid}`), fields);
		} catch (error) {
			LOG.error(this.className, DB_LOG_USER_STATS_UPDATE_FAILED, error as Error);
		}
	}

	/**
	 * Prepends a new entry to the array named recent activity in the statistics document,
	 * keeping at most STATS_CAP_ACTIVITY_LOG entries (newest first), and updates the persistent
	 * activity streak. Firebase has no shared reminders, so the entry always goes to the personal
	 * recent-activity feed. The streak extends when the last activity was yesterday, holds when it
	 * was today, and resets to 1 otherwise; a streak milestone is recorded when the threshold is met.
	 *
	 * @param activity - The activity object to record.
	 * @returns A promise that resolves when the activity and streak have been written.
	 */
	protected async appendToActivityLog(activity: any): Promise<void> {
		const timestamp = Utilities.getCurrentFormattedTime(true);
		const entry = { ...activity, timestamp };
		try {
			// Step 1: Read the current stats — both the activity feed and the streak live on this node.
			const snapshot = await get(this.statisticsRef);
			const currentData = snapshot.val() ?? {};

			/* Step 2: Compute the new streak. If the stored date is today the streak is unchanged
			   (multiple activities in one day count once); if it was yesterday the streak extends;
			   otherwise a break is detected and the streak resets to 1. */
			const today = Utilities.formatDateForStorage(new Date());
			const storedStreak = (currentData[STATS_FIELD_ACTIVITY_STREAK] as number) ?? 0;
			const storedDate = (currentData[STATS_FIELD_ACTIVITY_STREAK_DATE] as string) ?? '';
			let newStreak: number;
			if (storedDate === today) {
				newStreak = storedStreak;
			} else {
				const yesterday = new Date();
				yesterday.setDate(yesterday.getDate() - 1);
				newStreak = storedDate === Utilities.formatDateForStorage(yesterday) ? storedStreak + 1 : 1;
			}

			// Step 3: Prepend the capped entry to the personal feed and write it alongside the streak.
			const existing = Utilities.toArray(currentData[STATS_FIELD_RECENT_ACTIVITIES]);
			const updated = [entry, ...existing].slice(0, STATS_CAP_ACTIVITY_LOG);
			await this.updateUserStatsFields({
				[STATS_FIELD_RECENT_ACTIVITIES]: updated,
				[STATS_FIELD_ACTIVITY_STREAK]: newStreak,
				[STATS_FIELD_ACTIVITY_STREAK_DATE]: today
			});
			this.checkAndWriteCountMilestone(MILESTONE_DOMAIN_STREAK, newStreak).catch(() => {});
		} catch (error) {
			LOG.error(this.className, DB_LOG_ACTIVITY_APPEND_FAILED, error as Error);
		}
	}

	/**
	 * Updates the given fields on a single table record in one round-trip, then records the supplied
	 * activity entry. Mirrors {@link addNewRecordToDB} — the document key, the fields to write, and the
	 * activity payload are all passed as one record descriptor, so callers no longer record activity
	 * themselves. Firebase's RTDB `update()` cannot report "0 rows updated", so there is no missing-
	 * document guard.
	 *
	 * {@link updateUsefulLink} - Updates link fields in the useful-links collection.
	 * {@link updateLinkCategory} - Updates category fields in the useful-links collection.
	 * {@link updateRecipe} - Updates recipe fields in the recipes collection.
	 * {@link updateReminderTable} - Updates a single field in the reminder collection.
	 * {@link updateSingleValueForDebtTable} - Updates a single field in the debt collection.
	 * {@link updateDebtFields} - Updates multiple fields in the debt collection.
	 * {@link resetDebtRecord} - Resets debt amount and removes payment history.
	 * {@link updateOnePatchNote} - Updates a patch note record.
	 * {@link updateVaultNodeCategories} - Replaces an account's category list.
	 * {@link updateVaultNodeVerified} - Sets an account's verified flag.
	 * {@link updateVaultNodeName} - Sets a node's display name.
	 * {@link updateVaultCategory} - Renames a custom category and/or changes its icon.
	 *
	 * @param tableName - The database collection name.
	 * @param newRecord - The update descriptor: the document key (entryKey), the fields to write
	 *   (fields), and the activity values to record (source, type, and subtitle) as flat sibling
	 *   properties. When no activity property is supplied, no entry is logged.
	 */
	protected async updateTableExistingFields(tableName: string, newRecord: any): Promise<void> {
		const { entryKey, fields, ...activity } = newRecord;
		try {
			await update(dbRef(this.db, `${tableName}/${entryKey}`), fields);
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
	 * Removes a link from the useful-links collection, records the deletion in the activity log,
	 * and decrements the total-links count. Mirrors cloudbase.removeUsefulLink.
	 *
	 * @param key - The key of the link to remove.
	 * @param domain - The hostname of the removed link, recorded in the activity log.
	 * @param ownerOpenid - The _openid of the link's owner, so only the owner's counter is decremented.
	 */
	public async removeUsefulLink(key: string, domain: string, ownerOpenid: string): Promise<void> {
		await this.removeSingleItemFromDatabase(DATABASE_USEFUL_LINKS, key);
		this.appendToActivityLog({
			source: ACTIVITY_SOURCE_LINK,
			type: HISTORY_STATUS_DELETED,
			domain
		}).catch(() => {});
		this.updateStatCount(STATS_FIELD_TOTAL_LINKS, -1).catch(() => {});
		this.decrementOwnStatCount(STATS_FIELD_TOTAL_LINKS, ownerOpenid);
	}

	/**
	 * Removes a category from the useful-links collection and records the deletion in the activity
	 * log. Categories share the collection with links but do not count toward totalLinks, so no
	 * count is changed. Mirrors cloudbase.removeLinkCategory.
	 *
	 * @param key - The key of the category to remove.
	 * @param name - The category name, recorded in the activity log.
	 */
	public async removeLinkCategory(key: string, name: string): Promise<void> {
		await this.removeSingleItemFromDatabase(DATABASE_USEFUL_LINKS, key);
		this.appendToActivityLog({
			source: ACTIVITY_SOURCE_LINK,
			domain: name,
			type: ACTIVITY_TYPE_CATEGORY_DELETED
		}).catch(() => {});
	}

	/**
	 * Removes a quote from the database and decrements the statistics total.
	 *
	 * @param key - The key of the quote to remove.
	 * @param author - The author of the quote (used for activity log).
	 * @param ownerOpenid - The _openid of the quote's owner, so only the owner's counter is decremented.
	 */
	public async removeQuote(key: string, author: string, ownerOpenid: string): Promise<void> {
		try {
			await this.removeSingleItemFromDatabase(DATABASE_QUOTES, key);
			this.decrementOwnStatCount(STATS_FIELD_TOTAL_QUOTES, ownerOpenid);
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
			LOG.error(this.className, `${DB_LOG_QUOTE_REMOVE_FAILED} ${key}`, error as Error);
			this.rethrowCaught(error);
		}
	}

	/**
	 * Removes a recipe from the recipes collection, records the deletion in the activity log,
	 * and decrements the total-recipes count. Mirrors cloudbase.removeRecipe.
	 *
	 * @param recipeId - The database key of the recipe to delete.
	 * @param name - The recipe name, recorded in the activity log.
	 * @param ownerOpenid - The _openid of the recipe's owner, so only the owner's counter is decremented.
	 */
	public async removeRecipe(recipeId: string, name: string, ownerOpenid: string): Promise<void> {
		await this.removeSingleItemFromDatabase(DATABASE_RECIPES, recipeId);
		this.appendToActivityLog({
			source: ACTIVITY_SOURCE_RECIPE,
			type: HISTORY_STATUS_DELETED,
			name
		}).catch(() => {});
		this.updateStatCount(STATS_FIELD_TOTAL_RECIPES, -1).catch(() => {});
		this.decrementOwnStatCount(STATS_FIELD_TOTAL_RECIPES, ownerOpenid);
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
			this.decrementOwnStatCount(STATS_FIELD_TOTAL_FILMS, movieItemVO.getOpenId());
			LOG.info(this.className, DB_LOG_MOVIE_REMOVED);
		} catch (error) {
			LOG.error(
				this.className,
				`${DB_LOG_MOVIE_DELETE_FAILED} ${movieItemVO.getMovieName()}`,
				error as Error
			);
			this.rethrowCaught(error);
		}
	}

	/**
	 * Removes a record from the reminder table and records the deletion in the activity log.
	 *
	 * @param key - The key of the record to remove.
	 * @param text - The reminder text, recorded in the activity log.
	 * @param _isShared - Group-feed routing flag; unused in the Firebase backend (no shared groups).
	 * @param ownerOpenid - The _openid of the reminder's owner, so only the owner's counter is decremented.
	 */
	public async removeRecordFromReminderTable(
		key: string,
		text: string,
		_isShared: boolean,
		ownerOpenid: string
	): Promise<void> {
		await this.removeSingleItemFromDatabase(DATABASE_REMINDER, key);
		this.appendToActivityLog({
			source: ACTIVITY_SOURCE_REMINDER,
			type: HISTORY_STATUS_DELETED,
			text
		}).catch(() => {});
		this.updateStatCount(STATS_FIELD_TOTAL_REMINDERS, -1).catch(() => {});
		this.decrementOwnStatCount(STATS_FIELD_TOTAL_REMINDERS, ownerOpenid);
	}

	/**
	 * Completes the current user's own (private) reminder: removes the document and records the
	 * completion as a distinct 'completed' activity (not a deletion).
	 *
	 * @param key - The document key of the reminder being completed.
	 * @param text - The reminder text, recorded in the activity log.
	 */
	public async completeReminder(key: string, text: string): Promise<void> {
		await this.removeSingleItemFromDatabase(DATABASE_REMINDER, key);
		this.appendToActivityLog({
			source: ACTIVITY_SOURCE_REMINDER,
			type: HISTORY_STATUS_COMPLETED,
			text
		}).catch(() => {});
		this.updateStatCount(STATS_FIELD_TOTAL_REMINDERS, -1).catch(() => {});
		this.updateStatCount(STATS_FIELD_COMPLETED_PRIVATE, 1).catch(() => {});
		this.updateUserStatCount(STATS_FIELD_TOTAL_REMINDERS, -1).catch(() => {});
		this.updateUserStatCount(STATS_FIELD_COMPLETED_PRIVATE, 1).catch(() => {});
	}

	/**
	 * Removes a record from the debt table and records the deletion in the activity log.
	 *
	 * @param key - The key of the record to remove.
	 * @param name - The debt entry name, recorded in the activity log.
	 * @param ownerOpenid - The _openid of the debt's owner, so only the owner's counter is decremented.
	 */
	public async removeRecordFromDebtTable(key: string, name: string, ownerOpenid: string): Promise<void> {
		await this.removeSingleItemFromDatabase(DATABASE_DEBT_SONATA, key);
		this.appendToActivityLog({
			source: ACTIVITY_SOURCE_DEBT,
			type: HISTORY_STATUS_DELETED,
			name
		}).catch(() => {});
		this.updateStatCount(STATS_FIELD_TOTAL_DEBTS, -1).catch(() => {});
		this.decrementOwnStatCount(STATS_FIELD_TOTAL_DEBTS, ownerOpenid);
	}

	/**
	 * Removes a link (edge) from the vault collection.
	 *
	 * @param key - The document key of the edge to remove.
	 */
	public removeVaultEdge(key: string): Promise<void> {
		return this.removeSingleItemFromDatabase(DATABASE_VAULT, key);
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
		await Promise.all(connectedEdgeIds.map((edgeId) => this.removeVaultEdge(edgeId)));
		await this.removeSingleItemFromDatabase(DATABASE_VAULT, nodeId);
		this.appendToActivityLog({
			source: ACTIVITY_SOURCE_VAULT,
			name,
			type: HISTORY_STATUS_DELETED
		}).catch(() => {});
	}

	/**
	 * Removes a single payment-history entry from a debt record and updates the outstanding
	 * amount in one round-trip. Setting the payments child at the given index to null deletes it,
	 * the RTDB analogue of CloudBase's remove command. Records the removal in the activity log.
	 * Mirrors cloudbase.removeSingleHistoryFromDebt.
	 *
	 * @param entryKey - The key of the debt record.
	 * @param index - The index of the payment-history entry to remove.
	 * @param updatedDebt - The recomputed outstanding debt amount after removing the payment.
	 * @param name - The debt entry name, recorded in the activity log.
	 */
	public removeSingleHistoryFromDebt(
		entryKey: string,
		index: number,
		updatedDebt: number,
		name: string
	): Promise<void> {
		return this.updateTableExistingFields(DATABASE_DEBT_SONATA, {
			entryKey,
			fields: {
				[`${DEBT_VALUE_KEY_PAYMENTS}/${index}`]: null,
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
	 * by reading the flag from the user's per-user node.
	 *
	 * @returns True when the Tauri notification flag is set in the user's per-user node.
	 */
	public async getTauriNotifEnabled(): Promise<boolean> {
		const uid = this.firebaseAuth.currentUser?.uid;
		if (!uid) return false;
		const snap = await get(dbRef(this.db, `${DATABASE_USERS}/${uid}`));
		return snap.val()?.[STATS_FIELD_TAURI_NOTIF_ENABLED] === true;
	}

	/**
	 * Persists the Tauri desktop notification preference for the current user
	 * by updating the flag in the user's per-user node.
	 *
	 * @param enabled - The desired enabled state.
	 */
	public async setTauriNotifEnabled(enabled: boolean): Promise<void> {
		const uid = this.firebaseAuth.currentUser?.uid;
		if (!uid) return;
		/* update() merges into the node — set() would overwrite the entire per-user node,
		   erasing minimize-on-close and locale fields stored at the same path. */
		await update(dbRef(this.db, `${DATABASE_USERS}/${uid}`), {
			[STATS_FIELD_TAURI_NOTIF_ENABLED]: enabled
		});
	}

	/**
	 * Gets whether the desktop app minimizes to Dock on close for the current user.
	 *
	 * @returns True when the minimize-on-close flag is set in the user's per-user node.
	 */
	public async getMinimizeOnClose(): Promise<boolean> {
		const uid = this.firebaseAuth.currentUser?.uid;
		if (!uid) return true;
		const snap = await get(dbRef(this.db, `${DATABASE_USERS}/${uid}`));
		return snap.val()?.[STATS_FIELD_MINIMIZE_ON_CLOSE] === true;
	}

	/**
	 * Persists the minimize-on-close preference for the current user
	 * by updating the flag in the user's per-user node.
	 *
	 * @param enabled - The desired enabled state.
	 */
	public async setMinimizeOnClose(enabled: boolean): Promise<void> {
		const uid = this.firebaseAuth.currentUser?.uid;
		if (!uid) return;
		await update(dbRef(this.db, `${DATABASE_USERS}/${uid}`), {
			[STATS_FIELD_MINIMIZE_ON_CLOSE]: enabled
		});
	}

	/**
	 * Gets the display locale preference for the current user from the user's per-user node.
	 *
	 * @returns The stored locale ('en' or 'zh'), or null when not yet set.
	 */
	public async getLocale(): Promise<'en' | 'zh' | null> {
		const uid = this.firebaseAuth.currentUser?.uid;
		if (!uid) return null;
		const snap = await get(dbRef(this.db, `${DATABASE_USERS}/${uid}`));
		const value = snap.val()?.[STATS_FIELD_LOCALE];
		return value === LOCALE_KEY_EN || value === LOCALE_KEY_ZH ? value : null;
	}

	/**
	 * Persists the display locale preference for the current user
	 * by updating the field in the user's per-user node.
	 *
	 * @param locale - The locale key to store: 'en' or 'zh'.
	 */
	public async setLocale(locale: 'en' | 'zh'): Promise<void> {
		const uid = this.firebaseAuth.currentUser?.uid;
		if (!uid) return;
		await update(dbRef(this.db, `${DATABASE_USERS}/${uid}`), { [STATS_FIELD_LOCALE]: locale });
	}

	/**
	 * Gets the backed-up Today page items for the current user from the user's per-user node.
	 *
	 * @returns The stored Today items, or an empty array when none are backed up or the user is signed out.
	 */
	public async getTodayItems(): Promise<TodayTask[]> {
		const uid = this.firebaseAuth.currentUser?.uid;
		if (!uid) return [];
		const snap = await get(dbRef(this.db, `${DATABASE_USERS}/${uid}`));
		const value = snap.val()?.[STATS_FIELD_TODAY_ITEMS];
		return Array.isArray(value) ? (value as TodayTask[]) : [];
	}

	/**
	 * Persists the full set of locally created Today items for the current user
	 * by replacing the backup field in the user's per-user node.
	 *
	 * @param items - The complete list of Today items to store; an empty array clears the backup.
	 */
	public async saveTodayItems(items: TodayTask[]): Promise<void> {
		const uid = this.firebaseAuth.currentUser?.uid;
		if (!uid) return;
		await update(dbRef(this.db, `${DATABASE_USERS}/${uid}`), {
			[STATS_FIELD_TODAY_ITEMS]: items
		});
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
				LOG.info(this.className, `${DB_LOG_RECORD_REMOVED_FROM} ${tablePath}`);
			})
			.catch((error: Error) => {
				LOG.error(this.className, `${DB_LOG_RECORD_REMOVE_FAILED} ${tablePath}`, error);
				this.rethrowCaught(error);
			});
	}

	// ── Add methods ──────────────────────────────────────────────────────────

	/**
	 * Adds a new useful link to the database. Shared links are flagged with `isShared` and never carry
	 * a category; private links carry their category instead. Bumps the link total and records the
	 * count milestone once the threshold is met.
	 *
	 * @param link - The link object to add. `isShared` is persisted as a top-level flag.
	 */
	public async addUsefulLink(link: {
		url: string;
		title: string;
		category: string;
		visitCount: number;
		createdAt: string;
		isPinned: boolean;
		isShared?: boolean;
	}): Promise<void> {
		const { isShared, category, ...linkData } = link;
		await this.addNewRecordToDB(DATABASE_USEFUL_LINKS, {
			type: USEFUL_LINK_TYPE_LINK,
			...linkData,
			...(isShared ? { isShared: true } : { category })
		});
		this.updateStatCount(STATS_FIELD_TOTAL_LINKS, 1)
			.then(() => this.checkAndWriteDomainMilestone(STATS_FIELD_TOTAL_LINKS, MILESTONE_DOMAIN_LINK))
			.catch(() => {});
		this.updateUserStatCount(STATS_FIELD_TOTAL_LINKS, 1).catch(() => {});
	}

	/**
	 * Adds a new link category to the database.
	 *
	 * @param category - The category object to add.
	 */
	public addLinkCategory(category: { name: string; color: string; order: number }): Promise<void> {
		return this.addNewRecordToDB(DATABASE_USEFUL_LINKS, {
			type: USEFUL_LINK_TYPE_CATEGORY,
			...category
		});
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
			// Stamp the owner's Firebase uid so quote ownership checks work on Firebase too
			const uid = this.firebaseAuth.currentUser?.uid;
			await push(dbRef(this.db, DATABASE_QUOTES), {
				text,
				author,
				timestamp,
				...(uid ? { uid } : {})
			});
			LOG.info(this.className, DB_LOG_QUOTE_ADDED);
			this.updateUserStatCount(STATS_FIELD_TOTAL_QUOTES, 1).catch(() => {});
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

			/* The runTransaction above already bumped totalQuotes — record the milestone only, never
			   a second increment, or the quote total would double. Fire-and-forget: the add succeeded. */
			this.checkAndWriteDomainMilestone(STATS_FIELD_TOTAL_QUOTES, MILESTONE_DOMAIN_QUOTE).catch(
				() => {}
			);
		} catch (error) {
			LOG.error(this.className, DB_LOG_QUOTE_ADD_FAILED, error as Error);
			this.rethrowCaught(error);
		}
	}

	/**
	 * Adds a new recipe to the database. Steps are persisted with `done: false` so the cooking state
	 * is always reset on load. Bumps the recipe total and records the count milestone once the
	 * threshold is met.
	 *
	 * @param recipe - The recipe to persist. The `id` field is ignored; the database assigns one.
	 */
	public async addRecipe(recipe: Recipe): Promise<void> {
		const { id: _, ...payload } = recipe;
		await this.addNewRecordToDB(DATABASE_RECIPES, {
			...payload,
			steps: payload.steps.map((step) => ({ ...step, done: false }))
		});
		this.updateStatCount(STATS_FIELD_TOTAL_RECIPES, 1)
			.then(() => this.checkAndWriteDomainMilestone(STATS_FIELD_TOTAL_RECIPES, MILESTONE_DOMAIN_RECIPE))
			.catch(() => {});
		this.updateUserStatCount(STATS_FIELD_TOTAL_RECIPES, 1).catch(() => {});
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

			// Step 2 : Persist movie document, stamped with the owner's Firebase uid for ownership checks
			const ownerUid = this.firebaseAuth.currentUser?.uid;
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
				actors: movieItemVO.getActors(),
				...(ownerUid ? { uid: ownerUid } : {})
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

			/* The runTransaction above already bumped totalFilms — record the milestone only, never a
			   second increment, or the film total would double. Fire-and-forget: the add succeeded. */
			this.checkAndWriteDomainMilestone(STATS_FIELD_TOTAL_FILMS, MILESTONE_DOMAIN_FILM).catch(() => {});
			this.updateUserStatCount(STATS_FIELD_TOTAL_FILMS, 1).catch(() => {});
			LOG.info(this.className, DB_LOG_MOVIE_ADDED);
		} catch (error) {
			LOG.error(
				this.className,
				`${DB_LOG_MOVIE_ADD_FAILED} ${movieItemVO.getMovieName()}`,
				error as Error
			);
			this.rethrowCaught(error);
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
			LOG.info(this.className, DB_LOG_HISTORY_ADDED);
		} catch (error) {
			LOG.error(this.className, DB_LOG_HISTORY_ADD_FAILED, error as Error);
			this.rethrowCaught(error);
		}
	}

	/**
	 * Adds a new record to the reminder collection, bumps the reminder total, records the count
	 * milestone once the threshold is met, and signals connections when the reminder is shared.
	 *
	 * @param newRecord - The new record to add.
	 */
	public async addNewRecordToReminder(newRecord: any): Promise<void> {
		this.updateStatCount(STATS_FIELD_TOTAL_REMINDERS, 1)
			.then(() =>
				this.checkAndWriteDomainMilestone(STATS_FIELD_TOTAL_REMINDERS, MILESTONE_DOMAIN_REMINDER)
			)
			.catch(() => {});
		this.updateUserStatCount(STATS_FIELD_TOTAL_REMINDERS, 1).catch(() => {});
		await this.addNewRecordToDB(DATABASE_REMINDER, newRecord);
	}

	/**
	 * Adds a new record to the debt collection, bumps the debt total, and records the count milestone
	 * once the threshold is met.
	 *
	 * @param newRecord - The new record to add.
	 */
	public addNewRecordToDebt(newRecord: any): Promise<void> {
		this.updateStatCount(STATS_FIELD_TOTAL_DEBTS, 1)
			.then(() => this.checkAndWriteDomainMilestone(STATS_FIELD_TOTAL_DEBTS, MILESTONE_DOMAIN_DEBT))
			.catch(() => {});
		this.updateUserStatCount(STATS_FIELD_TOTAL_DEBTS, 1).catch(() => {});
		return this.addNewRecordToDB(DATABASE_DEBT_SONATA, newRecord);
	}

	/**
	 * Removes a custom account category and pulls its key from every account that carried it,
	 * so no account is left pointing at a category that no longer exists.
	 *
	 * @param categoryKey - The document id of the category to remove.
	 * @param accountUpdates - The affected accounts, each with its category list already stripped of the removed key.
	 * @returns A promise that resolves when the category is removed and its accounts updated.
	 */
	public async removeVaultCategory(
		categoryKey: string,
		accountUpdates: { id: string; categories: string[] }[]
	): Promise<void> {
		await Promise.all(
			accountUpdates.map((account) =>
				update(dbRef(this.db, `${DATABASE_VAULT}/${account.id}`), {
					[VAULT_VALUE_KEY_CATEGORIES]: account.categories
				})
			)
		);
		await this.removeSingleItemFromDatabase(DATABASE_VAULT, categoryKey);
	}

	/**
	 * Pushes a new record under the given table in Firebase Realtime Database and records an activity
	 * log entry for every table. Reads spread the pushed document flat (`{key, ...val}`), so the record
	 * is written flat — never wrapped — so writes and reads round-trip. The activity discriminator is
	 * `bug_logged` for a bug patch note, `category_added` for a link category, otherwise `added`.
	 *
	 * {@link addNewRecordToReminder} - Adds a new record to the reminder collection.
	 * {@link addNewRecordToDebt} - Adds a new record to the debt collection.
	 * {@link addNewRecordToPatchNotes} - Adds a new record to the patch notes collection.
	 * {@link addQuote} - Adds a quote to the quotes collection.
	 * {@link addRecipe} - Adds a recipe to the recipes collection.
	 * {@link addUsefulLink} - Adds a link to the useful-links collection.
	 * {@link addLinkCategory} - Adds a category to the useful-links collection.
	 *
	 * @param tableName - The database collection name.
	 * @param newRecord - The new record data to persist.
	 */
	protected async addNewRecordToDB(tableName: string, newRecord: any): Promise<void> {
		try {
			/* Step 1: Push the record flat so the matching read's {key, ...val} spread round-trips.
			   The owner's Firebase uid is stamped so ownership checks work on Firebase-created
			   documents — reads surface it to the app via toOwnedDoc; _openid never hits storage. */
			const uid = this.firebaseAuth.currentUser?.uid;
			await push(dbRef(this.db, tableName), { ...newRecord, ...(uid ? { uid } : {}) });
			LOG.info(this.className, DB_LOG_TABLE_RECORD_UPDATED);

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
						: HISTORY_STATUS_ADDED
			}).catch(() => {});
		} catch (error) {
			LOG.error(this.className, DB_LOG_REMINDER_RECORD_ADD_FAILED, error as Error);
			this.rethrowCaught(error);
		}
	}

	/**
	 * Pushes a vault document under the vault node and returns its generated key.
	 *
	 * {@link addVaultNode} - Adds an account / email / phone node.
	 * {@link addVaultEdge} - Adds a link between two nodes.
	 * {@link addVaultCategory} - Adds a custom category.
	 *
	 * @param content - The document content with its kind discriminator and value fields.
	 * @returns The database key of the newly created document.
	 */
	protected async addVaultRecord(content: Record<string, unknown>): Promise<string> {
		// Stamp the owner's Firebase uid so vault documents carry ownership like CloudBase's
		const uid = this.firebaseAuth.currentUser?.uid;
		const reference = push(dbRef(this.db, DATABASE_VAULT), {
			...content,
			...(uid ? { uid } : {})
		});
		try {
			await reference;
			LOG.info(this.className, DB_LOG_TABLE_RECORD_UPDATED);
			return reference.key ?? '';
		} catch (error) {
			LOG.error(this.className, DB_LOG_VAULT_ADD_FAILED, error as Error);
			this.rethrowCaught(error);
		}
	}

	// ── Utility methods ───────────────────────────────────────────────────────

	/**
	 * Increments a link's visit count and stamps the last-visited time. A plain DB write with no
	 * activity-log entry, mirroring cloudbase.incrementLinkVisit.
	 *
	 * @param key - The key of the link whose visit count to increment.
	 * @param currentCount - The link's current visit count, incremented by one.
	 */
	public incrementLinkVisit(key: string, currentCount: number): Promise<void> {
		return this.updateTableExistingFields(DATABASE_USEFUL_LINKS, {
			entryKey: key,
			fields: {
				visitCount: currentCount + 1,
				lastVisited: Utilities.getCurrentFormattedTime(true)
			}
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
			const snapshot = await get(this.moviesRef);
			/* Firebase Realtime DB does not support server-side .where() queries
			   like CloudBase, so we must iterate all movies to check for duplicates. */
			const allMovies = snapshot.val();

			if (!allMovies) throw new Error(DB_MOVIE_LIST_EMPTY);

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
				`${DB_LOG_MOVIE_EXISTS_CHECK_FAILED} ${movieName}`,
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
				contentType: MIME_IMAGE_JPEG
			});
			LOG.info(this.className, DB_LOG_COVER_UPLOADED);
			return await getDownloadURL(storageRefer);
		} catch (error) {
			LOG.error(
				this.className,
				`${DB_LOG_IMAGE_UPLOAD_FAILED} ${movieName}`,
				error as Error
			);
			return '';
		}
	}

	/**
	 * Ensures the current user's users/<uid> node exists, seeding it on first sign-in with zeroed
	 * counters and the account-created milestone so the account page has a document to stream —
	 * the Firebase mirror of CloudBase's one-entry-per-user users collection. Connect codes are
	 * not seeded: account linking is CloudBase-only (see the boundary note above the connect stubs).
	 *
	 * @returns A promise that resolves when the node is verified or seeded.
	 */
	public async ensureUserStatsExist(): Promise<void> {
		const uid = this.firebaseAuth.currentUser?.uid;
		if (!uid) return;
		const userRef = dbRef(this.db, `${DATABASE_USERS}/${uid}`);
		const snapshot = await get(userRef);
		if (snapshot.exists()) return;
		await set(userRef, {
			[STATS_FIELD_TOTAL_FILMS]: 0,
			[STATS_FIELD_TOTAL_QUOTES]: 0,
			[STATS_FIELD_TOTAL_RECIPES]: 0,
			[STATS_FIELD_TOTAL_REMINDERS]: 0,
			[STATS_FIELD_COMPLETED_PRIVATE]: 0,
			[STATS_FIELD_COMPLETED_SHARED]: 0,
			[STATS_FIELD_TOTAL_DEBTS]: 0,
			[STATS_FIELD_TOTAL_LINKS]: 0,
			[STATS_FIELD_ACTIVITY_STREAK]: 0,
			[STATS_FIELD_ACTIVITY_STREAK_DATE]: '',
			[STATS_FIELD_MILESTONES]: {
				[MILESTONE_KEY_ACCOUNT_CREATED]: Utilities.formatDateForStorage(new Date())
			}
		});
	}

	/**
	 * Recomputes the current user's item totals from their owned documents and corrects any
	 * drifted counter on the users/<uid> node. Realtime Database has no server-side counts, so
	 * each collection is read once and filtered client-side to documents stamped with the user's
	 * uid — acceptable on an account-page load, where these collections are fetched anyway.
	 * Only the fields that differ are written.
	 *
	 * @returns A promise that resolves when any drifted totals have been corrected.
	 */
	public async reconcileUserStats(): Promise<void> {
		const uid = this.firebaseAuth.currentUser?.uid;
		if (!uid) return;

		// Step 1: Read every countable collection in parallel and count this user's documents
		const [movies, quotes, recipes, reminders, debts, links] = await Promise.all([
			get(this.moviesRef),
			get(dbRef(this.db, DATABASE_QUOTES)),
			get(dbRef(this.db, DATABASE_RECIPES)),
			get(dbRef(this.db, DATABASE_REMINDER)),
			get(dbRef(this.db, DATABASE_DEBT_SONATA)),
			get(dbRef(this.db, DATABASE_USEFUL_LINKS))
		]);
		const authoritative: Record<string, number> = {
			[STATS_FIELD_TOTAL_FILMS]: this.countOwnedDocs(movies, uid),
			[STATS_FIELD_TOTAL_QUOTES]: this.countOwnedDocs(quotes, uid),
			[STATS_FIELD_TOTAL_RECIPES]: this.countOwnedDocs(recipes, uid),
			[STATS_FIELD_TOTAL_REMINDERS]: this.countOwnedDocs(reminders, uid),
			[STATS_FIELD_TOTAL_DEBTS]: this.countOwnedDocs(debts, uid),
			// Links share their collection with categories — count only actual link rows
			[STATS_FIELD_TOTAL_LINKS]: this.countOwnedDocs(
				links,
				uid,
				(doc) => doc.type === USEFUL_LINK_TYPE_LINK
			)
		};

		// Step 2: Write back only the fields that drifted from the authoritative counts
		const userRef = dbRef(this.db, `${DATABASE_USERS}/${uid}`);
		const current = (await get(userRef)).val() ?? {};
		const drifted: Record<string, number> = {};
		for (const [field, count] of Object.entries(authoritative)) {
			if ((current[field] ?? 0) !== count) {
				drifted[field] = count;
			}
		}
		if (Object.keys(drifted).length > 0) {
			await update(userRef, drifted);
		}
	}

	/**
	 * Proxies an HTTP GET request through the proxyFetch callable Cloud Function to bypass browser
	 * CORS restrictions — the Firebase counterpart of CloudBase's fetchUrl function, with all URL
	 * and redirect validation done server-side. Used for RSS news feeds and link-title auto-fetch
	 * on the Portal page.
	 *
	 * @param url - The fully-qualified http/https URL to fetch.
	 * @returns The response body as a string and its Content-Type header value.
	 * @throws Error when the callable fails or reports an unsuccessful fetch.
	 */
	public async proxyFetch(url: string): Promise<{ content: string; contentType: string }> {
		const result = await this.callCloudFunction<{
			success: boolean;
			content?: string;
			contentType?: string;
			error?: string;
		}>('proxyFetch', { url });
		if (!result?.success) {
			throw new Error(`${DB_LOG_PROXY_FETCH_FAILED} ${url}`);
		}
		return { content: result.content ?? '', contentType: result.contentType ?? '' };
	}

	/**
	 * Changes one of the current user's item counters on their users/<uid> node by the given
	 * delta. Runs in a transaction so concurrent writes cannot lose increments, starting from 0
	 * when the field is absent. Failures surface to the caller — every call site treats stat
	 * updates as fire-and-forget with its own .catch.
	 *
	 * @param field - The field name constant to update (e.g. STATS_FIELD_TOTAL_FILMS).
	 * @param delta - The amount to change the counter — pass 1 to increment, -1 to decrement.
	 * @returns A promise that resolves when the update completes.
	 */
	private async updateUserStatCount(field: string, delta: 1 | -1): Promise<void> {
		const uid = this.firebaseAuth.currentUser?.uid;
		if (!uid) return;
		await runTransaction(
			dbRef(this.db, `${DATABASE_USERS}/${uid}/${field}`),
			(current: number | null) => Math.max(0, (current ?? 0) + delta)
		);
	}

	/**
	 * Decrements the current user's own item total for a removed item, but only when the item
	 * belongs to them. When another user's item is removed, this user's counter is left
	 * untouched — the owner's totals self-heal on their next account load via reconcileUserStats.
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
		if (ownerOpenid !== this.firebaseAuth.currentUser?.uid) return;
		this.updateUserStatCount(field, -1).catch(() => {});
	}

	/**
	 * Calls one of the app's callable Cloud Functions with the caller's Firebase auth context and
	 * returns its result payload. The functions SDK is imported lazily so it only loads when a
	 * callable-backed feature is actually used.
	 *
	 * {@link getPassphraseLockStatus} - Reads whether a passphrase is set for a feature key.
	 * {@link setPassphraseLock} - Sets or replaces a feature key's passphrase.
	 * {@link verifyPassphraseLock} - Verifies a passphrase attempt server-side.
	 * {@link removePassphraseLock} - Removes a feature key's passphrase.
	 * {@link proxyFetch} - Fetches a public URL server-side to bypass browser CORS.
	 *
	 * @param name - The deployed callable function name.
	 * @param data - The request payload for the function.
	 * @returns The function's result payload, or null when the call fails.
	 */
	private async callCloudFunction<T>(
		name: string,
		data: Record<string, string>
	): Promise<T | null> {
		try {
			const { getFunctions, httpsCallable } = await import('firebase/functions');
			const callable = httpsCallable(getFunctions(), name);
			const response = await callable(data);
			return response.data as T;
		} catch (error) {
			LOG.error(this.className, `${DB_LOG_CLOUD_FUNCTION_CALL_FAILED} ${name}`, error as Error);
			return null;
		}
	}

	/**
	 * Counts the documents in a collection snapshot owned by the given user, optionally applying
	 * an extra predicate (e.g. the link/category discriminator on the shared useful-links
	 * collection).
	 *
	 * {@link reconcileUserStats} - Counts each collection's owned documents during reconciliation.
	 *
	 * @param snapshot - The one-time snapshot of the whole collection.
	 * @param uid - The owner id a document's uid stamp must match.
	 * @param extraFilter - The optional additional predicate a document must satisfy.
	 * @returns The number of matching documents.
	 */
	private countOwnedDocs(
		snapshot: DataSnapshot,
		uid: string,
		extraFilter?: (doc: any) => boolean
	): number {
		let count = 0;
		snapshot.forEach((child) => {
			const doc = child.val();
			if (doc?.uid === uid && (!extraFilter || extraFilter(doc))) {
				count++;
			}
		});
		return count;
	}

	/**
	 * Maps a raw child snapshot into the app's document shape — the flat value plus its key, with
	 * the Firebase-native uid ownership stamp surfaced as _openid, the field name the shared
	 * components and CloudBase documents use. Firebase storage itself never carries _openid; the
	 * alias exists in memory only, at the read boundary.
	 *
	 * {@link getUsefulLinks} - Emits links with their owner surfaced for ownership checks.
	 * {@link getLinkCategories} - Emits the caller's own link categories.
	 * {@link getQuotes} - Emits quotes with their owner surfaced for ownership checks.
	 * {@link getReminderTableDetails} - Emits the caller's own reminders.
	 * {@link getDebtSonataTableDetails} - Emits the caller's own debt rows.
	 * {@link getVault} - Emits the caller's own vault records.
	 * {@link getPatchNotes} - Emits patch notes with their owner surfaced for permission checks.
	 *
	 * @param snapshot - The child snapshot to map.
	 * @returns The document with its key and the aliased ownership field.
	 */
	private toOwnedDoc(snapshot: any): any {
		const value = snapshot.val();
		return { key: snapshot.key, ...value, _openid: value?.uid ?? '' };
	}

	/**
	 * Maps a table name to the activity subtitle shape for a newly added record — a source plus the
	 * one display field that matters for that domain. Quotes surface the author; debt surfaces the
	 * record name; reminder surfaces the text; patch surfaces the component, element, and note index;
	 * links surface the domain (or category name, or the previous domain on deletion); recipes surface
	 * the name. Any other table yields the default source with an invalid-table message.
	 *
	 * @param tableName - The database collection name of the record being added.
	 * @param newRecord - The record that was just persisted.
	 * @returns An object carrying a source string and the display field appropriate for the table.
	 */
	private getRecentActivitySubtitle(
		tableName: string,
		newRecord: any
	): { source: string; [k: string]: any } {
		const record = newRecord as {
			author?: string;
			name?: string;
			text?: string;
			component?: string;
			element?: string;
			noteIndex?: string | number;
			type?: string;
			url?: string;
			domain?: string;
		};
		switch (tableName) {
			case DATABASE_QUOTES:
				return { source: ACTIVITY_SOURCE_RESONANCE, author: record.author ?? '' };
			case DATABASE_DEBT_SONATA:
				return { source: ACTIVITY_SOURCE_DEBT, name: record.name ?? '' };
			case DATABASE_REMINDER:
				return { source: ACTIVITY_SOURCE_REMINDER, text: record.text ?? '' };
			case DATABASE_PATCH_NOTES:
				return {
					source: ACTIVITY_SOURCE_PATCH,
					component: record.component ?? '',
					element: record.element ?? '',
					noteIndex: String(record.noteIndex ?? '')
				};
			case DATABASE_USEFUL_LINKS:
				/* Links and categories share the same collection; the `type` field distinguishes
				   them at write time — links carry a URL, categories carry a name, deletions carry
				   the previous domain string from the history document. */
				if (record.type === USEFUL_LINK_TYPE_LINK)
					return { source: ACTIVITY_SOURCE_LINK, domain: Utilities.getDomain(record.url ?? '') };
				else if (record.type === USEFUL_LINK_TYPE_CATEGORY)
					return { source: ACTIVITY_SOURCE_LINK, domain: record.name ?? '' };
				else if (
					record.type === HISTORY_STATUS_DELETED ||
					record.type === ACTIVITY_TYPE_CATEGORY_DELETED
				)
					return { source: ACTIVITY_SOURCE_LINK, domain: record.domain ?? '' };
				else return { source: ACTIVITY_SOURCE_DEFAULT, text: ACTIVITY_INVALID_TABLE_TEXT };
			case DATABASE_RECIPES:
				return { source: ACTIVITY_SOURCE_RECIPE, name: record.name ?? '' };
			default:
				return { source: ACTIVITY_SOURCE_DEFAULT, text: ACTIVITY_INVALID_TABLE_TEXT };
		}
	}

	/**
	 * Atomically increments or decrements a single counter field on the global statistics node.
	 * Errors are logged but not propagated — all callers treat stat updates as fire-and-forget.
	 *
	 * @param field - The stat field name to update (e.g. STATS_FIELD_TOTAL_FILMS).
	 * @param delta - The amount to change the counter by — positive to increment, negative to decrement.
	 * @returns A promise that resolves when the update completes.
	 */
	private async updateStatCount(field: string, delta: number): Promise<void> {
		try {
			await runTransaction(this.statisticsRef, (current: any) => {
				current ??= {};
				current[field] = (current[field] ?? 0) + delta;
				return current;
			});
		} catch (error) {
			LOG.error(this.className, DB_LOG_STAT_COUNT_UPDATE_FAILED, error as Error);
		}
	}

	/**
	 * Reads the current count of `field` from the global statistics node, then delegates to
	 * {@link checkAndWriteCountMilestone} to record the milestone when the threshold is met.
	 * Called fire-and-forget after each domain stat increment.
	 *
	 * @param field - The stat field to read the count from.
	 * @param domain - The milestone domain prefix (e.g. MILESTONE_DOMAIN_LINK).
	 * @returns A promise that resolves when the check (and optional milestone write) completes.
	 */
	private async checkAndWriteDomainMilestone(field: string, domain: string): Promise<void> {
		const snapshot = await get(this.statisticsRef);
		const currentData = snapshot.val() ?? {};
		const count = (currentData[field] as number) ?? 0;
		await this.checkAndWriteCountMilestone(domain, count);
	}

	/**
	 * Checks whether `count` is a milestone threshold (count === 1 or a multiple of 5) and, when the
	 * key is not already present in the milestones map on the global statistics node, writes the
	 * current date for it. Never overwrites a milestone that was already reached.
	 *
	 * {@link checkAndWriteDomainMilestone} - Calls this after reading the count from the stats node.
	 * {@link appendToActivityLog} - Calls this with the streak domain after updating the streak.
	 *
	 * @param domain - The milestone domain prefix (e.g. "link", "streak").
	 * @param count - The new count value to evaluate.
	 * @returns A promise that resolves when the check (and optional write) completes.
	 */
	private async checkAndWriteCountMilestone(domain: string, count: number): Promise<void> {
		// Step 1: Derive the milestone key — null when count is not a milestone threshold.
		const key = Utilities.getMilestoneKey(domain, count);
		if (!key) return;

		try {
			// Step 2: Read the current milestones map and guard against overwriting a reached milestone.
			const snapshot = await get(this.statisticsRef);
			const currentData = snapshot.val() ?? {};
			const milestones = (currentData[STATS_FIELD_MILESTONES] as Record<string, string>) ?? {};
			if (milestones[key]) return;

			/* Step 3: Write only the new milestone key, preserving sibling keys already in the map.
			   Firebase update() treats the slash-separated key as a deep path relative to statisticsRef,
			   so this writes statistics/milestones/<key> without touching other milestones. */
			await update(this.statisticsRef, {
				[`${STATS_FIELD_MILESTONES}/${key}`]: Utilities.formatDateForStorage(new Date())
			});
		} catch (error) {
			LOG.error(this.className, DB_LOG_MILESTONE_WRITE_FAILED, error as Error);
		}
	}

	/**
	 * Gets the reusable keys from the database.
	 *
	 * @returns The array of reusable key strings.
	 */
	private async getReusableKeys(): Promise<string[]> {
		try {
			const snapshot = await get(dbRef(this.db, 'statistics/reusableKeys'));
			LOG.info(this.className, DB_LOG_REUSABLE_KEYS_RETRIEVED);
			return snapshot.exists() ? (Object.values(snapshot.val()) as string[]) : [];
		} catch (error) {
			LOG.error(this.className, DB_LOG_REUSABLE_KEYS_GET_FAILED, error as Error);
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
				LOG.info(this.className, DB_LOG_REUSABLE_KEYS_UPDATED);
			})
			.catch((error: Error) => {
				LOG.error(this.className, DB_LOG_REUSABLE_KEYS_SAVE_FAILED, error);
				this.rethrowCaught(error);
			});
	}
}
