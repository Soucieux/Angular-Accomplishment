import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { IftaLabelModule } from 'primeng/iftalabel';
import { AuthService } from '../service/authentication-service/auth.service';

@Component({
	selector: 'login',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		InputTextModule,
		ButtonModule,
		MessageModule,
		IftaLabelModule
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
			password: ['', Validators.required]
		});
	}

	isInvalid(controlName: string) {
		const control = this.loginForm.get(controlName);
		return control?.invalid && (control.touched || this.formSubmitted);
	}

	onSubmit() {
		this.formSubmitted = true;
		if (this.loginForm.valid) {
			this.authService.emailPasswordLogin(
				this.loginForm.value['email'],
				this.loginForm.value['password']
			);
		}
	}

	googleLogin() {
		this.authService.googleLogin();
	}
}
