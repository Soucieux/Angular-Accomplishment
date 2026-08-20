import {
	AfterViewChecked,
	Component,
	ElementRef,
	HostListener,
	Inject,
	NgZone,
	OnDestroy,
	OnInit,
	PLATFORM_ID,
	ViewChild,
	ViewContainerRef
} from '@angular/core';
import { Table, TableModule, TablePageEvent } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { Utilities } from '../../common/utilities/app.utilities';
import { ClickOutsideDirective } from '../../common/click-outside/click-outside.directive';
import {
	COMPONENT_DESTROY,
	STATS_FIELD_TOTAL_PATCH_NOTES,
	TOAST_INFO,
	TOAST_WARN,
	SUCCESS,
	SEVERITY_DANGER,
	SEVERITY_SECONDARY,
	PATCH_SEVERITY_ICON_TODO,
	PATCH_SEVERITY_ICON_IN_PROGRESS,
	PATCH_SEVERITY_ICON_COMPLETED,
	PATCH_SEVERITY_ICON_DEBUG,
	PATCH_SEVERITY_ICON_DRAFT,
	PATCH_VIEW_PATCH,
	PATCH_VIEW_RELEASE,
	TIMEOUT_KEY_PATCH,
	TIMEOUT_KEY_PATCH_RELEASE
} from '../../common/constants';
import {
	STATUS_COMPLETED,
	STATUS_DEBUG,
	STATUS_DRAFT,
	STATUS_IN_PROGRESS,
	STATUS_RESOLVED,
	PATCH_CLASS_TAG_SUCCESS,
	PATCH_CLASS_HEATMAP_FUTURE,
	PATCH_CLASS_HEATMAP_INTENSITY_PREFIX,
	PATCH_CLASS_HEATMAP_HAS_DATA,
	STATUS_TODO,
	DIALOG_BTN_CONFIRM,
	DIALOG_BTN_DELETE,
	MSG_DELETING,
	PATCH_MSG_DELETE_CONFIRM,
	PATCH_LABEL_PATCH_NOTES,
	PATCH_LABEL_RELEASE_NOTES,
	PATCH_SUBTITLE_PATCH_NOTES,
	PATCH_SUBTITLE_RELEASE_NOTES,
	PATCH_SWITCH_PREFIX_SPRINT,
	PATCH_SWITCH_PREFIX_RELEASE,
	PATCH_SWITCH_NOTES,
	PATCH_EYEBROW,
	PATCH_PLACEHOLDER_SEARCH,
	PATCH_TABLE_HEADER_COMPONENT,
	PATCH_TABLE_HEADER_ELEMENT,
	PATCH_TABLE_HEADER_DETAILS,
	PATCH_TABLE_HEADER_TIMESTAMP,
	PATCH_EMPTY_SEARCH,
	PATCH_LABEL_PREVIOUS_RELEASES,
	PATCH_STAT_TOTAL,
	PATCH_STAT_BUGS_RESOLVED,
	PATCH_STAT_IN_PROGRESS,
	PATCH_STAT_OPEN_BUGS,
	PATCH_PAGINATION_TEMPLATE,
	PATCH_COL_STATUS,
	PATCH_BTN_CLEAR_FILTER,
	PATCH_DROPDOWN_ALL_PAGES,
	PATCH_DROPDOWN_ACCOUNT,
	PATCH_HEATMAP_TITLE,
	PATCH_HEATMAP_LEGEND_LESS,
	PATCH_HEATMAP_LEGEND_MORE,
	PATCH_HEATMAP_FOOTER_FUTURE,
	PATCH_HEATMAP_FOOTER_ITEMS,
	PATCH_HEATMAP_FOOTER_YEARS,
	MONTH_NAMES_SHORT,
	BTN_ADD,
	LABEL_EDIT,
	NAV_LABEL_HOME,
	NAV_LABEL_TODAY,
	NAV_LABEL_PORTAL,
	NAV_LABEL_RESONANCE,
	NAV_LABEL_RECIPES,
	NAV_LABEL_ENTERTAINMENT,
	NAV_LABEL_REMINDER,
	NAV_LABEL_DEBT_SONATA,
	NAV_LABEL_PATCH_NOTES,
	NAV_LABEL_ABOUT,
	NAV_LABEL_VAULT,
	NAV_LABEL_SIGN_IN
} from '../../common/locale/locale-strings';
import {
	PATCH_HEATMAP_MONTH_INDICES,
	PATCH_ROW_ENTRANCE_MAX_DELAY_MS,
	PATCH_ROW_ENTRANCE_STEP_MS,
	PatchNote,
	PatchNoteEditState,
	ReleaseNote
} from './patch.model';
import { Observable, catchError, firstValueFrom, of, startWith, tap } from 'rxjs';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LOG } from '../../common/app.logs';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { TimeoutService } from '../../common/timeout/timeout.service';
import { PaginatorModule } from 'primeng/paginator';
import { DatabaseService } from '../../backend/database-service/database.service';
import { AnonymousSessionService } from '../../backend/anonymous-session-service/anonymous-session.service';

@Component({
	selector: 'patch',
	imports: [
		TableModule,
		SkeletonModule,
		Tag,
		InputText,
		Button,
		Select,
		FormsModule,
		CommonModule,
		PaginatorModule,
		ClickOutsideDirective
	],
	templateUrl: './patch.component.html',
	styleUrls: ['../../common/glass-card.css', './patch.component.css']
})
export class PatchComponent implements OnInit, OnDestroy, AfterViewChecked {
	private readonly className = 'PatchComponent';
	@ViewChild('t') private table!: Table; // This is the reference for the table in html
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	@ViewChild('heatmapPopover') set heatmapPopover(ref: ElementRef<HTMLElement> | undefined) {
		if (ref) Utilities.attachScrollAutoHide(ref.nativeElement);
	}

