import {
	AfterViewChecked,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
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
import { Subscription } from 'rxjs';
import { DatabaseService } from '../../backend/database-service/database.service';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { LOG } from '../../common/app.logs';
import { Utilities } from '../../common/app.utilities';
import {
	ACTIVITY_TYPE_UPDATED,
	COMPONENT_DESTROY,
	DATABASE_DATE_CALCULATOR,
	DIALOG_CONFIRM,
	NEXUS_CATEGORY_ALL,
	PINBOARD_DIALOG_CONFIRM_BTN,
	PINBOARD_DIALOG_RESET_BTN,
	PINBOARD_LABEL_CELL_CONFIRM,
	PINBOARD_LABEL_CELL_DONE,
	PINBOARD_LABEL_CELL_TODAY,
	PINBOARD_LABEL_CONFIRMED,
	PINBOARD_LABEL_CURRENT_MONTH,
	PINBOARD_LABEL_NEXT_MONTH,
	PINBOARD_LABEL_RESET,
	PINBOARD_MSG_RESET_CONFIRM,
	REMINDER_TABLE_DATE_CALCULATOR,
	STATS_FIELD_RECENT_REMINDER,
	NEXUS_DIALOG_TITLE_ADD_LINK,
	NEXUS_DIALOG_TITLE_EDIT_LINK,
	NEXUS_DEFAULT_CATEGORY_COLOR,
	NEXUS_MSG_CATEGORY_ADDED,
	NEXUS_MSG_CATEGORY_DELETE_FAILED_DETAIL,
	NEXUS_MSG_CATEGORY_DELETED,
	NEXUS_MSG_CATEGORY_SAVE_FAILED_DETAIL,
	NEXUS_MSG_CATEGORY_UPDATED,
	NEXUS_MSG_DELETE_CATEGORY_BTN,
	NEXUS_MSG_DELETE_CATEGORY_CONFIRM_PREFIX,
	NEXUS_MSG_DELETE_CATEGORY_CONFIRM_SUFFIX,
	NEXUS_MSG_DELETE_CATEGORY_TITLE,
	NEXUS_MSG_DELETE_FAILED,
	NEXUS_MSG_DELETE_LINK_BTN,
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
	NEXUS_MSG_MISSING_FIELDS,
	NEXUS_MSG_MISSING_FIELDS_DETAIL,
	NEXUS_MSG_NAME_REQUIRED,
	NEXUS_MSG_SAVE_CATEGORY_FAILED,
	NEXUS_MSG_SAVE_FAILED,
	NEXUS_MSG_SAVE_LINK_FAILED,
	TOAST_ERROR,
	TOAST_INFO,
	TOAST_SUCCESS,
	TOAST_WARN
} from '../../common/app.constant';
import { AiTool, NexusCategory, NexusLink, NEXUS_AI_TOOLS, NEXUS_LOGO_FALLBACK_COLORS } from './nexus.model';

@Component({
	selector: 'nexus',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [CommonModule, FormsModule, DialogModule, TableModule, SkeletonModule, InputTextModule],
	templateUrl: './nexus.component.html',
	styleUrl: './nexus.component.css'
})
export class NexusComponent implements OnInit, AfterViewChecked, OnDestroy {
	private readonly className = 'NexusComponent';

	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;

	protected readonly NEXUS_CATEGORY_ALL = NEXUS_CATEGORY_ALL;
	protected readonly NEXUS_LOGO_FALLBACK_COLORS = NEXUS_LOGO_FALLBACK_COLORS;
	protected readonly aiTools: AiTool[] = [...NEXUS_AI_TOOLS];
	// Date Calculator constants re-exposed for the template
	protected readonly DATABASE_DATE_CALCULATOR = DATABASE_DATE_CALCULATOR;
	protected readonly PINBOARD_LABEL_CURRENT_MONTH = PINBOARD_LABEL_CURRENT_MONTH;
	protected readonly PINBOARD_LABEL_NEXT_MONTH = PINBOARD_LABEL_NEXT_MONTH;
	protected readonly PINBOARD_LABEL_RESET = PINBOARD_LABEL_RESET;
	protected readonly PINBOARD_LABEL_CELL_CONFIRM = PINBOARD_LABEL_CELL_CONFIRM;
	protected readonly PINBOARD_LABEL_CELL_DONE = PINBOARD_LABEL_CELL_DONE;
	protected readonly PINBOARD_LABEL_CELL_TODAY = PINBOARD_LABEL_CELL_TODAY;
	protected readonly PINBOARD_LABEL_CONFIRMED = PINBOARD_LABEL_CONFIRMED;
	protected failedLogos = new Set<string>();

	// ── Date Calculator state ────────────────────────────────────────────────
	private chargedCells = new Set<string>();
	protected originalDateCalculatorRows!: any[];
	protected updatedDateCalculatorRows!: any[];
	protected confirmedCount = 0;
	protected currentDay!: number;
	protected fields: Array<string> = ['first', 'second', 'third', 'fourth'];
	private dateCalculatorSub?: Subscription;
	protected saveIndicators: Record<string, boolean> = { [DATABASE_DATE_CALCULATOR]: false };
	private saveIndicatorTimeouts: Record<string, any> = {};
	private chargedCellsInitialized = false;
	protected isNextMonth!: boolean;
	protected dateCalculatorLoading = true;

	protected links: NexusLink[] = [];
	protected categories: NexusCategory[] = [];
	protected faviconFailedIds = new Set<string>();
	protected selectedCategory = NEXUS_CATEGORY_ALL;
	protected linkSearch = '';
	protected linkSearchVisible = false;

	protected showLinkDialog = false;
	protected linkDialogTitle = NEXUS_DIALOG_TITLE_ADD_LINK;
	protected editingLink: NexusLink | null = null;
	protected linkForm = { url: '', title: '', category: '' };
	protected linkFaviconPreview = '';
	protected linkMetaLoading = false;

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
		// ChangeDetectorRef is required: this component uses OnPush strategy with external
		// subscriptions that Angular's zone cannot detect automatically.
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
			// ── Date Calculator subscription ───────────────────────────────────
			this.currentDay = new Date().getDate();
			const dateCalculatorObservable = this.databaseService.getDateCalculatorTableDetails();
			this.dateCalculatorSub = dateCalculatorObservable.subscribe(async (rows) => {
				// Need deep copy here so that we are not copying references
				this.originalDateCalculatorRows = structuredClone(rows);
				this.updatedDateCalculatorRows = structuredClone(rows).slice(0, -1);
				this.isNextMonth = this.originalDateCalculatorRows[5]['isNextMonth'];
				this.dateCalculatorLoading = false;
				if (!this.chargedCellsInitialized) {
					await this.updateChargedCells();
					this.chargedCellsInitialized = true;
				}
				this.refreshConfirmedCount();
				// markForCheck: async callback runs outside Angular's OnPush zone
				this.cdr.markForCheck();
			});

			// ── Links and categories subscriptions ────────────────────────────
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
			// Subscribe directly to the auth-alive stream so the links column
			// switches between the real content and the access-denied card
			// immediately on login/logout — without waiting for a zone event.
			this.userAliveSub = this.utilities.getIsUserAlive$().subscribe(() => {
				// markForCheck required: auth stream fires outside Angular's zone.
				this.cdr.markForCheck();
			});
		}
	}

	/**
	 * Attaches the auto-hide scroll listener to the links grid after each view check.
	 * Uses a WeakSet internally so each element is bound exactly once.
	 */
	ngAfterViewChecked(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		document
			.querySelectorAll<HTMLElement>('.links-grid')
			.forEach((el) => Utilities.attachScrollAutoHide(el));
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
		void this.updateChargedCells();
	}

	/**
	 * Updates the charged/uncharged state of date calculator cells based on
	 * the current month direction and the current day of the month.
	 * Persists the change to the database when called after initialisation.
	 */
	protected async updateChargedCells(): Promise<void> {
		// On init (chargedCellsInitialized === false) skip permission check — this is a read-only state setup
		if (this.chargedCellsInitialized) {
			if (!this.dialogService.ensurePermission(this.dialogComponentContainer, CloudbaseService.getUseId() ?? '')) {
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
					// Fields are no longer being set as charged so that its color is only changed on user input
					// this.updatedDateCalculatorRows[index][field].isCharged = true;
					// Track in chargedCells so the greyed-out style applies without writing isCharged to DB
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

		if (!this.dialogService.ensurePermission(this.dialogComponentContainer, CloudbaseService.getUseId() ?? '')) {
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

			// Rows alternate between 2-day and 6-day gaps: rows 1&3 require a 2-day gap
			// from their predecessor; rows 2&4 require a 6-day gap (matches the payment cycle)
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

		// Re-evaluate grey background for every cell in this column —
		// cascading may have shifted values above or below currentDay.
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
		if (!this.dialogService.ensurePermission(this.dialogComponentContainer, CloudbaseService.getUseId() ?? '')) return;

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
		if (!this.dialogService.ensurePermission(this.dialogComponentContainer, CloudbaseService.getUseId() ?? '')) return;

		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_CONFIRM,
			() => {
				this.setDateCalculatorDefaults();
			},
			[PINBOARD_MSG_RESET_CONFIRM, PINBOARD_DIALOG_RESET_BTN, PINBOARD_DIALOG_CONFIRM_BTN]
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
			.slice(0, 5)
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
			// Row 6 (index 5) is the metadata row storing only isNextMonth — appended so the
		// database update covers all rows including the flag in one call
		const payload = [
				...this.updatedDateCalculatorRows,
				{
					_id: this.originalDateCalculatorRows[5]._id,
					_openid: this.originalDateCalculatorRows[5]._openid,
					isNextMonth: this.isNextMonth
				}
			];
			await this.databaseService.updateDateCalculatorTable(payload);
			this.triggerSaveIndicator(DATABASE_DATE_CALCULATOR);
			// Fire-and-forget: surface this change in the Recent Activity widget.
			this.databaseService
				.appendToActivityLog(STATS_FIELD_RECENT_REMINDER, {
					type: ACTIVITY_TYPE_UPDATED,
					table: REMINDER_TABLE_DATE_CALCULATOR,
					text: '',
					timestamp: Utilities.getCurrentFormattedTime(true)
				})
				.catch(() => {});
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
		}
	}

	////////////////////// Below are shared utility methods //////////////////////////////

	/**
	 * Shows a save-confirmation indicator for the given table and automatically
	 * hides it after one second. If a previous timeout for the same table is
	 * still active, it is cleared and restarted to avoid overlapping triggers.
	 *
	 * @param tableName - The name of the table for which to show the indicator.
	 */
	private triggerSaveIndicator(tableName: string): void {
		this.saveIndicators[tableName] = true;
		// markForCheck must be called immediately before the setTimeout delay begins.
		this.cdr.markForCheck();

		// Clear any previous timeout before setting a new one — rapid successive
		// saves should restart the indicator timer rather than flash on/off.
		if (this.saveIndicatorTimeouts[tableName]) {
			clearTimeout(this.saveIndicatorTimeouts[tableName]);
		}

		this.saveIndicatorTimeouts[tableName] = setTimeout(() => {
			this.saveIndicators[tableName] = false;
			// setTimeout runs outside Angular's zone — markForCheck required to hide the indicator.
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
	 * Returns the brand fallback colour for a given tool ID.
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
	 * Returns the number of links belonging to a given category key.
	 *
	 * @param categoryKey - The category _id, or the sentinel value for all links.
	 * @returns The count of matching links.
	 */
	protected getLinkCount(categoryKey: string): number {
		if (categoryKey === NEXUS_CATEGORY_ALL) return this.links.length;
		return this.links.filter((link) => link.category === categoryKey).length;
	}

	/**
	 * Opens the Add Link dialog with a blank form.
	 */
	protected openAddLinkDialog(): void {
		this.editingLink = null;
		this.linkDialogTitle = NEXUS_DIALOG_TITLE_ADD_LINK;
		this.linkForm = {
			url: '',
			title: '',
			category: this.selectedCategory !== NEXUS_CATEGORY_ALL ? this.selectedCategory : ''
		};
		this.linkFaviconPreview = '';
		this.showLinkDialog = true;
	}

	/**
	 * Opens the Edit Link dialog pre-filled with an existing link's data.
	 *
	 * @param link - The link document to edit.
	 * @param event - The click event, stopped to prevent the card click from firing.
	 */
	protected openEditLinkDialog(link: NexusLink, event: Event): void {
		event.stopPropagation();
		this.editingLink = link;
		this.linkDialogTitle = NEXUS_DIALOG_TITLE_EDIT_LINK;
		this.linkForm = { url: link.url, title: link.title, category: link.category ?? '' };
		this.linkFaviconPreview = Utilities.getFavicon(link.url);
		this.showLinkDialog = true;
	}

	/**
	 * Normalizes the entered URL, updates the favicon preview, and fetches the page title
	 * when the URL is confirmed via Enter key or focus leaving the field.
	 */
	protected onLinkUrlConfirm(): void {
		const rawUrl = this.linkForm.url.trim();
		if (!rawUrl) return;
		const url = Utilities.normalizeUrl(rawUrl);
		this.linkForm.url = url;
		this.linkFaviconPreview = Utilities.getFavicon(url);
		// Auto-fetch page title only when the user hasn't typed one yet — avoids overwriting manual input
		if (this.linkForm.title) return;
		if (this.linkMetaLoading) return;
		this.linkMetaLoading = true;
		this.databaseService
			.proxyFetch(url)
			.then((fetchResult) => {
				// Extract the <title> tag value from the raw HTML; use it as a convenience pre-fill
				const match = fetchResult.content?.match(/<title[^>]*>([^<]+)<\/title>/i);
				if (match?.[1]) this.linkForm.title = match[1].trim();
				this.linkMetaLoading = false;
				// markForCheck required: .then() callback runs outside Angular's zone.
				this.cdr.markForCheck();
			})
			.catch((error) => {
				LOG.error(
					this.className,
					`Could not fetch page title for ${url}: ${Utilities.safeErrorMessage(error)}`
				);
				this.linkMetaLoading = false;
			});
	}

	/**
	 * Validates the link form and persists the add or update to CloudBase.
	 * Shows a warning toast when required fields are missing.
	 */
	protected async saveLinkDialog(): Promise<void> {
		const { url, title, category } = this.linkForm;
		if (!url.trim() || !title.trim() || !category) {
			this.dialogService.showToast(
				TOAST_WARN,
				NEXUS_MSG_MISSING_FIELDS,
				NEXUS_MSG_MISSING_FIELDS_DETAIL
			);
			return;
		}
		const finalUrl = Utilities.normalizeUrl(url.trim());
		try {
			if (this.editingLink) {
				await this.databaseService.updateUsefulLink(this.editingLink._id, {
					url: finalUrl,
					title: title.trim(),
					category
				});
				LOG.info(this.className, `Link updated: ${finalUrl}`);
				this.dialogService.showToast(TOAST_SUCCESS, NEXUS_MSG_LINK_UPDATED);
			} else {
				await this.databaseService.addUsefulLink({
					url: finalUrl,
					title: title.trim(),
					category,
					visitCount: 0,
					createdAt: new Date().toISOString()
				});
				LOG.info(this.className, `Link saved: ${finalUrl}`);
				this.dialogService.showToast(TOAST_SUCCESS, NEXUS_MSG_LINK_SAVED);
			}
			this.showLinkDialog = false;
			// markForCheck required: async resolution runs outside Angular's zone.
			this.cdr.markForCheck();
		} catch (error) {
			LOG.error(this.className, NEXUS_MSG_SAVE_LINK_FAILED, error as Error);
			this.dialogService.showToast(
				TOAST_ERROR,
				NEXUS_MSG_SAVE_FAILED,
				NEXUS_MSG_LINK_SAVE_FAILED_DETAIL
			);
		}
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
				this.databaseService
					.removeUsefulLink(link._id)
					.then(() => {
						LOG.info(this.className, `Link deleted: ${link.title}`);
						this.dialogService.showToast(TOAST_INFO, NEXUS_MSG_LINK_DELETED);
					})
					.catch((error: unknown) => {
						LOG.error(this.className, `Failed to delete link: ${link.title}`, error as Error);
						this.dialogService.showToast(
							TOAST_ERROR,
							NEXUS_MSG_DELETE_FAILED,
							NEXUS_MSG_LINK_DELETE_FAILED_DETAIL
						);
					});
			},
			[
				NEXUS_MSG_DELETE_LINK_CONFIRM_PREFIX + link.title + NEXUS_MSG_DELETE_LINK_CONFIRM_SUFFIX,
				NEXUS_MSG_DELETE_LINK_TITLE,
				NEXUS_MSG_DELETE_LINK_BTN
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
	 * Closes the Add/Edit Link dialog.
	 */
	protected closeLinkDialog(): void {
		this.showLinkDialog = false;
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
	 * Validates the category form and persists the add or update to CloudBase.
	 * Shows a warning toast when the name field is empty.
	 */
	protected async saveCategoryDialog(): Promise<void> {
		const { name, color } = this.categoryForm;
		if (!name.trim()) {
			this.dialogService.showToast(TOAST_WARN, NEXUS_MSG_NAME_REQUIRED);
			return;
		}
		try {
			if (this.editingCategory) {
				await this.databaseService.updateLinkCategory(this.editingCategory._id, {
					name: name.trim(),
					color
				});
				LOG.info(this.className, `Category updated: ${name}`);
				this.dialogService.showToast(TOAST_SUCCESS, NEXUS_MSG_CATEGORY_UPDATED);
			} else {
				await this.databaseService.addLinkCategory({
					name: name.trim(),
					color,
					order: this.categories.length
				});
				LOG.info(this.className, `Category added: ${name}`);
				this.dialogService.showToast(TOAST_SUCCESS, NEXUS_MSG_CATEGORY_ADDED);
			}
			this.showCategoryDialog = false;
		} catch (error) {
			LOG.error(this.className, NEXUS_MSG_SAVE_CATEGORY_FAILED, error as Error);
			this.dialogService.showToast(
				TOAST_ERROR,
				NEXUS_MSG_SAVE_FAILED,
				NEXUS_MSG_CATEGORY_SAVE_FAILED_DETAIL
			);
		}
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
					.removeLinkCategory(category._id)
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
							NEXUS_MSG_DELETE_FAILED,
							NEXUS_MSG_CATEGORY_DELETE_FAILED_DETAIL
						);
					});
			},
			[
				NEXUS_MSG_DELETE_CATEGORY_CONFIRM_PREFIX +
					category.name +
					NEXUS_MSG_DELETE_CATEGORY_CONFIRM_SUFFIX,
				NEXUS_MSG_DELETE_CATEGORY_TITLE,
				NEXUS_MSG_DELETE_CATEGORY_BTN
			]
		);
	}
}
