/** A patch note record as read from the database, with the document key attached. */
export interface PatchNote {
	key: string;
	_openid?: string;
	component: string;
	element: string;
	details: string;
	status: string | undefined;
	timestamp: string;
	isBug: boolean;
}

/** Snapshot pair held per row while an inline edit is active. */
export interface PatchNoteEditState {
	original: PatchNote;
	updated: PatchNote;
}

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

/** Milliseconds of entrance-animation delay added per table row / release-list row position. */
export const PATCH_ROW_ENTRANCE_STEP_MS = 30;

/** Upper bound on entrance-animation delay so a full page of rows doesn't wait too long to appear. */
export const PATCH_ROW_ENTRANCE_MAX_DELAY_MS = 300;
