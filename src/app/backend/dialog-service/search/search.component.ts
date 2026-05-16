import { SearchStreamService } from './search-stream.service';
import { ChangeDetectorRef, Component, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { Subscription } from 'rxjs';
import { SEARCH_CANCEL, SEARCH_COMPELTE } from '../../../common/app.constant';

@Component({
	selector: 'search-dialog',
	imports: [DialogModule, ButtonModule],
	templateUrl: './search.component.html',
	styleUrl: './search.component.css'
})
export class SearchDialogComponent {
	@Output() closed$ = new EventEmitter<void>();
	@ViewChild('logContainer') logContainer!: ElementRef<HTMLDivElement>;
	protected visible: boolean = false;
	protected searchCompleteOrInterrupted: boolean = false;
	private stopCallback?: () => void;
	protected searchLogs: string[] = [];
	private searchLogsSub!: Subscription;

	constructor(
		private searchStreamService: SearchStreamService,
		private cdr: ChangeDetectorRef
	) {}

	/**
	 * Open the search dialog and subscribe to the search log stream.
	 * Automatically scrolls the log container to the bottom on each new entry.
	 *
	 * @param stopCallback - The callback to call when the user interrupts the search.
	 */
	public openDialog(stopCallback: () => void) {
		this.visible = true;
		this.stopCallback = stopCallback;

		this.searchLogsSub = this.searchStreamService.searchLogs$.subscribe((searchLogs) => {
			this.searchLogs = searchLogs;

			const lastLog = searchLogs[searchLogs.length - 1];
			if (lastLog === SEARCH_COMPELTE || lastLog === SEARCH_CANCEL) {
				this.searchCompleteOrInterrupted = true;
			}

			this.cdr.markForCheck();

			setTimeout(() => {
				const element = this.logContainer?.nativeElement;
				if (element) {
					element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
				}
			});
		});
	}

	/**
	 * Trigger the stop callback to interrupt the ongoing search.
	 */
	protected triggerStopSearching() {
		this.stopCallback?.();
	}

	/**
	 * Handle the dialog closed event by emitting the closed event,
	 * unsubscribing from search logs, and clearing the log state.
	 */
	protected onDialogClosed() {
		this.closed$.emit();
		this.visible = false;
		this.searchCompleteOrInterrupted = false;
		this.searchLogsSub.unsubscribe();
		this.searchStreamService.clearSearchLogs();
	}
}
