const tcb = require('@cloudbase/node-sdk');

const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV });
const db = app.database();
const _ = db.command;

const USERS = 'users';
const REMINDER = 'reminder';
const MAX_SHARED = 1000;

/** Loads a single user document by its openid (keyed by _id == _openid). */
const loadUser = async (openid) => {
	const res = await db.collection(USERS).where({ _openid: openid }).limit(1).get();
	return res.data && res.data[0];
};

/**
 * Returns the shared reminders of every account the caller is connected to. Runs in admin context so
 * the read never depends on the reminder collection's security rule — CloudBase realtime watch cannot
 * reliably push another user's documents, so the client re-fetches through this function instead.
 * Caller identity comes from the auth context.
 *
 * @returns {Promise<object>} { success, items }
 */
exports.main = async () => {
	// Web/email auth populates uid (openId is empty for non-WeChat); _openid == auth.uid == uid here.
	const { openId, uid } = app.auth().getUserInfo();
	const callerOpenid = openId || uid;
	if (!callerOpenid) return { success: false, items: [] };

	const caller = await loadUser(callerOpenid);
	const members = caller && Array.isArray(caller.sharedWith) ? caller.sharedWith : [];
	if (!members.length) return { success: true, items: [] };

	const res = await db
		.collection(REMINDER)
		.where({ _openid: _.in(members), isShared: true })
		.limit(MAX_SHARED)
		.get();
	return { success: true, items: res.data || [] };
};
