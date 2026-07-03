/*
 * CloudBase read helpers. Pagination is isolated here so it can be unit-tested
 * against a fake collection without the real SDK.
 */

/**
 * Reads every document from a CloudBase collection by paging through it with
 * skip/limit until a page shorter than pageSize is returned (the last page).
 *
 * @param {object} collection - A CloudBase collection ref supporting
 *   skip(n).limit(m).get() -> { data: Array }.
 * @param {number} pageSize - Documents to request per round-trip.
 * @returns {Promise<Array<object>>} All documents in the collection.
 */
async function fetchAllRecords(collection, pageSize) {
	const all = [];
	let offset = 0;
	// Loop until a page comes back shorter than pageSize, which means it was the
	// last page. An exact-multiple collection ends with one final empty page.
	for (;;) {
		const res = await collection.skip(offset).limit(pageSize).get();
		const page = res.data || [];
		all.push(...page);
		if (page.length < pageSize) {
			break;
		}
		offset += pageSize;
	}
	return all;
}

module.exports = { fetchAllRecords };
