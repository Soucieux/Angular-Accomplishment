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

	private observers: IntersectionObserver[] = [];
	protected maxSeen = 0;
	protected visibleEntries = new Set<number>();
	protected hoveredIndex: number | null = null;

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

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		private cdr: ChangeDetectorRef
	) {}

	/**
	 * Attaches an IntersectionObserver to every timeline entry after the view
	 * renders. Each entry marks itself visible on first intersection, advancing
	 * the rail fill and triggering the fade-up animation.
	 */
	public ngAfterViewInit(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		this.entryRefs.forEach((ref, i) => {
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((e) => {
						if (e.isIntersecting && !this.visibleEntries.has(i)) {
							this.visibleEntries.add(i);
							if (i + 1 > this.maxSeen) this.maxSeen = i + 1;
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
			this.timeline.forEach((_, i) => {
				if (!this.visibleEntries.has(i)) {
					this.visibleEntries.add(i);
					if (i + 1 > this.maxSeen) this.maxSeen = i + 1;
				}
			});
			this.cdr.detectChanges();
		}, 0);
	}

	/**
	 * Disconnects all IntersectionObservers and logs the component destruction event.
	 */
	public ngOnDestroy(): void {
		this.observers.forEach((o) => o.disconnect());
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
	 * @param i - Zero-based entry index.
	 * @returns CSS time string, e.g. "120ms".
	 */
	protected entryDelay(i: number): string {
		return `${Math.min(i, 4) * 60}ms`;
	}

	/**
	 * Marks the given entry as hovered, activating the node spring and card slide.
	 *
	 * @param i - Zero-based index of the hovered entry.
	 */
	protected onEntryEnter(i: number): void {
		this.hoveredIndex = i;
	}

	/**
	 * Clears the hovered entry index when the cursor leaves the entry container.
	 */
	protected onEntryLeave(): void {
		this.hoveredIndex = null;
	}
}
