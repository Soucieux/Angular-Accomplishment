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

	protected navigateQA(path: string, state?: object): void {
		this.router.navigate([path], state ? { state } : undefined);
	}

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
						if (this.loading) { this.loading = false; this.cdr.detectChanges(); }
					}, 5000);
					this.statsSub = this.databaseService.getStatistics().subscribe((data) => {
						clearTimeout(this.loadingTimer);
						this.stats = data;
						this.loading = false;
						this.cdr.detectChanges();
					});

					// Animate quote view out, then reveal dashboard
					this.transitioning = true;
					this.cdr.detectChanges();
					setTimeout(() => {
						this.showDashboard = true;
						this.transitioning = false;
						this.cdr.detectChanges();
					}, 560);
				} else if (!loggedIn) {
					clearTimeout(this.loadingTimer);
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

	ngOnDestroy() {
		clearTimeout(this.loadingTimer);
		clearInterval(this.clockInterval);
		clearInterval(this.pomodoroInterval);
		this.statsSub?.unsubscribe();
		this.loginSub?.unsubscribe();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	// ── Clock ─────────────────────────────────────────────────────────────

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

		// Week progress — Mon 00:00 = 0 %, Sun 23:59:59 ≈ 100 %
		const dow = now.getDay(); // 0 = Sun … 6 = Sat
		const daysSinceMon = dow === 0 ? 6 : dow - 1; // Mon = 0 … Sun = 6
		this.weekProgress = parseFloat(
			(((daysSinceMon * 86400 + secondsToday) / (7 * 86400)) * 100).toFixed(1)
		);

		// Month progress — 1st 00:00 = 0 %, last-day 23:59:59 ≈ 100 %
		this.daysInMonth = new Date(y, now.getMonth() + 1, 0).getDate();
		this.currentDayOfMonth = now.getDate();
		this.monthProgress = parseFloat(
			((((this.currentDayOfMonth - 1) * 86400 + secondsToday) / (this.daysInMonth * 86400)) * 100).toFixed(1)
		);

		// Day of week label (Mon = 1 … Sun = 7)
		this.dayOfWeekNum = dow === 0 ? 7 : dow;

		this.cdr.detectChanges();
	}

	// ── Quick Note ────────────────────────────────────────────────────────

	protected onNoteInput(event: Event): void {
		const value = (event.target as HTMLTextAreaElement).value;
		this.noteText = value;
		sessionStorage.setItem(this.NOTE_KEY, value);
		const now = new Date();
		const pad = (n: number) => String(n).padStart(2, '0');
		this.noteSavedTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
	}

	// ── Pomodoro ──────────────────────────────────────────────────────────

	protected get pomodoroDisplay(): string {
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${pad(Math.floor(this.pomodoroTime / 60))}:${pad(this.pomodoroTime % 60)}`;
	}

	protected getPomodoroRingStyle(): string {
		const total = this.pomodoroMode === 'work' ? this.workDuration : this.BREAK_DURATION;
		const elapsed = total - this.pomodoroTime;
		const pct = (elapsed / total) * 100;
		const color = this.pomodoroMode === 'work' ? '#ef4444' : '#22c55e';
		return `conic-gradient(${color} ${pct}%, #f1f5f9 ${pct}%)`;
	}

	protected selectPomodoroPreset(minutes: number): void {
		if (this.pomodoroRunning) return;
		this.pomodoroSelectedPreset = minutes;
		this.pomodoroTime = minutes * 60;
		this.pomodoroMode = 'work';
	}

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

	protected resetPomodoro(): void {
		clearInterval(this.pomodoroInterval);
		this.pomodoroRunning = false;
		this.pomodoroMode = 'work';
		this.pomodoroTime = this.workDuration;
	}

	// ── Time helpers ──────────────────────────────────────────────────────

	protected getRelativeTime(timestamp: string): string {
		return Utilities.getRelativeTime(timestamp);
	}

	protected getDaysUntil(dateStr: string): string {
		if (!dateStr) return '';
		const [year, month, day] = dateStr.split('-').map(Number);
		const target = new Date(year, month - 1, day);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
		if (diff < 0) return `${Math.abs(diff)}d overdue`;
		if (diff === 0) return 'Today';
		if (diff === 1) return 'Tomorrow';
		return `in ${diff}d`;
	}

	protected isOverdue(dateStr: string): boolean {
		if (!dateStr) return false;
		const [year, month, day] = dateStr.split('-').map(Number);
		const target = new Date(year, month - 1, day);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return target < today;
	}

	protected truncate(text: string, max: number): string {
		if (!text) return '';
		return text.length > max ? text.substring(0, max) + '…' : text;
	}

	// ── Data accessors ────────────────────────────────────────────────────

	/** Returns whichever of lastAdded / lastDeleted is more recent, or null if neither exists. */
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

	protected getAllReminderItems(): any[] {
		const raw = this.stats?.reminderUpcoming;
		if (!raw) return [];
		return Array.isArray(raw) ? raw : Object.values(raw);
	}

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
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return this.getAllReminderItems()
			.filter((item: any) => {
				if (!item?.date) return false;
				const [y, m, d] = item.date.split('-').map(Number);
				const target = new Date(y, m - 1, d);
				const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
				// Include overdue (diff < 0) and anything due within 7 days (0–7)
				return diff <= 7;
			})
			.sort((a: any, b: any) => {
				const parse = (dateStr: string) => {
					const [y, m, d] = dateStr.split('-').map(Number);
					return new Date(y, m - 1, d).getTime();
				};
				return parse(a.date) - parse(b.date); // ascending: most overdue → soonest due
			})
			.slice(0, 5);
	}

	protected getPatchInProgress(): any[] {
		const raw = this.stats?.patchInProgress;
		if (!raw) return [];
		return Array.isArray(raw) ? raw : Object.values(raw);
	}

	protected getGenreData(): { label: string; count: number; pct: number }[] {
		const raw = this.stats?.genre;
		if (!raw) return [];
		const entries = (Object.entries(raw as Record<string, number>))
			.filter(([key, val]) => key !== 'Favourite' && (val as number) > 0)
			.map(([label, count]) => ({ label, count: count as number, pct: 0 }));
		if (!entries.length) return [];
		entries.sort((a, b) => b.count - a.count);
		const max = entries[0].count;
		return entries.slice(0, 8).map((e) => ({ ...e, pct: Math.round((e.count / max) * 100) }));
	}

	protected getRecentActivity(): { icon: string; label: string; detail: string; time: string; color: string }[] {
		const events: { icon: string; label: string; detail: string; time: string; color: string; raw: string }[] = [];
		if (this.stats?.lastAdded?.timestamp) {
			events.push({ icon: 'live_tv', label: 'Movie added', detail: this.truncate(this.stats.lastAdded.title, 28), time: this.getRelativeTime(this.stats.lastAdded.timestamp), color: '#e91e8c', raw: this.stats.lastAdded.timestamp });
		}
		if (this.stats?.lastRateSearch?.timestamp) {
			events.push({ icon: 'search', label: 'Rate search', detail: '', time: this.getRelativeTime(this.stats.lastRateSearch.timestamp), color: '#4776e6', raw: this.stats.lastRateSearch.timestamp });
		}
		if (this.stats?.latestQuote?.timestamp) {
			events.push({ icon: 'format_quote', label: 'Quote added', detail: this.truncate(this.stats.latestQuote.text, 36), time: this.getRelativeTime(this.stats.latestQuote.timestamp), color: '#fda085', raw: this.stats.latestQuote.timestamp });
		}
		return events.map(({ raw: _raw, ...rest }) => rest);
	}

	protected getWeekDays(): {
		label: string; dayNum: number; dateStr: string;
		isToday: boolean; isPast: boolean; items: any[];
	}[] {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const monday = new Date(today);
		const dow = today.getDay();
		monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
		const allItems = this.getAllReminderItems();
		const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
		return Array.from({ length: 7 }, (_, i) => {
			const date = new Date(monday);
			date.setDate(monday.getDate() + i);
			const y = date.getFullYear();
			const m = String(date.getMonth() + 1).padStart(2, '0');
			const d = String(date.getDate()).padStart(2, '0');
			const dateStr = `${y}-${m}-${d}`;
			return {
				label: dayLabels[i], dayNum: date.getDate(), dateStr,
				isToday: date.getTime() === today.getTime(),
				isPast: date.getTime() < today.getTime(),
				items: allItems.filter((item) => item?.date === dateStr)
			};
		});
	}
}
