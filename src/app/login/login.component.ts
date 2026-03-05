import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { IftaLabelModule } from 'primeng/iftalabel';
import { AuthService } from '../service/authentication-service/auth.service';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { CN, COMPONENT_DESTROY, Utilities } from '../app.utilities';
import { LOG } from '../app.logs';

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

	constructor(
		private fb: FormBuilder,
		private authService: AuthService,
		private utilities: Utilities
	) {
		this.loginForm = this.fb.group({
			email: ['', Validators.required],
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

	async getVerificationCodeEmail() {
		await this.authService.getVerificationCodeEmail(this.loginForm.value['email']);
	}

	// Below is for cloudbase
	onSubmit() {
		this.formSubmitted = true;
		if (this.loginForm.valid) {
			if (this.utilities.getCurrentRegion() === CN) {
				this.authService.signIn(this.loginForm.value['email'], this.loginForm.value['password']);
			} else {
				this.authService.emailPasswordLogin(
					this.loginForm.value['email'],
					this.loginForm.value['password']
				);
			}
		}
	}

	googleLogin() {
		this.authService.googleLogin();
	}
}
