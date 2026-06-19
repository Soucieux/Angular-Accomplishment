export interface AccountStat {
	icon: string;
	gradient: string;
	label: string;
	value: number;
	unit: string;
	field: string;
}

export interface AccountMilestone {
	title: string;
	date: string;
	note: string;
}

export interface AccountStrengthLevel {
	label: string;
	color: string;
	minLength: number;
}

export const ACCOUNT_STATS: AccountStat[] = [
	{
		icon: 'live_tv',
		gradient: 'linear-gradient(135deg,#11998e,#38ef7d)',
		label: 'Films logged',
		value: 0,
		unit: 'film',
		field: 'totalFilms'
	},
	{
		icon: 'format_quote',
		gradient: 'linear-gradient(135deg,#fde68a,#b45309)',
		label: 'Quotes',
		value: 0,
		unit: 'quote',
		field: 'totalQuotes'
	},
	{
		icon: 'menu_book',
		gradient: 'linear-gradient(135deg,#fda4af,#9f1239)',
		label: 'Recipes',
		value: 0,
		unit: 'recipe',
		field: 'totalRecipes'
	},
	{
		icon: 'alarm',
		gradient: 'linear-gradient(135deg,#1a6dff,#00d2ff)',
		label: 'Reminders',
		value: 0,
		unit: 'reminder',
		field: 'reminderTotal'
	},
	{
		icon: 'account_balance',
		gradient: 'linear-gradient(135deg,#0d9488,#134e4a)',
		label: 'Debts tracked',
		value: 0,
		unit: 'debt',
		field: 'debtTotal'
	},
	{
		icon: 'link',
		gradient: 'linear-gradient(135deg,#6366f1,#a855f7)',
		label: 'Links saved',
		value: 0,
		unit: 'link',
		field: 'totalLinks'
	}
];

export const ACCOUNT_MILESTONES: AccountMilestone[] = [
	{ title: 'Account Created', date: 'Feb 2025', note: 'Welcome to the beginning.' },
	{ title: 'First Movie Logged', date: 'Mar 2025', note: 'The cinephile journey begins.' },
	{ title: 'First Recipe Added', date: 'Apr 2025', note: 'Cooking gets tracked.' },
	{ title: '100 Day Streak', date: 'May 2025', note: 'Consistent and committed.' },
	{ title: 'R2 Launch', date: 'Jun 2026', note: 'Phase 2 of the journey.' }
];

export const ACCOUNT_STRENGTH_LEVELS: AccountStrengthLevel[] = [
	{ label: 'Too short', color: '#94a3b8', minLength: 0 },
	{ label: 'Weak', color: '#ef4444', minLength: 6 },
	{ label: 'Fair', color: '#f97316', minLength: 8 },
	{ label: 'Good', color: '#eab308', minLength: 10 },
	{ label: 'Strong', color: '#22c55e', minLength: 12 }
];
