import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';

import {
	HISTORY_STATUS_ADDED,
	HISTORY_STATUS_DELETED,
	HISTORY_STYLE_ADDED,
	HISTORY_STYLE_DELETED
} from '../../../common/app.constant';
import { HistoryDialogComponent } from './history.component';

describe('HistoryDialogComponent', () => {
	let component: HistoryDialogComponent;
	let fixture: ComponentFixture<HistoryDialogComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [HistoryDialogComponent],
			providers: [MessageService]
		}).compileComponents();

		fixture = TestBed.createComponent(HistoryDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	// ── openDialog ─────────────────────────────────────────────────────────

	describe('openDialog', () => {
		it('sets visible to true', () => {
			component.openDialog(() => Promise.resolve(), of([]));
			expect((component as any).visible).toBeTrue();
		});

		it('stores the entries observable', () => {
			const entries$ = of([{ id: 1 }]);
			component.openDialog(() => Promise.resolve(), entries$);
			expect((component as any).entries$).toBe(entries$);
		});
	});

	// ── setBackgroundColor ─────────────────────────────────────────────────

	describe('setBackgroundColor', () => {
		it('returns the added style for HISTORY_STATUS_ADDED', () => {
			expect((component as any).setBackgroundColor(HISTORY_STATUS_ADDED)).toBe(HISTORY_STYLE_ADDED);
		});

		it('returns the deleted style for HISTORY_STATUS_DELETED', () => {
			expect((component as any).setBackgroundColor(HISTORY_STATUS_DELETED)).toBe(HISTORY_STYLE_DELETED);
		});

		it('returns empty string for an unrecognised status', () => {
			expect((component as any).setBackgroundColor('unknown')).toBe('');
		});
	});

	// ── onDialogClosed ─────────────────────────────────────────────────────

	describe('onDialogClosed', () => {
		it('emits the closed$ event', () => {
			let emitted = false;
			component.closed$.subscribe(() => (emitted = true));
			(component as any).onDialogClosed();
			expect(emitted).toBeTrue();
		});

		it('sets visible to false', () => {
			(component as any).visible = true;
			(component as any).onDialogClosed();
			expect((component as any).visible).toBeFalse();
		});
	});
});
