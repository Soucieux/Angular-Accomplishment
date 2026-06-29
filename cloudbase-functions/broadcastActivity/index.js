const tcb = require('@cloudbase/node-sdk');

const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV });
const db = app.database();
const _ = db.command;

const REMINDER_COLLECTION = 'reminder';
const STATISTICS_COLLECTION = 'statistics';
const RECENT_ACTIVITIES_FIELD = 'recentActivities';
// Must match STATS_CAP_ACTIVITY_LOG in src/app/common/constants.ts.
const MAX_RECENT_ACTIVITIES = 20;

/**
 * Normalises a recentActivities value to an array. CloudBase may return the stored
 * array as an object with numeric keys after a merge update, so both forms are handled.
 *
 * @param {*} raw - The stored recentActivities value.
 * @returns {Array} The value as an array, or an empty array.
 */
function toArray(raw) {
	if (Array.isArray(raw)) return raw;
	if (raw && typeof raw === 'object') return Object.values(raw);
	return [];
}

/**
 * Fans out one activity entry to every group member's recentActivities.
 *
 * The caller is skipped (it writes its own activity client-side). Each member's array
 * is prepended newest-first and trimmed to MAX_RECENT_ACTIVITIES. The caller is verified
 * to be a member of the reminder before any fan-out, preventing activity spoofing.
 *
 * @param {object} event - { reminderId: string, activityEntry: object } — the fully
 *   formed entry (including its timestamp) to replicate to other members.
 * @returns {Promise<object>} { success, notifiedCount?, error? }
 */
exports.main = async (event) => {
	// Caller identity comes from the auth context, never the request body (anti-spoofing).
	const { openId: callerOpenid } = app.auth().getUserInfo();
	const reminderId = event && event.reminderId;
	const activityEntry = event && event.activityEntry;

	if (!callerOpenid) return { success: false, error: 'NO_AUTH' };
	if (!reminderId || !activityEntry) return { success: false, error: 'INVALID_INPUT' };

	// Read the reminder (admin context — any document).
	const reminderRes = await db.collection(REMINDER_COLLECTION).doc(reminderId).get();
	const reminder = (reminderRes.data || [])[0];
	if (!reminder || !Array.isArray(reminder.sharedWith)) {
		return { success: false, error: 'NOT_SHARED' };
	}

	// Anti-spoof: the caller must be a member of this reminder.
	if (!reminder.sharedWith.includes(callerOpenid)) {
		return { success: false, error: 'FORBIDDEN' };
	}

	// The caller writes its own activity client-side through the normal path.
	const members = reminder.sharedWith.filter((memberOpenid) => memberOpenid !== callerOpenid);

	// Fan out per member in parallel — each member's read→write chain is self-contained
	// and touches a different member's stats doc, so the chains are independent.
	const results = await Promise.all(
		members.map(async (memberOpenid) => {
			const statsRes = await db
				.collection(STATISTICS_COLLECTION)
				.where({ _openid: memberOpenid, isUserStats: true })
				.get();
			const statsDoc = (statsRes.data || [])[0];
			if (!statsDoc) return false;

			// Prepend newest-first and trim to the cap — no addToSet/slice operators, so set the array.
			const existing = toArray(statsDoc[RECENT_ACTIVITIES_FIELD]);
			const next = [activityEntry, ...existing].slice(0, MAX_RECENT_ACTIVITIES);
			await db
				.collection(STATISTICS_COLLECTION)
				.doc(statsDoc._id)
				.update({ [RECENT_ACTIVITIES_FIELD]: _.set(next) });
			return true;
		})
	);

	const notifiedCount = results.filter(Boolean).length;
	return { success: true, notifiedCount };
};
