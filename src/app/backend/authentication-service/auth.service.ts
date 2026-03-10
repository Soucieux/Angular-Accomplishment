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
import { CN, Utilities } from '../../common/app.utilities';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private readonly className = 'AuthService';
	private verification: any;
	private cloudbaseAuth: any;
	private firebaseAuth: any;
	private cloudbaseCurrentUserSubject = new BehaviorSubject<any | null>(null);
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

	async emailPasswordLogin(email: string, password: string) {
		try {
			await signInWithEmailAndPassword(this.firebaseAuth, email, password).then(() => {
				this.router.navigate(['/']);
				this.utilities.setIsUserAlive(true);
			});
		} catch (error: any) {
			LOG.error(this.className, 'Error when signing in with email and password');
		}
	}

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

	async getVerificationCodeEmail(email: string) {
		this.verification = await this.cloudbaseAuth.getVerification({ email });
	}

	async signUp(email: string, password: string, verificationCode: number) {
		const verificationTokenRes = await this.cloudbaseAuth.verify({
			verification_id: this.verification?.verification_id,
			verification_code: verificationCode
		});
		await this.cloudbaseAuth.signUp({
			email: email,
			verification_code: verificationCode,
			verification_token: verificationTokenRes.verification_token,
			password: password
		});
	}

	async signIn(username: string, password: string) {
		try {
			await this.cloudbaseAuth.signInWithPassword({ username: username, password: password });
			this.cloudbaseGetCurrentUser();
			this.router.navigate(['/']);
		} catch (error: any) {
			LOG.error(this.className, 'Error when signing in with username and password with Cloudbase');
		}
	}

	cloudbaseGetCurrentUser(): Observable<any> {
		return new Observable((observer) => {
			this.cloudbaseAuth
				.getUser()
				.then((response: { data: { user: any } }) => {
					const { data } = response;

					if (data.user) this.utilities.setIsUserAlive(true);

					observer.next(data.user ?? null);
					observer.complete();
				})
				.catch((error: any) => observer.error(error));
		});
	}

	async signOut() {
		await this.cloudbaseAuth
			.signOut()
			.then(() => {
				this.cloudbaseCurrentUserSubject.next(null);
				this.router.navigate(['/']);
				this.utilities.setIsUserAlive(false);
			})
			.catch(() => LOG.error(this.className, 'ERROR when signing out current user'));
	}
}
