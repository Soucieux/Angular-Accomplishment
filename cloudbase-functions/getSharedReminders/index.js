const { db, _, REMINDER, loadUser, getCallerOpenid } = require('./lib');

const MAX_SHARED = 1000;

/**
 * Returns the shared reminders of every account the caller is connected to. Runs in admin context so
 * the read never depends on the reminder collection's security rule — CloudBase realtime watch cannot
 * reliably push another user's documents, so the client re-fetches through this function instead.
 * Caller identity comes from the auth context.
 *
 * @returns {Promise<object>} { success, items }
 */
exports.main = async () => {
	const callerOpenid = getCallerOpenid();
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
