import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MovieItemVO } from '../../fontend/entertainment/movieItem.vo';
import { InjectionToken } from '@angular/core';
import { NO_RATE } from '../../common/app.constant';
import type cloudbase from '@cloudbase/js-sdk';
export type CloudbaseApp = ReturnType<typeof cloudbase.init>;
export const CLOUDBASE = new InjectionToken<CloudbaseApp>('CLOUDBASE');

@Injectable({ providedIn: 'root' })
export abstract class DatabaseService {
	protected constructor() {}

	/**
	 * Build a human-readable history message for a database entry.
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
			const rate = movieItemVO.getMovieRate() == 0 ? NO_RATE : movieItemVO.getMovieRate();
			return `${movieItemVO.getMovieName()} - ${movieItemVO.getMovieGenre()} (Rate: ${rate}) was ${status} on ${timestamp}`;
		}
		return `New rate search was started on ${timestamp}`;
	}

	/**
	 * Upload the movie cover image to storage and return the downloadable link.
	 *
	 * @param coverImage - The movie cover blob to upload.
	 * @param movieName - The name of the movie (used as the filename in storage).
	 * @returns A string that represents the downloadable link of the movie cover.
	 */
	public abstract uploadImageAndGetDownloadLink(coverImage: Blob, movieName: string): Promise<string>;

	/**
	 * Get the movie list from the database.
	 *
	 * @returns An observable that emits the movie list.
	 */
	public abstract getMovieList(): Observable<MovieItemVO[]>;

	/**
	 * Get the statistics from the database.
	 *
	 * @returns An observable that emits the statistics.
	 */
	public abstract getStatistics(): Observable<any>;

	/**
	 * Add a new entry to history stating that a new search activity has been initialized.
	 */
	public abstract updateHistoryWithNewSearchActivity(): Promise<void>;

	/**
	 * Update the movie rate in the database.
	 *
	 * @param movieItemVO - The movie item to update.
	 */
	public abstract updateMovieRate(movieItemVO: MovieItemVO): Promise<void>;

	/**
	 * Update the movie genre in the database.
	 *
	 * @param movieKey - The key of the movie to update.
	 * @param oldGenre - The old genre value.
	 * @param newGenre - The new genre value.
	 */
	public abstract updateMovieGenre(movieKey: string, oldGenre: string, newGenre: string): Promise<void>;

	/**
	 * Update the isFavourite flag for the given movie in the database.
	 *
	 * @param movieKey - The key of the movie to update.
	 * @param isFavourite - The boolean value to set.
	 */
	public abstract updateMovieFavourite(movieKey: string, isFavourite: boolean): Promise<void>;

	/**
	 * Add a new movie to the database and update the statistics accordingly.
	 *
	 * @param movieItemVO - The movie item to add.
	 */
	public abstract addNewMovieDataAndUpdateStatistics(movieItemVO: MovieItemVO): Promise<void>;

	/**
	 * Remove a movie from the database and update the statistics accordingly.
	 *
	 * @param movieItemVO - The movie item to remove.
	 */
	public abstract removeMovieFromDatabase(movieItemVO: MovieItemVO): Promise<void>;

	/**
	 * Check if a given movie has already been added in the database.
	 *
	 * @param movieName - The name of the movie to check.
	 * @param movieYear - The year of the movie to check.
	 * @param movieId - The ID of the movie to check.
	 * @returns true if the movie already exists, otherwise false.
	 */
	public abstract isMovieAlreadyAdded(movieName: string, movieYear: number, movieId: number): Promise<boolean>;

	/**
	 * Add a new history entry with the given status and optional movie data.
	 *
	 * @param status - The status of the activity.
	 * @param movieItemVO - The movie item associated with the activity.
	 */
	protected abstract addNewHistoryEntry(status: string, movieItemVO?: MovieItemVO): Promise<void>;

	/**
	 * Retrieve the history list from the database.
	 *
	 * @returns An observable that emits the history list.
	 */
	public abstract getHistory(): Observable<any[]>;

	/**
	 * Add a new record to the patch notes collection.
	 *
	 * @param newRecord - The record to add.
	 */
	public abstract addNewRecordToPatchNotes(newRecord: any): Promise<void>;

	/**
	 * Update an existing record in the patch notes collection.
	 *
	 * @param key - The key of the record to update.
	 * @param updatedRecord - The updated record data.
	 */
	public abstract updateExistingRecordToPatchNotes(key: string, updatedRecord: any): Promise<void>;

	/**
	 * Get the patch notes from the database.
	 *
	 * @returns An observable that emits the patch notes.
	 */
	public abstract getPatchNotes(): Observable<any[]>;

	/**
	 * Remove a single item from the given collection in the database.
	 *
	 * @param name - The collection name.
	 * @param key - The key of the record to remove.
	 */
	public abstract removeSingleItemFromDatabase(name: string, key: string): Promise<void>;

	/**
	 * Remove a patch note and keep the patchInProgress statistics field in sync.
	 *
	 * @param key - The document key of the patch note to remove.
	 */
	public abstract removePatchNote(key: string): Promise<void>;

	/**
	 * Get the first reminder table details from the database.
	 *
	 * @returns An observable that emits the first reminder table details.
	 */
	public abstract getFirstReminderTableDetails(): Observable<any[]>;

	/**
	 * Get the second reminder table details from the database.
	 *
	 * @returns An observable that emits the second reminder table details.
	 */
	public abstract getSecondReminderTableDetails(): Observable<any[]>;

