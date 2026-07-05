import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { LOGIN_ROUTE_PATH, LOGIN_RETURN_URL_PARAM } from '../constants';
import {
	ACCESS_DENIED_TITLE,
	ACCESS_DENIED_BODY,
	ACCESS_DENIED_FOOTER,
	NAV_LABEL_SIGN_IN
} from '../locale/locale-strings';

/**
 * Shared full-screen blocked card shown when a page cannot be accessed.
 * Accepts an icon name and optional heading and body text.
 * Defaults to the standard access-denied copy when title and body are omitted.
 * When isAccessDenied is set, also renders a Sign in button and status footer.
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
	@Input() isAccessDenied = false;

	protected readonly ACCESS_DENIED_FOOTER = ACCESS_DENIED_FOOTER;
	protected readonly NAV_LABEL_SIGN_IN = NAV_LABEL_SIGN_IN;

	constructor(private router: Router) {}

	/**
	 * Navigates to the login page, preserving the current URL as a returnUrl
	 * query param so the user is redirected back after signing in.
	 */
	protected navigateToSignIn(): void {
		this.router
			.navigate([LOGIN_ROUTE_PATH], { queryParams: { [LOGIN_RETURN_URL_PARAM]: this.router.url } })
			.catch(() => {});
	}
}
