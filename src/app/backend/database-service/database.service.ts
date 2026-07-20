import { Injectable } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { MovieItemVO } from '../../fontend/entertainment/movieItem.vo';
import { Recipe } from '../../fontend/recipe/recipe.model';
import { VaultRecord, VaultNodeType } from '../../fontend/vault/vault.model';
import { TodayTask } from '../../fontend/today/today.model';
import { InjectionToken } from '@angular/core';
import { Utilities } from '../../common/utilities/app.utilities';
import { SessionExpiredError } from '../../common/error/session-expired.error';
import { UnexpectedError } from '../../common/error/unexpected.error';
import {
	NO_RATE,
	HISTORY_STATUS_ADDED,
	STATS_FIELDS_PUBLIC_PAGES,
	DATABASE_USEFUL_LINKS,
	DATABASE_RECIPES,
	DATABASE_DEBT_SONATA,
	DATABASE_PATCH_NOTES,
	DATABASE_VAULT,
	ACTIVITY_SOURCE_LINK,
	ACTIVITY_TYPE_UPDATED,
	ACTIVITY_TYPE_CATEGORY_UPDATED,
	ACTIVITY_SOURCE_RECIPE,
	ACTIVITY_SOURCE_DEBT,
	ACTIVITY_TYPE_LOCK_UPDATED,
	ACTIVITY_TYPE_STATUS_CHANGED,
	ACTIVITY_TYPE_EDITED,
	VAULT_VALUE_KEY_KIND,
	VAULT_KIND_NODE,
	VAULT_VALUE_KEY_NODE_TYPE,
	VAULT_VALUE_KEY_NAME,
	VAULT_VALUE_KEY_CATEGORIES,
	VAULT_VALUE_KEY_VERIFIED,
	ACTIVITY_SOURCE_VAULT,
	VAULT_KIND_EDGE,
	VAULT_VALUE_KEY_SOURCE_ID,
	VAULT_VALUE_KEY_TARGET_ID,
	VAULT_VALUE_KEY_RELATION,
	VAULT_KIND_CATEGORY,
	VAULT_VALUE_KEY_LABEL,
	VAULT_VALUE_KEY_HEX,
	VAULT_VALUE_KEY_GRADIENT,
	VAULT_VALUE_KEY_ICON,
	SEARCH
} from '../../common/constants';
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

/** Result returned by the passphrase-lock status Cloud Function. */
export interface PassphraseLockStatus {
	success: boolean;
	isSet: boolean;
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
	 * Gets the global and per-user stats documents combined into one object. Per-user values win on
	 * overlap, except the publicly-readable page stats, which always come from the global document.
	 * Emits after both underlying watches have produced a value, then on every subsequent change to
	 * either. Concrete on the base class so both backends share one implementation.
	 *
	 * @returns An observable that emits the merged stats object.
	 */
	public getCombinedStats(): Observable<any> {
		return combineLatest([this.getStatistics(), this.getUserStats()]).pipe(
			/* Re-applies the public-page stats from the global document last, so a per-user copy can
			   never shadow them — see STATS_FIELDS_PUBLIC_PAGES for which fields and why. Only fields
			   the global document actually carries are re-applied: an absent global doc (first emission,
			   or a denied read) would otherwise stamp every one of them as undefined and blank out the
			   per-user values that had just been merged in. */
			map(([generic, userSpecific]) => ({
				...generic,
				...userSpecific,
				...Object.fromEntries(
					STATS_FIELDS_PUBLIC_PAGES.filter((field) => generic?.[field] !== undefined).map(
						(field) => [field, generic[field]]
					)
				)
			}))
		);
	}

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
	 * Reports whether the caller has already set a passphrase for the given generic
	 * passphrase-lock feature key (e.g. 'vault'). Used to decide whether a page shows its
	 * first-time setup screen or its unlock prompt.
	 *
	 * @param featureKey - The generic passphrase-lock feature identifier.
	 * @returns A promise resolving to the status result.
	 */
	public abstract getPassphraseLockStatus(featureKey: string): Promise<PassphraseLockStatus>;

