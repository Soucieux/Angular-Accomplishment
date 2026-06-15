/** Form data submitted when adding or editing a useful link. */
export interface NewLinkData {
	url: string;
	title: string;
	category: string;
	isPinned: boolean;
}

/** Shape of a useful-link document returned from the useful_links collection. */
export interface PortalLink {
	_id: string;
	url: string;
	title: string;
	category: string;
	isPinned?: boolean;
	visitCount?: number;
	lastVisited?: string;
	createdAt?: string;
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

