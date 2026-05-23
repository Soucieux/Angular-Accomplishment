// ── Application lifecycle ──────────────────────────────────────────────────
export const COMPONENT_DESTROY = 'Component Destroyed';

// ── Auth state persistence ─────────────────────────────────────────────────
// Stored in localStorage to avoid the Access Denied flicker on page refresh.
// The value '1' is a lightweight presence flag — it carries no user identity,
// no token, and no permissions. It only signals that the last known session
// was authenticated so the UI can optimistically show content while Firebase /
// CloudBase re-validates the real session in the background. The flag is
// written on login and removed on logout.
export const LS_AUTH_HINT_KEY = 'auth_hint';

// ── Database — collection names ────────────────────────────────────────────
export const DATABASE_HISTORY = 'history';
export const DATABASE_MOVIES = 'movies';
export const DATABASE_RECIPES = 'recipes';
export const DATABASE_PATCH_NOTES = 'patch_notes';
export const DATABASE_QUOTES = 'quotes';
export const DATABASE_REMINDER = 'reminder'; // Firebase path prefix
export const DATABASE_REMINDER_FIRST = 'reminder_table_first';
export const DATABASE_REMINDER_SECOND = 'reminder_table_second';
export const DATABASE_REMINDER_THIRD = 'reminder_table_third';
export const DATABASE_STATISTICS = 'statistics';
export const DATABASE_USEFUL_LINKS = 'useful_links'; // stores both links (type:'link') and categories (type:'category')

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
export const STATS_FIELD_REMINDER_TOTAL = 'reminderTotal';
export const STATS_FIELD_TOTAL_RECIPES = 'totalRecipes';

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
export const RATE_LABEL_EXCELLENT = 'Excellent';
export const RATE_LABEL_GOOD = 'Good';
export const RATE_LABEL_AVERAGE = 'Average';
export const RATE_LABEL_POOR = 'Poor';
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
export const SEARCH_COMPLETE = 'Search complete';
export const SEARCH_CANCEL = 'Search cancelled';
export const SUCCESS = 'success';
export const FAILURE = 'failure';
export const HOME_LINKS_TILE_0 = '#6aa9d6';
export const HOME_LINKS_TILE_1 = '#f0b88a';
export const HOME_LINKS_TILE_2 = '#a8d4c2';
export const HOME_LINKS_TILE_3 = '#d4a4c8';
export const HOME_LINKS_DOT_FALLBACK = '#5a6878';

// ── Dialogs & history ─────────────────────────────────────────────────────
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
/** History-entry status when a movie is added — appears in the history message text. */
export const HISTORY_STATUS_ADDED = 'added';
/** History-entry status when a movie is deleted — appears in the history message text. */
export const HISTORY_STATUS_DELETED = 'deleted';

// ── Activity types ─────────────────────────────────────────────────────────
// Type discriminators written into activity-log entries across all pages.
// Use HISTORY_STATUS_ADDED / HISTORY_STATUS_DELETED for 'added' / 'deleted'.
export const ACTIVITY_TYPE_UPDATED = 'updated';
export const ACTIVITY_TYPE_BUG_LOGGED = 'bugLogged';
export const ACTIVITY_TYPE_STATUS_CHANGED = 'statusChanged';
export const ACTIVITY_TYPE_EDITED = 'edited';

// ── Reminder item types ────────────────────────────────────────────────────
/** Type value for an Account Expenses item in the reminder upcoming list. */
export const REMINDER_ITEM_EXPENSE = 'expense';
/** Type value for a Messages item in the reminder upcoming list. */
export const REMINDER_ITEM_MESSAGE = 'message';

// ── Dialog / error messages ────────────────────────────────────────────────
/** User-facing message shown when an action is blocked by insufficient permissions. */
export const MSG_PERMISSION_DENIED = 'User does not have permission';
/** User-facing message shown when an unhandled exception occurs. */
export const MSG_UNEXPECTED_ERROR = 'Unexpected error occurred';

// ── Useful links — type discriminators ────────────────────────────────────
/** Type value for a link document in the useful_links collection. */
export const USEFUL_LINK_TYPE_LINK = 'link';
/** Type value for a category document in the useful_links collection. */
export const USEFUL_LINK_TYPE_CATEGORY = 'category';

