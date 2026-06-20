export class WrongOldPasswordError extends Error {
	constructor() {
		super('Current password is incorrect.');
	}
}
