import { Component, Input, ViewEncapsulation, inject } from '@angular/core';
import {
	HOME_WEEK_AGENDA_BORDER_COLOR_DARK,
	HOME_WEEK_AGENDA_BORDER_COLOR_LIGHT,
	HOME_WEEK_AGENDA_BORDER_TRANSPARENT,
	HOME_WEEK_AGENDA_COLOR_DAY_DEFAULT_DARK,
	HOME_WEEK_AGENDA_COLOR_DAY_DEFAULT_LIGHT,
	HOME_WEEK_AGENDA_COLOR_DAY_SELECTED_DARK,
	HOME_WEEK_AGENDA_COLOR_DAY_SELECTED_LIGHT,
	HOME_WEEK_AGENDA_COLOR_DAY_SELECTED_TEXT_LIGHT,
	HOME_WEEK_AGENDA_COLOR_DAY_TEXT_DIM_DARK,
	HOME_WEEK_AGENDA_COLOR_DAY_TEXT_LIGHT,
	HOME_WEEK_AGENDA_COLOR_DOT_DARK,
	HOME_WEEK_AGENDA_COLOR_DOT_LIGHT,
	HOME_WEEK_AGENDA_COLOR_ROW_BG_DARK,
	HOME_WEEK_AGENDA_COLOR_ROW_BG_LIGHT,
	HOME_WEEK_AGENDA_COLOR_SUBTITLE_DARK,
	HOME_WEEK_AGENDA_COLOR_SUBTITLE_LIGHT,
	HOME_WEEK_AGENDA_COLOR_TEXT_DARK,
	HOME_WEEK_AGENDA_COLOR_TEXT_LIGHT,
	HOME_WEEK_AGENDA_COLOR_TODAY_TEXT,
	HOME_WEEK_AGENDA_GRADIENT_TODAY
} from '../../../common/app.constant';
import { OrbitalAgendaItem, OrbitalProgressMetric, OrbitalWeekDay } from './orbital.model';
import { OrbitalStore } from './orbital.store';

let ringIdCounter = 0;

/**
 * Converts a hex colour string and alpha value to an rgba() string.
 *
 * @param hex - The six-digit hex colour string (e.g. '#d53369').
 * @param alpha - The alpha channel value between 0 and 1.
 * @returns A CSS rgba() colour string.
 */
export function hexToRgba(hex: string, alpha: number): string {
	const red = parseInt(hex.slice(1, 3), 16);
	const green = parseInt(hex.slice(3, 5), 16);
	const blue = parseInt(hex.slice(5, 7), 16);
	return `rgba(${red},${green},${blue},${alpha})`;
}

////////////////////// Below is VcRing — single gradient SVG progress ring ///

@Component({
	selector: 'vc-ring',
	standalone: true,
	template: `
		<div class="wrap" [style.width.px]="size" [style.height.px]="size">
			<svg [attr.width]="size" [attr.height]="size" style="transform:rotate(-90deg)">
				<defs>
					<linearGradient [attr.id]="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" [attr.stop-color]="gradientStart"></stop>
						<stop offset="100%" [attr.stop-color]="gradientEnd"></stop>
					</linearGradient>
				</defs>
				<circle
					[attr.cx]="size / 2"
					[attr.cy]="size / 2"
					[attr.r]="radius"
					fill="none"
					[attr.stroke]="track"
					[attr.stroke-width]="stroke"></circle>
				<circle
					class="prog"
					[attr.cx]="size / 2"
					[attr.cy]="size / 2"
					[attr.r]="radius"
					fill="none"
					[attr.stroke]="'url(#' + gradientId + ')'"
					[attr.stroke-width]="stroke"
					stroke-linecap="round"
					[attr.stroke-dasharray]="circumference"
					[attr.stroke-dashoffset]="dashOffset"></circle>
			</svg>
			<div class="center"><ng-content></ng-content></div>
		</div>
	`,
	styles: [
		`
			.wrap {
				position: relative;
				flex-shrink: 0;
			}
			.prog {
				transition: stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1);
			}
			.center {
				position: absolute;
				inset: 0;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
			}
		`
	]
})
export class VcRing {
	readonly gradientId = 'rg' + ringIdCounter++;

