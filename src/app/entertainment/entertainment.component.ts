import { Component, ElementRef, HostListener, PLATFORM_ID, Renderer2, Inject } from '@angular/core';
import { movie, movies } from './movie.list';
import { isPlatformBrowser, isPlatformServer, NgFor } from '@angular/common';
import { doubanService } from './douban.service';

@Component({
	selector: 'entertainment',
	standalone: true,
	imports: [NgFor],
	templateUrl: './entertainment.component.html',
	styleUrl: './entertainment.component.css'
})
export class EntertainmentComponent {
	private readonly className = 'entertainment.component';
	private pageContainer?: any;
	protected movieList: movie[] = movies;

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		private elRef: ElementRef,
		private renderer: Renderer2,
		private doubanService: doubanService
	) {}

	ngOnInit() {
		//elRef is to get a collection, cannot modify the content directly.
		console.log(this.className + 'Inside ngOnInit of entertainment component');
		this.pageContainer = this.elRef.nativeElement.getElementsByClassName('page-container')[0];
		if (isPlatformServer(this.platformId)) {
			console.log(this.className + 'Fatch data from server');
			this.doubanService.searchMovie().subscribe((response) => {});
		} else if (isPlatformBrowser(this.platformId)) {
			console.log(this.className + 'Fetch data from client');
		}
	}

	@HostListener('window:resize')
	onResize() {
		this.updateGridLayout(this.pageContainer);
	}

	ngAfterViewInit() {
		if (isPlatformBrowser(this.platformId)) {
			this.updateGridLayout(this.pageContainer);
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
