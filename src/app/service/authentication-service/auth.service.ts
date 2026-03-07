import { EnvironmentInjector, Inject, Injectable, runInInjectionContext } from '@angular/core';
import {
	GoogleAuthProvider,
	signInWithEmailAndPassword,
	signInWithPopup,
	Auth,
	signOut,
	User,
	onAuthStateChanged
} from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { LOG } from '../../app.logs';
import { CloudbaseService } from '../cloud-service/cloudbase/cloudbase.service';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private readonly className = 'AuthService';
	private verification: any;
	private cloudbaseAuth: any;
	private cloudbaseCurrentUserSubject = new BehaviorSubject<any | null>(null);
	public cloudbaseCurrentUser$ = this.cloudbaseCurrentUserSubject.asObservable();
	public firebaseCurrentUser$: Observable<User | null>;
	constructor(
		@Inject(Auth) private firebaseAuth: Auth,
		@Inject(EnvironmentInjector) private ei: EnvironmentInjector,
		private router: Router,
		private cloudbaseService: CloudbaseService
	) {
		// Wrapping with an Observable makes sure the user object is updated continuously and we have the option to subscribe to it
		this.firebaseCurrentUser$ = new Observable((observer) => {
			runInInjectionContext(this.ei, () => {
				// onAuthStateChanged emits the user continuously
				onAuthStateChanged(this.firebaseAuth, (user) => {
					observer.next(user);
				});
			});
		});
	}

	async emailPasswordLogin(email: string, password: string) {
		try {
			await signInWithEmailAndPassword(this.firebaseAuth, email, password).then(() => {
				this.router.navigate(['/']);
				localStorage.setItem('permission', 'true');
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
						localStorage.setItem('permission', 'true');
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
				localStorage.setItem('permission', 'false');
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
			await this.cloudbaseAuth.signIn({ username: username, password: password });
			localStorage.setItem('permission', 'true');
			this.getCurrentUser();
			this.router.navigate(['/']);
		} catch (error: any) {
			LOG.error(this.className, 'Error when signing in with username and password with Cloudbase');
		}
	}

	async getCurrentUser() {
		try {
			this.cloudbaseAuth = this.cloudbaseService.getCloudbaseRef().auth();
			const { data, error } = await this.cloudbaseAuth.getUser();
            this.cloudbaseCurrentUserSubject.next(data.user);
			if (!data.user) localStorage.setItem('permission', 'false');
		} catch (error) {
			LOG.error(this.className, error as string);
		}
	}

	async signOut() {
		await this.cloudbaseAuth
			.signOut()
			.then(() => {
				this.cloudbaseCurrentUserSubject.next(null);
				this.router.navigate(['/']);
				localStorage.setItem('permission', 'false');
			})
			.catch(() => LOG.error(this.className, 'ERROR when signing out current user'));
	}
}
