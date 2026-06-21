import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MovieItemVO } from '../../fontend/entertainment/movieItem.vo';
import { Recipe } from '../../fontend/recipe/recipe.model';
import { InjectionToken } from '@angular/core';
import { NO_RATE } from '../../common/app.constant';
import type cloudbase from '@cloudbase/js-sdk';
import type { Auth } from 'firebase/auth';
import type { Database } from 'firebase/database';
import type { FirebaseStorage } from 'firebase/storage';
export type CloudbaseApp = ReturnType<typeof cloudbase.init>;
export const CLOUDBASE = new InjectionToken<CloudbaseApp>('CLOUDBASE');
export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH');
export const FIREBASE_DATABASE = new InjectionToken<Database>('FIREBASE_DATABASE');
export const FIREBASE_STORAGE = new InjectionToken<FirebaseStorage>('FIREBASE_STORAGE');

@Injectable({ providedIn: 'root' })
export abstract class DatabaseService {
	protected constructor() {}

	////////////////////// Below are Retrieval methods for database records ////////////////

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

	////////////////////// Below are Update methods for database records /////////////////////

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
	 */
	public abstract updateReminderTable(
		entryKey: string,
		valueKey: string,
		value: any,
		text: string
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

	////////////////////// Below are Removal methods for database records ////////////////

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
	 */
	public abstract removeRecordFromReminderTable(key: string, text: string): Promise<void>;

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
	 * Removes the current user's push subscription from the database, stopping
	 * future notifications until the user re-subscribes.
	 */
	public abstract deletePushSubscription(): Promise<void>;

	////////////////////// Below are Add methods for database records /////////////////////

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
	 * Saves the user's Web Push subscription to the database so the server-side
	 * notification function can dispatch push messages on their behalf.
	 *
	 * @param subscription - The serialised PushSubscription from the browser Push API.
	 */
	public abstract addPushSubscription(subscription: PushSubscriptionJSON): Promise<void>;

	////////////////////// Below are Utility methods for database records /////////////////////

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
			return `${movieItemVO.getMovieName()} - ${movieItemVO.getMovieGenre()} (Rate: ${rate}) was ${status} on ${timestamp}`;
		}
		return `New rate search was started on ${timestamp}`;
	}
}
