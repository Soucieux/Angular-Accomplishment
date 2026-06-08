import {
	AfterViewInit,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	NgZone,
	OnChanges,
	OnInit,
	Output,
	SimpleChanges,
	inject
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../backend/authentication-service/auth.service';
import { OrbitalStore } from './orbital.store';
import { Concentric, WeekAgenda, hexToRgba } from './shared.components';
import {
	OrbitalAgendaItem,
	OrbitalActivityRow,
	OrbitalDebtRow,
	OrbitalQuickAction,
	OrbitalRecipeRow,
	OrbitalReminderRow,
	OrbitalWeekDay
} from './orbital.model';
import { HomeStats, RecentActivityItem } from '../home.model';
import { NexusCategory, NexusLink } from '../../nexus/nexus.model';
import { Utilities } from '../../../common/app.utilities';
import {
	ACTIVITY_SOURCE_DEBT,
	ACTIVITY_SOURCE_LINK,
	ACTIVITY_SOURCE_MOVIE,
	ACTIVITY_SOURCE_PATCH,
	ACTIVITY_SOURCE_RECIPE,
	ACTIVITY_SOURCE_REMINDER,
	ACTIVITY_SOURCE_RESONANCE,
	ACTIVITY_TYPE_BUG_LOGGED,
	ACTIVITY_TYPE_EDITED,
	ACTIVITY_TYPE_RESET,
	ACTIVITY_TYPE_STATUS_CHANGED,
	ACTIVITY_TYPE_UPDATED,
	DAY_NAMES_SHORT,
	GENRE_FAVOURITE,
	HISTORY_STATUS_DELETED,
	HOME_ACTIVITY_COLOR_DEBT,
	HOME_ACTIVITY_COLOR_DELETED,
	HOME_ACTIVITY_COLOR_LINK,
	HOME_ACTIVITY_COLOR_MOVIE,
	HOME_ACTIVITY_COLOR_NEUTRAL,
	HOME_ACTIVITY_COLOR_PATCH,
	HOME_ACTIVITY_COLOR_RECIPE,
	HOME_ACTIVITY_COLOR_REMINDER,
	HOME_ACTIVITY_COLOR_RESONANCE,
	HOME_ACTIVITY_ICON_DEBT_ADDED,
	HOME_ACTIVITY_ICON_DEBT_REMOVED,
	HOME_ACTIVITY_ICON_DEBT_RESET,
	HOME_ACTIVITY_ICON_DEBT_UPDATED,
	HOME_ACTIVITY_ICON_DELETED,
	HOME_ACTIVITY_ICON_LINK_ADDED,
	HOME_ACTIVITY_ICON_LINK_REMOVED,
	HOME_ACTIVITY_ICON_LINK_UPDATED,
	HOME_ACTIVITY_ICON_MOVIE_ADDED,
	HOME_ACTIVITY_ICON_MOVIE_REMOVED,
	HOME_ACTIVITY_ICON_MOVIE_SEARCHED,
	HOME_ACTIVITY_ICON_MOVIE_UPDATED,
	HOME_ACTIVITY_ICON_PATCH_ADDED,
	HOME_ACTIVITY_ICON_PATCH_BUG,
	HOME_ACTIVITY_ICON_PATCH_STATUS,
	HOME_ACTIVITY_ICON_PATCH_UPDATED,
	HOME_ACTIVITY_ICON_RECIPE_ADDED,
	HOME_ACTIVITY_ICON_RECIPE_REMOVED,
	HOME_ACTIVITY_ICON_RECIPE_UPDATED,
	HOME_ACTIVITY_ICON_REMINDER_ADDED,
	HOME_ACTIVITY_ICON_REMINDER_UPDATED,
	HOME_ACTIVITY_ICON_RESONANCE_ADDED,
	HOME_ACTIVITY_ICON_RESONANCE_REMOVED,
	HOME_ACTIVITY_LABEL_DEBT_ADDED,
	HOME_ACTIVITY_LABEL_DEBT_REMOVED,
	HOME_ACTIVITY_LABEL_DEBT_RESET,
	HOME_ACTIVITY_LABEL_DEBT_UPDATED,
	HOME_ACTIVITY_LABEL_LINK_ADDED,
	HOME_ACTIVITY_LABEL_LINK_REMOVED,
	HOME_ACTIVITY_LABEL_LINK_UPDATED,
	HOME_ACTIVITY_LABEL_MOVIE_ADDED,
	HOME_ACTIVITY_LABEL_MOVIE_REMOVED,
	HOME_ACTIVITY_LABEL_MOVIE_SEARCHED,
	HOME_ACTIVITY_LABEL_MOVIE_UPDATED,
	HOME_ACTIVITY_LABEL_PATCH_ADDED,
	HOME_ACTIVITY_LABEL_PATCH_BUG,
	HOME_ACTIVITY_LABEL_PATCH_DELETED,
	HOME_ACTIVITY_LABEL_PATCH_STATUS,
	HOME_ACTIVITY_LABEL_PATCH_UPDATED,
	HOME_ACTIVITY_LABEL_RECIPE_ADDED,
	HOME_ACTIVITY_LABEL_RECIPE_REMOVED,
	HOME_ACTIVITY_LABEL_RECIPE_UPDATED,
	HOME_ACTIVITY_LABEL_REMINDER_ADDED,
	HOME_ACTIVITY_LABEL_REMINDER_DELETED,
	HOME_ACTIVITY_LABEL_REMINDER_UPDATED,
	HOME_ACTIVITY_LABEL_RESONANCE_ADDED,
	HOME_ACTIVITY_LABEL_RESONANCE_REMOVED,
	HOME_AGENDA_ICON_REMINDER,
	HOME_DEBT_ROW_ID_PREFIX,
	HOME_GENRE_COLORS,
	HOME_LINKS_DOT_FALLBACK,
	HOME_OVERFLOW_LABEL_DEBT,
	HOME_OVERFLOW_LABEL_LINKS,
	HOME_OVERFLOW_LABEL_RECIPES,
	HOME_OVERFLOW_LABEL_REMINDERS,
	HOME_QUICK_ACTION_GRADIENT_DEBT,
	HOME_QUICK_ACTION_GRADIENT_LINK,
	HOME_QUICK_ACTION_GRADIENT_MOVIE,
	HOME_QUICK_ACTION_GRADIENT_QUOTE,
	HOME_QUICK_ACTION_GRADIENT_RECIPE,
	HOME_QUICK_ACTION_GRADIENT_REMINDER,
	HOME_QUICK_ACTION_ICON_DEBT,
	HOME_QUICK_ACTION_ICON_LINK,
	HOME_QUICK_ACTION_ICON_MOVIE,
	HOME_QUICK_ACTION_ICON_QUOTE,
	HOME_QUICK_ACTION_ICON_RECIPE,
	HOME_QUICK_ACTION_ICON_REMINDER,
	HOME_QUICK_ACTION_LABEL_DEBT,
	HOME_QUICK_ACTION_LABEL_LINK,
	HOME_QUICK_ACTION_LABEL_MOVIE,
	HOME_QUICK_ACTION_LABEL_QUOTE,
	HOME_QUICK_ACTION_LABEL_RECIPE,
	HOME_QUICK_ACTION_LABEL_REMINDER,
	HOME_QUICK_ACTION_ROUTE_DEBT,
	HOME_QUICK_ACTION_ROUTE_ENTERTAINMENT,
	HOME_QUICK_ACTION_ROUTE_NEXUS,
	HOME_QUICK_ACTION_ROUTE_RECIPE,
	HOME_QUICK_ACTION_ROUTE_REMINDER,
	HOME_QUICK_ACTION_ROUTE_RESONANCE,
	HOME_ORBITAL_CHANGES_KEY_STATS,
	HOME_ORBITAL_PANEL_SCROLL_SELECTOR,
	HOME_REMINDER_ROW_ID_PREFIX,
	HOME_CONCENTRIC_SIZE_DEFAULT,
	HOME_CONCENTRIC_SIZE_NARROW,
	LINK_TARGET_BLANK,
	SEARCH,
	STATS_FIELD_DEBT_UPCOMING,
	STATS_FIELD_GENRE,
	STATS_FIELD_RECENT_ACTIVITIES,
	STATS_FIELD_RECIPE_LIST,
	STATS_FIELD_REMINDER_UPCOMING
} from '../../../common/app.constant';

@Component({
	selector: 'orbital',
	standalone: true,
	imports: [Concentric, WeekAgenda, AsyncPipe],
	templateUrl: './orbital.component.html',
	styleUrl: './orbital.component.css',
	providers: [OrbitalStore]
})
export class OrbitalComponent implements OnInit, AfterViewInit, OnChanges {
	protected readonly d = inject(OrbitalStore);
	private readonly router = inject(Router);
	private readonly elementRef = inject(ElementRef);
	private readonly ngZone = inject(NgZone);
	private readonly authService = inject(AuthService);
	private readonly utilities = inject(Utilities);

	@Input() stats: HomeStats | null = null;
	@Input() links: NexusLink[] = [];
	@Input() dashCategories: NexusCategory[] = [];
	@Output() readonly linkVisit = new EventEmitter<{ id: string; count: number }>();

	protected readonly HOME_OVERFLOW_LABEL_REMINDERS = HOME_OVERFLOW_LABEL_REMINDERS;
	protected readonly HOME_OVERFLOW_LABEL_DEBT = HOME_OVERFLOW_LABEL_DEBT;
	protected readonly HOME_OVERFLOW_LABEL_RECIPES = HOME_OVERFLOW_LABEL_RECIPES;
	protected readonly HOME_OVERFLOW_LABEL_LINKS = HOME_OVERFLOW_LABEL_LINKS;
	protected readonly HOME_QUICK_ACTION_ROUTE_REMINDER = HOME_QUICK_ACTION_ROUTE_REMINDER;
	protected readonly HOME_QUICK_ACTION_ROUTE_DEBT = HOME_QUICK_ACTION_ROUTE_DEBT;
	protected readonly HOME_QUICK_ACTION_ROUTE_RECIPE = HOME_QUICK_ACTION_ROUTE_RECIPE;
	protected readonly HOME_QUICK_ACTION_ROUTE_NEXUS = HOME_QUICK_ACTION_ROUTE_NEXUS;

	protected readonly QUICK_ACTIONS: OrbitalQuickAction[] = [
		{
			icon: HOME_QUICK_ACTION_ICON_MOVIE,
			label: HOME_QUICK_ACTION_LABEL_MOVIE,
			gradient: HOME_QUICK_ACTION_GRADIENT_MOVIE,
			route: HOME_QUICK_ACTION_ROUTE_ENTERTAINMENT,
			state: { openAddDialog: true }
		},
		{
			icon: HOME_QUICK_ACTION_ICON_QUOTE,
			label: HOME_QUICK_ACTION_LABEL_QUOTE,
			gradient: HOME_QUICK_ACTION_GRADIENT_QUOTE,
			route: HOME_QUICK_ACTION_ROUTE_RESONANCE
		},
		{
			icon: HOME_QUICK_ACTION_ICON_RECIPE,
			label: HOME_QUICK_ACTION_LABEL_RECIPE,
			gradient: HOME_QUICK_ACTION_GRADIENT_RECIPE,
			route: HOME_QUICK_ACTION_ROUTE_RECIPE,
			state: { openAddView: true }
		},
		{
			icon: HOME_QUICK_ACTION_ICON_DEBT,
			label: HOME_QUICK_ACTION_LABEL_DEBT,
			gradient: HOME_QUICK_ACTION_GRADIENT_DEBT,
			route: HOME_QUICK_ACTION_ROUTE_DEBT,
			state: { openAddDialog: true }
		},
		{
			icon: HOME_QUICK_ACTION_ICON_REMINDER,
			label: HOME_QUICK_ACTION_LABEL_REMINDER,
			gradient: HOME_QUICK_ACTION_GRADIENT_REMINDER,
			route: HOME_QUICK_ACTION_ROUTE_REMINDER
		},
		{
			icon: HOME_QUICK_ACTION_ICON_LINK,
			label: HOME_QUICK_ACTION_LABEL_LINK,
			gradient: HOME_QUICK_ACTION_GRADIENT_LINK,
			route: HOME_QUICK_ACTION_ROUTE_NEXUS,
			state: { openAddLinkDialog: true }
		}
	];

	protected currentUser$!: Observable<any>;
	protected genreBars: { label: string; count: number; percentage: number; color: string }[] = [];
	protected reminderRows: OrbitalReminderRow[] = [];
	protected recipeRows: OrbitalRecipeRow[] = [];
	protected debtRows: OrbitalDebtRow[] = [];
	protected activityRows: OrbitalActivityRow[] = [];
	protected concentricSize = this.utilities.isNarrowViewport()
		? HOME_CONCENTRIC_SIZE_NARROW
		: HOME_CONCENTRIC_SIZE_DEFAULT;

	/**
	 * Subscribes to the auth state observable to keep the current user up to date.
	 */
	ngOnInit(): void {
		this.currentUser$ = this.authService.getCurrentUser();
	}

	/**
	 * Attaches the scroll auto-hide behaviour to all glass panel elements after the view renders.
	 */
	ngAfterViewInit(): void {
		this.ngZone.runOutsideAngular(() => {
			const panels = (this.elementRef.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
				HOME_ORBITAL_PANEL_SCROLL_SELECTOR
			);
			panels.forEach((panel) => Utilities.attachScrollAutoHide(panel));
		});
	}

	/**
	 * Rebuilds derived panel data whenever the stats or links inputs change.
	 *
	 * @param changes - The Angular change record for this cycle.
	 */
	ngOnChanges(changes: SimpleChanges): void {
		if (changes[HOME_ORBITAL_CHANGES_KEY_STATS] && this.stats) {
			this.genreBars = this.buildGenreBars();
			this.reminderRows = this.buildReminderRows();
			this.recipeRows = this.buildRecipeRows();
			this.debtRows = this.buildDebtRows();
			this.activityRows = this.buildActivityRows();
			this.syncWeekData();
		}
	}

	/**
	 * Updates the cached concentric ring diameter when the viewport is resized.
	 */
	@HostListener('window:resize')
	protected onResize(): void {
		this.concentricSize = this.utilities.isNarrowViewport()
			? HOME_CONCENTRIC_SIZE_NARROW
			: HOME_CONCENTRIC_SIZE_DEFAULT;
	}

	/**
	 * Gets links marked as pinned for display in the top quick-access strip,
	 * capped at the first six pinned items.
	 *
	 * @returns Up to six NexusLink items where isPinned is true.
	 */
	protected get pinnedLinks(): NexusLink[] {
		return this.links.filter((link) => link.isPinned === true).slice(0, 6);
	}

	/**
	 * Gets the true total number of open reminders from the statistics document.
	 * Reads reminderTotal directly so the count is never limited by the 20-item
	 * cap applied to the reminderUpcoming array.
	 *
	 * @returns The full reminder count from stats, or 0 if not yet loaded.
	 */
	protected get openReminderCount(): number {
		return this.stats?.reminderTotal ?? 0;
	}

	/**
	 * Gets the total number of patch notes from the statistics document.
	 *
	 * @returns The patch notes count from stats, or 0 if not yet loaded.
	 */
	protected get patchNotesCount(): number {
		return this.stats?.patchNotesTotal ?? 0;
	}

	/**
	 * Gets the true total number of unpaid debts from the statistics document.
	 * Reads debtTotal directly so the count is never limited by the 20-item
	 * cap applied to the debtUpcoming array.
	 *
	 * @returns The full unpaid debt count from stats, or 0 if not yet loaded.
	 */
	protected get openDebtCount(): number {
		return this.stats?.debtTotal ?? 0;
	}

	/**
	 * Navigates to the route associated with a quick-action button.
	 *
	 * @param action - The quick-action descriptor containing the target route and optional state.
	 */
	protected navigateTo(action: OrbitalQuickAction): void {
		this.router
			.navigate([action.route], action.state ? { state: action.state } : undefined)
			.catch(() => {});
	}

	/**
	 * Navigates to a page by its route path. Used by overflow rows to send
	 * the user to the full list when the panel cap has been reached.
	 *
	 * @param route - The route path to navigate to.
	 */
	protected navigateToPage(route: string): void {
		this.router.navigate([route]).catch(() => {});
	}

	/**
	 * Opens a useful link in a new tab and emits a linkVisit event with the updated count.
	 *
	 * @param link - The NexusLink to open.
	 */
	protected openLink(link: NexusLink): void {
		window.open(link.url, LINK_TARGET_BLANK);
		this.linkVisit.emit({ id: link._id, count: (link.visitCount ?? 0) + 1 });
	}

	/**
	 * Gets the dot colour for a quick-access link derived from its category.
	 *
	 * @param link - The NexusLink whose colour is needed.
	 * @returns A CSS colour string from the category, or the fallback colour.
	 */
	protected getLinkColor(link: NexusLink): string {
		const category = this.dashCategories.find((dashCategory) => dashCategory._id === link.category);
		return category?.color ?? HOME_LINKS_DOT_FALLBACK;
	}

	/**
	 * Gets the icon badge background for an activity row.
	 *
	 * @param color - The hex accent colour string.
	 * @returns A CSS rgba() colour string at 20% opacity.
	 */
	protected getIconBackground(color: string): string {
		return hexToRgba(color, 0.2);
	}

	/**
	 * Builds the genre bar data from the current stats, limited to the top 5 genres
	 * sorted by count descending, with percentage relative to the top genre.
	 *
	 * @returns An array of genre bar descriptors for the recipes panel.
	 */
	private buildGenreBars(): { label: string; count: number; percentage: number; color: string }[] {
		const raw = this.stats?.[STATS_FIELD_GENRE];
		if (!raw) return [];
		const entries = Object.entries(raw as Record<string, number>)
			.filter(([key, value]) => key !== GENRE_FAVOURITE && (value as number) > 0)
			.map(([label, count]) => ({ label, count: count as number }));
		if (!entries.length) return [];
		entries.sort((a, b) => b.count - a.count);
		const max = entries[0].count;
		return entries.slice(0, 5).map((genre, index) => ({
			...genre,
			percentage: Math.round((genre.count / max) * 100),
			color: HOME_GENRE_COLORS[index % HOME_GENRE_COLORS.length]
		}));
	}

	/**
	 * Builds the reminder row data from the current stats, sorted by date ascending.
	 * All stored items are shown; the stats array is already capped at 20 on write.
	 *
	 * @returns An array of reminder row descriptors for the reminders panel.
	 */
	private buildReminderRows(): OrbitalReminderRow[] {
		const raw = Utilities.toArray(this.stats?.[STATS_FIELD_REMINDER_UPCOMING]);
		return raw
			.filter((item) => {
				const reminder = item as { date?: string | null };
				return reminder.date && Utilities.coerceDateToString(reminder.date);
			})
			.sort((a, b) => {
				const toMs = (item: unknown) => {
					const dateStr = Utilities.coerceDateToString((item as { date?: unknown }).date);
					const [year, month, day] = dateStr.split('-').map(Number);
					return new Date(year, month - 1, day).getTime();
				};
				return toMs(a) - toMs(b);
			})
			.map((item, index) => {
				const reminder = item as { name?: string; date?: string | null };
				const overdue = Utilities.isOverdue(reminder.date);
				return {
					id: `${HOME_REMINDER_ROW_ID_PREFIX}${index}`,
					name: reminder.name ?? '',
					dueLabel: Utilities.getDaysUntil(reminder.date),
					overdue
				};
			});
	}

	/**
	 * Builds the recipe row data from the current stats.
	 *
	 * @returns An array of recipe row descriptors for the recipes panel.
	 */
	private buildRecipeRows(): OrbitalRecipeRow[] {
		const raw = Utilities.toArray(this.stats?.[STATS_FIELD_RECIPE_LIST]);
		return raw.map((item) => {
			const recipe = item as { id?: string; name?: string; category?: string };
			return {
				id: recipe.id ?? '',
				name: recipe.name ?? '',
				category: recipe.category ?? ''
			};
		});
	}

	/**
	 * Builds the debt row data from the current stats, sorted by date ascending.
	 * All stored items are shown; the stats array is already capped at 20 on write.
	 *
	 * @returns An array of debt row descriptors for the debt-sonata panel.
	 */
	private buildDebtRows(): OrbitalDebtRow[] {
		const raw = Utilities.toArray(this.stats?.[STATS_FIELD_DEBT_UPCOMING]);
		return raw
			.filter((item) => {
				const debt = item as { date?: string | null };
				return debt.date && Utilities.coerceDateToString(debt.date);
			})
			.sort((a, b) => {
				const toMs = (item: unknown) => {
					const dateStr = Utilities.coerceDateToString((item as { date?: unknown }).date);
					const [year, month, day] = dateStr.split('-').map(Number);
					return new Date(year, month - 1, day).getTime();
				};
				return toMs(a) - toMs(b);
			})
			.map((item, index) => {
				const debt = item as { name?: string; date?: string | null };
				const overdue = Utilities.isOverdue(debt.date);
				return {
					id: `${HOME_DEBT_ROW_ID_PREFIX}${index}`,
					name: debt.name ?? '',
					dueLabel: Utilities.getDaysUntil(debt.date),
					overdue
				};
			});
	}

	/**
	 * Builds the activity row data from the unified recentActivities stats array.
	 * Branches by source to apply the correct icon, label, colour, and detail
	 * for all seven sources: movie, reminder, resonance, patch, link, debt, recipe.
	 * The array is already sorted newest-first and capped at 20 on write.
	 *
	 * @returns An array of activity row descriptors for the activity panel.
	 */
	private buildActivityRows(): OrbitalActivityRow[] {
		const raw = Utilities.toArray(this.stats?.[STATS_FIELD_RECENT_ACTIVITIES]) as RecentActivityItem[];
		const rows: OrbitalActivityRow[] = [];

		for (const entry of raw) {
			if (!entry.timestamp || !entry.source) continue;

			let icon = HOME_ACTIVITY_ICON_MOVIE_ADDED;
			let label = HOME_ACTIVITY_LABEL_MOVIE_ADDED;
			let color = HOME_ACTIVITY_COLOR_MOVIE;
			let detail = '';

			if (entry.source === ACTIVITY_SOURCE_MOVIE) {
				detail = Utilities.truncate(entry.title ?? '', 32);
				if (entry.type === ACTIVITY_TYPE_UPDATED) {
					icon = HOME_ACTIVITY_ICON_MOVIE_UPDATED;
					label = HOME_ACTIVITY_LABEL_MOVIE_UPDATED;
				} else if (entry.type === HISTORY_STATUS_DELETED) {
					icon = HOME_ACTIVITY_ICON_MOVIE_REMOVED;
					label = HOME_ACTIVITY_LABEL_MOVIE_REMOVED;
					color = HOME_ACTIVITY_COLOR_DELETED;
				} else if (entry.type === SEARCH) {
					icon = HOME_ACTIVITY_ICON_MOVIE_SEARCHED;
					label = HOME_ACTIVITY_LABEL_MOVIE_SEARCHED;
					detail = '';
				}
			} else if (entry.source === ACTIVITY_SOURCE_REMINDER) {
				icon = HOME_ACTIVITY_ICON_REMINDER_ADDED;
				label = HOME_ACTIVITY_LABEL_REMINDER_ADDED;
				color = HOME_ACTIVITY_COLOR_REMINDER;
				detail = Utilities.truncate(entry.text ?? '', 32);
				if (entry.type === ACTIVITY_TYPE_UPDATED) {
					icon = HOME_ACTIVITY_ICON_REMINDER_UPDATED;
					label = HOME_ACTIVITY_LABEL_REMINDER_UPDATED;
				} else if (entry.type === HISTORY_STATUS_DELETED) {
					icon = HOME_ACTIVITY_ICON_DELETED;
					label = HOME_ACTIVITY_LABEL_REMINDER_DELETED;
					color = HOME_ACTIVITY_COLOR_DELETED;
				}
			} else if (entry.source === ACTIVITY_SOURCE_RESONANCE) {
				const isDeleted = entry.type === HISTORY_STATUS_DELETED;
				icon = isDeleted ? HOME_ACTIVITY_ICON_RESONANCE_REMOVED : HOME_ACTIVITY_ICON_RESONANCE_ADDED;
				label = isDeleted
					? HOME_ACTIVITY_LABEL_RESONANCE_REMOVED
					: HOME_ACTIVITY_LABEL_RESONANCE_ADDED;
				color = isDeleted ? HOME_ACTIVITY_COLOR_DELETED : HOME_ACTIVITY_COLOR_RESONANCE;
				detail = Utilities.truncate(entry.author ?? '', 32);
			} else if (entry.source === ACTIVITY_SOURCE_PATCH) {
				icon = HOME_ACTIVITY_ICON_PATCH_ADDED;
				label = HOME_ACTIVITY_LABEL_PATCH_ADDED;
				color = HOME_ACTIVITY_COLOR_PATCH;
				detail = `#${entry.noteIndex ?? '?'} · ${entry.component ?? ''} · ${entry.element ?? ''}`;
				if (entry.type === ACTIVITY_TYPE_BUG_LOGGED) {
					icon = HOME_ACTIVITY_ICON_PATCH_BUG;
					label = HOME_ACTIVITY_LABEL_PATCH_BUG;
				} else if (entry.type === ACTIVITY_TYPE_STATUS_CHANGED) {
					icon = HOME_ACTIVITY_ICON_PATCH_STATUS;
					label = HOME_ACTIVITY_LABEL_PATCH_STATUS;
				} else if (entry.type === ACTIVITY_TYPE_EDITED) {
					icon = HOME_ACTIVITY_ICON_PATCH_UPDATED;
					label = HOME_ACTIVITY_LABEL_PATCH_UPDATED;
				} else if (entry.type === HISTORY_STATUS_DELETED) {
					icon = HOME_ACTIVITY_ICON_DELETED;
					label = HOME_ACTIVITY_LABEL_PATCH_DELETED;
					color = HOME_ACTIVITY_COLOR_DELETED;
				}
			} else if (entry.source === ACTIVITY_SOURCE_LINK) {
				icon = HOME_ACTIVITY_ICON_LINK_ADDED;
				label = HOME_ACTIVITY_LABEL_LINK_ADDED;
				color = HOME_ACTIVITY_COLOR_LINK;
				detail = Utilities.truncate(entry.domain ?? '', 32);
				if (entry.type === ACTIVITY_TYPE_UPDATED) {
					icon = HOME_ACTIVITY_ICON_LINK_UPDATED;
					label = HOME_ACTIVITY_LABEL_LINK_UPDATED;
				} else if (entry.type === HISTORY_STATUS_DELETED) {
					icon = HOME_ACTIVITY_ICON_LINK_REMOVED;
					label = HOME_ACTIVITY_LABEL_LINK_REMOVED;
					color = HOME_ACTIVITY_COLOR_DELETED;
				}
			} else if (entry.source === ACTIVITY_SOURCE_DEBT) {
				icon = HOME_ACTIVITY_ICON_DEBT_ADDED;
				label = HOME_ACTIVITY_LABEL_DEBT_ADDED;
				color = HOME_ACTIVITY_COLOR_DEBT;
				detail = Utilities.truncate(entry.name ?? '', 32);
				if (entry.type === ACTIVITY_TYPE_UPDATED) {
					icon = HOME_ACTIVITY_ICON_DEBT_UPDATED;
					label = HOME_ACTIVITY_LABEL_DEBT_UPDATED;
				} else if (entry.type === ACTIVITY_TYPE_RESET) {
					icon = HOME_ACTIVITY_ICON_DEBT_RESET;
					label = HOME_ACTIVITY_LABEL_DEBT_RESET;
				} else if (entry.type === HISTORY_STATUS_DELETED) {
					icon = HOME_ACTIVITY_ICON_DEBT_REMOVED;
					label = HOME_ACTIVITY_LABEL_DEBT_REMOVED;
					color = HOME_ACTIVITY_COLOR_DELETED;
				}
			} else if (entry.source === ACTIVITY_SOURCE_RECIPE) {
				icon = HOME_ACTIVITY_ICON_RECIPE_ADDED;
				label = HOME_ACTIVITY_LABEL_RECIPE_ADDED;
				color = HOME_ACTIVITY_COLOR_RECIPE;
				detail = Utilities.truncate(entry.name ?? '', 32);
				if (entry.type === ACTIVITY_TYPE_UPDATED) {
					icon = HOME_ACTIVITY_ICON_RECIPE_UPDATED;
					label = HOME_ACTIVITY_LABEL_RECIPE_UPDATED;
				} else if (entry.type === HISTORY_STATUS_DELETED) {
					icon = HOME_ACTIVITY_ICON_RECIPE_REMOVED;
					label = HOME_ACTIVITY_LABEL_RECIPE_REMOVED;
					color = HOME_ACTIVITY_COLOR_DELETED;
				}
			} else {
				continue;
			}

			rows.push({ icon, label, detail, time: Utilities.getRelativeTime(entry.timestamp), color });
		}

		return rows;
	}

	/**
	 * Populates the store with the current week's day descriptors and per-day agenda items
	 * derived from the upcoming reminders and debts in the stats payload.
	 */
	private syncWeekData(): void {
		const today = new Date();
		const dow = today.getDay();
		const mondayOffset = dow === 0 ? -6 : 1 - dow;
		const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + mondayOffset);

		const rawReminders = Utilities.toArray(this.stats?.[STATS_FIELD_REMINDER_UPCOMING]) as {
			date?: string | null;
			name?: string;
		}[];
		const rawDebts = Utilities.toArray(this.stats?.[STATS_FIELD_DEBT_UPCOMING]) as {
			date?: string | null;
			name?: string;
		}[];

		const agenda: Record<number, OrbitalAgendaItem[]> = {};
		const monToSunLabels = [...DAY_NAMES_SHORT.slice(1), DAY_NAMES_SHORT[0]];
		const days: OrbitalWeekDay[] = monToSunLabels.map((label, dayIndex) => {
			const dayDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + dayIndex);
			const dateKey = Utilities.formatDateForStorage(dayDate);

			const dayReminders = rawReminders.filter((reminder) => {
				if (!reminder.date) return false;
				return Utilities.coerceDateToString(reminder.date) === dateKey;
			});
			const dayDebts = rawDebts.filter((debt) => {
				if (!debt.date) return false;
				return Utilities.coerceDateToString(debt.date) === dateKey;
			});

			agenda[dayIndex] = [
				...dayReminders.map((reminder) => ({
					icon: HOME_AGENDA_ICON_REMINDER,
					name: reminder.name ?? '',
					tag: dateKey,
					color: HOME_ACTIVITY_COLOR_REMINDER
				})),
				...dayDebts.map((debt) => ({
					icon: HOME_QUICK_ACTION_ICON_DEBT,
					name: debt.name ?? '',
					tag: dateKey,
					color: HOME_ACTIVITY_COLOR_NEUTRAL
				}))
			];

			const isToday = dayDate.toDateString() === today.toDateString();
			const isPast = dayDate < today && !isToday;
			return {
				label,
				dayIndex,
				dayNumber: dayDate.getDate(),
				isToday,
				isPast,
				fullDate: dayDate,
				count: dayReminders.length + dayDebts.length
			};
		});

		this.d.setWeekData(days, agenda);
	}

	/**
	 * Gets the display name for the signed-in user.
	 *
	 * @param user - The authenticated user object from the auth observable.
	 * @returns The user's display name, or an empty string if unavailable.
	 */
	protected getUserDisplayName(user: any): string {
		return Utilities.getUserDisplayName(user);
	}
}
