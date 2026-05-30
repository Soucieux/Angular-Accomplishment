import {
	AfterViewChecked,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Inject,
	NgZone,
	OnDestroy,
	OnInit,
	PLATFORM_ID,
	ViewChild,
	ViewContainerRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser, ViewportScroller } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { DatabaseService } from '../../backend/database-service/database.service';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { LOG } from '../../common/app.logs';
import { Utilities } from '../../common/app.utilities';
import {
	COMPONENT_DESTROY,
	DIALOG_CONFIRM,
	DIALOG_RECIPE_TYPE,
	RECIPE_CATEGORY_ALL,
	RECIPE_DELETE_BTN,
	RECIPE_DELETE_MESSAGE,
	RECIPE_DELETE_TITLE,
	RECIPE_DISCARD_BTN,
	RECIPE_DISCARD_CHANGES_MESSAGE,
	RECIPE_DISCARD_CHANGES_TITLE,
	RECIPE_DISCARD_MESSAGE,
	RECIPE_DISCARD_TITLE,
	RECIPE_DROP_ABOVE,
	RECIPE_DROP_BELOW,
	RECIPE_EDITING_MODE_CREATE,
	RECIPE_EDITING_MODE_EDIT,
	RECIPE_ITYPE_VEG,
	RECIPE_MSG_ADDED,
	RECIPE_MAX_BADGES,
	RECIPE_MAX_NAME_CHARS,
	RECIPE_MSG_DELETE_FAILED,
	RECIPE_MSG_DELETE_FAILED_DETAIL,
	RECIPE_MSG_DELETED,
	RECIPE_MSG_INGREDIENT_UNIT_REQUIRED,
	RECIPE_MSG_LOAD_FAILED,
	RECIPE_MSG_CATEGORY_REQUIRED,
	RECIPE_MSG_NAME_TOO_LONG,
	RECIPE_MSG_SAVE_FAILED,
	RECIPE_MSG_SAVE_FAILED_DETAIL,
	RECIPE_MSG_UPDATED,
	RECIPE_UNIT_OPTIONS,
	RECIPE_VIEW_ADD,
	RECIPE_VIEW_DETAIL,
	RECIPE_VIEW_LIST,
	RECIPE_BAND_DEFAULT,
	TOAST_ERROR,
	TOAST_INFO,
	TOAST_SUCCESS,
	BREAKPOINT_MOBILE
} from '../../common/app.constant';
import {
	BadgeTag,
	DropPosition,
	EditorGroup,
	EditorIngredient,
	EditorStep,
	EditorSubpoint,
	EditingMode,
	Ingredient,
	IngredientGroup,
	IngredientType,
	MASTER_TYPE_TABS,
	RECIPE_CATEGORIES,
	RECIPE_EDITOR_CATEGORIES,
	RECIPE_EDITOR_DEFAULT_TYPES,
	Recipe,
	RecipeStep,
	StepToken,
	TypeTab
} from './recipe.model';
import { AccessDeniedComponent } from '../../common/access-denied/access-denied.component';

@Component({
	selector: 'recipe',
	standalone: true,
	imports: [CommonModule, FormsModule, AutoComplete, AccessDeniedComponent],
	templateUrl: './recipe.component.html',
	styleUrl: './recipe.component.css'
})
export class RecipeComponent implements OnInit, OnDestroy, AfterViewChecked {
	private readonly className = 'RecipeComponent';

	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;

	@ViewChild('stepsScroll') private stepsScrollEl?: ElementRef<HTMLElement>;
	@ViewChild('ingredientsScroll') private ingredientsScrollEl?: ElementRef<HTMLElement>;
	@ViewChild('catDropdown') private catDropdownEl?: ElementRef<HTMLElement>;

	protected readonly RECIPE_VIEW_LIST = RECIPE_VIEW_LIST;
	protected readonly RECIPE_VIEW_DETAIL = RECIPE_VIEW_DETAIL;
	protected readonly RECIPE_VIEW_ADD = RECIPE_VIEW_ADD;
	protected readonly RECIPE_CATEGORY_ALL = RECIPE_CATEGORY_ALL;
	protected readonly MASTER_TYPE_TABS = MASTER_TYPE_TABS;
	protected readonly RECIPE_CATEGORIES = RECIPE_CATEGORIES;
	protected readonly RECIPE_EDITOR_CATEGORIES = RECIPE_EDITOR_CATEGORIES;
	protected readonly RECIPE_MSG_INGREDIENT_UNIT_REQUIRED = RECIPE_MSG_INGREDIENT_UNIT_REQUIRED;
	protected readonly RECIPE_MSG_NAME_TOO_LONG = RECIPE_MSG_NAME_TOO_LONG;
	protected readonly RECIPE_MSG_CATEGORY_REQUIRED = RECIPE_MSG_CATEGORY_REQUIRED;

	private recipesSub?: Subscription;
	protected currentView: string = RECIPE_VIEW_LIST;
	protected searchQuery = '';
	protected selectedCategory: string = RECIPE_CATEGORY_ALL;

	protected selectedRecipe: Recipe | null = null;
	protected servings = 2;
	protected ingredientsCollapsed = false;

	protected enabledTypeIds = new Set<IngredientType>(RECIPE_EDITOR_DEFAULT_TYPES);

