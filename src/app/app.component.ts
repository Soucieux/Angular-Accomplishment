import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, Subscription } from 'rxjs';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [CommonModule, RouterOutlet],
	template: '',
	styleUrl: './app.component.css'
})
export class AppComponent {
	courses$;

	constructor(db: AngularFireDatabase) {
		this.courses$ = db.list('/course').snapshotChanges();
		// console.log(this.courses$);
	}
}
