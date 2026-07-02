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
import fetch from 'node-fetch';

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
