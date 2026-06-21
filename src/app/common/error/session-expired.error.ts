export class SessionExpiredError extends Error {
	constructor() {
		super('Your session has expired. Please sign in again and retry.');
	}
}
