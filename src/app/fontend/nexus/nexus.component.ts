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
	NEXUS_MSG_CATEGORY_ADDED,
	NEXUS_MSG_CATEGORY_DELETE_FAILED_DETAIL,
	NEXUS_MSG_CATEGORY_DELETED,
	NEXUS_MSG_DELETE_CATEGORY_BTN,
	NEXUS_MSG_DELETE_CATEGORY_TITLE,
	NEXUS_MSG_DELETE_LINK_BTN,
	NEXUS_MSG_DELETE_LINK_TITLE,
	NEXUS_MSG_CATEGORY_SAVE_FAILED_DETAIL,
	NEXUS_MSG_CATEGORY_UPDATED,
	NEXUS_MSG_DELETE_FAILED,
	NEXUS_MSG_EMPTY_QUERY,
	NEXUS_MSG_EMPTY_QUERY_DETAIL,
	NEXUS_MSG_HISTORY_CLEARED,
	NEXUS_MSG_HISTORY_CLEARED_DETAIL,
	NEXUS_MSG_LAUNCHED,
	NEXUS_MSG_LINK_DELETE_FAILED_DETAIL,
	NEXUS_MSG_LINK_DELETED,
	NEXUS_MSG_LINK_SAVE_FAILED_DETAIL,
	NEXUS_MSG_LINK_SAVED,
	NEXUS_MSG_LINK_UPDATED,
	NEXUS_MSG_MISSING_FIELDS,
	NEXUS_MSG_MISSING_FIELDS_DETAIL,
	NEXUS_MSG_NAME_REQUIRED,
	NEXUS_MSG_NO_AI_SELECTED,
	NEXUS_MSG_NO_AI_SELECTED_DETAIL,
	NEXUS_MSG_SAVE_FAILED,
	NEXUS_TOOL_TYPE_CLIPBOARD,
	NEXUS_TOOL_TYPE_DIRECT,
	TOAST_ERROR,
	TOAST_INFO,
	TOAST_SUCCESS,
	TOAST_WARN
} from '../../common/app.constant';

/**
 * Safely extract an error message from any thrown value.
 * Some SDK error objects (e.g. CloudBase JS SDK) have broken `.message` getters
 * that throw internally, so we must guard before passing to LOG.error.
 */
function safeErrMsg(err: unknown): string {
	try {
		if (err == null) return 'unknown error';
		if (typeof err === 'string') return err;
		const msg = (err as any).message;
		return typeof msg === 'string' ? msg : String(err);
	} catch {
		return 'unknown error';
	}
}

import { AiTool, SearchHistoryEntry } from './nexus.types';

