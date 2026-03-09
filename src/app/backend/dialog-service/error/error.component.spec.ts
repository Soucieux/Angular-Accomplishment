import { TestBed } from '@angular/core/testing';

import { ErrorDialogComponent } from './error.component';

describe('ErrorService', () => {
	let service: ErrorDialogComponent;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(ErrorDialogComponent);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
