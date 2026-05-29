////////////////////// Below are application lifecycle constants //////////////////////
export const COMPONENT_DESTROY = 'Component Destroyed';

////////////////////// Below are auth state persistence constants /////////////////////
// Stored in localStorage to avoid the Access Denied flicker on page refresh.
// The value '1' is a lightweight presence flag — it carries no user identity,
// no token, and no permissions. It only signals that the last known session
// was authenticated so the UI can optimistically show content while Firebase /
// CloudBase re-validates the real session in the background. The flag is
// written on login and removed on logout.
export const LS_AUTH_HINT_KEY = 'auth_hint';

////////////////////// Below are database collection name constants ///////////////////
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

////////////////////// Below are reminder table identifier constants //////////////////
export const DATABASE_FIRST_TABLE = 'first_table';
export const DATABASE_SECOND_TABLE = 'second_table';
export const DATABASE_THIRD_TABLE = 'third_table';

////////////////////// Below are statistics document field name constants /////////////
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

////////////////////// Below are statistics display cap constants /////////////////////
// The combined recent-activity feed shows at most this many items.
// Each source array is also trimmed to this cap on write so CloudBase
// never stores more than what the dashboard can ever display.
export const STATS_CAP_ACTIVITY_LOG = 24;

////////////////////// Below are patch note status constants //////////////////////////
export const STATUS_TODO = 'To Do';
export const STATUS_IN_PROGRESS = 'In Progress';
export const STATUS_COMPLETED = 'Completed';
export const STATUS_DEBUG = 'Debug';
export const STATUS_DRAFT = 'Draft';
export const STATUS_RESOLVED = 'Resolved';

////////////////////// Below are movie-related constants //////////////////////////////
export const RATE_LABEL_EXCELLENT = 'Excellent';
export const RATE_LABEL_GOOD = 'Good';
export const RATE_LABEL_AVERAGE = 'Average';
export const RATE_LABEL_POOR = 'Poor';
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

////////////////////// Below are reminder table display name constants ////////////////
/** Display name for the first reminder table — used in stat writes and the Recent Activity widget. */
export const REMINDER_TABLE_DATE_CALCULATOR = 'Date Calculator';
/** Display name for the second reminder table — used in stat writes and the Recent Activity widget. */
export const REMINDER_TABLE_ACCOUNT_EXPENSES = 'Account Expenses';
/** Display name for the third reminder table — used in stat writes and the Recent Activity widget. */
export const REMINDER_TABLE_MESSAGES = 'Messages';
/** Fixed amount deducted from a second-table debt entry per payment cycle. */
export const ACCOUNT_DEBT_DECREMENT = 998.05;

////////////////////// Below are common shared constants /////////////////////////////
export const SEARCH_COMPLETE = 'Search complete';
export const SEARCH_CANCEL = 'Search cancelled';
export const CN = 'CN';
export const SEARCH = 'search';
export const SUCCESS = 'success';
export const FAILURE = 'failure';
export const HOME_LINKS_TILE_0 = '#6aa9d6';
export const HOME_LINKS_TILE_1 = '#f0b88a';
export const HOME_LINKS_TILE_2 = '#a8d4c2';
export const HOME_LINKS_TILE_3 = '#d4a4c8';
export const HOME_LINKS_DOT_FALLBACK = '#5a6878';

////////////////////// Below are dialog type and history status constants /////////////
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

////////////////////// Below are activity log type discriminator constants ////////////
// Type discriminators written into activity-log entries across all pages.
// Use HISTORY_STATUS_ADDED / HISTORY_STATUS_DELETED for 'added' / 'deleted'.
export const ACTIVITY_TYPE_UPDATED = 'updated';
export const ACTIVITY_TYPE_BUG_LOGGED = 'bugLogged';
export const ACTIVITY_TYPE_STATUS_CHANGED = 'statusChanged';
export const ACTIVITY_TYPE_EDITED = 'edited';

////////////////////// Below are reminder item type discriminator constants ///////////
/** Type value for an Account Expenses item in the reminder upcoming list. */
export const REMINDER_ITEM_EXPENSE = 'expense';
/** Type value for a Messages item in the reminder upcoming list. */
export const REMINDER_ITEM_MESSAGE = 'message';

