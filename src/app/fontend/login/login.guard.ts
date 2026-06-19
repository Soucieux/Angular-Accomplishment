import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { LS_AUTH_HINT_KEY } from '../../common/app.constant';

/**
 * Route guard that prevents authenticated users from accessing the login page.
 * Checks the in-memory CloudBase user ID first, then falls back to the
 * localStorage auth hint for the brief window on page refresh before the
 * async auth resolves. Either signal causes a redirect to the home page.
 * Unauthenticated users are allowed through.
 */
export const loginGuard: CanMatchFn = () => {
	const platformId = inject(PLATFORM_ID);

	if (isPlatformBrowser(platformId)) {
		const router = inject(Router);

		/* CloudbaseService.getUserId() is undefined until the async auth resolves.
		   Fall back to the localStorage hint so a user who refreshes and immediately
		   clicks Sign In is still redirected — instead of landing on /login
		   and being stranded there when auth resolves a few seconds later. */
		const isSignedIn = !!CloudbaseService.getUserId() || localStorage.getItem(LS_AUTH_HINT_KEY) === '1';
		return isSignedIn ? router.parseUrl('/') : true;
	}
	return true;
};
