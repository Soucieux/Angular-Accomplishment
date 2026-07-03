const { test } = require('node:test');
const assert = require('node:assert');

const { backupCollection, runBackup } = require('./backup');

/** Fake CloudBase collection paging through `rows`. */
function fakeCollection(rows) {
	return {
		skip(offset) {
			return {
				limit(count) {
					return {
						async get() {
							return { data: rows.slice(offset, offset + count) };
						}
					};
				}
			};
		}
	};
}

/** Fake CloudBase db mapping collection name -> rows (or a thrower). */
function fakeCbDb(rowsByName) {
	return {
		collection(name) {
			const rows = rowsByName[name];
			if (rows === 'throw') {
				return {
					skip: () => ({ limit: () => ({ get: async () => { throw new Error('read failed'); } }) })
				};
			}
			return fakeCollection(rows || []);
		}
	};
}

/** Fake Firebase admin db capturing writes per ref path. */
function fakeFbDb() {
	const writes = {};
	return {
		writes,
		ref(path) {
			return {
				async set(payload) {
					writes[path] = payload;
				}
			};
		}
	};
}

test('backupCollection writes the keyed payload and returns the count', async () => {
	const cbDb = fakeCbDb({ movies: [{ _id: 'm1', _openid: 'u1' }, { _id: 'm2', _openid: 'u2' }] });
	const fbDb = fakeFbDb();

	const count = await backupCollection(cbDb, fbDb, 'movies', 1000, 'backup');

	assert.strictEqual(count, 2);
	// Written under the backup/ root, never at the top-level 'movies' node.
	assert.strictEqual(fbDb.writes.movies, undefined);
	assert.deepStrictEqual(Object.keys(fbDb.writes['backup/movies']), ['m1', 'm2']);
	assert.strictEqual(fbDb.writes['backup/movies'].m1._openid, 'u1');
});

test('runBackup backs up every configured collection and returns a summary', async () => {
	const config = { COLLECTIONS: ['movies', 'quotes'], PAGE_SIZE: 1000, BACKUP_ROOT: 'backup' };
	const cbDb = fakeCbDb({ movies: [{ _id: 'm1' }], quotes: [{ _id: 'q1' }, { _id: 'q2' }] });
	const fbDb = fakeFbDb();

	const summary = await runBackup(config, cbDb, fbDb);

	assert.deepStrictEqual(summary, { movies: 1, quotes: 2 });
});

test('runBackup continues past a failing collection and marks it', async () => {
	const config = { COLLECTIONS: ['movies', 'quotes'], PAGE_SIZE: 1000, BACKUP_ROOT: 'backup' };
	const cbDb = fakeCbDb({ movies: 'throw', quotes: [{ _id: 'q1' }] });
	const fbDb = fakeFbDb();

	const summary = await runBackup(config, cbDb, fbDb);

	assert.strictEqual(summary.movies, 'failed');
	assert.strictEqual(summary.quotes, 1);
});
