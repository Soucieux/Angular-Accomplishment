const { db, _, USERS, loadUser, getCallerOpenid } = require('./lib');

const ACTIVITY_CAP = 20;

/**
 * Aggregates the caller's shared-reminder activity feed under the adjacency model. Reads the caller's
 * own sharedRecentActivity plus that of each account in their sharedWith list, merges them, sorts
 * newest-first by timestamp, and caps the result. Admin context reads neighbours' documents directly,
 * so no cross-account read rule is needed. Caller identity comes from the auth context.
 *
 * @returns {Promise<object>} { success, activity }
 */
exports.main = async () => {
	const callerOpenid = getCallerOpenid();
	if (!callerOpenid) return { success: false, activity: [] };

	const caller = await loadUser(callerOpenid);
	if (!caller) return { success: true, activity: [] };

	const neighbours = Array.isArray(caller.sharedWith) ? caller.sharedWith : [];
	// One query fetches all neighbour documents, instead of a single-doc get per neighbour.
	const neighbourDocs = neighbours.length
		? (await db.collection(USERS).where({ _openid: _.in(neighbours) }).limit(neighbours.length).get()).data || []
		: [];

	// Each entry lives on its author's own document, so tag authorship as the docs are flattened —
	// the client resolves the openid to a display name from its connections list.
	const activity = [caller, ...neighbourDocs]
		.filter(Boolean)
		.flatMap((doc) =>
			(Array.isArray(doc.sharedRecentActivity) ? doc.sharedRecentActivity : []).map((entry) =>
				Object.assign({}, entry, { authorOpenid: doc._openid })
			)
		)
		.sort((a, b) => String((b && b.timestamp) || '').localeCompare(String((a && a.timestamp) || '')))
		.slice(0, ACTIVITY_CAP);

	return { success: true, activity };
};
