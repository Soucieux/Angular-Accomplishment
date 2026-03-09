import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { LOG } from './app/app.logs';

async function getStarted() {
	const utilities = inject(Utilities);
	return utilities
		.checkCurrentCountry()
		.then(() => LOG.info('Configuration', 'All startup tasks complete'))
		.catch(() => {
			LOG.warn('Confirguation', 'Unable to acquire country code from current API');
			utilities.setCurrentRegion('CN');
			// Return resolved promise so that the project is not being blocked
			return Promise.resolve();
		});
}
getStarted();

bootstrapApplication(AppComponent, appConfig).catch((err) => LOG.error('', ''));