@Component({
	selector: 'nexus',
	standalone: true,
	imports: [CommonModule, FormsModule, DialogModule],
	templateUrl: './nexus.component.html',
	styleUrl: './nexus.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class NexusComponent implements OnInit, OnDestroy {
	private readonly className = 'NexusComponent';
	private readonly SELECTED_AIS_KEY = 'nexus_selected_ais';
	private readonly HISTORY_KEY = 'nexus_search_history';

	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	private dialogComponentContainer!: ViewContainerRef;
	protected history: SearchHistoryEntry[] = [];

	protected searchQuery = '';

	/**
	 * Tracks tool IDs whose favicon image failed to load — shows initial fallback instead.
	 */
	protected failedLogos = new Set<string>();

	/**
	 * Brand accent colours used for the initial-letter fallback circle, keyed by tool ID.
	 */
	private readonly LOGO_FALLBACK_COLORS: Record<string, string> = {
		chatgpt: '#10a37f',
		perplexity: '#20b2aa',
		grok: '#1d1d1d',
		mistral: '#ff6600',
		youcom: '#7856ff',
		deepseek: '#4d6bfe',
		gemini: '#4285f4',
		kimi: '#ff4757',
		claude: '#cc785c',
		metaai: '#0866ff'
	};

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

	protected directTools: AiTool[] = [
		{
			id: 'chatgpt',
			name: 'ChatGPT',
			logo: 'https://icon.horse/icon/chatgpt.com',
			url: 'https://chatgpt.com/?q=',
			type: NEXUS_TOOL_TYPE_DIRECT,
			selected: false
		},
		{
			id: 'perplexity',
			name: 'Perplexity',
			logo: 'https://icon.horse/icon/perplexity.ai',
			url: 'https://www.perplexity.ai/search?q=',
			type: NEXUS_TOOL_TYPE_DIRECT,
			selected: false
		},
		{
			id: 'grok',
			name: 'Grok',
			logo: 'https://icon.horse/icon/grok.com',
			url: 'https://grok.com/?q=',
			type: NEXUS_TOOL_TYPE_DIRECT,
			selected: false
		},
		{
			id: 'mistral',
			name: 'Mistral',
			logo: 'https://icon.horse/icon/mistral.ai',
			url: 'https://chat.mistral.ai/chat?q=',
			type: NEXUS_TOOL_TYPE_DIRECT,
			selected: false
		},
		{
			id: 'youcom',
			name: 'You.com',
			logo: 'https://icon.horse/icon/you.com',
			url: 'https://you.com/search?fromSearchBar=true&tbm=youchat&q=',
			type: NEXUS_TOOL_TYPE_DIRECT,
			selected: false
		}
	];

	protected clipboardTools: AiTool[] = [
		{
			id: 'deepseek',
			name: 'DeepSeek',
			logo: 'https://icon.horse/icon/deepseek.com',
			url: 'https://chat.deepseek.com',
			type: NEXUS_TOOL_TYPE_CLIPBOARD,
			selected: false
		},
		{
			id: 'gemini',
			name: 'Gemini',
			logo: 'https://icon.horse/icon/gemini.google.com',
			url: 'https://gemini.google.com/app',
			type: NEXUS_TOOL_TYPE_CLIPBOARD,
			selected: false
		},
		{
			id: 'kimi',
			name: 'KIMI',
			logo: 'https://icon.horse/icon/kimi.com',
			url: 'https://www.kimi.com/en',
			type: NEXUS_TOOL_TYPE_CLIPBOARD,
			selected: false
		},
		{
			id: 'claude',
			name: 'Claude',
			logo: 'https://icon.horse/icon/claude.ai',
			url: 'https://claude.ai',
			type: NEXUS_TOOL_TYPE_CLIPBOARD,
			selected: false
		},
		{
			id: 'metaai',
			name: 'Meta AI',
			logo: 'https://icon.horse/icon/meta.ai',
			url: 'https://www.meta.ai',
			type: NEXUS_TOOL_TYPE_CLIPBOARD,
			selected: false
		}
	];

	// ── Links & Categories ────────────────────────────────────────
	protected links: any[] = [];
	protected categories: any[] = [];
	protected faviconFailedIds = new Set<string>();
	protected activeCategory = NEXUS_CATEGORY_ALL;
	protected linkSearch = '';

	// ── Add/Edit Link dialog ──────────────────────────────────────
	protected showLinkDialog = false;
	protected linkDialogTitle = NEXUS_DIALOG_TITLE_ADD_LINK;
	protected editingLink: any | null = null;
	protected linkForm = { url: '', title: '', category: '' };
	protected linkFaviconPreview = '';
	protected linkMetaLoading = false;

	// ── Category dialog ───────────────────────────────────────────
	protected showCategoryDialog = false;
	protected categoryForm = { name: '', color: '#d53369' };
	protected editingCategory: any | null = null;

	// ── Links loading state ───────────────────────────────────────
	protected linksLoading = true;

	// ── Subscriptions ─────────────────────────────────────────────
	private linksSub?: Subscription;
	private categoriesSub?: Subscription;

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		private readonly cdr: ChangeDetectorRef,
		private readonly dialogService: DialogService,
		private readonly databaseService: DatabaseService
	) {}

	/**
	 * Lifecycle: initialise subscriptions and load data.
	 */
	public ngOnInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.restoreSelectedAis();
			this.loadHistory();
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
					this.categories = [...data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
					this.cdr.markForCheck();
				},
				error: (err) => {
					LOG.error(this.className, 'Failed to load link categories', err as Error);
				}
			});
		}
	}

	/**
	 * Lifecycle: clean up all subscriptions.
	 */
	public ngOnDestroy(): void {
		this.linksSub?.unsubscribe();
		this.categoriesSub?.unsubscribe();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	/**
	 * Restore selected AI chips from localStorage.
	 */
	private restoreSelectedAis(): void {
		try {
			const saved = localStorage.getItem(this.SELECTED_AIS_KEY);
			if (!saved) return;
			const ids: string[] = JSON.parse(saved);
			[...this.directTools, ...this.clipboardTools].forEach((t) => {
				t.selected = ids.includes(t.id);
			});
		} catch {
			// ignore parse errors
		}
	}

	/**
	 * Persist selected AI chip IDs to localStorage.
	 */
	private persistSelectedAis(): void {
		const ids = [...this.directTools, ...this.clipboardTools].filter((t) => t.selected).map((t) => t.id);
		localStorage.setItem(this.SELECTED_AIS_KEY, JSON.stringify(ids));
	}

	/**
	 * Toggle the selected state of an AI chip and persist the new selection.
	 *
	 * @param tool - The AI tool whose selected flag should be flipped.
	 */
	protected toggleAi(tool: AiTool): void {
		tool.selected = !tool.selected;
		this.persistSelectedAis();
	}

	/**
	 * Launch the search query to all selected AI tools.
	 */
	protected onLaunch(): void {
		const query = this.searchQuery.trim();
		if (!query) {
			this.dialogService.showToast(TOAST_WARN, NEXUS_MSG_EMPTY_QUERY, NEXUS_MSG_EMPTY_QUERY_DETAIL);
			return;
		}
		const selectedDirect = this.directTools.filter((t) => t.selected);
		if (selectedDirect.length === 0) {
			this.dialogService.showToast(TOAST_WARN, NEXUS_MSG_NO_AI_SELECTED, NEXUS_MSG_NO_AI_SELECTED_DETAIL);
			return;
		}
		// Open direct-query tools with the query pre-filled in the URL
		selectedDirect.forEach((t) => window.open(t.url + encodeURIComponent(query), '_blank'));
		// Build summary toast
		this.dialogService.showToast(TOAST_SUCCESS, NEXUS_MSG_LAUNCHED, `Opened ${selectedDirect.map((t) => t.name).join(', ')}`);
		this.saveToHistory(
			query,
			selectedDirect.map((t) => t.id)
		);
		this.cdr.markForCheck();
	}

	/**
	 * Prepend a new entry to the in-memory history array and persist the
	 * updated list to localStorage, keeping at most 50 entries.
	 *
	 * @param query - The search query string that was launched.
	 * @param aiIds - The IDs of the AI tools that were used for the query.
	 */
	private saveToHistory(query: string, aiIds: string[]): void {
		const entry: SearchHistoryEntry = { query, aiIds, timestamp: new Date().toISOString() };
		this.history = [entry, ...this.history].slice(0, 50);
		localStorage.setItem(this.HISTORY_KEY, JSON.stringify(this.history));
		this.cdr.markForCheck();
	}

	/**
	 * Load search history from localStorage on init.
	 */
	private loadHistory(): void {
		try {
			const raw = localStorage.getItem(this.HISTORY_KEY);
			this.history = raw ? JSON.parse(raw) : [];
		} catch {
			this.history = [];
		}
	}

	/**
	 * Re-populate the search bar and re-select AI chips from a history entry,
	 * then immediately launch the search.
	 *
	 * @param entry - The history entry to relaunch.
	 */
	protected relaunch(entry: SearchHistoryEntry): void {
		this.searchQuery = entry.query;
		[...this.directTools, ...this.clipboardTools].forEach((t) => {
			t.selected = entry.aiIds.includes(t.id);
		});
		this.persistSelectedAis();
		this.onLaunch();
	}

	/**
	 * Clear all search history from localStorage and the view.
	 */
	protected clearHistory(): void {
		this.history = [];
		localStorage.removeItem(this.HISTORY_KEY);
		this.dialogService.showToast(TOAST_INFO, NEXUS_MSG_HISTORY_CLEARED, NEXUS_MSG_HISTORY_CLEARED_DETAIL);
		this.cdr.markForCheck();
	}

	/**
	 * Return a human-readable relative time string for a given timestamp.
	 * Delegates to Utilities.getRelativeTime which handles both ISO 8601 and
	 * the app's "YYYY.MM.DD HH:mm:ss" format.
	 *
	 * @param timestamp - ISO 8601 or app-format date string.
	 * @returns A human-readable relative time string (e.g. "just now", "5m ago").
	 */
	protected getRelativeTime(timestamp: string): string {
		return Utilities.getRelativeTime(timestamp);
	}

	/**
	 * Find an AI tool by its ID (searches both direct and clipboard tool arrays).
	 *
	 * @param id - The tool ID to look up.
	 * @returns The matching AiTool, or undefined if not found.
	 */
	protected getToolById(id: string): AiTool | undefined {
		return [...this.directTools, ...this.clipboardTools].find((t) => t.id === id);
	}

	/**
	 * Open an "Opens Homepage" AI tool directly in a new tab.
	 * No query is passed — the user interacts on the tool's own site.
	 *
	 * @param tool - The AI tool to open.
	 */
	protected openToolHomepage(tool: AiTool): void {
		window.open(tool.url, '_blank', 'noopener,noreferrer');
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
	 * Build a Google favicon URL for the given link URL.
	 *
	 * @param url - The full URL of the website.
	 * @returns A favicon image URL string.
	 */
	protected getFavicon(url: string): string {
		try {
			const hostname = new URL(url).hostname;
			return `https://${hostname}/favicon.ico`;
		} catch {
			return '';
		}
	}

	/**
	 * Called when a link favicon image fails to load.
	 * Marks the link for initial-letter fallback display and logs a warning.
	 */
	protected onFaviconError(link: any): void {
		this.faviconFailedIds.add(link._id);
		LOG.warn(this.className, `Favicon unavailable for ${link.title} (${link.url})`);
		this.cdr.markForCheck();
	}

	/**
	 * Ensure a URL has an explicit protocol prefix so `window.open()` treats it
	 * as an absolute URL rather than a relative path.  If the value already
	 * starts with `http://` or `https://` it is returned unchanged; otherwise
	 * `https://` is prepended.
	 *
	 * @param url - The raw URL string entered by the user.
	 * @returns A URL string guaranteed to begin with a valid protocol.
	 */
	private normalizeUrl(url: string): string {
		if (!url) return url;
		if (url.startsWith('http://') || url.startsWith('https://')) return url;
		return 'https://' + url;
	}

	/**
	 * Open a saved link in a new tab and increment its visit count.
	 *
	 * @param link - The link document to open.
	 */
	protected openLink(link: any): void {
		const url = this.normalizeUrl(link.url);
		window.open(url, '_blank', 'noopener,noreferrer');
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
		this.linkFaviconPreview = this.getFavicon(link.url);
		this.showLinkDialog = true;
	}

	/**
	 * Fetch the page title and favicon preview from the entered URL.
	 * Called when the URL input loses focus.
	 */
	protected onLinkUrlBlur(): void {
		const raw = this.linkForm.url.trim();
		if (!raw) return;
		const url = this.normalizeUrl(raw);
		this.linkForm.url = url; // write back so the input shows the normalized value
		this.linkFaviconPreview = this.getFavicon(url);
		if (this.linkForm.title) return; // don't overwrite existing title
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
				LOG.error(this.className, `Could not fetch page title for ${url}: ${safeErrMsg(err)}`);
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
		const finalUrl = this.normalizeUrl(url.trim());
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
		this.categoryForm = { name: '', color: '#d53369' };
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
		this.categoryForm = { name: category.name, color: category.color ?? '#d53369' };
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
