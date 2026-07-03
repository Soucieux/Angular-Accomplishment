/*
 * Pure transforms between CloudBase's array-of-documents shape and Firebase's
 * keyed-object shape. No SDK imports — trivially unit-testable.
 */

/**
 * Converts an array of CloudBase documents into a Firebase Realtime Database
 * object keyed by each document's _id. Every field (including _openid) is
 * preserved verbatim so the mirror is a faithful copy.
 *
 * @param {Array<object>} records - CloudBase documents, each carrying an _id.
 * @returns {object} A map of { [_id]: document }.
 * @throws {Error} When a record has no _id (it could not be keyed).
 */
function toFirebaseShape(records) {
	const result = {};
	for (const record of records) {
		if (!record || !record._id) {
			throw new Error('Cannot back up a record without an _id');
		}
		result[record._id] = record;
	}
	return result;
}

/**
 * Converts a Firebase keyed node back into an array of CloudBase documents.
 * The inverse of {@link toFirebaseShape}; every field (including _id and
 * _openid) is preserved so a restore is a faithful copy.
 *
 * @param {object|null} node - A map of { [_id]: document }, or null/empty.
 * @returns {Array<object>} The documents as an array (empty when node is falsy).
 */
function fromFirebaseShape(node) {
	if (!node) {
		return [];
	}
	return Object.values(node);
}

module.exports = { toFirebaseShape, fromFirebaseShape };
