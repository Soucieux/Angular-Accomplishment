import { LOG } from '../../app.logs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class DoubanService {
	private readonly className = 'DoubanService';
	private readonly doubanBaseUrl = 'https://movie.douban.com';

	constructor(private http: HttpClient) {}

	searchMovieJSON(movieName: string): Observable<any> {
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
				}/j/subject_suggest?q=${movieName}&type=json`,
				{
					responseType: 'json'
				}
			)
			.pipe(
				catchError((error) => {
					LOG.error(
						this.className,
						'Error while retrieving movie JSON for ' + movieName,
						error as Error
					);
					return throwError(() => error);
				})
			);
	}

	searchMovieCover(imageLink: string, movieName: string): Observable<any> {
		return this.http
			.get(`${this.getFirebaseFunctionUrl()}?url=${imageLink}&type=image`, {
				responseType: 'blob'
			})
			.pipe(
				catchError((error) => {
					LOG.error(
						this.className,
						'Error while retrieving movie cover for ' + movieName,
						error as Error
					);
					return throwError(() => error);
				})
			);
	}

	searchMovieWebpage(id: number): Observable<any> {
		return this.http
			.get(`${this.getFirebaseFunctionUrl()}?url=${this.doubanBaseUrl}/subject/${id}&type=json`, {
                responseType: 'text'
			})
			.pipe(
				catchError((error) => {
					LOG.error(
						this.className,
						'Error while retrieving movie webpage for ID ' + id,
						error as Error
					);
					return throwError(() => error);
				})
			);
	}

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
