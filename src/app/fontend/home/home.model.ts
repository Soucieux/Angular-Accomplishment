/** Known fields on the statistics document accessed directly in the template. */
export interface HomeStats {
	[key: string]: unknown;
	totalNumber?: number;
	reminderTotal?: number;
	patchNotesTotal?: number;
	totalQuotes?: number;
	totalRecipes?: number;
	debtTotal?: number;
	recipeList?: { id: string; name: string; category: string }[];
}

/** Shape of a unified activity entry in the recentActivities statistics field. */
export interface RecentActivityItem {
	source?: string;
	type?: string;
	title?: string;
	text?: string;
	author?: string;
	name?: string;
	domain?: string;
	component?: string;
	element?: string;
	noteIndex?: number;
	timestamp?: string;
}
