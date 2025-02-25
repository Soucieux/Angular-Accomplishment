import { Component, ElementRef, HostListener, PLATFORM_ID, Renderer2, Inject } from '@angular/core';
import { movies, MovieItem } from './movie.list';
import { isPlatformBrowser, NgFor } from '@angular/common';
import { DoubanService } from './douban.service';
import { LOG } from '../log';

@Component({
	selector: 'entertainment',
	standalone: true,
	imports: [NgFor],
	templateUrl: './entertainment.component.html',
	styleUrl: './entertainment.component.css'
})
export class EntertainmentComponent {
	private readonly className = 'EntertainmentComponent';
	private pageContainer?: any;
	protected movieList: MovieItem[] = movies;

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		private elRef: ElementRef,
		private renderer: Renderer2,
		private doubanService: DoubanService
	) {}

	ngOnInit() {
		//elRef is to get a collection, cannot modify the content directly.
		this.pageContainer = this.elRef.nativeElement.getElementsByClassName('page-container')[0];
		if (isPlatformBrowser(this.platformId)) {
			LOG.info(this.className, 'Client is making API call');
			this.doubanService.searchMovie().subscribe((response) => {
				LOG.info(this.className, 'Response received from API');
				if (response.length === 0) {
					LOG.error(this.className, 'Data not found');
				} else {
					LOG.info(this.className, 'Disassemble data');
					const extractData = response['subjects'][0];
					const rate = extractData['rate'];
					const cover = extractData['cover'].replace('\\', '');
                    const id = extractData['id'];
                    this.movieList[0].cover = cover;
					console.log(this.movieList[0]);
				}
			});
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
