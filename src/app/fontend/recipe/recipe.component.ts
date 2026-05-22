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
	RECIPE_CATEGORY_CHINESE,
	RECIPE_CATEGORY_DESSERT,
	RECIPE_CATEGORY_QUICK,
	RECIPE_CATEGORY_WESTERN,
	RECIPE_BAND_CHINESE,
	RECIPE_BAND_DESSERT,
	RECIPE_BAND_QUICK,
	RECIPE_BAND_SPICY,
	RECIPE_BAND_WESTERN,
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
	RECIPE_MSG_DELETE_FAILED,
	RECIPE_MSG_DELETE_FAILED_DETAIL,
	RECIPE_MSG_DELETED,
	RECIPE_MSG_INGREDIENT_UNIT_REQUIRED,
	RECIPE_MSG_LOAD_FAILED,
	RECIPE_MSG_SAVE_FAILED,
	RECIPE_MSG_SAVE_FAILED_DETAIL,
	RECIPE_MSG_UPDATED,
	RECIPE_UNIT_OPTIONS,
	RECIPE_VIEW_ADD,
	RECIPE_VIEW_DETAIL,
	RECIPE_VIEW_LIST,
	TOAST_ERROR,
	TOAST_INFO,
	TOAST_SUCCESS,
	BREAKPOINT_MOBILE
} from '../../common/app.constant';
import {
	BadgeTag,
	EditorGroup,
	EditorIngredient,
	EditorStep,
	EditorSubpoint,
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

@Component({
	selector: 'recipe',
	standalone: true,
	imports: [CommonModule, FormsModule, AutoComplete],
	templateUrl: './recipe.component.html',
	styleUrl: './recipe.component.css',
})
export class RecipeComponent implements OnInit, OnDestroy, AfterViewChecked {
	private readonly className = 'RecipeComponent';

	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	protected dialogContainer!: ViewContainerRef;

	@ViewChild('stepsScroll') private stepsScrollEl?: ElementRef<HTMLElement>;
	@ViewChild('ingredientsScroll') private ingredientsScrollEl?: ElementRef<HTMLElement>;
	@ViewChild('catDropdown') private catDropdownEl?: ElementRef<HTMLElement>;

	private recipesSub?: Subscription;

	protected readonly VIEW_LIST = RECIPE_VIEW_LIST;
	protected readonly VIEW_DETAIL = RECIPE_VIEW_DETAIL;
	protected readonly VIEW_ADD = RECIPE_VIEW_ADD;
	protected readonly CAT_ALL = RECIPE_CATEGORY_ALL;
	protected readonly MASTER_TYPE_TABS = MASTER_TYPE_TABS;
	protected readonly categories = RECIPE_CATEGORIES;
	protected readonly editorCategories = RECIPE_EDITOR_CATEGORIES;

	protected currentView: string = RECIPE_VIEW_LIST;
	protected searchQuery = '';
	protected activeCategory: string = RECIPE_CATEGORY_ALL;

	protected activeRecipe: Recipe | null = null;
	protected servings = 2;
	protected ingredientsCollapsed = false;

	// ── Editor type-tab management ──────────────────────────────────
	protected activeTypeIds = new Set<IngredientType>(RECIPE_EDITOR_DEFAULT_TYPES);

	// ── Editor state ────────────────────────────────────────────────
	protected editorName = '';
	protected editorCookTime: number | null = null;
	protected editorServings = 1;
	protected editorCategory = '';
	protected editorNotes = '';
	protected editorActiveType: IngredientType = RECIPE_ITYPE_VEG;
	protected editorIngredients: EditorIngredient[] = [];
	protected editorSteps: EditorStep[] = [];
	protected editorNameInvalid = false;
	protected editorCategoryInvalid = false;
	/** True only after a failed save attempt where a named ingredient has qty but no unit. */
	protected editorIngredientInvalid = false;
	/** Filtered unit suggestions shown by the unit autocomplete dropdown. */
	protected editorUnitSuggestions: string[] = [];
	/** True for one completeMethod cycle after focus, so focus always shows the full list. */
	private unitFocused = false;

	/** Exposes the unit-required message to the template. */
	protected readonly RECIPE_MSG_INGREDIENT_UNIT_REQUIRED = RECIPE_MSG_INGREDIENT_UNIT_REQUIRED;
	protected editorCategoryOpen = false;
	protected editingMode: 'create' | 'edit' = RECIPE_EDITING_MODE_CREATE;
	private editingRecipeId: string | null = null;
	private pendingDetailName: string | null = null;
	private draggingStep: EditorStep | null = null;
	private dropTargetStep: EditorStep | null = null;
	private dropPosition: 'above' | 'below' | null = null;

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
	 * Lifecycle: subscribe to the recipes collection and keep the local list in sync.
	 */
	public ngOnInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.recipesSub = this.databaseService.getRecipes().subscribe({
				next: (recipes) => {
					this.ngZone.run(() => {
						this.recipes = recipes;
						this.isLoading = false;
						if (this.pendingDetailName) {
							const match = recipes.find((r) => r.name === this.pendingDetailName);
							if (match) {
								this.activeRecipe = match;
								this.pendingDetailName = null;
							}
						}
						this.cdr.markForCheck();
					});
				},
				error: (err) => LOG.error(this.className, RECIPE_MSG_LOAD_FAILED, err as Error)
			});

			// If navigated from the home quick-action button, auto-open the add view.
			// history.state retains the router state passed via Router.navigate({ state: ... }).
			// Immediately clear the state so a page refresh does not re-trigger the add view.
			if (history.state?.openAddView) {
				history.replaceState({}, '');
				setTimeout(() => this.openAddView(), 0);
			}
		}
	}

	/**
	 * Lifecycle: unsubscribe from the recipes watcher and log component teardown.
	 */
	public ngOnDestroy(): void {
		this.recipesSub?.unsubscribe();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	/**
	 * After every change-detection cycle, ensure all scrollable panels in the
	 * component have the auto-hide scroll listener attached. Uses a WeakSet so
	 * each element is bound exactly once regardless of how often the hook fires.
	 */
	public ngAfterViewChecked(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		Utilities.attachScrollAutoHide(this.stepsScrollEl?.nativeElement);
		Utilities.attachScrollAutoHide(this.ingredientsScrollEl?.nativeElement);
		document.querySelectorAll<HTMLElement>('.editor-body').forEach((el) => Utilities.attachScrollAutoHide(el));
		document.querySelectorAll<HTMLElement>('.type-tabs').forEach((el) => Utilities.attachScrollAutoHide(el));
		document.querySelectorAll<HTMLElement>('.chips').forEach((el) => Utilities.attachScrollAutoHide(el));
		document
			.querySelectorAll<HTMLElement>('.container-recipe > .view')
			.forEach((el) => Utilities.attachScrollAutoHide(el));
	}

	/**
	 * Check whether a string contains at least one Chinese character.
	 * Delegates to {@link Utilities#checkIfChinese}.
	 *
	 * @param text - The string to inspect.
	 * @returns True if the text contains a Chinese character, false otherwise.
	 */
	protected hasChinese(text: string | null | undefined): boolean {
		return Utilities.checkIfChinese(text);
	}

	/**
	 * Convert a string to title case (first letter of every word capitalised).
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
		const q = this.searchQuery.trim().toLowerCase();
		return this.recipes.filter((r) => {
			const matchCat =
				this.activeCategory === RECIPE_CATEGORY_ALL || r.category === this.activeCategory;
			const matchQ = !q || r.name.toLowerCase().includes(q);
			return matchCat && matchQ;
		});
	}

	/**
	 * Set the active category filter for the recipe list.
	 *
	 * @param cat - The category string to activate (use {@link RECIPE_CATEGORY_ALL} to show all).
	 */
	protected selectCategory(cat: string): void {
		this.activeCategory = cat;
	}

	/**
	 * Navigate to the detail view for the given recipe and reset the
	 * servings counter to the recipe's base serving size.
	 *
	 * @param recipe - The recipe to display.
	 */
	protected openRecipe(recipe: Recipe): void {
		this.activeRecipe = recipe;
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
	 * Switch the visible view, scroll the window back to the top, and
	 * trigger change detection so the template reflects the new state.
	 *
	 * @param view - The view identifier to activate (one of the VIEW_* constants).
	 */
	private transitionTo(view: string): void {
		this.ngZone.run(() => {
			this.currentView = view;
			this.viewportScroller.scrollToPosition([0, 0]);
			this.cdr.detectChanges();
		});
	}

	/**
	 * Decrement the current servings count by one, down to a minimum of 1.
	 */
	protected decServings(): void {
		if (this.servings > 1) this.servings--;
	}

	/**
	 * Increment the current servings count by one, up to a maximum of 12.
	 */
	protected incServings(): void {
		if (this.servings < 12) this.servings++;
	}

	/**
	 * Scale a base ingredient quantity to the current servings count and return
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
	 * Scale a base ingredient quantity to the current servings count and format
	 * it as a human-readable string with the unit appended.
	 *
	 * @param base - The quantity for the recipe's base serving size.
	 * @param unit - The unit label (e.g. "g", "tbsp"). Pass an empty string for unitless quantities.
	 * @returns The scaled, formatted quantity string, or an empty string if no recipe is active.
	 */
	protected formatQty(base: number, unit: string): string {
		if (!this.activeRecipe) return '';
		if (!base) return '';
		const scaled = base * (this.servings / this.activeRecipe.baseServings);
		const rounded =
			scaled === Math.round(scaled) ? String(scaled) : scaled.toFixed(1).replace(/\.0$/, '');
		return unit ? `${rounded} ${unit}` : rounded;
	}

	/**
	 * Return true if the given unit string is purely numeric and therefore
	 * carries no semantic meaning for the user (e.g. "1" entered as a placeholder).
	 *
	 * @param unit - The unit label to test.
	 * @returns true if the unit is a numeric string and should be hidden.
	 */
	protected isNumericUnit(unit: string): boolean {
		return Utilities.isNumericString(unit);
	}

	/**
	 * Toggle the collapsed state of the ingredients panel on mobile only.
	 * On desktop viewports (> 940 px) the panel is always expanded and this
	 * method is a no-op.
	 */
	protected toggleIngredients(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		if (!this.breakpointObserver.isMatched(BREAKPOINT_MOBILE)) return;
		this.ingredientsCollapsed = !this.ingredientsCollapsed;
	}

	/**
	 * Toggle the done state of a recipe step when the user taps or clicks it.
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
	 * Return the non-hidden ingredients from an ingredient group for display
	 * in the detail view.
	 *
	 * @param group - The ingredient group to filter.
	 * @returns An array of visible (non-hidden) {@link Ingredient} objects.
	 */
	protected visibleItems(group: IngredientGroup): Ingredient[] {
		return group.items.filter((i) => !i.hidden);
	}

	// ── Editor type-tab dialog ───────────────────────────────────────
	/**
	 * The subset of ingredient type tabs that are currently active in the editor,
	 * ordered as they appear in {@link MASTER_TYPE_TABS}.
	 *
	 * @returns An array of {@link TypeTab} objects for the active type IDs.
	 */
	protected get editorTypeTabs(): TypeTab[] {
		return MASTER_TYPE_TABS.filter((t) => this.activeTypeIds.has(t.id));
	}

	/**
	 * Open the ingredient type manager dialog via DialogService, initialising
	 * the draft from the currently active type IDs.
	 * The apply callback updates the active type set and falls back the editor
	 * tab if the previously selected type is no longer active.
	 */
	protected openTypeDialog(): void {
		this.dialogService.openDialog(
			this.dialogContainer,
			DIALOG_RECIPE_TYPE,
			(newIds: Set<IngredientType>) => {
				this.activeTypeIds = newIds;
				if (!this.activeTypeIds.has(this.editorActiveType)) {
					this.editorActiveType = [...this.activeTypeIds][0] ?? RECIPE_ITYPE_VEG;
				}
				this.cdr.markForCheck();
			},
			{ masterTabs: MASTER_TYPE_TABS, activeTypeIds: this.activeTypeIds }
		);
	}

	// ── Editor (Add / Edit Recipe view) ───────────────────────────────
	/**
	 * Open the editor in create mode, resetting all editor fields to their
	 * default blank state before navigating to the add-recipe view.
	 */
	protected openAddView(): void {
		this.editingMode = RECIPE_EDITING_MODE_CREATE;
		this.editingRecipeId = null;
		this.resetEditor();
		this.transitionTo(RECIPE_VIEW_ADD);
	}

	/**
	 * Open the editor in edit mode for the currently active recipe, loading its
	 * existing data into the editor fields before navigating to the add-recipe view.
	 * No-ops if no recipe is currently active or the user lacks permission.
	 */
	protected openEditView(): void {
		if (!this.activeRecipe) return;
		if (!this.dialogService.ensurePermission(this.dialogContainer, this.activeRecipe.openid)) return;
		this.editingMode = RECIPE_EDITING_MODE_EDIT;
		this.editingRecipeId = this.activeRecipe.id;
		this.loadRecipeIntoEditor(this.activeRecipe);
		this.transitionTo(RECIPE_VIEW_ADD);
	}

	/**
	 * Populate all editor fields from the given recipe, converting the stored
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
		this.editorCategoryInvalid = false;
		this.editorIngredientInvalid = false;

		this.editorIngredients = recipe.groups.flatMap((g) =>
			g.items.map((item) => ({
				type: g.type,
				name: item.name,
				qty: item.baseQty ? String(item.baseQty) : '',
				unit: item.unit
			}))
		);
		// Active type tab defaults to the first group present, or veg if empty
		this.editorActiveType = recipe.groups[0]?.type ?? RECIPE_ITYPE_VEG;
		if (this.editorIngredients.length === 0) {
			this.editorIngredients = [{ type: RECIPE_ITYPE_VEG, name: '', qty: '', unit: '' }];
		}

		this.editorSteps = recipe.steps.map((s) => ({
			text: s.text.map((t) => t.text).join(''),
			subs: s.substeps.map((text) => ({ text }))
		}));
		if (this.editorSteps.length === 0) {
			this.editorSteps = [{ text: '', subs: [] }];
		}
	}

	/**
	 * Handle the back/cancel button in the editor.
	 * In edit mode: always shows a confirm-discard dialog before returning to the detail view.
	 * In create mode: navigates directly to the list view if the form is empty, otherwise
	 * shows a confirm-discard dialog first.
	 */
	protected cancelAdd(): void {
		if (this.editingMode === RECIPE_EDITING_MODE_EDIT) {
			this.dialogService.openDialog(
				this.dialogContainer,
				DIALOG_CONFIRM,
				() => this.transitionTo(RECIPE_VIEW_DETAIL),
				[RECIPE_DISCARD_CHANGES_MESSAGE, RECIPE_DISCARD_CHANGES_TITLE, RECIPE_DISCARD_BTN]
			);
			return;
		}
		const empty =
			!this.editorName.trim() &&
			!this.editorCategory &&
			this.editorIngredients.every((i) => !i.name.trim()) &&
			this.editorSteps.every((s) => !s.text.trim() && s.subs.every((x) => !x.text.trim())) &&
			!this.editorNotes.trim();
		if (empty) {
			this.transitionTo(RECIPE_VIEW_LIST);
			return;
		}
		this.dialogService.openDialog(
			this.dialogContainer,
			DIALOG_CONFIRM,
			() => this.transitionTo(RECIPE_VIEW_LIST),
			[RECIPE_DISCARD_MESSAGE, RECIPE_DISCARD_TITLE, RECIPE_DISCARD_BTN]
		);
	}

	/**
	 * Prompt the user to confirm deletion of the recipe currently being edited,
	 * then remove it from the database and navigate back to the list view.
	 * Only callable when {@link editingMode} is 'edit' and {@link editingRecipeId} is set.
	 */
	protected removeCurrentRecipe(): void {
		this.dialogService.openDialog(
			this.dialogContainer,
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
					.catch((err: unknown) => {
						LOG.error(this.className, RECIPE_MSG_DELETE_FAILED, err as Error);
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
	 * Reset all editor fields to their default blank/initial state, including
	 * two empty ingredient rows and two empty step rows, ready for a new recipe.
	 */
	private resetEditor(): void {
		this.editorName = '';
		this.editorCookTime = null;
		this.editorServings = 1;
		this.editorCategory = '';
		this.editorNotes = '';
		this.editorActiveType = RECIPE_ITYPE_VEG;
		this.editorIngredients = [
			{ type: RECIPE_ITYPE_VEG, name: '', qty: '', unit: '' },
			{ type: RECIPE_ITYPE_VEG, name: '', qty: '', unit: '' }
		];
		this.editorSteps = [
			{ text: '', subs: [] },
			{ text: '', subs: [] }
		];
		this.editorNameInvalid = false;
		this.editorCategoryInvalid = false;
		this.editorIngredientInvalid = false;
	}

	/**
	 * The number of editor ingredient rows that have a non-empty name, used to
	 * drive the ingredient count badge in the editor footer.
	 *
	 * @returns The count of named ingredients.
	 */
	protected get editorIngredientCount(): number {
		return this.editorIngredients.filter((i) => i.name.trim()).length;
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
			const items = this.editorIngredients.filter((i) => i.type === tab.id);
			return items.length === 0 ? [] : [{ type: tab.id, emoji: tab.emoji, label: tab.label, items }];
		});
	}

	/**
	 * Set the active ingredient type tab in the editor, controlling which type
	 * is assigned to newly added ingredient rows.
	 *
	 * @param type - The ingredient type to make active.
	 */
	protected selectEditorType(type: IngredientType): void {
		this.editorActiveType = type;
	}

	/**
	 * Append a new blank ingredient row of the currently active type to the
	 * editor ingredient list.
	 */
	protected addEditorIngredient(): void {
		this.editorIngredients.push({
			type: this.editorActiveType,
			name: '',
			qty: '',
			unit: ''
		});
	}

	/**
	 * Remove an ingredient row from the editor list.
	 * Also clears the unit-invalid flag if the removal resolves all violations.
	 *
	 * @param ing - The ingredient row to remove.
	 */
	protected removeEditorIngredient(ing: EditorIngredient): void {
		this.editorIngredients = this.editorIngredients.filter((i) => i !== ing);
		if (this.editorIngredientInvalid && !this.hasIngredientUnitViolation) {
			this.editorIngredientInvalid = false;
		}
	}

	/**
	 * Append a new blank step card to the editor step list.
	 */
	protected addEditorStep(): void {
		this.editorSteps.push({ text: '', subs: [] });
	}

	/**
	 * Remove a step card from the editor step list.
	 *
	 * @param step - The step to remove.
	 */
	protected removeEditorStep(step: EditorStep): void {
		this.editorSteps = this.editorSteps.filter((s) => s !== step);
	}

	/**
	 * Append a new blank sub-point to the given editor step.
	 *
	 * @param step - The step card that should receive the new sub-point.
	 */
	protected addSubpoint(step: EditorStep): void {
		step.subs.push({ text: '' });
	}

	/**
	 * Remove a sub-point from a step.
	 *
	 * @param step - The step card that owns the sub-point.
	 * @param sub  - The sub-point to remove.
	 */
	protected removeSubpoint(step: EditorStep, sub: EditorSubpoint): void {
		step.subs = step.subs.filter((x) => x !== sub);
	}

	/**
	 * Close the category dropdown when a click lands outside it.
	 * No-ops when the dropdown is already closed to avoid spurious change detection.
	 *
	 * @param event - The document-level click event.
	 */
	@HostListener('document:click', ['$event'])
	protected onDocumentClick(event: Event): void {
		if (!this.editorCategoryOpen) return;
		if (this.catDropdownEl?.nativeElement.contains(event.target as Node)) return;
		this.editorCategoryOpen = false;
		this.cdr.markForCheck();
	}

	/**
	 * Toggle the category dropdown open/closed.
	 * Stops event propagation so the document click handler does not
	 * immediately close the panel we just opened.
	 *
	 * @param event - The click event from the trigger button.
	 */
	protected toggleCategoryDropdown(event: Event): void {
		event.stopPropagation();
		this.editorCategoryOpen = !this.editorCategoryOpen;
		this.cdr.markForCheck();
	}

	/**
	 * Select a category from the custom dropdown, close the panel,
	 * and clear the invalid flag if one was showing.
	 *
	 * @param cat - The category string the user clicked.
	 */
	protected selectCategoryOption(cat: string): void {
		this.editorCategory = cat;
		this.editorCategoryOpen = false;
		this.editorCategoryInvalid = false;
		this.cdr.markForCheck();
	}

	/**
	 * Clear the name-invalid flag as soon as the user types a non-empty value,
	 * removing the error highlight before the next save attempt.
	 */
	protected onEditorNameInput(): void {
		if (this.editorName.trim()) this.editorNameInvalid = false;
	}

	/**
	 * True when at least one named ingredient has a quantity but no unit.
	 * Single source of truth used by saveRecipe, onEditorUnitInput, and removeEditorIngredient.
	 *
	 * @returns Whether any ingredient violates the qty-requires-unit rule.
	 */
	private get hasIngredientUnitViolation(): boolean {
		return this.editorIngredients.some((i) => i.name.trim() && i.qty && !i.unit.trim());
	}

	/**
	 * Clear the ingredient-unit-invalid flag once the user has resolved all
	 * qty-without-unit violations, so the error disappears as soon as the last
	 * missing unit is filled in.
	 */
	protected onEditorUnitInput(): void {
		if (this.editorIngredientInvalid && !this.hasIngredientUnitViolation) {
			this.editorIngredientInvalid = false;
		}
	}

	/**
	 * Set the focus flag so the next completeMethod call returns the full list.
	 * PrimeNG fires onFocus before completeMethod, so the flag is always set
	 * before filterUnits consumes it.
	 */
	protected onUnitFocus(): void {
		this.unitFocused = true;
	}

	/**
	 * Populate the unit autocomplete suggestion list.
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
		const q = event.query.trim().toLowerCase();
		this.editorUnitSuggestions = q
			? RECIPE_UNIT_OPTIONS.filter((u) => u.toLowerCase().startsWith(q))
			: [...RECIPE_UNIT_OPTIONS];
	}

	/**
	 * Validate and persist the current editor state as a new or updated recipe.
	 * Marks required fields invalid and returns early if validation fails.
	 * Also blocks save if any ingredient has a quantity without a unit.
	 * On success, writes to the database and navigates back to the list view.
	 * The recipe watcher keeps the local list in sync automatically.
	 */
	protected async saveRecipe(): Promise<void> {
		this.editorNameInvalid = !this.editorName.trim();
		this.editorCategoryInvalid = !this.editorCategory;
		this.editorIngredientInvalid = this.hasIngredientUnitViolation;
		if (this.editorNameInvalid || this.editorCategoryInvalid || this.editorIngredientInvalid) return;

		const validIngredients = this.editorIngredients.filter((i) => i.name.trim());

		const groups: IngredientGroup[] = MASTER_TYPE_TABS.flatMap((tab) => {
			const items: Ingredient[] = validIngredients
				.filter((i) => i.type === tab.id)
				.map((i) => ({
					name: i.name.trim(),
					baseQty: Number(i.qty) || 0,
					unit: i.unit.trim()
				}));
			return items.length === 0 ? [] : [{ type: tab.id, emoji: tab.emoji, label: tab.label, items }];
		});

		const steps: RecipeStep[] = this.editorSteps
			.filter((s) => s.text.trim() || s.subs.some((x) => x.text.trim()))
			.map((s) => ({
				text: this.autoPillStepText(s.text.trim(), validIngredients),
				substeps: s.subs.map((x) => x.text.trim()).filter(Boolean),
				done: false
			}));

		const presentTypes = new Set(validIngredients.map((i) => i.type));
		const badges: BadgeTag[] = MASTER_TYPE_TABS.filter((t) => presentTypes.has(t.id))
			.slice(0, 3)
			.map((t) => ({ type: t.id, emoji: t.emoji, label: t.label }));

		const isEdit = this.editingMode === RECIPE_EDITING_MODE_EDIT && !!this.editingRecipeId;
		const recipe: Recipe = {
			id: isEdit ? this.editingRecipeId! : '',
			openid: isEdit ? (this.activeRecipe?.openid ?? '') : (CloudbaseService.getUseId() ?? ''),
			name: this.editorName.trim(),
			detailName: this.editorName.trim(),
			category: this.editorCategory,
			bandClass: this.bandClassForCategory(this.editorCategory),
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
				this.activeRecipe = recipe;
			} else {
				await this.databaseService.addRecipe(recipe);
				LOG.info(this.className, `Recipe created: "${recipe.name}"`);
				this.dialogService.showToast(TOAST_SUCCESS, RECIPE_MSG_ADDED);
				this.pendingDetailName = recipe.name;
				this.activeRecipe = recipe;
			}
			this.servings = recipe.baseServings || 1;
			this.ingredientsCollapsed = false;
			this.transitionTo(RECIPE_VIEW_DETAIL);
		} catch (err) {
			LOG.error(this.className, RECIPE_MSG_SAVE_FAILED, err as Error);
			this.dialogService.showToast(TOAST_ERROR, RECIPE_MSG_SAVE_FAILED, RECIPE_MSG_SAVE_FAILED_DETAIL);
		}
	}

	/**
	 * Scan plain step text for ingredient-name mentions and wrap matches as
	 * pill tokens so the read view keeps its colored highlights after editing.
	 * Best-effort substring match — sorts names longest-first so multi-word
	 * names like "soy sauce" win over their constituent words.
	 */
	private autoPillStepText(text: string, ingredients: EditorIngredient[]): StepToken[] {
		if (!text) return [{ kind: 'text', text: '' }];

		const nameMap = new Map<string, IngredientType>();
		ingredients.forEach((i) => {
			const name = i.name.trim().toLowerCase();
			if (name) nameMap.set(name, i.type);
		});
		if (nameMap.size === 0) return [{ kind: 'text', text }];

		const sortedNames = [...nameMap.keys()].sort((a, b) => b.length - a.length);
		const escaped = sortedNames.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
		const regex = new RegExp(`(${escaped.join('|')})`, 'gi');

		const tokens: StepToken[] = [];
		let lastIdx = 0;
		let match: RegExpExecArray | null;
		while ((match = regex.exec(text)) !== null) {
			if (match.index > lastIdx) {
				tokens.push({ kind: 'text', text: text.slice(lastIdx, match.index) });
			}
			const matched = match[1];
			const type = nameMap.get(matched.toLowerCase());
			const labeled = Utilities.capitalizeFirstLetterOnEachWord(matched);
			tokens.push({ kind: 'pill', text: labeled, pillType: type });
			lastIdx = match.index + matched.length;
		}
		if (lastIdx < text.length) {
			tokens.push({ kind: 'text', text: text.slice(lastIdx) });
		}
		return tokens.length > 0 ? tokens : [{ kind: 'text', text }];
	}

	/**
	 * Map a recipe category string to its corresponding card band CSS class.
	 * Falls back to the Chinese band class for unrecognised category values.
	 *
	 * @param cat - The recipe category string (one of the RECIPE_CATEGORY_* constants).
	 * @returns The CSS class name for the recipe card colour band.
	 */
	private bandClassForCategory(cat: string): string {
		switch (cat) {
			case RECIPE_CATEGORY_WESTERN:
				return RECIPE_BAND_WESTERN;
			case RECIPE_CATEGORY_QUICK:
				return RECIPE_BAND_QUICK;
			case RECIPE_CATEGORY_DESSERT:
				return RECIPE_BAND_DESSERT;
			case RECIPE_CATEGORY_CHINESE:
			default:
				return RECIPE_BAND_CHINESE;
		}
	}

	// ── Drag-to-reorder steps ─────────────────────────────────────────
	/**
	 * Handle the dragstart event on the step drag handle. Sets the full card as
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
	 * Handle the dragend event, clearing all drag-and-drop tracking state
	 * so no step card remains styled as a drag source or drop target.
	 */
	protected onStepDragEnd(): void {
		this.draggingStep = null;
		this.dropTargetStep = null;
		this.dropPosition = null;
	}

	/**
	 * Handle the dragover event on a step card. Determines whether the dragged
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
	 * Handle the dragleave event on a step card, clearing the drop-target
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
	 * Handle the drop event on a step card. Splices the dragged step out of its
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
		const fromIdx = this.editorSteps.indexOf(dragged);
		if (fromIdx < 0) {
			this.onStepDragEnd();
			return;
		}
		const moved = this.editorSteps.splice(fromIdx, 1)[0];
		let toIdx = this.editorSteps.indexOf(target);
		if (!before) toIdx += 1;
		this.editorSteps.splice(toIdx, 0, moved);
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
	protected isStepDropTarget(step: EditorStep, position: 'above' | 'below'): boolean {
		return this.dropTargetStep === step && this.dropPosition === position;
	}
}
