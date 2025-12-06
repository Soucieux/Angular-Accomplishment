import { SearchStreamService } from './search-stream.service';
import { Component, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { Subscription } from 'rxjs';

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
	protected searchingCompleteOrInterrupted: boolean = false;
	private stopCallback?: () => void;
	searchLogs: string[] = [];
	searchLogsSub!: Subscription;

	constructor(private searchStreamService: SearchStreamService) {}

	protected openDialog(stopCallback: () => void) {
		this.visible = true;
		this.stopCallback = stopCallback;

		this.searchLogsSub = this.searchStreamService.searchLogs$.subscribe((searchLogs) => {
			this.searchLogs = searchLogs;

			const lastLog = searchLogs[searchLogs.length - 1];
			if (lastLog === 'Search complete' || lastLog === 'Search cancelled') {
				this.searchingCompleteOrInterrupted = true;
			}
		});
	}

	ngAfterViewChecked() {
		const element = this.logContainer?.nativeElement;
		if (element) {
			element.scrollTo({
				top: element.scrollHeight,
				behavior: 'smooth'
			});
		}
	}

	protected triggerStopSearching() {
		this.stopCallback?.();
	}

	protected onDialogClosed() {
		this.closed$.emit();
        this.visible = false;
        this.searchingCompleteOrInterrupted = false;
		this.searchLogsSub.unsubscribe();
		this.searchStreamService.clearSearchLogs();
	}
}
