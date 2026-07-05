const { db, PASSPHRASE_LOCKS, getCallerOpenid, isValidFeatureKey, loadPassphraseLockDoc } = require('./lib');

/**
 * Removes the caller's own passphrase for the given feature key from the dedicated passphrase_locks
 * collection, leaving every other feature key's passphrase — and all of the feature's own data (e.g.
 * vault nodes, which live in their own collection) — untouched. Authorization is by openid: a caller can
 * only ever clear their own passphrase. The account password is verified against CloudBase Auth on the
 * client before this is called, so no password is handled here. Mirrors setPassphraseLock's doc-write.
 *
 * @param {object} event - { featureKey } — the feature identifier whose passphrase to remove.
 * @returns {Promise<object>} { success, error? }
 */
exports.main = async (event) => {
	const callerOpenid = getCallerOpenid();
	if (!callerOpenid) return { success: false, error: 'UNAUTHENTICATED' };

	const featureKey = event && event.featureKey;
	if (!isValidFeatureKey(featureKey)) return { success: false, error: 'INVALID_INPUT' };

	const existing = await loadPassphraseLockDoc(callerOpenid);
	// Nothing to remove is still success — the desired end state (no passphrase for this key) already holds.
	if (!existing || !existing.locks || !(featureKey in existing.locks)) return { success: true };

	// Drop only this feature's key and write the remaining map back, so other features keep their passphrases.
	const locks = Object.assign({}, existing.locks);
	delete locks[featureKey];
	await db.collection(PASSPHRASE_LOCKS).doc(callerOpenid).set({ _openid: callerOpenid, locks });
	return { success: true };
};
