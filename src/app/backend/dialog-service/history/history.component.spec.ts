import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';

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
