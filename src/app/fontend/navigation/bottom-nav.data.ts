import { NavItem } from './bottom-nav.model';

export const NAV_ITEMS: NavItem[] = [
	{ id: 'home', label: 'Home', icon: 'home_app_logo', grad: 'linear-gradient(135deg,#ff6b35,#ffd700)' },
	{ id: 'nexus', label: 'Nexus', icon: 'neurology', grad: 'linear-gradient(135deg,#e91e8c,#07db19)' },
	{ id: 'resonance', label: 'Resonance', icon: 'format_quote', grad: 'linear-gradient(135deg,#4776e6,#8e54e9)' },
	{ id: 'recipes', label: 'Recipes', icon: 'menu_book', grad: 'linear-gradient(135deg,#f7971e,#78d000)' },
	{ id: 'entertainment', label: 'Entertainment', icon: 'live_tv', grad: 'linear-gradient(135deg,#11998e,#38ef7d)' },
	{ id: 'reminder', label: 'Reminder', icon: 'alarm', grad: 'linear-gradient(135deg,#1a6dff,#00d2ff)' },
	{ id: 'debt', label: 'Debt Sonata', icon: 'account_balance', grad: 'linear-gradient(135deg,#059669,#34d399)' },
	{ id: 'patch', label: 'Patch Notes', icon: 'note_stack', grad: 'linear-gradient(135deg,#d53369,#f7971e)' },
	{ id: 'about', label: 'About', icon: 'badge', grad: 'linear-gradient(135deg,#8e54e9,#e91e8c)' },
];

/** The destinations promoted to the always-visible dock (in display order). */
export const PRIMARY_IDS: string[] = ['nexus', 'home', 'reminder', 'debt'];

/** Maps Angular router URL paths to bottom-nav item ids. */
export const ROUTE_TO_NAV_ID: Record<string, string> = {
	'': 'home',
	'/nexus': 'nexus',
	'/resonance': 'resonance',
	'/recipe': 'recipes',
	'/entertainment': 'entertainment',
	'/reminder': 'reminder',
	'/debt': 'debt',
	'/patch': 'patch',
	'/about': 'about',
};

/** Maps bottom-nav item ids to Angular router URL paths. */
export const NAV_ID_TO_ROUTE: Record<string, string> = {
	home: '',
	nexus: '/nexus',
	resonance: '/resonance',
	recipes: '/recipe',
	entertainment: '/entertainment',
	reminder: '/reminder',
	debt: '/debt',
	patch: '/patch',
	about: '/about',
};
