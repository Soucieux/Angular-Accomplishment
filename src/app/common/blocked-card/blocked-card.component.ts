import { Component, Input } from '@angular/core';
import { ACCESS_DENIED_TITLE, ACCESS_DENIED_BODY } from '../app.constant';

/**
 * Shared full-screen blocked card shown when a page cannot be accessed.
 * Accepts an icon name and optional heading and body text.
 * Defaults to the standard access-denied copy when title and body are omitted.
 */
@Component({
	selector: 'blocked-card',
	standalone: true,
	templateUrl: './blocked-card.component.html',
	styleUrl: './blocked-card.component.css'
})
export class BlockedCardComponent {
	@Input({ required: true }) icon!: string;
	@Input() title = ACCESS_DENIED_TITLE;
	@Input() body = ACCESS_DENIED_BODY;
}