// ── Nexus — AI tool types ──────────────────────────────────────────────────
/** AI tool type that opens the query URL directly in a new tab. */
export const NEXUS_TOOL_TYPE_DIRECT = 'direct';
/** AI tool type that copies the query to the clipboard and opens the tool. */
export const NEXUS_TOOL_TYPE_CLIPBOARD = 'clipboard';
/** Sentinel value for the "show all categories" filter in the Nexus links panel. */
export const NEXUS_CATEGORY_ALL = 'all';
/** Dialog title when adding a new link. */
export const NEXUS_DIALOG_TITLE_ADD_LINK = 'Add Link';
/** Dialog title when editing an existing link. */
export const NEXUS_DIALOG_TITLE_EDIT_LINK = 'Edit Link';
/** Default colour applied to new and un-styled link categories. */
export const NEXUS_DEFAULT_CATEGORY_COLOR = '#d53369';

// ── Toast severities ───────────────────────────────────────────────────────
export const TOAST_SUCCESS = 'success';
export const TOAST_INFO = 'info';
export const TOAST_WARN = 'warn';
export const TOAST_ERROR = 'error';

// ── Nexus — toast messages ─────────────────────────────────────────────────
export const NEXUS_MSG_EMPTY_QUERY = 'Empty query';
export const NEXUS_MSG_EMPTY_QUERY_DETAIL = 'Type something first';
export const NEXUS_MSG_NO_AI_SELECTED = 'No AI selected';
export const NEXUS_MSG_NO_AI_SELECTED_DETAIL = 'Select at least one Direct Query tool';
export const NEXUS_MSG_LAUNCHED = 'Launched';
export const NEXUS_MSG_HISTORY_CLEARED = 'History cleared';
export const NEXUS_MSG_HISTORY_CLEARED_DETAIL = 'Search history has been removed';
export const NEXUS_MSG_MISSING_FIELDS = 'Missing fields';
export const NEXUS_MSG_MISSING_FIELDS_DETAIL = 'URL, title, and category are required';
export const NEXUS_MSG_LINK_UPDATED = 'Link updated';
export const NEXUS_MSG_LINK_SAVED = 'Link saved';
export const NEXUS_MSG_SAVE_FAILED = 'Save failed';
export const NEXUS_MSG_LINK_SAVE_FAILED_DETAIL = 'Could not save the link. Please try again.';
export const NEXUS_MSG_LINK_DELETED = 'Link deleted';
export const NEXUS_MSG_DELETE_FAILED = 'Delete failed';
export const NEXUS_MSG_LINK_DELETE_FAILED_DETAIL = 'Could not delete the link. Please try again.';
export const NEXUS_MSG_NAME_REQUIRED = 'Name required';
export const NEXUS_MSG_CATEGORY_UPDATED = 'Category updated';
export const NEXUS_MSG_CATEGORY_ADDED = 'Category added';
export const NEXUS_MSG_CATEGORY_SAVE_FAILED_DETAIL = 'Could not save the category. Please try again.';
export const NEXUS_MSG_CATEGORY_DELETED = 'Category deleted';
export const NEXUS_MSG_CATEGORY_DELETE_FAILED_DETAIL = 'Could not delete the category. Please try again.';
export const NEXUS_MSG_DELETE_LINK_TITLE = 'Delete Link';
export const NEXUS_MSG_DELETE_LINK_BTN = 'Delete';
export const NEXUS_MSG_DELETE_CATEGORY_TITLE = 'Delete Category';
export const NEXUS_MSG_DELETE_CATEGORY_BTN = 'Delete';

// ── Recipe — view identifiers ─────────────────────────────────────────────
/** List view id for the recipe page router. */
export const RECIPE_VIEW_LIST = 'list';
/** Detail view id for the recipe page router. */
export const RECIPE_VIEW_DETAIL = 'detail';
/** Add (editor) view id for the recipe page router. */
export const RECIPE_VIEW_ADD = 'add';

