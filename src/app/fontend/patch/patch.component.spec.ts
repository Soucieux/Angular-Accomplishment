import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import {
	STATUS_COMPLETED,
	STATUS_DEBUG,
	STATUS_DRAFT,
	STATUS_IN_PROGRESS,
	STATUS_RESOLVED,
	STATUS_TODO
} from '../../common/app.constant';
import { PatchComponent } from './patch.component';

describe('PatchComponent', () => {
	let component: PatchComponent;
	let fixture: ComponentFixture<PatchComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [PatchComponent],
			providers: [MessageService]
		}).compileComponents();

		fixture = TestBed.createComponent(PatchComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	// ── getComponentRowSpan ────────────────────────────────────────────────

	describe('getComponentRowSpan', () => {
		it('returns 1 for a single-row component group', () => {
			const data = [
				{ component: 'A', element: 'x' },
				{ component: 'B', element: 'y' }
			];
			expect((component as any).getComponentRowSpan(data, 0)).toBe(1);
		});

		it('counts consecutive rows with the same component', () => {
			const data = [
				{ component: 'A', element: 'x' },
				{ component: 'A', element: 'y' },
				{ component: 'A', element: 'z' },
				{ component: 'B', element: 'w' }
			];
			expect((component as any).getComponentRowSpan(data, 0)).toBe(3);
		});
	});

	// ── getElementRowSpan ──────────────────────────────────────────────────

	describe('getElementRowSpan', () => {
		it('returns 1 when the next row has a different element', () => {
			const data = [
				{ component: 'A', element: 'x' },
				{ component: 'A', element: 'y' }
			];
			expect((component as any).getElementRowSpan(data, 0)).toBe(1);
		});

		it('counts consecutive rows with the same component and element', () => {
			const data = [
				{ component: 'A', element: 'x' },
				{ component: 'A', element: 'x' },
				{ component: 'A', element: 'x' },
				{ component: 'A', element: 'y' }
			];
			expect((component as any).getElementRowSpan(data, 0)).toBe(3);
		});
	});

	// ── shouldShowComponent ────────────────────────────────────────────────

	describe('shouldShowComponent', () => {
		it('returns true for the first row (rowIndex 0)', () => {
			const data = [
				{ component: 'A', element: 'x' },
				{ component: 'A', element: 'y' }
			];
			expect((component as any).shouldShowComponent(data, 0)).toBeTrue();
		});

		it('returns false when the component is the same as the previous row', () => {
			const data = [
				{ component: 'A', element: 'x' },
				{ component: 'A', element: 'y' }
			];
			(component as any).indexOfFirstItem = 0;
			expect((component as any).shouldShowComponent(data, 1)).toBeFalse();
		});

		it('returns true when the component changes', () => {
			const data = [
				{ component: 'A', element: 'x' },
				{ component: 'B', element: 'y' }
			];
			(component as any).indexOfFirstItem = 0;
			expect((component as any).shouldShowComponent(data, 1)).toBeTrue();
		});
	});

	// ── shouldShowElement ──────────────────────────────────────────────────

	describe('shouldShowElement', () => {
		it('returns true for the first row', () => {
			const data = [
				{ component: 'A', element: 'x' },
				{ component: 'A', element: 'x' }
			];
			expect((component as any).shouldShowElement(data, 0)).toBeTrue();
		});

		it('returns false when both component and element match the previous row', () => {
			const data = [
				{ component: 'A', element: 'x' },
				{ component: 'A', element: 'x' }
			];
			(component as any).indexOfFirstItem = 0;
			expect((component as any).shouldShowElement(data, 1)).toBeFalse();
		});

		it('returns true when the element changes', () => {
			const data = [
				{ component: 'A', element: 'x' },
				{ component: 'A', element: 'y' }
			];
			(component as any).indexOfFirstItem = 0;
			expect((component as any).shouldShowElement(data, 1)).toBeTrue();
		});
	});

	// ── getRenderedData ────────────────────────────────────────────────────

	describe('getRenderedData', () => {
		it('returns filteredValue when present', () => {
			const filtered = [{ a: 1 }];
			expect((component as any).getRenderedData({ filteredValue: filtered, value: [] })).toBe(filtered);
		});

		it('falls back to value when filteredValue is absent', () => {
			const value = [{ b: 2 }];
			expect((component as any).getRenderedData({ value })).toBe(value);
		});

		it('returns an empty array when neither is present', () => {
			expect((component as any).getRenderedData({})).toEqual([]);
		});
	});

	// ── getSeverityClass ───────────────────────────────────────────────────

	describe('getSeverityClass', () => {
		it('returns "tag-debug-success" for resolved status', () => {
			expect((component as any).getSeverityClass(STATUS_RESOLVED)).toBe('tag-debug-success');
		});

		it('returns empty string for any other status', () => {
			expect((component as any).getSeverityClass('Open')).toBe('');
		});
	});

	// ── getSeverity ────────────────────────────────────────────────────────

	describe('getSeverity', () => {
		it('returns "info" for To Do', () => {
			expect((component as any).getSeverity(STATUS_TODO)).toBe('info');
		});

		it('returns "warn" for In Progress', () => {
			expect((component as any).getSeverity(STATUS_IN_PROGRESS)).toBe('warn');
		});

		it('returns "success" for Completed', () => {
			expect((component as any).getSeverity(STATUS_COMPLETED)).toBe('success');
		});

		it('returns "success" for Resolved', () => {
			expect((component as any).getSeverity(STATUS_RESOLVED)).toBe('success');
		});

		it('returns "danger" for Debug', () => {
			expect((component as any).getSeverity(STATUS_DEBUG)).toBe('danger');
		});

		it('returns "secondary" for Draft', () => {
			expect((component as any).getSeverity(STATUS_DRAFT)).toBe('secondary');
		});

		it('returns undefined for an unknown status', () => {
			expect((component as any).getSeverity('Unknown')).toBeUndefined();
		});
	});

	// ── getSeverityIcon ────────────────────────────────────────────────────

	describe('getSeverityIcon', () => {
		it('returns hourglass icon for To Do', () => {
			expect((component as any).getSeverityIcon(STATUS_TODO)).toBe('pi pi-hourglass');
		});

		it('returns play icon for In Progress', () => {
			expect((component as any).getSeverityIcon(STATUS_IN_PROGRESS)).toBe('pi pi-play');
		});

		it('returns verified icon for Completed', () => {
			expect((component as any).getSeverityIcon(STATUS_COMPLETED)).toBe('pi pi-verified');
		});

		it('returns verified icon for Resolved', () => {
			expect((component as any).getSeverityIcon(STATUS_RESOLVED)).toBe('pi pi-verified');
		});

		it('returns exclamation icon for Debug', () => {
			expect((component as any).getSeverityIcon(STATUS_DEBUG)).toBe('pi pi-exclamation-triangle');
		});

		it('returns pencil icon for Draft', () => {
			expect((component as any).getSeverityIcon(STATUS_DRAFT)).toBe('pi pi-pencil');
		});

		it('returns undefined for an unknown status', () => {
			expect((component as any).getSeverityIcon('Unknown')).toBeUndefined();
		});
	});

	// ── isInSameComponentGroup ─────────────────────────────────────────────

	describe('isInSameComponentGroup', () => {
		it('returns false when hoveredRowIndex is null', () => {
			(component as any).hoveredRowIndex = null;
			const data = [{ component: 'A' }, { component: 'A' }];
			expect((component as any).isInSameComponentGroup(data, 0)).toBeFalse();
		});

		it('returns true when the row shares the same component as the hovered row', () => {
			(component as any).hoveredRowIndex = 0;
			const data = [{ component: 'A' }, { component: 'A' }];
			expect((component as any).isInSameComponentGroup(data, 1)).toBeTrue();
		});

		it('returns false when the row has a different component than the hovered row', () => {
			(component as any).hoveredRowIndex = 0;
			const data = [{ component: 'A' }, { component: 'B' }];
			expect((component as any).isInSameComponentGroup(data, 1)).toBeFalse();
		});
	});

	// ── isInSameElementGroup ───────────────────────────────────────────────

	describe('isInSameElementGroup', () => {
		it('returns false when hoveredRowIndex is null', () => {
			(component as any).hoveredRowIndex = null;
			const data = [{ component: 'A', element: 'x' }, { component: 'A', element: 'x' }];
			expect((component as any).isInSameElementGroup(data, 0)).toBeFalse();
		});

		it('returns true when component and element both match the hovered row', () => {
			(component as any).hoveredRowIndex = 0;
			const data = [{ component: 'A', element: 'x' }, { component: 'A', element: 'x' }];
			expect((component as any).isInSameElementGroup(data, 1)).toBeTrue();
		});

		it('returns false when the element differs from the hovered row', () => {
			(component as any).hoveredRowIndex = 0;
			const data = [{ component: 'A', element: 'x' }, { component: 'A', element: 'y' }];
			expect((component as any).isInSameElementGroup(data, 1)).toBeFalse();
		});
	});

	// ── getComponentOption ─────────────────────────────────────────────────

	describe('getComponentOption', () => {
		it('returns the matching option when given a label string', () => {
			const option = (component as any).getComponentOption('Entertainment');
			expect(option).toBeTruthy();
			expect(option.label).toBe('Entertainment');
		});

		it('returns null for an unknown label', () => {
			expect((component as any).getComponentOption('Unknown')).toBeNull();
		});

		it('accepts an object with a label property', () => {
			const option = (component as any).getComponentOption({ label: 'Home' });
			expect(option).toBeTruthy();
			expect(option.label).toBe('Home');
		});
	});
});
