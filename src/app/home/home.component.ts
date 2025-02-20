import { Component, ViewEncapsulation } from '@angular/core';
import { MatRadioModule } from '@angular/material/radio';

@Component({
	selector: 'home',
	standalone: true,
	imports: [MatRadioModule],
	templateUrl: './home.component.html',
	styleUrl: './home.component.css'
})
export class HomeComponent {}
