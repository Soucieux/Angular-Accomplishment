export class EmailNotVerifiedError extends Error {
	constructor() {
		super('This email address has not been verified.');
	}
}
