export class WrongCredentialsError extends Error {
	constructor() {
		super('Username or password is incorrect. Please check again.');
	}
}
