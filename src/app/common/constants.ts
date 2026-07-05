/* ─────────────────────────────────────────
   Toast severity strings
───────────────────────────────────────── */

export const TOAST_INFO = 'info';
export const TOAST_WARN = 'warn';
export const TOAST_ERROR = 'error';
export const SEVERITY_DANGER = 'danger';
export const SEVERITY_SECONDARY = 'secondary';
export const PATCH_SEVERITY_ICON_TODO = 'pi pi-clock';
export const PATCH_SEVERITY_ICON_IN_PROGRESS = 'pi pi-play-circle';
export const PATCH_SEVERITY_ICON_COMPLETED = 'pi pi-verified';
export const PATCH_SEVERITY_ICON_DEBUG = 'pi pi-exclamation-circle';
export const PATCH_SEVERITY_ICON_DRAFT = 'pi pi-file-edit';

/* ─────────────────────────────────────────
   Dialog type discriminators
───────────────────────────────────────── */

/** Dialog type for a yes/no confirmation prompt. */
export const DIALOG_CONFIRM = 'confirm';
/** Dialog type for the add-movie flow. */
export const DIALOG_ADD = 'add';
/** Dialog type for the history restoration panel. */
export const DIALOG_HISTORY = 'history';
/** Dialog type for a non-blocking error message. */
export const DIALOG_ERROR = 'error';
/** Dialog type for a blocking progress overlay. */
export const DIALOG_BLOCK = 'block';
/** Dialog type for the debt dialog (add and edit modes share one dialog). */
export const DIALOG_DEBT = 'debt';
/** Dialog type for the ingredient type manager in the editor. */
export const DIALOG_INGREDIENT = 'ingredient';
/** Dialog type for the add/edit link dialog on the Portal page. */
export const DIALOG_LINK = 'link';
/** Dialog type for the multi-link batch-add dialog on the Portal page. */
export const DIALOG_MULTI_LINK = 'multi-link';
/** Dialog type for the loading-timeout retry overlay. */
export const DIALOG_RETRY = 'retry';
/** Dialog type for the account deletion confirmation dialog. */
export const DIALOG_DELETE_ACCOUNT = 'delete-account';
/** Dialog type for the add/edit category dialog on the Portal page. */
export const DIALOG_CATEGORY = 'category';
/** Dialog type for the add-account dialog on the Vault page. */
export const DIALOG_ADD_ACCOUNT = 'add-account';

/* ─────────────────────────────────────────
   History dialog constants
───────────────────────────────────────── */

/** History-entry status when a rate-search is logged — appears in the history message text. */
export const HISTORY_STATUS_SEARCH = 'search';
/** History-entry status when a movie is added — appears in the history message text. */
export const HISTORY_STATUS_ADDED = 'added';
/** History-entry status when a movie is deleted — appears in the history message text. */
export const HISTORY_STATUS_DELETED = 'deleted';
/** History-entry status when a reminder is completed (marked done) — distinct from deletion. */
export const HISTORY_STATUS_COMPLETED = 'completed';
/** Sentinel movie ID string used when a history entry has no valid numeric ID. */
export const HISTORY_MOVIE_ID_UNKNOWN = 'unknown';
/** Inline border style for an "added" history entry. */
export const HISTORY_STYLE_ADDED = 'solid green';
/** Inline border style for a "deleted" history entry. */
export const HISTORY_STYLE_DELETED = 'solid red';

/* ─────────────────────────────────────────
   Application lifecycle constants
───────────────────────────────────────── */

/** Layout breakpoint for compact overlay nav: below this width the drawer switches to overlay mode. */
export const APP_BREAKPOINT_COMPACT = 1300;
/** Layout breakpoint for narrow viewport mode: below this width the sidebar collapses to an icon-only strip and nav labels are hidden. */
export const APP_BREAKPOINT_NARROW = 940;
/** CSS class added to body when running inside the Tauri desktop app — scopes Tauri-only global styles. */
export const TAURI_MODE_CLASS = 'tauri-mode';
/** CSS class added to body when the active locale is English — allows locale-specific CSS overrides via :host-context(). */
export const LOCALE_EN_BODY_CLASS = 'locale-en';
/** Tauri backend command name that toggles the minimize-on-close window behaviour. */
export const TAURI_CMD_SET_MINIMIZE_ON_CLOSE = 'set_minimize_on_close';
/** Milliseconds before the loading-timeout retry dialog appears when a page is stuck loading. */
export const LOADING_TIMEOUT_MS = 7000;
/** Timeout key for the Home page loading guard. */
export const TIMEOUT_KEY_HOME = 'home';
/** Timeout key for the Reminder page loading guard. */
export const TIMEOUT_KEY_REMINDER = 'reminder';
/** Timeout key for the Debt Sonata page loading guard. */
export const TIMEOUT_KEY_DEBT = 'debt';
/** Timeout key for the Vault page loading guard. */
export const TIMEOUT_KEY_VAULT = 'vault';
/** Timeout key for the Patch Notes tab loading guard. */
export const TIMEOUT_KEY_PATCH = 'patch';
/** Timeout key for the Release Notes tab loading guard. */
export const TIMEOUT_KEY_PATCH_RELEASE = 'patch-release';
export const COMPONENT_DESTROY = 'Component Destroyed';
export const UTILITIES_LOG_COUNTRY_FAILED = 'Country detection failed';
export const UTILITIES_LOG_DEFAULT_COUNTRY = 'Use default country: ';
/** Country code for mainland China — drives Cloudbase backend selection at startup. */
export const CN = 'CN';
/** Country code for all non-CN regions — drives Firebase backend selection at startup. */
export const OVERSEAS = 'INTL';
/** IANA timezone identifiers for mainland China — used by the timezone-based region detector. */
export const CN_TIMEZONES = ['Asia/Shanghai', 'Asia/Urumqi'];
/** DOM keyboard event key value for the Enter key. */
export const KEY_ENTER = 'Enter';
/** DOM keyboard event key value for the Escape key. */
export const KEY_ESCAPE = 'Escape';

/* ─────────────────────────────────────────
   Auth and session constants
───────────────────────────────────────── */

/* Stored in localStorage to avoid the Access Denied flicker on page refresh.
   The value '1' is a lightweight presence flag — it carries no user identity,
   no token, and no permissions. It only signals that the last known session
   was authenticated so the UI can optimistically show content while CloudBase
   re-validates the real session in the background. Written on login, removed on logout. */
export const LS_AUTH_HINT_KEY = 'auth_hint';
/** localStorage key used to persist the nav sidebar collapsed state across page refreshes. */
export const LS_NAV_COLLAPSED_KEY = 'nav_collapsed';
/** localStorage key used to persist the user's selected display language across page refreshes. */
export const LS_LOCALE_KEY = 'app_locale';
export const NAV_AVATAR_FALLBACK_INITIAL = '?';
/** Fallback background gradient for the avatar element when no user-specific colour is set. */
export const NAV_AVATAR_GRADIENT = 'linear-gradient(135deg,#d53369,#daae51)';
export const LOGIN_URL_DEFAULT_RETURN = '/';
export const LOGIN_ANIM_OUT = 'out';
export const LOGIN_ANIM_IN = 'in';
/** Loading indicator character shown on the sign-in button while an auth request is in flight. */
export const LOGIN_LABEL_LOADING = '…';
export const LOGIN_MAX_USERNAME_LENGTH = 13;
/** CloudBase role string that identifies an admin user. */
export const ROLE_ADMIN = 'administrator';
/** CloudBase error code for an invalid request argument (e.g. wrong verification code). */
export const CLOUDBASE_ERROR_INVALID_ARGUMENT = 'invalid_argument';
/** CloudBase error category returned when credentials are wrong. */
export const CLOUDBASE_ERROR_INVALID_CREDENTIALS = 'INVALID_CREDENTIALS';
export const AUTH_LOG_SIGN_IN_FAILED = 'Error when signing in with email and password';
export const AUTH_LOG_GOOGLE_SIGN_IN_FAILED = 'Error when signing in through Google';
export const AUTH_LOG_SIGN_OUT_FAILED = 'Error when signing out current user';
/** CloudBase behaviour-log event type queried for the last sign-in timestamp. */
export const AUTH_BEHAVIOR_LOG_TYPE_LOGIN = 'LOGIN';