// ── Recipe — Add page messages ────────────────────────────────────────────
/** Confirm-discard title shown when the user clicks Cancel on the add-recipe screen. */
export const RECIPE_DISCARD_TITLE = 'Discard Recipe';
/** Confirm-discard message body for the add-recipe screen. */
export const RECIPE_DISCARD_MESSAGE = 'Discard this recipe? Any changes will be lost.';
/** Confirm button label for the discard dialog. */
export const RECIPE_DISCARD_BTN = 'Discard';
/** Confirm-discard title shown when the user clicks back on the edit-recipe screen. */
export const RECIPE_DISCARD_CHANGES_TITLE = 'Discard Changes';
/** Confirm-discard message body for the edit-recipe screen. */
export const RECIPE_DISCARD_CHANGES_MESSAGE = 'Unsaved changes will be lost.';
/** Confirm-delete title shown when the user clicks Delete Recipe in edit mode. */
export const RECIPE_DELETE_TITLE = 'Delete Recipe';
/** Confirm-delete message body. */
export const RECIPE_DELETE_MESSAGE = 'Delete this recipe permanently? This cannot be undone.';
/** Confirm button label for the delete dialog. */
export const RECIPE_DELETE_BTN = 'Delete';

// ── Recipe — category discriminators ──────────────────────────────────────
export const RECIPE_CATEGORY_ALL = 'All';
export const RECIPE_CATEGORY_CHINESE = 'Chinese';
export const RECIPE_CATEGORY_WESTERN = 'Western';
export const RECIPE_CATEGORY_QUICK = 'Quick';
export const RECIPE_CATEGORY_DESSERT = 'Dessert';

// ── Recipe — ingredient type discriminators ───────────────────────────────
export const RECIPE_ITYPE_VEG = 'veg';
export const RECIPE_ITYPE_MEAT = 'meat';
export const RECIPE_ITYPE_SEAS = 'seas';
export const RECIPE_ITYPE_DAIRY = 'dairy';
export const RECIPE_ITYPE_GRAIN = 'grain';
export const RECIPE_ITYPE_LIQ = 'liq';
export const RECIPE_ITYPE_SPICE = 'spice';
export const RECIPE_ITYPE_SEAFOOD = 'seafood';
export const RECIPE_ITYPE_EGG = 'egg';
export const RECIPE_ITYPE_NUT = 'nut';
export const RECIPE_ITYPE_FRUIT = 'fruit';
export const RECIPE_ITYPE_OIL = 'oil';
export const RECIPE_ITYPE_HERB = 'herb';
export const RECIPE_ITYPE_FUNGI = 'fungi';
export const RECIPE_ITYPE_SWEET = 'sweet';
export const RECIPE_ITYPE_CONDIMENT = 'condiment';

// ── Recipe — editor type tab management ──────────────────────────────────
/** Maximum number of ingredient type tabs shown in the add/edit editor. */
export const RECIPE_EDITOR_TYPE_MAX = 9;
/** Dialog title for the ingredient type manager in the editor. */
export const RECIPE_ITYPE_DIALOG_TITLE = 'Manage Ingredient Types';
/** Dialog type for the ingredient type manager in the editor. */
export const DIALOG_RECIPE_TYPE = 'recipe-type';

// ── Recipe — editing mode discriminators ─────────────────────────────────
export const RECIPE_EDITING_MODE_CREATE = 'create';
export const RECIPE_EDITING_MODE_EDIT = 'edit';

// ── Recipe — band CSS class names ────────────────────────────────────────
export const RECIPE_BAND_CHINESE = 'band-chinese';
export const RECIPE_BAND_WESTERN = 'band-western';
export const RECIPE_BAND_QUICK = 'band-quick';
export const RECIPE_BAND_DESSERT = 'band-dessert';
export const RECIPE_BAND_SPICY = 'band-spicy';

// ── Recipe — drag-drop position discriminators ───────────────────────────
export const RECIPE_DROP_ABOVE = 'above';
export const RECIPE_DROP_BELOW = 'below';

// ── Recipe — ingredient unit options ─────────────────────────────────────
export const RECIPE_UNIT_OPTIONS: string[] = ['g', 'kg', 'oz', 'lb', 'tsp', 'tbsp', 'cup', 'ml', 'L'];

// ── Recipe — log / toast messages ────────────────────────────────────────
export const RECIPE_MSG_INGREDIENT_UNIT_REQUIRED = 'Some ingredients have a quantity but are missing a unit.';
export const RECIPE_MSG_LOAD_FAILED = 'Failed to load recipes';
export const RECIPE_MSG_ADDED = 'Recipe saved';
export const RECIPE_MSG_UPDATED = 'Recipe updated';
export const RECIPE_MSG_DELETED = 'Recipe deleted';
export const RECIPE_MSG_SAVE_FAILED = 'Save failed';
export const RECIPE_MSG_SAVE_FAILED_DETAIL = 'Could not save the recipe. Please try again.';
export const RECIPE_MSG_DELETE_FAILED = 'Delete failed';
export const RECIPE_MSG_DELETE_FAILED_DETAIL = 'Could not delete the recipe. Please try again.';

