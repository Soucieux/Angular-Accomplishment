/** Genre option shape used by the add-movie dialog genre selector. */
export interface MovieGenre {
	genre: string;
}

/** Cycling pin colours for corkboard category cards, by card index. */
export const ENT_CORK_PIN_COLORS: string[] = [
	'#ef4444',
	'#3b82f6',
	'#22c55e',
	'#f59e0b',
	'#8b5cf6',
	'#ec4899',
	'#14b8a6'
];

/** Rotation amounts in degrees for corkboard category cards, cycling by card index. */
export const ENT_CORK_ROTATIONS: number[] = [-2.4, 1.9, -1.3, 2.6, -0.7, 1.5, -2.1];

/** Milliseconds before the first movie card's entrance animation starts. */
export const ENT_MOVIE_ENTRANCE_BASE_DELAY_MS = 50;

/** Milliseconds of entrance-animation delay added per movie card position. */
export const ENT_MOVIE_ENTRANCE_STEP_MS = 35;

/** Upper bound on entrance-animation delay so long movie lists don't wait too long to appear. */
export const ENT_MOVIE_ENTRANCE_MAX_DELAY_MS = 400;

/** Available movie genres for the add-movie dialog genre selector. */
export const MOVIE_GENRES: MovieGenre[] = [
	{ genre: '刑侦' },
	{ genre: '古装' },
	{ genre: '悬疑' },
	{ genre: '校园' },
	{ genre: '现代' },
	{ genre: '谍战' }
];
