import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { Subscription } from 'rxjs';
import { DatabaseService } from '../../database-service/database.service';
import { Utilities } from '../../../common/utilities/app.utilities';
import {
	ADD_LINK_LABEL_URL,
	ADD_LINK_PLACEHOLDER_URL
} from '../../../common/constants';
import {
	LABEL_ADD_LINK,
	DIALOG_BTN_CANCEL,
	DIALOG_BTN_SAVE,
	LINK_DIALOG_LABEL_TITLE_LOADING,
	PORTAL_DIALOG_TITLE_ADD_LINK,
	PORTAL_DIALOG_TITLE_EDIT_LINK,
	PORTAL_LABEL_PIN_TO_DASHBOARD,
	PORTAL_LABEL_SHARED_LINK,
	ADD_LINK_LABEL_LOADING,
	ADD_LINK_LABEL_TITLE,
	ADD_LINK_PLACEHOLDER_NAME,
	ADD_LINK_LABEL_CATEGORY,
	ADD_LINK_LABEL_CATEGORY_OPTIONAL,
	ADD_LINK_HINT_CATEGORY_SHARED,
	ADD_LINK_PLACEHOLDER_CATEGORY
} from '../../../common/locale/locale-strings';
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

	protected readonly LABEL_ADD_LINK = LABEL_ADD_LINK;
	protected readonly DIALOG_BTN_CANCEL = DIALOG_BTN_CANCEL;
	protected readonly DIALOG_BTN_SAVE = DIALOG_BTN_SAVE;
	protected readonly LINK_DIALOG_LABEL_TITLE_LOADING = LINK_DIALOG_LABEL_TITLE_LOADING;
	protected readonly PORTAL_DIALOG_TITLE_ADD_LINK = PORTAL_DIALOG_TITLE_ADD_LINK;
	protected readonly PORTAL_DIALOG_TITLE_EDIT_LINK = PORTAL_DIALOG_TITLE_EDIT_LINK;
	protected readonly PORTAL_LABEL_PIN_TO_DASHBOARD = PORTAL_LABEL_PIN_TO_DASHBOARD;
	protected readonly PORTAL_LABEL_SHARED_LINK = PORTAL_LABEL_SHARED_LINK;
	protected readonly ADD_LINK_LABEL_URL = ADD_LINK_LABEL_URL;
	protected readonly ADD_LINK_PLACEHOLDER_URL = ADD_LINK_PLACEHOLDER_URL;
	protected readonly ADD_LINK_LABEL_LOADING = ADD_LINK_LABEL_LOADING;
	protected readonly ADD_LINK_LABEL_TITLE = ADD_LINK_LABEL_TITLE;
	protected readonly ADD_LINK_PLACEHOLDER_NAME = ADD_LINK_PLACEHOLDER_NAME;
	protected readonly ADD_LINK_LABEL_CATEGORY = ADD_LINK_LABEL_CATEGORY;
	protected readonly ADD_LINK_LABEL_CATEGORY_OPTIONAL = ADD_LINK_LABEL_CATEGORY_OPTIONAL;
	protected readonly ADD_LINK_HINT_CATEGORY_SHARED = ADD_LINK_HINT_CATEGORY_SHARED;
	protected readonly ADD_LINK_PLACEHOLDER_CATEGORY = ADD_LINK_PLACEHOLDER_CATEGORY;

	protected isEditMode = false;
	protected visible = false;
	protected categories: PortalCategory[] = [];
	protected faviconPreview = '';
	protected metaLoading = false;
	protected url = '';
	protected title = '';
	protected category = '';
	protected isPinned = false;
	protected isShared = false;
	private submitCallback?: (formData: NewLinkData) => void | Promise<void>;
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
		submitCallback: (formData: NewLinkData) => void | Promise<void>,
		prefillData: Partial<NewLinkData> | null
	): void {
		// Step 1: Wire up the callback and determine whether this is an add or edit session
		this.submitCallback = submitCallback;
		this.isEditMode = prefillData !== null;

		// Step 2: Always reset first so stale values from a previous session cannot leak into add mode
		this.resetFields();

		// Step 3: Populate fields from prefill data — favicon is derived from the URL, not stored separately
		if (prefillData) {
			this.url = prefillData.url ?? '';
			this.title = prefillData.title ?? '';
			this.category = prefillData.category ?? '';
			this.isPinned = prefillData.isPinned ?? false;
			this.isShared = prefillData.isShared ?? false;
			this.faviconPreview = this.url ? Utilities.getBrandLogoUrl(this.url) : '';
		}

		// Step 4: Clear any in-flight loading state from the previous session before making the dialog visible
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
		this.isShared = false;
		this.faviconPreview = '';
		this.lastFetchedUrl = '';
	}

	/**
	 * Returns true when the form has enough valid data to submit.
	 * URL and title are always required; category is required unless the link is shared.
	 *
	 * @returns True when the URL and title are non-empty, and category is set or the link is shared.
	 */
	protected get isValid(): boolean {
		return (
			this.url.trim().length > 0 &&
			this.title.trim().length > 0 &&
			(this.isShared || this.category.length > 0)
		);
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

		// Step 1: Normalize the URL and immediately update the favicon — this happens even when title fetch is skipped
		const normalizedUrl = Utilities.normalizeUrl(rawUrl);
		this.url = normalizedUrl;
		this.faviconPreview = Utilities.getBrandLogoUrl(normalizedUrl);

		/*
		 * Step 2: Guard against redundant fetches — skip if a title already exists, a fetch is
		 * already in flight, or this exact URL was already fetched during this dialog session.
		 * lastFetchedUrl is reset on each openDialog() call so a reopened dialog always re-fetches.
		 */
		if (this.title || this.metaLoading || this.lastFetchedUrl === normalizedUrl) return;

		// Step 3: Fetch the remote page HTML and extract the <title> tag via regex
		this.metaLoading = true;
		this.databaseService
			.proxyFetch(normalizedUrl)
			.then((result) => {
				const match = result.content?.match(/<title[^>]*>([^<]+)<\/title>/i);
				if (match?.[1]) this.title = match[1].trim();

				// Mark URL as fetched so repeated blur/enter events on the same URL are no-ops
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
	protected async onSubmit(): Promise<void> {
		if (!this.isValid) return;

		// Step 1: Build the payload — URL is re-normalized here in case the user edited it after the blur event
		const formData: NewLinkData = {
			url: Utilities.normalizeUrl(this.url),
			title: this.title.trim(),
			category: this.category,
			isPinned: this.isPinned,
			isShared: this.isShared
		};

		/*
		 * Step 2: Await the caller's work so the dialog stays open under the blocking overlay and
		 * both close together when the save settles (consistent with the undo flow).
		 */
		await this.submitCallback?.(formData);
		this.onDialogClosed();
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
