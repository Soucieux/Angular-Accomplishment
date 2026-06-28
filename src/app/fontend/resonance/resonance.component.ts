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
import { Utilities } from '../../common/utilities/app.utilities';
import {
	COMPONENT_DESTROY,
	DIALOG_CONFIRM,
	RESONANCE_AUTHOR_ANONYMOUS_LEGACY,
	RESONANCE_MAX_QUOTE_LENGTH,
	RESONANCE_SKELETON_COUNT
} from '../../common/constants';
import {
	DIALOG_BTN_DELETE,
	RESONANCE_AUTHOR_ANONYMOUS,
	RESONANCE_MSG_DELETE_CONFIRM,
	RESONANCE_DIALOG_TITLE_DELETE,
	RESONANCE_MSG_POSTED,
	RESONANCE_LABEL_VOICES,
	RESONANCE_SUBTITLE,
	NAV_LABEL_RESONANCE,
	RESONANCE_PLACEHOLDER_QUOTE,
	RESONANCE_PLACEHOLDER_NAME,
	RESONANCE_BTN_POST,
	RESONANCE_EMPTY_TEXT,
	RESONANCE_ARIA_DELETE
} from '../../common/locale/locale-strings';
import { LOG } from '../../common/app.logs';
import { RESONANCE_GRADIENTS, QuoteRecord } from './resonance.model';

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
	protected readonly NAV_LABEL_RESONANCE = NAV_LABEL_RESONANCE;
	protected readonly RESONANCE_SUBTITLE = RESONANCE_SUBTITLE;
	protected readonly RESONANCE_PLACEHOLDER_QUOTE = RESONANCE_PLACEHOLDER_QUOTE;
	protected readonly RESONANCE_PLACEHOLDER_NAME = RESONANCE_PLACEHOLDER_NAME;
	protected readonly RESONANCE_BTN_POST = RESONANCE_BTN_POST;
	protected readonly RESONANCE_EMPTY_TEXT = RESONANCE_EMPTY_TEXT;
	protected readonly RESONANCE_ARIA_DELETE = RESONANCE_ARIA_DELETE;

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
		private cdr: ChangeDetectorRef,
		protected utilities: Utilities
	) {}

	/**
	 * Sets up the anonymous authentication session and subscribes to the quotes observable.
	 */
	ngOnInit(): void {

		// Step 1: Only run live data logic in a browser — SSR has no CloudBase WebSocket
		if (isPlatformBrowser(this.platformId)) {

			// Step 2: If no session exists, start an anonymous one before subscribing
			if (!CloudbaseService.getUserId()) {
				/* Wait for anonymous sign-in before starting the watcher —
				   the CloudBase WebSocket needs valid credentials to connect. */
				this.authService
					.signInAnonymously()
					.then(() => {
						this.signedInAnonymously = true;

						// Step 2.1: Signal that credentials are ready — resonance manages its own auth via anonymous sign-in
						CloudbaseService.markAuthReady();
						this.quotes$ = this.databaseService.getQuotes().pipe(catchError(() => of([])));

						/* Promise callback fires outside Angular's zone; detectChanges() is
						   required to bind the newly assigned quotes$ Observable in the template. */
						this.cdr.detectChanges();
					})
					.catch(() => {});
			} else {

				// Step 2.2: Session already active — subscribe directly without re-authenticating
				this.quotes$ = this.databaseService.getQuotes().pipe(catchError(() => of([])));
			}
		} else {

			// Step 3: SSR path — emit an empty array so the template has a valid Observable immediately
			this.quotes$ = of([]);
		}
	}

	/**
	 * Signs out the anonymous session if one was started by this component,
	 * clears the dialog container, resets the flag, and logs the component destruction event.
	 */
	ngOnDestroy(): void {

		// Step 1: Cancel any pending success-chip timer so it cannot fire after the component is gone
		if (this.postSuccessTimer !== null) clearTimeout(this.postSuccessTimer);

		/* Step 2: Sign out only if this component opened the anonymous session —
		   avoids signing out a legitimate named-user session on other pages. */
		if (this.signedInAnonymously) {
			this.authService.signOut().catch(() => {});
		}
		this.signedInAnonymously = false;

		// Step 3: Release the dialog view container and log the teardown event
		this.dialogComponentContainer?.clear();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	/**
	 * Gets the gradient colors for a quote card based on its index.
	 *
	 * @param index - The index of the quote in the list.
	 * @returns An object with from and to gradient color strings.
	 */
	protected getGradient(index: number): { from: string; to: string } {
		return this.RESONANCE_GRADIENTS[index % this.RESONANCE_GRADIENTS.length];
	}

	/**
	 * Gets the display name of a quote's author, falling back to the locale-appropriate anonymous label.
	 * Treats the legacy stored English value as equivalent to an empty author.
	 *
	 * @param quote - The quote object.
	 * @returns The author name or the locale-appropriate anonymous label.
	 */
	protected getAuthorName(quote: QuoteRecord): string {
		return !quote.author || quote.author === RESONANCE_AUTHOR_ANONYMOUS_LEGACY
			? RESONANCE_AUTHOR_ANONYMOUS
			: quote.author;
	}

	/**
	 * Gets the uppercase first initial of a quote's author.
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
		return !!CloudbaseService.getUserId();
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
	 * Returns the array of indices used to render skeleton loading cards,
	 * sized to match the fixed skeleton count for this page.
	 *
	 * @returns Array of 0-based indices with length equal to RESONANCE_SKELETON_COUNT.
	 */
	protected get skeletonItems(): number[] {
		return Array.from({ length: RESONANCE_SKELETON_COUNT }, (_, i) => i);
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

		// Step 1: Guard — reject blank input before touching any state
		const text = this.newQuoteText.trim();
		if (!text) return;

		this.submitting = true;
		try {

			/* Step 2: Resolve the author name.
			   Signed-in user → CloudBase username; anonymous → manually entered name; fallback → empty string
			   so the display layer renders the locale-appropriate anonymous label at read time. */
			const name = this.isSignedIn
				? CloudbaseService.getUserName() || ''
				: this.authorName.trim();
			const timestamp = Utilities.getCurrentFormattedTime(true);

			// Step 3: Persist the quote, then reset the form fields
			await this.databaseService.addQuote(text, name, timestamp);
			this.newQuoteText = '';
			this.authorName = '';

			/* Step 4: Show the success chip and schedule its dismissal.
			   The existing timer is cancelled first to prevent double-fire if the user submits again quickly. */
			this.postSuccess = true;
			if (this.postSuccessTimer !== null) clearTimeout(this.postSuccessTimer);
			this.postSuccessTimer = setTimeout(() => {
				this.postSuccessTimer = null;
				this.postSuccess = false;
				/* setTimeout callback fires outside Angular's zone; detectChanges() is
				   required to hide the success chip immediately after the delay. */
				this.cdr.detectChanges();
			}, 2000);
		} catch (error) {
			this.dialogService.handleError(this.dialogComponentContainer, error);
		} finally {
			this.submitting = false;
			/* async/await finally block may resume outside Angular's zone; detectChanges()
			   is required to re-enable the submit button immediately after the request settles. */
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
					await this.databaseService.removeQuote(quote.key ?? '', quote.author ?? '');
				} catch {
					this.dialogService.showUnexpectedError(this.dialogComponentContainer);
				}
			},
			[RESONANCE_MSG_DELETE_CONFIRM, RESONANCE_DIALOG_TITLE_DELETE, DIALOG_BTN_DELETE]
		);
	}
}
