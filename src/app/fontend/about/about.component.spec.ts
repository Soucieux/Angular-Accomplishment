import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
	let component: AboutComponent;
	let fixture: ComponentFixture<AboutComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AboutComponent]
		}).compileComponents();

		fixture = TestBed.createComponent(AboutComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('timeline contains 6 entries', () => {
		expect((component as any).timeline.length).toBe(6);
	});

	// ── fillHeight ─────────────────────────────────────────────────────────

	describe('fillHeight', () => {
		it('returns a CSS calc() string', () => {
			expect((component as any).fillHeight()).toContain('calc(');
		});

		it('returns "0" proportion when no entries are visible', () => {
			(component as any).maxSeen = 0;
			const result = (component as any).fillHeight();
			expect(result).toContain('* 0');
		});

		it('scales with the number of visible entries', () => {
			(component as any).maxSeen = 3;
			(component as any).timeline = new Array(6);
			const result = (component as any).fillHeight();
			// 3/6 = 0.5
			expect(result).toContain('0.5');
		});
	});

	// ── entryDelay ─────────────────────────────────────────────────────────

	describe('entryDelay', () => {
		it('returns "0ms" for the first entry (index 0)', () => {
			expect((component as any).entryDelay(0)).toBe('0ms');
		});

		it('returns "60ms" for index 1', () => {
			expect((component as any).entryDelay(1)).toBe('60ms');
		});

		it('caps at "240ms" for index 4 and above', () => {
			expect((component as any).entryDelay(4)).toBe('240ms');
			expect((component as any).entryDelay(10)).toBe('240ms');
		});
	});

	// ── hover state ────────────────────────────────────────────────────────

	describe('onEntryEnter / onEntryLeave', () => {
		it('sets hoveredIndex when an entry is entered', () => {
			(component as any).onEntryEnter(2);
			expect((component as any).hoveredIndex).toBe(2);
		});

		it('clears hoveredIndex when the cursor leaves', () => {
			(component as any).hoveredIndex = 2;
			(component as any).onEntryLeave();
			expect((component as any).hoveredIndex).toBeNull();
		});
	});
});
