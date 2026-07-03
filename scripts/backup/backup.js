/*
 * Backup orchestration: read a CloudBase collection fully and mirror it into
 * Firebase. db handles are injected so the whole flow is unit-testable with
 * fakes (no real SDKs).
 */
const { fetchAllRecords } = require('./cloudbase');
const { toFirebaseShape } = require('./transform');

/**
 * Mirrors one CloudBase collection into Firebase, replacing the destination node
 * with a fresh keyed snapshot.
 *
 * @param {object} cbDb - CloudBase database handle exposing collection(name).
 * @param {object} fbDb - Firebase admin database handle exposing ref(path).
 * @param {string} name - Collection / node name.
 * @param {number} pageSize - CloudBase page size.
 * @param {string} root - Firebase root node the backup is written under.
 * @returns {Promise<number>} The number of documents backed up.
 */
async function backupCollection(cbDb, fbDb, name, pageSize, root) {
	const records = await fetchAllRecords(cbDb.collection(name), pageSize);
	await fbDb.ref(`${root}/${name}`).set(toFirebaseShape(records));
	return records.length;
}

/**
 * Backs up every configured collection. A failure in one collection is recorded
 * as 'failed' in the summary and does not abort the remaining collections, so a
 * single bad collection never sinks the whole run.
 *
 * @param {{COLLECTIONS: string[], PAGE_SIZE: number}} config - Backup config.
 * @param {object} cbDb - CloudBase database handle.
 * @param {object} fbDb - Firebase admin database handle.
 * @returns {Promise<Object<string, number|'failed'>>} Per-collection counts.
 */
async function runBackup(config, cbDb, fbDb) {
	const summary = {};
	for (const name of config.COLLECTIONS) {
		try {
			summary[name] = await backupCollection(cbDb, fbDb, name, config.PAGE_SIZE, config.BACKUP_ROOT);
			console.log(`backed up ${name}: ${summary[name]} records`);
		} catch (error) {
			summary[name] = 'failed';
			console.error(`failed to back up ${name}:`, error.message);
		}
	}
	return summary;
}

module.exports = { backupCollection, runBackup };
