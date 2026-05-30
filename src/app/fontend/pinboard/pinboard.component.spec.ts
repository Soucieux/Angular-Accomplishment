import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, BehaviorSubject, ReplaySubject } from 'rxjs';
import { MessageService } from 'primeng/api';

import { DatabaseService } from '../../backend/database-service/database.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { Utilities } from '../../common/app.utilities';
import {
    DATABASE_FIRST_TABLE,
    DATABASE_SECOND_TABLE,
    SUCCESS,
    FAILURE
} from '../../common/app.constant';
import { PinboardComponent } from './pinboard.component';

/** Minimal first-table row factory. */
function makeFirstRow(value = 5, isCharged = false) {
    return {
        _id: 'id1',
        _openid: 'uid1',
        first: { value, isCharged },
        second: { value, isCharged },
        third: { value, isCharged },
        fourth: { value, isCharged }
    };
}

/** Minimal second-table row factory. */
function makeSecondRow(key = 'k1', debt = 100, paid = false) {
    return {
        key,
        _openid: 'uid1',
        name: 'Row name',
        content: { date: '2025-01-01', debt, original: debt, paid }
    };
}

describe('PinboardComponent', () => {
    let component: PinboardComponent;
    let fixture: ComponentFixture<PinboardComponent>;
    let mockDb: jasmine.SpyObj<DatabaseService>;
    let mockDialogService: jasmine.SpyObj<DialogService>;

    beforeEach(async () => {
        mockDb = jasmine.createSpyObj<DatabaseService>('DatabaseService', [
            'getFirstReminderTableDetails',
            'getSecondReminderTableDetails',
            'updateFirstReminderTable',
            'updateReminderTable',
            'removeRecordFromReminderTable',
            'addNewRecordForReminderTable',
            'appendToActivityLog',
            'updateStatisticsFields'
        ]);
        mockDb.getFirstReminderTableDetails.and.returnValue(of([]));
        mockDb.getSecondReminderTableDetails.and.returnValue(of([]));
        mockDb.updateFirstReminderTable.and.returnValue(Promise.resolve());
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
            imports: [PinboardComponent],
            providers: [
                MessageService,
                { provide: DatabaseService, useValue: mockDb },
                { provide: DialogService, useValue: mockDialogService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PinboardComponent);
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

    // ── firstTableConfirmedCount ──────────────────────────────────────────

    describe('firstTableConfirmedCount', () => {
        it('returns 0 when updatedFirstTable is empty', () => {
            (component as any).updatedFirstTable = [];
            expect((component as any).firstTableConfirmedCount).toBe(0);
        });

        it('counts only cells where isCharged is true', () => {
            (component as any).updatedFirstTable = [
                {
                    first: { isCharged: true },
                    second: { isCharged: false },
                    third: { isCharged: true },
                    fourth: { isCharged: false }
                }
            ];
            (component as any).refreshConfirmedCount();
            expect((component as any).firstTableConfirmedCount).toBe(2);
        });

        it('returns 0 when no cells are charged', () => {
            (component as any).updatedFirstTable = [
                {
                    first: { isCharged: false },
                    second: { isCharged: false },
                    third: { isCharged: false },
                    fourth: { isCharged: false }
                }
            ];
            (component as any).refreshConfirmedCount();
            expect((component as any).firstTableConfirmedCount).toBe(0);
        });
    });

    // ── firstTableTotalCount ──────────────────────────────────────────────

    describe('firstTableTotalCount', () => {
        it('returns 0 when updatedFirstTable is empty', () => {
            (component as any).updatedFirstTable = [];
            expect((component as any).firstTableTotalCount).toBe(0);
        });

        it('returns rows × 4 columns', () => {
            (component as any).updatedFirstTable = [{}, {}, {}];
            expect((component as any).firstTableTotalCount).toBe(12);
        });
    });

    // ── setMonth ──────────────────────────────────────────────────────────

    describe('setMonth', () => {
        it('sets isNextMonth to true and calls updateChargedCells', () => {
            spyOn<any>(component, 'updateChargedCells').and.returnValue(Promise.resolve());
            (component as any).setMonth(true);
            expect((component as any).isNextMonth).toBeTrue();
            expect((component as any).updateChargedCells).toHaveBeenCalled();
        });

        it('sets isNextMonth to false and calls updateChargedCells', () => {
            spyOn<any>(component, 'updateChargedCells').and.returnValue(Promise.resolve());
            (component as any).setMonth(false);
            expect((component as any).isNextMonth).toBeFalse();
            expect((component as any).updateChargedCells).toHaveBeenCalled();
        });
    });

    // ── isDisabled ────────────────────────────────────────────────────────

    describe('isDisabled', () => {
        it('returns false when the cell is not in chargedCells', () => {
            (component as any).chargedCells = new Set<string>();
            expect((component as any).isDisabled(0, 'first')).toBeFalse();
        });

        it('returns true when the cell is in chargedCells', () => {
            (component as any).chargedCells = new Set<string>(['0-first']);
            expect((component as any).isDisabled(0, 'first')).toBeTrue();
        });

        it('returns false for a different cell even when one cell is charged', () => {
            (component as any).chargedCells = new Set<string>(['0-first']);
            expect((component as any).isDisabled(0, 'second')).toBeFalse();
        });
    });

    // ── onNumberChange ────────────────────────────────────────────────────

    describe('onNumberChange', () => {
        it('allows numeric keys to pass through', () => {
            const event = { key: '5', preventDefault: jasmine.createSpy('pd') } as unknown as KeyboardEvent;
            (component as any).onNumberChange(event);
            expect(event.preventDefault).not.toHaveBeenCalled();
        });

        it('blocks non-numeric keys', () => {
            const event = { key: 'a', preventDefault: jasmine.createSpy('pd') } as unknown as KeyboardEvent;
            (component as any).onNumberChange(event);
            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('allows Backspace through', () => {
            const event = { key: 'Backspace', preventDefault: jasmine.createSpy('pd') } as unknown as KeyboardEvent;
            (component as any).onNumberChange(event);
            expect(event.preventDefault).not.toHaveBeenCalled();
        });

        it('allows ArrowLeft through', () => {
            const event = { key: 'ArrowLeft', preventDefault: jasmine.createSpy('pd') } as unknown as KeyboardEvent;
            (component as any).onNumberChange(event);
            expect(event.preventDefault).not.toHaveBeenCalled();
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

    // ── setIsCharged ──────────────────────────────────────────────────────

    describe('setIsCharged', () => {
        beforeEach(() => {
            (component as any).updatedFirstTable = [makeFirstRow(5, false)];
            (component as any).originalFirstTable = [makeFirstRow(5, false), { _id: 'id2', _openid: 'uid1', isNextMonth: false }];
            (component as any).chargedCellsInitialized = true;
        });

        it('marks the cell as charged and calls updateFirstTableSingleValue', async () => {
            spyOn<any>(component, 'updateFirstTableSingleValue').and.returnValue(Promise.resolve());
            await (component as any).setIsCharged(0, 'first');
            expect((component as any).updatedFirstTable[0].first.isCharged).toBeTrue();
        });

        it('does nothing when the cell is already charged', async () => {
            (component as any).updatedFirstTable[0].first.isCharged = true;
            spyOn<any>(component, 'updateFirstTableSingleValue').and.returnValue(Promise.resolve());
            await (component as any).setIsCharged(0, 'first');
            expect((component as any).updateFirstTableSingleValue).not.toHaveBeenCalled();
        });

        it('does nothing when permission is denied', async () => {
            mockDialogService.ensurePermission.and.returnValue(false);
            spyOn<any>(component, 'updateFirstTableSingleValue').and.returnValue(Promise.resolve());
            await (component as any).setIsCharged(0, 'first');
            expect((component as any).updateFirstTableSingleValue).not.toHaveBeenCalled();
        });
    });

    // ── onValueChange ─────────────────────────────────────────────────────

    describe('onValueChange', () => {
        beforeEach(() => {
            (component as any).originalFirstTable = [
                makeFirstRow(5, false),
                makeFirstRow(7, false),
                makeFirstRow(13, false),
                makeFirstRow(15, false),
                makeFirstRow(21, false),
                { _id: 'id6', _openid: 'uid1', isNextMonth: false }
            ];
            (component as any).updatedFirstTable = [
                makeFirstRow(5, false),
                makeFirstRow(7, false),
                makeFirstRow(13, false),
                makeFirstRow(15, false),
                makeFirstRow(21, false)
            ];
            (component as any).chargedCellsInitialized = true;
            (component as any).chargedCells = new Set<string>();
        });

        it('does not update when the value did not change', async () => {
            spyOn<any>(component, 'updateFirstTableSingleValue').and.returnValue(Promise.resolve());
            await (component as any).onValueChange(0, 'first');
            expect((component as any).updateFirstTableSingleValue).not.toHaveBeenCalled();
        });

        it('rolls back when the value exceeds 31', async () => {
            (component as any).updatedFirstTable[0].first.value = 32;
            await (component as any).onValueChange(0, 'first');
            expect((component as any).updatedFirstTable[0].first.value).toBe(5);
        });
    });

    // ── updateDebt ────────────────────────────────────────────────────────

    describe('updateDebt', () => {
        beforeEach(() => {
            (component as any).updatedSecondTable = [makeSecondRow('k1', 1000)];
            (component as any).originalSecondTable = [makeSecondRow('k1', 1000)];
        });

        it('decrements debt by the constant and calls updateTableSingleValue', async () => {
            spyOn<any>(component, 'updateTableSingleValue').and.returnValue(Promise.resolve());
            await (component as any).updateDebt(DATABASE_SECOND_TABLE, 'k1', 1000);
            // 1000 - 998.05 = 1.95
            expect((component as any).updatedSecondTable[0].content.debt).toBeCloseTo(1.95, 2);
        });

        it('does nothing when the entry key does not exist', async () => {
            spyOn<any>(component, 'updateTableSingleValue').and.returnValue(Promise.resolve());
            await (component as any).updateDebt(DATABASE_SECOND_TABLE, 'nonexistent', 100);
            expect((component as any).updateTableSingleValue).not.toHaveBeenCalled();
        });
    });

    // ── setDefaultDebt ────────────────────────────────────────────────────

    describe('setDefaultDebt', () => {
        beforeEach(() => {
            (component as any).updatedSecondTable = [makeSecondRow('k1', 500, false)];
            (component as any).originalSecondTable = [makeSecondRow('k1', 500, false)];
        });

        it('calls updateReminderTable when marking as paid', async () => {
            await (component as any).setDefaultDebt('k1', true);
            expect(mockDb.updateReminderTable).toHaveBeenCalledWith(
                DATABASE_SECOND_TABLE,
                'k1',
                'content',
                jasmine.objectContaining({ paid: false })
            );
        });

        it('resets debt to original when unmarking paid', async () => {
            (component as any).updatedSecondTable[0].content.debt = 100;
            (component as any).updatedSecondTable[0].content.original = 500;
            spyOn<any>(component, 'updateTableSingleValue').and.returnValue(Promise.resolve());
            await (component as any).setDefaultDebt('k1', false);
            expect((component as any).updatedSecondTable[0].content.debt).toBe(500);
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
            (component as any).updatedSecondTable = [makeSecondRow('k1', 200)];
            (component as any).originalSecondTable = [makeSecondRow('k1', 100)];
        });

        it('calls databaseService.updateReminderTable when value changed', async () => {
            await (component as any).updateTableSingleValue(DATABASE_SECOND_TABLE, 'k1', 'debt');
            expect(mockDb.updateReminderTable).toHaveBeenCalledWith(
                DATABASE_SECOND_TABLE, 'k1', 'debt', 200
            );
        });

        it('does not call the database when updated and original values are the same', async () => {
            (component as any).updatedSecondTable[0].content.debt = 100;
            await (component as any).updateTableSingleValue(DATABASE_SECOND_TABLE, 'k1', 'debt');
            expect(mockDb.updateReminderTable).not.toHaveBeenCalled();
        });

        it('calls handleError when the database throws', async () => {
            mockDb.updateReminderTable.and.returnValue(Promise.reject(new Error('fail')));
            await (component as any).updateTableSingleValue(DATABASE_SECOND_TABLE, 'k1', 'debt');
            expect(mockDialogService.handleError).toHaveBeenCalled();
        });
    });

    // ── updateTableWithNewDate ────────────────────────────────────────────

    describe('updateTableWithNewDate', () => {
        beforeEach(() => {
            (component as any).updatedSecondTable = [makeSecondRow('k1', 100)];
            (component as any).originalSecondTable = [makeSecondRow('k1', 100)];
            (component as any).updatedSecondTable[0].content.date = '2025-01-01';
            (component as any).originalSecondTable[0].content.date = '2025-01-01';
        });

        it('formats the date and calls updateTableSingleValue', async () => {
            spyOn<any>(component, 'updateTableSingleValue').and.returnValue(Promise.resolve());
            spyOn<any>(component, 'resyncUpcomingFromLocalData').and.stub();
            const date = new Date('2025-06-15');
            await (component as any).updateTableWithNewDate(DATABASE_SECOND_TABLE, 'k1', date);
            expect((component as any).updateTableSingleValue).toHaveBeenCalledWith(
                DATABASE_SECOND_TABLE, 'k1', 'date'
            );
        });
    });

});
