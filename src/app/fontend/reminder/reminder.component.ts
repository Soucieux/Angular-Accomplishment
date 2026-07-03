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
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { DatePickerModule, DatePicker } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription, firstValueFrom, timer } from 'rxjs';
import { Utilities } from '../../common/utilities/app.utilities';
import { SessionExpiredError } from '../../common/error/session-expired.error';
import { LOG } from '../../common/app.logs';
import {
	COMPONENT_DESTROY,
	DATABASE_REMINDER,
	DIALOG_ERROR,
	REMINDER_AWAIT_SUFFIX_CN,
	REMINDER_AWAIT_SUFFIX_EN,
	REMINDER_CATEGORY_COLOR_DEFAULT,
	REMINDER_DUE_SOON_SUBTITLE,
	REMINDER_DUE_SOON_WINDOW_DAYS,
	REMINDER_ITEMS_PER_PAGE,
	REMINDER_ROWS_PER_PAGE,
	REMINDER_ROWS_PER_PAGE_NARROW,
	REMINDER_ITEM_MESSAGE,
	REMINDER_PLACEHOLDER_LINK,
	REMINDER_SUBTITLE_CN,
	REMINDER_SUBTITLE_EN,
	REMINDER_VALUE_KEY_DATE,
	REMINDER_VALUE_KEY_END_TIME,
	REMINDER_VALUE_KEY_LINK,
	REMINDER_VALUE_KEY_SHARED,
	REMINDER_VALUE_KEY_START_TIME,
	REMINDER_VALUE_KEY_TAG,
	REMINDER_VALUE_KEY_TEXT,
	STATS_FIELD_SHARED_WITH,
	STATS_FIELD_CONNECTIONS,
	STATS_CAP_ACTIVITY_LOG,
	STATS_FIELD_TOTAL_REMINDERS,
	STATS_FIELD_COMPLETED_PRIVATE,
	STATS_FIELD_COMPLETED_SHARED,
	STATS_FIELD_REMINDER_UPCOMING,
	TIMEOUT_KEY_REMINDER
} from '../../common/constants';
import {
	REMINDER_ADD_DATE_LABEL,
	REMINDER_ADD_LINK_LABEL,
	REMINDER_ADD_TIME_LABEL,
	REMINDER_START_TIME_LABEL,
	REMINDER_END_TIME_LABEL,
	REMINDER_CHIP_CUSTOM,
	REMINDER_CHIP_SHARED,
	REMINDER_SHARE_LABEL,
	REMINDER_SHARE_TOOLTIP_PENDING,
	DIALOG_BTN_CONFIRM,
	DIALOG_BTN_DELETE,
	REMINDER_DUE_SOON_LABEL,
	REMINDER_FILTER_LABEL,
	REMINDER_GREETING_PLURAL,
	REMINDER_GREETING_SINGULAR,
	REMINDER_MSG_DELETE_CONFIRM,
	REMINDER_MSG_DELETING,
	REMINDER_MSG_COMPLETING,
	REMINDER_MSG_COMPLETE_CONFIRM,
	REMINDER_COMPLETE_TITLE,
	REMINDER_GREETING_COMPLETED,
	REMINDER_GREETING_SHARED_COMPLETED,
	REMINDER_MSG_TAG_DUPLICATE,
	REMINDER_PLACEHOLDER_TAG,
	REMINDER_PLACEHOLDER_TEXT,
	BTN_ADD,
	LABEL_ALL,
	LABEL_PERSONAL,
	NAV_LABEL_REMINDER,
	DEBT_LABEL_OF,
	reminderTagLabel
} from '../../common/locale/locale-strings';
import {
	NewItem,
	REMINDER_CATEGORY_COLOR_MAP,
	REMINDER_CUSTOM_TAG_COLORS,
	REMINDER_END_TIME_OPTIONS,
	REMINDER_KNOWN_CATEGORIES,
	REMINDER_TIME_OPTIONS,
	ReminderDbRecord,
	ReminderValueKey,
	ReminderItem,
	TagEditSession,
	TimeOption
} from './reminder.model';
import { ConnectedMember, DatabaseService } from '../../backend/database-service/database.service';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { TimeoutService } from '../../common/timeout/timeout.service';
import { BlockedCardComponent } from '../../common/blocked-card/blocked-card.component';

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
		SelectModule,
		SkeletonModule,
		DatePickerModule,
		TooltipModule,
		BlockedCardComponent
	],
	templateUrl: './reminder.component.html',
	styleUrls: ['../../common/glass-card.css', './reminder.component.css']
})
export class ReminderComponent implements OnInit, AfterViewInit, OnDestroy {
	private readonly className = 'ReminderComponent';

	@ViewChild('reminderPanel') private reminderPanel!: ElementRef<HTMLElement>;
	@ViewChild('cardGrid') private cardGrid!: ElementRef<HTMLElement>;
	@ViewChild('dateOrLinkPopover') private dateOrLinkPopover!: Popover;
	@ViewChild('tagPickerPopover') private tagPickerPopover?: Popover;
	@ViewChild('editingDatepicker') private editingDatepicker?: DatePicker;
	@ViewChild('newItemDatepicker') private newItemDatepicker?: DatePicker;
	@ViewChild('linkInput') private linkInput?: ElementRef<HTMLInputElement>;
	@ViewChild('tagInlineInput') private tagInlineInput?: ElementRef<HTMLInputElement>;
	@ViewChild('tagPickerInput') private tagPickerInput?: ElementRef<HTMLInputElement>;
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;

