import {
	AfterViewInit,
	Component,
	HostListener,
	Inject,
	OnInit,
	PLATFORM_ID,
	ViewChild,
	ViewContainerRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { AuthService } from './backend/authentication-service/auth.service';
import { DialogService } from './backend/dialog-service/dialog.service';
import { NotificationService } from './backend/notification-service/notification.service';
import { LOG } from './common/app.logs';
import { MatIconModule } from '@angular/material/icon';
import { ToastModule } from 'primeng/toast';
import { Utilities } from './common/app.utilities';
import {
	APP_BREAKPOINT_COMPACT,
	CN,
	COMPONENT_DESTROY,
	DIALOG_BTN_SIGN_OUT,
	DIALOG_CONFIRM,
	DIALOG_HEADER_SIGN_OUT,
	LS_NAV_COLLAPSED_KEY,
	MSG_LOGOUT_CONFIRM,
	TAURI_CMD_START_DRAGGING,
	TAURI_MODE_CLASS
} from './common/app.constant';
import { Observable, filter } from 'rxjs';
import { BottomNavComponent } from './fontend/navigation/bottom-nav.component';
import { NavItem } from './fontend/navigation/bottom-nav.model';
import {
	NAV_ID_TO_ROUTE,
	NAV_ITEMS,
	PRIMARY_IDS,
	ROUTE_TO_NAV_ID
} from './fontend/navigation/bottom-nav.data';

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
		BottomNavComponent
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
	protected navCompact = false;
	protected navMode: 'side' | 'over' = 'side';
	protected compactOverlayOpen = false;
	protected isTauriApp = false;
	protected readonly navItems: NavItem[] = NAV_ITEMS;
	protected readonly primaryIds: string[] = PRIMARY_IDS;
	protected activeRoute = '';
	protected mobileSignedIn = false;
	protected mobileUserName = '';

	constructor(
		private authService: AuthService,
		private dialogService: DialogService,
		private notificationService: NotificationService,
		private router: Router,
		private utilities: Utilities,
		@Inject(PLATFORM_ID) private platformId: object
	) {
		if (isPlatformBrowser(this.platformId)) {
			this.navCollapsed = localStorage.getItem(LS_NAV_COLLAPSED_KEY) === 'true';
			this.applyViewportState(window.innerWidth);
			this.isTauriApp = '__TAURI_INTERNALS__' in window;
			if (this.isTauriApp) {
				document.body.classList.add(TAURI_MODE_CLASS);
			}
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
			this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
				const url = (event as NavigationEnd).urlAfterRedirects.split('?')[0];
				this.activeRoute = ROUTE_TO_NAV_ID[url] ?? '';
			});
			this.currentUser$.subscribe((user) => {
				this.mobileSignedIn = !!user;
				this.mobileUserName = Utilities.getUserDisplayName(user);
			});
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
	 * Updates the navMobile flag and compact-mode state on every window resize
	 * so the nav drawer and content margin track the viewport correctly.
	 */
	@HostListener('window:resize')
	protected onWindowResize(): void {
		this.applyViewportState(window.innerWidth);
	}

	/**
	 * Applies the correct nav mode for the given viewport width. Called on
	 * construction and on every resize so both paths share the same logic.
	 * navMobile reflects actual mobile-device detection (coarse pointer); compact
	 * mode activates for narrow desktop viewports in the 941–1300px range.
	 * When crossing the compact threshold in either direction, the resulting
	 * navCollapsed state is persisted to localStorage so a refresh reflects it.
	 *
	 * @param width - The current viewport width in pixels.
	 */
	private applyViewportState(width: number): void {
		const isMobileDevice = this.utilities.isMobile();
		const wasCompact = this.navCompact;
		this.navMobile = isMobileDevice;
		if (isMobileDevice || width > APP_BREAKPOINT_COMPACT) {
			this.navCompact = false;
			this.navMode = 'side';
			this.compactOverlayOpen = false;
			if (wasCompact) {
				this.navCollapsed = false;
				if (isPlatformBrowser(this.platformId)) {
					localStorage.setItem(LS_NAV_COLLAPSED_KEY, 'false');
				}
			}
		} else {
			if (!wasCompact) {
				this.navCollapsed = true;
				this.navMode = 'side';
				this.compactOverlayOpen = false;
				if (isPlatformBrowser(this.platformId)) {
					localStorage.setItem(LS_NAV_COLLAPSED_KEY, 'true');
				}
			}
			this.navCompact = true;
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
	 * Removes the push subscription then signs the current user out using the
	 * appropriate service based on the detected country (CloudBase for CN,
	 * Firebase otherwise).
	 */
	protected async logout(): Promise<void> {
		this.accountMenuOpen = false;
		await this.notificationService.unsubscribe().catch(() => {});
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
	 * Toggles the sidebar. In compact mode (941–1300px), collapsed state stays as
	 * mode="side" (65px strip); expanding switches to mode="over" (full overlay).
	 * Outside compact mode, expands or collapses in-place and persists to localStorage.
	 */
	protected toggleNav(): void {
		if (this.navCompact) {
			if (this.compactOverlayOpen) {
				this.navMode = 'side';
				this.compactOverlayOpen = false;
				this.accountMenuOpen = false;
			} else {
				this.navMode = 'over';
				this.compactOverlayOpen = true;
			}
		} else {
			this.navCollapsed = !this.navCollapsed;
			if (this.navCollapsed) {
				this.accountMenuOpen = false;
			}
			if (isPlatformBrowser(this.platformId)) {
				localStorage.setItem(LS_NAV_COLLAPSED_KEY, String(this.navCollapsed));
			}
		}
	}

	/**
	 * Handles clicks on the drawer container. When the compact overlay is open and
	 * the click lands on the Material backdrop element, delegates to toggleNav so
	 * the drawer transitions back to the collapsed side strip — identical to pressing
	 * the top menu button.
	 *
	 * @param event - The MouseEvent from the container click.
	 */
	protected onContainerClick(event: MouseEvent): void {
		if (!this.navCompact || !this.compactOverlayOpen) return;
		if ((event.target as HTMLElement).classList.contains('mat-drawer-backdrop')) {
			this.toggleNav();
		}
	}

	/**
	 * Navigates to the route mapped to the given bottom-nav item id.
	 *
	 * @param id - The bottom-nav item id emitted by the navigate event.
	 */
	protected navigateToRoute(id: string): void {
		const path = NAV_ID_TO_ROUTE[id] ?? '';
		this.router.navigateByUrl(path).catch(() => {});
	}

	/**
	 * Handles the account button click. Opens a sign-out confirmation dialog when
	 * the account row is shown in its collapsed icon form — on mobile, when the nav
	 * is collapsed, or in the compact side strip. When the compact overlay is open
	 * the row is fully expanded, so it toggles the popover menu like the wide-screen
	 * expanded panel.
	 */
	protected handleAccountButtonClick(): void {
		if (!this.compactOverlayOpen && (this.navMobile || this.navCollapsed || this.navCompact)) {
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
	 * Closes the account popover when focus moves outside the account row wrapper.
	 * Compares the event's relatedTarget against the wrapper element so that
	 * interactions within the popover (e.g. focusing the sign-out button) do not
	 * trigger a close.
	 *
	 * @param event - The FocusEvent emitted when a child element loses focus.
	 */
	protected handleAccountMenuDismiss(event: FocusEvent): void {
		if (!this.accountMenuOpen) return;
		const wrapper = event.currentTarget as HTMLElement;
		if (!wrapper.contains(event.relatedTarget as Node)) {
			this.accountMenuOpen = false;
		}
	}

	/**
	 * Initiates a native window drag when the user presses the left mouse button
	 * on a designated drag surface in the Tauri desktop app. Uses the Tauri v2
	 * internal invoke directly because the attribute-based data-tauri-drag-region
	 * mechanism is unreliable inside Angular's zone.js event loop on repeat clicks.
	 *
	 * @param event - The MouseEvent from the mousedown binding on the drag surface.
	 */
	protected startWindowDrag(event: MouseEvent): void {
		if (event.button !== 0) return;
		(window as unknown as { __TAURI_INTERNALS__: { invoke: (cmd: string) => Promise<unknown> } })
			.__TAURI_INTERNALS__.invoke(TAURI_CMD_START_DRAGGING).catch(() => {});
	}

	/**
	 * Opens a sign-out confirmation dialog from the mobile bottom-nav account
	 * popover, matching the behaviour of the desktop sign-out flow.
	 */
	protected handleMobileSignOut(): void {
		this.dialogService.openDialog(this.dialogComponentContainer, DIALOG_CONFIRM, () => this.logout(), [
			MSG_LOGOUT_CONFIRM,
			DIALOG_HEADER_SIGN_OUT,
			DIALOG_BTN_SIGN_OUT
		]);
	}

	// ── Template helpers ──────────────────────────────────────────────────────

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
