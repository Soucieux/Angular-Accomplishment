export class LOG {
	/**
	 * Get the current timestamp formatted for log output.
	 *
	 * @returns A formatted timestamp string like "[YYYY-M-D HH:mm:ss:ms]".
	 */
	private static getTimestamp(): string {
		const now = new Date();
		return `[${now.getFullYear()}-${
			now.getMonth() + 1
		}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}:${now.getMilliseconds()}]`;
	}

	/**
	 * Log an informational message to the console.
	 *
	 * @param className - The name of the class emitting the log.
	 * @param message - The message to log.
	 */
	public static info(className: string, message: string) {
		console.info(LOG.getTimestamp() + '[INFO] ' + className + '-' + message);
	}

	/**
	 * Log a warning message to the console.
	 *
	 * @param className - The name of the class emitting the log.
	 * @param message - The warning message to log.
	 */
	public static warn(className: string, message: string) {
		console.warn(LOG.getTimestamp() + '[WARNING] ' + className + '-' + message);
	}

	/**
	 * Log an error message to the console with an optional Error object.
	 *
	 * @param className - The name of the class emitting the log.
	 * @param message - The error summary.
	 * @param error - An optional Error object whose message is appended to the log.
	 */
	public static error(className: string, message: string, error?: Error) {
		if (error) {
			console.error(LOG.getTimestamp() + '[ERROR] ' + className + '-' + message + ': ' + error.message);
		} else {
			console.error(LOG.getTimestamp() + '[ERROR] ' + className + '-' + message);
		}
	}
}
