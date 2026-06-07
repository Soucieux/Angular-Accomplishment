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
import { AuthService } from '../../../backend/authentication-service/auth.service';
import { OrbitalStore } from './orbital.store';
import { VcConcentric, VcWeekAgenda, hexToRgba } from './shared.components';
import {
	OrbitalAgendaItem,
	OrbitalActivityRow,
	OrbitalDebtRow,
	OrbitalQuickAction,
	OrbitalReminderRow,
	OrbitalWeekDay
} from './orbital.model';
import {
	HomeStats,
	MovieActivityItem,
	PatchActivityItem,
	ReminderActivityItem,
	ResonanceActivityItem
} from '../home.model';
import { NexusCategory, NexusLink } from '../../nexus/nexus.model';
import { Recipe } from '../../recipe/recipe.model';
import { Utilities } from '../../../common/app.utilities';
import {
	ACTIVITY_TYPE_BUG_LOGGED,
	ACTIVITY_TYPE_EDITED,
	ACTIVITY_TYPE_STATUS_CHANGED,
	ACTIVITY_TYPE_UPDATED,
	DAY_NAMES_SHORT,
	GENRE_FAVOURITE,
	HISTORY_STATUS_DELETED,
	HOME_ACTIVITY_COLOR_DELETED,
	HOME_ACTIVITY_COLOR_MOVIE_ADDED,
	HOME_ACTIVITY_COLOR_MOVIE_RATED,
	HOME_ACTIVITY_COLOR_MOVIE_SEARCHED,
	HOME_ACTIVITY_COLOR_NEUTRAL,
	HOME_ACTIVITY_COLOR_PATCH,
	HOME_ACTIVITY_COLOR_REMINDER,
	HOME_ACTIVITY_COLOR_RESONANCE,
	HOME_ACTIVITY_ICON_DELETED,
	HOME_ACTIVITY_ICON_MOVIE_ADDED,
	HOME_ACTIVITY_ICON_MOVIE_REMOVED,
	HOME_ACTIVITY_ICON_MOVIE_RATED,
	HOME_ACTIVITY_ICON_MOVIE_SEARCHED,
	HOME_ACTIVITY_ICON_PATCH_ADDED,
	HOME_ACTIVITY_ICON_PATCH_BUG,
	HOME_ACTIVITY_ICON_PATCH_STATUS,
	HOME_ACTIVITY_ICON_PATCH_UPDATED,
	HOME_ACTIVITY_ICON_REMINDER_ADDED,
	HOME_ACTIVITY_ICON_REMINDER_UPDATED,
	HOME_ACTIVITY_ICON_RESONANCE_ADDED,
	HOME_ACTIVITY_ICON_RESONANCE_REMOVED,
	HOME_ACTIVITY_LABEL_MOVIE_ADDED,
	HOME_ACTIVITY_LABEL_MOVIE_REMOVED,
	HOME_ACTIVITY_LABEL_MOVIE_RATED,
	HOME_ACTIVITY_LABEL_MOVIE_SEARCHED,
	HOME_ACTIVITY_LABEL_PATCH_ADDED,
	HOME_ACTIVITY_LABEL_PATCH_BUG,
	HOME_ACTIVITY_LABEL_PATCH_DELETED,
	HOME_ACTIVITY_LABEL_PATCH_STATUS,
	HOME_ACTIVITY_LABEL_PATCH_UPDATED,
	HOME_ACTIVITY_LABEL_REMINDER_ADDED,
	HOME_ACTIVITY_LABEL_REMINDER_DELETED,
	HOME_ACTIVITY_LABEL_REMINDER_UPDATED,
	HOME_ACTIVITY_LABEL_RESONANCE_ADDED,
	HOME_ACTIVITY_LABEL_RESONANCE_REMOVED,
	HOME_AGENDA_ICON_EVENT,
	HOME_DEBT_ROW_ID_PREFIX,
	HOME_GENRE_COLORS,
	HOME_LINKS_DOT_FALLBACK,
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
	HOME_REMINDER_ROW_ID_PREFIX,
	SEARCH,
	STATS_FIELD_DEBT_UPCOMING,
	STATS_FIELD_GENRE,
	STATS_FIELD_RECENT_MOVIE,
	STATS_FIELD_RECENT_PATCH,
	STATS_FIELD_RECENT_REMINDER,
	STATS_FIELD_RECENT_RESONANCE,
	STATS_FIELD_REMINDER_UPCOMING
} from '../../../common/app.constant';

