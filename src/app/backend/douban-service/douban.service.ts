import { LOG } from '../../common/app.logs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import {
	ENT_LOG_MOVIE_COVER_FAILED,
	ENT_LOG_MOVIE_DATA_FAILED,
	ENT_LOG_MOVIE_DETAILS_FAILED,
	ENT_LOG_MOVIE_JSON_FAILED,
	ENT_MOVIE_RATE_PROXY_URL
} from '../../common/constants';

/** Rating and release date scraped from a Douban subject page when the third-party API lacks them. */
export interface MovieDetails {
	/** The Douban rating, or -1 when the page carries none. */
	rate: number;
	/** The first release or air date as `YYYY-MM-DD`, or an empty string when the page carries none. */
	releaseDate: string;
}

@Injectable({
	providedIn: 'root'
})
export class DoubanService {
	private readonly className = 'DoubanService';
	private readonly doubanBaseUrl = 'https://movie.douban.com';

	constructor(private http: HttpClient) {}

	/**
	 * Searches Douban for a movie by name via the JSON suggestion API.
	 * The request is proxied through a Firebase Cloud Function to avoid
	 * CORS restrictions when calling Douban directly from the browser.
	 *
	 * @param movieName - The movie name to search for.
	 * @returns An observable that emits the JSON response from Douban.
	 */
	public searchMovieJSON(movieName: string): Observable<any> {
		/*  	
        1.	With ng serve (Development Mode):
	        •	Simulated SSR: 
                Angular Universal simulates both server-side rendering (SSR) and client-side rendering (CSR).
	        •	platform_id is set to server: 
                    During the initial bootstrapping, Angular simulates the server-side rendering to check compatibility and build the application. 
                    That’s why platform_id is set to server in the component, as Angular Universal is trying to render the component as it would on the server (in preparation for SSR).
	        •	Client-side Rendering: 
                    After the initial render, the app switches to the browser environment (client-side), and the platform is set to browser. 
                    This mimics what would happen in a real SSR scenario where the server sends the initial static HTML, and then the client takes over.
		2.	With npm run serve:ssr (Production SSR Mode):
            •	No Client-side Code Executed During Initial Render: 
                    The server runs the code to render the Angular app into HTML and sends it to the browser. 
                    However, no client-side code is executed at this point.
            •	platform_id is only server: 
                    When the app is pre-rendered on the server, it is only executed with platform-server, and no client-side code runs during this phase. 
                    You won’t see platform_id as server in your components because it’s only the server rendering the HTML.
            •	Hydration Process: 
                    Once the page is loaded in the browser, Angular hydrates the page (i.e., it takes over the static HTML and adds interactivity). 
                    After hydration, platform_id switches to browser, and client-side JavaScript is executed to make the app interactive.
        3. Even though there is a proxy file set with ng serve, it is still possible that the target API can detect whether the origin of the reuqest is coming from a server or a browser.
                Therefore, the client could still face CORS issue when trying to access that API. 
                    */
		return this.http
			.get(
				`${this.getFirebaseFunctionUrl()}?url=${
					this.doubanBaseUrl
				}/j/subject_suggest?q=${encodeURIComponent(movieName)}&type=json`,
				{
					responseType: 'json'
				}
			)
			.pipe(
				catchError((error: unknown) => {
					LOG.error(
						this.className,
						`${ENT_LOG_MOVIE_JSON_FAILED} ${movieName}`,
						error as Error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Downloads a movie cover image from the given Douban image link.
	 * Proxied through a Firebase Cloud Function to avoid CORS and hotlinking issues.
	 *
	 * @param imageLink - The full URL of the cover image on Douban's servers.
	 * @param movieName - The movie name (used for logging).
	 * @returns An observable that emits the image as a Blob.
	 */
	public searchMovieCover(imageLink: string, movieName: string): Observable<Blob> {
		return this.http
			.get(`${this.getFirebaseFunctionUrl()}?url=${imageLink}&type=image`, {
				responseType: 'blob'
			})
			.pipe(
				catchError((error: unknown) => {
					LOG.error(
						this.className,
						`${ENT_LOG_MOVIE_COVER_FAILED} ${movieName}`,
						error as Error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Fetches movie data from the wmdb.tv third-party API by Douban movie ID.
	 * This API returns structured JSON (rating, release date, actors, etc.) and is the
	 * only source of movie data — the bulk rate refresh relies on it alone, and the add
	 * and restore flows fall back to {@link searchMovieDetails} for the two fields it
	 * sometimes leaves empty.
	 *
	 * @param id - The Douban movie ID to look up.
	 * @returns An observable that emits the API response as a string (parsed to JSON by the caller).
	 */
	public searchMovieByThirdPartyApi(id: number): Observable<string> {
		return this.http
			.get(`${this.getFirebaseFunctionUrl()}?url=https://api.wmdb.tv/movie/api?id=${id}&type=json`, {
				responseType: 'text'
			})
			.pipe(
				catchError((error: unknown) => {
					LOG.error(
						this.className,
						`${ENT_LOG_MOVIE_DATA_FAILED} ${id}`,
						error as Error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Fetches a movie's Douban rating and release date through the Firecrawl-backed Cloud Function.
	 * This is the fallback source: the add and restore flows call it only when the third-party API
	 * left one of those fields empty, and the bulk rate refresh never calls it at all.
	 *
	 * @param id - The Douban movie ID to look up.
	 * @returns An observable that emits the rating and release date found on the Douban page.
	 */
	public searchMovieDetails(id: number): Observable<MovieDetails> {
		return this.http.get<MovieDetails>(`${ENT_MOVIE_RATE_PROXY_URL}?id=${id}`).pipe(
			catchError((error: unknown) => {
				LOG.error(
					this.className,
					`${ENT_LOG_MOVIE_DETAILS_FAILED} ${id}`,
					error as Error
				);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Gets a randomly selected Cloud Function base URL from the pool of available threads.
	 * Load-balances requests across multiple function instances.
	 *
	 * @returns A randomly selected Cloud Function base URL.
	 */
	private getFirebaseFunctionUrl(): string {
		const urls = [
			'https://thread1-tfsps4dwza-uc.a.run.app',
			'https://thread2-tfsps4dwza-uc.a.run.app',
			'https://thread3-tfsps4dwza-uc.a.run.app',
			'https://thread4-tfsps4dwza-uc.a.run.app',
			'https://thread5-tfsps4dwza-uc.a.run.app'
		];
		return urls[Math.floor(Math.random() * urls.length)];
	}
}
