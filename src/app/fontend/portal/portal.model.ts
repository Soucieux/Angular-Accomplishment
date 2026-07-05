/** Form data submitted when adding or editing a link category. */
export interface NewCategoryData {
	name: string;
}

/** Form data submitted when adding or editing a useful link. */
export interface NewLinkData {
	url: string;
	title: string;
	category: string;
	isPinned: boolean;
	isShared?: boolean;
}

/** Shape of a useful-link document returned from the useful_links collection. */
export interface PortalLink {
	_id: string;
	_openid?: string;
	url: string;
	title: string;
	category: string;
	isPinned?: boolean;
	isShared?: boolean;
	visitCount?: number;
	lastVisited?: string;
	createdAt?: string;
	cachedFavicon?: string;
}

/** Shape of a link-category document returned from the useful_links collection. */
export interface PortalCategory {
	_id: string;
	name: string;
	color?: string;
	order?: number;
}

/** Column field names for date-calculator rows, used to iterate per-row slot values. */
export const PORTAL_DATE_CALCULATOR_FIELDS: string[] = ['first', 'second', 'third', 'fourth'];

/** Milliseconds of entrance-animation delay added per link card position. */
export const PORTAL_LINK_ENTRANCE_STEP_MS = 30;

/** Upper bound on entrance-animation delay so a long link list doesn't wait too long to appear. */
export const PORTAL_LINK_ENTRANCE_MAX_DELAY_MS = 300;

/** Fallback color palette for link tile cards when a category has no custom color. */
export const PORTAL_LINK_CARD_PALETTE: string[] = [
	'#e63946', '#4361ee', '#1a7a50', '#e07b00',
	'#7b2d8b', '#1a7a8a', '#c9282d', '#2c5ea8',
	'#8b3a62', '#2d6a4f', '#c04000', '#1a5aaa',
];

