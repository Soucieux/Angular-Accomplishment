import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DatabaseService } from '../../backend/database-service/database.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { SessionRecoveryService } from '../../backend/session-recovery/session-recovery.service';
import { Utilities } from '../../common/utilities/app.utilities';
import {
	RECOVERY_STATUS_RECOVERED,
	REMINDER_VALUE_KEY_DATE,
	REMINDER_VALUE_KEY_END_TIME,
	REMINDER_VALUE_KEY_LINK,
	REMINDER_VALUE_KEY_START_TIME,
	REMINDER_VALUE_KEY_TAG,
	REMINDER_VALUE_KEY_TEXT,
	STATS_FIELD_REMINDER_UPCOMING,
	STATS_FIELD_TOTAL_REMINDERS
} from '../../common/constants';
import { LABEL_PERSONAL } from '../../common/locale/locale-strings';
import { ReminderComponent } from './reminder.component';
import { ReminderItem } from './reminder.model';

/** Minimal raw DB record factory. */
function makeRecord(
	key = 'k1',
	text = 'hello',
	date: string | null = null,
	link: string | null = null,
	tag = ''
) {
	return { key, _openid: 'uid1', text, date, link, tag };
}

/** Minimal view-model item factory. */
function makeItem(
	key = 'k1',
	text = 'hello',
	date: string | null = null,
	link: string | null = null,
	tag = ''
): ReminderItem {
	return { key, _openid: 'uid1', text, date, link, tag, startTime: null, endTime: null };
}

