import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

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
			return globalThis.innerWidth <= 430;
		}
		return false;
	}
}