////////////////////// Below are dialog and error message string constants ////////////
/** User-facing message shown when an action is blocked by insufficient permissions. */
export const MSG_PERMISSION_DENIED = 'User does not have permission';
/** User-facing message shown when an unhandled exception occurs. */
export const MSG_UNEXPECTED_ERROR = 'Unexpected error occurred';

////////////////////// Below are useful link type discriminator constants /////////////
/** Type value for a link document in the useful_links collection. */
export const USEFUL_LINK_TYPE_LINK = 'link';
/** Type value for a category document in the useful_links collection. */
export const USEFUL_LINK_TYPE_CATEGORY = 'category';

////////////////////// Below are Nexus AI tool and category constants /////////////////
/** Dialog title when adding a new link. */
export const NEXUS_DIALOG_TITLE_ADD_LINK = 'Add Link';
/** Dialog title when editing an existing link. */
export const NEXUS_DIALOG_TITLE_EDIT_LINK = 'Edit Link';
/** Sentinel value for the "show all categories" filter in the Nexus links panel. */
export const NEXUS_CATEGORY_ALL = 'all';
/** Default colour applied to new and un-styled link categories. */
export const NEXUS_DEFAULT_CATEGORY_COLOR = '#d53369';

////////////////////// Below are toast severity string constants //////////////////////
export const TOAST_SUCCESS = 'success';
export const TOAST_INFO = 'info';
export const TOAST_WARN = 'warn';
export const TOAST_ERROR = 'error';

////////////////////// Below are Nexus toast message string constants ////////////////
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
/** Confirm-delete message prefix for a Nexus link; link title is appended at the call site. */
export const NEXUS_MSG_DELETE_LINK_CONFIRM_PREFIX = 'Are you sure you want to delete "';
/** Confirm-delete message suffix for a Nexus link. */
export const NEXUS_MSG_DELETE_LINK_CONFIRM_SUFFIX = '"?';
/** Confirm-delete message prefix for a Nexus category; category name is appended at the call site. */
export const NEXUS_MSG_DELETE_CATEGORY_CONFIRM_PREFIX = 'Are you sure you want to delete category "';
/** Confirm-delete message suffix for a Nexus category. */
export const NEXUS_MSG_DELETE_CATEGORY_CONFIRM_SUFFIX = '"? Links in this category will become uncategorised.';

////////////////////// Below are Nexus error log string constants ////////////////////
export const NEXUS_MSG_LOAD_LINKS_FAILED = 'Failed to load useful links';
export const NEXUS_MSG_LOAD_CATEGORIES_FAILED = 'Failed to load link categories';
export const NEXUS_MSG_SAVE_LINK_FAILED = 'Failed to save link';
export const NEXUS_MSG_SAVE_CATEGORY_FAILED = 'Failed to save category';

////////////////////// Below are login animation state and log constants /////////////
export const LOGIN_ANIM_OUT = 'out';
export const LOGIN_ANIM_IN = 'in';
export const LOGIN_MSG_SEND_CODE_FAILED = 'Failed to send verification code';

////////////////////// Below are recipe view identifier constants ////////////////////
/** List view id for the recipe page router. */
export const RECIPE_VIEW_LIST = 'list';
/** Detail view id for the recipe page router. */
export const RECIPE_VIEW_DETAIL = 'detail';
/** Add (editor) view id for the recipe page router. */
export const RECIPE_VIEW_ADD = 'add';

////////////////////// Below are recipe add and edit page message constants //////////
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

////////////////////// Below are recipe category discriminator constants /////////////
export const RECIPE_CATEGORY_ALL = 'All';
export const RECIPE_CATEGORY_CHINESE = 'Chinese';
export const RECIPE_CATEGORY_WESTERN = 'Western';
export const RECIPE_CATEGORY_QUICK = 'Quick';
export const RECIPE_CATEGORY_DESSERT = 'Dessert';

////////////////////// Below are recipe ingredient type discriminator constants //////
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

