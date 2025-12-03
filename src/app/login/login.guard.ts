import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

export const loginGuard =
	(invert: boolean): CanMatchFn =>
	() => {
		const router = inject(Router);
		if (localStorage != null && localStorage.getItem('permission') === 'false') {
			return invert ? false : true;
		}

		// Ensures no history entry of login
		return invert ? true : router.parseUrl('/');
	};