	/**
	 * Sets or replaces the caller's own passphrase for the given generic passphrase-lock feature
	 * key. Used for both first-time setup and later changes.
	 *
	 * @param featureKey - The generic passphrase-lock feature identifier.
	 * @param passphrase - The new plaintext passphrase.
	 * @returns A promise resolving to the set result.
	 */
	public abstract setPassphraseLock(featureKey: string, passphrase: string): Promise<ConnectResult>;

	/**
	 * Verifies a passphrase attempt against the caller's stored hash for the given generic
	 * passphrase-lock feature key. The hash never leaves the server.
	 *
	 * @param featureKey - The generic passphrase-lock feature identifier.
	 * @param passphrase - The plaintext passphrase attempt.
	 * @returns A promise resolving to the verify result.
	 */
	public abstract verifyPassphraseLock(featureKey: string, passphrase: string): Promise<ConnectResult>;

	/**
	 * Removes the caller's passphrase for the given feature key. Only that feature's entry is
	 * deleted — every other feature's passphrase and the feature's own data are never touched,
	 * so the page returns to first-time setup.
	 *
	 * @param featureKey - The generic passphrase-lock feature identifier.
	 * @returns A promise resolving to the removal result.
	 */
	public abstract removePassphraseLock(featureKey: string): Promise<ConnectResult>;

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
	public async updateUsefulLink(
		key: string,
		updates: Partial<{ url: string; title: string; category: string; isPinned: boolean }>,
		domain: string
	): Promise<void> {
		await this.updateTableExistingFields(DATABASE_USEFUL_LINKS, {
			entryKey: key,
			fields: { ...updates },
			source: ACTIVITY_SOURCE_LINK,
			type: ACTIVITY_TYPE_UPDATED,
			domain
		});
	}

	/**
	 * Updates an existing link category in the database.
	 *
	 * @param key - The key of the category to update.
	 * @param updates - The fields to update.
	 * @param name - The category name, recorded in the activity log.
	 */
	public async updateLinkCategory(
		key: string,
		updates: Partial<{ name: string; order: number }>,
		name: string
	): Promise<void> {
		await this.updateTableExistingFields(DATABASE_USEFUL_LINKS, {
			entryKey: key,
			fields: { ...updates },
			source: ACTIVITY_SOURCE_LINK,
			type: ACTIVITY_TYPE_CATEGORY_UPDATED,
			domain: name
		});
	}

	/**
	 * Updates an existing recipe in the database.
	 *
	 * @param recipe - The recipe to update. The `id` field identifies the document.
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
	 * Adds a new entry to history stating that a new rate-search activity has been started.
	 */
	public async updateHistoryWithNewSearchActivity(): Promise<void> {
		await this.addNewHistoryEntry(SEARCH);
	}

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

	/**
	 * Ensures the current user's per-user stats document exists, seeding it on first use so the
	 * account page always has a document to stream.
	 *
	 * @returns A promise that resolves when the document is verified or created.
	 */
	public abstract ensureUserStatsExist(): Promise<void>;

	/**
	 * Recomputes the current user's item totals against the authoritative per-collection counts
	 * and corrects any drifted stat field on the user's own document.
	 *
	 * @returns A promise that resolves when any drifted totals have been corrected.
	 */
	public abstract reconcileUserStats(): Promise<void>;

