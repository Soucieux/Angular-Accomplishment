import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorDialogComponent } from './error.component';

describe('ErrorDialogComponent', () => {
	let component: ErrorDialogComponent;
	let fixture: ComponentFixture<ErrorDialogComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ErrorDialogComponent]
		}).compileComponents();

		fixture = TestBed.createComponent(ErrorDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	// ── openDialog ─────────────────────────────────────────────────────────

	describe('openDialog', () => {
		it('calls confirmationService.confirm with the error message', () => {
			const confirmSpy = spyOn((component as any).confirmationService, 'confirm');
			component.openDialog('Something went wrong');

			expect(confirmSpy).toHaveBeenCalledWith(
				jasmine.objectContaining({ message: jasmine.stringContaining('Something went wrong') })
			);
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
	});
});
