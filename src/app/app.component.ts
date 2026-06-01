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
	protected currentUser$!: Observable<any>;

	constructor(
		private authService: AuthService,
		private router: Router,
		@Inject(PLATFORM_ID) private platformId: object
	) {}

	/**
	 * Initialises the component, subscribes to the auth state observable,
	 * and assigns the appropriate user stream based on the detected country.
	 */
	ngOnInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			if (Utilities.getCurrentCountry() === CN) {
				this.currentUser$ = this.authService.cloudbaseGetCurrentUser();
			} else {
				this.currentUser$ = this.authService.firebaseGetCurrentUser();
			}
		}
	}

	/**
	 * Logs the component destruction event.
	 */
	ngOnDestroy(): void {
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	/**
	 * Navigates to the login page, preserving the current URL as a returnUrl
	 * query param so the user is redirected back after signing in.
	 */
	protected navigateToLogin(): void {
		this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } }).catch(() => {});
	}

	/**
	 * Signs the current user out using the appropriate service based on the
	 * detected country (CloudBase for CN, Firebase otherwise).
	 */
	protected async logout(): Promise<void> {
		if (Utilities.getCurrentCountry() === CN) {
			await this.authService.signOut();
		} else {
			this.authService.logout();
		}
	}

	/**
	 * Returns true when the app is running in the CN region.
	 *
	 * @returns True if the current country code is CN.
	 */
	protected isCN(): boolean {
		return Utilities.getCurrentCountry() === CN;
	}
}