	/**
	 * Get the third reminder table details from the database.
	 *
	 * @returns An observable that emits the third reminder table details.
	 */
	public abstract getThirdReminderTableDetails(): Observable<any[]>;

	/**
	 * Update a value in the reminder table.
	 *
	 * @param tableName - The name of the table to update.
	 * @param entryKey - The key of the entry to update.
	 * @param valueKey - The key of the value to update.
	 * @param value - The new value to store.
	 */
	public abstract updateReminderTable(
		tableName: string,
		entryKey: string,
		valueKey: string,
		value: any
	): Promise<void>;

	/**
	 * Update the first reminder table with the given data.
	 *
	 * @param tableName - The name of the table to update.
	 * @param updatedTable - The updated table data.
	 */
	public abstract updateFirstReminderTable(tableName: string, updatedTable: any): Promise<void>;

	/**
	 * Remove a record from the reminder table.
	 *
	 * @param tableName - The name of the table.
	 * @param key - The key of the record to remove.
	 */
	public abstract removeRecordFromReminderTable(tableName: string, key: string): Promise<void>;

	/**
	 * Add a new record to the reminder table.
	 *
	 * @param tableName - The name of the table.
	 * @param newRecord - The new record to add.
	 */
	public abstract addNewRecordForReminderTable(tableName: string, newRecord: any): Promise<void>;

	/**
	 * Get the quotes from the database.
	 *
	 * @returns An observable that emits the quotes list.
	 */
	public abstract getQuotes(): Observable<any[]>;

	/**
	 * Add a new quote to the database.
	 *
	 * @param text - The quote text.
	 * @param author - The author of the quote.
	 * @param timestamp - The timestamp of the quote.
	 */
	public abstract addQuote(text: string, author: string, timestamp: string): Promise<void>;

	/**
	 * Remove a quote from the database.
	 *
	 * @param key - The key of the quote to remove.
	 */
	public abstract removeQuote(key: string, text: string, author: string): Promise<void>;

	/**
	 * Update specific fields in the statistics document.
	 * Used by page components to sync their data into the shared statistics collection
	 * while the page is active. The call is naturally lifecycle-scoped — components
	 * unsubscribe (or lose their subscription) on destroy, stopping further updates.
	 *
	 * @param fields - A flat or nested record of fields to merge into the statistics document.
	 */
	public abstract updateStatisticsFields(fields: Record<string, any>): Promise<void>;

	/**
	 * Prepend a new entry to the `recentPatchActivities` list in the statistics
	 * document, keeping at most STATS_CAP_ACTIVITY_LOG entries (newest first).
	 *
	 * @param activity - The activity object to record.
	 */
	public abstract appendToPatchActivityLog(activity: any): Promise<void>;

	/**
	 * Prepend a new entry to a named activity-log array in the statistics
	 * document, keeping at most STATS_CAP_ACTIVITY_LOG entries (newest first).
	 * Used for movie, patch, reminder and resonance activity feeds.
	 *
	 * @param fieldName - The statistics field that holds the array — use a STATS_FIELD_* constant.
	 * @param activity - The activity object to record.
	 */
	public abstract appendToActivityLog(fieldName: string, activity: any): Promise<void>;

	/**
	 * Get the useful links from the database.
	 *
	 * @returns An observable that emits the useful links list.
	 */
	public abstract getUsefulLinks(): Observable<any[]>;

	/**
	 * Add a new useful link to the database.
	 *
	 * @param link - The link object to add.
	 */
	public abstract addUsefulLink(link: { url: string; title: string; category: string; visitCount: number; createdAt: string }): Promise<void>;

	/**
	 * Update an existing useful link in the database.
	 *
	 * @param key - The key of the link to update.
	 * @param updates - The fields to update.
	 */
	public abstract updateUsefulLink(key: string, updates: Partial<{ url: string; title: string; category: string }>): Promise<void>;

	/**
	 * Increment the visit count for a useful link.
	 *
	 * @param key - The key of the link.
	 * @param currentCount - The current visit count.
	 */
	public abstract incrementLinkVisit(key: string, currentCount: number): Promise<void>;

	/**
	 * Remove a useful link from the database.
	 *
	 * @param key - The key of the link to remove.
	 */
	public abstract removeUsefulLink(key: string): Promise<void>;

	/**
	 * Get the link categories from the database.
	 *
	 * @returns An observable that emits the link categories list.
	 */
	public abstract getLinkCategories(): Observable<any[]>;

	/**
	 * Add a new link category to the database.
	 *
	 * @param category - The category object to add.
	 */
	public abstract addLinkCategory(category: { name: string; color: string; order: number }): Promise<void>;

	/**
	 * Update an existing link category in the database.
	 *
	 * @param key - The key of the category to update.
	 * @param updates - The fields to update.
	 */
	public abstract updateLinkCategory(key: string, updates: Partial<{ name: string; color: string; order: number }>): Promise<void>;

	/**
	 * Remove a link category from the database.
	 *
	 * @param key - The key of the category to remove.
	 */
	public abstract removeLinkCategory(key: string): Promise<void>;

	/**
	 * Proxy an HTTP GET request through the `fetchUrl` CloudBase function,
	 * bypassing browser CORS restrictions.  Used for RSS news feeds and
	 * link-title auto-fetch on the Nexus page.
	 *
	 * @param url - The fully-qualified http/https URL to fetch.
	 * @returns The response body as a string and its Content-Type header value.
	 */
	public abstract proxyFetch(url: string): Promise<{ content: string; contentType: string }>;
}
