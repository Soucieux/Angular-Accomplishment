const tcb = require('@cloudbase/node-sdk');

const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV });
const db = app.database();
const _ = db.command;

const REMINDER_COLLECTION = 'reminder';

/**
 * Adds the caller to another user's share group.
 *
 * Collects every shared reminder owned by either side, unions all existing members
 * into one group, and re-syncs each shared reminder's sharedWith to the full member
 * list. Membership is implicit: it lives only in the sharedWith arrays, so this is a
 * no-op until at least one shared reminder exists on either side.
 *
 * @param {object} event - { targetOpenid: string } — the share code (owner openid) to join.
 * @returns {Promise<object>} { success, members?, remindersUpdated?, error? }
 */
exports.main = async (event) => {
	// Caller identity comes from the auth context, never the request body (anti-spoofing).
	const { openId: callerOpenid } = app.auth().getUserInfo();
	const targetOpenid = event && event.targetOpenid;

	if (!callerOpenid) return { success: false, error: 'NO_AUTH' };
	if (!targetOpenid || targetOpenid === callerOpenid) {
		return { success: false, error: 'INVALID_TARGET' };
	}

	// Shared reminders owned by each side.
	const [targetRes, callerRes] = await Promise.all([
		db.collection(REMINDER_COLLECTION).where({ _openid: targetOpenid, isShared: true }).get(),
		db.collection(REMINDER_COLLECTION).where({ _openid: callerOpenid, isShared: true }).get()
	]);
	const docs = [...(targetRes.data || []), ...(callerRes.data || [])];

	// Union every existing member with both sides into one group.
	const members = new Set([callerOpenid, targetOpenid]);
	for (const doc of docs) {
		(doc.sharedWith || []).forEach((member) => members.add(member));
	}
	const memberList = [...members];

	// Re-sync sharedWith on every shared reminder to the full member list, in parallel.
	// CloudBase has no addToSet — set the computed array directly. Each write targets a
	// distinct doc with the same memberList, so they are independent.
	await Promise.all(
		docs.map((doc) =>
			db.collection(REMINDER_COLLECTION).doc(doc._id).update({ sharedWith: _.set(memberList) })
		)
	);

	return { success: true, members: memberList, remindersUpdated: docs.length };
};
