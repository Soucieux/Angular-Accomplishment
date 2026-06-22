import { NavItem } from './bottom-nav.model';

export const NAV_ITEMS: NavItem[] = [
	{ id: 'home', label: 'Home', icon: 'home_app_logo', grad: 'linear-gradient(135deg,#ff6b35,#ffd700)' },
	{ id: 'today', label: 'Today', icon: 'calendar_today', grad: 'linear-gradient(135deg,#16a34a,#065f46)' },
	{ id: 'portal', label: 'Portal', icon: 'language', grad: 'linear-gradient(135deg,#a3e635,#84cc16)' },
	{
		id: 'resonance',
		label: 'Resonance',
		icon: 'format_quote',
		grad: 'linear-gradient(135deg,#fde68a,#b45309)'
	},
	{ id: 'recipes', label: 'Recipes', icon: 'menu_book', grad: 'linear-gradient(135deg,#fda4af,#9f1239)' },
	{
		id: 'entertainment',
		label: 'Entertainment',
		icon: 'live_tv',
		grad: 'linear-gradient(135deg,#11998e,#38ef7d)'
	},
	{ id: 'reminder', label: 'Reminder', icon: 'alarm', grad: 'linear-gradient(135deg,#1a6dff,#00d2ff)' },
	{
		id: 'debt',
		label: 'Debt Sonata',
		icon: 'account_balance',
		grad: 'linear-gradient(135deg,#0d9488,#134e4a)'
	},
	{
		id: 'patch',
		label: 'Patch Notes',
		icon: 'note_stack',
		grad: 'linear-gradient(135deg,#a5b4fc,#3730a3)'
	},
	{ id: 'about', label: 'About', icon: 'badge', grad: 'linear-gradient(135deg,#f0abfc,#7e22ce)' }
];

/** The destinations promoted to the always-visible dock (in display order). */
export const PRIMARY_IDS: string[] = ['home', 'portal', 'reminder', 'debt'];

/** Maps Angular router URL paths to bottom-nav item ids. */
export const ROUTE_TO_NAV_ID: Record<string, string> = {
	'': 'home',
	'/today': 'today',
	'/portal': 'portal',
	'/resonance': 'resonance',
	'/recipe': 'recipes',
	'/entertainment': 'entertainment',
	'/reminder': 'reminder',
	'/debt': 'debt',
	'/patch': 'patch',
	'/about': 'about',
	'/account': 'account'
};

/** Maps bottom-nav item ids to Angular router URL paths. */
export const NAV_ID_TO_ROUTE: Record<string, string> = {
	home: '',
	today: '/today',
	portal: '/portal',
	resonance: '/resonance',
	recipes: '/recipe',
	entertainment: '/entertainment',
	reminder: '/reminder',
	debt: '/debt',
	patch: '/patch',
	about: '/about',
	account: '/account'
};
