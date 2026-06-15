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
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Subscription } from 'rxjs';
import { DatabaseService } from '../../backend/database-service/database.service';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { LOG } from '../../common/app.logs';
import { Utilities } from '../../common/app.utilities';
import {
	COMPONENT_DESTROY,
	DATABASE_DATE_CALCULATOR,
	DIALOG_BLOCK,
	DIALOG_BTN_CONFIRM,
	DIALOG_BTN_DELETE,
	DIALOG_CONFIRM,
	MSG_DELETE_FAILED,
	MSG_SAVE_FAILED,
	NEXUS_CATEGORY_ALL,
	NEXUS_DIALOG_RESET_BTN,
	NEXUS_LABEL_CELL_CONFIRM,
	NEXUS_LABEL_CELL_DONE,
	NEXUS_LABEL_CELL_TODAY,
	NEXUS_LABEL_CONFIRMED,
	NEXUS_LABEL_CURRENT_MONTH,
	NEXUS_LABEL_NEXT_MONTH,
	NEXUS_LABEL_RESET,
	NEXUS_MSG_RESET_CONFIRM,
	DIALOG_LINK,
	NEXUS_DEFAULT_CATEGORY_COLOR,
	NEXUS_MSG_CATEGORY_ADDED,
	NEXUS_MSG_CATEGORY_DELETE_FAILED_DETAIL,
	NEXUS_MSG_CATEGORY_DELETED,
	NEXUS_MSG_CATEGORY_SAVE_FAILED_DETAIL,
	NEXUS_MSG_CATEGORY_UPDATED,
	NEXUS_MSG_DELETE_CATEGORY_CONFIRM_PREFIX,
	NEXUS_MSG_DELETE_CATEGORY_CONFIRM_SUFFIX,
	NEXUS_MSG_DELETE_CATEGORY_TITLE,
	NEXUS_MSG_DELETE_LINK_CONFIRM_PREFIX,
	NEXUS_MSG_DELETE_LINK_CONFIRM_SUFFIX,
	NEXUS_MSG_DELETE_LINK_TITLE,
	NEXUS_MSG_LINK_DELETE_FAILED_DETAIL,
	NEXUS_MSG_LINK_DELETED,
	NEXUS_MSG_LINK_SAVE_FAILED_DETAIL,
	NEXUS_MSG_LINK_SAVED,
	NEXUS_MSG_LINK_UPDATED,
	NEXUS_MSG_LOAD_CATEGORIES_FAILED,
	NEXUS_MSG_LOAD_LINKS_FAILED,
	NEXUS_MSG_NAME_REQUIRED,
	NEXUS_MSG_SAVE_CATEGORY_FAILED,
	NEXUS_MSG_SAVE_LINK_FAILED,
	NEXUS_MSG_SAVING_CATEGORY,
	NEXUS_MSG_SAVING_LINK,
	SUCCESS,
	TOAST_ERROR,
	TOAST_INFO,
	TOAST_WARN
} from '../../common/app.constant';
import {
	AiTool,
	NewLinkData,
	NexusCategory,
	NexusLink,
	NEXUS_AI_TOOLS,
	NEXUS_DATE_CALCULATOR_FIELDS,
	NEXUS_LOGO_FALLBACK_COLORS
} from './nexus.model';
import { AccessDeniedComponent } from '../../common/access-denied/access-denied.component';

@Component({
	selector: 'nexus',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		AccessDeniedComponent,
		CommonModule,
		FormsModule,
		DialogModule,
		TableModule,
		SkeletonModule,
		InputTextModule,
		SelectModule
	],
	templateUrl: './nexus.component.html',
	styleUrls: ['../../common/glass-card.css', './nexus.component.css']
})
export class NexusComponent implements OnInit, AfterViewChecked, OnDestroy {
	private readonly className = 'NexusComponent';

	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	@ViewChild('categoryTabs') private categoryTabsEl?: ElementRef<HTMLElement>;

