import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { DatabaseService } from '../../backend/database-service/database.service';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { Utilities } from '../../common/app.utilities';
import { LOG } from '../../common/app.logs';
import { COMPONENT_DESTROY } from '../../common/app.constant';

@Component({
	selector: 'home',
	standalone: true,
	imports: [CommonModule, RouterModule],
	templateUrl: './home.component.html',
	styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
	private readonly className = 'HomeComponent';
	private statsSub?: Subscription;
	private loginSub?: Subscription;
	private loadingTimer?: ReturnType<typeof setTimeout>;
	private dashboardTimer?: ReturnType<typeof setTimeout>;
	private clockInterval?: ReturnType<typeof setInterval>;
	private pomodoroInterval?: ReturnType<typeof setInterval>;
	private readonly NOTE_KEY = 'home_quick_note';

	protected stats: any = null;
	protected loading = true;
	protected loggedIn = false;

	// Auth transition animation
	protected showDashboard = false;
	protected transitioning = false;

	// Clock
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
	protected dayOfWeekNum = 1; // Mon = 1 … Sun = 7

	// Quick Note
	protected noteText = '';
	protected noteSavedTime = '';

	// Pomodoro
	protected pomodoroTime = 25 * 60;
	protected pomodoroRunning = false;
	protected pomodoroMode: 'work' | 'break' = 'work';
	protected readonly pomodoroPresets = [5, 10, 25, 45, 60];
	protected pomodoroSelectedPreset = 25;
	private readonly BREAK_DURATION = 5 * 60;

	private get workDuration(): number {
		return this.pomodoroSelectedPreset * 60;
	}

	// Genre bar colours
	protected readonly genreColors = ['#4776e6', '#e91e8c', '#f7971e', '#78d000', '#8e54e9', '#22d3ee'];

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		private databaseService: DatabaseService,
		private cdr: ChangeDetectorRef,
		private router: Router
	) {}

	/**
	 * Navigate to a quick-action route, optionally passing router state.
	 *
	 * @param path - The target route path (e.g. '/entertainment').
	 * @param state - Optional navigation extras to pass as router state.
	 */
	protected navigateQA(path: string, state?: object): void {
		this.router.navigate([path], state ? { state } : undefined);
	}

	/**
	 * Initialises the component: restores any saved quick note from sessionStorage,
	 * starts the live clock ticker, and subscribes to both the login-state and
	 * statistics observables. The login subscription drives the auth-transition
	 * animation and starts / stops the stats subscription as the user signs in or out.
	 */
	ngOnInit() {
		if (isPlatformBrowser(this.platformId)) {
			const saved = sessionStorage.getItem(this.NOTE_KEY);
			if (saved) this.noteText = saved;

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
					this.statsSub = this.databaseService.getStatistics().subscribe((data) => {
						clearTimeout(this.loadingTimer);
						this.stats = data;
						this.loading = false;
						this.cdr.detectChanges();
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
					clearTimeout(this.dashboardTimer);
					this.statsSub?.unsubscribe();
					this.stats = null;
					this.loading = true;
					this.showDashboard = false;
					this.transitioning = false;
				}

				this.cdr.detectChanges();
			});
		}
	}

	/**
	 * Clears all timers and intervals, unsubscribes from the stats and login
	 * observables, and logs the component destruction event.
	 */
	ngOnDestroy() {
		clearTimeout(this.loadingTimer);
		clearTimeout(this.dashboardTimer);
		clearInterval(this.clockInterval);
		clearInterval(this.pomodoroInterval);
		this.statsSub?.unsubscribe();
		this.loginSub?.unsubscribe();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	// ── Clock ─────────────────────────────────────────────────────────────

	/**
	 * Called once per second by `clockInterval`. Computes the current time
	 * string, the formatted date label, year/month/week/day progress percentages,
	 * and the ISO day-of-week number, then triggers change detection so the
	 * clock display updates without zone involvement.
	 */
	private tickClock(): void {
		const now = new Date();
		const pad = (n: number) => String(n).padStart(2, '0');
		this.clockTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

		const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const monNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		this.clockDate = `${dayNames[now.getDay()]}, ${monNames[now.getMonth()]} ${now.getDate()}`;

		const y = now.getFullYear();
		this.currentYear = y;
		const isLeap = (yr: number) => (yr % 4 === 0 && yr % 100 !== 0) || yr % 400 === 0;
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
		this.daysInMonth = new Date(y, now.getMonth() + 1, 0).getDate();
		this.currentDayOfMonth = now.getDate();
		this.monthProgress = parseFloat(
			(
				(((this.currentDayOfMonth - 1) * 86400 + secondsToday) / (this.daysInMonth * 86400)) *
				100
			).toFixed(1)
		);

		// Day of week label (Sun = 1 … Sat = 7)
		this.dayOfWeekNum = dow + 1;

		this.cdr.detectChanges();
	}

	// ── Quick Note ────────────────────────────────────────────────────────

	/**
	 * Handles input events from the quick-note textarea. Persists the current
	 * text to `sessionStorage` (survives page refresh but is wiped on tab close)
	 * and updates the "last saved" time label shown beneath the textarea.
	 *
	 * @param event - The native input event from the textarea element.
	 */
	protected onNoteInput(event: Event): void {
		const value = (event.target as HTMLTextAreaElement).value;
		this.noteText = value;
		sessionStorage.setItem(this.NOTE_KEY, value);
		const now = new Date();
		const pad = (n: number) => String(n).padStart(2, '0');
		this.noteSavedTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
	}

	// ── Pomodoro ──────────────────────────────────────────────────────────

	/**
	 * Formats the remaining pomodoro seconds as a zero-padded `MM:SS` string
	 * for display in the timer ring.
	 */
	protected get pomodoroDisplay(): string {
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${pad(Math.floor(this.pomodoroTime / 60))}:${pad(this.pomodoroTime % 60)}`;
	}

	/**
	 * Builds the inline `background` style for the conic-gradient ring that
	 * shows how much of the current interval has elapsed. The colour switches
	 * between red (work) and green (break) to match the active mode.
	 *
	 * @returns A CSS `conic-gradient(…)` string ready for `[style.background]`.
	 */
	protected getPomodoroRingStyle(): string {
		const total = this.pomodoroMode === 'work' ? this.workDuration : this.BREAK_DURATION;
		const elapsed = total - this.pomodoroTime;
		const pct = (elapsed / total) * 100;
		const color = this.pomodoroMode === 'work' ? '#ef4444' : '#22c55e';
		return `conic-gradient(${color} ${pct}%, #f1f5f9 ${pct}%)`;
	}

	/**
	 * Select a preset work-interval duration. No-ops if the timer is running so
	 * an in-progress session is not accidentally reset.
	 *
	 * @param minutes - The preset duration in minutes (e.g. 5, 10, 25, 45, 60).
	 */
	protected selectPomodoroPreset(minutes: number): void {
		if (this.pomodoroRunning) return;
		this.pomodoroSelectedPreset = minutes;
		this.pomodoroTime = minutes * 60;
		this.pomodoroMode = 'work';
	}

	/**
	 * Toggle the pomodoro timer between running and paused. When the countdown
	 * reaches zero it automatically switches mode (work → break or break → work)
	 * and resets to the corresponding duration.
	 */
	protected togglePomodoro(): void {
		if (this.pomodoroRunning) {
			clearInterval(this.pomodoroInterval);
			this.pomodoroRunning = false;
		} else {
			this.pomodoroRunning = true;
			this.pomodoroInterval = setInterval(() => {
				this.pomodoroTime--;
				if (this.pomodoroTime <= 0) {
					clearInterval(this.pomodoroInterval);
					this.pomodoroRunning = false;
					if (this.pomodoroMode === 'work') {
						this.pomodoroMode = 'break';
						this.pomodoroTime = this.BREAK_DURATION;
					} else {
						this.pomodoroMode = 'work';
						this.pomodoroTime = this.workDuration;
					}
				}
				this.cdr.detectChanges();
			}, 1000);
		}
	}

	/**
	 * Stop the timer, reset mode to 'work', and restore the selected preset
	 * duration so the user can start a fresh session.
	 */
	protected resetPomodoro(): void {
		clearInterval(this.pomodoroInterval);
		this.pomodoroRunning = false;
		this.pomodoroMode = 'work';
		this.pomodoroTime = this.workDuration;
	}

	// ── Time helpers ──────────────────────────────────────────────────────

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
	 * Converts a date value to a `YYYY-MM-DD` string regardless of whether it
	 * arrived as a plain string, a JS Date, or a CloudBase Timestamp object.
	 * Returns an empty string for any value that cannot be parsed, so callers can
	 * safely skip the item rather than crashing.
	 *
	 * @param value - A date in any form (string, Date, Timestamp object, etc.).
	 * @returns A `YYYY-MM-DD` string, or `''` if conversion is not possible.
	 */
	private normaliseDateToString(value: any): string {
		if (!value) return '';
		if (typeof value === 'string') return value;
		try {
			// CloudBase Timestamp objects may carry { $date: ms } or { seconds: s }.
			const ms =
				typeof value.$date === 'number'
					? value.$date
					: typeof value.seconds === 'number'
						? value.seconds * 1000
						: null;
			const d = new Date(ms ?? value);
			if (isNaN(d.getTime())) return '';
			return d.toISOString().slice(0, 10);
		} catch {
			return '';
		}
	}

	/**
	 * Computes how many days remain until a `YYYY-MM-DD` date string, returning
	 * a short label ("Today", "Tomorrow", "in Xd", or "Xd overdue").
	 *
	 * @param dateStr - An ISO-format date string (YYYY-MM-DD).
	 * @returns A human-readable countdown label, or an empty string if no date is provided.
	 */
	protected getDaysUntil(dateStr: any): string {
		if (!dateStr) return '';
		// Defensive: CloudBase may return a Date/Timestamp object if the date was
		// saved without string-formatting. Normalise to YYYY-MM-DD before splitting.
		const str: string = this.normaliseDateToString(dateStr);
		if (!str) return '';
		const [year, month, day] = str.split('-').map(Number);
		const target = new Date(year, month - 1, day);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
		if (diff < 0) return `${Math.abs(diff)}d overdue`;
		if (diff === 0) return 'Today';
		if (diff === 1) return 'Tomorrow';
		return `in ${diff}d`;
	}

	/**
	 * Returns `true` if the given `YYYY-MM-DD` date is strictly before today
	 * (i.e. the item is past due).
	 *
	 * @param dateStr - An ISO-format date string (YYYY-MM-DD).
	 * @returns `true` if the date is in the past, `false` otherwise.
	 */
	protected isOverdue(dateStr: any): boolean {
		if (!dateStr) return false;
		// Defensive: normalise Date/Timestamp objects the same way getDaysUntil does.
		const str: string = this.normaliseDateToString(dateStr);
		if (!str) return false;
		const [year, month, day] = str.split('-').map(Number);
		const target = new Date(year, month - 1, day);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return target < today;
	}

	/**
	 * Truncates a string to at most `max` characters, appending an ellipsis
	 * (`…`) when the text is cut. Returns an empty string for falsy input.
	 *
	 * @param text - The text to truncate.
	 * @param max - The maximum number of characters to keep before truncating.
	 * @returns The truncated string with an ellipsis appended if needed.
	 */
	protected truncate(text: string, max: number): string {
		if (!text) return '';
		return text.length > max ? text.substring(0, max) + '…' : text;
	}

	// ── Data accessors ────────────────────────────────────────────────────

	/**
	 * Returns whichever of `lastAdded` / `lastDeleted` is more recent, or
	 * `null` if neither exists in the current statistics snapshot.
	 * Used by the entertainment card to show a single "last activity" row.
	 */
	protected getLastMovieActivity(): { type: 'added' | 'deleted'; title: string; timestamp: string } | null {
		const added = this.stats?.lastAdded;
		const deleted = this.stats?.lastDeleted;
		if (!added && !deleted) return null;
		if (added && !deleted) return { type: 'added', ...added };
		if (!added && deleted) return { type: 'deleted', ...deleted };
		return added.timestamp >= deleted.timestamp
			? { type: 'added', ...added }
			: { type: 'deleted', ...deleted };
	}

	/**
	 * Flattens the raw `reminderUpcoming` statistics field (which may arrive as
	 * either an array or a CloudBase object-map keyed by index) into a plain array.
	 *
	 * @returns All reminder items from the statistics snapshot, or an empty array
	 *   if the field is absent.
	 */
	protected getAllReminderItems(): any[] {
		const raw = this.stats?.reminderUpcoming;
		if (!raw) return [];
		return Array.isArray(raw) ? raw : Object.values(raw);
	}

	/**
	 * Counts the number of reminder items whose due date is in the past.
	 * Displayed as the overdue badge on the reminder stat chip.
	 *
	 * @returns The number of overdue reminder items.
	 */
	protected getOverdueCount(): number {
		return this.getAllReminderItems().filter((item) => this.isOverdue(item?.date)).length;
	}

	/**
	 * Returns the items shown in the reminder dashboard widget:
	 * every overdue item plus every item due within the next 7 days,
	 * sorted ascending by days-until-due (most overdue first → today → 7 days out),
	 * capped at 5 entries.
	 */
	protected getReminderWidgetItems(): any[] {
		const toDateStr = (d: any): string => this.normaliseDateToString(d);

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return this.getAllReminderItems()
			.filter((item: any) => {
				if (!item?.date) return false;
				const str = toDateStr(item.date);
				if (!str) return false; // unparseable date — skip rather than crash
				const [y, m, d] = str.split('-').map(Number);
				const target = new Date(y, m - 1, d);
				const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
				// Include overdue (diff < 0) and anything due within 7 days (0–7)
				return diff <= 7;
			})
			.sort((a: any, b: any) => {
				const parse = (dateVal: any) => {
					const [y, m, d] = toDateStr(dateVal).split('-').map(Number);
					return new Date(y, m - 1, d).getTime();
				};
				return parse(a.date) - parse(b.date); // ascending: most overdue → soonest due
			})
			.slice(0, 7);
	}

	/**
	 * Extracts the list of in-progress patch notes from the statistics snapshot.
	 * Normalises the value to a plain array regardless of whether CloudBase stored
	 * it as an array or an object-map.
	 *
	 * @returns An array of in-progress patch note objects, or an empty array if absent.
	 */
	protected getPatchInProgress(): any[] {
		const raw = this.stats?.patchInProgress;
		if (!raw) return [];
		const items = Array.isArray(raw) ? raw : Object.values(raw);
		return items;
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
		const raw = this.stats?.genre;
		if (!raw) return [];
		const entries = Object.entries(raw as Record<string, number>)
			.filter(([key, val]) => key !== 'Favourite' && (val as number) > 0)
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

		// ── Entertainment ──────────────────────────────────────────────────────
		const rawMovie = this.stats?.recentMovieActivities;
		const movieActivities: any[] = rawMovie
			? Array.isArray(rawMovie)
				? rawMovie
				: Object.values(rawMovie)
			: [];
		for (const m of movieActivities) {
			if (!m?.timestamp) continue;
			let icon = 'live_tv',
				label = 'Movie Added',
				color = '#e91e8c';
			if (m.type === 'deleted') {
				icon = 'tv_off';
				label = 'Movie Removed';
				color = '#94a3b8';
			} else if (m.type === 'updated') {
				icon = 'star';
				label = 'Movie Rated';
				color = '#f7971e';
			} else if (m.type === 'search') {
				icon = 'search';
				label = 'Entertainment Rate Search';
				color = '#4776e6';
			}
			events.push({
				icon,
				label,
				detail: this.truncate(m.title ?? '', 36),
				time: this.getRelativeTime(m.timestamp),
				color,
				raw: m.timestamp
			});
		}

		// ── Patch Notes ────────────────────────────────────────────────────────
		const rawPatch = this.stats?.recentPatchActivities;
		const patchActivities: any[] = rawPatch
			? Array.isArray(rawPatch)
				? rawPatch
				: Object.values(rawPatch)
			: [];
		for (const p of patchActivities) {
			if (!p?.timestamp) continue;
			let icon = 'note_stack';
			let label = 'Patch Notes Added';
			let color = '#8e54e9';
			if (p.type === 'bugLogged') {
				icon = 'bug_report';
				label = 'Patch Notes Bug Logged';
			} else if (p.type === 'statusChanged') {
				icon = 'swap_horiz';
				label = 'Patch Notes Status Changed';
			} else if (p.type === 'edited') {
				icon = 'edit';
				label = 'Patch Notes Updated';
			} else if (p.type === 'deleted') {
				icon = 'delete';
				label = 'Patch Notes Deleted';
				color = '#ef4444';
			}
			events.push({
				icon,
				label,
				detail: this.truncate(`#${p.noteIndex ?? '?'} ${p.component}`, 36),
				time: this.getRelativeTime(p.timestamp),
				color,
				raw: p.timestamp
			});
		}

		// ── Reminder ──────────────────────────────────────────────────────────
		const rawReminder = this.stats?.recentReminderActivities;
		const reminderActivities: any[] = rawReminder
			? Array.isArray(rawReminder)
				? rawReminder
				: Object.values(rawReminder)
			: [];
		for (const r of reminderActivities) {
			if (!r?.timestamp) continue;
			let icon = 'note_add',
				label = 'Reminder Added',
				color = '#f59e0b';
			if (r.type === 'deleted') {
				icon = 'delete';
				label = 'Reminder Deleted';
				color = '#ef4444';
			} else if (r.type === 'updated') {
				icon = 'edit_note';
				label = 'Reminder Updated';
			}
			const detail = r.text ? this.truncate(`${r.table ?? ''} · ${r.text}`, 40) : (r.table ?? '');
			events.push({
				icon,
				label,
				detail,
				time: this.getRelativeTime(r.timestamp),
				color,
				raw: r.timestamp
			});
		}

		// ── Resonance ─────────────────────────────────────────────────────────
		const rawResonance = this.stats?.recentResonanceActivities;
		const resonanceActivities: any[] = rawResonance
			? Array.isArray(rawResonance)
				? rawResonance
				: Object.values(rawResonance)
			: [];
		for (const q of resonanceActivities) {
			if (!q?.timestamp) continue;
			let icon = 'format_quote',
				label = 'Resonance Quote Added',
				color = '#fda085';
			if (q.type === 'deleted') {
				icon = 'format_clear';
				label = 'Resonance Quote Removed';
				color = '#94a3b8';
			}
			events.push({
				icon,
				label,
				detail: this.truncate(`by ${q.author ?? ''}`, 36),
				time: this.getRelativeTime(q.timestamp),
				color,
				raw: q.timestamp
			});
		}

		// Sort newest-first, cap at 24, strip the helper field.
		return events
			.sort((a, b) => b.raw.localeCompare(a.raw))
			.slice(0, 24)
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
		items: any[];
	}[] {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const sunday = new Date(today);
		const dow = today.getDay();
		sunday.setDate(today.getDate() - dow);
		const allItems = this.getAllReminderItems();
		const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		return Array.from({ length: 7 }, (_, i) => {
			const date = new Date(sunday);
			date.setDate(sunday.getDate() + i);
			const y = date.getFullYear();
			const m = String(date.getMonth() + 1).padStart(2, '0');
			const d = String(date.getDate()).padStart(2, '0');
			const dateStr = `${y}-${m}-${d}`;
			return {
				label: dayLabels[i],
				dayNum: date.getDate(),
				dateStr,
				isToday: date.getTime() === today.getTime(),
				isPast: date.getTime() < today.getTime(),
				items: allItems.filter((item) => this.normaliseDateToString(item?.date) === dateStr)
			};
		});
	}
}
