import {
	AfterViewInit,
	Component,
	Inject,
	OnDestroy,
	OnInit,
	PLATFORM_ID,
	ViewChild,
	ViewContainerRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { AuthService } from '../../backend/authentication-service/auth.service';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { Utilities } from '../../common/utilities/app.utilities';
import {
	ACCOUNT_DIALOG_DELETE_BTN,
	ACCOUNT_DIALOG_DELETE_HEADER,
	ACCOUNT_DIALOG_DELETE_MSG,
	ACCOUNT_LABEL_CHANGE_PASSWORD,
	ACCOUNT_LABEL_CONFIRM_PASSWORD,
	ACCOUNT_LABEL_DANGER_ZONE_TITLE,
	ACCOUNT_MSG_COMING_SOON,
	ACCOUNT_LABEL_DELETE_ACCOUNT,
	ACCOUNT_LABEL_DELETE_DESCRIPTION,
	ACCOUNT_LABEL_EMAIL,
	ACCOUNT_LABEL_IDENTITY_TITLE,
	ACCOUNT_LABEL_MEMBER_SINCE,
	ACCOUNT_LABEL_MILESTONES_TITLE,
	ACCOUNT_LABEL_NEW_PASSWORD,
	ACCOUNT_LABEL_PROFILE_TAGLINE,
	ACCOUNT_LABEL_SAVE,
	ACCOUNT_LABEL_INNER_WORLD_TITLE,
	ACCOUNT_LABEL_STREAK_SUFFIX,
	ACCOUNT_LABEL_USERNAME,
	ACCOUNT_LABEL_VERIFIED,
	ACCOUNT_MSG_DELETE_CONFIRMED,
	ACCOUNT_MSG_PASSWORD_MISMATCH,
	ACCOUNT_MSG_PASSWORD_TOO_SHORT,
	ACCOUNT_MSG_PASSWORD_UPDATED,
	ACCOUNT_MSG_USERNAME_TOO_SHORT,
	ACCOUNT_MSG_USERNAME_UPDATED,
	MILESTONE_KEY_ACCOUNT_CREATED,
	STATS_FIELD_ACTIVITY_STREAK,
	STATS_FIELD_MILESTONES,
	SUCCESS,
	TOAST_WARN
} from '../../common/app.constant';
import {
	AccountMilestone,
	AccountStat,
	ACCOUNT_STATS,
	ACCOUNT_STRENGTH_LEVELS,
	MILESTONE_DOMAIN_DISPLAY,
	MILESTONE_LABELS
} from './account.model';

@Component({
	selector: 'app-account',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './account.component.html',
	styleUrls: ['../../common/glass-card.css', './account.component.css']
})
export class AccountComponent implements OnInit, AfterViewInit, OnDestroy {
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;

	// ── Constants re-exposed for template ────────────────────────────────────
	protected readonly ACCOUNT_LABEL_PROFILE_TAGLINE = ACCOUNT_LABEL_PROFILE_TAGLINE;
	protected readonly ACCOUNT_LABEL_MEMBER_SINCE = ACCOUNT_LABEL_MEMBER_SINCE;
	protected readonly ACCOUNT_LABEL_STREAK_SUFFIX = ACCOUNT_LABEL_STREAK_SUFFIX;
	protected readonly ACCOUNT_LABEL_VERIFIED = ACCOUNT_LABEL_VERIFIED;
	protected readonly ACCOUNT_LABEL_IDENTITY_TITLE = ACCOUNT_LABEL_IDENTITY_TITLE;
	protected readonly ACCOUNT_LABEL_INNER_WORLD_TITLE = ACCOUNT_LABEL_INNER_WORLD_TITLE;
	protected readonly ACCOUNT_LABEL_MILESTONES_TITLE = ACCOUNT_LABEL_MILESTONES_TITLE;
	protected readonly ACCOUNT_LABEL_DANGER_ZONE_TITLE = ACCOUNT_LABEL_DANGER_ZONE_TITLE;
	protected readonly ACCOUNT_LABEL_USERNAME = ACCOUNT_LABEL_USERNAME;
	protected readonly ACCOUNT_LABEL_EMAIL = ACCOUNT_LABEL_EMAIL;
	protected readonly ACCOUNT_LABEL_CHANGE_PASSWORD = ACCOUNT_LABEL_CHANGE_PASSWORD;
	protected readonly ACCOUNT_LABEL_NEW_PASSWORD = ACCOUNT_LABEL_NEW_PASSWORD;
	protected readonly ACCOUNT_LABEL_CONFIRM_PASSWORD = ACCOUNT_LABEL_CONFIRM_PASSWORD;
	protected readonly ACCOUNT_LABEL_SAVE = ACCOUNT_LABEL_SAVE;
	protected readonly ACCOUNT_LABEL_DELETE_ACCOUNT = ACCOUNT_LABEL_DELETE_ACCOUNT;
	protected readonly ACCOUNT_LABEL_DELETE_DESCRIPTION = ACCOUNT_LABEL_DELETE_DESCRIPTION;
	protected readonly ACCOUNT_MSG_COMING_SOON = ACCOUNT_MSG_COMING_SOON;
	protected readonly ACCOUNT_STRENGTH_LEVELS = ACCOUNT_STRENGTH_LEVELS;

	// ── Mutable state ─────────────────────────────────────────────────────────
	protected userStats: AccountStat[] = ACCOUNT_STATS.map((stat) => ({ ...stat }));
	protected streakCount = 0;
	protected memberSince = '';
	protected milestoneList: AccountMilestone[] = [];
	protected isStatsLoaded = false;
	protected currentUser$!: Observable<any>;
	protected usernameInput = '';
	protected newPasswordInput = '';
	protected confirmPasswordInput = '';
	protected showNewPassword = false;
	protected showConfirmPassword = false;
	private statsSub?: Subscription;

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		private authService: AuthService,
		private cloudbaseService: CloudbaseService,
		private dialogService: DialogService
	) {}

	/**
	 * Initialises the current-user observable and pre-fills the username input
	 * from the already-cached authentication session.
	 */
	ngOnInit(): void {
		this.currentUser$ = this.authService.getCurrentUser();
		firstValueFrom(this.currentUser$)
			.then((user) => {
				if (!user) return;
				this.usernameInput = Utilities.getUserDisplayName(user);
				this.cloudbaseService.ensureUserStatsExist().catch(() => {});
			})
			.catch(() => {});
		this.statsSub = this.cloudbaseService.getUserStats().subscribe((doc) => {
			if (!doc) return;
			this.userStats = this.userStats.map((stat) => ({
				...stat,
				value: (doc[stat.field] as number) ?? 0
			}));
			this.streakCount = (doc[STATS_FIELD_ACTIVITY_STREAK] as number) ?? 0;
			const milestones = (doc[STATS_FIELD_MILESTONES] as Record<string, string>) ?? {};
			this.memberSince = milestones[MILESTONE_KEY_ACCOUNT_CREATED]
				? Utilities.storageDateToDisplayMonth(milestones[MILESTONE_KEY_ACCOUNT_CREATED])
				: '';
			this.milestoneList = this.buildMilestoneList(milestones);
			this.isStatsLoaded = true;
		});
	}

	/**
	 * Attaches the scroll auto-hide behaviour to every account card once after the view renders.
	 * Skipped during SSR prerendering where document is unavailable.
	 */
	ngAfterViewInit(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		document
			.querySelectorAll<HTMLElement>('.account-card')
			.forEach((card) => Utilities.attachScrollAutoHide(card));
	}

	/**
	 * Clears the dialog container on component teardown.
	 */
	ngOnDestroy(): void {
		this.statsSub?.unsubscribe();
		this.dialogComponentContainer?.clear();
	}

	// ── User action handlers ──────────────────────────────────────────────────

	/**
	 * Validates and applies the updated username client-side, showing a toast result.
	 */
	protected updateUsername(): void {
		if (this.usernameInput.trim().length < 3) {
			this.dialogService.showToast(TOAST_WARN, ACCOUNT_MSG_USERNAME_TOO_SHORT);
			return;
		}
		this.dialogService.showToast(SUCCESS, ACCOUNT_MSG_USERNAME_UPDATED);
	}

	/**
	 * Validates the new and confirm password fields and shows a toast result.
	 * Clears both fields on a successful match.
	 */
	protected updatePassword(): void {
		if (this.newPasswordInput.length < 6) {
			this.dialogService.showToast(TOAST_WARN, ACCOUNT_MSG_PASSWORD_TOO_SHORT);
			return;
		}
		if (this.newPasswordInput !== this.confirmPasswordInput) {
			this.dialogService.showToast(TOAST_WARN, ACCOUNT_MSG_PASSWORD_MISMATCH);
			return;
		}
		this.dialogService.showToast(SUCCESS, ACCOUNT_MSG_PASSWORD_UPDATED);
		this.newPasswordInput = '';
		this.confirmPasswordInput = '';
	}

	/**
	 * Toggles the new-password field between masked and plain-text display.
	 */
	protected toggleNewPasswordVisibility(): void {
		this.showNewPassword = !this.showNewPassword;
	}

	/**
	 * Toggles the confirm-password field between masked and plain-text display.
	 */
	protected toggleConfirmPasswordVisibility(): void {
		this.showConfirmPassword = !this.showConfirmPassword;
	}

	// ── Dialog opener methods ─────────────────────────────────────────────────

	/**
	 * Opens the confirm dialog for account deletion and shows a success toast on confirmation.
	 */
	protected openDeleteConfirmationDialog(): void {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			'confirm',
			() => {
				this.dialogService.showToast(SUCCESS, ACCOUNT_MSG_DELETE_CONFIRMED);
			},
			[ACCOUNT_DIALOG_DELETE_MSG, ACCOUNT_DIALOG_DELETE_HEADER, ACCOUNT_DIALOG_DELETE_BTN]
		);
	}

	// ── Private helpers ───────────────────────────────────────────────────────

	/**
	 * Converts the raw milestones map from the per-user stats doc into a sorted
	 * list of AccountMilestone objects. Entries are sorted chronologically by
	 * their storage date (YYYY-MM-DD), and the date is converted to a human-readable
	 * "MMM yyyy" string for display.
	 *
	 * @param raw - The raw milestones map keyed by milestone key (e.g. "film1st").
	 * @returns The sorted list of AccountMilestone display objects.
	 */
	private buildMilestoneList(raw: Record<string, string>): AccountMilestone[] {
		return Object.entries(raw)
			.sort(([, dateA], [, dateB]) => dateA.localeCompare(dateB))
			.map(([key, storageDate]) => {
				const label = MILESTONE_LABELS[key];
				if (label) {
					return {
						title: label.title,
						date: Utilities.storageDateToDisplayMonth(storageDate),
						note: label.note
					};
				}
				const match = key.match(/^([a-z]+?)(\d+)(st|th)$/);
				if (!match) return null;
				const [, domain, count] = match;
				const domainLabel = MILESTONE_DOMAIN_DISPLAY[domain];
				if (!domainLabel) return null;
				const title = `${count}${domainLabel}`;
				return { title, date: Utilities.storageDateToDisplayMonth(storageDate), note: '' };
			})
			.filter((m): m is AccountMilestone => m !== null);
	}

	// ── Template helper methods ───────────────────────────────────────────────

	/**
	 * Gets the strength level index (0–4) for the given password based on its length.
	 *
	 * @param password - The current password string to evaluate.
	 * @returns The index into ACCOUNT_STRENGTH_LEVELS matching the password strength.
	 */
	protected getPasswordStrengthIndex(password: string): number {
		if (!password) return 0;
		for (let i = ACCOUNT_STRENGTH_LEVELS.length - 1; i >= 0; i--) {
			if (password.length >= ACCOUNT_STRENGTH_LEVELS[i].minLength) return i;
		}
		return 0;
	}

	/**
	 * Gets the colour string for the current password strength level.
	 *
	 * @param password - The current password string to evaluate.
	 * @returns The hex colour matching the password strength.
	 */
	protected getStrengthColor(password: string): string {
		return ACCOUNT_STRENGTH_LEVELS[this.getPasswordStrengthIndex(password)].color;
	}

	/**
	 * Gets the label text for the current password strength level.
	 *
	 * @param password - The current password string to evaluate.
	 * @returns The label string matching the password strength.
	 */
	protected getStrengthLabel(password: string): string {
		return ACCOUNT_STRENGTH_LEVELS[this.getPasswordStrengthIndex(password)].label;
	}

	/**
	 * Gets the email address from the user object, handling both CN and international shapes.
	 *
	 * @param user - The authenticated user object from the auth observable.
	 * @returns The user's email address, or an empty string if unavailable.
	 */
	protected getUserEmail(user: any): string {
		return user?.user_metadata?.email ?? user?.email ?? '';
	}

	/**
	 * Gets the display name from the user object in title case, delegating to the shared utility.
	 *
	 * @param user - The authenticated user object from the auth observable.
	 * @returns The user's display name with each word capitalised.
	 */
	protected getUserDisplayName(user: any): string {
		return Utilities.capitalizeFirstLetterOnEachWord(Utilities.getUserDisplayName(user));
	}

	/**
	 * Gets the one-or-two-letter initials from the user's display name for the avatar circle.
	 *
	 * @param user - The authenticated user object from the auth observable.
	 * @returns The uppercased initials string, or '?' when no display name is available.
	 */
	protected getUserInitials(user: any): string {
		return Utilities.getUserInitials(user);
	}

}
