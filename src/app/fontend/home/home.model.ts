/** Known fields on the statistics document accessed directly in the template. */
export interface HomeStats {
	[key: string]: unknown;
	totalFilms?: number;
	totalReminders?: number;
	totalPatchNotes?: number;
	totalQuotes?: number;
	totalRecipes?: number;
	totalDebts?: number;
	activityStreak?: number;
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
	isShared?: boolean;
	authorOpenid?: string;
}
