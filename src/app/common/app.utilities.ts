import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, ViewContainerRef } from '@angular/core';
import { MovieItemVO } from './movieitem.vo';
import { LOG } from './app.logs';
import { CN } from './app.constant';

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

	////////////////////////////// Below are static methods //////////////////////////////
	/**
	 * Get the current country code
	 *
	 * @returns Current country code
	 */
	public static getCurrentCountry() {
		return this.currentCountry;
	}

	public getIsUserAlive() {
		return this.isUserAlive;
	}

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
		// const cachedLocation = localStorage.getItem('location');

		// if (cachedLocation) {
		// 	const parsed = JSON.parse(cachedLocation);
		// 	const now = Date.now();
		// 	const ONE_DAY = 24 * 60 * 60 * 1000;

		// 	// Check whether the last session is over 24 hours or not
		// 	if (now - parsed.timestamp < ONE_DAY) {
		// 		this.currentCountry = parsed.country;
		// 		LOG.info(
		// 			this.className,
		// 			'Reusing last session. Current IP: ' + parsed.ip + ', Current country: ' + parsed.country
		// 		);
		// 		return;
		// 	}
		// }
		try {
			const response = await fetch('https://ipinfo.io/json?token=581131c84dc255');
			if (!response.ok) throw new Error('IP lookup failed');

			const currentLocation = await response.json();

			this.currentCountry = currentLocation.country;

			localStorage.setItem(
				'location',
				JSON.stringify({
					country: this.currentCountry,
					ip: currentLocation.ip,
					timestamp: Date.now()
				})
			);

			LOG.info(
				this.className,
				'Current IP: ' + currentLocation.ip + ', Current country: ' + this.currentCountry
			);
		} catch (error: any) {
			LOG.error(this.className, 'Country detection failed: ', error);
			this.currentCountry = CN;
			LOG.info(this.className, 'Use default country: ' + this.currentCountry);
		}
	}
}
