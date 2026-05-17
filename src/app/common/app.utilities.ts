import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, ViewContainerRef } from '@angular/core';
import { MovieItemVO } from '../fontend/entertainment/movieItem.vo';
import { LOG } from './app.logs';
import { CN } from './app.constant';
import { CloudbaseService } from '../backend/database-service/cloudbase/cloudbase.service';

@Injectable({ providedIn: 'root' })
export class Utilities {
	private static readonly className = 'Utilities';
	private static currentCountry: string = '';
	private isUserAlive: boolean = false;

	constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

	/**
	 * Check if the current device is a mobile device.
	 *
	 * @returns A boolean value that indicates if the current device is a mobile device.
	 */
	public isMobile() {
		if (isPlatformBrowser(this.platformId)) {
			return globalThis.innerWidth <= 840;
		}
		return false;
	}

	/**
	 * Get current timestamp
	 *
	 * @param isTimeIncluded - Whether to include time in the formatted time.
	 * @returns Formatted time
	 */
	public getCurrentFormattedTime(isTimeIncluded: boolean): string {
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
	public static coerceDateToString(date: any): string {
		if (!date) return '';
		if (typeof date === 'string') return date;
		try {
			let ms: number | null = null;
			if (typeof date === 'number') {
				ms = date;
			} else if (date instanceof Date || typeof date.getTime === 'function') {
				ms = date.getTime();
			} else if (typeof date === 'object') {
				// CloudBase/MongoDB: { $date: ms } or { $date: { $numberLong: "ms" } }
				if (date.$date !== undefined) {
					ms = typeof date.$date === 'object' && date.$date.$numberLong
						? Number(date.$date.$numberLong)
						: Number(date.$date);
				// Tencent CloudBase SDK: { time: ms }
				} else if (date.time !== undefined) {
					ms = Number(date.time);
				// Firestore-like: { seconds: s }
				} else if (date.seconds !== undefined) {
					ms = Number(date.seconds) * 1000;
				}
			}
			if (ms === null) ms = Number(new Date(date));
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
	public capitalizeFirstLetterOnEachWord(string: string | null | undefined) {
		return string ? string.replace(/\b\w/g, (char) => char.toUpperCase()) : '';
	}

	/**
	 * Capitalize the first letter of the string with others unchanged.
	 *
	 * @param string - The string to capitalize.
	 * @returns The string with the first letter capitalized.
	 */
	public capitalizeFirstLetterWithOthersUnchanged(string: string | null | undefined) {
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
	public checkIfChinese(text: string | null | undefined): boolean {
		return !!text && /[一-龥]/.test(text);
	}

	////////////////////////////// Below are static methods //////////////////////////////
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
	public getIsUserAlive() {
		return this.isUserAlive;
	}

	/**
	 * Set the user alive state.
	 *
	 * @param isUserAlive - Whether the user is alive.
	 */
	public setIsUserAlive(isUserAlive: boolean) {
		this.isUserAlive = isUserAlive;
	}

	/**
	 * Check if the movie item is valid.
	 *
	 * @param movieItemVO - The movie item to check.
	 */
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
	public static checkIfHoverCapable() {
		return window.matchMedia('(hover: hover)').matches;
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

			// localStorage.setItem(
			// 	'location',
			// 	JSON.stringify({
			// 		country: this.currentCountry,
			// 		ip: 'null',
			// 		timestamp: Date.now()
			// 	})
			// );

			// LOG.info(this.className, 'Current IP: ' + 'null' + ', Current country: ' + this.currentCountry);
		} catch (error: any) {
			LOG.error(this.className, 'Country detection failed: ', error);
			this.currentCountry = CN;
			LOG.info(this.className, 'Use default country: ' + this.currentCountry);
		}
	}
}
