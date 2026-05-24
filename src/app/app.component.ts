import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { AuthService } from './backend/authentication-service/auth.service';
import { LOG } from './common/app.logs';
import { MatIconModule } from '@angular/material/icon';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { Utilities } from './common/app.utilities';
import { CN, COMPONENT_DESTROY } from './common/app.constant';
import { Observable } from 'rxjs';
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	currentUser$!: Observable<any>;

	constructor(
		private authService: AuthService,
		private router: Router,
		@Inject(PLATFORM_ID) private platformId: object
	) {}

	/**
	 * Initialise the component, subscribe to auth state changes, and set up
	 * the navigation sidebar visibility.
	 */
	public ngOnInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			if (Utilities.getCurrentCountry() === CN) {
				this.currentUser$ = this.authService.cloudbaseGetCurrentUser();
			} else {
				this.currentUser$ = this.authService.firebaseGetCurrentUser();
			}
		}
	}

	/**
	 * Anything that needs to be done when the component is destroyed.
	 */
	public ngOnDestroy() {
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	/**
	 * Navigate to the login page, preserving the current URL as a returnUrl
	 * query param so the user is sent back after signing in.
	 */
	protected navigateToLogin() {
		void this.router.navigate(['/login'], {
			queryParams: { returnUrl: this.router.url }
		});
	}

	/**
	 * Sign the current user out, using the appropriate service depending on the
	 * detected country (CloudBase for CN, Firebase otherwise).
	 */
	protected async logout() {
		if (Utilities.getCurrentCountry() === CN) {
			await this.authService.signOut();
		} else {
			this.authService.logout();
		}
	}

	protected isCN() {
		return Utilities.getCurrentCountry() === CN;
	}
}
