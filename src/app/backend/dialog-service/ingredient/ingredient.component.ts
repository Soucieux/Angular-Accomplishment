import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { RECIPE_EDITOR_TYPE_MAX } from '../../../common/constants';
import {
	RECIPE_ITYPE_DIALOG_TITLE,
	DIALOG_BTN_CANCEL,
	INGREDIENT_BTN_APPLY,
	ingredientTypeLabel
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
	protected readonly DIALOG_BTN_CANCEL = DIALOG_BTN_CANCEL;
	protected readonly INGREDIENT_BTN_APPLY = INGREDIENT_BTN_APPLY;

	protected visible = false;
	protected masterTabs: TypeTab[] = [];
	protected editingTypes = new Set<IngredientType>();

	private applyCallback!: (newIds: Set<IngredientType>) => void;

	protected readonly typeLabel = ingredientTypeLabel;

	/**
	 * Opens the ingredient type manager dialog, initialising the editing selection
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
		this.editingTypes = new Set(data.enabledTypeIds);
		this.visible = true;
	}

	/**
	 * Returns true when the editing selection has not yet reached the maximum type count.
	 *
	 * @returns True if the editing selection size is below {@link RECIPE_EDITOR_TYPE_MAX}.
	 */
	protected canAddMore(): boolean {
		return this.editingTypes.size < this.RECIPE_EDITOR_TYPE_MAX;
	}

	/**
	 * Toggles an ingredient type in the editing selection.
	 * Deselecting is always allowed as long as at least one type remains.
	 * Selecting is blocked once the editing selection reaches {@link RECIPE_EDITOR_TYPE_MAX}.
	 *
	 * @param id - The ingredient type identifier to toggle.
	 */
	protected toggleType(id: IngredientType): void {
		if (this.editingTypes.has(id)) {
			if (this.editingTypes.size > 1) this.editingTypes.delete(id);
		} else if (this.canAddMore()) {
			this.editingTypes.add(id);
		}
	}

	/**
	 * Commits the editing selection by calling the apply callback, then closes the dialog.
	 */
	protected apply(): void {
		this.applyCallback(new Set(this.editingTypes));
		this.close();
	}

	/**
	 * Discards the editing selection and closes the dialog without applying changes.
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
