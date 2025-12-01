import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

export const loginGuard: CanMatchFn = () => {
	const router = inject(Router);
	if (localStorage != null && localStorage.getItem('permission') === 'false') {
		return true;
	}

	// Ensures no history entry of login
	return router.parseUrl('/');
};
