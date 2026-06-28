export interface ReleaseNoteSection {
	heading: string;
	items: string[];
}

export interface ReleaseNote {
	version: string;
	date: string;
	title: string;
	badge: string;
	summary: string;
	sections: ReleaseNoteSection[];
}

export const PATCH_HEATMAP_MONTH_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
