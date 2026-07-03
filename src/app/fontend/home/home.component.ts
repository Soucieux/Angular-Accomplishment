import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild, ViewContainerRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { DatabaseService } from '../../backend/database-service/database.service';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { TimeoutService } from '../../common/timeout/timeout.service';
import { Utilities } from '../../common/utilities/app.utilities';
import { LOG } from '../../common/app.logs';
import { PortalCategory, PortalLink } from '../portal/portal.model';
import { HomeStats, RecentActivityItem } from './home.model';
import {
	COMPONENT_DESTROY,
	HOME_EST_YEAR,
	TIMEOUT_KEY_HOME,
	STATS_FIELD_RECENT_ACTIVITIES,
	STATS_FIELD_SHARED_REV,
	STATS_CAP_ACTIVITY_LOG
} from '../../common/constants';
import {
	HOME_MSG_INCREMENT_VISIT_FAILED,
	HOME_MSG_LOAD_STATISTICS_FAILED,
	HOME_BRAND_SUBTITLE,
	HOME_FLAVOUR_LINE_1,
	HOME_FLAVOUR_LINE_2,
	NAV_LABEL_PORTAL,
	NAV_LABEL_RESONANCE,
	NAV_LABEL_RECIPES,
	NAV_LABEL_ENTERTAINMENT,
	NAV_LABEL_REMINDER,
	NAV_LABEL_DEBT_SONATA,
	PORTAL_MSG_LOAD_CATEGORIES_FAILED
} from '../../common/locale/locale-strings';
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
	protected readonly HOME_EST_YEAR = HOME_EST_YEAR;
	protected readonly HOME_BRAND_SUBTITLE = HOME_BRAND_SUBTITLE;
	protected readonly HOME_FLAVOUR_LINE_1 = HOME_FLAVOUR_LINE_1;
	protected readonly HOME_FLAVOUR_LINE_2 = HOME_FLAVOUR_LINE_2;
	protected readonly NAV_LABEL_PORTAL = NAV_LABEL_PORTAL;
	protected readonly NAV_LABEL_RESONANCE = NAV_LABEL_RESONANCE;
	protected readonly NAV_LABEL_RECIPES = NAV_LABEL_RECIPES;
	protected readonly NAV_LABEL_ENTERTAINMENT = NAV_LABEL_ENTERTAINMENT;
	protected readonly NAV_LABEL_REMINDER = NAV_LABEL_REMINDER;
	protected readonly NAV_LABEL_DEBT_SONATA = NAV_LABEL_DEBT_SONATA;
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;

	private statsSub?: Subscription;
	private loginSub?: Subscription;
	private linksSub?: Subscription;
	private categoriesSub?: Subscription;
	private linksLoadingTimer?: ReturnType<typeof setTimeout>;
	private dashboardTimer?: ReturnType<typeof setTimeout>;

	private combinedStats: HomeStats | null = null;
	private sharedActivities: RecentActivityItem[] = [];
	private lastSharedRev?: number;
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
		private timeoutService: TimeoutService,
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
					// Step 1: Start the global loading timeout so a dialog appears if data never arrives
					this.loading = true;
					this.timeoutService.start(TIMEOUT_KEY_HOME, () => {
						this.dialogService.showLoadingTimeout(this.dialogComponentContainer);
					});

					/*
					 * Step 2: Guard against links that never resolve — after 4 s hide the
					 * skeleton regardless, so the rest of the dashboard is not blocked by a
					 * slow or failed links stream.
					 */
					this.linksLoadingTimer = setTimeout(() => {
						if (this.dashLinksLoading) {
							this.dashLinksLoading = false;
							this.cdr.detectChanges();
						}
					}, 4000);

					// Step 3: Subscribe to portal links and categories independently so a
					// failure in one stream does not prevent the other from rendering
					this.linksSub = this.databaseService.getUsefulLinks().subscribe({
						next: (data: PortalLink[]) => {
							clearTimeout(this.linksLoadingTimer);
							const userId = CloudbaseService.getUserId();
							this.dashLinks = userId ? data.filter(link => link._openid === userId) : [];
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

					/*
					 * Step 4: Subscribe to statistics last — its arrival is the signal that
					 * critical data is ready, so it clears the global timeout and lifts the
					 * loading flag. Cancelling the timeout in the error handler prevents the
					 * timeout dialog from opening on top of an already-failed state.
					 */
					this.statsSub = this.databaseService.getCombinedStats().subscribe({
						next: (data: HomeStats) => {
							this.timeoutService.clear(TIMEOUT_KEY_HOME);
							this.combinedStats = data;
							this.applyStats();
							// The first emission loads the shared feed; later sharedRev bumps keep it live.
							this.refreshSharedActivityOnRevChange(data);
							this.loading = false;
							this.cdr.detectChanges();
						},
						error: (error: unknown) => {
							LOG.error(this.className, HOME_MSG_LOAD_STATISTICS_FAILED, error as Error);
							this.timeoutService.clear(TIMEOUT_KEY_HOME);
							this.loading = false;
							this.cdr.detectChanges();
						}
					});

					/*
					 * Step 5: Trigger the CSS enter-transition for the dashboard panel.
					 * The 600 ms delay lets the transitioning flag drive an animation before
					 * showDashboard switches the panel into the DOM — skipping the delay
					 * would cause the element to appear without the transition playing.
					 */
					this.transitioning = true;
					this.cdr.detectChanges();
					this.dashboardTimer = setTimeout(() => {
						this.showDashboard = true;
						this.transitioning = false;
						this.cdr.detectChanges();
					}, 600);
				} else if (!loggedIn) {
					// Step 6: Tear down all active timers and subscriptions on logout so
					// stale data is never shown when a different user signs in later
					this.timeoutService.clear(TIMEOUT_KEY_HOME);
					clearTimeout(this.linksLoadingTimer);
					clearTimeout(this.dashboardTimer);
					this.statsSub?.unsubscribe();
					this.linksSub?.unsubscribe();
					this.categoriesSub?.unsubscribe();
					this.combinedStats = null;
					this.sharedActivities = [];
					this.lastSharedRev = undefined;
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
		this.timeoutService.clear(TIMEOUT_KEY_HOME);
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

	/**
	 * Applies the combined stats (from {@link getCombinedStats}) into the single stats object consumed
	 * by the orbital component, folding any shared activity into the recent-activity feed via
	 * {@link mergeActivityFeeds}.
	 */
	private applyStats(): void {
		const merged = { ...this.combinedStats } as HomeStats;
		if (this.sharedActivities.length) {
			const own = Utilities.toArray(merged[STATS_FIELD_RECENT_ACTIVITIES]) as RecentActivityItem[];
			merged[STATS_FIELD_RECENT_ACTIVITIES] = this.mergeActivityFeeds(own, this.sharedActivities);
		}
		this.stats = merged;
	}

	/**
	 * Merges personal and shared activity entries into a single feed, sorted newest-first and
	 * capped to STATS_CAP_ACTIVITY_LOG. The two arrays never overlap — a reminder mutation is stored
	 * in exactly one of them — so no de-duplication is needed.
	 *
	 * {@link applyStats} - Builds the activity feed array consumed by the orbital component.
	 *
	 * @param own - The current user's personal activity entries.
	 * @param shared - The shared activity entries.
	 * @returns The merged, newest-first, capped activity list.
	 */
	private mergeActivityFeeds(
		own: RecentActivityItem[],
		shared: RecentActivityItem[]
	): RecentActivityItem[] {
		return [...own, ...shared.map((entry) => ({ ...entry, isShared: true }))]
			.sort((a, b) => String(b?.timestamp ?? '').localeCompare(String(a?.timestamp ?? '')))
			.slice(0, STATS_CAP_ACTIVITY_LOG);
	}

	/**
	 * Re-fetches the shared activity feed whenever the live user document's sharedRev counter moves.
	 * Connections (and the user's own shared writes) bump the counter on every shared-reminder change,
	 * so the dashboard feed stays live without polling; the first combined-stats emission performs the
	 * initial load. No-op when the counter is unchanged.
	 *
	 * @param combinedDoc - The latest combined stats object emitted by the combined-stats stream.
	 */
	private refreshSharedActivityOnRevChange(combinedDoc: HomeStats): void {
		const rev = (combinedDoc[STATS_FIELD_SHARED_REV] as number) ?? 0;
		if (rev === this.lastSharedRev) return;
		this.lastSharedRev = rev;
		this.databaseService
			.getSharedRecentActivity()
			.then((shared) => {
				this.sharedActivities = shared as RecentActivityItem[];
				this.applyStats();
				this.cdr.detectChanges();
			})
			.catch(() => {});
	}

}