	protected readonly NEXUS_CATEGORY_ALL = NEXUS_CATEGORY_ALL;
	protected readonly NEXUS_LOGO_FALLBACK_COLORS = NEXUS_LOGO_FALLBACK_COLORS;
	protected readonly aiTools: AiTool[] = [...NEXUS_AI_TOOLS];
	protected readonly NEXUS_LABEL_CURRENT_MONTH = NEXUS_LABEL_CURRENT_MONTH;
	protected readonly NEXUS_LABEL_NEXT_MONTH = NEXUS_LABEL_NEXT_MONTH;
	protected readonly NEXUS_LABEL_RESET = NEXUS_LABEL_RESET;
	protected readonly NEXUS_LABEL_CELL_CONFIRM = NEXUS_LABEL_CELL_CONFIRM;
	protected readonly NEXUS_LABEL_CELL_DONE = NEXUS_LABEL_CELL_DONE;
	protected readonly NEXUS_LABEL_CELL_TODAY = NEXUS_LABEL_CELL_TODAY;
	protected readonly NEXUS_LABEL_CONFIRMED = NEXUS_LABEL_CONFIRMED;
	protected failedLogos = new Set<string>();

	////////////////////// Below are Date Calculator state fields ////////////////////
	private chargedCells = new Set<string>();
	protected originalDateCalculatorRows!: any[];
	protected updatedDateCalculatorRows!: any[];
	protected confirmedCount = 0;
	protected currentDay!: number;
	protected readonly fields = NEXUS_DATE_CALCULATOR_FIELDS;
	private dateCalculatorSub?: Subscription;
	protected saveIndicator = false;
	private saveIndicatorTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};
	private chargedCellsInitialized = false;
	protected isNextMonth!: boolean;
	protected dateCalculatorLoading = true;

	protected links: NexusLink[] = [];
	protected categories: NexusCategory[] = [];
	protected faviconFailedIds = new Set<string>();
	protected selectedCategory = NEXUS_CATEGORY_ALL;
	protected linkSearch = '';
	protected linkSearchVisible = false;

	protected showCategoryDialog = false;
	protected categoryForm = { name: '', color: NEXUS_DEFAULT_CATEGORY_COLOR };
	protected editingCategory: NexusCategory | null = null;

	protected linksLoading = true;

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
					this.links = data as NexusLink[];
					this.linksLoading = false;
					// markForCheck required: OnPush component receives data outside Angular's zone.
					this.cdr.markForCheck();
				},
				error: (error) => {
					LOG.error(this.className, NEXUS_MSG_LOAD_LINKS_FAILED, error as Error);
					this.linksLoading = false;
					// markForCheck required: error arrives outside Angular's zone.
					this.cdr.markForCheck();
				}
			});
			this.categoriesSub = this.databaseService.getLinkCategories().subscribe({
				next: (data) => {
					this.categories = Utilities.sortByOrder(data) as NexusCategory[];
					// markForCheck required: OnPush component receives data outside Angular's zone.
					this.cdr.markForCheck();
				},
				error: (error) => {
					LOG.error(this.className, NEXUS_MSG_LOAD_CATEGORIES_FAILED, error as Error);
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
	 * Attaches the auto-hide scroll listener to the nexus container after each view check.
	 * Uses a WeakSet internally so each element is bound exactly once.
	 */
	ngAfterViewChecked(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		document
			.querySelectorAll<HTMLElement>('.container-nexus')
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
		// On init (chargedCellsInitialized === false) skip permission check — this is a read-only state setup
		if (this.chargedCellsInitialized) {
			if (
				!this.dialogService.ensurePermission(
					this.dialogComponentContainer,
					CloudbaseService.getUserId() ?? ''
				)
			) {
				setTimeout(() => {
					this.isNextMonth = !this.isNextMonth;
				});
				return;
			}
		}

		// Switching to next-month view resets all charged state since next month has no past days
		if (this.isNextMonth) {
			this.chargedCells.clear();
		}

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

		// Do nothing if the value does not change
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
		// Reset value if it exceeds the maximum day threshold
		if (Number(this.updatedDateCalculatorRows[rowIndex][field].value) > 31) {
			this.updatedDateCalculatorRows[rowIndex][field].value = originalValue;
			return;
		}

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

		// Convert it to number
		this.updatedDateCalculatorRows[rowIndex][field].value = Number(
			this.updatedDateCalculatorRows[rowIndex][field].value
		);

		// Mark it as uncharged
		this.updatedDateCalculatorRows[rowIndex][field].isCharged = false;

		// Update other values in the same column
		for (let index = rowIndex; index < this.updatedDateCalculatorRows.length - 1; index++) {
			if (index == 0 || index == 2) {
				this.twoDayDiff(index, field);
			} else if (index == 1 || index == 3) {
				this.sixDaysDiff(index, field);
			}
		}

		/* Re-evaluate grey background for every cell in this column —
		   cascading may have shifted values above or below currentDay. */
		for (let i = 0; i < this.updatedDateCalculatorRows.length; i++) {
			const key = `${i}-${field}`;
			if (!this.isNextMonth && this.updatedDateCalculatorRows[i][field].value < this.currentDay) {
				this.chargedCells.add(key);
			} else {
				this.chargedCells.delete(key);
			}
		}

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
			[NEXUS_MSG_RESET_CONFIRM, NEXUS_DIALOG_RESET_BTN, DIALOG_BTN_CONFIRM]
		);
	}

	/**
	 * Resets all values in the date calculator to their default sequence
	 * (1, 3, 9, 11, 17), sets all cells to uncharged, and persists the reset
	 * state to the database.
	 */
	private async setDateCalculatorDefaults(): Promise<void> {
		// Default sequence: day 1 → 3 → 9 → 11 → 17 (matches the standard payment schedule)
		const values = [1, 3, 9, 11, 17];
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
			/* The metadata row stores only isNextMonth — locate it by content so the
			   lookup survives watch() returning documents in any order. */
			const metaRow = this.originalDateCalculatorRows.find((row: any) => 'isNextMonth' in row);
			const payload = [
				...this.updatedDateCalculatorRows,
				{
					_id: metaRow._id,
					_openid: metaRow._openid,
					isNextMonth: this.isNextMonth
				}
			];
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
		this.saveIndicator = true;
		this.cdr.markForCheck();
		if (this.saveIndicatorTimeouts[DATABASE_DATE_CALCULATOR]) clearTimeout(this.saveIndicatorTimeouts[DATABASE_DATE_CALCULATOR]);
		this.saveIndicatorTimeouts[DATABASE_DATE_CALCULATOR] = setTimeout(() => {
			this.saveIndicator = false;
			this.cdr.markForCheck();
		}, 1000);
	}

	////////////////////// Below are AI tools and links handlers /////////////////////////

	/**
	 * Marks a tool's logo as failed so the initial-letter fallback is shown instead.
	 *
	 * @param toolId - The ID of the AI tool whose image failed to load.
	 */
	protected onLogoError(toolId: string): void {
		this.failedLogos.add(toolId);
		// markForCheck required: called from a DOM event outside Angular's zone.
		this.cdr.markForCheck();
	}

	/**
	 * Gets the brand fallback colour for a given tool ID.
	 *
	 * @param toolId - The AI tool ID.
	 * @returns A CSS colour string.
	 */
	protected getLogoFallbackColor(toolId: string): string {
		return this.NEXUS_LOGO_FALLBACK_COLORS[toolId] ?? '#888';
	}

	/**
	 * Opens an AI tool's homepage in a new tab.
	 *
	 * @param tool - The AI tool to open.
	 */
	protected openAiTool(tool: AiTool): void {
		this.utilities.openInNewTab(tool.url);
	}

	/**
	 * Toggles the link search input visibility.
	 * Clears the search query when collapsing.
	 */
	protected toggleLinkSearch(): void {
		this.linkSearchVisible = !this.linkSearchVisible;
		if (!this.linkSearchVisible) this.linkSearch = '';
	}

	/**
	 * Collapses the link search input when the user exits the field and the query is empty.
	 * Skips the collapse when focus moves to the search-toggle icon button so
	 * that the subsequent click handler can toggle the visibility itself,
	 * avoiding the blur-then-click race that would reopen a just-closed input.
	 *
	 * @param event - The FocusEvent whose relatedTarget identifies where focus went.
	 */
	protected onLinkSearchExit(event: FocusEvent): void {
		const focusTarget = event.relatedTarget as HTMLElement | null;
		if (focusTarget?.closest('.icon-button')) return;
		if (!this.linkSearch.trim()) this.linkSearchVisible = false;
	}

	/**
	 * Returns the subset of links that match the active category tab and the
	 * current search string. Used directly by the template as a getter.
	 *
	 * @returns The filtered array of link documents.
	 */
	protected get filteredLinks(): NexusLink[] {
		return this.links.filter((link) => {
			const matchesCategory =
				this.selectedCategory === NEXUS_CATEGORY_ALL || link.category === this.selectedCategory;
			const matchesSearch =
				!this.linkSearch.trim() || link.title.toLowerCase().includes(this.linkSearch.toLowerCase());
			return matchesCategory && matchesSearch;
		});
	}

	/**
	 * Marks the link as having a failed favicon so the initial-letter fallback is displayed.
	 * Logs a warning and triggers change detection.
	 *
	 * @param link - The link document whose favicon failed to load.
	 */
	protected onFaviconError(link: NexusLink): void {
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
	protected openLink(link: NexusLink): void {
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
		if (categoryKey === NEXUS_CATEGORY_ALL) return this.links.length;
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
	 * Opens the Edit Link dialog pre-filled with the given link's data via DialogService.
	 *
	 * @param link - The link document to edit.
	 * @param event - The click event, stopped to prevent the card click from firing.
	 */
	protected openEditLinkDialog(link: NexusLink, event: Event): void {
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
	private handleLinkSave(formData: NewLinkData, existingLink: NexusLink | null): void {
		this.openBlockDialog(async () => {
			const finalUrl = Utilities.normalizeUrl(formData.url);
			try {
				const domain = Utilities.getDomain(finalUrl);
				if (existingLink) {
					await this.databaseService.updateUsefulLink(existingLink._id, {
						url: finalUrl,
						title: formData.title,
						category: formData.category,
						isPinned: formData.isPinned
					}, domain);
					LOG.info(this.className, `Link updated: ${finalUrl}`);
					this.dialogService.showToast(SUCCESS, NEXUS_MSG_LINK_UPDATED);
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
					this.dialogService.showToast(SUCCESS, NEXUS_MSG_LINK_SAVED);
				}
			} catch (error) {
				LOG.error(this.className, NEXUS_MSG_SAVE_LINK_FAILED, error as Error);
				this.dialogService.showToast(TOAST_ERROR, MSG_SAVE_FAILED, NEXUS_MSG_LINK_SAVE_FAILED_DETAIL);
			}
		}, NEXUS_MSG_SAVING_LINK).catch(() => {});
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
	protected openDeleteLinkDialog(link: NexusLink, event: Event): void {
		event.stopPropagation();
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_CONFIRM,
			() => {
				const domain = Utilities.getDomain(link.url);
				this.databaseService
					.removeUsefulLink(link._id, domain)
					.then(() => {
						LOG.info(this.className, `Link deleted: ${link.title}`);
						this.dialogService.showToast(TOAST_INFO, NEXUS_MSG_LINK_DELETED);
					})
					.catch((error: unknown) => {
						LOG.error(this.className, `Failed to delete link: ${link.title}`, error as Error);
						this.dialogService.showToast(
							TOAST_ERROR,
							MSG_DELETE_FAILED,
							NEXUS_MSG_LINK_DELETE_FAILED_DETAIL
						);
					});
			},
			[
				NEXUS_MSG_DELETE_LINK_CONFIRM_PREFIX + link.title + NEXUS_MSG_DELETE_LINK_CONFIRM_SUFFIX,
				NEXUS_MSG_DELETE_LINK_TITLE,
				DIALOG_BTN_DELETE
			]
		);
	}

	/**
	 * Sets the active category filter, controlling which links are shown in the grid.
	 *
	 * @param categoryId - The category _id to filter by, or {@link NEXUS_CATEGORY_ALL} to show all.
	 */
	protected selectCategory(categoryId: string): void {
		this.selectedCategory = categoryId;
	}

	/**
	 * Closes the Add/Edit Category dialog.
	 */
	protected closeCategoryDialog(): void {
		this.showCategoryDialog = false;
	}

	/**
	 * Opens the Add Category dialog with a blank form.
	 */
	protected openAddCategoryDialog(): void {
		this.editingCategory = null;
		this.categoryForm = { name: '', color: NEXUS_DEFAULT_CATEGORY_COLOR };
		this.showCategoryDialog = true;
	}

	/**
	 * Opens the Edit Category dialog pre-filled with an existing category's data.
	 *
	 * @param category - The category document to edit.
	 * @param event - The click event, stopped to prevent the tab switch from firing.
	 */
	protected openEditCategoryDialog(category: NexusCategory, event: Event): void {
		event.stopPropagation();
		this.editingCategory = category;
		this.categoryForm = { name: category.name, color: category.color ?? NEXUS_DEFAULT_CATEGORY_COLOR };
		this.showCategoryDialog = true;
	}

	/**
	 * Validates the category form, closes the inline dialog, then delegates the
	 * add or update to CloudBase inside a block dialog to prevent duplicate submissions.
	 * Shows a warning toast when the name field is empty.
	 */
	protected saveCategoryDialog(): void {
		const { name, color } = this.categoryForm;
		if (!name.trim()) {
			this.dialogService.showToast(TOAST_WARN, NEXUS_MSG_NAME_REQUIRED);
			return;
		}
		this.showCategoryDialog = false;
		this.openBlockDialog(async () => {
			try {
				if (this.editingCategory) {
					await this.databaseService.updateLinkCategory(
						this.editingCategory._id,
						{ name: name.trim(), color },
						name.trim()
					);
					LOG.info(this.className, `Category updated: ${name}`);
					this.dialogService.showToast(SUCCESS, NEXUS_MSG_CATEGORY_UPDATED);
				} else {
					await this.databaseService.addLinkCategory({
						name: name.trim(),
						color,
						order: this.categories.length
					});
					LOG.info(this.className, `Category added: ${name}`);
					this.dialogService.showToast(SUCCESS, NEXUS_MSG_CATEGORY_ADDED);
				}
			} catch (error) {
				LOG.error(this.className, NEXUS_MSG_SAVE_CATEGORY_FAILED, error as Error);
				this.dialogService.showToast(
					TOAST_ERROR,
					MSG_SAVE_FAILED,
					NEXUS_MSG_CATEGORY_SAVE_FAILED_DETAIL
				);
			}
		}, NEXUS_MSG_SAVING_CATEGORY).catch(() => {});
	}

	/**
	 * Opens a confirmation dialog and removes the category from CloudBase on confirmation.
	 *
	 * @param category - The category document to delete.
	 * @param event - The click event, stopped to prevent the tab switch from firing.
	 */
	protected openDeleteCategoryDialog(category: NexusCategory, event: Event): void {
		event.stopPropagation();
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_CONFIRM,
			() => {
				this.databaseService
					.removeLinkCategory(category._id, category.name)
					.then(() => {
						LOG.info(this.className, `Category deleted: ${category.name}`);
						this.dialogService.showToast(TOAST_INFO, NEXUS_MSG_CATEGORY_DELETED);
						this.showCategoryDialog = false;
						// markForCheck required: .then() callback runs outside Angular's zone.
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
							NEXUS_MSG_CATEGORY_DELETE_FAILED_DETAIL
						);
					});
			},
			[
				NEXUS_MSG_DELETE_CATEGORY_CONFIRM_PREFIX +
					category.name +
					NEXUS_MSG_DELETE_CATEGORY_CONFIRM_SUFFIX,
				NEXUS_MSG_DELETE_CATEGORY_TITLE,
				DIALOG_BTN_DELETE
			]
		);
	}
}
