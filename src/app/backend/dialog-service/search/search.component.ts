import { SearchStreamService } from './search-stream.service';
import { Component, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { Subscription } from 'rxjs';
import {
	ENT_DIALOG_TITLE_SEARCH,
	ENT_BTN_STOP,
	ENT_BTN_DONE,
	SEARCH_CANCEL,
	SEARCH_COMPLETE
} from '../../../common/locale/locale-strings';

@Component({
	selector: 'search-dialog',
	imports: [DialogModule, ButtonModule],
	templateUrl: './search.component.html',
	styleUrl: './search.component.css'
})
export class SearchDialogComponent {
	@Output() closed$ = new EventEmitter<void>();
	@ViewChild('logContainer') logContainer!: ElementRef<HTMLDivElement>;
	protected readonly ENT_DIALOG_TITLE_SEARCH = ENT_DIALOG_TITLE_SEARCH;
	protected readonly ENT_BTN_STOP = ENT_BTN_STOP;
	protected readonly ENT_BTN_DONE = ENT_BTN_DONE;
	protected visible: boolean = false;
	protected searchCompleteOrInterrupted: boolean = false;
	private stopCallback?: () => void;
	protected searchLogs: string[] = [];
	private searchLogsSub!: Subscription;

	constructor(private searchStreamService: SearchStreamService) {}

	/**
	 * Opens the search dialog and subscribes to the search log stream.
	 * Automatically scrolls the log container to the bottom on each new entry.
	 *
	 * @param stopCallback - The callback to call when the user interrupts the search.
	 */
	public openDialog(stopCallback: () => void): void {
		// Step 1: Show the dialog and register the caller's interrupt hook
		this.visible = true;
		this.stopCallback = stopCallback;

		// Step 2: Stream live log lines from the search service into the template
		this.searchLogsSub = this.searchStreamService.searchLogs$.subscribe((searchLogs) => {
			this.searchLogs = searchLogs;

			// Step 2.1: Detect terminal sentinel so the Close button becomes available
			const lastLog = searchLogs[searchLogs.length - 1];
			if (lastLog === SEARCH_COMPLETE || lastLog === SEARCH_CANCEL) {
				this.searchCompleteOrInterrupted = true;
			}

			/* Step 2.2: Defer the scroll by one microtask so Angular has already
			   rendered the new log line into the DOM before we measure scrollHeight. */
			setTimeout(() => {
				const element = this.logContainer?.nativeElement;
				if (element) {
					element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
				}
			});
		});
	}

	/**
	 * Triggers the stop callback to interrupt the ongoing search.
	 */
	protected triggerStopSearching() {
		this.stopCallback?.();
	}

	/**
	 * Handles the dialog closed event by emitting the closed event,
	 * unsubscribing from search logs, and clearing the log state.
	 */
	protected onDialogClosed() {
		// Step 1: Notify the parent that the dialog has closed
		this.closed$.emit();
		this.visible = false;
		this.searchCompleteOrInterrupted = false;

		/* Step 2: Unsubscribe before clearing so the subscriber cannot fire one
		   last emission with an empty array and corrupt the log display. */
		this.searchLogsSub.unsubscribe();
		this.searchStreamService.clearSearchLogs();
	}
}
