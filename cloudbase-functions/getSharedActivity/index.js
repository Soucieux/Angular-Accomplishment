const tcb = require('@cloudbase/node-sdk');

const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV });
const db = app.database();
const _ = db.command;

const USERS = 'users';
const ACTIVITY_CAP = 20;

/** Loads a single user document by its openid (keyed by _id == _openid). */
const loadUser = async (openid) => {
	const res = await db.collection(USERS).where({ _openid: openid }).limit(1).get();
	return res.data && res.data[0];
};

/**
 * Aggregates the caller's shared-reminder activity feed under the adjacency model. Reads the caller's
 * own sharedRecentActivity plus that of each account in their sharedWith list, merges them, sorts
 * newest-first by timestamp, and caps the result. Admin context reads neighbours' documents directly,
 * so no cross-account read rule is needed. Caller identity comes from the auth context.
 *
 * @returns {Promise<object>} { success, activity }
 */
exports.main = async () => {
	// Web/email auth populates uid (openId is empty for non-WeChat); _openid == auth.uid == uid here.
	const { openId, uid } = app.auth().getUserInfo();
	const callerOpenid = openId || uid;
	if (!callerOpenid) return { success: false, activity: [] };

	const caller = await loadUser(callerOpenid);
	if (!caller) return { success: true, activity: [] };

	const neighbours = Array.isArray(caller.sharedWith) ? caller.sharedWith : [];
	// One query fetches all neighbour documents, instead of a single-doc get per neighbour.
	const neighbourDocs = neighbours.length
		? (await db.collection(USERS).where({ _openid: _.in(neighbours) }).limit(neighbours.length).get()).data || []
		: [];

	const activity = [caller, ...neighbourDocs]
		.filter(Boolean)
		.flatMap((doc) => (Array.isArray(doc.sharedRecentActivity) ? doc.sharedRecentActivity : []))
		.sort((a, b) => String((b && b.timestamp) || '').localeCompare(String((a && a.timestamp) || '')))
		.slice(0, ACTIVITY_CAP);

	return { success: true, activity };
};
