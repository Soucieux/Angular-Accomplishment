import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { AuthService } from './service/authentication-service/auth.service';
import { LOG } from './app.logs';
import { MatIconModule } from '@angular/material/icon';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { COMPONENT_DESTROY } from './app.utilities';
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

	constructor(private authService: AuthService, @Inject(PLATFORM_ID) private platformId: Object) {}

	async ngOnInit() {
		if (isPlatformBrowser(this.platformId)) {
			this.authService.getCurrentUser();
			this.currentUser$ = this.authService.cloudbaseCurrentUser$;
			//TODO
			// this.currentUser$ = this.authService.firebaseCurrentUser$;
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
		//TODO
		// this.authService.logout();
		await this.authService.signOut();
	}
}
