import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Inject,
	OnDestroy,
	OnInit,
	PLATFORM_ID,
	ViewChild,
	ViewContainerRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { IftaLabelModule } from 'primeng/iftalabel';
import { ActivatedRoute } from '@angular/router';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';

import { AuthService } from '../../backend/authentication-service/auth.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import {
	COMPONENT_DESTROY,
	DIALOG_ERROR,
	LOGIN_ANIM_IN,
	LOGIN_ANIM_OUT,
	LOGIN_LABEL_LOADING,
	LOGIN_MAX_USERNAME_LENGTH,
	LOGIN_URL_DEFAULT_RETURN
} from '../../common/constants';
import {
	LOGIN_LABEL_CREATE_ACCOUNT,
	LOGIN_LABEL_GET_CODE,
	LOGIN_LABEL_SIGN_IN,
	LOGIN_ERROR_USERNAME_TOO_LONG,
	LOGIN_MSG_SEND_CODE_FAILED,
	LOGIN_LABEL_PWD_REQ_LENGTH,
	LOGIN_LABEL_PWD_REQ_TYPES,
	LOGIN_LABEL_PWD_REQ_UPPERCASE,
	LOGIN_LABEL_PWD_REQ_LOWERCASE,
	LOGIN_LABEL_PWD_REQ_DIGIT,
	LOGIN_LABEL_PWD_REQ_SPECIAL,
	LOGIN_LABEL_CODE_COUNTDOWN_SUFFIX,
	LOGIN_MSG_CODE_SENT,
	LOGIN_LABEL_FORGOT_PASSWORD,
	LOGIN_LABEL_SEND_RESET_CODE,
	LOGIN_LABEL_RESET_PASSWORD,
	LOGIN_LABEL_BACK_TO_SIGN_IN,
	LOGIN_TOGGLE_HAS_ACCOUNT,
	LOGIN_TOGGLE_NO_ACCOUNT,
	LOGIN_TOGGLE_SIGN_IN,
	LOGIN_TOGGLE_SIGN_UP,
	LOGIN_FLAVOUR_TEXT,
	LABEL_EMAIL,
	LOGIN_MSG_EMAIL_REQUIRED,
	LOGIN_MSG_EMAIL_INVALID,
	LOGIN_LABEL_CODE,
	LOGIN_MSG_CODE_REQUIRED,
	LABEL_NEW_PASSWORD,
	LOGIN_MSG_PASSWORD_REQUIRED,
	LABEL_USERNAME,
	LOGIN_MSG_USERNAME_REQUIRED,
	LOGIN_LABEL_PASSWORD
} from '../../common/locale/locale-strings';
import { LOG } from '../../common/app.logs';
import { AccountRateLimitedError } from '../../common/error/account-rate-limited.error';
import { EmailNotVerifiedError } from '../../common/error/email-not-verified.error';
import { InvalidEmailError } from '../../common/error/invalid-email.error';
import { PasswordTooWeakError } from '../../common/error/password-too-weak.error';
import { UserNotFoundError } from '../../common/error/user-not-found.error';
import { WrongCredentialsError } from '../../common/error/wrong-credentials.error';
import { WrongParametersError } from '../../common/error/wrong-parameters.error';
import { WrongVerificationCodeError } from '../../common/error/wrong-verification-code.error';

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
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
	private readonly className = 'LoginComponent';
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	@ViewChild('lampHandle') private lampHandle!: ElementRef<HTMLElement>;
	@ViewChild('lampCord') private lampCord!: ElementRef<SVGPathElement>;

	protected readonly LOGIN_ERROR_USERNAME_TOO_LONG = LOGIN_ERROR_USERNAME_TOO_LONG;
	protected readonly LOGIN_LABEL_CREATE_ACCOUNT = LOGIN_LABEL_CREATE_ACCOUNT;
	protected readonly LOGIN_LABEL_GET_CODE = LOGIN_LABEL_GET_CODE;
	protected readonly LOGIN_LABEL_LOADING = LOGIN_LABEL_LOADING;
	protected readonly LOGIN_LABEL_SIGN_IN = LOGIN_LABEL_SIGN_IN;
	protected readonly LOGIN_MAX_USERNAME_LENGTH = LOGIN_MAX_USERNAME_LENGTH;
	protected readonly LOGIN_LABEL_PWD_REQ_LENGTH = LOGIN_LABEL_PWD_REQ_LENGTH;
	protected readonly LOGIN_LABEL_PWD_REQ_TYPES = LOGIN_LABEL_PWD_REQ_TYPES;
	protected readonly LOGIN_LABEL_PWD_REQ_UPPERCASE = LOGIN_LABEL_PWD_REQ_UPPERCASE;
	protected readonly LOGIN_LABEL_PWD_REQ_LOWERCASE = LOGIN_LABEL_PWD_REQ_LOWERCASE;
	protected readonly LOGIN_LABEL_PWD_REQ_DIGIT = LOGIN_LABEL_PWD_REQ_DIGIT;
	protected readonly LOGIN_LABEL_PWD_REQ_SPECIAL = LOGIN_LABEL_PWD_REQ_SPECIAL;
	protected readonly LOGIN_LABEL_CODE_COUNTDOWN_SUFFIX = LOGIN_LABEL_CODE_COUNTDOWN_SUFFIX;
	protected readonly LOGIN_MSG_CODE_SENT = LOGIN_MSG_CODE_SENT;
	protected readonly LOGIN_FLAVOUR_TEXT = LOGIN_FLAVOUR_TEXT;
	protected readonly LABEL_EMAIL = LABEL_EMAIL;
	protected readonly LOGIN_MSG_EMAIL_REQUIRED = LOGIN_MSG_EMAIL_REQUIRED;
	protected readonly LOGIN_MSG_EMAIL_INVALID = LOGIN_MSG_EMAIL_INVALID;
	protected readonly LOGIN_LABEL_CODE = LOGIN_LABEL_CODE;
	protected readonly LOGIN_MSG_CODE_REQUIRED = LOGIN_MSG_CODE_REQUIRED;
	protected readonly LABEL_NEW_PASSWORD = LABEL_NEW_PASSWORD;
	protected readonly LOGIN_MSG_PASSWORD_REQUIRED = LOGIN_MSG_PASSWORD_REQUIRED;
	protected readonly LABEL_USERNAME = LABEL_USERNAME;
	protected readonly LOGIN_MSG_USERNAME_REQUIRED = LOGIN_MSG_USERNAME_REQUIRED;
	protected readonly LOGIN_LABEL_PASSWORD = LOGIN_LABEL_PASSWORD;
	protected readonly LOGIN_LABEL_FORGOT_PASSWORD = LOGIN_LABEL_FORGOT_PASSWORD;
	protected readonly LOGIN_LABEL_SEND_RESET_CODE = LOGIN_LABEL_SEND_RESET_CODE;
	protected readonly LOGIN_LABEL_RESET_PASSWORD = LOGIN_LABEL_RESET_PASSWORD;
	protected readonly LOGIN_LABEL_BACK_TO_SIGN_IN = LOGIN_LABEL_BACK_TO_SIGN_IN;
	protected readonly LOGIN_TOGGLE_HAS_ACCOUNT = LOGIN_TOGGLE_HAS_ACCOUNT;
	protected readonly LOGIN_TOGGLE_NO_ACCOUNT = LOGIN_TOGGLE_NO_ACCOUNT;
	protected readonly LOGIN_TOGGLE_SIGN_IN = LOGIN_TOGGLE_SIGN_IN;
	protected readonly LOGIN_TOGGLE_SIGN_UP = LOGIN_TOGGLE_SIGN_UP;

	protected loginForm!: FormGroup;
	protected formSubmitted = false;
	protected isSignUp = false;
	protected isForgotPassword = false;
	protected forgotPasswordStep: 1 | 2 = 1;
	protected animating: 'out' | 'in' | '' = '';
	protected codeSent = false;
	protected codeCountdown = 0;
	protected sendingCode = false;
	protected lampOn = false;
	protected lampHue = 42;

	private codeCountdownInterval: ReturnType<typeof setInterval> | null = null;
	private returnUrl: string = LOGIN_URL_DEFAULT_RETURN;
	private dragInstance: Draggable | null = null;
	private audioCtx: AudioContext | null = null;

	/** SVG y-coordinate where the pull cord leaves the lamp shade. */
	private readonly ANCHOR_Y = 178;
	/** SVG y-coordinate of the cord line end-point at rest (handle centre minus visual offset). */
	private readonly CORD_REST_END_Y = 227;
	/** Maximum downward drag distance in pixels before the handle stops. */
	private readonly HANDLE_MAX = 92;
	/** Drag distance past which pulling the cord flips the lamp switch. */
	private readonly PULL_THRESHOLD = 50;

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		private fb: FormBuilder,
		private authService: AuthService,
		private dialogService: DialogService,
		private cdr: ChangeDetectorRef,
		private route: ActivatedRoute
	) {}

	/**
	 * Builds the reactive login form and reads the returnUrl query param
	 * so sign-in can redirect back to the page the user came from.
	 */
	ngOnInit(): void {
		this.loginForm = this.fb.group({
			username: ['', Validators.required],
			email: [''],
			password: ['', Validators.required],
			verificationCode: ['']
		});
		const rawReturnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? LOGIN_URL_DEFAULT_RETURN;
		this.returnUrl = rawReturnUrl.startsWith(LOGIN_URL_DEFAULT_RETURN)
			? rawReturnUrl
			: LOGIN_URL_DEFAULT_RETURN;
	}

	/**
	 * Wires up the GSAP Draggable pull-cord once the view is initialised.
	 * Dragging the handle past PULL_THRESHOLD flips the lamp; on release the
	 * handle springs back with an elastic ease while the rope's bezier control
	 * point wobbles — producing a morphing-rope feel without MorphSVGPlugin.
	 */
	ngAfterViewInit(): void {
		if (!isPlatformBrowser(this.platformId)) return;

		// Step 1: Register the GSAP Draggable plugin and grab the DOM references
		gsap.registerPlugin(Draggable);
		const handle = this.lampHandle.nativeElement;
		const cord = this.lampCord.nativeElement;

		/* Step 2: Define the rope state object and its draw function.
		   cx drifts left/right during the wobble; y tracks vertical drag offset.
		   The quadratic bezier midpoint is the arithmetic mean of ANCHOR_Y and endY
		   so the curve always passes naturally between the two endpoints. */
		const rope = { cx: 150, y: 0 };
		const draw = (): void => {
			const endY = this.CORD_REST_END_Y + rope.y;
			cord.setAttribute(
				'd',
				`M150 ${this.ANCHOR_Y} Q ${rope.cx} ${(this.ANCHOR_Y + endY) / 2} 150 ${endY}`
			);
		};

		// Step 3: Place the handle at its rest position and render the initial cord shape
		gsap.set(handle, { xPercent: -50, y: 0 });
		draw();

		/* Step 4: Wire the Draggable instance.
		   `self` is captured here because GSAP callbacks run with `this` bound to the
		   Draggable instance, so the component reference would otherwise be lost. */
		const self = this;
		this.dragInstance = Draggable.create(handle, {
			type: 'y',
			bounds: { minY: 0, maxY: this.HANDLE_MAX },
			cursor: 'grab',
			activeCursor: 'grabbing',
			onPress() {
				// Kill any in-progress spring so a new pull starts from the current position
				gsap.killTweensOf(rope);
			},
			onDrag() {
				rope.y = this['y'];
				draw();
			},
			onDragEnd() {
				// Step 4.1: Toggle the lamp if the user pulled far enough, then spring the handle back
				if (this['y'] > self.PULL_THRESHOLD) self.toggleLamp();
				const direction = Math.random() > 0.5 ? 1 : -1;
				gsap.to(rope, {
					y: 0,
					duration: 1.15,
					ease: 'elastic.out(1, 0.4)',
					onUpdate() {
						gsap.set(handle, { y: rope.y });
						draw();
					}
				});

				/* Step 4.2: Animate the horizontal cx wobble independently of y.
				   Two separate tweens let each axis use its own elastic parameters,
				   producing a more organic swinging-rope feel. */
				gsap.fromTo(
					rope,
					{ cx: 150 + 32 * direction },
					{ cx: 150, duration: 1.3, ease: 'elastic.out(1.1, 0.25)', onUpdate: draw }
				);
			}
		})[0];
	}

	/**
	 * Clears the code-sent timer, kills the drag instance, closes the audio
	 * context, clears the dialog container, and logs the destruction event.
	 */
	ngOnDestroy(): void {
		if (this.codeCountdownInterval) {
			clearInterval(this.codeCountdownInterval);
			this.codeCountdownInterval = null;
		}
		this.dragInstance?.kill();
		this.audioCtx?.close();
		this.dialogComponentContainer?.clear();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	/**
	 * Flips the lamp on or off, randomises the light hue, and plays the click
	 * sound. Runs from a GSAP callback outside Angular's zone, so detectChanges()
	 * is required to apply the class and style bindings immediately.
	 */
	private toggleLamp(): void {
		this.playClick();
		this.lampHue = Math.floor(Math.random() * 360);
		this.lampOn = !this.lampOn;
		this.cdr.detectChanges();
	}

	/**
	 * Synthesises a short switch-click sound using the Web Audio API.
	 * Errors are silently swallowed — audio is a non-critical flourish.
	 */
	private playClick(): void {
		try {
			/* Step 1: Resolve the AudioContext constructor across browsers.
			   Safari shipped it as webkitAudioContext for years; the fallback prevents
			   a ReferenceError on older WebKit builds. The instance is lazily created
			   and reused — constructing a new context per click would exhaust the
			   browser's context limit (~6 on Chrome). */
			const AudioContextClass =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
			this.audioCtx ??= new AudioContextClass();
			const audioContext = this.audioCtx;

			// Step 2: Resume the context if it was suspended by autoplay policy
			if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
			const startTime = audioContext.currentTime;
			const oscillator = audioContext.createOscillator();
			const gain = audioContext.createGain();

			/* Step 3: Shape the oscillator's pitch envelope to mimic a mechanical click.
			   High-frequency square wave drops sharply to a thud — the 840→170 Hz ramp
			   over 50 ms approximates the transient of a physical switch. */
			oscillator.type = 'square';
			oscillator.frequency.setValueAtTime(840, startTime);
			oscillator.frequency.exponentialRampToValueAtTime(170, startTime + 0.05);

			/* Step 4: Shape the gain envelope — fast attack, short decay.
			   The initial value must be non-zero (0.0001) because exponentialRamp
			   is undefined for zero and will throw on some browsers. */
			gain.gain.setValueAtTime(0.0001, startTime);
			gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.004);
			gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.1);

			// Step 5: Connect the graph and schedule the one-shot sound
			oscillator.connect(gain).connect(audioContext.destination);
			oscillator.start(startTime);
			oscillator.stop(startTime + 0.11);
		} catch {
			/* audio is a non-critical flourish */
		}
	}

	/**
	 * Checks whether the given form control is invalid after the form has been submitted.
	 *
	 * @param controlName - The name of the form control to check.
	 * @returns True when the control is invalid and the form has been submitted.
	 */
	protected isInvalid(controlName: string): boolean {
		const control = this.loginForm.get(controlName);
		return !!(control?.invalid && this.formSubmitted);
	}

	/**
	 * Toggles between sign-in and sign-up mode with a slide animation.
	 * Resets the form and updates validators for the email and
	 * verification code fields depending on the selected mode.
	 */
	protected toggleMode(): void {
		// Step 1: Trigger the slide-out animation before mutating any state
		this.animating = LOGIN_ANIM_OUT;

		/* Step 2: Defer state changes until the CSS transition has finished (~280 ms).
		   Mutating isSignUp before the animation completes would cause the form fields
		   to re-render mid-transition, producing a visible flash. */
		setTimeout(() => {
			// Step 2.1: Flip mode and clear all transient form state
			this.isSignUp = !this.isSignUp;
			this.isForgotPassword = false;
			this.forgotPasswordStep = 1;
			this.formSubmitted = false;
			this.codeSent = false;
			this.codeCountdown = 0;
			if (this.codeCountdownInterval) {
				clearInterval(this.codeCountdownInterval);
				this.codeCountdownInterval = null;
			}

			this.loginForm.reset();

			// Step 2.2: Reconfigure validators to match the new mode
			const usernameControl = this.loginForm.get('username');
			const emailControl = this.loginForm.get('email');
			const passwordControl = this.loginForm.get('password');
			const codeControl = this.loginForm.get('verificationCode');

			if (this.isSignUp) {
				usernameControl?.setValidators([
					Validators.required,
					Validators.maxLength(LOGIN_MAX_USERNAME_LENGTH)
				]);
				emailControl?.setValidators(Validators.required);
				codeControl?.setValidators(Validators.required);
			} else {
				usernameControl?.setValidators(Validators.required);
				emailControl?.clearValidators();
				codeControl?.clearValidators();
			}

			/* Step 2.3: Sync validity state after changing validators.
			   updateValueAndValidity must be called on every control even if its
			   validators did not change — Angular requires an explicit refresh to
			   reflect the new validation rules in the form's valid/invalid state. */
			usernameControl?.updateValueAndValidity();
			emailControl?.updateValueAndValidity();
			passwordControl?.updateValueAndValidity();
			codeControl?.updateValueAndValidity();

			// Step 3: Trigger the slide-in animation and push changes to the view
			this.animating = LOGIN_ANIM_IN;
			this.cdr.detectChanges();
		}, 280);
	}

	/**
	 * Enters forgot-password mode from sign-in. Slides the form out, resets
	 * transient state, and sets the email validator for step 1.
	 */
	protected toggleForgotPassword(): void {
		this.animating = LOGIN_ANIM_OUT;
		setTimeout(() => {
			this.isForgotPassword = true;
			this.forgotPasswordStep = 1;
			this.formSubmitted = false;
			this.codeSent = false;
			this.codeCountdown = 0;
			if (this.codeCountdownInterval) {
				clearInterval(this.codeCountdownInterval);
				this.codeCountdownInterval = null;
			}
			this.loginForm.reset();

			const emailControl = this.loginForm.get('email');
			const usernameControl = this.loginForm.get('username');
			const passwordControl = this.loginForm.get('password');
			const codeControl = this.loginForm.get('verificationCode');
			emailControl?.setValidators([Validators.required, Validators.email]);
			usernameControl?.clearValidators();
			passwordControl?.clearValidators();
			codeControl?.clearValidators();
			emailControl?.updateValueAndValidity();
			usernameControl?.updateValueAndValidity();
			passwordControl?.updateValueAndValidity();
			codeControl?.updateValueAndValidity();

			this.animating = LOGIN_ANIM_IN;
			this.cdr.detectChanges();
		}, 280);
	}

	/**
	 * Returns to the sign-in form from forgot-password mode without toggling
	 * isSignUp. Resets all transient state and restores sign-in validators.
	 */
	protected backToSignIn(): void {
		this.animating = LOGIN_ANIM_OUT;
		setTimeout(() => {
			this.isForgotPassword = false;
			this.forgotPasswordStep = 1;
			this.isSignUp = false;
			this.formSubmitted = false;
			this.codeSent = false;
			this.codeCountdown = 0;
			if (this.codeCountdownInterval) {
				clearInterval(this.codeCountdownInterval);
				this.codeCountdownInterval = null;
			}
			this.loginForm.reset();

			const usernameControl = this.loginForm.get('username');
			const emailControl = this.loginForm.get('email');
			const passwordControl = this.loginForm.get('password');
			const codeControl = this.loginForm.get('verificationCode');
			usernameControl?.setValidators(Validators.required);
			emailControl?.clearValidators();
			passwordControl?.setValidators(Validators.required);
			codeControl?.clearValidators();
			usernameControl?.updateValueAndValidity();
			emailControl?.updateValueAndValidity();
			passwordControl?.updateValueAndValidity();
			codeControl?.updateValueAndValidity();

			this.animating = LOGIN_ANIM_IN;
			this.cdr.detectChanges();
		}, 280);
	}

	/**
	 * Sends a verification code to the email address entered in the form.
	 * Prevents duplicate requests while a send is in progress.
	 * The code-sent indicator auto-clears after 4 seconds.
	 */
	protected async getVerificationCodeEmail(): Promise<void> {
		// Step 1: Debounce — block if a send is already in flight or still cooling down
		if (this.sendingCode || this.codeCountdown > 0) return;
		this.sendingCode = true;

		/* Step 2: Start the countdown before the network call so the button is
		   disabled immediately, preventing double-taps on slow connections. */
		this.startCodeCountdown();
		try {
			await this.authService.getVerificationCodeEmail(this.loginForm.value['email']);
		} catch (error: unknown) {
			// Step 3: On failure, roll back the countdown state so the user can retry
			this.codeSent = false;
			this.codeCountdown = 0;
			if (this.codeCountdownInterval) {
				clearInterval(this.codeCountdownInterval);
				this.codeCountdownInterval = null;
			}
			LOG.error(this.className, LOGIN_MSG_SEND_CODE_FAILED, error as Error);
		} finally {
			this.sendingCode = false;
		}
	}

	/**
	 * Starts a 10-second countdown after a verification code is successfully sent.
	 * Disables the Get Code button and shows the remaining seconds until the button re-enables.
	 * Calls detectChanges on each tick because setInterval runs outside Angular's zone.
	 */
	private startCodeCountdown(): void {
		// Step 1: Show the "code sent" banner and seed the counter, then push to the view immediately
		this.codeSent = true;
		this.codeCountdown = 10;
		this.cdr.detectChanges();

		/* Step 2: Tick the counter every second.
		   setInterval runs outside Angular's zone, so detectChanges() is required on
		   every tick — otherwise the template counter would not update until the next
		   user interaction triggered change detection naturally. */
		this.codeCountdownInterval = setInterval(() => {
			this.codeCountdown--;
			if (this.codeCountdown <= 0) {
				this.codeCountdown = 0;
				clearInterval(this.codeCountdownInterval!);
				this.codeCountdownInterval = null;
			}
			this.cdr.detectChanges();
		}, 1000);
	}

	/**
	 * Submits the login or sign-up form. Validates first and shows validation
	 * errors if invalid. Routes to the appropriate auth service method based
	 * on the current mode (sign-up, sign-in, or forgot-password).
	 */
	protected async onSubmit(): Promise<void> {
		// Step 1: Mark the form as submitted so validation errors become visible in the template
		this.formSubmitted = true;
		if (!this.loginForm.valid) return;

		try {
			if (this.isForgotPassword) {
				if (this.forgotPasswordStep === 1) {
					// Step 2c (forgot — step 1): Advance to step 2 immediately to block
					// duplicate sends, then fire the API call. Revert on failure.
					this.forgotPasswordStep = 2;
					this.formSubmitted = false;
					const passwordControl = this.loginForm.get('password');
					const codeControl = this.loginForm.get('verificationCode');
					passwordControl?.setValidators(Validators.required);
					codeControl?.setValidators(Validators.required);
					passwordControl?.updateValueAndValidity();
					codeControl?.updateValueAndValidity();
					this.cdr.detectChanges();
					try {
						await this.authService.sendPasswordResetEmail(this.loginForm.value['email']);
					} catch (sendError) {
						this.forgotPasswordStep = 1;
						passwordControl?.clearValidators();
						codeControl?.clearValidators();
						passwordControl?.updateValueAndValidity();
						codeControl?.updateValueAndValidity();
						this.cdr.detectChanges();
						throw sendError;
					}
				} else {
					// Step 2d (forgot — step 2): Verify code and set new password
					await this.authService.resetPassword(
						this.loginForm.value['verificationCode'],
						this.loginForm.value['password'],
						this.returnUrl
					);
				}
				return;
			}

			if (this.isSignUp) {
				// Step 2a: Sign-up path — requires email, password, username, and verification code
				await this.authService.signUp(
					this.loginForm.value['email'],
					this.loginForm.value['password'],
					this.loginForm.value['username'],
					this.loginForm.value['verificationCode']
				);
			} else {
				// Step 2b: Sign-in path — the CloudBase signIn() flow
				await this.authService.signIn(
					this.loginForm.value['username'],
					this.loginForm.value['password'],
					this.returnUrl
				);
			}
		} catch (error: unknown) {
			/* Step 3: Distinguish user-facing errors from unexpected ones.
			   Known error types carry a human-readable message suitable for the dialog;
			   anything else falls back to the generic unexpected-error dialog to avoid
			   leaking internal details. */
			if (
				error instanceof WrongCredentialsError ||
				error instanceof WrongParametersError ||
				error instanceof WrongVerificationCodeError ||
				error instanceof InvalidEmailError ||
				error instanceof UserNotFoundError ||
				error instanceof EmailNotVerifiedError ||
				error instanceof AccountRateLimitedError ||
				error instanceof PasswordTooWeakError
			) {
				this.dialogService.openDialog(this.dialogComponentContainer, DIALOG_ERROR, error.message);
			} else {
				this.dialogService.showUnexpectedError(this.dialogComponentContainer);
			}
		}
	}

	// ── Template helper methods ───────────────────────────────────────────────

	/**
	 * Gets the current date, evaluated on each change-detection cycle.
	 *
	 * @returns The current date.
	 */
	protected get today(): Date {
		return new Date();
	}

	/**
	 * Gets the full set of password requirement check results in one pass over the form value.
	 * Bound via `@let checks = passwordChecks` in the template so Angular evaluates this once
	 * per change-detection cycle regardless of how many bindings reference it.
	 *
	 * @returns An object with named boolean flags for each requirement and the combined typesMet gate.
	 */
	protected get passwordChecks() {
		const password = (this.loginForm.get('password')?.value as string) ?? '';
		const upper = /[A-Z]/.test(password);
		const lower = /[a-z]/.test(password);
		const digit = /[0-9]/.test(password);
		const special = /[^A-Za-z0-9]/.test(password);
		return {
			meetsLength: password.length >= 8,
			hasUppercase: upper,
			hasLowercase: lower,
			hasDigit: digit,
			hasSpecial: special,
			typesMet: [upper, lower, digit, special].filter(Boolean).length >= 3
		};
	}
}
