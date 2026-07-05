import {
	AfterViewInit,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	NgZone,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	SimpleChanges,
	inject
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { ConnectedMember, DatabaseService } from '../../../backend/database-service/database.service';
import { CloudbaseService } from '../../../backend/database-service/cloudbase/cloudbase.service';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../../backend/authentication-service/auth.service';
import { OrbitalStore } from './orbital.store';
import { Concentric, WeekAgenda, hexToRgba } from './shared.components';
import {
	HOME_GENRE_COLORS,
	OrbitalAgendaItem,
	OrbitalActivityRow,
	OrbitalDebtRow,
	OrbitalQuickAction,
	OrbitalRecipeRow,
	OrbitalReminderRow,
	OrbitalUrgentItem,
	OrbitalWeekDay,
	QUICK_ACTIONS
} from './orbital.model';
import { HomeStats, RecentActivityItem } from '../home.model';
import { PortalCategory, PortalLink } from '../../portal/portal.model';
import { DEBT_CATEGORY_DEFS } from '../../debt/debt.model';
import { Utilities } from '../../../common/utilities/app.utilities';
import {
	ACTIVITY_SOURCE_DATE_CALCULATOR,
	ACTIVITY_SOURCE_DEBT,
	ACTIVITY_SOURCE_LINK,
	ACTIVITY_SOURCE_MOVIE,
	ACTIVITY_SOURCE_PATCH,
	ACTIVITY_SOURCE_RECIPE,
	ACTIVITY_SOURCE_REMINDER,
	ACTIVITY_SOURCE_RESONANCE,
	ACTIVITY_SOURCE_VAULT,
	ACTIVITY_TYPE_BUG_LOGGED,
	ACTIVITY_TYPE_EDITED,
	ACTIVITY_TYPE_RESET,
	ACTIVITY_TYPE_STATUS_CHANGED,
	ACTIVITY_TYPE_UPDATED,
	ACTIVITY_TYPE_RATE_UPDATED,
	ACTIVITY_TYPE_GENRE_UPDATED,
	ACTIVITY_TYPE_FAVOURITE_UPDATED,
	ACTIVITY_TYPE_CATEGORY_UPDATED,
	ACTIVITY_TYPE_CATEGORY_DELETED,
	ACTIVITY_TYPE_PAYMENT_REMOVED,
	ACTIVITY_TYPE_CATEGORY_ADDED,
	ACTIVITY_TYPE_LOCK_UPDATED,
	GENRE_FAVOURITE,
	HISTORY_STATUS_DELETED,
	LINK_TARGET_BLANK,
	SEARCH,
	STATS_FIELD_CONNECTIONS,
	STATS_FIELD_DEBT_UPCOMING,
	STATS_FIELD_GENRE,
	STATS_FIELD_RECENT_ACTIVITIES,
	STATS_FIELD_RECIPE_LIST,
	STATS_FIELD_REMINDER_UPCOMING,
	REMINDER_VALUE_KEY_TEXT,
	REMINDER_VALUE_KEY_DATE,
	REMINDER_VALUE_KEY_LINK,
	REMINDER_VALUE_KEY_TAG,
	REMINDER_VALUE_KEY_START_TIME,
	REMINDER_VALUE_KEY_END_TIME,
	REMINDER_VALUE_KEY_SHARED,
	HOME_ACTIVITY_COLOR_DATE_CALCULATOR,
	HOME_ACTIVITY_COLOR_DEBT,
	HOME_ACTIVITY_COLOR_DELETED,
	HOME_ACTIVITY_COLOR_LINK,
	HOME_ACTIVITY_COLOR_MOVIE,
	HOME_ACTIVITY_COLOR_NEUTRAL,
	HOME_ACTIVITY_COLOR_PATCH,
	HOME_ACTIVITY_COLOR_RECIPE,
	HOME_ACTIVITY_COLOR_REMINDER,
	HOME_ACTIVITY_COLOR_SHARED,
	HOME_ACTIVITY_COLOR_VAULT,
	HOME_ACTIVITY_COLOR_RESONANCE,
	HOME_ACTIVITY_ICON_DEBT_ADDED,
	HOME_ACTIVITY_ICON_DEBT_REMOVED,
	HOME_ACTIVITY_ICON_DEBT_RESET,
	HOME_ACTIVITY_ICON_DEBT_UPDATED,
	HOME_ACTIVITY_ICON_DATE_CALCULATOR_UPDATED,
	HOME_ACTIVITY_ICON_DELETED,
	HOME_ACTIVITY_ICON_LINK_ADDED,
	HOME_ACTIVITY_ICON_LINK_REMOVED,
	HOME_ACTIVITY_ICON_LINK_UPDATED,
	HOME_ACTIVITY_FOOTER_EN,
	HOME_ACTIVITY_FOOTER_ZH,
	HOME_ACTIVITY_ICON_MOVIE_ADDED,
	HOME_ACTIVITY_ICON_MOVIE_REMOVED,
	HOME_ACTIVITY_ICON_MOVIE_SEARCHED,
	HOME_ACTIVITY_ICON_MOVIE_UPDATED,
	HOME_ACTIVITY_ICON_PATCH_ADDED,
	HOME_ACTIVITY_ICON_PATCH_BUG,
	HOME_ACTIVITY_ICON_PATCH_STATUS,
	HOME_ACTIVITY_ICON_PATCH_UPDATED,
	HOME_ACTIVITY_ICON_RECIPE_ADDED,
	HOME_ACTIVITY_ICON_VAULT_ADDED,
	HOME_ACTIVITY_ICON_RECIPE_REMOVED,
	HOME_ACTIVITY_ICON_RECIPE_UPDATED,
	HOME_ACTIVITY_ICON_REMINDER_ADDED,
	HOME_ACTIVITY_ICON_SHARED,
	HOME_ACTIVITY_ICON_REMINDER_UPDATED,
	HOME_ACTIVITY_ICON_RESONANCE_ADDED,
	HOME_ACTIVITY_ICON_RESONANCE_REMOVED,
	HOME_AGENDA_ICON_REMINDER,
	HOME_CONCENTRIC_SIZE_DEFAULT,
	HOME_DEBT_ROW_ID_PREFIX,
	HOME_LINKS_DOT_FALLBACK,
	HOME_ORBITAL_CHANGES_KEY_STATS,
	HOME_ORBITAL_CHANGES_KEY_LINKS,
	HOME_ORBITAL_PANEL_SCROLL_SELECTOR,
	HOME_QUICK_ACTION_ROUTE_DEBT,
	HOME_QUICK_ACTION_ROUTE_ENTERTAINMENT,
	HOME_QUICK_ACTION_ROUTE_PORTAL,
	HOME_QUICK_ACTION_ROUTE_RECIPE,
	HOME_QUICK_ACTION_ROUTE_REMINDER,
	HOME_REMINDER_ROW_ID_PREFIX,
	STATS_FIELD_ACTIVITY_STREAK,
	ORBITAL_URGENCY_CHIP_TYPE_DEBT,
	ORBITAL_URGENCY_CHIP_TYPE_REMINDER,
	ORBITAL_URGENCY_GROUP_SEPARATOR,
	ORBITAL_URGENCY_ITEM_SEPARATOR,
	ORBITAL_URGENCY_TEXT_MAX_CHARS,
	ORBITAL_URGENCY_WINDOW_DAYS,
	ORBITAL_BRAND_TITLE
} from '../../../common/constants';
import {
	HOME_ACTIVITY_LABEL_DEBT_ADDED,
	HOME_ACTIVITY_LABEL_DEBT_REMOVED,
	HOME_ACTIVITY_LABEL_DEBT_RESET,
	HOME_ACTIVITY_LABEL_DEBT_UPDATED,
	HOME_ACTIVITY_LABEL_LINK_ADDED,
	HOME_ACTIVITY_LABEL_LINK_REMOVED,
	HOME_ACTIVITY_LABEL_LINK_UPDATED,
	HOME_ACTIVITY_LABEL_MOVIE_ADDED,
	HOME_ACTIVITY_LABEL_MOVIE_REMOVED,
	HOME_ACTIVITY_LABEL_MOVIE_SEARCHED,
	HOME_ACTIVITY_LABEL_MOVIE_UPDATED,
	HOME_ACTIVITY_LABEL_PATCH_ADDED,
	HOME_ACTIVITY_LABEL_PATCH_BUG,
	HOME_ACTIVITY_LABEL_PATCH_DELETED,
	HOME_ACTIVITY_LABEL_PATCH_STATUS,
	HOME_ACTIVITY_LABEL_PATCH_UPDATED,
	HOME_ACTIVITY_LABEL_RECIPE_ADDED,
	HOME_ACTIVITY_LABEL_VAULT_ADDED,
	HOME_ACTIVITY_LABEL_VAULT_REMOVED,
	HOME_ACTIVITY_LABEL_RECIPE_REMOVED,
	HOME_ACTIVITY_LABEL_RECIPE_UPDATED,
	HOME_ACTIVITY_LABEL_REMINDER_ADDED,
	HOME_ACTIVITY_LABEL_REMINDER_DELETED,
	HOME_ACTIVITY_LABEL_REMINDER_UPDATED,
	HOME_SHARED_ACTIVITY_ADDED,
	HOME_SHARED_ACTIVITY_DELETED,
	HOME_SHARED_ACTIVITY_EDITED_ASPECT,
	HOME_SHARED_ACTIVITY_EDITED,
	HOME_SHARED_ACTIVITY_SELF,
	HOME_SHARED_ACTIVITY_MEMBER_FALLBACK,
	HOME_SHARED_ASPECT_TEXT,
	HOME_SHARED_ASPECT_DATE,
	HOME_SHARED_ASPECT_LINK,
	HOME_SHARED_ASPECT_TAG,
	HOME_SHARED_ASPECT_START_TIME,
	HOME_SHARED_ASPECT_END_TIME,
	HOME_SHARED_ASPECT_SHARED,
	HOME_ACTIVITY_LABEL_RESONANCE_ADDED,
	HOME_ACTIVITY_LABEL_RESONANCE_REMOVED,
	HOME_ACTIVITY_LABEL_MOVIE_RATE_UPDATED,
	HOME_ACTIVITY_LABEL_MOVIE_GENRE_UPDATED,
	HOME_ACTIVITY_LABEL_MOVIE_FAVOURITE_UPDATED,
	HOME_ACTIVITY_LABEL_LINK_CATEGORY_UPDATED,
	HOME_ACTIVITY_LABEL_LINK_CATEGORY_REMOVED,
	HOME_ACTIVITY_LABEL_DEBT_PAYMENT_REMOVED,
	HOME_ACTIVITY_LABEL_LINK_CATEGORY_ADDED,
	HOME_ACTIVITY_LABEL_DATE_CALCULATOR_UPDATED,
	HOME_ACTIVITY_LABEL_DEBT_LOCK_UPDATED,
	HOME_OVERFLOW_LABEL_DEBT,
	HOME_OVERFLOW_LABEL_LINKS,
	HOME_OVERFLOW_LABEL_RECIPES,
	HOME_OVERFLOW_LABEL_REMINDERS,
	HOME_SATELLITE_TOOLTIP_STREAK,
	ORBITAL_URGENCY_LABEL_DEBTS,
	ORBITAL_URGENCY_LABEL_REMINDERS,
	ORBITAL_URGENCY_LABEL_VARIOUS,
	ORBITAL_LABEL_STREAK,
	ORBITAL_LABEL_PATCH,
	ORBITAL_LABEL_THIS_WEEK,
	ORBITAL_LABEL_LIFE_CLOCK,
	MSG_LOADING,
	ORBITAL_LABEL_REMINDERS,
	ORBITAL_LABEL_SHORTCUTS,
	ORBITAL_LABEL_ACTIVITY,
	ORBITAL_PANEL_EMPTY_LINKS,
	ORBITAL_PANEL_EMPTY_PAYMENTS,
	ORBITAL_PANEL_EMPTY_GENRES,
	ORBITAL_PANEL_EMPTY_RECIPES,
	ORBITAL_PANEL_EMPTY_REMINDERS,
	ORBITAL_PANEL_EMPTY_ACTIVITY,
	ORBITAL_PANEL_BADGE_OPEN,
	ORBITAL_PANEL_BADGE_DUE,
	ORBITAL_DAY_NAMES_SHORT,
	ORBITAL_QUICK_ACTION_LABELS,
	NAV_LABEL_RESONANCE,
	NAV_LABEL_DEBT_SONATA,
	NAV_LABEL_ENTERTAINMENT,
	NAV_LABEL_RECIPES,
	ORBITAL_TOOLTIP_ACTIVITY_7DAYS,
	recipeCategoryLabel,
} from '../../../common/locale/locale-strings';

type OrbitalActivityOverride = {
	icon?: string;
	label?: string;
	color?: string;
	getDetail?: (entry: RecentActivityItem) => string;
};

type OrbitalActivitySourceDef = {
	icon: string;
	label: string;
	color: string;
	getDetail: (entry: RecentActivityItem) => string;
	types: Record<string, OrbitalActivityOverride>;
};

const MON_TO_SUN_LABELS = [...ORBITAL_DAY_NAMES_SHORT.slice(1), ORBITAL_DAY_NAMES_SHORT[0]];

@Component({
	selector: 'orbital',
	standalone: true,
	imports: [Concentric, WeekAgenda, AsyncPipe, TooltipModule],
	templateUrl: './orbital.component.html',
	styleUrl: './orbital.component.css',
	providers: [OrbitalStore]
})
export class OrbitalComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
	protected readonly d = inject(OrbitalStore);
	private readonly router = inject(Router);
	private readonly elementRef = inject(ElementRef);
	private readonly ngZone = inject(NgZone);
	private readonly authService = inject(AuthService);
	private readonly databaseService = inject(DatabaseService);

	@Input() stats: HomeStats | null = null;
	@Input() links: PortalLink[] = [];
	@Input() dashCategories: PortalCategory[] = [];
	@Output() readonly linkVisit = new EventEmitter<{ id: string; count: number }>();

	protected readonly HOME_ACTIVITY_FOOTER_ZH = HOME_ACTIVITY_FOOTER_ZH;
	protected readonly HOME_ACTIVITY_FOOTER_EN = HOME_ACTIVITY_FOOTER_EN;
	protected readonly HOME_CONCENTRIC_SIZE_DEFAULT = HOME_CONCENTRIC_SIZE_DEFAULT;
	protected readonly QUICK_ACTIONS = QUICK_ACTIONS.map((quickAction, i) => ({ ...quickAction, label: ORBITAL_QUICK_ACTION_LABELS[i] ?? '' }));
	protected readonly HOME_OVERFLOW_LABEL_REMINDERS = HOME_OVERFLOW_LABEL_REMINDERS;
	protected readonly HOME_OVERFLOW_LABEL_DEBT = HOME_OVERFLOW_LABEL_DEBT;
	protected readonly HOME_OVERFLOW_LABEL_RECIPES = HOME_OVERFLOW_LABEL_RECIPES;
	protected readonly HOME_OVERFLOW_LABEL_LINKS = HOME_OVERFLOW_LABEL_LINKS;
	protected readonly HOME_QUICK_ACTION_ROUTE_ENTERTAINMENT = HOME_QUICK_ACTION_ROUTE_ENTERTAINMENT;
	protected readonly HOME_QUICK_ACTION_ROUTE_REMINDER = HOME_QUICK_ACTION_ROUTE_REMINDER;
	protected readonly HOME_QUICK_ACTION_ROUTE_DEBT = HOME_QUICK_ACTION_ROUTE_DEBT;
	protected readonly HOME_QUICK_ACTION_ROUTE_RECIPE = HOME_QUICK_ACTION_ROUTE_RECIPE;
	protected readonly HOME_QUICK_ACTION_ROUTE_PORTAL = HOME_QUICK_ACTION_ROUTE_PORTAL;
	protected readonly HOME_SATELLITE_TOOLTIP_STREAK = HOME_SATELLITE_TOOLTIP_STREAK;
	protected readonly ORBITAL_BRAND_TITLE = ORBITAL_BRAND_TITLE;
	protected readonly ORBITAL_LABEL_STREAK = ORBITAL_LABEL_STREAK;
	protected readonly ORBITAL_LABEL_PATCH = ORBITAL_LABEL_PATCH;
	protected readonly NAV_LABEL_RESONANCE = NAV_LABEL_RESONANCE;
	protected readonly ORBITAL_LABEL_THIS_WEEK = ORBITAL_LABEL_THIS_WEEK;
	protected readonly ORBITAL_LABEL_LIFE_CLOCK = ORBITAL_LABEL_LIFE_CLOCK;
	protected readonly MSG_LOADING = MSG_LOADING;
	protected readonly ORBITAL_LABEL_REMINDERS = ORBITAL_LABEL_REMINDERS;
	protected readonly ORBITAL_LABEL_SHORTCUTS = ORBITAL_LABEL_SHORTCUTS;
	protected readonly ORBITAL_TOOLTIP_ACTIVITY_7DAYS = ORBITAL_TOOLTIP_ACTIVITY_7DAYS;
	protected readonly NAV_LABEL_DEBT_SONATA = NAV_LABEL_DEBT_SONATA;
	protected readonly NAV_LABEL_ENTERTAINMENT = NAV_LABEL_ENTERTAINMENT;
	protected readonly NAV_LABEL_RECIPES = NAV_LABEL_RECIPES;
	protected readonly ORBITAL_LABEL_ACTIVITY = ORBITAL_LABEL_ACTIVITY;
	protected readonly ORBITAL_PANEL_EMPTY_LINKS = ORBITAL_PANEL_EMPTY_LINKS;
	protected readonly ORBITAL_PANEL_EMPTY_PAYMENTS = ORBITAL_PANEL_EMPTY_PAYMENTS;
	protected readonly ORBITAL_PANEL_EMPTY_GENRES = ORBITAL_PANEL_EMPTY_GENRES;
	protected readonly ORBITAL_PANEL_EMPTY_RECIPES = ORBITAL_PANEL_EMPTY_RECIPES;
	protected readonly ORBITAL_PANEL_EMPTY_REMINDERS = ORBITAL_PANEL_EMPTY_REMINDERS;
	protected readonly ORBITAL_PANEL_EMPTY_ACTIVITY = ORBITAL_PANEL_EMPTY_ACTIVITY;
	protected readonly ORBITAL_PANEL_BADGE_OPEN = ORBITAL_PANEL_BADGE_OPEN;
	protected readonly ORBITAL_PANEL_BADGE_DUE = ORBITAL_PANEL_BADGE_DUE;
	protected currentUser$!: Observable<any>;
	protected genreBars: { label: string; count: number; percentage: number; color: string }[] = [];
	protected reminderRows: OrbitalReminderRow[] = [];
	protected recipeRows: OrbitalRecipeRow[] = [];
	protected debtRows: OrbitalDebtRow[] = [];
	protected activityRows: OrbitalActivityRow[] = [];
	protected addedThisWeek = 0;
	protected pinnedLinks: PortalLink[] = [];
	protected shortcutLinks: PortalLink[] = [];
	protected activityStreak = 0;
	private userStatsSub?: Subscription;

	/**
	 * Truncates a detail string to 32 characters for activity row display.
	 *
	 * @param value - The string to truncate, or undefined.
	 * @returns The truncated string, or an empty string when undefined.
	 */
	private readonly truncateDetail = (value: string | undefined): string =>
		Utilities.truncate(value ?? '', 32);

	/**
	 * Maps the reminder value key recorded on a shared activity entry to its localized aspect label,
	 * so the shared sentence can name exactly which field was changed.
	 */
	private readonly sharedAspectLabels: Record<string, string> = {
		[REMINDER_VALUE_KEY_TEXT]: HOME_SHARED_ASPECT_TEXT,
		[REMINDER_VALUE_KEY_DATE]: HOME_SHARED_ASPECT_DATE,
		[REMINDER_VALUE_KEY_LINK]: HOME_SHARED_ASPECT_LINK,
		[REMINDER_VALUE_KEY_TAG]: HOME_SHARED_ASPECT_TAG,
		[REMINDER_VALUE_KEY_START_TIME]: HOME_SHARED_ASPECT_START_TIME,
		[REMINDER_VALUE_KEY_END_TIME]: HOME_SHARED_ASPECT_END_TIME,
		[REMINDER_VALUE_KEY_SHARED]: HOME_SHARED_ASPECT_SHARED
	};

	/**
	 * Lookup table mapping activity source keys to their display configuration.
	 * Defined as a field to avoid re-allocating the full structure on every stats push.
	 */
	private readonly activityDefs: Record<string, OrbitalActivitySourceDef> = {
		[ACTIVITY_SOURCE_MOVIE]: {
			icon: HOME_ACTIVITY_ICON_MOVIE_ADDED,
			label: HOME_ACTIVITY_LABEL_MOVIE_ADDED,
			color: HOME_ACTIVITY_COLOR_MOVIE,
			getDetail: (entry) => this.truncateDetail(entry.title),
			types: {
				[ACTIVITY_TYPE_UPDATED]: {
					icon: HOME_ACTIVITY_ICON_MOVIE_UPDATED,
					label: HOME_ACTIVITY_LABEL_MOVIE_UPDATED
				},
				[ACTIVITY_TYPE_RATE_UPDATED]: {
					icon: HOME_ACTIVITY_ICON_MOVIE_UPDATED,
					label: HOME_ACTIVITY_LABEL_MOVIE_RATE_UPDATED
				},
				[ACTIVITY_TYPE_GENRE_UPDATED]: {
					icon: HOME_ACTIVITY_ICON_MOVIE_UPDATED,
					label: HOME_ACTIVITY_LABEL_MOVIE_GENRE_UPDATED
				},
				[ACTIVITY_TYPE_FAVOURITE_UPDATED]: {
					icon: HOME_ACTIVITY_ICON_MOVIE_UPDATED,
					label: HOME_ACTIVITY_LABEL_MOVIE_FAVOURITE_UPDATED
				},
				[HISTORY_STATUS_DELETED]: {
					icon: HOME_ACTIVITY_ICON_MOVIE_REMOVED,
					label: HOME_ACTIVITY_LABEL_MOVIE_REMOVED,
					color: HOME_ACTIVITY_COLOR_DELETED
				},
				[SEARCH]: {
					icon: HOME_ACTIVITY_ICON_MOVIE_SEARCHED,
					label: HOME_ACTIVITY_LABEL_MOVIE_SEARCHED,
					getDetail: () => ''
				}
			}
		},
		[ACTIVITY_SOURCE_REMINDER]: {
			icon: HOME_ACTIVITY_ICON_REMINDER_ADDED,
			label: HOME_ACTIVITY_LABEL_REMINDER_ADDED,
			color: HOME_ACTIVITY_COLOR_REMINDER,
			getDetail: (entry) => this.truncateDetail(entry.text),
			types: {
				[ACTIVITY_TYPE_UPDATED]: {
					icon: HOME_ACTIVITY_ICON_REMINDER_UPDATED,
					label: HOME_ACTIVITY_LABEL_REMINDER_UPDATED
				},
				[HISTORY_STATUS_DELETED]: {
					icon: HOME_ACTIVITY_ICON_DELETED,
					label: HOME_ACTIVITY_LABEL_REMINDER_DELETED,
					color: HOME_ACTIVITY_COLOR_DELETED
				}
			}
		},
		[ACTIVITY_SOURCE_DATE_CALCULATOR]: {
			icon: HOME_ACTIVITY_ICON_DATE_CALCULATOR_UPDATED,
			label: HOME_ACTIVITY_LABEL_DATE_CALCULATOR_UPDATED,
			color: HOME_ACTIVITY_COLOR_DATE_CALCULATOR,
			getDetail: () => '',
			types: {}
		},
		[ACTIVITY_SOURCE_RESONANCE]: {
			icon: HOME_ACTIVITY_ICON_RESONANCE_ADDED,
			label: HOME_ACTIVITY_LABEL_RESONANCE_ADDED,
			color: HOME_ACTIVITY_COLOR_RESONANCE,
			getDetail: (entry) => this.truncateDetail(entry.author),
			types: {
				[HISTORY_STATUS_DELETED]: {
					icon: HOME_ACTIVITY_ICON_RESONANCE_REMOVED,
					label: HOME_ACTIVITY_LABEL_RESONANCE_REMOVED,
					color: HOME_ACTIVITY_COLOR_DELETED
				}
			}
		},
		[ACTIVITY_SOURCE_PATCH]: {
			icon: HOME_ACTIVITY_ICON_PATCH_ADDED,
			label: HOME_ACTIVITY_LABEL_PATCH_ADDED,
			color: HOME_ACTIVITY_COLOR_PATCH,
			getDetail: (entry) => `#${entry.noteIndex ?? '?'} · ${entry.component ?? ''} · ${entry.element ?? ''}`,
			types: {
				[ACTIVITY_TYPE_BUG_LOGGED]: {
					icon: HOME_ACTIVITY_ICON_PATCH_BUG,
					label: HOME_ACTIVITY_LABEL_PATCH_BUG
				},
				[ACTIVITY_TYPE_STATUS_CHANGED]: {
					icon: HOME_ACTIVITY_ICON_PATCH_STATUS,
					label: HOME_ACTIVITY_LABEL_PATCH_STATUS
				},
				[ACTIVITY_TYPE_EDITED]: {
					icon: HOME_ACTIVITY_ICON_PATCH_UPDATED,
					label: HOME_ACTIVITY_LABEL_PATCH_UPDATED
				},
				[HISTORY_STATUS_DELETED]: {
					icon: HOME_ACTIVITY_ICON_DELETED,
					label: HOME_ACTIVITY_LABEL_PATCH_DELETED,
					color: HOME_ACTIVITY_COLOR_DELETED
				}
			}
		},
		[ACTIVITY_SOURCE_LINK]: {
			icon: HOME_ACTIVITY_ICON_LINK_ADDED,
			label: HOME_ACTIVITY_LABEL_LINK_ADDED,
			color: HOME_ACTIVITY_COLOR_LINK,
			getDetail: (entry) => this.truncateDetail(entry.domain),
			types: {
				[ACTIVITY_TYPE_CATEGORY_ADDED]: {
					icon: HOME_ACTIVITY_ICON_LINK_ADDED,
					label: HOME_ACTIVITY_LABEL_LINK_CATEGORY_ADDED
				},
				[ACTIVITY_TYPE_UPDATED]: {
					icon: HOME_ACTIVITY_ICON_LINK_UPDATED,
					label: HOME_ACTIVITY_LABEL_LINK_UPDATED
				},
				[ACTIVITY_TYPE_CATEGORY_UPDATED]: {
					icon: HOME_ACTIVITY_ICON_LINK_UPDATED,
					label: HOME_ACTIVITY_LABEL_LINK_CATEGORY_UPDATED
				},
				[ACTIVITY_TYPE_CATEGORY_DELETED]: {
					icon: HOME_ACTIVITY_ICON_LINK_REMOVED,
					label: HOME_ACTIVITY_LABEL_LINK_CATEGORY_REMOVED,
					color: HOME_ACTIVITY_COLOR_DELETED
				},
				[HISTORY_STATUS_DELETED]: {
					icon: HOME_ACTIVITY_ICON_LINK_REMOVED,
					label: HOME_ACTIVITY_LABEL_LINK_REMOVED,
					color: HOME_ACTIVITY_COLOR_DELETED
				}
			}
		},
		[ACTIVITY_SOURCE_DEBT]: {
			icon: HOME_ACTIVITY_ICON_DEBT_ADDED,
			label: HOME_ACTIVITY_LABEL_DEBT_ADDED,
			color: HOME_ACTIVITY_COLOR_DEBT,
			getDetail: (entry) => this.truncateDetail(entry.name),
			types: {
				[ACTIVITY_TYPE_UPDATED]: {
					icon: HOME_ACTIVITY_ICON_DEBT_UPDATED,
					label: HOME_ACTIVITY_LABEL_DEBT_UPDATED
				},
				[ACTIVITY_TYPE_LOCK_UPDATED]: {
					icon: HOME_ACTIVITY_ICON_DEBT_UPDATED,
					label: HOME_ACTIVITY_LABEL_DEBT_LOCK_UPDATED
				},
				[ACTIVITY_TYPE_PAYMENT_REMOVED]: {
					icon: HOME_ACTIVITY_ICON_DELETED,
					label: HOME_ACTIVITY_LABEL_DEBT_PAYMENT_REMOVED
				},
				[ACTIVITY_TYPE_RESET]: {
					icon: HOME_ACTIVITY_ICON_DEBT_RESET,
					label: HOME_ACTIVITY_LABEL_DEBT_RESET
				},
				[HISTORY_STATUS_DELETED]: {
					icon: HOME_ACTIVITY_ICON_DEBT_REMOVED,
					label: HOME_ACTIVITY_LABEL_DEBT_REMOVED,
					color: HOME_ACTIVITY_COLOR_DELETED
				}
			}
		},
		[ACTIVITY_SOURCE_RECIPE]: {
			icon: HOME_ACTIVITY_ICON_RECIPE_ADDED,
			label: HOME_ACTIVITY_LABEL_RECIPE_ADDED,
			color: HOME_ACTIVITY_COLOR_RECIPE,
			getDetail: (entry) => this.truncateDetail(entry.name),
			types: {
				[ACTIVITY_TYPE_UPDATED]: {
					icon: HOME_ACTIVITY_ICON_RECIPE_UPDATED,
					label: HOME_ACTIVITY_LABEL_RECIPE_UPDATED
				},
				[HISTORY_STATUS_DELETED]: {
					icon: HOME_ACTIVITY_ICON_RECIPE_REMOVED,
					label: HOME_ACTIVITY_LABEL_RECIPE_REMOVED,
					color: HOME_ACTIVITY_COLOR_DELETED
				}
			}
		},
		[ACTIVITY_SOURCE_VAULT]: {
			icon: HOME_ACTIVITY_ICON_VAULT_ADDED,
			label: HOME_ACTIVITY_LABEL_VAULT_ADDED,
			color: HOME_ACTIVITY_COLOR_VAULT,
			getDetail: (entry) => this.truncateDetail(entry.name),
			types: {
				[HISTORY_STATUS_DELETED]: {
					icon: HOME_ACTIVITY_ICON_DELETED,
					label: HOME_ACTIVITY_LABEL_VAULT_REMOVED,
					color: HOME_ACTIVITY_COLOR_DELETED
				}
			}
		}
	};

	/**
	 * Subscribes to the auth state and per-user stats observables.
	 */
	ngOnInit(): void {
		this.currentUser$ = this.authService.currentUser$;
		this.userStatsSub = this.databaseService.getUserStats().subscribe((doc) => {
			if (!doc) return;
			this.activityStreak = (doc[STATS_FIELD_ACTIVITY_STREAK] as number) ?? 0;
		});
	}

	/**
	 * Cleans up the per-user stats subscription on component teardown.
	 */
	ngOnDestroy(): void {
		this.userStatsSub?.unsubscribe();
	}

	/**
	 * Attaches the scroll auto-hide behaviour to all glass panel elements after the view renders.
	 */
	ngAfterViewInit(): void {
		this.ngZone.runOutsideAngular(() => {
			const panels = (this.elementRef.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
				HOME_ORBITAL_PANEL_SCROLL_SELECTOR
			);
			panels.forEach((panel) => Utilities.attachScrollAutoHide(panel));
		});
	}

	/**
	 * Rebuilds derived panel data whenever the stats or links inputs change.
	 *
	 * @param changes - The Angular change record for this cycle.
	 */
	ngOnChanges(changes: SimpleChanges): void {
		if (changes[HOME_ORBITAL_CHANGES_KEY_STATS] && this.stats) {
			this.genreBars = this.buildGenreBars();
			this.reminderRows = this.buildReminderRows();
			this.recipeRows = this.buildRecipeRows();
			this.debtRows = this.buildDebtRows();
			this.activityRows = this.buildActivityRows();
			this.addedThisWeek = this.buildAddedThisWeek();
			this.syncWeekData();
		}
		if (changes[HOME_ORBITAL_CHANGES_KEY_LINKS]) {
			this.pinnedLinks = this.links.filter((link) => link.isPinned === true && !link.isShared).slice(0, 6);
			this.shortcutLinks = this.links.filter((link) => !link.isShared);
		}
	}

	/**
	 * Gets the true total number of open reminders from the statistics document.
	 * Reads totalReminders directly so the count is never limited by the 20-item
	 * cap applied to the reminderUpcoming array.
	 *
	 * @returns The full reminder count from stats, or 0 if not yet loaded.
	 */
	protected get openReminderCount(): number {
		return this.stats?.totalReminders ?? 0;
	}

	/**
	 * Gets the total number of patch notes from the statistics document.
	 *
	 * @returns The patch notes count from stats, or 0 if not yet loaded.
	 */
	protected get patchNotesCount(): number {
		return this.stats?.totalPatchNotes ?? 0;
	}

	/**
	 * Gets the true total number of unpaid debts from the statistics document.
	 * Reads totalDebts directly so the count is never limited by the 20-item
	 * cap applied to the debtUpcoming array.
	 *
	 * @returns The full unpaid debt count from stats, or 0 if not yet loaded.
	 */
	protected get openDebtCount(): number {
		return this.stats?.totalDebts ?? 0;
	}

	/**
	 * Gets the list of reminder and debt items due within the urgency window,
	 * sorted by ascending days until due so the most urgent appears first.
	 *
	 * @returns Merged, sorted array of urgent items for the urgency strip.
	 */
	protected get urgentItems(): OrbitalUrgentItem[] {
		return [
			...this.buildUrgentItems(this.reminderRows, ORBITAL_URGENCY_CHIP_TYPE_REMINDER as 'reminder'),
			...this.buildUrgentItems(this.debtRows, ORBITAL_URGENCY_CHIP_TYPE_DEBT as 'debt')
		].sort((a, b) => a.daysUntilDue - b.daysUntilDue);
	}

	/**
	 * Gets the urgency strip summary string. Reminders and debts are each
	 * built via {@link buildGroupSummary} and joined with the group separator.
	 *
	 * @returns Combined urgency summary string for the strip label.
	 */
	protected get urgentSummary(): string {
		const items = this.urgentItems;
		return [
			this.buildGroupSummary(
				items.filter((item) => item.type === ORBITAL_URGENCY_CHIP_TYPE_REMINDER),
				ORBITAL_URGENCY_LABEL_REMINDERS
			),
			this.buildGroupSummary(
				items.filter((item) => item.type === ORBITAL_URGENCY_CHIP_TYPE_DEBT),
				ORBITAL_URGENCY_LABEL_DEBTS
			)
		]
			.filter((part): part is string => part !== null)
			.join(ORBITAL_URGENCY_GROUP_SEPARATOR);
	}

	/**
	 * Filters a row array to items within the urgency window and maps each to
	 * an OrbitalUrgentItem with the given type literal.
	 *
	 * {@link urgentItems} - Builds the merged urgent list from reminders and debts.
	 *
	 * @param rows - The source rows, each carrying at minimum id, name, daysUntilDue, and dueLabel.
	 * @param type - The type literal to stamp on every produced item.
	 * @returns Filtered and mapped urgent items for the given source.
	 */
	private buildUrgentItems(
		rows: { id: string; name: string; daysUntilDue: number; dueLabel: string }[],
		type: OrbitalUrgentItem['type']
	): OrbitalUrgentItem[] {
		return rows
			.filter((row) => row.daysUntilDue <= ORBITAL_URGENCY_WINDOW_DAYS)
			.map((row) => ({
				id: row.id,
				name: row.name,
				daysUntilDue: row.daysUntilDue,
				dueLabel: row.dueLabel,
				type
			}));
	}

	/**
	 * Formats one category group (reminders or debts) into a single summary
	 * segment. Returns null when the group is empty so callers can filter it out.
	 * Single items show the truncated name; multiple items show a count with the
	 * closest due date, appending "Various" when due dates differ.
	 *
	 * {@link urgentSummary} - Calls this for the reminder group and the debt group.
	 *
	 * @param items - The pre-filtered items for this group, sorted by daysUntilDue ascending.
	 * @param groupLabel - The plural label to display when there are multiple items.
	 * @returns A formatted string segment, or null when the group is empty.
	 */
	private buildGroupSummary(items: OrbitalUrgentItem[], groupLabel: string): string | null {
		// Step 1: Empty group produces no segment — caller filters nulls before joining
		if (!items.length) return null;

		// Step 2: Single item — show truncated name and its own due label directly
		if (items.length === 1) {
			return `${Utilities.truncate(items[0].name, ORBITAL_URGENCY_TEXT_MAX_CHARS)}${ORBITAL_URGENCY_ITEM_SEPARATOR}${items[0].dueLabel}`;
		}

		/* Step 3: Multiple items — show count + group label. Append "Various" when items span
		   different due dates; items are pre-sorted ascending so [0] is always the nearest. */
		const allSameDate = items.every((item) => item.daysUntilDue === items[0].daysUntilDue);
		const dateLabel = allSameDate
			? items[0].dueLabel
			: `${items[0].dueLabel}${ORBITAL_URGENCY_ITEM_SEPARATOR}${ORBITAL_URGENCY_LABEL_VARIOUS}`;
		return `${items.length} ${groupLabel}${ORBITAL_URGENCY_ITEM_SEPARATOR}${dateLabel}`;
	}

	/**
	 * Builds the count of activity entries recorded in the last seven days.
	 * Parses each entry's timestamp from the app dot-separated format
	 * ("YYYY.MM.DD HH:mm:ss") or ISO 8601. The recentActivities array is
	 * capped at 20, so this value saturates at 20 for very active weeks.
	 *
	 * @returns Number of activity log entries with a timestamp within the past 7 days.
	 */
	private buildAddedThisWeek(): number {
		const raw = Utilities.toArray(this.stats?.[STATS_FIELD_RECENT_ACTIVITIES]) as RecentActivityItem[];
		if (!raw.length) return 0;

		// Step 1: Compute the midnight boundary 7 days ago; zeroing hours makes the comparison date-only
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - 7);
		cutoff.setHours(0, 0, 0, 0);

		/* Step 2: Parse each timestamp with parseDateToISODate before constructing a Date — the app uses
		   a dot-separated format ("YYYY.MM.DD HH:mm") that the Date constructor cannot parse cross-browser. */
		return raw.filter((entry) => {
			if (!entry.timestamp) return false;
			return new Date(Utilities.parseDateToISODate(entry.timestamp) + 'T00:00') >= cutoff;
		}).length;
	}

	/**
	 * Navigates to the route associated with a quick-action button.
	 *
	 * @param action - The quick-action descriptor containing the target route and optional state.
	 */
	protected navigateTo(action: OrbitalQuickAction): void {
		this.router
			.navigate([action.route], action.state ? { state: action.state } : undefined)
			.catch(() => {});
	}

	/**
	 * Navigates to a page by its route path. Used by overflow rows to send
	 * the user to the full list when the panel cap has been reached.
	 *
	 * @param route - The route path to navigate to.
	 */
	protected navigateToPage(route: string): void {
		this.router.navigate([route]).catch(() => {});
	}

	/**
	 * Opens a useful link in a new tab and emits a linkVisit event with the updated count.
	 *
	 * @param link - The PortalLink to open.
	 */
	protected openLink(link: PortalLink): void {
		window.open(link.url, LINK_TARGET_BLANK);
		this.linkVisit.emit({ id: link._id, count: (link.visitCount ?? 0) + 1 });
	}

	/**
	 * Gets the dot colour for a quick-access link derived from its category.
	 *
	 * @param link - The PortalLink whose colour is needed.
	 * @returns A CSS colour string from the category, or the fallback colour.
	 */
	protected getLinkColor(link: PortalLink): string {
		const category = this.dashCategories.find((dashCategory) => dashCategory._id === link.category);
		return category?.color ?? HOME_LINKS_DOT_FALLBACK;
	}

	/**
	 * Gets the icon badge background for an activity row.
	 *
	 * @param color - The hex accent colour string.
	 * @returns A CSS rgba() colour string at 20% opacity.
	 */
	protected getIconBackground(color: string): string {
		return hexToRgba(color, 0.2);
	}

	/**
	 * Builds the genre bar data from the current stats, limited to the top 5 genres
	 * sorted by count descending, with percentage relative to the top genre.
	 *
	 * @returns An array of genre bar descriptors for the recipes panel.
	 */
	private buildGenreBars(): { label: string; count: number; percentage: number; color: string }[] {
		const raw = this.stats?.[STATS_FIELD_GENRE];
		if (!raw) return [];

		// Step 1: Strip the synthetic "Favourite" key and zero-count entries so only real genres appear
		const entries = Object.entries(raw as Record<string, number>)
			.filter(([key, value]) => key !== GENRE_FAVOURITE && (value as number) > 0)
			.map(([label, count]) => ({ label, count: count as number }));
		if (!entries.length) return [];

		// Step 2: Sort descending and capture the top count for relative-percentage calculation
		entries.sort((a, b) => b.count - a.count);
		const max = entries[0].count;

		// Step 3: Cap at 5 bars and assign percentage + cycling color index
		return entries.slice(0, 5).map((genre, index) => ({
			...genre,
			percentage: Math.round((genre.count / max) * 100),
			color: HOME_GENRE_COLORS[index % HOME_GENRE_COLORS.length]
		}));
	}

	/**
	 * Builds the reminder row data from the current stats, sorted by date ascending.
	 * All stored items are shown; the stats array is already capped at 20 on write.
	 *
	 * @returns An array of reminder row descriptors for the reminders panel.
	 */
	private buildReminderRows(): OrbitalReminderRow[] {
		const raw = Utilities.toArray(this.stats?.[STATS_FIELD_REMINDER_UPCOMING]);

		// Step 1: Drop entries without a parseable date so sort arithmetic is always valid
		return (
			raw
				.filter((item) => {
					const reminder = item as { date?: string | null };
					return reminder.date && Utilities.coerceDateToString(reminder.date);
				})

				/* Step 2: Sort ascending by calendar date. The date string may be in app dot-format
			   or ISO 8601, so coerceDateToString normalises it before constructing the timestamp. */
				.sort((a, b) => {
					const toMs = (item: unknown) => {
						const dateStr = Utilities.coerceDateToString((item as { date?: unknown }).date);
						const [year, month, day] = dateStr.split('-').map(Number);
						return new Date(year, month - 1, day).getTime();
					};
					return toMs(a) - toMs(b);
				})

				// Step 3: Map each item to a typed row; 9999 sentinel pushes undated items to the end of urgency sorts
				.map((item, index) => {
					const reminder = item as { name?: string; date?: string | null };
					const overdue = Utilities.isOverdue(reminder.date);
					return {
						id: `${HOME_REMINDER_ROW_ID_PREFIX}${index}`,
						name: reminder.name ?? '',
						dueLabel: Utilities.getDaysUntil(reminder.date),
						overdue,
						daysUntilDue: Utilities.getDaysUntilNumber(reminder.date) ?? 9999
					};
				})
		);
	}

	/**
	 * Builds the recipe row data from the current stats.
	 *
	 * @returns An array of recipe row descriptors for the recipes panel.
	 */
	private buildRecipeRows(): OrbitalRecipeRow[] {
		const raw = Utilities.toArray(this.stats?.[STATS_FIELD_RECIPE_LIST]);
		return raw.map((item) => {
			const recipe = item as { id?: string; name?: string; category?: string };
			return {
				id: recipe.id ?? '',
				name: recipe.name ?? '',
				category: recipe.category ?? ''
			};
		});
	}

	/**
	 * Builds the debt row data from the current stats, sorted by date ascending.
	 * All stored items are shown; the stats array is already capped at 20 on write.
	 *
	 * @returns An array of debt row descriptors for the debt-sonata panel.
	 */
	private buildDebtRows(): OrbitalDebtRow[] {
		const raw = Utilities.toArray(this.stats?.[STATS_FIELD_DEBT_UPCOMING]);

		// Step 1: Drop entries without a parseable date so sort arithmetic is always valid
		return (
			raw
				.filter((item) => {
					const debt = item as { date?: string | null };
					return debt.date && Utilities.coerceDateToString(debt.date);
				})

				/* Step 2: Sort ascending by calendar date. coerceDateToString normalises both
			   app dot-format and ISO 8601 before the millisecond comparison. */
				.sort((a, b) => {
					const toMs = (item: unknown) => {
						const dateStr = Utilities.coerceDateToString((item as { date?: unknown }).date);
						const [year, month, day] = dateStr.split('-').map(Number);
						return new Date(year, month - 1, day).getTime();
					};
					return toMs(a) - toMs(b);
				})

				// Step 3: Map to typed row; derive repayment percentage and category gradient for the progress bar
				.map((item, index) => {
					const debt = item as {
						name?: string;
						date?: string | null;
						debt?: number;
						original?: number;
						category?: string;
					};
					const overdue = Utilities.isOverdue(debt.date);
					const remaining = debt.debt ?? 0;
					const original = debt.original ?? 0;

					// Guard against division by zero when no original amount is recorded
					const percentage =
						original > 0 ? Math.round(((original - remaining) / original) * 100) : 0;
					const categoryDef = DEBT_CATEGORY_DEFS.find((d) => d.key === debt.category);
					const barColor = categoryDef?.gradient ?? 'linear-gradient(90deg,#d53163,#f7971e)';
					return {
						id: `${HOME_DEBT_ROW_ID_PREFIX}${index}`,
						name: debt.name ?? '',
						dueLabel: Utilities.getDaysUntil(debt.date),
						overdue,
						daysUntilDue: Utilities.getDaysUntilNumber(debt.date) ?? 9999,
						percentage,
						barColor
					};
				})
		);
	}

	/**
	 * Builds the activity row data from the unified recentActivities stats array.
	 * Uses a source-keyed lookup table to resolve the icon, label, colour, and detail
	 * for each entry. Unknown sources are skipped. Type overrides within each source
	 * apply only the fields that differ from the source default.
	 *
	 * @returns An array of activity row descriptors for the activity panel.
	 */
	private buildActivityRows(): OrbitalActivityRow[] {
		const defs = this.activityDefs;

		const raw = Utilities.toArray(this.stats?.[STATS_FIELD_RECENT_ACTIVITIES]) as RecentActivityItem[];
		const rows: OrbitalActivityRow[] = [];

		for (const entry of raw) {
			// Step 1: Skip malformed entries — source and timestamp are both required for a valid row
			if (!entry.timestamp || !entry.source) continue;

			// Step 2: Resolve the source definition; unknown sources are silently skipped rather than erroring
			const def = defs[entry.source];
			if (!def) continue;

			/* Step 3: Apply per-type overrides — only the fields that differ from the source default
			   are overridden; getDetail falls back to the source-level function when the override omits it. */
			const ov = def.types[entry.type ?? ''];
			/* Step 4: A shared entry (a connected account's reminder) gets a distinct group icon and
			   violet accent so it reads apart from the user's own activity. */
			const isShared = entry.isShared ?? false;
			rows.push({
				icon: isShared ? HOME_ACTIVITY_ICON_SHARED : (ov?.icon ?? def.icon),
				label: ov?.label ?? def.label,
				color: isShared ? HOME_ACTIVITY_COLOR_SHARED : (ov?.color ?? def.color),
				detail: isShared ? this.buildSharedActivityDetail(entry) : (ov?.getDetail ?? def.getDetail)(entry),
				time: Utilities.getRelativeTime(entry.timestamp),
				timestamp: entry.timestamp,
				isShared
			});
		}

		return rows;
	}

	/**
	 * Builds the "who did what" sentence shown as the detail line of a shared activity row.
	 * The author openid is tagged onto each entry by the getSharedActivity Cloud Function; the
	 * signed-in user's own entries read as "You", others resolve to their connection name. Edits
	 * name the exact changed aspect when the entry records one.
	 *
	 * {@link buildActivityRows} - Uses this sentence for rows flagged isShared.
	 *
	 * @param entry - The shared activity entry to describe.
	 * @returns The localized sentence describing who changed what.
	 */
	private buildSharedActivityDetail(entry: RecentActivityItem): string {
		const connections = Utilities.toArray(this.stats?.[STATS_FIELD_CONNECTIONS]) as ConnectedMember[];
		const who =
			entry.authorOpenid === CloudbaseService.getUserId()
				? HOME_SHARED_ACTIVITY_SELF
				: (connections.find((member) => member.openid === entry.authorOpenid)?.name ??
					HOME_SHARED_ACTIVITY_MEMBER_FALLBACK);
		const text = this.truncateDetail(entry.text);

		if (entry.type === HISTORY_STATUS_DELETED) {
			return Utilities.formatTemplate(HOME_SHARED_ACTIVITY_DELETED, { who, text });
		}
		if (entry.type === ACTIVITY_TYPE_UPDATED) {
			const aspect = this.sharedAspectLabels[entry.element ?? ''];
			return aspect
				? Utilities.formatTemplate(HOME_SHARED_ACTIVITY_EDITED_ASPECT, { who, text, aspect })
				: Utilities.formatTemplate(HOME_SHARED_ACTIVITY_EDITED, { who, text });
		}
		return Utilities.formatTemplate(HOME_SHARED_ACTIVITY_ADDED, { who, text });
	}

	/**
	 * Populates the store with the current week's day descriptors and per-day agenda items
	 * derived from the upcoming reminders and debts in the stats payload.
	 */
	private syncWeekData(): void {
		// Step 1 : Compute Monday of the current week
		const today = new Date();
		const dow = today.getDay();
		const mondayOffset = dow === 0 ? -6 : 1 - dow;
		const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + mondayOffset);

		// Step 2 : Pull raw reminder and debt lists from the latest stats
		const rawReminders = Utilities.toArray(this.stats?.[STATS_FIELD_REMINDER_UPCOMING]) as {
			date?: string | null;
			name?: string;
		}[];
		const rawDebts = Utilities.toArray(this.stats?.[STATS_FIELD_DEBT_UPCOMING]) as {
			date?: string | null;
			name?: string;
		}[];

		// Step 3 : Build day descriptors and per-day agenda items for the week
		const agenda: Record<number, OrbitalAgendaItem[]> = {};
		const days: OrbitalWeekDay[] = MON_TO_SUN_LABELS.map((label, dayIndex) => {
			const dayDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + dayIndex);
			const dateKey = Utilities.formatDateForStorage(dayDate);

			const dayReminders = rawReminders.filter((reminder) => {
				if (!reminder.date) return false;
				return Utilities.coerceDateToString(reminder.date) === dateKey;
			});
			const dayDebts = rawDebts.filter((debt) => {
				if (!debt.date) return false;
				return Utilities.coerceDateToString(debt.date) === dateKey;
			});

			agenda[dayIndex] = [
				...dayReminders.map((reminder) => ({
					icon: HOME_AGENDA_ICON_REMINDER,
					name: reminder.name ?? '',
					tag: dateKey,
					color: HOME_ACTIVITY_COLOR_REMINDER
				})),
				...dayDebts.map((debt) => ({
					icon: HOME_ACTIVITY_ICON_DEBT_ADDED,
					name: debt.name ?? '',
					tag: dateKey,
					color: HOME_ACTIVITY_COLOR_NEUTRAL
				}))
			];

			const isToday = dayDate.toDateString() === today.toDateString();
			const isPast = dayDate < today && !isToday;
			return {
				label,
				dayIndex,
				dayNumber: dayDate.getDate(),
				isToday,
				isPast,
				fullDate: dayDate,
				count: dayReminders.length + dayDebts.length
			};
		});

		// Step 4 : Push the computed data into the store for the WeekAgenda sub-component
		this.d.setWeekData(days, agenda);
	}

	/**
	 * Gets the display name for the signed-in user.
	 *
	 * @param user - The authenticated user object from the auth observable.
	 * @returns The user's display name, or an empty string if unavailable.
	 */
	protected getUserDisplayName(user: any): string {
		return Utilities.getUserDisplayName(user);
	}

	/**
	 * Gets the locale-resolved display label for a recipe category key.
	 *
	 * @param categoryKey - The English category key stored in the database.
	 * @returns The translated category label, or the raw key when no mapping exists.
	 */
	protected categoryDisplayLabel(categoryKey: string): string {
		return recipeCategoryLabel(categoryKey);
	}
}
