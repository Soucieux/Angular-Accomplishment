import {
	ComponentFixture,
	TestBed,
	fakeAsync,
	flushMicrotasks,
	tick
} from '@angular/core/testing';
import { of } from 'rxjs';

import { AddLinkDialogComponent } from './add-link.component';
import { DatabaseService } from '../../database-service/database.service';
import { PORTAL_TITLE_FETCH_TIMEOUT_MS } from '../../../common/constants';

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

	// ── onUrlConfirm ────────────────────────────────────────────────────────────

	describe('onUrlConfirm', () => {
		it('extracts the remote page title and clears the loading state', async () => {
			mockDb.proxyFetch.and.resolveTo({
				content: '<html><head><title> Example Site </title></head></html>',
				contentType: 'text/html'
			});
			(component as any).url = 'https://example.com';

			await (component as any).onUrlConfirm();

			expect(mockDb.proxyFetch).toHaveBeenCalledOnceWith('https://example.com');
			expect((component as any).title).toBe('Example Site');
			expect((component as any).metaLoading).toBeFalse();
		});

		it('restores manual title entry and refreshes OnPush state when the fetch fails', async () => {
			const markForCheck = spyOn((component as any).cdr, 'markForCheck');
			mockDb.proxyFetch.and.rejectWith(new Error('metadata unavailable'));
			(component as any).url = 'https://example.com';

			await (component as any).onUrlConfirm();

			expect((component as any).metaLoading).toBeFalse();
			expect(markForCheck).toHaveBeenCalled();
		});

		it('stops waiting at the deadline and does not retry the same URL automatically', fakeAsync(() => {
			mockDb.proxyFetch.and.returnValue(
				new Promise<{ content: string; contentType: string }>(() => {})
			);
			(component as any).url = 'https://example.com';
			let settled = false;

			(component as any).onUrlConfirm().then(() => (settled = true));
			expect((component as any).metaLoading).toBeTrue();

			tick(PORTAL_TITLE_FETCH_TIMEOUT_MS);
			flushMicrotasks();

			expect(settled).toBeTrue();
			expect((component as any).metaLoading).toBeFalse();
			(component as any).onUrlConfirm();
			flushMicrotasks();
			expect(mockDb.proxyFetch).toHaveBeenCalledTimes(1);
		}));

		it('does not apply a late title response after the URL changes', async () => {
			let resolveFetch!: (result: { content: string; contentType: string }) => void;
			mockDb.proxyFetch.and.returnValue(
				new Promise<{ content: string; contentType: string }>((resolve) => {
					resolveFetch = resolve;
				})
			);
			(component as any).url = 'https://first.example';

			const confirmation = (component as any).onUrlConfirm();
			(component as any).url = 'https://second.example';
			resolveFetch({ content: '<title>First Site</title>', contentType: 'text/html' });
			await confirmation;

			expect((component as any).title).toBe('');
			expect((component as any).metaLoading).toBeFalse();
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
