export class InvalidEmailError extends Error {
	constructor() {
		super('The email address format is invalid.');
	}
}
