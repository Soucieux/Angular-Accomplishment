import {
	Component,
	ElementRef,
	HostListener,
	PLATFORM_ID,
	Renderer2,
	Inject,
	ViewChild
} from '@angular/core';
import { tvShows, tvShow } from './tvShows';
import { isPlatformBrowser, NgFor } from '@angular/common';

@Component({
	selector: 'entertainment',
	standalone: true,
	imports: [NgFor],
	templateUrl: './entertainment.component.html',
	styleUrl: './entertainment.component.css'
})
export class EntertainmentComponent {
	//elRef is to get a collection, cannot modify the content directly.
	pageContainer = this.elRef.nativeElement.getElementsByClassName('page-container')[0];

	tvShowsList: tvShow[] = tvShows;

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		private elRef: ElementRef,
		private renderer: Renderer2
	) {}

	@HostListener('window:resize')
	onResize() {
		this.updateGridLayout(this.pageContainer);
	}

	ngAfterViewInit() {
		if (isPlatformBrowser(this.platformId)) {
			this.updateGridLayout(this.pageContainer);
			for (let index = 0; index < this.tvShowsList.length; index++) {
				console.log(
					this.pageContainer.getElementsByClassName('title')[index].innerText.length
				);
			}
		}
	}

	calculateFontSize(length: number) {
		return length < 9 ? '20px' : String(20 - (length - 8) * 2 + 'px');
	}

	updateGridLayout(pageContainer: any) {
		// Get item width from css
		const itemsWidth =
			getComputedStyle(pageContainer).getPropertyValue('--individual-item-width');
		const itemsGap = getComputedStyle(pageContainer).getPropertyValue('--individual-item-gap');

		if (pageContainer) {
			let componentWidth = (pageContainer as HTMLElement).clientWidth;
			let itemsPerRow = Math.floor(
				(componentWidth - parseInt(itemsGap)) / (parseInt(itemsWidth) + parseInt(itemsGap))
			);

			this.renderer.setStyle(
				//document is to directly get HTML DOM which can be modified directly
				document.getElementsByClassName('page-container')[0] as HTMLElement,
				'grid-template-columns',
				`repeat(${itemsPerRow}, minmax(${parseInt(itemsWidth)}px, 1fr))`
			);
		}
	}
}
