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

/** Removes an openid from a sharedWith list. */
const dropEdge = (sharedWith, openid) => (Array.isArray(sharedWith) ? sharedWith : []).filter((id) => id !== openid);

/** Sets the connection record for the given openid to 'leave', leaving the name in place. */
const markLeft = (connections, openid) =>
	(Array.isArray(connections) ? connections : []).map((item) =>
		item.openid === openid ? Object.assign({}, item, { status: 'leave' }) : item
	);

/**
 * Leaves a single connection (adjacency model). Removes the pairwise edge from both accounts'
 * sharedWith lists — so shared reminders immediately stop being visible either way — and flips both
 * accounts' connection records to 'leave', which surfaces the "Left" state on both account pages until
 * cleared or re-connected. Caller identity comes from the auth context, never the request body.
 *
 * @param {object} event - { otherOpenid: string }
 * @returns {Promise<object>} { success, error? }
 */
exports.main = async (event) => {
	// Web/email auth populates uid (openId is empty for non-WeChat); _openid == auth.uid == uid here.
	const { openId, uid } = app.auth().getUserInfo();
	const callerOpenid = openId || uid;
	const otherOpenid = event && event.otherOpenid;
	if (!callerOpenid) return { success: false, error: 'NO_AUTH' };
	if (!otherOpenid) return { success: false, error: 'NO_TARGET' };

	const [caller, other] = await Promise.all([loadUser(callerOpenid), loadUser(otherOpenid)]);
	if (!caller) return { success: false, error: 'NO_USER' };

	const writes = [
		db.collection(USERS).doc(caller._id).update({
			sharedWith: _.set(dropEdge(caller.sharedWith, otherOpenid)),
			connections: _.set(markLeft(caller.connections, otherOpenid))
		})
	];
	if (other) {
		writes.push(
			db.collection(USERS).doc(other._id).update({
				sharedWith: _.set(dropEdge(other.sharedWith, callerOpenid)),
				connections: _.set(markLeft(other.connections, callerOpenid))
			})
		);
	}

	await Promise.all(writes);

	return { success: true };
};
