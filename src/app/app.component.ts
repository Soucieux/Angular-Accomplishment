import {
	AfterViewInit,
	Component,
	ElementRef,
	HostListener,
	Inject,
	NgZone,
	OnDestroy,
	OnInit,
	PLATFORM_ID,
	ViewChild,
	ViewContainerRef,
	isDevMode
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { AuthService } from './backend/authentication-service/auth.service';
import { DialogService } from './backend/dialog-service/dialog.service';
import { NotificationService } from './backend/notification-service/notification.service';
import { NotificationSchedulerService } from './backend/notification-service/notification-scheduler.service';
import { LOG } from './common/app.logs';
import { MatIconModule } from '@angular/material/icon';
import { ToastModule } from 'primeng/toast';
import { Utilities } from './common/utilities/app.utilities';
import {
	APP_BREAKPOINT_COMPACT,
	CN,
	COMPONENT_DESTROY,
	CTX_COLOR_CLIPBOARD,
	CTX_COLOR_MY_ACCOUNT,
	CTX_COLOR_SIGN_IN,
	CTX_COLOR_SIGN_OUT,
	CTX_COLOR_INSPECT,
	CTX_ICON_COPY,
	CTX_ICON_CUT,
	CTX_ICON_MY_ACCOUNT,
	CTX_ICON_PASTE,
	CTX_ICON_SELECT_ALL,
	CTX_ICON_SIGN_IN,
	CTX_ICON_SIGN_OUT,
	CTX_ICON_INSPECT,
	CTX_LABEL_COPY,
	CTX_LABEL_CUT,
	CTX_LABEL_MY_ACCOUNT,
	CTX_LABEL_PASTE,
	CTX_LABEL_SELECT_ALL,
	CTX_LABEL_SIGN_IN,
	CTX_LABEL_SIGN_OUT,
	CTX_LABEL_INSPECT,
	ACCOUNT_TITLE_PAGE,
	NAV_NOTIF_LABEL_DISABLE,
	NAV_NOTIF_LABEL_ENABLE,
	NAV_NOTIF_TOGGLE_ERROR,
	DIALOG_BTN_SIGN_OUT,
	DIALOG_CONFIRM,
	DIALOG_HEADER_SIGN_OUT,
	LS_NAV_COLLAPSED_KEY,
	MSG_LOGOUT_CONFIRM,
	TAURI_MODE_CLASS
} from './common/app.constant';
import {
	ContextMenuAction,
	DesktopContextMenuComponent
} from './fontend/desktop-context-menu/context-menu.component';
import { readText } from '@tauri-apps/api/clipboard';
import { invoke } from '@tauri-apps/api/tauri';
import { Observable, filter } from 'rxjs';
import { BottomNavComponent } from './fontend/mobile-bottom-nav/bottom-nav.component';
import { NavItem } from './fontend/mobile-bottom-nav/bottom-nav.model';
import {
	NAV_ID_TO_ROUTE,
	NAV_ITEMS,
	PRIMARY_IDS,
	ROUTE_TO_NAV_ID
} from './fontend/mobile-bottom-nav/bottom-nav.data';

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
		BottomNavComponent,
		DesktopContextMenuComponent
	],
	templateUrl: 'app.component.html',
	styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
	private readonly className = 'AppComponent';
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	@ViewChild('accountRowWrapper')
	private accountRowWrapper?: ElementRef<HTMLElement>;
	protected currentUser$!: Observable<any>;
	protected accountMenuOpen = false;
	protected navCollapsed = false;
	protected navMobile = false;
	protected navReady = false;
	protected navCompact = false;
	protected navMode: 'side' | 'over' = 'side';
	protected compactOverlayOpen = false;
	protected isTauriApp = false;
	private tauriAppWindow: { startDragging: () => Promise<void> } | null = null;
	private notifInitialized = false;
	protected ctxVisible = false;
	protected ctxX = 0;
	protected ctxY = 0;
	protected ctxActions: ContextMenuAction[] = [];
	private ctxSavedSelection: {
		el: HTMLInputElement | HTMLTextAreaElement;
		start: number | null;
		end: number | null;
	} | null = null;
	private readonly ctxNavItems = NAV_ITEMS.filter((item) => ['home', 'reminder'].includes(item.id));
	protected readonly ACCOUNT_TITLE_PAGE = ACCOUNT_TITLE_PAGE;
	protected readonly NAV_NOTIF_LABEL_ENABLE = NAV_NOTIF_LABEL_ENABLE;
	protected readonly NAV_NOTIF_LABEL_DISABLE = NAV_NOTIF_LABEL_DISABLE;
	protected readonly notifSubscribed = toSignal(this.notificationService.isSubscribed$, {
		initialValue: false
	});
	protected readonly navItems: NavItem[] = NAV_ITEMS;
	protected readonly primaryIds: string[] = PRIMARY_IDS;
	protected activeRoute = '';
	protected mobileSignedIn = false;
	protected mobileUserName = '';

	constructor(
		private authService: AuthService,
		private dialogService: DialogService,
		private notificationService: NotificationService,
		private notificationScheduler: NotificationSchedulerService,
		private router: Router,
		private ngZone: NgZone,
		private utilities: Utilities,
		@Inject(PLATFORM_ID) private platformId: object
	) {
		if (isPlatformBrowser(this.platformId)) {
			this.navCollapsed = localStorage.getItem(LS_NAV_COLLAPSED_KEY) === 'true';
			this.applyViewportState(window.innerWidth);
			this.isTauriApp = '__TAURI__' in window;
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
			// Step 1: Lazily import the Tauri window API so the bundle stays tree-shakeable
			// in browser builds — the import resolves after init, so drag is unavailable for
			// the first few ms but that is acceptable (no synchronous Tauri calls occur on load).
			if (this.isTauriApp) {
				import('@tauri-apps/api/window')
					.then(({ appWindow }) => {
						this.tauriAppWindow = appWindow;
					})
					.catch(() => {});
			}

			// Step 2: Wire the auth observable and track the active route for the bottom nav
			this.currentUser$ = this.authService.getCurrentUser();
			this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
				const url = (event as NavigationEnd).urlAfterRedirects.split('?')[0];
				this.activeRoute = ROUTE_TO_NAV_ID[url] ?? '';
			});

			// Step 3: Mirror auth state into plain fields used by the mobile nav template
			this.currentUser$.subscribe((user) => {
				this.mobileSignedIn = !!user;
				this.mobileUserName = Utilities.capitalizeFirstLetterOnEachWord(
					Utilities.getUserDisplayName(user)
				);
				if (user && this.isTauriApp && !this.notifInitialized) {
					this.notifInitialized = true;
					this.notificationService.init().catch(() => {});
				}
			});

			/* Step 4: Register a capture-phase scroll listener outside Angular's zone so it
			   does not trigger change detection on every scroll tick; re-enters the zone only
			   when the context menu is actually open and needs to be dismissed. */
			this.ngZone.runOutsideAngular(() => {
				document.addEventListener(
					'scroll',
					() => {
						if (this.ctxVisible) this.ngZone.run(() => this.closeCtxMenu());
					},
					{ capture: true, passive: true }
				);
			});

			// Step 5: Start the notification scheduler — scans immediately on subscription
			// and arms the daily background check for when the app stays open.
			this.notificationScheduler.start();
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
	 * Clears the dialog container, cancels the notification timers, and logs component teardown.
	 */
	ngOnDestroy(): void {
		this.notificationScheduler.stop();
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
	 * Handles all document mousedown events. Closes the account popover when a
	 * left-click lands outside the account row wrapper, initiates a native window
	 * drag when a left-click lands in the 30px header zone (so drag works even when
	 * a modal mask covers the header), and saves the current text selection state
	 * before a right-click fires so onContextMenu can restore the cursor position
	 * after WKWebView's native auto-select fires.
	 *
	 * @param event - The MouseEvent from the document mousedown listener.
	 */
	@HostListener('document:mousedown', ['$event'])
	protected onDocumentMouseDown(event: MouseEvent): void {
		// Step 1: Collapse the account popover on any outside left-click
		if (
			this.accountMenuOpen &&
			this.accountRowWrapper &&
			!this.accountRowWrapper.nativeElement.contains(event.target as Node)
		) {
			this.accountMenuOpen = false;
		}

		// Step 2: Trigger native window drag when the user presses in the 30px title-bar zone
		if (this.isTauriApp && event.button === 0 && event.clientY < 30) {
			this.tauriAppWindow?.startDragging().catch(() => {});
		}

		/* Step 3: Snapshot the text-field selection BEFORE the right-click fires so it can
		   be restored in onContextMenu — WKWebView auto-selects the word under the pointer
		   on right-click, which loses the user's original cursor position. */
		if (this.isTauriApp && event.button === 2) {
			const target = event.target as HTMLElement;
			if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
				this.ctxSavedSelection = {
					el: target,
					start: target.selectionStart,
					end: target.selectionEnd
				};
			}
		}
	}

	/**
	 * Intercepts the native browser context menu on right-click and replaces it
	 * with the custom overlay. Active only when running inside Tauri. Builds
	 * clipboard actions when the right-clicked target is an input or textarea
	 * (paste uses the Tauri clipboard plugin to avoid the macOS native confirmation
	 * popup), appends Home and Reminder nav shortcuts, and ends with a sign-in or
	 * sign-out action.
	 *
	 * @param event - The MouseEvent from the document contextmenu listener.
	 */
	@HostListener('document:contextmenu', ['$event'])
	protected onContextMenu(event: MouseEvent): void {
		if (!this.isTauriApp) return;
		event.preventDefault();
		const target = event.target as HTMLElement;
		const isInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

		/* Step 1: Restore the pre-right-click selection that was snapshotted in
		   onDocumentMouseDown — must happen before building actions so that execCommand
		   operations run against the correct range. */
		if (this.ctxSavedSelection) {
			const { el, start, end } = this.ctxSavedSelection;
			el.selectionStart = start;
			el.selectionEnd = end;
			this.ctxSavedSelection = null;
		}

		const actions: ContextMenuAction[] = [];

		/* Step 2: Add clipboard actions when the target is an editable field.
		   Paste uses the Tauri clipboard API instead of document.execCommand because
		   macOS WKWebView blocks execCommand('paste') and shows a system permission
		   dialog — reading from the Tauri plugin bypasses that prompt entirely. */
		if (isInput) {
			const inputEl = target as HTMLInputElement | HTMLTextAreaElement;
			actions.push(
				{
					label: CTX_LABEL_COPY,
					icon: CTX_ICON_COPY,
					color: CTX_COLOR_CLIPBOARD,
					execute: () => document.execCommand('copy')
				},
				{
					label: CTX_LABEL_CUT,
					icon: CTX_ICON_CUT,
					color: CTX_COLOR_CLIPBOARD,
					execute: () => document.execCommand('cut')
				},
				{
					label: CTX_LABEL_PASTE,
					icon: CTX_ICON_PASTE,
					color: CTX_COLOR_CLIPBOARD,
					execute: () =>
						readText()
							.then((text) => {
								const start = inputEl.selectionStart ?? inputEl.value.length;
								const end = inputEl.selectionEnd ?? start;
								inputEl.value =
									inputEl.value.slice(0, start) + text + inputEl.value.slice(end);
								inputEl.selectionStart = inputEl.selectionEnd = start + (text ?? '').length;
								inputEl.dispatchEvent(new Event('input', { bubbles: true }));
							})
							.catch(() => {})
				},
				{
					label: CTX_LABEL_SELECT_ALL,
					icon: CTX_ICON_SELECT_ALL,
					color: CTX_COLOR_CLIPBOARD,
					execute: () => inputEl.select()
				}
			);
		}

		// Step 3: Append quick-nav shortcuts (Home, Reminder); the first one gets a separator
		// when clipboard actions precede it so the groups are visually distinct.
		for (const [i, item] of this.ctxNavItems.entries()) {
			actions.push({
				label: item.label,
				icon: item.icon,
				color: item.grad!,
				execute: () => this.navigateToRoute(item.id),
				separator: isInput && i === 0 ? true : undefined
			});
		}

		// Step 4: Append the auth action — My Account + Sign Out when signed in, Sign In otherwise
		if (this.mobileSignedIn) {
			actions.push(
				{
					label: CTX_LABEL_MY_ACCOUNT,
					icon: CTX_ICON_MY_ACCOUNT,
					color: CTX_COLOR_MY_ACCOUNT,
					execute: () => this.router.navigate(['/account']).catch(() => {}),
					separator: true
				},
				{
					label: CTX_LABEL_SIGN_OUT,
					icon: CTX_ICON_SIGN_OUT,
					color: CTX_COLOR_SIGN_OUT,
					execute: () =>
						this.dialogService.openDialog(
							this.dialogComponentContainer,
							DIALOG_CONFIRM,
							() => this.logout(),
							[MSG_LOGOUT_CONFIRM, DIALOG_HEADER_SIGN_OUT, DIALOG_BTN_SIGN_OUT]
						)
				}
			);
		} else {
			actions.push({
				label: CTX_LABEL_SIGN_IN,
				icon: CTX_ICON_SIGN_IN,
				color: CTX_COLOR_SIGN_IN,
				execute: () => this.navigateToLogin(),
				separator: true
			});
		}

		// Step 5: Append Inspect (DevTools) only in development builds
		if (isDevMode()) {
			actions.push({
				label: CTX_LABEL_INSPECT,
				icon: CTX_ICON_INSPECT,
				color: CTX_COLOR_INSPECT,
				execute: () => invoke('open_devtools').catch(() => {}),
				separator: true
			});
		}

		/* Step 6: Clamp the menu position so it never overflows the viewport edge —
		   220px and 280px are the approximate max width and height of the overlay. */
		this.ctxX = Math.min(event.clientX, window.innerWidth - 220);
		this.ctxY = Math.min(event.clientY, window.innerHeight - 280);
		this.ctxActions = actions;
		this.ctxVisible = true;
	}

	/**
	 * Closes the custom context menu overlay.
	 */
	protected closeCtxMenu(): void {
		this.ctxVisible = false;
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
		// Step 1: Capture current compact state before mutating so transition guards work correctly
		const isMobileDevice = this.utilities.isMobile();
		const wasCompact = this.navCompact;
		this.navMobile = isMobileDevice;

		if (isMobileDevice || width > APP_BREAKPOINT_COMPACT) {
			// Step 2: Exit compact mode — reset overlay and mode, then expand the nav if it was
			// previously auto-collapsed by compact mode (wasCompact guard prevents overwriting a
			// user-intentional collapse that happened while already in wide/mobile mode).
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
			/* Step 3: Enter compact mode — auto-collapse and persist only on the first crossing
			   (!wasCompact) so that subsequent resize events within the compact range do not
			   fight the user if they manually expanded the overlay. */
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
	 * Subscribes to Tauri notifications when not yet subscribed, or unsubscribes
	 * when already subscribed.
	 */
	protected async toggleNotification(): Promise<void> {
		try {
			if (this.notifSubscribed()) {
				await this.notificationService.unsubscribe();
			} else {
				await this.notificationService.subscribe();
			}
		} catch (error: unknown) {
			LOG.error(
				this.className,
				NAV_NOTIF_TOGGLE_ERROR,
				error instanceof Error ? error : new Error('Unexpected error')
			);
		}
	}

	/**
	 * Navigates to the account page and closes the account popover.
	 */
	protected navigateToAccount(): void {
		this.accountMenuOpen = false;
		this.router.navigate(['/account']).catch(() => {});
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
		// Step 1: Close the account popover immediately so the UI does not appear frozen
		this.accountMenuOpen = false;

		// Step 2: Remove the push subscription before signing out — errors are silently ignored
		// because a stale subscription is harmless and must not block the sign-out flow.
		await this.notificationService.unsubscribe().catch(() => {});

		/* Step 3: Route to the correct sign-out method based on region — CloudBase (CN)
		   uses an async signOut(); Firebase uses a synchronous-style logout() wrapper. */
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
			/* Step 1 (compact mode): Switch between the collapsed side-strip (mode="side") and
			   the full-width overlay (mode="over") instead of changing navCollapsed — the strip
			   always stays visible at 65px, so "collapsed" has no meaning here. The account
			   popover is also closed because it would render off-screen under the closed strip. */
			if (this.compactOverlayOpen) {
				this.navMode = 'side';
				this.compactOverlayOpen = false;
				this.accountMenuOpen = false;
			} else {
				this.navMode = 'over';
				this.compactOverlayOpen = true;
			}
		} else {
			// Step 2 (normal mode): Toggle collapsed state and persist it so a page refresh
			// restores the user's preferred width without a layout flash.
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
	 * on a designated drag surface in the Tauri desktop app. Delegates to the
	 * pre-cached appWindow reference loaded in ngOnInit, avoiding per-call import
	 * overhead and the unreliable attribute-based data-tauri-drag-region mechanism.
	 *
	 * @param event - The MouseEvent from the mousedown binding on the drag surface.
	 */
	protected startWindowDrag(event: MouseEvent): void {
		if (event.button !== 0) return;
		this.tauriAppWindow?.startDragging().catch(() => {});
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
	 * Gets whether push notifications are supported in the current runtime.
	 * Evaluated as a getter so it always reflects the live browser context
	 * rather than the SSR server context at component construction time.
	 *
	 * @returns True when notifications can be requested on this platform.
	 */
	protected get notifSupported(): boolean {
		return this.notificationService.isSupported();
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
	 * Gets the avatar image URL from the user object, checking both CloudBase fields.
	 *
	 * @param user - The authenticated user object from the auth observable.
	 * @returns The avatar URL string, or an empty string if no photo is set.
	 */
	protected getUserAvatarUrl(user: any): string {
		return Utilities.getUserAvatarUrl(user);
	}

	/**
	 * Gets the first character of the user's display name, uppercased,
	 * for use as an avatar monogram.
	 *
	 * @param user - The authenticated user object from the auth observable.
	 * @returns The uppercased first character, or an empty string.
	 */
	protected getUserInitial(user: any): string {
		return Utilities.getUserInitials(user).charAt(0);
	}
}
