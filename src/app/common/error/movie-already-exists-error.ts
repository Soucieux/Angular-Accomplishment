export class MovieAlreadyExistsError extends Error {
	constructor(movieName: string) {
		super(`Movie ${movieName} already exists in the database`);
	}
}
