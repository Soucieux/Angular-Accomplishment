import { A11yModule } from '@angular/cdk/a11y';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Inject,
	Input,
	NgZone,
	Output,
	PLATFORM_ID,
	ViewChild,
	signal
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LOG } from '../../common/app.logs';
import {
	GUIDE_LAUNCHER_ICON,
	NAV_AVATAR_FALLBACK_INITIAL,
	NAV_AVATAR_GRADIENT,
	NAV_LOCALE_SWITCH_TO_ZH,
	NAV_LOCALE_SWITCH_TO_EN
} from '../../common/constants';
import {
	ACCOUNT_TITLE_PAGE,
	ACTIVE_LOCALE,
	NAV_NOTIF_LABEL_DISABLE,
	NAV_NOTIF_LABEL_ENABLE,
	NAV_NOTIF_TOGGLE_ERROR,
	NAV_MOBILE_ALL_SECTIONS,
	LABEL_ONLINE,
	NAV_LABEL_SIGN_OUT,
	NAV_MOBILE_WELCOME,
	NAV_MOBILE_OFFLINE,
	NAV_LABEL_SIGN_IN,
	NAV_LABEL_GUIDE,
	NAV_ARIA_ACCOUNT,
	NAV_ARIA_PRIMARY,
	NAV_ARIA_CLOSE_SECTIONS,
	NAV_ARIA_SHOW_SECTIONS,
	NAV_ARIA_OPEN_GUIDE,
	NAV_ARIA_ACCOUNT_PREFIX
} from '../../common/locale/locale-strings';
import { NotificationService } from '../../backend/notification-service/notification.service';
import { NavItem } from './bottom-nav.model';
import { Utilities } from '../../common/utilities/app.utilities';
import { UnexpectedError } from '../../common/error/unexpected.error';

@Component({
	selector: 'bottom-nav',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [A11yModule],
	templateUrl: './bottom-nav.component.html',
	styleUrl: './bottom-nav.component.css'
})
export class BottomNavComponent implements AfterViewInit {
	private readonly className = 'BottomNavComponent';

	@ViewChild('gridCells') private gridCells!: ElementRef<HTMLElement>;

	@Output() public readonly navigate = new EventEmitter<string>();
	@Output() public readonly signIn = new EventEmitter<void>();
	@Output() public readonly signOut = new EventEmitter<void>();
	@Output() public readonly switchLocale = new EventEmitter<void>();
	@Output() public readonly openGuide = new EventEmitter<void>();

	@Input() public items: NavItem[] = [];
	@Input() public primaryIds: string[] = [];
	@Input() public activeId = '';
	@Input() public signedIn = false;
	@Input() public userName = '';

	protected readonly ACCOUNT_TITLE_PAGE = ACCOUNT_TITLE_PAGE;
	protected readonly GUIDE_LAUNCHER_ICON = GUIDE_LAUNCHER_ICON;
	protected readonly NAV_AVATAR_GRADIENT = NAV_AVATAR_GRADIENT;
	protected readonly NAV_NOTIF_LABEL_ENABLE = NAV_NOTIF_LABEL_ENABLE;
	protected readonly NAV_NOTIF_LABEL_DISABLE = NAV_NOTIF_LABEL_DISABLE;
	protected readonly NAV_MOBILE_ALL_SECTIONS = NAV_MOBILE_ALL_SECTIONS;
	protected readonly LABEL_ONLINE = LABEL_ONLINE;
	protected readonly NAV_LABEL_SIGN_OUT = NAV_LABEL_SIGN_OUT;
	protected readonly NAV_MOBILE_WELCOME = NAV_MOBILE_WELCOME;
	protected readonly NAV_MOBILE_OFFLINE = NAV_MOBILE_OFFLINE;
	protected readonly NAV_LABEL_SIGN_IN = NAV_LABEL_SIGN_IN;
	protected readonly NAV_LABEL_GUIDE = NAV_LABEL_GUIDE;
	protected readonly NAV_ARIA_ACCOUNT = NAV_ARIA_ACCOUNT;
	protected readonly NAV_ARIA_PRIMARY = NAV_ARIA_PRIMARY;
	protected readonly NAV_ARIA_CLOSE_SECTIONS = NAV_ARIA_CLOSE_SECTIONS;
	protected readonly NAV_ARIA_SHOW_SECTIONS = NAV_ARIA_SHOW_SECTIONS;
	protected readonly NAV_ARIA_OPEN_GUIDE = NAV_ARIA_OPEN_GUIDE;
	protected readonly NAV_ARIA_ACCOUNT_PREFIX = NAV_ARIA_ACCOUNT_PREFIX;
	protected readonly localeSwitchLabel: string =
		ACTIVE_LOCALE === 'en' ? NAV_LOCALE_SWITCH_TO_ZH : NAV_LOCALE_SWITCH_TO_EN;

	protected readonly gridOpen = signal(false);
	protected readonly accountOpen = signal(false);
	protected readonly notificationSubscribed = this.notificationService.isSubscribed;
	protected readonly notificationSupported = this.notificationService.isSupported();

