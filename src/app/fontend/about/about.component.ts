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

interface TimelineItem {
	date: string;
	title: string;
	subheader: string;
	body: string;
	icon: string;
	color: string;
	tag: string;
}

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

	protected readonly timeline: TimelineItem[] = [
		{
			date: '2024.04 to present',
			title: 'Self-employed',
			subheader: 'Ottawa, Ontario',
			body: 'Designing and developing personal web platforms with a focus on scalable architecture, data persistence, and performance optimization. Building custom backend services to serve as centralized data repositories, while continuously improving system reliability, security, and maintainability.',
			icon: 'build_circle',
			color: '#9C27B0',
			tag: 'work'
		},
		{
			date: '2023.01 ~ 2024.03',
			title: 'Software Developer',
			subheader: 'Canada Revenue Agency, Ottawa, Ontario',
			body: 'Promoted from part-time to full-time role, contributing to feature development, bug fixes, and system enhancements. Took ownership of JIRA task coordination, organizing and prioritizing critical issues, improving team workflow, and ensuring timely delivery of project milestones.',
			icon: 'desktop_mac',
			color: '#9C27B0',
			tag: 'career'
		},
		{
			date: '2022.01 ~ 2023.12',
			title: 'Master Student',
			subheader: 'Concordia University',
			body: "Pursued a full-time Master's degree in Applied Computer Science, focusing on advanced software engineering concepts, system design, and applied research. Balanced academic responsibilities with part-time professional work at CRA, strengthening time management and practical problem-solving skills.",
			icon: 'auto_stories',
			color: '#FF9800',
			tag: 'education'
		},
		{
			date: '2020.09 ~ 2021.04',
			title: 'Bachelor Student',
			subheader: 'Carleton University',
			body: 'Completed final year of undergraduate studies, focusing on capstone projects, advanced coursework, and graduation requirements. Strengthened foundational knowledge in computer science while preparing for transition into professional and postgraduate environments.',
			icon: 'auto_stories',
			color: '#FF9800',
			tag: 'education'
		},
		{
			date: '2019.01 ~ 2020.08',
			title: 'Co-op Student',
			subheader: 'Canada Revenue Agency, Ottawa, Ontario',
			body: 'Worked as a full-time student developer at CRA, gaining hands-on experience in software development, team collaboration, and real-world project delivery. Contributed to production codebases while learning industry best practices.',
			icon: 'business_center',
			color: '#9C27B0',
			tag: 'career'
		},
		{
			date: '2014.09 ~ 2018.12',
			title: 'Bachelor Student',
			subheader: 'Carleton University',
			body: 'Completed a full-time Bachelor\'s degree in Computer Science, building a strong foundation in programming, algorithms, data structures, and software development principles through coursework, projects, and collaborative assignments.',
			icon: 'auto_stories',
			color: '#FF9800',
			tag: 'education'
		}
	];

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
							// IntersectionObserver callbacks fire outside Angular's zone;
							// detectChanges() is required to update the template immediately.
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
			this.timeline.forEach((_item, index) => {
				if (!this.visibleEntries.has(index)) {
					this.visibleEntries.add(index);
					if (index + 1 > this.maxSeen) this.maxSeen = index + 1;
				}
			});
			// setTimeout callback fires outside Angular's zone; detectChanges() is
			// required to reflect the final fallback visibility state in the template.
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
		return `calc((100% - 32px) * ${this.maxSeen / this.timeline.length})`;
	}

	/**
	 * Returns the staggered transition-delay for a timeline entry reveal animation.
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
