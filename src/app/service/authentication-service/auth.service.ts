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
		// CurrentUser in this.auth is still null after signInWithPopup completes
		// As the credentials are being returned after that and then firebase starts initializing
		signInWithPopup(this.auth, new GoogleAuthProvider())
			.then(() => {
				const unsub = onAuthStateChanged(this.auth, (user) => {
					unsub();
					if (user) {
						this.router.navigate(['/']);
						localStorage.setItem('permission', 'true');
					}
				});
			})
			.catch(() => console.log('ERROR when signing in through Google'));
	}

	logout() {
		// CurrentUser in this.auth gets removed immediately after signOut
		signOut(this.auth)
			.then(() => {
				localStorage.setItem('permission', 'false');
				window.location.reload();
			})
			.catch(() => console.log('ERROR when signing out current user'));
	}
}
