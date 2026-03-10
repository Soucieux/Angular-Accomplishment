import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { AuthService } from './backend/authentication-service/auth.service';
import { LOG } from './common/app.logs';
import { MatIconModule } from '@angular/material/icon';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { CN, COMPONENT_DESTROY, Utilities } from './common/app.utilities';
import { Observable } from 'rxjs';
@Component({
	selector: 'root',
	standalone: true,
	imports: [
		CommonModule,
		RouterOutlet,
		RouterModule,
		MatSidenavModule,
		MatButtonModule,
		MatRippleModule,
		MatIconModule,
		ToastModule,
		ButtonModule
	],
	templateUrl: 'app.component.html',
	styleUrl: './app.component.css'
})
export class AppComponent {
	private readonly className = 'AppComponent';
	currentUser$!: Observable<any>;

	constructor(
		private authService: AuthService,
		@Inject(PLATFORM_ID) private platformId: Object
	) {}

	async ngOnInit() {
		if (isPlatformBrowser(this.platformId)) {
			if (Utilities.getCurrentCountry() === CN) {
				this.currentUser$ = this.authService.cloudbaseGetCurrentUser();
			} else {
				this.currentUser$ = this.authService.firebaseGetCurrentUser();
			}
		}
	}

	/**
	 * Anything that needs to be done when the component is destroyed.
	 */
	ngOnDestroy() {
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	async logout() {
		if (Utilities.getCurrentCountry() === CN) {
			await this.authService.signOut();
		} else {
			this.authService.logout();
		}
	}

	protected isCN() {
		return Utilities.getCurrentCountry() === CN;
	}
}
