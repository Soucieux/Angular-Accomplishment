import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDialogComponent } from './confirm.component';

describe('ConfirmDialogComponent', () => {
	let component: ConfirmDialogComponent;
	let fixture: ComponentFixture<ConfirmDialogComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ConfirmDialogComponent]
		}).compileComponents();

		fixture = TestBed.createComponent(ConfirmDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	// ── openDialog ─────────────────────────────────────────────────────────

	describe('openDialog', () => {
		it('calls confirmationService.confirm with the correct message and header', () => {
			const confirmSpy = spyOn((component as any).confirmationService, 'confirm');
			const cb = async () => {};
			component.openDialog(cb, ['Are you sure?', 'Confirm Action', 'Delete']);

			expect(confirmSpy).toHaveBeenCalledWith(
				jasmine.objectContaining({ message: 'Are you sure?', header: 'Confirm Action' })
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
