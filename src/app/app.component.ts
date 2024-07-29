import { GoogleAuthProvider, getAuth } from '@firebase/auth';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { AngularFireDatabase } from '@angular/fire/compat/database';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { EntertainmentComponent } from './entertainment/entertainment.component';
import { AngularFireAuth } from '@angular/fire/compat/auth';

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

	constructor(private auth: AngularFireAuth) {}

	ngOnInit() {
		if (typeof window !== 'undefined') {
			this.auth
				.getRedirectResult()
				.then((x) => console.log('Result: ' + x.user));
		}
	}

	async login() {
		await this.auth
			.signInWithRedirect(new GoogleAuthProvider())
			.catch((x) => console.log('error'));
	}

	logout() {
		this.auth.signOut().then((x) => console.log(this.auth.user));
	}
}
