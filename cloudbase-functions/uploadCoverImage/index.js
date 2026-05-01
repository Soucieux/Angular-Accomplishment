// ============================================================================
// uploadCoverImage — Tencent CloudBase cloud function
// Objective: Receive a base64-encoded JPEG from the browser and upload it
//            to CloudBase Storage, returning the cloud:// file ID.
//
// Called via: cloudbase.callFunction({ name: 'uploadCoverImage', data: { ... } })
// Request data: { accessToken: string, image: string (base64), movieName: string }
// Auth: accessToken must match the ACCESS_TOKEN environment variable set in the
//       CloudBase function configuration (same variable used by other functions).
// ============================================================================

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const token = event.accessToken;
    const validToken = process.env.ACCESS_TOKEN;

    if (!token || token !== validToken) {
        return { success: false, error: 'unauthorized' };
    }

    // ── Validate input ────────────────────────────────────────────────────────
    const { image, movieName } = event;

    if (!image || typeof image !== 'string') {
        return { success: false, error: 'image (base64 string) is required' };
    }
    if (!movieName || typeof movieName !== 'string') {
        return { success: false, error: 'movieName is required' };
    }

    // ── Upload ────────────────────────────────────────────────────────────────
    try {
        const buffer = Buffer.from(image, 'base64');
        const cloudPath = `movies/${movieName}.jpeg`;

        const result = await cloud.uploadFile({
            cloudPath,
            fileContent: buffer
        });

        if (!result || !result.fileID) {
            return { success: false, error: 'uploadFile did not return a fileID' };
        }

        return { success: true, fileID: result.fileID };
    } catch (error) {
        return { success: false, error: error.message || 'upload failed' };
    }
};
