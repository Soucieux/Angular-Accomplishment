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
	currentRegion: string = '';
	CN = CN;

	constructor(
		private authService: AuthService,
		private utilities: Utilities,
		@Inject(PLATFORM_ID) private platformId: Object
	) {}

	async ngOnInit() {
		if (isPlatformBrowser(this.platformId)) {
			this.currentRegion = this.utilities.getCurrentRegion();

			if (this.currentRegion === CN) {
				await this.authService.getCurrentUser();
				this.currentUser$ = this.authService.cloudbaseCurrentUser$;
			} else {
				this.currentUser$ = this.authService.firebaseCurrentUser$;
			}

			const permission = JSON.parse(localStorage.getItem('permission') || 'null');
			if (permission === null) {
				localStorage.setItem('permission', 'false');
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
		if (this.currentRegion === CN) {
			await this.authService.signOut();
		} else {
			this.authService.logout();
		}
	}
}
