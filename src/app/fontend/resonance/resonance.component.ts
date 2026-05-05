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
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { Utilities } from '../../common/app.utilities';
import { COMPONENT_DESTROY } from '../../common/app.constant';
import { LOG } from '../../common/app.logs';

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
	private readonly classname = 'ResonanceComponent';
	readonly maxQuoteLength = 500;

	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	dialogComponentContainer!: ViewContainerRef;

	quotes$!: Observable<any[]>;
	newQuoteText = '';
	authorName = '';
	submitting = false;

	gradients = [
		{ from: '#fdf2f4', to: '#fce4ec' },
		{ from: '#e8f4f8', to: '#dceefb' },
		{ from: '#fef9e7', to: '#fdebd0' },
		{ from: '#f3e5f5', to: '#ede7f6' },
		{ from: '#e0f2f1', to: '#dcedc8' },
		{ from: '#fff3e0', to: '#ffe0b2' },
		{ from: '#e8eaf6', to: '#d1c4e9' },
		{ from: '#fce4ec', to: '#f8bbd0' }
	];

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		private databaseService: DatabaseService,
		private dialogService: DialogService,
		private utilities: Utilities,
		private cdr: ChangeDetectorRef
	) {}

	ngOnInit() {
		if (isPlatformBrowser(this.platformId)) {
			this.quotes$ = this.databaseService.getQuotes().pipe(catchError(() => of([])));
		} else {
			this.quotes$ = of([]);
		}
	}

	ngOnDestroy() {
		LOG.info(this.classname, COMPONENT_DESTROY);
	}

	getGradient(index: number) {
		return this.gradients[index % this.gradients.length];
	}

	getRelativeTime(timestamp: string): string {
		return Utilities.getRelativeTime(timestamp);
	}

	getAuthorName(quote: any): string {
		return quote.author || 'Anonymous';
	}

	getAuthorInitial(quote: any): string {
		const name = this.getAuthorName(quote);
		return name.charAt(0).toUpperCase();
	}

	canDelete(quote: any): boolean {
		if (CloudbaseService.userHasAllRights()) return true;
		return quote._openid === CloudbaseService.getUseId();
	}

	get isSignedIn(): boolean {
		return !!CloudbaseService.getUseId();
	}

	get isOverLimit(): boolean {
		return this.newQuoteText.length > this.maxQuoteLength;
	}

	async submitQuote() {
		const text = this.newQuoteText.trim();
		if (!text) return;

		this.submitting = true;
		try {
			const name = this.isSignedIn
				? CloudbaseService.getUserName() || 'Anonymous'
				: this.authorName.trim() || 'Anonymous';
			const timestamp = this.utilities.getCurrentFormattedTime(true);
			await this.databaseService.addQuote(text, name, timestamp);
			this.newQuoteText = '';
			this.authorName = '';
		} catch (error) {
			this.dialogService.openDialog(
				this.dialogComponentContainer,
				'error',
				'Unexpected error while submitting'
			);
		} finally {
			this.submitting = false;
			this.cdr.detectChanges();
		}
	}

	confirmDelete(quote: any) {
		if (!this.canDelete(quote)) {
			this.openPermissionError();
			return;
		}

		this.dialogService.openDialog(
			this.dialogComponentContainer,
			'confirm',
			async () => {
				try {
					await this.databaseService.removeQuote(quote.key);
				} catch {
					this.openUnexpectedError();
				}
			},
			['Are you sure you want to delete this quote?', 'Delete Quote', 'Delete', 'Quote deleted', true]
		);
	}

	private openPermissionError() {
		this.dialogService.openDialog(this.dialogComponentContainer, 'error', 'User does not have permission');
	}

	private openUnexpectedError() {
		this.dialogService.openDialog(this.dialogComponentContainer, 'error', 'Unexpected error occurred');
	}
}
