import { Injectable } from '@angular/core';
import {
	GoogleAuthProvider,
	signInWithPopup,
	Auth,
	signOut,
	User,
	onAuthStateChanged
} from '@angular/fire/auth';
import { Observable } from 'rxjs';
@Injectable({
	providedIn: 'root'
})
export class AuthService {
	currentUser$: Observable<User | null>;
	constructor(private auth: Auth) {
		// Wrapping with an Observable makes sure the user object is updated continuously and we have the option to subscribe to it
		this.currentUser$ = new Observable((observer) => {
			// onAuthStateChanged emits the user continuously
			onAuthStateChanged(this.auth, (user) => {
				observer.next(user);
			});
		});
	}

	login() {
		signInWithPopup(this.auth, new GoogleAuthProvider())
			.then(() => {
				window.location.reload();
				localStorage.setItem('isLoggedIn', 'true');
			})
			.catch(() => console.log('ERROR when signing in'));
	}

	logout() {
		signOut(this.auth)
			.then(() => {
				window.location.reload();
				localStorage.setItem('isLoggedIn', 'false');
			})
			.catch(() => console.log('ERROR when signing out current user'));
	}
}
