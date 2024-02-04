import { AngularFireModule } from '@angular/fire/compat';

import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { environment } from '../environment/environment';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
	providers: [
		provideRouter(routes),
		provideClientHydration(),
		importProvidersFrom([
            AngularFireModule.initializeApp(environment.firebase),
            BrowserAnimationsModule
		])
	]
};
