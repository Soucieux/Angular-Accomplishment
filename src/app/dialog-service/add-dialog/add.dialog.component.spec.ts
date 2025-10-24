import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDialogComponent } from './add.dialog.component';

describe('AddMovieDialogComponent', () => {
	let component: AddDialogComponent;
	let fixture: ComponentFixture<AddDialogComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AddDialogComponent]
		}).compileComponents();

		fixture = TestBed.createComponent(AddDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
