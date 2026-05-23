import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';

import { REMINDER_STYLE_CHARGED, REMINDER_STYLE_TODAY } from '../../common/app.constant';
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

	// ── setStyle ───────────────────────────────────────────────────────────

	describe('setStyle', () => {
		it('returns the charged style when isCharged is true', () => {
			expect((component as any).setStyle(true, 5)).toBe(REMINDER_STYLE_CHARGED);
		});

		it('returns the today style when value equals currentDay', () => {
			(component as any).currentDay = 15;
			expect((component as any).setStyle(false, 15)).toBe(REMINDER_STYLE_TODAY);
		});

		it('returns empty string for an uncharged cell that is not today', () => {
			(component as any).currentDay = 15;
			expect((component as any).setStyle(false, 10)).toBe('');
		});
	});

	// ── preventKeyin ──────────────────────────────────────────────────────

	describe('preventKeyin', () => {
		it('calls preventDefault on the keyboard event', () => {
			const event = jasmine.createSpyObj<KeyboardEvent>('KeyboardEvent', ['preventDefault']);
			(component as any).preventKeyin(event);
			expect(event.preventDefault).toHaveBeenCalled();
		});
	});
});
