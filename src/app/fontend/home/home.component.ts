import {
	AfterViewChecked,
	ChangeDetectorRef,
	Component,
	Inject,
	OnDestroy,
	OnInit,
	PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { DatabaseService } from '../../backend/database-service/database.service';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { Utilities } from '../../common/app.utilities';
import { LOG } from '../../common/app.logs';
import { NexusCategory, NexusLink } from '../nexus/nexus.model';
import {
	HomeStats,
	LastMovieEntry,
	MovieActivityItem,
	PatchActivityItem,
	PatchInProgressItem,
	ReminderActivityItem,
	ReminderWidgetItem,
	ResonanceActivityItem
} from './home.model';
import {
	ACTIVITY_TYPE_BUG_LOGGED,
	ACTIVITY_TYPE_EDITED,
	ACTIVITY_TYPE_STATUS_CHANGED,
	ACTIVITY_TYPE_UPDATED,
	COMPONENT_DESTROY,
	GENRE_FAVOURITE,
	HISTORY_STATUS_ADDED,
	HISTORY_STATUS_DELETED,
	SEARCH,
	STATS_CAP_ACTIVITY_LOG,
	STATS_FIELD_PATCH_IN_PROGRESS,
	STATS_FIELD_RECENT_MOVIE,
	STATS_FIELD_RECENT_PATCH,
	STATS_FIELD_RECENT_REMINDER,
	STATS_FIELD_RECENT_RESONANCE,
	STATS_FIELD_REMINDER_UPCOMING,
	HOME_LINKS_TILE_0,
	HOME_LINKS_TILE_1,
	HOME_LINKS_TILE_2,
	HOME_LINKS_TILE_3,
	HOME_LINKS_DOT_FALLBACK,
	DAY_NAMES_LONG,
	DAY_NAMES_SHORT,
	MONTH_NAMES_SHORT,
	HOME_GENRE_COLORS,
	HOME_ACTIVITY_ICON_MOVIE_ADDED,
	HOME_ACTIVITY_ICON_MOVIE_REMOVED,
	HOME_ACTIVITY_ICON_MOVIE_RATED,
	HOME_ACTIVITY_ICON_MOVIE_SEARCHED,
	HOME_ACTIVITY_ICON_PATCH_ADDED,
	HOME_ACTIVITY_ICON_PATCH_BUG,
	HOME_ACTIVITY_ICON_PATCH_STATUS,
	HOME_ACTIVITY_ICON_PATCH_UPDATED,
	HOME_ACTIVITY_ICON_PATCH_DELETED,
	HOME_ACTIVITY_ICON_REMINDER_ADDED,
	HOME_ACTIVITY_ICON_REMINDER_DELETED,
	HOME_ACTIVITY_ICON_REMINDER_UPDATED,
	HOME_ACTIVITY_ICON_RESONANCE_ADDED,
	HOME_ACTIVITY_ICON_RESONANCE_REMOVED,
	HOME_ACTIVITY_LABEL_MOVIE_ADDED,
	HOME_ACTIVITY_LABEL_MOVIE_REMOVED,
	HOME_ACTIVITY_LABEL_MOVIE_RATED,
	HOME_ACTIVITY_LABEL_MOVIE_SEARCHED,
	HOME_ACTIVITY_LABEL_PATCH_ADDED,
	HOME_ACTIVITY_LABEL_PATCH_BUG,
	HOME_ACTIVITY_LABEL_PATCH_STATUS,
	HOME_ACTIVITY_LABEL_PATCH_UPDATED,
	HOME_ACTIVITY_LABEL_PATCH_DELETED,
	HOME_ACTIVITY_LABEL_REMINDER_ADDED,
	HOME_ACTIVITY_LABEL_REMINDER_DELETED,
	HOME_ACTIVITY_LABEL_REMINDER_UPDATED,
	HOME_ACTIVITY_LABEL_RESONANCE_ADDED,
	HOME_ACTIVITY_LABEL_RESONANCE_REMOVED,
	HOME_ACTIVITY_COLOR_MOVIE_ADDED,
	HOME_ACTIVITY_COLOR_MOVIE_RATED,
	HOME_ACTIVITY_COLOR_MOVIE_SEARCHED,
	HOME_ACTIVITY_COLOR_NEUTRAL,
	HOME_ACTIVITY_COLOR_PATCH,
	HOME_ACTIVITY_COLOR_PATCH_DELETED,
	HOME_ACTIVITY_COLOR_REMINDER,
	HOME_ACTIVITY_COLOR_REMINDER_DELETED,
	HOME_ACTIVITY_COLOR_RESONANCE,
	HOME_MSG_INCREMENT_VISIT_FAILED,
	HOME_MSG_LOAD_STATISTICS_FAILED,
	NEXUS_MSG_LOAD_CATEGORIES_FAILED
} from '../../common/app.constant';

@Component({
	selector: 'home',
	standalone: true,
	imports: [CommonModule, RouterModule],
	templateUrl: './home.component.html',
	styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewChecked {
	private readonly className = 'HomeComponent';

	protected readonly HOME_GENRE_COLORS = HOME_GENRE_COLORS;
	private readonly TILE_ROTATIONS = [-1.5, 0.8, -0.5, 1.2];

	private statsSub?: Subscription;
	private loginSub?: Subscription;
	private linksSub?: Subscription;
	private categoriesSub?: Subscription;
	private loadingTimer?: ReturnType<typeof setTimeout>;
	private linksLoadingTimer?: ReturnType<typeof setTimeout>;
	private dashboardTimer?: ReturnType<typeof setTimeout>;
	private clockInterval?: ReturnType<typeof setInterval>;
	private lastMonth = -1;

	protected stats: HomeStats | null = null;
	protected loading = true;
	protected loggedIn = false;

	protected showDashboard = false;
	protected transitioning = false;

	protected clockTime = '--:--:--';
	protected clockDate = '';
	protected currentYear = new Date().getFullYear();
	protected dayOfYear = 0;
	protected daysInYear = 365;
	protected yearProgress = 0;
	protected monthProgress = 0;
	protected weekProgress = 0;
	protected dayProgress = 0;
	protected daysInMonth = 30;
	protected currentDayOfMonth = 1;
	protected dayOfWeekNum = 1;

	protected dashLinks: NexusLink[] = [];
	protected dashCategories: NexusCategory[] = [];
	protected dashLinksLoading = true;
	protected dashFaviconFailedIds = new Set<string>();
	protected pinnedLinks: NexusLink[] = [];
	protected restLinks: NexusLink[] = [];

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		private databaseService: DatabaseService,
		private cdr: ChangeDetectorRef,
		private router: Router,
		protected utilities: Utilities
	) {}

	/**
	 * Initialises the component: starts the live clock ticker and subscribes to
	 * the login-state observable. The login subscription drives the auth-transition
	 * animation and starts or stops the stats, links, and categories subscriptions
	 * as the user signs in or out.
	 */
	ngOnInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.tickClock();
			this.clockInterval = setInterval(() => this.tickClock(), 1000);

			this.loginSub = CloudbaseService.loginState$.subscribe((loggedIn) => {
				const wasLoggedIn = this.loggedIn;
				this.loggedIn = loggedIn;

				if (loggedIn && !wasLoggedIn) {
					// Start loading data immediately so it arrives while animation plays
					this.loading = true;
					this.loadingTimer = setTimeout(() => {
						if (this.loading) {
							this.loading = false;
							this.cdr.detectChanges();
						}
					}, 5000);
					let activityLogsCleaned = false;
					this.linksLoadingTimer = setTimeout(() => {
						if (this.dashLinksLoading) {
							this.dashLinksLoading = false;
							this.cdr.detectChanges();
						}
					}, 4000);
					this.linksSub = this.databaseService.getUsefulLinks().subscribe({
						next: (data: NexusLink[]) => {
							clearTimeout(this.linksLoadingTimer);
							this.dashLinks = data;
							this.computeDashLinkSets();
							this.dashLinksLoading = false;
							this.cdr.detectChanges();
						},
						error: () => {
							clearTimeout(this.linksLoadingTimer);
							this.dashLinksLoading = false;
							this.cdr.detectChanges();
						}
					});
					this.categoriesSub = this.databaseService.getLinkCategories().subscribe({
						next: (data: NexusCategory[]) => {
							this.dashCategories = Utilities.sortByOrder(data);
							this.cdr.detectChanges();
						},
						error: (error: unknown) => {
							LOG.error(this.className, NEXUS_MSG_LOAD_CATEGORIES_FAILED, error as Error);
						}
					});

					this.statsSub = this.databaseService.getStatistics().subscribe({
						next: (data: HomeStats) => {
							clearTimeout(this.loadingTimer);
							this.stats = data;
							this.loading = false;
							this.cdr.detectChanges();
							// One-time cleanup per dashboard session: trim each activity-log array
							// to only the items that would appear in the combined top-24 feed.
							// This removes stale entries that accumulated before the per-array cap
							// was enforced by appendToActivityLog.
							if (!activityLogsCleaned) {
								activityLogsCleaned = true;
								this.trimActivityLogs(data);
							}
						},
						error: (error: unknown) => {
							LOG.error(this.className, HOME_MSG_LOAD_STATISTICS_FAILED, error as Error);
							clearTimeout(this.loadingTimer);
							this.loading = false;
							this.cdr.detectChanges();
						}
					});

					// Animate quote view out, then reveal dashboard after animation completes (0.55s)
					this.transitioning = true;
					this.cdr.detectChanges();
					this.dashboardTimer = setTimeout(() => {
						this.showDashboard = true;
						this.transitioning = false;
						this.cdr.detectChanges();
					}, 600);
				} else if (!loggedIn) {
					clearTimeout(this.loadingTimer);
					clearTimeout(this.linksLoadingTimer);
					clearTimeout(this.dashboardTimer);
					this.statsSub?.unsubscribe();
					this.linksSub?.unsubscribe();
					this.categoriesSub?.unsubscribe();
					this.stats = null;
					this.dashLinks = [];
					this.dashCategories = [];
					this.pinnedLinks = [];
					this.restLinks = [];
					this.dashFaviconFailedIds.clear();
					this.dashLinksLoading = true;
					this.loading = true;
					this.showDashboard = false;
					this.transitioning = false;
				}

				this.cdr.detectChanges();
			});
		}
	}

	/**
	 * Attaches the auto-hide scroll listener to all widget scroll containers after each view check.
	 * Uses the utility guard so each element is only bound once.
	 */
	ngAfterViewChecked(): void {
		if (isPlatformBrowser(this.platformId)) {
			document
				.querySelectorAll<HTMLElement>('.scrollable-list')
				.forEach((el) => Utilities.attachScrollAutoHide(el));
			document
				.querySelectorAll<HTMLElement>('.activity-list-scroll')
				.forEach((el) => Utilities.attachScrollAutoHide(el));
			document
				.querySelectorAll<HTMLElement>('.links-list')
				.forEach((el) => Utilities.attachScrollAutoHide(el));
		}
	}

	/**
	 * Clears all timers and intervals, unsubscribes from all data and login
	 * observables, and logs the component destruction event.
	 */
	ngOnDestroy(): void {
		clearTimeout(this.loadingTimer);
		clearTimeout(this.linksLoadingTimer);
		clearTimeout(this.dashboardTimer);
		clearInterval(this.clockInterval);
		this.statsSub?.unsubscribe();
		this.linksSub?.unsubscribe();
		this.categoriesSub?.unsubscribe();
		this.loginSub?.unsubscribe();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	/**
	 * Navigates to a quick-action route, optionally passing router state.
	 *
	 * @param path - The target route path (e.g. '/entertainment').
	 * @param state - The optional navigation extras to pass as router state.
	 */
	protected navigateToQuickAction(path: string, state?: object): void {
		this.router.navigate([path], state ? { state } : undefined).catch(() => {});
	}

	////////////////////// Below are clock tick and progress computation methods //////////////

	/**
	 * Called once per second by `clockInterval`. Computes the current time
	 * string, the formatted date label, year/month/week/day progress percentages,
	 * and the ISO day-of-week number, then triggers change detection so the
	 * clock display updates without zone involvement.
	 */
	private tickClock(): void {
		const now = new Date();
		const pad = (value: number) => String(value).padStart(2, '0');
		this.clockTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

		this.clockDate = `${DAY_NAMES_LONG[now.getDay()]}, ${MONTH_NAMES_SHORT[now.getMonth()]} ${now.getDate()}`;

		const y = now.getFullYear();
		this.currentYear = y;
		const isLeap = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
		this.daysInYear = isLeap(y) ? 366 : 365;
		const startOfYear = new Date(y, 0, 1);
		const elapsed = now.getTime() - startOfYear.getTime();
		this.dayOfYear = Math.ceil(elapsed / (1000 * 60 * 60 * 24));
		this.yearProgress = parseFloat(
			((elapsed / (this.daysInYear * 24 * 60 * 60 * 1000)) * 100).toFixed(1)
		);

		// Day progress — seconds elapsed today out of 86 400
		const secondsToday = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
		this.dayProgress = parseFloat(((secondsToday / 86400) * 100).toFixed(1));

		// Week progress — Sun 00:00 = 0 %, Sat 23:59:59 ≈ 100 %
		const dow = now.getDay(); // 0 = Sun … 6 = Sat
		const daysSinceSun = dow; // Sun = 0 … Sat = 6
		this.weekProgress = parseFloat(
			(((daysSinceSun * 86400 + secondsToday) / (7 * 86400)) * 100).toFixed(1)
		);

		// Month progress — 1st 00:00 = 0 %, last-day 23:59:59 ≈ 100 %
		// Only recompute daysInMonth when the month changes, not every second.
		const currentMonth = now.getMonth();
		if (currentMonth !== this.lastMonth) {
			this.lastMonth = currentMonth;
			this.daysInMonth = new Date(y, currentMonth + 1, 0).getDate();
		}
		this.currentDayOfMonth = now.getDate();
		this.monthProgress = parseFloat(
			(
				(((this.currentDayOfMonth - 1) * 86400 + secondsToday) / (this.daysInMonth * 86400)) *
				100
			).toFixed(1)
		);

		// Day of week label (Sun = 1 … Sat = 7)
		this.dayOfWeekNum = dow + 1;

		// setInterval fires outside Angular's zone — detectChanges required to update the clock display.
		this.cdr.detectChanges();
	}

	////////////////////// Below are time helper methods used by the template ////////////////

	/**
	 * Converts a `YYYY.MM.DD HH:mm:ss` timestamp to a human-readable relative
	 * label such as "just now", "5 min ago", or "3 days ago".
	 *
	 * @param timestamp - The formatted timestamp string to convert.
	 * @returns A relative-time string for display in activity and widget rows.
	 */
	protected getRelativeTime(timestamp: string): string {
		return Utilities.getRelativeTime(timestamp);
	}

	/**
	 * Truncates a string for display in the template.
	 * Delegates to {@link Utilities.truncate}.
	 *
	 * @param text - The text to truncate.
	 * @param max - Maximum number of characters before the ellipsis.
	 * @returns The truncated string.
	 */
	protected truncate(text: string, max: number): string {
		return Utilities.truncate(text, max);
	}

	/**
	 * Computes a countdown label for a date. Delegates to {@link Utilities.getDaysUntil}.
	 *
	 * @param dateStr - The date in any form accepted by {@link Utilities.coerceDateToString}.
	 * @returns A label such as "Today", "Tomorrow", "in 3d", or "2d overdue".
	 */
	protected getDaysUntil(dateStr: unknown): string {
		return Utilities.getDaysUntil(dateStr);
	}

	/**
	 * Checks whether a date is past due. Delegates to {@link Utilities.isOverdue}.
	 *
	 * @param dateStr - The date in any form accepted by {@link Utilities.coerceDateToString}.
	 * @returns `true` if the date is strictly before today.
	 */
	protected isOverdue(dateStr: unknown): boolean {
		return Utilities.isOverdue(dateStr);
	}

	////////////////////// Below are data accessor methods for the dashboard widgets //////////

	/**
	 * Returns whichever of `lastAdded` / `lastDeleted` is more recent, or
	 * null if neither exists in the current statistics snapshot.
	 * Used by the entertainment card to show a single "last activity" row.
	 *
	 * @returns The most recent movie activity object, or null if no activity exists.
	 */
	protected getLastMovieActivity(): { type: 'added' | 'deleted'; title: string; timestamp: string } | null {
		const added = this.stats?.['lastAdded'] as LastMovieEntry | undefined;
		const deleted = this.stats?.['lastDeleted'] as LastMovieEntry | undefined;
		if (!added && !deleted) return null;
		if (added && !deleted)
			return { type: HISTORY_STATUS_ADDED, title: added.title ?? '', timestamp: added.timestamp ?? '' };
		if (!added && deleted)
			return {
				type: HISTORY_STATUS_DELETED,
				title: deleted.title ?? '',
				timestamp: deleted.timestamp ?? ''
			};
		const addedTime = added!.timestamp ?? '';
		const deletedTime = deleted!.timestamp ?? '';
		return addedTime >= deletedTime
			? { type: HISTORY_STATUS_ADDED, title: added!.title ?? '', timestamp: addedTime }
			: { type: HISTORY_STATUS_DELETED, title: deleted!.title ?? '', timestamp: deletedTime };
	}

	/**
	 * Flattens the raw `reminderUpcoming` statistics field (which may arrive as
	 * either an array or a CloudBase object-map keyed by index) into a plain array.
	 *
	 * @returns All reminder items from the statistics snapshot, or an empty array
	 *   if the field is absent.
	 */
	protected getAllReminderItems(): ReminderWidgetItem[] {
		return Utilities.toArray(this.stats?.[STATS_FIELD_REMINDER_UPCOMING]) as ReminderWidgetItem[];
	}

	/**
	 * Counts the number of reminder items whose due date is in the past.
	 * Displayed as the overdue badge on the reminder stat chip.
	 *
	 * @returns The number of overdue reminder items.
	 */
	protected getOverdueCount(): number {
		return this.getAllReminderItems().filter((item) => Utilities.isOverdue(item.date)).length;
	}

	/**
	 * Returns all dated items for the reminder dashboard widget,
	 * sorted ascending by date (most overdue first → soonest due).
	 *
	 * @returns Sorted array of all reminder items that have a date set.
	 */
	protected getReminderWidgetItems(): ReminderWidgetItem[] {
		return this.getAllReminderItems()
			.filter((item) => {
				if (!item.date) return false;
				return !!Utilities.coerceDateToString(item.date);
			})
			.sort((a, b) => {
				const toMs = (dateVal: unknown) => {
					const [year, month, day] = Utilities.coerceDateToString(dateVal).split('-').map(Number);
					return new Date(year, month - 1, day).getTime();
				};
				return toMs(a.date) - toMs(b.date); // ascending: most overdue → soonest due
			});
	}

	/**
	 * Extracts the list of in-progress patch notes from the statistics snapshot.
	 * Normalises the value to a plain array regardless of whether CloudBase stored
	 * it as an array or an object-map.
	 *
	 * @returns An array of in-progress patch note objects, or an empty array if absent.
	 */
	protected getPatchInProgress(): PatchInProgressItem[] {
		return Utilities.toArray(this.stats?.[STATS_FIELD_PATCH_IN_PROGRESS]) as PatchInProgressItem[];
	}

	/**
	 * Transforms the raw `genre` map from the statistics snapshot into a sorted
	 * array of `{ label, count, pct }` objects used to render the genre bar chart.
	 * Excludes the Favourite pseudo-genre and genres with zero count; normalises
	 * percentages relative to the top genre; caps the result at 8 entries.
	 *
	 * @returns Genre bar data sorted descending by count, capped at 8 rows.
	 */
	protected getGenreData(): { label: string; count: number; pct: number }[] {
		const raw = this.stats?.['genre'];
		if (!raw) return [];
		const entries = Object.entries(raw as Record<string, number>)
			.filter(([key, val]) => key !== GENRE_FAVOURITE && (val as number) > 0)
			.map(([label, count]) => ({ label, count: count as number, pct: 0 }));
		if (!entries.length) return [];
		entries.sort((a, b) => b.count - a.count);
		const max = entries[0].count;
		return entries.slice(0, 8).map((e) => ({ ...e, pct: Math.round((e.count / max) * 100) }));
	}

	/**
	 * Builds a unified recent-activity feed from all four sections
	 * (Entertainment, Patch Notes, Reminder, Resonance), sorted newest-first
	 * and capped at 24 entries.
	 *
	 * Each section contributes at most one event from its latest stats field.
	 * Entries are sorted by their raw timestamp string (lexicographic order works
	 * because the format is "YYYY.MM.DD HH:mm:ss", which sorts identically to
	 * chronological order).
	 *
	 * @returns A sorted array of up to 24 recent-activity entries across all four sections.
	 */
	protected getRecentActivity(): {
		icon: string;
		label: string;
		detail: string;
		time: string;
		color: string;
	}[] {
		type RawEvent = {
			icon: string;
			label: string;
			detail: string;
			time: string;
			color: string;
			raw: string;
		};
		const events: RawEvent[] = [];

		// Entertainment
		const movieActivities = Utilities.toArray(
			this.stats?.[STATS_FIELD_RECENT_MOVIE]
		) as MovieActivityItem[];
		for (const movie of movieActivities) {
			if (!movie.timestamp) continue;
			let icon = HOME_ACTIVITY_ICON_MOVIE_ADDED,
				label = HOME_ACTIVITY_LABEL_MOVIE_ADDED,
				color = HOME_ACTIVITY_COLOR_MOVIE_ADDED;
			if (movie.type === HISTORY_STATUS_DELETED) {
				icon = HOME_ACTIVITY_ICON_MOVIE_REMOVED;
				label = HOME_ACTIVITY_LABEL_MOVIE_REMOVED;
				color = HOME_ACTIVITY_COLOR_NEUTRAL;
			} else if (movie.type === ACTIVITY_TYPE_UPDATED) {
				icon = HOME_ACTIVITY_ICON_MOVIE_RATED;
				label = HOME_ACTIVITY_LABEL_MOVIE_RATED;
				color = HOME_ACTIVITY_COLOR_MOVIE_RATED;
			} else if (movie.type === SEARCH) {
				icon = HOME_ACTIVITY_ICON_MOVIE_SEARCHED;
				label = HOME_ACTIVITY_LABEL_MOVIE_SEARCHED;
				color = HOME_ACTIVITY_COLOR_MOVIE_SEARCHED;
			}
			events.push({
				icon,
				label,
				detail: Utilities.truncate(movie.title ?? '', 36),
				time: this.getRelativeTime(movie.timestamp),
				color,
				raw: movie.timestamp
			});
		}

		// Patch Notes
		const patchActivities = Utilities.toArray(
			this.stats?.[STATS_FIELD_RECENT_PATCH]
		) as PatchActivityItem[];
		for (const patch of patchActivities) {
			if (!patch.timestamp) continue;
			let icon = HOME_ACTIVITY_ICON_PATCH_ADDED;
			let label = HOME_ACTIVITY_LABEL_PATCH_ADDED;
			let color = HOME_ACTIVITY_COLOR_PATCH;
			if (patch.type === ACTIVITY_TYPE_BUG_LOGGED) {
				icon = HOME_ACTIVITY_ICON_PATCH_BUG;
				label = HOME_ACTIVITY_LABEL_PATCH_BUG;
			} else if (patch.type === ACTIVITY_TYPE_STATUS_CHANGED) {
				icon = HOME_ACTIVITY_ICON_PATCH_STATUS;
				label = HOME_ACTIVITY_LABEL_PATCH_STATUS;
			} else if (patch.type === ACTIVITY_TYPE_EDITED) {
				icon = HOME_ACTIVITY_ICON_PATCH_UPDATED;
				label = HOME_ACTIVITY_LABEL_PATCH_UPDATED;
			} else if (patch.type === HISTORY_STATUS_DELETED) {
				icon = HOME_ACTIVITY_ICON_PATCH_DELETED;
				label = HOME_ACTIVITY_LABEL_PATCH_DELETED;
				color = HOME_ACTIVITY_COLOR_PATCH_DELETED;
			}
			events.push({
				icon,
				label,
				detail: Utilities.truncate(`#${patch.noteIndex ?? '?'} ${patch.component ?? ''}`, 36),
				time: this.getRelativeTime(patch.timestamp),
				color,
				raw: patch.timestamp
			});
		}

		// Reminder
		const reminderActivities = Utilities.toArray(
			this.stats?.[STATS_FIELD_RECENT_REMINDER]
		) as ReminderActivityItem[];
		for (const reminder of reminderActivities) {
			if (!reminder.timestamp) continue;
			let icon = HOME_ACTIVITY_ICON_REMINDER_ADDED,
				label = HOME_ACTIVITY_LABEL_REMINDER_ADDED,
				color = HOME_ACTIVITY_COLOR_REMINDER;
			if (reminder.type === HISTORY_STATUS_DELETED) {
				icon = HOME_ACTIVITY_ICON_REMINDER_DELETED;
				label = HOME_ACTIVITY_LABEL_REMINDER_DELETED;
				color = HOME_ACTIVITY_COLOR_REMINDER_DELETED;
			} else if (reminder.type === ACTIVITY_TYPE_UPDATED) {
				icon = HOME_ACTIVITY_ICON_REMINDER_UPDATED;
				label = HOME_ACTIVITY_LABEL_REMINDER_UPDATED;
			}
			const detail = reminder.text
				? Utilities.truncate(`${reminder.table ?? ''} · ${reminder.text}`, 40)
				: (reminder.table ?? '');
			events.push({
				icon,
				label,
				detail,
				time: this.getRelativeTime(reminder.timestamp),
				color,
				raw: reminder.timestamp
			});
		}

		// Resonance
		const resonanceActivities = Utilities.toArray(
			this.stats?.[STATS_FIELD_RECENT_RESONANCE]
		) as ResonanceActivityItem[];
		for (const quote of resonanceActivities) {
			if (!quote.timestamp) continue;
			let icon = HOME_ACTIVITY_ICON_RESONANCE_ADDED,
				label = HOME_ACTIVITY_LABEL_RESONANCE_ADDED,
				color = HOME_ACTIVITY_COLOR_RESONANCE;
			if (quote.type === HISTORY_STATUS_DELETED) {
				icon = HOME_ACTIVITY_ICON_RESONANCE_REMOVED;
				label = HOME_ACTIVITY_LABEL_RESONANCE_REMOVED;
				color = HOME_ACTIVITY_COLOR_NEUTRAL;
			}
			events.push({
				icon,
				label,
				detail: Utilities.truncate(`by ${quote.author ?? ''}`, 36),
				time: this.getRelativeTime(quote.timestamp),
				color,
				raw: quote.timestamp
			});
		}

		// Sort newest-first, cap at the dashboard display limit, strip the helper field.
		return events
			.sort((a, b) => b.raw.localeCompare(a.raw))
			.slice(0, STATS_CAP_ACTIVITY_LOG)
			.map(({ raw: _raw, ...rest }) => rest);
	}

	/**
	 * Builds the seven-day week strip used by the calendar card. Returns one
	 * object per day (Mon–Sun) containing the day label, date number, ISO date
	 * string, today/past flags, and the list of reminder items due on that day.
	 * The week always starts on Monday.
	 *
	 * @returns An array of 7 day descriptors for the current calendar week.
	 */
	protected getWeekDays(): {
		label: string;
		dayNum: number;
		dateStr: string;
		isToday: boolean;
		isPast: boolean;
		items: ReminderWidgetItem[];
	}[] {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const sunday = new Date(today);
		const dow = today.getDay();
		sunday.setDate(today.getDate() - dow);
		const allItems = this.getAllReminderItems();
		const dayLabels = DAY_NAMES_SHORT;
		return Array.from({ length: 7 }, (_, dayIndex) => {
			const date = new Date(sunday);
			date.setDate(sunday.getDate() + dayIndex);
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const dateStr = `${year}-${month}-${day}`;
			return {
				label: dayLabels[dayIndex],
				dayNum: date.getDate(),
				dateStr,
				isToday: date.getTime() === today.getTime(),
				isPast: date.getTime() < today.getTime(),
				items: allItems.filter((item) => Utilities.coerceDateToString(item.date) === dateStr)
			};
		});
	}

	/**
	 * One-time cleanup called after the first statistics snapshot arrives.
	 * Trims each of the four activity-log arrays so that only items that would
	 * appear in the combined top-24 feed are kept in CloudBase.
	 *
	 * Algorithm:
	 *  1. Flatten all four source arrays, tagging each item with its source-field
	 *     index and position index.
	 *  2. Sort the flat list newest-first by timestamp.
	 *  3. Mark the top STATS_CAP_ACTIVITY_LOG entries as "keep".
	 *  4. Write back any source array that was longer than its kept subset.
	 *
	 * This is safe to call on every component instantiation: if every array is
	 * already ≤ 24 items and all items are in the top 24, no write is triggered.
	 *
	 * @param data - The raw statistics document from the first watcher emission.
	 */
	private trimActivityLogs(data: HomeStats): void {
		const fields = [
			STATS_FIELD_RECENT_MOVIE,
			STATS_FIELD_RECENT_PATCH,
			STATS_FIELD_RECENT_REMINDER,
			STATS_FIELD_RECENT_RESONANCE
		];

		// Resolve each field to a plain array; all activity entries share the timestamp field shape
		const arrays: { timestamp?: string }[][] = fields.map(
			(field) => Utilities.toArray(data?.[field]) as { timestamp?: string }[]
		);

		// Build a flat list with source coordinates and timestamp for sorting
		const flat: { fieldIndex: number; itemIndex: number; timestamp: string }[] = [];
		for (let fieldIndex = 0; fieldIndex < arrays.length; fieldIndex++) {
			for (let itemIndex = 0; itemIndex < arrays[fieldIndex].length; itemIndex++) {
				const { timestamp } = arrays[fieldIndex][itemIndex] ?? {};
				if (timestamp) flat.push({ fieldIndex, itemIndex, timestamp });
			}
		}

		// Sort newest-first; identify which items survive the combined cap
		flat.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
		const keepSet = new Set<string>(
			flat.slice(0, STATS_CAP_ACTIVITY_LOG).map((entry) => `${entry.fieldIndex}:${entry.itemIndex}`)
		);

		// Build the update payload — only include arrays that actually shrank
		const updates: Record<string, { timestamp?: string }[]> = {};
		for (let fieldIndex = 0; fieldIndex < arrays.length; fieldIndex++) {
			const trimmed = arrays[fieldIndex].filter((_item, itemIndex) =>
				keepSet.has(`${fieldIndex}:${itemIndex}`)
			);
			if (trimmed.length < arrays[fieldIndex].length) {
				updates[fields[fieldIndex]] = trimmed;
			}
		}

		if (Object.keys(updates).length > 0) {
			this.databaseService.updateStatisticsFields(updates);
		}
	}

	////////////////////// Below are quick link methods for the dashboard tile panel ///////////

	/**
	 * Computes and caches the pinned-tiles list and the "everything else" list
	 * from the current `dashLinks` array. Called once whenever `dashLinks` is
	 * reassigned so template methods never re-sort on every render cycle.
	 */
	private computeDashLinkSets(): void {
		const sorted = [...this.dashLinks].sort((a, b) => (b.visitCount ?? 0) - (a.visitCount ?? 0));
		this.pinnedLinks = sorted.slice(0, 4);
		const pinnedIds = new Set(this.pinnedLinks.map((link) => link._id));
		this.restLinks = [...this.dashLinks]
			.filter((link) => !pinnedIds.has(link._id))
			.sort((a, b) => {
				if (!a.lastVisited && !b.lastVisited) return 0;
				if (!a.lastVisited) return 1;
				if (!b.lastVisited) return -1;
				return new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime();
			});
	}

	/**
	 * Marks a link ID as favicon-failed when the favicon image cannot load,
	 * so the template can display the initial-letter fallback instead.
	 *
	 * @param link - The link object whose favicon failed to load.
	 */
	protected onDashFaviconError(link: NexusLink): void {
		this.dashFaviconFailedIds.add(link._id);
	}

	/**
	 * Returns the hex color for a link's category, falling back to the neutral
	 * sub-text colour when the category is not found.
	 *
	 * @param categoryId - The category _id stored on the link document.
	 * @returns The CSS color string for the category dot.
	 */
	protected getCategoryDotColor(categoryId: string): string {
		const cat = this.dashCategories.find((category) => category._id === categoryId);
		return cat?.color ?? HOME_LINKS_DOT_FALLBACK;
	}

	/**
	 * Opens a Quick Links bookmark in a new tab and increments its visit counter.
	 *
	 * @param link - The link object to open.
	 */
	protected openDashLink(link: NexusLink): void {
		this.utilities.openInNewTab(link.url);
		this.databaseService
			.incrementLinkVisit(link._id, link.visitCount ?? 0)
			.catch((error: Error) => LOG.error(this.className, HOME_MSG_INCREMENT_VISIT_FAILED, error));
	}

	/**
	 * Returns the tile background colour for a pinned tile at the given index,
	 * cycling through the four pool-theme colours.
	 *
	 * @param index - The zero-based tile index.
	 * @returns The CSS colour string for that tile.
	 */
	protected getTileColor(index: number): string {
		return [HOME_LINKS_TILE_0, HOME_LINKS_TILE_1, HOME_LINKS_TILE_2, HOME_LINKS_TILE_3][index % 4];
	}

	/**
	 * Returns the CSS rotation for a pinned tile at the given index, giving the
	 * sticker-stack tilt effect.
	 *
	 * @param index - The zero-based tile index.
	 * @returns The CSS rotation string, e.g. "-1.5deg".
	 */
	protected getTileRotation(index: number): string {
		return `${this.TILE_ROTATIONS[index % 4]}deg`;
	}
}
