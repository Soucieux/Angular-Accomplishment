import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { Utilities } from './app/common/utilities/app.utilities';
import { CN } from './app/common/constants';
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
import { environment } from './environment/environment';

if ('__TAURI_INTERNALS__' in window) {
	document.addEventListener('contextmenu', (e) => e.preventDefault(), true);
}

void (async () => {
	const className = 'Main';
	Utilities.checkCurrentCountry();
	const country = Utilities.getCurrentCountry();

	const providers = [...appConfig.providers];

	// Determine database service
	const databaseProvider =
		country === CN
			? { provide: DatabaseService, useClass: CloudbaseService }
			: { provide: DatabaseService, useClass: FirebaseService };
	providers.push(databaseProvider);

	// Load and initialize required packages
	if (country === CN) {
		const { default: cloudbase } = await import('@cloudbase/js-sdk');
		const app = cloudbase.init({
			env: environment.cloudbase.envId,
			region: environment.cloudbase.region
		});

		providers.push({ provide: CLOUDBASE, useValue: app });
	} else {
		const [{ initializeApp }, { getAuth }, { getDatabase }, { getStorage }] = await Promise.all([
			import('firebase/app'),
			import('firebase/auth'),
			import('firebase/database'),
			import('firebase/storage')
		]);

		/* useFactory keeps each Firebase service lazy — getAuth() in particular starts
		   auth-state restoration, so it should only run when the token is first injected. */
		const app = initializeApp(environment.firebase);
		providers.push(
			{ provide: FIREBASE_STORAGE, useFactory: () => getStorage(app) },
			{ provide: FIREBASE_AUTH, useFactory: () => getAuth(app) },
			{ provide: FIREBASE_DATABASE, useFactory: () => getDatabase(app) }
		);
	}
	LOG.info(className, 'All startup completed');
	await bootstrapApplication(AppComponent, { providers: providers });
})();
