import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Inject,
	NgZone,
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
import { SkeletonModule } from 'primeng/skeleton';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription, firstValueFrom, timer } from 'rxjs';
import { Utilities } from '../../common/app.utilities';
import { LOG } from '../../common/app.logs';
import {
	ACTIVITY_TYPE_UPDATED,
	COMPONENT_DESTROY,
	DATABASE_REMINDER,
	DIALOG_CONFIRM,
	ERROR_PERMISSION_DENIED,
	FAILURE,
	HISTORY_STATUS_ADDED,
	HISTORY_STATUS_DELETED,
	REMINDER_ADD_BTN_LABEL,
	REMINDER_ADD_DATE_LABEL,
	REMINDER_ADD_LINK_LABEL,
	REMINDER_AWAIT_SUFFIX_CN,
	REMINDER_AWAIT_SUFFIX_EN,
	REMINDER_CATEGORY_COLOR_DEFAULT,
	REMINDER_CATEGORY_COLOR_HEALTH,
	REMINDER_CATEGORY_COLOR_HOME,
	REMINDER_CATEGORY_COLOR_PERSONAL,
	REMINDER_CATEGORY_COLOR_WORK,
	REMINDER_CATEGORY_HEALTH,
	REMINDER_CATEGORY_HOME,
	REMINDER_CATEGORY_PERSONAL,
	REMINDER_CATEGORY_WORK,
	DIALOG_BTN_CONFIRM,
	DIALOG_BTN_DELETE,
	REMINDER_DUE_SOON_LABEL,
	REMINDER_DUE_SOON_SUBTITLE,
	REMINDER_DUE_SOON_WINDOW_DAYS,
	REMINDER_FILTER_ALL,
	REMINDER_FILTER_LABEL,
	REMINDER_GREETING_PLURAL,
	REMINDER_GREETING_SINGULAR,
	REMINDER_ITEMS_PER_PAGE,
	REMINDER_ITEM_MESSAGE,
	REMINDER_KNOWN_CATEGORIES,
	REMINDER_MSG_DELETE_CONFIRM,
	REMINDER_PLACEHOLDER_LINK,
	REMINDER_PLACEHOLDER_TAG,
	REMINDER_PLACEHOLDER_TEXT,
	REMINDER_SUBTITLE_CN,
	REMINDER_SUBTITLE_EN,
	REMINDER_TABLE_MESSAGES,
	REMINDER_VALUE_KEY_DATE,
	REMINDER_VALUE_KEY_LINK,
	REMINDER_VALUE_KEY_TAG,
	REMINDER_VALUE_KEY_TEXT,
	STATS_FIELD_RECENT_REMINDER,
	STATS_FIELD_REMINDER_TOTAL,
	STATS_FIELD_REMINDER_UPCOMING,
	SUCCESS
} from '../../common/app.constant';
import { NewItem, ReminderDbRecord, ReminderValueKey, ReminderItem, TagEditSession } from './reminder.model';
import { DatabaseService } from '../../backend/database-service/database.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { AccessDeniedComponent } from '../../common/access-denied/access-denied.component';

@Component({
	selector: 'reminder',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		ButtonModule,
		InputTextModule,
		InputGroupModule,
		InputGroupAddonModule,
		PopoverModule,
		SkeletonModule,
		DatePickerModule,
		TooltipModule,
		AccessDeniedComponent
	],
	templateUrl: './reminder.component.html',
	styleUrl: './reminder.component.css'
})
export class ReminderComponent implements OnInit, AfterViewInit, OnDestroy {
	private readonly className = 'ReminderComponent';

	@ViewChild('pinboardBody') private pinboardBody!: ElementRef<HTMLElement>;
	@ViewChild('cardGrid') private cardGrid!: ElementRef<HTMLElement>;
	@ViewChild('dateOrLinkPopover') private dateOrLinkPopover!: Popover;
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;

