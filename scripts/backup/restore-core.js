/*
 * Restore orchestration: read the Firebase mirror and write it back into
 * CloudBase, preserving each record's original _openid so ownership is intact.
 * db handles are injected so the flow is unit-testable with fakes.
 */
const { fromFirebaseShape } = require('./transform');

/**
 * Restores one collection from the Firebase mirror into CloudBase. Each record
 * is written under its original _id (the document key), with _openid preserved
 * in the body. A dry run reads and counts but writes nothing.
 *
 * @param {object} fbDb - Firebase admin database handle exposing ref(path).get().
 * @param {object} cbDb - CloudBase database handle exposing collection(name).doc(id).set().
 * @param {string} name - Collection / node name.
 * @param {{dryRun?: boolean, root?: string}} options - Restore options.
 * @returns {Promise<{count: number, written: number}>} Records seen and written.
 */
async function restoreCollection(fbDb, cbDb, name, options) {
	const path = options.root ? `${options.root}/${name}` : name;
	const snapshot = await fbDb.ref(path).get();
	const records = fromFirebaseShape(snapshot.val());

	if (options.dryRun) {
		return { count: records.length, written: 0 };
	}

	let written = 0;
	for (const record of records) {
		const { _id, ...body } = record;
		await cbDb.collection(name).doc(_id).set(body);
		written += 1;
	}
	return { count: records.length, written };
}

/**
 * Restores every configured collection (or a single one when options.only is
 * set). A failure in one collection is recorded and does not abort the rest.
 *
 * @param {{COLLECTIONS: string[], BACKUP_ROOT: string}} config - Backup config.
 * @param {object} fbDb - Firebase admin database handle.
 * @param {object} cbDb - CloudBase database handle.
 * @param {{dryRun?: boolean, only?: string}} options - Restore options.
 * @returns {Promise<Object<string, object>>} Per-collection result or error.
 */
async function runRestore(config, fbDb, cbDb, options) {
	const collections = options.only ? [options.only] : config.COLLECTIONS;
	const perCollectionOptions = { ...options, root: config.BACKUP_ROOT };
	const summary = {};
	for (const name of collections) {
		try {
			summary[name] = await restoreCollection(fbDb, cbDb, name, perCollectionOptions);
			console.log(`restored ${name}:`, JSON.stringify(summary[name]));
		} catch (error) {
			summary[name] = { error: true };
			console.error(`failed to restore ${name}:`, error.message);
		}
	}
	return summary;
}

module.exports = { restoreCollection, runRestore };
