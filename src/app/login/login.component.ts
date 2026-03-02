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
	loginForm: FormGroup;
	formSubmitted = false;

	constructor(private fb: FormBuilder, private authService: AuthService) {
		this.loginForm = this.fb.group({
			email: ['', Validators.required],
			password: ['', Validators.required],
			verificationCode: ['']
		});
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
			this.authService.signIn(this.loginForm.value['email'], this.loginForm.value['password']);
		}
	}

	//TODO
	// Below is for firebase
	/* onSubmit() {
		this.formSubmitted = true;
		if (this.loginForm.valid) {
			this.firebaseAuthService.emailPasswordLogin(
				this.loginForm.value['email'],
				this.loginForm.value['password']
			);
        }
    }
    */

	googleLogin() {
		this.authService.googleLogin();
	}
}
