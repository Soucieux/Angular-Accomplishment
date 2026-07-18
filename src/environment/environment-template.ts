export const environment = {
	production: false,
	firebase: {
		apiKey: 'YOUR-API-KEY',
		/* Must be the domain that actually serves the app (e.g. your-app.web.app), not the default
		   [project].firebaseapp.com — Chrome M115+ blocks the redirect sign-in flow otherwise. */
		authDomain: 'YOUR-DOMAIN',
		databaseURL: 'YOUR-DATABASE-URL',
		projectId: 'YOUR-PROJECT-ID',
		storageBucket: 'YOUR-STORAGE-URL',
		messagingSenderId: 'YOUR-MESSAGE-ID',
		appId: 'YOUR-ADD-ID',
		measurementId: 'YOUR-MEASUREMENT-ID'
	},
	cloudbase: {
		envId: 'YOUR-ENV-ID',
		bucket: 'YOUR-COS-BUCKET-ID',
		region: 'ap-shanghai',
		accessToken: 'YOUR-CLOUD-FUNCTION-TOKEN'
	}
};
