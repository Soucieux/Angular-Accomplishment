import { EnvironmentInjector, Inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
	GoogleAuthProvider,
	signInWithPopup,
	signInWithRedirect,
	getRedirectResult,
	reauthenticateWithPopup,
	updateProfile,
	Auth,
	User,
	signOut,
	onAuthStateChanged
} from 'firebase/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { LOG } from '../../common/app.logs';
import { CLOUDBASE, FIREBASE_AUTH } from '../database-service/database.service';
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
	LS_AUTH_BACKEND,
	SS_GOOGLE_RETURN_URL,
	AUTH_BACKEND_FIREBASE,
	AUTH_BACKEND_CLOUDBASE,
	AUTH_POPUP_FALLBACK_CODES,
	AUTH_LOG_GOOGLE_SIGN_IN_FAILED,
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
	private firebaseAuth!: Auth;
	private cloudbaseUserSubject = new BehaviorSubject<any>(null);
	private firebaseUserSubject = new BehaviorSubject<User | null>(null);

	constructor(
		@Inject(EnvironmentInjector) private environmentInjector: EnvironmentInjector,
		@Inject(PLATFORM_ID) private platformId: object,
		private router: Router,
		private ngZone: NgZone,
		private utilities: Utilities
	) {
		/* Both auth SDKs are provided in the browser bootstrap (main.ts), so acquire both here:
		   CloudBase powers username/password sign-in, Firebase powers Google sign-in, and the login
		   page offers both regardless of the active data backend. Skipped during SSR, where neither
		   token is provided. */
		if (isPlatformBrowser(this.platformId)) {
			this.cloudbaseAuth = this.environmentInjector.get(CLOUDBASE).auth();
			this.firebaseAuth = this.environmentInjector.get(FIREBASE_AUTH);
			this.handleGoogleRedirectResult();
		}
	}

	// ── Common methods ───────────────────────────────────────────────────────

	/**
	 * Gets the current authenticated user as an observable, selecting the provider that matches
	 * the active data backend (Firebase for Google sign-in users, CloudBase by default).
	 *
	 * @returns An observable that emits the current user or null.
	 */
	public getCurrentUser(): Observable<any> {
		return Utilities.isFirebaseBackend()
			? this.firebaseGetCurrentUser()
			: this.cloudbaseGetCurrentUser();
	}

	/**
	 * Navigates to the post-sign-in destination after recording which backend the session uses.
	 * When the backend changed (e.g. a CloudBase session becoming Firebase after Google sign-in), a
	 * full-page navigation re-bootstraps the app onto the matching data providers — this coincides
	 * with the normal post-sign-in redirect, so the user sees only the expected navigation. When the
	 * backend is unchanged, an in-app router navigation keeps it instant.
	 *
	 * {@link signIn} - Records the CloudBase backend after a username/password sign-in.
	 * {@link signUp} - Records the CloudBase backend after account creation.
	 * {@link resetPassword} - Records the CloudBase backend after a password reset.
	 * {@link googleLogin} - Records the Firebase backend after Google sign-in.
	 *
	 * @param backend - The backend the completed sign-in used.
	 * @param returnUrl - The destination to navigate to after sign-in.
	 */
	private navigateAfterLogin(backend: string, returnUrl: string): void {
		const backendChanged = Utilities.isFirebaseBackend() !== (backend === AUTH_BACKEND_FIREBASE);
		localStorage.setItem(LS_AUTH_BACKEND, backend);
		if (backendChanged) {
			window.location.assign(returnUrl);
		} else {
			this.router.navigate([returnUrl]).catch(() => {});
		}
	}

	// ── Firebase authentication methods ─────────────────────────────────────

	/**
	 * Gets the current Firebase user as an observable. Wraps onAuthStateChanged
	 * so subscribers receive continuous user updates (including null on sign-out).
	 *
	 * @returns An observable that emits the current Firebase User or null.
	 */
	private firebaseGetCurrentUser(): Observable<User | null> {
		// Wrapping with an Observable makes sure the user object is updated continuously and we have the option to subscribe to it
		return new Observable((observer) => {
			this.firebaseAuth = this.environmentInjector.get(FIREBASE_AUTH);

			// onAuthStateChanged emits the user continuously
			const unsubscribe = onAuthStateChanged(this.firebaseAuth, (user) => {
				if (user) {
					/* Populate the same identity holders the CloudBase path fills, so ownership
					   checks, the presence row, and login-state consumers behave identically on a
					   Firebase session. Roles stay empty — admin is a CloudBase-only concept. */
					this.ngZone.run(() => {
						this.utilities.setIsUserAlive(true);
						CloudbaseService.setUseId(user.uid);
						CloudbaseService.setUserName(user.displayName ?? '');
						CloudbaseService.markAuthReady();
						CloudbaseService.setLoginState(true);
					});
				} else {
					this.ngZone.run(() => this.utilities.setIsUserAlive(false));
					CloudbaseService.setLoginState(false);
				}
				this.firebaseUserSubject.next(user);
				observer.next(user);
			});

			return () => unsubscribe();
		});
	}

	/**
	 * Initiates Google sign-in via the Firebase popup, falling back to the full-page redirect on
	 * surfaces that block popups (installed web apps). Popup-first is deliberate: the redirect flow
	 * silently returns no result on Safari even when correctly configured (firebase-js-sdk#6716),
	 * while the popup resolves in-page in every regular browser tab. On the redirect path the
	 * destination is stashed in sessionStorage since the page is left entirely;
	 * {@link handleGoogleRedirectResult} picks it up and completes the sign-in when Google returns.
	 *
	 * @param returnUrl - The URL to navigate to after sign-in completes. Defaults to '/'.
	 */
	public googleLogin(returnUrl: string = '/'): void {
		signInWithPopup(this.firebaseAuth, new GoogleAuthProvider())
			.then(() => this.navigateAfterLogin(AUTH_BACKEND_FIREBASE, returnUrl))
			.catch((error: unknown) => {
				// Step 1: When the surface cannot open a popup, retry the sign-in as a redirect
				const errorCode = (error as { code?: string }).code ?? '';
				if (AUTH_POPUP_FALLBACK_CODES.includes(errorCode)) {
					sessionStorage.setItem(SS_GOOGLE_RETURN_URL, returnUrl);
					signInWithRedirect(this.firebaseAuth, new GoogleAuthProvider()).catch(
						(redirectError: unknown) => {
							sessionStorage.removeItem(SS_GOOGLE_RETURN_URL);
							LOG.error(
								this.className,
								AUTH_LOG_GOOGLE_SIGN_IN_FAILED,
								redirectError instanceof Error ? redirectError : undefined
							);
						}
					);
					return;
				}

				// Step 2: Any other failure (including the user closing the popup) is logged with its code
				LOG.error(
					this.className,
					AUTH_LOG_GOOGLE_SIGN_IN_FAILED,
					error instanceof Error ? error : undefined
				);
			});
	}

	/**
	 * Completes a pending Google redirect sign-in when the page loads back from Google. Runs once
	 * at service construction and does nothing when no redirect is pending — the sessionStorage
	 * marker only exists between {@link googleLogin}'s redirect fallback leaving the page and
	 * Google returning. On success it records the Firebase backend and navigates to the stashed
	 * destination, which re-bootstraps the app onto the Firebase data providers (see
	 * {@link navigateAfterLogin}).
	 */
	private handleGoogleRedirectResult(): void {
		const returnUrl = sessionStorage.getItem(SS_GOOGLE_RETURN_URL);
		if (!returnUrl) return;
		getRedirectResult(this.firebaseAuth)
			.then(async (result) => {
				/* getRedirectResult is known to resolve null on some browsers even after a successful
				   sign-in — the session itself is persisted and surfaces through authStateReady /
				   currentUser, so that is checked before declaring the redirect abandoned. Only when
				   both are empty did the user genuinely back out of the Google page. */
				let isSignedIn = !!result?.user;
				if (!isSignedIn) {
					await this.firebaseAuth.authStateReady();
					isSignedIn = !!this.firebaseAuth.currentUser;
				}
				// The marker is cleared on every outcome so an abandoned sign-in is not retried forever
				sessionStorage.removeItem(SS_GOOGLE_RETURN_URL);
				if (isSignedIn) {
					this.navigateAfterLogin(AUTH_BACKEND_FIREBASE, returnUrl);
				}
			})
			.catch((error: unknown) => {
				sessionStorage.removeItem(SS_GOOGLE_RETURN_URL);
				LOG.error(
					this.className,
					AUTH_LOG_GOOGLE_SIGN_IN_FAILED,
					error instanceof Error ? error : undefined
				);
			});
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

			// Step 3: Populate the user subject and navigate (re-bootstrapping only if the backend changed)
			this.cloudbaseGetCurrentUser();
			this.navigateAfterLogin(AUTH_BACKEND_CLOUDBASE, '/');
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

		// Step 3: Populate the user subject and navigate (re-bootstrapping only if the backend changed)
		this.cloudbaseGetCurrentUser();
		this.navigateAfterLogin(AUTH_BACKEND_CLOUDBASE, returnUrl);
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
	 * Gets the timestamp of the most recent sign-in — from Firebase's auth metadata on a Google
	 * session, or the CloudBase security history log otherwise.
	 * Returns an empty string when no login events are recorded or the call fails.
	 *
	 * @returns The formatted date string (YYYY-MM-DD) of the last sign-in, or an empty string.
	 */
	public async getLastLoginTimestamp(): Promise<string> {
		try {
			/* Firebase exposes the last sign-in directly on the user's auth metadata —
			   no behaviour-log query is needed on that backend. */
			if (Utilities.isFirebaseBackend()) {
				const lastSignIn = this.firebaseAuth.currentUser?.metadata?.lastSignInTime;
				return lastSignIn ? Utilities.formatDateForStorage(new Date(lastSignIn)) : '';
			}

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
	 * Updates the display name of the currently signed-in user on the active backend —
	 * Firebase's profile displayName for Google users, CloudBase's username otherwise — and
	 * refreshes the user subject so all subscribers receive the updated data.
	 *
	 * @param name - The new username to set.
	 * @throws UnexpectedError if the backend rejects the update or no user is signed in.
	 */
	public async updateUsername(name: string): Promise<void> {
		if (Utilities.isFirebaseBackend()) {
			const user = this.firebaseAuth.currentUser;
			if (!user) throw new UnexpectedError();
			try {
				await updateProfile(user, { displayName: name });
			} catch {
				throw new UnexpectedError();
			}
			// Mirror the CloudBase path: refresh the identity holder and re-emit the updated user
			this.ngZone.run(() => {
				CloudbaseService.setUserName(name);
				this.firebaseUserSubject.next(user);
			});
			return;
		}
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
	 * @param password - The user's current password used to confirm the deletion. Unused on
	 *   Firebase sessions, where a Google reauthentication popup confirms identity instead.
	 * @throws WrongOldPasswordError when the password is incorrect or the user is not found.
	 * @throws AccountRateLimitedError when too many failed attempts have been made.
	 * @throws SessionExpiredError when the current session is no longer valid.
	 * @throws UnexpectedError for all other failures.
	 */
	public async deleteUser(password: string): Promise<void> {
		/* Google accounts have no password — identity is re-proved with a fresh Google
		   reauthentication popup, which Firebase requires before destructive operations. */
		if (Utilities.isFirebaseBackend()) {
			const user = this.firebaseAuth.currentUser;
			if (!user) throw new SessionExpiredError();
			try {
				await reauthenticateWithPopup(user, new GoogleAuthProvider());
				await user.delete();
			} catch {
				throw new UnexpectedError();
			}
			return;
		}
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
	 * Signs out the currently active backend's session (Firebase for Google users, CloudBase
	 * otherwise), clears all local auth state, and removes the backend flag so the app returns
	 * to the CloudBase default. Never navigates to a different page: a CloudBase sign-out updates
	 * the UI in place, while a Firebase sign-out hard-reloads the current URL — the DI providers
	 * were bound to Firebase at bootstrap and only a re-bootstrap can re-bind the CloudBase
	 * default, so content pages come back showing their blocked card on the same page.
	 */
	public async signOut(): Promise<void> {
		try {
			/* The active backend is captured before the flag is cleared below — it decides both
			   which session to revoke and whether a re-bootstrap reload is needed afterwards. */
			const wasFirebase = Utilities.isFirebaseBackend();

			// Step 1: Revoke the active backend's session server-side
			if (wasFirebase) {
				await signOut(this.firebaseAuth);
			} else {
				await this.cloudbaseAuth.signOut();
			}

			/* Step 2: Clear all local auth state inside ngZone so Angular's change detection fires
			   and the UI updates synchronously — both SDKs' callbacks run outside the zone. Removing
			   the backend flag returns the app to the CloudBase default on the next load. */
			this.ngZone.run(() => {
				localStorage.removeItem(LS_AUTH_BACKEND);
				this.cloudbaseUserSubject.next(null);
				this.firebaseUserSubject.next(null);
				this.utilities.setIsUserAlive(false);
				CloudbaseService.setUseId('');
				CloudbaseService.setUserRole([]);
				CloudbaseService.setUserName('');
				CloudbaseService.setLoginState(false);
			});

			/* Step 3: Only a Firebase sign-out reloads — the running app still has FirebaseService
			   wired in memory, and without a re-bootstrap a follow-up CloudBase sign-in would run
			   against the wrong data backend. CloudBase sign-outs skip this and stay instant. */
			if (wasFirebase) {
				window.location.reload();
			}
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
			this.navigateAfterLogin(AUTH_BACKEND_CLOUDBASE, returnUrl);
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
