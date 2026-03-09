import { isPlatformBrowser } from '@angular/common';
// cloudbase-init.service.ts
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable } from 'rxjs';
import { MovieItemVO } from '../../../common/movieitem.vo';
import { CLOUDBASE, CloudbaseApp, DatabaseService } from '../database.service';
import { LOG } from '../../../common/app.logs';

@Injectable({ providedIn: 'root' })
export class CloudbaseService extends DatabaseService {
	private readonly className = 'CloudbaseService';
	private database: any;

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		@Inject(CLOUDBASE) private cloudbase: CloudbaseApp
	) {
		super();
		if (isPlatformBrowser(this.platformId)) {
			this.database = this.cloudbase.database();
		}
	}

	public getCloudbaseRef() {
		return this.cloudbase;
	}

	/**
	 * Get the movie list from firebase.
	 *
	 * @returns An observable that emits the movie list.
	 */
	getMovieList(): Observable<MovieItemVO[]> {
		return new Observable((observer) => {
			this.database.collection('movies').watch({
				onChange: (snapshot: any) => {
					const movies = snapshot.docs.map((doc: any) => {
						const movieItemVO = new MovieItemVO(doc.title, Number(doc.year));
						movieItemVO.setMovieKey(doc.id);
						movieItemVO.setMovieId(doc.id);
						movieItemVO.setMovieGenre(doc.genre);
						movieItemVO.setMovieRate(doc.rate);
						movieItemVO.setMovieCoverImageDownloadableLink(doc.coverImageLink);
						movieItemVO.setMovieFirstReleaseDate(doc.firstReleaseDate);
						movieItemVO.setMovieEpisodeNumber(doc.episodeNumber);
						movieItemVO.setIsFavourite(doc.isFavourite);
						movieItemVO.setDescription(doc.description);
						movieItemVO.setActors(doc.actors);
						return movieItemVO;
					});

					movies.sort((a: MovieItemVO, b: MovieItemVO) =>
						a.getMovieFirstReleaseDate().localeCompare(b.getMovieFirstReleaseDate())
					);
					observer.next(movies);
				},
				onError: (err: any) => {
					LOG.error(this.className, 'Error while retrieving movie list' + err);
				}
			});
		});
	}

	/**
	 * Get the statistics from firebase.
	 *
	 * @returns An observable that emits the statistics.
	 */
	public getStatistics(): Observable<any> {
		return new Observable((observer) => {
			this.database.collection('statistics').watch({
				onChange: (snapshot: any) => {
					observer.next(snapshot.docs[0]);
				},
				onError: (err: any) => {
					LOG.error(this.className, 'Error while retrieving statistics' + err);
				}
			});
		});
	}

	/**
	 * Retrieve history list
	 *
	 * @returns The history list
	 */
	public getHistory(): Observable<any[]> {
		return new Observable((observer) => {
			this.database.collection('history').watch({
				onChange: (snapshot: any) => {
					const history = snapshot.docs
						.map((doc: any) => {
							const { _id, ...rest } = doc;
							return {
								key: _id,
								...rest
							};
						})
						.reverse();

					observer.next(history);
				}
			});
		});
	}

	/**
	 * Get patch notes
	 *
	 * @returns Patch notes
	 */
	public getPatchNotes(): Observable<any[]> {
		return new Observable((observer) => {
			this.database.collection('patch_notes').watch({
				onChange: (snapshot: any) => {
					const patchNotes = snapshot.docs.map((doc: any) => {
						const { _id, ...rest } = doc;
						return {
							key: _id,
							...rest
						} as {
							key: string;
							component: string;
							element: string;
							details: string;
							status: string;
							timestamp: string;
							isBug: boolean;
						};
					});

					patchNotes.sort((a: any, b: any) => a.timestamp.localeCompare(b.timestamp));

					observer.next(patchNotes);
				}
			});
		});
	}

	/**
	 * Get remainder table details
	 *
	 * @returns Remainder table details
	 */
	public getFirstRemainderTableDetails(): Observable<any[]> {
		return new Observable((observer) => {
			const watcher = this.database.collection('remainder_table_first').watch({
				onChange: (snapshot: any) => {
					const data = snapshot.docs;
					observer.next(data ? Object.values(data) : []);
				}
			});
			return () => watcher.close();
		});
	}

	/**
	 * Get second remainder table details
	 *
	 * @returns Second remainder table details
	 */
	public getSecondRemainderTableDetails(): Observable<any[]> {
		return new Observable((observer) => {
			const watcher = this.database.collection('remainder_table_second').watch({
				onChange: (snapshot: any) => {
					const secondTable = snapshot.docs.map((doc: any) => {
						const { _id, ...rest } = doc;
						return {
							key: _id,
							...rest
						} as {
							key: string;
							name: string;
							content: {
								date: string;
								debt: number;
								original: number;
								paid: boolean;
							};
						};
					});
					observer.next(secondTable);
				}
			});
			return () => watcher.close();
		});
	}

	/**
	 * Get third remainder table details
	 *
	 * @returns Third remainder table details
	 */
	public getThirdRemainderTableDetails(): Observable<any[]> {
		return new Observable((observer) => {
			const watcher = this.database.collection('remainder_table_third').watch({
				onChange: (snapshot: any) => {
					const thirdTable = snapshot.docs.map((doc: any) => {
						const { _id, ...rest } = doc;
						return {
							key: _id,
							...rest
						} as {
							key: string;
							content: string;
							date: string;
							link: string;
						};
					});
					observer.next(thirdTable);
				}
			});
			return () => watcher.close();
		});
	}

	uploadImageAndGetDownloadLink(coverImage: Blob, movieName: string): Promise<string> {
		throw new Error('Method not implemented.');
	}
	updateHistoryWithNewSearchActivity(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	updateMovieRateToFirebase(movieItemVO: MovieItemVO): Promise<void> {
		throw new Error('Method not implemented.');
	}
	updateMovieGenreToFirebase(movieKey: string, oldGenre: string, newGenre: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
	updateMovieFavouriteToFirebase(movieKey: string, isFavourite: boolean): Promise<void> {
		throw new Error('Method not implemented.');
	}
	addNewMovieDataAndUpdateStatistics(movieItemVO: MovieItemVO): Promise<void> {
		throw new Error('Method not implemented.');
	}
	removeMovieFromDatabase(movieItemVO: MovieItemVO): Promise<void> {
		throw new Error('Method not implemented.');
	}
	protected getReusableKeys(): Promise<string[]> {
		throw new Error('Method not implemented.');
	}
	protected saveReusableKeys(keys: string[]): Promise<void> {
		throw new Error('Method not implemented.');
	}
	isMovieAlreadyAdded(movieName: string, movieYear: number, movieId: number): Promise<boolean> {
		throw new Error('Method not implemented.');
	}
	protected updateHistory(status: string, movieItemVO?: MovieItemVO): Promise<void> {
		throw new Error('Method not implemented.');
	}
	addNewRecordToPatchNotes(newRecord: any): Promise<void> {
		throw new Error('Method not implemented.');
	}
	updateExistingRecordToPatchNotes(key: string, updatedRecord: any): Promise<void> {
		throw new Error('Method not implemented.');
	}
	removePatchNotes(key: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
	updateRemainderTable(tableName: string, entryKey: string, valueKey: string, value: any): Promise<void> {
		throw new Error('Method not implemented.');
	}
	updateFirstRemainderTable(tableName: string, updatedTable: any): Promise<void> {
		throw new Error('Method not implemented.');
	}
	removeRecordFromRemainderTable(tableName: string, key: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
	addNewRecordForRemainderTable(tableName: string, newRecord: any): Promise<void> {
		throw new Error('Method not implemented.');
	}
}