/* ─────────────────────────────────────────
   Database collection names
───────────────────────────────────────── */

export const DATABASE_HISTORY = 'history';
export const DATABASE_MOVIES = 'movies';
export const DATABASE_RECIPES = 'recipes';
export const DATABASE_PATCH_NOTES = 'patch_notes';
export const DATABASE_RELEASE_NOTES = 'release_notes';
export const DATABASE_QUOTES = 'quotes';
export const DATABASE_DATE_CALCULATOR = 'date_calculator';
export const DATABASE_DEBT_SONATA = 'debt_sonata';
export const DATABASE_REMINDER = 'reminder';
export const DATABASE_STATISTICS = 'statistics';
/** Per-user stats documents (totals, recent activity, milestones, streak), one doc per user keyed by _id == _openid. */
export const DATABASE_USERS = 'users';
// stores both links (type:'link') and categories (type:'category')
export const DATABASE_USEFUL_LINKS = 'useful_links';
/** Per-user preferences stored as a keyed object under each user's uid. */
export const DATABASE_USER_PREFERENCES = 'preferences';
/** Per-user account-links graph (nodes, edges, custom categories) for the Vault page. */
export const DATABASE_VAULT = 'vault';

/* ─────────────────────────────────────────
   Database service log messages
───────────────────────────────────────── */

export const DB_LOG_MOVIE_LIST_FAILED = 'Error while retrieving movie list';
export const DB_LOG_TEMP_URLS_FAILED = 'Error while getting temp file URLs';
export const DB_LOG_DATE_CALC_UPDATED = 'Date calculator has been updated';
export const DB_LOG_DATE_CALC_UPDATE_FAILED = 'Error while updating date calculator table';
export const DB_LOG_MOVIE_RATE_UPDATE_FAILED = 'Error while updating movie rate';
export const DB_LOG_MOVIE_GENRE_UPDATE_FAILED = 'Error while updating movie genre';
export const DB_LOG_MOVIE_FAVOURITE_UPDATE_FAILED = 'Error while updating movie favourite';
export const DB_LOG_STATS_UPDATE_FAILED = 'Error while updating statistics fields';
export const DB_LOG_HISTORY_ADDED = 'New history entry has been added';
export const DB_LOG_HISTORY_ADD_FAILED = 'Error while adding new history entry';
export const DB_LOG_ACTIVITY_UPDATE_FAILED = 'Error while updating activity data';
export const DB_LOG_USER_STAT_UPDATE_FAILED = 'User stat update failed';
export const DB_LOG_USER_STATS_SEEDED = 'User stats seeded successfully';
export const DB_LOG_USER_STATS_SEED_FAILED = 'Error while seeding user stats';
export const DB_LOG_USER_STATS_MIGRATED = 'Legacy user stats migrated to users collection';
export const DB_LOG_USER_STATS_MIGRATE_FAILED = 'Error while migrating legacy user stats';
export const DB_LOG_MOVIE_GENRE_UPDATED = 'Movie genre has been updated';
export const DB_LOG_MOVIE_STATS_UPDATED = 'Movie statistics have been updated';
export const DB_LOG_MOVIE_FAVOURITE_UPDATED = 'Movie favourite tag has been updated';
export const DB_LOG_TAURI_PREF_FAILED = 'Error reading Tauri notification preference';
export const DB_LOG_MINIMIZE_PREF_FAILED = 'Error reading minimize-on-close preference';
export const DB_LOG_LOCALE_PREF_FAILED = 'Error reading locale preference';
export const DB_LOG_TODAY_ITEMS_FAILED = 'Error reading Today items backup';
export const DB_LOG_MOVIE_ADDED = 'Movie added and statistics have been updated';
export const DB_LOG_VISIT_INCREMENTED = 'Link visit count has been incremented';
export const DB_LOG_RECORD_TABLE_UPDATED = 'Record updated on table';
export const DB_LOG_TABLE_UPDATE_FAILED = 'Error while updating';
export const DB_LOG_RECORD_REMOVED_FROM = 'Record has been removed from';
export const DB_LOG_MOVIE_DOC_REMOVED = 'Movie document removed for';
export const DB_LOG_COVER_REMOVED = 'Cover image removed for';
export const DB_LOG_STATS_AFTER_REMOVE = 'Statistics updated after removing';
export const DB_LOG_RECORD_REMOVE_FAILED = 'Error while removing a record from';
export const DB_LOG_HAS_BEEN_UPDATED = 'has been updated';
export const DB_LOG_RECORD_ADD_FAILED = 'Error while adding new record to';
export const DB_LOG_VISIT_INCREMENT_FAILED = 'Error while incrementing visit count for link';
export const DB_LOG_COVER_UPLOADED = 'Movie cover image uploaded successfully for';
export const DB_LOG_FETCH_URL_ERROR = '/api/fetch-url error for';
export const DB_LOG_PROXY_FETCH_FAILED = 'Error while proxying fetch for';
export const DB_LOG_TABLE_RECORD_UPDATED = 'Table record has been updated';
export const DB_LOG_PATCH_NOTES_UPDATED = 'Patch notes record has been updated';
export const DB_LOG_PATCH_NOTES_UPDATE_FAILED = 'Error while updating patch notes record';
export const DB_LOG_USER_STATS_UPDATE_FAILED = 'Error while updating user stats fields';
export const DB_LOG_STAT_COUNT_UPDATE_FAILED = 'Error while updating stat count';
export const DB_LOG_MILESTONE_WRITE_FAILED = 'Error while writing milestone';
export const DB_LOG_ACTIVITY_APPEND_FAILED = 'Error while appending activity log';
export const DB_LOG_QUOTE_REMOVE_FAILED = 'Error while removing quote';
export const DB_LOG_MOVIE_REMOVED = 'Movie removed and statistics have been updated';
export const DB_LOG_QUOTE_ADDED = 'New quote has been added';
export const DB_LOG_QUOTE_ADD_FAILED = 'Error while adding quote';
export const DB_LOG_PATCH_NOTES_ADDED = 'New patch notes record has been added';
export const DB_LOG_PATCH_NOTES_ADD_FAILED = 'Error while adding new patch notes record';
export const DB_LOG_REMINDER_RECORD_ADD_FAILED = 'Error while adding new record for reminder table';
export const DB_LOG_VAULT_ADD_FAILED = 'Error while adding new record for vault';
export const DB_LOG_REUSABLE_KEYS_RETRIEVED = 'Reusable keys retrieved';
export const DB_LOG_REUSABLE_KEYS_GET_FAILED = 'Error while getting reusable keys';
export const DB_LOG_REUSABLE_KEYS_UPDATED = 'Reusable keys have been updated';
export const DB_LOG_REUSABLE_KEYS_SAVE_FAILED = 'Error while saving reusable keys';
/** Error thrown when the movie collection is empty during a duplicate-key scan. */
export const DB_MOVIE_LIST_EMPTY = 'Movie list empty';
/** MIME type used when uploading movie cover images to storage. */
export const MIME_IMAGE_JPEG = 'image/jpeg';

