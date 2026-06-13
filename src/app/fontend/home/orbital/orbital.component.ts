import {
	AfterViewInit,
	Component,
	ElementRef,
	EventEmitter,
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
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../../backend/authentication-service/auth.service';
import { OrbitalStore } from './orbital.store';
import { Concentric, WeekAgenda, hexToRgba } from './shared.components';
import {
	DAY_NAMES_SHORT,
	HOME_GENRE_COLORS,
	OrbitalAgendaItem,
	OrbitalActivityRow,
	OrbitalDebtRow,
	OrbitalQuickAction,
	OrbitalRecipeRow,
	OrbitalReminderRow,
	OrbitalUrgentItem,
	OrbitalWeekDay,
	QUICK_ACTIONS
} from './orbital.model';
import { HomeStats, RecentActivityItem } from '../home.model';
import { NexusCategory, NexusLink } from '../../nexus/nexus.model';
import { DEBT_CATEGORY_DEFS } from '../../debt/debt.model';
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
	GENRE_FAVOURITE,
	HISTORY_STATUS_DELETED,
	LINK_TARGET_BLANK,
	SEARCH,
	STATS_FIELD_DEBT_UPCOMING,
	STATS_FIELD_GENRE,
	STATS_FIELD_RECENT_ACTIVITIES,
	STATS_FIELD_RECIPE_LIST,
	STATS_FIELD_REMINDER_UPCOMING,
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
	HOME_ACTIVITY_FOOTER_EN,
	HOME_ACTIVITY_FOOTER_ZH,
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
	HOME_CONCENTRIC_SIZE_DEFAULT,
	HOME_DEBT_ROW_ID_PREFIX,
	HOME_LINKS_DOT_FALLBACK,
	HOME_ORBITAL_CHANGES_KEY_STATS,
	HOME_ORBITAL_PANEL_SCROLL_SELECTOR,
	HOME_OVERFLOW_LABEL_DEBT,
	HOME_OVERFLOW_LABEL_LINKS,
	HOME_OVERFLOW_LABEL_RECIPES,
	HOME_OVERFLOW_LABEL_REMINDERS,
	HOME_QUICK_ACTION_ROUTE_DEBT,
	HOME_QUICK_ACTION_ROUTE_ENTERTAINMENT,
	HOME_QUICK_ACTION_ROUTE_NEXUS,
	HOME_QUICK_ACTION_ROUTE_RECIPE,
	HOME_QUICK_ACTION_ROUTE_REMINDER,
	HOME_REMINDER_ROW_ID_PREFIX,
	HOME_SATELLITE_TOOLTIP_STREAK,
	ORBITAL_URGENCY_CHIP_TYPE_DEBT,
	ORBITAL_URGENCY_CHIP_TYPE_REMINDER,
	ORBITAL_URGENCY_GROUP_SEPARATOR,
	ORBITAL_URGENCY_ITEM_SEPARATOR,
	ORBITAL_URGENCY_LABEL_DEBTS,
	ORBITAL_URGENCY_LABEL_REMINDERS,
	ORBITAL_URGENCY_LABEL_VARIOUS,
	ORBITAL_URGENCY_TEXT_MAX_CHARS,
	ORBITAL_URGENCY_WINDOW_DAYS
} from '../../../common/app.constant';

