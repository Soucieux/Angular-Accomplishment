const { db, _, USERS, loadUser, getCallerOpenid } = require('./lib');

/**
 * Signals that the caller changed a shared reminder by bumping a sharedRev counter on every affected
 * account's own user document — each connection AND the caller. Each account watches its own document
 * (reliable realtime), so the bump triggers a re-fetch of shared data on their side; including the
 * caller keeps their own view live too (e.g. after deleting a connection's item via the admin
 * function, which their owned-collection watch cannot observe). Caller identity comes from the auth
 * context.
 *
 * @returns {Promise<object>} { success }
 */
exports.main = async () => {
	const callerOpenid = getCallerOpenid();
	if (!callerOpenid) return { success: false };

	const caller = await loadUser(callerOpenid);
	const members = caller && Array.isArray(caller.sharedWith) ? caller.sharedWith : [];

	// One bulk write bumps every connection's document plus the caller's own.
	await db
		.collection(USERS)
		.where({ _openid: _.in([...members, callerOpenid]) })
		.update({ sharedRev: Date.now() });
	return { success: true };
};
