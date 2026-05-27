import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Inject,
	OnDestroy,
	OnInit,
	PLATFORM_ID,
	ViewChild,
	ViewContainerRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { PopoverModule } from 'primeng/popover';
import { Popover } from 'primeng/popover';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { Utilities } from '../../common/app.utilities';
import { LOG } from '../../common/app.logs';
import {
	ACTIVITY_TYPE_UPDATED,
	COMPONENT_DESTROY,
	DATABASE_THIRD_TABLE,
	DIALOG_CONFIRM,
	ERROR_PERMISSION_DENIED,
	FAILURE,
	HISTORY_STATUS_ADDED,
	HISTORY_STATUS_DELETED,
	PINBOARD_DIALOG_CONFIRM_BTN,
	PINBOARD_DIALOG_DELETE_BTN,
	PINBOARD_ITEMS_PER_PAGE,
	PINBOARD_MSG_DELETE_CONFIRM,
	PINBOARD_PLACEHOLDER_LINK,
	PINBOARD_PLACEHOLDER_TAG,
	PINBOARD_PLACEHOLDER_TEXT,
	REMINDER_ITEM_MESSAGE,
	REMINDER_TABLE_MESSAGES,
	STATS_FIELD_RECENT_REMINDER,
	STATS_FIELD_REMINDER_UPCOMING,
	SUCCESS
} from '../../common/app.constant';
import { PinboardItem } from './pinboard.model';
import { DatabaseService } from '../../backend/database-service/database.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';

/** Raw shape of a third-table document as returned by CloudBase. */
interface PinboardDbRow {
	key: string;
	_openid: string;
	content: {
		text?: string;
		date?: unknown;
		link?: string | null;
		tags?: string[];
	};
}

/** Tag-edit session shared by both existing-card and new-item-card contexts. */
interface TagEditSession {
	item: PinboardItem | null; // null when operating on the new-item card
	index: number; // -1 = adding new tag; 0+ = editing existing tag
	isNewItem: boolean;
	value: string; // text currently being typed in the tag input
}

/** Pending state for the new-item card form. */
interface NewItem {
	text: string;
	date: Date | null;
	link: string;
	tags: string[];
}

@Component({
	selector: 'pinboard',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		ButtonModule,
		InputTextModule,
		InputGroupModule,
		InputGroupAddonModule,
		PopoverModule,
		DatePickerModule,
		TooltipModule
	],
	templateUrl: './pinboard.component.html',
	styleUrl: './pinboard.component.css'
})
export class PinboardComponent implements OnInit, AfterViewInit, OnDestroy {
	private readonly className = 'PinboardComponent';

	@ViewChild('pinboardBody') private pinboardBody!: ElementRef<HTMLElement>;
	@ViewChild('dateOrLinkPopover') private dateOrLinkPopover!: Popover;
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;

	protected readonly PINBOARD_PLACEHOLDER_TEXT = PINBOARD_PLACEHOLDER_TEXT;
	protected readonly PINBOARD_PLACEHOLDER_LINK = PINBOARD_PLACEHOLDER_LINK;
	protected readonly PINBOARD_PLACEHOLDER_TAG = PINBOARD_PLACEHOLDER_TAG;

	protected items: PinboardItem[] = [];
	protected page = 0;
	protected editingItem: PinboardItem | null = null;
	protected isDate = false;
	protected editingLink = '';
	protected newItem: NewItem = { text: '', date: null, link: '', tags: [] };
	protected saveIndicator = false;
	protected tagFilter = new Set<string>();

	protected tagEditSession: TagEditSession | null = null;
	private originalItems: PinboardDbRow[] = [];
	private itemsSub?: Subscription;
	private saveIndicatorTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

	public constructor(
		@Inject(PLATFORM_ID) private readonly platformId: object,
		private readonly databaseService: DatabaseService,
		private readonly dialogService: DialogService,
		private readonly cdr: ChangeDetectorRef,
		protected utilities: Utilities
	) {}

