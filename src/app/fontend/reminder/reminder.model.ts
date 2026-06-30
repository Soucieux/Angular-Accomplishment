export interface ReminderItem {
	key: string;
	_openid: string;
	text: string;
	date: string | null;
	link: string | null;
	tag: string;
	startTime: string | null;
	endTime: string | null;
	isShared?: boolean;
}

export type ReminderValueKey = 'text' | 'date' | 'link' | 'tag' | 'startTime' | 'endTime';

/** Raw shape of a reminder document as returned by CloudBase (flat — no content wrapper). */
export interface ReminderDbRecord {
	key: string;
	_openid: string;
	text: string;
	date?: unknown;
	link?: string | null;
	tag: string;
	startTime?: string | null;
	endTime?: string | null;
}

/** A single option entry for the start/end time p-select dropdowns. */
export interface TimeOption {
	label: string;
	value: string;
}

/** Tag-edit session shared by both existing-card and new-item-card contexts. */
export interface TagEditSession {
	item: ReminderItem | null; // null when operating on the new-item card
	index: number; // -1 = adding new tag; 0+ = editing existing tag
	isNewItem: boolean;
	tagText: string; // text currently being typed in the tag input
}

/** Pending state for the new-item card form. */
export interface NewItem {
	text: string;
	date: Date | null;
	link: string;
	tag: string;
	startTime: string | null;
	endTime: string | null;
}

/** Tag categories available for reminder items. */
export const REMINDER_KNOWN_CATEGORIES = ['Personal', 'Work', 'Utility', 'Other'] as const;

/** Maps each reminder tag category to its display colour. */
export const REMINDER_CATEGORY_COLOR_MAP: Record<string, string> = {
	Work: '#1a6dff',
	Personal: '#d53369',
	Utility: '#c2820a',
	Other: '#0d9488'
};

/**
 * Curated palette for custom tags. Colors are chosen to be distinct from each
 * other and from the four base-category colors above.
 */
export const REMINDER_CUSTOM_TAG_COLORS: string[] = [
	'#7c3aed',
	'#059669',
	'#dc2626',
	'#0891b2',
	'#9333ea',
	'#65a30d',
	'#b45309',
	'#0369a1',
	'#15803d',
	'#be185d'
];

/** All valid start-time options: 00:00 to 23:45 in 15-minute steps. */
export const REMINDER_TIME_OPTIONS: TimeOption[] = (() => {
	const pad = (n: number) => String(n).padStart(2, '0');
	const options: TimeOption[] = [];
	for (let h = 0; h <= 23; h++) {
		for (const m of [0, 15, 30, 45]) {
			const label = `${pad(h)}:${pad(m)}`;
			options.push({ label, value: label });
		}
	}
	return options;
})();

/** All valid end-time options: 00:00 to 24:00 in 15-minute steps (superset of start options). */
export const REMINDER_END_TIME_OPTIONS: TimeOption[] = [
	...REMINDER_TIME_OPTIONS,
	{ label: '24:00', value: '24:00' }
];
