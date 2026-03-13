import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RATE_DECREASED, RATE_INCREASED } from '../../../common/app.constant';

@Injectable({ providedIn: 'root' })
export class SearchStreamService {
	private searchLogsSubject = new BehaviorSubject<string[]>([]);
	searchLogs$ = this.searchLogsSubject.asObservable();

	addSearchLog(message: string) {
		const currentLogs = this.searchLogsSubject.value;
		this.searchLogsSubject.next([...currentLogs, message]);
	}

	checkLastLogDecreasedOrIncreased() {
		const lastLog = this.searchLogsSubject.value[this.searchLogsSubject.value.length - 1];
		if (lastLog.includes(RATE_DECREASED)) {
			return RATE_DECREASED;
		} else if (lastLog.includes(RATE_INCREASED)) {
			return RATE_INCREASED;
		} else {
			return false;
		}
	}

	clearSearchLogs() {
		this.searchLogsSubject.next([]);
	}
}