/* ─────────────────────────────────────────
   Shared UI constants
───────────────────────────────────────── */

// Layout responsive breakpoints
export const BREAKPOINT_MOBILE = '(max-width: 940px)';
export const BREAKPOINT_NARROW_QUERY = `(max-width: ${APP_BREAKPOINT_NARROW}px)`;

export const SEARCH = 'search';
export const SUCCESS = 'success';
export const FAILURE = 'failure';
/** Window target for opening links in a new browser tab. */
export const LINK_TARGET_BLANK = '_blank';
export const ERROR_DIALOG_ICON_CLASS = 'pi pi-times-circle text-red-500';
export const ERROR_DIALOG_MSG_CLASS = 'error-dialog-message';

/* ─────────────────────────────────────────
   Activity log type discriminators
───────────────────────────────────────── */

/* Type discriminators written into activity-log entries across all pages.
   Use HISTORY_STATUS_ADDED / HISTORY_STATUS_DELETED for 'added' / 'deleted'. */
export const ACTIVITY_TYPE_UPDATED = 'updated';
export const ACTIVITY_TYPE_RESET = 'reset';
export const ACTIVITY_TYPE_BUG_LOGGED = 'bugLogged';
export const ACTIVITY_TYPE_STATUS_CHANGED = 'statusChanged';
export const ACTIVITY_TYPE_EDITED = 'edited';
export const ACTIVITY_TYPE_RATE_UPDATED = 'rateUpdated';
export const ACTIVITY_TYPE_GENRE_UPDATED = 'genreUpdated';
export const ACTIVITY_TYPE_FAVOURITE_UPDATED = 'favouriteUpdated';
export const ACTIVITY_TYPE_CATEGORY_UPDATED = 'categoryUpdated';
export const ACTIVITY_TYPE_CATEGORY_DELETED = 'categoryDeleted';
export const ACTIVITY_TYPE_PAYMENT_REMOVED = 'paymentRemoved';
export const ACTIVITY_TYPE_CATEGORY_ADDED = 'categoryAdded';
export const ACTIVITY_TYPE_CALCULATOR_UPDATED = 'calculatorUpdated';
export const ACTIVITY_TYPE_LOCK_UPDATED = 'lockUpdated';
/** Source tag written into every recentActivities entry — identifies the originating page. */
export const ACTIVITY_SOURCE_MOVIE = 'movie';
export const ACTIVITY_SOURCE_REMINDER = 'reminder';
export const ACTIVITY_SOURCE_RESONANCE = 'resonance';
export const ACTIVITY_SOURCE_PATCH = 'patch';
export const ACTIVITY_SOURCE_LINK = 'link';
export const ACTIVITY_SOURCE_DEBT = 'debt';
export const ACTIVITY_SOURCE_RECIPE = 'recipe';
export const ACTIVITY_SOURCE_DEFAULT = 'default';
export const ACTIVITY_SOURCE_DATE_CALCULATOR = 'date_calculator';
export const ACTIVITY_SOURCE_VAULT = 'vault';

/* ─────────────────────────────────────────
   Statistics field names
───────────────────────────────────────── */

/* Single source of truth for every key read from or written to the statistics
   document. Use these constants everywhere — never inline the raw string. */
export const STATS_FIELD_RECENT_ACTIVITIES = 'recentActivities';
export const STATS_FIELD_REMINDER_UPCOMING = 'reminderUpcoming';
export const STATS_FIELD_TOTAL_REMINDERS = 'totalReminders';
/** Monotonic count of the user's own (private) reminders they have marked done. */
export const STATS_FIELD_COMPLETED_PRIVATE = 'completedPrivate';
/** Monotonic count of shared reminders completed by anyone in the user's link — bumped for every linked member. */
export const STATS_FIELD_COMPLETED_SHARED = 'completedShared';
export const STATS_FIELD_TOTAL_PATCH_NOTES = 'totalPatchNotes';
export const STATS_FIELD_DEBT_UPCOMING = 'debtUpcoming';
/** Total count of all unpaid debts — written separately because debtUpcoming is capped at 20. */
export const STATS_FIELD_TOTAL_DEBTS = 'totalDebts';
export const STATS_FIELD_TOTAL_RECIPES = 'totalRecipes';
export const STATS_FIELD_RECIPE_LIST = 'recipeList';
export const STATS_FIELD_GENRE = 'genre';
export const STATS_FIELD_ACTIVITY_STREAK = 'activityStreak';
export const STATS_FIELD_ACTIVITY_STREAK_DATE = 'activityStreakLastDate';
export const STATS_FIELD_IS_USER_STATS = 'isUserStats';
/** Marks a document as non-global within the statistics collection; the single global stats document has it unset. */
export const STATS_FIELD_IS_GROUP = 'isGroup';
/** Flat openid list on a user's own document — the accounts they are connected to (bidirectional). */
export const STATS_FIELD_SHARED_WITH = 'sharedWith';
/** Connection records on a user's own document — { openid, name, status } for the account page. */
export const STATS_FIELD_CONNECTIONS = 'connections';
/** Shared activity log array on a user's own document — that user's mutations to their shared reminders. */
export const STATS_FIELD_SHARED_RECENT_ACTIVITY = 'sharedRecentActivity';
/** Revision counter on a user's own document — bumped by a connection to signal a shared-reminder change. */
export const STATS_FIELD_SHARED_REV = 'sharedRev';
/** Per-user share code another account enters to send a connect request. */
export const STATS_FIELD_CONNECT_CODE = 'connectCode';
/** Array of connect requests the user has sent, each carrying a status the receiver updates. */
export const STATS_FIELD_OUTGOING_REQUESTS = 'outgoingRequests';
/** Pending connect requests awaiting the user's approval, stored on their own document. */
export const STATS_FIELD_INCOMING_REQUESTS = 'incomingRequests';
/** Outgoing-request status — awaiting the receiver's response. */
export const CONNECT_STATUS_PENDING = 'pending';
/** Outgoing-request status — the receiver approved and the accounts are linked. */
export const CONNECT_STATUS_CONNECTED = 'connected';
/** Outgoing-request status — the receiver declined the request. */
export const CONNECT_STATUS_DECLINED = 'declined';
/** Connection-record status — the accounts were connected but one side left; awaiting clear or re-connect. */
export const CONNECT_STATUS_LEAVE = 'leave';
/** Connect Cloud Function error codes — mapped to user-facing messages before display. */
export const CONNECT_ERROR_CODE_NOT_FOUND = 'CODE_NOT_FOUND';
export const CONNECT_ERROR_SELF = 'SELF';
export const CONNECT_ERROR_ALREADY_CONNECTED = 'ALREADY_CONNECTED';
export const CONNECT_ERROR_ALREADY_REQUESTED = 'ALREADY_REQUESTED';
/** Alphabet for generated connect codes — excludes ambiguous 0/O/1/I. */
export const CONNECT_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** Length of a generated connect code. */
export const CONNECT_CODE_LENGTH = 7;
export const STATS_FIELD_TOTAL_FILMS = 'totalFilms';
export const STATS_FIELD_TOTAL_LINKS = 'totalLinks';
export const STATS_FIELD_TOTAL_QUOTES = 'totalQuotes';
export const STATS_FIELD_MILESTONES = 'milestones';
export const STATS_FIELD_USERNAME_CHANGED = 'usernameChangedDate';
export const STATS_FIELD_PASSWORD_CHANGED = 'passwordChangedDate';
/** Boolean flag stored on the per-user stats document — true when Tauri desktop notifications are enabled. */
export const STATS_FIELD_TAURI_NOTIF_ENABLED = 'tauriNotifEnabled';
/** Boolean flag stored on the per-user stats document — true when the desktop app minimizes to Dock on close. */
export const STATS_FIELD_MINIMIZE_ON_CLOSE = 'minimizeOnClose';
/** Locale key stored on the per-user stats document — 'en' or 'zh'. */
export const STATS_FIELD_LOCALE = 'locale';
/** Backup of the Today page's locally created items (timed, untimed, and tracked) stored on the per-user stats document. */
export const STATS_FIELD_TODAY_ITEMS = 'todayItems';
/** Locale identifier value for English. */
export const LOCALE_KEY_EN = 'en';
/** Locale identifier value for Chinese. */
export const LOCALE_KEY_ZH = 'zh';

