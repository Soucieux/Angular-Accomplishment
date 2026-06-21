export class AccountRateLimitedError extends Error {
	constructor() {
		super('Too many failed attempts. Please wait and try again later.');
	}
}
