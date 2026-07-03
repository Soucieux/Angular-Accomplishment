const { test } = require('node:test');
const assert = require('node:assert');

const { toFirebaseShape, fromFirebaseShape } = require('./transform');

test('toFirebaseShape keys each record by its _id', () => {
	const records = [
		{ _id: 'a1', _openid: 'user1', name: 'first' },
		{ _id: 'b2', _openid: 'user2', name: 'second' }
	];

	const result = toFirebaseShape(records);

	assert.deepStrictEqual(Object.keys(result), ['a1', 'b2']);
	assert.strictEqual(result.a1.name, 'first');
});

test('toFirebaseShape preserves _openid on every record', () => {
	const records = [{ _id: 'a1', _openid: 'user1', name: 'first' }];

	const result = toFirebaseShape(records);

	assert.strictEqual(result.a1._openid, 'user1');
});

test('toFirebaseShape returns an empty object for an empty array', () => {
	assert.deepStrictEqual(toFirebaseShape([]), {});
});

test('toFirebaseShape throws when a record has no _id', () => {
	const records = [{ _openid: 'user1', name: 'no id' }];

	assert.throws(() => toFirebaseShape(records), /_id/);
});

test('fromFirebaseShape converts a keyed node back to an array of records', () => {
	const node = { a1: { _id: 'a1', _openid: 'user1', name: 'first' } };

	const result = fromFirebaseShape(node);

	assert.strictEqual(result.length, 1);
	assert.strictEqual(result[0]._id, 'a1');
	assert.strictEqual(result[0]._openid, 'user1');
});

test('fromFirebaseShape returns an empty array for a null or empty node', () => {
	assert.deepStrictEqual(fromFirebaseShape(null), []);
	assert.deepStrictEqual(fromFirebaseShape({}), []);
});

test('toFirebaseShape and fromFirebaseShape round-trip', () => {
	const records = [
		{ _id: 'a1', _openid: 'user1', name: 'first' },
		{ _id: 'b2', _openid: 'user2', name: 'second' }
	];

	const restored = fromFirebaseShape(toFirebaseShape(records));

	assert.deepStrictEqual(restored, records);
});
