import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild, ViewContainerRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { DatabaseService } from '../../backend/database-service/database.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { LoadingTimeoutService } from '../../common/loading-timeout.service';
import { Utilities } from '../../common/app.utilities';
import { LOG } from '../../common/app.logs';
import { PortalCategory, PortalLink } from '../portal/portal.model';
import { HomeStats } from './home.model';
import {
	COMPONENT_DESTROY,
	HOME_MSG_INCREMENT_VISIT_FAILED,
	HOME_MSG_LOAD_STATISTICS_FAILED,
	PORTAL_MSG_LOAD_CATEGORIES_FAILED,
	TIMEOUT_KEY_HOME
} from '../../common/app.constant';
import { OrbitalComponent } from './orbital/orbital.component';

@Component({
	selector: 'home',
	standalone: true,
	imports: [CommonModule, RouterModule, OrbitalComponent],
	templateUrl: './home.component.html',
	styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
	private readonly className = 'HomeComponent';
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;

	private statsSub?: Subscription;
	private loginSub?: Subscription;
	private linksSub?: Subscription;
	private categoriesSub?: Subscription;
	private linksLoadingTimer?: ReturnType<typeof setTimeout>;
	private dashboardTimer?: ReturnType<typeof setTimeout>;

	protected stats: HomeStats | null = null;
	protected loading = true;
	protected loggedIn = false;
	protected showDashboard = false;
	protected transitioning = false;
	protected dashLinks: PortalLink[] = [];
	protected dashCategories: PortalCategory[] = [];
	protected dashLinksLoading = true;

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		private databaseService: DatabaseService,
		private dialogService: DialogService,
		private loadingTimeoutService: LoadingTimeoutService,
		private cdr: ChangeDetectorRef,
		protected utilities: Utilities
	) {}

	/**
	 * Subscribes to the user-alive observable and starts or stops data
	 * subscriptions as the user signs in or out. Uses the localStorage-backed
	 * hint so the dashboard is visible immediately on page refresh without
	 * waiting for the CloudBase session to re-validate over the network.
	 */
	ngOnInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.loginSub = this.utilities.getIsUserAlive$().subscribe((loggedIn) => {
				const wasLoggedIn = this.loggedIn;
				this.loggedIn = loggedIn;

				if (loggedIn && !wasLoggedIn) {
					this.loading = true;
					this.loadingTimeoutService.start(TIMEOUT_KEY_HOME, () => {
						this.dialogService.showLoadingTimeout(this.dialogComponentContainer);
					});

					this.linksLoadingTimer = setTimeout(() => {
						if (this.dashLinksLoading) {
							this.dashLinksLoading = false;
							this.cdr.detectChanges();
						}
					}, 4000);

					this.linksSub = this.databaseService.getUsefulLinks().subscribe({
						next: (data: PortalLink[]) => {
							clearTimeout(this.linksLoadingTimer);
							this.dashLinks = data;
							this.dashLinksLoading = false;
							this.cdr.detectChanges();
						},
						error: () => {
							clearTimeout(this.linksLoadingTimer);
							this.dashLinksLoading = false;
							this.cdr.detectChanges();
						}
					});

					this.categoriesSub = this.databaseService.getLinkCategories().subscribe({
						next: (data: PortalCategory[]) => {
							this.dashCategories = Utilities.sortByOrder(data);
							this.cdr.detectChanges();
						},
						error: (error: unknown) => {
							LOG.error(this.className, PORTAL_MSG_LOAD_CATEGORIES_FAILED, error as Error);
						}
					});

					this.statsSub = this.databaseService.getStatistics().subscribe({
						next: (data: HomeStats) => {
							this.loadingTimeoutService.clear(TIMEOUT_KEY_HOME);
							this.stats = data;
							this.loading = false;
							this.cdr.detectChanges();
						},
						error: (error: unknown) => {
							LOG.error(this.className, HOME_MSG_LOAD_STATISTICS_FAILED, error as Error);
							this.loadingTimeoutService.clear(TIMEOUT_KEY_HOME);
							this.loading = false;
							this.cdr.detectChanges();
						}
					});

					this.transitioning = true;
					this.cdr.detectChanges();
					this.dashboardTimer = setTimeout(() => {
						this.showDashboard = true;
						this.transitioning = false;
						this.cdr.detectChanges();
					}, 600);
				} else if (!loggedIn) {
					this.loadingTimeoutService.clear(TIMEOUT_KEY_HOME);
					clearTimeout(this.linksLoadingTimer);
					clearTimeout(this.dashboardTimer);
					this.statsSub?.unsubscribe();
					this.linksSub?.unsubscribe();
					this.categoriesSub?.unsubscribe();
					this.stats = null;
					this.dashLinks = [];
					this.dashCategories = [];
					this.dashLinksLoading = true;
					this.loading = true;
					this.showDashboard = false;
					this.transitioning = false;
				}

				this.cdr.detectChanges();
			});
		}
	}

	/**
	 * Clears all timers, unsubscribes from all observables, and logs destruction.
	 */
	ngOnDestroy(): void {
		this.loadingTimeoutService.clear(TIMEOUT_KEY_HOME);
		clearTimeout(this.linksLoadingTimer);
		clearTimeout(this.dashboardTimer);
		this.statsSub?.unsubscribe();
		this.linksSub?.unsubscribe();
		this.categoriesSub?.unsubscribe();
		this.loginSub?.unsubscribe();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	/**
	 * Handles a link-visit event emitted by the orbital component. Increments
	 * the visit counter for the given link in the database.
	 *
	 * @param event - The visit event containing the link ID and new count.
	 */
	protected onOrbitalLinkVisit(event: { id: string; count: number }): void {
		this.databaseService
			.incrementLinkVisit(event.id, event.count - 1)
			.catch((error: Error) => LOG.error(this.className, HOME_MSG_INCREMENT_VISIT_FAILED, error));
	}

}
