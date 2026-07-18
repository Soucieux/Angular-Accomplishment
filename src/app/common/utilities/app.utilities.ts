import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { format } from 'date-fns';
import { BehaviorSubject, Observable } from 'rxjs';
import { MovieItemVO } from '../../fontend/entertainment/movieItem.vo';
import {
	APP_BREAKPOINT_NARROW,
	AUTH_BACKEND_FIREBASE,
	PORTAL_BRAND_LOGO_PROXY_URL,
	LS_AUTH_HINT_KEY,
	LS_AUTH_BACKEND,
	RECIPE_BAND_CHINESE,
	RECIPE_BAND_DESSERT,
	RECIPE_BAND_QUICK,
	RECIPE_BAND_WESTERN,
	DEBT_CURRENCY_SYMBOL_CNY,
	DEBT_CURRENCY_SYMBOL_CAD
} from '../constants';
import {
	ACTIVE_LOCALE,
	RATE_LABEL_AVERAGE,
	RATE_LABEL_EXCELLENT,
	RATE_LABEL_GOOD,
	RATE_LABEL_POOR,
	RECIPE_CATEGORY_CHINESE,
	RECIPE_CATEGORY_DESSERT,
	RECIPE_CATEGORY_QUICK,
	RECIPE_CATEGORY_WESTERN
} from '../locale/locale-strings';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';

