export class UserNotFoundError extends Error {
	constructor() {
		super('This email address is not registered. Please check and try again.');
	}
}