	/**
	 * Updates the given fields on a single table record in one round-trip, then records the supplied
	 * activity entry. The document key, the fields to write, and the activity payload are all passed
	 * as one record descriptor, so callers no longer record activity themselves. Implemented per
	 * backend since the underlying write and error-handling mechanics differ.
	 *
	 * {@link updateUsefulLink} - Updates link fields in the useful-links collection.
	 * {@link updateLinkCategory} - Updates category fields in the useful-links collection.
	 * {@link updateRecipe} - Updates recipe fields in the recipes collection.
	 * {@link updateSingleValueForDebtTable} - Updates a single field in the debt collection.
	 * {@link updateDebtFields} - Updates multiple fields in the debt collection.
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
	protected abstract updateTableExistingFields(tableName: string, newRecord: any): Promise<void>;

	/**
	 * Writes updated fields to a patch note document and appends an activity log entry. Implemented
	 * per backend since the underlying write mechanics differ.
	 *
	 * {@link updateStatusForOnePatchNote} - Records a status change.
	 * {@link updateDetailsForOnePatchNote} - Records a details edit.
	 *
	 * @param key - The document key of the patch note to update.
	 * @param updatedRecord - The updated record data.
	 * @param component - The component the note belongs to, recorded in the activity log.
	 * @param element - The element the note belongs to, recorded in the activity log.
	 * @param noteIndex - The 1-based position of the note in the table.
	 * @param activityType - The activity type constant to record in the log.
	 */
	protected abstract updateOnePatchNote(
		key: string,
		updatedRecord: any,
		component: string,
		element: string,
		noteIndex: number,
		activityType: string
	): Promise<void>;

	// ── Removal methods ──────────────────────────────────────────────────────

	/**
	 * Removes a useful link from the database and records the deletion in the activity log.
	 *
	 * @param key - The key of the link to remove.
	 * @param domain - The hostname of the removed link, recorded in the activity log.
	 * @param ownerOpenid - The _openid of the link's owner, so only the owner's counter is decremented.
	 */
	public abstract removeUsefulLink(key: string, domain: string, ownerOpenid: string): Promise<void>;

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
	 * @param ownerOpenid - The _openid of the quote's owner, so only the owner's counter is decremented.
	 */
	public abstract removeQuote(key: string, author: string, ownerOpenid: string): Promise<void>;

	/**
	 * Removes a recipe from the database and records the deletion in the activity log.
	 *
	 * @param recipeKey - The database ID of the recipe to delete.
	 * @param name - The recipe name, recorded in the activity log.
	 * @param ownerOpenid - The _openid of the recipe's owner, so only the owner's counter is decremented.
	 */
	public abstract removeRecipe(recipeKey: string, name: string, ownerOpenid: string): Promise<void>;

	/**
	 * Removes a movie from the database and updates the statistics accordingly.
	 *
	 * @param movieItemVO - The movie item to remove.
	 * @throws SessionExpiredError if the session has lapsed.
	 * @throws UnexpectedError if the removal fails for any other reason. Both backends propagate
	 *         rather than resolving, so a failed removal can never look like a success.
	 */
	public abstract removeMovieFromDatabase(movieItemVO: MovieItemVO): Promise<void>;

	/**
	 * Removes a record from the reminder table and records the deletion in the activity log.
	 *
	 * @param key - The key of the record to remove.
	 * @param text - The reminder text, recorded in the activity log.
	 * @param isShared - Whether the reminder is shared, so its deletion routes to the group feed.
	 * @param ownerOpenid - The _openid of the reminder's owner, so only the owner's counter is decremented.
	 */
	public abstract removeRecordFromReminderTable(
		key: string,
		text: string,
		isShared: boolean,
		ownerOpenid: string
	): Promise<void>;

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
	 * @param ownerOpenid - The _openid of the debt's owner, so only the owner's counter is decremented.
	 */
	public abstract removeRecordFromDebtTable(key: string, name: string, ownerOpenid: string): Promise<void>;

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
	public abstract removeVaultNode(nodeId: string, connectedEdgeIds: string[], name: string): Promise<void>;

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
	 * @throws SessionExpiredError if the session has lapsed.
	 * @throws UnexpectedError if the add fails for any other reason. Both backends propagate
	 *         rather than resolving, so a failed add can never look like a success.
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
	public async addNewRecordToPatchNotes(newRecord: any): Promise<void> {
		return this.addNewRecordToDB(DATABASE_PATCH_NOTES, {
			...newRecord,
			element: Utilities.capitalizeFirstLetterWithOthersUnchanged(newRecord.element.trim()),
			details: Utilities.capitalizeFirstLetterWithOthersUnchanged(newRecord.details.trim())
		});
	}

