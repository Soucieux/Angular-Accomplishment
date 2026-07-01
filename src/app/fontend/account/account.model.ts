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
	color: string;
	minLength: number;
}

export interface IncomingConnectRequest {
	fromOpenid: string;
	fromName: string;
	ts: number;
}

export interface OutgoingConnectRequest {
	toOpenid: string;
	toCode: string;
	status: string;
	ts: number;
}

// label + unit are user-facing and vary by language — supplied from locale in the component (recipe pattern).
export const ACCOUNT_STATS: Omit<AccountStat, 'label' | 'unit'>[] = [
	{ icon: 'live_tv', gradient: 'linear-gradient(135deg,#11998e,#38ef7d)', value: 0, field: 'totalFilms' },
	{ icon: 'format_quote', gradient: 'linear-gradient(135deg,#fde68a,#b45309)', value: 0, field: 'totalQuotes' },
	{ icon: 'menu_book', gradient: 'linear-gradient(135deg,#fda4af,#9f1239)', value: 0, field: 'totalRecipes' },
	{ icon: 'alarm', gradient: 'linear-gradient(135deg,#1a6dff,#00d2ff)', value: 0, field: 'totalReminders' },
	{ icon: 'account_balance', gradient: 'linear-gradient(135deg,#0d9488,#134e4a)', value: 0, field: 'totalDebts' },
	{ icon: 'link', gradient: 'linear-gradient(135deg,#6366f1,#a855f7)', value: 0, field: 'totalLinks' }
];

// label is user-facing and varies by language — strength labels come from locale (localeStrengthLabels) by index.
export const ACCOUNT_STRENGTH_LEVELS: AccountStrengthLevel[] = [
	{ color: '#94a3b8', minLength: 0 },
	{ color: '#ef4444', minLength: 6 },
	{ color: '#f97316', minLength: 8 },
	{ color: '#eab308', minLength: 10 },
	{ color: '#22c55e', minLength: 12 }
];
