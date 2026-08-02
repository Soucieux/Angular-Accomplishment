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
import { onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import * as crypto from 'crypto';
import fetch, { Response } from 'node-fetch';
import type { Response as ExpressResponse } from 'express';
import cloudbase from '@cloudbase/node-sdk';

// Admin SDK for the passphrase-lock callables — reads its config from the Functions runtime env.
initializeApp();

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

/** Firecrawl API key — used to read the Douban rating. Read from Secret Manager. */
const firecrawlApiKey = defineSecret('FIRECRAWL_API_KEY');

/** Returned when no rating can be resolved — mirrors MovieItemVO's unset rate. */
const RATE_UNRESOLVED = -1;

/**
 * Milliseconds Firecrawl waits for the Douban page to finish rendering before extracting. Without
 * it the capture lands on a half-built page and the extraction comes back empty.
 */
const SCRAPE_WAIT_MS = 4000;
/** Ceiling on the whole Firecrawl call, comfortably above the render wait above. */
const SCRAPE_TIMEOUT_MS = 25000;

/**
 * Fields Firecrawl extracts from the Douban subject page. Schema-guided extraction is used rather
 * than a markup regex so a Douban layout change cannot silently break the lookup. Both are declared
 * as strings because that is what the extractor returns ("6.6", "2026-06-11"); the numeric coercion
 * happens below. Neither is marked required — a genuinely missing value must come back absent
 * rather than invented.
 */
const MOVIE_DETAILS_SCHEMA = {
	type: 'object',
	properties: {
		rate: { type: 'string', description: 'The Douban rating out of 10, for example "6.6"' },
		releaseDate: {
			type: 'string',
			description: 'The first release or air date in YYYY-MM-DD form, for example "2026-06-11"'
		}
	}
};

/**
 * Reads a single Douban subject page through Firecrawl and returns its rating and release date. The
 * third-party metadata API leaves both blank for some titles (upcoming series especially), and
 * Douban blocks the plain proxy, so Firecrawl's proxy/rendering layer is the only way to read them.
 *
 * This is a fallback: only the add and restore flows call it, and only when the third-party API left
 * one of the two fields empty. The bulk rate refresh never does.
 */
export const movierate = functions.https.onRequest(
	{ secrets: [firecrawlApiKey] },
	async (req, res) => {
		res.set('Access-Control-Allow-Origin', '*');

		// Step 1: Guard — the id is interpolated into the target URL, so only digits are accepted
		const movieId = ((req.query.id as string) || '').trim();
		if (!/^\d+$/.test(movieId)) {
			res.status(400).json({ error: 'Invalid movie id' });
			return;
		}

		try {
			// Step 2: Scrape the subject page with schema-guided JSON extraction
			const upstream = await fetch('https://api.firecrawl.dev/v2/scrape', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${firecrawlApiKey.value().trim()}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					url: `https://movie.douban.com/subject/${movieId}/`,
					waitFor: SCRAPE_WAIT_MS,
					formats: [
						{
							type: 'json',
							schema: MOVIE_DETAILS_SCHEMA,
							prompt: 'Extract the Douban rating (out of 10) and the first release or air date for this title.'
						}
					]
				}),
				/* Without a ceiling a hung Firecrawl holds a billed instance for the platform's full
				   60s timeout, and the client sits behind its blocking overlay for all of it. */
				signal: AbortSignal.timeout(SCRAPE_TIMEOUT_MS)
			});

			/* Step 3: Surface an upstream failure instead of masking it as an unresolved rating —
			   a silent -1 is indistinguishable from an unrated page and hides key/quota errors.
			   Checked before parsing: a 5xx from a gateway answers with HTML, and calling .json()
			   on that throws, which would surface as a bare 500 without these diagnostics. */
			if (!upstream.ok) {
				console.error('Firecrawl scrape failed', upstream.status);
				res.status(502).json({ error: 'Rate lookup failed' });
				return;
			}

			const payload = (await upstream.json()) as {
				success?: boolean;
				error?: string;
				data?: { json?: { rate?: string; releaseDate?: string } };
			};

			if (payload.success === false) {
				console.error('Firecrawl scrape failed', upstream.status, payload.error);
				res.status(502).json({ error: 'Rate lookup failed' });
				return;
			}

			/* Step 4: Hand back the extracted fields, normalised for the client — the extractor answers
			   with strings, so the rate is coerced here and a missing or non-numeric one falls back to
			   the sentinel. The date stays the raw YYYY-MM-DD so the caller formats it exactly as it
			   formats the third-party API's own date. */
			/* A miss here means Firecrawl answered 200 but ran no extraction, so log both key sets:
			   whether `json` is absent from `data` separates "the format request was ignored" from
			   "the page yielded nothing", which need different fixes. */
			const extracted = payload.data?.json;
			if (!extracted) {
				console.error(
					'Firecrawl returned no json payload — top-level keys:',
					Object.keys(payload),
					'| data keys:',
					payload.data ? Object.keys(payload.data) : '(no data)'
				);
				res.json({ rate: RATE_UNRESOLVED, releaseDate: '' });
				return;
			}

			const rate = Number(extracted?.rate);
			res.json({
				rate: Number.isFinite(rate) && rate > 0 ? rate : RATE_UNRESOLVED,
				releaseDate: typeof extracted?.releaseDate === 'string' ? extracted.releaseDate : ''
			});
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

/* ─────────────────────────────────────────
   Passphrase-lock callables

   Firebase mirror of the CloudBase passphrase Cloud Functions (cloudbase-functions/*PassphraseLock*).
   Hashes live in the dedicated passphrase_locks/<uid> node — never under users/<uid> — so the
   client's whole-node watches (e.g. getUserStats) can never pull a stored hash along for the ride.
   Only these callables ever read or write it; database rules must deny all client access to
   passphrase_locks. The hash never leaves the server — callers only receive booleans.
───────────────────────────────────────── */

const PASSPHRASE_LOCKS = 'passphrase_locks';
const SCRYPT_KEYLEN = 64;
const PASSPHRASE_MIN_LENGTH = 4;
const FEATURE_KEY_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;

/**
 * Validates a passphrase-lock feature key before it is used as a database key, rejecting
 * `__proto__` and anything outside a plain lowercase-alphanumeric/dash/underscore shape.
 *
 * @param featureKey - The candidate feature key from the caller.
 * @returns True when the feature key is safe to use as a database key.
 */
const isValidFeatureKey = (featureKey: unknown): featureKey is string =>
	typeof featureKey === 'string' && featureKey !== '__proto__' && FEATURE_KEY_PATTERN.test(featureKey);

/**
 * Hashes a passphrase with a random salt using scrypt — the same scheme as the CloudBase
 * functions, so both backends store interchangeable "saltHex:hashHex" values.
 *
 * @param passphrase - The plaintext passphrase to hash.
 * @returns The salt and hash encoded as "saltHex:hashHex".
 */
const hashPassphrase = (passphrase: string): string => {
	const salt = crypto.randomBytes(16).toString('hex');
	const hash = crypto.scryptSync(passphrase, salt, SCRYPT_KEYLEN).toString('hex');
	return `${salt}:${hash}`;
};

/**
 * Verifies a passphrase attempt against a stored "saltHex:hashHex" value using a timing-safe
 * comparison.
 *
 * @param passphrase - The plaintext passphrase attempt.
 * @param stored - The stored "saltHex:hashHex" value.
 * @returns True when the passphrase matches the stored hash.
 */
const verifyPassphrase = (passphrase: string, stored: unknown): boolean => {
	if (!stored || typeof stored !== 'string' || !stored.includes(':')) return false;
	const [salt, hash] = stored.split(':');
	const attempt = crypto.scryptSync(passphrase, salt, SCRYPT_KEYLEN);
	const expected = Buffer.from(hash, 'hex');
	return attempt.length === expected.length && crypto.timingSafeEqual(attempt, expected);
};

/**
 * Loads the caller's passphrase-lock map — feature keys to stored hashes — from the dedicated
 * passphrase_locks node.
 *
 * @param uid - The caller's Firebase uid.
 * @returns The locks map, or an empty object when none exists.
 */
const loadLocks = async (uid: string): Promise<Record<string, unknown>> => {
	const snapshot = await getDatabase().ref(`${PASSPHRASE_LOCKS}/${uid}/locks`).get();
	return snapshot.val() ?? {};
};

/**
 * Reports whether the caller has already set a passphrase for the given feature key. Never
 * exposes the stored hash itself, only a boolean.
 */
export const getPassphraseLockStatus = onCall(async (request) => {
	const uid = request.auth?.uid;
	if (!uid) return { success: false, isSet: false };

	const featureKey = request.data?.featureKey;
	if (!isValidFeatureKey(featureKey)) return { success: false, isSet: false };

	const locks = await loadLocks(uid);
	return { success: true, isSet: typeof locks[featureKey] === 'string' };
});

/**
 * Sets (or replaces) the caller's own passphrase hash for the given feature key. Used both for
 * first-time setup and for later changes — always overwrites any existing hash for that key,
 * leaving other feature keys' hashes untouched.
 */
export const setPassphraseLock = onCall(async (request) => {
	const uid = request.auth?.uid;
	if (!uid) return { success: false, error: 'UNAUTHENTICATED' };

	const featureKey = request.data?.featureKey;
	const passphrase = request.data?.passphrase;
	if (
		!isValidFeatureKey(featureKey) ||
		typeof passphrase !== 'string' ||
		passphrase.length < PASSPHRASE_MIN_LENGTH
	) {
		return { success: false, error: 'INVALID_INPUT' };
	}

	await getDatabase()
		.ref(`${PASSPHRASE_LOCKS}/${uid}/locks/${featureKey}`)
		.set(hashPassphrase(passphrase));
	return { success: true };
});

/**
 * Verifies a passphrase attempt against the caller's own stored hash for the given feature key.
 * The hash never leaves the server — only a boolean success result is returned.
 */
export const verifyPassphraseLock = onCall(async (request) => {
	const uid = request.auth?.uid;
	if (!uid) return { success: false };

	const featureKey = request.data?.featureKey;
	const passphrase = request.data?.passphrase;
	if (!isValidFeatureKey(featureKey) || typeof passphrase !== 'string') return { success: false };

	const locks = await loadLocks(uid);
	return { success: verifyPassphrase(passphrase, locks[featureKey]) };
});

/**
 * Removes the caller's own passphrase for the given feature key, leaving every other feature
 * key's passphrase — and all of the feature's own data (e.g. vault nodes) — untouched.
 * Authorization is by uid: a caller can only ever clear their own. Removing an absent key is
 * still success — the desired end state (no passphrase for this key) already holds.
 */
export const removePassphraseLock = onCall(async (request) => {
	const uid = request.auth?.uid;
	if (!uid) return { success: false, error: 'UNAUTHENTICATED' };

	const featureKey = request.data?.featureKey;
	if (!isValidFeatureKey(featureKey)) return { success: false, error: 'INVALID_INPUT' };

	await getDatabase().ref(`${PASSPHRASE_LOCKS}/${uid}/locks/${featureKey}`).remove();
	return { success: true };
});

/* ─────────────────────────────────────────
   URL proxy

   The Firebase counterpart of CloudBase's fetchUrl function: fetches a public http/https URL
   server-side so the client can bypass browser CORS restrictions (Portal RSS feeds and
   link-title auto-fetch). Every request — and every redirect hop — is validated against
   private/reserved hosts so the proxy can never be steered at internal addresses (SSRF).
───────────────────────────────────────── */

const PROXY_FETCH_TIMEOUT_MS = 10000;
const PROXY_FETCH_MAX_CHARS = 2000000;
const PROXY_FETCH_MAX_REDIRECTS = 3;

/**
 * Checks whether a hostname points at a private, loopback, link-local, or otherwise internal
 * address that the proxy must never fetch. IPv6 literals are blocked wholesale — public sites
 * are reached by hostname, and allowing literals would reopen the loopback/link-local surface.
 *
 * @param hostname - The lowercase hostname extracted from the candidate URL.
 * @returns True when the host must not be fetched.
 */
const isBlockedHost = (hostname: string): boolean => {
	const host = hostname.toLowerCase();
	if (
		host === 'localhost' ||
		host.endsWith('.localhost') ||
		host.endsWith('.local') ||
		host.endsWith('.internal')
	) {
		return true;
	}
	const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
	if (ipv4) {
		const first = Number(ipv4[1]);
		const second = Number(ipv4[2]);
		return (
			first === 0 ||
			first === 10 ||
			first === 127 ||
			(first === 169 && second === 254) ||
			(first === 172 && second >= 16 && second <= 31) ||
			(first === 192 && second === 168)
		);
	}
	return host.includes(':');
};

/**
 * Validates a candidate proxy URL: must parse, must be plain http/https, and must not target a
 * blocked host.
 *
 * @param candidate - The candidate URL from the caller (or a redirect Location header).
 * @returns True when the URL is safe for the proxy to fetch.
 */
const isAllowedUrl = (candidate: unknown): candidate is string => {
	if (typeof candidate !== 'string') return false;
	try {
		const parsed = new URL(candidate);
		return (
			(parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
			!isBlockedHost(parsed.hostname)
		);
	} catch {
		return false;
	}
};

/**
 * Fetches a public URL server-side for an authenticated caller and returns its body and
 * Content-Type. Redirects are followed manually so every hop is re-validated — an open redirect
 * on an allowed host must never become a bridge to a private address. The body is capped so an
 * oversized response cannot blow up the callable payload.
 */
export const proxyFetch = onCall(async (request) => {
	if (!request.auth?.uid) return { success: false, error: 'UNAUTHENTICATED' };

	let url = request.data?.url;
	if (!isAllowedUrl(url)) return { success: false, error: 'INVALID_URL' };

	try {
		let response: Response | null = null;
		for (let hop = 0; hop <= PROXY_FETCH_MAX_REDIRECTS; hop++) {
			response = await fetch(url, {
				redirect: 'manual',
				signal: AbortSignal.timeout(PROXY_FETCH_TIMEOUT_MS)
			});
			const location = response.headers.get('location');
			if (response.status >= 300 && response.status < 400 && location) {
				const next = new URL(location, url).toString();
				if (!isAllowedUrl(next)) return { success: false, error: 'BLOCKED_REDIRECT' };
				url = next;
				continue;
			}
			break;
		}
		if (!response || !response.ok) {
			return { success: false, error: `HTTP_${response?.status ?? 'NO_RESPONSE'}` };
		}
		const content = (await response.text()).slice(0, PROXY_FETCH_MAX_CHARS);
		return {
			success: true,
			content,
			contentType: response.headers.get('content-type') ?? ''
		};
	} catch (error) {
		return { success: false, error: error instanceof Error ? error.message : 'FETCH_FAILED' };
	}
});
