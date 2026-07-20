import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { VaultAccessService } from './vault-access.service';
import { DatabaseService } from '../database-service/database.service';
import {
	LS_VAULT_UNLOCKED_KEY,
	STATS_FIELD_VAULT_GRACE,
	VAULT_GRACE_ALWAYS,
	VAULT_GRACE_UNTIL_RELOAD
} from '../../common/constants';

describe('VaultAccessService', () => {
	let service: VaultAccessService;
	let stats$: Subject<Record<string, unknown>>;

	/**
	 * Builds the service with a mock DatabaseService whose getUserStats() feeds a controllable
	 * Subject, so a test can push the grace preference at will.
	 *
	 * @returns The freshly constructed service under test.
	 */
	function createService(): VaultAccessService {
		stats$ = new Subject<Record<string, unknown>>();
		const mockDb = {
			getUserStats: () => stats$,
			updateUserStatsFields: () => Promise.resolve()
		} as unknown as DatabaseService;
		TestBed.configureTestingModule({
			providers: [VaultAccessService, { provide: DatabaseService, useValue: mockDb }]
		});
		return TestBed.inject(VaultAccessService);
	}

	beforeEach(() => {
		/* markUnlocked() persists to real localStorage, and the constructor restores it — without
		   clearing, the first test's unlock leaks into every later test's "first visit" state. */
		localStorage.removeItem(LS_VAULT_UNLOCKED_KEY);
		service = createService();
	});

	it('requires the passphrase by default, even after an unlock', () => {
		service.markUnlocked();
		expect(service.shouldSkipPassphrase()).toBe(false);
	});

	it('always requires the passphrase when set to Always require', () => {
		stats$.next({ [STATS_FIELD_VAULT_GRACE]: VAULT_GRACE_ALWAYS });
		service.markUnlocked();
		service.markLeft();
		expect(service.shouldSkipPassphrase()).toBe(false);
	});

	it('never requires again after the first unlock when set to Until I reload', () => {
		stats$.next({ [STATS_FIELD_VAULT_GRACE]: VAULT_GRACE_UNTIL_RELOAD });
		expect(service.shouldSkipPassphrase()).toBe(false);
		service.markUnlocked();
		expect(service.shouldSkipPassphrase()).toBe(true);
	});

	it('requires the passphrase on the first visit regardless of grace', () => {
		stats$.next({ [STATS_FIELD_VAULT_GRACE]: 5 });
		service.markLeft();
		expect(service.shouldSkipPassphrase()).toBe(false);
	});

	describe('minute window (5 minutes)', () => {
		beforeEach(() => {
			jasmine.clock().install();
			jasmine.clock().mockDate(new Date(2026, 0, 1, 12, 0, 0));
			stats$.next({ [STATS_FIELD_VAULT_GRACE]: 5 });
			service.markUnlocked();
			service.markLeft();
		});

		afterEach(() => jasmine.clock().uninstall());

		it('skips the passphrase within the window', () => {
			jasmine.clock().tick(4 * 60_000 + 59_000);
			expect(service.shouldSkipPassphrase()).toBe(true);
		});

		it('skips at exactly the window boundary', () => {
			jasmine.clock().tick(5 * 60_000);
			expect(service.shouldSkipPassphrase()).toBe(true);
		});

		it('requires the passphrase past the window', () => {
			jasmine.clock().tick(5 * 60_000 + 1_000);
			expect(service.shouldSkipPassphrase()).toBe(false);
		});
	});
});
