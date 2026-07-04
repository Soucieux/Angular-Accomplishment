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
import fetch from 'node-fetch';
import cloudbase from '@cloudbase/node-sdk';

const getMovieData = functions.https.onRequest(async (req, res) => {
	const url = req.query.url as string;
	const type = req.query.type as string;

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
			res.set('Access-Control-Allow-Origin', '*');
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

		res.set('Access-Control-Allow-Origin', '*');

		if (!response.ok) {
			res.status(response.status).send(response);
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
		res.set('Access-Control-Allow-Origin', '*');
		res.status(500).send('Internal server error');
	}
});

/**
 * Proxies a site favicon through Google's favicon service so a mainland-China browser can load it.
 * The browser cannot reach Google directly (GFW), but this function runs on Google infrastructure
 * overseas and can, then streams the icon back with permissive CORS. The only outbound host is
 * www.google.com, so there is no SSRF surface — the caller-supplied domain is a query value, never
 * the host. On any upstream failure the status is forwarded so the client falls back to a letter avatar.
 */
const getFavicon = functions.https.onRequest(async (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');

	const domain = ((req.query.domain as string) || '').trim().toLowerCase();
	if (!domain) {
		res.status(400).json({ error: 'Missing domain' });
		return;
	}

	// Reject anything that is not a bare hostname before building the fixed-host upstream URL.
	if (!/^[a-z0-9.-]+$/.test(domain)) {
		res.status(400).json({ error: 'Invalid domain' });
		return;
	}

	const target = `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(domain)}`;

	try {
		const response = await fetch(target);

		if (!response.ok) {
			res.status(response.status).send('Favicon unavailable');
			return;
		}

		res.setHeader('Content-Type', response.headers.get('content-type') ?? 'image/png');
		res.setHeader('Cache-Control', 'public, max-age=86400');

		if (response.body) {
			response.body.pipe(res);
		} else {
			res.status(502).send('No favicon data received');
		}
	} catch (error: unknown) {
		console.error(error);
		res.status(500).send('Internal server error');
	}
});

export const favicon = functions.https.onRequest(getFavicon);

export const thread1 = functions.https.onRequest(getMovieData);
export const thread2 = functions.https.onRequest(getMovieData);
export const thread3 = functions.https.onRequest(getMovieData);
export const thread4 = functions.https.onRequest(getMovieData);
export const thread5 = functions.https.onRequest(getMovieData);

/*
 * Scheduled favicon cache. Once a day it fetches the favicon for every portal
 * link that is not yet cached and stores it as a base64 data URI on the link's
 * CloudBase document, so the app renders that copy first — icons then work even
 * where the favicon proxy (this same Google-hosted service) is unreachable,
 * notably mainland China. Incremental: already-cached links are skipped, so
 * there are no duplicate upstream calls. Two markers (faviconCachedAt,
 * faviconFailed) are written for future age-based refresh / skip-failing logic.
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

/** Fetches a domain's favicon via Google's service and returns a base64 data URI. */
async function fetchFaviconDataUri(domain: string): Promise<string> {
	const target = `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(domain)}`;
	const response = await fetch(target);
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}
	const buffer = await response.buffer();
	if (buffer.length === 0) {
		throw new Error('empty favicon body');
	}
	const contentType = response.headers.get('content-type') ?? 'image/png';
	return `data:${contentType};base64,${buffer.toString('base64')}`;
}

export const cacheFavicons = onSchedule(
	{
		schedule: '0 3 * * *',
		timeZone: 'UTC',
		secrets: [cloudbaseSecretId, cloudbaseSecretKey, cloudbaseEnvId],
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

		// Only actual links (not categories) that have no cached favicon yet.
		const toCache = links.filter((link) => link.type === 'link' && !link.cachedFavicon);
		const timestamp = formatTimestamp(new Date());

		let cached = 0;
		let failed = 0;
		for (const link of toCache) {
			const doc = db.collection(USEFUL_LINKS_COLLECTION).doc(link._id);
			try {
				const hostname = new URL(link.url).hostname;
				const dataUri = await fetchFaviconDataUri(hostname);
				await doc.update({ cachedFavicon: dataUri, faviconCachedAt: timestamp, faviconFailed: false });
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
