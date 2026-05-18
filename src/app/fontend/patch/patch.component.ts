import {
	AfterViewChecked,
	Component,
	HostListener,
	Inject,
	NgZone,
	OnDestroy,
	OnInit,
	PLATFORM_ID,
	ViewChild,
	ViewContainerRef
} from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { Utilities } from '../../common/app.utilities';
import {
	ACTIVITY_TYPE_BUG_LOGGED,
	ACTIVITY_TYPE_EDITED,
	ACTIVITY_TYPE_STATUS_CHANGED,
	COMPONENT_DESTROY,
	DIALOG_CONFIRM,
	HISTORY_STATUS_ADDED,
	HISTORY_STATUS_DELETED,
	STATUS_COMPLETED,
	STATUS_DEBUG,
	STATUS_DRAFT,
	STATUS_IN_PROGRESS,
	STATUS_RESOLVED,
	STATUS_TODO
} from '../../common/app.constant';
import { map, Observable, tap } from 'rxjs';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LOG } from '../../common/app.logs';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { CheckboxModule } from 'primeng/checkbox';
import { PaginatorModule } from 'primeng/paginator';
import { DatabaseService } from '../../backend/database-service/database.service';

@Component({
	selector: 'patch',
	imports: [
		TableModule,
		SkeletonModule,
		Tag,
		InputText,
		Button,
		Select,
		DatePicker,
		FormsModule,
		CommonModule,
		PaginatorModule,
		CheckboxModule
	],
	templateUrl: './patch.component.html',
	styleUrls: ['../../common/page.card.css', './patch.component.css']
})
export class PatchComponent implements OnInit, OnDestroy, AfterViewChecked {
	private readonly className = 'PatchComponent';
	@ViewChild('t') private table!: Table; // This is the reference for the table in html
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	protected loading = true;
	protected severity: { severity: string }[] | undefined;
	protected bugSeverity: { severity: string }[] | undefined;
	protected allSeverity: { severity: string }[] | undefined;
	protected patchNotes$!: Observable<any[]>;
	protected indexOfFirstItem = 0;
	protected itemsPerPage = 9;
	protected isMobile!: boolean;
	protected skeletonRows = Array.from({ length: this.itemsPerPage });
	protected editedRows = new Map<string, any>();
	protected hoveredRowIndex: number | null = null;
	private previousDataLength: number | null = null;
	/**
	 * Full ordered list of patch notes (no dummy row), kept in sync by the subscription tap.
	 */
	private patchNotesList: any[] = [];
	/**
	 * The page (first-item index) the user intends to be on.
	 * Updated by user navigation and add/delete logic.
	 */
	private _savedFirst = 0;
	/**
	 * Set to true inside the tap whenever CloudBase pushes fresh data.
	 * onTableFilter() checks this to distinguish a data-driven _filter() reset
	 * (where we must restore the page) from a user-initiated filter interaction
	 * (where PrimeNG's default page-1 reset is the correct behaviour).
	 */
	private _isDataUpdate = false;
	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		private databaseService: DatabaseService,
		private dialogService: DialogService,
		protected utilities: Utilities,
		private ngZone: NgZone
	) {}

	/**
	 * Attaches the auto-hide scroll listener to the page container after each view check.
	 */
	public ngAfterViewChecked(): void {
		document.querySelectorAll<HTMLElement>('.container.page-card').forEach((el) => Utilities.attachScrollAutoHide(el));
	}

	/**
	 * Initialises the component: detects mobile layout, builds the patch-notes
	 * observable (with a dummy-row appended for desktop to keep the add-entry row
	 * visible), populates the severity option lists, and sets up the subscription
	 * tap that keeps `patchNotesList`, page-index state, and the `patchInProgress`
	 * statistic in sync whenever CloudBase pushes fresh data.
	 */
	public async ngOnInit() {
		if (isPlatformBrowser(this.platformId)) {
			this.isMobile = this.utilities.isMobile();

			const getObservable$ = this.databaseService.getPatchNotes();
			this.patchNotes$ = getObservable$.pipe(
				map((data) => {
					return this.isMobile ? data : [...data, { __dummy: true }];
				}),
				tap((data) => {
					this.ngZone.run(() => {
						this.loading = false;
						const prevLength = this.previousDataLength;
						this.previousDataLength = data.length;

						// 1. Determine the "Source of Truth" for the page index
						// On first load (prevLength === null): if navigated via "Log Bug",
						// jump straight to the last page using the same formula as new-entry logic.
						if (prevLength === null && history.state?.goToLastPage) {
							this._savedFirst = Math.max(
								0,
								Math.floor((data.length - 1) / this.itemsPerPage) * this.itemsPerPage
							);
						} else if (prevLength !== null && data.length > prevLength) {
							this._savedFirst = Math.max(
								0,
								Math.floor((data.length - 1) / this.itemsPerPage) * this.itemsPerPage
							);
						} else if (
							prevLength !== null &&
							data.length < prevLength &&
							this._savedFirst >= data.length &&
							this._savedFirst > 0
						) {
							this._savedFirst = Math.max(0, this._savedFirst - this.itemsPerPage);
						}

						// 2. Arm the "Firewall"
						// This tells onTableFilter that the next page-reset is data-driven
						// and should be ignored/overridden.
						this._isDataUpdate = true;

						// 3. Keep a local ordered copy for look-ups in edit/delete stats writes.
						this.patchNotesList = data.filter((note: any) => !note.__dummy);

						// 4. Sync in-progress items to statistics while this page is active.
						// Stopped automatically when the async pipe unsubscribes on destroy.
						const inProgress = this.patchNotesList
							.filter((note: any) => note.status === STATUS_IN_PROGRESS)
							.map((note: any) => ({
								component: note.component,
								element: note.element,
								details: note.details
							}));
						this.databaseService.updateStatisticsFields({ patchInProgress: inProgress });
					});
				})
			);
		}

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
	 * Update the isMobile flag when the window is resized.
	 */
	@HostListener('window:resize')
	protected onResize() {
		if (isPlatformBrowser(this.platformId)) {
			this.isMobile = this.utilities.isMobile();
		}
	}

	/**
	 * Clears any open dialog from the view container and logs the component
	 * destruction event. The async pipe on `patchNotes$` tears down the
	 * CloudBase watcher automatically when the view is destroyed.
	 */
	public ngOnDestroy() {
		this.dialogComponentContainer?.clear();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	/**
	 * Save a snapshot of the original row data and begin editing the row.
	 *
	 * @param row - The row to start editing.
	 */
	public async startEdit(row: any) {
		if (!Utilities.checkPermission(row._openid)) {
			this.dialogService.showPermissionError(this.dialogComponentContainer);
			return;
		}
		const parts = (row.timestamp ?? '').split('.');
		const timestampDate =
			parts.length === 3 ? new Date(+parts[0], +parts[1] - 1, +parts[2]) : new Date();
		this.editedRows.set(row.key, { original: { ...row }, updated: { ...row, timestampDate } });
	}

	/**
	 * Compare the edited row against its snapshot and persist any changes
	 * to the database, then remove the row from the editing state.
	 *
	 * @param row - The row to complete editing.
	 */
	public async completeEdit(row: any) {
		const record = this.editedRows.get(row.key);
		const changes: any = {};

		if (record.original.component !== record.updated.component) {
			changes.component = record.updated.component;
		}
		if (record.original.details !== record.updated.details.trim()) {
			changes.details = record.updated.details.trim();
		}
		if (record.original.status !== record.updated.status) {
			changes.status = record.updated.status;
		}
		const d: Date = record.updated.timestampDate;
		const formattedTs = d
			? `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
			: record.original.timestamp;
		if (formattedTs !== record.original.timestamp) {
			changes.timestamp = formattedTs;
		}

		if (Object.keys(changes).length > 0) {
			await this.databaseService.updateExistingRecordToPatchNotes(row.key, changes);

			// Fire-and-forget: record the edit type in stats for the Recent Activity widget.
			const noteIndex = this.patchNotesList.findIndex((n) => n.key === row.key) + 1;
			const ts = Utilities.getCurrentFormattedTime(true);
			if (changes.status) {
				this.databaseService
					.appendToPatchActivityLog({
						type: ACTIVITY_TYPE_STATUS_CHANGED,
						component: row.component,
						element: record.original.element,
						fromStatus: record.original.status,
						toStatus: changes.status,
						noteIndex,
						timestamp: ts
					})
					.catch(() => {});
			} else if (changes.details) {
				this.databaseService
					.appendToPatchActivityLog({
						type: ACTIVITY_TYPE_EDITED,
						component: row.component,
						element: record.original.element,
						noteIndex,
						timestamp: ts
					})
					.catch(() => {});
			}
		}

		this.editedRows.delete(row.key);
	}

	/**
	 * Clear the status field of the new record form.
	 */
	protected clearStatusField() {
		this.newRecord.status = undefined;
	}

	/**
	 * Submit the new record form data to the database and reset the form.
	 * Captures a snapshot of the record before resetting so the stats update
	 * can include the correct noteIndex and metadata after the async add.
	 */
	protected submitNewRecord() {
		const d = this.newRecordDate;
		this.newRecord.timestamp = d
			? `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
			: Utilities.getCurrentFormattedTime(false);
		this.newRecord.status = this.newRecord.status?.['severity'];
		const snapshot = { ...this.newRecord };
		const noteIndex = this.patchNotesList.length + 1;
		this.databaseService
			.addNewRecordToPatchNotes(snapshot)
			.then(() => {
				// Fire-and-forget: write the Recent Activity stat with the correct
				// 1-based index (patchNotesList doesn't include the new note yet).
				this.databaseService
					.appendToPatchActivityLog({
						type: !!snapshot.isBug ? ACTIVITY_TYPE_BUG_LOGGED : HISTORY_STATUS_ADDED,
						component: snapshot.component,
						element: snapshot.element,
						isBug: !!snapshot.isBug,
						noteIndex,
						timestamp: Utilities.getCurrentFormattedTime(true)
					})
					.catch(() => {});
			})
			.catch(() => this.dialogService.showUnexpectedError(this.dialogComponentContainer));
		this.newRecord = {
			key: '',
			component: '',
			element: '',
			details: '',
			status: undefined,
			timestamp: '',
			isBug: false
		};
		this.newRecordDate = new Date();
	}

	/**
	 * Triggered by the "Delete" button click event on the "Patch Notes" page
	 *
	 * @param key key of the patch note to be removed
	 */
	protected openDeleteConfirmationDialog(key: string) {
		// Capture note identity before the dialog opens — the list may have changed by
		// the time the user confirms.
		const noteToDelete = this.patchNotesList.find((n) => n.key === key);
		const noteIndex = this.patchNotesList.findIndex((n) => n.key === key) + 1;

		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_CONFIRM,
			async () => {
				try {
					await this.databaseService.removePatchNote(key);
					// Fire-and-forget: record the deletion in stats for the Recent Activity widget.
					this.databaseService
						.appendToPatchActivityLog({
							type: HISTORY_STATUS_DELETED,
							component: noteToDelete?.component ?? '',
							element: noteToDelete?.element ?? '',
							noteIndex,
							timestamp: Utilities.getCurrentFormattedTime(true)
						})
						.catch(() => {});
				} catch (error) {
					this.dialogService.showUnexpectedError(this.dialogComponentContainer);
				}
			},
			['Are you sure you want to delete this note?', 'Confirm', 'Delete']
		);
	}

	/**
	 * Called by p-table's (onPage).
	 * This is the ONLY place where _savedFirst should be updated via UI interaction.
	 * It ensures that when a user manually clicks a page, we remember it as the
	 * new "Safe Zone" to return to during background data updates.
	 */
	protected pageChange(event: any) {
		this._savedFirst = event.first;
		this.indexOfFirstItem = event.first;
	}

	/**
	 * Called by p-table's (onFilter) every time PrimeNG's internal _filter() runs.
	 *
	 * WHY THIS EXISTS
	 * ───────────────
	 * When data is pushed via CloudBase, PrimeNG triggers _filter(). Even with no
	 * active user filters, it resets internal 'first' to 0.
	 * * This method performs a "Synchronous Hijack":
	 * If _isDataUpdate is true, it immediately overwrites the table's 'first'
	 * property with our _savedFirst value before the function returns. This
	 * prevents the UI from ever rendering Page 1, eliminating the "flicker"
	 * or "clip" entirely.
	 */
	protected onTableFilter() {
		if (!this._isDataUpdate) return;

		// Force the table instance AND the local index to match our source of truth
		if (this.table) {
			this.table.first = this._savedFirst;
			this.indexOfFirstItem = this._savedFirst;
		}

		// Reset the flag so manual user filtering works as intended
		this._isDataUpdate = false;
	}

	/**
	 * Calculate the rowspan for a component cell by counting consecutive rows
	 * that share the same component value.
	 *
	 * @param data - The table data array.
	 * @param rowIndex - The starting row index.
	 * @returns The number of consecutive rows with the same component.
	 */
	protected getComponentRowSpan(data: any[], rowIndex: number) {
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
	 * Calculate the rowspan for an element cell by counting consecutive rows
	 * that share the same element and component values.
	 *
	 * @param data - The table data array.
	 * @param rowIndex - The starting row index.
	 * @returns The number of consecutive rows with the same element.
	 */
	protected getElementRowSpan(data: any[], rowIndex: number) {
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
	 * Determine whether to show the component column for a given row.
	 * Returns true for the first row of each new component group.
	 *
	 * @param data - The table data array.
	 * @param rowIndex - The row index to check.
	 * @returns true if the component column should be displayed.
	 */
	protected shouldShowComponent(data: any[], rowIndex: number) {
		if (rowIndex === 0 || rowIndex === this.indexOfFirstItem) return true;
		return data[rowIndex].component !== data[rowIndex - 1].component;
	}

	/**
	 * Determine whether to show the element column for a given row.
	 * Returns true for the first row of each new element group.
	 *
	 * @param data - The table data array.
	 * @param rowIndex - The row index to check.
	 * @returns true if the element column should be displayed.
	 */
	protected shouldShowElement(data: any[], rowIndex: number) {
		if (rowIndex === 0 || rowIndex === this.indexOfFirstItem) return true;
		return (
			data[rowIndex].element !== data[rowIndex - 1].element ||
			data[rowIndex].component !== data[rowIndex - 1].component
		);
	}

	/**
	 * Get the currently rendered data array from a PrimeNG table data object,
	 * falling back from filtered value to raw value to an empty array.
	 *
	 * @param data - The PrimeNG table data object.
	 * @returns The rendered data array.
	 */
	protected getRenderedData(data: any) {
		return data.filteredValue ?? data.value ?? [];
	}

	/**
	 * Check whether the given row belongs to the same component group as
	 * the currently hovered row.
	 *
	 * @param data - The table data array.
	 * @param rowIndex - The row index to check.
	 * @returns true if the row shares the same component as the hovered row.
	 */
	protected isInSameComponentGroup(data: any[], rowIndex: number): boolean {
		if (this.hoveredRowIndex === null) return false;
		return data[rowIndex]?.component === data[this.hoveredRowIndex]?.component;
	}

	/**
	 * Check whether the given row belongs to the same element group as
	 * the currently hovered row (same component and same element).
	 *
	 * @param data - The table data array.
	 * @param rowIndex - The row index to check.
	 * @returns true if the row shares the same component and element as the hovered row.
	 */
	protected isInSameElementGroup(data: any[], rowIndex: number): boolean {
		if (this.hoveredRowIndex === null) return false;
		const thisRow = data[rowIndex];
		const hoveredRow = data[this.hoveredRowIndex];
		return thisRow?.component === hoveredRow?.component && thisRow?.element === hoveredRow?.element;
	}

	// This is only used to add a border outline for ressolved bug
	/**
	 * Get the CSS class for a severity tag based on its status.
	 *
	 * @param status - The status value.
	 * @returns The CSS class name for the severity tag.
	 */
	protected getSeverityClass(status: string) {
		switch (status) {
			case STATUS_RESOLVED:
				return 'tag-debug-success';
			default:
				return '';
		}
	}

	/**
	 * Get the PrimeNG severity level for a tag based on the patch note status.
	 *
	 * @param status - The patch note status.
	 * @returns The PrimeNG tag severity value.
	 */
	protected getSeverity(status: string) {
		switch (status) {
			case STATUS_TODO:
				return 'info';
			case STATUS_IN_PROGRESS:
				return 'warn';
			case STATUS_COMPLETED:
			case STATUS_RESOLVED:
				return 'success';
			case STATUS_DEBUG:
				return 'danger';
			case STATUS_DRAFT:
				return 'secondary';
			default:
				return undefined;
		}
	}

	/**
	 * Get the PrimeNG icon class for a tag based on the patch note status.
	 *
	 * @param status - The patch note status.
	 * @returns The PrimeNG icon CSS class.
	 */
	protected getSeverityIcon(status: string) {
		switch (status) {
			case STATUS_TODO:
				return 'pi pi-hourglass';
			case STATUS_IN_PROGRESS:
				return 'pi pi-play';
			case STATUS_COMPLETED:
			case STATUS_RESOLVED:
				return 'pi pi-verified';
			case STATUS_DEBUG:
				return 'pi pi-exclamation-triangle';
			case STATUS_DRAFT:
				return 'pi pi-pencil';
			default:
				return undefined;
		}
	}

	/**
	 * All available components that can be selected in the add-entry dropdown.
	 *
	 * `icon` holds the ligature name used as text content for Material Icons /
	 * Material Symbols (e.g. `'tv'`, `'home'`). PrimeIcons render purely via
	 * CSS pseudo-elements and require no text content, so their `icon` value is
	 * intentionally an empty string — the full icon definition lives in
	 * `iconClass` (e.g. `'pi pi-user'`).
	 */
	protected readonly components: { label: string; icon: string; iconClass: string }[] = [
		{ label: 'Entertainment', icon: 'tv', iconClass: 'material-icons' },
		{ label: 'Home', icon: 'home', iconClass: 'material-icons' },
		{ label: 'Nexus', icon: 'neurology', iconClass: 'material-symbols-outlined' },
		{ label: 'Patch Notes', icon: 'note_stack', iconClass: 'material-symbols-outlined' },
		{ label: 'Login', icon: '', iconClass: 'pi pi-user' }, // pi icon — CSS only, no ligature text
		{ label: 'Recipe', icon: 'restaurant', iconClass: 'material-symbols-outlined' },
		{ label: 'Reminder', icon: 'priority', iconClass: 'material-symbols-outlined' },
		{ label: 'Resonance', icon: 'format_quote', iconClass: 'material-symbols-outlined' },
		{ label: 'About', icon: 'info', iconClass: 'material-symbols-outlined' },
		{ label: 'All Pages', icon: 'web', iconClass: 'material-icons' },
	];

	/**
	 * Looks up a component option object by label string.
	 *
	 * Accepts both a plain string and a full option object because PrimeNG's
	 * `p-select` passes the full option object into the `#selectedItem` template
	 * even when `optionValue="label"` is set (the binding affects the `ngModel`
	 * value, not what the template slot receives).
	 *
	 * @param label - The component label string, or a full option object with a
	 *   `label` property (e.g. from the PrimeNG selectedItem template context).
	 * @returns The matching option object, or `null` if not found.
	 */
	protected getComponentOption(label: string | { label: string } | any) {
		const key = typeof label === 'string' ? label : (label?.label ?? '');
		return this.components.find((c) => c.label === key) ?? null;
	}

	protected newRecord = {
		key: '',
		component: '',
		element: '',
		details: '',
		status: undefined,
		timestamp: '',
		isBug: false
	};
	protected newRecordDate: Date = new Date();
}
