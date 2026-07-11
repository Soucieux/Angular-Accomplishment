import { Inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { LOG } from '../../common/app.logs';
import { DatabaseService } from '../database-service/database.service';
import { CloudbaseService } from '../database-service/cloudbase/cloudbase.service';
import { Utilities } from '../../common/utilities/app.utilities';
import {
	CLOUDBASE_ERR_EMAIL_NOT_VERIFIED,
	CLOUDBASE_ERR_INVALID_EMAIL,
	CLOUDBASE_ERR_INVALID_PASSWORD,
	CLOUDBASE_ERR_INVALID_STATUS,
	CLOUDBASE_ERR_INVALID_VERIFICATION_CODE,
	CLOUDBASE_ERR_PASSWORD_TOO_WEAK,
	CLOUDBASE_ERR_PERMISSION_DENIED,
	CLOUDBASE_ERR_RATE_LIMIT_EXCEEDED,
	CLOUDBASE_ERR_NOT_FOUND,
	CLOUDBASE_ERR_USER_NOT_FOUND,
	CLOUDBASE_ERROR_INVALID_ARGUMENT,
	CLOUDBASE_ERROR_INVALID_CREDENTIALS,
	AUTH_LOG_SIGN_OUT_FAILED,
	AUTH_BEHAVIOR_LOG_TYPE_LOGIN
} from '../../common/constants';
import { AccountRateLimitedError } from '../../common/error/account-rate-limited.error';
import { EmailNotVerifiedError } from '../../common/error/email-not-verified.error';
import { InvalidEmailError } from '../../common/error/invalid-email.error';
import { PasswordTooWeakError } from '../../common/error/password-too-weak.error';
import { SessionExpiredError } from '../../common/error/session-expired.error';
import { UnexpectedError } from '../../common/error/unexpected.error';
import { UserNotFoundError } from '../../common/error/user-not-found.error';
import { WrongOldPasswordError } from '../../common/error/wrong-old-password.error';
import { WrongCredentialsError } from '../../common/error/wrong-credentials.error';
import { WrongVerificationCodeError } from '../../common/error/wrong-verification-code.error';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private readonly className = 'AuthService';
	private verification: any;
	private passwordResetData: any = null;
	private cloudbaseAuth: any;
	private cloudbaseUserSubject = new BehaviorSubject<any>(null);
	public readonly currentUser$: Observable<any> = this.cloudbaseUserSubject.asObservable();

	constructor(
		private router: Router,
		private databaseService: DatabaseService,
		private utilities: Utilities,
		private ngZone: NgZone,
		@Inject(PLATFORM_ID) private platformId: object
	) {
		/* Browser only — SSR prerendering has no CloudbaseService provider (main.ts
		   registers it in the browser bootstrap), so the root-provided abstract base
		   would be injected here and has no getCloudbaseAuth. */
		if (isPlatformBrowser(this.platformId)) {
			const cloudbaseService = this.databaseService as CloudbaseService;
			this.cloudbaseAuth = cloudbaseService.getCloudbaseAuth();
		}
	}

	// ── Common methods ───────────────────────────────────────────────────────

	/**
	 * Gets the current authenticated user as an observable from the CloudBase auth provider.
	 *
	 * @returns An observable that emits the current user or null.
	 */
	public getCurrentUser(): Observable<any> {
		return this.cloudbaseGetCurrentUser();
	}

	// ── CloudBase authentication methods ─────────────────────────────────────

	/**
	 * Signs in anonymously via CloudBase. Grants read-only access to public
	 * database collections without requiring a registered account.
	 */
	public async signInAnonymously(): Promise<void> {
		await this.cloudbaseAuth.signInAnonymously();
	}

	/**
	 * Requests a verification code to be sent to the given email address.
	 * The code is required when signing up a new CloudBase account.
	 *
	 * @param email - The email address to send the verification code to.
	 */
	public async getVerificationCodeEmail(email: string): Promise<void> {
		this.verification = await this.cloudbaseAuth.getVerification({ email });
	}

	/**
	 * Creates a new CloudBase account. Verifies the email code first,
	 * then calls signUp with the verification token and user details.
	 *
	 * @param email - The user's email address.
	 * @param password - The chosen password.
	 * @param username - The desired username.
	 * @param verificationCode - The numeric code sent to the email.
	 */
	public async signUp(
		email: string,
		password: string,
		username: string,
		verificationCode: number
	): Promise<void> {
		try {
			/* Step 1: Exchange the numeric email code for a short-lived verification token.
			   CloudBase requires this two-step exchange — the raw code alone cannot create an account. */
			const verificationTokenRes = await this.cloudbaseAuth.verify({
				verification_id: this.verification?.verification_id,
				verification_code: verificationCode
			});

			// Step 2: Create the account using the token obtained above
			await this.cloudbaseAuth.signUp({
				email: email,
				verification_code: verificationCode,
				verification_token: verificationTokenRes.verification_token,
				username: username,
				password: password
			});

			// Step 3: Populate the user subject and navigate to home
			this.cloudbaseGetCurrentUser();
			this.router.navigate(['/']).catch(() => {});
		} catch (error: unknown) {
			// Map the invalid-argument code to a typed error so the login form can show the right message
			if (error && (error as { code?: string }).code === CLOUDBASE_ERROR_INVALID_ARGUMENT) {
				throw new WrongVerificationCodeError();
			} else {
				throw new UnexpectedError();
			}
		}
	}

	/**
	 * Signs in with username and password via CloudBase. Throws WrongCredentialsError
	 * when credentials are invalid, or UnexpectedError on any other auth failure.
	 *
	 * @param username - The user's username.
	 * @param password - The user's password.
	 * @param returnUrl - The URL to navigate to after sign-in. Defaults to '/'.
	 * @throws WrongCredentialsError if the username or password is incorrect.
	 * @throws UnexpectedError if a different authentication error occurs.
	 */
	public async signIn(username: string, password: string, returnUrl: string = '/'): Promise<void> {
		// Step 1: Attempt sign-in — CloudBase returns errors in the response body, not as thrown exceptions
		const { error } = await this.cloudbaseAuth.signInWithPassword({
			username: username,
			password: password
		});

		/* Step 2: Map the error category to a typed class so callers can use instanceof.
		   Invalid-credentials is a predictable user mistake; all other errors are unexpected. */
		if (error && error.category === CLOUDBASE_ERROR_INVALID_CREDENTIALS) {
			throw new WrongCredentialsError();
		} else if (error) {
			throw new UnexpectedError();
		}

		// Step 3: Populate the user subject and navigate to the requested route
		this.cloudbaseGetCurrentUser();
		this.router.navigate([returnUrl]).catch(() => {});
	}

	/**
	 * Gets the current CloudBase user as an observable. Emits null for
	 * anonymous users (no username in metadata) and errors.
	 *
	 * @returns An observable that emits the current CloudBase user or null.
	 */
	private cloudbaseGetCurrentUser(): Observable<any> {
		this.cloudbaseAuth
			.getUser()
			.then((response: { data: { user: any } }) => {
				const data = response?.data;

				/* Distinguish a real account from an anonymous session.
				   Anonymous users have no username in metadata — emit null for them
				   to keep the dashboard hidden until a proper sign-in occurs. */
				if (data?.user?.user_metadata?.username) {
					/* Inside ngZone for the same reason as signOut() above — this .then()
					   callback runs outside Angular's zone, so without it Angular never
					   notices the state change and dependent views (e.g. the home
					   dashboard) stay stuck on their loading state until an unrelated
					   zone-patched event (like a route navigation) forces a redraw. */
					this.ngZone.run(() => {
						this.utilities.setIsUserAlive(true);
						CloudbaseService.setUseId(data.user.id);
						CloudbaseService.setUserRole(data.user.role ?? []);
						CloudbaseService.setUserName(data.user.user_metadata?.username);
						this.cloudbaseUserSubject.next(data.user);
						CloudbaseService.markAuthReady();
						CloudbaseService.setLoginState(true);
					});
				} else {
					this.cloudbaseUserSubject.next(null);
					CloudbaseService.setLoginState(false);
					this.ngZone.run(() => this.utilities.setIsUserAlive(false));
				}
			})
			.catch(() => {
				this.cloudbaseUserSubject.next(null);
				CloudbaseService.markAuthReady();
				CloudbaseService.setLoginState(false);
				this.ngZone.run(() => this.utilities.setIsUserAlive(false));
			});

		return this.cloudbaseUserSubject.asObservable();
	}

	/**
	 * Gets the timestamp of the most recent sign-in from the CloudBase security history log.
	 * Returns an empty string when no login events are recorded or the call fails.
	 *
	 * @returns The formatted date string (YYYY-MM-DD) of the last sign-in, or an empty string.
	 */
	public async getLastLoginTimestamp(): Promise<string> {
		try {
			// Step 1: Fetch the most recent LOGIN event from the CloudBase behaviour log
			const res = await this.cloudbaseAuth.getUserBehaviorLog({
				type: AUTH_BEHAVIOR_LOG_TYPE_LOGIN,
				limit: 1
			});

			/* Step 2: Normalise the response shape — CloudBase returns either { data: { list: [] } }
			   or a flat array depending on the SDK version, so both are handled defensively. */
			const list: unknown[] = res?.data?.list ?? (Array.isArray(res?.data) ? res.data : []);
			const event = list[0] as Record<string, unknown> | undefined;
			if (!event) return '';

			/* Step 3: Extract the timestamp field — the field name is not stable across SDK versions,
			   so we probe the four known variants in priority order. */
			const raw = event['created_at'] ?? event['timestamp'] ?? event['action_time'] ?? event['time'];
			if (!raw) return '';

			/* Step 4: Parse the raw value — numeric values are Unix epoch seconds (multiply by 1000),
			   string values are parsed directly by the Date constructor. */
			const date = typeof raw === 'number' ? new Date(raw * 1000) : new Date(String(raw));
			return isNaN(date.getTime()) ? '' : Utilities.formatDateForStorage(date);
		} catch {
			return '';
		}
	}

	/**
	 * Updates the username of the currently signed-in CloudBase user
	 * and refreshes the user subject so all subscribers receive the updated data.
	 *
	 * @param name - The new username to set.
	 */
	public async updateUsername(name: string): Promise<void> {
		const { error } = await this.cloudbaseAuth.updateUser({ username: name });
		if (error) throw new UnexpectedError();
		this.cloudbaseGetCurrentUser();
	}

	/**
	 * Changes the password of the currently signed-in CloudBase user.
	 * Handles both the CloudBase returned-error pattern and thrown-exception pattern,
	 * mapping known error codes to typed error classes so callers can use instanceof.
	 *
	 * @param oldPassword - The user's current password.
	 * @param newPassword - The new password to set.
	 * @throws WrongOldPasswordError when the old password is incorrect.
	 * @throws PasswordTooWeakError when the new password fails CloudBase strength requirements.
	 * @throws UnexpectedError for all other failures.
	 */
	public async changePassword(oldPassword: string, newPassword: string): Promise<void> {
		let caughtError: unknown;
		try {
			/* Step 1: Attempt the password change — CloudBase may surface the error either as a
			   returned { error } object or as a thrown exception depending on the failure type,
			   so both paths must be captured into the same variable for uniform handling below. */
			const { error } = await this.cloudbaseAuth.resetPasswordForOld({
				new_password: newPassword,
				old_password: oldPassword
			});
			if (!error) return;
			caughtError = error;
		} catch (thrown: unknown) {
			caughtError = thrown;
		}

		/* Step 2: Map the status code to a typed error class so callers can use instanceof
		   and display the correct message without inspecting raw CloudBase codes. */
		const status = (caughtError as { status?: string }).status;
		if (status === CLOUDBASE_ERR_INVALID_PASSWORD) throw new WrongOldPasswordError();
		if (status === CLOUDBASE_ERR_PASSWORD_TOO_WEAK) throw new PasswordTooWeakError();
		throw new UnexpectedError();
	}

	/**
	 * Deletes the current CloudBase user account after verifying the supplied password.
	 * On success the account is permanently removed server-side.
	 *
	 * @param password - The user's current password used to confirm the deletion.
	 * @throws WrongOldPasswordError when the password is incorrect or the user is not found.
	 * @throws AccountRateLimitedError when too many failed attempts have been made.
	 * @throws SessionExpiredError when the current session is no longer valid.
	 * @throws UnexpectedError for all other failures.
	 */
	public async deleteUser(password: string): Promise<void> {
		let caughtError: unknown;
		try {
			/* Step 1: Request account deletion — same dual error-surface pattern as changePassword:
			   CloudBase may return the error in the response object or throw it, so both paths
			   must be funnelled into caughtError for consistent handling below. */
			const { error } = await this.cloudbaseAuth.deleteUser({ password });
			if (!error) return;
			caughtError = error;
		} catch (thrown: unknown) {
			caughtError = thrown;
		}

		/* Step 2: Map each known status code to a typed error class.
		   INVALID_PASSWORD and USER_NOT_FOUND both indicate a bad password from the user's perspective.
		   INVALID_STATUS means the account is rate-limited; PERMISSION_DENIED means the session expired. */
		const status = (caughtError as { status?: string }).status;
		if (status === CLOUDBASE_ERR_INVALID_PASSWORD || status === CLOUDBASE_ERR_USER_NOT_FOUND) {
			throw new WrongOldPasswordError();
		}
		if (status === CLOUDBASE_ERR_INVALID_STATUS) throw new AccountRateLimitedError();
		if (status === CLOUDBASE_ERR_PERMISSION_DENIED) throw new SessionExpiredError();
		throw new UnexpectedError();
	}

	/**
	 * Verifies the current user's account password by re-authenticating against CloudBase Auth, the same
	 * server-side check delete-account relies on. Nothing is deleted or changed — it simply confirms the
	 * password, so a caller can gate a sensitive action (e.g. removing the vault passphrase) behind it. A
	 * wrong password surfaces as WrongOldPasswordError so callers can reuse the delete-dialog's inline error.
	 *
	 * @param password - The current account password to verify.
	 * @throws WrongOldPasswordError when the password is incorrect.
	 * @throws UnexpectedError for all other failures.
	 */
	public async verifyPassword(password: string): Promise<void> {
		const { error } = await this.cloudbaseAuth.signInWithPassword({
			username: CloudbaseService.getUserName(),
			password
		});
		if (error && error.category === CLOUDBASE_ERROR_INVALID_CREDENTIALS)
			throw new WrongOldPasswordError();
		if (error) throw new UnexpectedError();
	}

	/**
	 * Signs out the current CloudBase user. Clears user state and reactively
	 * updates auth status without navigating away from the current page.
	 */
	public async signOut(): Promise<void> {
		try {
			// Step 1: Revoke the CloudBase session server-side
			await this.cloudbaseAuth.signOut();

			/* Step 2: Clear all local auth state inside ngZone so Angular's change detection
			   fires and the UI updates synchronously — CloudBase callbacks run outside the zone. */
			this.ngZone.run(() => {
				this.cloudbaseUserSubject.next(null);
				this.utilities.setIsUserAlive(false);
				CloudbaseService.setUseId('');
				CloudbaseService.setUserRole([]);
				CloudbaseService.setUserName('');
				CloudbaseService.setLoginState(false);
			});
		} catch {
			LOG.error(this.className, AUTH_LOG_SIGN_OUT_FAILED);
		}
	}

	/**
	 * Sends a password-reset code to the given email address via CloudBase.
	 * Stores the returned data object for use in the subsequent {@link resetPassword} call.
	 *
	 * @param email - The email address registered on the account to reset.
	 * @throws InvalidEmailError if the email format is invalid.
	 * @throws UserNotFoundError if no account exists with this email.
	 * @throws EmailNotVerifiedError if the account email has not been verified.
	 * @throws AccountRateLimitedError if the reset request rate limit is exceeded.
	 * @throws UnexpectedError for all other failures.
	 */
	public async sendPasswordResetEmail(email: string): Promise<void> {
		const { data, error } = await this.cloudbaseAuth.resetPasswordForEmail(email);
		if (!error) {
			this.passwordResetData = data;
			return;
		}
		const status = (error as { status?: string }).status;
		switch (status) {
			case CLOUDBASE_ERR_INVALID_EMAIL:
				throw new InvalidEmailError();
			case CLOUDBASE_ERR_EMAIL_NOT_VERIFIED:
				throw new EmailNotVerifiedError();
			case CLOUDBASE_ERR_RATE_LIMIT_EXCEEDED:
				throw new AccountRateLimitedError();
			case CLOUDBASE_ERR_NOT_FOUND:
			case CLOUDBASE_ERR_USER_NOT_FOUND:
				throw new UserNotFoundError();
			default:
				throw new UnexpectedError();
		}
	}

	/**
	 * Resets the CloudBase user's password using the nonce code from the reset email.
	 * Clears the stored reset data on success and navigates to the return URL.
	 *
	 * @param code - The verification code received in the reset email.
	 * @param newPassword - The new password to set on the account.
	 * @param returnUrl - The URL to navigate to after a successful reset. Defaults to '/'.
	 * @throws WrongVerificationCodeError if the code is incorrect or expired.
	 * @throws PasswordTooWeakError if the new password fails CloudBase strength requirements.
	 * @throws UnexpectedError for all other failures.
	 */
	public async resetPassword(code: string, newPassword: string, returnUrl: string = '/'): Promise<void> {
		if (!this.passwordResetData) throw new SessionExpiredError();
		const { error } = await this.passwordResetData.updateUser({ nonce: code, password: newPassword });
		if (!error) {
			this.passwordResetData = null;
			this.cloudbaseGetCurrentUser();
			this.router.navigate([returnUrl]).catch(() => {});
			return;
		}
		const status = (error as { status?: string }).status;
		switch (status) {
			case CLOUDBASE_ERR_INVALID_VERIFICATION_CODE:
				throw new WrongVerificationCodeError();
			case CLOUDBASE_ERR_INVALID_PASSWORD:
				throw new PasswordTooWeakError();
			case CLOUDBASE_ERR_NOT_FOUND:
			case CLOUDBASE_ERR_USER_NOT_FOUND:
				throw new UserNotFoundError();
			default:
				throw new UnexpectedError();
		}
	}
}
