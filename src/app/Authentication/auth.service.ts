import { Injectable } from '@angular/core';
import {
	GoogleAuthProvider,
	signInWithPopup,
	User,
	Auth,
	signOut,
	authState
} from '@angular/fire/auth';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	constructor(private auth: Auth) {}

	// Return the current auth state so that other components can get the latest state on user authentication
	getCurrentUser() {
		return authState(this.auth);
	}

	login() {
		signInWithPopup(this.auth, new GoogleAuthProvider())
			.then(() => {
				window.location.reload();
			})
			.catch(() => console.log('ERROR when signing in'));
	}

	logout() {
		signOut(this.auth)
			.then(() => {
				window.location.reload();
			})
			.catch(() => console.log('ERROR when signing out current user'));
	}
}
