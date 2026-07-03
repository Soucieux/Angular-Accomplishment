/*
 * Backup entrypoint: CloudBase -> Firebase.
 *
 * Reads every configured collection from CloudBase (admin credentials) and
 * mirrors it into Firebase Realtime Database (admin credentials). Intended to be
 * run on a schedule by .github/workflows/backup.yml.
 *
 * The required-env check runs BEFORE the SDK modules are required, so a run
 * without credentials fails fast and offline instead of touching the network.
 */
const config = require('./config');
const { runBackup } = require('./backup');

const REQUIRED_ENV = [
	'CLOUDBASE_SECRET_ID',
	'CLOUDBASE_SECRET_KEY',
	'CLOUDBASE_ENV_ID',
	'FIREBASE_SERVICE_ACCOUNT',
	'FIREBASE_DATABASE_URL'
];

/**
 * Validates credentials, initialises both SDKs, runs the backup, and exits with
 * a non-zero code if any collection failed.
 *
 * @returns {Promise<void>}
 */
async function main() {
	const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
	if (missing.length > 0) {
		console.error(`Missing required environment variables: ${missing.join(', ')}`);
		process.exit(1);
		return;
	}

	// Required only after the env check so a credential-less run stays offline.
	const cloudbase = require('@cloudbase/node-sdk');
	const admin = require('firebase-admin');

	const cbApp = cloudbase.init({
		secretId: process.env.CLOUDBASE_SECRET_ID,
		secretKey: process.env.CLOUDBASE_SECRET_KEY,
		env: process.env.CLOUDBASE_ENV_ID
	});
	const cbDb = cbApp.database();

	admin.initializeApp({
		credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
		databaseURL: process.env.FIREBASE_DATABASE_URL
	});
	const fbDb = admin.database();

	const summary = await runBackup(config, cbDb, fbDb);
	console.log('Backup summary:', JSON.stringify(summary));

	const anyFailed = Object.values(summary).some((value) => value === 'failed');
	process.exit(anyFailed ? 1 : 0);
}

main().catch((error) => {
	console.error('Backup crashed:', error);
	process.exit(1);
});