describe('ReminderComponent', () => {
	let component: ReminderComponent;
	let fixture: ComponentFixture<ReminderComponent>;
	let mockDb: jasmine.SpyObj<DatabaseService>;
	let mockDialogService: jasmine.SpyObj<DialogService>;
	let mockUtilities: jasmine.SpyObj<Utilities>;

	beforeEach(async () => {
		mockDb = jasmine.createSpyObj<DatabaseService>('DatabaseService', [
			'getReminderTableDetails',
			'updateReminderTable',
			'removeRecordFromReminderTable',
			'addNewRecordToReminder',
			'updateStatisticsFields',
			'updateUserStatsFields',
			'completeReminder'
		]);
		mockDb.getReminderTableDetails.and.returnValue(of([]));
		mockDb.updateReminderTable.and.returnValue(Promise.resolve());
		mockDb.removeRecordFromReminderTable.and.returnValue(Promise.resolve());
		mockDb.addNewRecordToReminder.and.returnValue(Promise.resolve());
		mockDb.updateStatisticsFields.and.returnValue(Promise.resolve());
		mockDb.updateUserStatsFields.and.returnValue(Promise.resolve());
		mockDb.completeReminder.and.returnValue(Promise.resolve());
		// getUserStats is a CloudbaseService-only method the component reaches via a cast in ngOnInit.
		(mockDb as unknown as { getUserStats: jasmine.Spy }).getUserStats = jasmine
			.createSpy('getUserStats')
			.and.returnValue(of(null));

		mockDialogService = jasmine.createSpyObj<DialogService>('DialogService', [
			'openDialog',
			'confirmThenBlock',
			'handleError',
			'ensurePermission',
			'showUnexpectedError'
		]);
		mockDialogService.ensurePermission.and.returnValue(true);
		mockDialogService.openDialog.and.stub();
		mockDialogService.confirmThenBlock.and.stub();
		mockDialogService.handleError.and.stub();

		mockUtilities = jasmine.createSpyObj<Utilities>('Utilities', [
			'getIsUserAlive',
			'getIsAuthSettled$',
			'checkIfHoverCapable',
			'checkIfChinese'
		]);
		mockUtilities.getIsUserAlive.and.returnValue(true);
		mockUtilities.getIsAuthSettled$.and.returnValue(of(true));
		mockUtilities.checkIfChinese.and.returnValue(false);

		await TestBed.configureTestingModule({
			imports: [ReminderComponent],
			providers: [
				{ provide: DatabaseService, useValue: mockDb },
				{ provide: DialogService, useValue: mockDialogService },
				{
					provide: SessionRecoveryService,
					useValue: { getRecoveryOutcomes$: () => of(RECOVERY_STATUS_RECOVERED) }
				},
				{ provide: Utilities, useValue: mockUtilities }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(ReminderComponent);
		component = fixture.componentInstance;
	});

	// ── filteredItems ─────────────────────────────────────────────────────────

	describe('filteredItems', () => {
		beforeEach(() => {
			(component as any).items = [
				makeItem('k1', 'a', null, null, 'work'),
				makeItem('k2', 'b', null, null, 'personal'),
				makeItem('k3', 'c', null, null, 'work')
			];
		});

		it('returns all items when no tag filter is selected', () => {
			(component as any).tagFilter = new Set<string>();
			expect(component['filteredItems'].length).toBe(3);
		});

		it('returns only items matching any selected tag (OR logic)', () => {
			(component as any).tagFilter = new Set(['work']);
			const result = component['filteredItems'];
			expect(result.length).toBe(2);
			expect(result.map((i: ReminderItem) => i.key)).toContain('k1');
			expect(result.map((i: ReminderItem) => i.key)).toContain('k3');
		});
	});

	// ── toggleTagFilter ───────────────────────────────────────────────────────

	describe('toggleTagFilter', () => {
		it('adds a tag to the filter and resets to page 0', () => {
			(component as any).page = 2;
			(component as any).toggleTagFilter('work');
			expect((component as any).tagFilter.has('work')).toBeTrue();
			expect((component as any).page).toBe(0);
		});

		it('removes a tag that is already selected', () => {
			(component as any).tagFilter = new Set(['work']);
			(component as any).toggleTagFilter('work');
			expect((component as any).tagFilter.has('work')).toBeFalse();
		});
	});

	// ── isTagSelected ─────────────────────────────────────────────────────────

	describe('isTagSelected', () => {
		it('returns true when the tag is in the filter', () => {
			(component as any).tagFilter = new Set(['work']);
			expect((component as any).isTagSelected('work')).toBeTrue();
		});

		it('returns false when the tag is not in the filter', () => {
			(component as any).tagFilter = new Set<string>();
			expect((component as any).isTagSelected('work')).toBeFalse();
		});
	});

	// ── clearTagFilter ────────────────────────────────────────────────────────

	describe('clearTagFilter', () => {
		it('clears all selected tags and resets to page 0', () => {
			(component as any).tagFilter = new Set(['work', 'personal']);
			(component as any).page = 3;
			(component as any).clearTagFilter();
			expect((component as any).tagFilter.size).toBe(0);
			expect((component as any).page).toBe(0);
		});
	});

	// ── pagedItems ────────────────────────────────────────────────────────────

	describe('pagedItems', () => {
		it('returns only items for the current page', () => {
			(component as any).itemsPerPage = 10;
			(component as any).items = Array.from({ length: 15 }, (_, i) => makeItem(`k${i}`));
			(component as any).tagFilter = new Set<string>();
			(component as any).page = 1;
			expect(component['pagedItems'].length).toBe(5);
		});

		it('returns all items on the first page when fewer than the per-page limit', () => {
			(component as any).items = [makeItem('k1'), makeItem('k2')];
			(component as any).tagFilter = new Set<string>();
			(component as any).page = 0;
			expect(component['pagedItems'].length).toBe(2);
		});
	});

	// ── showAddCard ───────────────────────────────────────────────────────────

	describe('showAddCard', () => {
		it('returns true when no tag filter is active and add card fits on the page', () => {
			(component as any).items = [makeItem('k1')];
			(component as any).tagFilter = new Set<string>();
			(component as any).page = 0;
			expect(component['showAddCard']).toBeTrue();
		});

		it('returns false when a tag filter is active', () => {
			(component as any).items = [makeItem('k1')];
			(component as any).tagFilter = new Set(['work']);
			(component as any).page = 0;
			expect(component['showAddCard']).toBeFalse();
		});
	});

	// ── totalPages ────────────────────────────────────────────────────────────

	describe('totalPages', () => {
		it('returns 1 when there are no items', () => {
			(component as any).items = [];
			(component as any).tagFilter = new Set<string>();
			expect(component['totalPages']).toBe(1);
		});

		it('splits items across pages by the per-page size', () => {
			(component as any).itemsPerPage = 10;
			(component as any).items = Array.from({ length: 15 }, (_, i) => makeItem(`k${i}`));
			(component as any).tagFilter = new Set<string>();
			// 15 items, ceil(15/10) = 2 pages
			expect(component['totalPages']).toBe(2);
		});
	});

	// ── prevPage / nextPage ───────────────────────────────────────────────────

	describe('prevPage', () => {
		it('decrements page when not on the first page', () => {
			(component as any).page = 2;
			(component as any).items = Array.from({ length: 30 }, (_, i) => makeItem(`k${i}`));
			(component as any).tagFilter = new Set<string>();
			(component as any).prevPage();
			expect((component as any).page).toBe(1);
		});

		it('does not go below 0', () => {
			(component as any).page = 0;
			(component as any).prevPage();
			expect((component as any).page).toBe(0);
		});
	});

	describe('nextPage', () => {
		it('increments page when not on the last page', () => {
			(component as any).items = Array.from({ length: 30 }, (_, i) => makeItem(`k${i}`));
			(component as any).tagFilter = new Set<string>();
			(component as any).page = 0;
			(component as any).nextPage();
			expect((component as any).page).toBe(1);
		});

		it('does not exceed the last page', () => {
			(component as any).items = [makeItem('k1')];
			(component as any).tagFilter = new Set<string>();
			(component as any).page = 0;
			(component as any).nextPage();
			// totalPages = 1 (1 item + add slot = ceil(2/10) = 1)
			expect((component as any).page).toBe(0);
		});
	});

	// ── pageLabel / totalPagesLabel ───────────────────────────────────────────

	describe('pageLabel', () => {
		it('returns 1-based zero-padded page number', () => {
			(component as any).page = 0;
			expect(component['pageLabel']).toBe('01');
			(component as any).page = 9;
			expect(component['pageLabel']).toBe('10');
		});
	});

	describe('totalPagesLabel', () => {
		it('returns zero-padded total pages string', () => {
			(component as any).items = [];
			(component as any).tagFilter = new Set<string>();
			expect(component['totalPagesLabel']).toBe('01');
		});
	});

	// ── globalLabel ───────────────────────────────────────────────────────────

	describe('globalLabel', () => {
		it('returns 1-based zero-padded global index', () => {
			(component as any).page = 0;
			expect((component as any).globalLabel(0)).toBe('01');
			expect((component as any).globalLabel(4)).toBe('05');
		});

		it('offsets by page when not on the first page', () => {
			(component as any).itemsPerPage = 10;
			(component as any).page = 1;
			expect((component as any).globalLabel(0)).toBe('11');
		});
	});

	// ── counterLabel ──────────────────────────────────────────────────────────

	describe('counterLabel', () => {
		it('returns zero-padded total item count', () => {
			(component as any).items = [makeItem('k1'), makeItem('k2')];
			expect(component['counterLabel']).toBe('02');
		});
	});

	// ── filteredCountLabel ────────────────────────────────────────────────────

	describe('filteredCountLabel', () => {
		it('returns zero-padded filtered item count', () => {
			(component as any).items = [makeItem('k1', 'a', null, null, 'work'), makeItem('k2', 'b')];
			(component as any).tagFilter = new Set(['work']);
			expect(component['filteredCountLabel']).toBe('01');
		});
	});

	// ── updateUpcomingToStatistics ────────────────────────────────────────────

	describe('updateUpcomingToStatistics', () => {
		it('writes upcoming items and total count to statistics', () => {
			(component as any).items = [makeItem('k1', 'meet', '2025-12-01'), makeItem('k2', 'buy')];
			(component as any).updateUpcomingToStatistics();
			expect(mockDb.updateUserStatsFields).toHaveBeenCalledWith(
				jasmine.objectContaining({
					[STATS_FIELD_REMINDER_UPCOMING]: jasmine.arrayContaining([
						jasmine.objectContaining({ name: 'meet', date: '2025-12-01' })
					]),
					[STATS_FIELD_TOTAL_REMINDERS]: 2
				})
			);
		});

		it('excludes items without a date from the upcoming list', () => {
			(component as any).items = [makeItem('k1', 'no date')];
			(component as any).updateUpcomingToStatistics();
			const call = mockDb.updateUserStatsFields.calls.mostRecent().args[0] as Record<string, unknown>;
			expect((call[STATS_FIELD_REMINDER_UPCOMING] as unknown[]).length).toBe(0);
			expect(call[STATS_FIELD_TOTAL_REMINDERS]).toBe(1);
		});
	});

	// ── addNewTextOnly ────────────────────────────────────────────────────────

	describe('addNewTextOnly', () => {
		it('does not call the database when text is empty', async () => {
			(component as any).newItem = { text: '   ', date: null, link: '', tags: [] };
			await (component as any).addNewTextOnly();
			expect(mockDb.addNewRecordToReminder).not.toHaveBeenCalled();
		});

		it('calls addNewRecordToReminderTable with the trimmed text', async () => {
			(component as any).newItem = { text: 'hello', date: null, link: '', tags: [] };
			await (component as any).addNewTextOnly();
			expect(mockDb.addNewRecordToReminder).toHaveBeenCalledWith(
				jasmine.objectContaining({ text: 'hello' })
			);
		});

		it('resets newItem after a successful add', async () => {
			(component as any).newItem = { text: 'hello', date: null, link: '', tag: 'tag1' };
			await (component as any).addNewTextOnly();
			expect((component as any).newItem.text).toBe('');
			expect((component as any).newItem.tag).toBe(LABEL_PERSONAL);
		});

		it('calls handleError when the database throws', async () => {
			mockDb.addNewRecordToReminder.and.returnValue(Promise.reject(new Error('fail')));
			(component as any).newItem = { text: 'hello', date: null, link: '', tag: '' };
			await (component as any).addNewTextOnly();
			expect(mockDialogService.handleError).toHaveBeenCalled();
		});
	});

	// ── onCardTextUpdate ──────────────────────────────────────────────────────

	describe('onCardTextUpdate', () => {
		beforeEach(() => {
			(component as any).items = [makeItem('k1', 'updated text')];
			(component as any).originalItems = [makeRecord('k1', 'original text')];
		});

		it('calls updateReminderTable when text has changed', async () => {
			await (component as any).onCardTextUpdate(makeItem('k1', 'updated text'));
			expect(mockDb.updateReminderTable).toHaveBeenCalledWith(
				'k1',
				REMINDER_VALUE_KEY_TEXT,
				'updated text',
				'updated text',
				false
			);
		});

		it('does nothing when text has not changed', async () => {
			(component as any).items = [makeItem('k1', 'original text')];
			await (component as any).onCardTextUpdate(makeItem('k1', 'original text'));
			expect(mockDb.updateReminderTable).not.toHaveBeenCalled();
		});

		it('does nothing when permission is denied', async () => {
			mockDialogService.ensurePermission.and.returnValue(false);
			await (component as any).onCardTextUpdate(makeItem('k1', 'updated text'));
			expect(mockDb.updateReminderTable).not.toHaveBeenCalled();
		});
	});

	// ── openDeleteConfirmationDialog ──────────────────────────────────────────

	describe('openDeleteConfirmationDialog', () => {
		beforeEach(() => {
			(component as any).items = [makeItem('k1')];
		});

		it('opens a dialog when permission is granted', () => {
			(component as any).openDeleteConfirmationDialog('k1');
			expect(mockDialogService.confirmThenBlock).toHaveBeenCalled();
		});

		it('does not open a dialog when permission is denied', () => {
			mockDialogService.ensurePermission.and.returnValue(false);
			(component as any).openDeleteConfirmationDialog('k1');
			expect(mockDialogService.confirmThenBlock).not.toHaveBeenCalled();
		});
	});

	// ── clearDate ─────────────────────────────────────────────────────────────

	describe('clearDate', () => {
		it('sets item.date to null and writes null to DB', async () => {
			(component as any).items = [makeItem('k1', 'text', '2025-01-01')];
			const item = (component as any).items[0];
			await (component as any).clearDate(item);
			expect(item.date).toBeNull();
			expect(mockDb.updateReminderTable).toHaveBeenCalledWith('k1', REMINDER_VALUE_KEY_DATE, null, 'text', false);
		});

		it('does nothing when permission is denied', async () => {
			mockDialogService.ensurePermission.and.returnValue(false);
			(component as any).items = [makeItem('k1', 'text', '2025-01-01')];
			const item = (component as any).items[0];
			await (component as any).clearDate(item);
			expect(mockDb.updateReminderTable).not.toHaveBeenCalled();
		});
	});

	// ── clearLink ─────────────────────────────────────────────────────────────

	describe('clearLink', () => {
		it('sets item.link to null and writes null to DB', async () => {
			(component as any).items = [makeItem('k1', 'text', null, 'https://example.com')];
			const item = (component as any).items[0];
			await (component as any).clearLink(item);
			expect(item.link).toBeNull();
			expect(mockDb.updateReminderTable).toHaveBeenCalledWith('k1', REMINDER_VALUE_KEY_LINK, null, 'text', false);
		});

		it('does nothing when permission is denied', async () => {
			mockDialogService.ensurePermission.and.returnValue(false);
			(component as any).items = [makeItem('k1', 'text', null, 'https://example.com')];
			const item = (component as any).items[0];
			await (component as any).clearLink(item);
			expect(mockDb.updateReminderTable).not.toHaveBeenCalled();
		});
	});

	// ── Reminder time ranges ─────────────────────────────────────────────────

	describe('Reminder time ranges', () => {
		it('auto-populates an exact one-hour end for an arbitrary start minute', async () => {
			await (component as any).onStartTimeSelect('12:37');

			expect((component as any).newItem.startTime).toBe('12:37');
			expect((component as any).newItem.endTime).toBe('13:37');
		});

		it('caps an automatic end at 23:59', async () => {
			await (component as any).onStartTimeSelect('23:30');

			expect((component as any).newItem.endTime).toBe('23:59');
		});

		it('allows the automatic end to equal a 23:59 start', async () => {
			await (component as any).onStartTimeSelect('23:59');

			expect((component as any).newItem.endTime).toBe('23:59');
		});

		it('allows the filtered end options to begin at the selected start time', () => {
			(component as any).editingStartTime = '12:37';

			const options = (component as any).filteredEndTimeOptions;
			expect(options[0]).toEqual({ label: '12:37', value: '12:37' });
			expect(options.every((option: { value: string }) => option.value >= '12:37')).toBeTrue();
		});

		it('persists arbitrary start and automatic end minutes when editing', async () => {
			const item = makeItem('k1', 'test', '2026-08-02');
			(component as any).items = [item];
			(component as any).editingItem = item;

			await (component as any).onStartTimeSelect('08:22');

			expect(item.startTime).toBe('08:22');
			expect(item.endTime).toBe('09:22');
			expect(mockDb.updateReminderTable).toHaveBeenCalledWith(
				'k1',
				REMINDER_VALUE_KEY_START_TIME,
				'08:22',
				'test',
				false
			);
			expect(mockDb.updateReminderTable).toHaveBeenCalledWith(
				'k1',
				REMINDER_VALUE_KEY_END_TIME,
				'09:22',
				'test',
				false
			);
		});

		it('includes arbitrary start and end minutes when adding a reminder', async () => {
			(component as any).dateOrLinkPopover = { hide: jasmine.createSpy('hide') };
			(component as any).newItem = {
				...(component as any).newItem,
				text: 'test',
				date: new Date(2026, 7, 2),
				startTime: '08:22',
				endTime: '09:22'
			};

			await (component as any).addNewItemWithDateOrLink();

			expect(mockDb.addNewRecordToReminder).toHaveBeenCalledWith(
				jasmine.objectContaining({ startTime: '08:22', endTime: '09:22' })
			);
		});
	});

	// ── tag editing ───────────────────────────────────────────────────────────

	describe('startTagEdit', () => {
		it('opens a tag-edit session for an existing tag', () => {
			const item = makeItem('k1', 'text', null, null, 'work');
			(component as any).startTagEdit(item, 0);
			expect((component as any).tagEditSession).toEqual(
				jasmine.objectContaining({ item, index: 0, tagText: 'work', isNewItem: false })
			);
		});

		it('opens the add-tag input when index is -1', () => {
			const item = makeItem('k1');
			(component as any).startTagEdit(item, -1);
			expect((component as any).tagEditSession).toEqual(
				jasmine.objectContaining({ index: -1, tagText: '' })
			);
		});
	});

	describe('cancelTagEdit', () => {
		it('clears the tag-edit session', () => {
			(component as any).tagEditSession = {
				item: makeItem('k1'),
				index: 0,
				isNewItem: false,
				tagText: 'x'
			};
			(component as any).cancelTagEdit();
			expect((component as any).tagEditSession).toBeNull();
		});
	});

	describe('onTagUpdate', () => {
		it('sets the tag when index is -1 and text is non-empty', async () => {
			(component as any).items = [makeItem('k1')];
			const item = (component as any).items[0];
			(component as any).tagEditSession = { item, index: -1, isNewItem: false, tagText: 'newtag' };
			await (component as any).onTagUpdate();
			expect(item.tag).toBe('newtag');
			expect(mockDb.updateReminderTable).toHaveBeenCalledWith('k1', REMINDER_VALUE_KEY_TAG, 'newtag', 'hello', false);
		});

		it('cancels without changing the tag when editing text is empty', async () => {
			(component as any).items = [makeItem('k1', 'text', null, null, 'work')];
			const item = (component as any).items[0];
			(component as any).tagEditSession = { item, index: 0, isNewItem: false, tagText: '' };
			await (component as any).onTagUpdate();
			// Empty input cancels the edit; the existing tag is left untouched.
			expect(item.tag).toBe('work');
			expect((component as any).tagEditSession).toBeNull();
		});
	});

	// ── new-item tag editing ──────────────────────────────────────────────────

	describe('startNewItemTagEdit', () => {
		it('opens a new-item tag-edit session prefilled with the current custom tag', () => {
			(component as any).newItem = { text: '', date: null, link: '', tag: 'mycustom' };
			(component as any).startNewItemTagEdit(-1);
			expect((component as any).tagEditSession).toEqual(
				jasmine.objectContaining({ isNewItem: true, index: -1, tagText: 'mycustom' })
			);
		});
	});

	describe('isAddingNewTag', () => {
		it('returns true when session is for new-item and index is -1', () => {
			(component as any).tagEditSession = { item: null, index: -1, isNewItem: true, tagText: '' };
			expect((component as any).isAddingNewTag()).toBeTrue();
		});
	});

	// ── display helpers ───────────────────────────────────────────────────────

	describe('formatDate', () => {
		it('returns a formatted date string for a valid ISO date', () => {
			const result = (component as any).formatDate('2025-06-15');
			expect(result).toBeTruthy();
			expect(typeof result).toBe('string');
		});

		it('returns empty string for a falsy input', () => {
			expect((component as any).formatDate(null)).toBe('');
			expect((component as any).formatDate('')).toBe('');
		});
	});

	describe('getLinkLabel', () => {
		it('returns the hostname for a valid URL', () => {
			const item = makeItem('k1', 'text', null, 'https://example.com/path');
			const result = (component as any).getLinkLabel(item);
			expect(result).toBe('example.com');
		});

		it('returns empty string when link is null', () => {
			const item = makeItem('k1');
			expect((component as any).getLinkLabel(item)).toBe('');
		});
	});

	// ── access-denied guard ───────────────────────────────────────────────────

	describe('access-denied guard', () => {
		it('shows content when getIsUserAlive returns true', () => {
			mockUtilities.getIsUserAlive.and.returnValue(true);
			fixture.detectChanges();
			const accessDenied = fixture.nativeElement.querySelector('blocked-card');
			expect(accessDenied).toBeFalsy();
		});

		it('shows access-denied when getIsUserAlive returns false', () => {
			mockUtilities.getIsUserAlive.and.returnValue(false);
			fixture.detectChanges();
			const accessDenied = fixture.nativeElement.querySelector('blocked-card');
			expect(accessDenied).toBeTruthy();
		});
	});
});
