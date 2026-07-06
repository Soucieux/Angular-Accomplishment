/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import { onRequest } from 'firebase-functions/v2/https';
// import * as logger from 'firebase-functions/logger';

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

import * as functions from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import fetch, { Response } from 'node-fetch';
import type { Response as ExpressResponse } from 'express';
import cloudbase from '@cloudbase/node-sdk';

const getMovieData = functions.https.onRequest(async (req, res) => {
	const url = req.query.url as string;
	const type = req.query.type as string;
	res.set('Access-Control-Allow-Origin', '*');

	if (!url) {
		res.status(400).json({ error: 'Missing image URL' });
		return;
	}

	if (!type) {
		res.status(400).json({ error: 'Missing type parameter' });
		return;
	}

	// Validate and restrict the target URL to prevent SSRF
	let validatedUrl: string;
	try {
		const parsed = new URL(url);

		// Only allow http/https
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			res.status(400).json({ error: 'Invalid URL protocol' });
			return;
		}

		// Allow-list of hostnames or domains we proxy for (adjust as needed)
		const hostname = parsed.hostname.toLowerCase();
		const allowedHostnames = ['movie.douban.com', 'api.wmdb.tv', 'img.wmdb.tv'];
		const allowedSuffixes = ['.doubanio.com'];

		const isExactAllowed = allowedHostnames.includes(hostname);
		const isSuffixAllowed = allowedSuffixes.some((suffix) => hostname.endsWith(suffix));

		if (!isExactAllowed && !isSuffixAllowed) {
			res.status(400).json({ error: 'Target host is not allowed' });
			return;
		}

		validatedUrl = parsed.toString();
	} catch {
		res.status(400).json({ error: 'Invalid URL format' });
		return;
	}

	try {
		const response = await fetch(validatedUrl, {
			headers: {
				'X-Requested-With': 'XMLHttpRequest',
				Referer: 'https://movie.douban.com/',
				'User-Agent': 'Mozilla/5.0'
			}
		});

		if (!response.ok) {
			res.status(response.status).send('Upstream request failed');
			return;
		}

		if (type === 'image') {
			const contentType = response.headers.get('content-type') ?? 'image/jpeg';
			res.setHeader('Content-Type', contentType);
		} else if (type === 'json') {
			res.setHeader('Content-Type', 'application/json; charset=utf-8');
		} else {
			res.setHeader('Content-Type', 'text/html; charset=utf-8');
		}

		if (response.body) {
			response.body.pipe(res);
		} else {
			res.status(500).send('No image data received');
		}
	} catch (error: unknown) {
		console.error(error);
		res.status(500).send('Internal server error');
	}
});

/** Brandfetch client ID — used for both the Brand Search and Logo APIs. Read from Secret Manager. */
const brandfetchClientId = defineSecret('BRANDFETCH_CLIENT_ID');

/**
 * Reads the Brandfetch client ID, trimmed. Secrets set via `firebase functions:secrets:set` commonly
 * carry a trailing newline, which would become `%0A` in the `?c=` query param and be rejected by the
 * Logo CDN (Brand Search is more lenient, so it can still succeed) — trimming avoids that failure mode.
 *
 * @returns The trimmed client ID.
 */
const brandfetchClientIdValue = (): string => brandfetchClientId.value().trim();

/**
 * Streams an upstream image response back to the client with a day-long cache, or a 404 when the
 * response carries no body. Used by {@link brandlogo}.
 *
 * @param res - The outgoing response to stream the image into.
 * @param upstream - The successful upstream image response to forward.
 */
function streamImage(res: ExpressResponse, upstream: Response): void {
	res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'image/png');
	res.setHeader('Cache-Control', 'public, max-age=86400');
	if (upstream.body) {
		upstream.body.pipe(res);
	} else {
		res.status(404).send('No image data received');
	}
}

/**
 * Fetches the best available logo for a domain, preferring quality then falling back for coverage:
 * Brandfetch's real brand logo when it has one (the `/fallback/404/` path forces a 404 on a miss so its
 * generic lettermark placeholder is skipped), otherwise Google's favicon for the long tail of non-brand
 * sites. Shared by the live {@link brandlogo} proxy and the {@link cacheFavicons} job — they diverge only
 * on how they consume the returned response (stream vs base64 buffer).
 *
 * @param domain - The bare hostname to resolve a logo for.
 * @param clientId - The Brandfetch client ID.
 * @returns The winning upstream response and its source, or null when neither source has an icon.
 */
/**
 * Reports whether a fetched response is a usable image — a 2xx with an `image/*` content type. Guards
 * against upstreams that answer a miss with a redirect to an HTML page instead of a proper error status:
 * Brandfetch's CDN 302s to its hotlinking docs when the client ID is missing or not authorized for the
 * Logo CDN, and node-fetch follows that to a 200 HTML page — which must never be streamed as an icon.
 *
 * @param response - The upstream response to check.
 * @returns True when the response is a 2xx image.
 */
function isImageResponse(response: Response): boolean {
	return response.ok && (response.headers.get('content-type') ?? '').startsWith('image/');
}

async function fetchBestLogo(
	domain: string,
	clientId: string
): Promise<{ response: Response; source: 'brandfetch' | 'google' } | null> {
	const brandfetchUrl = `https://cdn.brandfetch.io/${encodeURIComponent(
		domain
	)}/fallback/404/icon?c=${encodeURIComponent(clientId)}`;
	const brandfetchResponse = await fetch(brandfetchUrl);
	if (isImageResponse(brandfetchResponse)) return { response: brandfetchResponse, source: 'brandfetch' };

	const googleResponse = await fetch(
		`https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(domain)}`
	);
	return isImageResponse(googleResponse) ? { response: googleResponse, source: 'google' } : null;
}

