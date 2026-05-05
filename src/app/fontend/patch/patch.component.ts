import {
	Component,
	HostListener,
	Inject,
	NgZone,
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
import { FormsModule } from '@angular/forms';
import { Utilities } from '../../common/app.utilities';
import {
	COMPONENT_DESTROY,
	DATABASE_PATCH_NOTES,
	ERROR_PERMISSION_DENIED,
	FAILURE,
	STATUS_COMPLETED,
	STATUS_DEBUG,
	STATUS_DRAFT,
	STATUS_IN_PROGRESS,
	STATUS_RESOLVED,
	STATUS_TODO,
	SUCCESS
} from '../../common/app.constant';
import { map, Observable, tap } from 'rxjs';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LOG } from '../../common/app.logs';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { CheckboxModule } from 'primeng/checkbox';
import { PaginatorModule } from 'primeng/paginator';
import { DatabaseService } from '../../backend/database-service/database.service';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';

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
		CheckboxModule
	],
	templateUrl: './patch.component.html',
	styleUrl: './patch.component.css'
})
export class PatchComponent {
	private readonly className = 'PatchComponent';
	@ViewChild('t') table!: Table; // This is the reference for the table in html
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
	/** The page (first-item index) the user intends to be on. Updated by user navigation and add/delete logic. */
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
		private utilities: Utilities,
		private ngZone: NgZone
	) {}

	async ngOnInit() {
		if (isPlatformBrowser(this.platformId) && CloudbaseService.getUseId()) {
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
						if (prevLength !== null && data.length > prevLength) {
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

	ngOnDestroy() {
		this.dialogComponentContainer?.clear();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	/**
	 * Save a snapshot of the original row data and begin editing the row.
	 *
	 * @param row - The row to start editing.
	 */
	async startEdit(row: any) {
		const result = this.checkPermission(row._openid);
		if (result === FAILURE) return;

		this.editedRows.set(row.key, { original: { ...row }, updated: { ...row } });
	}

	/**
	 * Compare the edited row against its snapshot and persist any changes
	 * to the database, then remove the row from the editing state.
	 *
	 * @param row - The row to complete editing.
	 */
	async completeEdit(row: any) {
		const record = this.editedRows.get(row.key);
		const changes: any = {};

		/*
        This one is not needed as we are not updating the element name

        if (record.original.element !== record.updated.element.trim()) {
		 	changes.element = record.updated.element.trim();
         }
         */

		if (record.original.details !== record.updated.details.trim()) {
			changes.details = record.updated.details.trim();
		}
		if (record.original.status !== record.updated.status) {
			changes.status = record.updated.status;
		}

		if (Object.keys(changes).length > 0) {
			changes.timestamp = this.utilities.getCurrentFormattedTime(false);
			await this.databaseService.updateExistingRecordToPatchNotes(row.key, changes);
		}

		this.editedRows.delete(row.key);
	}

	/**
	 * Clear the status field of the new record form.
	 */
	clearStatusField() {
		this.newRecord.status = undefined;
	}

	/**
	 * Submit the new record form data to the database and reset the form.
	 */
	submitNewRecord() {
		// Inject the current timestamp before submit; status is unwrapped from
		// the PrimeNG select object via ['severity'] to get the raw string value.
		this.newRecord.timestamp = this.utilities.getCurrentFormattedTime(false);
		this.newRecord.status = this.newRecord.status?.['severity'];
		this.databaseService
			.addNewRecordToPatchNotes(this.newRecord)
			.catch(() => this.openUnexpectedErrorDialog());
		this.newRecord = {
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
	 * Triggered by the "Delete" button click event on the "Patch Notes" page
	 *
	 * @param key key of the patch note to be removed
	 */
	protected openDeleteConfirmationDialog(key: string) {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			'confirm',
			async () => {
				try {
					await this.databaseService.removeSingleItemFromDatabase(DATABASE_PATCH_NOTES, key);
				} catch (error) {
					this.openUnexpectedErrorDialog();
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
	getComponentRowSpan(data: any[], rowIndex: number) {
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
	getElementRowSpan(data: any[], rowIndex: number) {
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
	shouldShowComponent(data: any[], rowIndex: number) {
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
	shouldShowElement(data: any[], rowIndex: number) {
		if (rowIndex === 0 || rowIndex === this.indexOfFirstItem) return true;
		return (
			data[rowIndex].element !== data[rowIndex - 1].element ||
			data[rowIndex].component !== data[rowIndex - 1].component
		);
	}

	/**
	 * Check whether the current user has permission to modify the given row
	 * by comparing the row owner ID against the signed-in user's ID.
	 * Users with all rights bypass this check.
	 *
	 * @param openid - The owner ID of the row to check.
	 * @returns SUCCESS if permitted, FAILURE otherwise (after showing an error dialog).
	 */
	// Admins bypass all permission checks; for others, compare the entry's _openid
	// against the current user's ID. Permission denied shows the error dialog directly.
	private checkPermission(openid: string) {
		if (CloudbaseService.userHasAllRights()) return;
		try {
			if (openid !== CloudbaseService.getUseId()) throw new Error(ERROR_PERMISSION_DENIED);
			return SUCCESS;
		} catch (error) {
			if (error instanceof Error && error.message === ERROR_PERMISSION_DENIED) {
				this.openErrorDialog();
			} else {
				this.openUnexpectedErrorDialog();
			}
			return FAILURE;
		}
	}

	/**
	 * Open error confirmation dialog
	 */
	private openErrorDialog() {
		this.dialogService.showPermissionError(this.dialogComponentContainer);
	}

	/**
	 * Open a dialog informing the user that an unexpected error has occurred.
	 */
	private openUnexpectedErrorDialog() {
		this.dialogService.showUnexpectedError(this.dialogComponentContainer);
	}

	/**
	 * Get the currently rendered data array from a PrimeNG table data object,
	 * falling back from filtered value to raw value to an empty array.
	 *
	 * @param data - The PrimeNG table data object.
	 * @returns The rendered data array.
	 */
	getRenderedData(data: any) {
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
	isInSameComponentGroup(data: any[], rowIndex: number): boolean {
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
	isInSameElementGroup(data: any[], rowIndex: number): boolean {
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
	getSeverityClass(status: string) {
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
	getSeverity(status: string) {
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
	getSeverityIcon(status: string) {
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

	protected newRecord = {
		key: '',
		component: '',
		element: '',
		details: '',
		status: undefined,
		timestamp: '',
		isBug: false
	};
}
