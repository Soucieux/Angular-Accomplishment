import {
	RECIPE_CATEGORY_ALL,
	RECIPE_CATEGORY_CHINESE,
	RECIPE_CATEGORY_DESSERT,
	RECIPE_CATEGORY_QUICK,
	RECIPE_CATEGORY_WESTERN,
	RECIPE_ITYPE_CONDIMENT,
	RECIPE_ITYPE_DAIRY,
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
	RECIPE_ITYPE_VEG
} from '../../common/app.constant';

export type IngredientType =
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

export const MASTER_TYPE_TABS: TypeTab[] = [
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
	id: string;
	type: IngredientType;
	name: string;
	qty: string;
	unit: string;
}

export interface EditorSubpoint {
	id: string;
	text: string;
}

export interface EditorStep {
	id: string;
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

/** All category options used by the list-view filter chips (includes "All"). */
export const RECIPE_CATEGORIES: string[] = [
	RECIPE_CATEGORY_ALL,
	RECIPE_CATEGORY_CHINESE,
	RECIPE_CATEGORY_WESTERN,
	RECIPE_CATEGORY_QUICK,
	RECIPE_CATEGORY_DESSERT,
];

/** Category options available in the recipe editor dropdown (excludes "All"). */
export const RECIPE_EDITOR_CATEGORIES: string[] = [
	RECIPE_CATEGORY_CHINESE,
	RECIPE_CATEGORY_WESTERN,
	RECIPE_CATEGORY_QUICK,
	RECIPE_CATEGORY_DESSERT,
];

/** The 7 ingredient types active in the editor by default when creating a new recipe. */
export const RECIPE_EDITOR_DEFAULT_TYPES: IngredientType[] = [
	RECIPE_ITYPE_VEG,
	RECIPE_ITYPE_MEAT,
	RECIPE_ITYPE_SEAS,
	RECIPE_ITYPE_DAIRY,
	RECIPE_ITYPE_GRAIN,
	RECIPE_ITYPE_LIQ,
	RECIPE_ITYPE_SPICE,
];