	/**
	 * Subscribes to the third-table CloudBase collection, maps each raw row to a
	 * PinboardItem view model, prunes stale tag filters, and syncs upcoming items
	 * to the statistics collection.
	 */
	public ngOnInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.itemsSub = this.databaseService.getThirdReminderTableDetails().subscribe((raw) => {
				// Step 1: Parse raw DB rows into PinboardItem view models
				const rows = raw as PinboardDbRow[];
				this.originalItems = structuredClone(rows);
				this.items = rows.map((row) => ({
					key: row.key ?? '',
					_openid: row._openid ?? '',
					text: row.content?.text ?? '',
					date: row.content?.date != null ? Utilities.coerceDateToString(row.content.date) : null,
					link: row.content?.link ?? null,
					tags: row.content?.tags ?? []
				}));
				// Step 2: Remove any selected tag filters that no longer exist in the item set
				this.pruneStaleTags();
				// Step 3: Sync upcoming items to the statistics collection
				this.syncUpcomingToStatistics();
				this.cdr.detectChanges();
			});
		}
	}

	/**
	 * Attaches the scroll auto-hide behaviour to the pinboard body element so the
	 * scrollbar only appears while the user is actively scrolling.
	 */
	public ngAfterViewInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			Utilities.attachScrollAutoHide(this.pinboardBody.nativeElement);
		}
	}

	/**
	 * Unsubscribes from the items stream, clears any pending save timer, clears
	 * the dialog container, and logs the component destruction event.
	 */
	public ngOnDestroy(): void {
		this.itemsSub?.unsubscribe();
		this.dialogComponentContainer?.clear();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	// ── DB helpers ────────────────────────────────────────────────────────────

	/**
	 * Checks whether the current user has permission to modify the item with the given key.
	 * Delegates the actual permission check to DialogService.ensurePermission.
	 *
	 * @param key - The CloudBase document key of the item.
	 * @returns SUCCESS if permitted, FAILURE otherwise.
	 */
	private checkPermission(key: string): string {
		const openid = this.items.find((i) => i.key === key)?._openid ?? '';
		return this.dialogService.ensurePermission(this.dialogComponentContainer, openid) ? SUCCESS : FAILURE;
	}

	/**
	 * Shows a save-confirmation indicator and automatically hides it after one second.
	 * If a previous timeout is still active, it is cleared and restarted to avoid
	 * overlapping triggers.
	 */
	private triggerSaveIndicator(): void {
		this.saveIndicator = true;
		this.cdr.detectChanges();

		// Clear any previous timeout before setting a new one — rapid successive
		// saves should restart the indicator timer rather than flash on/off.
		if (this.saveIndicatorTimeouts[DATABASE_THIRD_TABLE]) {
			clearTimeout(this.saveIndicatorTimeouts[DATABASE_THIRD_TABLE]);
		}

		this.saveIndicatorTimeouts[DATABASE_THIRD_TABLE] = setTimeout(() => {
			this.saveIndicator = false;
			this.cdr.detectChanges();
		}, 1000);
	}

	/**
	 * Writes the current upcoming messages (items with a date) to the statistics collection.
	 */
	private syncUpcomingToStatistics(): void {
		const upcoming = this.items
			.filter((i) => !!i.date)
			.map((i) => ({
				type: REMINDER_ITEM_MESSAGE,
				name: i.text,
				date: i.date,
				link: i.link ?? ''
			}));
		this.databaseService
			.updateStatisticsFields({
				[STATS_FIELD_REMINDER_UPCOMING]: upcoming
			})
			.catch(() => {});
	}

	/**
	 * Removes any selected tags from the filter that no longer exist in the current item set.
	 */
	private pruneStaleTags(): void {
		const remaining = new Set(this.items.flatMap((i) => i.tags));
		this.tagFilter = new Set([...this.tagFilter].filter((t) => remaining.has(t)));
	}

	/**
	 * Persists a single content-field change for an existing item to CloudBase,
	 * trigger the save indicator, and append to the activity log.
	 * Rolls back the local item field to its original snapshot value if the
	 * server rejects the write with a permission error.
	 *
	 * @param key - The CloudBase document key of the item.
	 * @param field - The content field name to update (e.g. 'text', 'date', 'tags').
	 * @param value - The new value to store.
	 */
	private async updateTableSingleValue(key: string, field: string, value: unknown): Promise<void> {
		try {
			// Step 1: Persist the field change to CloudBase
			await this.databaseService.updateReminderTable(DATABASE_THIRD_TABLE, key, field, value);
			// Step 2: Flash the save indicator
			this.triggerSaveIndicator();
			// Step 3: Append the change to the activity log
			this.databaseService
				.appendToActivityLog(STATS_FIELD_RECENT_REMINDER, {
					type: ACTIVITY_TYPE_UPDATED,
					table: REMINDER_TABLE_MESSAGES,
					text: this.items.find((i) => i.key === key)?.text ?? '',
					timestamp: Utilities.getCurrentFormattedTime(true)
				})
				.catch(() => {});
		} catch (error) {
			// Roll back the local field if the server denied permission, then show error dialog
			if (error instanceof Error && error.message === ERROR_PERMISSION_DENIED) {
				const rollbackItem = this.items.find((i) => i.key === key);
				const rollbackOriginal = this.originalItems.find((o) => o.key === key);
				if (rollbackItem && rollbackOriginal) {
					(rollbackItem as unknown as Record<string, unknown>)[field] =
						(rollbackOriginal.content as Record<string, unknown>)[field] ?? null;
				}
			}
			this.dialogService.handleError(this.dialogComponentContainer, error);
		}
	}

	/**
	 * Deletes an item from CloudBase and appends the deletion to the activity log.
	 *
	 * @param key - The CloudBase document key of the item to delete.
	 */
	private async removeRecordFromDatabase(key: string): Promise<void> {
		const itemText = this.items.find((i) => i.key === key)?.text ?? '';
		try {
			await this.databaseService.removeRecordFromReminderTable(DATABASE_THIRD_TABLE, key);
			this.triggerSaveIndicator();
			this.databaseService
				.appendToActivityLog(STATS_FIELD_RECENT_REMINDER, {
					type: HISTORY_STATUS_DELETED,
					table: REMINDER_TABLE_MESSAGES,
					text: itemText,
					timestamp: Utilities.getCurrentFormattedTime(true)
				})
				.catch(() => {});
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
		}
	}

	/**
	 * Resets all new-item form fields to their empty state.
	 */
	private resetNewItem(): void {
		this.newItem = { text: '', date: null, link: '', tags: [] };
		if (this.tagEditSession?.isNewItem) this.tagEditSession = null;
	}

	// ── Tag filter ─────────────────────────────────────────────────────────────

	/**
	 * All unique tags across every item, sorted alphabetically.
	 *
	 * @returns Sorted deduplicated tag strings.
	 */
	protected get allTags(): string[] {
		const tags = new Set<string>();
		for (const item of this.items) {
			for (const tag of item.tags) tags.add(tag);
		}
		return [...tags].sort();
	}

	/**
	 * Items matching the selected tag filters (OR logic).
	 * Returns all items when no tags are selected.
	 *
	 * @returns Filtered subset of items.
	 */
	protected get filteredItems(): PinboardItem[] {
		if (this.tagFilter.size === 0) return this.items;
		return this.items.filter((item) => item.tags.some((t) => this.tagFilter.has(t)));
	}

	/**
	 * Visible item count (filtered) zero-padded to 2 characters.
	 *
	 * @returns e.g. "03", "08".
	 */
	protected get filteredCountLabel(): string {
		return String(this.filteredItems.length).padStart(2, '0');
	}

	/**
	 * Toggles a tag in the tag filter selection and resets to the first page.
	 *
	 * @param tag - The tag string to activate or deactivate.
	 */
	protected toggleTagFilter(tag: string): void {
		const updatedTagFilter = new Set(this.tagFilter);
		if (updatedTagFilter.has(tag)) {
			updatedTagFilter.delete(tag);
		} else {
			updatedTagFilter.add(tag);
		}
		this.tagFilter = updatedTagFilter;
		this.page = 0;
	}

	/**
	 * Returns whether a given tag is currently selected in the tag filter.
	 *
	 * @param tag - The tag string to check.
	 * @returns True when the tag is selected.
	 */
	protected isTagSelected(tag: string): boolean {
		return this.tagFilter.has(tag);
	}

	/**
	 * Clears the tag filter selection and resets to the first page.
	 */
	protected clearTagFilter(): void {
		this.tagFilter = new Set<string>();
		this.page = 0;
	}

	// ── Pagination ─────────────────────────────────────────────────────────────

	/**
	 * Items visible on the current page.
	 *
	 * @returns The slice of filtered items for the current page.
	 */
	protected get pagedItems(): PinboardItem[] {
		const start = this.page * PINBOARD_ITEMS_PER_PAGE;
		return this.filteredItems.slice(start, start + PINBOARD_ITEMS_PER_PAGE);
	}

	/**
	 * Returns true when the add-card should be visible: no tag filter is active and the
	 * current page has room for the virtual add slot.
	 */
	protected get showAddCard(): boolean {
		return (
			this.tagFilter.size === 0 &&
			this.page * PINBOARD_ITEMS_PER_PAGE + PINBOARD_ITEMS_PER_PAGE > this.items.length
		);
	}

	/**
	 * Total number of pages. Includes the virtual add-card slot only when
	 * no tags are selected in the filter.
	 *
	 * @returns Page count (minimum 1).
	 */
	protected get totalPages(): number {
		const count = this.filteredItems.length + (this.tagFilter.size === 0 ? 1 : 0);
		return Math.max(1, Math.ceil(count / PINBOARD_ITEMS_PER_PAGE));
	}

	/**
	 * Current page number as a zero-padded 2-character string (1-based).
	 *
	 * @returns e.g. "01", "02".
	 */
	protected get pageLabel(): string {
		return String(this.page + 1).padStart(2, '0');
	}

	/**
	 * Total page count as a zero-padded 2-character string.
	 *
	 * @returns e.g. "01", "03".
	 */
	protected get totalPagesLabel(): string {
		return String(this.totalPages).padStart(2, '0');
	}

	/**
	 * Navigates to the previous page if not already on the first.
	 */
	protected prevPage(): void {
		if (this.page > 0) this.page--;
	}

	/**
	 * Navigates to the next page if not already on the last.
	 */
	protected nextPage(): void {
		if (this.page < this.totalPages - 1) this.page++;
	}

	// ── CRUD ──────────────────────────────────────────────────────────────────

	/**
	 * Opens the shared date-or-link popover showing the date picker.
	 * When item is provided, sets editingItem for an existing-card edit; otherwise targets the new-item form.
	 *
	 * @param event - The click event used to position the popover.
	 * @param item - The PinboardItem being edited, or undefined for the new-item form.
	 */
	protected openDatePopover(event: Event, item?: PinboardItem): void {
		this.editingItem = item ?? null;
		this.isDate = true;
		this.dateOrLinkPopover.hide();
		setTimeout(() => this.dateOrLinkPopover.show(event), 140);
	}

	/**
	 * Opens the shared date-or-link popover showing the link input.
	 * When item is provided, sets editingItem and loads the item's link; otherwise targets the new-item form.
	 *
	 * @param event - The click event used to position the popover.
	 * @param item - The PinboardItem being edited, or undefined for the new-item form.
	 */
	protected openLinkPopover(event: Event, item?: PinboardItem): void {
		this.editingItem = item ?? null;
		this.editingLink = item?.link ?? '';
		this.isDate = false;
		this.dateOrLinkPopover.hide();
		setTimeout(() => this.dateOrLinkPopover.show(event), 140);
	}

	/**
	 * Core logic for adding a new item, shared by both the Enter-key shortcut and the confirm button.
	 * In text-only mode, optional fields (date, link) are skipped and popovers are not hidden.
	 *
	 * @param textOnly - When true, skips date and link fields and suppresses popover cleanup.
	 */
	private async addNewItem(textOnly: boolean): Promise<void> {
		if (!this.newItem.text.trim()) return;

		// Step 1: Build the content payload
		const newContent: Record<string, unknown> = {
			text: this.newItem.text.trim(),
			tags: [...this.newItem.tags]
		};

		// Step 2: Include optional fields unless text-only mode
		if (!textOnly) {
			if (this.newItem.date) {
				newContent['date'] = Utilities.formatDateForStorage(this.newItem.date);
			}
			if (this.newItem.link.trim()) {
				newContent['link'] = Utilities.normalizeWebUrl(this.newItem.link.trim());
			}
		}

		try {
			// Step 3: Persist to the database
			await this.databaseService.addNewRecordForReminderTable(DATABASE_THIRD_TABLE, newContent);

			// Step 4: Flash save indicator and append to the activity log
			this.triggerSaveIndicator();
			this.databaseService
				.appendToActivityLog(STATS_FIELD_RECENT_REMINDER, {
					type: HISTORY_STATUS_ADDED,
					table: REMINDER_TABLE_MESSAGES,
					text: String(newContent['text']),
					timestamp: Utilities.getCurrentFormattedTime(true)
				})
				.catch(() => {});

			// Step 5: Reset new-item state
			this.resetNewItem();
			if (!textOnly) {
				this.dateOrLinkPopover.hide();
			}
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
		}
	}

	/**
	 * Enter-key shortcut: add text and tags only, skip optional date and link fields.
	 */
	protected addNewTextOnly(): Promise<void> {
		return this.addNewItem(true);
	}

	/**
	 * Confirm-button: add the full new item including optional date and link fields.
	 */
	protected addNewItemWithDateOrLink(): Promise<void> {
		return this.addNewItem(false);
	}

	/**
	 * Opens a confirmation dialog before deleting an entry. Guards with a permission check.
	 *
	 * @param key - The CloudBase document key of the entry to delete.
	 */
	protected openDeleteConfirmationDialog(key: string): void {
		const returnCode = this.checkPermission(key);
		if (returnCode === FAILURE) return;
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_CONFIRM,
			async () => {
				await this.removeRecordFromDatabase(key);
			},
			[PINBOARD_MSG_DELETE_CONFIRM, PINBOARD_DIALOG_DELETE_BTN, PINBOARD_DIALOG_CONFIRM_BTN]
		);
	}

	/**
	 * Saves the text of an existing item to CloudBase on blur, only when the value has changed.
	 *
	 * @param item - The PinboardItem whose text was edited.
	 */
	protected async onTextBlur(item: PinboardItem): Promise<void> {
		const original = this.originalItems.find((o) => o.key === item.key);
		if (!original || item.text === (original.content?.text ?? '')) return;
		const returnCode = this.checkPermission(item.key);
		if (returnCode === FAILURE) return;
		await this.updateTableSingleValue(item.key, 'text', item.text.trim());
	}

	// ── Global index ───────────────────────────────────────────────────────────

	/**
	 * Returns the 1-based global index for a paged item, zero-padded to 2 digits.
	 *
	 * @param localIndex - The 0-based index within the current page.
	 * @returns A 2-character padded string e.g. "01", "12".
	 */
	protected globalLabel(localIndex: number): string {
		return String(this.page * PINBOARD_ITEMS_PER_PAGE + localIndex + 1).padStart(2, '0');
	}

	// ── Card edit popover ─────────────────────────────────────────────────────

	/**
	 * Persists a date change from the popover date-picker to the editing item and CloudBase.
	 *
	 * @param date - The Date value selected in the picker.
	 */
	protected async onPopoverDateChange(date: Date): Promise<void> {
		if (this.editingItem) {
			this.editingItem.date = date ? Utilities.formatDateForStorage(date) : null;
			await this.updateTableSingleValue(this.editingItem.key, 'date', this.editingItem.date);
			this.syncUpcomingToStatistics();
		}
	}

	/**
	 * Persists the normalized link from the popover link input to the editing item and CloudBase.
	 */
	protected async onPopoverLinkChange(): Promise<void> {
		if (this.editingItem) {
			const trimmedLink = this.editingLink.trim();
			this.editingItem.link = trimmedLink ? Utilities.normalizeWebUrl(trimmedLink) : null;
			await this.updateTableSingleValue(this.editingItem.key, 'link', this.editingItem.link);
		}
	}

	// ── Tag editing — existing cards ───────────────────────────────────────────

	/**
	 * Begins editing or adding a tag on an existing card.
	 * Pass index = -1 to open the add-tag input; pass the tag's 0-based index to edit it.
	 *
	 * @param item - The card whose tag is being edited or extended.
	 * @param index - The 0-based tag index to edit, or -1 to add a new tag.
	 */
	protected startTagEdit(item: PinboardItem, index: number): void {
		this.tagEditSession = {
			item,
			index,
			isNewItem: false,
			value: index === -1 ? '' : item.tags[index]
		};
	}

	/**
	 * Completes the current tag edit or add. Handles both the existing-card context
	 * (persists to CloudBase) and the new-item card context (local only).
	 *
	 * @param isNewItem - True when operating on the new-item card.
	 */

	protected async completeTagEdit(isNewItem: boolean): Promise<void> {
		const session = this.tagEditSession;
		const value = session?.value.trim() ?? '';
		if (isNewItem) {
			if (session?.index === -1) {
				if (value) this.newItem.tags.push(value);
			} else if (session !== null && session.index >= 0) {
				if (value) this.newItem.tags[session.index] = value;
				else this.newItem.tags.splice(session.index, 1);
			}
			this.cancelTagEdit();
		} else {
			const item = session?.item ?? null;
			if (!item) return;
			if (session!.index === -1) {
				if (value) item.tags.push(value);
			} else {
				if (value) item.tags[session!.index] = value;
				else item.tags.splice(session!.index, 1);
			}
			this.cancelTagEdit();
			if (item.key) await this.updateTableSingleValue(item.key, 'tags', [...item.tags]);
		}
	}

	/**
	 * Discards the current tag input and clears the tag-edit session.
	 */
	protected cancelTagEdit(): void {
		this.tagEditSession = null;
	}

	/**
	 * Removes a tag and persists the change if operating on an existing card.
	 * New-item card removal is local only — no DB call.
	 *
	 * @param index - The 0-based index of the tag to remove.
	 * @param isNewItem - True when operating on the new-item card.
	 * @param item - The existing card whose tag is being removed. Omit when isNewItem is true.
	 */
	protected async removeTag(index: number, isNewItem: boolean, item?: PinboardItem): Promise<void> {
		if (isNewItem) {
			this.newItem.tags.splice(index, 1);
			return;
		}
		item!.tags.splice(index, 1);
		if (item!.key) await this.updateTableSingleValue(item!.key, 'tags', [...item!.tags]);
	}

	/**
	 * Returns whether a specific tag cell is in edit mode.
	 *
	 * @param item - The card to check.
	 * @param index - The tag index to check.
	 * @returns True when that exact tag cell is being edited.
	 */
	protected isEditingTag(item: PinboardItem, index: number): boolean {
		const session = this.tagEditSession;
		return session !== null && !session.isNewItem && session.item === item && session.index === index;
	}

	/**
	 * Returns whether the new-tag input is open for a given card.
	 *
	 * @param item - The card to check.
	 * @returns True when the add-new-tag input is open for this card.
	 */
	protected isAddingTag(item: PinboardItem): boolean {
		const session = this.tagEditSession;
		return session !== null && !session.isNewItem && session.item === item && session.index === -1;
	}

	// ── Tag editing — new-item card ───────────────────────────────────────────

	/**
	 * Begins editing or adding a tag on the new-item card.
	 * Pass index = -1 to open the add-tag input; pass the tag's 0-based index to edit it.
	 *
	 * @param index - The 0-based tag index to edit, or -1 to add a new tag.
	 */
	protected startNewItemTagEdit(index: number): void {
		this.tagEditSession = {
			item: null,
			index,
			isNewItem: true,
			value: index === -1 ? '' : this.newItem.tags[index]
		};
	}

	/**
	 * Returns whether a specific new-item tag cell is in edit mode.
	 *
	 * @param index - The tag index to check.
	 * @returns True when that exact tag cell is being edited.
	 */
	protected isEditingNewTag(index: number): boolean {
		const session = this.tagEditSession;
		return session !== null && session.isNewItem && session.index === index;
	}

	/**
	 * Returns whether the add-new-tag input is open on the new-item card.
	 *
	 * @returns True when the add-tag input is open.
	 */
	protected isAddingNewTag(): boolean {
		const session = this.tagEditSession;
		return session !== null && session.isNewItem && session.index === -1;
	}

	// ── Field clear helpers ────────────────────────────────────────────────────

	/**
	 * Clears the date field on a pin and persists the change to CloudBase.
	 *
	 * @param item - The PinboardItem to update.
	 */
	protected async clearDate(item: PinboardItem): Promise<void> {
		item.date = null;
		if (item.key) {
			await this.updateTableSingleValue(item.key, 'date', null);
			this.syncUpcomingToStatistics();
		}
	}

	/**
	 * Clears the link field on a pin and persists the change to CloudBase.
	 *
	 * @param item - The PinboardItem to update.
	 */
	protected async clearLink(item: PinboardItem): Promise<void> {
		item.link = null;
		if (this.editingItem === item) this.editingLink = '';
		if (item.key) {
			await this.updateTableSingleValue(item.key, 'link', null);
		}
	}

	// ── Add-card display helpers ───────────────────────────────────────────────

	/**
	 * Returns the YYYY-MM-DD string for the new-item date pill.
	 *
	 * @returns A formatted date string, or empty string when no date is set.
	 */
	protected get newItemDateLabel(): string {
		return this.newItem.date ? Utilities.formatDateForStorage(this.newItem.date) : '';
	}

	/**
	 * Returns the hostname for the new-item link pill.
	 *
	 * @returns The domain string, or empty string when no link is set.
	 */
	protected get newItemLinkLabel(): string {
		if (!this.newItem.link.trim()) return '';
		return Utilities.getDomain(Utilities.normalizeWebUrl(this.newItem.link.trim()));
	}

	/**
	 * The editing item's date as a Date object for binding to the date picker.
	 * Derived from editingItem.date — never stored as a separate field.
	 *
	 * @returns A Date instance, or null when the editing item has no date.
	 */
	protected get editingDateModel(): Date | null {
		return this.editingItem?.date ? new Date(this.editingItem.date) : null;
	}

	// ── Display helpers ────────────────────────────────────────────────────────

	/**
	 * Safely coerces any date value (string, Date, CloudBase timestamp) to a YYYY-MM-DD string.
	 *
	 * @param date - Any date representation.
	 * @returns A YYYY-MM-DD string, or empty string.
	 */
	protected formatDate(date: unknown): string {
		return Utilities.coerceDateToString(date);
	}

	/**
	 * Returns whether the given text contains Chinese characters.
	 *
	 * @param text - The text to check.
	 * @returns True when at least one Chinese character is present.
	 */
	protected checkIfChinese(text: string): boolean {
		return Utilities.checkIfChinese(text);
	}

	/**
	 * Returns the hostname from a link for display.
	 *
	 * @param item - The PinboardItem.
	 * @returns The hostname string.
	 */
	protected getLinkLabel(item: PinboardItem): string {
		if (!item.link) return '';
		return Utilities.getDomain(item.link);
	}

	// ── Utilities ──────────────────────────────────────────────────────────────

	/**
	 * Total pin count as a zero-padded 2-character string.
	 *
	 * @returns e.g. "01", "12".
	 */
	protected get counterLabel(): string {
		return String(this.items.length).padStart(2, '0');
	}
}
