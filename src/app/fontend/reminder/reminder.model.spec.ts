import {
	REMINDER_CATEGORY_COLOR_MAP,
	REMINDER_CUSTOM_TAG_COLORS,
	REMINDER_END_TIME_OPTIONS,
	REMINDER_KNOWN_CATEGORIES,
	REMINDER_TIME_OPTIONS
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

describe('Reminder time options', () => {
	it('generates every valid minute for start times', () => {
		expect(REMINDER_TIME_OPTIONS.length).toBe(24 * 60);
		expect(new Set(REMINDER_TIME_OPTIONS.map((option) => option.value)).size).toBe(24 * 60);
		expect(REMINDER_TIME_OPTIONS[0]).toEqual({ label: '00:00', value: '00:00' });
		expect(REMINDER_TIME_OPTIONS).toContain({ label: '12:37', value: '12:37' });
		expect(REMINDER_TIME_OPTIONS.at(-1)).toEqual({ label: '23:59', value: '23:59' });
	});

	it('rolls the minute after :59 into the next hour at :00', () => {
		const finalMinuteOfHourIndex = REMINDER_TIME_OPTIONS.findIndex(
			(option) => option.value === '12:59'
		);

		expect(finalMinuteOfHourIndex).toBe(12 * 60 + 59);
		expect(REMINDER_TIME_OPTIONS[finalMinuteOfHourIndex + 1]).toEqual({
			label: '13:00',
			value: '13:00'
		});
	});

	it('limits end times to the same minute-resolution day range', () => {
		expect(REMINDER_END_TIME_OPTIONS.length).toBe(24 * 60);
		expect(REMINDER_END_TIME_OPTIONS.at(-1)).toEqual({ label: '23:59', value: '23:59' });
		expect(REMINDER_END_TIME_OPTIONS).not.toContain({ label: '24:00', value: '24:00' });
	});
});
