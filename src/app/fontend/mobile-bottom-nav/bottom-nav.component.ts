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
import { toSignal } from '@angular/core/rxjs-interop';
import { LOG } from '../../common/app.logs';
import {
	ACCOUNT_TITLE_PAGE,
	NAV_AVATAR_FALLBACK_INITIAL,
	NAV_AVATAR_GRADIENT,
	NAV_NOTIF_LABEL_BLOCKED,
	NAV_NOTIF_LABEL_DISABLE,
	NAV_NOTIF_LABEL_ENABLE
} from '../../common/app.constant';
import { NotificationService } from '../../backend/notification-service/notification.service';
import { NavItem } from './bottom-nav.model';
import { Utilities } from '../../common/utilities/app.utilities';

@Component({
	selector: 'bottom-nav',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [A11yModule],
	templateUrl: './bottom-nav.component.html',
	styleUrl: './bottom-nav.component.css'
})
export class BottomNavComponent implements AfterViewInit {
	@ViewChild('gridCells') private gridCells!: ElementRef<HTMLElement>;

	@Output() public readonly activeIdChange = new EventEmitter<string>();
	@Output() public readonly navigate = new EventEmitter<string>();
	@Output() public readonly signIn = new EventEmitter<void>();
	@Output() public readonly signOut = new EventEmitter<void>();

	@Input() public items: NavItem[] = [];
	@Input() public primaryIds: string[] = [];
	@Input() public activeId = '';
	@Input() public signedIn = false;
	@Input() public userName = '';

	private readonly className = 'BottomNavComponent';

	protected readonly ACCOUNT_TITLE_PAGE = ACCOUNT_TITLE_PAGE;
	protected readonly NAV_AVATAR_GRADIENT = NAV_AVATAR_GRADIENT;
	protected readonly NAV_NOTIF_LABEL_ENABLE = NAV_NOTIF_LABEL_ENABLE;
	protected readonly NAV_NOTIF_LABEL_DISABLE = NAV_NOTIF_LABEL_DISABLE;
	protected readonly NAV_NOTIF_LABEL_BLOCKED = NAV_NOTIF_LABEL_BLOCKED;

	protected readonly gridOpen = signal(false);
	protected readonly accountOpen = signal(false);
	protected readonly notificationPermission = signal<NotificationPermission>('default');
	protected readonly notifSubscribed = toSignal(this.notificationService.isSubscribed$, {
		initialValue: false
	});
	protected readonly notifSupported = this.notificationService.isSupported();

	constructor(
		private ngZone: NgZone,
		private notificationService: NotificationService,
		@Inject(PLATFORM_ID) private platformId: object
	) {}

	/**
	 * Attaches the scroll auto-hide behaviour to the all-sections grid cells container
	 * and seeds the notification permission signal with the current browser state.
	 */
	ngAfterViewInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.ngZone.runOutsideAngular(() =>
				Utilities.attachScrollAutoHide(this.gridCells?.nativeElement)
			);
			this.notificationPermission.set(this.notificationService.getPermission());
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
	 * Gets the uppercased first character of the user name for the avatar monogram,
	 * falling back to a question mark when no name is available.
	 *
	 * @returns A single uppercase character representing the user's initial.
	 */
	protected get initial(): string {
		return (this.userName || NAV_AVATAR_FALLBACK_INITIAL).charAt(0).toUpperCase();
	}

	/**
	 * Selects a destination, updates the two-way binding, and emits the
	 * navigate event.
	 *
	 * @param id - The id of the destination to activate.
	 */
	protected select(id: string): void {
		this.activeId = id;
		this.activeIdChange.emit(id);
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
	 * Subscribes to push notifications when not yet granted, or unsubscribes
	 * when already granted. Always refreshes the permission signal regardless
	 * of whether the operation succeeds or fails.
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
				'Error toggling push notification',
				error instanceof Error ? error : new Error('Unexpected error')
			);
		} finally {
			this.notificationPermission.set(this.notificationService.getPermission());
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
