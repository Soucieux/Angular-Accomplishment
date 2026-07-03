import { TestBed } from '@angular/core/testing';

import {
	RATE_DECREASED,
	RATE_INCREASED,
	ENT_LOG_SPAN_CLASS_RATE_DOWN,
	ENT_LOG_SPAN_CLASS_RATE_UP
} from '../../../common/constants';
import { SearchStreamService } from './search-stream.service';

describe('SearchStreamService', () => {
	let service: SearchStreamService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(SearchStreamService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	// ── addSearchLog ───────────────────────────────────────────────────────

	describe('addSearchLog', () => {
		it('appends a message to the log stream', () => {
			service.addSearchLog('first');
			service.addSearchLog('second');
			let logs: string[] = [];
			service.searchLogs$.subscribe((v) => (logs = v));
			expect(logs).toEqual(['first', 'second']);
		});
	});

	// ── checkLastLogDecreasedOrIncreased ───────────────────────────────────

	describe('checkLastLogDecreasedOrIncreased', () => {
		it('returns RATE_DECREASED when the last log contains the decrease indicator', () => {
			service.addSearchLog(`rate <span ${ENT_LOG_SPAN_CLASS_RATE_DOWN}>down</span>`);
			expect(service.checkLastLogDecreasedOrIncreased()).toBe(RATE_DECREASED);
		});

		it('returns RATE_INCREASED when the last log contains the increase indicator', () => {
			service.addSearchLog(`rate <span ${ENT_LOG_SPAN_CLASS_RATE_UP}>up</span>`);
			expect(service.checkLastLogDecreasedOrIncreased()).toBe(RATE_INCREASED);
		});

		it('returns false when the last log has no rate change indicator', () => {
			service.addSearchLog('Movie fetched successfully');
			expect(service.checkLastLogDecreasedOrIncreased()).toBeFalse();
		});
	});

	// ── clearSearchLogs ────────────────────────────────────────────────────

	describe('clearSearchLogs', () => {
		it('empties the log stream', () => {
			service.addSearchLog('something');
			service.clearSearchLogs();
			let logs: string[] = ['not-empty'];
			service.searchLogs$.subscribe((v) => (logs = v));
			expect(logs).toEqual([]);
		});
	});
});
