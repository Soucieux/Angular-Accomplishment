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
import { Router } from '@angular/router';
import { OrbitalStore } from './orbital.store';
import { VcConcentric, VcWeekAgenda } from './shared.components';
import {
	OrbitalAgendaItem,
	OrbitalActivityRow,
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
import { Utilities } from '../../../common/app.utilities';
import {
	ACTIVITY_TYPE_BUG_LOGGED,
	ACTIVITY_TYPE_EDITED,
	ACTIVITY_TYPE_STATUS_CHANGED,
	ACTIVITY_TYPE_UPDATED,
	DAY_NAMES_SHORT,
	GENRE_FAVOURITE,
	HISTORY_STATUS_ADDED,
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
	HOME_GENRE_COLORS,
	HOME_LINKS_DOT_FALLBACK,
	SEARCH,
	STATS_FIELD_RECENT_MOVIE,
	STATS_FIELD_RECENT_PATCH,
	STATS_FIELD_RECENT_REMINDER,
	STATS_FIELD_RECENT_RESONANCE,
	STATS_FIELD_REMINDER_UPCOMING
} from '../../../common/app.constant';

/** Shape of one debt row in the debt panel. */
interface DebtItem {
	label: string;
	amount: string;
	percentage: number;
	color: string;
}

@Component({
	selector: 'orbital',
	standalone: true,
	imports: [VcConcentric, VcWeekAgenda],
	templateUrl: './orbital.component.html',
	styleUrl: './orbital.component.css',
	providers: [OrbitalStore]
})
export class OrbitalComponent implements OnInit, AfterViewInit, OnChanges {
	protected readonly d = inject(OrbitalStore);
	private readonly router = inject(Router);
	private readonly elementRef = inject(ElementRef);
	private readonly ngZone = inject(NgZone);

	@Input() stats: HomeStats | null = null;
	@Input() links: NexusLink[] = [];
	@Input() dashCategories: NexusCategory[] = [];
	@Output() readonly linkVisit = new EventEmitter<{ id: string; count: number }>();

	protected readonly QUICK_ACTIONS: OrbitalQuickAction[] = [
		{
			icon: 'movie',
			label: 'Add Movie',
			gradient: 'linear-gradient(135deg,#e91e8c,#f7971e)',
			route: '/entertainment',
			state: { openAddDialog: true }
		},
		{
			icon: 'format_quote',
			label: 'Add Quote',
			gradient: 'linear-gradient(135deg,#a78bfa,#ec4899)',
			route: '/resonance'
		},
		{
			icon: 'restaurant',
			label: 'Add Recipe',
			gradient: 'linear-gradient(135deg,#f97316,#ef4444)',
			route: '/recipe',
			state: { openAddView: true }
		},
		{
			icon: 'account_balance',
			label: 'Add Debt',
			gradient: 'linear-gradient(135deg,#f97316,#fbbf24)',
			route: '/debt',
			state: { openAddDialog: true }
		},
		{
			icon: 'add_task',
			label: 'Add Reminder',
			gradient: 'linear-gradient(135deg,#38bdf8,#6366f1)',
			route: '/reminder'
		},
		{
			icon: 'add_link',
			label: 'Add Quick Link',
			gradient: 'linear-gradient(135deg,#22c55e,#06b6d4)',
			route: '/nexus',
			state: { openAddLinkDialog: true }
		}
	];

	protected readonly DEBT_ITEMS: DebtItem[] = [
		{ label: 'Credit Card', amount: '¥2,400', percentage: 65, color: '#d53369' },
		{ label: 'Student Loan', amount: '¥8,900', percentage: 82, color: '#f97316' },
		{ label: 'Personal', amount: '¥1,200', percentage: 30, color: '#38bdf8' }
	];

	protected readonly DEBT_TOTAL = '¥12,500';

	protected scale = 1;
	protected genreBars: { label: string; count: number; percentage: number; color: string }[] = [];
	protected reminderRows: OrbitalReminderRow[] = [];
	protected activityRows: OrbitalActivityRow[] = [];

	/**
	 * Initialises the artboard scale to fit the current viewport.
	 */
	ngOnInit(): void {
		this.updateScale();
	}

	/**
	 * Attaches the scroll auto-hide behaviour to all glass panel elements after the view renders.
	 */
	ngAfterViewInit(): void {
		this.ngZone.runOutsideAngular(() => {
			const panels = (this.elementRef.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.orbital-glass');
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
			this.activityRows = this.buildActivityRows();
			this.syncWeekData();
		}
	}

	/**
	 * Recalculates the artboard scale when the viewport is resized.
	 */
	@HostListener('window:resize')
	protected onResize(): void {
		this.updateScale();
	}

	/**
	 * Gets the quick-access links slice (first 6 links).
	 *
	 * @returns Up to 6 NexusLink items for the link strip.
	 */
	protected get quickLinks(): NexusLink[] {
		return this.links.slice(0, 6);
	}

	/**
	 * Gets the number of reminders that are not locally marked done.
	 *
	 * @returns The count of open (undone) reminder rows.
	 */
	protected get openReminderCount(): number {
		return this.reminderRows.filter((reminder) => !this.d.isDone(reminder.id)).length;
	}

	/**
	 * Gets the badge text for the week panel header: "X items" or "Clear".
	 *
	 * @returns A short summary string for the current week-agenda selection.
	 */
	protected get weekBadge(): string {
		const count = this.d.agenda().length;
		return count === 0 ? 'Clear' : `${count} item${count === 1 ? '' : 's'}`;
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
		const red = parseInt(color.slice(1, 3), 16);
		const green = parseInt(color.slice(3, 5), 16);
		const blue = parseInt(color.slice(5, 7), 16);
		return `rgba(${red},${green},${blue},0.2)`;
	}

	/**
	 * Gets the background colour for a reminder checkbox.
	 *
	 * @param row - The reminder row being rendered.
	 * @returns A CSS colour string — pink when done, transparent otherwise.
	 */
	protected getCheckBackground(row: OrbitalReminderRow): string {
		return this.d.isDone(row.id) ? '#d53369' : 'transparent';
	}

	/**
	 * Gets the border style for a reminder checkbox.
	 *
	 * @param row - The reminder row being rendered.
	 * @returns A CSS border shorthand string.
	 */
	protected getCheckBorder(row: OrbitalReminderRow): string {
		return this.d.isDone(row.id)
			? '2px solid #d53369'
			: `2px solid ${row.overdue ? '#d53369' : 'rgba(120,40,80,0.4)'}`;
	}

	/**
	 * Recalculates the artboard scale factor based on the component container's actual
	 * dimensions, scaling both up and down to preserve the 1240×900 ratio without clipping.
	 */
	private updateScale(): void {
		const host = (this.elementRef.nativeElement as HTMLElement).getBoundingClientRect();
		const width = host.width || window.innerWidth;
		const height = host.height || window.innerHeight;
		const scaleX = width / 1240;
		const scaleY = height / 900;
		this.scale = Math.min(scaleX, scaleY);
	}

	/**
	 * Builds the genre bar data from the current stats, limited to the top 5 genres
	 * sorted by count descending, with percentage relative to the top genre.
	 *
	 * @returns An array of genre bar descriptors for the recipes panel.
	 */
	private buildGenreBars(): { label: string; count: number; percentage: number; color: string }[] {
		const raw = this.stats?.['genre'];
		if (!raw) return [];
		const entries = Object.entries(raw as Record<string, number>)
			.filter(([key, value]) => key !== GENRE_FAVOURITE && (value as number) > 0)
			.map(([label, count]) => ({ label, count: count as number, percentage: 0, color: '' }));
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
					id: `rem-${index}`,
					name: reminder.name ?? '',
					dueLabel: Utilities.getDaysUntil(reminder.date),
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
			const dateKey = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
			const dayReminders = rawReminders.filter((reminder) => {
				if (!reminder.date) return false;
				return Utilities.coerceDateToString(reminder.date) === dateKey;
			});
			agenda[dayIndex] = dayReminders.map((reminder) => ({
				icon: 'event',
				name: (reminder as { name?: string }).name ?? '',
				tag: dateKey,
				color: '#f59e0b'
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
}
