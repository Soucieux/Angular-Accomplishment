export type TodayTaskSource = 'local' | 'reminder' | 'tracked';

export interface TodayTask {
	id: string;
	source: TodayTaskSource;
	title: string;
	done: boolean;
	startMin: number | null;
	endMin: number | null;
	recur: 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly';
	ord?: number;
}

export interface TodayTracking {
	startMin: number;
	startedAt: number;
}

export interface TodayTimeRange {
	startMin: number;
	endMin: number;
}

export interface TodayTimedBlock {
	task: TodayTask;
	isDragging: boolean;
	isRemoving: boolean;
	accent: string;
	top: number;
	height: number;
	widthPercent: number;
	leftPercent: number;
	isShort: boolean;
	isTiny: boolean;
	isNarrow: boolean;
	draggable: boolean;
	isEditing: boolean;
	leadIcon: string;
	timeLabel: string;
	durationLabel: string;
	hasRecurrence: boolean;
	recurrenceLabel: string;
}

/** Pixels rendered per hour — must stay in sync with --hh in today.component.css. */
export const PIXELS_PER_HOUR = 112;

/** Pixel offset above the current time to use when auto-scrolling on load. */
export const SCROLL_AHEAD_PX = 150;

/** Minimum visual height in minutes (~28 min at 56px/hour) so short blocks still claim their own layout column. */
export const MINIMUM_VISUAL_MINUTES = Math.ceil(26 / PIXELS_PER_HOUR * 60);

/** Minimum pixel height for drag-create and pending range blocks. */
export const RANGE_BLOCK_MIN_HEIGHT_PX = 28;

/** Minimum pixel height for committed timed task blocks (accounts for 2px border/gap). */
export const BLOCK_MIN_HEIGHT_PX = 26;

/** Pixel height threshold below which a block uses the compact single-line layout. */
export const BLOCK_SHORT_THRESHOLD_PX = 50;

/** Minimum pixel height for tiny tracked blocks shorter than TRACKED_TINY_THRESHOLD_MIN. */
export const TRACKED_TINY_MIN_HEIGHT_PX = 6;

/** Duration in minutes below which a completed tracked block renders as a thin band. */
export const TRACKED_TINY_THRESHOLD_MIN = 15;

/** Milliseconds of entrance-animation delay added per pixel of a task block's vertical time position. */
export const TASK_ENTRANCE_DELAY_PER_PX_MS = 0.35;

/** Upper bound on entrance-animation delay so late-day blocks don't wait too long to appear. */
export const TASK_ENTRANCE_MAX_DELAY_MS = 260;

export const TASK_SOURCE_LOCAL: TodayTaskSource = 'local';
export const TASK_SOURCE_REMINDER: TodayTaskSource = 'reminder';
export const TASK_SOURCE_TRACKED: TodayTaskSource = 'tracked';

/** Recurrence value for a task that does not repeat. */
export const TASK_RECUR_NONE = 'none' as const;

/** Left-border accent colour per task source. */
export const TASK_ACCENT_MAP: Record<TodayTaskSource, string> = {
	reminder: '#1a6dff',
	tracked: '#0d9488',
	local: '#16a34a',
};

/** Accent colour override for completed local tasks. */
export const TASK_ACCENT_DONE = '#94a3b8';

/** Material Symbols icon per task source (incomplete state). */
export const TASK_LEAD_ICON_MAP: Record<TodayTaskSource, string> = {
	reminder: 'lock',
	tracked: 'timelapse',
	local: 'radio_button_unchecked',
};

/** Icon override for completed local tasks. */
export const TASK_LEAD_ICON_DONE = 'check_circle';

/** Icon for an incomplete untimed task chip. */
export const TASK_LEAD_ICON_UNCHECKED = 'radio_button_unchecked';
