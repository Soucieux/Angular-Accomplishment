import { AfterViewInit, Component, Inject, PLATFORM_ID, ViewChild, ViewContainerRef } from '@angular/core';
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
import { CN, COMPONENT_DESTROY, DIALOG_BTN_SIGN_OUT, DIALOG_CONFIRM, DIALOG_HEADER_SIGN_OUT, LS_NAV_COLLAPSED_KEY, MSG_LOGOUT_CONFIRM } from './common/app.constant';
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
export class AppComponent implements AfterViewInit {
	private readonly className = 'AppComponent';

	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;

	protected currentUser$!: Observable<any>;
	protected accountMenuOpen = false;
	protected navCollapsed = false;
	protected navReady = false;
	private drawerResizeObserver?: ResizeObserver;

	constructor(
		private authService: AuthService,
		private dialogService: DialogService,
		private router: Router,
		@Inject(PLATFORM_ID) private platformId: object
	) {
		if (isPlatformBrowser(this.platformId)) {
			this.navCollapsed = localStorage.getItem(LS_NAV_COLLAPSED_KEY) === 'true';
		}
	}

	/**
	 * Initialises the component and subscribes to the auth state observable,
	 * assigning the appropriate user stream based on the detected country.
	 * The nav-collapsed state is restored in the constructor so it applies
	 * before the first render and avoids an expand-then-collapse flash.
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
	 * Attaches the ResizeObserver that syncs the drawer content margin to the
	 * drawer width on every frame, so both panels animate simultaneously.
	 * Enables the nav width transition after the first frame so the initial
	 * collapsed state is applied without animation on page load.
	 */
	ngAfterViewInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.initDrawerResizeSync();
			setTimeout(() => {
				this.navReady = true;
			});
		}
	}

	/**
	 * Disconnects the drawer ResizeObserver, clears the dialog container,
	 * and logs component teardown.
	 */
	ngOnDestroy(): void {
		this.drawerResizeObserver?.disconnect();
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

	/**
	 * Attaches a ResizeObserver to the mat-drawer and writes the drawer's animated
	 * width to the --drawer-width CSS custom property on document root each frame.
	 * Placing the property on documentElement ensures it survives Angular HMR, which
	 * clears inline styles on component DOM nodes during style reconciliation.
	 * mat-drawer-content reads this via var() with !important, permanently beating
	 * Material's own inline-style margin-left binding after auth state changes.
	 */
	private initDrawerResizeSync(): void {
		const drawer = document.querySelector('mat-drawer') as HTMLElement;
		if (!drawer) return;
		const sync = () => { document.documentElement.style.setProperty('--drawer-width', `${drawer.offsetWidth}px`); };
		sync();
		requestAnimationFrame(sync);
		this.drawerResizeObserver = new ResizeObserver(sync);
		this.drawerResizeObserver.observe(drawer);
	}
}
