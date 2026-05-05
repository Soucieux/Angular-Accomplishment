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
	abstract uploadImageAndGetDownloadLink(coverImage: Blob, movieName: string): Promise<string>;
	abstract getMovieList(): Observable<MovieItemVO[]>;
	abstract getStatistics(): Observable<any>;
	abstract updateHistoryWithNewSearchActivity(): Promise<void>;
	abstract updateMovieRate(movieItemVO: MovieItemVO): Promise<void>;
	abstract updateMovieGenre(movieKey: string, oldGenre: string, newGenre: string): Promise<void>;
	abstract updateMovieFavourite(movieKey: string, isFavourite: boolean): Promise<void>;
	abstract addNewMovieDataAndUpdateStatistics(movieItemVO: MovieItemVO): Promise<void>;
	abstract removeMovieFromDatabase(movieItemVO: MovieItemVO): Promise<void>;
	abstract isMovieAlreadyAdded(movieName: string, movieYear: number, movieId: number): Promise<boolean>;
	protected abstract addNewHistoryEntry(status: string, movieItemVO?: MovieItemVO): Promise<void>;
	abstract getHistory(): Observable<any[]>;
	abstract addNewRecordToPatchNotes(newRecord: any): Promise<void>;
	abstract updateExistingRecordToPatchNotes(key: string, updatedRecord: any): Promise<void>;
	abstract getPatchNotes(): Observable<any[]>;
	abstract removeSingleItemFromDatabase(name: string, key: string): Promise<void>;
	abstract getFirstReminderTableDetails(): Observable<any[]>;
	abstract getSecondReminderTableDetails(): Observable<any[]>;
	abstract getThirdReminderTableDetails(): Observable<any[]>;
	abstract updateReminderTable(
		tableName: string,
		entryKey: string,
		valueKey: string,
		value: any
	): Promise<void>;
	abstract updateFirstReminderTable(tableName: string, updatedTable: any): Promise<void>;
	abstract removeRecordFromReminderTable(tableName: string, key: string): Promise<void>;
	abstract addNewRecordForReminderTable(tableName: string, newRecord: any): Promise<void>;
	abstract getQuotes(): Observable<any[]>;
	abstract addQuote(text: string, author: string, timestamp: string): Promise<void>;
	abstract removeQuote(key: string): Promise<void>;
}
