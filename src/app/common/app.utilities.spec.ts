import { TestBed } from '@angular/core/testing';
import { MovieItemVO } from '../fontend/entertainment/movieItem.vo';

import { Utilities } from './app.utilities';
import {
	RATE_LABEL_AVERAGE,
	RATE_LABEL_EXCELLENT,
	RATE_LABEL_GOOD,
	RATE_LABEL_POOR,
	RECIPE_BAND_CHINESE,
	RECIPE_BAND_DESSERT,
	RECIPE_BAND_QUICK,
	RECIPE_BAND_WESTERN,
	RECIPE_CATEGORY_CHINESE,
	RECIPE_CATEGORY_DESSERT,
	RECIPE_CATEGORY_QUICK,
	RECIPE_CATEGORY_WESTERN
} from './app.constant';

describe('Utilities', () => {

	// ── getRelativeTime ────────────────────────────────────────────────────

	describe('getRelativeTime', () => {
		/** Build a timestamp string offset by `deltaMs` ms relative to now. */
		function tsAt(deltaMs: number): string {
			const d = new Date(Date.now() - deltaMs);
			const year = d.getFullYear();
			const month = String(d.getMonth() + 1).padStart(2, '0');
			const day = String(d.getDate()).padStart(2, '0');
			const h = String(d.getHours()).padStart(2, '0');
			const m = String(d.getMinutes()).padStart(2, '0');
			const s = String(d.getSeconds()).padStart(2, '0');
			return `${year}.${month}.${day} ${h}:${m}:${s}`;
		}

		it('returns empty string for falsy input', () => {
			expect(Utilities.getRelativeTime('')).toBe('');
		});

		it('returns "just now" for timestamps less than 60 s ago', () => {
			expect(Utilities.getRelativeTime(tsAt(30_000))).toBe('just now');
		});

		it('returns "Xm ago" for timestamps between 1 and 59 minutes ago', () => {
			const result = Utilities.getRelativeTime(tsAt(5 * 60_000));
			expect(result).toMatch(/^\d+m ago$/);
		});

		it('returns "Xh ago" for timestamps between 1 and 23 hours ago', () => {
			const result = Utilities.getRelativeTime(tsAt(3 * 60 * 60_000));
			expect(result).toMatch(/^\d+h ago$/);
		});

		it('returns "Xd ago" for timestamps between 1 and 6 days ago', () => {
			const result = Utilities.getRelativeTime(tsAt(3 * 24 * 60 * 60_000));
			expect(result).toMatch(/^\d+d ago$/);
		});

		it('returns a YYYY.MM.DD string for timestamps 7+ days ago', () => {
			const result = Utilities.getRelativeTime(tsAt(10 * 24 * 60 * 60_000));
			expect(result).toMatch(/^\d{4}\.\d{2}\.\d{2}$/);
		});

		it('accepts ISO 8601 timestamps', () => {
			const iso = new Date(Date.now() - 30_000).toISOString();
			expect(Utilities.getRelativeTime(iso)).toBe('just now');
		});
	});

	// ── coerceDateToString ─────────────────────────────────────────────────

	describe('coerceDateToString', () => {
		it('returns empty string for falsy input', () => {
			expect(Utilities.coerceDateToString(null)).toBe('');
			expect(Utilities.coerceDateToString(undefined)).toBe('');
			expect(Utilities.coerceDateToString('')).toBe('');
		});

		it('passes through a string value unchanged', () => {
			expect(Utilities.coerceDateToString('2025-06-15')).toBe('2025-06-15');
		});

		it('converts a Date object to YYYY-MM-DD', () => {
			const result = Utilities.coerceDateToString(new Date(2024, 0, 5));
			expect(result).toBe('2024-01-05');
		});

		it('converts a numeric millisecond timestamp to YYYY-MM-DD', () => {
			const ms = new Date(2024, 5, 20).getTime();
			const result = Utilities.coerceDateToString(ms);
			expect(result).toBe('2024-06-20');
		});

		it('handles CloudBase {$date: ms} format', () => {
			const ms = new Date(2023, 11, 1).getTime();
			const result = Utilities.coerceDateToString({ $date: ms });
			expect(result).toBe('2023-12-01');
		});

		it('handles {time: ms} format', () => {
			const ms = new Date(2023, 2, 10).getTime();
			const result = Utilities.coerceDateToString({ time: ms });
			expect(result).toBe('2023-03-10');
		});

		it('handles Firestore-like {seconds: s} format', () => {
			const secs = new Date(2022, 6, 4).getTime() / 1000;
			const result = Utilities.coerceDateToString({ seconds: secs });
			expect(result).toBe('2022-07-04');
		});

		it('returns empty string for an unparseable object', () => {
			expect(Utilities.coerceDateToString({ foo: 'bar' })).toBe('');
		});
	});

	// ── capitalizeFirstLetterOnEachWord ────────────────────────────────────

	describe('capitalizeFirstLetterOnEachWord', () => {
		it('capitalizes the first letter of every word', () => {
			expect(Utilities.capitalizeFirstLetterOnEachWord('hello world')).toBe('Hello World');
		});

		it('returns empty string for null', () => {
			expect(Utilities.capitalizeFirstLetterOnEachWord(null)).toBe('');
		});

		it('returns empty string for undefined', () => {
			expect(Utilities.capitalizeFirstLetterOnEachWord(undefined)).toBe('');
		});

		it('leaves an already-capitalized string unchanged', () => {
			expect(Utilities.capitalizeFirstLetterOnEachWord('Angular')).toBe('Angular');
		});
	});

	// ── capitalizeFirstLetterWithOthersUnchanged ───────────────────────────

	describe('capitalizeFirstLetterWithOthersUnchanged', () => {
		it('capitalizes only the first character', () => {
			expect(Utilities.capitalizeFirstLetterWithOthersUnchanged('hello WORLD')).toBe('Hello WORLD');
		});

		it('returns empty string for null', () => {
			expect(Utilities.capitalizeFirstLetterWithOthersUnchanged(null)).toBe('');
		});

		it('leaves characters after the first unchanged', () => {
			expect(Utilities.capitalizeFirstLetterWithOthersUnchanged('hELLO')).toBe('HELLO');
		});
	});

	// ── checkIfChinese ─────────────────────────────────────────────────────

	describe('checkIfChinese', () => {
		it('returns true for CJK text', () => {
			expect(Utilities.checkIfChinese('你好')).toBeTrue();
		});

		it('returns false for Latin-only text', () => {
			expect(Utilities.checkIfChinese('Hello')).toBeFalse();
		});

		it('returns false for null', () => {
			expect(Utilities.checkIfChinese(null)).toBeFalse();
		});

		it('returns true for mixed Chinese and Latin', () => {
			expect(Utilities.checkIfChinese('Hello 世界')).toBeTrue();
		});
	});

	// ── getMovieRateLabel ──────────────────────────────────────────────────

	describe('getMovieRateLabel', () => {
		it('returns Excellent for rate >= 9', () => {
			expect(Utilities.getMovieRateLabel(9)).toBe(RATE_LABEL_EXCELLENT);
			expect(Utilities.getMovieRateLabel(9.5)).toBe(RATE_LABEL_EXCELLENT);
		});

		it('returns Good for rate >= 7.9 and < 9', () => {
			expect(Utilities.getMovieRateLabel(7.9)).toBe(RATE_LABEL_GOOD);
			expect(Utilities.getMovieRateLabel(8.5)).toBe(RATE_LABEL_GOOD);
		});

		it('returns Average for rate >= 7 and < 7.9', () => {
			expect(Utilities.getMovieRateLabel(7)).toBe(RATE_LABEL_AVERAGE);
			expect(Utilities.getMovieRateLabel(7.5)).toBe(RATE_LABEL_AVERAGE);
		});

		it('returns Poor for rate < 7', () => {
			expect(Utilities.getMovieRateLabel(6.9)).toBe(RATE_LABEL_POOR);
			expect(Utilities.getMovieRateLabel(0)).toBe(RATE_LABEL_POOR);
		});
	});

	// ── truncate ───────────────────────────────────────────────────────────

	describe('truncate', () => {
		it('leaves text shorter than max unchanged', () => {
			expect(Utilities.truncate('Hi', 10)).toBe('Hi');
		});

		it('truncates text longer than max and appends ellipsis', () => {
			expect(Utilities.truncate('Hello World', 5)).toBe('Hello…');
		});

		it('returns empty string for falsy input', () => {
			expect(Utilities.truncate('', 5)).toBe('');
		});

		it('returns text of exactly max length unchanged', () => {
			expect(Utilities.truncate('Hello', 5)).toBe('Hello');
		});
	});

	// ── toArray ────────────────────────────────────────────────────────────

	describe('toArray', () => {
		it('returns the same array when input is already an array', () => {
			const arr = [1, 2, 3];
			expect(Utilities.toArray(arr)).toEqual([1, 2, 3]);
		});

		it('converts an index-keyed object to an array of values', () => {
			const obj = { 0: 'a', 1: 'b' };
			expect(Utilities.toArray(obj)).toEqual(['a', 'b']);
		});

		it('returns empty array for null', () => {
			expect(Utilities.toArray(null)).toEqual([]);
		});

		it('returns empty array for undefined', () => {
			expect(Utilities.toArray(undefined)).toEqual([]);
		});
	});

	// ── sortByOrder ────────────────────────────────────────────────────────

	describe('sortByOrder', () => {
		it('sorts items by order ascending', () => {
			const items = [{ order: 3 }, { order: 1 }, { order: 2 }];
			const sorted = Utilities.sortByOrder(items);
			expect(sorted.map(i => i.order)).toEqual([1, 2, 3]);
		});

		it('does not mutate the original array', () => {
			const items = [{ order: 2 }, { order: 1 }];
			Utilities.sortByOrder(items);
			expect(items[0].order).toBe(2);
		});

		it('treats missing order as 0', () => {
			const items = [{ order: 1 }, {}, { order: 2 }];
			const sorted = Utilities.sortByOrder(items);
			expect(sorted[0].order).toBeUndefined();
		});
	});

	// ── normalizeUrl ───────────────────────────────────────────────────────

	describe('normalizeUrl', () => {
		it('leaves URLs that already start with https:// unchanged', () => {
			expect(Utilities.normalizeUrl('https://example.com')).toBe('https://example.com');
		});

		it('leaves URLs that already start with http:// unchanged', () => {
			expect(Utilities.normalizeUrl('http://example.com')).toBe('http://example.com');
		});

		it('prepends https:// to bare domain names', () => {
			expect(Utilities.normalizeUrl('example.com')).toBe('https://example.com');
		});

		it('returns falsy input as-is', () => {
			expect(Utilities.normalizeUrl('')).toBe('');
		});
	});

	// ── normalizeWebUrl ────────────────────────────────────────────────────

	describe('normalizeWebUrl', () => {
		it('prepends https:// to www. prefixed URLs', () => {
			expect(Utilities.normalizeWebUrl('www.example.com')).toBe('https://www.example.com');
		});

		it('prepends https://www. to bare domain names', () => {
			expect(Utilities.normalizeWebUrl('example.com')).toBe('https://www.example.com');
		});

		it('leaves https:// URLs unchanged (lowercased)', () => {
			expect(Utilities.normalizeWebUrl('https://Example.com')).toBe('https://example.com');
		});

		it('returns falsy input as-is', () => {
			expect(Utilities.normalizeWebUrl('')).toBe('');
		});
	});

	// ── getFavicon ─────────────────────────────────────────────────────────

	describe('getFavicon', () => {
		it('returns the favicon.ico URL for a valid URL', () => {
			expect(Utilities.getFavicon('https://github.com/user/repo')).toBe('https://github.com/favicon.ico');
		});

		it('returns empty string for an invalid URL', () => {
			expect(Utilities.getFavicon('not-a-url')).toBe('');
		});

		it('returns empty string for an empty string', () => {
			expect(Utilities.getFavicon('')).toBe('');
		});
	});

	// ── safeErrorMessage ───────────────────────────────────────────────────

	describe('safeErrorMessage', () => {
		it('returns the message property of an Error object', () => {
			expect(Utilities.safeErrorMessage(new Error('oops'))).toBe('oops');
		});

		it('returns the string itself when error is a string', () => {
			expect(Utilities.safeErrorMessage('bad input')).toBe('bad input');
		});

		it('returns "unknown error" for null', () => {
			expect(Utilities.safeErrorMessage(null)).toBe('unknown error');
		});

		it('returns "unknown error" for undefined', () => {
			expect(Utilities.safeErrorMessage(undefined)).toBe('unknown error');
		});
	});

	// ── isNumericString ────────────────────────────────────────────────────

	describe('isNumericString', () => {
		it('returns true for a numeric string', () => {
			expect(Utilities.isNumericString('42')).toBeTrue();
			expect(Utilities.isNumericString('3.14')).toBeTrue();
		});

		it('returns false for an empty string', () => {
			expect(Utilities.isNumericString('')).toBeFalse();
		});

		it('returns false for whitespace-only string', () => {
			expect(Utilities.isNumericString('   ')).toBeFalse();
		});

		it('returns false for a non-numeric string', () => {
			expect(Utilities.isNumericString('abc')).toBeFalse();
		});
	});

	// ── getDaysUntil ───────────────────────────────────────────────────────

	describe('getDaysUntil', () => {
		it('returns empty string for falsy input', () => {
			expect(Utilities.getDaysUntil('')).toBe('');
			expect(Utilities.getDaysUntil(null)).toBe('');
		});

		it('returns "Today" for today\'s date', () => {
			const today = new Date();
			const str = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
			expect(Utilities.getDaysUntil(str)).toBe('Today');
		});

		it('returns "Tomorrow" for tomorrow\'s date', () => {
			const d = new Date();
			d.setDate(d.getDate() + 1);
			const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			expect(Utilities.getDaysUntil(str)).toBe('Tomorrow');
		});

		it('returns "Xd overdue" for a past date', () => {
			const d = new Date();
			d.setDate(d.getDate() - 3);
			const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			expect(Utilities.getDaysUntil(str)).toBe('3d overdue');
		});

		it('returns "in Xd" for a future date', () => {
			const d = new Date();
			d.setDate(d.getDate() + 5);
			const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			expect(Utilities.getDaysUntil(str)).toBe('in 5d');
		});
	});

	// ── isOverdue ──────────────────────────────────────────────────────────

	describe('isOverdue', () => {
		it('returns false for falsy input', () => {
			expect(Utilities.isOverdue('')).toBeFalse();
			expect(Utilities.isOverdue(null)).toBeFalse();
		});

		it('returns true for a past date', () => {
			const d = new Date();
			d.setDate(d.getDate() - 1);
			const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			expect(Utilities.isOverdue(str)).toBeTrue();
		});

		it('returns false for a future date', () => {
			const d = new Date();
			d.setDate(d.getDate() + 1);
			const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			expect(Utilities.isOverdue(str)).toBeFalse();
		});

		it('returns false for today', () => {
			const today = new Date();
			const str = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
			expect(Utilities.isOverdue(str)).toBeFalse();
		});
	});

	// ── recipeBandClass ────────────────────────────────────────────────────

	describe('recipeBandClass', () => {
		it('returns the Chinese band class for Chinese category', () => {
			expect(Utilities.recipeBandClass(RECIPE_CATEGORY_CHINESE)).toBe(RECIPE_BAND_CHINESE);
		});

		it('returns the Western band class for Western category', () => {
			expect(Utilities.recipeBandClass(RECIPE_CATEGORY_WESTERN)).toBe(RECIPE_BAND_WESTERN);
		});

		it('returns the Quick band class for Quick category', () => {
			expect(Utilities.recipeBandClass(RECIPE_CATEGORY_QUICK)).toBe(RECIPE_BAND_QUICK);
		});

		it('returns the Dessert band class for Dessert category', () => {
			expect(Utilities.recipeBandClass(RECIPE_CATEGORY_DESSERT)).toBe(RECIPE_BAND_DESSERT);
		});

		it('returns empty string for an unrecognised category', () => {
			expect(Utilities.recipeBandClass('Unknown')).toBe('');
		});
	});

	// ── getCurrentFormattedTime ────────────────────────────────────────────

	describe('getCurrentFormattedTime', () => {
		it('returns a YYYY.MM.DD string when time is not included', () => {
			const result = Utilities.getCurrentFormattedTime(false);
			expect(result).toMatch(/^\d{4}\.\d{2}\.\d{2}$/);
		});

		it('returns a YYYY.MM.DD HH:mm:ss string when time is included', () => {
			const result = Utilities.getCurrentFormattedTime(true);
			expect(result).toMatch(/^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}$/);
		});
	});

	// ── formatDateForStorage ───────────────────────────────────────────────

	describe('formatDateForStorage', () => {
		it('formats a Date as YYYY-MM-DD', () => {
			const d = new Date(2024, 2, 5); // March 5, 2024
			expect(Utilities.formatDateForStorage(d)).toBe('2024-03-05');
		});

		it('pads month and day with leading zeros', () => {
			const d = new Date(2023, 0, 1); // January 1, 2023
			expect(Utilities.formatDateForStorage(d)).toBe('2023-01-01');
		});
	});

	// ── checkMovieItemVO ───────────────────────────────────────────────────

	describe('checkMovieItemVO', () => {
		it('does not throw when the movie item VO has a name and year', () => {
			const vo = new MovieItemVO();
			vo.setMovieName('Inception');
			vo.setMovieYear(2010);
			expect(() => Utilities.checkMovieItemVO(vo)).not.toThrow();
		});

		it('throws when the movie name is empty', () => {
			const vo = new MovieItemVO();
			vo.setMovieName('');
			vo.setMovieYear(2010);
			expect(() => Utilities.checkMovieItemVO(vo)).toThrow();
		});

		it('throws when the movie year is -1', () => {
			const vo = new MovieItemVO();
			vo.setMovieName('Inception');
			vo.setMovieYear(-1);
			expect(() => Utilities.checkMovieItemVO(vo)).toThrow();
		});
	});

});
