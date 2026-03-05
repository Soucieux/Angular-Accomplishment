import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { MovieItemVO } from './entertainment/entertainment.movieitem.vo';
import { HttpClient } from '@angular/common/http';
import { LOG } from './app.logs';
import { firstValueFrom } from 'rxjs';

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
export const CN = 'CN';

@Injectable({ providedIn: 'root' })
export class Utilities {
	private readonly className = 'Utilities';
	private currentCountry!: string;
	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		private http: HttpClient
	) {}
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
	 * Check the current country code
	 * Note: This method can only be called by bootstraps
	 *
	 * @returns Current country code
	 */
	public async checkCurrentCountry() {
		if (!isPlatformBrowser(this.platformId)) return;

		const cachedLocation = localStorage.getItem('region');

		if (cachedLocation) {
			const parsed = JSON.parse(cachedLocation);
			const now = Date.now();
			const ONE_DAY = 24 * 60 * 60 * 1000;

			// Check whether the last session is over 24 hours or not
			if (now - parsed.timestamp < ONE_DAY) {
				this.currentCountry = parsed.region;
				LOG.warn(
					this.className,
					'Reusing last session. Current IP: ' + parsed.ip + ', Current country: ' + parsed.country
				);
				return;
			}
		}

		const currentLocation = await firstValueFrom(
			this.http.get<any>('https://ipinfo.io/json?token=581131c84dc255')
		);

		this.currentCountry = currentLocation.country;

		localStorage.setItem(
			'location',
			JSON.stringify({
				country: this.currentCountry,
				ip: currentLocation.ip,
				timestamp: Date.now()
			})
		);

		LOG.warn(
			this.className,
			'Current IP: ' + currentLocation.ip + ', Current country: ' + currentLocation.country
		);
	}

	/**
	 * get the current country code
	 *
	 * @returns Current country code
	 */
	public getCurrentRegion() {
		return this.currentCountry;
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
