import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { Subscription } from 'rxjs';
import { DatabaseService } from '../../database-service/database.service';
import { Utilities } from '../../../common/app.utilities';
import {
	LINK_DIALOG_LABEL_ADD,
	LINK_DIALOG_LABEL_CANCEL,
	LINK_DIALOG_LABEL_SAVE,
	LINK_DIALOG_LABEL_TITLE_LOADING,
	PORTAL_DIALOG_TITLE_ADD_LINK,
	PORTAL_DIALOG_TITLE_EDIT_LINK,
	PORTAL_LABEL_PIN_TO_DASHBOARD
} from '../../../common/app.constant';
import { PortalCategory, NewLinkData } from '../../../fontend/portal/portal.model';

@Component({
	selector: 'add-link-dialog',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [DialogModule, FormsModule, SelectModule],
	templateUrl: './add-link.component.html',
	styleUrl: './add-link.component.scss'
})
export class AddLinkDialogComponent implements OnInit, OnDestroy {
	@Output() closed$ = new EventEmitter<void>();

	protected readonly LINK_DIALOG_LABEL_ADD = LINK_DIALOG_LABEL_ADD;
	protected readonly LINK_DIALOG_LABEL_CANCEL = LINK_DIALOG_LABEL_CANCEL;
	protected readonly LINK_DIALOG_LABEL_SAVE = LINK_DIALOG_LABEL_SAVE;
	protected readonly LINK_DIALOG_LABEL_TITLE_LOADING = LINK_DIALOG_LABEL_TITLE_LOADING;
	protected readonly PORTAL_DIALOG_TITLE_ADD_LINK = PORTAL_DIALOG_TITLE_ADD_LINK;
	protected readonly PORTAL_DIALOG_TITLE_EDIT_LINK = PORTAL_DIALOG_TITLE_EDIT_LINK;
	protected readonly PORTAL_LABEL_PIN_TO_DASHBOARD = PORTAL_LABEL_PIN_TO_DASHBOARD;

	protected isEditMode = false;
	protected visible = false;
	protected categories: PortalCategory[] = [];
	protected faviconPreview = '';
	protected metaLoading = false;
	protected url = '';
	protected title = '';
	protected category = '';
	protected isPinned = false;
	private submitCallback?: (formData: NewLinkData) => void;
	private categoriesSub?: Subscription;
	private lastFetchedUrl = '';

	constructor(
		private readonly databaseService: DatabaseService,
		private readonly cdr: ChangeDetectorRef
	) {}

	/**
	 * Subscribes to the link categories stream so the dropdown is populated
	 * as soon as the dialog is created by DialogService.
	 */
	ngOnInit(): void {
		this.categoriesSub = this.databaseService.getLinkCategories().subscribe({
			next: (categories) => {
				this.categories = Utilities.sortByOrder(categories) as PortalCategory[];
				this.cdr.markForCheck();
			}
		});
	}

	/**
	 * Unsubscribes from the categories stream when DialogService destroys the component.
	 */
	ngOnDestroy(): void {
		this.categoriesSub?.unsubscribe();
	}

	/**
	 * Opens the dialog in add mode (null prefill) or edit mode (object prefill).
	 * Stores the submit callback and pre-populates or resets form fields accordingly.
	 *
	 * @param submitCallback - The callback invoked with the validated form data on submit.
	 * @param prefillData - Prefill values for edit mode, or null for add mode.
	 */
	public openDialog(
		submitCallback: (formData: NewLinkData) => void,
		prefillData: Partial<NewLinkData> | null
	): void {
		this.submitCallback = submitCallback;
		this.isEditMode = prefillData !== null;
		this.resetFields();
		if (prefillData) {
			this.url = prefillData.url ?? '';
			this.title = prefillData.title ?? '';
			this.category = prefillData.category ?? '';
			this.isPinned = prefillData.isPinned ?? false;
			this.faviconPreview = this.url ? Utilities.getFavicon(this.url) : '';
		}
		this.metaLoading = false;
		this.visible = true;
	}

	/**
	 * Resets all form fields to their empty defaults.
	 * Called unconditionally on every dialog open so stale state from a previous
	 * session is never visible when the dialog re-opens in add mode.
	 */
	private resetFields(): void {
		this.url = '';
		this.title = '';
		this.category = '';
		this.isPinned = false;
		this.faviconPreview = '';
		this.lastFetchedUrl = '';
	}

	/**
	 * Returns true when the form has enough valid data to submit.
	 * URL, title, and category are all required.
	 *
	 * @returns True when the URL, title, and category fields are all non-empty.
	 */
	protected get isValid(): boolean {
		return this.url.trim().length > 0 && this.title.trim().length > 0 && this.category.length > 0;
	}

	/**
	 * Normalizes the entered URL, updates the favicon preview, and fetches the
	 * page title when the URL field is confirmed via Enter or blur.
	 * Auto-fetch is skipped when a title exists, a fetch is in progress, or the
	 * same URL was already fetched in this dialog session.
	 */
	protected onUrlConfirm(): void {
		const rawUrl = this.url.trim();
		if (!rawUrl) return;
		const normalizedUrl = Utilities.normalizeUrl(rawUrl);
		this.url = normalizedUrl;
		this.faviconPreview = Utilities.getFavicon(normalizedUrl);
		if (this.title || this.metaLoading || this.lastFetchedUrl === normalizedUrl) return;
		this.metaLoading = true;
		this.databaseService
			.proxyFetch(normalizedUrl)
			.then((result) => {
				const match = result.content?.match(/<title[^>]*>([^<]+)<\/title>/i);
				if (match?.[1]) this.title = match[1].trim();
				this.lastFetchedUrl = normalizedUrl;
				this.metaLoading = false;
				this.cdr.markForCheck();
			})
			.catch(() => {
				this.metaLoading = false;
			});
	}

	/**
	 * Validates the form, invokes the submit callback with the collected
	 * link data, and closes the dialog.
	 */
	protected onSubmit(): void {
		if (!this.isValid) return;
		const formData: NewLinkData = {
			url: Utilities.normalizeUrl(this.url),
			title: this.title.trim(),
			category: this.category,
			isPinned: this.isPinned
		};
		this.onDialogClosed();
		this.submitCallback?.(formData);
	}

	/**
	 * Closes the dialog and emits the closed event so DialogService can
	 * destroy the component and remove it from the open-dialogs map.
	 */
	protected onDialogClosed(): void {
		this.visible = false;
		this.closed$.emit();
	}
}
