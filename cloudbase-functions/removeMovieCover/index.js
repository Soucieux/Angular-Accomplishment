// ============================================================================
// removeMovieCover — Tencent CloudBase cloud function
// Objective: Delete a movie cover image from CloudBase Storage by movie name.
//
// Called via: cloudbase.callFunction({ name: 'removeMovieCover', data: { ... } })
// Request data: { accessToken: string, movieName: string }
// Auth: accessToken must match the ACCESS_TOKEN environment variable.
//
// The file ID is constructed deterministically from the movie name using the
// same path convention as uploadCoverImage: movies/<movieName>.jpeg
// ============================================================================

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// Must match the envId and bucket in environment.ts (cloudbase.envId / cloudbase.bucket).
// The CloudBase file ID format is: cloud://[envId].[bucket]/[cloudPath]
// where [bucket] is the full COS bucket name (without the .cos.<region>.myqcloud.com suffix).
const ENV_ID = 'vision-canvas-2gs531jy76d7aaa9';
const BUCKET = '7669-vision-canvas-2gs531jy76d7aaa9-1405061845';

exports.main = async (event, context) => {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const token = event.accessToken;
    const validToken = process.env.ACCESS_TOKEN;

    if (!token || token !== validToken) {
        return { success: false, error: 'unauthorized' };
    }

    // ── Validate input ────────────────────────────────────────────────────────
    const { movieName } = event;

    if (!movieName || typeof movieName !== 'string') {
        return { success: false, error: 'movieName is required' };
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    const fileID = `cloud://${ENV_ID}.${BUCKET}/movies/${movieName}.jpeg`;

    try {
        const result = await cloud.deleteFile({ fileList: [fileID] });
        const fileResult = result.fileList?.[0];

        // CloudBase returns status 0 for success
        if (!fileResult || fileResult.status !== 0) {
            return {
                success: false,
                error: fileResult?.errMsg || 'deleteFile returned a non-zero status',
                fileID
            };
        }

        return { success: true, fileID };
    } catch (error) {
        return { success: false, error: error.message || 'delete failed', fileID };
    }
};
