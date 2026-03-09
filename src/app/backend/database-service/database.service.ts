import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
<<<<<<< HEAD
import { MovieItemVO } from '../../common/movieitem.vo';
import { InjectionToken } from '@angular/core';
import type cloudbase from '@cloudbase/js-sdk';
export type CloudbaseApp = ReturnType<typeof cloudbase.init>;
export const CLOUDBASE = new InjectionToken<CloudbaseApp>('CLOUDBASE');

@Injectable({ providedIn: 'root' })
export abstract class DatabaseService {
=======
import { MovieItemVO } from '../../entertainment/entertainment.movieitem.vo';

@Injectable({ providedIn: 'root' })
export abstract class backendService {
>>>>>>> origin/cloudbase
	protected constructor() {}
	abstract uploadImageAndGetDownloadLink(coverImage: Blob, movieName: string): Promise<string>;
	abstract getMovieList(): Observable<MovieItemVO[]>;
	abstract getStatistics(): Observable<any>;
	abstract updateHistoryWithNewSearchActivity(): Promise<void>;
	abstract updateMovieRateToFirebase(movieItemVO: MovieItemVO): Promise<void>;
	abstract updateMovieGenreToFirebase(movieKey: string, oldGenre: string, newGenre: string): Promise<void>;
	abstract updateMovieFavouriteToFirebase(movieKey: string, isFavourite: boolean): Promise<void>;
	abstract addNewMovieDataAndUpdateStatistics(movieItemVO: MovieItemVO): Promise<void>;
	abstract removeMovieFromDatabase(movieItemVO: MovieItemVO): Promise<void>;
	protected abstract getReusableKeys(): Promise<string[]>;
	protected abstract saveReusableKeys(keys: string[]): Promise<void>;
	abstract isMovieAlreadyAdded(movieName: string, movieYear: number, movieId: number): Promise<boolean>;
	protected abstract updateHistory(status: string, movieItemVO?: MovieItemVO): Promise<void>;
	abstract getHistory(): Observable<any[]>;
	abstract addNewRecordToPatchNotes(newRecord: any): Promise<void>;
	abstract updateExistingRecordToPatchNotes(key: string, updatedRecord: any): Promise<void>;
	abstract getPatchNotes(): Observable<any[]>;
	abstract removePatchNotes(key: string): Promise<void>;
	abstract getFirstRemainderTableDetails(): Observable<any[]>;
	abstract getSecondRemainderTableDetails(): Observable<any[]>;
	abstract getThirdRemainderTableDetails(): Observable<any[]>;
	abstract updateRemainderTable(
		tableName: string,
		entryKey: string,
		valueKey: string,
		value: any
	): Promise<void>;
	abstract updateFirstRemainderTable(tableName: string, updatedTable: any): Promise<void>;
	abstract removeRecordFromRemainderTable(tableName: string, key: string): Promise<void>;
	abstract addNewRecordForRemainderTable(tableName: string, newRecord: any): Promise<void>;
}
