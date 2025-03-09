import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { Database } from '@angular/fire/database';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { AuthService } from './authentication/auth.service';
import { Router } from '@angular/router';
@Component({
	selector: 'root',
	standalone: true,
	imports: [CommonModule, RouterOutlet, RouterModule, MatSidenavModule, MatButtonModule, MatRippleModule],
	templateUrl: 'app.component.html',
	styleUrl: './app.component.css'
})
export class AppComponent {
	// courses$;
    currentUser$ = this.authService.currentUser$;

	constructor(private db: Database, private authService: AuthService, private router: Router) {
		// this.courses$ = objectVal(ref(this.db, '/course/2'));
	}

	login() {
		this.authService.login();
	}

	logout() {
		this.authService.logout();
    }
}