	protected editorName = '';
	protected editorCookTime: number | null = null;
	protected editorServings = 1;
	protected editorCategory = '';
	protected editorNotes = '';
	protected selectedEditorType: IngredientType = RECIPE_ITYPE_VEG;
	protected editorIngredients: EditorIngredient[] = [];
	protected editorSteps: EditorStep[] = [];
	protected editorNameInvalid = false;
	protected editorNameTooLong = false;
	protected editorCategoryInvalid = false;
	/** True only after a failed save attempt where a named ingredient has qty but no unit. */
	protected editorIngredientInvalid = false;
	/** Filtered unit suggestions shown by the unit autocomplete dropdown. */
	protected editorUnitSuggestions: string[] = [];
	/** True for one completeMethod cycle after focus, so focus always shows the full list. */
	private unitFocused = false;
	protected editorCategoryOpen = false;
	protected editingMode: EditingMode = RECIPE_EDITING_MODE_CREATE;
	private editingRecipeId: string | null = null;
	private pendingDetailName: string | null = null;
	private draggingStep: EditorStep | null = null;
	private dropTargetStep: EditorStep | null = null;
	private dropPosition: DropPosition | null = null;
	private pendingScrollToNewIngredient = false;
	/** JSON snapshot of the editor state at the moment a recipe was loaded for editing. */
	private initialEditorSnapshot: string | null = null;

	protected recipes: Recipe[] = [];
	protected isLoading = true;

	constructor(
		private cdr: ChangeDetectorRef,
		private ngZone: NgZone,
		private dialogService: DialogService,
		private databaseService: DatabaseService,
		private viewportScroller: ViewportScroller,
		private breakpointObserver: BreakpointObserver,
		@Inject(PLATFORM_ID) private platformId: object,
		protected utilities: Utilities
	) {}

	/**
	 * Initialises the component: subscribes to the recipes collection to keep the
	 * local list in sync, and auto-opens the add view when navigated from the home
	 * quick-action button via router state.
	 */
	ngOnInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.recipesSub = this.databaseService.getRecipes().subscribe({
				next: (recipes) => {
					this.ngZone.run(() => {
						this.recipes = recipes;
						this.isLoading = false;
						if (this.pendingDetailName) {
							const match = recipes.find((recipe) => recipe.name === this.pendingDetailName);
							if (match) {
								this.selectedRecipe = match;
								this.pendingDetailName = null;
							}
						}
						// NgZone.run wraps this callback — manual check needed so the view reflects the new state.
						this.cdr.markForCheck();
					});
				},
				error: (error) => LOG.error(this.className, RECIPE_MSG_LOAD_FAILED, error as Error)
			});

