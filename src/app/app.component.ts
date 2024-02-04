import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, Subscription } from 'rxjs';
import { animate, style, trigger, transition } from '@angular/animations';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [CommonModule, RouterOutlet],
	template: '<button @fade>Submit</button>',
	styleUrl: './app.component.css',
	animations: [
		trigger('fade', [
			transition('void => *', [
				style({ backgroundColor: 'yellow', opacity: 0 }),
				//If the second argeument is not provided, it will predefined as background: 'white', opacity: 1.
				//So not necessary in this case.
				animate(2000, style({ backgroundColor: 'white', opacity: 1 }))
			])
		])
	]
})
export class AppComponent {
	courses$;

	constructor(db: AngularFireDatabase) {
		this.courses$ = db.list('/course').snapshotChanges();
		// console.log(this.courses$);
	}
}
