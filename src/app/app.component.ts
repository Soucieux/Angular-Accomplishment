import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { AuthService } from './service/authentication-service/auth.service';
import { Router } from '@angular/router';
import { LOG } from './log';
import { MatIconModule } from '@angular/material/icon';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
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
		MatIconModule,
		ToastModule,
		ButtonModule
	],
	templateUrl: 'app.component.html',
	styleUrl: './app.component.css'
})
export class AppComponent {
	private readonly className = 'AppComponent';
	// courses$;
	currentUser$ = this.authService.currentUser$;

	constructor(private authService: AuthService, private router: Router) {
		// this.courses$ = objectVal(ref(this.db, '/course/2'));
	}

	/**
	 * Anything that needs to be done when the component is destroyed.
	 */
	ngOnDestroy() {
		LOG.info(this.className, 'Component destroyed');
	}

	login() {
		// this.authService.login();
		localStorage.setItem('isLoggedIn', 'true');
	}

	logout() {
		this.authService.logout();
	}
}
