import {
	Component,
	OnInit,
	OnDestroy,
	ViewChild,
	ViewContainerRef,
	ChangeDetectorRef,
	Inject,
	PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DatabaseService } from '../../backend/database-service/database.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { AuthService } from '../../backend/authentication-service/auth.service';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { Utilities } from '../../common/app.utilities';
import {
	COMPONENT_DESTROY,
	DIALOG_CONFIRM,
	RESONANCE_AUTHOR_ANONYMOUS,
	RESONANCE_MSG_DELETE_CONFIRM,
	RESONANCE_DIALOG_TITLE_DELETE,
	RESONANCE_DIALOG_BTN_DELETE,
	RESONANCE_MSG_POSTED,
	RESONANCE_LABEL_VOICES,
	RESONANCE_MAX_QUOTE_LENGTH
} from '../../common/app.constant';
import { LOG } from '../../common/app.logs';
import { RESONANCE_GRADIENTS } from './resonance.model';

interface QuoteRecord {
	_openid?: string;
	key?: string;
	text?: string;
	author?: string;
	timestamp?: string;
}

@Component({
	selector: 'resonance',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		ButtonModule,
		InputTextModule,
		TextareaModule,
		SkeletonModule,
		TooltipModule
	],
	templateUrl: './resonance.component.html',
	styleUrl: './resonance.component.css'
})
export class ResonanceComponent implements OnInit, OnDestroy {
	private readonly className = 'ResonanceComponent';

	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;

	protected readonly RESONANCE_GRADIENTS = RESONANCE_GRADIENTS;
	protected readonly RESONANCE_MSG_POSTED = RESONANCE_MSG_POSTED;
	protected readonly RESONANCE_LABEL_VOICES = RESONANCE_LABEL_VOICES;
	protected readonly RESONANCE_MAX_QUOTE_LENGTH = RESONANCE_MAX_QUOTE_LENGTH;

