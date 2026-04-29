export const environment = {
	production: false,
	firebase: {
		apiKey: 'AIzaSyBE1sWy0GCm-NxKU8Kdc5xUGOeEa3Z4FpA',
		authDomain: 'my-own-website-2024.firebaseapp.com',
		databaseURL: 'https://my-own-website-2024-default-rtdb.firebaseio.com',
		projectId: 'my-own-website-2024',
		storageBucket: 'gs://my-own-website-2024.firebasestorage.app',
		messagingSenderId: '402312630147',
		appId: '1:402312630147:web:49c4e645690f57aec5f0b6',
		measurementId: 'G-69SWNFCXCQ'
	},
	cloudbase: {
		envId: 'vision-canvas-2gs531jy76d7aaa9',
		// Full CloudBase storage bucket name (the COS bucket name without the .cos.<region>.myqcloud.com suffix).
		// Used to build deterministic file IDs in the form: cloud://[envId].[bucket]/[cloudPath]
		// Example: cloud://vision-canvas-2gs531jy76d7aaa9.7669-vision-canvas-2gs531jy76d7aaa9-1405061845/movies/三体.jpeg
		bucket: '7669-vision-canvas-2gs531jy76d7aaa9-1405061845',
		region: 'ap-shanghai',
		accessToken: 'f6b518a5c96b459fd2f2741d6fe6c650'
	}
};
