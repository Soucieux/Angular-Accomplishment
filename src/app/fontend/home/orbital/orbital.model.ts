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
}

/** Shape of one activity row in the activity glass panel. */
export interface OrbitalActivityRow {
	icon: string;
	label: string;
	detail: string;
	time: string;
	color: string;
}

/** Shape of one quick-action pill button at the top of the orbital layout. */
export interface OrbitalQuickAction {
	icon: string;
	label: string;
	gradient: string;
	route: string;
	state?: Record<string, unknown>;
}

/** Short weekday names, Sunday-first, for the week-strip component. */
export const DAY_NAMES_SHORT: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Cycling colour palette for the genre bar chart on the Home dashboard. */
export const HOME_GENRE_COLORS: string[] = ['#4776e6', '#e91e8c', '#f7971e', '#78d000', '#8e54e9', '#22d3ee'];

/** Data array of quick-action pills shown at the top of the orbital dashboard layout. */
export const QUICK_ACTIONS: OrbitalQuickAction[] = [
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
