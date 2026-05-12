import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { Subscription } from 'rxjs';
import { DatabaseService } from '../../backend/database-service/database.service';

interface AiTool {
	id: string;
	name: string;
	logo: string;
	type: 'direct' | 'clipboard';
	url: string;
	selected: boolean;
}

interface SearchHistoryEntry {
	query: string;
	aiIds: string[];
	timestamp: string;
}

interface NewsArticle {
	title: string;
	link: string;
	pubDate: string;
	source: string;
	category: 'ai' | 'tech' | 'science';
}

interface RssFeed {
	url: string;
	source: string;
	category: 'ai' | 'tech' | 'science';
}

@Component({
	selector: 'app-nexus',
	standalone: true,
	imports: [CommonModule, FormsModule, ToastModule, DialogModule],
	templateUrl: './nexus.component.html',
	styleUrl: './nexus.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [MessageService]
})
export class NexusComponent implements OnInit, OnDestroy {

	private readonly SELECTED_AIS_KEY = 'nexus_selected_ais';
	private readonly HISTORY_KEY = 'nexus_search_history';
	protected history: SearchHistoryEntry[] = [];

	private readonly RSS_FEEDS: RssFeed[] = [
		// Global sources accessible from China mainland — fetched via allorigins.win CORS proxy + DOMParser
		{ url: 'https://feeds.reuters.com/reuters/technologyNews',                                 source: 'Reuters Tech',      category: 'tech'    },
		{ url: 'https://www.technologyreview.com/feed/',                                           source: 'MIT Tech Review',   category: 'ai'      },
		{ url: 'https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml',      source: 'ScienceDaily AI',   category: 'ai'      },
		{ url: 'https://www.sciencedaily.com/rss/top/technology.xml',                              source: 'ScienceDaily Tech', category: 'tech'    },
		{ url: 'https://phys.org/rss-feed/technology-news/',                                       source: 'Phys.org',          category: 'tech'    },
		{ url: 'https://www.sciencedaily.com/rss/top/science.xml',                                 source: 'ScienceDaily',      category: 'science' },
	];

	protected searchQuery = '';

	/** Tracks tool IDs whose favicon image failed to load — shows initial fallback instead. */
	protected failedLogos = new Set<string>();

	/** Brand accent colours used for the initial-letter fallback circle, keyed by tool ID. */
	private readonly LOGO_FALLBACK_COLORS: Record<string, string> = {
		chatgpt:    '#10a37f',
		perplexity: '#20b2aa',
		grok:       '#1d1d1d',
		mistral:    '#ff6600',
		youcom:     '#7856ff',
		deepseek:   '#4d6bfe',
		gemini:     '#4285f4',
		kimi:       '#ff4757',
		claude:     '#cc785c',
		metaai:     '#0866ff',
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
		{ id: 'chatgpt',    name: 'ChatGPT',    logo: 'https://icon.horse/icon/chatgpt.com',        url: 'https://chatgpt.com/?q=',                                         type: 'direct',    selected: false },
		{ id: 'perplexity', name: 'Perplexity', logo: 'https://icon.horse/icon/perplexity.ai',      url: 'https://www.perplexity.ai/search?q=',                              type: 'direct',    selected: false },
		{ id: 'grok',       name: 'Grok',       logo: 'https://icon.horse/icon/grok.com',           url: 'https://grok.com/?q=',                                             type: 'direct',    selected: false },
		{ id: 'mistral',    name: 'Mistral',    logo: 'https://icon.horse/icon/mistral.ai',         url: 'https://chat.mistral.ai/chat?q=',                                  type: 'direct',    selected: false },
		{ id: 'youcom',     name: 'You.com',    logo: 'https://icon.horse/icon/you.com',            url: 'https://you.com/search?fromSearchBar=true&tbm=youchat&q=',         type: 'direct',    selected: false },
	];

	protected clipboardTools: AiTool[] = [
		{ id: 'deepseek',   name: 'DeepSeek',   logo: 'https://icon.horse/icon/deepseek.com',       url: 'https://chat.deepseek.com',        type: 'clipboard', selected: false },
		{ id: 'gemini',     name: 'Gemini',     logo: 'https://icon.horse/icon/gemini.google.com',  url: 'https://gemini.google.com/app',    type: 'clipboard', selected: false },
		{ id: 'kimi',       name: 'KIMI',       logo: 'https://icon.horse/icon/kimi.com',           url: 'https://www.kimi.com/en',          type: 'clipboard', selected: false },
		{ id: 'claude',     name: 'Claude',     logo: 'https://icon.horse/icon/claude.ai',          url: 'https://claude.ai',               type: 'clipboard', selected: false },
		{ id: 'metaai',     name: 'Meta AI',    logo: 'https://icon.horse/icon/meta.ai',            url: 'https://www.meta.ai',             type: 'clipboard', selected: false },
	];

