const { getCallerOpenid, isValidFeatureKey, loadPassphraseLockDoc } = require('./lib');

/**
 * Reports whether the caller has already set a passphrase for the given feature key. Reads from the
 * dedicated passphrase_locks collection (never the shared users document) — never exposes the stored
 * hash itself, only a boolean.
 *
 * @param {object} event - { featureKey } — the generic passphrase-lock feature identifier (e.g. 'vault').
 * @returns {Promise<object>} { success, isSet }
 */
exports.main = async (event) => {
	const callerOpenid = getCallerOpenid();
	if (!callerOpenid) return { success: false, isSet: false };

	const featureKey = event && event.featureKey;
	if (!isValidFeatureKey(featureKey)) return { success: false, isSet: false };

	const doc = await loadPassphraseLockDoc(callerOpenid);
	const locks = (doc && doc.locks) || {};
	return { success: true, isSet: typeof locks[featureKey] === 'string' };
};
