export const RATE_DECREASED = 'decreased';
export const RATE_INCREASED = 'increased';
export const SEARCH_COMPELTE = 'Search complete';
export const SEARCH_CANCEL = 'Search cancelled';
export const COMPONENT_DESTROY = 'Component Destroyed';
export const NO_RATE = '-1';
export const STATUS_TODO = 'To Do';
export const STATUS_IN_PROGRESS = 'In Progress';
export const STATUS_COMPLETED = 'Completed';
export const STATUS_DEBUG = 'Debug';
export const STATUS_DRAFT = 'Draft';
export const STATUS_RESOLVED = 'Resolved';
export const GENRE_FAVOURITE = '特别关注';
export const FIRST_TABLE = 'first_table';
export const SECOND_TABLE = 'second_table';
export const THIRD_TABLE = 'third_table';
export const DATABASE_HISTORY = 'history';
export const DATABASE_STATISTICS = 'statistics';
export const DATABASE_MOVIES = 'movies';
export const DATABASE_PATCH_NOTES = 'patch_notes';
export const DATABASE_REMINDER = 'reminder';
export const DATABASE_REMINDER_FIRST = 'reminder_table_first';
export const DATABASE_REMINDER_SECOND = 'reminder_table_second';
export const DATABASE_REMINDER_THIRD = 'reminder_table_third';
export const ERROR_PERMISSION_DENIED = 'DATABASE_PERMISSION_DENIED';
export const DATABASE_QUOTES = 'quotes';
/** Display name for the first reminder table — used in stat writes and the Recent Activity widget. */
export const REMINDER_TABLE_DATE_CALCULATOR = 'Date Calculator';
/** Display name for the second reminder table — used in stat writes and the Recent Activity widget. */
export const REMINDER_TABLE_ACCOUNT_EXPENSES = 'Account Expenses';
/** Display name for the third reminder table — used in stat writes and the Recent Activity widget. */
export const REMINDER_TABLE_MESSAGES = 'Messages';

export const CN = 'CN';
export const SEARCH = 'search';
export const SUCCESS = 'success';
export const FAILURE = 'failure';

/** Dialog type string for a yes/no confirmation dialog. Used across multiple components. */
export const DIALOG_CONFIRM = 'confirm';

/** History-entry status when a movie is added — appears in the history message text. */
export const HISTORY_STATUS_ADDED = 'added';
/** History-entry status when a movie is deleted — appears in the history message text. */
export const HISTORY_STATUS_DELETED = 'deleted';

/**
 * Fixed amount deducted from a second-table debt entry per payment cycle.
 * Defined as a constant so a business-rule change only requires one edit here.
 */
export const ACCOUNT_DEBT_DECREMENT = 998.05;
export const MOVIE_GENRES = [
	{ genre: '刑侦' },
	{ genre: '古装' },
	{ genre: '悬疑' },
	{ genre: '校园' },
	{ genre: '现代' },
	{ genre: '谍战' }
];
