import { Injectable, OnDestroy, computed, signal } from '@angular/core';
import { OrbitalAgendaItem, OrbitalProgressMetric, OrbitalWeekDay } from './orbital.model';

@Injectable()
export class OrbitalStore implements OnDestroy {
	private readonly _now = signal(new Date());
	private readonly timer = setInterval(() => this._now.set(new Date()), 1000);
	readonly now = this._now.asReadonly();

	// ── Clock strings ──

	readonly hourMinute = computed(() => {
		const now = this.now();
		return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
	});

	readonly seconds = computed(() => String(this.now().getSeconds()).padStart(2, '0'));

	readonly greeting = computed(() => {
		const hour = this.now().getHours();
		return hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
	});

	readonly dateLong = computed(() =>
		this.now().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
	);

	// ── Progress rings ──

	readonly progress = computed<OrbitalProgressMetric[]>(() => {
		const now = this.now();
		const year = now.getFullYear();
		const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
		const daysInYear = isLeap ? 366 : 365;
		const dayOfYear = Math.floor((now.getTime() - new Date(year, 0, 0).getTime()) / 864e5);
		const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
		const dayOfWeek = now.getDay() || 7;
		const dayPercentage =
			((now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400) * 100;
		return [
			{ key: 'year', percentage: Math.round((dayOfYear / daysInYear) * 100), gradientStart: '#38bdf8', gradientEnd: '#818cf8' },
			{
				key: 'month',
				percentage: Math.round((now.getDate() / daysInMonth) * 100),
				gradientStart: '#f97316',
				gradientEnd: '#fbbf24',
			},
			{ key: 'week', percentage: Math.round((dayOfWeek / 7) * 100), gradientStart: '#22c55e', gradientEnd: '#059669' },
			{ key: 'day', percentage: Math.round(dayPercentage), gradientStart: '#a78bfa', gradientEnd: '#ec4899' },
		];
	});

	// ── Week strip (populated by OrbitalComponent via setWeekData) ──

	private readonly _weekData = signal<OrbitalWeekDay[]>([]);
	private readonly _agendaData = signal<Record<number, OrbitalAgendaItem[]>>({});

	readonly week = this._weekData.asReadonly();

	readonly todayDayIndex = computed(() => Math.max(0, this._weekData().findIndex((day) => day.isToday)));

	private readonly _selectedDayIndex = signal<number | null>(null);
	readonly selectedDayIndex = computed(() => this._selectedDayIndex() ?? this.todayDayIndex());

	/**
	 * Sets the selected day index for the week-strip interaction.
	 *
	 * @param dayIndex - The 0-based index of the selected day (Monday = 0).
	 */
	setSelectedDayIndex(dayIndex: number): void {
		this._selectedDayIndex.set(dayIndex);
	}

	/**
	 * Replaces the week strip and per-day agenda with freshly built data.
	 * Called by OrbitalComponent in ngOnChanges when reminder data arrives.
	 *
	 * @param days - The 7-day week descriptor array (Monday-first).
	 * @param agenda - Map of day index (0 = Mon) to that day's agenda items.
	 */
	setWeekData(days: OrbitalWeekDay[], agenda: Record<number, OrbitalAgendaItem[]>): void {
		this._weekData.set(days);
		this._agendaData.set(agenda);
	}

	readonly agenda = computed<OrbitalAgendaItem[]>(() => this._agendaData()[this.selectedDayIndex()] ?? []);

	readonly selectedDateLong = computed(() => {
		const day = this._weekData()[this.selectedDayIndex()];
		if (!day) return '';
		return day.fullDate.toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'short',
			day: 'numeric',
		});
	});

	/**
	 * Clears the timer interval when the store is destroyed.
	 */
	ngOnDestroy(): void {
		clearInterval(this.timer);
	}
}
