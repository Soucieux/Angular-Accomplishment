import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { take, map } from 'rxjs';

export const loginGuard: CanActivateFn = () => {
	const router = inject(Router);
	const auth = inject(Auth);

	return authState(auth).pipe(
		take(1),
		map((user) => {
			if (user) {
				router.navigate(['/'], { replaceUrl: true });
				return false;
			}
			return true;
		})
	);
};
