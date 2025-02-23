import axios from 'axios';
import * as cheerio from 'cheerio';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class doubanService {
	private doubanApi = 'api/movie/subject_search?search_text=Inception';

	constructor(private http: HttpClient) {}

	searchRates() {
		this.http
			.get(`${this.doubanApi}`, {responseType: 'text'})
			.subscribe((data) => console.log(data));
	}
}
