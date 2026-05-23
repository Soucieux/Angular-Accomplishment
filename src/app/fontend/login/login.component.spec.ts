import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
	let component: LoginComponent;
	let fixture: ComponentFixture<LoginComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [LoginComponent],
			providers: [provideRouter([]), MessageService]
		}).compileComponents();

		fixture = TestBed.createComponent(LoginComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	// ── Form initialisation ────────────────────────────────────────────────

	describe('form initialisation', () => {
		it('creates a form with username, email, password, and verificationCode controls', () => {
			const form = (component as any).loginForm;
			expect(form.get('username')).toBeTruthy();
			expect(form.get('email')).toBeTruthy();
			expect(form.get('password')).toBeTruthy();
			expect(form.get('verificationCode')).toBeTruthy();
		});

		it('marks username as required', () => {
			const ctrl = (component as any).loginForm.get('username');
			ctrl.setValue('');
			expect(ctrl.valid).toBeFalse();
		});

		it('marks password as required', () => {
			const ctrl = (component as any).loginForm.get('password');
			ctrl.setValue('');
			expect(ctrl.valid).toBeFalse();
		});

		it('starts with a valid form state once required fields are filled', () => {
			const form = (component as any).loginForm;
			form.get('username').setValue('user@example.com');
			form.get('password').setValue('secret');
			expect(form.valid).toBeTrue();
		});
	});

	// ── isInvalid ──────────────────────────────────────────────────────────

	describe('isInvalid', () => {
		it('returns false before the form is submitted', () => {
			expect((component as any).isInvalid('username')).toBeFalsy();
		});

		it('returns true after submission when the control is empty', () => {
			(component as any).formSubmitted = true;
			const ctrl = (component as any).loginForm.get('username');
			ctrl.setValue('');
			expect((component as any).isInvalid('username')).toBeTrue();
		});

		it('returns false after submission when the control is valid', () => {
			(component as any).formSubmitted = true;
			const ctrl = (component as any).loginForm.get('username');
			ctrl.setValue('user@example.com');
			expect((component as any).isInvalid('username')).toBeFalsy();
		});
	});

	// ── mode toggle ────────────────────────────────────────────────────────

	describe('initial mode', () => {
		it('starts in sign-in mode (isSignUp = false)', () => {
			expect((component as any).isSignUp).toBeFalse();
		});

		it('starts with formSubmitted = false', () => {
			expect((component as any).formSubmitted).toBeFalse();
		});
	});
});
