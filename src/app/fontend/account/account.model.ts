export interface AccountStat {
	icon: string;
	gradient: string;
	label: string;
	value: number;
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
		value: 42
	},
	{
		icon: 'format_quote',
		gradient: 'linear-gradient(135deg,#fde68a,#b45309)',
		label: 'Voices kept',
		value: 28
	},
	{ icon: 'menu_book', gradient: 'linear-gradient(135deg,#fda4af,#9f1239)', label: 'Recipes', value: 15 },
	{ icon: 'alarm', gradient: 'linear-gradient(135deg,#1a6dff,#00d2ff)', label: 'Reminders', value: 7 },
	{
		icon: 'account_balance',
		gradient: 'linear-gradient(135deg,#0d9488,#134e4a)',
		label: 'Debts tracked',
		value: 3
	},
	{
		icon: 'local_fire_department',
		gradient: 'linear-gradient(135deg,#d53369,#daae51)',
		label: 'Day streak',
		value: 128
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
