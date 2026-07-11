import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { CLOUDBASE, DatabaseService } from './app/backend/database-service/database.service';
import { CloudbaseService } from './app/backend/database-service/cloudbase/cloudbase.service';
import { LOG } from './app/common/app.logs';
import { environment } from './environment/environment';

if ('__TAURI_INTERNALS__' in window) {
	document.addEventListener('contextmenu', (e) => e.preventDefault(), true);
}

void (async () => {
	const className = 'Main';
	const providers = [...appConfig.providers];
	providers.push({ provide: DatabaseService, useClass: CloudbaseService });

	const { default: cloudbase } = await import('@cloudbase/js-sdk');
	const app = cloudbase.init({
		env: environment.cloudbase.envId,
		region: environment.cloudbase.region
	});
	providers.push({ provide: CLOUDBASE, useValue: app });

	LOG.info(className, 'All startup completed');
	await bootstrapApplication(AppComponent, { providers: providers });
})();