/* ─────────────────────────────────────────
   Statistics display caps
───────────────────────────────────────── */

/* All list-based stat arrays (recentActivities, reminderUpcoming, debtUpcoming,
   recipeList) are capped at this many items on every write. Counters are always the uncapped true total. */
export const STATS_CAP_ACTIVITY_LOG = 20;

/* ─────────────────────────────────────────
   Home page constants
───────────────────────────────────────── */

export const HOME_LINKS_DOT_FALLBACK = '#5a6878';

export const HOME_ACTIVITY_ICON_MOVIE_ADDED = 'live_tv';
export const HOME_ACTIVITY_ICON_MOVIE_UPDATED = 'edit_note';
export const HOME_ACTIVITY_ICON_MOVIE_REMOVED = 'tv_off';
export const HOME_ACTIVITY_ICON_MOVIE_SEARCHED = 'search';
export const HOME_ACTIVITY_ICON_PATCH_ADDED = 'note_stack';
export const HOME_ACTIVITY_ICON_PATCH_BUG = 'bug_report';
export const HOME_ACTIVITY_ICON_PATCH_STATUS = 'swap_horiz';
export const HOME_ACTIVITY_ICON_PATCH_UPDATED = 'edit';
export const HOME_ACTIVITY_ICON_REMINDER_ADDED = 'note_add';
export const HOME_ACTIVITY_ICON_REMINDER_UPDATED = 'edit_note';
export const HOME_ACTIVITY_ICON_RESONANCE_ADDED = 'format_quote';
export const HOME_ACTIVITY_ICON_RESONANCE_REMOVED = 'format_clear';
export const HOME_ACTIVITY_ICON_LINK_ADDED = 'add_link';
export const HOME_ACTIVITY_ICON_LINK_UPDATED = 'edit';
export const HOME_ACTIVITY_ICON_LINK_REMOVED = 'link_off';
export const HOME_ACTIVITY_ICON_DEBT_ADDED = 'account_balance';
export const HOME_ACTIVITY_ICON_DEBT_UPDATED = 'currency_exchange';
export const HOME_ACTIVITY_ICON_DEBT_RESET = 'restart_alt';
export const HOME_ACTIVITY_ICON_DEBT_REMOVED = 'money_off';
export const HOME_ACTIVITY_ICON_RECIPE_ADDED = 'restaurant';
export const HOME_ACTIVITY_ICON_RECIPE_UPDATED = 'edit';
export const HOME_ACTIVITY_ICON_RECIPE_REMOVED = 'no_meals';
/** Shared delete icon used for all activity-feed deleted events. */
export const HOME_ACTIVITY_ICON_DELETED = 'delete';
export const HOME_ACTIVITY_ICON_DATE_CALCULATOR_UPDATED = 'calculate';
export const HOME_ACTIVITY_ICON_VAULT_ADDED = 'person_add';
/** Icon marking an activity entry that came from a connected account's shared reminder. */
export const HOME_ACTIVITY_ICON_SHARED = 'groups';

/** Shared entertainment teal colour for all non-deleted movie activity entries. */
export const HOME_ACTIVITY_COLOR_MOVIE = '#11998e';
export const HOME_ACTIVITY_COLOR_NEUTRAL = '#94a3b8';
export const HOME_ACTIVITY_COLOR_PATCH = '#8e54e9';
export const HOME_ACTIVITY_COLOR_REMINDER = '#14b8a6';
export const HOME_ACTIVITY_COLOR_RESONANCE = '#d946ef';
export const HOME_ACTIVITY_COLOR_LINK = '#60a5fa';
export const HOME_ACTIVITY_COLOR_DEBT = '#06b6d4';
export const HOME_ACTIVITY_COLOR_RECIPE = '#22c55e';
export const HOME_ACTIVITY_COLOR_DATE_CALCULATOR = '#6366f1';
export const HOME_ACTIVITY_COLOR_VAULT = '#475569';
/** Violet accent distinguishing a connected account's shared reminder activity from the user's own. */
export const HOME_ACTIVITY_COLOR_SHARED = '#a855f7';
/** Shared delete color used for all activity-feed deleted events. */
export const HOME_ACTIVITY_COLOR_DELETED = '#ef4444';

/** Sentinel value for the left placement side in the concentric smart-leader algorithm. */
export const HOME_CONCENTRIC_LEADER_SIDE_LEFT = 'left';
/** Sentinel value for the right placement side in the concentric smart-leader algorithm. */
export const HOME_CONCENTRIC_LEADER_SIDE_RIGHT = 'right';
/** Minimum vertical pixel gap between two pills on the same side of the concentric rings. */
export const HOME_CONCENTRIC_LEADER_MIN_GAP = 26;
/** Horizontal pixel extension from the arc tip to the pill anchor point. */
export const HOME_CONCENTRIC_LEADER_LINE_OFFSET_X = 20;
/** Vertical pixel extension from the arc tip to the pill anchor point. */
export const HOME_CONCENTRIC_LEADER_LINE_OFFSET_Y = 16;
/** Maximum percentage value before arc-angle conversion — prevents a full-circle arc at 100%. */
export const HOME_CONCENTRIC_LEADER_PCT_CAP = 99.9;
/** Pixel margin from the stage boundary used to keep pills inside the visible area. */
export const HOME_CONCENTRIC_LEADER_BOUNDARY_MARGIN = 4;
/** Material icon name for a reminder item in the week-agenda strip. */
export const HOME_AGENDA_ICON_REMINDER = 'notifications';
/** ID prefix for reminder rows in the OrbitalComponent reminders panel. */
export const HOME_REMINDER_ROW_ID_PREFIX = 'rem-';
/** ID prefix for debt rows in the OrbitalComponent debt-sonata panel. */
export const HOME_DEBT_ROW_ID_PREFIX = 'debt-';

/** Route path for the quick-action button that opens the recipe page. */
export const HOME_QUICK_ACTION_ROUTE_RECIPE = '/recipe';
/** Route path for the quick-action button that opens the debt sonata page. */
export const HOME_QUICK_ACTION_ROUTE_DEBT = '/debt';
/** Route path for the quick-action button that opens the reminder page. */
export const HOME_QUICK_ACTION_ROUTE_REMINDER = '/reminder';
/** Route path for the quick-action button that opens the portal page. */
export const HOME_QUICK_ACTION_ROUTE_PORTAL = '/portal';
/** Route path for the panel header that opens the entertainment page. */
export const HOME_QUICK_ACTION_ROUTE_ENTERTAINMENT = '/entertainment';

