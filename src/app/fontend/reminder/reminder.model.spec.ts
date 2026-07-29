import {
	REMINDER_CATEGORY_COLOR_MAP,
	REMINDER_CUSTOM_TAG_COLORS,
	REMINDER_KNOWN_CATEGORIES
} from './reminder.model';

describe('Reminder preset categories', () => {
	it('adds iCloud with a unique purple color', () => {
		const presetColors = REMINDER_KNOWN_CATEGORIES.map(
			(category) => REMINDER_CATEGORY_COLOR_MAP[category]
		);
		const iCloudColor = REMINDER_CATEGORY_COLOR_MAP['iCloud'];

		expect(REMINDER_KNOWN_CATEGORIES).toContain('iCloud');
		expect(iCloudColor).toBe('#7c3aed');
		expect(new Set(presetColors).size).toBe(presetColors.length);
		expect(REMINDER_CUSTOM_TAG_COLORS).not.toContain(iCloudColor);
	});
});
