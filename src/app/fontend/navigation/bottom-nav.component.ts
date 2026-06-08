import { A11yModule } from '@angular/cdk/a11y';
import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	HostListener,
	Input,
	Output,
	signal
} from '@angular/core';
import { NavItem } from './bottom-nav.model';

@Component({
	selector: 'bottom-nav',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [A11yModule],
	templateUrl: './bottom-nav.component.html',
	styleUrl: './bottom-nav.component.css'
})
export class BottomNavComponent {
	@Output() public readonly activeIdChange = new EventEmitter<string>();
	@Output() public readonly navigate = new EventEmitter<string>();

	@Input() public items: NavItem[] = [];
	@Input() public primaryIds: string[] = [];
	@Input() public activeId = '';

	/** Whether the "All sections" overlay is currently open. */
	protected readonly gridOpen = signal(false);

	/**
	 * Gets the dock items resolved in `primaryIds` order, falling back to the
	 * first four items when no `primaryIds` are provided.
	 *
	 * @returns The ordered list of `NavItem` entries shown in the floating dock.
	 */
	protected get primary(): NavItem[] {
		const ids = this.primaryIds.length ? this.primaryIds : this.items.slice(0, 4).map(item => item.id);
		return ids.map(id => this.items.find(navItem => navItem.id === id)).filter((navItem): navItem is NavItem => !!navItem);
	}

	/**
	 * Selects a destination, updates the two-way binding, and emits the
	 * navigate event.
	 *
	 * @param id - The id of the destination to activate.
	 */
	protected select(id: string): void {
		this.activeId = id;
		this.activeIdChange.emit(id);
		this.navigate.emit(id);
	}

	/**
	 * Picks a destination from the "All sections" overlay, selects it, and
	 * closes the overlay.
	 *
	 * @param id - The id of the destination chosen from the grid.
	 */
	protected pick(id: string): void {
		this.select(id);
		this.gridOpen.set(false);
	}

	/**
	 * Toggles the "All sections" overlay open or closed.
	 */
	protected toggleGrid(): void {
		this.gridOpen.update(open => !open);
	}

	/**
	 * Closes the "All sections" overlay when the Escape key is pressed while
	 * it is open.
	 */
	@HostListener('document:keydown.escape')
	protected onEscape(): void {
		if (this.gridOpen()) this.gridOpen.set(false);
	}
}
