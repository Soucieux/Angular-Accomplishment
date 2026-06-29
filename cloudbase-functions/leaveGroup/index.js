const tcb = require('@cloudbase/node-sdk');

const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV });
const db = app.database();
const _ = db.command;

const REMINDER_COLLECTION = 'reminder';

/**
 * Removes the caller from every shared reminder they are a member of.
 *
 * Reminders owned by other members stay shared (the group keeps them); the caller
 * simply drops out of each sharedWith array. CloudBase has no pull operator, so the
 * array is filtered in JS and written back with set.
 *
 * @returns {Promise<object>} { success, remindersUpdated?, error? }
 */
exports.main = async () => {
	// Caller identity comes from the auth context, never the request body (anti-spoofing).
	const { openId: callerOpenid } = app.auth().getUserInfo();
	if (!callerOpenid) return { success: false, error: 'NO_AUTH' };

	// Every shared reminder the caller is currently a member of.
	const res = await db
		.collection(REMINDER_COLLECTION)
		.where({ sharedWith: _.in([callerOpenid]) })
		.get();
	const docs = res.data || [];

	// Each doc's remaining list is computed from its own data; writes are independent.
	await Promise.all(
		docs.map((doc) => {
			const remaining = (doc.sharedWith || []).filter((member) => member !== callerOpenid);
			return db.collection(REMINDER_COLLECTION).doc(doc._id).update({ sharedWith: _.set(remaining) });
		})
	);

	return { success: true, remindersUpdated: docs.length };
};
