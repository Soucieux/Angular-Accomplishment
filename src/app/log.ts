export class LOG {
	static info(className: string, message: string) {
		console.info('[INFO]' + ' ' + className + ' - ' + message);
	}

	static warn(className: string, message: string) {
		console.info('[WARNING]' + ' ' + className + ' - ' + message);
	}

	static error(className: string, message: string) {
		console.error('[ERROR]' + ' ' + className + ' - ' + message);
	}
}