// Week-agenda colour palette (light and dark mode)
export const HOME_WEEK_AGENDA_COLOR_TEXT_LIGHT = '#4a1730';
export const HOME_WEEK_AGENDA_COLOR_TEXT_DARK = '#e8eef3';
export const HOME_WEEK_AGENDA_COLOR_SUBTITLE_LIGHT = '#9a6480';
export const HOME_WEEK_AGENDA_COLOR_SUBTITLE_DARK = 'rgba(255,255,255,0.5)';
export const HOME_WEEK_AGENDA_COLOR_ROW_BG_LIGHT = 'rgba(255,255,255,0.55)';
export const HOME_WEEK_AGENDA_COLOR_ROW_BG_DARK = 'rgba(255,255,255,0.045)';
export const HOME_WEEK_AGENDA_COLOR_DAY_SELECTED_LIGHT = 'rgba(255,255,255,0.9)';
export const HOME_WEEK_AGENDA_COLOR_DAY_SELECTED_DARK = 'rgba(255,255,255,0.14)';
export const HOME_WEEK_AGENDA_COLOR_DAY_DEFAULT_LIGHT = 'rgba(255,255,255,0.4)';
export const HOME_WEEK_AGENDA_COLOR_DAY_DEFAULT_DARK = 'rgba(255,255,255,0.05)';
export const HOME_WEEK_AGENDA_GRADIENT_TODAY = 'var(--gradient-brand)';
export const HOME_WEEK_AGENDA_COLOR_TODAY_TEXT = '#fff';
export const HOME_WEEK_AGENDA_BORDER_COLOR_LIGHT = 'rgba(213,51,105,0.4)';
export const HOME_WEEK_AGENDA_BORDER_COLOR_DARK = 'rgba(255,255,255,0.3)';
export const HOME_WEEK_AGENDA_BORDER_TRANSPARENT = '1px solid transparent';
export const HOME_WEEK_AGENDA_COLOR_DAY_TEXT_DIM_DARK = 'rgba(255,255,255,0.72)';
export const HOME_WEEK_AGENDA_COLOR_DAY_SELECTED_TEXT_LIGHT = '#3a1226';
export const HOME_WEEK_AGENDA_COLOR_DAY_TEXT_LIGHT = '#6a2a48';
export const HOME_WEEK_AGENDA_COLOR_DOT_DARK = '#7dd3fc';
export const HOME_WEEK_AGENDA_COLOR_DOT_LIGHT = '#d53369';
export const HOME_WEEK_AGENDA_DUE_HEADER_COLOR = 'rgba(255,255,255,0.55)';
export const HOME_RING_GRADIENT_ID_PREFIX = 'rg';
export const HOME_RING_TRACK_DEFAULT = 'rgba(255,255,255,0.12)';
export const HOME_CONCENTRIC_TRACK_DEFAULT = 'rgba(255,255,255,0.10)';
/** Concentric ring diameter in pixels on viewports wider than the narrow breakpoint. */
export const HOME_CONCENTRIC_SIZE_DEFAULT = 400;
export const HOME_ORBITAL_PANEL_SCROLL_SELECTOR = '.orbital-panel-scroll';
/** SimpleChanges key for the stats @Input on OrbitalComponent. */
export const HOME_ORBITAL_CHANGES_KEY_STATS = 'stats';
/** SimpleChanges key for the links @Input on OrbitalComponent. */
export const HOME_ORBITAL_CHANGES_KEY_LINKS = 'links';
/** Chinese footer quote displayed below the activity feed — identical in all locales. */
export const HOME_ACTIVITY_FOOTER_ZH = '往日已成历史';
/** English footer quote displayed below the activity feed — identical in all locales. */
export const HOME_ACTIVITY_FOOTER_EN = 'Yesterday is history';
/** Founding-year badge displayed on the Home page — identical in all locales. */
export const HOME_EST_YEAR = 'EST. 2024';

/** Number of days within which a reminder or debt item triggers the urgency strip. */
export const ORBITAL_URGENCY_WINDOW_DAYS = 3;
/** Type discriminator for reminder chips in the urgency strip. */
export const ORBITAL_URGENCY_CHIP_TYPE_REMINDER = 'reminder';
/** Type discriminator for debt chips in the urgency strip. */
export const ORBITAL_URGENCY_CHIP_TYPE_DEBT = 'debt';
/** Separator between name and dueLabel within one urgency strip item (e.g. "Pay bill · Tomorrow"). */
export const ORBITAL_URGENCY_ITEM_SEPARATOR = ' · ';
/** Separator between distinct items in the combined urgency strip summary. */
export const ORBITAL_URGENCY_GROUP_SEPARATOR = '  |  ';
/** Maximum characters shown for a single item name in the urgency strip before truncation. */
export const ORBITAL_URGENCY_TEXT_MAX_CHARS = 30;
export const ORBITAL_BRAND_TITLE = 'VISION CANVAS';

/* ─────────────────────────────────────────
   Entertainment page constants
───────────────────────────────────────── */

export const ENT_MSG_ADD_DIALOG_SEARCH_FAILED = 'Error while searching new movie from add dialog';
export const ENT_MSG_UPDATE_GENRE_FAILED = 'Error while updating genre';
export const ENT_MSG_UPDATE_RATE_FAILED_PREFIX = 'Error while updating movie rate for ';
export const ENT_MSG_API_EMPTY_RESPONSE = 'API responded with empty data due to too many requests';
export const ENT_MSG_FETCH_FAILED_PREFIX = '❌ Fetch failed for ';
export const ENT_MSG_RETRIEVE_RATE_FAILED_PREFIX = '❌ Unable to retrieve rate for ';
export const ENT_MSG_RETRIEVE_WEBPAGE_FAILED_PREFIX = 'Error while retrieving movie webpage for movie ';
export const ENT_LOG_SEARCH_CANCEL_REQUESTED = 'Search cancel requested';
export const ENT_LOG_MOVIE_DETAILS_RETRIEVED = 'New movie details retrieved.';
export const ENT_LOG_UPDATE_FAVOURITE_FAILED = 'Error while setting favourite';

/** Number of progress-bar blocks per category card. */
export const ENT_CORK_BLOCKS = 8;
/** ID of the programmatically injected View Transition style element. */
export const ENT_VTA_STYLE_ID = 'ent-vta-styles';
/** CSS view-transition-class value applied to movie cards being filtered out. */
export const ENT_VT_CLASS_LEAVING = 'vt-leaving';
/** CSS view-transition-class value applied to movie cards being filtered in. */
export const ENT_VT_CLASS_ENTERING = 'vt-entering';

export const NO_RATE = '-1';
export const RATE_DECREASED = 'decreased';
export const RATE_INCREASED = 'increased';
/** HTML attribute fragment applied to the rate-change span when the rate dropped — used to build and detect search log entries. */
export const ENT_LOG_SPAN_CLASS_RATE_DOWN = 'class="rate-down"';
/** HTML attribute fragment applied to the rate-change span when the rate rose — used to build and detect search log entries. */
export const ENT_LOG_SPAN_CLASS_RATE_UP = 'class="rate-up"';
/** Genre key used as the favourites category — written to the DB and shown as the genre label. */
export const GENRE_FAVOURITE = '特别关注';
export const ENT_LOG_COVER_RETRIEVED = 'Movie cover retrieved for';
export const ENT_LOG_COVER_UPLOADED = 'Movie cover uploaded for';
export const ENT_LOG_SEARCHING_MOVIE_ID = 'Movie ID not given, start searching for it.';

