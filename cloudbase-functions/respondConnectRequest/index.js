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

/** Adds an openid to a sharedWith list without duplicating it. */
const addEdge = (sharedWith, openid) => {
	const list = Array.isArray(sharedWith) ? sharedWith.slice() : [];
	if (!list.includes(openid)) list.push(openid);
	return list;
};

/** Upserts a connected connection record for the given openid, replacing any prior (e.g. 'leave') entry. */
const upsertConnection = (connections, openid, name) => {
	const list = (Array.isArray(connections) ? connections : []).filter((item) => item.openid !== openid);
	list.push({ openid, name, status: 'connected' });
	return list;
};

/**
 * Approves or declines a pending connect request. Declining drops the request and marks the sender's
 * outgoing entry declined. Approving links the two accounts under the adjacency model: it adds each
 * account's openid to the other's sharedWith list and upserts a 'connected' record into each account's
 * connections list. No groups. Caller (approver) identity comes from the auth context, never the body.
 *
 * @param {object} event - { fromOpenid: string, accept: boolean, name?: string }
 * @returns {Promise<object>} { success, declined?, error? }
 */
exports.main = async (event) => {
	// Web/email auth populates uid (openId is empty for non-WeChat); _openid == auth.uid == uid here.
	const { openId, uid } = app.auth().getUserInfo();
	const approverOpenid = openId || uid;
	const fromOpenid = event && event.fromOpenid;
	const accept = !!(event && event.accept);
	const approverName = (event && event.name) || '';
	if (!approverOpenid) return { success: false, error: 'NO_AUTH' };
	if (!fromOpenid) return { success: false, error: 'NO_FROM' };

	const approver = await loadUser(approverOpenid);
	if (!approver) return { success: false, error: 'NO_USER' };

	// Pull the matching request off the approver's document (CloudBase has no pull — filter + set).
	const requests = Array.isArray(approver.incomingRequests) ? approver.incomingRequests : [];
	const request = requests.find((entry) => entry.fromOpenid === fromOpenid);
	const fromName = (request && request.fromName) || '';
	const remaining = requests.filter((entry) => entry.fromOpenid !== fromOpenid);

	const from = await loadUser(fromOpenid);

	// Decline: drop the incoming request and mark the sender's outgoing entry declined so they see it.
	if (!accept) {
		await db.collection(USERS).doc(approver._id).update({ incomingRequests: _.set(remaining) });
		if (from) {
			const outgoing = (Array.isArray(from.outgoingRequests) ? from.outgoingRequests : []).map((item) =>
				item.toOpenid === approverOpenid ? Object.assign({}, item, { status: 'declined' }) : item
			);
			await db.collection(USERS).doc(from._id).update({ outgoingRequests: _.set(outgoing) });
		}
		return { success: true, declined: true };
	}

	if (!from) return { success: false, error: 'NO_REQUESTER' };

	// Accept: add the bidirectional edge and upsert a 'connected' record on both documents. The sender's
	// pending outgoing request is consumed — removed, since the link now shows in their connections list.
	const approverConnections = upsertConnection(approver.connections, fromOpenid, fromName);
	const fromConnections = upsertConnection(from.connections, approverOpenid, approverName);
	const fromOutgoing = (Array.isArray(from.outgoingRequests) ? from.outgoingRequests : []).filter(
		(item) => item.toOpenid !== approverOpenid
	);

	await Promise.all([
		db.collection(USERS).doc(approver._id).update({
			incomingRequests: _.set(remaining),
			sharedWith: _.set(addEdge(approver.sharedWith, fromOpenid)),
			connections: _.set(approverConnections)
		}),
		db.collection(USERS).doc(from._id).update({
			outgoingRequests: _.set(fromOutgoing),
			sharedWith: _.set(addEdge(from.sharedWith, approverOpenid)),
			connections: _.set(fromConnections)
		})
	]);

	return { success: true };
};
