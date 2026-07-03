import {
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	OnChanges,
	Output,
	SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CTX_SEARCH_PLACEHOLDER, CTX_LABEL_NO_RESULTS } from '../../common/locale/locale-strings';
import { ContextMenuAction } from './context-menu.model';

@Component({
	selector: 'desktop-context-menu',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './context-menu.component.html',
	styleUrl: './context-menu.component.scss'
})
export class DesktopContextMenuComponent implements OnChanges {
	@Output() public readonly close = new EventEmitter<void>();
	@Input() visible = false;
	@Input() x = 0;
	@Input() y = 0;
	@Input() actions: ContextMenuAction[] = [];

	protected readonly CTX_SEARCH_PLACEHOLDER = CTX_SEARCH_PLACEHOLDER;
	protected readonly CTX_LABEL_NO_RESULTS = CTX_LABEL_NO_RESULTS;
	protected searchQuery = '';

	constructor(private readonly hostRef: ElementRef<HTMLElement>) {}

	/**
	 * Resets the search query whenever the menu becomes hidden.
	 *
	 * @param changes - The SimpleChanges map from Angular's change detection cycle.
	 */
	ngOnChanges(changes: SimpleChanges): void {
		if (changes['visible'] && !this.visible) {
			this.searchQuery = '';
		}
	}

	/**
	 * Gets the list of actions filtered by the current search query.
	 *
	 * @returns The actions whose labels contain the search query (case-insensitive).
	 */
	protected get filteredActions(): ContextMenuAction[] {
		const query = this.searchQuery.toLowerCase();
		if (!query) return this.actions;
		return this.actions.filter((action) => action.label.toLowerCase().includes(query));
	}

	/**
	 * Executes the given action and closes the menu.
	 *
	 * @param action - The action to execute.
	 */
	protected selectAction(action: ContextMenuAction): void {
		action.execute();
		this.close.emit();
	}

	/**
	 * Closes the menu when the Escape key is pressed.
	 */
	@HostListener('document:keydown.escape')
	protected onEscape(): void {
		if (this.visible) this.close.emit();
	}

	/**
	 * Closes the menu when the user clicks outside the menu element.
	 *
	 * @param event - The MouseEvent from the document mousedown listener.
	 */
	@HostListener('document:mousedown', ['$event'])
	protected onOutsideClick(event: MouseEvent): void {
		if (this.visible && !this.hostRef.nativeElement.contains(event.target as Node)) {
			this.close.emit();
		}
	}
}
