import { Component, ElementRef, HostListener, PLATFORM_ID, Renderer2, Inject } from '@angular/core';
import { MovieItem } from './movie.list';
import { isPlatformBrowser, isPlatformServer, NgFor, NgIf, CommonModule } from '@angular/common';
import { Database, listVal, ref, update } from '@angular/fire/database';
import { DoubanService } from './douban.service';
import { LOG } from '../log';
import { Observable, firstValueFrom } from 'rxjs';
import {
	Storage,
	ref as storageRef,
	uploadBytes,
	uploadBytesResumable
} from '@angular/fire/storage';
@Component({
	selector: 'entertainment',
	standalone: true,
	imports: [NgFor, NgIf, CommonModule],
	templateUrl: './entertainment.component.html',
	styleUrl: './entertainment.component.css'
})
export class EntertainmentComponent {
	private readonly className = 'EntertainmentComponent';
	private pageContainer?: any;
	protected movieList$: Observable<MovieItem[]>;

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		private elRef: ElementRef,
		private renderer: Renderer2,
		private doubanService: DoubanService,
		private db: Database,
		private storage: Storage
	) {
		LOG.info(this.className, 'Retrieving movie list');
		this.movieList$ = listVal(ref(this.db, 'movies'));
	}

	ngOnInit() {
		//elRef is to get a collection, cannot modify the content directly.
		this.pageContainer = this.elRef.nativeElement.getElementsByClassName('page-container')[0];
		this.searchMovie('Inception');

		// this.movieList[0].cover = URL.createObjectURL(response);
		// update(ref(this.db, `movies/0`), {
		// 	title: extractData['title'],

		// 	rate: extractData['rate'],
		// 	cover: extractData['cover'],
		// 	id: extractData['id']
		// });
	}

	private async searchMovie(movieName: string) {
		LOG.info(this.className, `${(this.platformId as string).toUpperCase()} is making API call`);
		try {
			const extractedData = await firstValueFrom(this.doubanService.searchMovie(movieName));
			if (extractedData == null) {
				LOG.error(this.className, 'Data not found');
			} else {
				LOG.info(this.className, 'Data received');

				const movieDetails = extractedData['subjects'][0];
				let coverImageLink = movieDetails['cover'].replace('\\', '');
				let coverImageId = coverImageLink.substring(coverImageLink.lastIndexOf('/') + 1);
				if (isPlatformServer(this.platformId)) {
					this.searchMovieCover(coverImageId);
				}
			}
		} catch (error) {
			LOG.error(this.className, 'Error while retrieving data from API', error as Error);
		}
	}

	private async searchMovieCover(coverImageId: string) {
		LOG.info(
			this.className,
			`${(this.platformId as string).toUpperCase()} is searching movie cover`
		);
		try {
			const coverImage = await firstValueFrom(
				this.doubanService.searchMovieCover(coverImageId)
			);
			const storageRefer = storageRef(this.storage, '/movies/1.jpeg');
			const uploadTask = uploadBytesResumable(storageRefer, coverImage);
			uploadTask.on(
				'state_changed',
				null,
				(error) => {
					LOG.error(
						this.className,
						'Error while uploading movie cover to firebase',
						error
					);
				},
				() => {
					LOG.info(this.className, 'Image upload to filrebase storage has completed.');
				}
			);
		} catch (error) {
			LOG.error(this.className, 'Error while retrieving movie cover', (error as Error));
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

	protected calculateFontSize(length: number) {
		return length < 9 ? '20px' : String(20 - (length - 8) * 2 + 'px');
	}

	private updateGridLayout(pageContainer: any) {
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
