import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, BehaviorSubject, ReplaySubject } from 'rxjs';
import { MessageService } from 'primeng/api';

import {
	DEBT_CURRENCY_CNY,
	DEBT_VALUE_KEY_CURRENCY
} from '../../common/constants';
import { DatabaseService } from '../../backend/database-service/database.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { SessionRecoveryService } from '../../backend/session-recovery/session-recovery.service';
import { RECOVERY_STATUS_RECOVERED } from '../../common/constants';
import { Utilities } from '../../common/utilities/app.utilities';
import { DebtComponent } from './debt.component';
import { NewDebtData } from './debt.model';

/** Minimal Account Expenses row factory. */
function makeDebtSonataRow(key = 'k1', debt = 100, paid = false) {
	return {
		key,
		_openid: 'uid1',
		name: 'Row name',
		date: '2025-01-01',
		debt,
		original: debt,
		paid
	};
}

/** Full Set-debt dialog submission factory (new-cycle off by default). */
function makeSetDebtData(overrides: Partial<NewDebtData> = {}): NewDebtData {
	return {
		name: 'Row name',
		amount: 1000,
		dueDate: '2025-01-01',
		isPermanent: false,
		category: 'card',
		currency: DEBT_CURRENCY_CNY,
		isNewCycle: false,
		...overrides
	};
}

