// ── Application lifecycle ──────────────────────────────────────────────────
export const COMPONENT_DESTROY = 'Component Destroyed';

// ── Database — collection names ────────────────────────────────────────────
export const DATABASE_HISTORY = 'history';
export const DATABASE_MOVIES = 'movies';
export const DATABASE_PATCH_NOTES = 'patch_notes';
export const DATABASE_QUOTES = 'quotes';
export const DATABASE_REMINDER = 'reminder'; // Firebase path prefix
export const DATABASE_REMINDER_FIRST = 'reminder_table_first';
export const DATABASE_REMINDER_SECOND = 'reminder_table_second';
export const DATABASE_REMINDER_THIRD = 'reminder_table_third';
export const DATABASE_STATISTICS = 'statistics';

// ── Database — reminder table identifiers ──────────────────────────────────
export const DATABASE_FIRST_TABLE = 'first_table';
export const DATABASE_SECOND_TABLE = 'second_table';
export const DATABASE_THIRD_TABLE = 'third_table';

// ── Statistics — field names ───────────────────────────────────────────────
// Single source of truth for every key read from or written to the statistics
// document. Use these constants everywhere — never inline the raw string.
export const STATS_FIELD_RECENT_MOVIE = 'recentMovieActivities';
export const STATS_FIELD_RECENT_PATCH = 'recentPatchActivities';
export const STATS_FIELD_RECENT_REMINDER = 'recentReminderActivities';
export const STATS_FIELD_RECENT_RESONANCE = 'recentResonanceActivities';
export const STATS_FIELD_PATCH_IN_PROGRESS = 'patchInProgress';
export const STATS_FIELD_REMINDER_UPCOMING = 'reminderUpcoming';

// ── Statistics — display cap ───────────────────────────────────────────────
// The combined recent-activity feed shows at most this many items.
// Each source array is also trimmed to this cap on write so CloudBase
// never stores more than what the dashboard can ever display.
export const STATS_CAP_ACTIVITY_LOG = 24;

// ── Patch note statuses ────────────────────────────────────────────────────
export const STATUS_TODO = 'To Do';
export const STATUS_IN_PROGRESS = 'In Progress';
export const STATUS_COMPLETED = 'Completed';
export const STATUS_DEBUG = 'Debug';
export const STATUS_DRAFT = 'Draft';
export const STATUS_RESOLVED = 'Resolved';

// ── Movies ─────────────────────────────────────────────────────────────────
export const GENRE_FAVOURITE = '特别关注';
export const NO_RATE = '-1';
export const RATE_DECREASED = 'decreased';
export const RATE_INCREASED = 'increased';
export const MOVIE_GENRES = [
	{ genre: '刑侦' },
	{ genre: '古装' },
	{ genre: '悬疑' },
	{ genre: '校园' },
	{ genre: '现代' },
	{ genre: '谍战' }
];

// ── Reminder ───────────────────────────────────────────────────────────────
/** Display name for the first reminder table — used in stat writes and the Recent Activity widget. */
export const REMINDER_TABLE_DATE_CALCULATOR = 'Date Calculator';
/** Display name for the second reminder table — used in stat writes and the Recent Activity widget. */
export const REMINDER_TABLE_ACCOUNT_EXPENSES = 'Account Expenses';
/** Display name for the third reminder table — used in stat writes and the Recent Activity widget. */
export const REMINDER_TABLE_MESSAGES = 'Messages';
/** Fixed amount deducted from a second-table debt entry per payment cycle. */
export const ACCOUNT_DEBT_DECREMENT = 998.05;

// ── Common ─────────────────────────────────────────────────────────────────
export const CN = 'CN';
export const SEARCH = 'search';
export const SEARCH_COMPELTE = 'Search complete';
export const SEARCH_CANCEL = 'Search cancelled';
export const SUCCESS = 'success';
export const FAILURE = 'failure';

// ── Dialogs & history ─────────────────────────────────────────────────────
/** Dialog type string for a yes/no confirmation dialog. */
export const DIALOG_CONFIRM = 'confirm';
/** History-entry status when a movie is added — appears in the history message text. */
export const HISTORY_STATUS_ADDED = 'added';
/** History-entry status when a movie is deleted — appears in the history message text. */
export const HISTORY_STATUS_DELETED = 'deleted';

// ── Errors ─────────────────────────────────────────────────────────────────
export const ERROR_PERMISSION_DENIED = 'DATABASE_PERMISSION_DENIED';
