import { CanActivateFn } from '@angular/router';

export const loginGuard: CanActivateFn = () => {
	return localStorage.getItem('permission') === 'false';
};
