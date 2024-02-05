import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AngularFireDatabase } from '@angular/fire/compat/database';

import { MatButtonModule } from '@angular/material/button';

@Component({
	selector: 'root',
	standalone: true,
	imports: [CommonModule, RouterOutlet, MatButtonModule],
	templateUrl: 'app.component.html',
	styleUrl: './app.component.css'
})
export class AppComponent {
	courses$;

	constructor(db: AngularFireDatabase) {
		this.courses$ = db.list('/course').snapshotChanges();
		// this.courses$.subscribe(e=>console.log(e));
	}
}
