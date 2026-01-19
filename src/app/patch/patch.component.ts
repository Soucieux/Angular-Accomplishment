import { Component, Inject, PLATFORM_ID, ViewChild, ViewContainerRef } from '@angular/core';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import {
	COMPONENT_DESTROY,
	STATUS_COMPLETED,
	STATUS_DEBUG,
	STATUS_DRAFT,
	STATUS_IN_PROGRESS,
	STATUS_RESOLVED,
	STATUS_TODO,
	Utilities
} from '../app.utilities';
import { FirebaseService } from '../service/firebase-service/firebase.service';
import { map, Observable, shareReplay, take, tap } from 'rxjs';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LOG } from '../app.logs';
import { DialogService } from '../service/dialog-service/dialog.service';
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
	protected patchNotes$!: Observable<any[]>;
	protected pagedPatchNotes$!: Observable<any[]>;
	protected patchNotesLength$!: Observable<number>;
	protected indexOfFirstItem = 0;
	protected itemsPerPage = 8;
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
		private dialogService: DialogService,
		private utilities: Utilities
	) {
		if (isPlatformBrowser(this.platformId)) {
			this.isLoggedIn = JSON.parse(localStorage.getItem('permission') || 'false');
		}
	}

	async ngOnInit() {
		if (isPlatformBrowser(this.platformId) && this.isLoggedIn) {
			this.patchNotes$ = this.firebaseService.getPatchNotes().pipe(
				tap(() => (this.loading = false)),
				shareReplay(1)
			);

			this.patchNotesLength$ = this.patchNotes$.pipe(map((notes) => notes.length));

			this.pagedPatchNotes$ = this.patchNotes$.pipe(
				map((notes) => notes.slice(this.indexOfFirstItem, this.indexOfFirstItem + this.itemsPerPage))
			);
		}

		this.severity = [
			{ severity: STATUS_TODO },
			{ severity: STATUS_IN_PROGRESS },
			{ severity: STATUS_COMPLETED },
			{ severity: STATUS_DRAFT }
		];

		this.bugSeverity = [{ severity: STATUS_DEBUG }, { severity: STATUS_RESOLVED }];
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
		if (record.original.element !== record.updated.element.trim()) {
			changes.element = record.updated.element.trim();
		}
		if (record.original.details !== record.updated.details.trim()) {
			changes.details = record.updated.details.trim();
		}
		if (record.original.status !== record.updated.status) {
			changes.status = record.updated.status;
		}

		if (Object.keys(changes).length > 0) {
			changes.timestamp = this.utilities.getCurrentFormattedTime(false);
			await this.firebaseService.updateNewRecordToPatchNotes(row.key, changes);
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
			'delete',
			() => {
				this.firebaseService.removePatchNotes(key);
			},
			`Are you sure you want to delete this note?`,
			`Delete Note`
		);
	}

	protected pageChange(event: any) {
		this.indexOfFirstItem = event.first;
		this.pagedPatchNotes$ = this.patchNotes$.pipe(
			map((notes) => notes.slice(this.indexOfFirstItem, this.indexOfFirstItem + this.itemsPerPage))
		);
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
				return null;
			default:
				return undefined;
		}
	}
}
