const { getCallerOpenid, verifyPassphrase, isValidFeatureKey, loadPassphraseLockDoc } = require('./lib');

/**
 * Verifies a passphrase attempt against the caller's own stored hash for the given feature key, read
 * from the dedicated passphrase_locks collection (never the shared users document). The hash never
 * leaves the server — only a boolean success result is returned.
 *
 * @param {object} event - { featureKey, passphrase } — the feature identifier and plaintext attempt.
 * @returns {Promise<object>} { success }
 */
exports.main = async (event) => {
	const callerOpenid = getCallerOpenid();
	if (!callerOpenid) return { success: false };

	const featureKey = event && event.featureKey;
	const passphrase = event && event.passphrase;
	if (!isValidFeatureKey(featureKey) || typeof passphrase !== 'string') return { success: false };

	const doc = await loadPassphraseLockDoc(callerOpenid);
	const locks = (doc && doc.locks) || {};
	return { success: verifyPassphrase(passphrase, locks[featureKey]) };
};
