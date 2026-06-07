import { AfterViewInit, Component, HostListener, Inject, OnInit, PLATFORM_ID, ViewChild, ViewContainerRef } from '@angular/core';
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
import {
	CN,
	COMPONENT_DESTROY,
	DIALOG_BTN_SIGN_OUT,
	DIALOG_CONFIRM,
	DIALOG_HEADER_SIGN_OUT,
	LS_NAV_COLLAPSED_KEY,
	MSG_LOGOUT_CONFIRM
} from './common/app.constant';
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
export class AppComponent implements OnInit, AfterViewInit {
	private readonly className = 'AppComponent';
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	protected currentUser$!: Observable<any>;
	protected accountMenuOpen = false;
	protected navCollapsed = false;
	protected navMobile = false;
	protected navReady = false;

	constructor(
		private authService: AuthService,
		private dialogService: DialogService,
		private router: Router,
		private utilities: Utilities,
		@Inject(PLATFORM_ID) private platformId: object
	) {
		if (isPlatformBrowser(this.platformId)) {
			this.navCollapsed = localStorage.getItem(LS_NAV_COLLAPSED_KEY) === 'true';
		}
	}

	/**
	 * Initialises the component and subscribes to the auth state observable.
	 * The nav-collapsed state is restored in the constructor so it applies
	 * before the first render and avoids an expand-then-collapse flash.
	 */
	ngOnInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.currentUser$ = this.authService.getCurrentUser();
			this.navMobile = this.utilities.isMobile();
		}
	}

	/**
	 * Enables the nav width transition after the first frame so the initial
	 * collapsed state is applied without animation on page load.
	 */
	ngAfterViewInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			setTimeout(() => {
				this.navReady = true;
			});
		}
	}

	/**
	 * Clears the dialog container and logs component teardown.
	 */
	ngOnDestroy(): void {
		this.dialogComponentContainer?.clear();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	/**
	 * Updates the mobile breakpoint flag on every window resize so the
	 * content margin tracks the viewport width without relying on CSS @media
	 * competing against Angular's scoped element selectors.
	 */
	@HostListener('window:resize')
	protected onWindowResize(): void {
		const isMobileWidth = this.utilities.isMobile();
		if (isMobileWidth !== this.navMobile) {
			this.navMobile = isMobileWidth;
		}
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
	 * Toggles the navigation sidebar between its expanded and icon-only collapsed states.
	 * Persists the collapsed state to localStorage so it survives page reloads.
	 */
	protected toggleNav(): void {
		this.navCollapsed = !this.navCollapsed;
		if (this.navCollapsed) {
			this.accountMenuOpen = false;
		}
		if (isPlatformBrowser(this.platformId)) {
			localStorage.setItem(LS_NAV_COLLAPSED_KEY, String(this.navCollapsed));
		}
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
	 * Handles the account button click. On mobile or when the nav is collapsed,
	 * opens a sign-out confirmation dialog. Otherwise toggles the popover menu.
	 */
	protected handleAccountButtonClick(): void {
		if (this.isMobileView() || this.navCollapsed) {
			this.dialogService.openDialog(
				this.dialogComponentContainer,
				DIALOG_CONFIRM,
				() => this.logout(),
				[MSG_LOGOUT_CONFIRM, DIALOG_HEADER_SIGN_OUT, DIALOG_BTN_SIGN_OUT]
			);
			return;
		}
		this.toggleAccountMenu();
	}

	/**
	 * Gets the display name for the signed-in user.
	 *
	 * @param user - The authenticated user object from the auth observable.
	 * @returns The user's display name, or an empty string if unavailable.
	 */
	protected getUserDisplayName(user: any): string {
		return Utilities.getUserDisplayName(user);
	}

	/**
	 * Gets the first character of the user's display name, uppercased, for use
	 * as an avatar monogram.
	 *
	 * @param user - The authenticated user object from the auth observable.
	 * @returns The uppercased first character of the display name, or an empty string.
	 */
	protected getUserInitial(user: any): string {
		return Utilities.getUserDisplayName(user).charAt(0).toUpperCase();
	}

}