////////////////////// Below are recipe editor type tab management constants /////////
/** Dialog title for the ingredient type manager in the editor. */
export const RECIPE_ITYPE_DIALOG_TITLE = 'Manage Ingredient Types';
/** Maximum number of ingredient type tabs shown in the add/edit editor. */
export const RECIPE_EDITOR_TYPE_MAX = 9;
/** Dialog type for the ingredient type manager in the editor. */
export const DIALOG_RECIPE_TYPE = 'recipe-type';

////////////////////// Below are recipe editing mode discriminator constants /////////
export const RECIPE_EDITING_MODE_CREATE = 'create';
export const RECIPE_EDITING_MODE_EDIT = 'edit';

////////////////////// Below are recipe band CSS class name constants ////////////////
// Each band pairs with a RECIPE_CATEGORY_* constant above and a full CSS
// section in recipe.component.css.  When adding a new band:
//   1. Add RECIPE_CATEGORY_<NAME> above
//   2. Add RECIPE_BAND_<NAME> here
//   3. Register the new case in Utilities.recipeBandClass()
//   4. Add RECIPE_CATEGORY_<NAME> to RECIPE_CATEGORIES and RECIPE_EDITOR_CATEGORIES
//      in recipe.model.ts
//   5. Add all CSS rules in recipe.component.css (see the palette comment block)
export const RECIPE_BAND_CHINESE = 'band-chinese';
export const RECIPE_BAND_WESTERN = 'band-western';
export const RECIPE_BAND_QUICK = 'band-quick';
export const RECIPE_BAND_DESSERT = 'band-dessert';
export const RECIPE_BAND_SPICY = 'band-spicy';   // reserved — CSS rules not yet added
export const RECIPE_BAND_DEFAULT = 'band-default';

////////////////////// Below are recipe drag-drop position discriminator constants ///
export const RECIPE_DROP_ABOVE = 'above';
export const RECIPE_DROP_BELOW = 'below';

////////////////////// Below are recipe ingredient unit option constants /////////////
export const RECIPE_UNIT_OPTIONS: string[] = ['g', 'kg', 'oz', 'lb', 'tsp', 'tbsp', 'cup', 'ml', 'L'];

////////////////////// Below are recipe log and toast message constants //////////////
export const RECIPE_MSG_INGREDIENT_UNIT_REQUIRED = 'Some ingredients have a quantity but are missing a unit.';
export const RECIPE_MSG_LOAD_FAILED = 'Failed to load recipes';
export const RECIPE_MSG_ADDED = 'Recipe saved';
export const RECIPE_MSG_UPDATED = 'Recipe updated';
export const RECIPE_MSG_DELETED = 'Recipe deleted';
export const RECIPE_MSG_SAVE_FAILED = 'Save failed';
export const RECIPE_MSG_SAVE_FAILED_DETAIL = 'Could not save the recipe. Please try again.';
export const RECIPE_MSG_DELETE_FAILED = 'Delete failed';
export const RECIPE_MSG_DELETE_FAILED_DETAIL = 'Could not delete the recipe. Please try again.';
export const RECIPE_MSG_NAME_TOO_LONG = 'Recipe name must not exceed 9 Chinese characters in length.';
export const RECIPE_MSG_CATEGORY_REQUIRED = 'Please select a category before saving.';
export const RECIPE_MAX_BADGES = 4;
export const RECIPE_MAX_NAME_CHARS = 9;

////////////////////// Below are layout responsive breakpoint constants //////////////
export const BREAKPOINT_MOBILE = '(max-width: 800px)';
export const BREAKPOINT_MID    = '(max-width: 1100px)';
export const BREAKPOINT_LARGE  = '(max-width: 1500px)';
// Dialog panels have a narrower breakpoint — they are floating overlays, not full pages.
export const BREAKPOINT_DIALOG = '(max-width: 580px)';

////////////////////// Below are error code constants ////////////////////////////////
export const ERROR_PERMISSION_DENIED = 'DATABASE_PERMISSION_DENIED';

////////////////////// Below are auth role and error code constants //////////////////
/** CloudBase role string that identifies an admin user. */
export const ROLE_ADMIN = '管理员';
/** CloudBase error code for an invalid request argument (e.g. wrong verification code). */
export const CLOUDBASE_ERROR_INVALID_ARGUMENT = 'INVALID_ARGUMENT';
/** CloudBase error category returned when credentials are wrong. */
export const CLOUDBASE_ERROR_INVALID_CREDENTIALS = 'INVALID_CREDENTIALS';

