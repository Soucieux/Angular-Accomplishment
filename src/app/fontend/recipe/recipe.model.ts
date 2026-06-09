export type IngredientType =
	| 'veg'
	| 'meat'
	| 'seas'
	| 'dairy'
	| 'grain'
	| 'liq'
	| 'spice'
	| 'seafood'
	| 'egg'
	| 'nut'
	| 'fruit'
	| 'oil'
	| 'herb'
	| 'fungi'
	| 'sweet'
	| 'condiment';

export interface TypeTab {
	id: IngredientType;
	emoji: string;
	label: string;
}

export interface Ingredient {
	name: string;
	baseQty: number;
	unit: string;
	hidden?: boolean;
}

export interface IngredientGroup {
	type: IngredientType;
	emoji: string;
	label: string;
	items: Ingredient[];
}

export interface BadgeTag {
	type: IngredientType;
	emoji: string;
	label: string;
}

export interface StepToken {
	kind: 'text' | 'pill';
	text: string;
	pillType?: IngredientType;
}

export interface RecipeStep {
	text: StepToken[];
	substeps: string[];
	done: boolean;
}

export interface Recipe {
	id: string;
	openid: string;
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

export interface EditorIngredient {
	type: IngredientType;
	name: string;
	qty: string;
	unit: string;
}

export interface EditorSubpoint {
	text: string;
}

export interface EditorStep {
	text: string;
	subs: EditorSubpoint[];
}

/** A grouped view of editor ingredients, ordered by MASTER_TYPE_TABS. */
export interface EditorGroup {
	type: IngredientType;
	emoji: string;
	label: string;
	items: EditorIngredient[];
}

/** Union of valid editing modes for the recipe editor. */
export type EditingMode = 'create' | 'edit';

/** Union of valid drag-drop target positions. */
export type DropPosition = 'above' | 'below';

export const MASTER_TYPE_TABS: TypeTab[] = [
	{ id: 'veg', emoji: '🥬', label: 'Vegetables' },
	{ id: 'meat', emoji: '🥩', label: 'Meat' },
	{ id: 'seas', emoji: '🧂', label: 'Seasoning' },
	{ id: 'dairy', emoji: '🧈', label: 'Dairy' },
	{ id: 'grain', emoji: '🌾', label: 'Grain' },
	{ id: 'liq', emoji: '💧', label: 'Liquid' },
	{ id: 'spice', emoji: '🌶️', label: 'Spice' },
	{ id: 'seafood', emoji: '🦐', label: 'Seafood' },
	{ id: 'egg', emoji: '🥚', label: 'Eggs' },
	{ id: 'nut', emoji: '🥜', label: 'Nuts' },
	{ id: 'fruit', emoji: '🍎', label: 'Fruit' },
	{ id: 'oil', emoji: '🫙', label: 'Oil' },
	{ id: 'herb', emoji: '🌿', label: 'Herb' },
	{ id: 'fungi', emoji: '🍄', label: 'Fungi' },
	{ id: 'sweet', emoji: '🍯', label: 'Sweetener' },
	{ id: 'condiment', emoji: '🥫', label: 'Condiment' }
];

/**
 * All category options used by the list-view filter chips (includes "All").
 * When adding a new category, append its value here and also to
 * RECIPE_EDITOR_CATEGORIES below.
 */
export const RECIPE_CATEGORIES: string[] = ['All', 'Chinese', 'Western', 'Quick', 'Dessert'];

/**
 * Category options available in the recipe editor dropdown (excludes "All").
 * Keep in sync with RECIPE_CATEGORIES above.
 */
export const RECIPE_EDITOR_CATEGORIES: string[] = ['Chinese', 'Western', 'Quick', 'Dessert'];

/** The 7 ingredient types active in the editor by default when creating a new recipe. */
export const RECIPE_EDITOR_DEFAULT_TYPES: IngredientType[] = [
	'veg',
	'meat',
	'seas',
	'dairy',
	'grain',
	'liq',
	'spice'
];

/** Available unit options for ingredient quantity input in the recipe editor. */
export const RECIPE_UNIT_OPTIONS: string[] = ['g', 'kg', 'oz', 'lb', 'tsp', 'tbsp', 'cup', 'ml', 'L'];
