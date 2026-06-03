import { Component, Inject, PLATFORM_ID, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { AuthService } from './backend/authentication-service/auth.service';
import { DialogService } from './backend/dialog-service/dialog.service';
import { LOG } from './common/app.logs';
import { MatIconModule } from '@angular/material/icon';
import { ToastModule } from 'primeng/toast';
import { Utilities } from './common/app.utilities';
import { CN, COMPONENT_DESTROY, DIALOG_BTN_SIGN_OUT, DIALOG_HEADER_SIGN_OUT, MSG_LOGOUT_CONFIRM } from './common/app.constant';
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
		ToastModule
	],
	templateUrl: 'app.component.html',
	styleUrl: './app.component.css'
})
export class AppComponent {
	private readonly className = 'AppComponent';

	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;

	protected currentUser$!: Observable<any>;
	protected accountMenuOpen = false;

	constructor(
		private authService: AuthService,
		private dialogService: DialogService,
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
	 * Logs the component destruction event and clears the dialog container.
	 */
	ngOnDestroy(): void {
		this.dialogComponentContainer?.clear();
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
		this.accountMenuOpen = false;
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

	/**
	 * Toggles the account popover menu open or closed.
	 */
	protected toggleAccountMenu(): void {
		this.accountMenuOpen = !this.accountMenuOpen;
	}

	/**
	 * Returns true when the viewport width is at or below the mobile breakpoint
	 * where the sidebar collapses to icon-only mode.
	 *
	 * @returns True if the current viewport is mobile-width.
	 */
	protected isMobileView(): boolean {
		return isPlatformBrowser(this.platformId) && window.innerWidth <= 1100;
	}

	/**
	 * Handles the account button click. On mobile, opens a sign-out confirmation
	 * dialog instead of toggling the popover menu.
	 */
	protected handleAccountButtonClick(): void {
		if (this.isMobileView()) {
			this.dialogService.openDialog(
				this.dialogComponentContainer,
				'confirm',
				() => this.logout(),
				[MSG_LOGOUT_CONFIRM, DIALOG_HEADER_SIGN_OUT, DIALOG_BTN_SIGN_OUT]
			);
			return;
		}
		this.toggleAccountMenu();
	}

	/**
	 * Gets the display name for the signed-in user, using the CloudBase username
	 * for CN users and the Firebase displayName otherwise.
	 *
	 * @param user - The authenticated user object from the auth observable.
	 * @returns The user's display name, or an empty string if unavailable.
	 */
	protected getUserDisplayName(user: any): string {
		if (this.isCN()) {
			return user.user_metadata?.username ?? '';
		}
		return user.displayName ?? '';
	}

	/**
	 * Gets the first character of the user's display name, uppercased, for use
	 * as an avatar monogram.
	 *
	 * @param user - The authenticated user object from the auth observable.
	 * @returns The uppercased first character of the display name, or an empty string.
	 */
	protected getUserInitial(user: any): string {
		return this.getUserDisplayName(user).charAt(0).toUpperCase();
	}
}
