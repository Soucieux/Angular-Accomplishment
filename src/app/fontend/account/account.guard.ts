import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';

/**
 * Route guard that prevents unauthenticated users from accessing the account page.
 * If the user is not signed in (no CloudBase user ID), redirects to the login page.
 * Authenticated users are allowed through.
 */
export const accountGuard: CanMatchFn = () => {
	const platformId = inject(PLATFORM_ID);

	if (isPlatformBrowser(platformId)) {
		const router = inject(Router);

		return CloudbaseService.getUserId() ? true : router.parseUrl('/login');
	}
	return true;
};
