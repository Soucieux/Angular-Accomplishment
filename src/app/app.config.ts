import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { environment } from '../environment/environment';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import Aura from '@primeng/themes/aura';
export const appConfig: ApplicationConfig = {
	providers: [
		provideRouter(routes),
		provideClientHydration(),
		importProvidersFrom(BrowserAnimationsModule),
		provideAnimationsAsync(),
		provideFirebaseApp(() => initializeApp(environment.firebase)),
		provideStorage(() => getStorage()),
		provideAuth(() => getAuth()),
		provideDatabase(() => getDatabase()),
		provideHttpClient(withFetch()),
		providePrimeNG({
			theme: {
				preset: Aura
			}
		}),
		MessageService
	]
};
