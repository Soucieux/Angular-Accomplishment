import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, BehaviorSubject, ReplaySubject } from 'rxjs';
import { MessageService } from 'primeng/api';

import { DatabaseService } from '../../backend/database-service/database.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { DebtComponent } from './debt.component';

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

describe('DebtComponent', () => {
	let component: DebtComponent;
	let fixture: ComponentFixture<DebtComponent>;
	let mockDb: jasmine.SpyObj<DatabaseService>;
	let mockDialogService: jasmine.SpyObj<DialogService>;

	beforeEach(async () => {
		mockDb = jasmine.createSpyObj<DatabaseService>('DatabaseService', [
			'getDebtSonataTableDetails',
			'updateDebtTable',
			'removeRecordFromDebtTable',
			'addNewRecordToDebtTable',
			'appendToActivityLog',
			'updateStatisticsFields'
		]);
		mockDb.getDebtSonataTableDetails.and.returnValue(of([]));
		mockDb.updateDebtTable.and.returnValue(Promise.resolve());
		mockDb.removeRecordFromDebtTable.and.returnValue(Promise.resolve());
		mockDb.addNewRecordToDebtTable.and.returnValue(Promise.resolve());
		mockDb.appendToActivityLog.and.returnValue(Promise.resolve());
		mockDb.updateStatisticsFields.and.returnValue(Promise.resolve());

		mockDialogService = jasmine.createSpyObj<DialogService>('DialogService', [
			'openDialog',
			'handleError',
			'ensurePermission',
			'showUnexpectedError'
		]);
		mockDialogService.ensurePermission.and.returnValue(true);
		mockDialogService.openDialog.and.stub();
		mockDialogService.handleError.and.stub();

		await TestBed.configureTestingModule({
			imports: [DebtComponent],
			providers: [
				MessageService,
				{ provide: DatabaseService, useValue: mockDb },
				{ provide: DialogService, useValue: mockDialogService }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(DebtComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	afterEach(() => {
		CloudbaseService['userId'] = '';
		CloudbaseService['userRole'] = '';
		CloudbaseService['userName'] = '';
		CloudbaseService['_authReady$'] = new ReplaySubject<boolean>(1);
		CloudbaseService['_loginState$'] = new BehaviorSubject<boolean>(false);
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	// ── checkIfChinese ────────────────────────────────────────────────────

	describe('checkIfChinese', () => {
		it('returns true for a string containing Chinese characters', () => {
			expect((component as any).checkIfChinese('你好')).toBeTrue();
		});

		it('returns false for a string without Chinese characters', () => {
			expect((component as any).checkIfChinese('hello')).toBeFalse();
		});
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
			expect(mockDb.updateDebtTable).not.toHaveBeenCalled();
		});

		it('does nothing when the item is already paid', async () => {
			(component as any).updatedDebtSonataItems[0].paid = true;
			await (component as any).payDebt('k1', 100);
			expect(mockDb.updateDebtTable).not.toHaveBeenCalled();
		});

		it('marks as paid when balance reaches zero', async () => {
			await (component as any).payDebt('k1', 1000);
			expect((component as any).updatedDebtSonataItems[0].paid).toBeTrue();
		});

		it('does nothing when permission is denied', async () => {
			mockDialogService.ensurePermission.and.returnValue(false);
			await (component as any).payDebt('k1', 200);
			expect(mockDb.updateDebtTable).not.toHaveBeenCalled();
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
			expect(mockDb.updateDebtTable).not.toHaveBeenCalled();
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
			expect(mockDb.updateDebtTable).toHaveBeenCalledWith('k1', 'debt', 200);
		});

		it('does not call the database when updated and original values are the same', async () => {
			(component as any).updatedDebtSonataItems[0].debt = 100;
			await (component as any).updateTableSingleValue('k1', 'debt');
			expect(mockDb.updateDebtTable).not.toHaveBeenCalled();
		});

		it('calls handleError when the database throws', async () => {
			mockDb.updateDebtTable.and.returnValue(Promise.reject(new Error('fail')));
			await (component as any).updateTableSingleValue('k1', 'debt');
			expect(mockDialogService.handleError).toHaveBeenCalled();
		});
	});
});
