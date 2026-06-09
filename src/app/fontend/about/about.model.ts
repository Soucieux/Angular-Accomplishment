/** A single entry in the About page timeline. */
export interface TimelineItem {
	date: string;
	title: string;
	subheader: string;
	body: string;
	icon: string;
	color: string;
	tag: string;
}

/** Career and education timeline entries for the About page. */
export const TIMELINE: TimelineItem[] = [
	{
		date: '2025.04 to present',
		title: 'Self-employed',
		subheader: 'Ottawa, Ontario',
		body: 'Designing and developing personal web platforms with a focus on scalable architecture, data persistence, and performance optimization. Building custom backend services to serve as centralized data repositories, while continuously improving system reliability, security, and maintainability.',
		icon: 'build_circle',
		color: '#9C27B0',
		tag: 'work'
	},
	{
		date: '2022.01 ~ 2025.03',
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
		body: "Completed a full-time Bachelor's degree in Computer Science, building a strong foundation in programming, algorithms, data structures, and software development principles through coursework, projects, and collaborative assignments.",
		icon: 'auto_stories',
		color: '#FF9800',
		tag: 'education'
	}
];
