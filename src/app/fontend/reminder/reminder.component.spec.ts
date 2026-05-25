import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';

import { DatabaseService } from '../../backend/database-service/database.service';
import { ReminderComponent } from './reminder.component';

describe('ReminderComponent', () => {
	let component: ReminderComponent;
	let fixture: ComponentFixture<ReminderComponent>;

	beforeEach(async () => {
		const mockDb = jasmine.createSpyObj('DatabaseService', [
			'getFirstReminderTableDetails',
			'getSecondReminderTableDetails',
			'getThirdReminderTableDetails'
		]);
		mockDb.getFirstReminderTableDetails.and.returnValue(of([]));
		mockDb.getSecondReminderTableDetails.and.returnValue(of([]));
		mockDb.getThirdReminderTableDetails.and.returnValue(of([]));

		await TestBed.configureTestingModule({
			imports: [ReminderComponent],
			providers: [
				MessageService,
				{ provide: DatabaseService, useValue: mockDb }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(ReminderComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
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
});
