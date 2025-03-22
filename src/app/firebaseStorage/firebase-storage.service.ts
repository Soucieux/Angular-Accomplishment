import { Injectable } from '@angular/core';
import { Storage, ref as storageRef } from '@angular/fire/storage';
import { LOG } from '../log';
import { getDownloadURL, uploadBytes } from 'firebase/storage';

@Injectable({
	providedIn: 'root'
})
export class FirebaseStorageService {
	private readonly className = 'FirebaseStorageService';
	constructor(private storage: Storage) {}

	/**
	 * Upload the movie cover to firebase storage and return the downloadable link.
	 *
	 * @param coverImageId - The ID of the movie cover to upload.
	 * @param coverImage - The movie cover to upload.
	 * @param movieName - The name of the movie to upload.
	 * @returns A string that represents the downloadable link of the movie cover.
	 */
	async uploadImageAndGetDownloadLink(
		coverImageId: string,
		coverImage: Blob,
		movieName: string
	): Promise<string> {
		try {
			const storageRefer = storageRef(this.storage, `/movies/${coverImageId}`);
			await uploadBytes(storageRefer, coverImage, {
				contentType: 'image/jpeg'
			});
			return await getDownloadURL(storageRefer);
		} catch (error) {
			LOG.error(
				this.className,
				`Error while uploading image to firebase or getting download link for ${movieName}`,
				error as Error
			);
			return '';
		}
	}
}
