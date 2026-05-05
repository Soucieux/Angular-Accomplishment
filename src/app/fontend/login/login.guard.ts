import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { Utilities } from '../../common/app.utilities';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';

/**
 * Route guard that prevents authenticated users from accessing the login page.
 * If the user is already signed in (has a CloudBase user ID), redirects to
 * the home page. Unauthenticated users are allowed through.
 */
export const loginGuard: CanMatchFn = () => {
	const platformId = inject(PLATFORM_ID);

	if (isPlatformBrowser(platformId)) {
		const router = inject(Router);
		const utilities = inject(Utilities);

		// Navigates to the Home page and ensures no history entry of login
		return CloudbaseService.getUseId() ? router.parseUrl('/') : true;
	}
	return true;
};
