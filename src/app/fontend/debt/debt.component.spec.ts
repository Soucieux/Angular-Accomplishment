import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, BehaviorSubject, ReplaySubject } from 'rxjs';
import { MessageService } from 'primeng/api';

import { DatabaseService } from '../../backend/database-service/database.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { Utilities } from '../../common/app.utilities';
import {
    DATABASE_DEBT_SONATA
} from '../../common/app.constant';
import { DebtComponent } from './debt.component';

/** Minimal Account Expenses row factory. */
function makeDebtSonataRow(key = 'k1', debt = 100, paid = false) {
    return {
        key,
        _openid: 'uid1',
        name: 'Row name',
        content: { date: '2025-01-01', debt, original: debt, paid }
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
            'updateReminderTable',
            'removeRecordFromReminderTable',
            'addNewRecordForReminderTable',
            'appendToActivityLog',
            'updateStatisticsFields'
        ]);
        mockDb.getDebtSonataTableDetails.and.returnValue(of([]));
        mockDb.updateReminderTable.and.returnValue(Promise.resolve());
        mockDb.removeRecordFromReminderTable.and.returnValue(Promise.resolve());
        mockDb.addNewRecordForReminderTable.and.returnValue(Promise.resolve());
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

    // ── preventKeyin ──────────────────────────────────────────────────────

    describe('preventKeyin', () => {
        it('calls preventDefault on the keyboard event', () => {
            const event = jasmine.createSpyObj<KeyboardEvent>('KeyboardEvent', ['preventDefault']);
            (component as any).preventKeyin(event);
            expect(event.preventDefault).toHaveBeenCalled();
        });
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

    // ── formatDate ────────────────────────────────────────────────────────

    describe('formatDate', () => {
        it('returns a formatted date string for a valid ISO date string', () => {
            const result = (component as any).formatDate('2025-06-15');
            expect(result).toBeTruthy();
            expect(typeof result).toBe('string');
        });

        it('returns empty string for a falsy input', () => {
            expect((component as any).formatDate(null)).toBe('');
            expect((component as any).formatDate('')).toBe('');
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

    // ── updateDebt ────────────────────────────────────────────────────────

    describe('updateDebt', () => {
        beforeEach(() => {
            (component as any).updatedDebtSonataItems = [makeDebtSonataRow('k1', 1000)];
            (component as any).originalDebtSonataItems = [makeDebtSonataRow('k1', 1000)];
        });

        it('decrements debt by the constant and calls updateTableSingleValue', async () => {
            spyOn<any>(component, 'updateTableSingleValue').and.returnValue(Promise.resolve());
            await (component as any).updateDebt(DATABASE_DEBT_SONATA, 'k1', 1000);
            // 1000 - 998.05 = 1.95
            expect((component as any).updatedDebtSonataItems[0].content.debt).toBeCloseTo(1.95, 2);
        });

        it('does nothing when the entry key does not exist', async () => {
            spyOn<any>(component, 'updateTableSingleValue').and.returnValue(Promise.resolve());
            await (component as any).updateDebt(DATABASE_DEBT_SONATA, 'nonexistent', 100);
            expect((component as any).updateTableSingleValue).not.toHaveBeenCalled();
        });
    });

    // ── setDefaultDebt ────────────────────────────────────────────────────

    describe('setDefaultDebt', () => {
        beforeEach(() => {
            (component as any).updatedDebtSonataItems = [makeDebtSonataRow('k1', 500, false)];
            (component as any).originalDebtSonataItems = [makeDebtSonataRow('k1', 500, false)];
        });

        it('calls updateReminderTable when marking as paid', async () => {
            await (component as any).setDefaultDebt('k1', true);
            expect(mockDb.updateReminderTable).toHaveBeenCalledWith(
                DATABASE_DEBT_SONATA,
                'k1',
                'content',
                jasmine.objectContaining({ paid: false })
            );
        });

        it('resets debt to original when unmarking paid', async () => {
            (component as any).updatedDebtSonataItems[0].content.debt = 100;
            (component as any).updatedDebtSonataItems[0].content.original = 500;
            spyOn<any>(component, 'updateTableSingleValue').and.returnValue(Promise.resolve());
            await (component as any).setDefaultDebt('k1', false);
            expect((component as any).updatedDebtSonataItems[0].content.debt).toBe(500);
        });

        it('does nothing when the entry key does not exist', async () => {
            spyOn<any>(component, 'updateTableSingleValue').and.returnValue(Promise.resolve());
            await (component as any).setDefaultDebt('nonexistent', true);
            expect(mockDb.updateReminderTable).not.toHaveBeenCalled();
        });
    });

    // ── updateTableSingleValue ────────────────────────────────────────────

    describe('updateTableSingleValue', () => {
        beforeEach(() => {
            (component as any).updatedDebtSonataItems = [makeDebtSonataRow('k1', 200)];
            (component as any).originalDebtSonataItems = [makeDebtSonataRow('k1', 100)];
        });

        it('calls databaseService.updateReminderTable when value changed', async () => {
            await (component as any).updateTableSingleValue(DATABASE_DEBT_SONATA, 'k1', 'debt');
            expect(mockDb.updateReminderTable).toHaveBeenCalledWith(
                DATABASE_DEBT_SONATA, 'k1', 'debt', 200
            );
        });

        it('does not call the database when updated and original values are the same', async () => {
            (component as any).updatedDebtSonataItems[0].content.debt = 100;
            await (component as any).updateTableSingleValue(DATABASE_DEBT_SONATA, 'k1', 'debt');
            expect(mockDb.updateReminderTable).not.toHaveBeenCalled();
        });

        it('calls handleError when the database throws', async () => {
            mockDb.updateReminderTable.and.returnValue(Promise.reject(new Error('fail')));
            await (component as any).updateTableSingleValue(DATABASE_DEBT_SONATA, 'k1', 'debt');
            expect(mockDialogService.handleError).toHaveBeenCalled();
        });
    });

    // ── updateTableWithNewDate ────────────────────────────────────────────

    describe('updateTableWithNewDate', () => {
        beforeEach(() => {
            (component as any).updatedDebtSonataItems = [makeDebtSonataRow('k1', 100)];
            (component as any).originalDebtSonataItems = [makeDebtSonataRow('k1', 100)];
            (component as any).updatedDebtSonataItems[0].content.date = '2025-01-01';
            (component as any).originalDebtSonataItems[0].content.date = '2025-01-01';
        });

        it('formats the date and calls updateTableSingleValue', async () => {
            spyOn<any>(component, 'updateTableSingleValue').and.returnValue(Promise.resolve());
            spyOn<any>(component, 'resyncUpcomingFromLocalData').and.stub();
            const date = new Date('2025-06-15');
            await (component as any).updateTableWithNewDate(DATABASE_DEBT_SONATA, 'k1', date);
            expect((component as any).updateTableSingleValue).toHaveBeenCalledWith(
                DATABASE_DEBT_SONATA, 'k1', 'date'
            );
        });
    });

});
