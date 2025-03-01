export class LOG {
	static info(className: string, message: string) {
		console.info('[INFO]' + ' ' + className + ' - ' + message);
	}

	static warn(className: string, message: string) {
		console.warn('[WARNING]' + ' ' + className + ' - ' + message);
	}

	static error(className: string, message: string, error?: Error) {
		if (error) {
			console.error('[ERROR] ' + className + ' - ' + message + ': ' + error.message);
		} else {
			console.error('[ERROR] ' + className + ' - ' + message);
		}
	}
}
