export class PasswordTooWeakError extends Error {
	constructor() {
		super('New password is not strong enough.');
	}
}
