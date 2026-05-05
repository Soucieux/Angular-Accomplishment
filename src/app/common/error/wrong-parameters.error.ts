export class WrongParametersError extends Error {
	constructor() {
		super('Parameters do not meet requirements');
	}
}
