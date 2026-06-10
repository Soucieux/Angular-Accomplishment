import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Inject,
	OnDestroy,
	PLATFORM_ID,
	QueryList,
	ViewChildren
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { COMPONENT_DESTROY } from '../../common/app.constant';
import { LOG } from '../../common/app.logs';
import { TIMELINE } from './about.model';

@Component({
	selector: 'about',
	standalone: true,
	imports: [ChipModule, TagModule],
	templateUrl: './about.component.html',
	styleUrl: './about.component.css'
})
export class AboutComponent implements AfterViewInit, OnDestroy {
	private readonly className = 'AboutComponent';

	@ViewChildren('tlEntry') private entryRefs!: QueryList<ElementRef<HTMLElement>>;

	protected readonly TIMELINE = TIMELINE;

	private observers: IntersectionObserver[] = [];
	protected maxSeen = 0;
	protected visibleEntries = new Set<number>();
	protected hoveredIndex: number | null = null;

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		private cdr: ChangeDetectorRef
	) {}

	/**
	 * Attaches an IntersectionObserver to every timeline entry after the view
	 * renders. Each entry marks itself visible on first intersection, advancing
	 * the rail fill and triggering the fade-up animation.
	 */
	ngAfterViewInit(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		this.entryRefs.forEach((ref, index) => {
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting && !this.visibleEntries.has(index)) {
							this.visibleEntries.add(index);
							if (index + 1 > this.maxSeen) this.maxSeen = index + 1;
							/* IntersectionObserver callbacks fire outside Angular's zone;
							   detectChanges() is required to update the template immediately. */
							this.cdr.detectChanges();
						}
					});
				},
				{ threshold: 0.25, rootMargin: '0px 0px -10% 0px' }
			);
			observer.observe(ref.nativeElement);
			this.observers.push(observer);
		});
		setTimeout(() => {
			this.TIMELINE.forEach((_, index) => {
				if (!this.visibleEntries.has(index)) {
					this.visibleEntries.add(index);
					if (index + 1 > this.maxSeen) this.maxSeen = index + 1;
				}
			});
			/* setTimeout callback fires outside Angular's zone; detectChanges() is
			   required to reflect the final fallback visibility state in the template. */
			this.cdr.detectChanges();
		}, 0);
	}

	/**
	 * Disconnects all IntersectionObservers and logs the component destruction event.
	 */
	ngOnDestroy(): void {
		this.observers.forEach((observer) => observer.disconnect());
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	/**
	 * Computes the CSS height for the timeline rail fill element.
	 * Grows as more entries scroll into view.
	 *
	 * @returns CSS calc() string proportional to the number of visible entries.
	 */
	protected fillHeight(): string {
		return `calc((100% - 32px) * ${this.maxSeen / this.TIMELINE.length})`;
	}

	/**
	 * Gets the staggered transition-delay for a timeline entry reveal animation.
	 * Capped at index 4 to prevent very long delays when the page loads deep.
	 *
	 * @param index - The zero-based entry index.
	 * @returns CSS time string, e.g. "120ms".
	 */
	protected entryDelay(index: number): string {
		return `${Math.min(index, 4) * 60}ms`;
	}

	/**
	 * Sets the hovered entry index, activating the node spring and card slide animation.
	 *
	 * @param index - The zero-based index of the hovered entry.
	 */
	protected setHoveredEntry(index: number): void {
		this.hoveredIndex = index;
	}

	/**
	 * Resets the hover state by nullifying the hovered index
	 * when the cursor moves away from the entry container.
	 */
	protected resetHoverState(): void {
		this.hoveredIndex = null;
	}
}
