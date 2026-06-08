import { Injectable, OnDestroy, computed, signal } from '@angular/core';
import {
	HOME_GREETING_AFTERNOON,
	HOME_GREETING_EVENING,
	HOME_GREETING_MORNING,
	HOME_GREETING_NIGHT,
	HOME_LOCALE_EN_US,
	HOME_PROGRESS_KEY_DAY,
	HOME_PROGRESS_KEY_MONTH,
	HOME_PROGRESS_KEY_WEEK,
	HOME_PROGRESS_KEY_YEAR,
	HOME_PROGRESS_LABEL_DAY,
	HOME_PROGRESS_LABEL_MONTH,
	HOME_PROGRESS_LABEL_WEEK,
	HOME_PROGRESS_LABEL_YEAR
} from '../../../common/app.constant';
import { OrbitalAgendaItem, OrbitalProgressMetric, OrbitalWeekDay } from './orbital.model';

@Injectable()
export class OrbitalStore implements OnDestroy {
	private readonly _now = signal(new Date());
	private readonly timer = setInterval(() => this._now.set(new Date()), 1000);

	/**
	 * Gets the current time as a live read-only signal, ticking every second.
	 *
	 * @returns A read-only signal emitting the current Date.
	 */
	readonly now = this._now.asReadonly();

	////////////////////// Below are clock computed strings //////////////////////

	/**
	 * Gets the current time formatted as HH:MM.
	 *
	 * @returns A zero-padded hours-and-minutes string.
	 */
	readonly hourMinute = computed(() => {
		const now = this.now();
		return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
	});

	/**
	 * Gets the current seconds formatted as SS.
	 *
	 * @returns A zero-padded two-digit seconds string.
	 */
	readonly seconds = computed(() => String(this.now().getSeconds()).padStart(2, '0'));

	/**
	 * Gets the appropriate time-of-day greeting for the current hour.
	 *
	 * @returns A greeting string such as "Good morning" or "Good evening".
	 */
	readonly greeting = computed(() => {
		const hour = this.now().getHours();
		return hour < 5
			? HOME_GREETING_NIGHT
			: hour < 12
				? HOME_GREETING_MORNING
				: hour < 18
					? HOME_GREETING_AFTERNOON
					: HOME_GREETING_EVENING;
	});

	/**
	 * Gets the current date formatted as a long human-readable string.
	 *
	 * @returns A locale-formatted date string such as "Monday, June 6".
	 */
	readonly dateLong = computed(() =>
		this.now().toLocaleDateString(HOME_LOCALE_EN_US, { weekday: 'long', month: 'long', day: 'numeric' })
	);

	////////////////////// Below are progress ring computed values ////////////////

	/**
	 * Gets the current progress percentage for each life-clock ring (year, month, week, day).
	 *
	 * @returns An array of four progress metrics ordered from outermost to innermost ring.
	 */
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
			{
				key: HOME_PROGRESS_KEY_YEAR,
				label: HOME_PROGRESS_LABEL_YEAR,
				percentage: Math.round((dayOfYear / daysInYear) * 100),
				gradientStart: '#38bdf8',
				gradientEnd: '#818cf8'
			},
			{
				key: HOME_PROGRESS_KEY_MONTH,
				label: HOME_PROGRESS_LABEL_MONTH,
				percentage: Math.round((now.getDate() / daysInMonth) * 100),
				gradientStart: '#f97316',
				gradientEnd: '#fbbf24'
			},
			{
				key: HOME_PROGRESS_KEY_WEEK,
				label: HOME_PROGRESS_LABEL_WEEK,
				percentage: Math.round((dayOfWeek / 7) * 100),
				gradientStart: '#22c55e',
				gradientEnd: '#059669'
			},
			{
				key: HOME_PROGRESS_KEY_DAY,
				label: HOME_PROGRESS_LABEL_DAY,
				percentage: Math.round(dayPercentage),
				gradientStart: '#a78bfa',
				gradientEnd: '#ec4899'
			}
		];
	});

	////////////////////// Below are week strip signals //////////////////////////

	private readonly _weekData = signal<OrbitalWeekDay[]>([]);
	private readonly _agendaData = signal<Record<number, OrbitalAgendaItem[]>>({});

	/**
	 * Gets the current week's day descriptors as a read-only signal.
	 *
	 * @returns A read-only signal emitting the seven-day array (Monday-first).
	 */
	readonly week = this._weekData.asReadonly();

	/**
	 * Gets the index of today within the current week strip (Monday = 0).
	 *
	 * @returns The 0-based index of today, or 0 if today is not found.
	 */
	readonly todayDayIndex = computed(() =>
		Math.max(
			0,
			this._weekData().findIndex((day) => day.isToday)
		)
	);

	private readonly _selectedDayIndex = signal<number | null>(null);

	/**
	 * Gets the currently selected day index, defaulting to today when no explicit selection exists.
	 *
	 * @returns The 0-based index of the selected day (Monday = 0).
	 */
	readonly selectedDayIndex = computed(() => this._selectedDayIndex() ?? this.todayDayIndex());

	/**
	 * Sets the selected day index for the week-strip interaction.
	 *
	 * @param dayIndex - The 0-based index of the selected day (Monday = 0).
	 */
	public setSelectedDayIndex(dayIndex: number): void {
		this._selectedDayIndex.set(dayIndex);
	}

	/**
	 * Replaces the week strip and per-day agenda with freshly built data.
	 * Called by OrbitalComponent in ngOnChanges when reminder data arrives.
	 *
	 * @param days - The 7-day week descriptor array (Monday-first).
	 * @param agenda - Map of day index (0 = Mon) to that day's agenda items.
	 */
	public setWeekData(days: OrbitalWeekDay[], agenda: Record<number, OrbitalAgendaItem[]>): void {
		this._weekData.set(days);
		this._agendaData.set(agenda);
	}

	/**
	 * Gets the agenda items for the currently selected day.
	 *
	 * @returns An array of agenda items, or an empty array when none exist for the selected day.
	 */
	readonly agenda = computed<OrbitalAgendaItem[]>(() => this._agendaData()[this.selectedDayIndex()] ?? []);

	/**
	 * Gets a long-form date label for the currently selected day.
	 *
	 * @returns A locale-formatted date string such as "Monday, Jun 6", or an empty string when no week data is loaded.
	 */
	readonly selectedDateLong = computed(() => {
		const day = this._weekData()[this.selectedDayIndex()];
		if (!day) return '';
		return day.fullDate.toLocaleDateString(HOME_LOCALE_EN_US, {
			weekday: 'long',
			month: 'short',
			day: 'numeric'
		});
	});

	/**
	 * Clears the timer interval when the store is destroyed.
	 */
	ngOnDestroy(): void {
		clearInterval(this.timer);
	}
}
