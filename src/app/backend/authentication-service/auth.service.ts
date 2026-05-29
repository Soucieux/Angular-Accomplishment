import { EnvironmentInjector, inject, Inject, Injectable, NgZone, runInInjectionContext } from '@angular/core';
import {
	GoogleAuthProvider,
	signInWithEmailAndPassword,
	signInWithPopup,
	Auth,
	signOut,
	onAuthStateChanged
} from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { LOG } from '../../common/app.logs';
import { DatabaseService } from '../database-service/database.service';
import { CloudbaseService } from '../database-service/cloudbase/cloudbase.service';
import { Utilities } from '../../common/app.utilities';
import { CLOUDBASE_ERROR_INVALID_ARGUMENT, CLOUDBASE_ERROR_INVALID_CREDENTIALS, CN, MSG_UNEXPECTED_ERROR } from '../../common/app.constant';
import { WrongCredentialsError } from '../../common/error/wrong-credentials.error';
import { wrongVerificationCodeError } from '../../common/error/wrong-verification-code';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private readonly className = 'AuthService';
	private verification: any;
	private cloudbaseAuth: any;
	private firebaseAuth: any;
	private cloudbaseUserSubject = new BehaviorSubject<any>(null);
	constructor(
		@Inject(EnvironmentInjector) private ei: EnvironmentInjector,
		private router: Router,
		private databaseService: DatabaseService,
		private utilities: Utilities,
		private ngZone: NgZone
	) {
		if (Utilities.getCurrentCountry() === CN) {
			const cloudbaseService = this.databaseService as CloudbaseService;
			this.cloudbaseAuth = cloudbaseService.getCloudbaseAuth();
		}
	}

	////////////////////// Below are Firebase authentication methods //////////////////////

	/**
	 * Returns the current Firebase user as an observable. Wraps onAuthStateChanged
	 * so subscribers receive continuous user updates (including null on sign-out).
	 *
	 * @returns An observable that emits the current Firebase user or null.
	 */
	public firebaseGetCurrentUser(): Observable<any> {
		// Wrapping with an Observable makes sure the user object is updated continuously and we have the option to subscribe to it
		return new Observable((observer) => {
			this.firebaseAuth = runInInjectionContext(this.ei, () => inject(Auth));

			// onAuthStateChanged emits the user continuously
			const unsubscribe = onAuthStateChanged(this.firebaseAuth, (user) => {
				if (user) this.utilities.setIsUserAlive(true);
				observer.next(user);
			});

			return () => unsubscribe();
		});
	}

	/**
	 * Signs in with email and password via Firebase authentication.
	 *
	 * @param email - The user's email address.
	 * @param password - The user's password.
	 * @param returnUrl - Optional URL to navigate to after sign-in. Defaults to '/'.
	 */
	public async emailPasswordLogin(email: string, password: string, returnUrl: string = '/'): Promise<void> {
		try {
			await signInWithEmailAndPassword(this.firebaseAuth, email, password);
			this.router.navigate([returnUrl]).catch(() => {});
			this.utilities.setIsUserAlive(true);
		} catch (error: unknown) {
			LOG.error(this.className, 'Error when signing in with email and password');
			throw error;
		}
	}

	/**
	 * Initiates Google sign-in via Firebase popup. After the popup completes,
	 * listens for the auth state change to confirm the user is signed in
	 * before navigating to the home page.
	 */
	public googleLogin(): void {
		// CurrentUser in this.auth is still null after signInWithPopup completes
		// As the credentials are being returned after that and then firebase starts initializing
		signInWithPopup(this.firebaseAuth, new GoogleAuthProvider())
			.then(() => {
				const unsub = onAuthStateChanged(this.firebaseAuth, (user) => {
					unsub();
					if (user) {
						this.router.navigate(['/']).catch(() => {});
						this.utilities.setIsUserAlive(true);
					}
				});
			})
			.catch(() => LOG.error(this.className, 'ERROR when signing in through Google'));
	}

	/**
	 * Signs out the current Firebase user and reactively updates auth state
	 * without navigating away from the current page.
	 */
	public logout(): void {
		// CurrentUser in this.auth gets removed immediately after signOut
		signOut(this.firebaseAuth)
			.then(() => {
				this.ngZone.run(() => {
					this.utilities.setIsUserAlive(false);
				});
			})
			.catch(() => LOG.error(this.className, 'ERROR when signing out current user'));
	}

	////////////////////// Below are CloudBase authentication methods /////////////////////

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
	public async signUp(email: string, password: string, username: string, verificationCode: number): Promise<void> {
		try {
			// Two-step flow: first get the verification token from the code,
			// then call signUp with the token to create the account.
			const verificationTokenRes = await this.cloudbaseAuth.verify({
				verification_id: this.verification?.verification_id,
				verification_code: verificationCode
			});

			await this.cloudbaseAuth.signUp({
				email: email,
				verification_code: verificationCode,
				verification_token: verificationTokenRes.verification_token,
				username: username,
				password: password
			});

			this.cloudbaseGetCurrentUser();
			this.router.navigate(['/']).catch(() => {});
		} catch (error: unknown) {
			if (error && (error as { code?: string }).code === CLOUDBASE_ERROR_INVALID_ARGUMENT) {
				throw new wrongVerificationCodeError();
			} else {
				throw new Error(MSG_UNEXPECTED_ERROR);
			}
		}
	}

	/**
	 * Sign in with username and password via CloudBase. If the credentials
	 * are invalid, throws WrongCredentialsError. On success, fetches the
	 * current user profile and navigates to the home page.
	 *
	 * @param username - The user's username.
	 * @param password - The user's password.
	 * @param returnUrl - Optional URL to navigate to after sign-in. Defaults to '/'.
	 * @throws WrongCredentialsError if the username or password is incorrect.
	 * @throws UnexpectedError if a different authentication error occurs.
	 */
	public async signIn(username: string, password: string, returnUrl: string = '/'): Promise<void> {
		const { error } = await this.cloudbaseAuth.signInWithPassword({
			username: username,
			password: password
		});

		if (error && error.category === CLOUDBASE_ERROR_INVALID_CREDENTIALS) {
			throw new WrongCredentialsError();
		} else if (error) {
			throw new Error(MSG_UNEXPECTED_ERROR);
		}

		this.cloudbaseGetCurrentUser();
		this.router.navigate([returnUrl]).catch(() => {});
	}

	/**
	 * Returns the current CloudBase user as an observable. Emits null for
	 * anonymous users (no username in metadata) and errors.
	 *
	 * @returns An observable that emits the current CloudBase user or null.
	 */
	public cloudbaseGetCurrentUser(): Observable<any> {
		this.cloudbaseAuth
			.getUser()
			.then((response: { data: { user: any } }) => {
				const data = response?.data;

				// Anonymous users have no username in metadata — emit null for them
				// to distinguish anonymous sign-ins from real logged-in users.
				if (data?.user?.user_metadata?.username) {
					this.utilities.setIsUserAlive(true);
					CloudbaseService.setUseId(data.user.id);
					CloudbaseService.setUserRole(data.user.user_metadata?.name);
					CloudbaseService.setUserName(data.user.user_metadata?.username);
					this.cloudbaseUserSubject.next(data.user);
					CloudbaseService.markAuthReady();
					CloudbaseService.setLoginState(true);
				} else {
					// Anonymous or missing user — ensure dashboard stays hidden.
					this.cloudbaseUserSubject.next(null);
					CloudbaseService.setLoginState(false);
				}
			})
			.catch(() => {
				// Auth check failed — treat as logged out so dashboard is not shown.
				this.cloudbaseUserSubject.next(null);
				CloudbaseService.markAuthReady();
				CloudbaseService.setLoginState(false);
			});
		return this.cloudbaseUserSubject.asObservable();
	}

	/**
	 * Signs out the current CloudBase user. Clears user state and reactively
	 * updates auth status without navigating away from the current page.
	 */
	public async signOut(): Promise<void> {
		try {
			await this.cloudbaseAuth.signOut();
			this.ngZone.run(() => {
				this.cloudbaseUserSubject.next(null);
				this.utilities.setIsUserAlive(false);
				CloudbaseService.setUseId('');
				CloudbaseService.setUserRole('');
				CloudbaseService.setUserName('');
				CloudbaseService.setLoginState(false);
			});
		} catch {
			LOG.error(this.className, 'ERROR when signing out current user');
		}
	}
}
