import { Component } from '@angular/core';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import {
	STATUS_COMPLETED,
	STATUS_DEBUG,
	STATUS_DRAFT,
	STATUS_IN_PROGRESS,
	STATUS_TODO
} from '../app.utilities';

@Component({
	selector: 'patch',
	imports: [TableModule, SkeletonModule, Tag, InputText, Button, Select],
	templateUrl: './patch.component.html',
	styleUrl: './patch.component.css'
})
export class PatchComponent {
	protected loading = true;
	protected data = [
		{
			component: 'Entertainment',
			details: 'History panel',
			status: 'To Do',
			timeStamp: '2025.12.04'
		},
		{
			component: 'Home',
			details: 'Slogan',
			status: 'Completed',
			timeStamp: '2025.12.04'
		},
		{
			component: 'Entertainment',
			details: 'Search button dialog',
			status: 'In Progress',
			timeStamp: '2025.12.04'
		},
		{
			component: 'Entertainment',
			details: 'Page info not displayed correctly after refresh',
			status: 'Debug',
			timeStamp: '2025.12.04'
		},
		{
			component: 'Login',
			details: 'Slogan',
			status: 'Completed',
			timeStamp: '2025.12.04'
		},
		{
			component: 'Login',
			details: 'Local storage is not defined',
			status: 'Debug',
			timeStamp: '2025.12.09'
        },
        {
			component: 'Entertainment',
			details: 'Add dialog triggered "Web Inspector blocked http://localhost:4200/null from loading"',
			status: 'Debug',
			timeStamp: '2025.12.09'
        }
	];
	protected patchNotes: any[] = new Array(this.data.length);
	protected severity: { severity: string }[] | undefined;

	ngOnInit() {
		this.severity = [
			{ severity: STATUS_TODO },
			{ severity: STATUS_IN_PROGRESS },
			{ severity: STATUS_COMPLETED },
			{ severity: STATUS_DEBUG },
			{ severity: STATUS_DRAFT }
		];
		setTimeout(() => {
			this.loading = false;
			this.patchNotes = this.data;
		}, 500);
	}

	getSeverity(status: string) {
		switch (status) {
			case STATUS_TODO:
				return 'info';
			case STATUS_IN_PROGRESS:
				return 'warn';
			case STATUS_COMPLETED:
				return 'success';
			case STATUS_DEBUG:
				return 'danger';
			case STATUS_DRAFT:
				return null;
			default:
				return undefined;
		}
	}
}
