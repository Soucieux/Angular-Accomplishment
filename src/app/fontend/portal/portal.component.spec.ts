import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';

import { PORTAL_CATEGORY_ALL } from '../../common/constants';
import { DatabaseService } from '../../backend/database-service/database.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { PortalComponent } from './portal.component';

/** Minimal date calculator row factory. */
function makeFirstRow(value = 5, isCharged = false) {
	return {
		_id: 'id1',
		_openid: 'uid1',
		first:  { value, isCharged },
		second: { value, isCharged },
		third:  { value, isCharged },
		fourth: { value, isCharged }
	};
}

describe('PortalComponent', () => {
	let component: PortalComponent;
	let fixture: ComponentFixture<PortalComponent>;
	let mockDb: jasmine.SpyObj<DatabaseService>;
	let mockDialogService: jasmine.SpyObj<DialogService>;

	beforeEach(async () => {
		mockDb = jasmine.createSpyObj<DatabaseService>('DatabaseService', [
			'getUsefulLinks',
			'getLinkCategories',
			'getDateCalculatorTableDetails',
			'updateDateCalculatorTable',
		]);
		mockDb.getUsefulLinks.and.returnValue(of([]));
		mockDb.getLinkCategories.and.returnValue(of([]));
		mockDb.getDateCalculatorTableDetails.and.returnValue(of([]));
		mockDb.updateDateCalculatorTable.and.returnValue(Promise.resolve());

		mockDialogService = jasmine.createSpyObj<DialogService>('DialogService', [
			'closeLoadingTimeout',
			'ensurePermission',
			'openDialog',
			'handleError',
			'showToast'
		]);
		mockDialogService.ensurePermission.and.returnValue(true);
		mockDialogService.openDialog.and.stub();
		mockDialogService.handleError.and.stub();

		await TestBed.configureTestingModule({
			imports: [PortalComponent],
			providers: [
				MessageService,
				{ provide: DatabaseService, useValue: mockDb },
				{ provide: DialogService, useValue: mockDialogService }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(PortalComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	// ── confirmedCount ──────────────────────────────────────────

	describe('confirmedCount', () => {
		it('returns 0 when rows is empty', () => {
			(component as any).updatedDateCalculatorRows = [];
			expect((component as any).confirmedCount).toBe(0);
		});

		it('counts only cells where isCharged is true', () => {
			(component as any).updatedDateCalculatorRows = [
				{
					first: { isCharged: true },
					second: { isCharged: false },
					third: { isCharged: true },
					fourth: { isCharged: false }
				}
			];
			(component as any).refreshConfirmedCount();
			expect((component as any).confirmedCount).toBe(2);
		});

		it('returns 0 when no cells are charged', () => {
			(component as any).updatedDateCalculatorRows = [
				{
					first: { isCharged: false },
					second: { isCharged: false },
					third: { isCharged: false },
					fourth: { isCharged: false }
				}
			];
			(component as any).refreshConfirmedCount();
			expect((component as any).confirmedCount).toBe(0);
		});
	});

	// ── totalCount ──────────────────────────────────────────────

	describe('totalCount', () => {
		it('returns 0 when rows is empty', () => {
			(component as any).updatedDateCalculatorRows = [];
			expect((component as any).totalCount).toBe(0);
		});

		it('returns rows × 4 columns', () => {
			(component as any).updatedDateCalculatorRows = [{}, {}, {}];
			expect((component as any).totalCount).toBe(12);
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

	// ── setIsCharged ──────────────────────────────────────────────────────

	describe('setIsCharged', () => {
		beforeEach(() => {
			(component as any).updatedDateCalculatorRows = [makeFirstRow(5, false)];
			(component as any).originalDateCalculatorRows = [makeFirstRow(5, false), { _id: 'id2', _openid: 'uid1', isNextMonth: false }];
			(component as any).chargedCellsInitialized = true;
		});

		it('marks the cell as charged and calls updateDateCalculatorSingleValue', async () => {
			spyOn<any>(component, 'updateDateCalculatorSingleValue').and.returnValue(Promise.resolve());
			await (component as any).setIsCharged(0, 'first');
			expect((component as any).updatedDateCalculatorRows[0].first.isCharged).toBeTrue();
		});

		it('does nothing when the cell is already charged', async () => {
			(component as any).updatedDateCalculatorRows[0].first.isCharged = true;
			spyOn<any>(component, 'updateDateCalculatorSingleValue').and.returnValue(Promise.resolve());
			await (component as any).setIsCharged(0, 'first');
			expect((component as any).updateDateCalculatorSingleValue).not.toHaveBeenCalled();
		});

		it('does nothing when permission is denied', async () => {
			mockDialogService.ensurePermission.and.returnValue(false);
			spyOn<any>(component, 'updateDateCalculatorSingleValue').and.returnValue(Promise.resolve());
			await (component as any).setIsCharged(0, 'first');
			expect((component as any).updateDateCalculatorSingleValue).not.toHaveBeenCalled();
		});
	});

	// ── onValueChange ─────────────────────────────────────────────────────

	describe('onValueChange', () => {
		beforeEach(() => {
			(component as any).originalDateCalculatorRows = [
				makeFirstRow(5, false),
				makeFirstRow(7, false),
				makeFirstRow(13, false),
				makeFirstRow(15, false),
				makeFirstRow(21, false),
				{ _id: 'id6', _openid: 'uid1', isNextMonth: false }
			];
			(component as any).updatedDateCalculatorRows = [
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
			spyOn<any>(component, 'updateDateCalculatorSingleValue').and.returnValue(Promise.resolve());
			await (component as any).onValueChange(0, 'first');
			expect((component as any).updateDateCalculatorSingleValue).not.toHaveBeenCalled();
		});

		it('rolls back when the value exceeds 31', async () => {
			(component as any).updatedDateCalculatorRows[0].first.value = 32;
			await (component as any).onValueChange(0, 'first');
			expect((component as any).updatedDateCalculatorRows[0].first.value).toBe(5);
		});
	});

	// ── updateFilteredLinks ──────────────────────────────────────────────────

	describe('updateFilteredLinks', () => {
		beforeEach(() => {
			spyOn(CloudbaseService, 'getUserId').and.returnValue('uid1');
		});

		it('keeps all personal links when selectedCategory is ALL', () => {
			(component as any).links = [
				{ _id: '1', _openid: 'uid1', title: 'Angular', category: 'dev' },
				{ _id: '2', _openid: 'uid1', title: 'Vue', category: 'dev' }
			];
			(component as any).selectedCategory = PORTAL_CATEGORY_ALL;
			(component as any).updateFilteredLinks();
			expect((component as any).personalFilteredLinks.length).toBe(2);
		});

		it('filters personal links by category when a specific category is active', () => {
			(component as any).links = [
				{ _id: '1', _openid: 'uid1', title: 'Angular', category: 'dev' },
				{ _id: '2', _openid: 'uid1', title: 'Google', category: 'search' }
			];
			(component as any).selectedCategory = 'dev';
			(component as any).updateFilteredLinks();
			expect((component as any).personalFilteredLinks.length).toBe(1);
			expect((component as any).personalFilteredLinks[0]._id).toBe('1');
		});

		it('partitions shared links into the shared cache regardless of category', () => {
			(component as any).links = [
				{ _id: '1', _openid: 'other', isShared: true, title: 'Shared', category: 'dev' },
				{ _id: '2', _openid: 'uid1', title: 'Mine', category: 'dev' }
			];
			(component as any).selectedCategory = 'search';
			(component as any).updateFilteredLinks();
			expect((component as any).sharedFilteredLinks.length).toBe(1);
			expect((component as any).sharedFilteredLinks[0]._id).toBe('1');
			expect((component as any).personalFilteredLinks.length).toBe(0);
		});
	});

	// ── getLinkCount ───────────────────────────────────────────────────────

	describe('getLinkCount', () => {
		beforeEach(() => {
			(component as any).links = [
				{ _id: '1', category: 'dev' },
				{ _id: '2', category: 'dev' },
				{ _id: '3', category: 'search' }
			];
		});

		it('returns total link count for PORTAL_CATEGORY_ALL', () => {
			expect((component as any).getLinkCount(PORTAL_CATEGORY_ALL)).toBe(3);
		});

		it('returns the count for a specific category', () => {
			expect((component as any).getLinkCount('dev')).toBe(2);
		});

		it('returns 0 for a category that has no links', () => {
			expect((component as any).getLinkCount('unknown')).toBe(0);
		});
	});

	// ── openAddLinkDialog ──────────────────────────────────────────────────

	describe('openAddLinkDialog', () => {
		it('delegates to dialogService.openDialog', () => {
			(component as any).openAddLinkDialog();
			expect(mockDialogService.openDialog).toHaveBeenCalled();
		});

		it('passes the link dialog type to dialogService.openDialog', () => {
			(component as any).openAddLinkDialog();
			const args = mockDialogService.openDialog.calls.mostRecent().args;
			expect(args[1]).toBe('link');
		});
	});

	// ── openEditLinkDialog ─────────────────────────────────────────────────

	describe('openEditLinkDialog', () => {
		it('delegates to dialogService.openDialog', () => {
			const link = { _id: '1', url: 'https://example.com', title: 'Example', category: 'dev' };
			const event = jasmine.createSpyObj<Event>('Event', ['stopPropagation']);
			(component as any).openEditLinkDialog(link, event);
			expect(mockDialogService.openDialog).toHaveBeenCalled();
		});

		it('passes the link dialog type to dialogService.openDialog', () => {
			const link = { _id: '1', url: 'https://example.com', title: 'Example', category: 'dev' };
			const event = jasmine.createSpyObj<Event>('Event', ['stopPropagation']);
			(component as any).openEditLinkDialog(link, event);
			const args = mockDialogService.openDialog.calls.mostRecent().args;
			expect(args[1]).toBe('link');
		});

		it('stops event propagation', () => {
			const link = { _id: '1', url: 'https://example.com', title: 'Example', category: 'dev' };
			const event = jasmine.createSpyObj<Event>('Event', ['stopPropagation']);
			(component as any).openEditLinkDialog(link, event);
			expect(event.stopPropagation).toHaveBeenCalled();
		});
	});

	// ── openAddCategoryDialog ──────────────────────────────────────────────

	describe('openAddCategoryDialog', () => {
		it('opens the category dialog via DialogService', () => {
			(component as any).openAddCategoryDialog();
			expect(mockDialogService.openDialog).toHaveBeenCalled();
			expect(mockDialogService.openDialog.calls.mostRecent().args[1]).toBe('category');
		});
	});

	// ── openEditCategoryDialog ─────────────────────────────────────────────

	describe('openEditCategoryDialog', () => {
		it('opens the category dialog via DialogService', () => {
			const category = { _id: 'c1', name: 'Dev', color: '#ff0000' };
			const event = jasmine.createSpyObj<Event>('Event', ['stopPropagation']);
			(component as any).openEditCategoryDialog(category, event);
			expect(mockDialogService.openDialog).toHaveBeenCalled();
			expect(mockDialogService.openDialog.calls.mostRecent().args[1]).toBe('category');
		});

		it('stops event propagation', () => {
			const category = { _id: 'c1', name: 'Dev', color: '#ff0000' };
			const event = jasmine.createSpyObj<Event>('Event', ['stopPropagation']);
			(component as any).openEditCategoryDialog(category, event);
			expect(event.stopPropagation).toHaveBeenCalled();
		});
	});
});