	@Input() percentage = 0;
	@Input() size = 120;
	@Input() stroke = 10;
	@Input() gradientStart = '#d53369';
	@Input() gradientEnd = '#daae51';
	@Input() track = 'rgba(255,255,255,0.12)';

	/**
	 * Gets the radius of the progress circle adjusted for stroke width.
	 *
	 * @returns The effective circle radius in pixels.
	 */
	get radius(): number {
		return (this.size - this.stroke) / 2;
	}

	/**
	 * Gets the full circumference of the progress circle.
	 *
	 * @returns The circumference in pixels.
	 */
	get circumference(): number {
		return 2 * Math.PI * this.radius;
	}

	/**
	 * Gets the stroke-dashoffset that represents the current percentage.
	 *
	 * @returns The dashoffset value for the SVG stroke animation.
	 */
	get dashOffset(): number {
		return this.circumference * (1 - Math.min(100, Math.max(0, this.percentage)) / 100);
	}
}

////////////////////// Below is VcConcentric — stacked rings per metric //////

@Component({
	selector: 'vc-concentric',
	standalone: true,
	imports: [VcRing],
	template: `
		<div class="wrap" [style.width.px]="size" [style.height.px]="size">
			@for (metric of metrics; track metric.key; let i = $index) {
				<div
					class="ring"
					[style.top.px]="(size - computeRingSize(i)) / 2"
					[style.left.px]="(size - computeRingSize(i)) / 2">
					<vc-ring
						[percentage]="metric.percentage"
						[size]="computeRingSize(i)"
						[stroke]="stroke"
						[gradientStart]="metric.gradientStart"
						[gradientEnd]="metric.gradientEnd"
						[track]="track"></vc-ring>
				</div>
			}
			<div class="center"><ng-content></ng-content></div>
		</div>
	`,
	styles: [
		`
			.wrap {
				position: relative;
				flex-shrink: 0;
			}
			.ring {
				position: absolute;
			}
			.center {
				position: absolute;
				inset: 0;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				text-align: center;
			}
		`
	]
})
export class VcConcentric {
	@Input() metrics: OrbitalProgressMetric[] = [];
	@Input() size = 200;
	@Input() stroke = 11;
	@Input() gap = 5;
	@Input() track = 'rgba(255,255,255,0.10)';

	/**
	 * Gets the pixel diameter of the ring at the given stack index.
	 *
	 * @param ringIndex - The 0-based index of the ring (outermost = 0).
	 * @returns The diameter in pixels for that ring.
	 */
	protected computeRingSize(ringIndex: number): number {
		return this.size - ringIndex * (this.stroke + this.gap) * 2;
	}
}

////////////////////// Below is VcWeekAgenda — day strip and agenda list /////

