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
		label: 'Films Logged',
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
		field: 'totalReminders'
	},
	{
		icon: 'account_balance',
		gradient: 'linear-gradient(135deg,#0d9488,#134e4a)',
		label: 'Debts Tracked',
		value: 0,
		unit: 'debt',
		field: 'totalDebts'
	},
	{
		icon: 'link',
		gradient: 'linear-gradient(135deg,#6366f1,#a855f7)',
		label: 'Links Saved',
		value: 0,
		unit: 'link',
		field: 'totalLinks'
	}
];

export const MILESTONE_LABELS: Record<string, { title: string; note: string }> = {
	accountCreated: { title: 'Account Created', note: 'Welcome to Inner World.' },
	film1st:        { title: 'First Film Logged',    note: 'The cinephile journey begins.' },
	quote1st:       { title: 'First Quote Saved',    note: 'A mind full of words.' },
	recipe1st:      { title: 'First Recipe Created', note: 'Cooking gets tracked.' },
	reminder1st:    { title: 'First Reminder Set',   note: 'Never miss a thing.' },
	debt1st:        { title: 'First Debt Tracked',   note: 'Financial clarity starts here.' },
	link1st:        { title: 'First Link Saved',     note: 'The first breadcrumb.' },
	streak1st:      { title: 'First Day Active',     note: 'Every journey starts here.' }
};

export const MILESTONE_DOMAIN_DISPLAY: Record<string, string> = {
	film:     ' Films Logged',
	quote:    ' Quotes Saved',
	recipe:   ' Recipes Created',
	reminder: ' Reminders Set',
	debt:     ' Debts Tracked',
	link:     ' Links Saved',
	streak:   '-Day Streak'
};

export const ACCOUNT_STRENGTH_LEVELS: AccountStrengthLevel[] = [
	{ label: 'Too short', color: '#94a3b8', minLength: 0 },
	{ label: 'Weak', color: '#ef4444', minLength: 6 },
	{ label: 'Fair', color: '#f97316', minLength: 8 },
	{ label: 'Good', color: '#eab308', minLength: 10 },
	{ label: 'Strong', color: '#22c55e', minLength: 12 }
];
