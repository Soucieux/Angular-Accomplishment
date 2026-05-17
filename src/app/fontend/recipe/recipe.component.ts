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
import { DialogModule } from 'primeng/dialog';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { LOG } from '../../common/app.logs';
import { Utilities } from '../../common/app.utilities';
import {
	DIALOG_CONFIRM,
	RECIPE_CATEGORY_ALL,
	RECIPE_CATEGORY_CHINESE,
	RECIPE_CATEGORY_DESSERT,
	RECIPE_CATEGORY_QUICK,
	RECIPE_CATEGORY_WESTERN,
	RECIPE_DISCARD_BTN,
	RECIPE_DISCARD_MESSAGE,
	RECIPE_DISCARD_TITLE,
	RECIPE_EDITOR_TYPE_MAX,
	RECIPE_ITYPE_CONDIMENT,
	RECIPE_ITYPE_DAIRY,
	RECIPE_ITYPE_DIALOG_TITLE,
	RECIPE_ITYPE_EGG,
	RECIPE_ITYPE_FRUIT,
	RECIPE_ITYPE_FUNGI,
	RECIPE_ITYPE_GRAIN,
	RECIPE_ITYPE_HERB,
	RECIPE_ITYPE_LIQ,
	RECIPE_ITYPE_MEAT,
	RECIPE_ITYPE_NUT,
	RECIPE_ITYPE_OIL,
	RECIPE_ITYPE_SEAFOOD,
	RECIPE_ITYPE_SEAS,
	RECIPE_ITYPE_SPICE,
	RECIPE_ITYPE_SWEET,
	RECIPE_ITYPE_VEG,
	RECIPE_VIEW_ADD,
	RECIPE_VIEW_DETAIL,
	RECIPE_VIEW_LIST,
	RECIPE_VISIBILITY_TITLE,
	RECIPE_VISIBLE_MAX
} from '../../common/app.constant';

type IngredientType =
	| typeof RECIPE_ITYPE_VEG
	| typeof RECIPE_ITYPE_MEAT
	| typeof RECIPE_ITYPE_SEAS
	| typeof RECIPE_ITYPE_DAIRY
	| typeof RECIPE_ITYPE_GRAIN
	| typeof RECIPE_ITYPE_LIQ
	| typeof RECIPE_ITYPE_SPICE
	| typeof RECIPE_ITYPE_SEAFOOD
	| typeof RECIPE_ITYPE_EGG
	| typeof RECIPE_ITYPE_NUT
	| typeof RECIPE_ITYPE_FRUIT
	| typeof RECIPE_ITYPE_OIL
	| typeof RECIPE_ITYPE_HERB
	| typeof RECIPE_ITYPE_FUNGI
	| typeof RECIPE_ITYPE_SWEET
	| typeof RECIPE_ITYPE_CONDIMENT;

interface BadgeTag {
	type: IngredientType;
	emoji: string;
	label: string;
}

interface Ingredient {
	name: string;
	baseQty: number;
	unit: string;
	hidden?: boolean;
}

interface IngredientGroup {
	type: IngredientType;
	emoji: string;
	label: string;
	items: Ingredient[];
}

interface StepToken {
	kind: 'text' | 'pill';
	text: string;
	pillType?: IngredientType;
}

interface RecipeStep {
	text: StepToken[];
	substeps: string[];
	done: boolean;
}

interface Recipe {
	id: string;
	name: string;
	detailName: string;
	category: string;
	bandClass: string;
	cookTimeMin: number;
	baseServings: number;
	badges: BadgeTag[];
	groups: IngredientGroup[];
	steps: RecipeStep[];
	notes: string;
}

interface EditorIngredient {
	id: string;
	type: IngredientType;
	name: string;
	qty: string;
	unit: string;
}

interface EditorSubpoint {
	id: string;
	text: string;
}

interface EditorStep {
	id: string;
	text: string;
	subs: EditorSubpoint[];
}

interface TypeTab {
	id: IngredientType;
	emoji: string;
	label: string;
}

