import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RECIPE_EDITOR_TYPE_MAX, RECIPE_ITYPE_MEAT, RECIPE_ITYPE_VEG } from '../../../common/app.constant';
import { IngredientType } from '../../../fontend/recipe/recipe.model';
import { RecipeTypeDialogComponent } from './recipe-type.component';

describe('RecipeTypeDialogComponent', () => {
	let component: RecipeTypeDialogComponent;
	let fixture: ComponentFixture<RecipeTypeDialogComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RecipeTypeDialogComponent]
		}).compileComponents();

		fixture = TestBed.createComponent(RecipeTypeDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	// ── openDialog ─────────────────────────────────────────────────────────

	describe('openDialog', () => {
		it('sets visible to true', () => {
			component.openDialog(() => {}, { masterTabs: [], enabledTypeIds: new Set() });
			expect((component as any).visible).toBeTrue();
		});

		it('initialises draft from the provided enabledTypeIds', () => {
			const enabledTypeIds = new Set<IngredientType>([RECIPE_ITYPE_VEG, RECIPE_ITYPE_MEAT]);
			component.openDialog(() => {}, { masterTabs: [], enabledTypeIds });
			expect((component as any).draft.has(RECIPE_ITYPE_VEG)).toBeTrue();
			expect((component as any).draft.has(RECIPE_ITYPE_MEAT)).toBeTrue();
		});
	});

	// ── canAddMore ─────────────────────────────────────────────────────────

	describe('canAddMore', () => {
		it('returns true when draft size is below the maximum', () => {
			(component as any).draft = new Set<IngredientType>([RECIPE_ITYPE_VEG]);
			expect((component as any).canAddMore()).toBeTrue();
		});

		it('returns false when draft size equals the maximum', () => {
			// MASTER_TYPE_TABS has 16 types; RECIPE_EDITOR_TYPE_MAX = 9 — supply 10+ so slice(0, 9) hits the cap.
			const types: IngredientType[] = ['veg', 'meat', 'seas', 'dairy', 'grain', 'liq', 'spice', 'seafood', 'egg', 'nut'];
			(component as any).draft = new Set<IngredientType>(types.slice(0, RECIPE_EDITOR_TYPE_MAX));
			expect((component as any).canAddMore()).toBeFalse();
		});
	});

	// ── toggleType ─────────────────────────────────────────────────────────

	describe('toggleType', () => {
		it('adds a type when it is not in the draft', () => {
			(component as any).draft = new Set<IngredientType>([RECIPE_ITYPE_VEG]);
			(component as any).toggleType(RECIPE_ITYPE_MEAT);
			expect((component as any).draft.has(RECIPE_ITYPE_MEAT)).toBeTrue();
		});

		it('removes a type when it is in the draft and at least one other remains', () => {
			(component as any).draft = new Set<IngredientType>([RECIPE_ITYPE_VEG, RECIPE_ITYPE_MEAT]);
			(component as any).toggleType(RECIPE_ITYPE_MEAT);
			expect((component as any).draft.has(RECIPE_ITYPE_MEAT)).toBeFalse();
		});

		it('does not remove the last remaining type', () => {
			(component as any).draft = new Set<IngredientType>([RECIPE_ITYPE_VEG]);
			(component as any).toggleType(RECIPE_ITYPE_VEG);
			expect((component as any).draft.has(RECIPE_ITYPE_VEG)).toBeTrue();
		});
	});

	// ── apply ──────────────────────────────────────────────────────────────

	describe('apply', () => {
		it('calls the apply callback with a copy of the draft', () => {
			const cb = jasmine.createSpy('applyCallback');
			const enabledTypeIds = new Set<IngredientType>([RECIPE_ITYPE_VEG]);
			component.openDialog(cb, { masterTabs: [], enabledTypeIds });
			(component as any).apply();
			expect(cb).toHaveBeenCalledWith(jasmine.any(Set));
			const received: Set<IngredientType> = cb.calls.mostRecent().args[0];
			expect(received.has(RECIPE_ITYPE_VEG)).toBeTrue();
		});

		it('closes the dialog after applying', () => {
			component.openDialog(() => {}, { masterTabs: [], enabledTypeIds: new Set() });
			(component as any).apply();
			expect((component as any).visible).toBeFalse();
		});
	});

	// ── cancel ─────────────────────────────────────────────────────────────

	describe('cancel', () => {
		it('closes the dialog without calling the apply callback', () => {
			const cb = jasmine.createSpy('applyCallback');
			component.openDialog(cb, { masterTabs: [], enabledTypeIds: new Set() });
			(component as any).cancel();
			expect(cb).not.toHaveBeenCalled();
			expect((component as any).visible).toBeFalse();
		});
	});

	// ── onDialogClosed ─────────────────────────────────────────────────────

	describe('onDialogClosed', () => {
		it('emits the closed$ event', () => {
			let emitted = false;
			component.closed$.subscribe(() => (emitted = true));
			(component as any).onDialogClosed();
			expect(emitted).toBeTrue();
		});

		it('sets visible to false', () => {
			(component as any).visible = true;
			(component as any).onDialogClosed();
			expect((component as any).visible).toBeFalse();
		});
	});
});
