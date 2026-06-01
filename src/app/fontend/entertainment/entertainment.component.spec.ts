import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';

import { DatabaseService } from '../../backend/database-service/database.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { EntertainmentComponent } from './entertainment.component';
import { MovieItemVO } from './movieItem.vo';

describe('EntertainmentComponent', () => {
  let component: EntertainmentComponent;
  let fixture: ComponentFixture<EntertainmentComponent>;
  let mockDialogService: jasmine.SpyObj<DialogService>;

  beforeEach(async () => {
    const mockDb = jasmine.createSpyObj('DatabaseService', [
      'getStatistics', 'getMovieList', 'getHistory',
      'updateHistoryWithNewSearchActivity', 'updateMovieRate', 'updateMovieGenre',
      'updateMovieFavourite', 'addNewMovieDataAndUpdateStatistics', 'removeMovieFromDatabase',
      'uploadImageAndGetDownloadLink', 'isMovieAlreadyAdded'
    ]);
    mockDb.getStatistics.and.returnValue(of({}));
    mockDb.getMovieList.and.returnValue(of([]));
    mockDb.getHistory.and.returnValue(of([]));
    mockDb.updateHistoryWithNewSearchActivity.and.returnValue(Promise.resolve());

    mockDialogService = jasmine.createSpyObj<DialogService>('DialogService', [
      'openDialog', 'ensurePermission', 'handleError', 'showUnexpectedError'
    ]);
    mockDialogService.ensurePermission.and.returnValue(true);
    mockDialogService.openDialog.and.stub();

    await TestBed.configureTestingModule({
      imports: [EntertainmentComponent],
      providers: [
        MessageService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: DialogService, useValue: mockDialogService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EntertainmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

	// ── calculateFontSize ──────────────────────────────────────────────────

	describe('calculateFontSize', () => {
		beforeEach(() => {
			spyOn((component as any).utilities, 'isMobile').and.returnValue(false);
		});

		it('returns "23px" for names of 7 characters or fewer (desktop)', () => {
			expect((component as any).calculateFontSize(7)).toBe('23px');
		});

		it('returns a smaller font size for names longer than 9 characters (desktop)', () => {
			const size = parseInt((component as any).calculateFontSize(13), 10);
			expect(size).toBeLessThan(23);
		});
	});

	// ── updateSearchQuery ──────────────────────────────────────────────────

	describe('updateSearchQuery', () => {
		it('pushes the value into searchQuery$', () => {
			(component as any).updateSearchQuery('inception');
			expect((component as any).searchQuery$.getValue()).toBe('inception');
		});
	});

	// ── filterByGenre ──────────────────────────────────────────────────────

	describe('filterByGenre', () => {
		let origStartViewTransition: unknown;

		beforeEach(() => {
			origStartViewTransition = (document as any).startViewTransition;
			// Chrome 131+ makes startViewTransition non-configurable so delete silently fails.
			// Replace with a synchronous stub so toggle() runs before the assertion.
			(document as any).startViewTransition = (cb: () => Promise<void>) => { void cb(); };
		});

		afterEach(() => {
			(document as any).startViewTransition = origStartViewTransition;
		});

		it('sets the selected genre when it is not currently active', fakeAsync(() => {
			(component as any).filterByGenre('Action');
			tick();
			expect((component as any).selectedGenres$.getValue()).toBe('Action');
		}));

		it('clears the genre when the same genre is selected again', fakeAsync(() => {
			(component as any).selectedGenres$.next('Action');
			(component as any).filterByGenre('Action');
			tick();
			expect((component as any).selectedGenres$.getValue()).toBe('');
		}));
	});

	// ── startEdit ──────────────────────────────────────────────────────────

	describe('startEdit', () => {
		let movie: MovieItemVO;

		beforeEach(() => {
			movie = new MovieItemVO('Test Movie', 2024);
			movie.setMovieKey('key1');
			movie.setMovieGenre('Action');
			movie.setOpenId('uid1');
		});

		it('adds the movie to editedItems when permission is granted', () => {
			(component as any).startEdit(movie);
			expect((component as any).editedItems.has('key1')).toBeTrue();
		});

		it('does not add to editedItems when permission is denied', () => {
			mockDialogService.ensurePermission.and.returnValue(false);
			(component as any).startEdit(movie);
			expect((component as any).editedItems.has('key1')).toBeFalse();
		});
	});

	// ── openDeleteConfirmationDialog ───────────────────────────────────────

	describe('openDeleteConfirmationDialog', () => {
		let movie: MovieItemVO;

		beforeEach(() => {
			movie = new MovieItemVO('Test Movie', 2024);
			movie.setMovieKey('key1');
			movie.setOpenId('uid1');
		});

		it('opens the confirm dialog when permission is granted', () => {
			(component as any).openDeleteConfirmationDialog(movie);
			expect(mockDialogService.openDialog).toHaveBeenCalled();
		});

		it('does not open the dialog when permission is denied', () => {
			mockDialogService.ensurePermission.and.returnValue(false);
			(component as any).openDeleteConfirmationDialog(movie);
			expect(mockDialogService.openDialog).not.toHaveBeenCalled();
		});
	});
});