/* ─────────────────────────────────────────
   Resonance page constants
───────────────────────────────────────── */

/** Maximum character count allowed for a new quote submission. */
export const RESONANCE_MAX_QUOTE_LENGTH = 500;
export const RESONANCE_SKELETON_COUNT = 6;
/** Legacy English value previously stored in the database for anonymous authors. */
export const RESONANCE_AUTHOR_ANONYMOUS_LEGACY = 'Anonymous';

/* ─────────────────────────────────────────
   Recipe page constants
───────────────────────────────────────── */

/** List view id for the recipe page router. */
export const RECIPE_VIEW_LIST = 'list';
/** Detail view id for the recipe page router. */
export const RECIPE_VIEW_DETAIL = 'detail';
/** Add (editor) view id for the recipe page router. */
export const RECIPE_VIEW_ADD = 'add';
export const RECIPE_EDITING_MODE_CREATE = 'create';
export const RECIPE_EDITING_MODE_EDIT = 'edit';

export const RECIPE_ITYPE_VEGETABLE = 'veg';
export const RECIPE_ITYPE_MEAT = 'meat';

/* Each band pairs with a RECIPE_CATEGORY_* constant in locale files and a full CSS
   section in recipe.component.css. When adding a new band:
     1. Add RECIPE_CATEGORY_<NAME> in locale files
     2. Add RECIPE_BAND_<NAME> here
     3. Register the new case in Utilities.recipeBandClass()
     4. Add RECIPE_CATEGORY_<NAME> to RECIPE_CATEGORIES and RECIPE_EDITOR_CATEGORIES in recipe.model.ts
     5. Add all CSS rules in recipe.component.css */
export const RECIPE_BAND_CHINESE = 'band-chinese';
export const RECIPE_BAND_WESTERN = 'band-western';
export const RECIPE_BAND_QUICK = 'band-quick';
export const RECIPE_BAND_DESSERT = 'band-dessert';
export const RECIPE_BAND_DEFAULT = 'band-default';

export const RECIPE_DROP_ABOVE = 'above';
export const RECIPE_DROP_BELOW = 'below';

export const RECIPE_MAX_BADGES = 4;
export const RECIPE_MAX_NAME_CHARS = 9;
/** Maximum number of recipe cards visible on a single paginated page. */
export const RECIPE_PAGE_SIZE = 8;
/** Number of rows displayed per paginated page in the recipe grid. */
export const RECIPE_ROWS_PER_PAGE = 5;
/** Maximum number of ingredient type tabs shown in the add/edit editor. */
export const RECIPE_EDITOR_TYPE_MAX = 9;
export const RECIPE_LOG_DELETED = 'Recipe deleted:';
export const RECIPE_LOG_UPDATED = 'Recipe updated:';
export const RECIPE_LOG_CREATED = 'Recipe created:';

/* ─────────────────────────────────────────
   Portal page constants
───────────────────────────────────────── */

/** Type value for a link document in the useful_links collection. */
export const USEFUL_LINK_TYPE_LINK = 'link';
/** Type value for a category document in the useful_links collection. */
export const USEFUL_LINK_TYPE_CATEGORY = 'category';
/** Sentinel value for the "show all categories" filter in the Portal links panel. */
export const PORTAL_CATEGORY_ALL = 'all';
/** Default colour applied to new and un-styled link categories. */
export const PORTAL_DEFAULT_CATEGORY_COLOR = '#d53369';
/**
 * Firebase Cloud Function that proxies a site favicon through Google's favicon service. The mainland
 * browser reaches this function (its host clears the GFW), and the function fetches the icon from
 * Google server-side. Same gen2 host family as the douban image proxy.
 */
export const PORTAL_FAVICON_PROXY_URL = 'https://favicon-tfsps4dwza-uc.a.run.app';
export const PORTAL_LABEL_CONFIRMED = 'confirmed';
/** Arrow glyph used as the add-link suffix in the multi-link dialog — identical in all locales. */
export const MULTI_LINK_LABEL_ARROW = '→';
/** URL field label in the add-link dialog — identical in all locales. */
export const ADD_LINK_LABEL_URL = 'URL *';
/** URL field placeholder in the add-link dialog — identical in all locales. */
export const ADD_LINK_PLACEHOLDER_URL = 'https://example.com';
export const PORTAL_LOG_VISIT_INCREMENT_FAILED = 'Failed to increment visit count for';
export const PORTAL_LOG_LINK_UPDATED = 'Link updated:';
export const PORTAL_LOG_LINK_SAVED = 'Link saved:';
export const PORTAL_LOG_LINKS_SAVED = 'links saved';
export const PORTAL_LOG_LINK_DELETED = 'Link deleted:';
export const PORTAL_LOG_LINK_DELETE_FAILED = 'Failed to delete link:';
export const PORTAL_LOG_CATEGORY_UPDATED = 'Category updated:';
export const PORTAL_LOG_CATEGORY_ADDED = 'Category added:';
export const PORTAL_LOG_CATEGORY_DELETED = 'Category deleted:';
export const PORTAL_LOG_CATEGORY_DELETE_FAILED = 'Failed to delete category:';

/* ─────────────────────────────────────────
   Reminder page constants
───────────────────────────────────────── */

/** Type value for a Messages item in the reminder upcoming list. */
export const REMINDER_ITEM_MESSAGE = 'message';

/** Cloud Function action payload value for deleting a shared reminder. */
export const SHARED_REMINDER_ACTION_DELETE = 'delete';
/** Cloud Function action payload value for completing a shared reminder. */
export const SHARED_REMINDER_ACTION_COMPLETE = 'complete';

/** CloudBase content entry key for the reminder message text. */
export const REMINDER_VALUE_KEY_TEXT = 'text';
/** CloudBase content entry key for the reminder date. */
export const REMINDER_VALUE_KEY_DATE = 'date';
/** CloudBase content entry key for the reminder link URL. */
export const REMINDER_VALUE_KEY_LINK = 'link';
/** CloudBase content entry key for the reminder tag. */
export const REMINDER_VALUE_KEY_TAG = 'tag';
/** CloudBase content entry key for the reminder start time (HH:mm). */
export const REMINDER_VALUE_KEY_START_TIME = 'startTime';
/** CloudBase content entry key for the reminder end time (HH:mm). */
export const REMINDER_VALUE_KEY_END_TIME = 'endTime';
/** CloudBase field key marking a reminder as shared on creation (visible to connected accounts). */
export const REMINDER_VALUE_KEY_SHARED = 'isShared';

/** Items shown per page in the Reminder grid (default: 2 columns × 7 rows). */
export const REMINDER_ITEMS_PER_PAGE = 14;
/** Fixed number of rows per page in the Reminder grid — page size scales as itemsPerRow × this. */
export const REMINDER_ROWS_PER_PAGE = 7;
/** Rows per page on narrow viewports where only one column fits — overrides the default. */
export const REMINDER_ROWS_PER_PAGE_NARROW = 10;
/** Fallback accent color for unrecognized or absent categories — matches the Reminder section accent. */
export const REMINDER_CATEGORY_COLOR_DEFAULT = '#1a6dff';
/** Number of days ahead treated as "due soon". */
export const REMINDER_DUE_SOON_WINDOW_DAYS = 7;
/** Placeholder for the optional link field in the add-reminder input row — identical in all locales. */
export const REMINDER_PLACEHOLDER_LINK = 'https://';
/** Chinese subtitle shown below the due-soon chip count — identical in all locales. */
export const REMINDER_DUE_SOON_SUBTITLE = '未来七天';
/** English suffix used in the bilingual await-count line — identical in all locales. */
export const REMINDER_AWAIT_SUFFIX_EN = 'await ·';
/** Chinese suffix used in the bilingual await-count line — identical in all locales. */
export const REMINDER_AWAIT_SUFFIX_CN = '静候处理';
/** Chinese portion of the bilingual page subtitle — identical in all locales. */
export const REMINDER_SUBTITLE_CN = '日程 ·';
/** English portion of the bilingual page subtitle — identical in all locales. */
export const REMINDER_SUBTITLE_EN = 'things to do, dated or not';

