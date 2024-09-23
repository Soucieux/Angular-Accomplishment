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
	currentUser?: User;

	constructor(private auth: Auth) {
		/*
        Note: This is only used in production environment
        if (typeof window !== 'undefined') {
			this.afAuth
				.getRedirectResult()
				.then((x) => console.log(x.additionalUserInfo?.profile));
		}
        */
	}

	ngOnInit() {
		onAuthStateChanged(this.auth, (user) => console.log(user));
	}

	/* 
    Note: This is only used in production environment
    async login() {
	 	await this.afAuth.signInWithRedirect(new GoogleAuthProvider());
	 }
     */

	login() {
		signInWithPopup(this.auth, new GoogleAuthProvider()).then((result) => {
			console.log(result);
		});
	}

	logout() {
		signOut(this.auth);
	}

	// constructor(db: AngularFireDatabase) {
	// 	this.courses$ = db.list('/course').stateChanges();
	// 	// this.courses$.subscribe(e=>console.log(e));
}
