import { Component, ElementRef, HostListener, Renderer2 } from '@angular/core';
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

	constructor(private elRef: ElementRef, private renderer: Renderer2) {}

	@HostListener('window:resize')
	onResize() {
		this.updateGridLayout();
	}

	ngAfterViewInit() {
		this.updateGridLayout();
	}

	updateGridLayout() {
		const pageContainer =
			//elRef is to get a collection, cannot modify the content directly.
			this.elRef.nativeElement.getElementsByClassName('page-container');
		if (pageContainer) {
			let screenWidth = (pageContainer[0] as HTMLElement).clientWidth;
			let itemsPerRow = Math.floor(screenWidth / 200);
			let remainingSpacePerRow = screenWidth - itemsPerRow * 200;
			console.log(screenWidth);
			console.log(window.innerWidth);

			// if (remainingSpacePerRow < 220) {
			// 	itemsPerRow--;
			// }

			this.renderer.setStyle(
				//document is to directly get HTML DOM which can be modified directly
				document.getElementsByClassName(
					'page-container'
				)[0] as HTMLElement,
				'grid-template-columns',
				`repeat(${itemsPerRow}, minmax(200px, 1fr))`
			);
		}
	}
}
