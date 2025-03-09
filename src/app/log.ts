export class LOG {
	private static getTimestamp(): string {
		const now = new Date();
		return `[${now.getFullYear()}-${
			now.getMonth() + 1
		}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}:${now.getMilliseconds()}]`;
	}

	static info(className: string, message: string) {
		console.info(LOG.getTimestamp() + '[INFO]' + className + '-' + message);
	}

	static warn(className: string, message: string) {
		console.warn(LOG.getTimestamp() + '[WARNING]' + className + '-' + message);
	}

	static error(className: string, message: string, error: Error) {
		if (error) {
			console.error(LOG.getTimestamp() + '[ERROR]' + className + '-' + message + ': ' + error.message);
		} else {
			console.error(LOG.getTimestamp() + '[ERROR] ' + className + '-' + message);
		}
	}
}