/** Suffix used to key the due-date notification in the per-session dedup set. */
export const NOTIF_KEY_DUE = '_due';
/** Separator between item text and date in any scheduled notification body. */
export const NOTIF_BODY_SEPARATOR = ' · ';
/** Suffix used to key the 3-day-ahead notification in the per-session dedup set. */
export const NOTIF_KEY_3DAY = '_3day';
/** Hour of day (0–23) at which the daily background notification scan fires when the app stays open. */
export const NOTIF_DAILY_HOUR = 10;
/** Interval in milliseconds for the daily background notification check — 24 hours. */
export const NOTIF_INTERVAL_MS = 24 * 60 * 60 * 1000;
/** Error message logged when the notification scheduler fails to initialise. */
export const NOTIF_SCHEDULER_INIT_ERROR = 'Failed to initialise notification scheduler';
/** Error message logged when a push notification send call fails. */
export const NOTIF_SEND_FAILED = 'Failed to send notification';
/** Error message logged when the subscribe DB write fails. */
export const NOTIF_SUBSCRIBE_FAILED = 'Failed to persist notification subscription';
/** Error message logged when the unsubscribe DB write fails. */
export const NOTIF_UNSUBSCRIBE_FAILED = 'Failed to persist notification unsubscription';

/* ─────────────────────────────────────────
   Debt Sonata page constants
───────────────────────────────────────── */

export const DEBT_SKELETON_COUNT = 6;
export const DEBT_DIALOG_PLACEHOLDER_AMOUNT = '0';
/** Placeholder shown in the custom payment-amount input — identical in all locales. */
export const DEBT_CUSTOM_INPUT_PLACEHOLDER = '−0.00';

/** Type value for a Debt Sonata upcoming item in the statistics upcoming list. */
export const DEBT_ITEM_EXPENSE = 'expense';
/** Debt record type for a standard deletable debt goal. */
export const DEBT_TYPE_TEMP = 'temporary';
/** Debt record type for a permanent account protected from deletion. */
export const DEBT_TYPE_PERMANENT = 'permanent';

/** CloudBase content entry key for the paid flag in the debt collection. */
export const DEBT_VALUE_KEY_PAID = 'paid';
/** CloudBase content entry key for the current debt balance in the debt sonata table. */
export const DEBT_VALUE_KEY_DEBT = 'debt';
/** CloudBase content entry key for the due date in the debt sonata table. */
export const DEBT_VALUE_KEY_DATE = 'date';
/** CloudBase content entry key for the type field (goal / permanent) in the debt sonata table. */
export const DEBT_VALUE_KEY_TYPE = 'type';
/** CloudBase content entry key for the currency field in the debt sonata table. */
export const DEBT_VALUE_KEY_CURRENCY = 'currency';
/** CloudBase content entry key for the category field in the debt sonata table. */
export const DEBT_VALUE_KEY_CATEGORY = 'category';
/** CloudBase content entry key for the original (total) amount in the debt sonata table. */
export const DEBT_VALUE_KEY_ORIGINAL = 'original';
/** CloudBase content entry key for the payment history record in the debt sonata table. */
export const DEBT_VALUE_KEY_PAYMENTS = 'payments';

/** Small quick-pay preset amount for the Debt Sonata page. */
export const DEBT_PRESET_SMALL = 100;
/** Large quick-pay preset amount for the Debt Sonata page. */
export const DEBT_PRESET_LARGE = 1000;
/** Milliseconds the two-step confirm button stays prompted before auto-dismissing. */
export const DEBT_PROMPT_TIMEOUT_MS = 2600;
/** Currency code for Chinese yuan. */
export const DEBT_CURRENCY_CNY = 'CNY';
/** Currency code for Canadian dollar. */
export const DEBT_CURRENCY_CAD = 'CAD';
export const DEBT_CURRENCY_SYMBOL_CNY = '¥';
export const DEBT_CURRENCY_SYMBOL_CAD = '$';
export const DEBT_DUE_CLASS_OVERDUE = 'is-over';
export const DEBT_DUE_CLASS_SOON = 'is-soon';
export const DEBT_DUE_ICON_OVERDUE = 'error';
export const DEBT_DUE_ICON_DEFAULT = 'event';
/** Icon shown when a debt is marked permanent. */
export const DEBT_ICON_LOCK = 'lock';
/** Icon shown when a debt is not permanent. */
export const DEBT_ICON_LOCK_OPEN = 'lock_open';

/* ─────────────────────────────────────────
   Patch Notes page constants
───────────────────────────────────────── */

export const PATCH_VIEW_PATCH = 'patch';
export const PATCH_VIEW_RELEASE = 'release';

/** CSS class applied to a resolved-status severity tag. */
export const PATCH_CLASS_TAG_SUCCESS = 'tag-debug-success';
/** CSS class for a heatmap cell in a future month. */
export const PATCH_CLASS_HEATMAP_FUTURE = 'future';
/** CSS class prefix for a heatmap cell's intensity band. */
export const PATCH_CLASS_HEATMAP_INTENSITY_PREFIX = 'intensity-';
/** CSS class marking a heatmap cell that has activity. */
export const PATCH_CLASS_HEATMAP_HAS_DATA = 'has-data';

/* ─────────────────────────────────────────
   Context menu
───────────────────────────────────────── */

export const CTX_ICON_COPY = 'content_copy';
export const CTX_ICON_CUT = 'content_cut';
export const CTX_ICON_PASTE = 'content_paste';
export const CTX_ICON_SELECT_ALL = 'select_all';
export const CTX_ICON_MY_ACCOUNT = 'manage_accounts';
export const CTX_ICON_SIGN_OUT = 'logout';
export const CTX_ICON_SIGN_IN = 'login';
export const CTX_COLOR_CLIPBOARD = 'linear-gradient(135deg, #d53369, #daae51)';
export const CTX_COLOR_MY_ACCOUNT = 'linear-gradient(135deg, #6366f1, #a855f7)';
export const CTX_COLOR_SIGN_OUT = 'linear-gradient(135deg, #d53369, #b82d5a)';
export const CTX_COLOR_SIGN_IN = 'linear-gradient(135deg, #1a6dff, #00d2ff)';
export const CTX_ICON_INSPECT = 'terminal';
export const CTX_COLOR_INSPECT = 'linear-gradient(135deg, #059669, #10b981)';

/* ─────────────────────────────────────────
   Account page
───────────────────────────────────────── */

