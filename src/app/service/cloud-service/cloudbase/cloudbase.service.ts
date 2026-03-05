// cloudbase-init.service.ts
import { Injectable } from '@angular/core';
import cloudbase from '@cloudbase/js-sdk';
import { environment } from '../../../../environment/environment';
import { Observable } from 'rxjs';
import { MovieItemVO } from '../../../entertainment/entertainment.movieitem.vo';
import { cloudService } from '../cloud.service';
import { LOG } from '../../../app.logs';

@Injectable({ providedIn: 'root' })
export class CloudbaseService extends cloudService {
	private readonly className = 'CloudbaseService';
	private cloudbase: any;
	private database: any;

	constructor() {
		super();
		if (this.cloudbase || typeof window === 'undefined') {
			return;
		}

		this.cloudbase = cloudbase.init({
			env: environment.cloudbase.envId,
			region: environment.cloudbase.region
		});

		this.database = this.cloudbase.database();
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
}
