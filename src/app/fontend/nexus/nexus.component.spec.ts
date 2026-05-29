import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';

import {
	NEXUS_CATEGORY_ALL,
	NEXUS_DIALOG_TITLE_ADD_LINK,
	NEXUS_DIALOG_TITLE_EDIT_LINK
} from '../../common/app.constant';
import { DatabaseService } from '../../backend/database-service/database.service';
import { NexusComponent } from './nexus.component';

describe('NexusComponent', () => {
	let component: NexusComponent;
	let fixture: ComponentFixture<NexusComponent>;

	beforeEach(async () => {
		const mockDb = jasmine.createSpyObj('DatabaseService', [
			'getUsefulLinks',
			'getLinkCategories'
		]);
		mockDb.getUsefulLinks.and.returnValue(of([]));
		mockDb.getLinkCategories.and.returnValue(of([]));

		await TestBed.configureTestingModule({
			imports: [NexusComponent],
			providers: [
				MessageService,
				{ provide: DatabaseService, useValue: mockDb }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(NexusComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
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