/**
 * Resolves a link domain to its best logo and streams it back, upgrading Portal's link favicons:
 * Brandfetch's real brand logo when available, otherwise Google's favicon for non-brand sites. Runs on
 * Google infrastructure overseas, so it also works where the sources are unreachable directly (mainland
 * China). A total miss returns 404 so the client falls back to the link's letter initial.
 */
export const brandlogo = functions.https.onRequest(
	{ secrets: [brandfetchClientId] },
	async (req, res) => {
		res.set('Access-Control-Allow-Origin', '*');

		const domain = ((req.query.domain as string) || '').trim().toLowerCase();
		if (!domain || !/^[a-z0-9.-]+$/.test(domain)) {
			res.status(400).json({ error: 'Invalid domain' });
			return;
		}

		try {
			const best = await fetchBestLogo(domain, brandfetchClientIdValue());
			if (!best) {
				res.status(404).send('No logo available');
				return;
			}
			streamImage(res, best.response);
		} catch (error: unknown) {
			console.error(error);
			res.status(500).send('Internal server error');
		}
	}
);

export const thread1 = functions.https.onRequest(getMovieData);
export const thread2 = functions.https.onRequest(getMovieData);
export const thread3 = functions.https.onRequest(getMovieData);
export const thread4 = functions.https.onRequest(getMovieData);
export const thread5 = functions.https.onRequest(getMovieData);

/*
 * Scheduled favicon cache. Once a day it fetches the best logo (via the same Brandfetch-first, Google-
 * fallback hybrid as the live brandlogo proxy) for every portal link not yet cached at brandfetch
 * quality, and stores it as a base64 data URI on the link's CloudBase document, so the app renders that
 * copy first — icons then work even where the sources are unreachable, notably mainland China.
 * Incremental: a link is (re)cached only until it has a `faviconSource`, so existing Google-cached links
 * upgrade to Brandfetch exactly once and are skipped thereafter. Markers written: faviconCachedAt,
 * faviconFailed, faviconSource ('brandfetch' | 'google').
 *
 * CloudBase admin credentials come from Secret Manager — set them once with:
 *   firebase functions:secrets:set CLOUDBASE_SECRET_ID
 *   firebase functions:secrets:set CLOUDBASE_SECRET_KEY
 *   firebase functions:secrets:set CLOUDBASE_ENV_ID
 */
const USEFUL_LINKS_COLLECTION = 'useful_links';
const FAVICON_PAGE_SIZE = 1000;

const cloudbaseSecretId = defineSecret('CLOUDBASE_SECRET_ID');
const cloudbaseSecretKey = defineSecret('CLOUDBASE_SECRET_KEY');
const cloudbaseEnvId = defineSecret('CLOUDBASE_ENV_ID');

/** Formats a Date as `YYYY.MM.DD HH:MM:SS`, matching the app's timestamp style. */
function formatTimestamp(date: Date): string {
	const pad = (value: number) => String(value).padStart(2, '0');
	return (
		`${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ` +
		`${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
	);
}

export const cacheFavicons = onSchedule(
	{
		schedule: '0 3 * * *',
		timeZone: 'UTC',
		secrets: [cloudbaseSecretId, cloudbaseSecretKey, cloudbaseEnvId, brandfetchClientId],
		timeoutSeconds: 300,
		memory: '256MiB'
	},
	async () => {
		const app = cloudbase.init({
			secretId: cloudbaseSecretId.value(),
			secretKey: cloudbaseSecretKey.value(),
			env: cloudbaseEnvId.value()
		});
		const db = app.database();

		// Read every link, paging past CloudBase's per-query cap.
		const links: any[] = [];
		let offset = 0;
		for (;;) {
			const res = await db.collection(USEFUL_LINKS_COLLECTION).skip(offset).limit(FAVICON_PAGE_SIZE).get();
			const page = res.data ?? [];
			links.push(...page);
			if (page.length < FAVICON_PAGE_SIZE) {
				break;
			}
			offset += FAVICON_PAGE_SIZE;
		}

		/* Actual links (not categories) not yet cached at brandfetch quality: those with no cached favicon,
		   plus legacy Google-cached links (no faviconSource) that get a one-time upgrade pass. */
		const toCache = links.filter(
			(link) => link.type === 'link' && (!link.cachedFavicon || !link.faviconSource)
		);
		const timestamp = formatTimestamp(new Date());
		const clientId = brandfetchClientIdValue();

		let cached = 0;
		let failed = 0;
		for (const link of toCache) {
			const doc = db.collection(USEFUL_LINKS_COLLECTION).doc(link._id);
			try {
				const hostname = new URL(link.url).hostname;
				const best = await fetchBestLogo(hostname, clientId);
				const buffer = best ? await best.response.buffer() : null;
				if (!best || !buffer || buffer.length === 0) {
					throw new Error('no logo available');
				}
				const contentType = best.response.headers.get('content-type') ?? 'image/png';
				const dataUri = `data:${contentType};base64,${buffer.toString('base64')}`;
				await doc.update({
					cachedFavicon: dataUri,
					faviconCachedAt: timestamp,
					faviconFailed: false,
					faviconSource: best.source
				});
				cached += 1;
			} catch (error: unknown) {
				await doc.update({ faviconFailed: true });
				failed += 1;
				console.error(`favicon cache failed for ${link.url}:`, error);
			}
		}

		console.log(`favicon cache: ${cached} cached, ${failed} failed of ${toCache.length} candidates`);
	}
);
