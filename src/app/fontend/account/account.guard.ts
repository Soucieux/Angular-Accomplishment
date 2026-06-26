import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { LS_AUTH_HINT_KEY } from '../../common/locale/locale.en';

/**
 * Route guard that prevents unauthenticated users from accessing the account page.
 * Checks the in-memory CloudBase user ID first; falls back to the localStorage auth
 * hint so the guard is not fooled by the async auth loading window on page refresh.
 * Unauthenticated users are redirected to the login page.
 */
export const accountGuard: CanMatchFn = () => {
	const platformId = inject(PLATFORM_ID);

	if (isPlatformBrowser(platformId)) {
		const router = inject(Router);
		const isSignedIn =
			!!CloudbaseService.getUserId() || localStorage.getItem(LS_AUTH_HINT_KEY) === '1';

		return isSignedIn ? true : router.parseUrl('/login');
	}
	return true;
};
