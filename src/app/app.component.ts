import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { Database, objectVal, ref } from '@angular/fire/database';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import {
	signInWithPopup,
	GoogleAuthProvider,
	onAuthStateChanged,
	Auth,
	signOut,
	User
} from '@angular/fire/auth';

@Component({
	selector: 'root',
	standalone: true,
	imports: [
		CommonModule,
		RouterOutlet,
		RouterModule,
		MatSidenavModule,
		MatButtonModule,
		MatRippleModule
	],
	templateUrl: 'app.component.html',
	styleUrl: './app.component.css'
})
export class AppComponent {
	// courses$;
	currentUser$?: User | null;

	constructor(private auth: Auth, private db: Database) {
		// this.courses$ = objectVal(ref(this.db, '/course/2'));
	}

	ngOnInit() {
		onAuthStateChanged(this.auth, (user) => {
			this.currentUser$ = user;
		});
	}

	login() {
		signInWithPopup(this.auth, new GoogleAuthProvider()).catch(() =>
			console.log('ERROR when signing in')
		);
	}

	logout() {
		signOut(this.auth).catch(() =>
			console.log('ERROR when signing out current user')
		);
	}
}
