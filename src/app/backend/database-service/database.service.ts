import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MovieItemVO } from '../../fontend/entertainment/movieItem.vo';
import { Recipe } from '../../fontend/recipe/recipe.model';
import { VaultRecord, VaultNodeType } from '../../fontend/vault/vault.model';
import { TodayTask } from '../../fontend/today/today.model';
import { InjectionToken } from '@angular/core';
import { NO_RATE, HISTORY_STATUS_ADDED } from '../../common/constants';
import {
	ACTIVE_LOCALE,
	ENT_HISTORY_RATE_OPEN,
	ENT_HISTORY_RATE_CLOSE,
	ENT_HISTORY_STATUS_ADDED,
	ENT_HISTORY_STATUS_DELETED,
	ENT_HISTORY_SEARCH_STARTED
} from '../../common/locale/locale-strings';
import type cloudbase from '@cloudbase/js-sdk';
import type { Auth } from 'firebase/auth';
import type { Database } from 'firebase/database';
import type { FirebaseStorage } from 'firebase/storage';
export type CloudbaseApp = ReturnType<typeof cloudbase.init>;
export const CLOUDBASE = new InjectionToken<CloudbaseApp>('CLOUDBASE');
export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH');
export const FIREBASE_DATABASE = new InjectionToken<Database>('FIREBASE_DATABASE');
export const FIREBASE_STORAGE = new InjectionToken<FirebaseStorage>('FIREBASE_STORAGE');

/** Result returned by the connect/disconnect Cloud Functions. */
export interface ConnectResult {
	success: boolean;
	error?: string;
}

/** A connected group member, surfaced in the Account security panel. */
export interface ConnectedMember {
	openid: string;
	name: string;
	status?: string;
}

@Injectable({ providedIn: 'root' })
export abstract class DatabaseService {
	protected constructor() {}

	// ── Retrieval methods ────────────────────────────────────────────────────

	/**
	 * Gets the statistics document from the database as a reactive observable.
	 *
	 * @returns An observable that emits the statistics.
	 */
	public abstract getStatistics(): Observable<any>;

	/**
	 * Gets the current user's per-user stats document as a real-time observable.
	 *
	 * @returns An observable that emits the user's stats document, or undefined when absent.
	 */
	public abstract getUserStats(): Observable<any>;

	/**
	 * Gets the date calculator table details from the database as a reactive observable.
	 *
	 * @returns An observable that emits the date calculator table details.
	 */
	public abstract getDateCalculatorTableDetails(): Observable<any[]>;

	/**
	 * Gets the useful links from the database as a reactive observable.
	 *
	 * @returns An observable that emits the useful links list.
	 */
	public abstract getUsefulLinks(): Observable<any[]>;

	/**
	 * Gets the link categories from the database as a reactive observable.
	 *
	 * @returns An observable that emits the link categories list.
	 */
	public abstract getLinkCategories(): Observable<any[]>;

	/**
	 * Gets the quotes from the database as a reactive observable.
	 *
	 * @returns An observable that emits the quotes list.
	 */
	public abstract getQuotes(): Observable<any[]>;

	/**
	 * Gets all recipes for the current user from the database.
	 *
	 * @returns An observable that emits the recipe list.
	 */
	public abstract getRecipes(): Observable<Recipe[]>;

	/**
	 * Gets the movie list from the database as a reactive observable.
	 *
	 * @returns An observable that emits the movie list.
	 */
	public abstract getMovieList(): Observable<MovieItemVO[]>;

	/**
	 * Gets the history list from the database as a reactive observable.
	 *
	 * @returns An observable that emits the history list.
	 */
	public abstract getHistory(): Observable<any[]>;

	/**
	 * Gets the reminder table details from the database as a reactive observable.
	 *
	 * @returns An observable that emits the reminder table details.
	 */
	public abstract getReminderTableDetails(): Observable<any[]>;

	/**
	 * Gets the shared activity feed for the current user and their connections, merged into the home feed.
	 *
	 * @returns A promise resolving to the shared activity entries, empty when the user has no connections.
	 */
	public abstract getSharedRecentActivity(): Promise<any[]>;

	/**
	 * Sends a connect request to the account owning the given connect code.
	 *
	 * @param code - The target account's connect code.
	 * @returns A promise resolving to the request result.
	 */
	public abstract sendConnectRequest(code: string): Promise<ConnectResult>;