////////////////////// Below are shared date and time display array constants ////////
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

////////////////////// Below are home genre bar chart colour constants ///////////////
/** Cycling colour palette for the genre bar chart on the Home dashboard. */
export const HOME_GENRE_COLORS: string[] = ['#4776e6', '#e91e8c', '#f7971e', '#78d000', '#8e54e9', '#22d3ee'];

////////////////////// Below are home recent activity feed icon constants ////////////
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

////////////////////// Below are home recent activity feed label constants ///////////
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

////////////////////// Below are home recent activity feed colour constants //////////
export const HOME_ACTIVITY_COLOR_MOVIE_ADDED = '#e91e8c';
export const HOME_ACTIVITY_COLOR_MOVIE_RATED = '#f7971e';
export const HOME_ACTIVITY_COLOR_MOVIE_SEARCHED = '#4776e6';
export const HOME_ACTIVITY_COLOR_NEUTRAL = '#94a3b8';
export const HOME_ACTIVITY_COLOR_PATCH = '#8e54e9';
export const HOME_ACTIVITY_COLOR_PATCH_DELETED = '#ef4444';
export const HOME_ACTIVITY_COLOR_REMINDER = '#f59e0b';
export const HOME_ACTIVITY_COLOR_REMINDER_DELETED = '#ef4444';
export const HOME_ACTIVITY_COLOR_RESONANCE = '#fda085';

////////////////////// Below are home error log string constants ////////////////////
export const HOME_MSG_LOAD_STATISTICS_FAILED = 'Failed to load statistics';
export const HOME_MSG_INCREMENT_VISIT_FAILED = 'Failed to increment link visit';

////////////////////// Below are entertainment page dialog string constants //////////
/** Prefix for the delete-movie confirm message; movie name is appended at the call site. */
export const ENT_MSG_DELETE_CONFIRM_PREFIX = 'Are you sure you want to delete ';
export const ENT_DIALOG_TITLE_DELETE_MOVIE = 'Delete Movie';
export const ENT_DIALOG_BTN_DELETE = 'Delete';
export const ENT_MSG_ADDING = 'Adding movie...';
export const ENT_MSG_RESTORING = 'Restoring movie...';

////////////////////// Below are entertainment page header string constants //////////
/** Tooltip for the Refresh Rates action button. */
export const ENT_TOOLTIP_REFRESH = 'Refresh Rates';
/** Tooltip for the Add Movie action button. */
export const ENT_TOOLTIP_ADD = 'Add Movie';
/** Tooltip for the History action button. */
export const ENT_TOOLTIP_HISTORY = 'History';
/** Placeholder text for the movie search input. */
export const ENT_SEARCH_PLACEHOLDER = 'Search movies...';
/** Suffix label in the count pill (e.g. "77 films"). */
export const ENT_LABEL_FILMS = 'films';
/** Secondary label on each category card (e.g. "10 to watch"). */
export const ENT_LABEL_TO_WATCH = 'to watch';
/** Pushpin colours for corkboard category cards, cycling by card index. */
export const ENT_CORK_PIN_COLORS: string[] = [
	'#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'
];
/** Rotation amounts (degrees) for corkboard category cards, cycling by card index. */
export const ENT_CORK_ROTATIONS: number[] = [-2.4, 1.9, -1.3, 2.6, -0.7, 1.5, -2.1];
/** Number of progress-bar blocks per category card. */
export const ENT_CORK_BLOCKS = 8;
/** ID of the programmatically injected View Transition style element. */
export const ENT_VTA_STYLE_ID = 'ent-vta-styles';
/** CSS view-transition-class value applied to movie cards being filtered out. */
export const ENT_VT_CLASS_LEAVING = 'vt-leaving';
/** CSS view-transition-class value applied to movie cards being filtered in. */
export const ENT_VT_CLASS_ENTERING = 'vt-entering';

