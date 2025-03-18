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

	try {
		const response = await fetch(url, {
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
			res.setHeader('Content-Type', 'image/jpeg');
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
	} catch (error: any) {
		console.error(error);
		res.set('Access-Control-Allow-Origin', '*');
		res.status(500).send('Internal server error');
	}
});

export const thread1 = functions.https.onRequest(getMovieData);
export const thread2 = functions.https.onRequest(getMovieData);
export const thread3 = functions.https.onRequest(getMovieData);
export const thread4 = functions.https.onRequest(getMovieData);
export const thread5 = functions.https.onRequest(getMovieData);
