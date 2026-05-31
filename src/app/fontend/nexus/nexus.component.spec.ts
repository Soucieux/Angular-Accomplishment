import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';

import {
	NEXUS_CATEGORY_ALL,
	NEXUS_DIALOG_TITLE_ADD_LINK,
	NEXUS_DIALOG_TITLE_EDIT_LINK
} from '../../common/app.constant';
import { DatabaseService } from '../../backend/database-service/database.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { NexusComponent } from './nexus.component';

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

describe('NexusComponent', () => {
	let component: NexusComponent;
	let fixture: ComponentFixture<NexusComponent>;
	let mockDb: jasmine.SpyObj<DatabaseService>;
	let mockDialogService: jasmine.SpyObj<DialogService>;

	beforeEach(async () => {
		mockDb = jasmine.createSpyObj<DatabaseService>('DatabaseService', [
			'getUsefulLinks',
			'getLinkCategories',
			'getDateCalculatorTableDetails',
			'updateDateCalculatorTable',
			'appendToActivityLog'
		]);
		mockDb.getUsefulLinks.and.returnValue(of([]));
		mockDb.getLinkCategories.and.returnValue(of([]));
		mockDb.getDateCalculatorTableDetails.and.returnValue(of([]));
		mockDb.updateDateCalculatorTable.and.returnValue(Promise.resolve());
		mockDb.appendToActivityLog.and.returnValue(Promise.resolve());

		mockDialogService = jasmine.createSpyObj<DialogService>('DialogService', [
			'ensurePermission',
			'openDialog',
			'handleError',
			'showToast'
		]);
		mockDialogService.ensurePermission.and.returnValue(true);
		mockDialogService.openDialog.and.stub();
		mockDialogService.handleError.and.stub();

		await TestBed.configureTestingModule({
			imports: [NexusComponent],
			providers: [
				MessageService,
				{ provide: DatabaseService, useValue: mockDb },
				{ provide: DialogService, useValue: mockDialogService }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(NexusComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	// ── confirmedCount ──────────────────────────────────────────

	describe('confirmedCount', () => {
		it('returns 0 when rows is empty', () => {
			(component as any).updatedDateCalculatorTable = [];
			expect((component as any).confirmedCount).toBe(0);
		});

		it('counts only cells where isCharged is true', () => {
			(component as any).updatedDateCalculatorTable = [
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
			(component as any).updatedDateCalculatorTable = [
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
			(component as any).updatedDateCalculatorTable = [];
			expect((component as any).totalCount).toBe(0);
		});

		it('returns rows × 4 columns', () => {
			(component as any).updatedDateCalculatorTable = [{}, {}, {}];
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
			(component as any).updatedDateCalculatorTable = [makeFirstRow(5, false)];
			(component as any).originalDateCalculatorRows = [makeFirstRow(5, false), { _id: 'id2', _openid: 'uid1', isNextMonth: false }];
			(component as any).chargedCellsInitialized = true;
		});

		it('marks the cell as charged and calls updateDateCalculatorSingleValue', async () => {
			spyOn<any>(component, 'updateDateCalculatorSingleValue').and.returnValue(Promise.resolve());
			await (component as any).setIsCharged(0, 'first');
			expect((component as any).updatedDateCalculatorTable[0].first.isCharged).toBeTrue();
		});

		it('does nothing when the cell is already charged', async () => {
			(component as any).updatedDateCalculatorTable[0].first.isCharged = true;
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
			(component as any).updatedDateCalculatorTable = [
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
			(component as any).updatedDateCalculatorTable[0].first.value = 32;
			await (component as any).onValueChange(0, 'first');
			expect((component as any).updatedDateCalculatorTable[0].first.value).toBe(5);
		});
	});

	// ── filteredLinks ──────────────────────────────────────────────────────

	describe('filteredLinks', () => {
		it('returns all links when selectedCategory is ALL and there is no search query', () => {
			(component as any).links = [
				{ _id: '1', title: 'Angular', category: 'dev' },
				{ _id: '2', title: 'Vue', category: 'dev' }
			];
			(component as any).selectedCategory = NEXUS_CATEGORY_ALL;
			(component as any).linkSearch = '';
			expect((component as any).filteredLinks.length).toBe(2);
		});

		it('filters by category when a specific category is active', () => {
			(component as any).links = [
				{ _id: '1', title: 'Angular', category: 'dev' },
				{ _id: '2', title: 'Google', category: 'search' }
			];
			(component as any).selectedCategory = 'dev';
			(component as any).linkSearch = '';
			expect((component as any).filteredLinks.length).toBe(1);
			expect((component as any).filteredLinks[0]._id).toBe('1');
		});

		it('filters by search query (case-insensitive)', () => {
			(component as any).links = [
				{ _id: '1', title: 'Angular Docs', category: 'dev' },
				{ _id: '2', title: 'Vue Guide', category: 'dev' }
			];
			(component as any).selectedCategory = NEXUS_CATEGORY_ALL;
			(component as any).linkSearch = 'angular';
			expect((component as any).filteredLinks.length).toBe(1);
		});

		it('returns empty array when no link matches the search query', () => {
			(component as any).links = [
				{ _id: '1', title: 'Angular Docs', category: 'dev' }
			];
			(component as any).selectedCategory = NEXUS_CATEGORY_ALL;
			(component as any).linkSearch = 'xyz';
			expect((component as any).filteredLinks.length).toBe(0);
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

		it('returns total link count for NEXUS_CATEGORY_ALL', () => {
			expect((component as any).getLinkCount(NEXUS_CATEGORY_ALL)).toBe(3);
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
		it('sets showLinkDialog to true', () => {
			(component as any).openAddLinkDialog();
			expect((component as any).showLinkDialog).toBeTrue();
		});

		it('sets the dialog title to the add-link constant', () => {
			(component as any).openAddLinkDialog();
			expect((component as any).linkDialogTitle).toBe(NEXUS_DIALOG_TITLE_ADD_LINK);
		});

		it('resets editingLink to null', () => {
			(component as any).editingLink = { _id: 'x' };
			(component as any).openAddLinkDialog();
			expect((component as any).editingLink).toBeNull();
		});

		it('resets the link form fields to empty strings', () => {
			(component as any).linkForm = { url: 'old', title: 'old', category: 'old' };
			(component as any).openAddLinkDialog();
			expect((component as any).linkForm.url).toBe('');
			expect((component as any).linkForm.title).toBe('');
		});
	});

	// ── openEditLinkDialog ─────────────────────────────────────────────────

	describe('openEditLinkDialog', () => {
		it('pre-fills the link form from the existing link', () => {
			const link = { _id: '1', url: 'https://example.com', title: 'Example', category: 'dev' };
			const event = jasmine.createSpyObj<Event>('Event', ['stopPropagation']);
			(component as any).openEditLinkDialog(link, event);
			expect((component as any).linkForm.url).toBe('https://example.com');
			expect((component as any).linkForm.title).toBe('Example');
		});

		it('sets the dialog title to the edit-link constant', () => {
			const link = { _id: '1', url: 'https://example.com', title: 'Example', category: 'dev' };
			const event = jasmine.createSpyObj<Event>('Event', ['stopPropagation']);
			(component as any).openEditLinkDialog(link, event);
			expect((component as any).linkDialogTitle).toBe(NEXUS_DIALOG_TITLE_EDIT_LINK);
		});

		it('sets editingLink to the provided link', () => {
			const link = { _id: '1', url: 'https://example.com', title: 'Example', category: 'dev' };
			const event = jasmine.createSpyObj<Event>('Event', ['stopPropagation']);
			(component as any).openEditLinkDialog(link, event);
			expect((component as any).editingLink).toBe(link);
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
		it('sets showCategoryDialog to true', () => {
			(component as any).openAddCategoryDialog();
			expect((component as any).showCategoryDialog).toBeTrue();
		});

		it('resets editingCategory to null', () => {
			(component as any).editingCategory = { _id: 'c1', name: 'Dev' };
			(component as any).openAddCategoryDialog();
			expect((component as any).editingCategory).toBeNull();
		});

		it('resets the category form name to empty', () => {
			(component as any).categoryForm = { name: 'Old', color: '#fff' };
			(component as any).openAddCategoryDialog();
			expect((component as any).categoryForm.name).toBe('');
		});
	});

	// ── openEditCategoryDialog ─────────────────────────────────────────────

	describe('openEditCategoryDialog', () => {
		it('pre-fills the form with the category name and colour', () => {
			const category = { _id: 'c1', name: 'Dev', color: '#ff0000' };
			const event = jasmine.createSpyObj<Event>('Event', ['stopPropagation']);
			(component as any).openEditCategoryDialog(category, event);
			expect((component as any).categoryForm.name).toBe('Dev');
			expect((component as any).categoryForm.color).toBe('#ff0000');
		});

		it('sets editingCategory to the provided category', () => {
			const category = { _id: 'c1', name: 'Dev', color: '#ff0000' };
			const event = jasmine.createSpyObj<Event>('Event', ['stopPropagation']);
			(component as any).openEditCategoryDialog(category, event);
			expect((component as any).editingCategory).toBe(category);
		});

		it('stops event propagation', () => {
			const category = { _id: 'c1', name: 'Dev', color: '#ff0000' };
			const event = jasmine.createSpyObj<Event>('Event', ['stopPropagation']);
			(component as any).openEditCategoryDialog(category, event);
			expect(event.stopPropagation).toHaveBeenCalled();
		});
	});

	// ── toggleLinkSearch ───────────────────────────────────────────────────

	describe('toggleLinkSearch', () => {
		it('shows the search input when it was hidden', () => {
			(component as any).linkSearchVisible = false;
			(component as any).toggleLinkSearch();
			expect((component as any).linkSearchVisible).toBeTrue();
		});

		it('hides the search input when it was visible', () => {
			(component as any).linkSearchVisible = true;
			(component as any).toggleLinkSearch();
			expect((component as any).linkSearchVisible).toBeFalse();
		});

		it('clears the search query when collapsing', () => {
			(component as any).linkSearchVisible = true;
			(component as any).linkSearch = 'query';
			(component as any).toggleLinkSearch();
			expect((component as any).linkSearch).toBe('');
		});

		it('does not clear the search query when expanding', () => {
			(component as any).linkSearchVisible = false;
			(component as any).linkSearch = 'kept';
			(component as any).toggleLinkSearch();
			expect((component as any).linkSearch).toBe('kept');
		});
	});

	// ── onLinkSearchExit ───────────────────────────────────────────────────

	describe('onLinkSearchExit', () => {
		it('hides the search input when the query is empty and focus leaves to a non-icon element', () => {
			(component as any).linkSearchVisible = true;
			(component as any).linkSearch = '';
			const event = { relatedTarget: document.createElement('div') } as unknown as FocusEvent;
			(component as any).onLinkSearchExit(event);
			expect((component as any).linkSearchVisible).toBeFalse();
		});

		it('keeps the search visible when the query is not empty', () => {
			(component as any).linkSearchVisible = true;
			(component as any).linkSearch = 'angular';
			const event = { relatedTarget: null } as unknown as FocusEvent;
			(component as any).onLinkSearchExit(event);
			expect((component as any).linkSearchVisible).toBeTrue();
		});
	});

	// ── getLogoFallbackColor ───────────────────────────────────────────────

	describe('getLogoFallbackColor', () => {
		it('returns the brand colour for a known tool ID', () => {
			const color = (component as any).getLogoFallbackColor('chatgpt');
			expect(color).toBe('#10a37f');
		});

		it('returns the generic fallback for an unknown tool ID', () => {
			const color = (component as any).getLogoFallbackColor('unknown-tool');
			expect(color).toBe('#888');
		});
	});

	// ── onLogoError ────────────────────────────────────────────────────────

	describe('onLogoError', () => {
		it('adds the tool ID to the failedLogos set', () => {
			(component as any).failedLogos = new Set<string>();
			(component as any).onLogoError('claude');
			expect((component as any).failedLogos.has('claude')).toBeTrue();
		});
	});
});
