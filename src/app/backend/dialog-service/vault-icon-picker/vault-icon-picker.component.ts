import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	Output,
	ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VAULT_ICON_PICKER_RESULT_CAP } from '../../../common/constants';
import {
	VAULT_DIALOG_ICON_SEARCH_PLACEHOLDER,
	VAULT_DIALOG_ICON_RESULT_CAP_HINT
} from '../../../common/locale/locale-strings';
import {
	VaultIconOption,
	VAULT_ICON_OPTIONS,
	VAULT_ICON_CATEGORIES
} from '../../../fontend/vault/vault-category-icons.data';
import { Utilities } from '../../../common/utilities/app.utilities';

@Component({
	selector: 'vault-icon-picker',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [FormsModule],
	templateUrl: './vault-icon-picker.component.html',
	styleUrl: './vault-icon-picker.component.scss'
})
export class VaultIconPickerComponent {
	@ViewChild('iconGrid') set iconGrid(ref: ElementRef<HTMLElement> | undefined) {
		if (ref) Utilities.attachScrollAutoHide(ref.nativeElement);
	}

	/** The currently selected icon's Material Symbols ligature name. */
	@Input() icon = '';

	/** Whether the trigger button renders at the smaller, pill-row size. */
	@Input() compact = false;

	/** Emits the newly selected icon whenever the user picks one from the popover. */
	@Output() iconChange = new EventEmitter<string>();

	protected readonly VAULT_DIALOG_ICON_SEARCH_PLACEHOLDER = VAULT_DIALOG_ICON_SEARCH_PLACEHOLDER;
	protected readonly VAULT_DIALOG_ICON_RESULT_CAP_HINT = VAULT_DIALOG_ICON_RESULT_CAP_HINT;
	protected readonly VAULT_ICON_PICKER_RESULT_CAP = VAULT_ICON_PICKER_RESULT_CAP;
	protected readonly VAULT_ICON_CATEGORIES = VAULT_ICON_CATEGORIES;

	protected showPicker = false;
	protected searchQuery = '';
	protected categoryFilter: string | null = null;
	// Cached rather than a template-bound getter — VAULT_ICON_OPTIONS is ~2500 entries, and the template
	// reads this twice per render, so recomputing it on every change-detection pass would filter it twice.
	protected filteredIconOptions: VaultIconOption[] = [];

	// ── User action handlers ─────────────────────────────────────────────────

	/**
	 * Opens or closes the icon-selection popover, clearing any prior search or category filter when it opens.
	 */
	protected togglePicker(): void {
		this.showPicker = !this.showPicker;
		if (this.showPicker) {
			this.searchQuery = '';
			this.categoryFilter = null;
			this.recomputeFilteredIconOptions();
		}
	}

	/**
	 * Selects an icon from the popover, emits it to the parent via the two-way binding, and closes the popover.
	 *
	 * @param iconName - The chosen icon's Material Symbols ligature name.
	 */
	protected selectIcon(iconName: string): void {
		this.icon = iconName;
		this.iconChange.emit(iconName);
		this.showPicker = false;
	}

	/**
	 * Toggles a category filter chip in the popover — clicking the already-active chip clears the filter.
	 *
	 * @param category - The icon category to filter by.
	 */
	protected toggleCategoryFilter(category: string): void {
		this.categoryFilter = this.categoryFilter === category ? null : category;
		this.recomputeFilteredIconOptions();
	}

	/**
	 * Updates the search query and recomputes the filtered icon list.
	 *
	 * @param value - The new search query text.
	 */
	protected onSearchQueryChange(value: string): void {
		this.searchQuery = value;
		this.recomputeFilteredIconOptions();
	}

	// ── Private helpers ───────────────────────────────────────────────────────

	/**
	 * Recomputes the cached icon options matching the current search text and category filter, capped
	 * so the popover's grid stays bounded when unfiltered.
	 */
	private recomputeFilteredIconOptions(): void {
		const query = this.searchQuery.trim().toLowerCase().replace(/ /g, '_');
		this.filteredIconOptions = VAULT_ICON_OPTIONS.filter((option) => {
			if (this.categoryFilter && option.category !== this.categoryFilter) return false;
			if (query && !option.name.includes(query)) return false;
			return true;
		}).slice(0, VAULT_ICON_PICKER_RESULT_CAP);
	}
}
