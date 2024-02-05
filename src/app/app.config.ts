import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { environment } from '../environment/environment';
import { provideRouter } from '@angular/router';
import { AngularFireModule } from '@angular/fire/compat';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
	providers: [
		provideRouter(routes),
		provideClientHydration(),
		importProvidersFrom([
			AngularFireModule.initializeApp(environment.firebase),
		])
	]
};
