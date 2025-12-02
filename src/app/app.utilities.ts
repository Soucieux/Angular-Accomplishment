import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { MovieItemVO } from './entertainment/entertainment.movieitem.vo';

@Injectable({ providedIn: 'root' })
export class Utilities {
	constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
	/**
	 * Check if the current device is a mobile device.
	 * Note: This only works for iPhone 16 Pro or other devices with a width of 430px.
	 *
	 * @returns A boolean value that indicates if the current device is a mobile device.
	 */
	public isMobile() {
		if (isPlatformBrowser(this.platformId)) {
			return globalThis.innerWidth <= 580;
		}
		return false;
	}

	/**
	 * Check if the movie item is valid.
	 *
	 * @param movieItemVO - The movie item to check.
	 */
	public static checkMovieItemVO(movieItemVO: MovieItemVO) {
		if (movieItemVO.getMovieTitle() === '' || movieItemVO.getMovieYear() === -1) {
			throw new Error('Movie item VO is invalid');
		}
	}
}
