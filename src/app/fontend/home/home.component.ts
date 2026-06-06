import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { DatabaseService } from '../../backend/database-service/database.service';
import { Utilities } from '../../common/app.utilities';
import { LOG } from '../../common/app.logs';
import { NexusCategory, NexusLink } from '../nexus/nexus.model';
import { Recipe } from '../recipe/recipe.model';
import { HomeStats } from './home.model';
import {
	COMPONENT_DESTROY,
	HOME_MSG_INCREMENT_VISIT_FAILED,
	HOME_MSG_LOAD_RECIPES_FAILED,
	HOME_MSG_LOAD_STATISTICS_FAILED,
	NEXUS_MSG_LOAD_CATEGORIES_FAILED,
	STATS_CAP_ACTIVITY_LOG,
	STATS_FIELD_RECENT_MOVIE,
	STATS_FIELD_RECENT_PATCH,
	STATS_FIELD_RECENT_REMINDER,
	STATS_FIELD_RECENT_RESONANCE
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

	private statsSub?: Subscription;
	private loginSub?: Subscription;
	private linksSub?: Subscription;
	private categoriesSub?: Subscription;
	private recipesSub?: Subscription;
	private loadingTimer?: ReturnType<typeof setTimeout>;
	private linksLoadingTimer?: ReturnType<typeof setTimeout>;
	private dashboardTimer?: ReturnType<typeof setTimeout>;

	protected stats: HomeStats | null = null;
	protected loading = true;
	protected loggedIn = false;
	protected showDashboard = false;
	protected transitioning = false;
	protected dashLinks: NexusLink[] = [];
	protected dashCategories: NexusCategory[] = [];
	protected dashRecipes: Recipe[] = [];
	protected dashLinksLoading = true;

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		private databaseService: DatabaseService,
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
					this.loadingTimer = setTimeout(() => {
						if (this.loading) {
							this.loading = false;
							this.cdr.detectChanges();
						}
					}, 5000);

					let activityLogsCleaned = false;
					this.linksLoadingTimer = setTimeout(() => {
						if (this.dashLinksLoading) {
							this.dashLinksLoading = false;
							this.cdr.detectChanges();
						}
					}, 4000);

					this.linksSub = this.databaseService.getUsefulLinks().subscribe({
						next: (data: NexusLink[]) => {
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
						next: (data: NexusCategory[]) => {
							this.dashCategories = Utilities.sortByOrder(data);
							this.cdr.detectChanges();
						},
						error: (error: unknown) => {
							LOG.error(this.className, NEXUS_MSG_LOAD_CATEGORIES_FAILED, error as Error);
						}
					});

					this.recipesSub = this.databaseService.getRecipes().subscribe({
						next: (data: Recipe[]) => {
							this.dashRecipes = data;
							this.cdr.detectChanges();
						},
						error: (error: unknown) => {
							LOG.error(this.className, HOME_MSG_LOAD_RECIPES_FAILED, error as Error);
						}
					});

					this.statsSub = this.databaseService.getStatistics().subscribe({
						next: (data: HomeStats) => {
							clearTimeout(this.loadingTimer);
							this.stats = data;
							this.loading = false;
							this.cdr.detectChanges();
							if (!activityLogsCleaned) {
								activityLogsCleaned = true;
								this.trimActivityLogs(data);
							}
						},
						error: (error: unknown) => {
							LOG.error(this.className, HOME_MSG_LOAD_STATISTICS_FAILED, error as Error);
							clearTimeout(this.loadingTimer);
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
					clearTimeout(this.loadingTimer);
					clearTimeout(this.linksLoadingTimer);
					clearTimeout(this.dashboardTimer);
					this.statsSub?.unsubscribe();
					this.linksSub?.unsubscribe();
					this.categoriesSub?.unsubscribe();
					this.recipesSub?.unsubscribe();
					this.stats = null;
					this.dashLinks = [];
					this.dashCategories = [];
					this.dashRecipes = [];
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
		clearTimeout(this.loadingTimer);
		clearTimeout(this.linksLoadingTimer);
		clearTimeout(this.dashboardTimer);
		this.statsSub?.unsubscribe();
		this.linksSub?.unsubscribe();
		this.categoriesSub?.unsubscribe();
		this.recipesSub?.unsubscribe();
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
	 * Trims each activity-log array to only the items that would appear in the
	 * combined top-24 feed. Removes stale entries that accumulated before the
	 * per-array cap was enforced.
	 *
	 * @param data - The raw statistics document from the first watcher emission.
	 */
	private trimActivityLogs(data: HomeStats): void {
		const fields = [
			STATS_FIELD_RECENT_MOVIE,
			STATS_FIELD_RECENT_PATCH,
			STATS_FIELD_RECENT_REMINDER,
			STATS_FIELD_RECENT_RESONANCE
		];

		const arrays: { timestamp?: string }[][] = fields.map(
			(field) => Utilities.toArray(data?.[field]) as { timestamp?: string }[]
		);

		const flat: { fieldIndex: number; itemIndex: number; timestamp: string }[] = [];
		for (let fieldIndex = 0; fieldIndex < arrays.length; fieldIndex++) {
			for (let itemIndex = 0; itemIndex < arrays[fieldIndex].length; itemIndex++) {
				const { timestamp } = arrays[fieldIndex][itemIndex] ?? {};
				if (timestamp) flat.push({ fieldIndex, itemIndex, timestamp });
			}
		}

		flat.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
		const keepSet = new Set<string>(
			flat.slice(0, STATS_CAP_ACTIVITY_LOG).map((entry) => `${entry.fieldIndex}:${entry.itemIndex}`)
		);

		const updates: Record<string, { timestamp?: string }[]> = {};
		for (let fieldIndex = 0; fieldIndex < arrays.length; fieldIndex++) {
			const trimmed = arrays[fieldIndex].filter((_item, itemIndex) =>
				keepSet.has(`${fieldIndex}:${itemIndex}`)
			);
			if (trimmed.length < arrays[fieldIndex].length) {
				updates[fields[fieldIndex]] = trimmed;
			}
		}

		if (Object.keys(updates).length > 0) {
			this.databaseService.updateStatisticsFields(updates);
		}
	}
}
