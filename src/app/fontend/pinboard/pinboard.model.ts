export interface PinboardItem {
	key: string;
	_openid: string;
	text: string;
	date: string | null;
	link: string | null;
	tags: string[];
}

export type PinboardValueKey = 'text' | 'date' | 'link' | 'tags';

/** Raw shape of a third-table document as returned by CloudBase. */
export interface PinboardDbRecord {
	key: string;
	_openid: string;
	content: {
		text?: string;
		date?: unknown;
		link?: string | null;
		tags?: string[];
	};
}

/** Tag-edit session shared by both existing-card and new-item-card contexts. */
export interface TagEditSession {
	item: PinboardItem | null; // null when operating on the new-item card
	index: number; // -1 = adding new tag; 0+ = editing existing tag
	isNewItem: boolean;
	tagText: string; // text currently being typed in the tag input
}

/** Pending state for the new-item card form. */
export interface NewItem {
	text: string;
	date: Date | null;
	link: string;
	tags: string[];
}