@Component({
	selector: 'vc-week-agenda',
	standalone: true,
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="week-agenda-strip">
			@for (day of d.week(); track day.label) {
				<div
					class="week-agenda-day"
					(click)="d.setSelectedDayIndex(day.dayIndex)"
					[style.background]="getDayBackground(day)"
					[style.border]="getDayBorder(day)"
					[style.color]="getDayColor(day)"
					[style.opacity]="getDayOpacity(day)">
					<div class="week-agenda-label">{{ day.label }}</div>
					<div class="week-agenda-number">{{ day.dayNumber }}</div>
					@if (day.count > 0) {
						<div class="week-agenda-dot" [style.background]="getDotColor(day)"></div>
					}
				</div>
			}
		</div>
		<div class="week-agenda-due">
			<span class="week-agenda-due-header" style="color:rgba(255,255,255,0.55)">Due</span>
			<span class="week-agenda-due-date" [style.color]="getSubtitleColor()">{{
				d.selectedDateLong()
			}}</span>
		</div>
		<div class="week-agenda-list">
			@if (d.agenda().length === 0) {
				<div class="week-agenda-empty" [style.color]="getSubtitleColor()">
					Nothing due — an open day.
				</div>
			}
			@for (agendaItem of d.agenda(); track agendaItem.name) {
				<div class="week-agenda-row" [style.background]="getRowBackground()">
					<div class="week-agenda-icon" [style.background]="getIconBackground(agendaItem.color)">
						<span
							class="material-symbols-outlined week-agenda-icon-symbol"
							[style.color]="agendaItem.color"
							>{{ agendaItem.icon }}</span
						>
					</div>
					<span class="week-agenda-name" [style.color]="getTextColor()">{{ agendaItem.name }}</span>
					<span class="week-agenda-tag" [style.color]="getSubtitleColor()">{{
						agendaItem.tag
					}}</span>
				</div>
			}
		</div>
	`,
	styles: [
		`
			vc-week-agenda {
				display: contents;
			}
			.week-agenda-strip {
				display: flex;
				gap: 5px;
			}
			.week-agenda-day {
				flex: 1;
				text-align: center;
				padding: 7px 0;
				border-radius: 10px;
				cursor: pointer;
				position: relative;
				transition: background 0.15s;
			}
			.week-agenda-label {
				font-size: 13px;
				font-weight: 600;
				letter-spacing: 0.3px;
				opacity: 0.8;
			}
			.week-agenda-number {
				font-size: 13px;
				font-weight: 600;
				margin-top: 1px;
			}
			.week-agenda-dot {
				position: absolute;
				bottom: 4px;
				left: 50%;
				transform: translateX(-50%);
				width: 4px;
				height: 4px;
				border-radius: 99px;
			}
			.week-agenda-due {
				display: flex;
				align-items: baseline;
				gap: 8px;
			}
			.week-agenda-due-header {
				font-size: 13px;
				font-weight: 600;
				letter-spacing: 0.6px;
				text-transform: uppercase;
			}
			.week-agenda-due-date {
				font-size: 13px;
				font-weight: 600;
			}
			.week-agenda-list {
				display: flex;
				flex-direction: column;
				gap: 6px;
				overflow: hidden;
			}
			.week-agenda-empty {
				font-size: 13px;
				font-weight: 600;
				padding: 6px 0;
				font-style: italic;
			}
			.week-agenda-row {
				display: flex;
				align-items: center;
				gap: 10px;
				padding: 7px 10px;
				border-radius: 10px;
			}
			.week-agenda-icon {
				width: 28px;
				height: 28px;
				border-radius: 8px;
				display: flex;
				align-items: center;
				justify-content: center;
				flex-shrink: 0;
			}
			.week-agenda-icon-symbol {
				font-size: 15px;
			}
			.week-agenda-name {
				flex: 1;
				font-size: 13px;
				font-weight: 600;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			.week-agenda-tag {
				font-size: 13px;
				font-weight: 600;
				flex-shrink: 0;
			}
		`
	]
})
export class VcWeekAgenda {
	protected readonly d = inject(OrbitalStore);

	@Input() dark = false;

	/**
	 * Gets the primary text colour for agenda item names.
	 *
	 * @returns A CSS colour string.
	 */
	protected getTextColor(): string {
		return this.dark ? HOME_WEEK_AGENDA_COLOR_TEXT_DARK : HOME_WEEK_AGENDA_COLOR_TEXT_LIGHT;
	}

	/**
	 * Gets the muted secondary colour used for subtitles and tags.
	 *
	 * @returns A CSS colour string.
	 */
	protected getSubtitleColor(): string {
		return this.dark ? HOME_WEEK_AGENDA_COLOR_SUBTITLE_DARK : HOME_WEEK_AGENDA_COLOR_SUBTITLE_LIGHT;
	}

	/**
	 * Gets the background colour for an agenda row.
	 *
	 * @returns A CSS colour string.
	 */
	protected getRowBackground(): string {
		return this.dark ? HOME_WEEK_AGENDA_COLOR_ROW_BG_DARK : HOME_WEEK_AGENDA_COLOR_ROW_BG_LIGHT;
	}

	/**
	 * Gets the icon badge background derived from the item's accent colour.
	 *
	 * @param accentColor - The hex accent colour of the agenda item.
	 * @returns A CSS rgba() colour string.
	 */
	protected getIconBackground(accentColor: string): string {
		return hexToRgba(accentColor, this.dark ? 0.25 : 0.2);
	}

	/**
	 * Gets the background colour for a day cell in the strip.
	 *
	 * @param day - The week-day descriptor.
	 * @returns A CSS colour string or gradient.
	 */
	protected getDayBackground(day: OrbitalWeekDay): string {
		if (day.isToday) return HOME_WEEK_AGENDA_GRADIENT_TODAY;
		if (this.d.selectedDayIndex() === day.dayIndex)
			return this.dark
				? HOME_WEEK_AGENDA_COLOR_DAY_SELECTED_DARK
				: HOME_WEEK_AGENDA_COLOR_DAY_SELECTED_LIGHT;
		return this.dark ? HOME_WEEK_AGENDA_COLOR_DAY_DEFAULT_DARK : HOME_WEEK_AGENDA_COLOR_DAY_DEFAULT_LIGHT;
	}

	/**
	 * Gets the border style for a day cell.
	 *
	 * @param day - The week-day descriptor.
	 * @returns A CSS border shorthand string.
	 */
	protected getDayBorder(day: OrbitalWeekDay): string {
		if (this.d.selectedDayIndex() === day.dayIndex && !day.isToday)
			return `1px solid ${this.dark ? HOME_WEEK_AGENDA_BORDER_COLOR_DARK : HOME_WEEK_AGENDA_BORDER_COLOR_LIGHT}`;
		return HOME_WEEK_AGENDA_BORDER_TRANSPARENT;
	}

	/**
	 * Gets the text colour for a day cell.
	 *
	 * @param day - The week-day descriptor.
	 * @returns A CSS colour string.
	 */
	protected getDayColor(day: OrbitalWeekDay): string {
		if (day.isToday) return HOME_WEEK_AGENDA_COLOR_TODAY_TEXT;
		if (this.dark)
			return this.d.selectedDayIndex() === day.dayIndex
				? HOME_WEEK_AGENDA_COLOR_TODAY_TEXT
				: HOME_WEEK_AGENDA_COLOR_DAY_TEXT_DIM_DARK;
		return this.d.selectedDayIndex() === day.dayIndex
			? HOME_WEEK_AGENDA_COLOR_DAY_SELECTED_TEXT_LIGHT
			: HOME_WEEK_AGENDA_COLOR_DAY_TEXT_LIGHT;
	}

	/**
	 * Gets the opacity for a day cell; past non-selected days are dimmed.
	 *
	 * @param day - The week-day descriptor.
	 * @returns A numeric opacity value.
	 */
	protected getDayOpacity(day: OrbitalWeekDay): number {
		return day.isPast && !day.isToday && this.d.selectedDayIndex() !== day.dayIndex ? 0.5 : 1;
	}

	/**
	 * Gets the colour for the event-indicator dot beneath the day number.
	 *
	 * @param day - The week-day descriptor.
	 * @returns A CSS colour string.
	 */
	protected getDotColor(day: OrbitalWeekDay): string {
		return day.isToday
			? HOME_WEEK_AGENDA_COLOR_TODAY_TEXT
			: this.dark
				? HOME_WEEK_AGENDA_COLOR_DOT_DARK
				: HOME_WEEK_AGENDA_COLOR_DOT_LIGHT;
	}
}
