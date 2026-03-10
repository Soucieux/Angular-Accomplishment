import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { Utilities } from '../../common/app.utilities';

export const loginGuard: CanMatchFn = () => {
	const platformId = inject(PLATFORM_ID);

	if (isPlatformBrowser(platformId)) {
		const router = inject(Router);
		const utilities = inject(Utilities);

		// Navigates to the Home page and ensures no history entry of login
		return utilities.getIsUserAlive() ? router.parseUrl('/') : true;
	}
	return true;
};
