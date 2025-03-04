import { Injectable } from '@angular/core';
import { Storage, ref as storageRef } from '@angular/fire/storage';
import { LOG } from '../log';
import { listAll, uploadBytes } from 'firebase/storage';

@Injectable({
	providedIn: 'root'
})
export class FirebaseStorageService {
	private readonly className = 'FirebaseStorageService';
	constructor(private storage: Storage) {}

	async uploadImageToFirebase(coverImageId: string, coverImage: Blob, movieName: string): Promise<void> {
		try {
			const storageRefer = storageRef(this.storage, `/movies/${coverImageId}`);
			await uploadBytes(storageRefer, coverImage);
		} catch (error) {
			LOG.error(
				this.className,
				`Error while uploading image to firebase for ${movieName}`,
				error as Error
			);
		}
	}

	async getAllImageNamesFromFirebase(): Promise<string[]> {
		try {
			const moviesRef = storageRef(this.storage, 'movies');
			const fileList = await listAll(moviesRef);
			const extractFileNames = fileList.items.map((item) => item.name);
			return extractFileNames;
		} catch (error) {
			LOG.error(this.className, 'Error while getting all image names from firebase', error as Error);
			return [];
		}
	}
}