	/**
	 * Adds a new node (account, email, or phone) to the vault graph.
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
	 * Adds a new custom account category to the vault.
	 *
	 * @param category - The category content to persist, including its icon.
	 * @returns The database id of the newly created category document.
	 */
	public async addVaultCategory(category: {
		label: string;
		hex: string;
		gradient: string;
		icon: string;
	}): Promise<string> {
		return this.addVaultRecord({
			[VAULT_VALUE_KEY_KIND]: VAULT_KIND_CATEGORY,
			[VAULT_VALUE_KEY_LABEL]: category.label,
			[VAULT_VALUE_KEY_HEX]: category.hex,
			[VAULT_VALUE_KEY_GRADIENT]: category.gradient,
			[VAULT_VALUE_KEY_ICON]: category.icon
		});
	}

	/**
	 * Removes a custom account category and pulls its key from every account that carried it,
	 * so no account is left orphaned under a category that no longer exists.
	 *
	 * @param categoryKey - The document id of the category to remove.
	 * @param accountUpdates - The affected accounts, each with its category list already stripped of the removed key.
	 * @returns A promise that resolves when the category is removed and its accounts updated.
	 */
	public abstract removeVaultCategory(
		categoryKey: string,
		accountUpdates: { id: string; categories: string[] }[]
	): Promise<void>;

	/**
	 * Renames a custom account category and/or changes its icon by updating its stored fields.
	 *
	 * @param categoryKey - The document id of the category to update.
	 * @param fields - The new label and icon to store.
	 * @returns A promise that resolves when the category's fields are updated.
	 */
	public async updateVaultCategory(categoryKey: string, fields: { label: string; icon: string }): Promise<void> {
		await this.updateTableExistingFields(DATABASE_VAULT, {
			entryKey: categoryKey,
			fields: { [VAULT_VALUE_KEY_LABEL]: fields.label, [VAULT_VALUE_KEY_ICON]: fields.icon }
		});
	}

	/**
	 * Replaces an account node's category list with the given keys — used by the inline picker to
	 * add or remove categories on an account.
	 *
	 * @param nodeId - The id of the account node to update.
	 * @param categoryKeys - The full list of category keys to store on the account.
	 * @returns A promise that resolves when the account's categories are updated.
	 */
	public async updateVaultNodeCategories(nodeId: string, categoryKeys: string[]): Promise<void> {
		await this.updateTableExistingFields(DATABASE_VAULT, {
			entryKey: nodeId,
			fields: { [VAULT_VALUE_KEY_CATEGORIES]: categoryKeys }
		});
	}

	/**
	 * Sets an account node's verified flag — used by the inline verified toggle in the list view.
	 *
	 * @param nodeId - The id of the account node to update.
	 * @param verified - The new verified state to store on the account.
	 * @returns A promise that resolves when the account's verified flag is updated.
	 */
	public async updateVaultNodeVerified(nodeId: string, verified: boolean): Promise<void> {
		await this.updateTableExistingFields(DATABASE_VAULT, {
			entryKey: nodeId,
			fields: { [VAULT_VALUE_KEY_VERIFIED]: verified }
		});
	}

	/**
	 * Sets a vault node's display name — used by the inline account name edit in the list view and the
	 * name-edit dialog for non-account nodes.
	 *
	 * @param nodeId - The id of the node to update.
	 * @param name - The new display name to store.
	 * @returns A promise that resolves when the node's name is updated.
	 */
	public async updateVaultNodeName(nodeId: string, name: string): Promise<void> {
		await this.updateTableExistingFields(DATABASE_VAULT, {
			entryKey: nodeId,
			fields: { [VAULT_VALUE_KEY_NAME]: name }
		});
	}

