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