@Component({
	selector: 'orbital',
	standalone: true,
	imports: [Concentric, WeekAgenda, AsyncPipe, TooltipModule],
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

	@Input() stats: HomeStats | null = null;
	@Input() links: NexusLink[] = [];
	@Input() dashCategories: NexusCategory[] = [];
	@Output() readonly linkVisit = new EventEmitter<{ id: string; count: number }>();

	protected readonly HOME_ACTIVITY_FOOTER_ZH = HOME_ACTIVITY_FOOTER_ZH;
	protected readonly HOME_ACTIVITY_FOOTER_EN = HOME_ACTIVITY_FOOTER_EN;
	protected readonly HOME_CONCENTRIC_SIZE_DEFAULT = HOME_CONCENTRIC_SIZE_DEFAULT;
	protected readonly QUICK_ACTIONS = QUICK_ACTIONS;
	protected readonly HOME_OVERFLOW_LABEL_REMINDERS = HOME_OVERFLOW_LABEL_REMINDERS;
	protected readonly HOME_OVERFLOW_LABEL_DEBT = HOME_OVERFLOW_LABEL_DEBT;
	protected readonly HOME_OVERFLOW_LABEL_RECIPES = HOME_OVERFLOW_LABEL_RECIPES;
	protected readonly HOME_OVERFLOW_LABEL_LINKS = HOME_OVERFLOW_LABEL_LINKS;
	protected readonly HOME_QUICK_ACTION_ROUTE_ENTERTAINMENT = HOME_QUICK_ACTION_ROUTE_ENTERTAINMENT;
	protected readonly HOME_QUICK_ACTION_ROUTE_REMINDER = HOME_QUICK_ACTION_ROUTE_REMINDER;
	protected readonly HOME_QUICK_ACTION_ROUTE_DEBT = HOME_QUICK_ACTION_ROUTE_DEBT;
	protected readonly HOME_QUICK_ACTION_ROUTE_RECIPE = HOME_QUICK_ACTION_ROUTE_RECIPE;
	protected readonly HOME_QUICK_ACTION_ROUTE_NEXUS = HOME_QUICK_ACTION_ROUTE_NEXUS;
	protected readonly HOME_SATELLITE_TOOLTIP_STREAK = HOME_SATELLITE_TOOLTIP_STREAK;
	protected currentUser$!: Observable<any>;
	protected genreBars: { label: string; count: number; percentage: number; color: string }[] = [];
	protected reminderRows: OrbitalReminderRow[] = [];
	protected recipeRows: OrbitalRecipeRow[] = [];
	protected debtRows: OrbitalDebtRow[] = [];
	protected activityRows: OrbitalActivityRow[] = [];
	protected addedThisWeek = 0;
	protected activityStreak = 0;

	/**
	 * Subscribes to the auth state observable to keep the current user up to date.
	 */
	ngOnInit(): void {
		this.currentUser$ = this.authService.currentUser$;
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
			this.activityStreak = this.buildActivityStreak();
			this.recipeRows = this.buildRecipeRows();
			this.debtRows = this.buildDebtRows();
			this.activityRows = this.buildActivityRows();
			this.addedThisWeek = this.buildAddedThisWeek();
			this.syncWeekData();
		}
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
	 * Gets the list of reminder and debt items due within the urgency window,
	 * sorted by ascending days until due so the most urgent appears first.
	 *
	 * @returns Merged, sorted array of urgent items for the urgency strip.
	 */
	protected get urgentItems(): OrbitalUrgentItem[] {
		return [
			...this.buildUrgentItems(this.reminderRows, ORBITAL_URGENCY_CHIP_TYPE_REMINDER as 'reminder'),
			...this.buildUrgentItems(this.debtRows, ORBITAL_URGENCY_CHIP_TYPE_DEBT as 'debt')
		].sort((a, b) => a.daysUntilDue - b.daysUntilDue);
	}

	/**
	 * Gets the urgency strip summary string. Reminders and debts are each
	 * built via {@link buildGroupSummary} and joined with the group separator.
	 *
	 * @returns Combined urgency summary string for the strip label.
	 */
	protected get urgentSummary(): string {
		const items = this.urgentItems;
		return [
			this.buildGroupSummary(
				items.filter((item) => item.type === ORBITAL_URGENCY_CHIP_TYPE_REMINDER),
				ORBITAL_URGENCY_LABEL_REMINDERS
			),
			this.buildGroupSummary(
				items.filter((item) => item.type === ORBITAL_URGENCY_CHIP_TYPE_DEBT),
				ORBITAL_URGENCY_LABEL_DEBTS
			)
		]
			.filter((part): part is string => part !== null)
			.join(ORBITAL_URGENCY_GROUP_SEPARATOR);
	}

	/**
	 * Filters a row array to items within the urgency window and maps each to
	 * an OrbitalUrgentItem with the given type literal.
	 *
	 * {@link urgentItems} - Builds the merged urgent list from reminders and debts.
	 *
	 * @param rows - The source rows, each carrying at minimum id, name, daysUntilDue, and dueLabel.
	 * @param type - The type literal to stamp on every produced item.
	 * @returns Filtered and mapped urgent items for the given source.
	 */
	private buildUrgentItems(
		rows: { id: string; name: string; daysUntilDue: number; dueLabel: string }[],
		type: OrbitalUrgentItem['type']
	): OrbitalUrgentItem[] {
		return rows
			.filter((row) => row.daysUntilDue <= ORBITAL_URGENCY_WINDOW_DAYS)
			.map((row) => ({ id: row.id, name: row.name, daysUntilDue: row.daysUntilDue, dueLabel: row.dueLabel, type }));
	}

	/**
	 * Formats one category group (reminders or debts) into a single summary
	 * segment. Returns null when the group is empty so callers can filter it out.
	 * Single items show the truncated name; multiple items show a count with the
	 * closest due date, appending "Various" when due dates differ.
	 *
	 * {@link urgentSummary} - Calls this for the reminder group and the debt group.
	 *
	 * @param items - The pre-filtered items for this group, sorted by daysUntilDue ascending.
	 * @param groupLabel - The plural label to display when there are multiple items.
	 * @returns A formatted string segment, or null when the group is empty.
	 */
	private buildGroupSummary(items: OrbitalUrgentItem[], groupLabel: string): string | null {
		if (!items.length) return null;
		if (items.length === 1) {
			return `${Utilities.truncate(items[0].name, ORBITAL_URGENCY_TEXT_MAX_CHARS)}${ORBITAL_URGENCY_ITEM_SEPARATOR}${items[0].dueLabel}`;
		}
		const allSameDate = items.every((item) => item.daysUntilDue === items[0].daysUntilDue);
		const dateLabel = allSameDate
			? items[0].dueLabel
			: `${items[0].dueLabel}${ORBITAL_URGENCY_ITEM_SEPARATOR}${ORBITAL_URGENCY_LABEL_VARIOUS}`;
		return `${items.length} ${groupLabel}${ORBITAL_URGENCY_ITEM_SEPARATOR}${dateLabel}`;
	}

	/**
	 * Parses a timestamp string in either ISO-8601 or dot-separated format into a
	 * "YYYY-MM-DD" date string.
	 *
	 * @param timestamp - The timestamp to parse ("YYYY-MM-DDTHH:mm:ss" or "YYYY.MM.DD HH:mm").
	 * @returns The date portion as a "YYYY-MM-DD" string.
	 */
	private parseDateToISODate(timestamp: string): string {
		if (timestamp.includes('T')) return timestamp.slice(0, 10);
		const [datePart] = timestamp.split(' ');
		const [year, month, day] = datePart.split('.');
		return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
	}

	/**
	 * Builds the number of consecutive calendar days, ending on or within one day
	 * of today, on which at least one activity entry was logged. Returns 0 when
	 * the most recent activity is two or more days old. Limited to the depth of
	 * recentActivities (capped at 20 entries by the DB layer), so long streaks
	 * saturate at the number of unique days present in that array.
	 *
	 * @returns The consecutive-day activity streak count.
	 */
	private buildActivityStreak(): number {
		const raw = Utilities.toArray(this.stats?.[STATS_FIELD_RECENT_ACTIVITIES]) as RecentActivityItem[];
		if (!raw.length) return 0;

		const dateSet = new Set<string>();
		for (const entry of raw) {
			if (!entry.timestamp) continue;
			dateSet.add(this.parseDateToISODate(entry.timestamp));
		}

		const sortedDates = [...dateSet].sort().reverse();
		if (!sortedDates.length) return 0;

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const mostRecent = new Date(sortedDates[0] + 'T00:00');
		const gapToToday = Math.round((today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));
		if (gapToToday > 1) return 0;

		let streak = 1;
		for (let i = 1; i < sortedDates.length; i++) {
			const previous = new Date(sortedDates[i - 1] + 'T00:00');
			const current = new Date(sortedDates[i] + 'T00:00');
			const dayDiff = Math.round((previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
			if (dayDiff === 1) {
				streak++;
			} else {
				break;
			}
		}
		return streak;
	}

	/**
	 * Builds the count of activity entries recorded in the last seven days.
	 * Parses each entry's timestamp from the app dot-separated format
	 * ("YYYY.MM.DD HH:mm:ss") or ISO 8601. The recentActivities array is
	 * capped at 20, so this value saturates at 20 for very active weeks.
	 *
	 * @returns Number of activity log entries with a timestamp within the past 7 days.
	 */
	private buildAddedThisWeek(): number {
		const raw = Utilities.toArray(
			this.stats?.[STATS_FIELD_RECENT_ACTIVITIES]
		) as RecentActivityItem[];
		if (!raw.length) return 0;
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - 7);
		cutoff.setHours(0, 0, 0, 0);
		return raw.filter((entry) => {
			if (!entry.timestamp) return false;
			return new Date(this.parseDateToISODate(entry.timestamp) + 'T00:00') >= cutoff;
		}).length;
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
					overdue,
					daysUntilDue: Utilities.getDaysUntilNumber(reminder.date) ?? 9999
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
				const debt = item as {
					name?: string;
					date?: string | null;
					debt?: number;
					original?: number;
					category?: string;
				};
				const overdue = Utilities.isOverdue(debt.date);
				const remaining = debt.debt ?? 0;
				const original = debt.original ?? 0;
				const percentage = original > 0 ? Math.round(((original - remaining) / original) * 100) : 0;
				const categoryDef = DEBT_CATEGORY_DEFS.find((d) => d.key === debt.category);
				const barColor = categoryDef?.gradient ?? 'linear-gradient(90deg,#d53163,#f7971e)';
				return {
					id: `${HOME_DEBT_ROW_ID_PREFIX}${index}`,
					name: debt.name ?? '',
					dueLabel: Utilities.getDaysUntil(debt.date),
					overdue,
					daysUntilDue: Utilities.getDaysUntilNumber(debt.date) ?? 9999,
					percentage,
					barColor
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

			rows.push({
				icon,
				label,
				detail,
				time: Utilities.getRelativeTime(entry.timestamp),
				color,
				timestamp: entry.timestamp
			});
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
					icon: HOME_ACTIVITY_ICON_DEBT_ADDED,
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