////////////////////// Below are Resonance page constants ////////////////////////////
export const RESONANCE_AUTHOR_ANONYMOUS = 'Anonymous';
export const RESONANCE_MSG_DELETE_CONFIRM = 'Are you sure you want to delete this quote?';
export const RESONANCE_DIALOG_TITLE_DELETE = 'Delete Quote';
export const RESONANCE_DIALOG_BTN_DELETE = 'Delete';
export const RESONANCE_MSG_POSTED = 'Posted';
export const RESONANCE_LABEL_VOICES = 'voices';

////////////////////// Below are patch notes dialog string constants /////////////////
export const PATCH_MSG_DELETE_CONFIRM = 'Are you sure you want to delete this note?';
export const PATCH_DIALOG_CONFIRM_BTN = 'Confirm';
export const PATCH_DIALOG_DELETE_BTN = 'Delete';

////////////////////// Below are reminder page dialog string constants ///////////////
export const REMINDER_MSG_RESET_CONFIRM = 'Are you sure you want to reset the dates?';
export const REMINDER_DIALOG_RESET_BTN = 'Reset';
export const REMINDER_DIALOG_CONFIRM_BTN = 'Confirm';
export const REMINDER_MSG_DELETE_CONFIRM = 'Are you sure you want to delete this entry?';
export const REMINDER_DIALOG_DELETE_BTN = 'Delete';

////////////////////// Below are reminder first-table UI label constants /////////////
export const REMINDER_LABEL_CURRENT_MONTH = 'Current Month';
export const REMINDER_LABEL_NEXT_MONTH = 'Next Month';
export const REMINDER_LABEL_RESET = 'Reset';
export const REMINDER_LABEL_CELL_CONFIRM = 'Confirm';
export const REMINDER_LABEL_CELL_DONE = 'Done';
export const REMINDER_LABEL_CELL_TODAY = 'Today';
export const REMINDER_LABEL_CONFIRMED = 'confirmed';

////////////////////// Below are history dialog and style string constants ///////////
export const HISTORY_MSG_UNDO_CONFIRM = 'Undo this deletion?';
export const HISTORY_DIALOG_UNDO_BTN = 'Undo';
export const HISTORY_DIALOG_CONFIRM_BTN = 'Confirm';
/** Inline border style for an "added" history entry. */
export const HISTORY_STYLE_ADDED = 'solid green';
/** Inline border style for a "deleted" history entry. */
export const HISTORY_STYLE_DELETED = 'solid red';

////////////////////// Below are Pinboard page constants /////////////////////////////
/** Placeholder for the pin message text input. */
export const PINBOARD_PLACEHOLDER_TEXT = 'What should we remind you about…';
/** Placeholder for the link URL input inside the link popover. */
export const PINBOARD_PLACEHOLDER_LINK = 'https://';
/** Placeholder for the new-tag inline input. */
export const PINBOARD_PLACEHOLDER_TAG = 'tag…';
/** Confirmation message shown before deleting a pinboard entry. */
export const PINBOARD_MSG_DELETE_CONFIRM = 'Delete this entry? This cannot be undone.';
/** Primary action button label on the pinboard delete confirmation dialog. */
export const PINBOARD_DIALOG_DELETE_BTN = 'Delete';
/** Secondary confirm button label on the pinboard delete confirmation dialog. */
export const PINBOARD_DIALOG_CONFIRM_BTN = 'Confirm';
/** CloudBase content field name for the pin message text. */
export const PINBOARD_FIELD_TEXT = 'text';
/** CloudBase content field name for the pin date. */
export const PINBOARD_FIELD_DATE = 'date';
/** CloudBase content field name for the pin link URL. */
export const PINBOARD_FIELD_LINK = 'link';
/** CloudBase content field name for the pin tags array. */
export const PINBOARD_FIELD_TAGS = 'tags';
/** Items shown per page in the Pinboard grid. */
export const PINBOARD_ITEMS_PER_PAGE = 10;

////////////////////// Below are error dialog string constants ///////////////////////
export const ERROR_DIALOG_HEADER = 'Error';
export const ERROR_DIALOG_ICON_CLASS = 'pi pi-times-circle text-red-500';
export const ERROR_DIALOG_BTN_LABEL = 'OK';
export const ERROR_DIALOG_MSG_CLASS = 'error-dialog-message';
