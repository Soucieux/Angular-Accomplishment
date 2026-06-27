import {
	AfterViewChecked,
	ChangeDetectionStrategy,
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
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Subscription } from 'rxjs';
import { DatabaseService } from '../../backend/database-service/database.service';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { LOG } from '../../common/app.logs';
import { Utilities } from '../../common/utilities/app.utilities';
import { SessionExpiredError } from '../../common/error/session-expired.error';
import {
	COMPONENT_DESTROY,
	DATABASE_DATE_CALCULATOR,
	DIALOG_BLOCK,
	DIALOG_CONFIRM,
	PORTAL_CATEGORY_ALL,
	PORTAL_LABEL_CONFIRMED,
	DIALOG_CATEGORY,
	DIALOG_LINK,
	DIALOG_MULTI_LINK,
	SUCCESS,
	TOAST_ERROR,
	TOAST_INFO
} from '../../common/constants';
import {
	DIALOG_BTN_CONFIRM,
	DIALOG_BTN_DELETE,
	MSG_DELETE_FAILED,
	MSG_SAVE_FAILED,
	PORTAL_DIALOG_RESET_BTN,
	PORTAL_LABEL_CELL_CONFIRM,
	PORTAL_LABEL_CELL_DONE,
	PORTAL_LABEL_CELL_TODAY,
	PORTAL_LABEL_CURRENT_MONTH,
	PORTAL_LABEL_NEXT_MONTH,
	PORTAL_LABEL_RESET,
	PORTAL_MSG_RESET_CONFIRM,
	PORTAL_MSG_CATEGORY_ADDED,
	PORTAL_MSG_CATEGORY_DELETE_FAILED_DETAIL,
	PORTAL_MSG_CATEGORY_DELETED,
	PORTAL_MSG_CATEGORY_SAVE_FAILED_DETAIL,
	PORTAL_MSG_CATEGORY_UPDATED,
	PORTAL_MSG_DELETE_CATEGORY_CONFIRM_PREFIX,
	PORTAL_MSG_DELETE_CATEGORY_CONFIRM_SUFFIX,
	PORTAL_MSG_DELETE_CATEGORY_TITLE,
	PORTAL_MSG_DELETE_LINK_CONFIRM_PREFIX,
	PORTAL_MSG_DELETE_LINK_CONFIRM_SUFFIX,
	PORTAL_MSG_DELETE_LINK_TITLE,
	PORTAL_MSG_LINK_DELETE_FAILED_DETAIL,
	PORTAL_MSG_LINK_DELETED,
	PORTAL_MSG_LINK_SAVE_FAILED_DETAIL,
	PORTAL_MSG_LINK_SAVED,
	PORTAL_MSG_LINK_UPDATED,
	PORTAL_MSG_LOAD_CATEGORIES_FAILED,
	PORTAL_MSG_LOAD_LINKS_FAILED,
	PORTAL_MSG_SAVE_CATEGORY_FAILED,
	PORTAL_MSG_SAVE_LINK_FAILED,
	PORTAL_MSG_SAVING_CATEGORY,
	PORTAL_MSG_SAVING_LINK,
	PORTAL_MSG_MULTI_LINK_SAVED,
	PORTAL_MSG_SAVING_LINKS,
	PORTAL_MSG_MULTI_LINK_SAVE_FAILED_DETAIL,
	PORTAL_SECTION_MY_LINKS,
	PORTAL_SECTION_MY_LINKS_EMPTY,
	PORTAL_SECTION_MY_LINKS_SUFFIX,
	PORTAL_SECTION_SHARED,
	PORTAL_SECTION_SHARED_EMPTY,
	PORTAL_SECTION_SHARED_SUFFIX,
	PORTAL_TITLE_PAGE,
	PORTAL_SUBTITLE,
	PORTAL_LABEL_DATE_CALCULATOR,
	PORTAL_TABLE_HEADER_FIRST,
	PORTAL_TABLE_HEADER_SECOND,
	PORTAL_TABLE_HEADER_THIRD,
	PORTAL_TABLE_HEADER_FOURTH,
	PORTAL_BTN_TITLE_EDIT_CATEGORY,
	PORTAL_BTN_TITLE_NEW_CATEGORY,
	PORTAL_BTN_TITLE_EDIT,
	PORTAL_BTN_TITLE_DELETE
} from '../../common/locale/locale-strings';
import {
	NewCategoryData,
	NewLinkData,
	PortalCategory,
	PortalLink,
	PORTAL_DATE_CALCULATOR_FIELDS,
	PORTAL_LINK_CARD_PALETTE
} from './portal.model';
import { BlockedCardComponent } from '../../common/blocked-card/blocked-card.component';

@Component({
	selector: 'portal',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		BlockedCardComponent,
		CommonModule,
		FormsModule,
		TableModule,
		SkeletonModule,
		InputTextModule,
		SelectModule
	],
	templateUrl: './portal.component.html',
	styleUrls: ['../../common/glass-card.css', './portal.component.css']
})
export class PortalComponent implements OnInit, AfterViewChecked, OnDestroy {
	private readonly className = 'PortalComponent';

	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	@ViewChild('categoryTabs') private categoryTabsEl?: ElementRef<HTMLElement>;

