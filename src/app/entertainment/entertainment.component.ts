import {
	Component,
	ElementRef,
	HostListener,
	PLATFORM_ID,
	Renderer2,
	Inject
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
	tvShowsList: tvShow[] = tvShows;

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		private elRef: ElementRef,
		private renderer: Renderer2
	) {}

	ngOnInit() {}

	@HostListener('window:resize')
	onResize() {
		this.updateGridLayout();
	}

	ngAfterViewInit() {
		if (isPlatformBrowser(this.platformId)) {
			this.updateGridLayout();
		}
	}

	updateGridLayout() {
		//elRef is to get a collection, cannot modify the content directly.
		const pageContainer =
			this.elRef.nativeElement.getElementsByClassName('page-container')[0];
		// Get item width from css
		const itemsWidth = getComputedStyle(pageContainer).getPropertyValue(
			'--individual-item-width'
		);
		const itemsGap =
			getComputedStyle(pageContainer).getPropertyValue('--individual-item-gap');
		if (pageContainer) {
			let componentWidth = (pageContainer as HTMLElement).clientWidth;
			let itemsPerRow = Math.floor(
				(componentWidth - parseInt(itemsGap)) /
					(parseInt(itemsWidth) + parseInt(itemsGap))
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
