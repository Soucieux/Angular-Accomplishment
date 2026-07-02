/*
 * Copies _shared/lib.js into every cloud-function folder as lib.js.
 *
 * CloudBase can't require across function folders, so run this before deploying:
 *   node cloudbase-functions/sync-shared.js
 * The copied lib.js files are gitignored; _shared/lib.js is the single source of truth.
 */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const source = fs.readFileSync(path.join(root, '_shared', 'lib.js'));

fs.readdirSync(root, { withFileTypes: true })
	.filter((entry) => entry.isDirectory() && entry.name !== '_shared')
	.filter((entry) => fs.existsSync(path.join(root, entry.name, 'index.js')))
	.forEach((entry) => {
		fs.writeFileSync(path.join(root, entry.name, 'lib.js'), source);
		console.log(`synced lib.js -> ${entry.name}`);
	});