	protected readonly PORTAL_CATEGORY_ALL = PORTAL_CATEGORY_ALL;
	protected readonly PORTAL_LABEL_CURRENT_MONTH = PORTAL_LABEL_CURRENT_MONTH;
	protected readonly PORTAL_LABEL_NEXT_MONTH = PORTAL_LABEL_NEXT_MONTH;
	protected readonly PORTAL_LABEL_RESET = PORTAL_LABEL_RESET;
	protected readonly PORTAL_LABEL_CELL_CONFIRM = PORTAL_LABEL_CELL_CONFIRM;
	protected readonly PORTAL_LABEL_CELL_DONE = PORTAL_LABEL_CELL_DONE;
	protected readonly PORTAL_LABEL_CELL_TODAY = PORTAL_LABEL_CELL_TODAY;
	protected readonly PORTAL_LABEL_CONFIRMED = PORTAL_LABEL_CONFIRMED;
	protected readonly PORTAL_SECTION_SHARED = PORTAL_SECTION_SHARED;
	protected readonly PORTAL_SECTION_MY_LINKS = PORTAL_SECTION_MY_LINKS;
	protected readonly PORTAL_SECTION_SHARED_SUFFIX = PORTAL_SECTION_SHARED_SUFFIX;
	protected readonly PORTAL_SECTION_MY_LINKS_SUFFIX = PORTAL_SECTION_MY_LINKS_SUFFIX;
	protected readonly PORTAL_SECTION_SHARED_EMPTY = PORTAL_SECTION_SHARED_EMPTY;
	protected readonly PORTAL_SECTION_MY_LINKS_EMPTY = PORTAL_SECTION_MY_LINKS_EMPTY;
	protected readonly PORTAL_TITLE_PAGE = PORTAL_TITLE_PAGE;
	protected readonly PORTAL_SUBTITLE = PORTAL_SUBTITLE;
	protected readonly PORTAL_LABEL_DATE_CALCULATOR = PORTAL_LABEL_DATE_CALCULATOR;
	protected readonly PORTAL_TABLE_HEADER_FIRST = PORTAL_TABLE_HEADER_FIRST;
	protected readonly PORTAL_TABLE_HEADER_SECOND = PORTAL_TABLE_HEADER_SECOND;
	protected readonly PORTAL_TABLE_HEADER_THIRD = PORTAL_TABLE_HEADER_THIRD;
	protected readonly PORTAL_TABLE_HEADER_FOURTH = PORTAL_TABLE_HEADER_FOURTH;
	protected readonly PORTAL_BTN_TITLE_EDIT_CATEGORY = PORTAL_BTN_TITLE_EDIT_CATEGORY;
	protected readonly PORTAL_BTN_TITLE_NEW_CATEGORY = PORTAL_BTN_TITLE_NEW_CATEGORY;
	protected readonly PORTAL_BTN_TITLE_EDIT = PORTAL_BTN_TITLE_EDIT;
	protected readonly PORTAL_BTN_TITLE_DELETE = PORTAL_BTN_TITLE_DELETE;
	////////////////////// Below are Date Calculator state fields ////////////////////
	private chargedCells = new Set<string>();
	protected originalDateCalculatorRows!: any[];
	protected updatedDateCalculatorRows!: any[];
	protected confirmedCount = 0;
	protected currentDay!: number;
	protected readonly fields = PORTAL_DATE_CALCULATOR_FIELDS;
	private dateCalculatorSub?: Subscription;
	protected saveIndicator = false;
	private saveIndicatorTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};
	private chargedCellsInitialized = false;
	protected isNextMonth!: boolean;
	protected dateCalculatorLoading = true;
	protected isDateCalculatorCollapsed = true;

	protected links: PortalLink[] = [];
	protected categories: PortalCategory[] = [];
	protected faviconFailedIds = new Set<string>();
	protected selectedCategory = PORTAL_CATEGORY_ALL;

	protected linksLoading = true;
	protected hoveredLinkId: string | null = null;
	protected readonly isAdmin = CloudbaseService.userHasAllRights();
	protected sharedFilteredLinks: PortalLink[] = [];
	protected personalFilteredLinks: PortalLink[] = [];

	private linksSub?: Subscription;
	private categoriesSub?: Subscription;
	private userAliveSub?: Subscription;

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		protected utilities: Utilities,
		/* ChangeDetectorRef is required: this component uses OnPush strategy with external
		   subscriptions that Angular's zone cannot detect automatically. */
		private readonly cdr: ChangeDetectorRef,
		private readonly dialogService: DialogService,
		private readonly databaseService: DatabaseService
	) {}

	/**
	 * Subscribes to useful links, link categories, and the auth-alive stream,
	 * and triggers change detection after each external update.
	 */
	ngOnInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			/* If navigated from the home quick-action buttons, auto-open the add-link dialog.
			   history.state retains the router state passed via Router.navigate({ state: ... }).
			   Immediately clear the state so a page refresh does not re-trigger the dialog. */
			if (history.state?.openAddLinkDialog) {
				history.replaceState({}, '');
				setTimeout(() => this.openAddLinkDialog(), 0);
			} else if (history.state?.openMultiLinkDialog) {
				history.replaceState({}, '');
				setTimeout(() => this.openMultiLinkDialog(), 0);
			}

			////////////////////// Below are subscriptions started on init //////////
			this.currentDay = new Date().getDate();
			const dateCalculatorObservable = this.databaseService.getDateCalculatorTableDetails();
			this.dateCalculatorSub = dateCalculatorObservable.subscribe(async (rows) => {
				// Need deep copy here so that we are not copying references
				this.originalDateCalculatorRows = structuredClone(rows);
				// Identify rows by content — CloudBase watch() does not guarantee insertion order.
				this.updatedDateCalculatorRows = structuredClone(rows).filter((row: any) => 'first' in row);
				this.isNextMonth = rows.find((row: any) => 'isNextMonth' in row)?.isNextMonth ?? false;
				this.dateCalculatorLoading = false;
				if (!this.chargedCellsInitialized) {
					await this.updateChargedCells();
					this.chargedCellsInitialized = true;
				}
				this.refreshConfirmedCount();
				// markForCheck: async callback runs outside Angular's OnPush zone
				this.cdr.markForCheck();
			});

			////////////////////// Below are links and categories subscriptions /////
			this.linksSub = this.databaseService.getUsefulLinks().subscribe({
				next: (data) => {
					this.links = data as PortalLink[];
					this.updateFilteredLinks();
					this.linksLoading = false;
					// markForCheck required: OnPush component receives data outside Angular's zone.
					this.cdr.markForCheck();
				},
				error: (error) => {
					LOG.error(this.className, PORTAL_MSG_LOAD_LINKS_FAILED, error as Error);
					this.linksLoading = false;
					// markForCheck required: error arrives outside Angular's zone.
					this.cdr.markForCheck();
				}
			});
			this.categoriesSub = this.databaseService.getLinkCategories().subscribe({
				next: (data) => {
					this.categories = Utilities.sortByOrder(data) as PortalCategory[];
					// markForCheck required: OnPush component receives data outside Angular's zone.
					this.cdr.markForCheck();
				},
				error: (error) => {
					LOG.error(this.className, PORTAL_MSG_LOAD_CATEGORIES_FAILED, error as Error);
				}
			});
			/* Subscribe directly to the auth-alive stream so the links column
			   switches between the real content and the access-denied card
			   immediately on login/logout — without waiting for a zone event. */
			this.userAliveSub = this.utilities.getIsUserAlive$().subscribe(() => {
				// markForCheck required: auth stream fires outside Angular's zone.
				this.cdr.markForCheck();
			});
		}
	}

	/**
	 * Attaches the auto-hide scroll listener to the portal container after each view check.
	 * Uses a WeakSet internally so each element is bound exactly once.
	 */
	ngAfterViewChecked(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		document
			.querySelectorAll<HTMLElement>('.container-portal')
			.forEach((el) => Utilities.attachScrollAutoHide(el));
		Utilities.attachScrollAutoHide(this.categoryTabsEl?.nativeElement);
	}

	/**
	 * Unsubscribes from all active streams, clears the dialog container, and logs
	 * the component destruction event.
	 */
	ngOnDestroy(): void {
		this.dateCalculatorSub?.unsubscribe();
		this.linksSub?.unsubscribe();
		this.categoriesSub?.unsubscribe();
		this.userAliveSub?.unsubscribe();
		this.dialogComponentContainer?.clear();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	////////////////////// Below are Date Calculator interaction handlers //////////////////

	/**
	 * Recomputes and caches the count of date calculator cells marked as charged.
	 * Called whenever rows or any cell's isCharged flag changes.
	 */
	private refreshConfirmedCount(): void {
		this.confirmedCount = (this.updatedDateCalculatorRows ?? [])
			.flatMap((row: any) => this.fields.map((field: string) => row[field] as { isCharged: boolean }))
			.filter((cell) => cell?.isCharged === true).length;
	}

	/**
	 * Total number of editable cells in the date calculator (rows × 4 columns).
	 *
	 * @returns The total cell count.
	 */
	protected get totalCount(): number {
		return (this.updatedDateCalculatorRows?.length ?? 0) * this.fields.length;
	}

	/**
	 * Sets the active month view and refreshes charged-cell state.
	 *
	 * @param isNext - True to switch to next-month view; false for current month.
	 */
	protected setMonth(isNext: boolean): void {
		this.isNextMonth = isNext;
		this.updateChargedCells().catch(() => {});
	}

	/**
	 * Updates the charged/uncharged state of date calculator cells based on
	 * the current month direction and the current day of the month.
	 * Persists the change to the database when called after initialisation.
	 */
	protected async updateChargedCells(): Promise<void> {
		// Step 1: Permission gate — skipped on first-run (init is a read-only state hydration, not a user action)
		if (this.chargedCellsInitialized) {
			if (
				!this.dialogService.ensurePermission(
					this.dialogComponentContainer,
					CloudbaseService.getUserId() ?? ''
				)
			) {
				/* Revert isNextMonth in the next microtask so the toggle button snaps back
				   without triggering a second updateChargedCells call synchronously. */
				setTimeout(() => {
					this.isNextMonth = !this.isNextMonth;
				});
				return;
			}
		}

		// Step 2: Clear charged state when switching to next month — future days have no past-due cells
		if (this.isNextMonth) {
			this.chargedCells.clear();
		}

		// Step 3: Classify every cell as greyed-out (past day, current month) or uncharged
		for (let index = 0; index < this.updatedDateCalculatorRows.length; index++) {
			for (const field of this.fields) {
				if (this.isNextMonth && this.chargedCellsInitialized) {
					this.updatedDateCalculatorRows[index][field].isCharged = false;
				} else if (
					!this.isNextMonth &&
					this.updatedDateCalculatorRows[index][field].value < this.currentDay
				) {
					/* Fields are no longer being set as charged so that its color is only changed on user input
					   this.updatedDateCalculatorRows[index][field].isCharged = true;
					   Track in chargedCells so the greyed-out style applies without writing isCharged to DB */
					this.chargedCells.add(`${index}-${field}`);
				}
			}
		}

		// Step 4: Refresh counter and persist — skip persist on first call (rows not yet user-modified)
		this.refreshConfirmedCount();
		if (this.chargedCellsInitialized) {
			await this.updateDateCalculatorSingleValue();
		}
	}

	/**
	 * Prevents non-numeric input in date calculator number fields. Allows
	 * navigation and deletion keys to pass through.
	 *
	 * @param event - The keyboard event to validate.
	 */
	protected onNumberChange(event: KeyboardEvent): void {
		const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
		if (allowedKeys.includes(event.key)) return;

		if (!/^[0-9]$/.test(event.key)) {
			event.preventDefault();
		}
	}

	/**
	 * Validates and propagates a date value change in the date calculator.
	 * Enforces minimum day gaps between rows (2-day and 6-day), caps values
	 * at 31, and cascades the change to downstream rows via twoDayDiff/sixDaysDiff.
	 *
	 * @param rowIndex - The index of the row being changed.
	 * @param field - The column key (first, second, third, fourth) being changed.
	 */
	protected async onValueChange(rowIndex: number, field: string): Promise<void> {
		const originalValue = this.originalDateCalculatorRows[rowIndex][field].value;

		// Step 1: Early exits — no-op on unchanged value, no permission, or out-of-range input
		if (this.updatedDateCalculatorRows[rowIndex][field].value == originalValue) return;

		if (
			!this.dialogService.ensurePermission(
				this.dialogComponentContainer,
				CloudbaseService.getUserId() ?? ''
			)
		) {
			this.updatedDateCalculatorRows[rowIndex][field].value = originalValue;
			return;
		}

		if (Number(this.updatedDateCalculatorRows[rowIndex][field].value) > 31) {
			this.updatedDateCalculatorRows[rowIndex][field].value = originalValue;
			return;
		}

		// Step 2: Enforce minimum row gap — rows alternate between 2-day and 6-day spacing
		if (rowIndex !== 0) {
			const previousValue = this.updatedDateCalculatorRows[rowIndex - 1][field].value;

			/* Rows alternate between 2-day and 6-day gaps: rows 1&3 require a 2-day gap
			   from their predecessor; rows 2&4 require a 6-day gap (matches the payment cycle) */
			let requiredDiff: number | null = null;
			if (rowIndex === 1 || rowIndex === 3) {
				requiredDiff = 2;
			} else if (rowIndex === 2 || rowIndex === 4) {
				requiredDiff = 6;
			}

			if (
				requiredDiff !== null &&
				Number(this.updatedDateCalculatorRows[rowIndex][field].value) - Number(previousValue) <
					requiredDiff
			) {
				this.updatedDateCalculatorRows[rowIndex][field].value = originalValue;
				return;
			}
		}

		// Step 3: Commit the new value and cascade to downstream rows in the same column
		this.updatedDateCalculatorRows[rowIndex][field].value = Number(
			this.updatedDateCalculatorRows[rowIndex][field].value
		);

		this.updatedDateCalculatorRows[rowIndex][field].isCharged = false;

		for (let index = rowIndex; index < this.updatedDateCalculatorRows.length - 1; index++) {
			if (index == 0 || index == 2) {
				this.twoDayDiff(index, field);
			} else if (index == 1 || index == 3) {
				this.sixDaysDiff(index, field);
			}
		}

		/* Step 4: Re-evaluate the grey background for every cell in this column —
		   cascading may have shifted values above or below currentDay. */
		for (let i = 0; i < this.updatedDateCalculatorRows.length; i++) {
			const key = `${i}-${field}`;
			if (!this.isNextMonth && this.updatedDateCalculatorRows[i][field].value < this.currentDay) {
				this.chargedCells.add(key);
			} else {
				this.chargedCells.delete(key);
			}
		}

		// Step 5: Persist the updated column to the database
		await this.updateDateCalculatorSingleValue();
	}

	/**
	 * Checks whether a date calculator cell is in the charged set and should
	 * be displayed as disabled.
	 *
	 * @param rowIndex - The row index of the cell.
	 * @param field - The column key of the cell.
	 * @returns True if the cell is charged (disabled).
	 */
	protected isDisabled(rowIndex: number, field: string): boolean {
		return this.chargedCells.has(`${rowIndex}-${field}`);
	}

	/**
	 * Cascades a 6-day difference from the current row to the next row
	 * (row 1 → row 2, row 3 → row 4). Caps the result at 31.
	 *
	 * @param rowIndex - The source row index (1 or 3).
	 * @param field - The column key to cascade.
	 */
	private sixDaysDiff(rowIndex: number, field: string): void {
		this.updatedDateCalculatorRows[rowIndex + 1][field].value =
			Number(this.updatedDateCalculatorRows[rowIndex][field].value) + 6;
		this.updatedDateCalculatorRows[rowIndex + 1][field].isCharged = false;
		this.isValueGreaterThan31(rowIndex, field);
	}

	/**
	 * Cascades a 2-day difference from the current row to the next row
	 * (row 0 → row 1, row 2 → row 3). Caps the result at 31.
	 *
	 * @param rowIndex - The source row index (0 or 2).
	 * @param field - The column key to cascade.
	 */
	private twoDayDiff(rowIndex: number, field: string): void {
		this.updatedDateCalculatorRows[rowIndex + 1][field].value =
			Number(this.updatedDateCalculatorRows[rowIndex][field].value) + 2;
		this.updatedDateCalculatorRows[rowIndex + 1][field].isCharged = false;
		this.isValueGreaterThan31(rowIndex, field);
	}

	/**
	 * Clamps the cascaded value at 31 — days cannot exceed 31.
	 *
	 * @param rowIndex - The row whose next-row value is being clamped.
	 * @param field - The column key.
	 */
	private isValueGreaterThan31(rowIndex: number, field: string): void {
		this.updatedDateCalculatorRows[rowIndex + 1][field].value =
			this.updatedDateCalculatorRows[rowIndex + 1][field].value > 31
				? 31
				: this.updatedDateCalculatorRows[rowIndex + 1][field].value;
	}

	/**
	 * Toggles a date calculator cell to the charged state and persists to the database.
	 * No-ops if the cell is already charged or the user lacks permission.
	 *
	 * @param rowIndex - The row index of the cell.
	 * @param field - The column key of the cell.
	 */
	protected async setIsCharged(rowIndex: number, field: string): Promise<void> {
		if (
			!this.dialogService.ensurePermission(
				this.dialogComponentContainer,
				CloudbaseService.getUserId() ?? ''
			)
		)
			return;

		if (!this.updatedDateCalculatorRows[rowIndex][field].isCharged) {
			this.updatedDateCalculatorRows[rowIndex][field].isCharged = true;
			this.refreshConfirmedCount();
			// Update table to database
			await this.updateDateCalculatorSingleValue();
		}
	}

	/**
	 * Opens a confirmation dialog before resetting the date calculator dates to their default sequence (1, 3, 9, 11, 17).
	 */
	protected openResetConfirmationDialog(): void {
		if (
			!this.dialogService.ensurePermission(
				this.dialogComponentContainer,
				CloudbaseService.getUserId() ?? ''
			)
		)
			return;

		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_CONFIRM,
			() => {
				this.setDateCalculatorDefaults();
			},
			[PORTAL_MSG_RESET_CONFIRM, PORTAL_DIALOG_RESET_BTN, DIALOG_BTN_CONFIRM]
		);
	}

	/**
	 * Resets all values in the date calculator to their default sequence
	 * (1, 3, 9, 11, 17), sets all cells to uncharged, and persists the reset
	 * state to the database.
	 */
	private async setDateCalculatorDefaults(): Promise<void> {
		// Step 1: Build the canonical 5-row schedule (day 1 → 3 → 9 → 11 → 17)
		const values = [1, 3, 9, 11, 17];

		/* Step 2: Reconstruct updatedDateCalculatorRows from originalDateCalculatorRows —
		   filter to data rows only (the meta row carries isNextMonth, not 'first'),
		   then stamp all four column values and clear the isCharged flag on every cell. */
		this.updatedDateCalculatorRows = this.originalDateCalculatorRows
			.filter((row: any) => 'first' in row)
			.map((original, index) => ({
				_id: original._id,
				_openid: original._openid,
				first: { value: values[index], isCharged: false },
				second: { value: values[index], isCharged: false },
				third: { value: values[index], isCharged: false },
				fourth: { value: values[index], isCharged: false }
			}));

		// Step 3: Sync the confirmed counter and flush to the database
		this.refreshConfirmedCount();
		await this.updateDateCalculatorSingleValue();
	}

	/**
	 * Persists the current state of the date calculator (including the isNextMonth
	 * flag) to the database. Shows a save indicator on success or an error
	 * dialog on failure.
	 */
	private async updateDateCalculatorSingleValue(): Promise<void> {
		try {
			/* Step 1: Locate the metadata row by field presence — CloudBase watch() delivers
			   documents in arbitrary order so positional access (rows[5]) is unreliable. */
			const metaRow = this.originalDateCalculatorRows.find((row: any) => 'isNextMonth' in row);

			// Step 2: Build the full payload (data rows + updated meta row)
			const payload = [
				...this.updatedDateCalculatorRows,
				{
					_id: metaRow._id,
					_openid: metaRow._openid,
					isNextMonth: this.isNextMonth
				}
			];

			// Step 3: Persist and flash the save indicator on success
			await this.databaseService.updateDateCalculatorTable(payload);
			this.triggerSaveIndicator();
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
		}
	}

	////////////////////// Below are shared utility methods //////////////////////////////

	/**
	 * Shows the save-confirmation indicator and hides it after one second.
	 * Clears any active timeout before restarting so rapid saves do not flash.
	 */
	private triggerSaveIndicator(): void {
		// Step 1: Show the indicator immediately and mark OnPush for re-render
		this.saveIndicator = true;
		this.cdr.markForCheck();

		/* Step 2: Cancel any pending hide timeout before scheduling a new one —
		   without this, rapid saves would queue multiple hides and the indicator
		   could vanish before the last save's 1 s window expires. */
		if (this.saveIndicatorTimeouts[DATABASE_DATE_CALCULATOR])
			clearTimeout(this.saveIndicatorTimeouts[DATABASE_DATE_CALCULATOR]);

		// Step 3: Hide the indicator after 1 s and re-render
		this.saveIndicatorTimeouts[DATABASE_DATE_CALCULATOR] = setTimeout(() => {
			this.saveIndicator = false;
			this.cdr.markForCheck();
		}, 1000);
	}

	////////////////////// Below are links handlers ////////////////////////////////////

	/**
	 * Marks the link as having a failed favicon so the initial-letter fallback is displayed.
	 * Logs a warning and triggers change detection.
	 *
	 * @param link - The link document whose favicon failed to load.
	 */
	protected onFaviconError(link: PortalLink): void {
		this.faviconFailedIds.add(link._id);
		LOG.warn(this.className, `Favicon unavailable for ${link.title} (${link.url})`);
		// markForCheck required: called from a DOM event outside Angular's zone.
		this.cdr.markForCheck();
	}

	/**
	 * Opens a saved link in a new tab and increments its visit count.
	 *
	 * @param link - The link document to open.
	 */
	protected openLink(link: PortalLink): void {
		this.utilities.openInNewTab(Utilities.normalizeUrl(link.url));
		this.databaseService
			.incrementLinkVisit(link._id, link.visitCount ?? 0)
			.catch((error: unknown) =>
				LOG.error(this.className, `Failed to increment visit count for ${link.title}`, error as Error)
			);
	}

	/**
	 * Gets the number of links belonging to a given category key.
	 *
	 * @param categoryKey - The category _id, or the sentinel value for all links.
	 * @returns The count of matching links.
	 */
	protected getLinkCount(categoryKey: string): number {
		if (categoryKey === PORTAL_CATEGORY_ALL) return this.links.length;
		return this.links.filter((link) => link.category === categoryKey).length;
	}

	/**
	 * Opens the Add Link dialog with a blank form via DialogService.
	 */
	protected openAddLinkDialog(): void {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_LINK,
			(formData) => this.handleLinkSave(formData, null),
			null
		);
	}

	/**
	 * Opens the Multi Link dialog with category names via DialogService.
	 */
	protected openMultiLinkDialog(): void {
		const categoryNames = this.categories.map((c) => c.name);
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_MULTI_LINK,
			(links) => this.handleMultiLinkSave(links),
			categoryNames
		);
	}

	/**
	 * Opens the Edit Link dialog pre-filled with the given link's data via DialogService.
	 *
	 * @param link - The link document to edit.
	 * @param event - The click event, stopped to prevent the card click from firing.
	 */
	protected openEditLinkDialog(link: PortalLink, event: Event): void {
		event.stopPropagation();
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_LINK,
			(formData) => this.handleLinkSave(formData, link),
			{
				url: link.url,
				title: link.title,
				category: link.category ?? '',
				isPinned: link.isPinned ?? false
			}
		);
	}

	/**
	 * Persists a new or updated link to the database.
	 * Runs inside a block dialog so the UI is locked during the async operation.
	 *
	 * @param formData - The validated link fields submitted by the dialog.
	 * @param existingLink - The existing DB record when editing, or null when adding.
	 */
	private handleLinkSave(formData: NewLinkData, existingLink: PortalLink | null): void {
		this.openBlockDialog(async () => {
			// Step 1: Normalise the URL before any read or write (adds https:// if scheme is absent)
			const finalUrl = Utilities.normalizeUrl(formData.url);
			try {
				const domain = Utilities.getDomain(finalUrl);

				// Step 2: Branch on add vs. edit — existingLink is null for new links
				if (existingLink) {
					await this.databaseService.updateUsefulLink(
						existingLink._id,
						{
							url: finalUrl,
							title: formData.title,
							category: formData.category,
							isPinned: formData.isPinned
						},
						domain
					);
					LOG.info(this.className, `Link updated: ${finalUrl}`);
					this.dialogService.showToast(SUCCESS, PORTAL_MSG_LINK_UPDATED);
				} else {
					await this.databaseService.addUsefulLink({
						url: finalUrl,
						title: formData.title,
						category: formData.category,
						visitCount: 0,
						createdAt: new Date().toISOString(),
						isPinned: formData.isPinned
					});
					LOG.info(this.className, `Link saved: ${finalUrl}`);
					this.dialogService.showToast(SUCCESS, PORTAL_MSG_LINK_SAVED);
				}
			} catch (error) {
				if (error instanceof SessionExpiredError) {
					this.dialogService.handleError(this.dialogComponentContainer, error);
				} else {
					// Step 3: Surface a user-facing error toast — do not swallow the failure silently
					LOG.error(this.className, PORTAL_MSG_SAVE_LINK_FAILED, error as Error);
					this.dialogService.showToast(
						TOAST_ERROR,
						MSG_SAVE_FAILED,
						PORTAL_MSG_LINK_SAVE_FAILED_DETAIL
					);
				}
			}
		}, PORTAL_MSG_SAVING_LINK).catch(() => {});
	}

	/**
	 * Persists a batch of new links to the database.
	 * Runs inside a block dialog so the UI is locked during the async operation.
	 *
	 * @param links - The batch of validated link data submitted by the multi-link dialog.
	 */
	private handleMultiLinkSave(links: NewLinkData[]): void {
		this.openBlockDialog(async () => {
			try {
				/* Step 1: Fan out all writes in parallel — Promise.all rejects at the first failure,
				   so a partial batch is never silently committed without an error toast. */
				await Promise.all(
					links.map((formData) => {
						const finalUrl = Utilities.normalizeUrl(formData.url);
						return this.databaseService.addUsefulLink({
							url: finalUrl,
							title: formData.title,
							category: formData.category,
							visitCount: 0,
							createdAt: new Date().toISOString(),
							isPinned: formData.isPinned
						});
					})
				);

				// Step 2: Confirm all writes succeeded with a single success toast
				LOG.info(this.className, `${links.length} links saved`);
				this.dialogService.showToast(SUCCESS, PORTAL_MSG_MULTI_LINK_SAVED);
			} catch (error) {
				if (error instanceof SessionExpiredError) {
					this.dialogService.handleError(this.dialogComponentContainer, error);
				} else {
					// Step 3: Surface a user-facing error toast on any failure
					LOG.error(this.className, PORTAL_MSG_SAVE_LINK_FAILED, error as Error);
					this.dialogService.showToast(
						TOAST_ERROR,
						MSG_SAVE_FAILED,
						PORTAL_MSG_MULTI_LINK_SAVE_FAILED_DETAIL
					);
				}
			}
		}, PORTAL_MSG_SAVING_LINKS).catch(() => {});
	}

	/**
	 * Opens a blocking progress dialog that prevents user interaction while the
	 * given async callback executes. Used during link save, update, and category save flows.
	 *
	 * @param callback - The async operation to run while the dialog is shown.
	 * @param message - The status message displayed inside the dialog.
	 */
	private openBlockDialog(callback: () => Promise<void>, message: string): Promise<void> {
		return this.dialogService.openDialog(this.dialogComponentContainer, DIALOG_BLOCK, callback, message);
	}

	/**
	 * Opens a confirmation dialog and removes the link from CloudBase on confirmation.
	 *
	 * @param link - The link document to delete.
	 * @param event - The click event, stopped to prevent the card click from firing.
	 */
	protected openDeleteLinkDialog(link: PortalLink, event: Event): void {
		// Step 1: Prevent the link card click handler from firing underneath the delete button
		event.stopPropagation();

		// Step 2: Open the confirmation dialog; the delete runs only if the user confirms
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_CONFIRM,
			() => {
				// Step 3: On confirmation, delete the link and show result toast
				const domain = Utilities.getDomain(link.url);
				this.databaseService
					.removeUsefulLink(link._id, domain)
					.then(() => {
						LOG.info(this.className, `Link deleted: ${link.title}`);
						this.dialogService.showToast(TOAST_INFO, PORTAL_MSG_LINK_DELETED);
					})
					.catch((error: unknown) => {
						LOG.error(this.className, `Failed to delete link: ${link.title}`, error as Error);
						this.dialogService.showToast(
							TOAST_ERROR,
							MSG_DELETE_FAILED,
							PORTAL_MSG_LINK_DELETE_FAILED_DETAIL
						);
					});
			},
			[
				PORTAL_MSG_DELETE_LINK_CONFIRM_PREFIX + link.title + PORTAL_MSG_DELETE_LINK_CONFIRM_SUFFIX,
				PORTAL_MSG_DELETE_LINK_TITLE,
				DIALOG_BTN_DELETE
			]
		);
	}

	/**
	 * Sets the active category filter, controlling which links are shown in the grid.
	 * Clicking the already-active category deselects it and falls back to All.
	 *
	 * @param categoryId - The category _id to filter by, or {@link PORTAL_CATEGORY_ALL} to show all.
	 */
	protected selectCategory(categoryId: string): void {
		this.selectedCategory = this.selectedCategory === categoryId ? PORTAL_CATEGORY_ALL : categoryId;
		this.updateFilteredLinks();
	}

	/**
	 * Opens the Add Category dialog with a blank form via DialogService.
	 */
	protected openAddCategoryDialog(): void {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_CATEGORY,
			(data) => this.handleCategorySave(data, null),
			{ prefillData: null }
		);
	}

	/**
	 * Opens the Edit Category dialog pre-filled with an existing category's data via DialogService.
	 *
	 * @param category - The category document to edit.
	 * @param event - The click event, stopped to prevent the tab switch from firing.
	 */
	protected openEditCategoryDialog(category: PortalCategory, event: Event): void {
		event.stopPropagation();
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_CATEGORY,
			(data) => this.handleCategorySave(data, category),
			{ prefillData: { name: category.name }, onDelete: () => this.openDeleteCategoryDialog(category) }
		);
	}

	/**
	 * Persists a new or updated category to the database.
	 * Runs inside a block dialog so the UI is locked during the async operation.
	 *
	 * @param data - The validated category fields submitted by the dialog.
	 * @param existing - The existing DB record when editing, or null when adding.
	 */
	private handleCategorySave(data: NewCategoryData, existing: PortalCategory | null): void {
		this.openBlockDialog(async () => {
			try {
				if (existing) {
					await this.databaseService.updateLinkCategory(
						existing._id,
						{ name: data.name },
						data.name
					);
					LOG.info(this.className, `Category updated: ${data.name}`);
					this.dialogService.showToast(SUCCESS, PORTAL_MSG_CATEGORY_UPDATED);
				} else {
					await this.databaseService.addLinkCategory({
						name: data.name,
						order: this.categories.length
					});
					LOG.info(this.className, `Category added: ${data.name}`);
					this.dialogService.showToast(SUCCESS, PORTAL_MSG_CATEGORY_ADDED);
				}
			} catch (error) {
				if (error instanceof SessionExpiredError) {
					this.dialogService.handleError(this.dialogComponentContainer, error);
				} else {
					LOG.error(this.className, PORTAL_MSG_SAVE_CATEGORY_FAILED, error as Error);
					this.dialogService.showToast(
						TOAST_ERROR,
						MSG_SAVE_FAILED,
						PORTAL_MSG_CATEGORY_SAVE_FAILED_DETAIL
					);
				}
			}
		}, PORTAL_MSG_SAVING_CATEGORY).catch(() => {});
	}

	/**
	 * Toggles the Date Calculator section between collapsed and expanded states.
	 */
	protected toggleDateCalculator(): void {
		this.isDateCalculatorCollapsed = !this.isDateCalculatorCollapsed;
	}

	// ── Private helpers ───────────────────────────────────────────────────────

	/**
	 * Partitions `this.links` in a single pass, updating both the shared and personal
	 * filtered-link caches. Shared links have no `_openid`; personal links belong to the
	 * signed-in user and are additionally filtered by the active category when one is set.
	 *
	 * {@link selectCategory} - Updates both caches whenever the active category changes.
	 */
	private updateFilteredLinks(): void {
		const userId = CloudbaseService.getUserId();
		const shared: PortalLink[] = [];
		const personal: PortalLink[] = [];
		for (const link of this.links) {
			if (!link._openid) {
				shared.push(link);
			} else if (link._openid === userId) {
				personal.push(link);
			}
		}
		this.sharedFilteredLinks = shared;
		this.personalFilteredLinks =
			this.selectedCategory === PORTAL_CATEGORY_ALL
				? personal
				: personal.filter((l) => l.category === this.selectedCategory);
	}

	// ── Template helper methods ───────────────────────────────────────────────

	/**
	 * Gets the background color for a link tile card.
	 * Hashes the link's domain with djb2 to select a deterministic palette entry,
	 * so each unique site always renders with the same hue.
	 *
	 * @param link - The link document whose tile color is being computed.
	 * @returns A CSS color string for the tile background.
	 */
	protected getLinkCardColor(link: PortalLink): string {
		const domain = Utilities.getDomain(link.url);
		let hash = 5381;
		for (let i = 0; i < domain.length; i++) {
			hash = ((hash << 5) + hash) ^ domain.charCodeAt(i);
		}
		return PORTAL_LINK_CARD_PALETTE[Math.abs(hash) % PORTAL_LINK_CARD_PALETTE.length];
	}

	/**
	 * Opens a confirmation dialog and removes the category from CloudBase on confirmation.
	 * Called by the delete callback passed to the category dialog, which closes itself first
	 * so the confirm dialog can open without z-index conflicts.
	 *
	 * @param category - The category document to delete.
	 */
	private openDeleteCategoryDialog(category: PortalCategory): void {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_CONFIRM,
			() => {
				this.databaseService
					.removeLinkCategory(category._id, category.name)
					.then(() => {
						LOG.info(this.className, `Category deleted: ${category.name}`);
						this.dialogService.showToast(TOAST_INFO, PORTAL_MSG_CATEGORY_DELETED);
						this.cdr.markForCheck();
					})
					.catch((error: unknown) => {
						LOG.error(
							this.className,
							`Failed to delete category: ${category.name}`,
							error as Error
						);
						this.dialogService.showToast(
							TOAST_ERROR,
							MSG_DELETE_FAILED,
							PORTAL_MSG_CATEGORY_DELETE_FAILED_DETAIL
						);
					});
			},
			[
				PORTAL_MSG_DELETE_CATEGORY_CONFIRM_PREFIX +
					category.name +
					PORTAL_MSG_DELETE_CATEGORY_CONFIRM_SUFFIX,
				PORTAL_MSG_DELETE_CATEGORY_TITLE,
				DIALOG_BTN_DELETE
			]
		);
	}
}