// ── Layout — responsive breakpoints ──────────────────────────────────────
export const BREAKPOINT_MOBILE = '(max-width: 940px)';

// ── Errors ─────────────────────────────────────────────────────────────────
export const ERROR_PERMISSION_DENIED = 'DATABASE_PERMISSION_DENIED';

// ── Auth / role discriminators ────────────────────────────────────────────
/** CloudBase role string that identifies an admin user. */
export const ROLE_ADMIN = '管理员';
/** CloudBase error code for an invalid request argument (e.g. wrong verification code). */
export const CLOUDBASE_ERROR_INVALID_ARGUMENT = 'INVALID_ARGUMENT';
/** CloudBase error category returned when credentials are wrong. */
export const CLOUDBASE_ERROR_INVALID_CREDENTIALS = 'INVALID_CREDENTIALS';

// ── Shared date/time display arrays ──────────────────────────────────────
/** Full weekday names, Sunday-first, for calendar and clock displays. */
export const DAY_NAMES_LONG: string[] = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday'
];
/** Short weekday names, Sunday-first, for compact calendar strips. */
export const DAY_NAMES_SHORT: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** Short month names, January-first, for clock and date displays. */
export const MONTH_NAMES_SHORT: string[] = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec'
];

// ── Home — genre bar chart colours ───────────────────────────────────────
/** Cycling colour palette for the genre bar chart on the Home dashboard. */
export const HOME_GENRE_COLORS: string[] = ['#4776e6', '#e91e8c', '#f7971e', '#78d000', '#8e54e9', '#22d3ee'];

// ── Home — recent activity feed: icons ───────────────────────────────────
export const HOME_ACTIVITY_ICON_MOVIE_ADDED = 'live_tv';
export const HOME_ACTIVITY_ICON_MOVIE_REMOVED = 'tv_off';
export const HOME_ACTIVITY_ICON_MOVIE_RATED = 'star';
export const HOME_ACTIVITY_ICON_MOVIE_SEARCHED = 'search';
export const HOME_ACTIVITY_ICON_PATCH_ADDED = 'note_stack';
export const HOME_ACTIVITY_ICON_PATCH_BUG = 'bug_report';
export const HOME_ACTIVITY_ICON_PATCH_STATUS = 'swap_horiz';
export const HOME_ACTIVITY_ICON_PATCH_UPDATED = 'edit';
export const HOME_ACTIVITY_ICON_PATCH_DELETED = 'delete';
export const HOME_ACTIVITY_ICON_REMINDER_ADDED = 'note_add';
export const HOME_ACTIVITY_ICON_REMINDER_DELETED = 'delete';
export const HOME_ACTIVITY_ICON_REMINDER_UPDATED = 'edit_note';
export const HOME_ACTIVITY_ICON_RESONANCE_ADDED = 'format_quote';
export const HOME_ACTIVITY_ICON_RESONANCE_REMOVED = 'format_clear';

// ── Home — recent activity feed: labels ──────────────────────────────────
export const HOME_ACTIVITY_LABEL_MOVIE_ADDED = 'Movie Added';
export const HOME_ACTIVITY_LABEL_MOVIE_REMOVED = 'Movie Removed';
export const HOME_ACTIVITY_LABEL_MOVIE_RATED = 'Movie Rated';
export const HOME_ACTIVITY_LABEL_MOVIE_SEARCHED = 'Entertainment Rate Search';
export const HOME_ACTIVITY_LABEL_PATCH_ADDED = 'Patch Notes Added';
export const HOME_ACTIVITY_LABEL_PATCH_BUG = 'Patch Notes Bug Logged';
export const HOME_ACTIVITY_LABEL_PATCH_STATUS = 'Patch Notes Status Changed';
export const HOME_ACTIVITY_LABEL_PATCH_UPDATED = 'Patch Notes Updated';
export const HOME_ACTIVITY_LABEL_PATCH_DELETED = 'Patch Notes Deleted';
export const HOME_ACTIVITY_LABEL_REMINDER_ADDED = 'Reminder Added';
export const HOME_ACTIVITY_LABEL_REMINDER_DELETED = 'Reminder Deleted';
export const HOME_ACTIVITY_LABEL_REMINDER_UPDATED = 'Reminder Updated';
export const HOME_ACTIVITY_LABEL_RESONANCE_ADDED = 'Resonance Quote Added';
export const HOME_ACTIVITY_LABEL_RESONANCE_REMOVED = 'Resonance Quote Removed';