	protected readonly REMINDER_PLACEHOLDER_TEXT = REMINDER_PLACEHOLDER_TEXT;
	protected readonly REMINDER_PLACEHOLDER_LINK = REMINDER_PLACEHOLDER_LINK;
	protected readonly REMINDER_PLACEHOLDER_TAG = REMINDER_PLACEHOLDER_TAG;
	protected readonly REMINDER_SUBTITLE_CN = REMINDER_SUBTITLE_CN;
	protected readonly REMINDER_SUBTITLE_EN = REMINDER_SUBTITLE_EN;
	protected readonly REMINDER_FILTER_ALL = REMINDER_FILTER_ALL;
	protected readonly REMINDER_FILTER_LABEL = REMINDER_FILTER_LABEL;
	protected readonly REMINDER_ADD_LINK_LABEL = REMINDER_ADD_LINK_LABEL;
	protected readonly REMINDER_ADD_DATE_LABEL = REMINDER_ADD_DATE_LABEL;
	protected readonly REMINDER_ADD_BTN_LABEL = REMINDER_ADD_BTN_LABEL;
	protected readonly REMINDER_DUE_SOON_LABEL = REMINDER_DUE_SOON_LABEL;
	protected readonly REMINDER_DUE_SOON_SUBTITLE = REMINDER_DUE_SOON_SUBTITLE;
	protected readonly REMINDER_GREETING_SINGULAR = REMINDER_GREETING_SINGULAR;
	protected readonly REMINDER_GREETING_PLURAL = REMINDER_GREETING_PLURAL;
	protected readonly REMINDER_AWAIT_SUFFIX_CN = REMINDER_AWAIT_SUFFIX_CN;
	protected readonly REMINDER_AWAIT_SUFFIX_EN = REMINDER_AWAIT_SUFFIX_EN;
	protected readonly REMINDER_KNOWN_CATEGORIES = REMINDER_KNOWN_CATEGORIES;

	private doneKeys = new Set<string>();
	private readonly categoryColorMap: Record<string, string> = {
		[REMINDER_CATEGORY_WORK]: REMINDER_CATEGORY_COLOR_WORK,
		[REMINDER_CATEGORY_PERSONAL]: REMINDER_CATEGORY_COLOR_PERSONAL,
		[REMINDER_CATEGORY_HOME]: REMINDER_CATEGORY_COLOR_HOME,
		[REMINDER_CATEGORY_HEALTH]: REMINDER_CATEGORY_COLOR_HEALTH
	};

	protected loading = true;
	protected items: ReminderItem[] = [];
	protected page = 0;
	protected editingItem: ReminderItem | null = null;
	protected isDate = false;
	protected editingLink = '';
	protected newItem: NewItem = { text: '', date: null, link: '', tag: REMINDER_CATEGORY_PERSONAL };
	protected saveIndicator = false;
	protected tagFilter = new Set<string>();
	protected tagEditSession: TagEditSession | null = null;
	private originalItems: ReminderDbRecord[] = [];
	private itemsSub?: Subscription;
	private saveIndicatorTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

	constructor(
		@Inject(PLATFORM_ID) private readonly platformId: object,
		private readonly databaseService: DatabaseService,
		private readonly dialogService: DialogService,
		private readonly cdr: ChangeDetectorRef,
		private readonly ngZone: NgZone,
		protected utilities: Utilities
	) {}

