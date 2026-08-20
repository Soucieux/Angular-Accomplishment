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
	User
} from 'firebase/auth';
import { BehaviorSubject, Observable, Subject, firstValueFrom, from } from 'rxjs';
import { filter, timeout } from 'rxjs/operators';
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
	AUTH_BEHAVIOR_LOG_TYPE_LOGIN,
	FIREBASE_ERROR_ID_TOKEN_EXPIRED,
	FIREBASE_ERROR_INVALID_USER_TOKEN,
	FIREBASE_ERROR_USER_DISABLED,
	FIREBASE_ERROR_USER_TOKEN_EXPIRED,
	LOGIN_URL_DEFAULT_RETURN,
	RECOVERY_AUTH_EXPIRED,
	RECOVERY_AUTH_UNKNOWN,
	RECOVERY_AUTH_VALID,
	RECOVERY_PROBE_TIMEOUT_MS
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
import { AuthValidationStatus } from '../session-recovery/session-recovery.model';

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
	private sessionExpiredSubject = new Subject<void>();
	private hasEmittedSessionExpiry = false;
	private isManualSignOutInProgress = false;
	private remoteSignOutPromise?: Promise<void>;
	private hasCloudbaseAuthResolved = false;
	private cloudbaseUserRequestVersion = 0;
	private hasFirebaseAuthResolved = false;
	private hasStartedFirebaseAuthListener = false;

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
			this.cloudbaseAuth.onLoginStateExpired?.(() => {
				if (!this.isManualSignOutInProgress && this.hasExpectedAuthenticatedSession()) {
					this.emitSessionExpired();
				}
			});
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
	 * Validates the active provider session and republishes a confirmed current user when available.
	 * Distinguishes confirmed expiry from transient failures so offline probes never sign out a user.
	 *
	 * @returns The explicit validation status for the active authentication provider.
	 */
	public async validateSession(): Promise<AuthValidationStatus> {
		return Utilities.isFirebaseBackend()
			? this.validateFirebaseSession()
			: this.validateCloudbaseSession();
	}

	/**
	 * Asks the active provider whether a named account holds the current session.
	 *
	 * The cached identity cannot answer this during startup: it stays empty until the provider
	 * finishes restoring a stored session, so a page reading it on arrival mistakes a signed-in user
	 * for a visitor. The provider waits for that restore instead of racing it. A named account
	 * carries a Firebase user or a CloudBase username; an anonymous session carries neither.
	 *
	 * A failed provider read is deliberately left to propagate rather than answered with false, because
	 * the two callers need opposite fallbacks on an unknown identity: releasing a session must keep it,
	 * opening one must go ahead.
	 *
	 * {@link signOutIfStillAnonymous} - Keeps a named session a public page must never end.
	 *
	 * @returns True when a named account is signed in, false when the session is anonymous or absent.
	 */
	public async hasNamedSession(): Promise<boolean> {
		if (Utilities.isFirebaseBackend()) {
			await this.firebaseAuth.authStateReady();
			return !!this.firebaseAuth.currentUser;
		}
		const response = await this.cloudbaseAuth.getUser();
		return this.isNamedAccount(response?.data?.user);
	}

	/**
	 * Gets the authentication provider expiry signal for central recovery coordination.
	 * The signal deliberately leaves local state untouched until the recovery service clears all layers.
	 *
	 * @returns An observable that emits when the active provider confirms the current session expired.
	 */
	public getSessionExpired$(): Observable<void> {
		return this.sessionExpiredSubject.asObservable();
	}

	/**
	 * Clears every locally owned authentication value after confirmed remote expiry or sign-out.
	 */
	public expireLocalSession(): void {
		this.cloudbaseUserRequestVersion++;
		this.isManualSignOutInProgress = false;
		this.ngZone.run(() => {
			if (isPlatformBrowser(this.platformId)) localStorage.removeItem(LS_AUTH_BACKEND);
			this.hasCloudbaseAuthResolved = true;
			this.cloudbaseUserSubject.next(null);
			this.hasFirebaseAuthResolved = true;
			this.firebaseUserSubject.next(null);
			this.utilities.setIsUserAlive(false);
			CloudbaseService.setUseId('');
			CloudbaseService.setUserRole([]);
			CloudbaseService.setUserName('');
			CloudbaseService.setLoginState(false);
		});
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
	 * Validates the Firebase session by waiting for initial auth state and force-refreshing its token.
	 * Missing users and explicit token errors are expired; every other failure remains unknown.
	 *
	 * {@link validateSession} - Validates Firebase during central session recovery.
	 * {@link runRemoteSignOut} - Revalidates an ambiguous Firebase sign-out outcome.
	 *
	 * @returns The Firebase session validation status.
	 */
	private async validateFirebaseSession(): Promise<AuthValidationStatus> {
		try {
			await this.firebaseAuth.authStateReady();
			const user = this.firebaseAuth.currentUser;
			if (!user) return RECOVERY_AUTH_EXPIRED;

			await user.getIdToken(true);
			return RECOVERY_AUTH_VALID;
		} catch (error: unknown) {
			return this.isConfirmedSessionExpired(error)
				? RECOVERY_AUTH_EXPIRED
				: RECOVERY_AUTH_UNKNOWN;
		}
	}

	/**
	 * Gets the current Firebase user as an observable. Wraps onAuthStateChanged
	 * so subscribers receive continuous user updates (including null on sign-out).
	 *
	 * @returns An observable that emits the current Firebase User or null.
	 */
	private firebaseGetCurrentUser(): Observable<User | null> {
		this.firebaseAuth = this.environmentInjector.get(FIREBASE_AUTH);
		if (!this.hasStartedFirebaseAuthListener) {
			this.hasStartedFirebaseAuthListener = true;
			this.firebaseAuth.onAuthStateChanged((user) => {
				this.hasFirebaseAuthResolved = true;
				if (user) {
					/* Populate the same identity holders the CloudBase path fills, so ownership
					   checks, the presence row, and login-state consumers behave identically on a
					   Firebase session. Roles stay empty — admin is a CloudBase-only concept. */
					this.ngZone.run(() => {
						this.hasEmittedSessionExpiry = false;
						this.utilities.setIsUserAlive(true);
						CloudbaseService.setUseId(user.uid);
						CloudbaseService.setUserName(user.displayName ?? '');
						CloudbaseService.markAuthReady();
						CloudbaseService.setLoginState(true);
						this.firebaseUserSubject.next(user);
					});
				} else if (!this.isManualSignOutInProgress) {
					if (this.hasExpectedAuthenticatedSession()) {
						/* A spontaneous null state after an expected session is explicit expiry. Central
						   recovery clears auth, database caches, and rendered data together. */
						this.emitSessionExpired();
					} else {
						/* The first null state for an ordinary signed-out startup is not an expiry event. */
						this.ngZone.run(() => {
							this.firebaseUserSubject.next(null);
							this.utilities.setIsUserAlive(false);
							CloudbaseService.markAuthReady();
							CloudbaseService.setLoginState(false);
						});
					}
				}
			});
		}

		return this.firebaseUserSubject.asObservable().pipe(
			filter(() => this.hasFirebaseAuthResolved)
		);
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
	public googleLogin(returnUrl: string = LOGIN_URL_DEFAULT_RETURN): void {
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
	 * Validates the CloudBase session and republishes its authenticated account when available.
	 * Explicit null responses mean expiry while malformed or rejected transient responses stay unknown.
	 *
	 * {@link validateSession} - Validates and republishes CloudBase during central session recovery.
	 * {@link runRemoteSignOut} - Revalidates sign-out without mutating the preserved local identity.
	 *
	 * @param shouldPublishUser - The flag indicating whether successful validation refreshes local identity.
	 * @returns The CloudBase session validation status.
	 */
	private async validateCloudbaseSession(shouldPublishUser = true): Promise<AuthValidationStatus> {
		try {
			// Step 1: Confirm the SDK still has a server-recognized session
			const sessionResponse = await this.cloudbaseAuth.getSession();
			if (sessionResponse?.error) {
				return this.isConfirmedSessionExpired(sessionResponse.error)
					? RECOVERY_AUTH_EXPIRED
					: RECOVERY_AUTH_UNKNOWN;
			}
			if (sessionResponse?.data === null) return RECOVERY_AUTH_EXPIRED;
			if (sessionResponse?.data === undefined) return RECOVERY_AUTH_UNKNOWN;

			// Step 2: Confirm the session belongs to a real app account rather than an anonymous user
			const userResponse = await this.cloudbaseAuth.getUser();
			if (userResponse?.error) {
				return this.isConfirmedSessionExpired(userResponse.error)
					? RECOVERY_AUTH_EXPIRED
					: RECOVERY_AUTH_UNKNOWN;
			}
			const user = userResponse?.data?.user;
			if (this.isNamedAccount(user)) {
				if (shouldPublishUser) this.publishCloudbaseUser(user);
				return RECOVERY_AUTH_VALID;
			}
			return user === null || user !== undefined
				? RECOVERY_AUTH_EXPIRED
				: RECOVERY_AUTH_UNKNOWN;
		} catch (error: unknown) {
			return this.isConfirmedSessionExpired(error)
				? RECOVERY_AUTH_EXPIRED
				: RECOVERY_AUTH_UNKNOWN;
		}
	}

	/**
	 * Signs in anonymously via CloudBase. Grants read-only access to public
	 * database collections without requiring a registered account.
	 *
	 * @returns A promise that resolves after anonymous sign-in completes.
	 */
	public async signInAnonymously(): Promise<void> {
		await this.cloudbaseAuth.signInAnonymously();
	}

	/**
	 * Requests a verification code to be sent to the given email address.
	 * The code is required when signing up a new CloudBase account.
	 *
	 * @param email - The email address to send the verification code to.
	 * @returns A promise that resolves after the verification request completes.
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
	 * @returns A promise that resolves after account creation and navigation complete.
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
			this.navigateAfterLogin(AUTH_BACKEND_CLOUDBASE, LOGIN_URL_DEFAULT_RETURN);
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
	 * @returns A promise that resolves after sign-in and navigation complete.
	 * @throws WrongCredentialsError if the username or password is incorrect.
	 * @throws UnexpectedError if a different authentication error occurs.
	 */
	public async signIn(
		username: string,
		password: string,
		returnUrl: string = LOGIN_URL_DEFAULT_RETURN
	): Promise<void> {
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
	 * Gets the current CloudBase user as an observable. Emits only after the provider resolves,
	 * preserving the preceding local state when a transient lookup fails.
	 *
	 * {@link getCurrentUser} - Supplies the active CloudBase identity observable to application consumers.
	 * {@link signUp} - Refreshes identity after account creation.
	 * {@link signIn} - Refreshes identity after password sign-in.
	 * {@link updateUsername} - Republishes identity after a username change.
	 * {@link resetPassword} - Refreshes identity after a successful password reset.
	 *
	 * @returns An observable that emits the current CloudBase user or null.
	 */
	private cloudbaseGetCurrentUser(): Observable<any> {
		const requestVersion = ++this.cloudbaseUserRequestVersion;
		if (this.cloudbaseUserSubject.value === null) this.hasCloudbaseAuthResolved = false;
		this.cloudbaseAuth
			.getUser()
			.then((response: { data?: { user?: any }; error?: unknown }) => {
				if (requestVersion !== this.cloudbaseUserRequestVersion) return;
				if (response?.error) {
					if (this.isConfirmedSessionExpired(response.error)) {
						this.emitSessionExpired();
					}
					return;
				}
				const user = response?.data?.user;

				/* An anonymous session emits null rather than a user, keeping the dashboard hidden
				   until a proper sign-in occurs. */
				if (this.isNamedAccount(user)) {
					/* Inside ngZone for the same reason as signOut() above — this .then()
					   callback runs outside Angular's zone, so without it Angular never
					   notices the state change and dependent views (e.g. the home
					   dashboard) stay stuck on their loading state until an unrelated
					   zone-patched event (like a route navigation) forces a redraw. */
					this.publishCloudbaseUser(user);
				} else if (user === null || user !== undefined) {
					if (this.hasExpectedAuthenticatedSession()) {
						/* A missing account after an expected session is confirmed expiry. */
						this.emitSessionExpired();
					} else {
						/* Anonymous and ordinary signed-out startup states are not expired account sessions. */
						this.ngZone.run(() => {
							this.hasCloudbaseAuthResolved = true;
							this.cloudbaseUserSubject.next(null);
							this.utilities.setIsUserAlive(false);
							CloudbaseService.markAuthReady();
							CloudbaseService.setLoginState(false);
						});
					}
				}
			})
			.catch((error: unknown) => {
				if (requestVersion !== this.cloudbaseUserRequestVersion) return;
				/* Network and timeout failures leave the optimistic local session intact.
				   Only an explicit provider credential error can begin central expiry cleanup. */
				if (this.isConfirmedSessionExpired(error)) {
					this.emitSessionExpired();
				}
			});

		return this.cloudbaseUserSubject.asObservable().pipe(
			filter(() => this.hasCloudbaseAuthResolved)
		);
	}

	/**
	 * Gets the timestamp of the most recent sign-in — from Firebase's auth metadata on a Google
	 * session, or the CloudBase security history log otherwise. Uses an empty string when no login
	 * events are recorded or the call fails.
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
	 * @returns A promise that resolves after the username and identity state update.
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
	 * @returns A promise that resolves after the password update completes.
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
	 * On success the account is permanently removed server-side and provider-expiry callbacks stay
	 * suppressed until the caller completes coordinated cleanup through expireLocalSession.
	 *
	 * @param password - The user's current password used to confirm the deletion. Unused on
	 *   Firebase sessions, where a Google reauthentication popup confirms identity instead.
	 * @returns A promise that resolves after the provider deletes the account.
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
			this.isManualSignOutInProgress = true;
			try {
				await reauthenticateWithPopup(user, new GoogleAuthProvider());
				await user.delete();
			} catch {
				this.isManualSignOutInProgress = false;
				throw new UnexpectedError();
			}
			return;
		}
		let caughtError: unknown;
		this.isManualSignOutInProgress = true;
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
		this.isManualSignOutInProgress = false;

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
	 * @returns A promise that resolves after the provider verifies the password.
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
	 * Signs out the active backend, then clears local authentication state. Firebase reloads so
	 * dependency injection rebinds to the default CloudBase backend after the local state changes.
	 *
	 * @returns A promise that resolves after remote sign-out and local cleanup complete.
	 */
	public async signOut(): Promise<void> {
		const wasFirebase = Utilities.isFirebaseBackend();
		await this.confirmRemoteSignOut();
		this.expireLocalSession();
		if (wasFirebase) window.location.reload();
	}

	/**
	 * Releases an anonymous session a public page opened, but only while the session is still
	 * anonymous.
	 *
	 * A named account can be restored, or signed into elsewhere, after that anonymous sign-in began,
	 * and signing out on that race would end the user's own session instead of the throwaway one.
	 * The current identity is therefore re-read at teardown rather than trusted from a flag captured
	 * earlier. A provider read that fails leaves the session untouched: an unknown identity must
	 * never cost a signed-in user their session.
	 *
	 * {@link AnonymousSessionService.release} - Releases a session a public page opened for a signed-out reader.
	 *
	 * @returns A promise that resolves once the session has been released, or deliberately kept.
	 */
	public async signOutIfStillAnonymous(): Promise<void> {
		if (await this.hasNamedSession()) return;
		await this.signOut();
	}

	/**
	 * Confirms remote sign-out without publishing a local auth-state change. Concurrent callers
	 * share one provider request so the manual-sign-out suppression flag cannot be reset early.
	 *
	 * @returns A promise that resolves after remote success or confirmed remote expiry.
	 */
	public confirmRemoteSignOut(): Promise<void> {
		if (this.remoteSignOutPromise) return this.remoteSignOutPromise;
		this.remoteSignOutPromise = this.runRemoteSignOut();
		return this.remoteSignOutPromise;
	}

	/**
	 * Revokes the active provider session and revalidates ambiguous failures.
	 *
	 * @returns A promise that resolves after remote success or confirmed remote expiry.
	 */
	private async runRemoteSignOut(): Promise<void> {
		const wasFirebase = Utilities.isFirebaseBackend();
		this.isManualSignOutInProgress = true;
		try {
			// Step 1: Revoke the active backend's session server-side
			if (wasFirebase) {
				await this.waitWithinTimeout(this.firebaseAuth.signOut());
			} else {
				const signOutResponse = await this.waitWithinTimeout<{ error?: unknown }>(
					this.cloudbaseAuth.signOut()
				);
				if (signOutResponse?.error) throw signOutResponse.error;
			}
		} catch (error: unknown) {
			/* An ambiguous rejection may mean the server completed the request before the response
			   was lost. Revalidate before preserving local state so that outcome converges correctly. */
			if (!this.isConfirmedSessionExpired(error)) {
				let validationStatus: AuthValidationStatus = RECOVERY_AUTH_UNKNOWN;
				try {
					validationStatus = await this.waitWithinTimeout(
						wasFirebase
							? this.validateFirebaseSession()
							: this.validateCloudbaseSession(false)
					);
				} catch {
					validationStatus = RECOVERY_AUTH_UNKNOWN;
				}
				if (validationStatus !== RECOVERY_AUTH_EXPIRED) {
					LOG.error(
						this.className,
						AUTH_LOG_SIGN_OUT_FAILED,
						error instanceof Error ? error : undefined
					);
					throw new UnexpectedError();
				}
			}
		} finally {
			this.isManualSignOutInProgress = false;
			this.remoteSignOutPromise = undefined;
		}
	}

	/**
	 * Sends a password-reset code to the given email address via CloudBase.
	 * Stores the returned data object for use in the subsequent {@link resetPassword} call.
	 *
	 * @param email - The email address registered on the account to reset.
	 * @returns A promise that resolves after the provider sends the reset code.
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
	 * @returns A promise that resolves after the password reset and navigation complete.
	 * @throws WrongVerificationCodeError if the code is incorrect or expired.
	 * @throws PasswordTooWeakError if the new password fails CloudBase strength requirements.
	 * @throws UnexpectedError for all other failures.
	 */
	public async resetPassword(
		code: string,
		newPassword: string,
		returnUrl: string = LOGIN_URL_DEFAULT_RETURN
	): Promise<void> {
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

	// ── Private authentication helpers ───────────────────────────────────────

	/**
	 * Checks whether a provider user object belongs to a registered account rather than an anonymous
	 * session. CloudBase writes the chosen username into user metadata at sign-up, so its presence is
	 * the only field that separates the two.
	 *
	 * {@link hasNamedSession} - Answers the public "is anyone signed in" question for public pages.
	 * {@link validateCloudbaseSession} - Treats an anonymous session as an expired account session.
	 * {@link cloudbaseGetCurrentUser} - Withholds the dashboard until a registered account is present.
	 *
	 * @param user - The CloudBase user object returned by the provider, possibly absent.
	 * @returns True when the user is a registered account, false when anonymous or absent.
	 */
	private isNamedAccount(user: any): boolean {
		return !!user?.user_metadata?.username;
	}

	/**
	 * Checks whether a provider error explicitly confirms that the active session is invalid.
	 *
	 * {@link validateFirebaseSession} - Classifies explicit Firebase token failures as expired.
	 * {@link validateCloudbaseSession} - Classifies explicit CloudBase credential failures as expired.
	 * {@link cloudbaseGetCurrentUser} - Routes explicit provider lookup failures to central expiry.
	 * {@link runRemoteSignOut} - Distinguishes already-expired sessions from ambiguous remote failures.
	 *
	 * @param error - The authentication provider error to classify.
	 * @returns True when the provider error explicitly confirms session expiry.
	 */
	private isConfirmedSessionExpired(error: unknown): boolean {
		const providerError = error as { category?: string; code?: string };
		return (
			providerError.category === CLOUDBASE_ERROR_INVALID_CREDENTIALS ||
			providerError.code === FIREBASE_ERROR_ID_TOKEN_EXPIRED ||
			providerError.code === FIREBASE_ERROR_INVALID_USER_TOKEN ||
			providerError.code === FIREBASE_ERROR_USER_DISABLED ||
			providerError.code === FIREBASE_ERROR_USER_TOKEN_EXPIRED
		);
	}

	/**
	 * Checks whether local state indicates that a named authenticated session should still exist.
	 *
	 * {@link constructor} - Guards the CloudBase provider-expiry callback registered during construction.
	 * {@link firebaseGetCurrentUser} - Distinguishes spontaneous Firebase expiry from signed-out startup.
	 * {@link cloudbaseGetCurrentUser} - Distinguishes missing CloudBase accounts from signed-out startup.
	 *
	 * @returns True when recovery should interpret a provider's missing-user state as expiry.
	 */
	private hasExpectedAuthenticatedSession(): boolean {
		return (
			this.utilities.getIsUserAlive() ||
			!!CloudbaseService.getUserId() ||
			this.cloudbaseUserSubject.value !== null ||
			this.firebaseUserSubject.value !== null
		);
	}

	/**
	 * Publishes a confirmed CloudBase account and resets the provider-expiry guard.
	 *
	 * {@link validateCloudbaseSession} - Restores current-user state after successful recovery validation.
	 * {@link cloudbaseGetCurrentUser} - Publishes the provider's resolved current-user lookup.
	 *
	 * @param user - The authenticated CloudBase user returned by the provider.
	 */
	private publishCloudbaseUser(user: any): void {
		this.cloudbaseUserRequestVersion++;
		this.ngZone.run(() => {
			this.hasCloudbaseAuthResolved = true;
			this.hasEmittedSessionExpiry = false;
			this.utilities.setIsUserAlive(true);
			CloudbaseService.setUseId(user.id);
			CloudbaseService.setUserRole(user.role ?? []);
			CloudbaseService.setUserName(user.user_metadata?.username);
			this.cloudbaseUserSubject.next(user);
			CloudbaseService.markAuthReady();
			CloudbaseService.setLoginState(true);
		});
	}

	/**
	 * Emits one provider-expiry signal until a later authenticated user resets the guard.
	 *
	 * {@link constructor} - Reports the CloudBase provider's explicit login-state expiry callback.
	 * {@link firebaseGetCurrentUser} - Reports a spontaneous Firebase null-user transition.
	 * {@link cloudbaseGetCurrentUser} - Reports an explicit CloudBase credential or missing-user result.
	 */
	private emitSessionExpired(): void {
		if (this.hasEmittedSessionExpiry) return;
		this.hasEmittedSessionExpiry = true;
		this.ngZone.run(() => this.sessionExpiredSubject.next());
	}

	/**
	 * Gets an authentication operation result within the shared recovery timeout.
	 *
	 * @param operation - The provider operation to await.
	 * @returns The resolved provider result.
	 */
	private async waitWithinTimeout<T>(operation: Promise<T>): Promise<T> {
		return await firstValueFrom(from(operation).pipe(timeout(RECOVERY_PROBE_TIMEOUT_MS)));
	}
}
