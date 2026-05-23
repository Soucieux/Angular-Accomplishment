import { Component } from '@angular/core';

/**
 * Standalone access-denied card shown on protected pages when the current user
 * is not authenticated. Replaces the copy-pasted inline block that previously
 * appeared in every page template.
 */
@Component({
	selector: 'access-denied',
	standalone: true,
	templateUrl: './access-denied.component.html',
	styleUrl: './access-denied.component.css'
})
export class AccessDeniedComponent {}
