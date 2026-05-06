export class wrongVerificationCodeError extends Error {
	constructor() {
		super(`Verification code is incorrect or expired`);
	}
}
