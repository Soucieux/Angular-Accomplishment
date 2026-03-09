import { Component, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { TimelineModule } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { isPlatformBrowser } from '@angular/common';
import { Utilities } from '../../common/app.utilities';

@Component({
	selector: 'about',
	standalone: true,
	imports: [TimelineModule, CardModule],
	templateUrl: './about.component.html',
	styleUrl: './about.component.css'
})
export class AboutComponent {
	protected events!: any[];
	protected isMobile!: boolean;

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		private utilities: Utilities
	) {}
	ngOnInit() {
		if (isPlatformBrowser(this.platformId)) {
			this.isMobile = this.utilities.isMobile();

			this.events = [
				{
					header: 'Self-employed',
					subheader: 'Ottawa, Ontario',
					date: '2024.04 to present',
					content:
						'Designing and developing personal web platforms with a focus on scalable architecture, data persistence, and performance optimization. Building custom backend services to serve as centralized data repositories, while continuously improving system reliability, security, and maintainability.',
					icon: 'build_circle',
					color: '#9C27B0'
				},
				{
					header: 'Software Developer',
					subheader: 'Canada Revenue Agency, Ottawa, Ontario',
					date: '2023.01 ~ 2024.03',
					content:
						'Promoted from part-time to full-time role, contributing to feature development, bug fixes, and system enhancements. Took ownership of JIRA task coordination, organizing and prioritizing critical issues, improving team workflow, and ensuring timely delivery of project milestones.',
					icon: 'desktop_mac',
					color: '#9C27B0'
				},
				{
					header: 'Master Student',
					subheader: 'Concordia University',
					date: '2022.01 ~ 2023.12',
					content:
						'Pursued a full-time Master’s degree in Applied Computer Science, focusing on advanced software engineering concepts, system design, and applied research. Balanced academic responsibilities with part-time professional work at CRA, strengthening time management and practical problem-solving skills.',
					icon: 'auto_stories',
					color: '#FF9800'
				},
				{
					header: 'Bachelor Student',
					subheader: 'Carleton University',
					date: '2020.09 ~ 2021.04',
					content:
						'Completed final year of undergraduate studies, focusing on capstone projects, advanced coursework, and graduation requirements. Strengthened foundational knowledge in computer science while preparing for transition into professional and postgraduate environments.',
					icon: 'auto_stories',
					color: '#FF9800'
				},
				{
					header: 'Co-op Student',
					subheader: 'Canada Revenue Agency, Ottawa, Ontario',
					date: '2019.01 ~ 2020.08',
					content:
						'Worked as a full-time student developer at CRA, gaining hands-on experience in software development, team collaboration, and real-world project delivery. Contributed to production codebases while learning industry best practices.',
					icon: 'business_center',
					color: '#9C27B0'
				},
				{
					header: 'Bachelor Student',
					subheader: 'Carleton University',
					date: '2014.09 ~ 2018.12',
					content:
						'Completed a full-time Bachelor’s degree in Computer Science, building a strong foundation in programming, algorithms, data structures, and software development principles through coursework, projects, and collaborative assignments.',
					icon: 'auto_stories',
					color: '#FF9800'
				}
			];
		}
	}

	@HostListener('window:resize')
	protected onResize() {
		if (isPlatformBrowser(this.platformId)) {
			this.isMobile = this.utilities.isMobile();
		}
	}
}
