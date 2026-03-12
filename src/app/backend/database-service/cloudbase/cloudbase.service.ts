import { isPlatformBrowser } from '@angular/common';
// cloudbase-init.service.ts
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable } from 'rxjs';
import { MovieItemVO } from '../../../common/movieitem.vo';
import { CLOUDBASE, CloudbaseApp, DatabaseService } from '../database.service';
import { LOG } from '../../../common/app.logs';
import {
	FIRST_TABLE,
	GENRE_FAVOURITE,
	NO_RATE,
	RATE_DECREASED,
	RATE_INCREASED,
	SECOND_TABLE,
	THIRD_TABLE,
	Utilities
} from '../../../common/app.utilities';

@Injectable({ providedIn: 'root' })
export class CloudbaseService extends DatabaseService {
	private readonly className = 'CloudbaseService';
	private database: any;
	private statId: any;
	private static userId: string;
	private _!: any;
	searchStreamService: any;

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		@Inject(CLOUDBASE) private cloudbase: CloudbaseApp,
		private utilities: Utilities
	) {
		super();
		if (isPlatformBrowser(this.platformId)) {
			this.database = this.cloudbase.database();
			this._ = this.database.command;

			this.database
				.collection('statistics')
				.limit(1)
				.get()
				.then((response: any) => {
					return (this.statId = response.data[0]._id);
				});

			// this.test();
		}
	}

	public getCloudbaseAuth() {
		return this.cloudbase.auth();
	}

	public static setUseId(userId: string) {
		this.userId = userId;
	}

	public async test() {
		// for (const value of data.data) {
		// 	this.database.collection('movies').doc(value._id).update({});
		// }
		const notes = await this.database.collection('remainder_table_first').get();
		for (const data of notes.data) {
			await this.database
				.collection('remainder_table_first')
				.doc(data._id)
				.update({ _openid: CloudbaseService.userId });
		}
	}

	/**
	 * Get the movie list from cloudbase.
	 *
	 * @returns An observable that emits the movie list.
	 */
	getMovieList(): Observable<MovieItemVO[]> {
		return new Observable((observer) => {
			const watcher = this.database.collection('movies').watch({
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
					LOG.error(this.className, 'Error while retrieving movie list', err);
				}
			});
			return () => watcher.close();
		});
	}

	/**
	 * Get the statistics from cloudbase.
	 *
	 * @returns An observable that emits the statistics.
	 */
	public getStatistics(): Observable<any> {
		return new Observable((observer) => {
			const watcher = this.database.collection('statistics').watch({
				onChange: (snapshot: any) => {
					observer.next(snapshot.docs[0]);
				},
				onError: (err: any) => {
					LOG.error(this.className, 'Error while retrieving statistics', err);
				}
			});
			return () => watcher.close();
		});
	}

	/**
	 * Retrieve history list
	 *
	 * @returns The history list
	 */
	public getHistory(): Observable<any[]> {
		return new Observable((observer) => {
			const watcher = this.database.collection('history').watch({
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
			return () => watcher.close();
		});
	}

	/**
	 * Get patch notes
	 *
	 * @returns Patch notes
	 */
	public getPatchNotes(): Observable<any[]> {
		return new Observable((observer) => {
			const watcher = this.database.collection('patch_notes').watch({
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
			return () => watcher.close();
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
					observer.next(data ? data : []);
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

	/**
	 * Upload the movie cover to cloudbase storage and return the downloadable link.
	 *
	 * @param coverImage - The movie cover to upload.
	 * @param movieName - The name of the movie to upload.
	 * @returns A string that represents the downloadable link of the movie cover.
	 */
	uploadImageAndGetDownloadLink(coverImage: Blob, movieName: string): Promise<string> {
		throw new Error('Method not implemented.');
	}

	/**
	 * Add new entry to history stating that a new search activity has been initialized
	 */
	async updateHistoryWithNewSearchActivity(): Promise<void> {
		await this.addNewHistoryEntry('search');
	}

	/**
	 * Update the movie rate to cloudbase.
	 *
	 * @param movieItemVO - The movie item to update.
	 */
	async updateMovieRate(movieItemVO: MovieItemVO): Promise<void> {
		// Step 1 : Gather necessary info
		const movieRef = this.database.collection('movies').doc(movieItemVO.getMovieKey());
		const oldRate = movieRef.exists() ? movieRef.get().rate : undefined;

		// Step 2 : Compare latest rate with the one stored in the database
		if (oldRate !== undefined && oldRate !== movieItemVO.getMovieRate()) {
			await movieRef.update({
				rate: movieItemVO.getMovieRate()
			});
			const rateDifference = Number((movieItemVO.getMovieRate() - oldRate).toFixed(2));
			this.searchStreamService.addSearchLog(
				`The rate of ${movieItemVO.getMovieName()} is <span ${
					rateDifference > 0 ? 'class="rate-up"' : 'class="rate-down"'
				}>${rateDifference > 0 ? RATE_INCREASED : RATE_DECREASED} by ${Math.abs(
					rateDifference
				)}</span> to ${movieItemVO.getMovieRate()}`
			);
		} else {
			this.searchStreamService.addSearchLog(`The rate of ${movieItemVO.getMovieName()} stays the same`);
		}
	}

	/**
	 * Update the movie genre to cloudbase
	 *
	 * @param movieKey The given movie key
	 * @param oldGenre The old genre
	 * @param newGenre The new genre
	 */
	updateMovieGenre(movieKey: string, oldGenre: string, newGenre: string): Promise<void> {
		const movieRef = this.database.collection('movies').doc(movieKey);

		// Step 1 : Update movie genre
		return movieRef
			.update({
				genre: newGenre
			})
			.then(() => {
				LOG.info(this.className, `Movie genre has been updated`);

				// Step 2 : Update movie statistics
				return this.database
					.collection('statistics')
					.doc(this.statId)
					.update({
						[`genre.${oldGenre}`]: this._.inc(-1),
						[`genre.${newGenre}`]: this._.inc(1)
					});
			})
			.then(() => {
				LOG.info(this.className, `Movie statistics have been updated`);
				return;
			});
	}

	/**
	 * Update isFavourite for the given movie to cloudbase
	 *
	 * @param movieKey The given movie key
	 * @param isFavourite The boolean value set
	 */
	updateMovieFavourite(movieKey: string, isFavourite: boolean): Promise<void> {
		const movieRef = this.database.collection('movies').doc(movieKey);

		// Step 1 : Update movie favourite
		return movieRef
			.update({
				isFavourite: isFavourite
			})
			.then(() => {
				LOG.info(this.className, `Movie favourite tag has been updated`);

				// Step 2 : Update movie statistics
				const updatedData: any = {};

				if (isFavourite) {
					updatedData[`genre.${GENRE_FAVOURITE}`] = this._.inc(1);
				} else {
					updatedData[`genre.${GENRE_FAVOURITE}`] = this._.inc(-1);
				}

				return this.database.collection('statistics').doc(this.statId).update(updatedData);
			})
			.then(() => {
				LOG.info(this.className, `Movie statistics have been updated`);
				return;
			});
	}

	/**
	 * Update all movie data and statistics to cloudbase.
	 *
	 * @param movieItemVO - The movie item to update.
	 */
	async addNewMovieDataAndUpdateStatistics(movieItemVO: MovieItemVO): Promise<void> {
		try {
			// Add new movie data
			await this.database.collection('movies').add({
				_openid: CloudbaseService.userId,
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

			// Add new entry to history
			await this.addNewHistoryEntry('added', movieItemVO);

			const updatedData: any = {};
			updatedData[`genre.${movieItemVO.getMovieGenre()}`] = this._.inc(1);
			updatedData[`totalNumber`] = this._.inc(1);

			if (movieItemVO.getIsFavourite()) {
				updatedData[`genre.${GENRE_FAVOURITE}`] = this._.inc(1);
			}

			// Update the movie statistics
			await this.database.collection('statistics').doc(this.statId).udpate(updatedData);
			LOG.info(this.className, `Movie added and statistics have been updated`);
		} catch (error) {
			LOG.error(
				this.className,
				`Error while adding new movie data for ${movieItemVO.getMovieName()}`,
				error as Error
			);
		}
	}

	/**
	 * Remove the movie from the database.
	 *
	 * @param movieItemVO - The movie item to remove.
	 */
	removeMovieFromDatabase(movieItemVO: MovieItemVO): Promise<void> {
		throw new Error('Method not implemented.');
	}

	/**
	 * Check if a given movie has already been added in the databse
	 *
	 * @param movieName Movie name to check
	 * @param movieYear Movie year to check
	 * @param movieId Movie ID to check
	 * @returns true if the movie already exists, otherwise, false.
	 */
	async isMovieAlreadyAdded(movieName: string, movieYear: number, movieId: number): Promise<boolean> {
		try {
			const snapshot = await this.database.collection('movies').get();
			const allMovies = snapshot.data;

			if (!allMovies) throw 'Movie list empty';

			for (const movie of allMovies) {
				if ((movie.title === movieName && movie.year === movieYear) || movie.id === movieId) {
					return true;
				}
			}
			return false;
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
	 * Add history with new activity
	 *
	 * @param status - The status of the activity.
	 * @param movieItemVO - The movie item to update.
	 */
	protected async addNewHistoryEntry(status: string, movieItemVO?: MovieItemVO): Promise<void> {
		if (movieItemVO) {
			await this.database.collection('history').add({
				_openid: CloudbaseService.userId,
				id: movieItemVO.getMovieId(),
				status: status,
				message: `${movieItemVO.getMovieName()} - ${movieItemVO.getMovieGenre()} (Rate: ${
					movieItemVO.getMovieRate() == 0 ? NO_RATE : movieItemVO.getMovieRate()
				}) was ${status} on ${this.utilities.getCurrentFormattedTime(true)}`
			});
			LOG.info(this.className, 'New history entry has been added');
		} else {
			await this.database.collection('history').add({
				_openid: CloudbaseService.userId,
				status: status,
				message: `New rate search was started on ${this.utilities.getCurrentFormattedTime(true)}`
			});
			LOG.info(this.className, 'New history entry has been added');
		}
	}

	/**
	 * Add new record to patch notes
	 *
	 * @param newRecord - The record to add.
	 */
	addNewRecordToPatchNotes(newRecord: any): Promise<void> {
		return this.database
			.collection('patch_notes')
			.add({
				_openid: CloudbaseService.userId,
				component: this.utilities.capitalizeFirstLetterOnEachWord(newRecord.component),
				element: this.utilities.capitalizeFirstLetterWithOthersUnchanged(newRecord.element.trim()),
				details: this.utilities.capitalizeFirstLetterWithOthersUnchanged(newRecord.details.trim()),
				status: newRecord.status,
				timestamp: newRecord.timestamp,
				isBug: newRecord.isBug
			})
			.then(() => {
				LOG.info(this.className, 'New patch notes record has been added');
			});
	}

	/**
	 * Update existing record to patch notes
	 *
	 * @param key - The key associated with the record
	 * @param updatedRecord - The record to update.
	 */
	updateExistingRecordToPatchNotes(key: string, updatedRecord: any): Promise<void> {
		return this.database
			.collection('patch_notes')
			.doc(key)
			.update({
				...updatedRecord
			})
			.then(() => {
				LOG.info(this.className, 'Patch notes record has been updated');
			});
	}

	/**
	 * Remove record from patch notes
	 *
	 * @param key - The key associated with the record
	 */
	removePatchNotes(key: string): Promise<void> {
		return this.database
			.collection('patch_notes')
			.doc(key)
			.remove()
			.then(() => {
				LOG.info(this.className, 'Patch notes record has been removed');
			});
	}

	/**
	 * Update remainder table details
	 *
	 * @param entryKey - The key of the entire entry
	 * @param valueKey - The key associated with the new value.
	 * @param value - The new value to be stored.
	 * @param tableName - The name of the table to update.
	 */
	async updateRemainderTable(
		tableName: string,
		entryKey: string,
		valueKey: string,
		value: any
	): Promise<void> {
		if (tableName === SECOND_TABLE) {
			const valueToUpdate = valueKey === 'content' ? { ...value } : { [valueKey]: value };
			await this.database.collection('remainder_table_second').doc(entryKey).update({
				content: valueToUpdate
			});
			LOG.info(this.className, 'Remainder table has been updated');
		} else if (tableName === THIRD_TABLE) {
			await this.database
				.collection('remainder_table_third')
				.doc(entryKey)
				.update({
					[valueKey]: value
				});
			LOG.info(this.className, 'Remainder table has been updated');
		}
	}

	/**
	 * Update remainder table details
	 *
	 * @param tableName - The name of the table to update.
	 * @param updatedTable - The table to update
	 */
	async updateFirstRemainderTable(tableName: string, updatedTable: any): Promise<void> {
		const tableRef = this.database.collection('remainder_table_first');
		try {
			for (const [index, item] of updatedTable.entries()) {
				const { _id, ...dataToUpdate } = item;
				const docId = index === 5 ? '5' : _id;
				await tableRef.doc(docId).update(dataToUpdate);
			}
			LOG.info(this.className, 'Remainder table has been updated');
		} catch (error) {
			LOG.error(this.className, 'Error while updaing first remainder table');
		}
	}

	/**
	 * Remove record from remainder table
	 * Note: This is used by third table only
	 *
	 * @param tableName - The name of the table
	 * @param index - The index of the record to remove
	 */
	removeRecordFromRemainderTable(tableName: string, key: string): Promise<void> {
		const collectionName = this.convertTableNameToCollectionName(tableName);
		return this.database
			.collection(collectionName)
			.doc(key)
			.remove()
			.then(() => {
				LOG.info(this.className, 'Remainder table record has been removed');
			});
	}

	/**
	 * Add a new entry to a given table
	 * Note: This is used by third table only
	 *
	 * @param tableName The table name
	 * @param newRecord The new entry
	 */
	addNewRecordForRemainderTable(tableName: string, newRecord: any): Promise<void> {
		const collectionName = this.convertTableNameToCollectionName(tableName);
		console.log(CloudbaseService.userId);
		return this.database
			.collection(collectionName)
			.add({
				_openid: CloudbaseService.userId,
				...newRecord
			})
			.then(() => {
				LOG.info(this.className, 'Remainder table has been updated');
			});
	}

	/**
	 * Get corresponding table name in the database
	 *
	 * @param tableName table name
	 */
	private convertTableNameToCollectionName(tableName: string): string {
		switch (tableName) {
			case FIRST_TABLE:
				return 'remainder_table_first';
			case SECOND_TABLE:
				return 'remainder_table_second';
			case THIRD_TABLE:
				return 'remainder_table_third';
			default:
				return '';
		}
	}
}
