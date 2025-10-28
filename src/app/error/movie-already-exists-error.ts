export class MovieAlreadyExistsError extends Error {
	constructor(movieTitle: string) {
		super(`Movie ${movieTitle} already exists in the database`);
	}
}