@Component({
	selector: 'orbital',
	standalone: true,
	imports: [VcConcentric, VcWeekAgenda, AsyncPipe],
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
	@Input() recipes: Recipe[] = [];
	@Output() readonly linkVisit = new EventEmitter<{ id: string; count: number }>();

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
	protected debtRows: OrbitalDebtRow[] = [];
	protected activityRows: OrbitalActivityRow[] = [];

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
				'.orbital-panel-scroll'
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
		if (changes['stats'] && this.stats) {
			this.genreBars = this.buildGenreBars();
			this.reminderRows = this.buildReminderRows();
			this.debtRows = this.buildDebtRows();
			this.activityRows = this.buildActivityRows();
			this.syncWeekData();
		}
	}

	/**
	 * Gets links marked as pinned for display in the top quick-access strip.
	 *
	 * @returns NexusLink items where isPinned is true.
	 */
	protected get pinnedLinks(): NexusLink[] {
		return this.links.filter((link) => link.isPinned === true);
	}

	/**
	 * Gets the number of upcoming reminder rows.
	 *
	 * @returns The total count of reminder rows.
	 */
	protected get openReminderCount(): number {
		return this.reminderRows.length;
	}

	/**
	 * Gets the number of upcoming debt rows.
	 *
	 * @returns The total count of debt rows.
	 */
	protected get openDebtCount(): number {
		return this.debtRows.length;
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
	 * Opens a useful link in a new tab and emits a linkVisit event with the updated count.
	 *
	 * @param link - The NexusLink to open.
	 */
	protected openLink(link: NexusLink): void {
		window.open(link.url, '_blank');
		this.linkVisit.emit({ id: link._id, count: (link.visitCount ?? 0) + 1 });
	}

	/**
	 * Gets the dot colour for a quick-access link derived from its category.
	 *
	 * @param link - The NexusLink whose colour is needed.
	 * @returns A CSS colour string from the category, or the fallback colour.
	 */
	protected getLinkColor(link: NexusLink): string {
		const category = this.dashCategories.find((cat) => cat._id === link.category);
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
	 * Builds the reminder row data from the current stats, sorted by date ascending
	 * and limited to the 4 nearest upcoming items.
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
			.slice(0, 4)
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
	 * Builds the debt row data from the current stats, sorted by date ascending
	 * and limited to the 4 nearest upcoming items.
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
			.slice(0, 4)
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
	 * Builds the activity row data by aggregating all recent activity stats across
	 * movies, patch notes, reminders, and resonance, sorted by timestamp descending.
	 *
	 * @returns An array of activity row descriptors limited to the 4 most recent events.
	 */
	private buildActivityRows(): OrbitalActivityRow[] {
		type RawEvent = OrbitalActivityRow & { raw: string };
		const events: RawEvent[] = [];

		for (const movie of Utilities.toArray(
			this.stats?.[STATS_FIELD_RECENT_MOVIE]
		) as MovieActivityItem[]) {
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
				detail: Utilities.truncate(movie.title ?? '', 32),
				time: Utilities.getRelativeTime(movie.timestamp),
				color,
				raw: movie.timestamp
			});
		}

		for (const patch of Utilities.toArray(
			this.stats?.[STATS_FIELD_RECENT_PATCH]
		) as PatchActivityItem[]) {
			if (!patch.timestamp) continue;
			let icon = HOME_ACTIVITY_ICON_PATCH_ADDED,
				label = HOME_ACTIVITY_LABEL_PATCH_ADDED,
				color = HOME_ACTIVITY_COLOR_PATCH;
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
				icon = HOME_ACTIVITY_ICON_DELETED;
				label = HOME_ACTIVITY_LABEL_PATCH_DELETED;
				color = HOME_ACTIVITY_COLOR_DELETED;
			}
			events.push({
				icon,
				label,
				detail: Utilities.truncate(`#${patch.noteIndex ?? '?'} ${patch.component ?? ''}`, 32),
				time: Utilities.getRelativeTime(patch.timestamp),
				color,
				raw: patch.timestamp
			});
		}

		for (const reminder of Utilities.toArray(
			this.stats?.[STATS_FIELD_RECENT_REMINDER]
		) as ReminderActivityItem[]) {
			if (!reminder.timestamp) continue;
			let icon = HOME_ACTIVITY_ICON_REMINDER_ADDED,
				label = HOME_ACTIVITY_LABEL_REMINDER_ADDED,
				color = HOME_ACTIVITY_COLOR_REMINDER;
			if (reminder.type === HISTORY_STATUS_DELETED) {
				icon = HOME_ACTIVITY_ICON_DELETED;
				label = HOME_ACTIVITY_LABEL_REMINDER_DELETED;
				color = HOME_ACTIVITY_COLOR_DELETED;
			} else if (reminder.type === ACTIVITY_TYPE_UPDATED) {
				icon = HOME_ACTIVITY_ICON_REMINDER_UPDATED;
				label = HOME_ACTIVITY_LABEL_REMINDER_UPDATED;
			}
			events.push({
				icon,
				label,
				detail: Utilities.truncate(reminder.text ?? '', 32),
				time: Utilities.getRelativeTime(reminder.timestamp),
				color,
				raw: reminder.timestamp
			});
		}

		for (const resonance of Utilities.toArray(
			this.stats?.[STATS_FIELD_RECENT_RESONANCE]
		) as ResonanceActivityItem[]) {
			if (!resonance.timestamp) continue;
			const removed = resonance.type === HISTORY_STATUS_DELETED;
			events.push({
				icon: removed ? HOME_ACTIVITY_ICON_RESONANCE_REMOVED : HOME_ACTIVITY_ICON_RESONANCE_ADDED,
				label: removed ? HOME_ACTIVITY_LABEL_RESONANCE_REMOVED : HOME_ACTIVITY_LABEL_RESONANCE_ADDED,
				detail: Utilities.truncate(resonance.author ?? '', 32),
				time: Utilities.getRelativeTime(resonance.timestamp),
				color: removed ? HOME_ACTIVITY_COLOR_DELETED : HOME_ACTIVITY_COLOR_RESONANCE,
				raw: resonance.timestamp
			});
		}

		return events
			.sort((a, b) => (b.raw > a.raw ? 1 : -1))
			.slice(0, 4)
			.map(({ raw: _raw, ...rest }) => rest);
	}

	/**
	 * Populates the store with the current week's day descriptors and per-day agenda items
	 * derived from the upcoming reminders in the stats payload.
	 */
	private syncWeekData(): void {
		const today = new Date();
		const dow = today.getDay();
		const mondayOffset = dow === 0 ? -6 : 1 - dow;
		const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + mondayOffset);

		const rawReminders = Utilities.toArray(this.stats?.[STATS_FIELD_REMINDER_UPCOMING]) as {
			date?: string | null;
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
			agenda[dayIndex] = dayReminders.map((reminder) => ({
				icon: HOME_AGENDA_ICON_EVENT,
				name: (reminder as { name?: string }).name ?? '',
				tag: dateKey,
				color: HOME_ACTIVITY_COLOR_REMINDER
			}));
			const isToday = dayDate.toDateString() === today.toDateString();
			const isPast = dayDate < today && !isToday;
			return {
				label,
				dayIndex,
				dayNumber: dayDate.getDate(),
				isToday,
				isPast,
				fullDate: dayDate,
				count: dayReminders.length
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
