/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-redundant-type-constituents */
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
export class NexusComponent implements OnInit, AfterViewChecked, OnDestroy {
	private readonly className = 'NexusComponent';

	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;

	protected failedLogos = new Set<string>();
	private readonly LOGO_FALLBACK_COLORS = NEXUS_LOGO_FALLBACK_COLORS;
	protected readonly aiTools: AiTool[] = [...NEXUS_AI_TOOLS];

	// ── Links & Categories ────────────────────────────────────────
	protected links: any[] = [];
	protected categories: any[] = [];
	protected faviconFailedIds = new Set<string>();
	protected selectedCategory = NEXUS_CATEGORY_ALL;
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
	ngOnInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.linksSub = this.databaseService.getUsefulLinks().subscribe({
				next: (data) => {
					this.links = data;
					this.linksLoading = false;
					this.cdr.markForCheck();
				},
				error: (error) => {
					LOG.error(this.className, 'Failed to load useful links', error as Error);
					this.linksLoading = false;
					this.cdr.markForCheck();
				}
			});
			this.categoriesSub = this.databaseService.getLinkCategories().subscribe({
				next: (data) => {
					this.categories = Utilities.sortByOrder(data);
					this.cdr.markForCheck();
				},
				error: (error) => {
					LOG.error(this.className, 'Failed to load link categories', error as Error);
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
	 * Attaches the auto-hide scroll listener to the links grid after each view check.
	 * Uses a WeakSet internally so each element is bound exactly once.
	 */
	ngAfterViewChecked(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		document.querySelectorAll<HTMLElement>('.links-grid').forEach((el) => Utilities.attachScrollAutoHide(el));
	}

	/**
	 * Lifecycle: clean up all subscriptions and clear the dialog container.
	 */
	ngOnDestroy(): void {
		this.linksSub?.unsubscribe();
		this.categoriesSub?.unsubscribe();
		this.userAliveSub?.unsubscribe();
		this.dialogComponentContainer?.clear();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	/**
	 * Marks a tool's logo as failed so the initial-letter fallback is shown instead.
	 *
	 * @param toolId - The ID of the AI tool whose image failed to load.
	 */
	protected onLogoError(toolId: string): void {
		this.failedLogos.add(toolId);
		this.cdr.markForCheck();
	}

	/**
	 * Returns the brand fallback colour for a given tool ID.
	 *
	 * @param toolId - The AI tool ID.
	 * @returns A CSS colour string.
	 */
	protected getLogoFallbackColor(toolId: string): string {
		return this.LOGO_FALLBACK_COLORS[toolId] ?? '#888';
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
		if (focusTarget?.closest('.icon-btn')) return;
		if (!this.linkSearch.trim()) this.linkSearchVisible = false;
	}

	/**
	 * Returns the subset of links that match the active category tab and the
	 * current search string. Used directly by the template as a getter.
	 *
	 * @returns The filtered array of link documents.
	 */
	protected get filteredLinks(): any[] {
		return this.links.filter((link) => {
			const matchesCategory = this.selectedCategory === NEXUS_CATEGORY_ALL || link.category === this.selectedCategory;
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
	 * Opens a saved link in a new tab and increments its visit count.
	 *
	 * @param link - The link document to open.
	 */
	protected openLink(link: any): void {
		this.utilities.openInNewTab(Utilities.normalizeUrl(link.url));
		this.databaseService
			.incrementLinkVisit(link._id, link.visitCount ?? 0)
			.catch((error: any) =>
				LOG.error(this.className, `Failed to increment visit count for ${link.title}`, error as Error)
			);
	}

	/**
	 * Returns the number of links belonging to a given category key.
	 *
	 * @param categoryKey - The category _id, or 'all' for the total count.
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
	 * Normalizes the entered URL, updates the favicon preview, and fetches the page title
	 * when the URL is confirmed (Enter key or focus leaving the field).
	 */
	protected onLinkUrlConfirm(): void {
		const rawUrl = this.linkForm.url.trim();
		if (!rawUrl) return;
		const url = Utilities.normalizeUrl(rawUrl);
		this.linkForm.url = url;
		this.linkFaviconPreview = Utilities.getFavicon(url);
		if (this.linkForm.title) return;
		if (this.linkMetaLoading) return;
		this.linkMetaLoading = true;
		this.databaseService
			.proxyFetch(url)
			.then((fetchResult) => {
				const match = fetchResult.content?.match(/<title[^>]*>([^<]+)<\/title>/i);
				if (match?.[1]) this.linkForm.title = match[1].trim();
				this.linkMetaLoading = false;
				this.cdr.markForCheck();
			})
			.catch((error) => {
				LOG.error(this.className, `Could not fetch page title for ${url}: ${Utilities.safeErrorMessage(error)}`);
				this.linkMetaLoading = false;
			});
	}

	/**
	 * Saves the link form (add or update).
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
		} catch (error) {
			LOG.error(this.className, 'Failed to save link', error as Error);
			this.dialogService.showToast(TOAST_ERROR, NEXUS_MSG_SAVE_FAILED, NEXUS_MSG_LINK_SAVE_FAILED_DETAIL);
		}
	}

	/**
	 * Prompts the user to confirm deletion of a link, then removes it.
	 *
	 * @param link - The link document to delete.
	 * @param event - The click event (stopped to prevent card click).
	 */
	protected openDeleteLinkDialog(link: any, event: Event): void {
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
					.catch((error: any) => {
						LOG.error(this.className, `Failed to delete link: ${link.title}`, error as Error);
						this.dialogService.showToast(TOAST_ERROR, NEXUS_MSG_DELETE_FAILED, NEXUS_MSG_LINK_DELETE_FAILED_DETAIL);
					});
			},
			[`Are you sure you want to delete "${link.title}"?`, NEXUS_MSG_DELETE_LINK_TITLE, NEXUS_MSG_DELETE_LINK_BTN]
		);
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
	 * Opens the Edit Category dialog pre-filled with an existing category.
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
	 * Saves the category form (add or update).
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
			LOG.error(this.className, 'Failed to save category', error as Error);
			this.dialogService.showToast(TOAST_ERROR, NEXUS_MSG_SAVE_FAILED, NEXUS_MSG_CATEGORY_SAVE_FAILED_DETAIL);
		}
	}

	/**
	 * Deletes a category after user confirmation.
	 *
	 * @param category - The category document to delete.
	 * @param event - The click event (stopped to prevent tab switch).
	 */
	protected openDeleteCategoryDialog(category: any, event: Event): void {
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
					.catch((error: any) => {
						LOG.error(this.className, `Failed to delete category: ${category.name}`, error as Error);
						this.dialogService.showToast(TOAST_ERROR, NEXUS_MSG_DELETE_FAILED, NEXUS_MSG_CATEGORY_DELETE_FAILED_DETAIL);
					});
			},
			[`Are you sure you want to delete category "${category.name}"? Links in this category will become uncategorised.`, NEXUS_MSG_DELETE_CATEGORY_TITLE, NEXUS_MSG_DELETE_CATEGORY_BTN]
		);
	}
}
