import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';

import { DatabaseService } from '../../backend/database-service/database.service';
import { EntertainmentComponent } from './entertainment.component';

describe('EntertainmentComponent', () => {
  let component: EntertainmentComponent;
  let fixture: ComponentFixture<EntertainmentComponent>;

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

    await TestBed.configureTestingModule({
      imports: [EntertainmentComponent],
      providers: [
        MessageService,
        { provide: DatabaseService, useValue: mockDb }
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
});