	/**
	 * Dismisses one of the user's own sent connect requests by the target openid.
	 *
	 * @param toOpenid - The target openid of the outgoing request to remove.
	 * @returns A promise that resolves when the dismissal completes.
	 */
	public abstract clearOutgoingRequest(toOpenid: string): Promise<void>;

	/**
	 * Cancels a still-pending connect request the user sent, withdrawing it from both sides.
	 *
	 * @param toOpenid - The target openid the request was sent to.
	 * @returns A promise resolving to the cancel result.
	 */
	public abstract cancelConnectRequest(toOpenid: string): Promise<ConnectResult>;

	/**
	 * Approves or declines a pending connect request from the given account.
	 *
	 * @param fromOpenid - The openid of the requesting account.
	 * @param accept - True to approve and link, false to decline.
	 * @returns A promise resolving to the response result.
	 */
	public abstract respondConnectRequest(fromOpenid: string, accept: boolean): Promise<ConnectResult>;

	/**
	 * Leaves a single connection — removes the pairwise link and marks both records 'leave'.
	 *
	 * @param otherOpenid - The openid of the connected account to leave.
	 * @returns A promise resolving to the disconnect result.
	 */
	public abstract disconnect(otherOpenid: string): Promise<ConnectResult>;

	/**
	 * Clears a resolved (left) connection record from the current user's own connections list.
	 *
	 * @param otherOpenid - The openid of the connection record to remove.
	 * @returns A promise that resolves when the update completes.
	 */
	public abstract clearConnection(otherOpenid: string): Promise<void>;

	/**
	 * Gets the Account Expenses (debt sonata) table details from the database as a reactive observable.
	 *
	 * @returns An observable that emits the Account Expenses table details.
	 */
	public abstract getDebtSonataTableDetails(): Observable<any[]>;

	/**
	 * Gets the patch notes from the database as a reactive observable.
	 *
	 * @returns An observable that emits the patch notes.
	 */
	public abstract getPatchNotes(): Observable<any[]>;

	/**
	 * Gets the release notes from the database as a one-shot observable, ordered newest first.
	 *
	 * @returns An observable that emits the release notes list.
	 */
	public abstract getReleaseNotes(): Observable<any[]>;

	/**
	 * Gets the current user's vault graph (nodes, edges, custom categories) as a real-time observable.
	 *
	 * @returns An observable that emits the vault records list.
	 */
	public abstract getVault(): Observable<VaultRecord[]>;

	// ── Update methods ───────────────────────────────────────────────────────

	/**
	 * Updates the date calculator table with the given data.
	 *
	 * @param updatedTable - The updated table data.
	 */
	public abstract updateDateCalculatorTable(updatedTable: any): Promise<void>;

	/**
	 * Updates an existing useful link in the database and records the change in the activity log.
	 *
	 * @param key - The key of the link to update.
	 * @param updates - The fields to update.
	 * @param domain - The hostname of the updated link, recorded in the activity log.
	 */
	public abstract updateUsefulLink(
		key: string,
		updates: Partial<{ url: string; title: string; category: string; isPinned: boolean }>,
		domain: string
	): Promise<void>;

	/**
	 * Updates an existing link category in the database.
	 *
	 * @param key - The key of the category to update.
	 * @param updates - The fields to update.
	 * @param name - The category name, recorded in the activity log.
	 */
	public abstract updateLinkCategory(
		key: string,
		updates: Partial<{ name: string; order: number }>,
		name: string
	): Promise<void>;

	/**
	 * Updates an existing recipe in the database.
	 *
	 * @param recipe - The recipe to update. The `id` field identifies the document.
	 */
	public abstract updateRecipe(recipe: Recipe): Promise<void>;

	/**
	 * Adds a new entry to history stating that a new rate-search activity has been started.
	 */
	public abstract updateHistoryWithNewSearchActivity(): Promise<void>;

	/**
	 * Updates the movie rate in the database.
	 *
	 * @param movieItemVO - The movie item to update.
	 */
	public abstract updateMovieRate(movieItemVO: MovieItemVO): Promise<void>;

