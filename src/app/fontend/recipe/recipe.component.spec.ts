import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';

import { RECIPE_CATEGORY_ALL, RECIPE_ITYPE_VEG, RECIPE_ITYPE_MEAT, RECIPE_UNIT_OPTIONS } from '../../common/app.constant';
import { DatabaseService } from '../../backend/database-service/database.service';
import { IngredientType } from './recipe.model';
import { RecipeComponent } from './recipe.component';

describe('RecipeComponent', () => {
	let component: RecipeComponent;
	let fixture: ComponentFixture<RecipeComponent>;

	beforeEach(async () => {
		const mockDb = jasmine.createSpyObj('DatabaseService', ['getRecipes']);
		mockDb.getRecipes.and.returnValue(of([]));

		await TestBed.configureTestingModule({
			imports: [RecipeComponent],
			providers: [
				MessageService,
				{ provide: DatabaseService, useValue: mockDb }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(RecipeComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	// ── decServings / incServings ──────────────────────────────────────────

	describe('decServings', () => {
		it('decrements servings by one', () => {
			(component as any).servings = 4;
			(component as any).decServings();
			expect((component as any).servings).toBe(3);
		});

		it('does not go below 1', () => {
			(component as any).servings = 1;
			(component as any).decServings();
			expect((component as any).servings).toBe(1);
		});
	});

	describe('incServings', () => {
		it('increments servings by one', () => {
			(component as any).servings = 4;
			(component as any).incServings();
			expect((component as any).servings).toBe(5);
		});

		it('does not exceed 12', () => {
			(component as any).servings = 12;
			(component as any).incServings();
			expect((component as any).servings).toBe(12);
		});
	});

	// ── formatQty ─────────────────────────────────────────────────────────

	describe('formatQty', () => {
		beforeEach(() => {
			(component as any).selectedRecipe = { baseServings: 2 };
			(component as any).servings = 4;
		});

		it('returns empty string when there is no active recipe', () => {
			(component as any).selectedRecipe = null;
			expect((component as any).formatQty(100, 'g')).toBe('');
		});

		it('returns empty string for a zero base', () => {
			expect((component as any).formatQty(0, 'g')).toBe('');
		});

		it('scales the base quantity by the servings ratio and appends the unit', () => {
			// 100g base × (4 servings / 2 base) = 200g
			expect((component as any).formatQty(100, 'g')).toBe('200 g');
		});

		it('omits the unit when passed an empty string', () => {
			expect((component as any).formatQty(100, '')).toBe('200');
		});
	});

	// ── formatQtyNum ──────────────────────────────────────────────────────

	describe('formatQtyNum', () => {
		it('delegates to formatQty with an empty unit', () => {
			(component as any).selectedRecipe = { baseServings: 1 };
			(component as any).servings = 1;
			expect((component as any).formatQtyNum(50)).toBe('50');
		});
	});

	// ── isNumericUnit ─────────────────────────────────────────────────────

	describe('isNumericUnit', () => {
		it('returns true for a numeric string unit', () => {
			expect((component as any).isNumericUnit('1')).toBeTrue();
		});

		it('returns false for a real unit label', () => {
			expect((component as any).isNumericUnit('g')).toBeFalse();
		});
	});

	// ── toggleStepDone ────────────────────────────────────────────────────

	describe('toggleStepDone', () => {
		it('toggles step.done to true', () => {
			const step = { text: '', done: false, subs: [] };
			const event = { target: { closest: () => null } } as unknown as Event;
			(component as any).toggleStepDone(step, event);
			expect(step.done).toBeTrue();
		});

		it('does not toggle when the click comes from inside .substeps', () => {
			const step = { text: '', done: false, subs: [] };
			const event = { target: { closest: (sel: string) => (sel === '.substeps' ? {} : null) } } as unknown as Event;
			(component as any).toggleStepDone(step, event);
			expect(step.done).toBeFalse();
		});
	});

	// ── addEditorIngredient / addEditorStep ───────────────────────────────

	describe('addEditorIngredient', () => {
		it('appends a new blank ingredient of the active type', () => {
			(component as any).editorIngredients = [];
			(component as any).selectedEditorType = RECIPE_ITYPE_VEG as IngredientType;
			(component as any).addEditorIngredient();
			expect((component as any).editorIngredients.length).toBe(1);
			expect((component as any).editorIngredients[0].type).toBe(RECIPE_ITYPE_VEG);
		});
	});

	describe('addEditorStep', () => {
		it('appends a new blank step', () => {
			(component as any).editorSteps = [];
			(component as any).addEditorStep();
			expect((component as any).editorSteps.length).toBe(1);
		});
	});

	// ── editorIngredientCount / editorStepCount ───────────────────────────

	describe('editorIngredientCount', () => {
		it('counts only ingredients with a non-empty name', () => {
			(component as any).editorIngredients = [
				{ type: RECIPE_ITYPE_VEG, name: 'Carrot', qty: '', unit: '' },
				{ type: RECIPE_ITYPE_VEG, name: '', qty: '', unit: '' }
			];
			expect((component as any).editorIngredientCount).toBe(1);
		});
	});

	describe('editorStepCount', () => {
		it('returns the total number of steps', () => {
			(component as any).editorSteps = [{ text: 'a', subs: [] }, { text: 'b', subs: [] }];
			expect((component as any).editorStepCount).toBe(2);
		});
	});

	// ── onEditorNameInput ─────────────────────────────────────────────────

	describe('onEditorNameInput', () => {
		it('clears editorNameInvalid when a non-empty name is entered', () => {
			(component as any).editorNameInvalid = true;
			(component as any).editorName = 'Pasta';
			(component as any).onEditorNameInput();
			expect((component as any).editorNameInvalid).toBeFalse();
		});

		it('leaves editorNameInvalid true when name is still empty', () => {
			(component as any).editorNameInvalid = true;
			(component as any).editorName = '   ';
			(component as any).onEditorNameInput();
			expect((component as any).editorNameInvalid).toBeTrue();
		});
	});

	// ── onEditorUnitInput ─────────────────────────────────────────────────

	describe('onEditorUnitInput', () => {
		it('clears editorIngredientInvalid once all qty-without-unit violations are resolved', () => {
			(component as any).editorIngredientInvalid = true;
			(component as any).editorIngredients = []; // no violations
			(component as any).onEditorUnitInput();
			expect((component as any).editorIngredientInvalid).toBeFalse();
		});

		it('leaves the flag set when violations remain', () => {
			(component as any).editorIngredientInvalid = true;
			(component as any).editorIngredients = [{ name: 'Carrot', qty: '100', unit: '' }];
			(component as any).onEditorUnitInput();
			expect((component as any).editorIngredientInvalid).toBeTrue();
		});
	});

	// ── onUnitFocus ───────────────────────────────────────────────────────

	describe('onUnitFocus', () => {
		it('sets the unitFocused flag to true', () => {
			(component as any).unitFocused = false;
			(component as any).onUnitFocus();
			expect((component as any).unitFocused).toBeTrue();
		});
	});

	// ── filterUnits ───────────────────────────────────────────────────────

	describe('filterUnits', () => {
		it('returns the full options list when query is empty', () => {
			(component as any).filterUnits({ query: '' });
			expect((component as any).editorUnitSuggestions).toEqual(RECIPE_UNIT_OPTIONS);
		});

		it('filters to prefix matches when a query is provided', () => {
			(component as any).filterUnits({ query: 'g' });
			const results: string[] = (component as any).editorUnitSuggestions;
			expect(results.every((u: string) => u.toLowerCase().startsWith('g'))).toBeTrue();
		});

		it('returns the full list and resets unitFocused when triggered by focus', () => {
			(component as any).unitFocused = true;
			(component as any).filterUnits({ query: 'g' });
			expect((component as any).unitFocused).toBeFalse();
			expect((component as any).editorUnitSuggestions).toEqual(RECIPE_UNIT_OPTIONS);
		});
	});

	// ── filteredRecipes ───────────────────────────────────────────────────

	describe('filteredRecipes', () => {
		it('returns all recipes when category is ALL and query is empty', () => {
			(component as any).recipes = [
				{ name: 'Pasta', category: 'Italian', baseServings: 2 },
				{ name: 'Tacos', category: 'Mexican', baseServings: 2 }
			];
			(component as any).selectedCategory = RECIPE_CATEGORY_ALL;
			(component as any).searchQuery = '';
			expect((component as any).filteredRecipes.length).toBe(2);
		});

		it('filters by category', () => {
			(component as any).recipes = [
				{ name: 'Pasta', category: 'Italian', baseServings: 2 },
				{ name: 'Tacos', category: 'Mexican', baseServings: 2 }
			];
			(component as any).selectedCategory = 'Italian';
			(component as any).searchQuery = '';
			expect((component as any).filteredRecipes.length).toBe(1);
		});

		it('filters by search query (case-insensitive)', () => {
			(component as any).recipes = [
				{ name: 'Pasta Carbonara', category: 'Italian', baseServings: 2 },
				{ name: 'Tacos', category: 'Mexican', baseServings: 2 }
			];
			(component as any).selectedCategory = RECIPE_CATEGORY_ALL;
			(component as any).searchQuery = 'pasta';
			expect((component as any).filteredRecipes.length).toBe(1);
		});
	});

	// ── selectCategory / selectEditorType ─────────────────────────────────

	describe('selectCategory', () => {
		it('updates the active category', () => {
			(component as any).selectCategory('Italian');
			expect((component as any).selectedCategory).toBe('Italian');
		});

		it('resets to ALL when the sentinel constant is passed', () => {
			(component as any).selectedCategory = 'Italian';
			(component as any).selectCategory(RECIPE_CATEGORY_ALL);
			expect((component as any).selectedCategory).toBe(RECIPE_CATEGORY_ALL);
		});
	});

	describe('selectEditorType', () => {
		it('updates the active editor ingredient type', () => {
			(component as any).selectEditorType(RECIPE_ITYPE_MEAT as IngredientType);
			expect((component as any).selectedEditorType).toBe(RECIPE_ITYPE_MEAT);
		});

		it('updates to veg type', () => {
			(component as any).selectEditorType(RECIPE_ITYPE_VEG as IngredientType);
			expect((component as any).selectedEditorType).toBe(RECIPE_ITYPE_VEG);
		});
	});
});
