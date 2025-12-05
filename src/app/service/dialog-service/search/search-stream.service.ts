import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SearchStreamService {
	private searchLogsSubject = new BehaviorSubject<string[]>([]);
	searchLogs$ = this.searchLogsSubject.asObservable();

	addSearchLog(message: string) {
		const currentLogs = this.searchLogsSubject.value;
        this.searchLogsSubject.next([...currentLogs, message]);
	}

	clearSearchLogs() {
		this.searchLogsSubject.next([]);
	}
}