	/**
	 * Updates the movie genre in the database.
	 *
	 * @param movieKey - The key of the movie to update.
	 * @param oldGenre - The old genre value.
	 * @param newGenre - The new genre value.
	 * @param title - The movie title, recorded in the activity log.
	 */
	public abstract updateMovieGenre(
		movieKey: string,
		oldGenre: string,
		newGenre: string,
		title: string
	): Promise<void>;

	/**
	 * Updates the isFavourite flag for the given movie in the database.
	 *
	 * @param movieKey - The key of the movie to update.
	 * @param isFavourite - The boolean value to set.
	 * @param title - The movie title, recorded in the activity log.
	 */
	public abstract updateMovieFavourite(
		movieKey: string,
		isFavourite: boolean,
		title: string
	): Promise<void>;

	/**
	 * Updates a single field value in the reminder table and records the change in the activity log.
	 *
	 * @param entryKey - The key of the entry to update.
	 * @param valueKey - The key of the value to update.
	 * @param value - The new value to store.
	 * @param text - The reminder text, recorded in the activity log.
	 * @param isShared - Whether the reminder is shared, so its activity routes to the group feed.
	 */
	public abstract updateReminderTable(
		entryKey: string,
		valueKey: string,
		value: any,
		text: string,
		isShared: boolean
	): Promise<void>;

	/**
	 * Updates a single field value in the debt table and records the change in the activity log.
	 *
	 * @param entryKey - The key of the entry to update.
	 * @param valueKey - The key of the value to update.
	 * @param value - The new value to store.
	 * @param name - The debt entry name, recorded in the activity log.
	 * @param type - The activity log type. Defaults to ACTIVITY_TYPE_LOCK_UPDATED.
	 */
	public abstract updateSingleValueForDebtTable(
		entryKey: string,
		valueKey: string,
		value: any,
		name: string,
		type?: string
	): Promise<void>;

	/**
	 * Updates multiple fields on a single debt record in one round-trip.
	 * Appends an activity log entry when a name is provided.
	 *
	 * @param entryKey - The key of the entry to update.
	 * @param fields - A record of field names and their new values.
	 * @param name - The debt entry name, recorded in the activity log. Omit to skip logging.
	 */
	public abstract updateDebtFields(
		entryKey: string,
		fields: Record<string, unknown>,
		name?: string
	): Promise<void>;

	/**
	 * Resets a debt record to its original amount and removes all payment history
	 * in a single round-trip, using the database remove command to delete the payments field.
	 * Records the reset in the activity log.
	 *
	 * @param entryKey - The key of the entry to reset.
	 * @param originalAmount - The original debt amount to restore.
	 * @param paid - The paid status to restore.
	 * @param name - The debt entry name, recorded in the activity log.
	 */
	public abstract resetDebtRecord(
		entryKey: string,
		originalAmount: number,
		paid: boolean,
		name: string
	): Promise<void>;

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
	public abstract updateStatusForOnePatchNote(
		key: string,
		updatedRecord: any,
		component: string,
		element: string,
		noteIndex: number
	): Promise<void>;

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
	public abstract updateDetailsForOnePatchNote(
		key: string,
		updatedRecord: any,
		component: string,
		element: string,
		noteIndex: number
	): Promise<void>;

	/**
	 * Updates specific fields in the statistics document.
	 * Used by page components to sync their data into the shared statistics collection
	 * while the page is active. The call is naturally lifecycle-scoped — components
	 * unsubscribe (or lose their subscription) on destroy, stopping further updates.
	 *
	 * @param fields - A flat or nested record of fields to merge into the statistics document.
	 */
	public abstract updateStatisticsFields(fields: Record<string, any>): Promise<void>;

	/**
	 * Merges the given fields into the current user's per-user stats document.
	 * Targets the document flagged with `isUserStats: true` that is owned by the current user —
	 * distinct from the shared statistics document updated by {@link updateStatisticsFields}.
	 *
	 * @param fields - Fields to merge into the per-user stats document.
	 * @returns A promise that resolves when the update completes.
	 */
	public abstract updateUserStatsFields(fields: Record<string, any>): Promise<void>;

	// ── Removal methods ──────────────────────────────────────────────────────

