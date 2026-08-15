import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetryDialogComponent } from './retry.component';

describe('RetryDialogComponent', () => {
	let component: RetryDialogComponent;
	let fixture: ComponentFixture<RetryDialogComponent>;

	/**
	 * Invokes the template-bound retry handler, which is protected on the component.
	 *
	 * @returns Nothing; the handler's effects are asserted through the closed$ emissions.
	 */
	function clickRetry(): void {
		(component as unknown as { onRetry: () => void }).onRetry();
	}

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RetryDialogComponent]
		}).compileComponents();

		fixture = TestBed.createComponent(RetryDialogComponent);
		component = fixture.componentInstance;
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('emits closed when the awaited data resolves it, so the dialog service destroys the ref', () => {
		const closed = jasmine.createSpy('closed');
		component.closed$.subscribe(closed);

		component.openDialog('Connection Lost...');
		component.resolve();

		expect(closed).toHaveBeenCalledTimes(1);
	});

	/* The un-latched branch calls window.location.reload(), which would tear down the test runner, so
	   it is deliberately left uncovered. This asserts the branch that must never reach that call: a
	   click landing after the data arrived. A regression here re-enters the reload path and fails the
	   run outright rather than passing quietly. */
	it('ignores a retry click that lands after the data has already arrived', () => {
		const closed = jasmine.createSpy('closed');
		component.closed$.subscribe(closed);

		component.openDialog('Connection Lost...');
		component.resolve();
		clickRetry();

		expect(closed).toHaveBeenCalledTimes(1);
	});
});
