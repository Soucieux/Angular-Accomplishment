import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { format } from 'date-fns';
import { BehaviorSubject, Observable } from 'rxjs';
import { MovieItemVO } from '../fontend/entertainment/movieItem.vo';
import { LOG } from './app.logs';
import { CN, RATE_LABEL_EXCELLENT, RATE_LABEL_GOOD, RATE_LABEL_AVERAGE, RATE_LABEL_POOR } from './app.constant';
import { CloudbaseService } from '../backend/database-service/cloudbase/cloudbase.service';

@Injectable({ providedIn: 'root' })
export class Utilities {
	private static readonly className = 'Utilities';
	private static currentCountry: string = '';
	private static boundScrollEls = new WeakSet<HTMLElement>();
	private static scrollTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
	private readonly isUserAliveSubject = new BehaviorSubject<boolean>(false);

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		@Inject(DOCUMENT) private document: Document
	) {}

	/**
	 * Check if the current device is a mobile device.
	 *
	 * @returns A boolean value that indicates if the current device is a mobile device.
	 */
	public isMobile() {
		if (isPlatformBrowser(this.platformId)) {
			return globalThis.innerWidth <= 940;
		}
		return false;
	}

	/**
	 * Get current timestamp
	 *
	 * @param isTimeIncluded - Whether to include time in the formatted time.
	 * @returns Formatted time
	 */
	public static getCurrentFormattedTime(isTimeIncluded: boolean): string {
		const now = new Date();

		let formattedTime = '';
		// Leading space separates date from time when time is included;
		// when isTimeIncluded=false, formattedTime stays empty → no separator needed.
		if (isTimeIncluded) {
			formattedTime = ` ${now.getHours().toString().padStart(2, '0')}:${now
				.getMinutes()
				.toString()
				.padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
		}

		const formattedDate =
			`${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now
				.getDate()
				.toString()
				.padStart(2, '0')}` + formattedTime;

		return formattedDate;
	}

	/**
	 * Get a relative time string from a timestamp (e.g. "just now", "5m ago", "2d ago").
	 * Accepts both the app's dot-separated format ("YYYY.MM.DD HH:mm:ss") and ISO 8601
	 * strings (containing 'T', e.g. "2024-01-15T10:30:00.000Z") so that all pages can
	 * share a single implementation.
	 *
	 * @param timestamp - The timestamp string in either "YYYY.MM.DD HH:mm:ss" or ISO 8601 format.
	 * @returns A human-readable relative time string.
	 */
	public static getRelativeTime(timestamp: string): string {
		if (!timestamp) return '';
		let date: Date;
		if (timestamp.includes('T')) {
			// ISO 8601 format — let the Date constructor parse it directly.
			date = new Date(timestamp);
		} else {
			// App format: "YYYY.MM.DD HH:mm:ss" — parse manually to avoid timezone
			// ambiguity that Date.parse would introduce when given a non-standard string.
			const [datePart, timePart] = timestamp.split(' ');
			const [year, month, day] = datePart.split('.');
			const [hours, minutes, seconds] = (timePart || '00:00:00').split(':');
			date = new Date(+year, +month - 1, +day, +hours, +minutes, +seconds);
		}
		const now = new Date();
		const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
		const diffMins = Math.floor(diffSecs / 60);
		const diffHours = Math.floor(diffMins / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffSecs < 60) return 'just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
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
		if (!date) return '';
		if (typeof date === 'string') return date;
		try {
			let ms: number | null = null;
			if (typeof date === 'number') {
				ms = date;
			} else if (date instanceof Date || typeof (date as Record<string, unknown>)['getTime'] === 'function') {
				ms = (date as Date).getTime();
			} else if (typeof date === 'object' && date !== null) {
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
			if (ms === null) ms = Number(new Date(date as string));
			const d = new Date(ms);
			if (isNaN(d.getTime())) return '';
			const y = d.getFullYear();
			const m = String(d.getMonth() + 1).padStart(2, '0');
			const day = String(d.getDate()).padStart(2, '0');
			return `${y}-${m}-${day}`;
		} catch {
			return '';
		}
    }
    
	/**
	 * Capitalize the first letter of the string on each word
	 *
	 * @param string - The string to capitalize.
	 * @returns The string with the first letter capitalized.
	 */
	public static capitalizeFirstLetterOnEachWord(string: string | null | undefined) {
		return string ? string.replace(/\b\w/g, (char) => char.toUpperCase()) : '';
	}

	/**
	 * Capitalize the first letter of the string with others unchanged.
	 *
	 * @param string - The string to capitalize.
	 * @returns The string with the first letter capitalized.
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
	 * Get the current country code
	 *
	 * @returns Current country code
	 */
	public static getCurrentCountry() {
		return this.currentCountry;
	}

	/**
	 * Check if the current user is alive (has a valid session).
	 *
	 * @returns Whether the user is alive.
	 */
	public getIsUserAlive(): boolean {
		return this.isUserAliveSubject.getValue();
	}

	/**
	 * Get an observable that emits whenever the user alive state changes.
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
	 *
	 * @param isUserAlive - Whether the user is alive.
	 */
	public setIsUserAlive(isUserAlive: boolean): void {
		this.isUserAliveSubject.next(isUserAlive);
	}

	/**
	 * Check if the movie item is valid.
	 *
	 * @param movieItemVO - The movie item to check.
	 */
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

	public static checkMovieItemVO(movieItemVO: MovieItemVO) {
		if (movieItemVO.getMovieName() === '' || movieItemVO.getMovieYear() === -1) {
			throw new Error('Movie item VO is invalid');
		}
	}

	/**
	 * Check whether the current user has permission to modify an entry
	 * owned by the given openid. Admin users bypass the check automatically.
	 * Exceptions from the auth layer are treated as permission denied.
	 *
	 * @param openid - The owner ID stored on the database entry.
	 * @returns true if the current user is permitted, false otherwise.
	 */
	public static checkPermission(openid: string): boolean {
		try {
			if (CloudbaseService.userHasAllRights()) return true;
			return openid === CloudbaseService.getUseId();
		} catch {
			return false;
		}
	}

	/**
	 * Check if the current device is hover capable (has a pointing device like a mouse).
	 *
	 * @returns true if the device supports hover, otherwise false.
	 */
	public checkIfHoverCapable(): boolean {
		return this.document.defaultView?.matchMedia('(hover: hover)').matches ?? false;
	}

	/**
	 * Open a URL in a new tab using a temporary anchor element on the injected
	 * Document, avoiding any direct reference to the global window object.
	 *
	 * @param url - The fully-qualified URL to open.
	 */
	public openInNewTab(url: string): void {
		const a = this.document.createElement('a');
		a.href = url;
		a.target = '_blank';
		a.rel = 'noopener noreferrer';
		this.document.body.appendChild(a);
		a.click();
		this.document.body.removeChild(a);
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
	 * Flatten a raw CloudBase statistics field (returned as either a true array
	 * or an object keyed by insertion index) into a plain array.
	 * Returns an empty array when the field is absent or falsy.
	 *
	 * @param raw - The raw field value from a CloudBase snapshot.
	 * @returns A plain `any[]` array.
	 */
	public static toArray(raw: unknown): any[] {
		if (!raw) return [];
		return Array.isArray(raw) ? raw : Object.values(raw as object);
	}

	/**
	 * Ensure a URL has an explicit protocol prefix so the browser treats it as an
	 * absolute URL. Returns the value unchanged if it already starts with
	 * `http://` or `https://`; otherwise prepends `https://`.
	 *
	 * @param url - The raw URL string (may or may not have a protocol).
	 * @returns A URL string guaranteed to begin with a valid protocol.
	 */
	public static normalizeUrl(url: string): string {
		if (!url) return url;
		if (url.startsWith('http://') || url.startsWith('https://')) return url;
		return 'https://' + url;
	}

	/**
	 * Normalise a raw user-entered link to a full HTTPS URL. Adds `https://www.`
	 * when no protocol or subdomain is present, and `https://` when the value
	 * already starts with `www.`. This www-aware variant is used for contact /
	 * reminder links (compare {@link normalizeUrl} which only prepends the protocol).
	 *
	 * @param link - The raw link string entered by the user.
	 * @returns A normalised URL string beginning with http(s)://, or the original
	 *          value when it is falsy.
	 */
	public static normalizeWebUrl(link: string): string {
		if (!link) return link;
		const lower = link.toLowerCase();
		if (lower.startsWith('www.')) return 'https://' + lower;
		if (lower.startsWith('https://') || lower.startsWith('http://')) return lower;
		return 'https://www.' + lower;
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
	 * Extract a favicon URL from any site URL by reading the hostname and
	 * constructing the conventional /favicon.ico path.
	 *
	 * @param url - The full URL of the website.
	 * @returns A favicon image URL string, or '' if the URL is unparseable.
	 */
	public static getFavicon(url: string): string {
		try {
			const hostname = new URL(url).hostname;
			return `https://${hostname}/favicon.ico`;
		} catch {
			return '';
		}
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
			const msg = (err as any).message;
			return typeof msg === 'string' ? msg : String(err);
		} catch {
			return 'unknown error';
		}
	}

	/**
	 * Compute how many days remain until a `YYYY-MM-DD` date string, returning
	 * a short human-readable label ("Today", "Tomorrow", "in Xd", or "Xd overdue").
	 *
	 * @param dateStr - A date in any form accepted by {@link coerceDateToString}.
	 * @returns A countdown label, or an empty string if no date is provided.
	 */
	public static getDaysUntil(dateStr: unknown): string {
		if (!dateStr) return '';
		const str = Utilities.coerceDateToString(dateStr);
		if (!str) return '';
		const [year, month, day] = str.split('-').map(Number);
		const target = new Date(year, month - 1, day);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
		if (diff < 0) return `${Math.abs(diff)}d overdue`;
		if (diff === 0) return 'Today';
		if (diff === 1) return 'Tomorrow';
		return `in ${diff}d`;
	}

	/**
	 * Returns `true` if the given date is strictly before today (i.e. the item
	 * is past due). Accepts any form understood by {@link coerceDateToString}.
	 *
	 * @param dateStr - A date in any form accepted by {@link coerceDateToString}.
	 * @returns `true` if the date is in the past, `false` otherwise.
	 */
	public static isOverdue(dateStr: unknown): boolean {
		if (!dateStr) return false;
		const str = Utilities.coerceDateToString(dateStr);
		if (!str) return false;
		const [year, month, day] = str.split('-').map(Number);
		const target = new Date(year, month - 1, day);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return target < today;
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
		if (!el || Utilities.boundScrollEls.has(el)) return;
		Utilities.boundScrollEls.add(el);
		const reveal = () => {
			el.classList.add('is-scrolling');
			const prev = Utilities.scrollTimers.get(el);
			if (prev) clearTimeout(prev);
			Utilities.scrollTimers.set(
				el,
				setTimeout(() => el.classList.remove('is-scrolling'), 700)
			);
		};
		el.addEventListener('scroll', reveal, { passive: true });
		el.addEventListener('mouseenter', () => {
			if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) reveal();
		});
	}

	/**
	 * Check the current country code
	 * Note: This method can only be called by bootstraps
	 *
	 * @returns Current country code
	 */
	public static async checkCurrentCountry() {
		try {
			this.currentCountry = CN;
		} catch (error: any) {
			LOG.error(this.className, 'Country detection failed: ', error);
			this.currentCountry = CN;
			LOG.info(this.className, 'Use default country: ' + this.currentCountry);
		}
	}
}