	/**
	 * Removes a useful link from the database and records the deletion in the activity log.
	 *
	 * @param key - The key of the link to remove.
	 * @param domain - The hostname of the removed link, recorded in the activity log.
	 */
	public abstract removeUsefulLink(key: string, domain: string): Promise<void>;

	/**
	 * Removes a link category from the database and records the deletion in the activity log.
	 *
	 * @param key - The key of the category to remove.
	 * @param name - The category name, recorded in the activity log.
	 */
	public abstract removeLinkCategory(key: string, name: string): Promise<void>;

	/**
	 * Removes a quote from the database.
	 *
	 * @param key - The key of the quote to remove.
	 * @param author - The author of the quote (used for activity log).
	 */
	public abstract removeQuote(key: string, author: string): Promise<void>;

	/**
	 * Removes a recipe from the database and records the deletion in the activity log.
	 *
	 * @param recipeKey - The database ID of the recipe to delete.
	 * @param name - The recipe name, recorded in the activity log.
	 */
	public abstract removeRecipe(recipeKey: string, name: string): Promise<void>;

	/**
	 * Removes a movie from the database and updates the statistics accordingly.
	 *
	 * @param movieItemVO - The movie item to remove.
	 */
	public abstract removeMovieFromDatabase(movieItemVO: MovieItemVO): Promise<void>;

	/**
	 * Removes a record from the reminder table and records the deletion in the activity log.
	 *
	 * @param key - The key of the record to remove.
	 * @param text - The reminder text, recorded in the activity log.
	 * @param isShared - Whether the reminder is shared, so its deletion routes to the group feed.
	 */
	public abstract removeRecordFromReminderTable(key: string, text: string, isShared: boolean): Promise<void>;

	/**
	 * Completes the current user's own (private) reminder: removes the document and records the
	 * completion as a distinct 'completed' activity (not a deletion).
	 *
	 * @param key - The document key of the reminder being completed.
	 * @param text - The reminder text, recorded in the activity log.
	 */
	public abstract completeReminder(key: string, text: string): Promise<void>;

	/**
	 * Removes a record from the debt table and records the deletion in the activity log.
	 *
	 * @param key - The key of the record to remove.
	 * @param name - The debt entry name, recorded in the activity log.
	 */
	public abstract removeRecordFromDebtTable(key: string, name: string): Promise<void>;

	/**
	 * Removes a single payment entry from the debt record and restores the balance, in one DB write.
	 *
	 * @param entryKey - The key of the debt record.
	 * @param index - The index of the payment history entry to remove.
	 * @param updatedDebt - The restored debt balance after the payment is removed.
	 * @param name - The debt name, recorded in the activity log.
	 */
	public abstract removeSingleHistoryFromDebt(
		entryKey: string,
		index: number,
		updatedDebt: number,
		name: string
	): Promise<void>;

	/**
	 * Removes a patch note from the database and records the deletion in the activity log.
	 *
	 * @param key - The document key of the patch note to remove.
	 * @param component - The component name of the deleted note, recorded in the activity log.
	 * @param element - The element name of the deleted note, recorded in the activity log.
	 * @param noteIndex - The 1-based display index of the deleted note, recorded in the activity log.
	 */
	public abstract removePatchNote(
		key: string,
		component: string,
		element: string,
		noteIndex: number
	): Promise<void>;

	/**
	 * Removes a link (edge) from the vault graph.
	 *
	 * @param key - The document key of the edge to remove.
	 */
	public abstract removeVaultEdge(key: string): Promise<void>;

	/**
	 * Removes a vault node and every edge connected to it, then records the
	 * removal in the activity log.
	 *
	 * @param nodeId - The document key of the node to remove.
	 * @param connectedEdgeIds - The document keys of every edge attached to this node.
	 * @param name - The node's display name, recorded in the activity log.
	 */
	public abstract removeVaultNode(
		nodeId: string,
		connectedEdgeIds: string[],
		name: string
	): Promise<void>;

	/**
	 * Gets whether Tauri desktop push notifications are enabled for the current user.
	 *
	 * @returns True when a Tauri notification preference record exists in the database.
	 */
	public abstract getTauriNotifEnabled(): Promise<boolean>;

	/**
	 * Persists the Tauri desktop notification preference for the current user.
	 * Creates the record when enabled, removes it when disabled.
	 *
	 * @param enabled - The desired enabled state.
	 */
	public abstract setTauriNotifEnabled(enabled: boolean): Promise<void>;

