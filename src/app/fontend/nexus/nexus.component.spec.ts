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
		it('returns all links when activeCategory is ALL and there is no search query', () => {
			(component as any).links = [
				{ _id: '1', title: 'Angular', category: 'dev' },
				{ _id: '2', title: 'Vue', category: 'dev' }
			];
			(component as any).activeCategory = NEXUS_CATEGORY_ALL;
			(component as any).linkSearch = '';
			expect((component as any).filteredLinks.length).toBe(2);
		});

		it('filters by category when a specific category is active', () => {
			(component as any).links = [
				{ _id: '1', title: 'Angular', category: 'dev' },
				{ _id: '2', title: 'Google', category: 'search' }
			];
			(component as any).activeCategory = 'dev';
			(component as any).linkSearch = '';
			expect((component as any).filteredLinks.length).toBe(1);
			expect((component as any).filteredLinks[0]._id).toBe('1');
		});

		it('filters by search query (case-insensitive)', () => {
			(component as any).links = [
				{ _id: '1', title: 'Angular Docs', category: 'dev' },
				{ _id: '2', title: 'Vue Guide', category: 'dev' }
			];
			(component as any).activeCategory = NEXUS_CATEGORY_ALL;
			(component as any).linkSearch = 'angular';
			expect((component as any).filteredLinks.length).toBe(1);
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
	});

	// ── toggleAi ───────────────────────────────────────────────────────────

	describe('toggleAi', () => {
		it('toggles the selected flag on the tool', () => {
			const tool = { id: 't1', selected: false };
			(component as any).toggleAi(tool);
			expect(tool.selected).toBeTrue();
			(component as any).toggleAi(tool);
			expect(tool.selected).toBeFalse();
		});
	});

	// ── clearHistory ───────────────────────────────────────────────────────

	describe('clearHistory', () => {
		it('empties the history array', () => {
			(component as any).history = [{ query: 'test', aiIds: [], timestamp: '' }];
			(component as any).clearHistory();
			expect((component as any).history).toEqual([]);
		});
	});
});
