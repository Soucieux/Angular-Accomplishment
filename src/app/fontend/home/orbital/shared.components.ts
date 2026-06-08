import { Component, Input, OnChanges, ViewEncapsulation, inject } from '@angular/core';
import {
	HOME_CONCENTRIC_LEADER_BOUNDARY_MARGIN,
	HOME_CONCENTRIC_LEADER_LINE_OFFSET_X,
	HOME_CONCENTRIC_LEADER_LINE_OFFSET_Y,
	HOME_CONCENTRIC_LEADER_MIN_GAP,
	HOME_CONCENTRIC_LEADER_PCT_CAP,
	HOME_CONCENTRIC_LEADER_SIDE_LEFT,
	HOME_CONCENTRIC_LEADER_SIDE_RIGHT,
	HOME_CONCENTRIC_TRACK_DEFAULT,
	HOME_RING_GRADIENT_ID_PREFIX,
	HOME_RING_TRACK_DEFAULT,
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
	HOME_WEEK_AGENDA_DUE_HEADER_COLOR,
	HOME_WEEK_AGENDA_EMPTY_TEXT,
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

////////////////////// Below is Ring — single gradient SVG progress ring /////

@Component({
	selector: 'ring',
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
export class Ring {
	protected readonly gradientId = HOME_RING_GRADIENT_ID_PREFIX + ringIdCounter++;

	@Input() percentage = 0;
	@Input() size = 120;
	@Input() stroke = 10;
	@Input() gradientStart = '#d53369';
	@Input() gradientEnd = '#daae51';
	@Input() track = HOME_RING_TRACK_DEFAULT;

	/**
	 * Gets the radius of the progress circle adjusted for stroke width.
	 *
	 * @returns The effective circle radius in pixels.
	 */
	protected get radius(): number {
		return (this.size - this.stroke) / 2;
	}

	/**
	 * Gets the full circumference of the progress circle.
	 *
	 * @returns The circumference in pixels.
	 */
	protected get circumference(): number {
		return 2 * Math.PI * this.radius;
	}

	/**
	 * Gets the stroke-dashoffset that represents the current percentage.
	 *
	 * @returns The dashoffset value for the SVG stroke animation.
	 */
	protected get dashOffset(): number {
		return this.circumference * (1 - Math.min(100, Math.max(0, this.percentage)) / 100);
	}
}

////////////////////// Below is Concentric — stacked rings per metric ////////

interface PlacedMetric extends OrbitalProgressMetric {
	tipX: number;
	tipY: number;
	labelX: number;
	labelY: number;
	side: 'left' | 'right';
}

@Component({
	selector: 'concentric',
	standalone: true,
	imports: [Ring],
	template: `
		<div class="wrap" [style.width.px]="size" [style.height.px]="size">
			@for (metric of metrics; track metric.key; let i = $index) {
				<div
					class="ring"
					[style.top.px]="(size - computeRingSize(i)) / 2"
					[style.left.px]="(size - computeRingSize(i)) / 2">
					<ring
						[percentage]="metric.percentage"
						[size]="computeRingSize(i)"
						[stroke]="stroke"
						[gradientStart]="metric.gradientStart"
						[gradientEnd]="metric.gradientEnd"
						[track]="track"></ring>
				</div>
			}

			<svg class="concentric-svg" [attr.viewBox]="'0 0 ' + size + ' ' + size">
				@for (p of placedMetrics; track p.key) {
					<line
						[attr.x1]="p.tipX"
						[attr.y1]="p.tipY"
						[attr.x2]="p.side === HOME_CONCENTRIC_LEADER_SIDE_RIGHT ? p.labelX - 2 : p.labelX + 2"
						[attr.y2]="p.labelY"
						[attr.stroke]="p.gradientEnd"
						stroke-width="1.5"
						stroke-linecap="round"
						opacity="0.7" />
					<circle
						[attr.cx]="p.tipX"
						[attr.cy]="p.tipY"
						r="3.5"
						fill="#fff"
						[attr.stroke]="p.gradientEnd"
						stroke-width="2" />
				}
			</svg>

			@for (p of placedMetrics; track p.key) {
				<div
					class="concentric-pill"
					[style.left.%]="(p.labelX / size) * 100"
					[style.top.%]="(p.labelY / size) * 100"
					[style.transform]="
						p.side === HOME_CONCENTRIC_LEADER_SIDE_RIGHT
							? 'translate(0,-50%)'
							: 'translate(-100%,-50%)'
					">
					<i
						[style.background]="
							'linear-gradient(90deg,' + p.gradientStart + ',' + p.gradientEnd + ')'
						"></i>
					{{ p.label }}&nbsp;<em>{{ p.percentage }}%</em>
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
			.concentric-svg {
				position: absolute;
				inset: 0;
				overflow: visible;
				pointer-events: none;
			}
			.concentric-pill {
				position: absolute;
				display: inline-flex;
				align-items: center;
				gap: 4px;
				padding: 3px 8px;
				border-radius: 9999px;
				background: rgba(255, 255, 255, 0.97);
				box-shadow: 0 2px 9px rgba(0, 0, 0, 0.18);
				font-size: 13px;
				font-weight: 800;
				white-space: nowrap;
				color: #2a1019;
				letter-spacing: 0.3px;
				pointer-events: none;
			}
			.concentric-pill i {
				width: 6px;
				height: 6px;
				border-radius: 50%;
				flex-shrink: 0;
			}
			.concentric-pill em {
				font-style: normal;
				color: #334155;
			}
		`
	]
})
export class Concentric implements OnChanges {
	@Input() metrics: OrbitalProgressMetric[] = [];
	@Input() size = 200;
	@Input() stroke = 11;
	@Input() gap = 5;
	@Input() track = HOME_CONCENTRIC_TRACK_DEFAULT;

	protected readonly HOME_CONCENTRIC_LEADER_SIDE_RIGHT = HOME_CONCENTRIC_LEADER_SIDE_RIGHT;

	protected placedMetrics: PlacedMetric[] = [];

	/**
	 * Recomputes placed metrics whenever any input changes.
	 */
	ngOnChanges(): void {
		this.placedMetrics = this.computePlaced();
	}

	/**
	 * Gets the pixel diameter of the ring at the given stack index.
	 *
	 * @param ringIndex - The 0-based index of the ring (outermost = 0).
	 * @returns The diameter in pixels for that ring.
	 */
	protected computeRingSize(ringIndex: number): number {
		return this.size - ringIndex * (this.stroke + this.gap) * 2;
	}

	/**
	 * Gets the centre-to-stroke-centre radius for the ring at the given index.
	 *
	 * @param ringIndex - The 0-based index of the ring (outermost = 0).
	 * @returns The radius in pixels.
	 */
	private computeRingRadius(ringIndex: number): number {
		return this.computeRingSize(ringIndex) / 2 - this.stroke / 2;
	}

	/**
	 * Computes smart-leader placement for each metric: arc-tip anchor (tipX, tipY),
	 * pill anchor (labelX, labelY), and side. Applies a vertical anti-collision pass per
	 * side so no two pills overlap regardless of percentage values.
	 *
	 * @returns An array of placed metrics ready for the template.
	 */
	private computePlaced(): PlacedMetric[] {
		const center = this.size / 2;

		const items: PlacedMetric[] = this.metrics.map((metric, i) => {
			const radius = this.computeRingRadius(i);
			const angle =
				((-90 + Math.min(HOME_CONCENTRIC_LEADER_PCT_CAP, metric.percentage) * 3.6) * Math.PI) / 180;
			const directionX = Math.cos(angle);
			const directionY = Math.sin(angle);
			const tipX = center + radius * directionX;
			const tipY = center + radius * directionY;
			return {
				...metric,
				tipX,
				tipY,
				labelX: tipX + directionX * HOME_CONCENTRIC_LEADER_LINE_OFFSET_X,
				labelY: tipY + directionY * HOME_CONCENTRIC_LEADER_LINE_OFFSET_Y,
				side: directionX >= 0 ? HOME_CONCENTRIC_LEADER_SIDE_RIGHT : HOME_CONCENTRIC_LEADER_SIDE_LEFT
			};
		});

		([HOME_CONCENTRIC_LEADER_SIDE_LEFT, HOME_CONCENTRIC_LEADER_SIDE_RIGHT] as const).forEach((side) => {
			const sameSideItems = items
				.filter((placedItem) => placedItem.side === side)
				.sort((a, b) => a.labelY - b.labelY);
			for (let k = 1; k < sameSideItems.length; k++) {
				if (sameSideItems[k].labelY < sameSideItems[k - 1].labelY + HOME_CONCENTRIC_LEADER_MIN_GAP) {
					sameSideItems[k].labelY = sameSideItems[k - 1].labelY + HOME_CONCENTRIC_LEADER_MIN_GAP;
				}
			}
			for (let k = sameSideItems.length - 1; k > 0; k--) {
				if (sameSideItems[k].labelY > this.size - HOME_CONCENTRIC_LEADER_BOUNDARY_MARGIN) {
					sameSideItems[k].labelY = this.size - HOME_CONCENTRIC_LEADER_BOUNDARY_MARGIN;
					if (
						sameSideItems[k - 1].labelY >
						sameSideItems[k].labelY - HOME_CONCENTRIC_LEADER_MIN_GAP
					) {
						sameSideItems[k - 1].labelY =
							sameSideItems[k].labelY - HOME_CONCENTRIC_LEADER_MIN_GAP;
					}
				}
			}
		});

		return items;
	}
}

////////////////////// Below is WeekAgenda — day strip and agenda list ///////

@Component({
	selector: 'week-agenda',
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
			<span class="week-agenda-due-header" [style.color]="HOME_WEEK_AGENDA_DUE_HEADER_COLOR">Due</span>
			<span class="week-agenda-due-date" [style.color]="getSubtitleColor()">{{
				d.selectedDateLong()
			}}</span>
		</div>
		<div class="week-agenda-list">
			@if (d.agenda().length === 0) {
				<div class="week-agenda-empty" [style.color]="getSubtitleColor()">
					{{ HOME_WEEK_AGENDA_EMPTY_TEXT }}
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
			week-agenda {
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
				flex: 1;
				min-height: 0;
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
export class WeekAgenda {
	protected readonly d = inject(OrbitalStore);

	protected readonly HOME_WEEK_AGENDA_DUE_HEADER_COLOR = HOME_WEEK_AGENDA_DUE_HEADER_COLOR;
	protected readonly HOME_WEEK_AGENDA_EMPTY_TEXT = HOME_WEEK_AGENDA_EMPTY_TEXT;

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