	constructor(
		private ngZone: NgZone,
		private notificationService: NotificationService,
		@Inject(PLATFORM_ID) private platformId: object
	) {}

	/**
	 * Attaches the scroll auto-hide behaviour to the all-sections grid cells container.
	 */
	ngAfterViewInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.ngZone.runOutsideAngular(() =>
				Utilities.attachScrollAutoHide(this.gridCells?.nativeElement)
			);
		}
	}

	/**
	 * Gets the dock items resolved in `primaryIds` order, falling back to the
	 * first four items when no `primaryIds` are provided.
	 *
	 * @returns The ordered list of `NavItem` entries shown in the floating dock.
	 */
	protected get primary(): NavItem[] {
		const ids = this.primaryIds.length ? this.primaryIds : this.items.slice(0, 4).map((item) => item.id);
		return ids
			.map((id) => this.items.find((navItem) => navItem.id === id))
			.filter((navItem): navItem is NavItem => !!navItem);
	}

	/**
	 * Gets the sections shown in the "All sections" overlay — every nav item that
	 * is not already promoted to the always-visible dock, so the grid never
	 * duplicates a dock destination.
	 *
	 * @returns The list of `NavItem` entries absent from the dock.
	 */
	protected get secondary(): NavItem[] {
		const dockIds = new Set(this.primary.map((navItem) => navItem.id));
		return this.items.filter((navItem) => !dockIds.has(navItem.id));
	}

	/**
	 * Gets the uppercased first character of the user name for the avatar monogram,
	 * falling back to a question mark when no name is available.
	 *
	 * @returns A single uppercase character representing the user's initial.
	 */
	protected get initial(): string {
		return (this.userName || NAV_AVATAR_FALLBACK_INITIAL).charAt(0).toUpperCase();
	}

	/**
	 * Selects a destination, updates the local active id, and emits the
	 * navigate event.
	 *
	 * @param id - The id of the destination to activate.
	 */
	protected select(id: string): void {
		this.activeId = id;
		this.navigate.emit(id);
	}

	/**
	 * Picks a destination from the "All sections" overlay, selects it, and
	 * closes the overlay.
	 *
	 * @param id - The id of the destination chosen from the grid.
	 */
	protected pick(id: string): void {
		this.select(id);
		this.gridOpen.set(false);
	}

	/**
	 * Toggles the "All sections" overlay open or closed, closing the account
	 * popover when the grid opens.
	 */
	protected toggleGrid(): void {
		this.gridOpen.update((open) => !open);
		if (this.gridOpen()) this.accountOpen.set(false);
	}

	/**
	 * Toggles the account popover open or closed, closing the grid overlay
	 * when the account popover opens.
	 */
	protected toggleAccount(): void {
		this.accountOpen.update((open) => !open);
		if (this.accountOpen()) this.gridOpen.set(false);
	}

	/**
	 * Closes both the grid overlay and the account popover simultaneously.
	 */
	protected closeAll(): void {
		this.gridOpen.set(false);
		this.accountOpen.set(false);
	}

	/**
	 * Closes the all-sections panel and emits the guide-opening request.
	 */
	protected doOpenGuide(): void {
		this.gridOpen.set(false);
		this.openGuide.emit();
	}

	/**
	 * Closes the account popover and emits a navigate event to the account page.
	 */
	protected doNavigateToAccount(): void {
		this.accountOpen.set(false);
		this.navigate.emit('account');
	}

	/**
	 * Closes the account popover and emits the signIn event so the parent
	 * can navigate to the login page.
	 */
	protected doSignIn(): void {
		this.accountOpen.set(false);
		this.signIn.emit();
	}

	/**
	 * Closes the account popover and emits the signOut event so the parent
	 * can show a confirmation dialog before signing the user out.
	 */
	protected doSignOut(): void {
		this.accountOpen.set(false);
		this.signOut.emit();
	}

	/**
	 * Closes the account popover and emits the switchLocale event so the parent
	 * can open a confirmation dialog before reloading with the new language.
	 */
	protected doSwitchLocale(): void {
		this.accountOpen.set(false);
		this.switchLocale.emit();
	}

	/**
	 * Subscribes to Tauri notifications when not yet subscribed, or unsubscribes
	 * when already subscribed.
	 */
	protected async toggleNotification(): Promise<void> {
		try {
			if (this.notificationSubscribed()) {
				await this.notificationService.unsubscribe();
			} else {
				await this.notificationService.subscribe();
			}
		} catch (error: unknown) {
			LOG.error(
				this.className,
				NAV_NOTIF_TOGGLE_ERROR,
				error instanceof Error ? error : new UnexpectedError()
			);
		}
	}

	/**
	 * Closes all open overlays when the Escape key is pressed.
	 */
	@HostListener('document:keydown.escape')
	protected onEscape(): void {
		if (this.gridOpen() || this.accountOpen()) this.closeAll();
	}
}
