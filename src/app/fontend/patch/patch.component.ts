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
				}),
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

	async startEdit(row: any) {
		const result = this.checkPermission(row._openid);
		if (result === FAILURE) return;

		this.editedRows.set(row.key, { original: { ...row }, updated: { ...row } });
	}

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

	clearStatusField() {
		this.newRecord.status = undefined;
	}

	submitNewRecord() {
		this.newRecord.timestamp = this.utilities.getCurrentFormattedTime(false);
		this.newRecord.status = this.newRecord.status?.['severity'];
		this.databaseService.addNewRecordToPatchNotes(this.newRecord).catch(() => this.openUnexpectedErrorDialog());
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
			['Are you sure you want to delete this note?', 'Confirm', 'Delete', 'Record deleted', true]
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

	shouldShowComponent(data: any[], rowIndex: number) {
		if (rowIndex === 0 || rowIndex === this.indexOfFirstItem) return true;
		return data[rowIndex].component !== data[rowIndex - 1].component;
	}

	shouldShowElement(data: any[], rowIndex: number) {
		if (rowIndex === 0 || rowIndex === this.indexOfFirstItem) return true;
		return (
			data[rowIndex].element !== data[rowIndex - 1].element ||
			data[rowIndex].component !== data[rowIndex - 1].component
		);
	}

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

	private openUnexpectedErrorDialog() {
		this.dialogService.showUnexpectedError(this.dialogComponentContainer);
	}

	getRenderedData(data: any) {
		return data.filteredValue ?? data.value ?? [];
	}

	isInSameComponentGroup(data: any[], rowIndex: number): boolean {
		if (this.hoveredRowIndex === null) return false;
		return data[rowIndex]?.component === data[this.hoveredRowIndex]?.component;
	}

	isInSameElementGroup(data: any[], rowIndex: number): boolean {
		if (this.hoveredRowIndex === null) return false;
		const thisRow = data[rowIndex];
		const hoveredRow = data[this.hoveredRowIndex];
		return thisRow?.component === hoveredRow?.component && thisRow?.element === hoveredRow?.element;
	}

	// This is only used to add a border outline for ressolved bug
	getSeverityClass(status: string) {
		switch (status) {
			case STATUS_RESOLVED:
				return 'tag-debug-success';
			default:
				return '';
		}
	}

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