	protected readonly Utilities = Utilities;
	protected readonly PATCH_VIEW_PATCH = PATCH_VIEW_PATCH;
	protected readonly PATCH_VIEW_RELEASE = PATCH_VIEW_RELEASE;
	protected readonly PATCH_SWITCH_PREFIX_SPRINT = PATCH_SWITCH_PREFIX_SPRINT;
	protected readonly PATCH_SWITCH_PREFIX_RELEASE = PATCH_SWITCH_PREFIX_RELEASE;
	protected readonly PATCH_SWITCH_NOTES = PATCH_SWITCH_NOTES;
	protected readonly PATCH_LABEL_PATCH_NOTES = PATCH_LABEL_PATCH_NOTES;
	protected readonly PATCH_LABEL_RELEASE_NOTES = PATCH_LABEL_RELEASE_NOTES;
	protected readonly PATCH_SUBTITLE_PATCH_NOTES = PATCH_SUBTITLE_PATCH_NOTES;
	protected readonly PATCH_SUBTITLE_RELEASE_NOTES = PATCH_SUBTITLE_RELEASE_NOTES;
	protected readonly PATCH_EYEBROW = PATCH_EYEBROW;
	protected readonly PATCH_PLACEHOLDER_SEARCH = PATCH_PLACEHOLDER_SEARCH;
	protected readonly PATCH_TABLE_HEADER_COMPONENT = PATCH_TABLE_HEADER_COMPONENT;
	protected readonly PATCH_TABLE_HEADER_ELEMENT = PATCH_TABLE_HEADER_ELEMENT;
	protected readonly PATCH_TABLE_HEADER_DETAILS = PATCH_TABLE_HEADER_DETAILS;
	protected readonly PATCH_TABLE_HEADER_TIMESTAMP = PATCH_TABLE_HEADER_TIMESTAMP;
	protected readonly LABEL_EDIT = LABEL_EDIT;
	protected readonly PATCH_EMPTY_SEARCH = PATCH_EMPTY_SEARCH;
	protected readonly PATCH_LABEL_PREVIOUS_RELEASES = PATCH_LABEL_PREVIOUS_RELEASES;
	protected readonly PATCH_STAT_TOTAL = PATCH_STAT_TOTAL;
	protected readonly PATCH_STAT_BUGS_RESOLVED = PATCH_STAT_BUGS_RESOLVED;
	protected readonly PATCH_STAT_IN_PROGRESS = PATCH_STAT_IN_PROGRESS;
	protected readonly PATCH_STAT_OPEN_BUGS = PATCH_STAT_OPEN_BUGS;
	protected readonly PATCH_PAGINATION_TEMPLATE = PATCH_PAGINATION_TEMPLATE;
	protected readonly PATCH_COL_STATUS = PATCH_COL_STATUS;
	protected readonly PATCH_BTN_CLEAR_FILTER = PATCH_BTN_CLEAR_FILTER;
	protected readonly BTN_ADD = BTN_ADD;
	protected readonly MONTH_NAMES_SHORT = MONTH_NAMES_SHORT;
	protected readonly PATCH_HEATMAP_MONTH_INDICES = PATCH_HEATMAP_MONTH_INDICES;
	protected readonly PATCH_HEATMAP_TITLE = PATCH_HEATMAP_TITLE;
	protected readonly PATCH_HEATMAP_LEGEND_LESS = PATCH_HEATMAP_LEGEND_LESS;
	protected readonly PATCH_HEATMAP_LEGEND_MORE = PATCH_HEATMAP_LEGEND_MORE;
	protected readonly PATCH_HEATMAP_FOOTER_FUTURE = PATCH_HEATMAP_FOOTER_FUTURE;
	protected readonly PATCH_HEATMAP_FOOTER_ITEMS = PATCH_HEATMAP_FOOTER_ITEMS;
	protected readonly PATCH_HEATMAP_FOOTER_YEARS = PATCH_HEATMAP_FOOTER_YEARS;
	protected currentView: 'patch' | 'release' = PATCH_VIEW_PATCH;
	protected releaseNotes$!: Observable<ReleaseNote[] | null>;
	private releaseNotesLoaded = false;
	/** Version of the previous-release row currently expanded to show its full section lists, or null when none is. */
	private expandedReleaseVersion: string | null = null;
	/**
	 * All available components that can be selected in the add-entry dropdown.
	 *
	 * `icon` holds the ligature name used as text content for Material Icons /
	 * Material Symbols (e.g. `'tv'`, `'home'`). PrimeIcons render purely via
	 * CSS pseudo-elements and require no text content, so their `icon` value is
	 * intentionally an empty string — the full icon definition lives in
	 * `iconClass` (e.g. `'pi pi-user'`).
	 * `colorClass` maps to a CSS gradient rule that matches the nav panel icon colour.
	 */
	protected readonly components: { key: string; label: string; icon: string; iconClass: string; colorClass: string }[] =
		[
			{
				key: 'All Pages',
				label: PATCH_DROPDOWN_ALL_PAGES,
				icon: 'grid_view',
				iconClass: 'material-symbols-outlined',
				colorClass: 'icon-all-pages'
			},
			{
				key: 'Home',
				label: NAV_LABEL_HOME,
				icon: 'home_app_logo',
				iconClass: 'material-symbols-outlined',
				colorClass: 'icon-home'
			},
			{
				key: 'Vault',
				label: NAV_LABEL_VAULT,
				icon: 'hub',
				iconClass: 'material-symbols-outlined',
				colorClass: 'icon-vault'
			},
			{
				key: 'Today',
				label: NAV_LABEL_TODAY,
				icon: 'calendar_today',
				iconClass: 'material-symbols-outlined',
				colorClass: 'icon-today'
			},
			{
				key: 'Portal',
				label: NAV_LABEL_PORTAL,
				icon: 'travel_explore',
				iconClass: 'material-symbols-outlined',
				colorClass: 'icon-portal'
			},
			{
				key: 'Reminder',
				label: NAV_LABEL_REMINDER,
				icon: 'alarm',
				iconClass: 'material-symbols-outlined',
				colorClass: 'icon-reminder'
			},
			{
				key: 'Debt Sonata',
				label: NAV_LABEL_DEBT_SONATA,
				icon: 'account_balance',
				iconClass: 'material-symbols-outlined',
				colorClass: 'icon-debt'
			},
			{
				key: 'Recipe',
				label: NAV_LABEL_RECIPES,
				icon: 'menu_book',
				iconClass: 'material-symbols-outlined',
				colorClass: 'icon-recipe'
			},
			{
				key: 'Entertainment',
				label: NAV_LABEL_ENTERTAINMENT,
				icon: 'live_tv',
				iconClass: 'material-symbols-outlined',
				colorClass: 'icon-entertainment'
			},
			{
				key: 'Resonance',
				label: NAV_LABEL_RESONANCE,
				icon: 'format_quote',
				iconClass: 'material-symbols-outlined',
				colorClass: 'icon-resonance'
			},
			{
				key: 'Patch Notes',
				label: NAV_LABEL_PATCH_NOTES,
				icon: 'note_stack',
				iconClass: 'material-symbols-outlined',
				colorClass: 'icon-patch-notes'
			},
			{
				key: 'About',
				label: NAV_LABEL_ABOUT,
				icon: 'badge',
				iconClass: 'material-symbols-outlined',
				colorClass: 'icon-about'
			},
			{ key: 'Login', label: NAV_LABEL_SIGN_IN, icon: '', iconClass: 'pi pi-user', colorClass: 'icon-login' }, // pi icon — CSS only, no ligature text
			{
				key: 'Account',
				label: PATCH_DROPDOWN_ACCOUNT,
				icon: 'manage_accounts',
				iconClass: 'material-symbols-outlined',
				colorClass: 'icon-account'
			}
		];
	protected loading = true;
	protected severity: { severity: string }[] | undefined;
	protected bugSeverity: { severity: string }[] | undefined;
	protected allSeverity: { severity: string }[] | undefined;
	protected patchNotes$!: Observable<PatchNote[]>;
	protected indexOfFirstItem = 0;
	protected itemsPerPage = 8;
	protected isNarrowViewport!: boolean;
	protected skeletonRows = Array.from({ length: this.itemsPerPage });
	protected editedRows = new Map<string, PatchNoteEditState>();
	protected hoveredRowIndex: number | null = null;
	private previousDataLength: number | null = null;
	/**
	 * Full ordered list of patch notes (no dummy row), kept in sync by the subscription tap.
	 * any: Patch note records are schema-less CloudBase documents with no fixed TypeScript type
	 */
	private patchNotesList: PatchNote[] = [];
	/**
	 * The page (first-item index) the user intends to be on.
	 * Updated by user navigation and add/delete logic.
	 */
	private savedFirst = 0;
	/**
	 * Set to true inside the tap whenever CloudBase pushes fresh data.
	 * onTableFilter() checks this to distinguish a data-driven _filter() reset
	 * (where we must restore the page) from a user-initiated filter interaction
	 * (where PrimeNG's default page-1 reset is the correct behaviour).
	 */
	private isDataUpdate = false;
	protected newRecord = this.emptyRecord();
	protected searchQuery = '';
	protected isHeatmapOpen = false;
	private _heatmapData: Map<number, number[]> = new Map();
	private _heatmapYears: number[] = [];
	private heatmapCloseTimer: ReturnType<typeof setTimeout> | null = null;
	/* True only when this component opened the anonymous session, so teardown never signs out a
	   named user who arrived here with a session of their own. */
	private signedInAnonymously = false;

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		private databaseService: DatabaseService,
		private anonymousSessionService: AnonymousSessionService,
		private dialogService: DialogService,
		private timeoutService: TimeoutService,
		protected utilities: Utilities,
		private ngZone: NgZone
	) {}

	/**
	 * Attaches the auto-hide scroll listener to the page container after each view check.
	 */
	ngAfterViewChecked(): void {
		if (isPlatformBrowser(this.platformId)) {
			document
				.querySelectorAll<HTMLElement>('.container-patch')
				.forEach((el) => Utilities.attachScrollAutoHide(el));
		}
	}

	/**
	 * Initialises the component: detects mobile layout, builds the patch-notes
	 * observable, populates the severity option lists, and sets up the subscription
	 * tap that keeps `patchNotesList` and page-index state.
	 */
	async ngOnInit() {
		if (isPlatformBrowser(this.platformId)) {

			// Step 1: Detect layout and arm the loading-timeout watchdog
			this.isNarrowViewport = this.utilities.isNarrowViewport();
			this.timeoutService.start(TIMEOUT_KEY_PATCH, () => this.onLoadingTimeout());

			/* Step 1.1: Patch Notes is public, so a visitor may arrive with no session at all. Start the
			   anonymous sign-in without awaiting it: every watch already waits on authReady$, so the
			   observables below can be built now and connect the moment credentials land. Awaiting here
			   would stall their construction entirely if the SDK call never settles. */
			this.anonymousSessionService
				.openIfNeeded()
				.then((wasOpenedHere) => (this.signedInAnonymously = wasOpenedHere))
				.catch(() => {});

			/* Step 2: Build the release-notes observable with lazy-load semantics.
			   startWith(null) lets the template distinguish "not yet arrived" from
			   an empty array, so the skeleton is shown until the first emission. */
			this.releaseNotes$ = this.databaseService.getReleaseNotes().pipe(
				startWith(null as ReleaseNote[] | null),
				tap((data) => {
					if (data !== null) {
						this.releaseNotesLoaded = true;
						this.timeoutService.clear(TIMEOUT_KEY_PATCH_RELEASE);
					}
				}),
				catchError(() => {
					this.releaseNotesLoaded = true;
					this.timeoutService.clear(TIMEOUT_KEY_PATCH_RELEASE);
					return of([] as ReleaseNote[]);
				})
			);

			/* Step 3: Build the patch-notes observable with a tap that manages pagination
			   state on every CloudBase push. The tap runs inside ngZone.run() because
			   CloudBase callbacks arrive outside the Angular zone and would otherwise
			   not trigger change detection. */
			const getObservable$ = this.databaseService.getPatchNotes();
			this.patchNotes$ = getObservable$.pipe(
				tap((data) => {
					this.ngZone.run(() => {
						this.timeoutService.clear(TIMEOUT_KEY_PATCH);
						this.loading = false;
						const prevLength = this.previousDataLength;
						this.previousDataLength = data.length;

						/* 1. Determine the "Source of Truth" for the page index
						   On first load (prevLength === null): if navigated via "Log Bug",
						   jump straight to the last page using the same formula as new-entry logic. */
						if (prevLength === null && history.state?.goToLastPage) {
							history.replaceState({}, '');
							this.savedFirst = Math.max(
								0,
								Math.floor((data.length - 1) / this.itemsPerPage) * this.itemsPerPage
							);
						} else if (prevLength !== null && data.length > prevLength) {
							this.savedFirst = Math.max(
								0,
								Math.floor((data.length - 1) / this.itemsPerPage) * this.itemsPerPage
							);
						} else if (
							prevLength !== null &&
							data.length < prevLength &&
							this.savedFirst >= data.length &&
							this.savedFirst > 0
						) {
							this.savedFirst = Math.max(0, this.savedFirst - this.itemsPerPage);
						}

						/* 2. Arm the "Firewall"
						   This tells onTableFilter that the next page-reset is data-driven
						   and should be ignored/overridden. */
						this.isDataUpdate = true;

						// 3. Keep a local ordered copy for look-ups in edit/delete stats writes.
						this.patchNotesList = data;
						this.rebuildHeatmapData();

						/* 4. On first load, heal the denormalised totalPatchNotes statistic.
						   The Home dashboard satellite reads totalPatchNotes directly, so any
						   out-of-band insert (e.g. the seeding script) leaves it stale. */
						if (prevLength === null) {
							this.reconcilePatchNotesTotal(this.patchNotesList.length).catch(() => {});
						}
					});
				})
			);
		}

		// Step 4: Populate the severity option lists used by the status dropdowns
		this.severity = [
			{ severity: STATUS_TODO },
			{ severity: STATUS_IN_PROGRESS },
			{ severity: STATUS_COMPLETED },
			{ severity: STATUS_DRAFT }
		];

		this.bugSeverity = [{ severity: STATUS_DEBUG }, { severity: STATUS_RESOLVED }];

		this.allSeverity = [...this.severity, ...this.bugSeverity];
	}

	/**
	 * Updates the isNarrowViewport flag when the window is resized.
	 */
	@HostListener('window:resize')
	protected onResize() {
		if (isPlatformBrowser(this.platformId)) {
			this.isNarrowViewport = this.utilities.isNarrowViewport();
		}
	}

	/**
	 * Clears any open dialog from the view container and logs the component
	 * destruction event. The async pipe on `patchNotes$` tears down the
	 * CloudBase watcher automatically when the view is destroyed.
	 */
	ngOnDestroy() {
		this.timeoutService.clear(TIMEOUT_KEY_PATCH);
		this.timeoutService.clear(TIMEOUT_KEY_PATCH_RELEASE);

		// Releases the anonymous session only if this component opened it (see AnonymousSessionService).
		this.anonymousSessionService.release(this.signedInAnonymously).catch(() => {});
		this.dialogComponentContainer?.clear();
		if (this.heatmapCloseTimer !== null) clearTimeout(this.heatmapCloseTimer);
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	// ── User action handlers ─────────────────────────────────────────────────

	/**
	 * Switches the active view between Patch Notes and Release Notes.
	 * Cancels the outgoing tab's timer and starts the incoming tab's timer
	 * if that tab is still in a loading state.
	 *
	 * @param view - The view identifier to activate.
	 */
	protected selectView(view: 'patch' | 'release'): void {
		if (view === this.currentView) return;

		// Step 1: Cancel the outgoing tab's timer before switching views
		if (this.currentView === PATCH_VIEW_PATCH) {
			this.timeoutService.clear(TIMEOUT_KEY_PATCH);
		} else {
			this.timeoutService.clear(TIMEOUT_KEY_PATCH_RELEASE);
		}

		// Step 2: Activate the new view
		this.currentView = view;

		/*
		 * Step 3: Start the incoming tab's timer only if that tab is still loading.
		 * Each view tracks its own loaded flag independently — release notes are
		 * lazy-fetched so they may still be pending when the user first switches to them.
		 */
		if (view === PATCH_VIEW_PATCH && this.loading) {
			this.timeoutService.start(TIMEOUT_KEY_PATCH, () => this.onLoadingTimeout());
		} else if (view === PATCH_VIEW_RELEASE && !this.releaseNotesLoaded) {
			this.timeoutService.start(TIMEOUT_KEY_PATCH_RELEASE, () => this.onLoadingTimeout());
		}
	}

	/**
	 * Toggles inline expansion of a previous-release row to reveal its full section lists.
	 * Collapses the row instead when it is already the one expanded.
	 *
	 * @param version - The version of the previous-release row being toggled.
	 */
	protected toggleReleaseExpand(version: string): void {
		this.expandedReleaseVersion = this.expandedReleaseVersion === version ? null : version;
	}

	/**
	 * Saves a snapshot of the original row data and begins editing the row.
	 *
	 * @param row - The row to start editing.
	 */
	protected startEdit(row: PatchNote) {
		if (!this.dialogService.ensurePermission(this.dialogComponentContainer, row._openid ?? '')) return;
		this.editedRows.set(row.key, { original: { ...row }, updated: { ...row } });
	}

	/**
	 * Compares the edited row against its snapshot and persists any changes
	 * to the database, then removes the row from the editing state.
	 *
	 * @param row - The row to complete editing.
	 */
	protected async completeEdit(row: PatchNote) {
		const record = this.editedRows.get(row.key);
		if (!record) return;

		// Step 1: Diff the snapshot against the edited state to find what actually changed
		const changes: Partial<PatchNote> = {};

		if (record.original.details !== record.updated.details.trim()) {
			changes.details = record.updated.details.trim();
		}
		if (record.original.status !== record.updated.status) {
			changes.status = record.updated.status;
		}

		/* Step 2: Persist only if something changed.
		   status and details route to separate database methods because each one
		   triggers a different activity-log entry — they must not be combined. */
		if (Object.keys(changes).length > 0) {
			changes.timestamp = Utilities.getCurrentFormattedTime(true);
			try {
				const noteIndex = this.patchNotesList.findIndex((note) => note.key === row.key) + 1;
				if (changes.status) {
					await this.databaseService.updateStatusForOnePatchNote(
						row.key,
						changes,
						row.component,
						row.element,
						noteIndex
					);
				} else if (changes.details) {
					await this.databaseService.updateDetailsForOnePatchNote(
						row.key,
						changes,
						row.component,
						row.element,
						noteIndex
					);
				}
			} catch (error) {
				this.dialogService.handleError(this.dialogComponentContainer, error);
				return;
			}
		}

		// Step 3: Remove from editing state regardless of whether a write occurred
		this.editedRows.delete(row.key);
	}

	/**
	 * Submits the new record form data to the database and resets the form.
	 * Captures a snapshot of the record before resetting so the stats update
	 * can include the correct noteIndex and metadata after the async add.
	 */
	protected submitNewRecord(): void {
		// Guard: Enter on the inputs bypasses the button's [disabled], so re-check every required
		// field here; an incomplete record must never reach the database, and the synchronous form
		// reset below means a repeat Enter lands on an empty form and is rejected here too.
		if (
			!this.newRecord.component.trim() ||
			!this.newRecord.details.trim() ||
			!this.newRecord.element.trim() ||
			!this.newRecord.status
		) {
			return;
		}

		// Step 1: Stamp the record with time and derive the isBug flag from the chosen status
		this.newRecord.timestamp = Utilities.getCurrentFormattedTime(true);
		this.newRecord.isBug =
			this.newRecord.status === STATUS_DEBUG || this.newRecord.status === STATUS_RESOLVED;

		/* Step 2: Snapshot the record before resetting the form.
		   noteIndex is calculated here because patchNotesList.length may have changed
		   by the time the async add resolves and the stats write fires. */
		const noteIndex = this.patchNotesList.length + 1;
		const snapshot = { ...this.newRecord, noteIndex };

		/* Step 3: Fire-and-forget add; update the running total on success.
		   The form is reset immediately — the UI does not wait for the write — so
		   the user can continue adding entries without blocking. */
		this.databaseService
			.addNewRecordToPatchNotes(snapshot)
			.then(() => {
				this.databaseService
					.updateStatisticsFields({ [STATS_FIELD_TOTAL_PATCH_NOTES]: noteIndex })
					.catch(() => {});
			})
			.catch(() => this.dialogService.showUnexpectedError(this.dialogComponentContainer));
		this.newRecord = this.emptyRecord();
	}

	/**
	 * Opens a confirmation dialog before removing the given patch note.
	 *
	 * @param key - The key of the patch note to remove.
	 */
	protected openDeleteConfirmationDialog(key: string) {

		/* Step 1: Capture note identity and the projected total before the dialog opens.
		   The CloudBase watcher may push updated data before the user confirms, making
		   patchNotesList.length unreliable inside the async callback. */
		const noteToDelete = this.patchNotesList.find((note) => note.key === key);
		const noteIndex = this.patchNotesList.findIndex((note) => note.key === key) + 1;
		const newTotal = this.patchNotesList.length - 1;

		/* Step 2: Open the confirmation dialog; the delete runs behind the blocking overlay
		   so a repeat click cannot fire a duplicate database call. */
		this.dialogService.confirmThenBlock(
			this.dialogComponentContainer,
			[PATCH_MSG_DELETE_CONFIRM, DIALOG_BTN_CONFIRM, DIALOG_BTN_DELETE],
			MSG_DELETING,
			async () => {
				try {
					await this.databaseService.removePatchNote(
						key,
						noteToDelete?.component ?? '',
						noteToDelete?.element ?? '',
						noteIndex
					);
					this.databaseService
						.updateStatisticsFields({ [STATS_FIELD_TOTAL_PATCH_NOTES]: newTotal })
						.catch(() => {});
				} catch (error: unknown) {
					this.dialogService.showUnexpectedError(this.dialogComponentContainer);
					throw error;
				}
			}
		);
	}

	/**
	 * Updates the saved page index when the user manually navigates to a new page.
	 * This is the only place where savedFirst is updated via UI interaction — it
	 * records the new page as the "Safe Zone" to restore during background data updates.
	 *
	 * @param event - The PrimeNG paginator event containing the new first-item index.
	 */
	protected pageChange(event: TablePageEvent) {
		this.savedFirst = event.first;
		this.indexOfFirstItem = event.first;
	}

	/**
	 * Intercepts PrimeNG's internal filter reset to restore the saved page index
	 * when a data-driven update arrives via CloudBase.
	 *
	 * WHY THIS EXISTS
	 * ───────────────
	 * When data is pushed via CloudBase, PrimeNG triggers _filter(). Even with no
	 * active user filters, it resets internal 'first' to 0.
	 * If isDataUpdate is true, it immediately overwrites the table's 'first'
	 * property with our savedFirst value before the function returns. This
	 * prevents the UI from ever rendering Page 1, eliminating the "flicker"
	 * or "clip" entirely.
	 */
	protected onTableFilter() {
		if (!this.isDataUpdate) return;

		// Force the table instance AND the local index to match our source of truth
		if (this.table) {
			this.table.first = this.savedFirst;
			this.indexOfFirstItem = this.savedFirst;
		}

		// Reset the flag so manual user filtering works as intended
		this.isDataUpdate = false;
	}

	/**
	 * Opens the activity heatmap popover and cancels any pending close timer.
	 */
	protected openHeatmap(): void {
		this.cancelHeatmapClose();
		this.isHeatmapOpen = true;
	}

	/**
	 * Schedules the heatmap popover to close after a short delay, allowing the
	 * cursor to move between the trigger chip and the popover body without flickering.
	 */
	protected scheduleHeatmapClose(): void {
		this.heatmapCloseTimer = setTimeout(() => {
			this.isHeatmapOpen = false;
			this.heatmapCloseTimer = null;
		}, 130);
	}

	/**
	 * Cancels a scheduled heatmap close, keeping the popover open when the
	 * cursor re-enters the popover body from the trigger chip.
	 */
	protected cancelHeatmapClose(): void {
		if (this.heatmapCloseTimer !== null) {
			clearTimeout(this.heatmapCloseTimer);
			this.heatmapCloseTimer = null;
		}
	}

	/**
	 * Toggles the activity heatmap popover open or closed on tap. Touch devices never
	 * fire mouseenter/mouseleave, so hover alone cannot open the popover there; on
	 * pointer devices hover already handles it, so this no-ops to avoid closing a
	 * popover the same click just opened via hover.
	 *
	 * @param event - The click event from the total-count stat chip.
	 */
	protected onHeatmapChipClick(event: Event): void {
		if (!this.utilities.isMobile()) return;
		event.stopPropagation();
		this.cancelHeatmapClose();
		this.isHeatmapOpen = !this.isHeatmapOpen;
	}

	/**
	 * Closes the activity heatmap popover when a touch device taps outside it, via the shared
	 * ClickOutsideDirective — the mouseleave-based close used on pointer devices never fires on touch.
	 */
	protected onHeatmapClickOutside(): void {
		if (!this.isHeatmapOpen) return;
		this.isHeatmapOpen = false;
	}

	// ── Internal data and private helpers ────────────────────────────────────

	/**
	 * Delegates to DialogService to show the loading-timeout retry dialog,
	 * using this component's dialog container. Used as the timeout callback
	 * for both patch-notes and release-notes timers.
	 */
	private onLoadingTimeout(): void {
		this.dialogService.showLoadingTimeout(this.dialogComponentContainer);
	}

	/**
	 * Gets a blank patch-note record used both for field initialisation
	 * and to reset the form after a successful submission.
	 *
	 * @returns A zeroed-out patch note record object.
	 */
	private emptyRecord(): PatchNote {
		return {
			key: '',
			component: '',
			element: '',
			details: '',
			status: undefined,
			timestamp: '',
			isBug: false
		};
	}

	/**
	 * Reconciles the stored totalPatchNotes statistic with the true number of
	 * loaded patch notes. The Home dashboard satellite reads totalPatchNotes
	 * directly, so any insert made outside the add/delete flow (e.g. the seeding
	 * script) leaves the counter stale. Reading the real list length here and
	 * correcting only on drift keeps the dashboard count permanently honest.
	 *
	 * @param actualTotal - The true count of patch notes currently loaded.
	 * @returns A void promise settling once any required correction is written.
	 */
	private async reconcilePatchNotesTotal(actualTotal: number): Promise<void> {

		// Step 1: Fetch the current stored statistic as a one-shot value
		const stats = await firstValueFrom(this.databaseService.getStatistics());
		const storedTotal = stats?.[STATS_FIELD_TOTAL_PATCH_NOTES] ?? 0;

		/* Step 2: Write a correction only on drift — avoids a redundant database
		   write on every page load when the counter is already accurate. */
		if (storedTotal !== actualTotal) {
			await this.databaseService.updateStatisticsFields({
				[STATS_FIELD_TOTAL_PATCH_NOTES]: actualTotal
			});
		}
	}

	/**
	 * Rebuilds the year-to-monthly-counts map from the current patch notes list.
	 * Called whenever patchNotesList is updated by the CloudBase tap.
	 */
	private rebuildHeatmapData(): void {
		const data = new Map<number, number[]>();
		for (const note of this.patchNotesList) {
			const ts: string = note.timestamp ?? '';
			const year = parseInt(ts.substring(0, 4), 10);
			const month = parseInt(ts.substring(5, 7), 10) - 1;
			if (isNaN(year) || isNaN(month) || month < 0 || month > 11) continue;
			if (!data.has(year)) data.set(year, new Array(12).fill(0));
			data.get(year)![month]++;
		}
		this._heatmapData = data;
		this._heatmapYears = [...data.keys()].sort((a, b) => a - b);
	}

	/**
	 * Maps a patch note count to an intensity band (0–4) for heatmap cell colouring.
	 *
	 * @param count - The number of patch notes in a month.
	 * @returns The intensity band index (0 = none, 4 = highest).
	 */
	private getHeatmapIntensity(count: number): number {
		if (count === 0) return 0;
		if (count <= 4) return 1;
		if (count <= 9) return 2;
		if (count <= 14) return 3;
		return 4;
	}

	// ── Template helper methods ──────────────────────────────────────────────

	/**
	 * Calculates the rowspan for a component cell by counting consecutive rows
	 * that share the same component value.
	 *
	 * @param data - The table data array.
	 * @param rowIndex - The starting row index.
	 * @returns The number of consecutive rows with the same component.
	 */
	protected getComponentRowSpan(data: PatchNote[], rowIndex: number) {
		const currentComponent = data[rowIndex].component;
		let span = 1;

		for (let index = rowIndex + 1; index < data.length; index++) {
			if (data[index].component === currentComponent) {
				span++;
			} else {
				break;
			}
		}

		return span;
	}

	/**
	 * Calculates the rowspan for an element cell by counting consecutive rows
	 * that share the same element and component values.
	 *
	 * @param data - The table data array.
	 * @param rowIndex - The starting row index.
	 * @returns The number of consecutive rows with the same element.
	 */
	protected getElementRowSpan(data: PatchNote[], rowIndex: number) {
		const currentElement = data[rowIndex].element;
		const currentComponent = data[rowIndex].component;
		let span = 1;

		for (let index = rowIndex + 1; index < data.length; index++) {
			if (data[index].element === currentElement && data[index].component === currentComponent) span++;
			else break;
		}
		return span;
	}

	/**
	 * Determines whether to show the component column for a given row.
	 * Returns true for the first row of each new component group.
	 *
	 * @param data - The table data array.
	 * @param rowIndex - The row index to check.
	 * @returns true if the component column should be displayed.
	 */
	protected shouldShowComponent(data: PatchNote[], rowIndex: number) {
		if (rowIndex === 0 || rowIndex === this.indexOfFirstItem) return true;
		return data[rowIndex].component !== data[rowIndex - 1].component;
	}

	/**
	 * Determines whether to show the element column for a given row.
	 * Returns true for the first row of each new element group.
	 *
	 * @param data - The table data array.
	 * @param rowIndex - The row index to check.
	 * @returns true if the element column should be displayed.
	 */
	protected shouldShowElement(data: PatchNote[], rowIndex: number) {
		if (rowIndex === 0 || rowIndex === this.indexOfFirstItem) return true;
		return (
			data[rowIndex].element !== data[rowIndex - 1].element ||
			data[rowIndex].component !== data[rowIndex - 1].component
		);
	}

	/**
	 * Gets the currently rendered data array from a PrimeNG table data object,
	 * falling back from filtered value to raw value to an empty array.
	 *
	 * @param data - The PrimeNG table data object.
	 * @returns The rendered data array.
	 */
	protected getRenderedData(data: Table): PatchNote[] {
		return data.filteredValue ?? data.value ?? [];
	}

	/**
	 * Checks whether the given row belongs to the same component group as
	 * the currently hovered row.
	 *
	 * @param data - The table data array.
	 * @param rowIndex - The row index to check.
	 * @returns true if the row shares the same component as the hovered row.
	 */
	protected isInSameComponentGroup(data: PatchNote[], rowIndex: number): boolean {
		if (this.hoveredRowIndex === null) return false;
		return data[rowIndex]?.component === data[this.hoveredRowIndex]?.component;
	}

	/**
	 * Checks whether the given row belongs to the same element group as
	 * the currently hovered row (same component and same element).
	 *
	 * @param data - The table data array.
	 * @param rowIndex - The row index to check.
	 * @returns true if the row shares the same component and element as the hovered row.
	 */
	protected isInSameElementGroup(data: PatchNote[], rowIndex: number): boolean {
		if (this.hoveredRowIndex === null) return false;
		const thisRow = data[rowIndex];
		const hoveredRow = data[this.hoveredRowIndex];
		return thisRow?.component === hoveredRow?.component && thisRow?.element === hoveredRow?.element;
	}

	/**
	 * Gets the CSS class for a severity tag based on its status value.
	 *
	 * @param status - The status value.
	 * @returns The CSS class name for the severity tag.
	 */
	protected getSeverityClass(status: string) {
		switch (status) {
			case STATUS_RESOLVED:
				return PATCH_CLASS_TAG_SUCCESS;
			default:
				return '';
		}
	}

	/**
	 * Gets the PrimeNG severity level for a tag based on the patch note status.
	 *
	 * @param status - The patch note status.
	 * @returns The PrimeNG tag severity value.
	 */
	protected getSeverity(status: string) {
		switch (status) {
			case STATUS_TODO:
				return TOAST_INFO;
			case STATUS_IN_PROGRESS:
				return TOAST_WARN;
			case STATUS_COMPLETED:
			case STATUS_RESOLVED:
				return SUCCESS;
			case STATUS_DEBUG:
				return SEVERITY_DANGER;
			case STATUS_DRAFT:
				return SEVERITY_SECONDARY;
			default:
				return undefined;
		}
	}

	/**
	 * Gets the PrimeNG icon class for a tag based on the patch note status.
	 *
	 * @param status - The patch note status.
	 * @returns The PrimeNG icon CSS class.
	 */
	protected getSeverityIcon(status: string) {
		switch (status) {
			case STATUS_TODO:
				return PATCH_SEVERITY_ICON_TODO;
			case STATUS_IN_PROGRESS:
				return PATCH_SEVERITY_ICON_IN_PROGRESS;
			case STATUS_COMPLETED:
			case STATUS_RESOLVED:
				return PATCH_SEVERITY_ICON_COMPLETED;
			case STATUS_DEBUG:
				return PATCH_SEVERITY_ICON_DEBUG;
			case STATUS_DRAFT:
				return PATCH_SEVERITY_ICON_DRAFT;
			default:
				return undefined;
		}
	}

	/**
	 * Gets the total number of patch notes currently loaded.
	 *
	 * @returns The count of patch-note records.
	 */
	protected get statsTotal(): number {
		return this.patchNotesList.length;
	}

	/**
	 * Gets the number of patch notes currently in the In Progress status.
	 *
	 * @returns The count of in-progress records.
	 */
	protected get statsInProgress(): number {
		return this.patchNotesList.filter((note) => note.status === STATUS_IN_PROGRESS).length;
	}

	/**
	 * Gets the number of patch notes currently in the Debug (open bug) status.
	 *
	 * @returns The count of open bug records.
	 */
	protected get statsOpenBugs(): number {
		return this.patchNotesList.filter((note) => note.status === STATUS_DEBUG).length;
	}

	/**
	 * Gets the number of bug entries that have been resolved.
	 *
	 * @returns The count of resolved bug records.
	 */
	protected get statsResolved(): number {
		return this.patchNotesList.filter((note) => note.status === STATUS_RESOLVED).length;
	}

	/**
	 * Looks up a component option object by label string.
	 *
	 * Accepts both a plain string and a full option object because PrimeNG's
	 * `p-select` passes the full option object into the `#selectedItem` template
	 * even when `optionValue="label"` is set (the binding affects the `ngModel`
	 * value, not what the template slot receives).
	 *
	 * @param value - The component key string (stored in DB), or a full option object
	 *   with a `key` property (e.g. from the PrimeNG selectedItem template context).
	 * @returns The matching option object, or `null` if not found.
	 */
	protected getComponentOption(value: string | { key: string }) {
		const key = typeof value === 'string' ? value : (value?.key ?? '');
		return this.components.find((option) => option.key === key) ?? null;
	}

	/**
	 * Gets the sorted list of years that appear in the heatmap data.
	 *
	 * @returns The year numbers in ascending order.
	 */
	protected get heatmapYears(): number[] {
		return this._heatmapYears;
	}

	/**
	 * Gets the total number of distinct years in the heatmap data.
	 *
	 * @returns The year count.
	 */
	protected get heatmapYearCount(): number {
		return this._heatmapYears.length;
	}

	/**
	 * Gets the patch note count for a specific year and month from the heatmap data.
	 *
	 * @param year - The calendar year.
	 * @param monthIdx - The zero-based month index.
	 * @returns The count of patch notes in that month, or 0 if none.
	 */
	protected getHeatmapCount(year: number, monthIdx: number): number {
		return this._heatmapData.get(year)?.[monthIdx] ?? 0;
	}

	/**
	 * Returns true when the given year and month falls on or after the current month.
	 *
	 * @param year - The calendar year to check.
	 * @param monthIdx - The zero-based month index to check.
	 * @returns true if the month is in the future relative to today.
	 */
	protected isHeatmapFuture(year: number, monthIdx: number): boolean {
		const now = new Date();
		return year > now.getFullYear() || (year === now.getFullYear() && monthIdx > now.getMonth());
	}

	/**
	 * Gets the combined CSS class string for a heatmap cell based on its data value
	 * and whether it falls in the future.
	 *
	 * @param year - The calendar year of the cell.
	 * @param monthIdx - The zero-based month index of the cell.
	 * @returns The CSS class string to apply (e.g. 'future', 'intensity-0', 'intensity-2 has-data').
	 */
	protected getHeatmapCellClass(year: number, monthIdx: number): string {
		if (this.isHeatmapFuture(year, monthIdx)) return PATCH_CLASS_HEATMAP_FUTURE;
		const count = this.getHeatmapCount(year, monthIdx);
		const band = this.getHeatmapIntensity(count);
		return count > 0
			? `${PATCH_CLASS_HEATMAP_INTENSITY_PREFIX}${band} ${PATCH_CLASS_HEATMAP_HAS_DATA}`
			: `${PATCH_CLASS_HEATMAP_INTENSITY_PREFIX}0`;
	}

	/**
	 * Gets the active edit snapshot for a row. Only called from template blocks that are
	 * rendered while the row is being edited, so the entry is guaranteed to exist.
	 *
	 * @param key - The document key of the row being edited.
	 * @returns The original and updated snapshot pair for the row.
	 */
	protected getEditState(key: string): PatchNoteEditState {
		return this.editedRows.get(key)!;
	}

	/**
	 * Gets the staggered entrance-animation delay for a table row or release-list row,
	 * capped so a full page of rows doesn't leave the last ones waiting too long to appear.
	 *
	 * @param index - The zero-based row position on the current page.
	 * @returns The animation delay in milliseconds.
	 */
	protected getRowEntranceDelay(index: number): number {
		return Math.min(PATCH_ROW_ENTRANCE_MAX_DELAY_MS, index * PATCH_ROW_ENTRANCE_STEP_MS);
	}

	/**
	 * Returns true when the given previous-release version is the one currently expanded.
	 *
	 * @param version - The version of the previous-release row being checked.
	 * @returns True when that row's full section lists are shown.
	 */
	protected isReleaseExpanded(version: string): boolean {
		return this.expandedReleaseVersion === version;
	}
}
