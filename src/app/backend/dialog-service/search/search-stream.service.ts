import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RATE_DECREASED, RATE_INCREASED } from '../../../common/app.constant';

@Injectable({ providedIn: 'root' })
export class SearchStreamService {
	private searchLogsSubject = new BehaviorSubject<string[]>([]);
	/** Observable stream of search log strings emitted during a Douban search. */
	public readonly searchLogs$ = this.searchLogsSubject.asObservable();

	/**
	 * Append a message to the search log stream.
	 *
	 * @param message - The log message to add.
	 */
	public addSearchLog(message: string) {
		const currentLogs = this.searchLogsSubject.value;
		this.searchLogsSubject.next([...currentLogs, message]);
	}

	/**
	 * Check the most recent search log entry for a rate change indicator.
	 *
	 * @returns RATE_INCREASED if the last log indicates an increase,
	 *          RATE_DECREASED if it indicates a decrease, or false if neither.
	 */
	public checkLastLogDecreasedOrIncreased() {
		const lastLog = this.searchLogsSubject.value[this.searchLogsSubject.value.length - 1];
		if (lastLog.includes(RATE_DECREASED)) {
			return RATE_DECREASED;
		} else if (lastLog.includes(RATE_INCREASED)) {
			return RATE_INCREASED;
		} else {
			return false;
		}
	}

	/**
	 * Clear all search log entries.
	 */
	public clearSearchLogs() {
		this.searchLogsSubject.next([]);
	}
}
