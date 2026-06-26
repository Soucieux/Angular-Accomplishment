import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import {
	MULTI_LINK_DIALOG_SUBTITLE,
	MULTI_LINK_DIALOG_TITLE,
	MULTI_LINK_LABEL_ADD_PREFIX,
	MULTI_LINK_LABEL_APPLIES_PREFIX,
	MULTI_LINK_LABEL_ARROW,
	MULTI_LINK_LABEL_CANCEL,
	MULTI_LINK_LABEL_CATEGORY,
	MULTI_LINK_LABEL_EMPTY,
	MULTI_LINK_LABEL_EMPTY_HINT,
	MULTI_LINK_LABEL_LINK,
	MULTI_LINK_LABEL_LINK_FOUND,
	MULTI_LINK_LABEL_LINKS,
	MULTI_LINK_LABEL_LINKS_FOUND,
	MULTI_LINK_LABEL_PASTE,
	MULTI_LINK_PLACEHOLDER_PASTE
} from '../../../common/locale/locale.en';
import { Utilities } from '../../../common/utilities/app.utilities';
import { NewLinkData } from '../../../fontend/portal/portal.model';
import { BulkLink, parseLinks, titleFromHost } from './multi-link.model';

@Component({
	selector: 'multi-link-dialog',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [DialogModule, FormsModule],
	templateUrl: './multi-link.component.html',
	styleUrl: './multi-link.component.scss'
})
export class MultiLinkDialogComponent {
	@Output() closed$ = new EventEmitter<void>();

	@ViewChild('rowsContainer') set rowsContainer(ref: ElementRef<HTMLElement> | undefined) {
		if (ref) Utilities.attachScrollAutoHide(ref.nativeElement);
	}

	protected readonly MULTI_LINK_DIALOG_TITLE = MULTI_LINK_DIALOG_TITLE;
	protected readonly MULTI_LINK_DIALOG_SUBTITLE = MULTI_LINK_DIALOG_SUBTITLE;
	protected readonly MULTI_LINK_LABEL_CATEGORY = MULTI_LINK_LABEL_CATEGORY;
	protected readonly MULTI_LINK_LABEL_APPLIES_PREFIX = MULTI_LINK_LABEL_APPLIES_PREFIX;
	protected readonly MULTI_LINK_LABEL_PASTE = MULTI_LINK_LABEL_PASTE;
	protected readonly MULTI_LINK_PLACEHOLDER_PASTE = MULTI_LINK_PLACEHOLDER_PASTE;
	protected readonly MULTI_LINK_LABEL_EMPTY = MULTI_LINK_LABEL_EMPTY;
	protected readonly MULTI_LINK_LABEL_EMPTY_HINT = MULTI_LINK_LABEL_EMPTY_HINT;
	protected readonly MULTI_LINK_LABEL_CANCEL = MULTI_LINK_LABEL_CANCEL;
	protected readonly MULTI_LINK_LABEL_ADD_PREFIX = MULTI_LINK_LABEL_ADD_PREFIX;
	protected readonly MULTI_LINK_LABEL_ARROW = MULTI_LINK_LABEL_ARROW;

	protected visible = false;
	protected rawText = '';
	protected links: BulkLink[] = [];
	protected selectedCategory = '';
	protected categoryOptions: string[] = [];
	private submitCallback?: (links: NewLinkData[]) => void;

	constructor(private readonly cdr: ChangeDetectorRef) {}

	/**
	 * Opens the dialog with a list of category names and a submit callback.
	 * Resets all internal state so previous session data is never visible.
	 *
	 * @param submitCallback - The callback invoked with the batch of links on confirm.
	 * @param categories - The category names to display as selectable pills.
	 */
	public openDialog(
		submitCallback: (links: NewLinkData[]) => void,
		categories: string[]
	): void {
		this.submitCallback = submitCallback;
		this.categoryOptions = categories;
		this.selectedCategory = categories[0] ?? '';
		this.rawText = '';
		this.links = [];
		this.visible = true;
	}

	/**
	 * Parses the raw text into links whenever the textarea content changes.
	 * Reconciles against previously parsed links to preserve favicon state
	 * and user-edited names.
	 *
	 * @param text - The current textarea content.
	 */
	protected onRawChange(text: string): void {
		this.rawText = text;
		this.links = parseLinks(text, this.links);
	}

	/**
	 * Updates a link's display name when the user edits the inline input.
	 *
	 * @param link - The link whose name is being edited.
	 * @param name - The new display name.
	 */
	protected updateName(link: BulkLink, name: string): void {
		this.links = this.links.map(item =>
			item.id === link.id ? { ...item, name, nameEdited: true } : item
		);
	}

	/**
	 * Removes a link from the preview list and updates the raw text
	 * to stay in sync.
	 *
	 * @param link - The link to remove.
	 */
	protected removeLink(link: BulkLink): void {
		this.links = this.links.filter(item => item.id !== link.id);
		this.rawText = this.links.map(item => item.url).join('\n');
	}

	/**
	 * Marks a link as ready when its favicon image loads successfully.
	 *
	 * @param link - The link whose favicon loaded.
	 */
	protected onIconLoad(link: BulkLink): void {
		this.setStatus(link, 'ready');
	}

	/**
	 * Marks a link as errored when its favicon image fails to load.
	 *
	 * @param link - The link whose favicon failed.
	 */
	protected onIconError(link: BulkLink): void {
		this.setStatus(link, 'error');
	}

	/**
	 * Validates the batch and invokes the submit callback with the
	 * collected link data, then closes the dialog.
	 */
	protected onSubmit(): void {
		if (this.count === 0) return;
		const category = this.selectedCategory;
		const result: NewLinkData[] = this.links.map(item => ({
			url: item.url,
			title: item.name || titleFromHost(item.host),
			category,
			isPinned: false
		}));
		this.onDialogClosed();
		this.submitCallback?.(result);
	}

	/**
	 * Closes the dialog and emits the closed event so DialogService can
	 * destroy the component and remove it from the open-dialogs map.
	 */
	protected onDialogClosed(): void {
		this.visible = false;
		this.closed$.emit();
	}

	/**
	 * Updates a single link's favicon status and triggers change detection.
	 *
	 * @param link - The link to update.
	 * @param status - The new status value.
	 */
	private setStatus(link: BulkLink, status: BulkLink['status']): void {
		this.links = this.links.map(item =>
			item.id === link.id && item.status === 'loading' ? { ...item, status } : item
		);
		this.cdr.markForCheck();
	}

	// ── Template helpers ─────────────────────────────────────────────────────

	/**
	 * Gets the number of parsed links currently in the preview list.
	 *
	 * @returns The link count.
	 */
	protected get count(): number {
		return this.links.length;
	}

	/**
	 * Gets whether all parsed links have finished loading their favicons.
	 *
	 * @returns True when at least one link exists and none are still loading.
	 */
	protected get allReady(): boolean {
		return this.links.length > 0 && this.links.every(item => item.status !== 'loading');
	}

	/**
	 * Gets the singular or plural "link"/"links" label based on count.
	 *
	 * @returns The appropriate label constant.
	 */
	protected get linkLabel(): string {
		return this.count === 1 ? MULTI_LINK_LABEL_LINK : MULTI_LINK_LABEL_LINKS;
	}

	/**
	 * Gets the singular or plural "link found"/"links found" label based on count.
	 *
	 * @returns The appropriate found-label constant.
	 */
	protected get linkFoundLabel(): string {
		return this.count === 1 ? MULTI_LINK_LABEL_LINK_FOUND : MULTI_LINK_LABEL_LINKS_FOUND;
	}
}