const MASTER_TYPE_TABS: TypeTab[] = [
	{ id: RECIPE_ITYPE_VEG,       emoji: '🥬',  label: 'Vegetables' },
	{ id: RECIPE_ITYPE_MEAT,      emoji: '🥩',  label: 'Meat'       },
	{ id: RECIPE_ITYPE_SEAS,      emoji: '🧂',  label: 'Seasoning'  },
	{ id: RECIPE_ITYPE_DAIRY,     emoji: '🧈',  label: 'Dairy'      },
	{ id: RECIPE_ITYPE_GRAIN,     emoji: '🌾',  label: 'Grain'      },
	{ id: RECIPE_ITYPE_LIQ,       emoji: '💧',  label: 'Liquid'     },
	{ id: RECIPE_ITYPE_SPICE,     emoji: '🌶️', label: 'Spice'      },
	{ id: RECIPE_ITYPE_SEAFOOD,   emoji: '🦐',  label: 'Seafood'    },
	{ id: RECIPE_ITYPE_EGG,       emoji: '🥚',  label: 'Eggs'       },
	{ id: RECIPE_ITYPE_NUT,       emoji: '🥜',  label: 'Nuts'       },
	{ id: RECIPE_ITYPE_FRUIT,     emoji: '🍎',  label: 'Fruit'      },
	{ id: RECIPE_ITYPE_OIL,       emoji: '🫙',  label: 'Oil'        },
	{ id: RECIPE_ITYPE_HERB,      emoji: '🌿',  label: 'Herb'       },
	{ id: RECIPE_ITYPE_FUNGI,     emoji: '🍄',  label: 'Fungi'      },
	{ id: RECIPE_ITYPE_SWEET,     emoji: '🍯',  label: 'Sweetener'  },
	{ id: RECIPE_ITYPE_CONDIMENT, emoji: '🥫',  label: 'Condiment'  },
];

function makeId(): string {
	return Math.random().toString(36).slice(2, 9);
}

