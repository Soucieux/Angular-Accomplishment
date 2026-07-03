const { test } = require('node:test');
const assert = require('node:assert');

const { fetchAllRecords } = require('./cloudbase');

/**
 * Builds a fake CloudBase collection whose skip(n).limit(m).get() serves
 * successive slices of `rows`, and records how many get() calls were made.
 */
function makeFakeCollection(rows) {
	const state = { getCalls: 0 };
	const collection = {
		skip(offset) {
			return {
				limit(count) {
					return {
						async get() {
							state.getCalls += 1;
							return { data: rows.slice(offset, offset + count) };
						}
					};
				}
			};
		}
	};
	return { collection, state };
}

test('fetchAllRecords returns all rows across multiple pages', async () => {
	const rows = [{ _id: '1' }, { _id: '2' }, { _id: '3' }];
	const { collection } = makeFakeCollection(rows);

	const result = await fetchAllRecords(collection, 2);

	assert.deepStrictEqual(result.map((r) => r._id), ['1', '2', '3']);
});

test('fetchAllRecords stops fetching once a short page is seen', async () => {
	const rows = [{ _id: '1' }, { _id: '2' }, { _id: '3' }];
	const { collection, state } = makeFakeCollection(rows);

	await fetchAllRecords(collection, 2);

	// Page 1 (full: 2) then page 2 (short: 1) — exactly two round-trips, no third.
	assert.strictEqual(state.getCalls, 2);
});

test('fetchAllRecords returns an empty array for an empty collection', async () => {
	const { collection } = makeFakeCollection([]);

	const result = await fetchAllRecords(collection, 2);

	assert.deepStrictEqual(result, []);
});
