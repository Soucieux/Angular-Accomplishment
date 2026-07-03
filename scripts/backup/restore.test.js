const { test } = require('node:test');
const assert = require('node:assert');

const { restoreCollection, runRestore } = require('./restore-core');

/** Fake Firebase admin db serving `nodesByName` via ref(name).get().val(). */
function fakeFbDb(nodesByName) {
	return {
		ref(name) {
			return {
				async get() {
					return { val: () => nodesByName[name] ?? null };
				}
			};
		}
	};
}

/** Fake CloudBase db capturing every doc(id).set(data) write. */
function fakeCbDb() {
	const writes = [];
	return {
		writes,
		collection(name) {
			return {
				doc(id) {
					return {
						async set(data) {
							writes.push({ name, id, data });
						}
					};
				}
			};
		}
	};
}

test('restoreCollection writes each record to CloudBase preserving _openid', async () => {
	const fbDb = fakeFbDb({ reminder: { a1: { _openid: 'u1', text: 'buy milk' } } });
	const cbDb = fakeCbDb();

	const result = await restoreCollection(fbDb, cbDb, 'reminder', {});

	assert.deepStrictEqual(result, { count: 1, written: 1 });
	assert.strictEqual(cbDb.writes.length, 1);
	assert.strictEqual(cbDb.writes[0].id, 'a1');
	assert.strictEqual(cbDb.writes[0].data._openid, 'u1');
	// _id is the document key, not part of the written body.
	assert.ok(!('_id' in cbDb.writes[0].data));
});

test('restoreCollection in dry-run reads but performs zero writes', async () => {
	const fbDb = fakeFbDb({ reminder: { a1: { _openid: 'u1' } } });
	const cbDb = fakeCbDb();

	const result = await restoreCollection(fbDb, cbDb, 'reminder', { dryRun: true });

	assert.deepStrictEqual(result, { count: 1, written: 0 });
	assert.strictEqual(cbDb.writes.length, 0);
});

test('runRestore restores every configured collection', async () => {
	const config = { COLLECTIONS: ['reminder', 'quotes'], PAGE_SIZE: 1000, BACKUP_ROOT: 'backup' };
	const fbDb = fakeFbDb({
		'backup/reminder': { a1: { _openid: 'u1' } },
		'backup/quotes': { q1: { _openid: 'u2' }, q2: { _openid: 'u2' } }
	});
	const cbDb = fakeCbDb();

	const summary = await runRestore(config, fbDb, cbDb, {});

	assert.strictEqual(summary.reminder.written, 1);
	assert.strictEqual(summary.quotes.written, 2);
});

test('runRestore honours the --only filter', async () => {
	const config = { COLLECTIONS: ['reminder', 'quotes'], PAGE_SIZE: 1000, BACKUP_ROOT: 'backup' };
	const fbDb = fakeFbDb({
		'backup/reminder': { a1: { _openid: 'u1' } },
		'backup/quotes': { q1: { _openid: 'u2' } }
	});
	const cbDb = fakeCbDb();

	const summary = await runRestore(config, fbDb, cbDb, { only: 'reminder' });

	assert.deepStrictEqual(Object.keys(summary), ['reminder']);
	assert.strictEqual(cbDb.writes.length, 1);
});