@Component({
	selector: 'recipe',
	standalone: true,
	imports: [CommonModule, FormsModule, DialogModule],
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
	protected readonly EDITOR_TYPE_MAX = RECIPE_EDITOR_TYPE_MAX;
	protected readonly ITYPE_DIALOG_TITLE = RECIPE_ITYPE_DIALOG_TITLE;

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
	protected readonly VISIBLE_MAX = RECIPE_VISIBLE_MAX;
	protected readonly VISIBILITY_TITLE = RECIPE_VISIBILITY_TITLE;
	protected showVisibilityDialog = false;
	protected visibilityDraft: { type: IngredientType; emoji: string; label: string; items: { name: string; hidden: boolean }[] }[] = [];

	// ── Editor type-tab management ──────────────────────────────────
	protected activeTypeIds = new Set<IngredientType>([
		RECIPE_ITYPE_VEG, RECIPE_ITYPE_MEAT, RECIPE_ITYPE_SEAS,
		RECIPE_ITYPE_DAIRY, RECIPE_ITYPE_GRAIN, RECIPE_ITYPE_LIQ, RECIPE_ITYPE_SPICE
	]);
	protected showTypeDialog = false;
	protected typeDraft = new Set<IngredientType>();

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

	public ngAfterViewChecked(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		this.attachAutoHide(this.stepsScrollEl?.nativeElement);
		this.attachAutoHide(this.ingredientsScrollEl?.nativeElement);
		document.querySelectorAll<HTMLElement>('.editor-body').forEach((el) => this.attachAutoHide(el));
		document.querySelectorAll<HTMLElement>('.container-recipe > .view').forEach((el) => this.attachAutoHide(el));
	}

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

	protected hasChinese(text: string | null | undefined): boolean {
		return this.utilities.checkIfChinese(text);
	}

	protected titleCase(text: string | null | undefined): string {
		return this.utilities.capitalizeFirstLetterOnEachWord(text);
	}

	protected get filteredRecipes(): Recipe[] {
		const q = this.searchQuery.trim().toLowerCase();
		return this.recipes.filter((r) => {
			const matchCat = this.activeCategory === RECIPE_CATEGORY_ALL || r.category === this.activeCategory;
			const matchQ = !q || r.name.toLowerCase().includes(q);
			return matchCat && matchQ;
		});
	}

	protected selectCategory(cat: string): void {
		this.activeCategory = cat;
	}

	protected openRecipe(recipe: Recipe): void {
		this.activeRecipe = recipe;
		this.servings = recipe.baseServings;
		this.ingredientsCollapsed = false;
		this.transitionTo(RECIPE_VIEW_DETAIL);
	}

	protected backToList(): void {
		this.transitionTo(RECIPE_VIEW_LIST);
	}

	private transitionTo(view: string): void {
		this.currentView = view;
		if (isPlatformBrowser(this.platformId)) {
			window.scrollTo({ top: 0, behavior: 'auto' });
		}
		this.cdr.markForCheck();
	}

	protected decServings(): void {
		if (this.servings > 1) this.servings--;
	}

	protected incServings(): void {
		if (this.servings < 12) this.servings++;
	}

	protected formatQty(base: number, unit: string): string {
		if (!this.activeRecipe) return '';
		const scaled = base * (this.servings / this.activeRecipe.baseServings);
		const rounded = scaled === Math.round(scaled) ? String(scaled) : scaled.toFixed(1).replace(/\.0$/, '');
		return unit ? `${rounded} ${unit}` : rounded;
	}

	protected toggleIngredients(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		if (!window.matchMedia('(max-width: 940px)').matches) return;
		this.ingredientsCollapsed = !this.ingredientsCollapsed;
	}

	protected toggleStepDone(step: RecipeStep, event: Event): void {
		const target = event.target as HTMLElement;
		if (target.closest('.substeps')) return;
		step.done = !step.done;
	}

	// ── Ingredient visibility dialog ──────────────────────────────────
	protected visibleItems(group: IngredientGroup): Ingredient[] {
		return group.items.filter((i) => !i.hidden);
	}

	protected openVisibilityDialog(event: Event): void {
		event.stopPropagation();
		if (!this.activeRecipe) return;
		this.visibilityDraft = this.activeRecipe.groups.map((g) => ({
			type: g.type,
			emoji: g.emoji,
			label: g.label,
			items: g.items.map((it) => ({ name: it.name, hidden: !!it.hidden }))
		}));
		this.showVisibilityDialog = true;
	}

	protected get visibilityVisibleCount(): number {
		return this.visibilityDraft.reduce(
			(sum, g) => sum + g.items.filter((i) => !i.hidden).length,
			0
		);
	}

	protected toggleVisibility(item: { name: string; hidden: boolean }): void {
		// Block enabling a hidden item when the visible cap is already reached.
		if (item.hidden && this.visibilityVisibleCount >= this.VISIBLE_MAX) return;
		item.hidden = !item.hidden;
	}

	protected canShowMore(): boolean {
		return this.visibilityVisibleCount < this.VISIBLE_MAX;
	}

	protected applyVisibility(): void {
		if (!this.activeRecipe) return;
		this.activeRecipe.groups.forEach((g) => {
			const draftGroup = this.visibilityDraft.find((d) => d.type === g.type);
			if (!draftGroup) return;
			g.items.forEach((it, idx) => {
				const draftItem = draftGroup.items[idx];
				if (draftItem) it.hidden = draftItem.hidden;
			});
		});
		this.showVisibilityDialog = false;
		this.cdr.markForCheck();
	}

	protected cancelVisibility(): void {
		this.showVisibilityDialog = false;
	}

	// ── Editor type-tab dialog ───────────────────────────────────────
	protected get editorTypeTabs(): TypeTab[] {
		return MASTER_TYPE_TABS.filter((t) => this.activeTypeIds.has(t.id));
	}

	protected openTypeDialog(): void {
		this.typeDraft = new Set(this.activeTypeIds);
		this.showTypeDialog = true;
	}

	protected toggleTypeDraft(id: IngredientType): void {
		if (this.typeDraft.has(id)) {
			if (this.typeDraft.size > 1) this.typeDraft.delete(id);
		} else if (this.typeDraft.size < this.EDITOR_TYPE_MAX) {
			this.typeDraft.add(id);
		}
	}

	protected canAddTypeDraft(): boolean {
		return this.typeDraft.size < this.EDITOR_TYPE_MAX;
	}

	protected applyTypeDialog(): void {
		this.activeTypeIds = new Set(this.typeDraft);
		if (!this.activeTypeIds.has(this.editorActiveType)) {
			this.editorActiveType = [...this.activeTypeIds][0] ?? RECIPE_ITYPE_VEG;
		}
		this.showTypeDialog = false;
		this.cdr.markForCheck();
	}

	protected cancelTypeDialog(): void {
		this.showTypeDialog = false;
	}

	// ── Editor (Add / Edit Recipe view) ───────────────────────────────
	protected openAddView(): void {
		this.editingMode = 'create';
		this.editingRecipeId = null;
		this.resetEditor();
		this.transitionTo(RECIPE_VIEW_ADD);
	}

	protected openEditView(): void {
		if (!this.activeRecipe) return;
		this.editingMode = 'edit';
		this.editingRecipeId = this.activeRecipe.id;
		this.loadRecipeIntoEditor(this.activeRecipe);
		this.transitionTo(RECIPE_VIEW_ADD);
	}

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

	protected get editorIngredientCount(): number {
		return this.editorIngredients.filter((i) => i.name.trim()).length;
	}

	protected get editorStepCount(): number {
		return this.editorSteps.length;
	}

	protected get editorGroupedIngredients(): { type: IngredientType; emoji: string; label: string; items: EditorIngredient[] }[] {
		return MASTER_TYPE_TABS.flatMap((tab) => {
			const items = this.editorIngredients.filter((i) => i.type === tab.id);
			return items.length === 0 ? [] : [{ type: tab.id, emoji: tab.emoji, label: tab.label, items }];
		});
	}

	protected selectEditorType(type: IngredientType): void {
		this.editorActiveType = type;
	}

	protected addEditorIngredient(): void {
		this.editorIngredients.push({
			id: makeId(),
			type: this.editorActiveType,
			name: '',
			qty: '',
			unit: ''
		});
	}

	protected removeEditorIngredient(id: string): void {
		this.editorIngredients = this.editorIngredients.filter((i) => i.id !== id);
	}

	protected trackById(_: number, item: { id: string }): string {
		return item.id;
	}

	protected addEditorStep(): void {
		this.editorSteps.push({ id: makeId(), text: '', subs: [] });
	}

	protected removeEditorStep(id: string): void {
		this.editorSteps = this.editorSteps.filter((s) => s.id !== id);
	}

	protected addSubpoint(step: EditorStep): void {
		step.subs.push({ id: makeId(), text: '' });
	}

	protected removeSubpoint(step: EditorStep, subId: string): void {
		step.subs = step.subs.filter((x) => x.id !== subId);
	}

	protected onEditorNameInput(): void {
		if (this.editorName.trim()) this.editorNameInvalid = false;
	}

	protected onEditorCategoryChange(): void {
		if (this.editorCategory) this.editorCategoryInvalid = false;
	}

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
	protected onStepDragStart(step: EditorStep, event: DragEvent): void {
		this.draggingStepId = step.id;
		event.dataTransfer?.setData('text/plain', step.id);
		if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
	}

	protected onStepDragEnd(): void {
		this.draggingStepId = null;
		this.dropTargetStepId = null;
		this.dropPosition = null;
	}

	protected onStepDragOver(step: EditorStep, event: DragEvent): void {
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const before = event.clientY - rect.top < rect.height / 2;
		this.dropTargetStepId = step.id;
		this.dropPosition = before ? 'above' : 'below';
	}

	protected onStepDragLeave(step: EditorStep): void {
		if (this.dropTargetStepId === step.id) {
			this.dropTargetStepId = null;
			this.dropPosition = null;
		}
	}

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

	protected isStepDragging(step: EditorStep): boolean {
		return this.draggingStepId === step.id;
	}

	protected isStepDropTarget(step: EditorStep, position: 'above' | 'below'): boolean {
		return this.dropTargetStepId === step.id && this.dropPosition === position;
	}
}
