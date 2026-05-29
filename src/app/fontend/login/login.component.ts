import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { IftaLabelModule } from 'primeng/iftalabel';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../backend/authentication-service/auth.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { Utilities } from '../../common/app.utilities';
import {
	CN,
	COMPONENT_DESTROY,
	DIALOG_ERROR,
	LOGIN_ANIM_IN,
	LOGIN_ANIM_OUT,
	LOGIN_MSG_SEND_CODE_FAILED,
	LOGIN_URL_DEFAULT_RETURN
} from '../../common/app.constant';
import { LOG } from '../../common/app.logs';
import { WrongCredentialsError } from '../../common/error/wrong-credentials.error';
import { WrongParametersError } from '../../common/error/wrong-parameters.error';
import { wrongVerificationCodeError } from '../../common/error/wrong-verification-code';

@Component({
	selector: 'login',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		InputTextModule,
		ButtonModule,
		MessageModule,
		IftaLabelModule,
		InputGroupModule,
		InputGroupAddonModule
	],
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
	private readonly className = 'LoginComponent';
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	protected loginForm!: FormGroup;
	protected formSubmitted = false;
	protected isSignUp = false;
	protected animating: 'out' | 'in' | '' = '';
	protected codeSent = false;
	protected sendingCode = false;
	private codeSentTimeout: ReturnType<typeof setTimeout> | null = null;
	private returnUrl: string = LOGIN_URL_DEFAULT_RETURN;

	constructor(
		private fb: FormBuilder,
		private authService: AuthService,
		private dialogService: DialogService,
		private cdr: ChangeDetectorRef,
		private route: ActivatedRoute
	) {}

	/**
	 * Reads the returnUrl query param so sign-in can redirect back to the
	 * page the user came from.
	 */
	ngOnInit(): void {
		this.loginForm = this.fb.group({
			username: ['', Validators.required],
			email: [''],
			password: ['', Validators.required],
			verificationCode: ['']
		});
		const raw = this.route.snapshot.queryParamMap.get('returnUrl') ?? LOGIN_URL_DEFAULT_RETURN;
		this.returnUrl = raw.startsWith(LOGIN_URL_DEFAULT_RETURN) ? raw : LOGIN_URL_DEFAULT_RETURN;
	}

	/**
	 * Clears the code-sent auto-clear timer if active and logs the component
	 * destruction event.
	 */
	ngOnDestroy(): void {
		if (this.codeSentTimeout) {
			clearTimeout(this.codeSentTimeout);
			this.codeSentTimeout = null;
		}
		this.dialogComponentContainer?.clear();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	/**
	 * Checks whether the given form control is invalid after the form has been
	 * submitted.
	 *
	 * @param controlName - The name of the form control to check.
	 * @returns True if the control is invalid and the form has been submitted, false otherwise.
	 */
	protected isInvalid(controlName: string): boolean {
		const control = this.loginForm.get(controlName);
		return !!(control?.invalid && this.formSubmitted);
	}

	/**
	 * Toggles between sign-in and sign-up mode with a fade animation.
	 * Resets the form and updates validators for the email and
	 * verification code fields depending on the selected mode.
	 */
	protected toggleMode(): void {
		// Start fade-out animation; after 280ms (matching CSS transition duration),
		// swap the form mode, reset validators, and trigger fade-in.
		this.animating = LOGIN_ANIM_OUT;

		setTimeout(() => {
			this.isSignUp = !this.isSignUp;
			this.formSubmitted = false;
			this.codeSent = false;
			if (this.codeSentTimeout) {
				clearTimeout(this.codeSentTimeout);
				this.codeSentTimeout = null;
			}

			this.loginForm.reset();

			const usernameControl = this.loginForm.get('username');
			const emailControl = this.loginForm.get('email');
			const passwordControl = this.loginForm.get('password');
			const codeControl = this.loginForm.get('verificationCode');

			if (this.isSignUp) {
				emailControl?.setValidators(Validators.required);
				codeControl?.setValidators(Validators.required);
			} else {
				emailControl?.clearValidators();
				codeControl?.clearValidators();
			}

			usernameControl?.updateValueAndValidity();
			emailControl?.updateValueAndValidity();
			passwordControl?.updateValueAndValidity();
			codeControl?.updateValueAndValidity();

			this.animating = LOGIN_ANIM_IN;
			// setTimeout callback fires outside Angular's zone; detectChanges() is
			// required to apply the animator state swap immediately in the template.
			this.cdr.detectChanges();
		}, 280);
	}

	/**
	 * Sends a verification code to the email address entered in the form.
	 * Prevents duplicate requests while a code is already being sent.
	 * The code-sent indicator auto-clears after 4 seconds.
	 */
	protected async getVerificationCodeEmail(): Promise<void> {
		// Prevent duplicate requests; codeSent is set optimistically before the API
		// call so the user sees immediate feedback, then auto-clears after 4 seconds.
		if (this.sendingCode) return;
		this.sendingCode = true;
		this.codeSent = true;
		try {
			await this.authService.getVerificationCodeEmail(this.loginForm.value['email']);
			if (this.codeSentTimeout) {
				clearTimeout(this.codeSentTimeout);
			}
			this.codeSentTimeout = setTimeout(() => {
				this.codeSent = false;
				this.codeSentTimeout = null;
			}, 4000);
		} catch (error: unknown) {
			this.codeSent = false;
			LOG.error(this.className, LOGIN_MSG_SEND_CODE_FAILED, error as Error);
		} finally {
			this.sendingCode = false;
		}
	}

	/**
	 * Submits the login or sign-up form. Validates the form first; if invalid,
	 * marks the form as submitted to show validation errors. Routes to the
	 * appropriate auth service method based on the current mode.
	 */
	protected async onSubmit(): Promise<void> {
		this.formSubmitted = true;
		if (!this.loginForm.valid) return;

		try {
			if (this.isSignUp) {
				// Cloudbase sign up and automatically sign in after registration
               await this.authService.signUp(
					this.loginForm.value['email'],
					this.loginForm.value['password'],
					this.loginForm.value['username'],
					this.loginForm.value['verificationCode']
				);
			} else {
				if (Utilities.getCurrentCountry() === CN) {
					// Cloudbase sign in
					await this.authService.signIn(
						this.loginForm.value['username'],
						this.loginForm.value['password'],
						this.returnUrl
					);
				} else {
					// Firebase sign in
					await this.authService.emailPasswordLogin(
						this.loginForm.value['username'],
						this.loginForm.value['password'],
						this.returnUrl
					);
				}
			}
		} catch (error: unknown) {
			if (
				error instanceof WrongCredentialsError ||
				error instanceof WrongParametersError ||
				error instanceof wrongVerificationCodeError
			) {
				this.dialogService.openDialog(this.dialogComponentContainer, DIALOG_ERROR, error.message);
			} else {
				this.dialogService.showUnexpectedError(this.dialogComponentContainer);
			}
		}
	}

	/**
	 * Initiates the Google sign-in flow.
	 */
	protected googleLogin(): void {
		this.authService.googleLogin();
	}
}
