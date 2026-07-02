/** Shape of a single progress ring metric (year / month / week / day). */
export interface OrbitalProgressMetric {
	key: string;
	label: string;
	percentage: number;
	gradientStart: string;
	gradientEnd: string;
}

/** Shape of one day cell in the week-strip component. */
export interface OrbitalWeekDay {
	label: string;
	dayIndex: number;
	dayNumber: number;
	isToday: boolean;
	isPast: boolean;
	fullDate: Date;
	count: number;
}

/** Shape of one agenda row shown when a week-strip day is selected. */
export interface OrbitalAgendaItem {
	icon: string;
	name: string;
	tag: string;
	color: string;
}

/** Shape of one reminder row in the reminders glass panel. */
export interface OrbitalReminderRow {
	id: string;
	name: string;
	dueLabel: string;
	overdue: boolean;
	daysUntilDue: number;
}

/** Shape of one recipe row in the recipes glass panel. */
export interface OrbitalRecipeRow {
	id: string;
	name: string;
	category: string;
}

/** Shape of one debt row in the debt-sonata glass panel. */
export interface OrbitalDebtRow {
	id: string;
	name: string;
	dueLabel: string;
	overdue: boolean;
	daysUntilDue: number;
	percentage: number;
	barColor: string;
}

/** Shape of one chip in the urgency strip shown on the orbital dashboard. */
export interface OrbitalUrgentItem {
	id: string;
	name: string;
	daysUntilDue: number;
	dueLabel: string;
	type: 'reminder' | 'debt';
}

/** Shape of one activity row in the activity glass panel. */
export interface OrbitalActivityRow {
	icon: string;
	label: string;
	detail: string;
	time: string;
	color: string;
	timestamp: string;
	isShared: boolean;
}

/** Shape of one quick-action pill button at the top of the orbital layout. */
export interface OrbitalQuickAction {
	icon: string;
	label: string;
	gradient: string;
	route: string;
	state?: Record<string, unknown>;
}

/** Cycling colour palette for the genre bar chart on the Home dashboard. */
export const HOME_GENRE_COLORS: string[] = ['#4776e6', '#e91e8c', '#f7971e', '#78d000', '#8e54e9', '#22d3ee'];

/**
 * Data array of quick-action pills shown at the top of the orbital dashboard layout.
 * label is user-facing and varies by language — supplied from locale in the component (recipe pattern).
 */
export const QUICK_ACTIONS: Omit<OrbitalQuickAction, 'label'>[] = [
	{ icon: 'movie', gradient: 'linear-gradient(135deg,#4ade80,#22c55e)', route: '/entertainment', state: { openAddDialog: true } },
	{ icon: 'format_quote', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', route: '/resonance' },
	{ icon: 'restaurant', gradient: 'linear-gradient(135deg,#d53369,#b82d5a)', route: '/recipe', state: { openAddView: true } },
	{ icon: 'account_balance', gradient: 'linear-gradient(135deg,#f97316,#e879f9)', route: '/debt', state: { openAddDialog: true } },
	{ icon: 'add_task', gradient: 'linear-gradient(135deg,#1a6dff,#00d2ff)', route: '/reminder' },
	{ icon: 'add_link', gradient: 'linear-gradient(135deg,#a3e635,#84cc16)', route: '/portal', state: { openMultiLinkDialog: true } }
];
