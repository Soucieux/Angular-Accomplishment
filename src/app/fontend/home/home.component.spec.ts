import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
	GENRE_FAVOURITE,
	HISTORY_STATUS_ADDED,
	HISTORY_STATUS_DELETED,
	HOME_LINKS_TILE_0,
	HOME_LINKS_TILE_1,
	HOME_LINKS_TILE_2,
	HOME_LINKS_TILE_3,
	STATS_FIELD_REMINDER_UPCOMING
} from '../../common/app.constant';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
	let component: HomeComponent;
	let fixture: ComponentFixture<HomeComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [HomeComponent]
		}).compileComponents();

		fixture = TestBed.createComponent(HomeComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	// ── tileColor ──────────────────────────────────────────────────────────

	describe('tileColor', () => {
		it('returns the first colour for index 0', () => {
			expect((component as any).getTileColor(0)).toBe(HOME_LINKS_TILE_0);
		});

		it('returns the second colour for index 1', () => {
			expect((component as any).getTileColor(1)).toBe(HOME_LINKS_TILE_1);
		});

		it('returns the third colour for index 2', () => {
			expect((component as any).getTileColor(2)).toBe(HOME_LINKS_TILE_2);
		});

		it('returns the fourth colour for index 3', () => {
			expect((component as any).getTileColor(3)).toBe(HOME_LINKS_TILE_3);
		});

		it('wraps around after 4 tiles (index 4 → same as index 0)', () => {
			expect((component as any).getTileColor(4)).toBe(HOME_LINKS_TILE_0);
		});
	});

	// ── tileRotation ───────────────────────────────────────────────────────

	describe('tileRotation', () => {
		it('returns a CSS rotation string ending with "deg"', () => {
			expect((component as any).getTileRotation(0)).toMatch(/^-?\d+(\.\d+)?deg$/);
		});

		it('cycles through 4 distinct rotations', () => {
			const rotations = [0, 1, 2, 3].map(i => (component as any).getTileRotation(i));
			const unique = new Set(rotations);
			expect(unique.size).toBe(4);
		});

		it('wraps around after 4 tiles (index 4 → same as index 0)', () => {
			expect((component as any).getTileRotation(4)).toBe((component as any).getTileRotation(0));
		});
	});

	// ── getLastMovieActivity ───────────────────────────────────────────────

	describe('getLastMovieActivity', () => {
		it('returns null when neither lastAdded nor lastDeleted are set', () => {
			(component as any).stats = {};
			expect((component as any).getLastMovieActivity()).toBeNull();
		});

		it('returns the added entry when only lastAdded is set', () => {
			(component as any).stats = {
				lastAdded: { title: 'Inception', timestamp: '2024.01.01 10:00:00' }
			};
			const result = (component as any).getLastMovieActivity();
			expect(result?.type).toBe(HISTORY_STATUS_ADDED);
			expect(result?.title).toBe('Inception');
		});

		it('returns the more recent entry when both are set', () => {
			(component as any).stats = {
				lastAdded:   { title: 'A', timestamp: '2024.01.01 09:00:00' },
				lastDeleted: { title: 'B', timestamp: '2024.06.01 09:00:00' }
			};
			expect((component as any).getLastMovieActivity()?.type).toBe(HISTORY_STATUS_DELETED);
		});
	});

	// ── getOverdueCount ────────────────────────────────────────────────────

	describe('getOverdueCount', () => {
		it('counts only items whose date is in the past', () => {
			(component as any).stats = {
				[STATS_FIELD_REMINDER_UPCOMING]: [
					{ date: '2020-01-01' },
					{ date: '2099-01-01' }
				]
			};
			expect((component as any).getOverdueCount()).toBe(1);
		});
	});

	// ── getGenreData ───────────────────────────────────────────────────────

	describe('getGenreData', () => {
		it('returns an empty array when stats is null', () => {
			(component as any).stats = null;
			expect((component as any).getGenreData()).toEqual([]);
		});

		it('excludes GENRE_FAVOURITE and zero-count genres', () => {
			(component as any).stats = {
				genre: { Action: 5, Comedy: 3, [GENRE_FAVOURITE]: 2, Drama: 0 }
			};
			const result = (component as any).getGenreData();
			expect(result.every((r: any) => r.label !== GENRE_FAVOURITE)).toBeTrue();
			expect(result.every((r: any) => r.count > 0)).toBeTrue();
		});

		it('normalises percentages so the top genre is 100%', () => {
			(component as any).stats = { genre: { Action: 10, Comedy: 5 } };
			const result = (component as any).getGenreData();
			expect(result[0].pct).toBe(100);
			expect(result[1].pct).toBe(50);
		});
	});

	// ── getWeekDays ────────────────────────────────────────────────────────

	describe('getWeekDays', () => {
		it('returns exactly 7 day entries', () => {
			(component as any).stats = { [STATS_FIELD_REMINDER_UPCOMING]: [] };
			expect((component as any).getWeekDays().length).toBe(7);
		});
	});

	// ── getRecentActivity ─────────────────────────────────────────────────

	describe('getRecentActivity', () => {
		it('returns an empty array when stats has no activity fields', () => {
			(component as any).stats = {};
			expect((component as any).getRecentActivity()).toEqual([]);
		});
	});
});