			// If navigated from the home quick-action button, auto-open the add view.
			// history.state retains the router state passed via Router.navigate({ state: ... }).
			// Immediately clear the state so a page refresh does not re-trigger the add view.
			if ((history.state as { openAddView?: boolean })?.openAddView) {
				history.replaceState({}, '');
				setTimeout(() => this.openAddView(), 0);
			}
		}
	}

	/**
	 * Unsubscribes from the recipes watcher, clears the dialog container,
	 * and logs component teardown.
	 */
	ngOnDestroy(): void {
		this.recipesSub?.unsubscribe();
		this.dialogComponentContainer?.clear();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	/**
	 * Attaches the auto-hide scroll listener to all scrollable panels after each
	 * change-detection cycle. Uses a WeakSet guard so each element is bound exactly
	 * once. Also handles scroll-and-focus for a newly added ingredient row when
	 * {@link pendingScrollToNewIngredient} is set.
	 */
	ngAfterViewChecked(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		Utilities.attachScrollAutoHide(this.stepsScrollEl?.nativeElement);
		Utilities.attachScrollAutoHide(this.ingredientsScrollEl?.nativeElement);
		document
			.querySelectorAll<HTMLElement>('.editor-body')
			.forEach((el) => Utilities.attachScrollAutoHide(el));
		document
			.querySelectorAll<HTMLElement>('.type-tabs')
			.forEach((el) => Utilities.attachScrollAutoHide(el));
		document
			.querySelectorAll<HTMLElement>('.chips-scroll')
			.forEach((el) => Utilities.attachScrollAutoHide(el));
		document
			.querySelectorAll<HTMLElement>('.container-recipe > .view')
			.forEach((el) => Utilities.attachScrollAutoHide(el));
		if (this.pendingScrollToNewIngredient) {
			this.pendingScrollToNewIngredient = false;
			const rows = document.querySelectorAll<HTMLElement>(`.ing-row.${this.selectedEditorType}`);
			const lastRow = rows[rows.length - 1];
			if (lastRow) {
				lastRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
				lastRow.querySelector<HTMLTextAreaElement>('textarea.name')?.focus();
			}
		}
	}

	/**
	 * Checks whether a string contains at least one Chinese character.
	 * Delegates to {@link Utilities#checkIfChinese}.
	 *
	 * @param text - The string to inspect.
	 * @returns True if the text contains a Chinese character, false otherwise.
	 */
	protected hasChinese(text: string | null | undefined): boolean {
		return Utilities.checkIfChinese(text);
	}

	/**
	 * Converts a string to title case (first letter of every word capitalised).
	 * Delegates to {@link Utilities#capitalizeFirstLetterOnEachWord}.
	 *
	 * @param text - The string to convert.
	 * @returns The title-cased string, or an empty string for falsy input.
	 */
	protected titleCase(text: string | null | undefined): string {
		return Utilities.capitalizeFirstLetterOnEachWord(text);
	}

	/**
	 * The subset of recipes that match the active category filter and the
	 * current search query. An empty query matches every recipe.
	 *
	 * @returns A filtered array of {@link Recipe} objects.
	 */
	protected get filteredRecipes(): Recipe[] {
		const query = this.searchQuery.trim().toLowerCase();
		return this.recipes.filter((recipe) => {
			const matchesCategory =
				this.selectedCategory === RECIPE_CATEGORY_ALL || recipe.category === this.selectedCategory;
			const matchesQuery = !query || recipe.name.toLowerCase().includes(query);
			return matchesCategory && matchesQuery;
		});
	}

	/**
	 * Sets the active category filter for the recipe list.
	 *
	 * @param cat - The category string to activate (use {@link RECIPE_CATEGORY_ALL} to show all).
	 */
	protected selectCategory(cat: string): void {
		this.selectedCategory = cat;
	}

	/**
	 * Navigates to the detail view for the given recipe and resets the
	 * servings counter to the recipe's base serving size.
	 *
	 * @param recipe - The recipe to display.
	 */
	protected openRecipe(recipe: Recipe): void {
		this.selectedRecipe = recipe;
		this.servings = recipe.baseServings;
		this.ingredientsCollapsed = false;
		this.transitionTo(RECIPE_VIEW_DETAIL);
	}

	/**
	 * Navigate back to the recipe list view from the detail or editor view.
	 */
	protected backToList(): void {
		this.transitionTo(RECIPE_VIEW_LIST);
	}

	/**
	 * Switches the visible view, scrolls the window back to the top, and
	 * triggers change detection so the template reflects the new state.
	 *
	 * @param view - The view identifier to activate (one of the VIEW_* constants).
	 */
	private transitionTo(view: string): void {
		this.ngZone.run(() => {
			this.currentView = view;
			this.viewportScroller.scrollToPosition([0, 0]);
			// Called inside ngZone.run() — detectChanges flushes the view synchronously so the
			// new view is rendered before the viewport scroll position is applied.
			this.cdr.detectChanges();
		});
	}

	/**
	 * Decrements the current servings count by one, down to a minimum of 1.
	 */
	protected decServings(): void {
		if (this.servings > 1) this.servings--;
	}

	/**
	 * Increments the current servings count by one, up to a maximum of 12.
	 */
	protected incServings(): void {
		if (this.servings < 12) this.servings++;
	}

	/**
	 * Scales a base ingredient quantity to the current servings count and returns
	 * only the numeric portion as a formatted string, without the unit.
	 * Delegates to {@link formatQty} with an empty unit string.
	 *
	 * @param base - The base quantity for one serving.
	 * @returns The scaled quantity string, or an empty string if not applicable.
	 */
	protected formatQtyNum(base: number): string {
		return this.formatQty(base, '');
	}

	/**
	 * Scales a base ingredient quantity to the current servings count and formats
	 * it as a human-readable string with the unit appended.
	 *
	 * @param base - The quantity for the recipe's base serving size.
	 * @param unit - The unit label (e.g. "g", "tbsp"). Pass an empty string for unitless quantities.
	 * @returns The scaled, formatted quantity string, or an empty string if no recipe is selected.
	 */
	protected formatQty(base: number, unit: string): string {
		if (!this.selectedRecipe) return '';
		if (!base) return '';
		const scaled = base * (this.servings / this.selectedRecipe.baseServings);
		const rounded =
			scaled === Math.round(scaled) ? String(scaled) : scaled.toFixed(1).replace(/\.0$/, '');
		return unit ? `${rounded} ${unit}` : rounded;
	}

	/**
	 * Returns true if the given unit string is purely numeric and therefore
	 * carries no semantic meaning for the user (e.g. "1" entered as a placeholder).
	 *
	 * @param unit - The unit label to test.
	 * @returns true if the unit is a numeric string and should be hidden.
	 */
	protected isNumericUnit(unit: string): boolean {
		return Utilities.isNumericString(unit);
	}

	/**
	 * Toggles the collapsed state of the ingredients panel on mobile only.
	 * On desktop viewports (> 800 px) the panel is always expanded and this
	 * method is a no-op.
	 */
	protected toggleIngredients(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		if (!this.breakpointObserver.isMatched(BREAKPOINT_MOBILE)) return;
		this.ingredientsCollapsed = !this.ingredientsCollapsed;
	}

	/**
	 * Toggles the done state of a recipe step when the user taps or clicks it.
	 * Clicks originating inside the substeps list are ignored so sub-point
	 * interaction does not accidentally mark the parent step as done.
	 *
	 * @param step  - The step whose done state should be toggled.
	 * @param event - The originating DOM event used to check the click target.
	 */
	protected toggleStepDone(step: RecipeStep, event: Event): void {
		const target = event.target as HTMLElement;
		if (target.closest('.substeps')) return;
		step.done = !step.done;
	}

	/**
	 * Returns the non-hidden ingredients from an ingredient group for display
	 * in the detail view.
	 *
	 * @param group - The ingredient group to filter.
	 * @returns An array of visible (non-hidden) {@link Ingredient} objects.
	 */
	protected getVisibleItems(group: IngredientGroup): Ingredient[] {
		return group.items.filter((item) => !item.hidden);
	}

	////////////////////// Below are editor type-tab dialog methods ///////////////////////

	/**
	 * The subset of ingredient type tabs that are currently enabled in the editor,
	 * ordered as they appear in {@link MASTER_TYPE_TABS}.
	 *
	 * @returns An array of {@link TypeTab} objects for the enabled type IDs.
	 */
	protected get editorTypeTabs(): TypeTab[] {
		return MASTER_TYPE_TABS.filter((tab) => this.enabledTypeIds.has(tab.id));
	}

	/**
	 * Opens the ingredient type manager dialog via DialogService, initialising
	 * the draft from the currently enabled type IDs.
	 * The apply callback updates the enabled type set and falls back the editor
	 * tab if the previously selected type is no longer enabled.
	 */
	protected openTypeDialog(): void {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_RECIPE_TYPE,
			(newIds: Set<IngredientType>) => {
				this.enabledTypeIds = newIds;
				if (!this.enabledTypeIds.has(this.selectedEditorType)) {
					this.selectedEditorType = [...this.enabledTypeIds][0] ?? RECIPE_ITYPE_VEG;
				}
				// Dialog callback runs outside Angular's zone — mark for check so the tab list updates.
				this.cdr.markForCheck();
			},
			{ masterTabs: MASTER_TYPE_TABS, enabledTypeIds: this.enabledTypeIds }
		);
	}

	////////////////////// Below are editor add and edit view methods ////////////////////

	/**
	 * Opens the editor in create mode, resetting all editor fields to their
	 * default blank state before navigating to the add-recipe view.
	 */
	protected openAddView(): void {
		this.editingMode = RECIPE_EDITING_MODE_CREATE;
		this.editingRecipeId = null;
		this.resetEditor();
		this.transitionTo(RECIPE_VIEW_ADD);
	}

	/**
	 * Opens the editor in edit mode for the currently active recipe, loading its
	 * existing data into the editor fields before navigating to the add-recipe view.
	 * No-ops if no recipe is currently selected or the user lacks permission.
	 */
	protected openEditView(): void {
		if (!this.selectedRecipe) return;
		if (!this.dialogService.ensurePermission(this.dialogComponentContainer, this.selectedRecipe.openid))
			return;
		this.editingMode = RECIPE_EDITING_MODE_EDIT;
		this.editingRecipeId = this.selectedRecipe.id;
		this.loadRecipeIntoEditor(this.selectedRecipe);
		this.transitionTo(RECIPE_VIEW_ADD);
	}

	/**
	 * Populates all editor fields from the given recipe, converting the stored
	 * ingredient groups and step token arrays into their flat editor representations.
	 * Ensures at least one blank ingredient row and one blank step row exist so the
	 * editor is never displayed empty.
	 *
	 * @param recipe - The recipe whose data should be loaded into the editor.
	 */
	private loadRecipeIntoEditor(recipe: Recipe): void {
		this.editorName = recipe.detailName;
		this.editorCookTime = recipe.cookTimeMin || null;
		this.editorServings = recipe.baseServings;
		this.editorCategory = recipe.category;
		this.editorNotes = recipe.notes;
		this.editorNameInvalid = false;
		this.editorNameTooLong = false;
		this.editorCategoryInvalid = false;
		this.editorIngredientInvalid = false;

		this.editorIngredients = recipe.groups.flatMap((group) =>
			group.items.map((item) => ({
				type: group.type,
				name: item.name,
				qty: item.baseQty ? String(item.baseQty) : '',
				unit: item.unit
			}))
		);

		// Sync type tabs to match exactly the types present in this recipe so the
		// user sees the right tabs without having to open the filter dialog manually.
		const recipeTypes = recipe.groups.map((group) => group.type);
		if (recipeTypes.length > 0) {
			this.enabledTypeIds = new Set(recipeTypes);
		}

		// Default editor type tab to the first group present, or veg if empty
		this.selectedEditorType = recipe.groups[0]?.type ?? RECIPE_ITYPE_VEG;
		if (this.editorIngredients.length === 0) {
			this.editorIngredients = [{ type: RECIPE_ITYPE_VEG, name: '', qty: '', unit: '' }];
		}

		this.editorSteps = recipe.steps.map((recipeStep) => ({
			text: recipeStep.text.map((token) => token.text).join(''),
			subs: recipeStep.substeps.map((text) => ({ text }))
		}));
		if (this.editorSteps.length === 0) {
			this.editorSteps = [{ text: '', subs: [] }];
		}

		this.initialEditorSnapshot = this.snapshotEditorState();
	}

	/**
	 * Handles the back/cancel button in the editor.
	 * In edit mode: always shows a confirm-discard dialog before returning to the detail view.
	 * In create mode: navigates directly to the list view if the form is empty, otherwise
	 * shows a confirm-discard dialog first.
	 */
	protected cancelAdd(): void {
		if (this.editingMode === RECIPE_EDITING_MODE_EDIT) {
			if (!this.isEditorDirty) {
				this.transitionTo(RECIPE_VIEW_DETAIL);
				return;
			}
			this.dialogService.openDialog(
				this.dialogComponentContainer,
				DIALOG_CONFIRM,
				() => this.transitionTo(RECIPE_VIEW_DETAIL),
				[RECIPE_DISCARD_CHANGES_MESSAGE, RECIPE_DISCARD_CHANGES_TITLE, RECIPE_DISCARD_BTN]
			);
			return;
		}
		const empty =
			!this.editorName.trim() &&
			!this.editorCategory &&
			this.editorIngredients.every((ingredient) => !ingredient.name.trim()) &&
			this.editorSteps.every(
				(editorStep) =>
					!editorStep.text.trim() && editorStep.subs.every((subpoint) => !subpoint.text.trim())
			) &&
			!this.editorNotes.trim();
		if (empty) {
			this.transitionTo(RECIPE_VIEW_LIST);
			return;
		}
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_CONFIRM,
			() => this.transitionTo(RECIPE_VIEW_LIST),
			[RECIPE_DISCARD_MESSAGE, RECIPE_DISCARD_TITLE, RECIPE_DISCARD_BTN]
		);
	}

	/**
	 * Prompts the user to confirm deletion of the recipe currently being edited,
	 * then removes it from the database and navigates back to the list view.
	 * Only callable when {@link editingMode} is 'edit' and {@link editingRecipeId} is set.
	 */
	protected removeCurrentRecipe(): void {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_CONFIRM,
			() => {
				if (!this.editingRecipeId) return;
				const id = this.editingRecipeId;
				this.databaseService
					.removeRecipe(id)
					.then(() => {
						LOG.info(this.className, `Recipe deleted: ${id}`);
						this.dialogService.showToast(TOAST_INFO, RECIPE_MSG_DELETED);
						this.transitionTo(RECIPE_VIEW_LIST);
					})
					.catch((error: unknown) => {
						LOG.error(this.className, RECIPE_MSG_DELETE_FAILED, error as Error);
						this.dialogService.showToast(
							TOAST_ERROR,
							RECIPE_MSG_DELETE_FAILED,
							RECIPE_MSG_DELETE_FAILED_DETAIL
						);
					});
			},
			[RECIPE_DELETE_MESSAGE, RECIPE_DELETE_TITLE, RECIPE_DELETE_BTN]
		);
	}

	/**
	 * Resets all editor fields to their default blank/initial state, including
	 * two empty ingredient rows and two empty step rows, ready for a new recipe.
	 */
	private resetEditor(): void {
		this.editorName = '';
		this.editorCookTime = null;
		this.editorServings = 1;
		this.editorCategory = '';
		this.editorNotes = '';
		this.selectedEditorType = RECIPE_ITYPE_VEG;
		this.editorIngredients = [
			{ type: RECIPE_ITYPE_VEG, name: '', qty: '', unit: '' },
			{ type: RECIPE_ITYPE_VEG, name: '', qty: '', unit: '' }
		];
		this.editorSteps = [
			{ text: '', subs: [] },
			{ text: '', subs: [] }
		];
		this.editorNameInvalid = false;
		this.editorNameTooLong = false;
		this.editorCategoryInvalid = false;
		this.editorIngredientInvalid = false;
		this.initialEditorSnapshot = null;
	}

	/**
	 * The number of editor ingredient rows that have a non-empty name, used to
	 * drive the ingredient count badge in the editor footer.
	 *
	 * @returns The count of named ingredients.
	 */
	protected get editorIngredientCount(): number {
		return this.editorIngredients.filter((ingredient) => ingredient.name.trim()).length;
	}

	/**
	 * The total number of step rows in the editor, used to drive the step count
	 * badge in the editor footer.
	 *
	 * @returns The number of editor step rows.
	 */
	protected get editorStepCount(): number {
		return this.editorSteps.length;
	}

	/**
	 * The editor ingredients grouped by type and ordered according to
	 * {@link MASTER_TYPE_TABS}. Groups with no ingredients are omitted.
	 *
	 * @returns An array of grouped ingredient objects for the editor summary view.
	 */
	protected get editorGroupedIngredients(): EditorGroup[] {
		return MASTER_TYPE_TABS.flatMap((tab) => {
			const items = this.editorIngredients.filter((ingredient) => ingredient.type === tab.id);
			return items.length === 0 ? [] : [{ type: tab.id, emoji: tab.emoji, label: tab.label, items }];
		});
	}

	/**
	 * Sets the selected ingredient type tab in the editor, controlling which type
	 * is assigned to newly added ingredient rows.
	 *
	 * @param type - The ingredient type to select.
	 */
	protected selectEditorType(type: IngredientType): void {
		this.selectedEditorType = type;
	}

	/**
	 * Appends a new blank ingredient row of the currently selected type to the
	 * editor ingredient list, then schedules a scroll-and-focus to the new row.
	 */
	protected addEditorIngredient(): void {
		this.editorIngredients.push({
			type: this.selectedEditorType,
			name: '',
			qty: '',
			unit: ''
		});
		this.pendingScrollToNewIngredient = true;
	}

	/**
	 * Removes an ingredient row from the editor list.
	 * Also clears the unit-invalid flag if the removal resolves all violations.
	 *
	 * @param ing - The ingredient row to remove.
	 */
	protected removeEditorIngredient(ing: EditorIngredient): void {
		this.editorIngredients = this.editorIngredients.filter((ingredient) => ingredient !== ing);
		if (this.editorIngredientInvalid && !this.hasIngredientUnitViolation) {
			this.editorIngredientInvalid = false;
		}
	}

	/**
	 * Appends a new blank step card to the editor step list.
	 */
	protected addEditorStep(): void {
		this.editorSteps.push({ text: '', subs: [] });
	}

	/**
	 * Removes a step card from the editor step list.
	 *
	 * @param step - The step to remove.
	 */
	protected removeEditorStep(step: EditorStep): void {
		this.editorSteps = this.editorSteps.filter((editorStep) => editorStep !== step);
	}

	/**
	 * Appends a new blank sub-point to the given editor step.
	 *
	 * @param step - The step card that should receive the new sub-point.
	 */
	protected addSubpoint(step: EditorStep): void {
		step.subs.push({ text: '' });
	}

	/**
	 * Removes a sub-point from a step.
	 *
	 * @param step     - The step card that owns the sub-point.
	 * @param subpoint - The sub-point to remove.
	 */
	protected removeSubpoint(step: EditorStep, subpoint: EditorSubpoint): void {
		step.subs = step.subs.filter((sub) => sub !== subpoint);
	}

	/**
	 * Closes the category dropdown when a click lands outside it.
	 * No-ops when the dropdown is already closed to avoid spurious change detection.
	 *
	 * @param event - The document-level click event.
	 */
	@HostListener('document:click', ['$event'])
	protected onDocumentClick(event: Event): void {
		if (!this.editorCategoryOpen) return;
		if (this.catDropdownEl?.nativeElement.contains(event.target as Node)) return;
		this.editorCategoryOpen = false;
		// HostListener fires outside the component's default CD cycle — mark for check to update dropdown state.
		this.cdr.markForCheck();
	}

	/**
	 * Toggles the category dropdown open/closed.
	 * Stops event propagation so the document click handler does not
	 * immediately close the panel we just opened.
	 *
	 * @param event - The click event from the trigger button.
	 */
	protected toggleCategoryDropdown(event: Event): void {
		event.stopPropagation();
		this.editorCategoryOpen = !this.editorCategoryOpen;
		// Needed for the same reason as onDocumentClick — HostListener runs outside normal CD.
		this.cdr.markForCheck();
	}

	/**
	 * Selects a category from the custom dropdown, closes the panel,
	 * and clears the invalid flag if one was showing.
	 *
	 * @param cat - The category string the user clicked.
	 */
	protected selectCategoryOption(cat: string): void {
		this.editorCategory = cat;
		this.editorCategoryOpen = false;
		this.editorCategoryInvalid = false;
		// Needed for the same reason as onDocumentClick — HostListener runs outside normal CD.
		this.cdr.markForCheck();
	}

	/**
	 * Clears the name-invalid flag as soon as the user types a non-empty value,
	 * removing the error highlight before the next save attempt.
	 */
	protected onEditorNameInput(): void {
		if (this.editorName.trim()) this.editorNameInvalid = false;
		if (
			this.editorNameTooLong &&
			Utilities.chineseCharWidth(this.editorName.trim()) <= RECIPE_MAX_NAME_CHARS
		) {
			this.editorNameTooLong = false;
		}
	}

	/**
	 * Serializes the current editor fields to a JSON string for change detection.
	 * Only data fields are captured — UI-only state such as active type tab and
	 * type-tab visibility are excluded.
	 *
	 * @returns A JSON string representing the current editor data state.
	 */
	private snapshotEditorState(): string {
		return JSON.stringify({
			name: this.editorName,
			cookTime: this.editorCookTime,
			servings: this.editorServings,
			category: this.editorCategory,
			notes: this.editorNotes,
			ingredients: this.editorIngredients.map((ingredient) => ({
				type: ingredient.type,
				name: ingredient.name,
				qty: ingredient.qty,
				unit: ingredient.unit
			})),
			steps: this.editorSteps.map((editorStep) => ({
				text: editorStep.text,
				subs: editorStep.subs.map((subpoint) => subpoint.text)
			}))
		});
	}

	/**
	 * Whether the editor fields differ from the state captured when the recipe
	 * was loaded. Always returns true in create mode (no snapshot exists).
	 *
	 * @returns True if any data field has changed since the recipe was loaded.
	 */
	private get isEditorDirty(): boolean {
		if (!this.initialEditorSnapshot) return true;
		return this.snapshotEditorState() !== this.initialEditorSnapshot;
	}

	/**
	 * True when at least one named ingredient has a quantity but no unit.
	 * Single source of truth used by saveRecipe, onEditorUnitInput, and removeEditorIngredient.
	 *
	 * @returns Whether any ingredient violates the qty-requires-unit rule.
	 */
	private get hasIngredientUnitViolation(): boolean {
		return this.editorIngredients.some(
			(ingredient) => ingredient.name.trim() && ingredient.qty && !ingredient.unit.trim()
		);
	}

	/**
	 * Clears the ingredient-unit-invalid flag once the user has resolved all
	 * qty-without-unit violations, so the error disappears as soon as the last
	 * missing unit is filled in.
	 */
	protected onEditorUnitInput(): void {
		if (this.editorIngredientInvalid && !this.hasIngredientUnitViolation) {
			this.editorIngredientInvalid = false;
		}
	}

	/**
	 * Sets the focus flag so the next completeMethod call returns the full list.
	 * PrimeNG fires onFocus before completeMethod, so the flag is always set
	 * before filterUnits consumes it.
	 */
	protected onUnitFocus(): void {
		this.unitFocused = true;
	}

	/**
	 * Populates the unit autocomplete suggestion list.
	 * When triggered by focus (flag set), always returns the full list so
	 * re-opening the dropdown after a selection shows all options.
	 * When triggered by typing, filters to prefix matches.
	 *
	 * @param event - The PrimeNG complete event carrying the current query string.
	 */
	protected filterUnits(event: AutoCompleteCompleteEvent): void {
		if (this.unitFocused) {
			this.unitFocused = false;
			this.editorUnitSuggestions = [...RECIPE_UNIT_OPTIONS];
			return;
		}
		const query = event.query.trim().toLowerCase();
		this.editorUnitSuggestions = query
			? RECIPE_UNIT_OPTIONS.filter((unit) => unit.toLowerCase().startsWith(query))
			: [...RECIPE_UNIT_OPTIONS];
	}

	/**
	 * Validates and persists the current editor state as a new or updated recipe.
	 * Marks required fields invalid and returns early if validation fails.
	 * Also blocks save if any ingredient has a quantity without a unit.
	 * On success, writes to the database and navigates back to the list view.
	 * The recipe watcher keeps the local list in sync automatically.
	 */
	protected async saveRecipe(): Promise<void> {
		if (this.editingMode === RECIPE_EDITING_MODE_EDIT && !this.isEditorDirty) {
			this.transitionTo(RECIPE_VIEW_DETAIL);
			return;
		}
		this.editorNameInvalid = !this.editorName.trim();
		this.editorNameTooLong =
			!!this.editorName.trim() &&
			Utilities.chineseCharWidth(this.editorName.trim()) > RECIPE_MAX_NAME_CHARS;
		this.editorCategoryInvalid = !this.editorCategory;
		this.editorIngredientInvalid = this.hasIngredientUnitViolation;
		if (
			this.editorNameInvalid ||
			this.editorNameTooLong ||
			this.editorCategoryInvalid ||
			this.editorIngredientInvalid
		)
			return;

		const validIngredients = this.editorIngredients.filter((ingredient) => ingredient.name.trim());

		const groups: IngredientGroup[] = MASTER_TYPE_TABS.flatMap((tab) => {
			const items: Ingredient[] = validIngredients
				.filter((ingredient) => ingredient.type === tab.id)
				.map((ingredient) => ({
					name: ingredient.name.trim(),
					baseQty: Number(ingredient.qty) || 0,
					unit: ingredient.unit.trim()
				}));
			return items.length === 0 ? [] : [{ type: tab.id, emoji: tab.emoji, label: tab.label, items }];
		});

		const steps: RecipeStep[] = this.editorSteps
			.filter(
				(editorStep) =>
					editorStep.text.trim() || editorStep.subs.some((subpoint) => subpoint.text.trim())
			)
			.map((editorStep) => ({
				text: this.autoPillStepText(editorStep.text.trim(), validIngredients),
				substeps: editorStep.subs.map((subpoint) => subpoint.text.trim()).filter(Boolean),
				done: false
			}));

		const presentTypes = new Set(validIngredients.map((ingredient) => ingredient.type));
		const badges: BadgeTag[] = MASTER_TYPE_TABS.filter((tab) => presentTypes.has(tab.id))
			.slice(0, RECIPE_MAX_BADGES)
			.map((tab) => ({ type: tab.id, emoji: tab.emoji, label: tab.label }));

		const isEdit = this.editingMode === RECIPE_EDITING_MODE_EDIT && !!this.editingRecipeId;
		const recipe: Recipe = {
			id: isEdit ? this.editingRecipeId! : '',
			openid: isEdit ? (this.selectedRecipe?.openid ?? '') : (CloudbaseService.getUseId() ?? ''),
			name: this.editorName.trim(),
			detailName: this.editorName.trim(),
			category: this.editorCategory,
			bandClass: Utilities.recipeBandClass(this.editorCategory),
			cookTimeMin: this.editorCookTime ?? 0,
			baseServings: this.editorServings || 1,
			badges,
			groups,
			steps,
			notes: this.editorNotes.trim()
		};

		try {
			if (isEdit) {
				await this.databaseService.updateRecipe(recipe);
				LOG.info(this.className, `Recipe updated: ${recipe.id} "${recipe.name}"`);
				this.dialogService.showToast(TOAST_SUCCESS, RECIPE_MSG_UPDATED);
				this.selectedRecipe = recipe;
			} else {
				await this.databaseService.addRecipe(recipe);
				LOG.info(this.className, `Recipe created: "${recipe.name}"`);
				this.dialogService.showToast(TOAST_SUCCESS, RECIPE_MSG_ADDED);
				this.pendingDetailName = recipe.name;
				this.selectedRecipe = recipe;
			}
			this.servings = recipe.baseServings || 1;
			this.ingredientsCollapsed = false;
			this.transitionTo(RECIPE_VIEW_DETAIL);
		} catch (error) {
			LOG.error(this.className, RECIPE_MSG_SAVE_FAILED, error as Error);
			this.dialogService.showToast(TOAST_ERROR, RECIPE_MSG_SAVE_FAILED, RECIPE_MSG_SAVE_FAILED_DETAIL);
		}
	}

	/**
	 * Scans plain step text for ingredient-name mentions and wraps matches as
	 * pill tokens so the read view keeps its colored highlights after editing.
	 * Best-effort substring match — sorts names longest-first so multi-word
	 * names like "soy sauce" win over their constituent words.
	 * For bilingual names (two lines), only the first line is used for matching
	 * so steps can reference whichever language the name starts with.
	 *
	 * @param text - The raw step text to scan.
	 * @param ingredients - The current list of editor ingredients used for name matching.
	 * @returns An array of StepToken objects representing text and pill segments.
	 */
	private autoPillStepText(text: string, ingredients: EditorIngredient[]): StepToken[] {
		if (!text) return [{ kind: 'text', text: '' }];

		const nameMap = new Map<string, IngredientType>();
		ingredients.forEach((ingredient) => {
			const name = ingredient.name.split('\n')[0].trim().toLowerCase();
			if (name) nameMap.set(name, ingredient.type);
		});
		if (nameMap.size === 0) return [{ kind: 'text', text }];

		const sortedNames = [...nameMap.keys()].sort((a, b) => b.length - a.length);
		const escaped = sortedNames.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
		const regex = new RegExp(`(${escaped.join('|')})`, 'gi');

		const tokens: StepToken[] = [];
		let lastIndex = 0;
		let match: RegExpExecArray | null;
		while ((match = regex.exec(text)) !== null) {
			if (match.index > lastIndex) {
				tokens.push({ kind: 'text', text: text.slice(lastIndex, match.index) });
			}
			const matched = match[1];
			const type = nameMap.get(matched.toLowerCase());
			const labeled = Utilities.capitalizeFirstLetterOnEachWord(matched);
			tokens.push({ kind: 'pill', text: labeled, pillType: type });
			lastIndex = match.index + matched.length;
		}
		if (lastIndex < text.length) {
			tokens.push({ kind: 'text', text: text.slice(lastIndex) });
		}
		return tokens.length > 0 ? tokens : [{ kind: 'text', text }];
	}

	////////////////////// Below are drag-to-reorder step methods ////////////////////////

	/**
	 * Handles the dragstart event on the step drag handle. Sets the full card as
	 * the drag image so the preview matches the card rather than just the icon.
	 *
	 * @param step  - The step being dragged.
	 * @param event - The native drag event.
	 */
	protected onStepDragStart(step: EditorStep, event: DragEvent): void {
		this.draggingStep = step;
		event.dataTransfer?.setData('text/plain', String(this.editorSteps.indexOf(step)));
		if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
		const card = (event.target as HTMLElement).closest('.step-card') as HTMLElement;
		if (card && event.dataTransfer) {
			const rect = card.getBoundingClientRect();
			event.dataTransfer.setDragImage(card, event.clientX - rect.left, event.clientY - rect.top);
		}
	}

	/**
	 * Handles the dragend event, clearing all drag-and-drop tracking state
	 * so no step card remains styled as a drag source or drop target.
	 */
	protected onStepDragEnd(): void {
		this.draggingStep = null;
		this.dropTargetStep = null;
		this.dropPosition = null;
	}

	/**
	 * Handles the dragover event on a step card. Determines whether the dragged
	 * item should be dropped above or below the target based on the cursor's
	 * vertical position relative to the card's midpoint.
	 *
	 * @param step  - The step card currently under the drag cursor.
	 * @param event - The native dragover event; default is prevented to allow dropping.
	 */
	protected onStepDragOver(step: EditorStep, event: DragEvent): void {
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const before = event.clientY - rect.top < rect.height / 2;
		this.dropTargetStep = step;
		this.dropPosition = before ? RECIPE_DROP_ABOVE : RECIPE_DROP_BELOW;
	}

	/**
	 * Handles the dragleave event on a step card, clearing the drop-target
	 * highlight only when the cursor leaves the card that is currently marked
	 * as the drop target.
	 *
	 * @param step - The step card the cursor has left.
	 */
	protected onStepDragLeave(step: EditorStep): void {
		if (this.dropTargetStep === step) {
			this.dropTargetStep = null;
			this.dropPosition = null;
		}
	}

	/**
	 * Handles the drop event on a step card. Splices the dragged step out of its
	 * current position and inserts it before or after the target step depending
	 * on where the cursor landed. Calls {@link onStepDragEnd} to clean up state
	 * regardless of whether the reorder succeeded.
	 *
	 * @param target - The step card onto which the dragged step was dropped.
	 * @param event  - The native drop event; default is prevented.
	 */
	protected onStepDrop(target: EditorStep, event: DragEvent): void {
		event.preventDefault();
		const dragged = this.draggingStep;
		if (!dragged || dragged === target) {
			this.onStepDragEnd();
			return;
		}
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const before = event.clientY - rect.top < rect.height / 2;
		const fromIndex = this.editorSteps.indexOf(dragged);
		if (fromIndex < 0) {
			this.onStepDragEnd();
			return;
		}
		const moved = this.editorSteps.splice(fromIndex, 1)[0];
		let toIndex = this.editorSteps.indexOf(target);
		if (!before) toIndex += 1;
		this.editorSteps.splice(toIndex, 0, moved);
		this.onStepDragEnd();
	}

	/**
	 * Whether the given step is currently being dragged.
	 *
	 * @param step - The step to check.
	 * @returns True if this step is the active drag source.
	 */
	protected isStepDragging(step: EditorStep): boolean {
		return this.draggingStep === step;
	}

	/**
	 * Whether the given step is the current drop target at the specified position.
	 * Used to apply the drop-indicator CSS class to the correct card edge.
	 *
	 * @param step     - The step to check.
	 * @param position - The edge to check (`'above'` or `'below'`).
	 * @returns True if this step is the active drop target at the given position.
	 */
	protected isStepDropTarget(step: EditorStep, position: DropPosition): boolean {
		return this.dropTargetStep === step && this.dropPosition === position;
	}

	/**
	 * Returns the band CSS class for the editor section.
	 * Falls back to the app-rose default when no category has been chosen yet (add screen).
	 * @returns band class string e.g. 'band-western', 'band-default'
	 */
	protected getEditorBandClass(): string {
		return Utilities.recipeBandClass(this.editorCategory) || RECIPE_BAND_DEFAULT;
	}
}
