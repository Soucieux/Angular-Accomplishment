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

// Type-safe HTTP function
export const searchMovieCover = functions.https.onRequest(async (req, res) => {
	const imageUrl = req.query.url as string;

	if (!imageUrl) {
		res.status(400).json({ error: 'Missing image URL' });
		return;
	}

	try {
		const response = await fetch(imageUrl, {
			headers: {
				'X-Requested-With': 'XMLHttpRequest',
				Referer: 'https://movie.douban.com/',
				'User-Agent': 'Mozilla/5.0'
			}
		});

		res.set('Access-Control-Allow-Origin', '*');

		if (!response.ok) {
			res.status(response.status).send('Failed to fetch image');
			return;
		}

		res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');

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
