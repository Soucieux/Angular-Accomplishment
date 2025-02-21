import { Component } from '@angular/core';
import { tvShows, tvShow } from './tvShows';
import { NgFor } from '@angular/common';

@Component({
	selector: 'entertainment',
	standalone: true,
	imports: [NgFor],
	templateUrl: './entertainment.component.html',
	styleUrl: './entertainment.component.scss'
})
export class EntertainmentComponent {
	tvShowsList: tvShow[] = tvShows;
}
