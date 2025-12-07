import { Component, Inject, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { AuthService } from './service/authentication-service/auth.service';
import { LOG } from './app.logs';
import { MatIconModule } from '@angular/material/icon';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { COMPONENT_DESTROY, Utilities } from './app.utilities';
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
	currentUser$ = this.authService.currentUser$;

	constructor(private authService: AuthService, @Inject(PLATFORM_ID) private platformId: Object) {
		if (isPlatformBrowser(this.platformId)) {
			const permission = JSON.parse(localStorage.getItem('permission') || 'null');
			if (permission == null) {
				localStorage.setItem('permission', 'false');
			}
		}
	}

	/**
	 * Anything that needs to be done when the component is destroyed.
	 */
	ngOnDestroy() {
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	logout() {
		this.authService.logout();
	}
}
