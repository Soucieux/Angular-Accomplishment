import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMovieDialogComponent } from './add.dialog.component';

describe('AddMovieDialogComponent', () => {
	let component: AddMovieDialogComponent;
	let fixture: ComponentFixture<AddMovieDialogComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AddMovieDialogComponent]
		}).compileComponents();

		fixture = TestBed.createComponent(AddMovieDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