	/**
	 * Gets whether the desktop app minimizes to Dock on close for the current user.
	 *
	 * @returns True when the minimize-on-close flag is set in the database.
	 */
	public abstract getMinimizeOnClose(): Promise<boolean>;

	/**
	 * Persists the minimize-on-close preference for the current user.
	 *
	 * @param enabled - The desired enabled state.
	 */
	public abstract setMinimizeOnClose(enabled: boolean): Promise<void>;

	/**
	 * Gets the display locale preference for the current user.
	 *
	 * @returns The stored locale ('en' or 'zh'), or null when not yet set.
	 */
	public abstract getLocale(): Promise<'en' | 'zh' | null>;

	/**
	 * Persists the display locale preference for the current user.
	 *
	 * @param locale - The locale key to store: 'en' or 'zh'.
	 */
	public abstract setLocale(locale: 'en' | 'zh'): Promise<void>;

	/**
	 * Gets the backed-up Today page items (timed, untimed, and tracked) for the current user.
	 *
	 * @returns The stored Today items, or an empty array when none are backed up or the user is signed out.
	 */
	public abstract getTodayItems(): Promise<TodayTask[]>;

	/**
	 * Persists the full set of locally created Today items for the current user, replacing any prior backup.
	 *
	 * @param items - The complete list of Today items to store; an empty array clears the backup.
	 */
	public abstract saveTodayItems(items: TodayTask[]): Promise<void>;

	// ── Add methods ──────────────────────────────────────────────────────────

	/**
	 * Adds a new useful link to the database.
	 *
	 * @param link - The link object to add.
	 */
	public abstract addUsefulLink(link: {
		url: string;
		title: string;
		category: string;
		visitCount: number;
		createdAt: string;
		isPinned: boolean;
		isShared?: boolean;
	}): Promise<void>;

	/**
	 * Adds a new link category to the database.
	 *
	 * @param category - The category object to add.
	 */
	public abstract addLinkCategory(category: { name: string; order: number }): Promise<void>;

	/**
	 * Adds a new quote to the database.
	 *
	 * @param text - The quote text.
	 * @param author - The author of the quote.
	 * @param timestamp - The timestamp of the quote.
	 */
	public abstract addQuote(text: string, author: string, timestamp: string): Promise<void>;

	/**
	 * Adds a new recipe to the database.
	 *
	 * @param recipe - The recipe to persist. The `id` field is ignored; the database assigns one.
	 */
	public abstract addRecipe(recipe: Recipe): Promise<void>;

	/**
	 * Adds a new movie to the database and updates the statistics accordingly.
	 *
	 * @param movieItemVO - The movie item to add.
	 */
	public abstract addNewMovieDataAndUpdateStatistics(movieItemVO: MovieItemVO): Promise<void>;

	/**
	 * Adds a new history entry with the given status and optional movie data.
	 *
	 * @param status - The status of the activity.
	 * @param movieItemVO - The movie item associated with the activity.
	 */
	protected abstract addNewHistoryEntry(status: string, movieItemVO?: MovieItemVO): Promise<void>;

	/**
	 * Adds a new record to reminder table.
	 *
	 * @param newRecord - The new record to add.
	 */
	public abstract addNewRecordToReminder(newRecord: any): Promise<void>;

	/**
	 * Adds a new record to the debt table.
	 *
	 * @param newRecord - The new record to add.
	 */
	public abstract addNewRecordToDebt(newRecord: any): Promise<void>;

	/**
	 * Adds a new record to the patch notes collection and logs it to the recent activity feed.
	 *
	 * @param newRecord - The record to add, with a noteIndex field appended by the caller.
	 */
	public abstract addNewRecordToPatchNotes(newRecord: any): Promise<void>;

	/**
	 * Adds a new node (account, email, or phone) to the vault graph.
	 *
	 * @param node - The node content to persist.
	 * @returns The database id of the newly created node document.
	 */
	public abstract addVaultNode(node: {
		nodeType: VaultNodeType;
		name: string;
		category: string;
		verified: boolean;
	}): Promise<string>;

	/**
	 * Adds a new link between two vault nodes.
	 *
	 * @param edge - The edge content to persist.
	 */
	public abstract addVaultEdge(edge: {
		sourceId: string;
		targetId: string;
		relation: string;
	}): Promise<void>;

