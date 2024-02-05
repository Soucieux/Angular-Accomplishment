import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AngularFireDatabase } from '@angular/fire/compat/database';

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
		this.courses$.subscribe(e=>console.log(e));
	}
}
