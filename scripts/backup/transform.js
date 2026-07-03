/*
 * Pure transforms between CloudBase's array-of-documents shape and Firebase's
 * keyed-object shape. No SDK imports — trivially unit-testable.
 */

/**
 * Converts an array of CloudBase documents into a Firebase Realtime Database
 * object keyed by each document's _id. The _id is the key only — it is stripped
 * from the stored body to avoid duplicating it (the key already holds it). Every
 * other field (including _openid) is preserved verbatim.
 *
 * @param {Array<object>} records - CloudBase documents, each carrying an _id.
 * @returns {object} A map of { [_id]: document-without-_id }.
 * @throws {Error} When a record has no _id (it could not be keyed).
 */
function toFirebaseShape(records) {
	const result = {};
	for (const record of records) {
		if (!record || !record._id) {
			throw new Error('Cannot back up a record without an _id');
		}
		const { _id, ...body } = record;
		result[_id] = body;
	}
	return result;
}

/**
 * Converts a Firebase keyed node back into an array of CloudBase documents.
 * The inverse of {@link toFirebaseShape}: each node key is the document's _id
 * (it was stripped from the body on backup), so it is reattached as the _id
 * field here. Every other field is preserved so a restore is a faithful copy.
 *
 * @param {object|null} node - A map of { [_id]: document-without-_id }, or null/empty.
 * @returns {Array<object>} The documents (each with _id reattached from its key).
 */
function fromFirebaseShape(node) {
	if (!node) {
		return [];
	}
	return Object.entries(node).map(([id, body]) => ({ _id: id, ...body }));
}

module.exports = { toFirebaseShape, fromFirebaseShape };
