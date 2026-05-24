/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-redundant-type-constituents */
import {
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
import { Subscription } from 'rxjs';
import { DatabaseService } from '../../backend/database-service/database.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { LOG } from '../../common/app.logs';
import { Utilities } from '../../common/app.utilities';
import {
	COMPONENT_DESTROY,
	DIALOG_CONFIRM,
	NEXUS_CATEGORY_ALL,
	NEXUS_DIALOG_TITLE_ADD_LINK,
	NEXUS_DIALOG_TITLE_EDIT_LINK,
	NEXUS_DEFAULT_CATEGORY_COLOR,
	NEXUS_MSG_CATEGORY_ADDED,
	NEXUS_MSG_CATEGORY_DELETE_FAILED_DETAIL,
	NEXUS_MSG_CATEGORY_DELETED,
	NEXUS_MSG_CATEGORY_SAVE_FAILED_DETAIL,
	NEXUS_MSG_CATEGORY_UPDATED,
	NEXUS_MSG_DELETE_CATEGORY_BTN,
	NEXUS_MSG_DELETE_CATEGORY_TITLE,
	NEXUS_MSG_DELETE_FAILED,
	NEXUS_MSG_DELETE_LINK_BTN,
	NEXUS_MSG_DELETE_LINK_TITLE,
	NEXUS_MSG_LINK_DELETE_FAILED_DETAIL,
	NEXUS_MSG_LINK_DELETED,
	NEXUS_MSG_LINK_SAVE_FAILED_DETAIL,
	NEXUS_MSG_LINK_SAVED,
	NEXUS_MSG_LINK_UPDATED,
	NEXUS_MSG_MISSING_FIELDS,
	NEXUS_MSG_MISSING_FIELDS_DETAIL,
	NEXUS_MSG_NAME_REQUIRED,
	NEXUS_MSG_SAVE_FAILED,
	TOAST_ERROR,
	TOAST_INFO,
	TOAST_SUCCESS,
	TOAST_WARN
} from '../../common/app.constant';
import { AiTool, NEXUS_AI_TOOLS, NEXUS_LOGO_FALLBACK_COLORS } from './nexus.model';

@Component({
	selector: 'nexus',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [CommonModule, FormsModule, DialogModule],
	templateUrl: './nexus.component.html',
	styleUrl: './nexus.component.css',
})
export class NexusComponent implements OnInit, OnDestroy {
	private readonly className = 'NexusComponent';

	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	private dialogComponentContainer!: ViewContainerRef;

	protected failedLogos = new Set<string>();
	private readonly LOGO_FALLBACK_COLORS = NEXUS_LOGO_FALLBACK_COLORS;
	protected readonly aiTools: AiTool[] = NEXUS_AI_TOOLS;

	// ── Links & Categories ────────────────────────────────────────
	protected links: any[] = [];
	protected categories: any[] = [];
	protected faviconFailedIds = new Set<string>();
	protected activeCategory = NEXUS_CATEGORY_ALL;
	protected linkSearch = '';
	protected linkSearchVisible = false;

	// ── Add/Edit Link dialog ──────────────────────────────────────
	protected showLinkDialog = false;
	protected linkDialogTitle = NEXUS_DIALOG_TITLE_ADD_LINK;
	protected editingLink: any | null = null;
	protected linkForm = { url: '', title: '', category: '' };
	protected linkFaviconPreview = '';
	protected linkMetaLoading = false;

	// ── Category dialog ───────────────────────────────────────────
	protected showCategoryDialog = false;
	protected categoryForm = { name: '', color: NEXUS_DEFAULT_CATEGORY_COLOR };
	protected editingCategory: any | null = null;

	// ── Links loading state ───────────────────────────────────────
	protected linksLoading = true;

	// ── Subscriptions ─────────────────────────────────────────────
	private linksSub?: Subscription;
	private categoriesSub?: Subscription;
	private userAliveSub?: Subscription;

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		protected readonly utilities: Utilities,
		private readonly cdr: ChangeDetectorRef,
		private readonly dialogService: DialogService,
		private readonly databaseService: DatabaseService
	) {}

	/**
	 * Lifecycle: initialise subscriptions and load data.
	 */
	public ngOnInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.linksSub = this.databaseService.getUsefulLinks().subscribe({
				next: (data) => {
					this.links = data;
					this.linksLoading = false;
					this.cdr.markForCheck();
				},
				error: (err) => {
					LOG.error(this.className, 'Failed to load useful links', err as Error);
					this.linksLoading = false;
					this.cdr.markForCheck();
				}
			});
			this.categoriesSub = this.databaseService.getLinkCategories().subscribe({
				next: (data) => {
					this.categories = Utilities.sortByOrder(data);
					this.cdr.markForCheck();
				},
				error: (err) => {
					LOG.error(this.className, 'Failed to load link categories', err as Error);
				}
			});
			// Subscribe directly to the auth-alive stream so the links column
			// switches between the real content and the access-denied card
			// immediately on login/logout — without waiting for a zone event.
			this.userAliveSub = this.utilities.getIsUserAlive$().subscribe(() => {
				this.cdr.markForCheck();
			});
		}
	}

	/**
	 * Lifecycle: clean up all subscriptions.
	 */
	public ngOnDestroy(): void {
		this.linksSub?.unsubscribe();
		this.categoriesSub?.unsubscribe();
		this.userAliveSub?.unsubscribe();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	/**
	 * Mark a tool's logo as failed so the initial-letter fallback is shown instead.
	 *
	 * @param toolId - The ID of the AI tool whose image failed to load.
	 */
	protected onLogoError(toolId: string): void {
		this.failedLogos.add(toolId);
		this.cdr.markForCheck();
	}

	/**
	 * Return the brand fallback colour for a given tool ID.
	 *
	 * @param toolId - The AI tool ID.
	 * @returns A CSS colour string.
	 */
	protected logoFallbackColor(toolId: string): string {
		return this.LOGO_FALLBACK_COLORS[toolId] ?? '#888';
	}

	/**
	 * Open an AI tool's homepage in a new tab.
	 *
	 * @param tool - The AI tool to open.
	 */
	protected openAiTool(tool: AiTool): void {
		this.utilities.openInNewTab(tool.url);
	}

	/**
	 * Toggle the link search input visibility.
	 * Clears the search query when collapsing.
	 */
	protected toggleLinkSearch(): void {
		this.linkSearchVisible = !this.linkSearchVisible;
		if (!this.linkSearchVisible) this.linkSearch = '';
	}

	/**
	 * Collapse the link search input when it loses focus and the query is empty.
	 */
	protected onLinkSearchBlur(): void {
		if (!this.linkSearch.trim()) {
			this.linkSearchVisible = false;
		}
	}

	/**
	 * Return the subset of links that match the active category tab and the
	 * current search string. Used directly by the template as a getter.
	 *
	 * @returns The filtered array of link documents.
	 */
	protected get filteredLinks(): any[] {
		return this.links.filter((link) => {
			const matchesCategory = this.activeCategory === NEXUS_CATEGORY_ALL || link.category === this.activeCategory;
			const matchesSearch =
				!this.linkSearch.trim() || link.title.toLowerCase().includes(this.linkSearch.toLowerCase());
			return matchesCategory && matchesSearch;
		});
	}

	/**
	 * Called when a link favicon image fails to load.
	 * Marks the link for initial-letter fallback display and logs a warning.
	 *
	 * @param link - The link document whose favicon failed.
	 */
	protected onFaviconError(link: any): void {
		this.faviconFailedIds.add(link._id);
		LOG.warn(this.className, `Favicon unavailable for ${link.title} (${link.url})`);
		this.cdr.markForCheck();
	}

	/**
	 * Open a saved link in a new tab and increment its visit count.
	 *
	 * @param link - The link document to open.
	 */
	protected openLink(link: any): void {
		this.utilities.openInNewTab(Utilities.normalizeUrl(link.url));
		this.databaseService
			.incrementLinkVisit(link._id, link.visitCount ?? 0)
			.catch((err: any) =>
				LOG.error(this.className, `Failed to increment visit count for ${link.title}`, err as Error)
			);
	}

	/**
	 * Return the number of links belonging to a given category key.
	 *
	 * @param categoryKey - The category _id, or 'all' for the total count.
	 * @returns The count of matching links.
	 */
	protected getLinkCount(categoryKey: string): number {
		if (categoryKey === NEXUS_CATEGORY_ALL) return this.links.length;
		return this.links.filter((l) => l.category === categoryKey).length;
	}

	/**
	 * Open the Add Link dialog with a blank form.
	 */
	protected openAddLinkDialog(): void {
		this.editingLink = null;
		this.linkDialogTitle = NEXUS_DIALOG_TITLE_ADD_LINK;
		this.linkForm = {
			url: '',
			title: '',
			category: this.activeCategory !== NEXUS_CATEGORY_ALL ? this.activeCategory : ''
		};
		this.linkFaviconPreview = '';
		this.showLinkDialog = true;
	}

	/**
	 * Open the Edit Link dialog pre-filled with an existing link's data.
	 *
	 * @param link - The link document to edit.
	 * @param event - The click event (stopped to prevent card click).
	 */
	protected openEditLinkDialog(link: any, event: Event): void {
		event.stopPropagation();
		this.editingLink = link;
		this.linkDialogTitle = NEXUS_DIALOG_TITLE_EDIT_LINK;
		this.linkForm = { url: link.url, title: link.title, category: link.category ?? '' };
		this.linkFaviconPreview = Utilities.getFavicon(link.url);
		this.showLinkDialog = true;
	}

	/**
	 * Fetch the page title and favicon preview from the entered URL.
	 * Called when the URL input loses focus.
	 */
	protected onLinkUrlBlur(): void {
		const raw = this.linkForm.url.trim();
		if (!raw) return;
		const url = Utilities.normalizeUrl(raw);
		this.linkForm.url = url;
		this.linkFaviconPreview = Utilities.getFavicon(url);
		if (this.linkForm.title) return;
		this.linkMetaLoading = true;
		this.databaseService
			.proxyFetch(url)
			.then((res) => {
				const match = res.content?.match(/<title[^>]*>([^<]+)<\/title>/i);
				if (match?.[1]) this.linkForm.title = match[1].trim();
				this.linkMetaLoading = false;
				this.cdr.markForCheck();
			})
			.catch((err) => {
				LOG.error(this.className, `Could not fetch page title for ${url}: ${Utilities.safeErrorMessage(err)}`);
				this.linkMetaLoading = false;
			});
	}

	/**
	 * Save the link form (add or update).
	 */
	protected async saveLinkDialog(): Promise<void> {
		const { url, title, category } = this.linkForm;
		if (!url.trim() || !title.trim() || !category) {
			this.dialogService.showToast(TOAST_WARN, NEXUS_MSG_MISSING_FIELDS, NEXUS_MSG_MISSING_FIELDS_DETAIL);
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
			this.cdr.markForCheck();
		} catch (err) {
			LOG.error(this.className, 'Failed to save link', err as Error);
			this.dialogService.showToast(TOAST_ERROR, NEXUS_MSG_SAVE_FAILED, NEXUS_MSG_LINK_SAVE_FAILED_DETAIL);
		}
	}

	/**
	 * Prompt the user to confirm deletion of a link, then remove it.
	 *
	 * @param link - The link document to delete.
	 * @param event - The click event (stopped to prevent card click).
	 */
	protected deleteLink(link: any, event: Event): void {
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
					.catch((err: any) => {
						LOG.error(this.className, `Failed to delete link: ${link.title}`, err as Error);
						this.dialogService.showToast(TOAST_ERROR, NEXUS_MSG_DELETE_FAILED, NEXUS_MSG_LINK_DELETE_FAILED_DETAIL);
					});
			},
			[`Are you sure you want to delete "${link.title}"?`, NEXUS_MSG_DELETE_LINK_TITLE, NEXUS_MSG_DELETE_LINK_BTN]
		);
	}

	/**
	 * Open the Add Category dialog with a blank form.
	 */
	protected openAddCategoryDialog(): void {
		this.editingCategory = null;
		this.categoryForm = { name: '', color: NEXUS_DEFAULT_CATEGORY_COLOR };
		this.showCategoryDialog = true;
	}

	/**
	 * Open the Edit Category dialog pre-filled with an existing category.
	 *
	 * @param category - The category document to edit.
	 * @param event - The click event (stopped to prevent tab switch).
	 */
	protected openEditCategoryDialog(category: any, event: Event): void {
		event.stopPropagation();
		this.editingCategory = category;
		this.categoryForm = { name: category.name, color: category.color ?? NEXUS_DEFAULT_CATEGORY_COLOR };
		this.showCategoryDialog = true;
	}

	/**
	 * Save the category form (add or update).
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
		} catch (err) {
			LOG.error(this.className, 'Failed to save category', err as Error);
			this.dialogService.showToast(TOAST_ERROR, NEXUS_MSG_SAVE_FAILED, NEXUS_MSG_CATEGORY_SAVE_FAILED_DETAIL);
		}
	}

	/**
	 * Delete a category after user confirmation.
	 *
	 * @param category - The category document to delete.
	 * @param event - The click event (stopped to prevent tab switch).
	 */
	protected deleteCategory(category: any, event: Event): void {
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
						this.cdr.markForCheck();
					})
					.catch((err: any) => {
						LOG.error(this.className, `Failed to delete category: ${category.name}`, err as Error);
						this.dialogService.showToast(TOAST_ERROR, NEXUS_MSG_DELETE_FAILED, NEXUS_MSG_CATEGORY_DELETE_FAILED_DETAIL);
					});
			},
			[`Are you sure you want to delete category "${category.name}"? Links in this category will become uncategorised.`, NEXUS_MSG_DELETE_CATEGORY_TITLE, NEXUS_MSG_DELETE_CATEGORY_BTN]
		);
	}
}
