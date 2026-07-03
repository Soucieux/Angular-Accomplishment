export class WrongVerificationCodeError extends Error {
	constructor() {
		super('Verification code is incorrect or expired');
	}
}
