import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MovieItemVO } from '../../common/movieitem.vo';
import { InjectionToken } from '@angular/core';
import type cloudbase from '@cloudbase/js-sdk';
export type CloudbaseApp = ReturnType<typeof cloudbase.init>;
export const CLOUDBASE = new InjectionToken<CloudbaseApp>('CLOUDBASE');

@Injectable({ providedIn: 'root' })
export abstract class DatabaseService {
	protected constructor() {}

	/**
	 * Upload the movie cover image to storage and return the downloadable link.
	 *
	 * @param coverImage - The movie cover blob to upload.
	 * @param movieName - The name of the movie (used as the filename in storage).
	 * @returns A string that represents the downloadable link of the movie cover.
	 */
	abstract uploadImageAndGetDownloadLink(coverImage: Blob, movieName: string): Promise<string>;

	/**
	 * Get the movie list from the database.
	 *
	 * @returns An observable that emits the movie list.
	 */
	abstract getMovieList(): Observable<MovieItemVO[]>;

	/**
	 * Get the statistics from the database.
	 *
	 * @returns An observable that emits the statistics.
	 */
	abstract getStatistics(): Observable<any>;

	/**
	 * Add a new entry to history stating that a new search activity has been initialized.
	 */
	abstract updateHistoryWithNewSearchActivity(): Promise<void>;

	/**
	 * Update the movie rate in the database.
	 *
	 * @param movieItemVO - The movie item to update.
	 */
	abstract updateMovieRate(movieItemVO: MovieItemVO): Promise<void>;

	/**
	 * Update the movie genre in the database.
	 *
	 * @param movieKey - The key of the movie to update.
	 * @param oldGenre - The old genre value.
	 * @param newGenre - The new genre value.
	 */
	abstract updateMovieGenre(movieKey: string, oldGenre: string, newGenre: string): Promise<void>;

	/**
	 * Update the isFavourite flag for the given movie in the database.
	 *
	 * @param movieKey - The key of the movie to update.
	 * @param isFavourite - The boolean value to set.
	 */
	abstract updateMovieFavourite(movieKey: string, isFavourite: boolean): Promise<void>;

	/**
	 * Add a new movie to the database and update the statistics accordingly.
	 *
	 * @param movieItemVO - The movie item to add.
	 */
	abstract addNewMovieDataAndUpdateStatistics(movieItemVO: MovieItemVO): Promise<void>;

	/**
	 * Remove a movie from the database and update the statistics accordingly.
	 *
	 * @param movieItemVO - The movie item to remove.
	 */
	abstract removeMovieFromDatabase(movieItemVO: MovieItemVO): Promise<void>;

	/**
	 * Check if a given movie has already been added in the database.
	 *
	 * @param movieName - The name of the movie to check.
	 * @param movieYear - The year of the movie to check.
	 * @param movieId - The ID of the movie to check.
	 * @returns true if the movie already exists, otherwise false.
	 */
	abstract isMovieAlreadyAdded(movieName: string, movieYear: number, movieId: number): Promise<boolean>;

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
	abstract getHistory(): Observable<any[]>;

	/**
	 * Add a new record to the patch notes collection.
	 *
	 * @param newRecord - The record to add.
	 */
	abstract addNewRecordToPatchNotes(newRecord: any): Promise<void>;

	/**
	 * Update an existing record in the patch notes collection.
	 *
	 * @param key - The key of the record to update.
	 * @param updatedRecord - The updated record data.
	 */
	abstract updateExistingRecordToPatchNotes(key: string, updatedRecord: any): Promise<void>;

	/**
	 * Get the patch notes from the database.
	 *
	 * @returns An observable that emits the patch notes.
	 */
	abstract getPatchNotes(): Observable<any[]>;

	/**
	 * Remove a single item from the given collection in the database.
	 *
	 * @param name - The collection name.
	 * @param key - The key of the record to remove.
	 */
	abstract removeSingleItemFromDatabase(name: string, key: string): Promise<void>;

	/**
	 * Get the first reminder table details from the database.
	 *
	 * @returns An observable that emits the first reminder table details.
	 */
	abstract getFirstReminderTableDetails(): Observable<any[]>;

	/**
	 * Get the second reminder table details from the database.
	 *
	 * @returns An observable that emits the second reminder table details.
	 */
	abstract getSecondReminderTableDetails(): Observable<any[]>;

	/**
	 * Get the third reminder table details from the database.
	 *
	 * @returns An observable that emits the third reminder table details.
	 */
	abstract getThirdReminderTableDetails(): Observable<any[]>;

	/**
	 * Update a value in the reminder table.
	 *
	 * @param tableName - The name of the table to update.
	 * @param entryKey - The key of the entry to update.
	 * @param valueKey - The key of the value to update.
	 * @param value - The new value to store.
	 */
	abstract updateReminderTable(
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
	abstract updateFirstReminderTable(tableName: string, updatedTable: any): Promise<void>;

	/**
	 * Remove a record from the reminder table.
	 *
	 * @param tableName - The name of the table.
	 * @param key - The key of the record to remove.
	 */
	abstract removeRecordFromReminderTable(tableName: string, key: string): Promise<void>;

	/**
	 * Add a new record to the reminder table.
	 *
	 * @param tableName - The name of the table.
	 * @param newRecord - The new record to add.
	 */
	abstract addNewRecordForReminderTable(tableName: string, newRecord: any): Promise<void>;

	/**
	 * Get the quotes from the database.
	 *
	 * @returns An observable that emits the quotes list.
	 */
	abstract getQuotes(): Observable<any[]>;

	/**
	 * Add a new quote to the database.
	 *
	 * @param text - The quote text.
	 * @param author - The author of the quote.
	 * @param timestamp - The timestamp of the quote.
	 */
	abstract addQuote(text: string, author: string, timestamp: string): Promise<void>;

	/**
	 * Remove a quote from the database.
	 *
	 * @param key - The key of the quote to remove.
	 */
	abstract removeQuote(key: string): Promise<void>;
}
