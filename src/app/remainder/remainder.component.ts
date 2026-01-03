import { Component } from '@angular/core';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { Button } from "primeng/button";

@Component({
	selector: 'remainder',
	imports: [TableModule, InputTextModule, FormsModule, Button],
	templateUrl: './remainder.component.html',
	styleUrl: './remainder.component.css'
})
export class RemainderComponent {
	rows = [
		{ first: 1, second: 1, third: 1, fourth: 1 },
		{ first: 3, second: 3, third: 3, fourth: 3 },
		{ first: 9, second: 9, third: 9, fourth: 9 },
		{ first: 11, second: 11, third: 11, fourth: 11 },
		{ first: 17, second: 17, third: 17, fourth: 17 }
	];
}