	protected readonly REMINDER_PLACEHOLDER_TEXT = REMINDER_PLACEHOLDER_TEXT;
	protected readonly REMINDER_PLACEHOLDER_LINK = REMINDER_PLACEHOLDER_LINK;
	protected readonly REMINDER_PLACEHOLDER_TAG = REMINDER_PLACEHOLDER_TAG;
	protected readonly REMINDER_SUBTITLE_CN = REMINDER_SUBTITLE_CN;
	protected readonly REMINDER_SUBTITLE_EN = REMINDER_SUBTITLE_EN;
	protected readonly LABEL_ALL = LABEL_ALL;
	protected readonly REMINDER_FILTER_LABEL = REMINDER_FILTER_LABEL;
	protected readonly REMINDER_ADD_LINK_LABEL = REMINDER_ADD_LINK_LABEL;
	protected readonly REMINDER_ADD_DATE_LABEL = REMINDER_ADD_DATE_LABEL;
	protected readonly REMINDER_ADD_TIME_LABEL = REMINDER_ADD_TIME_LABEL;
	protected readonly REMINDER_START_TIME_LABEL = REMINDER_START_TIME_LABEL;
	protected readonly REMINDER_END_TIME_LABEL = REMINDER_END_TIME_LABEL;
	protected readonly BTN_ADD = BTN_ADD;
	protected readonly REMINDER_TIME_OPTIONS = REMINDER_TIME_OPTIONS;
	protected readonly REMINDER_END_TIME_OPTIONS = REMINDER_END_TIME_OPTIONS;
	protected readonly REMINDER_DUE_SOON_LABEL = REMINDER_DUE_SOON_LABEL;
	protected readonly REMINDER_DUE_SOON_SUBTITLE = REMINDER_DUE_SOON_SUBTITLE;
	protected readonly REMINDER_GREETING_SINGULAR = REMINDER_GREETING_SINGULAR;
	protected readonly REMINDER_GREETING_PLURAL = REMINDER_GREETING_PLURAL;
	protected readonly REMINDER_GREETING_COMPLETED = REMINDER_GREETING_COMPLETED;
	protected readonly REMINDER_GREETING_SHARED_COMPLETED = REMINDER_GREETING_SHARED_COMPLETED;
	protected readonly REMINDER_AWAIT_SUFFIX_CN = REMINDER_AWAIT_SUFFIX_CN;
	protected readonly REMINDER_AWAIT_SUFFIX_EN = REMINDER_AWAIT_SUFFIX_EN;
	protected readonly REMINDER_CHIP_CUSTOM = REMINDER_CHIP_CUSTOM;
	protected readonly REMINDER_CHIP_SHARED = REMINDER_CHIP_SHARED;
	protected readonly REMINDER_SHARE_LABEL = REMINDER_SHARE_LABEL;
	protected readonly REMINDER_SHARE_TOOLTIP_PENDING = REMINDER_SHARE_TOOLTIP_PENDING;
	protected readonly NAV_LABEL_REMINDER = NAV_LABEL_REMINDER;
	protected readonly DEBT_LABEL_OF = DEBT_LABEL_OF;
	private readonly categoryColorMap = REMINDER_CATEGORY_COLOR_MAP;
	private readonly baseCategorySet = new Set<string>(REMINDER_KNOWN_CATEGORIES);
	private gridResizeObserver?: ResizeObserver;
	private itemsPerPage = REMINDER_ITEMS_PER_PAGE;
	protected completedPrivateCount = 0;
	protected completedSharedCount = 0;
	protected loading = true;
	protected items: ReminderItem[] = [];
	protected filterBarTags: string[] = [];
	protected hasSharedItems = false;
	protected openCount = 0;
	protected hasConnections = false;
	protected memberProfiles: Record<string, string> = {};
	protected page = 0;
	protected editingItem: ReminderItem | null = null;
	protected editingDateModel: Date | null = null;
	protected editingStartTime: string | null = null;
	protected editingEndTime: string | null = null;
	protected isDate = false;
	protected editingLink = '';
	protected newItem: NewItem = {
		text: '',
		date: null,
		link: '',
		tag: LABEL_PERSONAL,
		startTime: null,
		endTime: null,
		isShared: false
	};
	protected saveIndicator = false;
	protected sharedFilterActive = false;
	protected tagFilter = new Set<string>();
	protected tagEditSession: TagEditSession | null = null;
	protected tagPickerCustomMode = false;
	private originalItems: ReminderDbRecord[] = [];
	private itemsSub?: Subscription;
	private statsSub?: Subscription;
	private saveIndicatorTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};
	// Re-entry guard so rapid add clicks (or Enter presses) cannot fire duplicate DB writes.
	private isAddingItem = false;

	constructor(
		@Inject(PLATFORM_ID) private readonly platformId: object,
		private readonly databaseService: DatabaseService,
		private readonly dialogService: DialogService,
		private readonly timeoutService: TimeoutService,
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
			/* Derive connection-dependent state from the live user document so it stays current even when
			   the other account approves the link while this page is open: creator display names for
			   shared items (from connections) and whether the share toggle is unlocked (from sharedWith). */
			this.statsSub = (this.databaseService as CloudbaseService).getUserStats().subscribe((doc) => {
				if (!doc) return;
				const connections = Utilities.toArray(doc[STATS_FIELD_CONNECTIONS]) as ConnectedMember[];
				this.memberProfiles = Object.fromEntries(
					connections.map((entry) => [entry.openid, entry.name ?? ''])
				);
				this.hasConnections = (Utilities.toArray(doc[STATS_FIELD_SHARED_WITH]) as string[]).length > 0;
				if (!this.hasConnections) this.sharedFilterActive = false;
				this.completedPrivateCount = (doc[STATS_FIELD_COMPLETED_PRIVATE] as number) ?? 0;
				this.completedSharedCount = (doc[STATS_FIELD_COMPLETED_SHARED] as number) ?? 0;
				this.cdr.detectChanges();
			});
			this.timeoutService.start(TIMEOUT_KEY_REMINDER, () => {
				this.dialogService.showLoadingTimeout(this.dialogComponentContainer);
			});
			this.itemsSub = this.databaseService.getReminderTableDetails().subscribe((raw) => {
				// Step 1: Parse raw DB records into ReminderItem view models. getUserId() is valid here
				// because the stream only emits after watchCollection's auth-ready gate.
				const currentUserId = CloudbaseService.getUserId() ?? '';
				const records = raw as ReminderDbRecord[];
				this.originalItems = structuredClone(records);
				this.items = records.map((record) => ({
					key: record.key ?? '',
					_openid: record._openid ?? '',
					text: record.text ?? '',
					date: record.date != null ? Utilities.coerceDateToString(record.date) : null,
					link: record.link ?? null,
					tag: record.tag ?? '',
					startTime: record.startTime ?? null,
					endTime: record.endTime ?? null,
					// isShared = marked shared on creation (DB flag); isFromOtherMember = owned by another member.
					isShared: record.isShared ?? false,
					isFromOtherMember: (record._openid ?? '') !== currentUserId
				}));
				this.filterBarTags = this.computeFilterBarTags();
				this.hasSharedItems = this.items.some((item) => item.isShared);
				this.openCount = this.items.filter((item) => item.text.trim() !== '').length;
				// Step 2: Remove any selected tag filters that no longer exist in the item set
				this.removeStaleTag();
				// Step 3: Sync upcoming items to the statistics collection
				this.updateUpcomingToStatistics();
				this.timeoutService.clear(TIMEOUT_KEY_REMINDER);
				this.loading = false;
				// detectChanges forces a synchronous render so updateGridLayout below measures the laid-out grid.
				this.cdr.detectChanges();
				this.updateGridLayout();
			});
		}
	}

	/**
	 * Attaches the scroll auto-hide behaviour to the glass-card panel and wires up a
	 * ResizeObserver so the grid column count recalculates whenever the container width
	 * changes — including when the nav panel collapses or expands.
	 */
	ngAfterViewInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.ngZone.runOutsideAngular(() =>
				Utilities.attachScrollAutoHide(this.reminderPanel?.nativeElement)
			);
			this.gridResizeObserver = new ResizeObserver(() =>
				this.ngZone.run(() => this.updateGridLayout())
			);
			// Guard the observe: the panel is absent in the access-denied state (glass-card @if is false).
			if (this.reminderPanel) this.gridResizeObserver.observe(this.reminderPanel.nativeElement);
		}
	}

	/**
	 * Unsubscribes from the items stream, clears any pending save timer,
	 * clears the dialog container, and logs the component destruction event.
	 */
	ngOnDestroy(): void {
		this.timeoutService.clear(TIMEOUT_KEY_REMINDER);
		this.gridResizeObserver?.disconnect();
		this.itemsSub?.unsubscribe();
		this.statsSub?.unsubscribe();
		Object.values(this.saveIndicatorTimeouts).forEach(clearTimeout);
		this.dialogComponentContainer?.clear();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	// ── category, done state, and due-soon helpers ───────────────────────────

	/**
	 * Gets the accent color for a tag. Known categories use their fixed palette
	 * color; custom tags pick a color from the curated palette using a djb2-style
	 * hash of the tag string so the same name always renders the same color.
	 * Returns hex so that hex-alpha suffixes (e.g. `+ '1f'`) produce valid CSS.
	 *
	 * @param tag - The tag string to look up, or undefined when the item has no tag.
	 * @returns A CSS hex color string.
	 */
	protected tagColor(tag: string | undefined): string {
		if (!tag) return REMINDER_CATEGORY_COLOR_DEFAULT;
		if (this.categoryColorMap[tag]) return this.categoryColorMap[tag];
		let hash = 0;
		for (let i = 0; i < tag.length; i++) {
			hash = tag.charCodeAt(i) + ((hash << 5) - hash);
		}
		return REMINDER_CUSTOM_TAG_COLORS[Math.abs(hash) % REMINDER_CUSTOM_TAG_COLORS.length];
	}

	/**
	 * Computes the ordered list of tags for the filter bar: the four base categories
	 * first, followed by any unique custom tags found across all current items.
	 * Called once per DB subscription emission; result is stored in {@link filterBarTags}.
	 *
	 * @returns The ordered array of tag strings with base categories leading.
	 */
	private computeFilterBarTags(): string[] {
		const custom = [
			...new Set(
				this.items.map((item) => item.tag).filter((tag) => tag && !this.baseCategorySet.has(tag))
			)
		];
		return [...this.baseCategorySet, ...custom];
	}

	/**
	 * Gets the selectable tags for the card tag-picker popover, excluding the
	 * currently edited card's own custom tag so it doesn't appear twice (it is
	 * already represented by the Custom chip at the end of the list).
	 *
	 * @returns The filtered tag array for the card tag-picker chip list.
	 */
	protected get popoverFilterTags(): string[] {
		const ownCustom = this.tagEditSession?.item?.tag;
		if (!ownCustom || this.isKnownCategory(ownCustom)) return this.filterBarTags;
		return this.filterBarTags.filter((tag) => tag !== ownCustom);
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
	 * Gets the count of items whose date is within the due-soon window.
	 *
	 * @returns The number of due-soon items.
	 */
	protected get dueSoonCount(): number {
		return this.items.filter((item) => this.isDueSoon(item)).length;
	}

	/**
	 * Marks a reminder done: permanently removes it (like delete) while incrementing the completed
	 * counter — the private counter for the user's own items, or, for a shared item, the shared counter
	 * of every linked member via the Cloud Function. Opens a confirmation dialog first; on confirm the
	 * write runs behind the blocking overlay so a repeat tap cannot fire a duplicate.
	 *
	 * @param item - The reminder item being completed.
	 */
	protected completeItem(item: ReminderItem): void {
		if (!this.ensureEditPermission(item.key)) return;
		this.dialogService.confirmThenBlock(
			this.dialogComponentContainer,
			[REMINDER_MSG_COMPLETE_CONFIRM, REMINDER_COMPLETE_TITLE, DIALOG_BTN_CONFIRM],
			REMINDER_MSG_COMPLETING,
			() => this.completeItemWrite(item)
		);
	}

	/**
	 * Performs the completion write behind the blocking overlay: a shared item routes through the admin
	 * Cloud Function (which deletes it and fans the shared counter out to every linked member), while a
	 * private item is removed and counted on the current user's own document.
	 *
	 * @param item - The reminder item being completed.
	 */
	private async completeItemWrite(item: ReminderItem): Promise<void> {
		try {
			if (item.isShared || item.isFromOtherMember) {
				const result = await (this.databaseService as CloudbaseService).completeSharedReminder(
					item.key,
					item.text ?? ''
				);
				if (!result.success) {
					this.dialogService.showPermissionError(this.dialogComponentContainer);
					return;
				}
			} else {
				await this.databaseService.completeReminder(item.key, item.text ?? '');
			}
			this.triggerSaveIndicator();
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
		}
	}

	// ── tag filter methods for the item list ─────────────────────────────────

	/**
	 * Gets the non-blank items matching the active filter. When the shared filter is active,
	 * returns only shared items. Otherwise applies OR-logic tag filter, or all items when no
	 * tags are selected. Blank-text records are excluded throughout.
	 *
	 * @returns The filtered subset of items with non-empty text.
	 */
	protected get filteredItems(): ReminderItem[] {
		const nonBlank = this.items.filter((item) => item.text.trim() !== '');
		if (this.sharedFilterActive) return nonBlank.filter((item) => item.isShared);
		if (this.tagFilter.size === 0) return nonBlank;
		return nonBlank.filter((item) => this.tagFilter.has(item.tag));
	}

	/**
	 * Gets the visible item count (filtered), zero-padded to 2 characters.
	 *
	 * @returns e.g. "03", "08".
	 */
	protected get filteredCountLabel(): string {
		return String(this.filteredItems.length).padStart(2, '0');
	}

	/**
	 * Toggles a tag in the tag filter selection and resets to the first page.
	 * Clears the shared filter when a tag is activated.
	 *
	 * @param tag - The tag string to activate or deactivate.
	 */
	protected toggleTagFilter(tag: string): void {
		this.sharedFilterActive = false;
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
	 * Toggles the shared filter: activating shows only shared reminder items, deactivating
	 * returns to the full item list. Clears any tag filter and resets to the first page.
	 */
	protected toggleSharedFilter(): void {
		this.sharedFilterActive = !this.sharedFilterActive;
		this.tagFilter = new Set<string>();
		this.page = 0;
	}

	/**
	 * Clears the tag filter and the shared filter, returning to the full item list.
	 */
	protected clearTagFilter(): void {
		this.sharedFilterActive = false;
		this.tagFilter = new Set<string>();
		this.page = 0;
	}

	// ── pagination methods and page label getters ────────────────────────────

	/**
	 * Gets the items visible on the current page.
	 *
	 * @returns The slice of filtered items for the current page.
	 */
	protected get pagedItems(): ReminderItem[] {
		const start = this.page * this.itemsPerPage;
		return this.filteredItems.slice(start, start + this.itemsPerPage);
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
	 * Gets the total number of pages, including the virtual add-card slot
	 * only when no tags are selected in the filter.
	 *
	 * @returns Page count (minimum 1).
	 */
	protected get totalPages(): number {
		const count = this.filteredItems.length;
		return Math.max(1, Math.ceil(count / this.itemsPerPage));
	}

	/**
	 * Gets the current page number as a zero-padded 2-character string (1-based).
	 *
	 * @returns e.g. "01", "02".
	 */
	protected get pageLabel(): string {
		return String(this.page + 1).padStart(2, '0');
	}

	/**
	 * Gets the total page count as a zero-padded 2-character string.
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

	// ── CRUD operations for adding and removing pins ─────────────────────────

	/**
	 * Hides the shared date-or-link popover.
	 */
	protected closePopover(): void {
		(this.editingDatepicker as any)?.hideOverlay();
		(this.newItemDatepicker as any)?.hideOverlay();
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
		// Step 1: Capture the editing target and build a stable Date model for the datepicker
		this.editingItem = item ?? null;
		// Compute once here — a stable reference avoids the datepicker re-rendering on every CD cycle.
		this.editingDateModel = item?.date ? new Date(item.date + 'T00:00') : null;
		this.editingStartTime = item ? (item.startTime ?? null) : (this.newItem.startTime ?? null);
		this.editingEndTime = item ? (item.endTime ?? null) : (this.newItem.endTime ?? null);
		this.isDate = true;

		/* Step 2: Hide then re-show the popover after a 50 ms tick.
		   Without the delay, PrimeNG repositions the already-open popover in place rather than
		   re-anchoring it to the new event target, which leaves it misaligned when switching cards. */
		this.dateOrLinkPopover.hide();
		await firstValueFrom(timer(50));

		// Step 3: Reveal the popover anchored to the triggering element
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
		// Step 1: Capture the editing target and seed the link input with the existing value
		this.editingItem = item ?? null;
		this.editingLink = item?.link ?? '';
		this.isDate = false;

		/* Step 2: Hide then re-show after 50 ms — same re-anchor pattern as openDatePopover.
		   Without the tick, switching between card link buttons leaves the popover misaligned. */
		this.dateOrLinkPopover.hide();
		await firstValueFrom(timer(50));

		// Step 3: Reveal the popover anchored to the triggering element, then focus the input
		this.dateOrLinkPopover.show(event);
		await firstValueFrom(timer(100));
		this.linkInput?.nativeElement.focus();
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
		// Re-entry guard: ignore further clicks or Enter presses while a write is already in flight.
		if (this.isAddingItem) return;
		if (!this.newItem.text.trim()) return;
		this.isAddingItem = true;

		// Step 1: Build the flat record payload
		const newRecord: Partial<ReminderDbRecord> = {
			text: this.newItem.text.trim(),
			tag: this.newItem.tag
		};
		// Persist the shared flag only when toggled on (the toggle is gated on group membership).
		if (this.newItem.isShared) {
			newRecord[REMINDER_VALUE_KEY_SHARED] = true;
		}

		// Step 2: Include optional fields unless text-only mode
		if (!textOnly) {
			if (this.newItem.date) {
				newRecord.date = Utilities.formatDateForStorage(this.newItem.date);
			}
			if (this.newItem.link.trim()) {
				newRecord.link = Utilities.normalizeUrl(this.newItem.link.trim(), true);
			}
			// Only persist time when both values are set (they are always a pair)
			if (this.newItem.startTime && this.newItem.endTime) {
				newRecord[REMINDER_VALUE_KEY_START_TIME] = this.newItem.startTime;
				newRecord[REMINDER_VALUE_KEY_END_TIME] = this.newItem.endTime;
			}
		}

		try {
			// Step 3: Persist to the database
			await this.databaseService.addNewRecordToReminder(newRecord);

			// Step 4: Flash save indicator
			this.triggerSaveIndicator();

			// Step 5: Reset new-item state and navigate to last page
			this.page = Math.max(0, Math.ceil((this.items.length + 1) / this.itemsPerPage) - 1);
			this.resetNewItem();
			if (!textOnly) {
				this.dateOrLinkPopover.hide();
			}
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
		} finally {
			this.isAddingItem = false;
		}
	}

	/**
	 * Opens a confirmation dialog before removing an entry. Guards with a permission check.
	 *
	 * @param entryKey - The CloudBase document key identifying the entry to remove.
	 */
	protected openDeleteConfirmationDialog(entryKey: string): void {
		// Guard with a permission check — only the record owner may delete
		if (!this.ensureEditPermission(entryKey)) return;
		this.dialogService.confirmThenBlock(
			this.dialogComponentContainer,
			[REMINDER_MSG_DELETE_CONFIRM, DIALOG_BTN_DELETE, DIALOG_BTN_CONFIRM],
			REMINDER_MSG_DELETING,
			() => this.removeRecordFromDatabase(entryKey)
		);
	}

	/**
	 * Persists the card message text to CloudBase when confirmed (Enter or blur),
	 * only when the value has changed.
	 *
	 * @param item - The ReminderItem whose text was edited.
	 */
	protected async onCardTextUpdate(item: ReminderItem): Promise<void> {
		// Step 1: Bail out early if the item no longer exists in the snapshot or the text is unchanged
		const originalIndex = this.originalItems.findIndex(
			(originalRecord) => originalRecord.key === item.key
		);
		if (originalIndex === -1 || item.text === (this.originalItems[originalIndex].text ?? '')) return;

		// Step 2: Guard with a permission check before touching the database
		if (!this.ensureEditPermission(item.key)) return;

		// Step 3: Persist the trimmed text to CloudBase
		const savedText = item.text.trim();
		await this.updateTableSingleValue(item.key, REMINDER_VALUE_KEY_TEXT, savedText);

		/* Step 4: Update the local snapshot immutably so a concurrent blur cannot pass the
		   changed-value guard above and fire a duplicate write before the DB subscription re-emits. */
		const updatedSnapshot = structuredClone(this.originalItems[originalIndex]);
		updatedSnapshot.text = savedText;
		this.originalItems = [
			...this.originalItems.slice(0, originalIndex),
			updatedSnapshot,
			...this.originalItems.slice(originalIndex + 1)
		];
	}

	// ── DB helper and permission check methods ───────────────────────────────

	/**
	 * Gets the user id of the current item.
	 *
	 * @param entryKey - The CloudBase document key identifying the entry.
	 * @returns The owner's CloudBase open id, or an empty string when not found.
	 */
	private getOpenId(entryKey: string): string {
		return this.items.find((item) => item.key === entryKey)?._openid ?? '';
	}

	/**
	 * Front-end edit guard for a reminder entry. Owners (and admins) may always edit; a connected
	 * account may edit a shared item received from a linked owner — getSharedReminders only surfaces
	 * shared items from live links, so isFromOtherMember implies a connection, and the admin Cloud
	 * Function re-verifies it server-side on write. Everything else shows the permission-denied dialog.
	 *
	 * @param entryKey - The document key of the entry being edited.
	 * @returns True when the current user may edit the entry.
	 */
	private ensureEditPermission(entryKey: string): boolean {
		const item = this.items.find((candidate) => candidate.key === entryKey);
		if (item?.isFromOtherMember) return true;
		return this.dialogService.ensurePermission(this.dialogComponentContainer, this.getOpenId(entryKey));
	}

	/**
	 * Shows a save-confirmation indicator and automatically hides it after one second.
	 * If a previous timeout is still active, it is cleared and restarted to avoid
	 * overlapping triggers.
	 */
	private triggerSaveIndicator(): void {
		this.saveIndicator = true;
		this.cdr.detectChanges();

		/* Clear any previous timeout before setting a new one — rapid successive
		   saves should restart the indicator timer rather than flash on/off. */
		if (this.saveIndicatorTimeouts[DATABASE_REMINDER]) {
			clearTimeout(this.saveIndicatorTimeouts[DATABASE_REMINDER]);
		}

		this.saveIndicatorTimeouts[DATABASE_REMINDER] = setTimeout(() => {
			this.saveIndicator = false;
			// setTimeout runs outside Angular's zone — detectChanges required to hide the indicator.
			this.cdr.detectChanges();
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
			.updateUserStatsFields({
				[STATS_FIELD_REMINDER_UPCOMING]: upcoming.slice(0, STATS_CAP_ACTIVITY_LOG),
				[STATS_FIELD_TOTAL_REMINDERS]: this.items.length
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
	 * Computes the auto-filled end time by adding 60 minutes to the given start time.
	 * Caps the result at "24:00" when the computed time would exceed midnight.
	 *
	 * @param startTime - The start time string in "HH:mm" format.
	 * @returns The computed end time string in "HH:mm" format.
	 */
	private computeEndTimeFromStart(startTime: string): string {
		const totalMinutes = Utilities.parseTimeToMinutes(startTime) + 60;
		if (totalMinutes >= 24 * 60) return '24:00';
		return `${Utilities.padTwoDigits(Math.floor(totalMinutes / 60))}:${Utilities.padTwoDigits(totalMinutes % 60)}`;
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
			case REMINDER_VALUE_KEY_START_TIME:
				item.startTime = originalRecord.startTime ?? null;
				break;
			case REMINDER_VALUE_KEY_END_TIME:
				item.endTime = originalRecord.endTime ?? null;
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
	 * {@link clearDate} - Clears the date (and cascades to clear time) on a pin.
	 * {@link clearLink} - Clears the link value on a pin.
	 * {@link clearTime} - Clears both start and end time on a pin.
	 * {@link onStartTimeSelect} - Persists start time (and auto-filled end time) for an existing pin.
	 * {@link onEndTimeSelect} - Persists the adjusted end time for an existing pin.
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
		const item = this.items.find((candidate) => candidate.key === entryKey);
		try {
			// Step 1: Persist — a shared item from a connection routes through the admin Cloud Function
			// (the own-only rule blocks a direct write to another account's document).
			if (item?.isFromOtherMember) {
				const result = await (this.databaseService as CloudbaseService).updateSharedReminderField(
					entryKey,
					valueKey,
					singleValue,
					item.text ?? ''
				);
				if (!result.success) {
					const originalRecord = this.originalItems.find((candidate) => candidate.key === entryKey);
					if (originalRecord) this.rollbackSingleValue(item, originalRecord, valueKey);
					this.dialogService.showPermissionError(this.dialogComponentContainer);
					return;
				}
			} else {
				await this.databaseService.updateReminderTable(
					entryKey,
					valueKey,
					singleValue,
					item?.text ?? '',
					item?.isShared ?? false
				);
			}

			// Step 2: Flash the save indicator
			this.triggerSaveIndicator();
		} catch (error) {
			// Roll back the local single value if the session expired, then show error dialog
			if (error instanceof SessionExpiredError) {
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
		const item = this.items.find((candidate) => candidate.key === entryKey);
		try {
			// A shared item from a connection routes through the admin Cloud Function (own-only rule).
			if (item?.isFromOtherMember) {
				const result = await (this.databaseService as CloudbaseService).removeSharedReminder(
					entryKey,
					item.text ?? ''
				);
				if (!result.success) {
					this.dialogService.showPermissionError(this.dialogComponentContainer);
					return;
				}
			} else {
				await this.databaseService.removeRecordFromReminderTable(
					entryKey,
					item?.text ?? '',
					item?.isShared ?? false
				);
			}
			this.triggerSaveIndicator();
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
		}
	}

	/**
	 * Resets all new-item form fields to their empty state.
	 */
	private resetNewItem(): void {
		this.newItem = {
			text: '',
			date: null,
			link: '',
			tag: LABEL_PERSONAL,
			startTime: null,
			endTime: null,
			isShared: false
		};
		this.editingStartTime = null;
		this.editingEndTime = null;
		if (this.tagEditSession?.isNewItem) this.tagEditSession = null;
	}

	// ── global index display helpers for paged items ─────────────────────────

	/**
	 * Gets the 1-based global index for a paged item, zero-padded to 2 digits.
	 *
	 * @param localIndex - The 0-based index within the current page.
	 * @returns A 2-character padded string e.g. "01", "12".
	 */
	protected globalLabel(localIndex: number): string {
		return String(this.page * this.itemsPerPage + localIndex + 1).padStart(2, '0');
	}

	// ── card edit popover event handlers ─────────────────────────────────────

	/**
	 * Handles date selection from the editing-item datepicker. Closes the calendar and popover
	 * immediately, then persists the selected date to CloudBase in the background so the spinner
	 * runs without blocking the UI.
	 *
	 * @param date - The Date value selected in the picker.
	 */
	protected async onEditingDateSelected(date: Date): Promise<void> {
		/* Step 1: Dismiss only the calendar overlay — keep the popover open so the user can
		   continue setting start and end times immediately after picking the date. */
		(this.editingDatepicker as any)?.hideOverlay();
		if (!this.editingItem) return;

		// Step 2: Guard with a permission check — must happen after the null guard on editingItem
		if (!this.ensureEditPermission(this.editingItem.key)) return;

		// Step 3: Persist the selected date and refresh the statistics upcoming list
		this.editingItem.date = date ? Utilities.formatDateForStorage(date) : null;
		await this.updateTableSingleValue(
			this.editingItem.key,
			REMINDER_VALUE_KEY_DATE,
			this.editingItem.date
		);
		this.updateUpcomingToStatistics();
	}

	/**
	 * Handles date selection from the new-item datepicker. Hides the calendar overlay only,
	 * keeping the popover open so the user can continue setting start and end times.
	 */
	protected onNewItemDateSelected(): void {
		(this.newItemDatepicker as any)?.hideOverlay();
	}

	/**
	 * Handles start time selection from the time dropdown. Persists both start time and
	 * auto-filled end time for existing items, or updates the new-item form state.
	 *
	 * @param value - The selected start time string in "HH:mm" format.
	 */
	protected async onStartTimeSelect(value: string): Promise<void> {
		this.editingStartTime = value;

		// Compute and assign the auto-filled end time (start + 60 min, capped at 24:00)
		const autoEnd = this.computeEndTimeFromStart(value);
		this.editingEndTime = autoEnd;

		if (this.editingItem) {
			// Persist both values to CloudBase for an existing item
			this.editingItem.startTime = value;
			this.editingItem.endTime = autoEnd;
			await Promise.all([
				this.updateTableSingleValue(this.editingItem.key, REMINDER_VALUE_KEY_START_TIME, value),
				this.updateTableSingleValue(this.editingItem.key, REMINDER_VALUE_KEY_END_TIME, autoEnd)
			]);
		} else {
			// Update new-item form state only — no DB write until addNewItem()
			this.newItem = { ...this.newItem, startTime: value, endTime: autoEnd };
		}
	}

	/**
	 * Handles end time selection from the time dropdown. Persists the end time for existing
	 * items, or updates the new-item form state.
	 *
	 * @param value - The selected end time string in "HH:mm" format.
	 */
	protected async onEndTimeSelect(value: string): Promise<void> {
		this.editingEndTime = value;

		if (this.editingItem) {
			this.editingItem.endTime = value;
			await this.updateTableSingleValue(this.editingItem.key, REMINDER_VALUE_KEY_END_TIME, value);
		} else {
			this.newItem = { ...this.newItem, endTime: value };
		}
	}

	/**
	 * Persists the normalized link from the popover link input to the editing item and CloudBase,
	 * then hides the popover. Also closes the popover when called for a new item (no editing item).
	 */
	protected async onPopoverLinkUpdate(): Promise<void> {
		if (this.editingItem) {
			// Step 1: Guard with a permission check before writing to the database
			if (!this.ensureEditPermission(this.editingItem.key)) return;

			/* Step 2: Normalize the URL before persisting — empty input clears the field rather
			   than storing a blank string, matching the null-vs-string distinction used elsewhere. */
			const trimmedLink = this.editingLink.trim();
			this.editingItem.link = trimmedLink ? Utilities.normalizeUrl(trimmedLink, true) : null;
			await this.updateTableSingleValue(
				this.editingItem.key,
				REMINDER_VALUE_KEY_LINK,
				this.editingItem.link
			);
		}

		// Step 3: Always hide the popover — runs for both the existing-item and new-item paths
		this.dateOrLinkPopover.hide();
	}

	// ── tag editing handlers for existing card items ─────────────────────────

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
	 * Persists the current tag value for an existing card when confirmed (Enter).
	 * Empty input cancels silently; duplicate names show an error dialog.
	 * Writes the updated tag to CloudBase.
	 */
	protected async onTagUpdate(): Promise<void> {
		const session = this.tagEditSession;
		if (!session?.item) return;
		const item = session.item;

		// Step 1: Empty input → cancel without a DB write
		const tagText = session.tagText.trim();
		if (!tagText) {
			this.tagPickerPopover?.hide();
			this.cancelTagEdit();
			return;
		}

		// Step 2: Reject new custom tag names that collide with any existing tag (custom chip only)
		if (session.index === -1) {
			const isDuplicate = this.isTagDuplicate(tagText, item.tag);
			if (isDuplicate) {
				this.dialogService.openDialog(
					this.dialogComponentContainer,
					DIALOG_ERROR,
					REMINDER_MSG_TAG_DUPLICATE
				);
				return;
			}
		}

		// Step 3: Guard with a permission check before writing to the database
		if (!this.ensureEditPermission(item.key)) return;

		// Step 4: Apply the new tag and persist
		item.tag = tagText;
		this.tagPickerPopover?.hide();
		this.cancelTagEdit();
		if (item.key) await this.updateTableSingleValue(item.key, REMINDER_VALUE_KEY_TAG, item.tag);
	}

	/**
	 * Commits the current tag value for the new-item card when confirmed (Enter).
	 * Empty input cancels silently; duplicate names show an error dialog.
	 * Updates the local newItem state only — no DB write.
	 */
	protected onNewItemTagUpdate(): void {
		const session = this.tagEditSession;
		const tagText = session?.tagText.trim() ?? '';
		if (!tagText) {
			this.cancelTagEdit();
			return;
		}
		if (this.isTagDuplicate(tagText, this.newItem.tag)) {
			this.dialogService.openDialog(
				this.dialogComponentContainer,
				DIALOG_ERROR,
				REMINDER_MSG_TAG_DUPLICATE
			);
			return;
		}
		this.newItem.tag = tagText;
		this.cancelTagEdit();
	}

	/**
	 * Cancels the custom-tag edit for the new-item card, clears any applied custom
	 * tag from the new item, and closes the editing chip.
	 */
	protected onCancelNewItemTagEdit(): void {
		if (this.newItemHasCustomTag) {
			this.newItem.tag = LABEL_PERSONAL;
		}
		this.cancelTagEdit();
	}

	/**
	 * Discards the current tag input and clears the tag-edit session.
	 */
	protected cancelTagEdit(): void {
		this.tagEditSession = null;
	}

	/**
	 * Gets the tag text currently being typed, returning an empty string when no
	 * session is active so template bindings never evaluate against null.
	 *
	 * @returns The current tag input text, or an empty string.
	 */
	protected get tagSessionText(): string {
		return this.tagEditSession?.tagText ?? '';
	}

	/**
	 * Sets the tag text on the active session. No-op when no session is active,
	 * which prevents two-way binding crashes during the session teardown cycle.
	 *
	 * @param value - The new tag input text.
	 */
	protected set tagSessionText(value: string) {
		if (this.tagEditSession) this.tagEditSession = { ...this.tagEditSession, tagText: value };
	}

	/**
	 * Checks whether the given tag text is a duplicate of any existing tag in the
	 * filter bar, comparing against both stored keys and locale display labels so
	 * Chinese-locale known-category names (e.g. '工作') are caught alongside their
	 * English counterparts (e.g. 'Work').
	 *
	 * @param tagText - The candidate tag string entered by the user.
	 * @param currentTag - The tag already applied to the item being edited; exempted from the check.
	 * @returns True when `tagText` collides with an existing tag other than `currentTag`.
	 */
	private isTagDuplicate(tagText: string, currentTag: string): boolean {
		const matchesExisting = this.filterBarTags.some((tag) => this.categoryDisplayLabel(tag) === tagText);
		const isOwnTag = this.categoryDisplayLabel(currentTag) === tagText;
		return matchesExisting && !isOwnTag;
	}

	// ── tag editing handlers for the new-item card ───────────────────────────

	/**
	 * Begins editing or adding a tag on the new-item card.
	 * Pass index = -1 to open the add-tag input; pass the tag's 0-based index to edit it.
	 * Pre-fills with the existing custom tag when one is already set.
	 *
	 * @param index - The 0-based tag index to edit, or -1 to add a new tag.
	 */
	protected async startNewItemTagEdit(index: number): Promise<void> {
		const existingCustom =
			index === -1 && !this.isKnownCategory(this.newItem.tag) ? this.newItem.tag : '';
		this.tagEditSession = {
			item: null,
			index,
			isNewItem: true,
			tagText: existingCustom
		};
		await firstValueFrom(timer(50));
		this.tagInlineInput?.nativeElement.focus();
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

	// ── single-value clear handlers for date and link ────────────────────────

	/**
	 * Clears the date single value on a pin and persists the change to CloudBase.
	 *
	 * @param item - The ReminderItem to update.
	 */
	protected async clearDate(item: ReminderItem): Promise<void> {
		// Step 1: Guard with a permission check before touching the database
		if (!this.ensureEditPermission(item.key)) return;

		// Step 2: Capture whether time fields need clearing before nulling everything
		const hadTime = item.startTime !== null || item.endTime !== null;

		// Step 3: Clear date, startTime, and endTime on the view model for instant UI feedback
		item.date = null;
		item.startTime = null;
		item.endTime = null;

		// Step 4: Persist all cleared values and refresh the upcoming-reminders statistics
		if (item.key) {
			const writes: Promise<void>[] = [
				this.updateTableSingleValue(item.key, REMINDER_VALUE_KEY_DATE, null)
			];
			if (hadTime) {
				writes.push(this.updateTableSingleValue(item.key, REMINDER_VALUE_KEY_START_TIME, null));
				writes.push(this.updateTableSingleValue(item.key, REMINDER_VALUE_KEY_END_TIME, null));
			}
			await Promise.all(writes);
			this.updateUpcomingToStatistics();
		}
	}

	/**
	 * Clears both start and end time on a pin and persists the changes to CloudBase.
	 *
	 * @param item - The ReminderItem to update.
	 */
	protected async clearTime(item: ReminderItem): Promise<void> {
		// Step 1: Guard with a permission check before touching the database
		if (!this.ensureEditPermission(item.key)) return;

		// Step 2: Clear both time fields on the view model for instant UI feedback
		item.startTime = null;
		item.endTime = null;
		this.editingStartTime = null;
		this.editingEndTime = null;

		// Step 3: Persist both cleared time values
		if (item.key) {
			await Promise.all([
				this.updateTableSingleValue(item.key, REMINDER_VALUE_KEY_START_TIME, null),
				this.updateTableSingleValue(item.key, REMINDER_VALUE_KEY_END_TIME, null)
			]);
		}
	}

	/**
	 * Clears the date and cascades to clear both time fields on the new-item form. No DB write — state update only.
	 */
	protected clearNewItemDate(): void {
		this.newItem = { ...this.newItem, date: null, startTime: null, endTime: null };
		this.editingStartTime = null;
		this.editingEndTime = null;
	}

	/**
	 * Clears the link on the new-item form. No DB write — state update only.
	 */
	protected clearNewItemLink(): void {
		this.newItem = { ...this.newItem, link: '' };
	}

	/**
	 * Clears both start and end time on the new-item form. No DB write — state update only.
	 */
	protected clearNewItemTime(): void {
		this.newItem = { ...this.newItem, startTime: null, endTime: null };
		this.editingStartTime = null;
		this.editingEndTime = null;
	}

	/**
	 * Clears the link single value on a pin and persists the change to CloudBase.
	 *
	 * @param item - The ReminderItem to update.
	 */
	protected async clearLink(item: ReminderItem): Promise<void> {
		// Step 1: Guard with a permission check before touching the database
		if (!this.ensureEditPermission(item.key)) return;

		/* Step 2: Clear the link on the view model and reset the popover input if this card
		   is currently open in the link popover — prevents a stale URL showing when it re-opens. */
		item.link = null;
		if (this.editingItem === item) this.editingLink = '';

		// Step 3: Persist the cleared link to CloudBase
		if (item.key) {
			await this.updateTableSingleValue(item.key, REMINDER_VALUE_KEY_LINK, null);
		}
	}

	// ── add-card display helpers and label getters ───────────────────────────

	/**
	 * Gets the YYYY.MM.DD display string for the new-item date pill.
	 *
	 * @returns A dot-separated date string, or empty string when no date is set.
	 */
	protected get newItemDateLabel(): string {
		return this.newItem.date ? Utilities.formatDateForStorage(this.newItem.date).replace(/-/g, '.') : '';
	}

	/**
	 * Gets the hostname for the new-item link pill.
	 *
	 * @returns The domain string, or empty string when no link is set.
	 */
	protected get newItemLinkLabel(): string {
		if (!this.newItem.link.trim()) return '';
		return Utilities.getDomain(Utilities.normalizeUrl(this.newItem.link.trim(), true));
	}

	// ── display helper methods used by the card template ─────────────────────

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
	 * Returns the hostname from a link for display.
	 *
	 * @param item - The ReminderItem.
	 * @returns The hostname string.
	 */
	protected getLinkLabel(item: ReminderItem): string {
		if (!item.link) return '';
		return Utilities.getDomain(item.link);
	}

	// ── new-item category selection and paginator helpers ────────────────────

	/**
	 * Returns true when the given tag is one of the four built-in categories.
	 *
	 * @param tag - The tag string to test.
	 * @returns True when the tag is a known base category.
	 */
	protected isKnownCategory(tag: string): boolean {
		return this.baseCategorySet.has(tag);
	}

	/**
	 * Gets the locale-translated display label for a category tag.
	 * Returns the raw tag for custom (non-built-in) categories.
	 *
	 * @param tag - The tag string (stored EN value or custom string).
	 * @returns The translated label, or the tag itself if not a known category.
	 */
	protected categoryDisplayLabel(tag: string | undefined): string {
		return reminderTagLabel(tag);
	}

	/**
	 * Gets the display name of the member who owns a shared reminder, for the creator label.
	 *
	 * @param item - The reminder item to resolve the creator name for.
	 * @returns The owning member's display name, or an empty string when unknown.
	 */
	protected creatorLabel(item: ReminderItem): string {
		return this.memberProfiles[item._openid] ?? '';
	}

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
	 * Toggles whether the new item will be marked shared on creation. No-op when the user has no
	 * connections, since sharing requires a linked account.
	 */
	protected toggleNewItemShared(): void {
		if (!this.hasConnections) return;
		this.newItem.isShared = !this.newItem.isShared;
	}

	/**
	 * Selects a category chip for an existing card, persists the change, and
	 * closes the tag picker popover. No-op when no session is active or the tag
	 * is already set to the selected value.
	 *
	 * @param tag - The tag string to apply.
	 */
	protected async onSelectItemCategory(tag: string): Promise<void> {
		const item = this.tagEditSession?.item;
		if (!item) return;
		if (item.tag === tag) {
			this.tagPickerPopover?.hide();
			return;
		}
		this.tagEditSession = { item, index: 0, isNewItem: false, tagText: tag };
		await this.onTagUpdate();
	}

	/**
	 * Opens the tag picker popover anchored to the clicked tag label.
	 *
	 * @param event - The click event used to position the popover.
	 * @param item - The card whose tag will be edited.
	 */
	protected openTagPicker(event: Event, item: ReminderItem): void {
		this.tagPickerCustomMode = false;
		this.startTagEdit(item, 0);
		this.tagPickerPopover?.show(event);
	}

	/**
	 * Clears the tag picker state when the popover closes for any reason.
	 */
	protected onTagPickerHide(): void {
		this.tagPickerCustomMode = false;
		this.tagEditSession = null;
	}

	/**
	 * Switches the tag picker popover from chip-selection mode to free-text input mode.
	 * Pre-fills with the card's current custom tag if one is set, then focuses the input.
	 */
	protected async startTagPickerCustomInput(): Promise<void> {
		const existingCustom = this.tagEditSession?.item
			? !this.isKnownCategory(this.tagEditSession.item.tag)
				? this.tagEditSession.item.tag
				: ''
			: '';
		this.tagPickerCustomMode = true;
		if (this.tagEditSession) {
			this.tagEditSession = { ...this.tagEditSession, index: -1, tagText: existingCustom };
		}
		await firstValueFrom(timer(50));
		this.tagPickerInput?.nativeElement.focus();
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
		return this.filteredItems.length === 0 ? 0 : this.page * this.itemsPerPage + 1;
	}

	/**
	 * Returns the 1-based index of the last item on the current page.
	 *
	 * @returns The end index for the paginator range label.
	 */
	protected get rangeEnd(): number {
		return Math.min((this.page + 1) * this.itemsPerPage, this.filteredItems.length);
	}

	// ── grid layout helpers ──────────────────────────────────────────────────

	/**
	 * Recalculates the grid column count and page size based on the current container
	 * width and the CSS custom properties (--individual-item-width and
	 * --individual-item-gap). Clamps the current page when the new page count shrinks.
	 */
	private updateGridLayout(): void {
		const container = this.reminderPanel?.nativeElement;
		const grid = this.cardGrid?.nativeElement;
		if (!container || !grid) return;

		/* Step 1: Read column sizing from CSS custom properties rather than hardcoded values
		   so the layout stays in sync with the stylesheet without duplicating constants in TS. */
		const style = getComputedStyle(container);
		const itemWidthPx = parseInt(style.getPropertyValue('--individual-item-width'));
		const itemGapPx = parseInt(style.getPropertyValue('--individual-item-gap'));

		// Step 2: Compute column count from available container width and apply it to the grid
		const containerWidth = container.clientWidth;
		const itemsPerRow = Math.max(1, Math.floor((containerWidth - itemGapPx) / (itemWidthPx + itemGapPx)));
		grid.style.gridTemplateColumns = `repeat(${itemsPerRow}, minmax(${itemWidthPx}px, 1fr))`;

		/* Step 3: Recalculate page size and clamp the current page index.
		   The page must be clamped before updating itemsPerPage — otherwise pagedItems
		   computes a slice from the old page size and can briefly show the wrong items. */
		const rowsPerPage = itemsPerRow === 1 ? REMINDER_ROWS_PER_PAGE_NARROW : REMINDER_ROWS_PER_PAGE;
		const newPageSize = itemsPerRow * rowsPerPage;
		const maxPage = Math.max(0, Math.ceil(this.filteredItems.length / newPageSize) - 1);
		if (this.page > maxPage) this.page = maxPage;
		this.itemsPerPage = newPageSize;
	}

	// ── utility counter getters used by the template ─────────────────────────

	/**
	 * Gets the total pin count as a zero-padded 2-character string.
	 *
	 * @returns e.g. "01", "12".
	 */
	protected get counterLabel(): string {
		return String(this.items.length).padStart(2, '0');
	}

	/**
	 * Returns an array of indices used to render skeleton loading cards,
	 * sized to match the current items-per-page so the skeleton grid layout
	 * is identical to the real card grid.
	 *
	 * @returns Array of 0-based indices with length equal to itemsPerPage.
	 */
	protected get skeletonItems(): number[] {
		return Array.from({ length: this.itemsPerPage }, (_, i) => i);
	}

	/**
	 * Returns true when the new-item card currently has a custom (non-category) tag selected.
	 *
	 * @returns True when newItem.tag is set and is not a known base category.
	 */
	protected get newItemHasCustomTag(): boolean {
		return !!(this.newItem.tag && !this.isKnownCategory(this.newItem.tag));
	}

	/**
	 * Returns true when the tag-picker popover is editing an item that has a custom tag.
	 *
	 * @returns True when the active tag-edit session's item tag is a non-category string.
	 */
	protected get popoverItemHasCustomTag(): boolean {
		const tag = this.tagEditSession?.item?.tag;
		return !!(tag && !this.isKnownCategory(tag));
	}

	// ── time dropdown template helpers ───────────────────────────────────────

	/**
	 * Gets the filtered end-time options, excluding all values at or before the current
	 * start time. String comparison is valid here because all values are zero-padded "HH:mm".
	 *
	 * @returns The subset of REMINDER_END_TIME_OPTIONS whose value is strictly after editingStartTime.
	 */
	protected get filteredEndTimeOptions(): TimeOption[] {
		const startTime = this.editingStartTime;
		if (!startTime) return REMINDER_END_TIME_OPTIONS;
		return REMINDER_END_TIME_OPTIONS.filter((option) => option.value > startTime);
	}

	/**
	 * Returns true when the time dropdowns should be disabled. Time may only be set
	 * after a date is present in the current popover context.
	 *
	 * @returns True when no date is set in the current editing context.
	 */
	protected get isTimeInputDisabled(): boolean {
		return this.editingItem ? !this.editingItem.date : !this.newItem.date;
	}

	/**
	 * Gets the formatted time range label for an existing item's time chip.
	 *
	 * @param item - The ReminderItem whose time chip label is needed.
	 * @returns A "HH:mm – HH:mm" string, or empty string when no time is set.
	 */
	protected getTimeChipLabel(item: ReminderItem): string {
		return this.formatTimeRange(item.startTime, item.endTime);
	}

	/**
	 * Gets the formatted time range label for the new-item card time chip.
	 *
	 * @returns A "HH:mm – HH:mm" string, or empty string when no time is set.
	 */
	protected get newItemTimeLabel(): string {
		return this.formatTimeRange(this.newItem.startTime, this.newItem.endTime);
	}

	/**
	 * Formats a start and end time pair as a "HH:mm – HH:mm" display string.
	 *
	 * @param start - The start time in "HH:mm" format, or null when unset.
	 * @param end - The end time in "HH:mm" format, or null when unset.
	 * @returns A formatted range string, or empty string when either value is absent.
	 */
	private formatTimeRange(start: string | null | undefined, end: string | null | undefined): string {
		if (!start || !end) return '';
		return `${start} – ${end}`;
	}
}