// ── Home — recent activity feed: colours ─────────────────────────────────
export const HOME_ACTIVITY_COLOR_MOVIE_ADDED = '#e91e8c';
export const HOME_ACTIVITY_COLOR_MOVIE_RATED = '#f7971e';
export const HOME_ACTIVITY_COLOR_MOVIE_SEARCHED = '#4776e6';
export const HOME_ACTIVITY_COLOR_NEUTRAL = '#94a3b8';
export const HOME_ACTIVITY_COLOR_PATCH = '#8e54e9';
export const HOME_ACTIVITY_COLOR_PATCH_DELETED = '#ef4444';
export const HOME_ACTIVITY_COLOR_REMINDER = '#f59e0b';
export const HOME_ACTIVITY_COLOR_REMINDER_DELETED = '#ef4444';
export const HOME_ACTIVITY_COLOR_RESONANCE = '#fda085';

// ── Entertainment — dialog strings ───────────────────────────────────────
/** Prefix for the delete-movie confirm message; movie name is appended at the call site. */
export const ENT_MSG_DELETE_CONFIRM_PREFIX = 'Are you sure you want to delete ';
export const ENT_DIALOG_TITLE_DELETE_MOVIE = 'Delete Movie';
export const ENT_DIALOG_BTN_DELETE = 'Delete';
export const ENT_MSG_ADDING = 'Adding movie...';
export const ENT_MSG_RESTORING = 'Restoring movie...';

// ── Resonance — constants ─────────────────────────────────────────────────
export const RESONANCE_AUTHOR_ANONYMOUS = 'Anonymous';
export const RESONANCE_MSG_DELETE_CONFIRM = 'Are you sure you want to delete this quote?';
export const RESONANCE_DIALOG_TITLE_DELETE = 'Delete Quote';
export const RESONANCE_DIALOG_BTN_DELETE = 'Delete';

// ── Patch Notes — dialog strings ─────────────────────────────────────────
export const PATCH_MSG_DELETE_CONFIRM = 'Are you sure you want to delete this note?';
export const PATCH_DIALOG_CONFIRM_BTN = 'Confirm';
export const PATCH_DIALOG_DELETE_BTN = 'Delete';

// ── Reminder — dialog strings ─────────────────────────────────────────────
export const REMINDER_MSG_RESET_CONFIRM = 'Are you sure you want to reset the dates?';
export const REMINDER_DIALOG_RESET_BTN = 'Reset';
export const REMINDER_DIALOG_CONFIRM_BTN = 'Confirm';
export const REMINDER_MSG_DELETE_CONFIRM = 'Are you sure you want to delete this entry?';
export const REMINDER_DIALOG_DELETE_BTN = 'Delete';

// ── Reminder — inline style strings ──────────────────────────────────────
/** Inline style string for a charged cell (orange highlight). */
export const REMINDER_STYLE_CHARGED = 'color: orange';
/** Inline style string for today's date cell (red highlight). */
export const REMINDER_STYLE_TODAY = 'color: red';

// ── History — dialog and style strings ───────────────────────────────────
export const HISTORY_MSG_UNDO_CONFIRM = 'Undo this deletion?';
export const HISTORY_DIALOG_UNDO_BTN = 'Undo';
export const HISTORY_DIALOG_CONFIRM_BTN = 'Confirm';
/** Inline border style for an "added" history entry. */
export const HISTORY_STYLE_ADDED = 'solid green';
/** Inline border style for a "deleted" history entry. */
export const HISTORY_STYLE_DELETED = 'solid red';

// ── Error dialog — strings ────────────────────────────────────────────────
export const ERROR_DIALOG_HEADER = 'Error';
export const ERROR_DIALOG_ICON_CLASS = 'pi pi-times-circle text-red-500';
export const ERROR_DIALOG_BTN_LABEL = 'OK';
export const ERROR_DIALOG_MSG_CLASS = 'error-dialog-message';
