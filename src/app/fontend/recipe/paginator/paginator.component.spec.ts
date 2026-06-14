import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginatorComponent } from './paginator.component';

describe('PaginatorComponent', () => {
	let component: PaginatorComponent;
	let fixture: ComponentFixture<PaginatorComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [PaginatorComponent]
		}).compileComponents();

		fixture = TestBed.createComponent(PaginatorComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	// ── count ───────────────────────────────────────────────────────────────────

	describe('count', () => {
		it('returns pageCount when it is explicitly set', () => {
			component.pageCount = 5;
			expect((component as any).count).toBe(5);
		});

		it('derives page count from totalItems and perPage', () => {
			component.totalItems = 25;
			component.perPage = 8;
			expect((component as any).count).toBe(4);
		});

		it('returns 1 when neither pageCount nor totalItems is set', () => {
			expect((component as any).count).toBe(1);
		});

		it('clamps pageCount to at least 1', () => {
			component.pageCount = 0;
			expect((component as any).count).toBe(1);
		});

		it('clamps derived count to at least 1 when totalItems is 0', () => {
			component.totalItems = 0;
			component.perPage = 8;
			expect((component as any).count).toBe(1);
		});
	});

	// ── current ─────────────────────────────────────────────────────────────────

	describe('current', () => {
		beforeEach(() => {
			component.pageCount = 5;
		});

		it('returns the page when it is within bounds', () => {
			component.page = 2;
			expect((component as any).current).toBe(2);
		});

		it('clamps to 0 when page is negative', () => {
			component.page = -1;
			expect((component as any).current).toBe(0);
		});

		it('clamps to count - 1 when page exceeds the last page', () => {
			component.page = 10;
			expect((component as any).current).toBe(4);
		});
	});

	// ── pages ───────────────────────────────────────────────────────────────────

	describe('pages', () => {
		it('returns an array of 0-based indices matching the count', () => {
			component.pageCount = 3;
			expect((component as any).pages).toEqual([0, 1, 2]);
		});

		it('returns a single-element array when count is 1', () => {
			expect((component as any).pages).toEqual([0]);
		});
	});

	// ── go ──────────────────────────────────────────────────────────────────────

	describe('go', () => {
		let emittedPage: number | undefined;

		beforeEach(() => {
			component.pageCount = 5;
			component.page = 2;
			emittedPage = undefined;
			component.pageChange.subscribe((p: number) => (emittedPage = p));
		});

		it('emits the target page when it differs from the current page', () => {
			(component as any).go(3);
			expect(emittedPage).toBe(3);
		});

		it('does not emit when the target page equals the current page', () => {
			(component as any).go(2);
			expect(emittedPage).toBeUndefined();
		});

		it('clamps to the last page when the target exceeds bounds', () => {
			(component as any).go(99);
			expect(emittedPage).toBe(4);
		});

		it('clamps to 0 when the target is negative', () => {
			component.page = 2;
			(component as any).go(-5);
			expect(emittedPage).toBe(0);
		});
	});

	// ── prev / next ─────────────────────────────────────────────────────────────

	describe('prev', () => {
		it('emits the previous page', () => {
			component.pageCount = 3;
			component.page = 2;
			let emitted: number | undefined;
			component.pageChange.subscribe((p: number) => (emitted = p));
			(component as any).prev();
			expect(emitted).toBe(1);
		});

		it('does not emit when already on the first page', () => {
			component.pageCount = 3;
			component.page = 0;
			let emitted: number | undefined;
			component.pageChange.subscribe((p: number) => (emitted = p));
			(component as any).prev();
			expect(emitted).toBeUndefined();
		});
	});

	describe('next', () => {
		it('emits the next page', () => {
			component.pageCount = 3;
			component.page = 0;
			let emitted: number | undefined;
			component.pageChange.subscribe((p: number) => (emitted = p));
			(component as any).next();
			expect(emitted).toBe(1);
		});

		it('does not emit when already on the last page', () => {
			component.pageCount = 3;
			component.page = 2;
			let emitted: number | undefined;
			component.pageChange.subscribe((p: number) => (emitted = p));
			(component as any).next();
			expect(emitted).toBeUndefined();
		});
	});
});
