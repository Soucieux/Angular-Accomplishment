/** Shape of a single progress ring metric (year / month / week / day). */
export interface OrbitalProgressMetric {
	key: string;
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
