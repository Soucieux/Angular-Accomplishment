/*
 * Restore entrypoint: Firebase mirror -> CloudBase.
 *
 * DANGEROUS: this writes into CloudBase. A real restore therefore requires an
 * explicit --confirm <envId> that matches CLOUDBASE_ENV_ID. Use --dry-run to
 * preview counts without writing.
 *
 * Usage:
 *   node restore.js --dry-run                 # preview, no writes
 *   node restore.js --confirm <envId>         # real restore of every collection
 *   node restore.js --confirm <envId> --only reminder
 */
const config = require('./config');
const { runRestore } = require('./restore-core');

const REQUIRED_ENV = [
	'CLOUDBASE_SECRET_ID',
	'CLOUDBASE_SECRET_KEY',
	'CLOUDBASE_ENV_ID',
	'FIREBASE_SERVICE_ACCOUNT',
	'FIREBASE_DATABASE_URL'
];

/**
 * Parses the supported CLI flags.
 *
 * @param {string[]} argv - process.argv.slice(2).
 * @returns {{dryRun: boolean, confirm: string|null, only: string|null}}
 */
function parseArgs(argv) {
	const args = { dryRun: false, confirm: null, only: null };
	for (let i = 0; i < argv.length; i += 1) {
		if (argv[i] === '--dry-run') args.dryRun = true;
		else if (argv[i] === '--confirm') args.confirm = argv[(i += 1)];
		else if (argv[i] === '--only') args.only = argv[(i += 1)];
	}
	return args;
}

/** Prints usage help. */
function printUsage() {
	console.error('Usage: node restore.js --dry-run | --confirm <envId> [--only <collection>]');
}

/**
 * Validates flags and credentials, then restores the mirror into CloudBase.
 *
 * @returns {Promise<void>}
 */
async function main() {
	const args = parseArgs(process.argv.slice(2));

	// Write-guard #1 (offline): a real restore must pass --confirm.
	if (!args.dryRun && !args.confirm) {
		console.error('Refusing: a real restore requires --confirm <envId>. Use --dry-run to preview.');
		printUsage();
		process.exit(1);
		return;
	}

	const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
	if (missing.length > 0) {
		console.error(`Missing required environment variables: ${missing.join(', ')}`);
		process.exit(1);
		return;
	}

	// Write-guard #2: --confirm must match the target env exactly.
	if (!args.dryRun && args.confirm !== process.env.CLOUDBASE_ENV_ID) {
		console.error('Refusing: --confirm value does not match CLOUDBASE_ENV_ID.');
		process.exit(1);
		return;
	}

	// Required only after the guards so a guarded-off run stays offline.
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

	console.log(args.dryRun ? 'DRY RUN — no writes will be made.' : `RESTORING into ${args.confirm}`);
	const summary = await runRestore(config, fbDb, cbDb, { dryRun: args.dryRun, only: args.only });
	console.log('Restore summary:', JSON.stringify(summary));

	const anyFailed = Object.values(summary).some((value) => value && value.error);
	process.exit(anyFailed ? 1 : 0);
}

main().catch((error) => {
	console.error('Restore crashed:', error);
	process.exit(1);
});
