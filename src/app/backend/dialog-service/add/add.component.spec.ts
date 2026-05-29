import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { MOVIE_GENRES } from '../../../common/app.constant';
import { MovieItemVO } from '../../../fontend/entertainment/movieItem.vo';
import { AddDialogComponent } from './add.component';

describe('AddMovieDialogComponent', () => {
	let component: AddDialogComponent;
	let fixture: ComponentFixture<AddDialogComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AddDialogComponent],
			providers: [MessageService]
		}).compileComponents();

		fixture = TestBed.createComponent(AddDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	// ── ngOnInit ───────────────────────────────────────────────────────────

	describe('ngOnInit', () => {
		it('populates years with 8 entries', () => {
			expect((component as any).years?.length).toBe(8);
		});

		it('populates years starting with the current year', () => {
			const currentYear = new Date().getFullYear().toString();
			expect((component as any).years?.[0]?.year).toBe(currentYear);
		});

		it('populates genres from MOVIE_GENRES', () => {
			expect((component as any).genres).toEqual(MOVIE_GENRES);
		});
	});

	// ── openDialog ─────────────────────────────────────────────────────────

	describe('openDialog', () => {
		it('sets visible to true', () => {
			component.openDialog(() => {}, async () => new Blob());
			expect((component as any).visible).toBeTrue();
		});

		it('stores the submit callback', () => {
			const cb = jasmine.createSpy('submit');
			component.openDialog(cb, async () => new Blob());
			expect((component as any).submitCallback).toBe(cb);
		});
	});

	// ── canSubmit state ────────────────────────────────────────────────────

	describe('canSubmit state', () => {
		it('resets canSubmit to false when onIdChange is called with a value', () => {
			(component as any).canSubmit = true;
			(component as any).onIdChange('12345');
			expect((component as any).canSubmit).toBeFalse();
		});

		it('resets canSubmit to false when onNameAndYearChange is called', () => {
			(component as any).canSubmit = true;
			(component as any).onNameAndYearChange();
			expect((component as any).canSubmit).toBeFalse();
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

	// ── onSubmit ───────────────────────────────────────────────────────────

	describe('onSubmit', () => {
		it('calls the submit callback with the movie VO', () => {
			const submitCb = jasmine.createSpy('submit');
			component.openDialog(submitCb, async () => new Blob());
			(component as any).onSubmit();
			expect(submitCb).toHaveBeenCalledWith(jasmine.any(MovieItemVO));
		});

		it('closes the dialog', () => {
			component.openDialog(() => {}, async () => new Blob());
			(component as any).onSubmit();
			expect((component as any).visible).toBeFalse();
		});
	});
});