	/**
	 * Subscribes to the reminder collection, maps each raw record to a
	 * ReminderItem view model, removes stale tag filters, syncs upcoming items to the
	 * statistics collection, and clears the loading state on first emission.
	 */
	ngOnInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.itemsSub = this.databaseService.getReminderTableDetails().subscribe((raw) => {
				// Step 1: Parse raw DB records into ReminderItem view models
				const records = raw as ReminderDbRecord[];
				this.originalItems = structuredClone(records);
				this.items = records.map((record) => ({
					key: record.key ?? '',
					_openid: record._openid ?? '',
					text: record.text ?? '',
					date: record.date != null ? Utilities.coerceDateToString(record.date) : null,
					link: record.link ?? null,
					tag: record.tag ?? ''
				}));
				// Step 2: Remove any selected tag filters that no longer exist in the item set
				this.removeStaleTag();
				// Step 3: Sync upcoming items to the statistics collection
				this.updateUpcomingToStatistics();
				this.loading = false;
				// CloudBase subscription callbacks may emit outside Angular's zone — detectChanges ensures the template updates.
				this.cdr.detectChanges();
			});
		}
	}

	/**
	 * Attaches the scroll auto-hide behaviour to the card grid outside Angular's zone
	 * so that scroll and mouseenter events never trigger change detection.
	 * Called once after the view is initialised.
	 */
	ngAfterViewInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.ngZone.runOutsideAngular(() => Utilities.attachScrollAutoHide(this.cardGrid?.nativeElement));
		}
	}

	/**
	 * Unsubscribes from the items stream, clears any pending save timer,
	 * clears the dialog container, and logs the component destruction event.
	 */
	ngOnDestroy(): void {
		this.itemsSub?.unsubscribe();
		Object.values(this.saveIndicatorTimeouts).forEach(clearTimeout);
		this.dialogComponentContainer?.clear();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	////////////////////// Below are DB helper and permission check methods //////////////////////

	/**
	 * Get the user id of the current item
	 *
	 * @param entryKey - The CloudBase document key identifying the entry.
	 * @returns user open Id
	 */
	private getOpenId(entryKey: string): string {
		return this.items.find((item) => item.key === entryKey)?._openid ?? '';
	}

	/**
	 * Shows a save-confirmation indicator and automatically hides it after one second.
	 * If a previous timeout is still active, it is cleared and restarted to avoid
	 * overlapping triggers.
	 */
	private triggerSaveIndicator(): void {
		this.saveIndicator = true;

		// Clear any previous timeout before setting a new one — rapid successive
		// saves should restart the indicator timer rather than flash on/off.
		if (this.saveIndicatorTimeouts[DATABASE_REMINDER]) {
			clearTimeout(this.saveIndicatorTimeouts[DATABASE_REMINDER]);
		}

		this.saveIndicatorTimeouts[DATABASE_REMINDER] = setTimeout(() => {
			this.saveIndicator = false;
		}, 1000);
	}

	/**
	 * Writes the current upcoming messages (items with a date) and total pin count
	 * to the statistics collection, keeping the home-page reminder widget current.
	 */
	private updateUpcomingToStatistics(): void {
		const upcoming = this.items
			.filter((item) => !!item.date)
			.map((item) => ({
				type: REMINDER_ITEM_MESSAGE,
				name: item.text,
				date: item.date,
				link: item.link ?? ''
			}));
		this.databaseService
			.updateStatisticsFields({
				[STATS_FIELD_REMINDER_UPCOMING]: upcoming,
				[STATS_FIELD_REMINDER_TOTAL]: this.items.length
			})
			.catch(() => {});
	}

	/**
	 * Removes any selected tag from the filter that no longer exist in the current item set.
	 */
	private removeStaleTag(): void {
		const remaining = new Set(this.items.map((item) => item.tag));
		this.tagFilter = new Set([...this.tagFilter].filter((tag) => remaining.has(tag)));
	}

	/**
	 * Restores one single value on a view-model item from the latest database snapshot.
	 *
	 * @param item - The view-model item whose single value will be restored.
	 * @param originalRecord - The raw DB snapshot record to restore from.
	 * @param valueKey - The value key identifying which property inside the entry to restore.
	 */
	private rollbackSingleValue(
		item: ReminderItem,
		originalRecord: ReminderDbRecord,
		valueKey: ReminderValueKey
	): void {
		switch (valueKey) {
			case REMINDER_VALUE_KEY_TEXT:
				item.text = originalRecord.text ?? '';
				break;
			case REMINDER_VALUE_KEY_DATE:
				item.date =
					originalRecord.date != null ? Utilities.coerceDateToString(originalRecord.date) : null;
				break;
			case REMINDER_VALUE_KEY_LINK:
				item.link = originalRecord.link ?? null;
				break;
			case REMINDER_VALUE_KEY_TAG:
				item.tag = originalRecord.tag ?? '';
				break;
		}
	}

	/**
	 * Persists a single-value change for an existing item to CloudBase,
	 * triggers the save indicator, and appends to the activity log.
	 * Rolls back the local single value to its original snapshot value if the
	 * server rejects the write with a permission error.
	 *
	 * {@link onCardTextUpdate} - Persists text edits from the card input.
	 * {@link onPopoverDateUpdate} - Persists date changes from the popover date-picker.
	 * {@link onPopoverLinkUpdate} - Persists link changes from the popover link input.
	 * {@link onTagUpdate} - Persists tag array updates for existing cards.
	 * {@link removeExistingCardTag} - Persists tag removal for existing cards.
	 * {@link clearDate} - Clears the date value on a pin.
	 * {@link clearLink} - Clears the link value on a pin.
	 *
	 * @param entryKey - The CloudBase document key identifying which entry to update.
	 * @param valueKey - The value key identifying which property inside the entry to update (e.g. REMINDER_VALUE_KEY_TEXT).
	 * @param singleValue - The new value to store.
	 */
	private async updateTableSingleValue(
		entryKey: string,
		valueKey: ReminderValueKey,
		singleValue: string | string[] | null
	): Promise<void> {
		try {
			// Step 1: Persist the single-value change to CloudBase
			await this.databaseService.updateReminderTable(entryKey, valueKey, singleValue);
			// Step 2: Flash the save indicator
			this.triggerSaveIndicator();
			// Step 3: Append the change to the activity log
			this.databaseService
				.appendToActivityLog(STATS_FIELD_RECENT_REMINDER, {
					type: ACTIVITY_TYPE_UPDATED,
					table: REMINDER_TABLE_MESSAGES,
					text: this.items.find((item) => item.key === entryKey)?.text ?? '',
					timestamp: Utilities.getCurrentFormattedTime(true)
				})
				.catch(() => {});
		} catch (error) {
			// Roll back the local single value if the server denied permission, then show error dialog
			if (error instanceof Error && error.message === ERROR_PERMISSION_DENIED) {
				const item = this.items.find((candidate) => candidate.key === entryKey);
				const originalRecord = this.originalItems.find((candidate) => candidate.key === entryKey);
				if (item && originalRecord) {
					this.rollbackSingleValue(item, originalRecord, valueKey);
				}
			}
			this.dialogService.handleError(this.dialogComponentContainer, error);
		}
	}

	/**
	 * Removes an entry from CloudBase and appends the deletion to the activity log.
	 *
	 * @param entryKey - The CloudBase document key identifying the entry to remove.
	 */
	private async removeRecordFromDatabase(entryKey: string): Promise<void> {
		const itemText = this.items.find((item) => item.key === entryKey)?.text ?? '';
		try {
			await this.databaseService.removeRecordFromReminderTable(entryKey);
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
		this.newItem = { text: '', date: null, link: '', tag: REMINDER_CATEGORY_PERSONAL };
		if (this.tagEditSession?.isNewItem) this.tagEditSession = null;
	}

	////////////////////// Below are category, done state, and due-soon helpers //////////////

	/**
	 * Returns the accent color for a tag, falling back to the default neutral when
	 * the tag is absent or does not match a known category.
	 *
	 * @param tag - The tag string to look up, or undefined when the item has no tag.
	 * @returns A CSS hex color string.
	 */
	protected tagColor(tag: string | undefined): string {
		if (!tag) return REMINDER_CATEGORY_COLOR_DEFAULT;
		return this.categoryColorMap[tag] ?? REMINDER_CATEGORY_COLOR_DEFAULT;
	}

	/**
	 * Returns whether the given item's date falls within the due-soon window (today
	 * to {@link REMINDER_DUE_SOON_WINDOW_DAYS} days from now, inclusive).
	 *
	 * @param item - The ReminderItem to check.
	 * @returns True when the item has a date that is due soon.
	 */
	protected isDueSoon(item: ReminderItem): boolean {
		const days = Utilities.getDaysUntilNumber(item.date);
		return days !== null && days >= 0 && days <= REMINDER_DUE_SOON_WINDOW_DAYS;
	}

	/**
	 * Returns the count of items whose date is within the due-soon window.
	 *
	 * @returns The number of due-soon items.
	 */
	protected get dueSoonCount(): number {
		return this.items.filter((item) => this.isDueSoon(item)).length;
	}

	/**
	 * Returns the count of items not yet marked done in the local done-key set.
	 *
	 * @returns The number of open (not-done) items.
	 */
	protected get openCount(): number {
		return this.items.filter((item) => !this.doneKeys.has(item.key)).length;
	}

	/**
	 * Returns whether the given item key is in the local done-key set.
	 *
	 * @param key - The item's CloudBase document key.
	 * @returns True when the item is marked done.
	 */
	protected isDone(key: string): boolean {
		return this.doneKeys.has(key);
	}

	/**
	 * Toggles the done state for a given item key in the local done-key set.
	 *
	 * @param key - The item's CloudBase document key.
	 */
	protected toggleDone(key: string): void {
		const updated = new Set(this.doneKeys);
		if (updated.has(key)) {
			updated.delete(key);
		} else {
			updated.add(key);
		}
		this.doneKeys = updated;
	}

	////////////////////// Below are tag filter methods for the item list ////////////////////

	/**
	 * Gets the items matching the selected tag filters (OR logic) or all items when no tags are selected.
	 *
	 * @returns Filtered subset of items.
	 */
	protected get filteredItems(): ReminderItem[] {
		if (this.tagFilter.size === 0) return this.items;
		return this.items.filter((item) => this.tagFilter.has(item.tag));
	}

	/**
	 * Returns the visible item count (filtered), zero-padded to 2 characters.
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

	////////////////////// Below are pagination methods and page label getters //////////////////

	/**
	 * Returns the items visible on the current page.
	 *
	 * @returns The slice of filtered items for the current page.
	 */
	protected get pagedItems(): ReminderItem[] {
		const start = this.page * REMINDER_ITEMS_PER_PAGE;
		return this.filteredItems.slice(start, start + REMINDER_ITEMS_PER_PAGE);
	}

	/**
	 * Returns true when the add-card should be visible: no tag filter is active and the
	 * current page has room for the virtual add slot.
	 *
	 * @returns True when the add card is shown on the current page.
	 */
	protected get showAddCard(): boolean {
		return this.tagFilter.size === 0;
	}

	/**
	 * Returns the total number of pages, including the virtual add-card slot
	 * only when no tags are selected in the filter.
	 *
	 * @returns Page count (minimum 1).
	 */
	protected get totalPages(): number {
		const count = this.filteredItems.length;
		return Math.max(1, Math.ceil(count / REMINDER_ITEMS_PER_PAGE));
	}

	/**
	 * Returns the current page number as a zero-padded 2-character string (1-based).
	 *
	 * @returns e.g. "01", "02".
	 */
	protected get pageLabel(): string {
		return String(this.page + 1).padStart(2, '0');
	}

	/**
	 * Returns the total page count as a zero-padded 2-character string.
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

	////////////////////// Below are CRUD operations for adding and removing pins ///////////////

	/**
	 * Hides the shared date-or-link popover.
	 */
	protected closePopover(): void {
		this.dateOrLinkPopover.hide();
	}

	/**
	 * Opens the shared date-or-link popover showing the date picker.
	 * When item is provided, sets editingItem for an existing-card edit; otherwise targets the new-item form.
	 *
	 * @param event - The click event used to position the popover.
	 * @param item - The ReminderItem being edited, or undefined for the new-item form.
	 */
	protected async openDatePopover(event: Event, item?: ReminderItem): Promise<void> {
		this.editingItem = item ?? null;
		this.isDate = true;
		this.dateOrLinkPopover.hide();
		await firstValueFrom(timer(140));
		this.dateOrLinkPopover.show(event);
	}

	/**
	 * Opens the shared date-or-link popover showing the link input.
	 * When item is provided, sets editingItem and loads the item's link; otherwise targets the new-item form.
	 *
	 * @param event - The click event used to position the popover.
	 * @param item - The ReminderItem being edited, or undefined for the new-item form.
	 */
	protected async openLinkPopover(event: Event, item?: ReminderItem): Promise<void> {
		this.editingItem = item ?? null;
		this.editingLink = item?.link ?? '';
		this.isDate = false;
		this.dateOrLinkPopover.hide();
		await firstValueFrom(timer(140));
		this.dateOrLinkPopover.show(event);
	}

	/**
	 * Adds text and tags only via the Enter-key shortcut, skipping optional date and link fields.
	 */
	protected addNewTextOnly(): Promise<void> {
		return this.addNewItem(true);
	}

	/**
	 * Adds the full new item via the confirm button, including optional date and link fields.
	 */
	protected addNewItemWithDateOrLink(): Promise<void> {
		return this.addNewItem(false);
	}

	/**
	 * Adds a new item to CloudBase, shared by both the Enter-key shortcut and the confirm button.
	 * In text-only mode, optional values (date, link) are skipped and popovers are not hidden.
	 *
	 * @param textOnly - When true, skips date and link fields and suppresses popover cleanup.
	 */
	private async addNewItem(textOnly: boolean): Promise<void> {
		if (!this.newItem.text.trim()) return;

		// Step 1: Build the flat record payload
		const newRecord: Partial<ReminderDbRecord> = {
			text: this.newItem.text.trim(),
			tag: this.newItem.tag
		};

		// Step 2: Include optional fields unless text-only mode
		if (!textOnly) {
			if (this.newItem.date) {
				newRecord.date = Utilities.formatDateForStorage(this.newItem.date);
			}
			if (this.newItem.link.trim()) {
				newRecord.link = Utilities.normalizeWebUrl(this.newItem.link.trim());
			}
		}

		try {
			// Step 3: Persist to the database
			await this.databaseService.addNewRecordToReminderTable(newRecord);

			// Step 4: Flash save indicator and append to the activity log
			this.triggerSaveIndicator();
			this.databaseService
				.appendToActivityLog(STATS_FIELD_RECENT_REMINDER, {
					type: HISTORY_STATUS_ADDED,
					table: REMINDER_TABLE_MESSAGES,
					text: newRecord.text ?? '',
					timestamp: Utilities.getCurrentFormattedTime(true)
				})
				.catch(() => {});

			// Step 5: Reset new-item state and navigate to last page
			this.page = Math.max(0, Math.ceil((this.items.length + 1) / REMINDER_ITEMS_PER_PAGE) - 1);
			this.resetNewItem();
			if (!textOnly) {
				this.dateOrLinkPopover.hide();
			}
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
		}
	}

	/**
	 * Opens a confirmation dialog before removing an entry. Guards with a permission check.
	 *
	 * @param entryKey - The CloudBase document key identifying the entry to remove.
	 */
	protected openDeleteConfirmationDialog(entryKey: string): void {
		const returnCode = this.dialogService.ensurePermission(
			this.dialogComponentContainer,
			this.getOpenId(entryKey)
		)
			? SUCCESS
			: FAILURE;

		if (returnCode === FAILURE) return;
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_CONFIRM,
			async () => {
				await this.removeRecordFromDatabase(entryKey);
			},
			[REMINDER_MSG_DELETE_CONFIRM, DIALOG_BTN_DELETE, DIALOG_BTN_CONFIRM]
		);
	}

	/**
	 * Persists the card message text to CloudBase when confirmed (Enter or blur),
	 * only when the value has changed.
	 *
	 * @param item - The ReminderItem whose text was edited.
	 */
	protected async onCardTextUpdate(item: ReminderItem): Promise<void> {
		const originalIndex = this.originalItems.findIndex(
			(originalRecord) => originalRecord.key === item.key
		);
		if (originalIndex === -1 || item.text === (this.originalItems[originalIndex].text ?? '')) return;
		const returnCode = this.dialogService.ensurePermission(
			this.dialogComponentContainer,
			this.getOpenId(item.key)
		)
			? SUCCESS
			: FAILURE;
		if (returnCode === FAILURE) return;
		const savedText = item.text.trim();
		await this.updateTableSingleValue(item.key, REMINDER_VALUE_KEY_TEXT, savedText);
		// The DB subscription fires asynchronously — replace the snapshot entry immutably so a
		// concurrent blur cannot pass the changed-value guard and issue a duplicate write.
		const updatedSnapshot = structuredClone(this.originalItems[originalIndex]);
		updatedSnapshot.text = savedText;
		this.originalItems = [
			...this.originalItems.slice(0, originalIndex),
			updatedSnapshot,
			...this.originalItems.slice(originalIndex + 1)
		];
	}

	////////////////////// Below are global index display helpers for paged items //////////////

	/**
	 * Returns the 1-based global index for a paged item, zero-padded to 2 digits.
	 *
	 * @param localIndex - The 0-based index within the current page.
	 * @returns A 2-character padded string e.g. "01", "12".
	 */
	protected globalLabel(localIndex: number): string {
		return String(this.page * REMINDER_ITEMS_PER_PAGE + localIndex + 1).padStart(2, '0');
	}

	////////////////////// Below are card edit popover event handlers ////////////////////////

	/**
	 * Persists a date change from the popover date-picker to the editing item and CloudBase.
	 *
	 * @param date - The Date value selected in the picker.
	 */
	protected async onPopoverDateUpdate(date: Date | null): Promise<void> {
		if (this.editingItem) {
			const returnCode = this.dialogService.ensurePermission(
				this.dialogComponentContainer,
				this.getOpenId(this.editingItem.key)
			)
				? SUCCESS
				: FAILURE;
			if (returnCode === FAILURE) return;
			this.editingItem.date = date ? Utilities.formatDateForStorage(date) : null;
			await this.updateTableSingleValue(
				this.editingItem.key,
				REMINDER_VALUE_KEY_DATE,
				this.editingItem.date
			);
			this.updateUpcomingToStatistics();
		}
	}

	/**
	 * Persists the normalized link from the popover link input to the editing item and CloudBase,
	 * then hides the popover. Also closes the popover when called for a new item (no editing item).
	 */
	protected async onPopoverLinkUpdate(): Promise<void> {
		if (this.editingItem) {
			const returnCode = this.dialogService.ensurePermission(
				this.dialogComponentContainer,
				this.getOpenId(this.editingItem.key)
			)
				? SUCCESS
				: FAILURE;
			if (returnCode === FAILURE) return;
			const trimmedLink = this.editingLink.trim();
			this.editingItem.link = trimmedLink ? Utilities.normalizeWebUrl(trimmedLink) : null;
			await this.updateTableSingleValue(
				this.editingItem.key,
				REMINDER_VALUE_KEY_LINK,
				this.editingItem.link
			);
		}
		this.dateOrLinkPopover.hide();
	}

	////////////////////// Below are tag editing handlers for existing card items //////////////

	/**
	 * Begins editing or adding a tag on an existing card.
	 * Pass index = -1 to open the add-tag input; pass the tag's 0-based index to edit it.
	 *
	 * @param item - The card whose tag is being edited or extended.
	 * @param index - The 0-based tag index to edit, or -1 to add a new tag.
	 */
	protected startTagEdit(item: ReminderItem, index: number): void {
		this.tagEditSession = {
			item,
			index,
			isNewItem: false,
			tagText: index === -1 ? '' : item.tag
		};
	}

	/**
	 * Persists the current tag value for an existing card when confirmed (Enter or blur).
	 * Writes the updated tags array to CloudBase.
	 */
	protected async onTagUpdate(): Promise<void> {
		const session = this.tagEditSession;
		if (!session?.item) return;
		const item = session.item;
		const returnCode = this.dialogService.ensurePermission(
			this.dialogComponentContainer,
			this.getOpenId(item.key)
		)
			? SUCCESS
			: FAILURE;
		if (returnCode === FAILURE) return;
		const tagText = session.tagText.trim();
		if (tagText) item.tag = tagText;
		else if (session.index !== -1) item.tag = '';
		this.cancelTagEdit();
		if (item.key) await this.updateTableSingleValue(item.key, REMINDER_VALUE_KEY_TAG, item.tag);
	}

	/**
	 * Commits the current tag value for the new-item card when confirmed (Enter or blur).
	 * Updates the local newItem state only — no DB write.
	 */
	protected onNewItemTagUpdate(): void {
		const session = this.tagEditSession;
		const tagText = session?.tagText.trim() ?? '';
		if (tagText) this.newItem.tag = tagText;
		else if (session !== null && session.index >= 0) this.newItem.tag = '';
		this.cancelTagEdit();
	}

	/**
	 * Discards the current tag input and clears the tag-edit session.
	 */
	protected cancelTagEdit(): void {
		this.tagEditSession = null;
	}

	/**
	 * Removes a tag from the new-item card. Local state update only — no DB write.
	 *
	 * @param index - The 0-based index of the tag to remove.
	 */
	protected removeNewItemTag(index: number): void {
		this.newItem.tag = '';
	}

	/**
	 * Removes a tag from an existing card and persists the updated tags array to CloudBase.
	 *
	 * @param index - The 0-based index of the tag to remove.
	 * @param item - The card whose tag is being removed.
	 */
	protected async removeExistingCardTag(index: number, item: ReminderItem): Promise<void> {
		const returnCode = this.dialogService.ensurePermission(
			this.dialogComponentContainer,
			this.getOpenId(item.key)
		)
			? SUCCESS
			: FAILURE;
		if (returnCode === FAILURE) return;
		item.tag = '';
		if (item.key) await this.updateTableSingleValue(item.key, REMINDER_VALUE_KEY_TAG, item.tag);
	}

	/**
	 * Returns whether a specific tag cell is in edit mode.
	 *
	 * @param item - The card to check.
	 * @param index - The tag index to check.
	 * @returns True when that exact tag cell is being edited.
	 */
	protected isEditingTag(item: ReminderItem, index: number): boolean {
		const session = this.tagEditSession;
		return session !== null && !session.isNewItem && session.item === item && session.index === index;
	}

	/**
	 * Returns whether the new-tag input is open for a given card.
	 *
	 * @param item - The card to check.
	 * @returns True when the add-new-tag input is open for this card.
	 */
	protected isAddingTag(item: ReminderItem): boolean {
		const session = this.tagEditSession;
		return session !== null && !session.isNewItem && session.item === item && session.index === -1;
	}

	////////////////////// Below are tag editing handlers for the new-item card ////////////////

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
			tagText: index === -1 ? '' : this.newItem.tag
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

	////////////////////// Below are single-value clear handlers for date and link //////////////

	/**
	 * Clears the date single value on a pin and persists the change to CloudBase.
	 *
	 * @param item - The ReminderItem to update.
	 */
	protected async clearDate(item: ReminderItem): Promise<void> {
		const returnCode = this.dialogService.ensurePermission(
			this.dialogComponentContainer,
			this.getOpenId(item.key)
		)
			? SUCCESS
			: FAILURE;
		if (returnCode === FAILURE) return;
		item.date = null;
		if (item.key) {
			await this.updateTableSingleValue(item.key, REMINDER_VALUE_KEY_DATE, null);
			this.updateUpcomingToStatistics();
		}
	}

	/**
	 * Clears the link single value on a pin and persists the change to CloudBase.
	 *
	 * @param item - The ReminderItem to update.
	 */
	protected async clearLink(item: ReminderItem): Promise<void> {
		const returnCode = this.dialogService.ensurePermission(
			this.dialogComponentContainer,
			this.getOpenId(item.key)
		)
			? SUCCESS
			: FAILURE;
		if (returnCode === FAILURE) return;
		item.link = null;
		if (this.editingItem === item) this.editingLink = '';
		if (item.key) {
			await this.updateTableSingleValue(item.key, REMINDER_VALUE_KEY_LINK, null);
		}
	}

	////////////////////// Below are add-card display helpers and label getters ////////////////

	/**
	 * Returns the YYYY.MM.DD display string for the new-item date pill.
	 *
	 * @returns A dot-separated date string, or empty string when no date is set.
	 */
	protected get newItemDateLabel(): string {
		return this.newItem.date ? Utilities.formatDateForStorage(this.newItem.date).replace(/-/g, '.') : '';
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
	 * Returns the editing item's date as a Date object for binding to the date picker.
	 * Derived from editingItem.date — never stored as a separate field.
	 *
	 * @returns A Date instance, or null when the editing item has no date.
	 */
	protected get editingDateModel(): Date | null {
		return this.editingItem?.date ? new Date(this.editingItem.date) : null;
	}

	////////////////////// Below are display helper methods used by the card template /////////

	/**
	 * Safely coerces any date value (string, Date, CloudBase timestamp) to a display string
	 * in YYYY.MM.DD format with dot separators.
	 *
	 * @param date - Any date representation.
	 * @returns A YYYY.MM.DD display string, or empty string.
	 */
	protected formatDate(date: unknown): string {
		return Utilities.coerceDateToString(date).replace(/-/g, '.');
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
	 * @param item - The ReminderItem.
	 * @returns The hostname string.
	 */
	protected getLinkLabel(item: ReminderItem): string {
		if (!item.link) return '';
		return Utilities.getDomain(item.link);
	}

	////////////////////// Below are new-item category selection and paginator helpers ///////

	/**
	 * Sets the selected category for the new-item card. Clicking the same category
	 * a second time deselects it (clears the tags array).
	 *
	 * @param tag - The tag string representing the category to select or deselect.
	 */
	protected selectNewItemCategory(tag: string): void {
		this.newItem.tag = tag;
	}

	/**
	 * Navigates to a specific page index in the paginator.
	 *
	 * @param index - The 0-based page index to navigate to.
	 */
	protected goToPage(index: number): void {
		this.page = index;
	}

	/**
	 * Returns an array of 0-based page indices for rendering the paginator buttons.
	 *
	 * @returns An array of integers from 0 to totalPages - 1.
	 */
	protected get pagesArray(): number[] {
		return Array.from({ length: this.totalPages }, (_, i) => i);
	}

	/**
	 * Returns the 1-based index of the first item on the current page, or 0 when
	 * the filtered item list is empty.
	 *
	 * @returns The start index for the paginator range label.
	 */
	protected get rangeStart(): number {
		return this.filteredItems.length === 0 ? 0 : this.page * REMINDER_ITEMS_PER_PAGE + 1;
	}

	/**
	 * Returns the 1-based index of the last item on the current page.
	 *
	 * @returns The end index for the paginator range label.
	 */
	protected get rangeEnd(): number {
		return Math.min((this.page + 1) * REMINDER_ITEMS_PER_PAGE, this.filteredItems.length);
	}

	////////////////////// Below are utility counter getters used by the template //////////////

	/**
	 * Returns the total pin count as a zero-padded 2-character string.
	 *
	 * @returns e.g. "01", "12".
	 */
	protected get counterLabel(): string {
		return String(this.items.length).padStart(2, '0');
	}
}
