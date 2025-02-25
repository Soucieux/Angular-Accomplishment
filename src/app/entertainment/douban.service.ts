import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class doubanService {
	private readonly className = doubanService.name;
	private doubanApi = 'api/movie/subject_search?search_text=Inception';

	constructor(private http: HttpClient) {
		console.log(this.className + 'Running douban.service.ts');
	}

	searchMovie(): Observable<any> {
		// if (typeof window === 'undefined') {
		// 	console.log(this.className + 'Skip API calling when building');
		// 	return of({ results: [] });
		// }
		console.log(this.className + 'Retrieving movie from douban');
		return this.http.get(`${this.doubanApi}`, { responseType: 'text' });
	}
}