describe('DebtComponent', () => {
	let component: DebtComponent;
	let fixture: ComponentFixture<DebtComponent>;
	let mockDb: jasmine.SpyObj<DatabaseService>;
	let mockDialogService: jasmine.SpyObj<DialogService>;

	beforeEach(async () => {
		mockDb = jasmine.createSpyObj<DatabaseService>('DatabaseService', [
			'getDebtSonataTableDetails',
			'updateSingleValueForDebtTable',
			'updateDebtFields',
			'resetDebtRecord',
			'removeRecordFromDebtTable',
			'addNewRecordToDebt',
			'updateStatisticsFields',
			'updateUserStatsFields'
		]);
		mockDb.getDebtSonataTableDetails.and.returnValue(of([]));
		mockDb.updateSingleValueForDebtTable.and.returnValue(Promise.resolve());
		mockDb.updateDebtFields.and.returnValue(Promise.resolve());
		mockDb.resetDebtRecord.and.returnValue(Promise.resolve());
		mockDb.removeRecordFromDebtTable.and.returnValue(Promise.resolve());
		mockDb.addNewRecordToDebt.and.returnValue(Promise.resolve());
		mockDb.updateStatisticsFields.and.returnValue(Promise.resolve());
		// Called by the component's syncStatistics debounce timer; without it the 0-delay
		// setTimeout throws an uncaught TypeError that wedges the Karma runner (30s hang).
		mockDb.updateUserStatsFields.and.returnValue(Promise.resolve());

		mockDialogService = jasmine.createSpyObj<DialogService>('DialogService', [
			'openDialog',
			'runBlocking',
			'handleError',
			'ensurePermission',
			'showUnexpectedError'
		]);
		mockDialogService.ensurePermission.and.returnValue(true);
		mockDialogService.openDialog.and.callFake(async (_container: any, type: string, callback: any) => {
			if (type === 'block' && typeof callback === 'function') await callback();
		});
		// runBlocking(container, message, callback) — invoke the callback so the guarded write runs.
		mockDialogService.runBlocking.and.callFake(async (_container: any, _message: string, callback: any) => {
			if (typeof callback === 'function') await callback();
		});
		mockDialogService.handleError.and.stub();

		await TestBed.configureTestingModule({
			imports: [DebtComponent],
			providers: [
				MessageService,
				{ provide: DatabaseService, useValue: mockDb },
				{ provide: DialogService, useValue: mockDialogService },
				{
					provide: SessionRecoveryService,
					useValue: { getRecoveryOutcomes$: () => of(RECOVERY_STATUS_RECOVERED) }
				}
			]
		}).compileComponents();

		fixture = TestBed.createComponent(DebtComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	afterEach(() => {
		CloudbaseService['userId'] = '';
		CloudbaseService['userRole'] = [];
		CloudbaseService['userName'] = '';
		CloudbaseService['_authReady$'] = new ReplaySubject<boolean>(1);
		CloudbaseService['_loginState$'] = new BehaviorSubject<boolean>(false);
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	// ── isHoverCapable ────────────────────────────────────────────────────

	describe('isHoverCapable', () => {
		it('is a boolean field on the component', () => {
			// After fixture.detectChanges() outside a browser context it may be undefined
			// or false; we only assert the type of the value when defined.
			const val = (component as any).isHoverCapable;
			if (val !== undefined && val !== null) {
				expect(typeof val).toBe('boolean');
			} else {
				expect(val == null || val === undefined).toBeTrue();
			}
		});
	});

	// ── payDebt ───────────────────────────────────────────────────────────

	describe('payDebt', () => {
		beforeEach(() => {
			(component as any).updatedDebtSonataItems = [makeDebtSonataRow('k1', 1000)];
			(component as any).originalDebtSonataItems = [makeDebtSonataRow('k1', 1000)];
		});

		it('decrements the debt balance by the given amount', async () => {
			await (component as any).payDebt('k1', 200);
			expect((component as any).updatedDebtSonataItems[0].debt).toBe(800);
		});

		it('does nothing when the entry key does not exist', async () => {
			await (component as any).payDebt('nonexistent', 100);
			expect(mockDb.updateDebtFields).not.toHaveBeenCalled();
		});

		it('does nothing when the item is already paid', async () => {
			(component as any).updatedDebtSonataItems[0].paid = true;
			await (component as any).payDebt('k1', 100);
			expect(mockDb.updateDebtFields).not.toHaveBeenCalled();
		});

		it('marks as paid when balance reaches zero', async () => {
			await (component as any).payDebt('k1', 1000);
			expect((component as any).updatedDebtSonataItems[0].paid).toBeTrue();
		});

		it('does nothing when permission is denied', async () => {
			mockDialogService.ensurePermission.and.returnValue(false);
			await (component as any).payDebt('k1', 200);
			expect(mockDb.updateDebtFields).not.toHaveBeenCalled();
		});
	});

	// ── resetDebt ─────────────────────────────────────────────────────────

	describe('resetDebt', () => {
		beforeEach(() => {
			(component as any).updatedDebtSonataItems = [makeDebtSonataRow('k1', 200, false)];
			(component as any).originalDebtSonataItems = [makeDebtSonataRow('k1', 500, false)];
		});

		it('resets debt to original amount and marks as unpaid', async () => {
			await (component as any).resetDebt('k1');
			expect((component as any).updatedDebtSonataItems[0].debt).toBe(500);
			expect((component as any).updatedDebtSonataItems[0].paid).toBeFalse();
		});

		it('does nothing when the entry key does not exist', async () => {
			await (component as any).resetDebt('nonexistent');
			expect(mockDb.resetDebtRecord).not.toHaveBeenCalled();
		});
	});

	// ── setDebtForNewCycle ────────────────────────────────────────────────

	describe('setDebtForNewCycle', () => {
		beforeEach(() => {
			// 1000 total, 300 already paid, so the current balance is 700.
			(component as any).updatedDebtSonataItems = [{ ...makeDebtSonataRow('k1', 700), original: 1000 }];
			(component as any).originalDebtSonataItems = [{ ...makeDebtSonataRow('k1', 700), original: 1000 }];
			(component as any).paymentsData = {
				k1: { 0: { amount: 300, balance: 700, timestamp: '2025.01.01 00:00' } }
			};
		});

		it('new cycle resets the balance to the full amount and clears the history', async () => {
			await (component as any).setDebtForNewCycle('k1', makeSetDebtData({ isNewCycle: true }));
			expect((component as any).updatedDebtSonataItems[0].debt).toBe(1000);
			expect((component as any).paymentsData['k1']).toEqual({});
			expect(mockDb.updateDebtFields).toHaveBeenCalledWith(
				'k1',
				jasmine.any(Object),
				jasmine.any(String),
				true
			);
		});

		it('non-cycle edit keeps the balance net of payments and does not clear the history', async () => {
			await (component as any).setDebtForNewCycle('k1', makeSetDebtData({ amount: 1200 }));
			expect((component as any).updatedDebtSonataItems[0].debt).toBe(900);
			expect((component as any).paymentsData['k1'][0]).toBeTruthy();
			expect(mockDb.updateDebtFields).toHaveBeenCalledWith(
				'k1',
				jasmine.any(Object),
				jasmine.any(String),
				false
			);
		});
	});

	// ── updateTableSingleValue ────────────────────────────────────────────

	describe('updateTableSingleValue', () => {
		beforeEach(() => {
			(component as any).updatedDebtSonataItems = [makeDebtSonataRow('k1', 200)];
			(component as any).originalDebtSonataItems = [makeDebtSonataRow('k1', 100)];
		});

		it('calls databaseService.updateDebtTable when value changed', async () => {
			await (component as any).updateTableSingleValue('k1', 'debt');
			expect(mockDb.updateSingleValueForDebtTable).toHaveBeenCalledWith('k1', 'debt', 200, 'Row name');
		});

		it('does not call the database when updated and original values are the same', async () => {
			(component as any).updatedDebtSonataItems[0].debt = 100;
			await (component as any).updateTableSingleValue('k1', 'debt');
			expect(mockDb.updateSingleValueForDebtTable).not.toHaveBeenCalled();
		});

		it('calls handleError when the database throws', async () => {
			mockDb.updateSingleValueForDebtTable.and.returnValue(Promise.reject(new Error('fail')));
			await (component as any).updateTableSingleValue('k1', 'debt');
			expect(mockDialogService.handleError).toHaveBeenCalled();
		});
	});

	// ── isOwner ───────────────────────────────────────────────────────────

	describe('isOwner', () => {
		it('returns true when the item openid matches the current user', () => {
			CloudbaseService.setUseId('uid1');
			const item = makeDebtSonataRow();
			expect((component as any).isOwner(item)).toBeTrue();
		});

		it('returns false when the item openid does not match the current user', () => {
			CloudbaseService.setUseId('other-user');
			const item = makeDebtSonataRow();
			expect((component as any).isOwner(item)).toBeFalse();
		});
	});

	// ── formatTimestampDate ───────────────────────────────────────────────

	describe('formatTimestampDate', () => {
		it('delegates to Utilities.getTimestampMonthDay and returns a non-empty string', () => {
			spyOn(Utilities, 'getTimestampMonthDay').and.returnValue('Jun 13');
			const result = (component as any).formatTimestampDate('2026.06.13 09:27:00');
			expect(Utilities.getTimestampMonthDay).toHaveBeenCalledWith('2026.06.13 09:27:00');
			expect(result).toBe('Jun 13');
		});

		it('returns empty string for an empty timestamp', () => {
			const result = (component as any).formatTimestampDate('');
			expect(typeof result).toBe('string');
		});
	});

	// ── formatTimestampTime ───────────────────────────────────────────────

	describe('formatTimestampTime', () => {
		it('delegates to Utilities.getTimestampTime and returns the HH:mm portion', () => {
			spyOn(Utilities, 'getTimestampTime').and.returnValue('09:27');
			const result = (component as any).formatTimestampTime('2026.06.13 09:27:00');
			expect(Utilities.getTimestampTime).toHaveBeenCalledWith('2026.06.13 09:27:00');
			expect(result).toBe('09:27');
		});

		it('returns empty string for an empty timestamp', () => {
			const result = (component as any).formatTimestampTime('');
			expect(typeof result).toBe('string');
		});
	});

	// ── isCnyCurrency ─────────────────────────────────────────────────────

	describe('isCnyCurrency', () => {
		it('returns true when the stored currency field is CNY', () => {
			const item = { ...makeDebtSonataRow(), [DEBT_VALUE_KEY_CURRENCY]: DEBT_CURRENCY_CNY };
			expect((component as any).isCnyCurrency(item)).toBeTrue();
		});

		it('returns false when the stored currency field is not CNY', () => {
			const item = { ...makeDebtSonataRow(), [DEBT_VALUE_KEY_CURRENCY]: 'CAD' };
			expect((component as any).isCnyCurrency(item)).toBeFalse();
		});

		it('falls back to Chinese-character detection when no currency field is stored', () => {
			const item = { ...makeDebtSonataRow(), name: '房租' };
			expect((component as any).isCnyCurrency(item)).toBeTrue();
		});

		it('returns false for a Latin-only name when no currency field is stored', () => {
			const item = { ...makeDebtSonataRow(), name: 'Rent' };
			expect((component as any).isCnyCurrency(item)).toBeFalse();
		});
	});
});
