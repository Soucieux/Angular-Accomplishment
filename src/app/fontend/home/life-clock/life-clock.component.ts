import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	OnDestroy,
	OnInit,
	PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DAY_NAMES_LONG, MONTH_NAMES_SHORT } from '../../../common/app.constant';

@Component({
	selector: 'life-clock',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './life-clock.component.html',
	styleUrls: ['./life-clock.component.css']
})
export class LifeClockComponent implements OnInit, OnDestroy {
	private clockInterval?: ReturnType<typeof setInterval>;
	private lastMonth = -1;

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

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		private cdr: ChangeDetectorRef
	) {}

	/**
	 * Starts the live clock ticker when running in a browser context.
	 */
	ngOnInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.tickClock();
			this.clockInterval = setInterval(() => this.tickClock(), 1000);
		}
	}

	/**
	 * Clears the clock interval on component destruction.
	 */
	ngOnDestroy(): void {
		clearInterval(this.clockInterval);
	}

	/**
	 * Called once per second by clockInterval. Computes the current time string,
	 * the formatted date label, year/month/week/day progress percentages, and the
	 * ISO day-of-week number, then triggers change detection so the display updates
	 * without zone involvement.
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
		const dow = now.getDay();
		const daysSinceSun = dow;
		this.weekProgress = parseFloat(
			(((daysSinceSun * 86400 + secondsToday) / (7 * 86400)) * 100).toFixed(1)
		);

		/* Month progress — 1st 00:00 = 0 %, last-day 23:59:59 ≈ 100 %
		   Only recompute daysInMonth when the month changes, not every second. */
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

		// setInterval fires outside Angular's zone — detectChanges required to update the display.
		this.cdr.detectChanges();
	}
}
