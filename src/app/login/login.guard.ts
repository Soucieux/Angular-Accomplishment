import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

export const loginGuard: CanMatchFn = () => {
	const platformId = inject(PLATFORM_ID);

	if (isPlatformBrowser(platformId)) {
		const router = inject(Router);
		if (localStorage != null && localStorage.getItem('permission') === 'false') {
			return true;
		}

		// Navigates to the Home page and ensures no history entry of login
		return router.parseUrl('/');
	}
	return true;
};
