import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { Component, HostListener, Inject, PLATFORM_ID, ViewChild, ViewContainerRef } from '@angular/core';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import {
	CN,
	COMPONENT_DESTROY,
	STATUS_COMPLETED,
	STATUS_DEBUG,
	STATUS_DRAFT,
	STATUS_IN_PROGRESS,
	STATUS_RESOLVED,
	STATUS_TODO,
	Utilities
} from '../../common/app.utilities';
import { FirebaseService } from '../../backend/database-service/firebase/firebase.service';
import { map, Observable, shareReplay, tap } from 'rxjs';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LOG } from '../../common/app.logs';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { CheckboxModule } from 'primeng/checkbox';
import { PaginatorModule } from 'primeng/paginator';

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
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	protected isLoggedIn!: boolean;
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
	protected newRecord = {
		key: '',
		component: '',
		element: '',
		details: '',
		status: undefined,
		timestamp: '',
		isBug: false
	};
	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		private firebaseService: FirebaseService,
		private cloudbaseService: CloudbaseService,
		private dialogService: DialogService,
		private utilities: Utilities
	) {
		if (isPlatformBrowser(this.platformId)) {
			this.isLoggedIn = JSON.parse(localStorage.getItem('permission') || 'false');
		}
	}

	async ngOnInit() {
		if (isPlatformBrowser(this.platformId) && this.isLoggedIn) {
			this.isMobile = this.utilities.isMobile();

			const getObservable$ =
				this.utilities.getCurrentRegion() === CN
					? this.cloudbaseService.getPatchNotes()
					: this.firebaseService.getPatchNotes();

			this.patchNotes$ = getObservable$.pipe(
				map((data) => {
					return this.isMobile ? data : [...data, { __dummy: true }];
				}),
				tap((data) => {
					this.loading = false;

					let targetIndex = this.indexOfFirstItem;
					if (targetIndex >= data.length && targetIndex > 0) {
						targetIndex = Math.max(0, targetIndex - 9);
					}

					this.indexOfFirstItem = -1;

					setTimeout(() => {
						this.indexOfFirstItem = targetIndex;
					});
				}),
				// ShareReply should be removed as it was used to share the subscription between multiple callers
				// Leave it here for later references
				shareReplay(1)
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

	startEdit(row: any) {
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
			await this.firebaseService.updateExistingRecordToPatchNotes(row.key, changes);
		}

		this.editedRows.delete(row.key);
	}

	clearStatusField() {
		this.newRecord.status = undefined;
	}

	submitNewRecord() {
		this.newRecord.timestamp = this.utilities.getCurrentFormattedTime(false);
		this.newRecord.status = this.newRecord.status?.['severity'];
		this.firebaseService.addNewRecordToPatchNotes(this.newRecord);
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
			() => {
				this.firebaseService.removePatchNotes(key);
			},
			['Are you sure you want to delete this note?', 'Confirm', 'Delete', 'Record deleted', true]
		);
	}

	protected pageChange(event: any) {
		this.indexOfFirstItem = event.first;
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

	getRenderedData(data: any) {
		return data.filteredValue ?? data.value ?? [];
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
}