@Injectable({ providedIn: 'root' })
export class Utilities {
	private static boundScrollEls = new WeakSet<HTMLElement>();
	private static scrollTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
	private readonly isUserAliveSubject = new BehaviorSubject<boolean>(false);

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		@Inject(DOCUMENT) private document: Document
	) {
		if (isPlatformBrowser(this.platformId) && localStorage.getItem(LS_AUTH_HINT_KEY) === '1') {
			this.isUserAliveSubject.next(true);
		}
	}

	/* ─────────────────────────────────────────
	   Platform & viewport
	───────────────────────────────────────── */

	/**
	 * Checks whether the current device is a phone in portrait orientation, using
	 * viewport width, aspect ratio, and input precision to distinguish real phones
	 * from narrow desktop browser windows.
	 *
	 * @returns True when the viewport matches phone portrait dimensions and a coarse
	 * touch pointer, false on the server or on desktop.
	 */
	public isMobile(): boolean {
		return this.isBrowserCheck(
			() => globalThis.matchMedia('(max-width: 900px) and (pointer: coarse)').matches
		);
	}

	/**
	 * Checks whether the current viewport is at or below the narrow breakpoint
	 * (≤940px), regardless of device type. Use this for layout decisions that
	 * depend on viewport width — not on whether the device is a phone.
	 *
	 * @returns True when the viewport width is at or below APP_BREAKPOINT_NARROW,
	 * false on the server.
	 */
	public isNarrowViewport(): boolean {
		return this.isBrowserCheck(() => window.innerWidth <= APP_BREAKPOINT_NARROW);
	}

	/**
	 * Checks whether the current device supports hover (has a pointing device like a mouse).
	 *
	 * @returns True if the device supports hover, otherwise false.
	 */
	public checkIfHoverCapable(): boolean {
		return this.isBrowserCheck(
			() => this.document.defaultView?.matchMedia('(hover: hover)').matches ?? false
		);
	}

	/**
	 * Checks whether the app is running inside the native Capacitor iOS/Android shell.
	 *
	 * @returns True when running inside the native Capacitor runtime, false in any browser context.
	 */
	public isCapacitorApp(): boolean {
		return this.isBrowserCheck(() => Capacitor.isNativePlatform());
	}

	/**
	 * Checks whether the app is running as an installed standalone web app (added to
	 * the home screen), as opposed to a regular browser tab.
	 *
	 * @returns True when running in standalone display mode, false in a regular browser tab.
	 */
	public isStandalonePwa(): boolean {
		return this.isBrowserCheck(
			() => this.document.defaultView?.matchMedia('(display-mode: standalone)').matches ?? false
		);
	}

	/**
	 * Checks whether the app is running inside the native Tauri desktop shell.
	 *
	 * @returns True when running inside the native Tauri runtime, false in any browser context.
	 */
	public isTauriApp(): boolean {
		return this.isBrowserCheck(
			() => !!this.document.defaultView && '__TAURI__' in this.document.defaultView
		);
	}

	/**
	 * Checks whether the app is running as a plain web surface — a browser tab or an installed
	 * web app (PWA), on mobile or desktop — rather than a native Tauri desktop or Capacitor iOS
	 * shell. Used to gate web-only features such as Google sign-in, which the native shells do
	 * not yet offer.
	 *
	 * @returns True in a browser tab or installed web app, false inside the Tauri or Capacitor shell.
	 */
	public isWebPlatform(): boolean {
		return !this.isTauriApp() && !this.isCapacitorApp();
	}

	/**
	 * Opens a URL in the system browser. In a Tauri desktop build, delegates to
	 * the Tauri opener plugin so the link opens outside the webview; in a regular
	 * browser context, falls back to a temporary anchor click.
	 *
	 * @param url - The fully-qualified URL to open.
	 */
	public openInNewTab(url: string): void {
		/* `window.__TAURI__` is injected by the Tauri runtime only inside the desktop app.
		   When present, use the opener plugin — anchor clicks open inside the webview instead. */
		if (this.isTauriApp()) {
			import('@tauri-apps/plugin-opener').then(({ openUrl }) => openUrl(url)).catch(() => {});
			return;
		}
		const a = this.document.createElement('a');
		a.href = url;
		a.target = '_blank';
		a.rel = 'noopener noreferrer';
		this.document.body.appendChild(a);
		a.click();
		this.document.body.removeChild(a);
	}

	/**
	 * Gets whether the last sign-in used the Firebase backend (Google sign-in), read from
	 * the persisted flag. Firebase-signed-in users store and read their data in Firebase;
	 * everyone else (username/password) uses CloudBase, which is the default when unset.
	 *
	 * @returns True when the active data backend is Firebase, false when CloudBase (default).
	 */
	public static isFirebaseBackend(): boolean {
		return (
			typeof localStorage !== 'undefined' &&
			localStorage.getItem(LS_AUTH_BACKEND) === AUTH_BACKEND_FIREBASE
		);
	}

	/**
	 * Runs a browser-only viewport check, short-circuiting to false during SSR.
	 * Shared hub for {@link isMobile}, {@link isNarrowViewport}, {@link checkIfHoverCapable},
	 * {@link isCapacitorApp}, {@link isStandalonePwa}, and {@link isTauriApp}.
	 *
	 * @param check - The function to evaluate when running in a browser context.
	 * @returns The check's result, or false when rendering on the server.
	 */
	private isBrowserCheck(check: () => boolean): boolean {
		return isPlatformBrowser(this.platformId) ? check() : false;
	}

	/* ─────────────────────────────────────────
	   Date & time
	───────────────────────────────────────── */

	/**
	 * Gets the current date formatted as YYYY.MM.DD, optionally appending HH:mm:ss.
	 *
	 * @param isTimeIncluded - The flag controlling whether to append HH:mm:ss after the date.
	 * @returns A date string in YYYY.MM.DD or YYYY.MM.DD HH:mm:ss format.
	 */
	public static getCurrentFormattedTime(isTimeIncluded: boolean): string {
		const now = new Date();

		// Step 1: Build the optional time segment with a leading space separator
		/* Leading space separates date from time when time is included;
		   when isTimeIncluded=false, formattedTime stays empty → no separator needed. */
		let formattedTime = '';
		if (isTimeIncluded) {
			formattedTime = ` ${Utilities.padTwoDigits(now.getHours())}:${Utilities.padTwoDigits(
				now.getMinutes()
			)}:${Utilities.padTwoDigits(now.getSeconds())}`;
		}

		// Step 2: Concatenate the dot-separated date with the (possibly empty) time segment
		return Utilities.formatDotDate(now) + formattedTime;
	}

	/**
	 * Gets the date segment of an app-format timestamp string.
	 *
	 * @param timestamp - The timestamp string in `'YYYY.MM.DD HH:mm:ss'` or `'YYYY.MM.DD'` format.
	 * @returns The `YYYY.MM.DD` portion before the first space.
	 */
	public static getTimestampDate(timestamp: string): string {
		return timestamp.split(' ')[0];
	}

	/**
	 * Gets the `HH:mm` portion of an app-format timestamp string.
	 *
	 * @param timestamp - The timestamp string in `'YYYY.MM.DD HH:mm:ss'` format.
	 * @returns The hours and minutes, or an empty string if no time segment is present.
	 */
	public static getTimestampTime(timestamp: string): string {
		const time = timestamp.split(' ')[1];
		return time ? time.slice(0, 5) : '';
	}

	/**
	 * Gets the short month-day display string from an app-format timestamp string.
	 *
	 * @param timestamp - The timestamp string in `'YYYY.MM.DD HH:mm:ss'` format.
	 * @returns A formatted date string such as "Jun 13".
	 */
	public static getTimestampMonthDay(timestamp: string): string {
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		// Isolate the date segment ('YYYY.MM.DD') and split into components
		const datePart = timestamp.split(' ')[0];
		const [, monthStr, dayStr] = datePart.split('.');
		return `${months[Number(monthStr) - 1]} ${Number(dayStr)}`;
	}

	/**
	 * Formats an amount as a currency string with the locale-appropriate symbol,
	 * keeping the negative sign ahead of the symbol (e.g. -$1,250.50).
	 *
	 * @param amount - The numeric value to format.
	 * @param isChinese - Whether to use the ¥ symbol instead of $.
	 * @returns The formatted currency string.
	 */
	public static formatMoney(amount: number, isChinese: boolean): string {
		const symbol = Utilities.currencySymbol(isChinese);
		const formatted = Math.abs(amount).toLocaleString('en-US', {
			minimumFractionDigits: 0,
			maximumFractionDigits: 2
		});
		return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
	}

	/**
	 * Formats an amount as a compact currency string (e.g. $1k for 1000).
	 *
	 * @param amount - The numeric value to format.
	 * @param isChinese - Whether to use the ¥ symbol instead of $.
	 * @returns A compact currency label string.
	 */
	public static formatCompactMoney(amount: number, isChinese: boolean): string {
		const symbol = Utilities.currencySymbol(isChinese);
		if (amount >= 1000) return `${symbol}${Math.floor(amount / 1000)}k`;
		return `${symbol}${amount}`;
	}

	/**
	 * Rounds a monetary value to 2 decimal places, avoiding the floating-point drift
	 * that accumulates when currency arithmetic (subtraction, running totals) is
	 * chained across multiple operations.
	 *
	 * @param value - The numeric value to round.
	 * @returns The value rounded to 2 decimal places.
	 */
	public static roundToTwoDecimals(value: number): number {
		return Math.round(value * 100) / 100;
	}

	/**
	 * Gets a relative time string from a timestamp (e.g. "just now", "5m ago", "2d ago").
	 * Accepts both the app's dot-separated format ("YYYY.MM.DD HH:mm:ss") and ISO 8601
	 * strings (containing 'T', e.g. "2024-01-15T10:30:00.000Z") so that all pages can
	 * share a single implementation.
	 *
	 * @param timestamp - The timestamp string in either "YYYY.MM.DD HH:mm:ss" or ISO 8601 format.
	 * @returns A human-readable relative time string.
	 */
	public static getRelativeTime(timestamp: string): string {
		if (!timestamp) return '';

		// Step 1: Parse the timestamp into a Date — strategy differs by format
		let date: Date;
		if (timestamp.includes('T')) {
			// ISO 8601 format — let the Date constructor parse it directly.
			date = new Date(timestamp);
		} else {
			/* App format: "YYYY.MM.DD HH:mm:ss" — parse manually to avoid timezone
			   ambiguity that Date.parse would introduce when given a non-standard string. */
			const [datePart, timePart] = timestamp.split(' ');
			const [year, month, day] = datePart.split('.');
			const [hours, minutes, seconds] = (timePart || '00:00:00').split(':');
			date = new Date(+year, +month - 1, +day, +hours, +minutes, +seconds);
		}

		// Step 2: Compute time deltas at each granularity level
		const now = new Date();
		const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
		const diffMins = Math.floor(diffSecs / 60);
		const diffHours = Math.floor(diffMins / 60);
		const diffDays = Math.floor(diffHours / 24);

		// Step 3: Return the coarsest label that fits — fall back to absolute date beyond 7 days
		if (diffSecs < 60) return 'just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return Utilities.formatDotDate(date);
	}

	/**
	 * Safely coerce any date value to a "YYYY-MM-DD" display string.
	 * Handles plain strings (returned as-is), JavaScript Date objects, and
	 * database timestamp objects (CloudBase { $date: ms }, { seconds: s },
	 * { time: ms }) that may have been persisted before format guards were added.
	 *
	 * @param date - Any date representation (string, Date, timestamp object, or falsy).
	 * @returns A "YYYY-MM-DD" string, or '' if the value is falsy or unparseable.
	 */
	public static coerceDateToString(date: unknown): string {
		// Step 1: Fast-exit for falsy values and plain strings — no conversion needed
		if (!date) return '';
		if (typeof date === 'string') return date;
		try {
			// Step 2: Resolve the value to a milliseconds timestamp, handling each known type
			let ms: number | null = null;
			if (typeof date === 'number') {
				ms = date;
			} else if (
				date instanceof Date ||
				typeof (date as Record<string, unknown>)['getTime'] === 'function'
			) {
				ms = (date as Date).getTime();
			} else if (typeof date === 'object' && date !== null) {
				/* Step 2.1: Probe object fields in priority order — $date wins because it is the
				   canonical MongoDB/CloudBase wire format; time and seconds are legacy fallbacks. */
				const d = date as Record<string, unknown>;
				// CloudBase/MongoDB: { $date: ms } or { $date: { $numberLong: "ms" } }
				if (d['$date'] !== undefined) {
					const raw = d['$date'];
					ms =
						typeof raw === 'object' && raw !== null && '$numberLong' in raw
							? Number((raw as Record<string, unknown>)['$numberLong'])
							: Number(raw);
					// Tencent CloudBase SDK: { time: ms }
				} else if (d['time'] !== undefined) {
					ms = Number(d['time']);
					// Firestore-like: { seconds: s }
				} else if (d['seconds'] !== undefined) {
					ms = Number(d['seconds']) * 1000;
				}
			}

			// Step 3: Last-resort — attempt native Date parsing; NaN guard catches junk values
			if (ms === null) ms = Number(new Date(date as string));
			const d = new Date(ms);
			if (isNaN(d.getTime())) return '';

			// Step 4: Format the resolved Date into a "YYYY-MM-DD" storage string
			return Utilities.formatDateForStorage(d);
		} catch {
			return '';
		}
	}

	/**
	 * Format a Date object to the app's canonical date-storage format: "YYYY-MM-DD".
	 *
	 * @param date - The Date object to format.
	 * @returns A "YYYY-MM-DD" string.
	 */
	public static formatDateForStorage(date: Date): string {
		return format(date, 'yyyy-MM-dd');
	}

	/**
	 * Converts a time string in "HH:mm" format to the total number of minutes since midnight.
	 *
	 * @param hhmm - The time string in "HH:mm" format (e.g. "09:30", "14:00", "24:00").
	 * @returns The total minutes since midnight (e.g. 570 for "09:30").
	 */
	public static parseTimeToMinutes(hhmm: string): number {
		const [h, m] = hhmm.split(':').map(Number);
		return h * 60 + m;
	}

	/**
	 * Formats a date as a locale-aware month-year string.
	 * English: "Jun 2026". Chinese: "2026年6月".
	 *
	 * @param date - The date to format.
	 * @returns The formatted month-year string.
	 */
	public static formatMonthYear(date: Date): string {
		if (ACTIVE_LOCALE === 'zh') {
			return `${date.getFullYear()}年${date.getMonth() + 1}月`;
		}
		return format(date, 'MMM yyyy');
	}

	/**
	 * Converts a storage date string in "YYYY-MM-DD" format to a locale-aware
	 * month-year display string (e.g. "2026-06-19" → "Jun 2026" / "2026年6月").
	 *
	 * @param dateStr - The storage date string to convert.
	 * @returns The month-year display string.
	 */
	public static storageDateToDisplayMonth(dateStr: string): string {
		const [year, month] = dateStr.split('-').map(Number);
		return Utilities.formatMonthYear(new Date(year, month - 1, 1));
	}

	/**
	 * Parses a project timestamp string in either ISO-8601 or dot-separated format
	 * into a "YYYY-MM-DD" date string, delegating the final formatting to
	 * {@link formatDateForStorage}.
	 *
	 * @param timestamp - The timestamp to parse ("YYYY-MM-DDTHH:mm:ss" or "YYYY.MM.DD HH:mm:ss").
	 * @returns The date portion as a "YYYY-MM-DD" string.
	 */
	public static parseDateToISODate(timestamp: string): string {
		const iso = timestamp.includes('T') ? timestamp : timestamp.replace(/\./g, '-').replace(' ', 'T');
		return Utilities.formatDateForStorage(new Date(iso));
	}

	/**
	 * Computes a short human-readable countdown label from a date string.
	 * Delegates the day-diff calculation to {@link getDaysUntilNumber}.
	 *
	 * @param dateStr - A date in any form accepted by {@link coerceDateToString}.
	 * @returns A countdown label, or an empty string if no date is provided.
	 */
	public static getDaysUntil(dateStr: unknown): string {
		const diff = Utilities.getDaysUntilNumber(dateStr);
		if (diff === null) return '';
		if (diff < 0) return `${Math.abs(diff)}d overdue`;
		if (diff === 0) return 'Today';
		if (diff === 1) return 'Tomorrow';
		return `in ${diff}d`;
	}

	/**
	 * Computes the number of whole days from today until the given date.
	 * Negative values indicate a past date. Positive values indicate a future date.
	 *
	 * @param dateStr - A date in any form accepted by {@link coerceDateToString}.
	 * @returns The number of whole days until the date, or null when no date is provided.
	 */
	public static getDaysUntilNumber(dateStr: unknown): number | null {
		// Step 1: Coerce any date representation to a "YYYY-MM-DD" string; bail on falsy input
		if (!dateStr) return null;
		const str = Utilities.coerceDateToString(dateStr);
		if (!str) return null;

		// Step 2: Build a midnight-local Date for the target — constructor overload avoids UTC shift
		const [year, month, day] = str.split('-').map(Number);
		const target = new Date(year, month - 1, day);

		/* Step 3: Zero today's time component so the diff is in whole calendar days,
		   not hours-since-midnight (which would make "today" return a small positive fraction). */
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
	}

	/**
	 * Returns `true` if the given date is strictly before today (i.e. the item
	 * is past due). Delegates the day-diff calculation to {@link getDaysUntilNumber}.
	 *
	 * @param dateStr - A date in any form accepted by {@link coerceDateToString}.
	 * @returns `true` if the date is in the past, `false` otherwise.
	 */
	public static isOverdue(dateStr: unknown): boolean {
		const diff = Utilities.getDaysUntilNumber(dateStr);
		return diff !== null && diff < 0;
	}

	/**
	 * Formats a Date as the app's dot-separated date string: "YYYY.MM.DD".
	 * Shared hub for {@link getCurrentFormattedTime} and {@link getRelativeTime}.
	 *
	 * @param date - The Date to format.
	 * @returns A "YYYY.MM.DD" string.
	 */
	private static formatDotDate(date: Date): string {
		return `${date.getFullYear()}.${Utilities.padTwoDigits(date.getMonth() + 1)}.${Utilities.padTwoDigits(date.getDate())}`;
	}

	/**
	 * Gets the locale-appropriate currency symbol.
	 * Shared hub for {@link formatMoney} and {@link formatCompactMoney}.
	 *
	 * @param isChinese - Whether to use the ¥ symbol instead of $.
	 * @returns The currency symbol string.
	 */
	private static currencySymbol(isChinese: boolean): string {
		return isChinese ? DEBT_CURRENCY_SYMBOL_CNY : DEBT_CURRENCY_SYMBOL_CAD;
	}

	/* ─────────────────────────────────────────
	   String & text
	───────────────────────────────────────── */

	/**
	 * Capitalizes the first letter of each word in the given string.
	 *
	 * @param string - The string to capitalize.
	 * @returns The capitalized string, or an empty string if the input is falsy.
	 */
	public static capitalizeFirstLetterOnEachWord(string: string | null | undefined) {
		return string ? string.replace(/\b\w/g, (char) => char.toUpperCase()) : '';
	}

	/**
	 * Capitalizes only the first letter of the string, leaving all other characters unchanged.
	 *
	 * @param string - The string to capitalize.
	 * @returns The capitalized string, or an empty string if the input is falsy.
	 */
	public static capitalizeFirstLetterWithOthersUnchanged(string: string | null | undefined) {
		return string ? string.trim().charAt(0).toUpperCase() + string.slice(1) : '';
	}

	/**
	 * Checks whether the given text contains any Chinese characters within the
	 * CJK Unified Ideographs range (U+4E00 to U+9FA5). Used to switch fonts or
	 * layout when text is mixed-script.
	 *
	 * @param text - The text string to check.
	 * @returns True if the text contains at least one Chinese character.
	 */
	public static checkIfChinese(text: string | null | undefined): boolean {
		return !!text && /[一-龥]/.test(text);
	}

	/**
	 * Compute the visual display width of a string in Chinese-character units.
	 * CJK unified ideographs and East Asian wide characters count as 1 unit;
	 * all other characters (Latin, digits, punctuation) count as 0.5 units.
	 *
	 * @param text - The string to measure.
	 * @returns The total display width in Chinese-character-width units.
	 */
	public static chineseCharWidth(text: string): number {
		let width = 0;
		for (const char of text) {
			const cp = char.codePointAt(0) ?? 0;
			const isWide =
				(cp >= 0x3400 && cp <= 0x4dbf) ||
				(cp >= 0x4e00 && cp <= 0x9fff) ||
				(cp >= 0xf900 && cp <= 0xfaff) ||
				(cp >= 0x3040 && cp <= 0x33ff) ||
				(cp >= 0xac00 && cp <= 0xd7af);
			width += isWide ? 1 : 0.5;
		}
		return width;
	}

	/**
	 * Truncate a string to at most `max` characters, appending an ellipsis (`…`)
	 * when the text is cut. Returns an empty string for falsy input.
	 *
	 * @param text - The text to truncate.
	 * @param max - The maximum number of characters to keep before truncating.
	 * @returns The truncated string with an ellipsis appended if needed.
	 */
	public static truncate(text: string, max: number): string {
		if (!text) return '';
		return text.length > max ? text.substring(0, max) + '…' : text;
	}

	/**
	 * Fills a locale template string by replacing each `{token}` with its value from the params map.
	 * Tokens without a matching param are left in place.
	 *
	 * @param template - The template string containing `{token}` placeholders.
	 * @param params - The map of token names to their replacement values.
	 * @returns The template with all matched tokens replaced.
	 */
	public static formatTemplate(template: string, params: Record<string, string>): string {
		return template.replace(/\{(\w+)\}/g, (token, key) => params[key] ?? token);
	}

	/**
	 * Safely extract a human-readable error message from any thrown value.
	 * Guards against SDK objects whose `.message` getter itself throws.
	 *
	 * @param err - Any thrown value (Error, string, SDK error object, etc.).
	 * @returns A plain string describing the error, never throws.
	 */
	public static safeErrorMessage(err: unknown): string {
		try {
			if (err == null) return 'unknown error';
			if (typeof err === 'string') return err;
			const msg = (err as Record<string, unknown>)['message'];
			return typeof msg === 'string' ? msg : JSON.stringify(err);
		} catch {
			return 'unknown error';
		}
	}

	/**
	 * Returns true when the given string represents a finite number.
	 * Useful for hiding numeric-only unit fields that carry no semantic meaning
	 * (e.g. a user who typed "1" as a unit placeholder).
	 *
	 * @param value - The string to test.
	 * @returns true if the trimmed string is a finite numeric value.
	 */
	public static isNumericString(value: string): boolean {
		return value.trim() !== '' && isFinite(Number(value));
	}

	/**
	 * Builds a random code of the given length by sampling characters from the supplied alphabet.
	 * Intended for shareable, non-secret identifiers (e.g. account connect codes).
	 *
	 * @param length - The number of characters in the generated code.
	 * @param alphabet - The set of characters to sample from.
	 * @returns A random string of the requested length.
	 */
	public static randomCode(length: number, alphabet: string): string {
		let code = '';
		for (let i = 0; i < length; i++) {
			code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
		}
		return code;
	}

	/* ─────────────────────────────────────────
	   URL & web
	───────────────────────────────────────── */

	/**
	 * Ensures a URL has an explicit protocol prefix so the browser treats it as
	 * an absolute URL. When withWww is true, also lowercases the value and
	 * prepends `https://www.` to bare domains (used for contact / reminder links).
	 *
	 * @param url - The raw URL string (may or may not have a protocol).
	 * @param withWww - The flag to prepend www and lowercase the value.
	 * @returns A URL string guaranteed to begin with a valid protocol.
	 */
	public static normalizeUrl(url: string, withWww = false): string {
		if (!url) return url;
		const value = withWww ? url.toLowerCase() : url;
		if (value.startsWith('http://') || value.startsWith('https://')) return value;
		if (value.startsWith('www.')) return 'https://' + value;
		return withWww ? 'https://www.' + value : 'https://' + value;
	}

	/**
	 * Gets the best-logo proxy URL for a link — Brandfetch's real brand logo when available, else Google's
	 * favicon for non-brand sites. Used as a Portal card `<img>` source; the image errors when neither
	 * source has an icon, so the caller falls back to the link's letter initial.
	 *
	 * @param url - The full URL of the website.
	 * @returns The proxy URL string, or '' if the URL is unparseable.
	 */
	public static getBrandLogoUrl(url: string): string {
		const hostname = Utilities.parseHostname(url);
		return hostname ? `${PORTAL_BRAND_LOGO_PROXY_URL}?domain=${hostname}` : '';
	}

	/**
	 * Extract the hostname (domain) from a URL string.
	 *
	 * @param url - The full URL of the website.
	 * @returns The hostname string (e.g. "openai.com"), or the original value if unparseable.
	 */
	public static getDomain(url: string): string {
		return Utilities.parseHostname(url) ?? url;
	}

	/**
	 * Attempts to parse the hostname out of a URL string.
	 * Shared hub for {@link getDomain} and {@link getBrandLogoUrl}.
	 *
	 * @param url - The full URL of the website.
	 * @returns The hostname string, or null if the URL is unparseable.
	 */
	private static parseHostname(url: string): string | null {
		try {
			return new URL(url).hostname;
		} catch {
			return null;
		}
	}

	/* ─────────────────────────────────────────
	   User & auth
	───────────────────────────────────────── */

	/**
	 * Gets the display name for an authenticated user, choosing the correct field
	 * based on the active auth backend (Firebase/Google users expose `displayName`,
	 * CloudBase users expose `user_metadata.username`).
	 *
	 * @param user - The authenticated user object from the auth observable.
	 * @returns The user's display name, or an empty string if unavailable.
	 */
	public static getUserDisplayName(user: any): string {
		if (!user) return '';
		if (Utilities.isFirebaseBackend()) {
			return user.displayName ?? '';
		}
		return user.user_metadata?.username ?? '';
	}

	/**
	 * Gets the first two leading graphemes of a name, uppercased — for avatar and graph-node initials.
	 * Splits by code point so surrogate-pair characters (emoji, extended CJK) stay whole, and clamps
	 * any uppercase expansion (e.g. 'ß' → 'SS') so at most two graphemes are returned.
	 *
	 * @param name - The display name to derive initials from.
	 * @returns The uppercased leading one or two graphemes, or an empty string when the name is empty.
	 */
	public static getInitials(name: string): string {
		const leading = Array.from(name.trim()).slice(0, 2).join('').toUpperCase();
		return Array.from(leading).slice(0, 2).join('');
	}

	/**
	 * Gets the one-or-two-letter initials from the user's display name for avatar circles.
	 * Two-or-more-word names use one letter per word; single-word names fall back to
	 * {@link getInitials} for its grapheme-safe two-character slice.
	 *
	 * @param user - The authenticated user object from the auth observable.
	 * @returns The uppercased initials string, or '?' when no display name is available.
	 */
	public static getUserInitials(user: any): string {
		const displayName = Utilities.getUserDisplayName(user);
		if (!displayName) return '?';
		const parts = displayName.trim().split(' ');
		return parts.length >= 2
			? (parts[0][0] + parts[1][0]).toUpperCase()
			: Utilities.getInitials(displayName);
	}

	/**
	 * Gets the avatar image URL from the user object, checking both CloudBase fields.
	 *
	 * @param user - The authenticated user object from the auth observable.
	 * @returns The avatar URL string, or an empty string if no photo is set.
	 */
	public static getUserAvatarUrl(user: any): string {
		return user?.user_metadata?.avatarUrl ?? user?.user_metadata?.picture ?? '';
	}

	/**
	 * Checks whether the current user has permission to modify an entry
	 * owned by the given openid. Admin users bypass the check automatically.
	 * Exceptions from the auth layer are treated as permission denied.
	 *
	 * @param openid - The owner ID stored on the database entry.
	 * @returns True if the current user is permitted, false otherwise.
	 */
	public static checkPermission(openid: string): boolean {
		try {
			if (CloudbaseService.userHasAllRights()) return true;
			return openid === CloudbaseService.getUserId();
		} catch {
			return false;
		}
	}

	/**
	 * Checks whether the current user is alive (has a valid session).
	 *
	 * @returns Whether the user is alive.
	 */
	public getIsUserAlive(): boolean {
		return this.isUserAliveSubject.getValue();
	}

	/**
	 * Gets an observable that emits whenever the user alive state changes.
	 * Subscribe to this in components that need to react immediately to
	 * login/logout events without relying on zone-based change detection.
	 *
	 * @returns An Observable that emits the current and future user alive states.
	 */
	public getIsUserAlive$(): Observable<boolean> {
		return this.isUserAliveSubject.asObservable();
	}

	/**
	 * Set the user alive state and notify all subscribers reactively.
	 * Also persists the state as a presence flag in localStorage so the
	 * UI can restore the correct state immediately on the next page refresh
	 * without waiting for Firebase / CloudBase to re-validate the session.
	 *
	 * @param isUserAlive - Whether the user is alive.
	 */
	public setIsUserAlive(isUserAlive: boolean): void {
		/* Step 1: Persist the hint to localStorage so the next page load can restore UI state
		   immediately, before the auth SDK fires its first async callback.
		   The guard is required because localStorage is unavailable during SSR. */
		if (isPlatformBrowser(this.platformId)) {
			if (isUserAlive) {
				localStorage.setItem(LS_AUTH_HINT_KEY, '1');
			} else {
				localStorage.removeItem(LS_AUTH_HINT_KEY);
			}
		}

		// Step 2: Notify all reactive subscribers — must happen after the localStorage write
		this.isUserAliveSubject.next(isUserAlive);
	}

	/* ─────────────────────────────────────────
	   Arrays & data
	───────────────────────────────────────── */

	/**
	 * Flatten a raw CloudBase statistics field (returned as either a true array
	 * or an object keyed by insertion index) into a plain array.
	 * Returns an empty array when the field is absent or falsy.
	 *
	 * @param raw - The raw field value from a CloudBase snapshot.
	 * @returns A plain `any[]` array.
	 */
	public static toArray(raw: unknown): unknown[] {
		if (!raw) return [];
		return Array.isArray(raw) ? raw : Object.values(raw as Record<string, unknown>);
	}

	/**
	 * Prepends an entry to a raw CloudBase array field (newest-first) and trims the result to `cap`.
	 * Normalizes the raw value via {@link toArray} so both array and index-keyed object forms work.
	 *
	 * @param raw - The raw field value from a CloudBase snapshot (array or index-keyed object).
	 * @param entry - The entry to place at the front.
	 * @param cap - The maximum number of entries to keep.
	 * @returns A new array with the entry prepended and the length capped.
	 */
	public static prependCapped<T>(raw: unknown, entry: T, cap: number): T[] {
		return [entry, ...(Utilities.toArray(raw) as T[])].slice(0, cap);
	}

	/**
	 * Sort an array of objects by their optional `order` field ascending.
	 * Items without an `order` field are treated as order 0.
	 * The original array is not mutated.
	 *
	 * @param items - Array of objects that may carry a numeric `order` property.
	 * @returns A new array sorted ascending by `order`.
	 */
	public static sortByOrder<T extends { order?: number }>(items: T[]): T[] {
		return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
	}

	/**
	 * Gets a de-duplicated array, collapsing items that share a key so each key
	 * appears once. The last occurrence of a key wins; the input is not mutated.
	 *
	 * @param items - The items to de-duplicate.
	 * @param keyOf - The function deriving each item's unique key.
	 * @returns A new array with duplicate keys collapsed.
	 */
	public static uniqueByKey<T>(items: T[], keyOf: (item: T) => string): T[] {
		const byKey = new Map<string, T>();
		for (const item of items) {
			byKey.set(keyOf(item), item);
		}
		return [...byKey.values()];
	}

	/**
	 * Gets a random element from the given array.
	 *
	 * @param pool - The array to pick from.
	 * @returns A randomly chosen element from the pool.
	 */
	public static pickRandomElement<T>(pool: T[]): T {
		return pool[Math.floor(Math.random() * pool.length)];
	}

	/**
	 * Pads a number to two digits with a leading zero.
	 *
	 * @param n - The number to pad.
	 * @returns A two-character string representation of the number.
	 */
	public static padTwoDigits(n: number): string {
		return String(n).padStart(2, '0');
	}

	/**
	 * Clamps a number to the inclusive range [min, max].
	 *
	 * @param value - The number to constrain.
	 * @param min - The lower bound.
	 * @param max - The upper bound.
	 * @returns The value constrained to the range.
	 */
	public static clamp(value: number, min: number, max: number): number {
		return Math.max(min, Math.min(max, value));
	}

	/**
	 * Counts the columns a CSS grid element currently renders by reading its resolved
	 * grid-template-columns track list. Reflects every applied rule — auto-fill sizing and
	 * media-query overrides alike — so it always matches what the user actually sees. Returns 0
	 * when the element is not a grid or has no resolved tracks.
	 *
	 * @param grid - The grid element to measure.
	 * @returns The number of rendered column tracks, or 0 when unmeasurable.
	 */
	public static countGridColumns(grid: HTMLElement): number {
		// The resolved value lists one length per track; 'none' means the element is not a grid, in
		// which case 0 lets the caller keep its fallback count rather than render zero cards.
		const template = getComputedStyle(grid).gridTemplateColumns;
		if (!template || template === 'none') return 0;
		return template.split(' ').length;
	}

	/**
	 * Gets the milestone key for a given domain and count, or null if the count is
	 * not a milestone threshold. Thresholds are count === 1 ("1st") and every
	 * multiple of 5 ("5th", "10th", etc.).
	 *
	 * @param domain - The milestone domain prefix (e.g. "film", "streak").
	 * @param count - The new count value to evaluate.
	 * @returns The milestone key (e.g. "film1st", "film5th") or null.
	 */
	public static getMilestoneKey(domain: string, count: number): string | null {
		if (count === 1) return `${domain}1st`;
		if (count % 5 === 0) return `${domain}${count}th`;
		return null;
	}

	/**
	 * Builds a boolean array representing a segmented progress bar.
	 * Each element is true if that block should be filled, based on
	 * the proportion of count to max scaled to totalBlocks segments.
	 *
	 * @param count - The value to represent (e.g. movies in a genre).
	 * @param max - The maximum value used as the scale denominator.
	 * @param totalBlocks - Total number of blocks in the bar.
	 * @returns A boolean array of length totalBlocks.
	 */
	public static filledBlocks(count: number, max: number, totalBlocks: number): boolean[] {
		const filled = max > 0 ? Math.round((count / max) * totalBlocks) : 0;
		return Array.from({ length: totalBlocks }, (_, i) => i < filled);
	}

	/* ─────────────────────────────────────────
	   DOM
	───────────────────────────────────────── */

	/**
	 * Copies the given text to the system clipboard.
	 *
	 * @param text - The text to copy.
	 * @returns A promise that resolves when the copy completes.
	 */
	public static copyToClipboard(text: string): Promise<void> {
		return navigator.clipboard.writeText(text);
	}

	/**
	 * Attach a scroll-activity listener to a scrollable element that adds the
	 * `is-scrolling` CSS class while the user is scrolling and removes it
	 * 700 ms after scrolling stops, keeping the scrollbar hidden at rest.
	 * No-ops if the element is already bound or is undefined.
	 *
	 * @param el - The scrollable DOM element to observe, or undefined to skip.
	 */
	public static attachScrollAutoHide(el?: HTMLElement): void {
		/* Step 1: Guard — skip undefined elements and elements already wired up.
		   WeakSet membership check is O(1) and avoids stacking duplicate listeners
		   when a component's ngAfterViewInit re-runs (e.g. after a tab switch). */
		if (!el || Utilities.boundScrollEls.has(el)) return;
		Utilities.boundScrollEls.add(el);

		/* Step 2: Define the reveal closure that adds the CSS class and debounces removal.
		   WeakMap is used so the timer ref is GC-eligible when the element is destroyed. */
		const reveal = () => {
			el.classList.add('is-scrolling');
			const prev = Utilities.scrollTimers.get(el);
			if (prev) clearTimeout(prev);
			Utilities.scrollTimers.set(
				el,
				setTimeout(() => el.classList.remove('is-scrolling'), 700)
			);
		};

		// Step 3: Attach listeners — scroll fires during drag; mouseenter handles hover-over-rest
		el.addEventListener('scroll', reveal, { passive: true });
		el.addEventListener('mouseenter', () => {
			// Only reveal on hover if the element actually has overflow to scroll
			if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) reveal();
		});
	}

	/**
	 * Injects a <style> tag into <head> once per DOM id, for CSS that must style content
	 * Angular's ViewEncapsulation.Emulated cannot scope — elements built via raw DOM APIs
	 * instead of Angular's template renderer never receive the scoping attribute a component
	 * stylesheet's rules require. No-ops if a tag with that id already exists.
	 *
	 * @param id - The DOM id to tag the injected <style> element with, used as the idempotency guard.
	 * @param css - The raw CSS text to inject.
	 */
	public static injectGlobalStyleOnce(id: string, css: string): void {
		if (document.getElementById(id)) return;
		const style = document.createElement('style');
		style.id = id;
		style.textContent = css;
		document.head.appendChild(style);
	}

	/* ─────────────────────────────────────────
	   Domain-specific
	───────────────────────────────────────── */

	/**
	 * Returns a human-readable label for a movie rate based on the app's four rate tiers.
	 * Mirrors the ngClass thresholds used in the entertainment template.
	 *
	 * @param rate - The numeric movie rate.
	 * @returns "Excellent" (≥9), "Good" (≥7.9), "Average" (≥7), or "Poor" (<7).
	 */
	public static getMovieRateLabel(rate: number): string {
		if (rate >= 9) return RATE_LABEL_EXCELLENT;
		if (rate >= 7.9) return RATE_LABEL_GOOD;
		if (rate >= 7) return RATE_LABEL_AVERAGE;
		return RATE_LABEL_POOR;
	}

	/**
	 * Validates that the given movie item VO has a name and a year set.
	 *
	 * @param movieItemVO - The movie item to validate.
	 * @throws Error if the movie name is empty or the year is -1.
	 */
	public static checkMovieItemVO(movieItemVO: MovieItemVO) {
		if (movieItemVO.getMovieName() === '' || movieItemVO.getMovieYear() === -1) {
			throw new Error('Movie item VO is invalid');
		}
	}

	/**
	 * Return the CSS band class name for a given recipe category.
	 * When adding a new category, add a corresponding case here and follow the
	 * checklist in the RECIPE_BAND_* block inside app.constant.ts.
	 *
	 * @param category - The recipe category string (e.g. 'Chinese', 'Western').
	 * @returns The CSS band class constant for that category, or an empty string
	 *   if the category is not recognised.
	 */
	public static recipeBandClass(category: string): string {
		switch (category) {
			case RECIPE_CATEGORY_CHINESE:
				return RECIPE_BAND_CHINESE;
			case RECIPE_CATEGORY_WESTERN:
				return RECIPE_BAND_WESTERN;
			case RECIPE_CATEGORY_QUICK:
				return RECIPE_BAND_QUICK;
			case RECIPE_CATEGORY_DESSERT:
				return RECIPE_BAND_DESSERT;
			default:
				return '';
		}
	}

	/* ─────────────────────────────────────────
	   Template wrappers
	───────────────────────────────────────── */

	/**
	 * Instance wrapper around {@link Utilities.getBrandLogoUrl} for use in Angular templates.
	 *
	 * @param url - The full URL of the website.
	 * @returns The best-logo proxy URL string, or '' if the URL is unparseable.
	 */
	public getBrandLogoUrl(url: string): string {
		return Utilities.getBrandLogoUrl(url);
	}

	/**
	 * Instance wrapper around {@link Utilities.getDomain} for use in Angular templates.
	 *
	 * @param url - The full URL of the website.
	 * @returns The hostname string, or the original value if unparseable.
	 */
	public getDomain(url: string): string {
		return Utilities.getDomain(url);
	}

	/**
	 * Instance wrapper around {@link Utilities.getDaysUntil} for use in Angular templates.
	 *
	 * @param dateStr - A date in any form accepted by {@link coerceDateToString}.
	 * @returns A countdown label, or an empty string if no date is provided.
	 */
	public getDaysUntil(dateStr: unknown): string {
		return Utilities.getDaysUntil(dateStr);
	}

	/**
	 * Instance wrapper around {@link Utilities.checkIfChinese} for use in Angular templates.
	 *
	 * @param text - The text string to check.
	 * @returns True if the text contains at least one Chinese character.
	 */
	public checkIfChinese(text: string | null | undefined): boolean {
		return Utilities.checkIfChinese(text);
	}

	/**
	 * Instance wrapper around {@link Utilities.capitalizeFirstLetterOnEachWord} for use in Angular templates.
	 *
	 * @param string - The string to capitalize.
	 * @returns The capitalized string, or an empty string if the input is falsy.
	 */
	public capitalizeFirstLetterOnEachWord(string: string | null | undefined): string {
		return Utilities.capitalizeFirstLetterOnEachWord(string);
	}

	/**
	 * Instance wrapper around {@link Utilities.getRelativeTime} for use in Angular templates.
	 *
	 * @param timestamp - The timestamp string, or undefined for an empty result.
	 * @returns A human-readable relative time string, or an empty string.
	 */
	public getRelativeTime(timestamp: string | undefined): string {
		return Utilities.getRelativeTime(timestamp ?? '');
	}
}