export const MILESTONE_KEY_ACCOUNT_CREATED = 'accountCreated';
export const MILESTONE_DOMAIN_FILM = 'film';
export const MILESTONE_DOMAIN_QUOTE = 'quote';
export const MILESTONE_DOMAIN_RECIPE = 'recipe';
export const MILESTONE_DOMAIN_REMINDER = 'reminder';
export const MILESTONE_DOMAIN_DEBT = 'debt';
export const MILESTONE_DOMAIN_LINK = 'link';
export const MILESTONE_DOMAIN_STREAK = 'streak';
export const CLOUDBASE_ERR_INVALID_PASSWORD = 'invalid_password';
export const CLOUDBASE_ERR_PASSWORD_TOO_WEAK = 'password_too_weak';
export const CLOUDBASE_ERR_USER_NOT_FOUND = 'user_not_found';
export const CLOUDBASE_ERR_INVALID_STATUS = 'invalid_status';
export const CLOUDBASE_ERR_PERMISSION_DENIED = 'permission_denied';
export const CLOUDBASE_ERR_INVALID_EMAIL = 'invalid_email';
export const CLOUDBASE_ERR_EMAIL_NOT_VERIFIED = 'email_not_verified';
export const CLOUDBASE_ERR_RATE_LIMIT_EXCEEDED = 'resource_exhausted';
export const CLOUDBASE_ERR_NOT_FOUND = 'not_found';
export const CLOUDBASE_ERR_INVALID_VERIFICATION_CODE = 'invalid_verification_code';

/* ─────────────────────────────────────────
   Today page
───────────────────────────────────────── */

/** Synthetic task ID used to inject the live tracking band into the column layout engine. */
export const TODAY_TRACKING_VIRTUAL_ID = '__tracking__';
/** Prefix character used when generating IDs for locally-created tasks. */
export const TODAY_LOCAL_TASK_ID_PREFIX = 'l';
/** AM period label used in 12-hour time formatting — identical in all locales. */
export const TODAY_LABEL_AM = 'AM';
/** PM period label used in 12-hour time formatting — identical in all locales. */
export const TODAY_LABEL_PM = 'PM';
/** Duration of the task removal fade-out animation in milliseconds. */
export const TODAY_REMOVE_ANIMATION_MS = 220;
/** Debounce delay before backing up locally created Today items to the database, in milliseconds. */
export const TODAY_AUTOSAVE_DEBOUNCE_MS = 800;

/* ─────────────────────────────────────────
   Vault page constants
───────────────────────────────────────── */

/** CloudBase content key tagging which kind of vault document this is. */
export const VAULT_VALUE_KEY_KIND = 'kind';
/** CloudBase content key for a node's type (account / email / phone). */
export const VAULT_VALUE_KEY_NODE_TYPE = 'nodeType';
/** CloudBase content key for a node's display name. */
export const VAULT_VALUE_KEY_NAME = 'name';
/** CloudBase content key for an account node's legacy single category (read-only migration source). */
export const VAULT_VALUE_KEY_CATEGORY = 'category';
/** CloudBase content key for an account node's list of category keys. */
export const VAULT_VALUE_KEY_CATEGORIES = 'categories';
/** CloudBase content key for an edge's source node id. */
export const VAULT_VALUE_KEY_SOURCE_ID = 'sourceId';
/** CloudBase content key for an edge's target node id. */
export const VAULT_VALUE_KEY_TARGET_ID = 'targetId';
/** CloudBase content key for an edge's relation label. */
export const VAULT_VALUE_KEY_RELATION = 'relation';
/** CloudBase content key for a custom category's display label. */
export const VAULT_VALUE_KEY_LABEL = 'label';
/** CloudBase content key for a custom category's solid color. */
export const VAULT_VALUE_KEY_HEX = 'hex';
/** CloudBase content key for a custom category's gradient. */
export const VAULT_VALUE_KEY_GRADIENT = 'gradient';
/** CloudBase content key for an account node's verified flag. */
export const VAULT_VALUE_KEY_VERIFIED = 'verified';

/** Document-kind discriminator for a graph node. */
export const VAULT_KIND_NODE = 'node';
/** Document-kind discriminator for a graph edge. */
export const VAULT_KIND_EDGE = 'edge';
/** Document-kind discriminator for a custom category. */
export const VAULT_KIND_CATEGORY = 'category';

/** Node-type value for a website / app account. */
export const VAULT_NODE_ACCOUNT = 'account';
/** Node-type value for an email address identifier. */
export const VAULT_NODE_EMAIL = 'email';
/** Node-type value for a phone number identifier. */
export const VAULT_NODE_PHONE = 'phone';
/** Node-type value for a web-link identifier. */
export const VAULT_NODE_LINK = 'link';
/** Node-type value for a private free-form note — stored but never drawn on the graph map. */
export const VAULT_NODE_NOTES = 'notes';
/** Legacy node-type value for note nodes created before the password→notes rename; normalized on read.
    Typed as string since it is no longer part of the VaultNodeType union. */
export const VAULT_NODE_LEGACY_PASSWORD: string = 'password';
/** Filter key toggling visibility of verified accounts in the graph. */
export const VAULT_FILTER_KEY_VERIFIED = 'verified';

/** Category key used for accounts created without an explicit category. */
export const VAULT_CATEGORY_KEY_OTHER = 'other';

/** Relation label stored on a link created from the add-account dialog. */
export const VAULT_RELATION_LINKED = 'linked';
/** Relation label stored on a link created by hand in graph link-mode. */
export const VAULT_RELATION_MANUAL = 'manually linked';

/** View discriminator for the force-directed graph view. */
export const VAULT_VIEW_GRAPH = 'graph';
/** View discriminator for the account list view. */
export const VAULT_VIEW_LIST = 'list';

/** Connection-chip dot shape class for an email node. */
export const VAULT_DOT_CLASS_EMAIL = 'vault-dot-email';
/** Connection-chip dot shape class for a phone node. */
export const VAULT_DOT_CLASS_PHONE = 'vault-dot-phone';
/** Connection-chip dot shape class for a link node. */
export const VAULT_DOT_CLASS_LINK = 'vault-dot-link';
/** Connection-chip dot shape class for an account node. */
export const VAULT_DOT_CLASS_ACCOUNT = 'vault-dot-account';
/** Connection-chip dot shape class for a notes node. */
export const VAULT_DOT_CLASS_NOTES = 'vault-dot-notes';
/** Log message when applying a live vault snapshot fails, kept from tearing down the watch. */
export const VAULT_LOG_APPLY_FAILED = 'Failed to apply vault snapshot';

/* ─────────────────────────────────────────
   About page constants
───────────────────────────────────────── */

/** Status chip label at the top of the About page. */
export const ABOUT_CHIP_LABEL = 'About · last updated May 2026';
/** Leading word of the About headline, before the highlighted pill. */
export const ABOUT_H1_LEAD = 'A';
/** Highlighted pill text in the About headline. */
export const ABOUT_H1_PILL = 'Mind Vault';
/** Trailing text of the About headline, after the highlighted pill. */
export const ABOUT_H1_TAIL = ', Kept In Public.';
/** Intro paragraph describing the purpose of the site. */
export const ABOUT_INTRO =
	"Welcome to my personal corner of the web. This space serves as my mind vault: a repository for the films that stay with me, a compass for my most important dates, my life task-engine, and a roadmap of what's coming next. Stay a while — there's always more being built here, with new features landing and growing every single week.";
/** Heading above the career and education timeline. */
export const ABOUT_SECTION_TITLE = 'The Long Way Here';
/** Suffix appended after the milestone count in the section meta. */
export const ABOUT_MILESTONES_SUFFIX = 'milestones';
/** Base transition-delay for the timeline reveal, so it continues the hero cascade's rhythm. */
export const ABOUT_TIMELINE_REVEAL_BASE_DELAY_MS = 680;