	protected quotes$!: Observable<QuoteRecord[]>;
	protected newQuoteText = '';
	protected authorName = '';
	protected submitting = false;
	private signedInAnonymously = false;
	protected postSuccess = false;
	private postSuccessTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		private databaseService: DatabaseService,
		private dialogService: DialogService,
		private authService: AuthService,
		private cdr: ChangeDetectorRef
	) {}

	/**
	 * Initialises the component: signs in anonymously if no user is authenticated
	 * so the CloudBase watcher can connect, then subscribes to the quotes collection.
	 */
	ngOnInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			if (!CloudbaseService.getUseId()) {
				// Wait for anonymous sign-in before starting the watcher —
				// the CloudBase WebSocket needs valid credentials to connect.
				this.authService
					.signInAnonymously()
					.then(() => {
						this.signedInAnonymously = true;
						// Signal that credentials are ready — resonance manages its own auth via anonymous sign-in
						CloudbaseService.markAuthReady();
						this.quotes$ = this.databaseService.getQuotes().pipe(catchError(() => of([])));
						// Promise callback fires outside Angular's zone; detectChanges() is
						// required to bind the newly assigned quotes$ Observable in the template.
						this.cdr.detectChanges();
					})
					.catch(() => {});
			} else {
				this.quotes$ = this.databaseService.getQuotes().pipe(catchError(() => of([])));
			}
		} else {
			this.quotes$ = of([]);
		}
	}

	/**
	 * Signs out the anonymous session if one was started by this component,
	 * clears the dialog container, resets the flag, and logs the component destruction event.
	 */
	ngOnDestroy(): void {
		if (this.postSuccessTimer !== null) clearTimeout(this.postSuccessTimer);
		if (this.signedInAnonymously) {
			this.authService.signOut().catch(() => {});
		}
		this.signedInAnonymously = false;
		this.dialogComponentContainer?.clear();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	/**
	 * Returns the gradient colors for a quote card based on its index.
	 *
	 * @param index - The index of the quote in the list.
	 * @returns An object with from and to gradient color strings.
	 */
	protected getGradient(index: number): { from: string; to: string } {
		return this.RESONANCE_GRADIENTS[index % this.RESONANCE_GRADIENTS.length];
	}

	/**
	 * Returns a human-readable relative time string from a timestamp.
	 *
	 * @param timestamp - The timestamp string in "YYYY.MM.DD HH:mm:ss" format.
	 * @returns A relative time string (e.g. "just now", "5m ago", "2d ago").
	 */
	protected getRelativeTime(timestamp: string | undefined): string {
		return Utilities.getRelativeTime(timestamp ?? '');
	}

	/**
	 * Returns the display name of a quote's author, falling back to 'Anonymous'.
	 *
	 * @param quote - The quote object.
	 * @returns The author name or 'Anonymous'.
	 */
	protected getAuthorName(quote: QuoteRecord): string {
		return quote.author || RESONANCE_AUTHOR_ANONYMOUS;
	}

	/**
	 * Returns the uppercase first initial of a quote's author.
	 *
	 * @param quote - The quote object.
	 * @returns The uppercase first character of the author's name.
	 */
	protected getAuthorInitial(quote: QuoteRecord): string {
		const name = this.getAuthorName(quote);
		return name.charAt(0).toUpperCase();
	}

	/**
	 * Returns true when the current user has administrator rights.
	 * Only admins can see and trigger the delete button on quote cards.
	 *
	 * @returns True if the current user is an admin.
	 */
	protected get isAdmin(): boolean {
		return CloudbaseService.userHasAllRights();
	}

	/**
	 * Checks whether the current user is signed in.
	 *
	 * @returns true if a user ID is present, otherwise false.
	 */
	protected get isSignedIn(): boolean {
		return !!CloudbaseService.getUseId();
	}

	/**
	 * Checks whether the new quote text exceeds the maximum character limit.
	 *
	 * @returns true if the text length exceeds RESONANCE_MAX_QUOTE_LENGTH, otherwise false.
	 */
	protected get isOverLimit(): boolean {
		return this.newQuoteText.length > RESONANCE_MAX_QUOTE_LENGTH;
	}

	/**
	 * Handles the textarea keydown event: submits on bare Enter, allows newline on Shift+Enter.
	 * Uses instanceof narrowing so no cast is needed to access shiftKey.
	 *
	 * @param event - The keydown event fired from the textarea binding.
	 */
	protected handleQuoteTextareaSubmit(event: Event): void {
		if (event instanceof KeyboardEvent && !event.shiftKey) {
			event.preventDefault();
			this.submitQuote().catch(() => {});
		}
	}

	/**
	 * Submits a new quote to the database. Uses the signed-in user's name if available,
	 * otherwise falls back to the manually entered author name or 'Anonymous'.
	 */
	protected async submitQuote(): Promise<void> {
		const text = this.newQuoteText.trim();
		if (!text) return;

		this.submitting = true;
		try {
			// Name resolution chain: signed-in user → CloudBase username;
			// not signed in → manually entered name; fallback → 'Anonymous'.
			const name = this.isSignedIn
				? CloudbaseService.getUserName() || RESONANCE_AUTHOR_ANONYMOUS
				: this.authorName.trim() || RESONANCE_AUTHOR_ANONYMOUS;
			const timestamp = Utilities.getCurrentFormattedTime(true);
			await this.databaseService.addQuote(text, name, timestamp);
			this.newQuoteText = '';
			this.authorName = '';
			this.postSuccess = true;
			if (this.postSuccessTimer !== null) clearTimeout(this.postSuccessTimer);
			this.postSuccessTimer = setTimeout(() => {
				this.postSuccessTimer = null;
				this.postSuccess = false;
				// setTimeout callback fires outside Angular's zone; detectChanges() is
				// required to hide the success chip immediately after the delay.
				this.cdr.detectChanges();
			}, 2000);
		} catch {
			this.dialogService.showUnexpectedError(this.dialogComponentContainer);
		} finally {
			this.submitting = false;
			// async/await finally block may resume outside Angular's zone; detectChanges()
			// is required to re-enable the submit button immediately after the request settles.
			this.cdr.detectChanges();
		}
	}

	/**
	 * Opens a confirmation dialog to delete the given quote after checking
	 * that the current user has permission to do so.
	 *
	 * @param quote - The quote object to delete.
	 */
	protected openDeleteConfirmationDialog(quote: QuoteRecord): void {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_CONFIRM,
			async () => {
				try {
					await this.databaseService.removeQuote(
						quote.key ?? '',
						quote.text ?? '',
						quote.author ?? ''
					);
				} catch {
					this.dialogService.showUnexpectedError(this.dialogComponentContainer);
				}
			},
			[RESONANCE_MSG_DELETE_CONFIRM, RESONANCE_DIALOG_TITLE_DELETE, RESONANCE_DIALOG_BTN_DELETE]
		);
	}
}
