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
 * Withdraws a still-pending connect request the caller sent. Removes the caller's outgoing entry to
 * the target AND the matching incoming entry from the target, so the target can no longer approve a
 * cancelled request. Caller identity comes from the auth context, never the request body.
 *
 * @param {object} event - { toOpenid: string }
 * @returns {Promise<object>} { success, error? }
 */
exports.main = async (event) => {
	// Web/email auth populates uid (openId is empty for non-WeChat); _openid == auth.uid == uid here.
	const { openId, uid } = app.auth().getUserInfo();
	const callerOpenid = openId || uid;
	const toOpenid = event && event.toOpenid;
	if (!callerOpenid) return { success: false, error: 'NO_AUTH' };
	if (!toOpenid) return { success: false, error: 'NO_TARGET' };

	const [caller, target] = await Promise.all([loadUser(callerOpenid), loadUser(toOpenid)]);
	const writes = [];

	if (caller) {
		const outgoing = (Array.isArray(caller.outgoingRequests) ? caller.outgoingRequests : []).filter(
			(item) => item.toOpenid !== toOpenid
		);
		writes.push(db.collection(USERS).doc(caller._id).update({ outgoingRequests: _.set(outgoing) }));
	}
	if (target) {
		const incoming = (Array.isArray(target.incomingRequests) ? target.incomingRequests : []).filter(
			(item) => item.fromOpenid !== callerOpenid
		);
		writes.push(db.collection(USERS).doc(target._id).update({ incomingRequests: _.set(incoming) }));
	}

	await Promise.all(writes);
	return { success: true };
};
