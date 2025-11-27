import { EnvironmentInjector, Inject, Injectable, runInInjectionContext } from '@angular/core';
import {
	GoogleAuthProvider,
	signInWithPopup,
	Auth,
	signOut,
	User,
	onAuthStateChanged
} from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	currentUser$: Observable<User | null>;
	constructor(
		@Inject(Auth) private auth: Auth,
		@Inject(EnvironmentInjector) private ei: EnvironmentInjector,
		private router: Router
	) {
		// Wrapping with an Observable makes sure the user object is updated continuously and we have the option to subscribe to it
		this.currentUser$ = new Observable((observer) => {
			runInInjectionContext(this.ei, () => {
				// onAuthStateChanged emits the user continuously
				onAuthStateChanged(this.auth, (user) => {
					observer.next(user);
				});
			});
		});
	}

	googleLogin() {
		signInWithPopup(this.auth, new GoogleAuthProvider())
			.then(() => {
				this.router.navigate(['/']);
			})
			.catch(() => console.log('ERROR when signing in through Google'));
	}

	logout() {
		signOut(this.auth)
			.then(() => {})
			.catch(() => console.log('ERROR when signing out current user'));
	}
}
