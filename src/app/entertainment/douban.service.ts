import { LOG } from './../log';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class DoubanService {
    private readonly className = 'DoubanService';
    
    private doubanApi = '/api/j/search_subjects?tag=Inception';

	constructor(private http: HttpClient) {}

	searchMovie(): Observable<any> {
		LOG.info(this.className, 'Retrieving data...');
		/*  Note: If using 'ng serve', it is running as client and server at the same time, 
                        but 'server.ts' is not executing, so client loads the proxy with this command.
                       If using 'npm run serve:ssr', 'server.ts' is executing, server loads the proxy,
                       and client does not load proxy with this command.
        */
		return this.http
			.get(`${this.doubanApi}`, { responseType: 'json' });
	}
}
