const { db, _, USERS, getCallerOpenid } = require('./lib');

/**
 * Sends a connect request to the account that owns the given connect code.
 *
 * Looks up the target user by connectCode (admin query — clients cannot read other users'
 * documents), validates the request, and appends a pending entry to the target's
 * incomingRequests array. Caller identity comes from the auth context, never the request
 * body (anti-spoofing); only the display name is taken from the body (cosmetic).
 *
 * @param {object} event - { code: string, name?: string }
 * @returns {Promise<object>} { success, error? }
 */
exports.main = async (event) => {
	const callerOpenid = getCallerOpenid();
	const code = event && event.code;
	const callerName = (event && event.name) || '';
	if (!callerOpenid) return { success: false, error: 'NO_AUTH' };
	if (!code) return { success: false, error: 'NO_CODE' };

	// Resolve the target account by its connect code.
	const targetRes = await db.collection(USERS).where({ connectCode: code }).limit(1).get();
	const target = targetRes.data && targetRes.data[0];
	if (!target) return { success: false, error: 'CODE_NOT_FOUND' };
	const targetOpenid = target._openid;
	if (targetOpenid === callerOpenid) return { success: false, error: 'SELF' };

	// Already directly connected? (adjacency: the target openid is in the caller's sharedWith list.)
	const callerRes = await db.collection(USERS).where({ _openid: callerOpenid }).limit(1).get();
	const caller = callerRes.data && callerRes.data[0];
	if (caller && Array.isArray(caller.sharedWith) && caller.sharedWith.includes(targetOpenid)) {
		return { success: false, error: 'ALREADY_CONNECTED' };
	}

	// Skip a duplicate pending request from the same caller.
	const requests = Array.isArray(target.incomingRequests) ? target.incomingRequests : [];
	if (requests.some((request) => request.fromOpenid === callerOpenid)) {
		return { success: false, error: 'ALREADY_REQUESTED' };
	}

	const ts = new Date().toISOString();
	const entry = { fromOpenid: callerOpenid, fromName: callerName, ts };

	const writes = [db.collection(USERS).doc(target._id).update({ incomingRequests: _.push([entry]) })];

	// Record the request on the caller's side too (status 'pending'), so the sender sees its outcome
	// live. Target the caller's looked-up document (_id), not the auth-derived openid, so the write
	// always lands on the right doc. Replace any prior entry to the same target (re-send resets it).
	if (caller) {
		const outgoing = (Array.isArray(caller.outgoingRequests) ? caller.outgoingRequests : []).filter(
			(item) => item.toOpenid !== targetOpenid
		);
		outgoing.push({ toOpenid: targetOpenid, toCode: code, status: 'pending', ts });
		writes.push(db.collection(USERS).doc(caller._id).update({ outgoingRequests: _.set(outgoing) }));
	}

	await Promise.all(writes);
	return { success: true };
};
