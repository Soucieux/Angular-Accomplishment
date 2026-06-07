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
import { Utilities } from '../../common/app.utilities';
import {
	CN,
	COMPONENT_DESTROY,
	DIALOG_ERROR,
	LOGIN_ANIM_IN,
	LOGIN_ANIM_OUT,
	LOGIN_LABEL_CREATE_ACCOUNT,
	LOGIN_LABEL_GET_CODE,
	LOGIN_LABEL_LOADING,
	LOGIN_LABEL_SIGN_IN,
	LOGIN_ERROR_USERNAME_TOO_LONG,
	LOGIN_MAX_USERNAME_LENGTH,
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

	protected loginForm!: FormGroup;
	protected formSubmitted = false;
	protected isSignUp = false;
	protected animating: 'out' | 'in' | '' = '';
	protected codeSent = false;
	protected sendingCode = false;
	protected lampOn = false;
	protected lampHue = 42;
	/** Gets the current date, evaluated on each change-detection cycle. */
	protected get today(): Date { return new Date(); }

	private codeSentTimeout: ReturnType<typeof setTimeout> | null = null;
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
		const raw = this.route.snapshot.queryParamMap.get('returnUrl') ?? LOGIN_URL_DEFAULT_RETURN;
		this.returnUrl = raw.startsWith(LOGIN_URL_DEFAULT_RETURN) ? raw : LOGIN_URL_DEFAULT_RETURN;
	}

	/**
	 * Wires up the GSAP Draggable pull-cord once the view is initialised.
	 * Dragging the handle past PULL_THRESHOLD flips the lamp; on release the
	 * handle springs back with an elastic ease while the rope's bezier control
	 * point wobbles — producing a morphing-rope feel without MorphSVGPlugin.
	 */
	ngAfterViewInit(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		gsap.registerPlugin(Draggable);
		const handle = this.lampHandle.nativeElement;
		const cord = this.lampCord.nativeElement;

		const rope = { cx: 150, y: 0 };
		const draw = (): void => {
			const endY = this.CORD_REST_END_Y + rope.y;
			cord.setAttribute('d', `M150 ${this.ANCHOR_Y} Q ${rope.cx} ${(this.ANCHOR_Y + endY) / 2} 150 ${endY}`);
		};

		gsap.set(handle, { xPercent: -50, y: 0 });
		draw();

		const self = this;
		this.dragInstance = Draggable.create(handle, {
			type: 'y',
			bounds: { minY: 0, maxY: this.HANDLE_MAX },
			cursor: 'grab',
			activeCursor: 'grabbing',
			onPress() {
				gsap.killTweensOf(rope);
			},
			onDrag() {
				rope.y = this['y'];
				draw();
			},
			onDragEnd() {
				if (this['y'] > self.PULL_THRESHOLD) self.toggleLamp();
				const dir = Math.random() > 0.5 ? 1 : -1;
				gsap.to(rope, {
					y: 0,
					duration: 1.15,
					ease: 'elastic.out(1, 0.4)',
					onUpdate() {
						gsap.set(handle, { y: rope.y });
						draw();
					}
				});
				gsap.fromTo(
					rope,
					{ cx: 150 + 32 * dir },
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
		if (this.codeSentTimeout) {
			clearTimeout(this.codeSentTimeout);
			this.codeSentTimeout = null;
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
			const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
			this.audioCtx ??= new Ctx();
			const a = this.audioCtx;
			if (a.state === 'suspended') a.resume().catch(() => {});
			const t = a.currentTime;
			const osc = a.createOscillator();
			const gain = a.createGain();
			osc.type = 'square';
			osc.frequency.setValueAtTime(840, t);
			osc.frequency.exponentialRampToValueAtTime(170, t + 0.05);
			gain.gain.setValueAtTime(0.0001, t);
			gain.gain.exponentialRampToValueAtTime(0.2, t + 0.004);
			gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
			osc.connect(gain).connect(a.destination);
			osc.start(t);
			osc.stop(t + 0.11);
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
				usernameControl?.setValidators([Validators.required, Validators.maxLength(LOGIN_MAX_USERNAME_LENGTH)]);
				emailControl?.setValidators(Validators.required);
				codeControl?.setValidators(Validators.required);
			} else {
				usernameControl?.setValidators(Validators.required);
				emailControl?.clearValidators();
				codeControl?.clearValidators();
			}

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
		if (this.sendingCode) return;
		this.sendingCode = true;
		this.codeSent = true;
		try {
			await this.authService.getVerificationCodeEmail(this.loginForm.value['email']);
			if (this.codeSentTimeout) clearTimeout(this.codeSentTimeout);
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
	 * Submits the login or sign-up form. Validates first and shows validation
	 * errors if invalid. Routes to the appropriate auth service method based
	 * on the current mode and the user's country.
	 */
	protected async onSubmit(): Promise<void> {
		this.formSubmitted = true;
		if (!this.loginForm.valid) return;

		try {
			if (this.isSignUp) {
				await this.authService.signUp(
					this.loginForm.value['email'],
					this.loginForm.value['password'],
					this.loginForm.value['username'],
					this.loginForm.value['verificationCode']
				);
			} else {
				if (Utilities.getCurrentCountry() === CN) {
					await this.authService.signIn(
						this.loginForm.value['username'],
						this.loginForm.value['password'],
						this.returnUrl
					);
				} else {
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
