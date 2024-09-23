import { Component, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
// import { Database } from '@firebase/database';
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

import { EntertainmentComponent } from './entertainment/entertainment.component';

@Component({
	selector: 'root',
	standalone: true,
	imports: [
		CommonModule,
		RouterOutlet,
		RouterModule,
		MatSidenavModule,
		MatButtonModule,
		MatRippleModule,
		EntertainmentComponent
	],
	templateUrl: 'app.component.html',
	styleUrl: './app.component.css'
})
export class AppComponent {
	// courses$;
	// constructor(db: AngularFireDatabase) {
	// 	this.courses$ = db.list('/course').stateChanges();
	// 	// this.courses$.subscribe(e=>console.log(e));
	// }
	currentUser?: User | null;

	constructor(private auth: Auth) {}

	ngOnInit() {
		onAuthStateChanged(this.auth, (user) => {
			this.currentUser = user;
			console.log(user);
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
