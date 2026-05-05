export class MovieFetchFailedError extends Error {
	constructor(movieId: number) {
		super(`Movie ID ${movieId} fetch failed\nPlease try again.`);
	}
}
