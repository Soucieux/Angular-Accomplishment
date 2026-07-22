const { db, loadUser, getCallerOpenid, isConnectedTo, USERS, REMINDER } = require('./lib');

/** Stats field bumped for every linked member when a shared reminder is completed. */
const COMPLETED_SHARED = 'completedShared';

/** The only reminder fields a shared-edit caller may write — content only, never ownership or the shared flag. */
const EDITABLE_FIELDS = ['text', 'date', 'link', 'tag', 'startTime', 'endTime'];

/**
 * Writes to a reminder the caller does not necessarily own, enforcing the shared-edit rule in admin
 * context (the reminder collection rule is own-only, so cross-account writes must go through here).
 * The owner may always edit; any other caller may edit ONLY a shared item belonging to an account they
 * are actively linked to. Private items and non-connected accounts are always denied.
 *
 * @param {object} event - { entryKey, action?: 'delete', updates?: object } — the target reminder _id,
 *   an optional delete action, and the field updates to apply otherwise.
 * @returns {Promise<object>} { success } on success, or { success: false, error } otherwise.
 */
exports.main = async (event) => {
	const callerOpenid = getCallerOpenid();
	if (!callerOpenid) return { success: false };

	const entryKey = event && event.entryKey;
	if (!entryKey) return { success: false };

	// Resolve the target reminder's owner and shared flag.
	const res = await db.collection(REMINDER).doc(entryKey).get();
	const doc = res.data && res.data[0];
	if (!doc) return { success: false, error: 'NOT_FOUND' };

	// Authorize: owner always; otherwise the item must be shared AND the caller linked to the owner.
	if (doc._openid !== callerOpenid) {
		if (doc.isShared !== true) return { success: false, error: 'NOT_CONNECTED' };
		const caller = await loadUser(callerOpenid);
		if (!isConnectedTo(caller, doc._openid)) return { success: false, error: 'NOT_CONNECTED' };
	}

	if (event.action === 'delete') {
		await db.collection(REMINDER).doc(entryKey).remove();
		return { success: true };
	}

	if (event.action === 'complete') {
		// Completing a shared reminder removes the document, then bumps the shared-completed counter for
		// every currently linked member (the owner plus everyone in the owner's sharedWith adjacency list).
		// The increment is monotonic — a later disconnect never rolls it back.
		await db.collection(REMINDER).doc(entryKey).remove();
		const owner = await loadUser(doc._openid);
		const linked = owner && Array.isArray(owner.sharedWith) ? owner.sharedWith : [];
		const recipientOpenids = [...new Set([doc._openid, ...linked])];
		// Read-modify-write each member by their real _id with a plain number: the node-sdk does not apply
		// the _.inc update operator here, so a plain-value write (the pattern proven elsewhere) is used.
		await Promise.all(
			recipientOpenids.map(async (openid) => {
				const member = await loadUser(openid);
				if (!member) return;
				const current = typeof member[COMPLETED_SHARED] === 'number' ? member[COMPLETED_SHARED] : 0;
				await db.collection(USERS).doc(member._id).update({ [COMPLETED_SHARED]: current + 1 });
			})
		);
		return { success: true };
	}

	const updates = event.updates;
	if (!updates || typeof updates !== 'object') return { success: false };

	// Allow-list the editable content fields. A connected non-owner must never write ownership
	// metadata (_id/_openid) or flip the shared flag — only reminder content may change, so any
	// key outside EDITABLE_FIELDS is dropped rather than passed through.
	const safeUpdates = {};
	for (const key of EDITABLE_FIELDS) {
		if (Object.prototype.hasOwnProperty.call(updates, key)) safeUpdates[key] = updates[key];
	}
	if (Object.keys(safeUpdates).length === 0) return { success: false };
	await db.collection(REMINDER).doc(entryKey).update(safeUpdates);
	return { success: true };
};
