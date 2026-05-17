import {
	AfterViewChecked,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Inject,
	PLATFORM_ID,
	ViewChild,
	ViewContainerRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { LOG } from '../../common/app.logs';
import { Utilities } from '../../common/app.utilities';
import {
	DIALOG_CONFIRM,
	DIALOG_RECIPE_TYPE,
	RECIPE_CATEGORY_ALL,
	RECIPE_CATEGORY_CHINESE,
	RECIPE_CATEGORY_DESSERT,
	RECIPE_CATEGORY_QUICK,
	RECIPE_CATEGORY_WESTERN,
	RECIPE_DISCARD_BTN,
	RECIPE_DISCARD_MESSAGE,
	RECIPE_DISCARD_TITLE,
	RECIPE_ITYPE_DAIRY,
	RECIPE_ITYPE_GRAIN,
	RECIPE_ITYPE_LIQ,
	RECIPE_ITYPE_MEAT,
	RECIPE_ITYPE_SEAS,
	RECIPE_ITYPE_SPICE,
	RECIPE_ITYPE_VEG,
	RECIPE_VIEW_ADD,
	RECIPE_VIEW_DETAIL,
	RECIPE_VIEW_LIST
} from '../../common/app.constant';
import {
	BadgeTag,
	EditorIngredient,
	EditorStep,
	Ingredient,
	IngredientGroup,
	IngredientType,
	MASTER_TYPE_TABS,
	Recipe,
	RecipeStep,
	StepToken,
	TypeTab
} from './recipe.types';

/**
 * Generate a short random alphanumeric ID suitable for use as a
 * local-only row key in the editor ingredient and step lists.
 *
 * @returns A 7-character random base-36 string.
 */
function makeId(): string {
	return Math.random().toString(36).slice(2, 9);
}

@Component({
	selector: 'recipe',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './recipe.component.html',
	styleUrl: './recipe.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipeComponent implements AfterViewChecked {
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	protected dialogContainer!: ViewContainerRef;

	@ViewChild('stepsScroll') private stepsScrollEl?: ElementRef<HTMLElement>;
	@ViewChild('ingredientsScroll') private ingredientsScrollEl?: ElementRef<HTMLElement>;

	private boundScrollEls = new WeakSet<HTMLElement>();
	private scrollTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

	protected readonly VIEW_LIST = RECIPE_VIEW_LIST;
	protected readonly VIEW_DETAIL = RECIPE_VIEW_DETAIL;
	protected readonly VIEW_ADD = RECIPE_VIEW_ADD;
	protected readonly CAT_ALL = RECIPE_CATEGORY_ALL;
	protected readonly MASTER_TYPE_TABS = MASTER_TYPE_TABS;

	protected readonly categories: string[] = [
		RECIPE_CATEGORY_ALL,
		RECIPE_CATEGORY_CHINESE,
		RECIPE_CATEGORY_WESTERN,
		RECIPE_CATEGORY_QUICK,
		RECIPE_CATEGORY_DESSERT
	];
	protected readonly editorCategories: string[] = [
		RECIPE_CATEGORY_CHINESE,
		RECIPE_CATEGORY_WESTERN,
		RECIPE_CATEGORY_QUICK,
		RECIPE_CATEGORY_DESSERT
	];

	protected currentView: string = RECIPE_VIEW_LIST;
	protected searchQuery = '';
	protected activeCategory: string = RECIPE_CATEGORY_ALL;

	protected activeRecipe: Recipe | null = null;
	protected servings = 2;
	protected ingredientsCollapsed = false;

	// ── Editor type-tab management ──────────────────────────────────
	protected activeTypeIds = new Set<IngredientType>([
		RECIPE_ITYPE_VEG, RECIPE_ITYPE_MEAT, RECIPE_ITYPE_SEAS,
		RECIPE_ITYPE_DAIRY, RECIPE_ITYPE_GRAIN, RECIPE_ITYPE_LIQ, RECIPE_ITYPE_SPICE
	]);

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
	protected editingMode: 'create' | 'edit' = 'create';
	private editingRecipeId: string | null = null;
	private draggingStepId: string | null = null;
	protected dropTargetStepId: string | null = null;
	protected dropPosition: 'above' | 'below' | null = null;

	protected recipes: Recipe[] = [
		{
			id: 'garlic-beef',
			name: 'Garlic Beef Stir-Fry',
			detailName: 'Garlic Beef Stir-Fry with Broccoli',
			category: RECIPE_CATEGORY_CHINESE,
			bandClass: 'band-chinese',
			cookTimeMin: 40,
			baseServings: 2,
			badges: [
				{ type: RECIPE_ITYPE_MEAT, emoji: '🥩', label: 'Meat' },
				{ type: RECIPE_ITYPE_VEG, emoji: '🥬', label: 'Vegetables' },
				{ type: RECIPE_ITYPE_SEAS, emoji: '🧂', label: 'Seasoning' }
			],
			groups: [
				{
					type: RECIPE_ITYPE_MEAT,
					emoji: '🥩',
					label: 'Meat / Protein',
					items: [
						{ name: 'Beef sirloin', baseQty: 300, unit: 'g' },
						{ name: 'Egg white', baseQty: 1, unit: '' },
						{ name: 'Bacon', baseQty: 50, unit: 'g', hidden: true }
					]
				},
				{
					type: RECIPE_ITYPE_VEG,
					emoji: '🥬',
					label: 'Vegetables',
					items: [
						{ name: 'Broccoli', baseQty: 200, unit: 'g' },
						{ name: 'Garlic', baseQty: 4, unit: 'cloves' },
						{ name: 'Ginger', baseQty: 1, unit: 'thumb' },
						{ name: 'Onion', baseQty: 1, unit: '', hidden: true },
						{ name: 'Spring onion', baseQty: 2, unit: 'stalks', hidden: true }
					]
				},
				{
					type: RECIPE_ITYPE_SEAS,
					emoji: '🧂',
					label: 'Seasoning',
					items: [
						{ name: 'Soy sauce', baseQty: 2, unit: 'tbsp' },
						{ name: 'Oyster sauce', baseQty: 1, unit: 'tbsp' },
						{ name: 'Sesame oil', baseQty: 1, unit: 'tsp' },
						{ name: 'Cornstarch', baseQty: 1, unit: 'tbsp' },
						{ name: 'Salt', baseQty: 1, unit: 'tsp', hidden: true },
						{ name: 'Black pepper', baseQty: 1, unit: 'pinch', hidden: true }
					]
				},
				{
					type: RECIPE_ITYPE_SPICE,
					emoji: '🌶️',
					label: 'Spice',
					items: [
						{ name: 'Chili flakes', baseQty: 1, unit: 'tsp', hidden: true }
					]
				}
			],
			steps: [
				{
					text: [
						{ kind: 'text', text: 'Slice the ' },
						{ kind: 'pill', text: 'Beef', pillType: RECIPE_ITYPE_MEAT },
						{ kind: 'text', text: ' against the grain into thin strips. Mix with ' },
						{ kind: 'pill', text: 'cornstarch', pillType: RECIPE_ITYPE_SEAS },
						{ kind: 'text', text: ', ' },
						{ kind: 'pill', text: 'egg white', pillType: RECIPE_ITYPE_MEAT },
						{ kind: 'text', text: ', ' },
						{ kind: 'pill', text: 'soy sauce', pillType: RECIPE_ITYPE_SEAS },
						{ kind: 'text', text: ' (1 tbsp), and ' },
						{ kind: 'pill', text: 'cooking wine', pillType: RECIPE_ITYPE_LIQ },
						{ kind: 'text', text: '. Marinate 15 minutes.' }
					],
					substeps: [
						'Slice with the knife at a 30° angle for a wider surface area — the beef will be more tender.',
						'Aim for slices about 3 mm thick; partial-freezing the beef for 15 min first makes it easier.',
						'Massage the marinade in by hand for 30 seconds before resting — this is called “velveting”.'
					],
					done: false
				},
				{
					text: [
						{ kind: 'text', text: 'Blanch ' },
						{ kind: 'pill', text: 'broccoli', pillType: RECIPE_ITYPE_VEG },
						{ kind: 'text', text: ' in salted boiling water for 2 minutes. Drain and set aside.' }
					],
					substeps: [
						'Cut florets to roughly the same size so they cook evenly.',
						'Shock in ice water immediately after blanching to lock in the bright green colour.'
					],
					done: false
				},
				{
					text: [
						{ kind: 'text', text: 'Heat the wok on high. Add oil. Stir-fry ' },
						{ kind: 'pill', text: 'Beef', pillType: RECIPE_ITYPE_MEAT },
						{ kind: 'text', text: ' for 90 seconds until browned. Remove from wok.' }
					],
					substeps: [
						'Wok should smoke lightly before the oil goes in — that’s “wok hei”.',
						'Spread beef in a single layer, leave 20 sec untouched for a sear, then toss.'
					],
					done: true
				},
				{
					text: [
						{ kind: 'text', text: 'In the same wok, add ' },
						{ kind: 'pill', text: 'garlic', pillType: RECIPE_ITYPE_VEG },
						{ kind: 'text', text: ' and ' },
						{ kind: 'pill', text: 'ginger', pillType: RECIPE_ITYPE_VEG },
						{ kind: 'text', text: '. Stir-fry 30 seconds until fragrant.' }
					],
					substeps: [
						'Lower the heat slightly so the aromatics don’t burn before the next step.'
					],
					done: false
				},
				{
					text: [
						{ kind: 'text', text: 'Return the ' },
						{ kind: 'pill', text: 'Beef', pillType: RECIPE_ITYPE_MEAT },
						{ kind: 'text', text: '. Add ' },
						{ kind: 'pill', text: 'broccoli', pillType: RECIPE_ITYPE_VEG },
						{ kind: 'text', text: ', ' },
						{ kind: 'pill', text: 'oyster sauce', pillType: RECIPE_ITYPE_SEAS },
						{ kind: 'text', text: ', remaining ' },
						{ kind: 'pill', text: 'soy sauce', pillType: RECIPE_ITYPE_SEAS },
						{ kind: 'text', text: ', and ' },
						{ kind: 'pill', text: 'water', pillType: RECIPE_ITYPE_LIQ },
						{ kind: 'text', text: '. Toss for 1 minute. Finish with ' },
						{ kind: 'pill', text: 'sesame oil', pillType: RECIPE_ITYPE_SEAS },
						{ kind: 'text', text: '. Serve immediately.' }
					],
					substeps: [
						'Toss with the wok, not a spatula — keeps the broccoli intact.',
						'Sesame oil goes in off the heat; high heat destroys its aroma.',
						'Serve straight from the wok onto a warm plate to preserve the glaze.'
					],
					done: false
				}
			],
			notes: 'Velveting the beef with cornstarch and egg white is the key to restaurant-level tenderness. Don’t skip the marinade time — give it the full 15 minutes for the proteins to relax.'
		},
		{
			id: 'carbonara',
			name: 'Creamy Pasta Carbonara',
			detailName: 'Creamy Pasta Carbonara',
			category: RECIPE_CATEGORY_WESTERN,
			bandClass: 'band-western',
			cookTimeMin: 25,
			baseServings: 2,
			badges: [
				{ type: RECIPE_ITYPE_GRAIN, emoji: '🌾', label: 'Starch' },
				{ type: RECIPE_ITYPE_DAIRY, emoji: '🧈', label: 'Dairy' },
				{ type: RECIPE_ITYPE_MEAT, emoji: '🥩', label: 'Meat' }
			],
			groups: [],
			steps: [],
			notes: ''
		},
		{
			id: 'tofu-hotpot',
			name: 'Spicy Tofu Hotpot',
			detailName: 'Spicy Tofu Hotpot',
			category: RECIPE_CATEGORY_CHINESE,
			bandClass: 'band-spicy',
			cookTimeMin: 55,
			baseServings: 4,
			badges: [
				{ type: RECIPE_ITYPE_VEG, emoji: '🥬', label: 'Vegetables' },
				{ type: RECIPE_ITYPE_SPICE, emoji: '🌶️', label: 'Spice' },
				{ type: RECIPE_ITYPE_LIQ, emoji: '💧', label: 'Liquid' }
			],
			groups: [],
			steps: [],
			notes: ''
		}
	];

	constructor(
		private cdr: ChangeDetectorRef,
		private utilities: Utilities,
		private dialogService: DialogService,
		@Inject(PLATFORM_ID) private platformId: object
	) {}

	/**
	 * After every change-detection cycle, ensure all scrollable panels in the
	 * component have the auto-hide scroll listener attached. Uses a WeakSet so
	 * each element is bound exactly once regardless of how often the hook fires.
	 */
	public ngAfterViewChecked(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		this.attachAutoHide(this.stepsScrollEl?.nativeElement);
		this.attachAutoHide(this.ingredientsScrollEl?.nativeElement);
		document.querySelectorAll<HTMLElement>('.editor-body').forEach((el) => this.attachAutoHide(el));
		document.querySelectorAll<HTMLElement>('.container-recipe > .view').forEach((el) => this.attachAutoHide(el));
	}

	/**
	 * Attach a scroll-activity listener to a scrollable element that adds the
	 * `is-scrolling` CSS class while the user is scrolling and removes it
	 * 700 ms after scrolling stops, keeping the scrollbar hidden at rest.
	 * No-ops if the element is already bound or is undefined.
	 *
	 * @param el - The scrollable DOM element to observe, or undefined to skip.
	 */
	private attachAutoHide(el?: HTMLElement): void {
		if (!el || this.boundScrollEls.has(el)) return;
		this.boundScrollEls.add(el);
		const reveal = () => {
			el.classList.add('is-scrolling');
			const prev = this.scrollTimers.get(el);
			if (prev) clearTimeout(prev);
			this.scrollTimers.set(
				el,
				setTimeout(() => el.classList.remove('is-scrolling'), 700)
			);
		};
		el.addEventListener('scroll', reveal, { passive: true });
		el.addEventListener('mouseenter', () => {
			if (el.scrollHeight > el.clientHeight) reveal();
		});
	}

	/**
	 * Check whether a string contains at least one Chinese character.
	 * Delegates to {@link Utilities#checkIfChinese}.
	 *
	 * @param text - The string to inspect.
	 * @returns True if the text contains a Chinese character, false otherwise.
	 */
	protected hasChinese(text: string | null | undefined): boolean {
		return this.utilities.checkIfChinese(text);
	}

	/**
	 * Convert a string to title case (first letter of every word capitalised).
	 * Delegates to {@link Utilities#capitalizeFirstLetterOnEachWord}.
	 *
	 * @param text - The string to convert.
	 * @returns The title-cased string, or an empty string for falsy input.
	 */
	protected titleCase(text: string | null | undefined): string {
		return this.utilities.capitalizeFirstLetterOnEachWord(text);
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
			const matchCat = this.activeCategory === RECIPE_CATEGORY_ALL || r.category === this.activeCategory;
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
		this.currentView = view;
		if (isPlatformBrowser(this.platformId)) {
			window.scrollTo({ top: 0, behavior: 'auto' });
		}
		this.cdr.markForCheck();
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
	 * Scale a base ingredient quantity to the current servings count and format
	 * it as a human-readable string with the unit appended.
	 *
	 * @param base - The quantity for the recipe's base serving size.
	 * @param unit - The unit label (e.g. "g", "tbsp"). Pass an empty string for unitless quantities.
	 * @returns The scaled, formatted quantity string, or an empty string if no recipe is active.
	 */
	protected formatQty(base: number, unit: string): string {
		if (!this.activeRecipe) return '';
		const scaled = base * (this.servings / this.activeRecipe.baseServings);
		const rounded = scaled === Math.round(scaled) ? String(scaled) : scaled.toFixed(1).replace(/\.0$/, '');
		return unit ? `${rounded} ${unit}` : rounded;
	}

	/**
	 * Toggle the collapsed state of the ingredients panel on mobile only.
	 * On desktop viewports (> 940 px) the panel is always expanded and this
	 * method is a no-op.
	 */
	protected toggleIngredients(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		if (!window.matchMedia('(max-width: 940px)').matches) return;
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
		this.editingMode = 'create';
		this.editingRecipeId = null;
		this.resetEditor();
		this.transitionTo(RECIPE_VIEW_ADD);
	}

	/**
	 * Open the editor in edit mode for the currently active recipe, loading its
	 * existing data into the editor fields before navigating to the add-recipe view.
	 * No-ops if no recipe is currently active.
	 */
	protected openEditView(): void {
		if (!this.activeRecipe) return;
		this.editingMode = 'edit';
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

		this.editorIngredients = recipe.groups.flatMap((g) =>
			g.items.map((item) => ({
				id: makeId(),
				type: g.type,
				name: item.name,
				qty: item.baseQty ? String(item.baseQty) : '',
				unit: item.unit
			}))
		);
		// Active type tab defaults to the first group present, or veg if empty
		this.editorActiveType = recipe.groups[0]?.type ?? RECIPE_ITYPE_VEG;
		if (this.editorIngredients.length === 0) {
			this.editorIngredients = [
				{ id: makeId(), type: RECIPE_ITYPE_VEG, name: '', qty: '', unit: '' }
			];
		}

		this.editorSteps = recipe.steps.map((s) => ({
			id: makeId(),
			text: s.text.map((t) => t.text).join(''),
			subs: s.substeps.map((text) => ({ id: makeId(), text }))
		}));
		if (this.editorSteps.length === 0) {
			this.editorSteps = [{ id: makeId(), text: '', subs: [] }];
		}
	}

	/**
	 * Handle the Cancel button in the editor. If the editor is empty, navigates
	 * directly to the list view. Otherwise shows a confirm-discard dialog and
	 * navigates to the list view only if the user confirms.
	 */
	protected cancelAdd(): void {
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
			{ id: makeId(), type: RECIPE_ITYPE_VEG, name: '', qty: '', unit: '' },
			{ id: makeId(), type: RECIPE_ITYPE_VEG, name: '', qty: '', unit: '' }
		];
		this.editorSteps = [
			{ id: makeId(), text: '', subs: [] },
			{ id: makeId(), text: '', subs: [] }
		];
		this.editorNameInvalid = false;
		this.editorCategoryInvalid = false;
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
	protected get editorGroupedIngredients(): { type: IngredientType; emoji: string; label: string; items: EditorIngredient[] }[] {
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
			id: makeId(),
			type: this.editorActiveType,
			name: '',
			qty: '',
			unit: ''
		});
	}

	/**
	 * Remove the ingredient row with the given ID from the editor list.
	 *
	 * @param id - The local ID of the ingredient row to remove.
	 */
	protected removeEditorIngredient(id: string): void {
		this.editorIngredients = this.editorIngredients.filter((i) => i.id !== id);
	}

	/**
	 * Angular track-by function for `@for` loops over editor rows.
	 * Returns the item's stable local ID so Angular can reuse DOM nodes
	 * across list mutations instead of re-rendering every row.
	 *
	 * @param _ - The loop index (unused).
	 * @param item - The list item with an `id` property.
	 * @returns The item's ID string.
	 */
	protected trackById(_: number, item: { id: string }): string {
		return item.id;
	}

	/**
	 * Append a new blank step card to the editor step list.
	 */
	protected addEditorStep(): void {
		this.editorSteps.push({ id: makeId(), text: '', subs: [] });
	}

	/**
	 * Remove the step card with the given ID from the editor step list.
	 *
	 * @param id - The local ID of the step to remove.
	 */
	protected removeEditorStep(id: string): void {
		this.editorSteps = this.editorSteps.filter((s) => s.id !== id);
	}

	/**
	 * Append a new blank sub-point to the given editor step.
	 *
	 * @param step - The step card that should receive the new sub-point.
	 */
	protected addSubpoint(step: EditorStep): void {
		step.subs.push({ id: makeId(), text: '' });
	}

	/**
	 * Remove a sub-point from a step by its local ID.
	 *
	 * @param step  - The step card that owns the sub-point.
	 * @param subId - The local ID of the sub-point to remove.
	 */
	protected removeSubpoint(step: EditorStep, subId: string): void {
		step.subs = step.subs.filter((x) => x.id !== subId);
	}

	/**
	 * Clear the name-invalid flag as soon as the user types a non-empty value,
	 * removing the error highlight before the next save attempt.
	 */
	protected onEditorNameInput(): void {
		if (this.editorName.trim()) this.editorNameInvalid = false;
	}

	/**
	 * Clear the category-invalid flag as soon as the user selects a category,
	 * removing the error highlight before the next save attempt.
	 */
	protected onEditorCategoryChange(): void {
		if (this.editorCategory) this.editorCategoryInvalid = false;
	}

	/**
	 * Validate and persist the current editor state as a new or updated recipe.
	 * Marks required fields invalid and returns early if validation fails.
	 * On success, adds or replaces the recipe in the in-memory list, updates
	 * `activeRecipe` when editing, logs the operation, and navigates to the list view.
	 */
	protected saveRecipe(): void {
		this.editorNameInvalid = !this.editorName.trim();
		this.editorCategoryInvalid = !this.editorCategory;
		if (this.editorNameInvalid || this.editorCategoryInvalid) return;

		const validIngredients = this.editorIngredients.filter((i) => i.name.trim());

		const groups: IngredientGroup[] = MASTER_TYPE_TABS.flatMap((tab) => {
			const items: Ingredient[] = validIngredients
				.filter((i) => i.type === tab.id)
				.map((i) => ({
					name: i.name.trim(),
					baseQty: Number(i.qty) || 0,
					unit: i.unit.trim()
				}));
			return items.length === 0
				? []
				: [{ type: tab.id, emoji: tab.emoji, label: tab.label, items }];
		});

		const steps: RecipeStep[] = this.editorSteps
			.filter((s) => s.text.trim() || s.subs.some((x) => x.text.trim()))
			.map((s) => ({
				text: this.autoPillStepText(s.text.trim(), validIngredients),
				substeps: s.subs.map((x) => x.text.trim()).filter(Boolean),
				done: false
			}));

		const presentTypes = new Set(validIngredients.map((i) => i.type));
		const badges: BadgeTag[] = MASTER_TYPE_TABS
			.filter((t) => presentTypes.has(t.id))
			.slice(0, 3)
			.map((t) => ({ type: t.id, emoji: t.emoji, label: t.label }));

		const isEdit = this.editingMode === 'edit' && !!this.editingRecipeId;
		const recipe: Recipe = {
			id: isEdit ? this.editingRecipeId! : makeId(),
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

		if (isEdit) {
			const idx = this.recipes.findIndex((r) => r.id === this.editingRecipeId);
			if (idx >= 0) this.recipes[idx] = recipe;
			this.activeRecipe = recipe;
		} else {
			this.recipes.push(recipe);
		}

		LOG.info(
			'RecipeComponent',
			`Recipe ${isEdit ? 'updated' : 'created'}: ${recipe.id} "${recipe.name}"`
		);
		this.transitionTo(RECIPE_VIEW_LIST);
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
			const labeled = this.utilities.capitalizeFirstLetterOnEachWord(matched);
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
				return 'band-western';
			case RECIPE_CATEGORY_QUICK:
				return 'band-quick';
			case RECIPE_CATEGORY_DESSERT:
				return 'band-dessert';
			case RECIPE_CATEGORY_CHINESE:
			default:
				return 'band-chinese';
		}
	}

	// ── Drag-to-reorder steps ─────────────────────────────────────────
	/**
	 * Handle the dragstart event on a step card, recording the dragged step ID
	 * and setting the drag-transfer data and effect.
	 *
	 * @param step  - The step card being dragged.
	 * @param event - The native drag event.
	 */
	protected onStepDragStart(step: EditorStep, event: DragEvent): void {
		this.draggingStepId = step.id;
		event.dataTransfer?.setData('text/plain', step.id);
		if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
	}

	/**
	 * Handle the dragend event, clearing all drag-and-drop tracking state
	 * so no step card remains styled as a drag source or drop target.
	 */
	protected onStepDragEnd(): void {
		this.draggingStepId = null;
		this.dropTargetStepId = null;
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
		this.dropTargetStepId = step.id;
		this.dropPosition = before ? 'above' : 'below';
	}

	/**
	 * Handle the dragleave event on a step card, clearing the drop-target
	 * highlight only when the cursor leaves the card that is currently marked
	 * as the drop target.
	 *
	 * @param step - The step card the cursor has left.
	 */
	protected onStepDragLeave(step: EditorStep): void {
		if (this.dropTargetStepId === step.id) {
			this.dropTargetStepId = null;
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
		const draggedId = event.dataTransfer?.getData('text/plain') ?? this.draggingStepId;
		if (!draggedId || draggedId === target.id) {
			this.onStepDragEnd();
			return;
		}
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const before = event.clientY - rect.top < rect.height / 2;
		const fromIdx = this.editorSteps.findIndex((x) => x.id === draggedId);
		if (fromIdx < 0) {
			this.onStepDragEnd();
			return;
		}
		const moved = this.editorSteps.splice(fromIdx, 1)[0];
		let toIdx = this.editorSteps.findIndex((x) => x.id === target.id);
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
		return this.draggingStepId === step.id;
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
		return this.dropTargetStepId === step.id && this.dropPosition === position;
	}
}
