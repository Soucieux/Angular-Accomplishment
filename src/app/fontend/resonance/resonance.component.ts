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
	RESONANCE_LABEL_VOICES
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
	styleUrls: ['./resonance.component.css']
})
export class ResonanceComponent implements OnInit, OnDestroy {
	private readonly className = 'ResonanceComponent';
	protected readonly maxQuoteLength = 500;

	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	protected dialogComponentContainer!: ViewContainerRef;

	protected quotes$!: Observable<QuoteRecord[]>;
	protected newQuoteText = '';
	protected authorName = '';
	protected submitting = false;
	private signedInAnonymously = false;

	protected readonly gradients = RESONANCE_GRADIENTS;
	protected readonly postedLabel = RESONANCE_MSG_POSTED;
	protected readonly voicesLabel = RESONANCE_LABEL_VOICES;
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
	public ngOnInit() {
		if (isPlatformBrowser(this.platformId)) {
			if (!CloudbaseService.getUseId()) {
				// Wait for anonymous sign-in before starting the watcher —
				// the CloudBase WebSocket needs valid credentials to connect.
				void this.authService.signInAnonymously().then(() => {
					this.signedInAnonymously = true;
					// Signal that credentials are ready — resonance manages its own auth via anonymous sign-in
					CloudbaseService.markAuthReady();
					this.quotes$ = this.databaseService.getQuotes().pipe(catchError(() => of([])));
					this.cdr.detectChanges();
				});
			} else {
				this.quotes$ = this.databaseService.getQuotes().pipe(catchError(() => of([])));
			}
		} else {
			this.quotes$ = of([]);
		}
	}

	/**
	 * Signs out the anonymous session if one was started by this component,
	 * resets the flag, and logs the component destruction event.
	 */
	public ngOnDestroy() {
		if (this.postSuccessTimer !== null) clearTimeout(this.postSuccessTimer);
		if (this.signedInAnonymously) {
			void this.authService.signOut();
		}
		this.signedInAnonymously = false;
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	/**
	 * Get the gradient colors for a quote card based on its index.
	 *
	 * @param index - The index of the quote in the list.
	 * @returns An object with from and to gradient colors.
	 */
	protected getGradient(index: number) {
		return this.gradients[index % this.gradients.length];
	}

	/**
	 * Get a human-readable relative time string from a timestamp.
	 *
	 * @param timestamp - The timestamp string in "YYYY.MM.DD HH:mm:ss" format.
	 * @returns A relative time string (e.g. "just now", "5m ago", "2d ago").
	 */
	protected getRelativeTime(timestamp: string | undefined): string {
		return Utilities.getRelativeTime(timestamp ?? '');
	}

	/**
	 * Get the display name of a quote's author, falling back to 'Anonymous'.
	 *
	 * @param quote - The quote object.
	 * @returns The author name or 'Anonymous'.
	 */
	protected getAuthorName(quote: QuoteRecord): string {
		return quote.author || RESONANCE_AUTHOR_ANONYMOUS;
	}

	/**
	 * Get the uppercase first initial of a quote's author.
	 *
	 * @param quote - The quote object.
	 * @returns The uppercase first character of the author's name.
	 */
	protected getAuthorInitial(quote: QuoteRecord): string {
		const name = this.getAuthorName(quote);
		return name.charAt(0).toUpperCase();
	}

	/**
	 * Check whether the current user has permission to delete the given quote.
	 *
	 * @param quote - The quote object to check.
	 * @returns true if the user can delete the quote, otherwise false.
	 */
	protected canDelete(quote: QuoteRecord): boolean {
		return Utilities.checkPermission(quote._openid ?? '');
	}

	/**
	 * Check whether the current user is signed in.
	 *
	 * @returns true if a user ID is present, otherwise false.
	 */
	protected get isSignedIn(): boolean {
		return !!CloudbaseService.getUseId();
	}

	/**
	 * Check whether the new quote text exceeds the maximum character limit.
	 *
	 * @returns true if the text length exceeds maxQuoteLength, otherwise false.
	 */
	protected get isOverLimit(): boolean {
		return this.newQuoteText.length > this.maxQuoteLength;
	}

	/**
	 * Handle textarea Enter key: submit on bare Enter, allow newline on Shift+Enter.
	 * Uses instanceof narrowing so no cast is needed to access shiftKey.
	 *
	 * @param e - The event fired from the textarea keydown binding.
	 */
	protected onTextareaEnter(e: Event): void {
		if (e instanceof KeyboardEvent && !e.shiftKey) {
			e.preventDefault();
			void this.submitQuote();
		}
	}

	/**
	 * Submit a new quote to the database. Uses the signed-in user's name if available
	 * otherwise falls back to the manually entered author name or 'Anonymous'.
	 */
	protected async submitQuote() {
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
				this.cdr.detectChanges();
			}, 2000);
		} catch {
			this.dialogService.showUnexpectedError(this.dialogComponentContainer);
		} finally {
			this.submitting = false;
			this.cdr.detectChanges();
		}
	}

	/**
	 * Open a confirmation dialog to delete the given quote after checking
	 * that the current user has permission to do so.
	 *
	 * @param quote - The quote object to delete.
	 */
	protected openDeleteConfirmationDialog(quote: QuoteRecord) {
		if (!this.dialogService.ensurePermission(this.dialogComponentContainer, quote._openid ?? '')) return;

		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_CONFIRM,
			async () => {
				try {
					await this.databaseService.removeQuote(quote.key ?? '', quote.text ?? '', quote.author ?? '');
				} catch {
					this.dialogService.showUnexpectedError(this.dialogComponentContainer);
				}
			},
			[RESONANCE_MSG_DELETE_CONFIRM, RESONANCE_DIALOG_TITLE_DELETE, RESONANCE_DIALOG_BTN_DELETE]
		);
	}
}
