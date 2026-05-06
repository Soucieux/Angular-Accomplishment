import { EnvironmentInjector, inject, Inject, Injectable, runInInjectionContext } from '@angular/core';
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
import { CN } from '../../common/app.constant';
import { WrongCredentialsError } from '../../common/error/wrong-credentials.error';
import { WrongParametersError } from '../../common/error/wrong-parameters.error';
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
		private utilities: Utilities
	) {
		if (Utilities.getCurrentCountry() === CN) {
			const cloudbaseService = this.databaseService as CloudbaseService;
			this.cloudbaseAuth = cloudbaseService.getCloudbaseAuth();
		}
	}

	//////////////////////////////////// Below is for firebase /////////////////////////////////

	/**
	 * Get the current Firebase user as an observable. Wraps onAuthStateChanged
	 * so subscribers receive continuous user updates (including null on sign-out).
	 *
	 * @returns An observable that emits the current Firebase user or null.
	 */
	firebaseGetCurrentUser(): Observable<any> {
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
	 * Sign in with email and password via Firebase authentication.
	 *
	 * @param email - The user's email address.
	 * @param password - The user's password.
	 */
	async emailPasswordLogin(email: string, password: string) {
		try {
			await signInWithEmailAndPassword(this.firebaseAuth, email, password);
			this.router.navigate(['/']);
			this.utilities.setIsUserAlive(true);
		} catch (error: any) {
			LOG.error(this.className, 'Error when signing in with email and password');
		}
	}

	/**
	 * Initiate Google sign-in via Firebase popup. After the popup completes,
	 * listens for the auth state change to confirm the user is signed in
	 * before navigating to the home page.
	 */
	googleLogin() {
		// CurrentUser in this.auth is still null after signInWithPopup completes
		// As the credentials are being returned after that and then firebase starts initializing
		signInWithPopup(this.firebaseAuth, new GoogleAuthProvider())
			.then(() => {
				const unsub = onAuthStateChanged(this.firebaseAuth, (user) => {
					unsub();
					if (user) {
						this.router.navigate(['/']);
						this.utilities.setIsUserAlive(true);
					}
				});
			})
			.catch(() => LOG.error(this.className, 'ERROR when signing in through Google'));
	}

	/**
	 * Sign out the current Firebase user and navigate to the home page.
	 */
	logout() {
		// CurrentUser in this.auth gets removed immediately after signOut
		signOut(this.firebaseAuth)
			.then(() => {
				this.router.navigate(['/']);
				this.utilities.setIsUserAlive(false);
			})
			.catch(() => LOG.error(this.className, 'ERROR when signing out current user'));
	}

	//////////////////////////////////// Below is for cloudbase /////////////////////////////////

	/**
	 * Sign in anonymously via CloudBase. Grants read-only access to public
	 * database collections without requiring a registered account.
	 */
	async signInAnonymously() {
		await this.cloudbaseAuth.signInAnonymously();
	}

	/**
	 * Request a verification code to be sent to the given email address.
	 * The code is required when signing up a new CloudBase account.
	 *
	 * @param email - The email address to send the verification code to.
	 */
	async getVerificationCodeEmail(email: string) {
		this.verification = await this.cloudbaseAuth.getVerification({ email });
	}

	/**
	 * Create a new CloudBase account. Verifies the email code first,
	 * then calls signUp with the verification token and user details.
	 *
	 * @param email - The user's email address.
	 * @param password - The chosen password.
	 * @param username - The desired username.
	 * @param verificationCode - The numeric code sent to the email.
	 */
	async signUp(email: string, password: string, username: string, verificationCode: number) {
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
			this.router.navigate(['/']);
		} catch (error: any) {
			if (error && error.code === 'INVALID_ARGUMENT') {
				throw new wrongVerificationCodeError();
			} else {
				throw new Error('Unexpected error occurred');
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
	 * @throws WrongCredentialsError if the username or password is incorrect.
	 * @throws UnexpectedError if a different authentication error occurs.
	 */
	async signIn(username: string, password: string) {
		const { _, error } = await this.cloudbaseAuth.signInWithPassword({
			username: username,
			password: password
		});

		if (error && error.category === 'INVALID_CREDENTIALS') {
			throw new WrongCredentialsError();
		} else if (error) {
			throw new Error('Unexpected error occurred');
		}

		this.cloudbaseGetCurrentUser();
		this.router.navigate(['/']);
	}

	/**
	 * Get the current CloudBase user as an observable. Emits null for
	 * anonymous users (no username in metadata) and errors.
	 *
	 * @returns An observable that emits the current CloudBase user or null.
	 */
	cloudbaseGetCurrentUser(): Observable<any> {
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
				} else {
					this.cloudbaseUserSubject.next(null);
				}
			})
			.catch(() => {
				this.cloudbaseUserSubject.next(null);
			});
		return this.cloudbaseUserSubject.asObservable();
	}

	/**
	 * Sign out the current CloudBase user. Clears user state and navigates
	 * to the home page unless the sign-out is for an anonymous session.
	 *
	 * @param isAnonymous - If true, skips navigation (anonymous sign-out on page leave).
	 */
	async signOut(isAnonymous: boolean) {
		await this.cloudbaseAuth
			.signOut()
			.then(() => {
				this.cloudbaseUserSubject.next(null);
				if (!isAnonymous) this.router.navigate(['/']);
				this.utilities.setIsUserAlive(false);
				CloudbaseService.setUseId('');
			})
			.catch(() => LOG.error(this.className, 'ERROR when signing out current user'));
	}
}
