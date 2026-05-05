export class MovieIdNotFoundError extends Error {
	constructor(movieName: string) {
		super(`Movie ID for ${movieName} is not found\nPlease try again or enter manually`);
	}
}
