import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDebtDialogComponent } from './add-debt.component';
import { NewDebtData } from '../../../fontend/debt/debt.model';

describe('AddDebtDialogComponent', () => {
	let component: AddDebtDialogComponent;
	let fixture: ComponentFixture<AddDebtDialogComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AddDebtDialogComponent]
		}).compileComponents();

		fixture = TestBed.createComponent(AddDebtDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	// ── isValid ─────────────────────────────────────────────────────────────────

	describe('isValid (add mode)', () => {
		beforeEach(() => {
			component.openDialog(() => {}, null);
		});

		it('returns false when name is empty', () => {
			(component as any).name = '';
			(component as any).amount = '100';
			(component as any).selectedCurrency = 'CNY';
			expect((component as any).isValid).toBeFalse();
		});

		it('returns false when amount is negative', () => {
			(component as any).name = 'Rent';
			(component as any).amount = '-5';
			(component as any).selectedCurrency = 'CNY';
			expect((component as any).isValid).toBeFalse();
		});

		it('returns false when currency is not selected', () => {
			(component as any).name = 'Rent';
			(component as any).amount = '100';
			(component as any).selectedCurrency = '';
			expect((component as any).isValid).toBeFalse();
		});

		it('returns true when name, amount, and currency are all valid', () => {
			(component as any).name = 'Rent';
			(component as any).amount = '100';
			(component as any).selectedCurrency = 'CNY';
			expect((component as any).isValid).toBeTrue();
		});

		it('returns true when amount is 0', () => {
			(component as any).name = 'Rent';
			(component as any).amount = '0';
			(component as any).selectedCurrency = 'CNY';
			expect((component as any).isValid).toBeTrue();
		});
	});

	describe('isValid (edit mode)', () => {
		beforeEach(() => {
			component.openDialog(() => {}, { amount: 50, currency: 'CNY' });
		});

		it('returns true when amount is a valid non-negative number', () => {
			(component as any).amount = '200';
			expect((component as any).isValid).toBeTrue();
		});

		it('returns false when amount is negative', () => {
			(component as any).amount = '-1';
			expect((component as any).isValid).toBeFalse();
		});
	});

	// ── openDialog ──────────────────────────────────────────────────────────────

	describe('openDialog', () => {
		it('sets visible to true', () => {
			component.openDialog(() => {}, null);
			expect((component as any).visible).toBeTrue();
		});

		it('sets isEditMode to false in add mode', () => {
			component.openDialog(() => {}, null);
			expect((component as any).isEditMode).toBeFalse();
		});

		it('sets isEditMode to true in edit mode', () => {
			component.openDialog(() => {}, { amount: 100 });
			expect((component as any).isEditMode).toBeTrue();
		});

		it('resets name and amount in add mode', () => {
			(component as any).name = 'Old name';
			(component as any).amount = '999';
			component.openDialog(() => {}, null);
			expect((component as any).name).toBe('');
			expect((component as any).amount).toBe('');
		});

		it('pre-fills amount from prefill data in edit mode', () => {
			component.openDialog(() => {}, { amount: 250.5 });
			expect((component as any).amount).toBe('250.5');
		});
	});

	// ── onSubmit ────────────────────────────────────────────────────────────────

	describe('onSubmit', () => {
		it('does nothing when form is invalid', () => {
			const callback = jasmine.createSpy('callback');
			component.openDialog(callback, null);
			(component as any).name = '';
			(component as any).onSubmit();
			expect(callback).not.toHaveBeenCalled();
		});

		it('invokes the callback with the parsed form data', () => {
			const callback = jasmine.createSpy<(data: NewDebtData) => void>('callback');
			component.openDialog(callback, null);
			(component as any).name = 'Rent';
			(component as any).amount = '500';
			(component as any).selectedCurrency = 'CNY';
			(component as any).dueDateModel = null;
			(component as any).isPermanent = false;
			(component as any).onSubmit();
			expect(callback).toHaveBeenCalledWith(
				jasmine.objectContaining({
					name: 'Rent',
					amount: 500,
					currency: 'CNY',
					isPermanent: false
				})
			);
		});

		it('closes the dialog after a successful submit', () => {
			const callback = jasmine.createSpy('callback');
			component.openDialog(callback, null);
			(component as any).name = 'Rent';
			(component as any).amount = '100';
			(component as any).selectedCurrency = 'CNY';
			(component as any).dueDateModel = null;
			(component as any).onSubmit();
			expect((component as any).visible).toBeFalse();
		});
	});

	// ── onDialogClosed ──────────────────────────────────────────────────────────

	describe('onDialogClosed', () => {
		it('sets visible to false and emits closed$', () => {
			let emitted = false;
			component.closed$.subscribe(() => (emitted = true));
			(component as any).visible = true;
			(component as any).onDialogClosed();
			expect((component as any).visible).toBeFalse();
			expect(emitted).toBeTrue();
		});
	});
});
