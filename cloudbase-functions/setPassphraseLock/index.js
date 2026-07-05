const { db, PASSPHRASE_LOCKS, getCallerOpenid, hashPassphrase, isValidFeatureKey, loadPassphraseLockDoc } = require('./lib');

const PASSPHRASE_MIN_LENGTH = 4;

/**
 * Sets (or replaces) the caller's own passphrase hash for the given feature key. Used both for
 * first-time setup and for later changes — always overwrites any existing hash for that key, and
 * leaves other feature keys' hashes untouched. Written to the dedicated passphrase_locks collection
 * (never the shared users document), keyed by _id == openid so this is a plain upsert.
 *
 * @param {object} event - { featureKey, passphrase } — the feature identifier and new plaintext passphrase.
 * @returns {Promise<object>} { success, error? }
 */
exports.main = async (event) => {
	const callerOpenid = getCallerOpenid();
	if (!callerOpenid) return { success: false, error: 'UNAUTHENTICATED' };

	const featureKey = event && event.featureKey;
	const passphrase = event && event.passphrase;
	if (
		!isValidFeatureKey(featureKey) ||
		typeof passphrase !== 'string' ||
		passphrase.length < PASSPHRASE_MIN_LENGTH
	) {
		return { success: false, error: 'INVALID_INPUT' };
	}

	const existing = await loadPassphraseLockDoc(callerOpenid);
	const locks = Object.assign({}, (existing && existing.locks) || {}, { [featureKey]: hashPassphrase(passphrase) });
	await db.collection(PASSPHRASE_LOCKS).doc(callerOpenid).set({ _openid: callerOpenid, locks });
	return { success: true };
};
