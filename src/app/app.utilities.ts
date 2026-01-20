import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { MovieItemVO } from './entertainment/entertainment.movieitem.vo';

export const RATE_DECREASED = 'decreased';
export const RATE_INCREASED = 'increased';
export const SEARCH_COMPELTE = 'Search complete';
export const SEARCH_CANCEL = 'Search cancelled';
export const COMPONENT_DESTROY = 'Component Destroyed';
export const NO_RATE = 'No rate';
export const STATUS_TODO = 'To Do';
export const STATUS_IN_PROGRESS = 'In Progress';
export const STATUS_COMPLETED = 'Completed';
export const STATUS_DEBUG = 'Debug';
export const STATUS_DRAFT = 'Draft';
export const STATUS_RESOLVED = 'Resolved';
export const GENRE_FAVOURITE = '特别关注';
export const FIRST_TABLE = 'first_table';
export const SECOND_TABLE = 'second_table';
export const THIRD_TABLE = 'third_table';

@Injectable({ providedIn: 'root' })
export class Utilities {
	constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
	/**
	 * Check if the current device is a mobile device.
	 *
	 * @returns A boolean value that indicates if the current device is a mobile device.
	 */
	public isMobile() {
		if (isPlatformBrowser(this.platformId)) {
			return globalThis.innerWidth <= 1200;
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
		if (isTimeIncluded) {
			formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now
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

	////////////////////////////// Below are static methods //////////////////////////////

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

	public static checkIfHoverCapable() {
		return window.matchMedia('(hover: hover)').matches;
	}
}
