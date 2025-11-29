import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const loginGuard: CanActivateFn = () => {
	const router = inject(Router);
	if (localStorage.getItem('permission') === 'false') {
		return true;
	}

	router.navigate(['/']);
	return false;
};
