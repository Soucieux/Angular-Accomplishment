const tcb = require('@cloudbase/node-sdk');

const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV });
const db = app.database();
const _ = db.command;

const USERS = 'users';

/** Loads a single user document by its openid (keyed by _id == _openid). */
const loadUser = async (openid) => {
	const res = await db.collection(USERS).where({ _openid: openid }).limit(1).get();
	return res.data && res.data[0];
};

/**
 * Signals every account the caller is connected to that the caller changed a shared reminder, by
 * bumping a sharedRev counter on each connection's own user document. Each connection watches its own
 * document (reliable realtime), so the bump triggers a re-fetch of shared reminders on their side.
 * Caller identity comes from the auth context.
 *
 * @returns {Promise<object>} { success }
 */
exports.main = async () => {
	// Web/email auth populates uid (openId is empty for non-WeChat); _openid == auth.uid == uid here.
	const { openId, uid } = app.auth().getUserInfo();
	const callerOpenid = openId || uid;
	if (!callerOpenid) return { success: false };

	const caller = await loadUser(callerOpenid);
	const members = caller && Array.isArray(caller.sharedWith) ? caller.sharedWith : [];
	if (!members.length) return { success: true };

	// One bulk write bumps every connection's own document, instead of a read-then-write per member.
	await db.collection(USERS).where({ _openid: _.in(members) }).update({ sharedRev: Date.now() });
	return { success: true };
};
