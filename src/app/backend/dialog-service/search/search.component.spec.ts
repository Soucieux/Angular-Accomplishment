import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { SearchStreamService } from './search-stream.service';
import { SearchDialogComponent } from './search.component';

describe('SearchComponent', () => {
	let component: SearchDialogComponent;
	let fixture: ComponentFixture<SearchDialogComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [SearchDialogComponent]
		}).compileComponents();

		fixture = TestBed.createComponent(SearchDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	// ── openDialog ─────────────────────────────────────────────────────────

	describe('openDialog', () => {
		it('sets visible to true', () => {
			const stopCb = jasmine.createSpy('stop');
			component.openDialog(stopCb);
			expect((component as any).visible).toBeTrue();
		});

		it('stores the stop callback', () => {
			const stopCb = jasmine.createSpy('stop');
			component.openDialog(stopCb);
			expect((component as any).stopCallback).toBe(stopCb);
		});
	});

	// ── triggerStopSearching ───────────────────────────────────────────────

	describe('triggerStopSearching', () => {
		it('invokes the stop callback', () => {
			const stopCb = jasmine.createSpy('stop');
			component.openDialog(stopCb);
			(component as any).triggerStopSearching();
			expect(stopCb).toHaveBeenCalled();
		});
	});
});
