import { Component } from '@angular/core';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Select } from "primeng/select";

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
			status: 'In Progress',
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
			component: 'login',
			details: 'Slogan',
			status: 'Completed',
			timeStamp: '2025.12.04'
		}
	];
	protected patchNotes: any[] = new Array(this.data.length);
	protected severity: { severity: string }[] | undefined;

	ngOnInit() {
		this.severity = [
			{ severity: 'To Do' },
			{ severity: 'In Progress' },
			{ severity: 'Completed' },
			{ severity: 'Debug' },
			{ severity: 'Draft' },
		];
		setTimeout(() => {
			this.loading = false;
			this.patchNotes = this.data;
		}, 500);
	}

	getSeverity(status: string) {
		switch (status) {
			case 'To Do':
				return 'info';
			case 'In Progress':
				return 'warn';
			case 'Completed':
				return 'success';
			case 'Debug':
				return 'danger';
			case 'Draft':
				return null;
			default:
				return undefined;
		}
	}
}
