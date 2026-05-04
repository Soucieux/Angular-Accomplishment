import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { IftaLabelModule } from 'primeng/iftalabel';
import { AuthService } from '../../backend/authentication-service/auth.service';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { Utilities } from '../../common/app.utilities';
import { CN, COMPONENT_DESTROY } from '../../common/app.constant';
import { LOG } from '../../common/app.logs';

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
export class LoginComponent {
	private readonly classname = 'LoginComponent';
	loginForm: FormGroup;
	formSubmitted = false;
	isSignUp = false;
	animating: 'out' | 'in' | '' = '';
	codeSent = false;
	private codeSentTimeout: ReturnType<typeof setTimeout> | null = null;

	constructor(
		private fb: FormBuilder,
		private authService: AuthService
	) {
		this.loginForm = this.fb.group({
			username: ['', Validators.required],
			email: [''],
			password: ['', Validators.required],
			verificationCode: ['']
		});
	}

	ngOnDestroy() {
		LOG.info(this.classname, COMPONENT_DESTROY);
	}

	isInvalid(controlName: string) {
		const control = this.loginForm.get(controlName);
		return control?.invalid && (control.touched || this.formSubmitted);
	}

	toggleMode() {
		this.animating = 'out';

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

			this.animating = 'in';
		}, 280);
	}

	async getVerificationCodeEmail() {
		await this.authService.getVerificationCodeEmail(this.loginForm.value['email']);
		this.codeSent = true;
		if (this.codeSentTimeout) {
			clearTimeout(this.codeSentTimeout);
		}
		this.codeSentTimeout = setTimeout(() => {
			this.codeSent = false;
			this.codeSentTimeout = null;
		}, 4000);
	}

	async onSubmit() {
		this.formSubmitted = true;
		if (!this.loginForm.valid) return;

		if (this.isSignUp) {
			await this.authService.signUp(
				this.loginForm.value['email'],
				this.loginForm.value['password'],
				this.loginForm.value['username'],
				Number(this.loginForm.value['verificationCode'])
			);
			await this.authService.signIn(
				this.loginForm.value['username'],
				this.loginForm.value['password']
			);
		} else {
			if (Utilities.getCurrentCountry() === CN) {
				this.authService.signIn(this.loginForm.value['username'], this.loginForm.value['password']);
			} else {
				this.authService.emailPasswordLogin(
					this.loginForm.value['username'],
					this.loginForm.value['password']
				);
			}
		}
	}

	googleLogin() {
		this.authService.googleLogin();
	}
}
