import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { CN, Utilities } from './app/common/app.utilities';
import { CLOUDBASE, DatabaseService } from './app/backend/database-service/database.service';
import { CloudbaseService } from './app/backend/database-service/cloudbase/cloudbase.service';
import { FirebaseService } from './app/backend/database-service/firebase/firebase.service';
import { LOG } from './app/common/app.logs';
import { environment } from './environment/environment';

(async () => {
	const className = 'Main';
	try {
		await Utilities.checkCurrentCountry();
		const country = Utilities.getCurrentCountry();
		if (country == '') {
			LOG.error(className, 'Country not set');
		}

		let providers = [...appConfig.providers];

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
			const { provideFirebaseApp, initializeApp } = await import('@angular/fire/app');
			const { provideAuth, getAuth } = await import('@angular/fire/auth');
			const { provideDatabase, getDatabase } = await import('@angular/fire/database');
			const { provideStorage, getStorage } = await import('@angular/fire/storage');

			providers.push(
				provideFirebaseApp(() => initializeApp(environment.firebase)),
				provideStorage(() => getStorage()),
				provideAuth(() => getAuth()),
				provideDatabase(() => getDatabase())
			);
		}
		LOG.info(className, 'All startup completed');
		await bootstrapApplication(AppComponent, { providers: providers });
	} catch (error) {
		LOG.error(className, 'Startup failed: ' + error);
	}
})();
