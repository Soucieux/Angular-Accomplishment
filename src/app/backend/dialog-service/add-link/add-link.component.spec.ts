import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AddLinkDialogComponent } from './add-link.component';
import { DatabaseService } from '../../database-service/database.service';

describe('AddLinkDialogComponent', () => {
	let component: AddLinkDialogComponent;
	let fixture: ComponentFixture<AddLinkDialogComponent>;
	let mockDb: jasmine.SpyObj<DatabaseService>;

	beforeEach(async () => {
		mockDb = jasmine.createSpyObj<DatabaseService>('DatabaseService', [
			'getLinkCategories',
			'proxyFetch'
		]);
		mockDb.getLinkCategories.and.returnValue(of([]));
		mockDb.proxyFetch.and.returnValue(Promise.resolve({ content: '', contentType: '' }));

		await TestBed.configureTestingModule({
			imports: [AddLinkDialogComponent],
			providers: [
				{ provide: DatabaseService, useValue: mockDb }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(AddLinkDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	// ── isValid ─────────────────────────────────────────────────────────────────

	describe('isValid', () => {
		it('returns false when url is empty', () => {
			(component as any).url = '';
			(component as any).title = 'Angular';
			(component as any).category = 'dev';
			expect((component as any).isValid).toBeFalse();
		});

		it('returns false when title is empty', () => {
			(component as any).url = 'https://angular.io';
			(component as any).title = '';
			(component as any).category = 'dev';
			expect((component as any).isValid).toBeFalse();
		});

		it('returns false when category is empty', () => {
			(component as any).url = 'https://angular.io';
			(component as any).title = 'Angular';
			(component as any).category = '';
			expect((component as any).isValid).toBeFalse();
		});

		it('returns true when url, title, and category are all non-empty', () => {
			(component as any).url = 'https://angular.io';
			(component as any).title = 'Angular';
			(component as any).category = 'dev';
			expect((component as any).isValid).toBeTrue();
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
			component.openDialog(() => {}, { url: 'https://example.com', title: 'Example', category: 'dev' });
			expect((component as any).isEditMode).toBeTrue();
		});

		it('pre-fills url and title from prefill data', () => {
			component.openDialog(() => {}, { url: 'https://example.com', title: 'Example', category: 'dev' });
			expect((component as any).url).toBe('https://example.com');
			expect((component as any).title).toBe('Example');
		});

		it('resets fields in add mode', () => {
			(component as any).url = 'https://old.com';
			(component as any).title = 'Old';
			component.openDialog(() => {}, null);
			expect((component as any).url).toBe('');
			expect((component as any).title).toBe('');
		});
	});

	// ── onSubmit ────────────────────────────────────────────────────────────────

	describe('onSubmit', () => {
		it('does nothing when form is invalid', () => {
			const callback = jasmine.createSpy('callback');
			component.openDialog(callback, null);
			(component as any).url = '';
			(component as any).onSubmit();
			expect(callback).not.toHaveBeenCalled();
		});

		it('invokes the callback with the normalized form data', () => {
			const callback = jasmine.createSpy('callback');
			component.openDialog(callback, null);
			(component as any).url = 'https://angular.io';
			(component as any).title = 'Angular';
			(component as any).category = 'dev';
			(component as any).isPinned = false;
			(component as any).onSubmit();
			expect(callback).toHaveBeenCalledWith(
				jasmine.objectContaining({
					title: 'Angular',
					category: 'dev',
					isPinned: false
				})
			);
		});

		it('closes the dialog once the callback settles', async () => {
			const callback = jasmine.createSpy('callback');
			component.openDialog(callback, null);
			(component as any).url = 'https://angular.io';
			(component as any).title = 'Angular';
			(component as any).category = 'dev';
			await (component as any).onSubmit();
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