	/**
	 * Adds a new document to the given collection and records an activity log entry, auto-deriving the
	 * activity source/subtitle from the table name. Implemented per backend since the underlying write
	 * and error-handling mechanics differ.
	 *
	 * {@link addUsefulLink} - Adds a link to the useful-links collection.
	 * {@link addLinkCategory} - Adds a category to the useful-links collection.
	 * {@link addQuote} - Adds a quote to the quotes collection.
	 * {@link addRecipe} - Adds a recipe to the recipes collection.
	 * {@link addNewRecordToReminder} - Adds a record to the reminder collection.
	 * {@link addNewRecordToPatchNotes} - Adds a record to the patch notes collection.
	 *
	 * @param tableName - The database collection name.
	 * @param newRecord - The new record to add.
	 */
	protected abstract addNewRecordToDB(tableName: string, newRecord: any): Promise<void>;

	/**
	 * Adds a vault document and returns its new id. Implemented per backend since the underlying write
	 * mechanics differ.
	 *
	 * {@link addVaultNode} - Adds an account / email / phone node.
	 * {@link addVaultEdge} - Adds a link between two nodes.
	 * {@link addVaultCategory} - Adds a custom category.
	 *
	 * @param content - The document content with its kind discriminator and value fields.
	 * @returns The database id of the newly created document.
	 */
	protected abstract addVaultRecord(content: Record<string, unknown>): Promise<string>;

	/**
	 * Records an activity log entry. Implemented per backend since the underlying write mechanics
	 * differ; called directly by {@link addVaultNode} (the other add/update wrappers log activity
	 * internally via {@link addNewRecordToDB} or {@link updateTableExistingFields} instead).
	 *
	 * @param activity - The activity payload to record.
	 */
	protected abstract appendToActivityLog(activity: any): Promise<void>;

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
	 * A failed upload is deliberately not fatal — the movie is still worth adding without a
	 * cover — so both backends log and return an empty string rather than throwing. Callers
	 * must treat an empty result as "no cover" instead of storing it as a link.
	 *
	 * @param coverImage - The movie cover blob to upload.
	 * @param movieName - The name of the movie (used as the filename in storage).
	 * @returns The downloadable link, or an empty string when the upload failed.
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
			const rate = movieItemVO.hasRate() ? movieItemVO.getMovieRate() : NO_RATE;
			const rateStr = `${ENT_HISTORY_RATE_OPEN}${rate}${ENT_HISTORY_RATE_CLOSE}`;
			const nameGenre = `${movieItemVO.getMovieName()} - ${movieItemVO.getMovieGenre()}`;
			const statusLabel =
				status === HISTORY_STATUS_ADDED ? ENT_HISTORY_STATUS_ADDED : ENT_HISTORY_STATUS_DELETED;
			if (ACTIVE_LOCALE === 'zh') {
				return `在${timestamp}${statusLabel} ${nameGenre}${rateStr}`;
			}
			return `${nameGenre} ${rateStr} was ${statusLabel} on ${timestamp}`;
		}
		return `${ENT_HISTORY_SEARCH_STARTED}${timestamp}`;
	}

	/**
	 * Re-throws SessionExpiredError as-is so callers can route it to the retry dialog; wraps
	 * everything else in UnexpectedError so no raw SDK error escapes the data layer untyped.
	 * Both FirebaseService and CloudbaseService call this shared implementation so the two
	 * backends surface failures identically.
	 *
	 * @param error - The caught value from a catch block.
	 * @throws SessionExpiredError if the caught value is already that type.
	 * @throws UnexpectedError for every other caught value.
	 */
	protected rethrowCaught(error: unknown): never {
		if (error instanceof SessionExpiredError) throw error;
		throw new UnexpectedError();
	}
}
