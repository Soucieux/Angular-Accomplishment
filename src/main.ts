import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { Utilities } from './app/common/utilities/app.utilities';
import {
	CLOUDBASE,
	DatabaseService,
	FIREBASE_AUTH,
	FIREBASE_DATABASE,
	FIREBASE_STORAGE
} from './app/backend/database-service/database.service';
import { CloudbaseService } from './app/backend/database-service/cloudbase/cloudbase.service';
import { FirebaseService } from './app/backend/database-service/firebase/firebase.service';
import { LOG } from './app/common/app.logs';
import { APP_LOG_STARTUP_COMPLETED, APP_LOG_STARTUP_FAILED } from './app/common/constants';
import { environment } from './environment/environment';

if ('__TAURI_INTERNALS__' in window) {
	document.addEventListener('contextmenu', (e) => e.preventDefault(), true);
}

const className = 'Main';

(async () => {
	/* The data backend follows the last sign-in method: Firebase for Google users, CloudBase for
	   everyone else (the default). Both auth SDKs are always initialised so the login page can offer
	   both username/password (CloudBase) and Google (Firebase) regardless of the current backend;
	   only the Firebase database/storage services are gated, since those load the user's data. */
	const useFirebase = Utilities.isFirebaseBackend();

	const providers = [...appConfig.providers];
	providers.push({
		provide: DatabaseService,
		useClass: useFirebase ? FirebaseService : CloudbaseService
	});

	// CloudBase is always initialised — username/password sign-in and anonymous public access work
	// from either backend.
	const { default: cloudbase } = await import('@cloudbase/js-sdk');
	const cloudbaseApp = cloudbase.init({
		env: environment.cloudbase.envId,
		region: environment.cloudbase.region
	});
	providers.push({ provide: CLOUDBASE, useValue: cloudbaseApp });

	// Firebase Auth is always initialised — Google sign-in works from either backend. Its database
	// and storage services load only when Firebase is the active data backend.
	const [{ initializeApp }, { getAuth }] = await Promise.all([
		import('firebase/app'),
		import('firebase/auth')
	]);
	/* useFactory keeps each Firebase service lazy — getAuth() in particular starts auth-state
	   restoration, so it should only run when the token is first injected. */
	const firebaseApp = initializeApp(environment.firebase);
	providers.push({ provide: FIREBASE_AUTH, useFactory: () => getAuth(firebaseApp) });

	if (useFirebase) {
		const [{ getDatabase }, { getStorage }] = await Promise.all([
			import('firebase/database'),
			import('firebase/storage')
		]);
		providers.push(
			{ provide: FIREBASE_DATABASE, useFactory: () => getDatabase(firebaseApp) },
			{ provide: FIREBASE_STORAGE, useFactory: () => getStorage(firebaseApp) }
		);
	}
	LOG.info(className, APP_LOG_STARTUP_COMPLETED);
	await bootstrapApplication(AppComponent, { providers: providers });
})().catch((error: unknown) => {
	// Logged rather than dropped: a failed bootstrap leaves a blank page with no other signal.
	LOG.error(className, APP_LOG_STARTUP_FAILED, error as Error);
});