	/**
	 * Adds a new custom account category to the vault.
	 *
	 * @param category - The category content to persist.
	 * @returns The database id of the newly created category document.
	 */
	public abstract addVaultCategory(category: {
		label: string;
		hex: string;
		gradient: string;
	}): Promise<string>;

	/**
	 * Removes a custom account category and reassigns every account that used it to Uncategorized,
	 * so no account is left orphaned under a category that no longer exists.
	 *
	 * @param categoryKey - The document id of the category to remove.
	 * @param accountIds - The ids of the account nodes currently in that category.
	 * @returns A promise that resolves when the category is removed and its accounts reassigned.
	 */
	public abstract removeVaultCategory(categoryKey: string, accountIds: string[]): Promise<void>;

	/**
	 * Reassigns a single account node to the given category — used to categorize an account after
	 * creation (e.g. moving an Uncategorized account into a custom category).
	 *
	 * @param nodeId - The id of the account node to update.
	 * @param categoryKey - The category key to assign.
	 * @returns A promise that resolves when the account's category is updated.
	 */
	public abstract updateVaultNodeCategory(nodeId: string, categoryKey: string): Promise<void>;

	// ── Utility methods ───────────────────────────────────────────────────────

	/**
	 * Increments the visit count for a useful link.
	 *
	 * @param key - The key of the link.
	 * @param currentCount - The current visit count.
	 */
	public abstract incrementLinkVisit(key: string, currentCount: number): Promise<void>;

	/**
	 * Checks whether a given movie has already been added to the database.
	 *
	 * @param movieName - The name of the movie to check.
	 * @param movieYear - The year of the movie to check.
	 * @param movieId - The ID of the movie to check.
	 * @returns True if the movie already exists, otherwise false.
	 */
	public abstract isMovieAlreadyAdded(
		movieName: string,
		movieYear: number,
		movieId: number
	): Promise<boolean>;

	/**
	 * Uploads the movie cover image to storage and returns the downloadable link.
	 *
	 * @param coverImage - The movie cover blob to upload.
	 * @param movieName - The name of the movie (used as the filename in storage).
	 * @returns A string that represents the downloadable link of the movie cover.
	 */
	public abstract uploadImageAndGetDownloadLink(coverImage: Blob, movieName: string): Promise<string>;

	/**
	 * Proxies an HTTP GET request to bypass browser CORS restrictions.
	 * Used for RSS news feeds and link-title auto-fetch on the Portal page.
	 *
	 * @param url - The fully-qualified http/https URL to fetch.
	 * @returns The response body as a string and its Content-Type header value.
	 */
	public abstract proxyFetch(url: string): Promise<{ content: string; contentType: string }>;

	/**
	 * Builds a human-readable history message for a database entry.
	 * Both FirebaseService and CloudbaseService call this shared implementation
	 * so the wording stays consistent across backends.
	 *
	 * @param status - The activity status (e.g. 'added', 'deleted', 'search').
	 * @param timestamp - The formatted timestamp string.
	 * @param movieItemVO - The optional movie item associated with the activity.
	 * @returns A formatted message string for the history collection.
	 */
	protected buildHistoryMessage(status: string, timestamp: string, movieItemVO?: MovieItemVO): string {
		if (movieItemVO) {
			const rate = movieItemVO.getMovieRate() === 0 ? NO_RATE : movieItemVO.getMovieRate();
			const rateStr = `${ENT_HISTORY_RATE_OPEN}${rate}${ENT_HISTORY_RATE_CLOSE}`;
			const nameGenre = `${movieItemVO.getMovieName()} - ${movieItemVO.getMovieGenre()}`;
			const statusLabel = status === HISTORY_STATUS_ADDED ? ENT_HISTORY_STATUS_ADDED : ENT_HISTORY_STATUS_DELETED;
			if (ACTIVE_LOCALE === 'zh') {
				return `在${timestamp}${statusLabel} ${nameGenre}${rateStr}`;
			}
			return `${nameGenre} ${rateStr} was ${statusLabel} on ${timestamp}`;
		}
		return `${ENT_HISTORY_SEARCH_STARTED}${timestamp}`;
	}
}
