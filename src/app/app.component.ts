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
	isDevMode,
	signal
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { DatabaseService } from './backend/database-service/database.service';
import { AuthService } from './backend/authentication-service/auth.service';
import { LocaleService } from './common/locale/locale.service';
import { DialogService } from './backend/dialog-service/dialog.service';
import { NotificationService } from './backend/notification-service/notification.service';
import { NotificationSchedulerService } from './backend/notification-service/notification-scheduler.service';
import { LOG } from './common/app.logs';
import { MatIconModule } from '@angular/material/icon';
import { ToastModule } from 'primeng/toast';
import { Utilities } from './common/utilities/app.utilities';
import {
	APP_BREAKPOINT_COMPACT,
	ACCOUNT_ROUTE_PATH,
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
	DIALOG_CONFIRM,
	GUIDE_DIRECTORY_PAGE,
	GUIDE_LANGUAGE_QUERY_PARAM,
	GUIDE_LAUNCHER_ICON,
	GUIDE_PAGE_QUERY_PARAM,
	GUIDE_PUBLIC_WEB_ORIGIN,
	GUIDE_ROUTE_PATH,
	LOGIN_ROUTE_PATH,
	LOGIN_URL_DEFAULT_RETURN,
	PUBLIC_ROUTE_PATHS,
	LS_NAV_COLLAPSED_KEY,
	LS_LOCALE_KEY,
	TAURI_MODE_CLASS,
	CAPACITOR_MODE_CLASS,
	IOS_SAFE_AREA_CLASS,
	TAURI_CMD_SET_MINIMIZE_ON_CLOSE,
	LOCALE_EN_BODY_CLASS,
	NAV_LOCALE_SWITCH_TO_ZH,
	NAV_LOCALE_SWITCH_TO_EN,
	RECOVERY_INACTIVITY_THRESHOLD_MS,
	RECOVERY_STATUS_EXPIRED,
	RECOVERY_STATUS_OFFLINE,
	RECOVERY_STATUS_RECOVERED,
	RECOVERY_TRIGGER_ONLINE,
	RECOVERY_TRIGGER_RESUME,
	RECOVERY_TRIGGER_STARTUP,
	RECOVERY_TRIGGER_WATCH_ERROR,
	RECOVERY_TRIGGER_WRITE_ERROR,
	WINDOW_EVENT_BLUR,
	WINDOW_EVENT_FOCUS,
	WINDOW_EVENT_ONLINE
} from './common/constants';
import {
	CTX_LABEL_COPY,
	CTX_LABEL_CUT,
	CTX_LABEL_MY_ACCOUNT,
	CTX_LABEL_PASTE,
	CTX_LABEL_SELECT_ALL,
	CTX_LABEL_INSPECT,
	ACCOUNT_TITLE_PAGE,
	NAV_NOTIF_LABEL_DISABLE,
	NAV_NOTIF_LABEL_ENABLE,
	NAV_NOTIF_TOGGLE_ERROR,
	NAV_LABEL_MENU,
	NAV_LABEL_HOME,
	NAV_LABEL_TODAY,
	NAV_LABEL_PORTAL,
	NAV_LABEL_RESONANCE,
	NAV_LABEL_RECIPES,
	NAV_LABEL_ENTERTAINMENT,
	NAV_LABEL_REMINDER,
	NAV_LABEL_DEBT_SONATA,
	NAV_LABEL_PATCH_NOTES,
	NAV_LABEL_ABOUT,
	NAV_LABEL_GUIDE,
	NAV_LABEL_VAULT,
	NAV_LABEL_SIGN_OUT,
	NAV_LABEL_SIGN_IN,
	NAV_STATUS_OFFLINE,
	NAV_ARIA_OPEN_GUIDE,
	LABEL_ONLINE,
	DIALOG_BTN_SIGN_OUT,
	MSG_LOGOUT_CONFIRM,
	NAV_MINIMIZE_ON_CLOSE_ENABLE,
	NAV_MINIMIZE_ON_CLOSE_DISABLE,
	ACTIVE_LOCALE
} from './common/locale/locale-strings';
import { DesktopContextMenuComponent } from './fontend/desktop-context-menu/context-menu.component';
import { ContextMenuAction } from './fontend/desktop-context-menu/context-menu.model';
import { readText } from '@tauri-apps/plugin-clipboard-manager';
import { invoke } from '@tauri-apps/api/core';
import type { UnlistenFn } from '@tauri-apps/api/event';
import type { Window as TauriWindow } from '@tauri-apps/api/window';
import { Observable, Subscription, filter } from 'rxjs';
import { BottomNavComponent } from './fontend/mobile-bottom-nav/bottom-nav.component';
import { NavItem } from './fontend/mobile-bottom-nav/bottom-nav.model';
import {
	NAV_ID_TO_ROUTE,
	NAV_ITEMS,
	PRIMARY_IDS,
	ROUTE_TO_NAV_ID
} from './fontend/mobile-bottom-nav/bottom-nav.data';
import { SessionRecoveryService } from './backend/session-recovery/session-recovery.service';
import { RecoveryStatus, RecoveryTrigger } from './backend/session-recovery/session-recovery.model';

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
	protected readonly ACCOUNT_TITLE_PAGE = ACCOUNT_TITLE_PAGE;
	protected readonly NAV_NOTIF_LABEL_ENABLE = NAV_NOTIF_LABEL_ENABLE;
	protected readonly NAV_NOTIF_LABEL_DISABLE = NAV_NOTIF_LABEL_DISABLE;
	protected readonly NAV_MINIMIZE_ON_CLOSE_ENABLE = NAV_MINIMIZE_ON_CLOSE_ENABLE;
	protected readonly NAV_MINIMIZE_ON_CLOSE_DISABLE = NAV_MINIMIZE_ON_CLOSE_DISABLE;
	protected readonly NAV_LABEL_MENU = NAV_LABEL_MENU;
	protected readonly NAV_LABEL_HOME = NAV_LABEL_HOME;
	protected readonly NAV_LABEL_TODAY = NAV_LABEL_TODAY;
	protected readonly NAV_LABEL_PORTAL = NAV_LABEL_PORTAL;
	protected readonly NAV_LABEL_RESONANCE = NAV_LABEL_RESONANCE;
	protected readonly NAV_LABEL_RECIPES = NAV_LABEL_RECIPES;
	protected readonly NAV_LABEL_ENTERTAINMENT = NAV_LABEL_ENTERTAINMENT;
	protected readonly NAV_LABEL_REMINDER = NAV_LABEL_REMINDER;
	protected readonly NAV_LABEL_DEBT_SONATA = NAV_LABEL_DEBT_SONATA;
	protected readonly NAV_LABEL_PATCH_NOTES = NAV_LABEL_PATCH_NOTES;
	protected readonly NAV_LABEL_ABOUT = NAV_LABEL_ABOUT;
	protected readonly NAV_LABEL_GUIDE = NAV_LABEL_GUIDE;
	protected readonly NAV_LABEL_VAULT = NAV_LABEL_VAULT;
	protected readonly NAV_ARIA_OPEN_GUIDE = NAV_ARIA_OPEN_GUIDE;
	protected readonly GUIDE_LAUNCHER_ICON = GUIDE_LAUNCHER_ICON;
	protected readonly NAV_LABEL_SIGN_OUT = NAV_LABEL_SIGN_OUT;
	protected readonly NAV_LABEL_SIGN_IN = NAV_LABEL_SIGN_IN;
	protected readonly LABEL_ONLINE = LABEL_ONLINE;
	protected readonly NAV_STATUS_OFFLINE = NAV_STATUS_OFFLINE;
	protected readonly localeSwitchLabel: string =
		this.localeService.currentLocale === 'en' ? NAV_LOCALE_SWITCH_TO_ZH : NAV_LOCALE_SWITCH_TO_EN;
	protected readonly notifSubscribed = this.notificationService.isSubscribed;
	protected readonly navItems: NavItem[] = NAV_ITEMS;
	protected readonly primaryIds: string[] = PRIMARY_IDS;
	protected currentUser$!: Observable<any>;
	protected accountMenuOpen = false;
	protected navCollapsed = false;
	protected navMobile = false;
	protected navReady = false;
	protected navCompact = false;
	protected navMode: 'side' | 'over' = 'side';
	protected compactOverlayOpen = false;
	protected isTauriApp = false;
	protected isCapacitorApp = false;
	protected isStandalonePwa = false;
	private tauriAppWindow: TauriWindow | null = null;
	private tauriEventUnlistenFunctions: UnlistenFn[] = [];
	private inactivityStartedAt?: number;
	private confirmedExpiryPending = false;
	private recoveryOutcomePromise?: Promise<void>;
	private logoutPromise?: Promise<void>;
	private routerEventsSubscription?: Subscription;
	private currentUserSubscription?: Subscription;
	private sessionExpiredSubscription?: Subscription;
	private watchErrorsSubscription?: Subscription;
	private writeErrorsSubscription?: Subscription;
	private documentScrollListener?: () => void;
	private navReadyTimeout?: ReturnType<typeof setTimeout>;
	private isDestroyed = false;
	private userInitialized = false;
	protected contextMenuVisible = false;
	protected contextMenuX = 0;
	protected contextMenuY = 0;
	protected contextMenuActions: ContextMenuAction[] = [];
	private contextMenuSavedSelection: {
		element: HTMLInputElement | HTMLTextAreaElement;
		start: number | null;
		end: number | null;
	} | null = null;
	private readonly contextMenuNavItems = NAV_ITEMS.filter((item) =>
		['home', 'reminder'].includes(item.id)
	);
	protected minimizeOnClose = signal(true);
	protected activeRoute = '';
	protected mobileSignedIn = false;
	protected mobileUserName = '';

	constructor(
		private databaseService: DatabaseService,
		private authService: AuthService,
		private sessionRecoveryService: SessionRecoveryService,
		private dialogService: DialogService,
		private notificationService: NotificationService,
		private notificationScheduler: NotificationSchedulerService,
		private localeService: LocaleService,
		private router: Router,
		private ngZone: NgZone,
		private utilities: Utilities,
		@Inject(PLATFORM_ID) private platformId: object
	) {
		if (isPlatformBrowser(this.platformId)) {
			this.navCollapsed = localStorage.getItem(LS_NAV_COLLAPSED_KEY) === 'true';
			this.applyViewportState(window.innerWidth);
			this.isTauriApp = this.utilities.isTauriApp();
			if (this.isTauriApp) {
				document.body.classList.add(TAURI_MODE_CLASS);
			}
			this.isCapacitorApp = this.utilities.isCapacitorApp();
			if (this.isCapacitorApp) {
				document.body.classList.add(CAPACITOR_MODE_CLASS);
			}
			this.isStandalonePwa = this.utilities.isStandalonePwa();
			if (this.isCapacitorApp || (this.isStandalonePwa && this.utilities.isMobile())) {
				document.body.classList.add(IOS_SAFE_AREA_CLASS);
			}
			if (ACTIVE_LOCALE === 'en') {
				document.body.classList.add(LOCALE_EN_BODY_CLASS);
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
			/* Step 1: Starts auth and database recovery before routed pages rely on their existing
			   seven-second fresh-data guards, then routes watcher failures through the same workflow. */
			this.sessionExpiredSubscription = this.authService.getSessionExpired$().subscribe(() => {
				this.triggerSessionRecovery(RECOVERY_TRIGGER_WATCH_ERROR, true);
			});
			this.watchErrorsSubscription = this.databaseService.getWatchErrors$().subscribe(() => {
				this.triggerSessionRecovery(RECOVERY_TRIGGER_WATCH_ERROR);
			});
			this.writeErrorsSubscription = this.databaseService.getWriteErrors$().subscribe(() => {
				this.triggerSessionRecovery(RECOVERY_TRIGGER_WRITE_ERROR);
			});
			this.triggerSessionRecovery(RECOVERY_TRIGGER_STARTUP);

			/* Step 2: Lazily initialises Tauri window lifecycle events so browser bundles remain
			   tree-shakeable and desktop resume recovery does not depend on DOM focus delivery. */
			if (this.isTauriApp) {
				this.initializeTauriWindowLifecycle().catch(() => {});
			}

			/* Step 3: Wire the auth observable and seed the active route first. Initial navigation can
			   finish before the subscription attaches, otherwise the dock can show no or stale selection. */
			this.currentUser$ = this.authService.getCurrentUser();
			this.activeRoute = ROUTE_TO_NAV_ID[this.router.url.split('?')[0]] ?? '';
			this.routerEventsSubscription = this.router.events
				.pipe(filter((event) => event instanceof NavigationEnd))
				.subscribe((event) => {
					const url = (event as NavigationEnd).urlAfterRedirects.split('?')[0];
					this.activeRoute = ROUTE_TO_NAV_ID[url] ?? '';
				});

			// Step 4: Mirror auth state into plain fields used by the mobile nav template
			this.currentUserSubscription = this.currentUser$.subscribe((user) => {
				this.mobileSignedIn = !!user;
				this.mobileUserName = Utilities.capitalizeFirstLetterOnEachWord(
					Utilities.getUserDisplayName(user)
				);
				if (!user) this.userInitialized = false;
				if (user && !this.userInitialized) {
					this.userInitialized = true;
					/* A same-backend CloudBase sign-in does not reload the root component. Restarting
					   recovery here re-enables streams that the preceding sign-out intentionally cleared. */
					this.triggerSessionRecovery(RECOVERY_TRIGGER_STARTUP);
					if (this.isTauriApp) {
						this.notificationService.init().catch(() => {});
						this.databaseService.getMinimizeOnClose().then((enabled: boolean) => {
							this.minimizeOnClose.set(enabled);
							invoke(TAURI_CMD_SET_MINIMIZE_ON_CLOSE, { enabled }).catch(() => {});
						}).catch(() => {});
					}
					this.databaseService.getLocale().then((dbLocale: 'en' | 'zh' | null) => {
						const storedLocale = localStorage.getItem(LS_LOCALE_KEY) as 'en' | 'zh' | null;

						// No DB record yet — first login ever; seed from current localStorage value
						if (dbLocale === null) {
							this.databaseService.setLocale(this.localeService.currentLocale).catch(() => {});

						// No localStorage value — fresh device; sync from DB once (one-time flip, then stable)
						} else if (storedLocale === null) {
							this.localeService.applyLocale(dbLocale);

						/* localStorage wins over DB — the DB read may be stale if the previous write
						   did not complete before the reload. Repair DB silently; no reload triggered. */
						} else if (dbLocale !== storedLocale) {
							this.databaseService.setLocale(storedLocale).catch(() => {});
						}
					}).catch(() => {});
				}
			});

			/* Step 5: Register a capture-phase scroll listener outside Angular's zone so it
			   does not trigger change detection on every scroll tick; re-enters the zone only
			   when the context menu is actually open and needs to be dismissed. */
			this.ngZone.runOutsideAngular(() => {
				this.documentScrollListener = () => {
					if (this.contextMenuVisible) this.ngZone.run(() => this.closeContextMenu());
				};
				document.addEventListener(
					'scroll',
					this.documentScrollListener,
					{ capture: true, passive: true }
				);
			});

			/* Step 6: Start the notification scheduler, which scans immediately and arms the daily
			   background check for when the app stays open. */
			this.notificationScheduler.start();
		}
	}

	/**
	 * Enables the nav width transition after the first frame so the initial
	 * collapsed state is applied without animation on page load.
	 */
	ngAfterViewInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.navReadyTimeout = setTimeout(() => {
				this.navReady = true;
			});
		}
	}

	/**
	 * Clears the dialog container, cancels the notification timers, and logs component teardown.
	 */
	ngOnDestroy(): void {
		this.isDestroyed = true;
		this.tauriEventUnlistenFunctions.forEach((unlistenFunction) => unlistenFunction());
		this.routerEventsSubscription?.unsubscribe();
		this.currentUserSubscription?.unsubscribe();
		this.sessionExpiredSubscription?.unsubscribe();
		this.watchErrorsSubscription?.unsubscribe();
		this.writeErrorsSubscription?.unsubscribe();
		if (this.documentScrollListener) {
			document.removeEventListener('scroll', this.documentScrollListener, true);
		}
		if (this.navReadyTimeout) clearTimeout(this.navReadyTimeout);
		this.notificationScheduler.stop();
		this.dialogComponentContainer?.clear();
		this.tauriEventUnlistenFunctions = [];
		this.documentScrollListener = undefined;
		this.navReadyTimeout = undefined;
		this.inactivityStartedAt = undefined;
		this.confirmedExpiryPending = false;
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	// ── User action handlers ─────────────────────────────────────────────────

	/**
	 * Updates the navMobile flag and compact-mode state on every window resize
	 * so the nav drawer and content margin track the viewport correctly.
	 */
	@HostListener('window:resize')
	protected onWindowResize(): void {
		this.applyViewportState(window.innerWidth);
	}

	/**
	 * Records browser inactivity when the non-Tauri window loses focus.
	 */
	@HostListener(WINDOW_EVENT_BLUR)
	protected recordBrowserInactivity(): void {
		if (!this.isTauriApp) this.recordSessionInactivity();
	}

	/**
	 * Recovers the browser session when focus returns after the inactivity threshold.
	 */
	@HostListener(WINDOW_EVENT_FOCUS)
	protected recoverBrowserSessionAfterInactivity(): void {
		if (!this.isTauriApp) this.recoverSessionAfterInactivity();
	}

	/**
	 * Recovers the active session when browser connectivity returns.
	 */
	@HostListener(WINDOW_EVENT_ONLINE)
	protected recoverAfterConnectivityReturn(): void {
		this.triggerSessionRecovery(RECOVERY_TRIGGER_ONLINE);
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
				this.contextMenuSavedSelection = {
					element: target,
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
		if (this.contextMenuSavedSelection) {
			const { element, start, end } = this.contextMenuSavedSelection;
			element.selectionStart = start;
			element.selectionEnd = end;
			this.contextMenuSavedSelection = null;
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
		for (const [i, item] of this.contextMenuNavItems.entries()) {
			actions.push({
				label: item.id === 'home' ? NAV_LABEL_HOME : NAV_LABEL_REMINDER,
				icon: item.icon,
				color: item.gradient!,
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
					label: NAV_LABEL_SIGN_OUT,
					icon: CTX_ICON_SIGN_OUT,
					color: CTX_COLOR_SIGN_OUT,
					execute: () =>
						this.dialogService.openDialog(
							this.dialogComponentContainer,
							DIALOG_CONFIRM,
							() => this.logout(),
							[MSG_LOGOUT_CONFIRM, DIALOG_BTN_SIGN_OUT, DIALOG_BTN_SIGN_OUT]
						)
				}
			);
		} else {
			actions.push({
				label: NAV_LABEL_SIGN_IN,
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
		this.contextMenuX = Math.min(event.clientX, window.innerWidth - 220);
		this.contextMenuY = Math.min(event.clientY, window.innerHeight - 280);
		this.contextMenuActions = actions;
		this.contextMenuVisible = true;
	}

	/**
	 * Closes the custom context menu overlay.
	 */
	protected closeContextMenu(): void {
		this.contextMenuVisible = false;
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
			/* Step 3: Enter compact mode — auto-collapse only on the first crossing (!wasCompact)
			   so that subsequent resize events within the compact range do not fight the user if
			   they manually expanded the overlay. The collapse is transient: it is recomputed here
			   on every load and is deliberately NOT persisted, so it never overwrites the user's
			   saved wide-screen preference and the panel reopens at wide widths on next startup. */
			if (!wasCompact) {
				this.navCollapsed = true;
				this.navMode = 'side';
				this.compactOverlayOpen = false;
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
	 * Toggles the minimize-on-close preference and persists the change to the database and Rust app state.
	 */
	protected toggleMinimizeOnClose(): void {
		const enabled = !this.minimizeOnClose();
		this.minimizeOnClose.set(enabled);
		this.databaseService.setMinimizeOnClose(enabled).catch(() => {});
		invoke(TAURI_CMD_SET_MINIMIZE_ON_CLOSE, { enabled }).catch(() => {});
	}

	/**
	 * Navigates to the account page and closes the account popover.
	 */
	protected navigateToAccount(): void {
		this.accountMenuOpen = false;
		this.router.navigate([ACCOUNT_ROUTE_PATH]).catch(() => {});
	}

	/**
	 * Opens the public guide entry point in the active application language.
	 * Every platform uses the canonical production origin so local and native
	 * runtimes cannot fall through to the authenticated Angular application.
	 */
	protected openGuide(): void {
		if (!isPlatformBrowser(this.platformId)) return;

		// Step 1: Build the public guide URL independently of the current app runtime origin.
		const guideUrl = new URL(GUIDE_ROUTE_PATH, GUIDE_PUBLIC_WEB_ORIGIN);
		guideUrl.searchParams.set(GUIDE_PAGE_QUERY_PARAM, GUIDE_DIRECTORY_PAGE);
		guideUrl.searchParams.set(GUIDE_LANGUAGE_QUERY_PARAM, ACTIVE_LOCALE);

		// Step 2: Navigate the Capacitor WebView directly to the public guide.
		if (this.isCapacitorApp) {
			window.location.assign(guideUrl.toString());
			return;
		}

		// Step 3: Preserve the current app window on browser and desktop surfaces.
		this.utilities.openInNewTab(guideUrl.toString());
	}

	/**
	 * Returns true when the visitor is on a page that stays readable without a session.
	 *
	 * Reads the browser location as well as the router because an expiry can resolve before the
	 * router has settled on its destination — at that moment `router.url` is still the root path,
	 * so checking it alone sends a public-page visitor to login anyway.
	 *
	 * @returns Whether the current page is public.
	 */
	private isOnPublicRoute(): boolean {
		const trimTrailingSlash = (path: string): string => path.replace(/\/+$/, '') || '/';
		const routerPath = trimTrailingSlash(this.router.url.split('?')[0]);
		if (PUBLIC_ROUTE_PATHS.includes(routerPath)) return true;
		if (!isPlatformBrowser(this.platformId)) return false;
		return PUBLIC_ROUTE_PATHS.includes(trimTrailingSlash(window.location.pathname));
	}

	/**
	 * Navigates to the login page, preserving the current URL as a returnUrl
	 * query param so the user is redirected back after signing in.
	 */
	protected navigateToLogin(): void {
		if (this.router.url.split('?')[0] === LOGIN_ROUTE_PATH) return;
		this.router
			.navigate([LOGIN_ROUTE_PATH], { queryParams: { returnUrl: this.router.url } })
			.catch(() => {});
	}

	/**
	 * Preserves the current local session until remote sign-out is confirmed.
	 * Restores the notification preference when the remote outcome remains unresolved.
	 *
	 * @returns The shared in-flight sign-out operation.
	 */
	protected logout(): Promise<void> {
		if (this.logoutPromise) return this.logoutPromise;
		this.logoutPromise = this.runLogout();
		return this.logoutPromise;
	}

	/**
	 * Runs the coordinated manual sign-out transition once.
	 *
	 * @returns A promise that resolves after sign-out completes.
	 */
	private async runLogout(): Promise<void> {
		// Step 1: Close the account popover immediately so the UI does not appear frozen
		this.accountMenuOpen = false;

		// Step 2: Preserve whether sign-out temporarily changes the notification preference
		const wasNotificationSubscribed = this.notifSubscribed();

		try {
			// Step 3: Removes notifications before revoking the authenticated provider session
			if (wasNotificationSubscribed) await this.notificationService.unsubscribe();

			// Step 4: Publishes database cleanup before the local signed-out auth state
			const wasFirebase = Utilities.isFirebaseBackend();
			await this.authService.confirmRemoteSignOut();
			this.sessionRecoveryService.expireConfirmedSession();
			if (wasFirebase) {
				window.location.reload();
			} else if (this.router.url.split('?')[0] === ACCOUNT_ROUTE_PATH) {
				await this.router.navigateByUrl(LOGIN_URL_DEFAULT_RETURN);
			}
		} catch (error: unknown) {
			/* Step 5: An unresolved remote outcome keeps the auth and database session intact.
			   Restore the pre-logout notification preference before offering Retry or Cancel. */
			if (wasNotificationSubscribed && !this.notifSubscribed()) {
				await this.notificationService.restoreSubscription().catch(() => {});
			}
			this.dialogService.handleError(this.dialogComponentContainer, error);
			throw error;
		} finally {
			this.logoutPromise = undefined;
		}
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
				[MSG_LOGOUT_CONFIRM, DIALOG_BTN_SIGN_OUT, DIALOG_BTN_SIGN_OUT]
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
	 * pre-cached window reference loaded in ngOnInit, avoiding per-call import
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
			DIALOG_BTN_SIGN_OUT,
			DIALOG_BTN_SIGN_OUT
		]);
	}

	/**
	 * Switches the display language and reloads the page immediately.
	 * Used by both the desktop account popover and the mobile bottom-nav.
	 */
	protected async doSwitchLocale(): Promise<void> {
		const targetLocale: 'en' | 'zh' = this.localeService.currentLocale === 'en' ? 'zh' : 'en';
		/* Must complete before applyLocale() — applyLocale calls window.location.reload()
		   immediately, which would kill the in-flight DB write if not awaited first. */
		await this.databaseService.setLocale(targetLocale).catch(() => {});
		this.localeService.applyLocale(targetLocale);
	}

	// ── Session recovery helpers ────────────────────────────────────────────────

	/**
	 * Starts one app-level recovery outcome flow and ignores simultaneous trigger duplicates.
	 *
	 * {@link ngOnInit} - Routes startup, session-expiry, watcher, and write events into recovery.
	 * {@link recoverAfterConnectivityReturn} - Routes browser online events into recovery.
	 * {@link handleSessionRecoveryOutcome} - Replays a queued confirmed-expiry event after recovery.
	 * {@link recoverSessionAfterInactivity} - Routes qualified focus or resume events into recovery.
	 *
	 * @param trigger - The lifecycle or data-layer event requesting recovery.
	 * @param isConfirmedExpiry - Whether the provider explicitly confirmed session expiry.
	 */
	private triggerSessionRecovery(trigger: RecoveryTrigger, isConfirmedExpiry = false): void {
		if (this.isDestroyed) return;
		if (!isConfirmedExpiry && !this.utilities.getIsUserAlive()) return;
		if (this.recoveryOutcomePromise) {
			if (isConfirmedExpiry) this.confirmedExpiryPending = true;
			return;
		}

		this.recoveryOutcomePromise = this.handleSessionRecoveryOutcome(trigger, isConfirmedExpiry);
	}

	/**
	 * Handles central recovery outcomes without stacking navigation or retry dialogs.
	 *
	 * @param trigger - The lifecycle or data-layer event requesting recovery.
	 * @param isConfirmedExpiry - Whether the provider explicitly confirmed session expiry.
	 * @returns A promise that resolves after the recovery outcome is handled.
	 */
	private async handleSessionRecoveryOutcome(
		trigger: RecoveryTrigger,
		isConfirmedExpiry: boolean
	): Promise<void> {
		let recoveryStatus: RecoveryStatus | undefined;
		try {
			recoveryStatus = isConfirmedExpiry
				? this.sessionRecoveryService.expireConfirmedSession()
				: await this.sessionRecoveryService.recover(trigger);
			if (recoveryStatus === RECOVERY_STATUS_EXPIRED) {
				/* A public page stays readable once the session goes — only a protected route bounces to
				   login, so a visitor reading Patch Notes, Resonance, or About is never interrupted. */
				if (!this.isOnPublicRoute()) this.navigateToLogin();
				return;
			}
			if (recoveryStatus === RECOVERY_STATUS_RECOVERED) {
				this.notificationService.retryPendingRestore().catch(() => {});
			}
			if (
				recoveryStatus === RECOVERY_STATUS_OFFLINE &&
				trigger !== RECOVERY_TRIGGER_STARTUP &&
				trigger !== RECOVERY_TRIGGER_WRITE_ERROR &&
				!this.confirmedExpiryPending
			) {
				this.dialogService.showLoadingTimeout(this.dialogComponentContainer);
			}
		} finally {
			const shouldRevalidateConfirmedExpiry =
				this.confirmedExpiryPending && recoveryStatus !== RECOVERY_STATUS_EXPIRED;
			this.confirmedExpiryPending = false;
			this.recoveryOutcomePromise = undefined;
			if (shouldRevalidateConfirmedExpiry) {
				this.triggerSessionRecovery(RECOVERY_TRIGGER_WATCH_ERROR, true);
			}
		}
	}

	/**
	 * Initialises native Tauri focus and suspend lifecycle listeners.
	 *
	 * @returns A promise that resolves after every native listener is registered.
	 */
	private async initializeTauriWindowLifecycle(): Promise<void> {
		const [{ getCurrentWindow }, { TauriEvent }] = await Promise.all([
			import('@tauri-apps/api/window'),
			import('@tauri-apps/api/event')
		]);
		this.tauriAppWindow = getCurrentWindow();

		/* Native window callbacks execute outside Angular's zone, so each state transition
		   re-enters the zone before recording inactivity or invoking central recovery. */
		const registeredUnlistenFunctions: UnlistenFn[] = [];
		try {
			registeredUnlistenFunctions.push(
				await this.tauriAppWindow.onFocusChanged(({ payload: isFocused }) => {
					this.ngZone.run(() => {
						if (isFocused) {
							this.recoverSessionAfterInactivity();
						} else {
							this.recordSessionInactivity();
						}
					});
				})
			);
			registeredUnlistenFunctions.push(
				await this.tauriAppWindow.listen(TauriEvent.WINDOW_SUSPENDED, () => {
					this.ngZone.run(() => this.recordSessionInactivity());
				})
			);
			registeredUnlistenFunctions.push(
				await this.tauriAppWindow.listen(TauriEvent.WINDOW_RESUMED, () => {
					this.ngZone.run(() => this.recoverSessionAfterInactivity());
				})
			);
		} catch (error: unknown) {
			registeredUnlistenFunctions.forEach((unlistenFunction) => unlistenFunction());
			throw error;
		}
		if (this.isDestroyed) {
			registeredUnlistenFunctions.forEach((unlistenFunction) => unlistenFunction());
			return;
		}
		this.tauriEventUnlistenFunctions.push(...registeredUnlistenFunctions);
	}

	/**
	 * Records the timestamp at which the active app session became inactive.
	 *
	 * {@link recordBrowserInactivity} - Records browser blur events.
	 * {@link initializeTauriWindowLifecycle} - Records native blur and suspend events.
	 */
	private recordSessionInactivity(): void {
		this.inactivityStartedAt ??= Date.now();
	}

	/**
	 * Recovers the active session when the recorded inactivity meets the configured threshold.
	 *
	 * {@link recoverBrowserSessionAfterInactivity} - Handles browser focus events.
	 * {@link initializeTauriWindowLifecycle} - Handles native focus and resume events.
	 */
	private recoverSessionAfterInactivity(): void {
		if (this.inactivityStartedAt === undefined) return;

		const inactivityDuration = Date.now() - this.inactivityStartedAt;
		this.inactivityStartedAt = undefined;
		if (inactivityDuration < RECOVERY_INACTIVITY_THRESHOLD_MS) return;

		this.triggerSessionRecovery(RECOVERY_TRIGGER_RESUME);
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
