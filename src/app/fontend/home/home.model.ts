/** Known fields on the statistics document accessed directly in the template. */
export interface HomeStats {
	[key: string]: unknown;
	totalNumber?: number;
	reminderTotal?: number;
	totalQuotes?: number;
	totalRecipes?: number;
}

/** Shape of a movie activity entry from the recentMovieActivities statistics field. */
export interface MovieActivityItem {
	type?: string;
	title?: string;
	timestamp?: string;
}

/** Shape of a patch activity entry from the recentPatchActivities statistics field. */
export interface PatchActivityItem {
	type?: string;
	component?: string;
	noteIndex?: number;
	timestamp?: string;
}

/** Shape of a reminder activity entry from the recentReminderActivities statistics field. */
export interface ReminderActivityItem {
	type?: string;
	table?: string;
	text?: string;
	timestamp?: string;
}

/** Shape of a resonance activity entry from the recentResonanceActivities statistics field. */
export interface ResonanceActivityItem {
	type?: string;
	author?: string;
	timestamp?: string;
}

