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
import { DatabaseService } from '../../backend/database-service/database.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { Utilities } from '../../common/utilities/app.utilities';
import {
	ACCOUNT_DIALOG_DELETE_BTN,
	ACCOUNT_DIALOG_DELETE_HEADER,
	ACCOUNT_DIALOG_DELETE_MSG,
	ACCOUNT_LABEL_CHANGE_PASSWORD,
	ACCOUNT_LABEL_OLD_PASSWORD,
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
	ACCOUNT_LABEL_UPDATE_PASSWORD,
	ACCOUNT_LABEL_INNER_WORLD_TITLE,
	ACCOUNT_LABEL_STREAK_SUFFIX,
	ACCOUNT_LABEL_USERNAME,
	ACCOUNT_LABEL_SECURITY_TITLE,
	ACCOUNT_LABEL_USERNAME_CHANGED,
	ACCOUNT_LABEL_PASSWORD_CHANGED,
	ACCOUNT_LABEL_UPDATE_USERNAME,
	ACCOUNT_PLACEHOLDER_USERNAME,
	ACCOUNT_MSG_USERNAME_UPDATED,
	ACCOUNT_LABEL_VERIFIED,
	ACCOUNT_MSG_DELETE_CONFIRMED,
	ACCOUNT_MSG_INVALID_NEW_PASSWORD,
	ACCOUNT_MSG_INVALID_OLD_PASSWORD,
	ACCOUNT_MSG_PASSWORD_MISMATCH,
	ACCOUNT_MSG_PASSWORD_TOO_SHORT,
	ACCOUNT_MSG_PASSWORD_UPDATED,
	MILESTONE_KEY_ACCOUNT_CREATED,
	STATS_FIELD_ACTIVITY_STREAK,
	STATS_FIELD_MILESTONES,
	STATS_FIELD_USERNAME_CHANGED,
	STATS_FIELD_PASSWORD_CHANGED,
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
import { PasswordTooWeakError } from '../../common/error/password-too-weak.error';
import { WrongOldPasswordError } from '../../common/error/wrong-old-password.error';

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
	protected readonly ACCOUNT_LABEL_SECURITY_TITLE = ACCOUNT_LABEL_SECURITY_TITLE;
	protected readonly ACCOUNT_LABEL_USERNAME_CHANGED = ACCOUNT_LABEL_USERNAME_CHANGED;
	protected readonly ACCOUNT_LABEL_PASSWORD_CHANGED = ACCOUNT_LABEL_PASSWORD_CHANGED;
	protected readonly ACCOUNT_LABEL_UPDATE_USERNAME = ACCOUNT_LABEL_UPDATE_USERNAME;
	protected readonly ACCOUNT_PLACEHOLDER_USERNAME = ACCOUNT_PLACEHOLDER_USERNAME;
	protected readonly ACCOUNT_LABEL_EMAIL = ACCOUNT_LABEL_EMAIL;
	protected readonly ACCOUNT_LABEL_CHANGE_PASSWORD = ACCOUNT_LABEL_CHANGE_PASSWORD;
	protected readonly ACCOUNT_LABEL_OLD_PASSWORD = ACCOUNT_LABEL_OLD_PASSWORD;
	protected readonly ACCOUNT_LABEL_NEW_PASSWORD = ACCOUNT_LABEL_NEW_PASSWORD;
	protected readonly ACCOUNT_LABEL_CONFIRM_PASSWORD = ACCOUNT_LABEL_CONFIRM_PASSWORD;
	protected readonly ACCOUNT_LABEL_UPDATE_PASSWORD = ACCOUNT_LABEL_UPDATE_PASSWORD;
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
	protected usernameChangedDate = '';
	protected passwordChangedDate = '';
	protected currentUser$!: Observable<any>;
	protected usernameInput = '';
	protected oldPasswordInput = '';
	protected newPasswordInput = '';
	protected confirmPasswordInput = '';
	protected showOldPassword = false;
	protected showNewPassword = false;
	protected showConfirmPassword = false;
	private statsSub?: Subscription;

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		private authService: AuthService,
		private databaseService: DatabaseService,
		private dialogService: DialogService
	) {}

	/**
	 * Initialises the current-user observable and database subscriptions.
	 * Skips database setup when running server-side so SSR prerendering does not
	 * try to call CloudBase methods before the browser bootstrap completes.
	 */
	ngOnInit(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		this.currentUser$ = this.authService.getCurrentUser();
		firstValueFrom(this.currentUser$)
			.then((user) => {
				if (!user) return;
				(this.databaseService as CloudbaseService).ensureUserStatsExist().catch(() => {});
			})
			.catch(() => {});
		this.statsSub = (this.databaseService as CloudbaseService).getUserStats().subscribe((doc) => {
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
			this.usernameChangedDate = (doc[STATS_FIELD_USERNAME_CHANGED] as string) ?? '';
			this.passwordChangedDate = (doc[STATS_FIELD_PASSWORD_CHANGED] as string) ?? '';
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
	 * Submits the username update to CloudBase. Shows a success toast on success
	 * or opens the unexpected error dialog if the service throws.
	 */
	protected async updateUsername(): Promise<void> {
		try {
			await this.authService.updateUsername(this.usernameInput.trim());
			(this.databaseService as CloudbaseService)
				.updateUserStatsFields({
					[STATS_FIELD_USERNAME_CHANGED]: Utilities.formatDateForStorage(new Date())
				})
				.catch(() => {});
			this.dialogService.showToast(SUCCESS, ACCOUNT_MSG_USERNAME_UPDATED);
		} catch {
			this.dialogService.showUnexpectedError(this.dialogComponentContainer);
		}
	}

	/**
	 * Validates the password fields locally, then calls CloudBase to change the password.
	 * Shows a contextual warn toast for known errors (wrong current password, weak new
	 * password) and opens the unexpected-error dialog for all other failures.
	 * Clears all three password fields on success.
	 */
	protected async updatePassword(): Promise<void> {
		if (this.newPasswordInput.length < 6) {
			this.dialogService.showToast(TOAST_WARN, ACCOUNT_MSG_PASSWORD_TOO_SHORT);
			return;
		}
		if (this.newPasswordInput !== this.confirmPasswordInput) {
			this.dialogService.showToast(TOAST_WARN, ACCOUNT_MSG_PASSWORD_MISMATCH);
			return;
		}
		try {
			await this.authService.changePassword(this.oldPasswordInput, this.newPasswordInput);
			(this.databaseService as CloudbaseService)
				.updateUserStatsFields({
					[STATS_FIELD_PASSWORD_CHANGED]: Utilities.formatDateForStorage(new Date())
				})
				.catch(() => {});
			this.dialogService.showToast(SUCCESS, ACCOUNT_MSG_PASSWORD_UPDATED);
			this.oldPasswordInput = '';
			this.newPasswordInput = '';
			this.confirmPasswordInput = '';
		} catch (error: unknown) {
			if (error instanceof WrongOldPasswordError) {
				this.dialogService.openDialog(this.dialogComponentContainer, 'error', ACCOUNT_MSG_INVALID_OLD_PASSWORD);
			} else if (error instanceof PasswordTooWeakError) {
				this.dialogService.openDialog(this.dialogComponentContainer, 'error', ACCOUNT_MSG_INVALID_NEW_PASSWORD);
			} else {
				this.dialogService.showUnexpectedError(this.dialogComponentContainer);
			}
		}
	}

	/**
	 * Toggles the old-password field between masked and plain-text display.
	 */
	protected toggleOldPasswordVisibility(): void {
		this.showOldPassword = !this.showOldPassword;
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
	 * list of AccountMilestone objects. Entries are sorted newest first by their
	 * storage date (YYYY-MM-DD), and the date is converted to a human-readable
	 * "MMM yyyy" string for display.
	 *
	 * @param raw - The raw milestones map keyed by milestone key (e.g. "film1st").
	 * @returns The sorted list of AccountMilestone display objects, newest first.
	 */
	private buildMilestoneList(raw: Record<string, string>): AccountMilestone[] {
		return Object.entries(raw)
			.sort(([, dateA], [, dateB]) => dateB.localeCompare(dateA))
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
