import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { RECIPE_EDITOR_TYPE_MAX } from '../../../common/constants';
import {
	RECIPE_ITYPE_DIALOG_TITLE,
	INGREDIENT_BTN_CANCEL,
	INGREDIENT_BTN_APPLY
} from '../../../common/locale/locale-strings';
import { IngredientType, TypeTab } from '../../../fontend/recipe/recipe.model';

@Component({
	selector: 'ingredient-dialog',
	standalone: true,
	imports: [CommonModule, DialogModule],
	templateUrl: './ingredient.component.html',
	styleUrl: './ingredient.component.css'
})
export class IngredientDialogComponent {
	@Output() public closed$ = new EventEmitter<void>();

	protected readonly RECIPE_ITYPE_DIALOG_TITLE = RECIPE_ITYPE_DIALOG_TITLE;
	protected readonly RECIPE_EDITOR_TYPE_MAX = RECIPE_EDITOR_TYPE_MAX;
	protected readonly INGREDIENT_BTN_CANCEL = INGREDIENT_BTN_CANCEL;
	protected readonly INGREDIENT_BTN_APPLY = INGREDIENT_BTN_APPLY;

	protected visible = false;
	protected masterTabs: TypeTab[] = [];
	protected draft = new Set<IngredientType>();

	private applyCallback!: (newIds: Set<IngredientType>) => void;

	/**
	 * Opens the ingredient type manager dialog, initialising the draft selection
	 * from the provided active type IDs and storing the callback for Apply.
	 *
	 * @param applyCallback - Called with the final Set when the user clicks Apply.
	 * @param data - Object containing the master tab list and currently enabled type IDs.
	 */
	public openDialog(
		applyCallback: (newIds: Set<IngredientType>) => void,
		data: { masterTabs: TypeTab[]; enabledTypeIds: Set<IngredientType> }
	): void {
		this.applyCallback = applyCallback;
		this.masterTabs = data.masterTabs;
		this.draft = new Set(data.enabledTypeIds);
		this.visible = true;
	}

	/**
	 * Returns true when the draft has not yet reached the maximum type count.
	 *
	 * @returns True if the draft size is below {@link RECIPE_EDITOR_TYPE_MAX}.
	 */
	protected canAddMore(): boolean {
		return this.draft.size < this.RECIPE_EDITOR_TYPE_MAX;
	}

	/**
	 * Toggles an ingredient type in the draft selection.
	 * Deselecting is always allowed as long as at least one type remains.
	 * Selecting is blocked once the draft reaches {@link RECIPE_EDITOR_TYPE_MAX}.
	 *
	 * @param id - The ingredient type identifier to toggle.
	 */
	protected toggleType(id: IngredientType): void {
		if (this.draft.has(id)) {
			if (this.draft.size > 1) this.draft.delete(id);
		} else if (this.canAddMore()) {
			this.draft.add(id);
		}
	}

	/**
	 * Commits the draft by calling the apply callback, then closes the dialog.
	 */
	protected apply(): void {
		this.applyCallback(new Set(this.draft));
		this.close();
	}

	/**
	 * Discards the draft and closes the dialog without applying changes.
	 */
	protected cancel(): void {
		this.close();
	}

	/**
	 * Handles the PrimeNG onHide event emitted when the dialog closes via its
	 * own X button, emitting {@link closed$} so DialogService can clean up.
	 */
	protected onDialogClosed(): void {
		this.closed$.emit();
		this.visible = false;
	}

	/**
	 * Hides the dialog and emits the closed event so DialogService cleans up.
	 */
	private close(): void {
		this.visible = false;
		this.closed$.emit();
	}
}
