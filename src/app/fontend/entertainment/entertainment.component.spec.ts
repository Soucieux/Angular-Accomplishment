import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { EntertainmentComponent } from './entertainment.component';

describe('EntertainmentComponent', () => {
  let component: EntertainmentComponent;
  let fixture: ComponentFixture<EntertainmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntertainmentComponent],
      providers: [MessageService]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EntertainmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

	// ── calculateFontSize ──────────────────────────────────────────────────

	describe('calculateFontSize', () => {
		beforeEach(() => {
			spyOn((component as any).utilities, 'isMobile').and.returnValue(false);
		});

		it('returns "23px" for names of 9 characters or fewer (desktop)', () => {
			expect((component as any).calculateFontSize(9)).toBe('23px');
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
		it('sets the selected genre when it is not currently active', () => {
			(component as any).filterByGenre('Action');
			expect((component as any).selectedGenres$.getValue()).toBe('Action');
		});

		it('clears the genre when the same genre is selected again', () => {
			(component as any).selectedGenres$.next('Action');
			(component as any).filterByGenre('Action');
			expect((component as any).selectedGenres$.getValue()).toBe('');
		});
	});
});
