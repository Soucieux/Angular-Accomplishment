import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { RECIPE_EDITOR_TYPE_MAX, RECIPE_ITYPE_DIALOG_TITLE } from '../../../common/app.constant';
import { IngredientType, TypeTab } from '../../../fontend/recipe/recipe.model';

@Component({
	selector: 'recipe-type-dialog',
	standalone: true,
	imports: [CommonModule, DialogModule],
	templateUrl: './recipe-type.component.html',
	styleUrl: './recipe-type.component.css'
})
export class RecipeTypeDialogComponent implements OnDestroy {
	@Output() closed$ = new EventEmitter<void>();

	protected readonly ITYPE_DIALOG_TITLE = RECIPE_ITYPE_DIALOG_TITLE;
	protected readonly EDITOR_TYPE_MAX = RECIPE_EDITOR_TYPE_MAX;

	protected visible = false;
	protected masterTabs: TypeTab[] = [];
	protected draft = new Set<IngredientType>();

	private applyCallback!: (newIds: Set<IngredientType>) => void;

	/**
	 * Open the ingredient type manager dialog, initialising the draft selection
	 * from the provided active type IDs and storing the callback for Apply.
	 *
	 * @param applyCallback - Called with the final Set when the user clicks Apply.
	 * @param data - Object containing the master tab list and currently active type IDs.
	 */
	public openDialog(
		applyCallback: (newIds: Set<IngredientType>) => void,
		data: { masterTabs: TypeTab[]; activeTypeIds: Set<IngredientType> }
	): void {
		this.applyCallback = applyCallback;
		this.masterTabs = data.masterTabs;
		this.draft = new Set(data.activeTypeIds);
		this.visible = true;
	}

	/**
	 * Whether the user can select an additional type in the draft.
	 *
	 * @returns True if the draft size is below {@link RECIPE_EDITOR_TYPE_MAX}.
	 */
	protected canAddMore(): boolean {
		return this.draft.size < this.EDITOR_TYPE_MAX;
	}

	/**
	 * Toggle an ingredient type in the draft selection.
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
	 * Commit the draft by calling the apply callback, then close the dialog.
	 */
	protected apply(): void {
		this.applyCallback(new Set(this.draft));
		this.close();
	}

	/**
	 * Discard the draft and close the dialog without applying changes.
	 */
	protected cancel(): void {
		this.close();
	}

	/**
	 * Handle the PrimeNG onHide event emitted when the dialog closes via its
	 * own X button, emitting {@link closed$} so DialogService can clean up.
	 */
	protected onDialogClosed(): void {
		this.closed$.emit();
		this.visible = false;
	}

	/**
	 * Clean up when the component is destroyed.
	 */
	public ngOnDestroy(): void {}

	/**
	 * Hide the dialog and emit the closed event so DialogService cleans up.
	 */
	private close(): void {
		this.visible = false;
		this.closed$.emit();
	}
}
