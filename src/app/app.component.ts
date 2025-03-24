import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { Database } from '@angular/fire/database';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { AuthService } from './authentication/auth.service';
import { Router } from '@angular/router';
import { LOG } from './log';
import { MatIconModule } from '@angular/material/icon';
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
		MatIconModule
	],
	templateUrl: 'app.component.html',
	styleUrl: './app.component.css'
})
export class AppComponent {
	private readonly className = 'AppComponent';
	// courses$;
	currentUser$ = this.authService.currentUser$;

	constructor(private db: Database, private authService: AuthService, private router: Router) {
		// this.courses$ = objectVal(ref(this.db, '/course/2'));
	}

	/**
	 * Anything that needs to be done when the component is destroyed.
	 */
	ngOnDestroy() {
		LOG.info(this.className, 'Component destroyed');
	}

	login() {
		this.authService.login();
	}

	logout() {
		this.authService.logout();
	}
}