	protected newsArticles: NewsArticle[] = [];
	protected filteredNews: NewsArticle[] = [];
	protected newsFilter: 'all' | 'ai' | 'tech' | 'science' = 'all';
	protected newsLoading = false;
	protected newsError = false;

	private newsCache: { articles: NewsArticle[]; fetchedAt: number } | null = null;
	private readonly NEWS_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

	// ── Links & Categories ────────────────────────────────────────
	protected links: any[] = [];
	protected categories: any[] = [];
	protected activeCategory = 'all';
	protected linkSearch = '';

	// ── Add/Edit Link dialog ──────────────────────────────────────
	protected showLinkDialog = false;
	protected linkDialogTitle = 'Add Link';
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
		private readonly cdr: ChangeDetectorRef,
		private readonly messageService: MessageService,
		private readonly databaseService: DatabaseService
	) {}

	/** Lifecycle: initialise subscriptions and load data. */
	public ngOnInit(): void {
		this.restoreSelectedAis();
		this.loadHistory();
		this.fetchNews();
		this.linksSub = this.databaseService.getUsefulLinks().subscribe(data => {
			this.links = data;
			this.linksLoading = false;
			this.cdr.markForCheck();
		});
		this.categoriesSub = this.databaseService.getLinkCategories().subscribe(data => {
			this.categories = [...data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
			this.cdr.markForCheck();
		});
	}

	/** Lifecycle: clean up all subscriptions. */
	public ngOnDestroy(): void {
		this.linksSub?.unsubscribe();
		this.categoriesSub?.unsubscribe();
	}

	/** Restore selected AI chips from localStorage. */
	private restoreSelectedAis(): void {
		try {
			const saved = localStorage.getItem(this.SELECTED_AIS_KEY);
			if (!saved) return;
			const ids: string[] = JSON.parse(saved);
			[...this.directTools, ...this.clipboardTools].forEach(t => {
				t.selected = ids.includes(t.id);
			});
		} catch {
			// ignore parse errors
		}
	}

	/** Persist selected AI chip IDs to localStorage. */
	private persistSelectedAis(): void {
		const ids = [...this.directTools, ...this.clipboardTools]
			.filter(t => t.selected)
			.map(t => t.id);
		localStorage.setItem(this.SELECTED_AIS_KEY, JSON.stringify(ids));
	}

	/** Toggle the selected state of an AI chip. */
	protected toggleAi(tool: AiTool): void {
		tool.selected = !tool.selected;
		this.persistSelectedAis();
	}

	/** Launch the search query to all selected AI tools. */
	protected onLaunch(): void {
		const query = this.searchQuery.trim();
		if (!query) {
			this.messageService.add({ severity: 'warn', summary: 'Empty query', detail: 'Type something first' });
			return;
		}
		const selectedDirect = this.directTools.filter(t => t.selected);
		if (selectedDirect.length === 0) {
			this.messageService.add({ severity: 'warn', summary: 'No AI selected', detail: 'Select at least one Direct Query tool' });
			return;
		}
		// Open direct-query tools with the query pre-filled in the URL
		selectedDirect.forEach(t => window.open(t.url + encodeURIComponent(query), '_blank'));
		// Build summary toast
		this.messageService.add({ severity: 'success', summary: 'Launched', detail: `Opened ${selectedDirect.map(t => t.name).join(', ')}` });
		this.saveToHistory(query, selectedDirect.map(t => t.id));
		this.cdr.markForCheck();
	}

	/** Save a completed search query to localStorage history. */
	private saveToHistory(query: string, aiIds: string[]): void {
		const entry: SearchHistoryEntry = { query, aiIds, timestamp: new Date().toISOString() };
		this.history = [entry, ...this.history].slice(0, 50);
		localStorage.setItem(this.HISTORY_KEY, JSON.stringify(this.history));
		this.cdr.markForCheck();
	}

	/** Load search history from localStorage on init. */
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
		[...this.directTools, ...this.clipboardTools].forEach(t => {
			t.selected = entry.aiIds.includes(t.id);
		});
		this.persistSelectedAis();
		this.onLaunch();
	}

	/** Clear all search history from localStorage and the view. */
	protected clearHistory(): void {
		this.history = [];
		localStorage.removeItem(this.HISTORY_KEY);
		this.messageService.add({ severity: 'info', summary: 'History cleared', detail: 'Search history has been removed' });
		this.cdr.markForCheck();
	}

	/**
	 * Return a human-readable relative time string for a given ISO timestamp.
	 *
	 * @param iso - ISO date string.
	 * @returns A string like "3 min ago" or "2 hr ago".
	 */
	protected getRelativeTime(iso: string): string {
		const diff = Date.now() - new Date(iso).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins} min ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs} hr ago`;
		return `${Math.floor(hrs / 24)} d ago`;
	}

	/**
	 * Find an AI tool by its ID (searches both direct and clipboard tool arrays).
	 *
	 * @param id - The tool ID to look up.
	 * @returns The matching AiTool, or undefined if not found.
	 */
	protected getToolById(id: string): AiTool | undefined {
		return [...this.directTools, ...this.clipboardTools].find(t => t.id === id);
	}

	/**
	 * Parse a raw RSS/Atom XML string into a list of NewsArticle objects.
	 * Uses the browser-native DOMParser — no external library needed.
	 *
	 * @param xml  - The raw XML text returned by the CORS proxy.
	 * @param feed - The feed descriptor used to tag each article.
	 * @returns Up to 8 parsed articles, or an empty array on parse failure.
	 */
	private parseRssXml(xml: string, feed: RssFeed): NewsArticle[] {
		try {
			const doc = new DOMParser().parseFromString(xml, 'text/xml');
			if (doc.querySelector('parsererror')) return [];
			return Array.from(doc.querySelectorAll('item')).slice(0, 8).map(item => {
				const title = item.querySelector('title')?.textContent?.trim() ?? '';
				// <link> in RSS 2.0 is text content; in Atom it is an href attribute
				const linkEl = item.querySelector('link');
				const link =
					linkEl?.textContent?.trim() ||
					linkEl?.getAttribute('href') ||
					item.querySelector('guid')?.textContent?.trim() || '';
				const pubDate =
					item.querySelector('pubDate')?.textContent?.trim() ||
					item.querySelector('published')?.textContent?.trim() ||
					item.querySelector('updated')?.textContent?.trim() ||
					new Date().toISOString();
				return { title, link, pubDate, source: feed.source, category: feed.category };
			}).filter(a => !!a.title && !!a.link);
		} catch {
			return [];
		}
	}

	/** Fetch news articles from all RSS feeds, with 15-minute in-memory cache.
	 *  Routes through the `fetchurl` CloudBase function to avoid CORS restrictions. */
	public fetchNews(): void {
		if (this.newsCache && Date.now() - this.newsCache.fetchedAt < this.NEWS_CACHE_TTL) {
			this.newsArticles = this.newsCache.articles;
			this.applyNewsFilter();
			return;
		}
		this.newsLoading = true;
		this.newsError = false;

		const requests = this.RSS_FEEDS.map(feed =>
			this.databaseService.proxyFetch(feed.url)
				.then(res => this.parseRssXml(res.content, feed))
				.catch(() => [] as NewsArticle[])
		);

		Promise.all(requests).then(results => {
			const all = results.flat();
			all.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
			this.newsCache = { articles: all, fetchedAt: Date.now() };
			this.newsArticles = all;
			this.applyNewsFilter();
			this.newsLoading = false;
			this.cdr.markForCheck();
		}).catch(() => {
			this.newsLoading = false;
			this.newsError = true;
			this.cdr.markForCheck();
		});
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

	/** Set the active news filter tab and re-filter the articles list. */
	protected setNewsFilter(filter: 'all' | 'ai' | 'tech' | 'science'): void {
		this.newsFilter = filter;
		this.applyNewsFilter();
		this.cdr.markForCheck();
	}

	/** Apply the current news filter to produce filteredNews. */
	private applyNewsFilter(): void {
		this.filteredNews = this.newsFilter === 'all'
			? this.newsArticles
			: this.newsArticles.filter(a => a.category === this.newsFilter);
	}

	/** Return a short relative time label for a news article's pubDate. */
	protected newsAge(pubDate: string): string {
		const diff = Date.now() - new Date(pubDate).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		return `${Math.floor(hrs / 24)}d ago`;
	}

	/** Return links filtered by the active category tab and the search string. */
	protected get filteredLinks(): any[] {
		return this.links.filter(link => {
			const matchesCategory = this.activeCategory === 'all' || link.category === this.activeCategory;
			const matchesSearch = !this.linkSearch.trim() ||
				link.title.toLowerCase().includes(this.linkSearch.toLowerCase());
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
			return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
		} catch {
			return '';
		}
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
		this.databaseService.incrementLinkVisit(link._id, link.visitCount ?? 0);
	}

	/**
	 * Return the number of links belonging to a given category key.
	 *
	 * @param categoryKey - The category _id, or 'all' for the total count.
	 * @returns The count of matching links.
	 */
	protected getLinkCount(categoryKey: string): number {
		if (categoryKey === 'all') return this.links.length;
		return this.links.filter(l => l.category === categoryKey).length;
	}

	/** Open the Add Link dialog with a blank form. */
	protected openAddLinkDialog(): void {
		this.editingLink = null;
		this.linkDialogTitle = 'Add Link';
		this.linkForm = { url: '', title: '', category: this.activeCategory !== 'all' ? this.activeCategory : '' };
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
		this.linkDialogTitle = 'Edit Link';
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
		this.databaseService.proxyFetch(url).then(res => {
			const match = res.content?.match(/<title[^>]*>([^<]+)<\/title>/i);
			if (match?.[1]) this.linkForm.title = match[1].trim();
			this.linkMetaLoading = false;
			this.cdr.markForCheck();
		}).catch(() => {
			this.linkMetaLoading = false;
		});
	}

	/** Save the link form (add or update). */
	protected async saveLinkDialog(): Promise<void> {
		const { url, title, category } = this.linkForm;
		if (!url.trim() || !title.trim() || !category) {
			this.messageService.add({ severity: 'warn', summary: 'Missing fields', detail: 'URL, title, and category are required' });
			return;
		}
		const finalUrl = this.normalizeUrl(url.trim());
		if (this.editingLink) {
			await this.databaseService.updateUsefulLink(this.editingLink._id, { url: finalUrl, title: title.trim(), category });
			this.messageService.add({ severity: 'success', summary: 'Link updated' });
		} else {
			await this.databaseService.addUsefulLink({
				url: finalUrl, title: title.trim(), category,
				visitCount: 0, createdAt: new Date().toISOString()
			});
			this.messageService.add({ severity: 'success', summary: 'Link saved' });
		}
		this.showLinkDialog = false;
	}

	/**
	 * Prompt the user to confirm deletion of a link, then remove it.
	 *
	 * @param link - The link document to delete.
	 * @param event - The click event (stopped to prevent card click).
	 */
	protected deleteLink(link: any, event: Event): void {
		event.stopPropagation();
		if (!confirm(`Delete "${link.title}"?`)) return;
		this.databaseService.removeUsefulLink(link._id);
		this.messageService.add({ severity: 'info', summary: 'Link deleted' });
	}

	/** Open the Add Category dialog with a blank form. */
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

	/** Save the category form (add or update). */
	protected async saveCategoryDialog(): Promise<void> {
		const { name, color } = this.categoryForm;
		if (!name.trim()) {
			this.messageService.add({ severity: 'warn', summary: 'Name required' });
			return;
		}
		if (this.editingCategory) {
			await this.databaseService.updateLinkCategory(this.editingCategory._id, { name: name.trim(), color });
			this.messageService.add({ severity: 'success', summary: 'Category updated' });
		} else {
			await this.databaseService.addLinkCategory({ name: name.trim(), color, order: this.categories.length });
			this.messageService.add({ severity: 'success', summary: 'Category added' });
		}
		this.showCategoryDialog = false;
	}

	/**
	 * Delete a category after user confirmation.
	 *
	 * @param category - The category document to delete.
	 * @param event - The click event (stopped to prevent tab switch).
	 */
	protected deleteCategory(category: any, event: Event): void {
		event.stopPropagation();
		if (!confirm(`Delete category "${category.name}"? Links in this category will become uncategorised.`)) return;
		this.databaseService.removeLinkCategory(category._id);
		this.messageService.add({ severity: 'info', summary: 'Category deleted' });
	}
}
