import {
	AfterViewInit,
	ChangeDetectorRef,
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
import { Router } from '@angular/router';
import { AuthService } from '../../backend/authentication-service/auth.service';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { ConnectedMember, DatabaseService } from '../../backend/database-service/database.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { Utilities } from '../../common/utilities/app.utilities';
import {
	MILESTONE_KEY_ACCOUNT_CREATED,
	STATS_FIELD_ACTIVITY_STREAK,
	STATS_FIELD_MILESTONES,
	STATS_FIELD_USERNAME_CHANGED,
	STATS_FIELD_PASSWORD_CHANGED,
	STATS_FIELD_CONNECT_CODE,
	STATS_FIELD_INCOMING_REQUESTS,
	STATS_FIELD_OUTGOING_REQUESTS,
	STATS_FIELD_CONNECTIONS,
	CONNECT_STATUS_PENDING,
	CONNECT_STATUS_CONNECTED,
	CONNECT_STATUS_DECLINED,
	CONNECT_STATUS_LEAVE,
	CONNECT_ERROR_CODE_NOT_FOUND,
	CONNECT_ERROR_SELF,
	CONNECT_ERROR_ALREADY_CONNECTED,
	CONNECT_ERROR_ALREADY_REQUESTED,
	SUCCESS,
	TOAST_WARN
} from '../../common/constants';
import {
	ACCOUNT_LABEL_CHANGE_PASSWORD,
	ACCOUNT_LABEL_OLD_PASSWORD,
	ACCOUNT_LABEL_CONFIRM_PASSWORD,
	ACCOUNT_LABEL_DANGER_ZONE_TITLE,
	ACCOUNT_LABEL_DELETE_ACCOUNT,
	ACCOUNT_LABEL_DELETE_DESCRIPTION,
	ACCOUNT_LABEL_IDENTITY_TITLE,
	ACCOUNT_LABEL_MEMBER_SINCE,
	ACCOUNT_LABEL_MILESTONES_TITLE,
	ACCOUNT_LABEL_PROFILE_TAGLINE,
	ACCOUNT_LABEL_UPDATE_PASSWORD,
	ACCOUNT_LABEL_INNER_WORLD_TITLE,
	ACCOUNT_LABEL_STREAK_SUFFIX,
	ACCOUNT_LABEL_SECURITY_TITLE,
	ACCOUNT_LABEL_LAST_LOGIN,
	ACCOUNT_LABEL_USERNAME_CHANGED,
	ACCOUNT_LABEL_PASSWORD_CHANGED,
	ACCOUNT_LABEL_UPDATE_USERNAME,
	ACCOUNT_MSG_DELETING_ACCOUNT,
	ACCOUNT_PLACEHOLDER_USERNAME,
	ACCOUNT_MSG_USERNAME_UPDATED,
	ACCOUNT_LABEL_CONNECTIONS_TITLE,
	ACCOUNT_LABEL_CONNECT_CODE,
	ACCOUNT_LABEL_COPY,
	ACCOUNT_MSG_CODE_COPIED,
	ACCOUNT_LABEL_CONNECTED_TITLE,
	ACCOUNT_PLACEHOLDER_CONNECT_CODE,
	ACCOUNT_LABEL_SEND_REQUEST,
	ACCOUNT_LABEL_APPROVE,
	ACCOUNT_LABEL_DECLINE,
	ACCOUNT_LABEL_NO_CONNECTIONS,
	ACCOUNT_LABEL_LINK_ACCOUNT,
	ACCOUNT_LABEL_REQUESTS,
	ACCOUNT_STATUS_PENDING,
	ACCOUNT_STATUS_CONNECTED,
	ACCOUNT_STATUS_DECLINED,
	ACCOUNT_STATUS_LEFT,
	ACCOUNT_MSG_REQUEST_SENT,
	ACCOUNT_MSG_REQUEST_CANCELED,
	ACCOUNT_MSG_REQUEST_FAILED,
	ACCOUNT_MSG_INVALID_CODE,
	ACCOUNT_MSG_SELF_CODE,
	ACCOUNT_MSG_ALREADY_CONNECTED,
	ACCOUNT_MSG_ALREADY_REQUESTED,
	ACCOUNT_MSG_CONNECTED,
	ACCOUNT_MSG_DISCONNECTED,
	ACCOUNT_LABEL_VERIFIED,
	ACCOUNT_MSG_NO_EMAIL,
	ACCOUNT_MSG_PASSWORD_MISMATCH,
	ACCOUNT_MSG_PASSWORD_TOO_SHORT,
	ACCOUNT_MSG_PASSWORD_UPDATED,
	ACCOUNT_STAT_LABEL_FILMS,
	ACCOUNT_STAT_LABEL_QUOTES,
	ACCOUNT_STAT_LABEL_DEBTS,
	ACCOUNT_STAT_LABEL_LINKS,
	NAV_LABEL_RECIPES,
	ORBITAL_LABEL_REMINDERS,
	LABEL_EMAIL,
	LABEL_USERNAME,
	LABEL_NEW_PASSWORD,
	ACCOUNT_STAT_UNIT_FILM,
	ACCOUNT_STAT_UNIT_QUOTE,
	ACCOUNT_STAT_UNIT_RECIPE,
	ACCOUNT_STAT_UNIT_REMINDER,
	ACCOUNT_STAT_UNIT_DEBT,
	ACCOUNT_STAT_UNIT_LINK,
	ACCOUNT_MILESTONE_ACCOUNT_CREATED_TITLE,
	ACCOUNT_MILESTONE_ACCOUNT_CREATED_NOTE,
	ACCOUNT_MILESTONE_FILM_TITLE,
	ACCOUNT_MILESTONE_FILM_NOTE,
	ACCOUNT_MILESTONE_QUOTE_TITLE,
	ACCOUNT_MILESTONE_QUOTE_NOTE,
	ACCOUNT_MILESTONE_RECIPE_TITLE,
	ACCOUNT_MILESTONE_RECIPE_NOTE,
	ACCOUNT_MILESTONE_REMINDER_TITLE,
	ACCOUNT_MILESTONE_REMINDER_NOTE,
	ACCOUNT_MILESTONE_DEBT_TITLE,
	ACCOUNT_MILESTONE_DEBT_NOTE,
	ACCOUNT_MILESTONE_LINK_TITLE,
	ACCOUNT_MILESTONE_LINK_NOTE,
	ACCOUNT_MILESTONE_STREAK_TITLE,
	ACCOUNT_MILESTONE_STREAK_NOTE,
	ACCOUNT_DOMAIN_FILMS,
	ACCOUNT_DOMAIN_QUOTES,
	ACCOUNT_DOMAIN_RECIPES,
	ACCOUNT_DOMAIN_REMINDERS,
	ACCOUNT_DOMAIN_DEBTS,
	ACCOUNT_DOMAIN_LINKS,
	ACCOUNT_DOMAIN_STREAK,
	ACCOUNT_STRENGTH_TOO_SHORT,
	ACCOUNT_STRENGTH_WEAK,
	ACCOUNT_STRENGTH_FAIR,
	ACCOUNT_STRENGTH_GOOD,
	ACCOUNT_STRENGTH_STRONG,
	ACTIVE_LOCALE
} from '../../common/locale/locale-strings';
import {
	AccountMilestone,
	AccountStat,
	IncomingConnectRequest,
	OutgoingConnectRequest,
	ACCOUNT_STATS,
	ACCOUNT_STRENGTH_LEVELS
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
	protected readonly ACTIVE_LOCALE = ACTIVE_LOCALE;
	protected readonly ACCOUNT_LABEL_PROFILE_TAGLINE = ACCOUNT_LABEL_PROFILE_TAGLINE;
	protected readonly ACCOUNT_LABEL_MEMBER_SINCE = ACCOUNT_LABEL_MEMBER_SINCE;
	protected readonly ACCOUNT_LABEL_STREAK_SUFFIX = ACCOUNT_LABEL_STREAK_SUFFIX;
	protected readonly ACCOUNT_LABEL_VERIFIED = ACCOUNT_LABEL_VERIFIED;
	protected readonly ACCOUNT_MSG_NO_EMAIL = ACCOUNT_MSG_NO_EMAIL;
	protected readonly ACCOUNT_LABEL_IDENTITY_TITLE = ACCOUNT_LABEL_IDENTITY_TITLE;
	protected readonly ACCOUNT_LABEL_INNER_WORLD_TITLE = ACCOUNT_LABEL_INNER_WORLD_TITLE;
	protected readonly ACCOUNT_LABEL_MILESTONES_TITLE = ACCOUNT_LABEL_MILESTONES_TITLE;
	protected readonly ACCOUNT_LABEL_DANGER_ZONE_TITLE = ACCOUNT_LABEL_DANGER_ZONE_TITLE;
	protected readonly LABEL_USERNAME = LABEL_USERNAME;
	protected readonly ACCOUNT_LABEL_SECURITY_TITLE = ACCOUNT_LABEL_SECURITY_TITLE;
	protected readonly ACCOUNT_LABEL_CONNECTIONS_TITLE = ACCOUNT_LABEL_CONNECTIONS_TITLE;
	protected readonly ACCOUNT_LABEL_CONNECT_CODE = ACCOUNT_LABEL_CONNECT_CODE;
	protected readonly ACCOUNT_LABEL_COPY = ACCOUNT_LABEL_COPY;
	protected readonly ACCOUNT_LABEL_CONNECTED_TITLE = ACCOUNT_LABEL_CONNECTED_TITLE;
	protected readonly ACCOUNT_PLACEHOLDER_CONNECT_CODE = ACCOUNT_PLACEHOLDER_CONNECT_CODE;
	protected readonly ACCOUNT_LABEL_SEND_REQUEST = ACCOUNT_LABEL_SEND_REQUEST;
	protected readonly ACCOUNT_LABEL_APPROVE = ACCOUNT_LABEL_APPROVE;
	protected readonly ACCOUNT_LABEL_DECLINE = ACCOUNT_LABEL_DECLINE;
	protected readonly ACCOUNT_LABEL_NO_CONNECTIONS = ACCOUNT_LABEL_NO_CONNECTIONS;
	protected readonly ACCOUNT_LABEL_LINK_ACCOUNT = ACCOUNT_LABEL_LINK_ACCOUNT;
	protected readonly ACCOUNT_LABEL_REQUESTS = ACCOUNT_LABEL_REQUESTS;
	protected readonly CONNECT_STATUS_CONNECTED = CONNECT_STATUS_CONNECTED;
	protected readonly CONNECT_STATUS_DECLINED = CONNECT_STATUS_DECLINED;
	protected readonly CONNECT_STATUS_LEAVE = CONNECT_STATUS_LEAVE;
	protected readonly ACCOUNT_LABEL_LAST_LOGIN = ACCOUNT_LABEL_LAST_LOGIN;
	protected readonly ACCOUNT_LABEL_USERNAME_CHANGED = ACCOUNT_LABEL_USERNAME_CHANGED;
	protected readonly ACCOUNT_LABEL_PASSWORD_CHANGED = ACCOUNT_LABEL_PASSWORD_CHANGED;
	protected readonly ACCOUNT_LABEL_UPDATE_USERNAME = ACCOUNT_LABEL_UPDATE_USERNAME;
	protected readonly ACCOUNT_PLACEHOLDER_USERNAME = ACCOUNT_PLACEHOLDER_USERNAME;
	protected readonly LABEL_EMAIL = LABEL_EMAIL;
	protected readonly ACCOUNT_LABEL_CHANGE_PASSWORD = ACCOUNT_LABEL_CHANGE_PASSWORD;
	protected readonly ACCOUNT_LABEL_OLD_PASSWORD = ACCOUNT_LABEL_OLD_PASSWORD;
	protected readonly LABEL_NEW_PASSWORD = LABEL_NEW_PASSWORD;
	protected readonly ACCOUNT_LABEL_CONFIRM_PASSWORD = ACCOUNT_LABEL_CONFIRM_PASSWORD;
	protected readonly ACCOUNT_LABEL_UPDATE_PASSWORD = ACCOUNT_LABEL_UPDATE_PASSWORD;
	protected readonly ACCOUNT_LABEL_DELETE_ACCOUNT = ACCOUNT_LABEL_DELETE_ACCOUNT;
	protected readonly ACCOUNT_LABEL_DELETE_DESCRIPTION = ACCOUNT_LABEL_DELETE_DESCRIPTION;
	protected readonly ACCOUNT_STRENGTH_LEVELS = ACCOUNT_STRENGTH_LEVELS;
	private readonly localeStatLabels: Record<string, string> = {
		totalFilms: ACCOUNT_STAT_LABEL_FILMS, totalQuotes: ACCOUNT_STAT_LABEL_QUOTES,
		totalRecipes: NAV_LABEL_RECIPES, totalReminders: ORBITAL_LABEL_REMINDERS,
		totalDebts: ACCOUNT_STAT_LABEL_DEBTS, totalLinks: ACCOUNT_STAT_LABEL_LINKS,
	};
	private readonly localeStatUnits: Record<string, string> = {
		totalFilms: ACCOUNT_STAT_UNIT_FILM, totalQuotes: ACCOUNT_STAT_UNIT_QUOTE,
		totalRecipes: ACCOUNT_STAT_UNIT_RECIPE, totalReminders: ACCOUNT_STAT_UNIT_REMINDER,
		totalDebts: ACCOUNT_STAT_UNIT_DEBT, totalLinks: ACCOUNT_STAT_UNIT_LINK,
	};
	private readonly localeMilestoneLabels: Record<string, { title: string; note: string }> = {
		accountCreated: { title: ACCOUNT_MILESTONE_ACCOUNT_CREATED_TITLE, note: ACCOUNT_MILESTONE_ACCOUNT_CREATED_NOTE },
		film1st:        { title: ACCOUNT_MILESTONE_FILM_TITLE,            note: ACCOUNT_MILESTONE_FILM_NOTE },
		quote1st:       { title: ACCOUNT_MILESTONE_QUOTE_TITLE,           note: ACCOUNT_MILESTONE_QUOTE_NOTE },
		recipe1st:      { title: ACCOUNT_MILESTONE_RECIPE_TITLE,          note: ACCOUNT_MILESTONE_RECIPE_NOTE },
		reminder1st:    { title: ACCOUNT_MILESTONE_REMINDER_TITLE,        note: ACCOUNT_MILESTONE_REMINDER_NOTE },
		debt1st:        { title: ACCOUNT_MILESTONE_DEBT_TITLE,            note: ACCOUNT_MILESTONE_DEBT_NOTE },
		link1st:        { title: ACCOUNT_MILESTONE_LINK_TITLE,            note: ACCOUNT_MILESTONE_LINK_NOTE },
		streak1st:      { title: ACCOUNT_MILESTONE_STREAK_TITLE,          note: ACCOUNT_MILESTONE_STREAK_NOTE },
	};
	private readonly localeDomainDisplay: Record<string, string> = {
		film: ACCOUNT_DOMAIN_FILMS, quote: ACCOUNT_DOMAIN_QUOTES, recipe: ACCOUNT_DOMAIN_RECIPES,
		reminder: ACCOUNT_DOMAIN_REMINDERS, debt: ACCOUNT_DOMAIN_DEBTS, link: ACCOUNT_DOMAIN_LINKS,
		streak: ACCOUNT_DOMAIN_STREAK,
	};
	private readonly localeStrengthLabels: string[] = [
		ACCOUNT_STRENGTH_TOO_SHORT, ACCOUNT_STRENGTH_WEAK, ACCOUNT_STRENGTH_FAIR,
		ACCOUNT_STRENGTH_GOOD, ACCOUNT_STRENGTH_STRONG,
	];

	// ── Mutable state ─────────────────────────────────────────────────────────
	protected userStats: AccountStat[] = ACCOUNT_STATS.map((stat) => ({
		...stat,
		label: this.localeStatLabels[stat.field] ?? '',
		unit: this.localeStatUnits[stat.field] ?? '',
	}));
	protected streakCount = 0;
	protected memberSince = '';
	protected milestoneList: AccountMilestone[] = [];
	protected isStatsLoaded = false;
	protected lastLoginDate = '';
	protected usernameChangedDate = '';
	protected passwordChangedDate = '';
	protected connectCode = '';
	protected connectCodeInput = '';
	protected incomingRequests: IncomingConnectRequest[] = [];
	protected outgoingRequests: OutgoingConnectRequest[] = [];
	protected connectedMembers: ConnectedMember[] = [];
	protected connectBusy = false;
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
		private router: Router,
		private authService: AuthService,
		private databaseService: DatabaseService,
		private dialogService: DialogService,
		private cdr: ChangeDetectorRef
	) {}

	/**
	 * Initialises the current-user observable and database subscriptions.
	 * Skips database setup when running server-side so SSR prerendering does not
	 * try to call CloudBase methods before the browser bootstrap completes.
	 */
	ngOnInit(): void {
		if (!isPlatformBrowser(this.platformId)) return;

		// Step 1: Wire up the current-user observable used by the template
		this.currentUser$ = this.authService.getCurrentUser();

		// Step 2: Once the first user emission resolves, seed stats and fetch the last-login date
		firstValueFrom(this.currentUser$)
			.then((user) => {
				if (!user) return;
				// Ensure the users doc exists (and carries a connect code) before the live stream reads it.
				(this.databaseService as CloudbaseService).ensureUserStatsExist().catch(() => {});
				this.authService
					.getLastLoginTimestamp()
					.then((date) => {
						this.lastLoginDate = date;
						this.cdr.detectChanges();
					})
					.catch(() => {});
			})
			.catch(() => {});

		/* Step 3: Subscribe to the live stats document and project all derived display fields.
		   detectChanges is called explicitly here because this subscription fires outside the
		   Angular zone (CloudBase SDK callbacks are not zone-patched). */
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
			// Connections data lives on this same live user document — real-time, no one-shot loads.
			this.connectCode = (doc[STATS_FIELD_CONNECT_CODE] as string) ?? '';
			this.incomingRequests = Utilities.toArray(doc[STATS_FIELD_INCOMING_REQUESTS]) as IncomingConnectRequest[];
			this.outgoingRequests = Utilities.toArray(doc[STATS_FIELD_OUTGOING_REQUESTS]) as OutgoingConnectRequest[];
			// Connection records (connected + left) live on the same own document — fully real-time.
			this.connectedMembers = Utilities.toArray(doc[STATS_FIELD_CONNECTIONS]) as ConnectedMember[];
			this.isStatsLoaded = true;
			this.cdr.detectChanges();
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

			/* Record the change timestamp in the stats doc as a fire-and-forget write.
			   It is intentionally not awaited — a failure here must not block the success toast. */
			(this.databaseService as CloudbaseService)
				.updateUserStatsFields({
					[STATS_FIELD_USERNAME_CHANGED]: Utilities.formatDateForStorage(new Date())
				})
				.catch(() => {});

			// Confirm success to the user only after the auth update resolves
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
		// Step 1: Validate new password locally before making any network call
		if (this.newPasswordInput.length < 6) {
			this.dialogService.showToast(TOAST_WARN, ACCOUNT_MSG_PASSWORD_TOO_SHORT);
			return;
		}
		if (this.newPasswordInput !== this.confirmPasswordInput) {
			this.dialogService.showToast(TOAST_WARN, ACCOUNT_MSG_PASSWORD_MISMATCH);
			return;
		}
		try {
			// Step 2: Attempt the credential change — requires the current password for re-authentication
			await this.authService.changePassword(this.oldPasswordInput, this.newPasswordInput);

			/* Step 3: Record the change timestamp as a fire-and-forget write — same non-blocking
			   pattern as updateUsername so a stats failure cannot suppress the success toast. */
			(this.databaseService as CloudbaseService)
				.updateUserStatsFields({
					[STATS_FIELD_PASSWORD_CHANGED]: Utilities.formatDateForStorage(new Date())
				})
				.catch(() => {});

			// Step 4: Confirm success and clear all password fields to prevent accidental re-submission
			this.dialogService.showToast(SUCCESS, ACCOUNT_MSG_PASSWORD_UPDATED);
			this.oldPasswordInput = '';
			this.newPasswordInput = '';
			this.confirmPasswordInput = '';
		} catch (error: unknown) {
			/* Step 5: Surface known error types with contextual messages; fall back to the generic
			   unexpected-error dialog for anything else to avoid leaking internal error details. */
			if (error instanceof WrongOldPasswordError || error instanceof PasswordTooWeakError) {
				this.dialogService.openDialog(
					this.dialogComponentContainer,
					'error',
					(error as Error).message
				);
			} else {
				this.dialogService.showUnexpectedError(this.dialogComponentContainer);
			}
		}
	}

	// ── Connected accounts handlers ────────────────────────────────────────────

	/**
	 * Copies the user's connect code to the clipboard and confirms with a toast.
	 */
	protected async copyConnectCode(): Promise<void> {
		try {
			await Utilities.copyToClipboard(this.connectCode);
			this.dialogService.showToast(SUCCESS, ACCOUNT_MSG_CODE_COPIED);
		} catch {
			this.dialogService.showUnexpectedError(this.dialogComponentContainer);
		}
	}

	/**
	 * Sends a connect request to the account owning the entered connect code, then clears the input
	 * and confirms (or warns on a known failure).
	 */
	protected async sendConnectRequest(): Promise<void> {
		const code = this.connectCodeInput.trim();
		if (!code) return;
		await this.runConnectAction(async () => {
			try {
				const result = await this.databaseService.sendConnectRequest(code);
				if (result.success) {
					this.connectCodeInput = '';
					this.dialogService.showToast(SUCCESS, ACCOUNT_MSG_REQUEST_SENT);
				} else {
					this.dialogService.showToast(TOAST_WARN, this.connectErrorMessage(result.error));
				}
			} catch {
				this.dialogService.showToast(TOAST_WARN, ACCOUNT_MSG_REQUEST_FAILED);
			}
		});
	}

	/**
	 * Approves a pending connect request, linking the accounts, then refreshes the lists.
	 *
	 * @param fromOpenid - The openid of the requesting account.
	 */
	protected async approveRequest(fromOpenid: string): Promise<void> {
		await this.runConnectAction(async () => {
			try {
				const result = await this.databaseService.respondConnectRequest(fromOpenid, true);
				if (result.success) this.dialogService.showToast(SUCCESS, ACCOUNT_MSG_CONNECTED);
			} catch {
				this.dialogService.showUnexpectedError(this.dialogComponentContainer);
			}
		});
	}

	/**
	 * Declines a pending connect request, then refreshes the request list.
	 *
	 * @param fromOpenid - The openid of the requesting account.
	 */
	protected async declineRequest(fromOpenid: string): Promise<void> {
		await this.runConnectAction(async () => {
			try {
				await this.databaseService.respondConnectRequest(fromOpenid, false);
			} catch {
				this.dialogService.showUnexpectedError(this.dialogComponentContainer);
			}
		});
	}

	/**
	 * Handles the × on a connected account. A still-connected row leaves the connection (removing the
	 * link on both sides and marking both records 'leave'); an already-left row is cleared from the
	 * user's own list. The live stream updates the row either way.
	 *
	 * @param member - The connection record, carrying its openid and status.
	 */
	protected async onConnectionRemove(member: ConnectedMember): Promise<void> {
		await this.runConnectAction(async () => {
			try {
				if (member.status === CONNECT_STATUS_LEAVE) {
					await this.databaseService.clearConnection(member.openid);
					return;
				}
				const result = await this.databaseService.disconnect(member.openid);
				if (result.success) this.dialogService.showToast(SUCCESS, ACCOUNT_MSG_DISCONNECTED);
			} catch {
				this.dialogService.showUnexpectedError(this.dialogComponentContainer);
			}
		});
	}

	/**
	 * Handles the × on a sent request. A still-pending request is cancelled (withdrawn from both
	 * sides) with a toast; a resolved (connected/declined) row is just cleared from the user's list.
	 * The live stream removes the row either way.
	 *
	 * @param request - The sent-request entry, carrying its target openid and status.
	 */
	protected async removeOutgoingRequest(request: OutgoingConnectRequest): Promise<void> {
		await this.runConnectAction(async () => {
			if (request.status === CONNECT_STATUS_PENDING) {
				await this.databaseService.cancelConnectRequest(request.toOpenid).catch(() => {});
				this.dialogService.showToast(SUCCESS, ACCOUNT_MSG_REQUEST_CANCELED);
			} else {
				await this.databaseService.clearOutgoingRequest(request.toOpenid).catch(() => {});
			}
		});
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
	 * Opens the delete-account dialog. On password confirmation, calls CloudBase to
	 * permanently delete the account, then signs out and navigates to the home route.
	 */
	protected openDeleteConfirmationDialog(): void {
		/* Step 1: Open the password-confirmation dialog. The callback only fires when the user
		   submits a valid password — cancellation silently closes with no side effects. */
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			'delete-account',
			async (password: string) => {
				/* Step 2: Replace the confirmation dialog with a blocking spinner while deletion runs.
				   The block dialog must wrap both deleteUser and signOut — if it only wrapped deleteUser,
				   the user could interact with the page between deletion and navigation. */
				await this.dialogService.openDialog(
					this.dialogComponentContainer,
					'block',
					async () => {
						// Step 3: Delete the account, sign out, then navigate away — order is mandatory
						await this.authService.deleteUser(password);
						await this.authService.signOut();
						this.router.navigate(['/']).catch(() => {});
					},
					ACCOUNT_MSG_DELETING_ACCOUNT
				);
			}
		);
	}

	// ── Private helpers ───────────────────────────────────────────────────────

	/**
	 * Runs a connection action under a single-flight guard so rapid repeat clicks cannot fire duplicate
	 * requests. Ignores the call while another connection action is in flight, and always clears the
	 * busy flag when the action settles.
	 *
	 * @param action - The connection action to run exclusively.
	 */
	private async runConnectAction(action: () => Promise<void>): Promise<void> {
		if (this.connectBusy) return;
		this.connectBusy = true;
		this.cdr.detectChanges();
		try {
			await action();
		} finally {
			this.connectBusy = false;
			this.cdr.detectChanges();
		}
	}

	/**
	 * Maps a connect Cloud Function error code to a user-facing message, so raw codes are never shown.
	 *
	 * @param code - The error code returned by the send-request Cloud Function, if any.
	 * @returns The localized message for the code, or a generic failure message when unrecognised.
	 */
	private connectErrorMessage(code: string | undefined): string {
		switch (code) {
			case CONNECT_ERROR_CODE_NOT_FOUND:
				return ACCOUNT_MSG_INVALID_CODE;
			case CONNECT_ERROR_SELF:
				return ACCOUNT_MSG_SELF_CODE;
			case CONNECT_ERROR_ALREADY_CONNECTED:
				return ACCOUNT_MSG_ALREADY_CONNECTED;
			case CONNECT_ERROR_ALREADY_REQUESTED:
				return ACCOUNT_MSG_ALREADY_REQUESTED;
			default:
				return ACCOUNT_MSG_REQUEST_FAILED;
		}
	}

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
		return (
			Object.entries(raw)
				// Step 1: Sort newest first — localeCompare works here because dates are stored as YYYY-MM-DD
				.sort(([, dateA], [, dateB]) => dateB.localeCompare(dateA))
				.map(([key, storageDate]) => {
					// Step 2a: Named milestones (e.g. account-created) resolve directly from the label map
					const label = this.localeMilestoneLabels[key];
					if (label) {
						return {
							title: label.title,
							date: Utilities.storageDateToDisplayMonth(storageDate),
							note: label.note
						};
					}

					/* Step 2b: Counted milestones use a key pattern like "film3rd" or "recipe10th".
				   The regex captures domain prefix, numeric count, and ordinal suffix separately
				   so both the count and the human-readable domain label can be composed at runtime. */
					const match = key.match(/^([a-z]+?)(\d+)(st|th)$/);
					if (!match) return null;
					const [, domain, count] = match;
					const domainLabel = this.localeDomainDisplay[domain];
					if (!domainLabel) return null;
					const title = `${count}${domainLabel}`;
					return { title, date: Utilities.storageDateToDisplayMonth(storageDate), note: '' };
				})
				// Step 3: Drop nulls produced by unrecognised key shapes — typed predicate keeps the array type clean
				.filter((milestone): milestone is AccountMilestone => milestone !== null)
		);
	}

	// ── Template helper methods ───────────────────────────────────────────────

	/**
	 * Gets the localized status label for a connection record.
	 *
	 * @param status - The stored connection status value.
	 * @returns The display label — "Left" for a left connection, otherwise "Connected".
	 */
	protected connectionStatusLabel(status: string | undefined): string {
		return status === CONNECT_STATUS_LEAVE ? ACCOUNT_STATUS_LEFT : ACCOUNT_STATUS_CONNECTED;
	}

	/**
	 * Gets the localized display label for a sent-request status.
	 *
	 * @param status - The stored request status value.
	 * @returns The display label for the status.
	 */
	protected outgoingStatusLabel(status: string): string {
		if (status === CONNECT_STATUS_CONNECTED) return ACCOUNT_STATUS_CONNECTED;
		if (status === CONNECT_STATUS_DECLINED) return ACCOUNT_STATUS_DECLINED;
		return ACCOUNT_STATUS_PENDING;
	}

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
		return this.localeStrengthLabels[this.getPasswordStrengthIndex(password)];
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
	 * Gets the avatar image URL from the user object, checking both CloudBase fields.
	 *
	 * @param user - The authenticated user object from the auth observable.
	 * @returns The avatar URL string, or an empty string if no photo is set.
	 */
	protected getUserAvatarUrl(user: any): string {
		return Utilities.getUserAvatarUrl(user);
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
