export * from '../constants';

/** BCP 47 language tag for date and time formatting on the active locale. */
export const APP_LOCALE = 'en-US';

/* ─────────────────────────────────────────
   Shared user-facing messages
───────────────────────────────────────── */

/** Confirmation message shown when the user attempts to sign out. */
export const MSG_LOGOUT_CONFIRM = 'Are you sure you want to sign out?';
/** Accept button label for the sign-out confirmation dialog. */
export const DIALOG_BTN_SIGN_OUT = 'Sign Out';
/** Shared delete button label used across all confirm-delete dialogs. */
export const DIALOG_BTN_DELETE = 'Delete';
/** Shared confirm button label used across all confirm dialogs. */
export const DIALOG_BTN_CONFIRM = 'Confirm';
/** Shared cancel button label used across all dialogs. */
export const DIALOG_BTN_CANCEL = 'Cancel';
/** Shared save button label used across all dialogs. */
export const DIALOG_BTN_SAVE = 'Save';
/** Shared toast summary shown when a delete operation fails. */
export const MSG_DELETE_FAILED = 'Delete failed';
/** Shared toast summary shown when a save operation fails. */
export const MSG_SAVE_FAILED = 'Save failed';
/** Heading shown on the access-denied card when the user lacks page permission. */
export const ACCESS_DENIED_TITLE = 'Access Denied';
/** Body text shown on the access-denied card when the user lacks page permission. */
export const ACCESS_DENIED_BODY = 'You do not have permission to access this page';
/** User-facing message shown when an action is blocked by insufficient permissions. */
export const MSG_PERMISSION_DENIED = 'User does not have permission';
/** User-facing message shown when an unhandled exception occurs. */
export const MSG_UNEXPECTED_ERROR = 'Unexpected error occurred';
/** Block-overlay message shown while a delete write is in flight. */
export const MSG_DELETING = 'Deleting...';
/** Block-overlay message shown while a save write is in flight. */
export const MSG_SAVING = 'Saving...';
/** Block-overlay message shown while a bulk clear write is in flight. */
export const MSG_CLEARING = 'Clearing...';
/** Error message thrown when an unknown dialog type is requested. */
export const MSG_INVALID_DIALOG_TYPE = 'Invalid dialog type';
/** Error message thrown when the dialog container reference is missing. */
export const MSG_DIALOG_CONTAINER_NOT_FOUND = 'Dialog container not found';
/** Error message thrown when a second dialog is opened before the first is closed. */
export const MSG_DIALOG_ALREADY_OPEN = 'Dialog already opened';
export const ERROR_DIALOG_HEADER = 'Error';
export const SEARCH_COMPLETE = 'Search complete';
export const SEARCH_CANCEL = 'Search cancelled';
/** Message shown in the retry dialog when a page data load exceeds the timeout. */
export const RETRY_DIALOG_MSG = 'Connection Lost...';
/** Notification title shown when the user enables push notifications. */
export const NOTIF_ENABLED_TITLE = 'Notifications enabled';
/** Notification body shown when the user enables push notifications. */
export const NOTIF_ENABLED_BODY = 'You will now receive notifications from Vision Canvas.';

/* ─────────────────────────────────────────
   History dialog constants
───────────────────────────────────────── */

export const HISTORY_MSG_UNDO_CONFIRM = 'Undo this deletion?';
export const HISTORY_DIALOG_UNDO_BTN = 'Undo';
export const HISTORY_DIALOG_TITLE = 'Activities';
export const HISTORY_SUBTITLE = 'Click on a deleted entry to recover it';

/* ─────────────────────────────────────────
   Auth and login constants
───────────────────────────────────────── */

export const LOGIN_MSG_SEND_CODE_FAILED = 'Failed to send verification code';
export const NAV_NOTIF_LABEL_ENABLE = 'Enable notifications';
export const NAV_NOTIF_LABEL_DISABLE = 'Disable notifications';
export const NAV_NOTIF_TOGGLE_ERROR = 'Error toggling push notification';
export const NAV_LOCALE_SWITCH_TO_ZH = 'Switch to Chinese';
export const NAV_LOCALE_SWITCH_TO_EN = 'Switch to English';
export const NAV_MINIMIZE_ON_CLOSE_ENABLE = 'Minimize on close';
export const NAV_MINIMIZE_ON_CLOSE_DISABLE = 'Exit on close';
export const DIALOG_LOCALE_SWITCH_HEADER = 'Switch Language';
export const DIALOG_LOCALE_SWITCH_MSG = 'The page will reload to apply the change.';
export const DIALOG_LOCALE_SWITCH_BTN = 'Switch & Reload';
export const NAV_LABEL_MENU = 'Menu';
export const NAV_LABEL_HOME = 'Home';
export const NAV_LABEL_TODAY = 'Today';
export const NAV_LABEL_PORTAL = 'Portal';
export const NAV_LABEL_RESONANCE = 'Resonance';
export const NAV_LABEL_RECIPES = 'Recipes';
export const NAV_LABEL_ENTERTAINMENT = 'Entertainment';
export const NAV_LABEL_REMINDER = 'Reminder';
export const NAV_LABEL_DEBT_SONATA = 'Debt Sonata';
export const NAV_LABEL_PATCH_NOTES = 'Patch Notes';
export const NAV_LABEL_ABOUT = 'About';
export const NAV_LABEL_VAULT = 'Vault';
export const NAV_LABEL_SIGN_OUT = 'Sign out';
export const NAV_LABEL_SIGN_IN = 'Sign in';
export const NAV_ARIA_ACCOUNT = 'Account';
export const NAV_ARIA_PRIMARY = 'Primary navigation';
export const NAV_ARIA_CLOSE_SECTIONS = 'Close all sections';
export const NAV_ARIA_SHOW_SECTIONS = 'Show all sections';
export const NAV_ARIA_ACCOUNT_PREFIX = 'Account: ';
export const NAV_STATUS_OFFLINE = 'Offline';
/** Shared "Online" label used across nav and mobile-nav status indicators. */
export const LABEL_ONLINE = 'Online';
export const LOGIN_LABEL_CREATE_ACCOUNT = 'Create account';
export const LOGIN_LABEL_GET_CODE = 'Get Code';
export const LOGIN_LABEL_SIGN_IN = 'Sign In';
export const LOGIN_ERROR_USERNAME_TOO_LONG = 'Username must be 13 characters or fewer.';
export const LOGIN_LABEL_PWD_REQ_LENGTH = 'At least 8 characters';
export const LOGIN_LABEL_PWD_REQ_TYPES = 'At least 3 of the following character types:';
export const LOGIN_LABEL_PWD_REQ_UPPERCASE = 'Uppercase letter (A–Z)';
export const LOGIN_LABEL_PWD_REQ_LOWERCASE = 'Lowercase letter (a–z)';
export const LOGIN_LABEL_PWD_REQ_DIGIT = 'Number (0–9)';
export const LOGIN_LABEL_PWD_REQ_SPECIAL = 'Special character (e.g. ! @ # $)';
export const LOGIN_LABEL_CODE_COUNTDOWN_SUFFIX = 'seconds';
export const LOGIN_MSG_CODE_SENT = 'Code sent — check your email.';
export const LOGIN_LABEL_FORGOT_PASSWORD = 'Forgot password?';
export const LOGIN_LABEL_SEND_RESET_CODE = 'Send reset code';
export const LOGIN_LABEL_RESET_PASSWORD = 'Reset password';
export const LOGIN_LABEL_BACK_TO_SIGN_IN = 'Back to sign in';
export const LOGIN_TOGGLE_HAS_ACCOUNT = 'Already have an account?';
export const LOGIN_TOGGLE_NO_ACCOUNT = 'No account yet?';
export const LOGIN_TOGGLE_SIGN_IN = 'Sign in';
export const LOGIN_TOGGLE_SIGN_UP = 'Sign up now';
export const LOGIN_FLAVOUR_TEXT = 'Welcome back to the hidden kingdom';
export const LOGIN_MSG_EMAIL_REQUIRED = 'Email is required.';
/** Shared "Email" label used in login and account pages. */
export const LABEL_EMAIL = 'Email';
export const LOGIN_MSG_EMAIL_INVALID = 'Enter a valid email address.';
export const LOGIN_LABEL_CODE = 'Code';
export const LOGIN_MSG_CODE_REQUIRED = 'Verification code is required.';
export const LOGIN_MSG_PASSWORD_REQUIRED = 'Password is required.';
/** Shared "New password" label used in login and account pages. */
export const LABEL_NEW_PASSWORD = 'New password';
/** Shared "Username" label used in login and account pages. */
export const LABEL_USERNAME = 'Username';
export const LOGIN_MSG_USERNAME_REQUIRED = 'Username is required.';
export const LOGIN_LABEL_PASSWORD = 'Password';
export const LOGIN_LABEL_DIVIDER = 'or';
export const LOGIN_BTN_GOOGLE = 'Continue with Google';
export const ERROR_NO_DOCUMENT_UPDATED = 'No document was updated';

/* ─────────────────────────────────────────
   Home page constants
───────────────────────────────────────── */

export const HOME_MSG_LOAD_STATISTICS_FAILED = 'Failed to load statistics';
export const HOME_MSG_INCREMENT_VISIT_FAILED = 'Failed to increment link visit';
export const HOME_ACTIVITY_LABEL_MOVIE_ADDED = 'Movie Added';
export const HOME_ACTIVITY_LABEL_MOVIE_UPDATED = 'Movie Updated';
export const HOME_ACTIVITY_LABEL_MOVIE_REMOVED = 'Movie Removed';
export const HOME_ACTIVITY_LABEL_MOVIE_SEARCHED = 'Movie Searched';
export const HOME_ACTIVITY_LABEL_PATCH_ADDED = 'Patch Added';
export const HOME_ACTIVITY_LABEL_PATCH_BUG = 'Bug Logged';
export const HOME_ACTIVITY_LABEL_PATCH_STATUS = 'Patch Status Changed';
export const HOME_ACTIVITY_LABEL_PATCH_UPDATED = 'Patch Edited';
export const HOME_ACTIVITY_LABEL_PATCH_DELETED = 'Patch Deleted';
export const HOME_ACTIVITY_LABEL_REMINDER_ADDED = 'Reminder Added';
export const HOME_ACTIVITY_LABEL_REMINDER_DELETED = 'Reminder Removed';
export const HOME_ACTIVITY_LABEL_REMINDER_UPDATED = 'Reminder Updated';
/** Sentence templates for shared-reminder activity subtitles — {who}, {text}, and {aspect} tokens are replaced at render time. */
export const HOME_SHARED_ACTIVITY_ADDED = '{who} added "{text}"';
export const HOME_SHARED_ACTIVITY_DELETED = '{who} deleted "{text}"';
export const HOME_SHARED_ACTIVITY_EDITED_ASPECT = '{who} changed the {aspect} of "{text}"';
export const HOME_SHARED_ACTIVITY_EDITED = '{who} edited "{text}"';
/** Author name used in shared-activity sentences when the author is the signed-in user. */
export const HOME_SHARED_ACTIVITY_SELF = 'You';
/** Fallback author name when a shared entry's author is no longer in the connections list. */
export const HOME_SHARED_ACTIVITY_MEMBER_FALLBACK = 'A connection';
/** Aspect labels naming which reminder field a shared edit changed. */
export const HOME_SHARED_ASPECT_TEXT = 'content';
export const HOME_SHARED_ASPECT_DATE = 'date';
export const HOME_SHARED_ASPECT_LINK = 'link';
export const HOME_SHARED_ASPECT_TAG = 'tag';
export const HOME_SHARED_ASPECT_START_TIME = 'start time';
export const HOME_SHARED_ASPECT_END_TIME = 'end time';
export const HOME_SHARED_ASPECT_SHARED = 'sharing';
export const HOME_ACTIVITY_LABEL_RESONANCE_ADDED = 'Quote Added';
export const HOME_ACTIVITY_LABEL_RESONANCE_REMOVED = 'Quote Removed';
export const HOME_ACTIVITY_LABEL_LINK_ADDED = 'Link Added';
export const HOME_ACTIVITY_LABEL_LINK_UPDATED = 'Link Updated';
export const HOME_ACTIVITY_LABEL_LINK_REMOVED = 'Link Removed';
export const HOME_ACTIVITY_LABEL_DEBT_ADDED = 'Debt Added';
export const HOME_ACTIVITY_LABEL_DEBT_UPDATED = 'Debt Updated';
export const HOME_ACTIVITY_LABEL_DEBT_RESET = 'Debt Reset';
export const HOME_ACTIVITY_LABEL_DEBT_REMOVED = 'Debt Removed';
export const HOME_ACTIVITY_LABEL_RECIPE_ADDED = 'Recipe Added';
export const HOME_ACTIVITY_LABEL_RECIPE_UPDATED = 'Recipe Updated';
export const HOME_ACTIVITY_LABEL_RECIPE_REMOVED = 'Recipe Removed';
export const HOME_ACTIVITY_LABEL_MOVIE_RATE_UPDATED = 'Movie Rate Updated';
export const HOME_ACTIVITY_LABEL_MOVIE_GENRE_UPDATED = 'Movie Genre Updated';
export const HOME_ACTIVITY_LABEL_MOVIE_FAVOURITE_UPDATED = 'Movie Favourite Updated';
export const HOME_ACTIVITY_LABEL_LINK_CATEGORY_UPDATED = 'Link Category Updated';
export const HOME_ACTIVITY_LABEL_LINK_CATEGORY_REMOVED = 'Link Category Removed';
export const HOME_ACTIVITY_LABEL_DEBT_PAYMENT_REMOVED = 'Debt Payment Entry Removed';
export const HOME_ACTIVITY_LABEL_LINK_CATEGORY_ADDED = 'Link Category Added';
export const HOME_ACTIVITY_LABEL_DATE_CALCULATOR_UPDATED = 'Date Calculator Updated';
export const HOME_ACTIVITY_LABEL_DEBT_LOCK_UPDATED = 'Debt Lock Updated';
export const HOME_ACTIVITY_LABEL_VAULT_ADDED = 'Vault Account Added';
export const HOME_ACTIVITY_LABEL_VAULT_REMOVED = 'Vault Account Removed';
export const ACTIVITY_INVALID_TABLE_TEXT = 'Invalid database name';

/** Overflow-row label for the reminders panel. */
export const HOME_OVERFLOW_LABEL_REMINDERS = 'View all in Reminders';
/** Overflow-row label for the debt panel. */
export const HOME_OVERFLOW_LABEL_DEBT = 'View all in Debt Sonata';
/** Overflow-row label for the recipes panel. */
export const HOME_OVERFLOW_LABEL_RECIPES = 'View all in Recipes';
/** Overflow-row label for the shortcuts panel. */
export const HOME_OVERFLOW_LABEL_LINKS = 'View all in Shortcuts';

export const HOME_WEEK_AGENDA_EMPTY_TEXT = 'Nothing due — an open day.';
/** Tooltip shown on the Streak satellite on the orbital dashboard. */
export const HOME_SATELLITE_TOOLTIP_STREAK = 'Consecutive days with at least one activity logged';
export const HOME_BRAND_SUBTITLE = 'A PERSONAL INNER WORLD';
export const HOME_FLAVOUR_LINE_1 = 'Some memories are worth keeping.';
export const HOME_FLAVOUR_LINE_2 = 'So I made a place to keep them.';
/** Plural label used when multiple reminders appear in the urgency strip. */
export const ORBITAL_URGENCY_LABEL_REMINDERS = 'reminders';
/** Plural label used when multiple debts appear in the urgency strip. */
export const ORBITAL_URGENCY_LABEL_DEBTS = 'debts';
/** Appended after the closest due date when multiple items have different due dates in the urgency strip. */
export const ORBITAL_URGENCY_LABEL_VARIOUS = 'Various';
export const ORBITAL_LABEL_STREAK = 'Streak';
export const ORBITAL_LABEL_PATCH = 'Patch';
export const ORBITAL_LABEL_THIS_WEEK = 'This Week';
export const ORBITAL_LABEL_LIFE_CLOCK = 'LIFE CLOCK';
export const ORBITAL_LABEL_REMINDERS = 'Reminders';
export const ORBITAL_LABEL_SHORTCUTS = 'Shortcuts';
export const ORBITAL_LABEL_ACTIVITY = 'Activity';
export const ORBITAL_LABEL_LOADING = 'Loading…';
export const ORBITAL_PANEL_EMPTY_LINKS = 'No links yet';
export const ORBITAL_PANEL_EMPTY_PAYMENTS = 'No upcoming payments';
export const ORBITAL_PANEL_EMPTY_GENRES = 'No genre data yet';
export const ORBITAL_PANEL_EMPTY_RECIPES = 'No recipes yet';
export const ORBITAL_PANEL_EMPTY_REMINDERS = 'No reminders yet';
export const ORBITAL_PANEL_EMPTY_ACTIVITY = 'No activity yet';
export const ORBITAL_DAY_NAMES_SHORT: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const ORBITAL_QUICK_ACTION_LABELS: string[] = ['Add Movie', 'Add Quote', 'Add Recipe', 'Add Debt', 'Add Reminder', 'Add Shortcut'];
export const ORBITAL_GREETING_NIGHT = 'Good night';
export const ORBITAL_GREETING_MORNING = 'Good morning';
export const ORBITAL_GREETING_AFTERNOON = 'Good afternoon';
export const ORBITAL_GREETING_EVENING = 'Good evening';
/** Life-clock ring label for the yearly progress arc. */
export const ORBITAL_LABEL_YEAR = 'Year';
/** Life-clock ring label for the monthly progress arc. */
export const ORBITAL_LABEL_MONTH = 'Month';
/** Life-clock ring label for the weekly progress arc. */
export const ORBITAL_LABEL_WEEK = 'Week';
/** Life-clock ring label for the daily progress arc. */
export const ORBITAL_LABEL_DAY = 'Day';
/** Header label above the selected-day date in the week-agenda panel. */
export const ORBITAL_WEEK_AGENDA_DUE_HEADER = 'Due';
/** Suffix appended to the open-reminder count badge in the reminders panel. */
export const ORBITAL_PANEL_BADGE_OPEN = 'open';
/** Suffix appended to the open-debt count badge in the debt panel. */
export const ORBITAL_PANEL_BADGE_DUE = 'due';
export const ORBITAL_TOOLTIP_ACTIVITY_7DAYS = 'Activity entries added in the past 7 days';

/* ─────────────────────────────────────────
   Entertainment page constants
───────────────────────────────────────── */

/** Prefix for the delete-movie confirm message; movie name is appended at the call site. */
export const ENT_MSG_DELETE_CONFIRM_PREFIX = 'Are you sure you want to delete ';
export const ENT_DIALOG_TITLE_ADD_MOVIE = 'Add New Movie';
export const ADD_MOVIE_SUBTITLE = 'Enter either Name or ID to start searching';
export const ADD_MOVIE_LABEL_GENRE = 'Genre*';
/** Localized display labels for movie genres, keyed by the stored Chinese genre value. */
export const ENT_GENRE_LABELS: Record<string, string> = {
	刑侦: 'Crime',
	古装: 'Ancient',
	悬疑: 'Suspense',
	校园: 'Campus',
	现代: 'Modern',
	谍战: 'Spy',
	特别关注: 'Favourites'
};
export const ENT_LABEL_TYPE = 'Type:';
export const ENT_LABEL_EPISODES = 'Eps.';
export const ENT_LABEL_YEAR = 'Year:';
export const ENT_LABEL_SYNOPSIS = 'Synopsis:';
export const ENT_LABEL_CAST = 'Cast:';
export const ADD_MOVIE_LABEL_FAVOURITE = 'Favourite';
export const ENT_DIALOG_TITLE_SEARCH = 'Searching latest rate for each movie...';
export const ENT_DIALOG_TITLE_DELETE_MOVIE = 'Delete Movie';
export const ENT_MSG_LOADING = 'Loading movies...';
export const ENT_MSG_ADDING = 'Adding movie...';
export const ENT_MSG_RESTORING = 'Restoring movie...';

/** Tooltip for the Refresh Rates action button. */
export const ENT_TOOLTIP_REFRESH = 'Refresh Rates';
/** Tooltip for the Add Movie action button. */
export const ENT_TOOLTIP_ADD = 'Add Movie';
/** Tooltip for the History action button. */
export const ENT_TOOLTIP_HISTORY = 'History';
export const ENT_TITLE_PAGE = 'Movies';
/** Placeholder text for the movie search input. */
export const ENT_SEARCH_PLACEHOLDER = 'Search movies...';
/** Suffix label in the count pill (e.g. "77 films"). */
export const ENT_LABEL_FILMS = 'films';
/** Secondary label on each category card (e.g. "10 to watch"). */
export const ENT_LABEL_TO_WATCH = 'to watch';
/** Button label shown while a movie-rate search is in progress. */
export const ENT_BTN_STOP = 'STOP';
/** Button label shown after a movie-rate search completes or is interrupted. */
export const ENT_BTN_DONE = 'DONE';
/** Form label for the movie name field (optional state). */
export const ADD_MOVIE_LABEL_NAME = 'Name';
/** Form label for the movie name field (required state). */
export const ADD_MOVIE_LABEL_NAME_REQUIRED = 'Name*';
/** Form label for the movie year field (optional state). */
export const ADD_MOVIE_LABEL_YEAR = 'Year';
/** Form label for the movie year field (required state). */
export const ADD_MOVIE_LABEL_YEAR_REQUIRED = 'Year*';
/** Form label for the movie ID field (optional state). */
export const ADD_MOVIE_LABEL_ID = 'ID';
/** Form label for the movie ID field (required state). */
export const ADD_MOVIE_LABEL_ID_REQUIRED = 'ID*';
/** Button label that triggers a TMDB cover-image search in the add-movie dialog. */
export const ADD_MOVIE_BTN_SEARCH = 'Search';
/** Button label that confirms adding the movie in the add-movie dialog. */
export const ADD_MOVIE_BTN_SUBMIT = 'Submit';

/** Opening bracket for the rating in movie history entries. */
export const ENT_HISTORY_RATE_OPEN = '(Rate: ';
/** Closing bracket for the rating in movie history entries. */
export const ENT_HISTORY_RATE_CLOSE = ')';
/** History status label when a movie was added. */
export const ENT_HISTORY_STATUS_ADDED = 'added';
/** History status label when a movie was deleted. */
export const ENT_HISTORY_STATUS_DELETED = 'deleted';
/** Prefix for history entries that record a standalone rate search. */
export const ENT_HISTORY_SEARCH_STARTED = 'New rate search was started on ';
/** Search log prefix when starting to look up a movie's rate. */
export const ENT_LOG_START_SEARCHING = 'Start searching for ';
/** Search log prefix before the movie name in a rate-change entry. */
export const ENT_LOG_RATE_PRE = 'The rate of ';
/** Search log connector between the movie name and the rate-change span. */
export const ENT_LOG_RATE_IS = ' is ';
/** Search log connector between the change direction word and the numeric diff. */
export const ENT_LOG_RATE_BY = ' by ';
/** Search log connector after the closing span tag, before the new rate value. */
export const ENT_LOG_RATE_TO = '</span> to ';
/** Search log suffix for a movie whose rate did not change. */
export const ENT_LOG_RATE_SAME = ' stays the same';
/** Display word for an upward rate change inside the search log span. */
export const ENT_LOG_RATE_UP = 'increased';
/** Display word for a downward rate change inside the search log span. */
export const ENT_LOG_RATE_DOWN = 'decreased';
/** Search log summary header shown after all movies are processed. */
export const ENT_LOG_SUMMARY_HEADER = '📊 Search Summary';
/** Search log summary label for movies whose rate increased. */
export const ENT_LOG_RATE_INCREASED_LABEL = '⬆ Rate Increased';
/** Search log summary label for movies whose rate decreased. */
export const ENT_LOG_RATE_DECREASED_LABEL = '⬇ Rate Decreased';
/** Search log placeholder when no movies fall into a summary category. */
export const ENT_LOG_NONE = 'None';
/** Search log suffix appended when a movie is skipped during a rate search. */
export const ENT_LOG_SKIPPING = '. SKIPPING.';

export const RATE_LABEL_EXCELLENT = 'Excellent';
export const RATE_LABEL_GOOD = 'Good';
export const RATE_LABEL_AVERAGE = 'Average';
export const RATE_LABEL_POOR = 'Poor';

/* ─────────────────────────────────────────
   Resonance page constants
───────────────────────────────────────── */

export const RESONANCE_MSG_DELETE_CONFIRM = 'Are you sure you want to delete this quote?';
export const RESONANCE_DIALOG_TITLE_DELETE = 'Delete Quote';
export const RESONANCE_MSG_POSTED = 'Posted';
export const RESONANCE_AUTHOR_ANONYMOUS = 'Anonymous';
export const RESONANCE_LABEL_VOICES = 'voices';
export const RESONANCE_SUBTITLE = 'A quiet refuge where every word finds its power';
export const RESONANCE_PLACEHOLDER_QUOTE = 'Write something worth remembering...';
export const RESONANCE_PLACEHOLDER_NAME = 'Your name (optional)';
export const RESONANCE_BTN_POST = 'Post';
export const RESONANCE_EMPTY_TEXT = 'No voices yet. Yours could be the first to resonate.';
export const RESONANCE_ARIA_DELETE = 'Delete quote';
export const RESONANCE_MSG_OVER_LIMIT_PREFIX = 'Your quote exceeds';
export const RESONANCE_MSG_OVER_LIMIT_SUFFIX = 'characters. Please shorten it before posting.';

/* ─────────────────────────────────────────
   Recipe page constants
───────────────────────────────────────── */

/** Confirm-discard title shown when the user clicks Cancel on the add-recipe screen. */
export const RECIPE_DISCARD_TITLE = 'Discard Recipe';
/** Confirm-discard message body for the add-recipe screen. */
export const RECIPE_DISCARD_MESSAGE = 'Discard this recipe?\nAny changes will be lost.';
/** Confirm button label for the discard dialog. */
export const RECIPE_DISCARD_BTN = 'Discard';
/** Confirm-discard title shown when the user clicks back on the edit-recipe screen. */
export const RECIPE_DISCARD_CHANGES_TITLE = 'Discard Changes';
/** Confirm-discard message body for the edit-recipe screen. */
export const RECIPE_DISCARD_CHANGES_MESSAGE = 'Unsaved changes will be lost.';
/** Confirm-delete title shown when the user clicks Delete Recipe in edit mode. */
export const RECIPE_DELETE_TITLE = 'Delete Recipe';
/** Confirm-delete message body. */
export const RECIPE_DELETE_MESSAGE = 'Proceed with deleting this recipe?\nThis cannot be undone.';
/** Dialog title for the ingredient type manager in the editor. */
export const RECIPE_ITYPE_DIALOG_TITLE = 'Manage Ingredient Types';
export const RECIPE_MSG_INGREDIENT_UNIT_REQUIRED = 'Some ingredients have a quantity but are missing a unit.';
export const RECIPE_MSG_LOAD_FAILED = 'Failed to load recipes';
export const RECIPE_MSG_ADDED = 'Recipe saved';
export const RECIPE_MSG_UPDATED = 'Recipe updated';
export const RECIPE_MSG_DELETED = 'Recipe deleted';
export const RECIPE_MSG_SAVE_FAILED_DETAIL = 'Could not save the recipe. Please try again.';
export const RECIPE_MSG_DELETE_FAILED_DETAIL = 'Could not delete the recipe. Please try again.';
export const RECIPE_MSG_NAME_TOO_LONG = 'Recipe name must not exceed 9 Chinese characters in length.';
export const RECIPE_MSG_CATEGORY_REQUIRED = 'Please select a category before saving.';

/** Shared "All" filter label used across pages (Recipe, Reminder). */
export const LABEL_ALL = 'All';
export const RECIPE_CATEGORY_CHINESE = 'Chinese';
export const RECIPE_CATEGORY_WESTERN = 'Western';
export const RECIPE_CATEGORY_QUICK = 'Quick';
export const RECIPE_CATEGORY_DESSERT = 'Dessert';
export const RECIPE_PLACEHOLDER_CATEGORY = 'Choose category…';

export const RECIPE_EYEBROW = 'Personal Cookbook';
export const RECIPE_SUBTITLE = 'Your personal cookbook';
export const RECIPE_PLACEHOLDER_SEARCH = 'Search recipes…';
export const RECIPE_EMPTY_SEARCH = 'No recipes match your search';
export const RECIPE_BTN_VIEW = 'View Recipe →';
export const RECIPE_ARIA_DEC_SERVINGS = 'decrease servings';
export const RECIPE_ARIA_INC_SERVINGS = 'increase servings';
export const RECIPE_PLACEHOLDER_TITLE = 'Untitled recipe…';
export const RECIPE_PLACEHOLDER_INGREDIENT = 'Ingredient name';
export const RECIPE_PLACEHOLDER_QTY = 'qty';
export const RECIPE_PLACEHOLDER_UNIT = 'unit *';
export const RECIPE_SUFFIX_MIN = 'min';
export const RECIPE_SUFFIX_SERVINGS = 'servings';
export const RECIPE_BTN_ADD = 'Add Recipe';
export const RECIPE_BTN_EDIT = 'Edit Recipe';
export const RECIPE_BTN_SAVE = 'Save Recipe';
export const RECIPE_BTN_SAVE_CHANGES = 'Save Changes';
export const RECIPE_LABEL_SERVES = 'Serves';
export const RECIPE_LABEL_INGREDIENTS = 'Ingredients';
export const RECIPE_LABEL_STEPS = 'Steps';
export const RECIPE_LABEL_NOTES = 'Notes & Tips';
export const RECIPE_BTN_ADD_INGREDIENT = '+ Add ingredient';
export const RECIPE_BTN_ADD_SUBPOINT = '+ Add sub-point';
export const RECIPE_BTN_ADD_STEP = '+ Add step';
export const RECIPE_BADGE_EXAMPLE = 'Example';
export const RECIPE_TOOLTIP_REMOVE = 'Remove';
export const RECIPE_TOOLTIP_REMOVE_STEP = 'Remove step';
export const RECIPE_TOOLTIP_MANAGE_TYPES = 'Manage ingredient types';
export const RECIPE_TOOLTIP_DRAG_REORDER = 'Drag to reorder';
export const RECIPE_PLACEHOLDER_STEP = 'Describe this step…';
export const RECIPE_PLACEHOLDER_SUBPOINT = 'Sub-point (optional)';
export const RECIPE_PLACEHOLDER_NOTES = 'Tips, tweaks, or things to remember next time…';
export const RECIPE_EDITOR_TYPE_SELECTED = 'selected';
export const RECIPE_EDITOR_TYPE_HINT =
	'Choose which ingredient types appear in the recipe editor. At least one must be selected.';
export const INGREDIENT_BTN_APPLY = 'Apply';
export const RECIPE_ITYPE_LABELS: Record<string, string> = {
	veg: 'Vegetables', meat: 'Meat', seas: 'Seasoning', dairy: 'Dairy',
	grain: 'Grain', liq: 'Liquid', spice: 'Spice', seafood: 'Seafood',
	egg: 'Eggs', nut: 'Nuts', fruit: 'Fruit', oil: 'Oil',
	herb: 'Herb', fungi: 'Fungi', sweet: 'Sweetener', condiment: 'Condiment',
};

/* ─────────────────────────────────────────
   Portal page constants
───────────────────────────────────────── */

export const PORTAL_MSG_LINK_UPDATED = 'Link updated';
export const PORTAL_MSG_LINK_SAVED = 'Link saved';
export const PORTAL_MSG_SAVING_LINK = 'Saving link...';
export const PORTAL_MSG_SAVING_CATEGORY = 'Saving category...';
export const PORTAL_MSG_LINK_SAVE_FAILED_DETAIL = 'Could not save the link. Please try again.';
export const PORTAL_MSG_LINK_DELETED = 'Link deleted';
export const PORTAL_MSG_LINK_DELETE_FAILED_DETAIL = 'Could not delete the link. Please try again.';
export const PORTAL_MSG_NAME_REQUIRED = 'Name required';
export const PORTAL_MSG_CATEGORY_UPDATED = 'Category updated';
export const PORTAL_MSG_CATEGORY_ADDED = 'Category added';
export const PORTAL_MSG_CATEGORY_SAVE_FAILED_DETAIL = 'Could not save the category. Please try again.';
export const PORTAL_MSG_CATEGORY_DELETED = 'Category deleted';
export const PORTAL_MSG_CATEGORY_DELETE_FAILED_DETAIL = 'Could not delete the category. Please try again.';
export const PORTAL_MSG_DELETE_LINK_TITLE = 'Delete Link';
export const PORTAL_MSG_DELETE_CATEGORY_TITLE = 'Delete Category';
/** Confirm-delete message prefix for a Portal link; link title is appended at the call site. */
export const PORTAL_MSG_DELETE_LINK_CONFIRM_PREFIX = 'Are you sure you want to delete "';
/** Confirm-delete message suffix for a Portal link. */
export const PORTAL_MSG_DELETE_LINK_CONFIRM_SUFFIX = '"?';
/** Confirm-delete message prefix for a Portal category; category name is appended at the call site. */
export const PORTAL_MSG_DELETE_CATEGORY_CONFIRM_PREFIX = 'Are you sure you want to delete category "';
/** Confirm-delete message suffix for a Portal category. */
export const PORTAL_MSG_DELETE_CATEGORY_CONFIRM_SUFFIX =
	'"? Links in this category will become uncategorised.';
export const PORTAL_MSG_LOAD_LINKS_FAILED = 'Failed to load useful links';
export const PORTAL_MSG_LOAD_CATEGORIES_FAILED = 'Failed to load link categories';
export const PORTAL_MSG_SAVE_LINK_FAILED = 'Failed to save link';
export const PORTAL_MSG_SAVE_CATEGORY_FAILED = 'Failed to save category';
export const PORTAL_MSG_RESET_CONFIRM = 'Proceed with resetting the dates?';
export const PORTAL_BTN_BATCH = 'Batch';
export const PORTAL_BTN_ADD_LINK = 'Add Link';
/** Shared "Add Link" label used for dialog titles and buttons. */
export const LABEL_ADD_LINK = 'Add Link';
/** Shared "Add" button label used across multiple pages. */
export const BTN_ADD = 'Add';

/** Dialog title when adding a new link. */
export const PORTAL_DIALOG_TITLE_ADD_LINK = 'Add Link';
/** Dialog title when editing an existing link. */
export const PORTAL_DIALOG_TITLE_EDIT_LINK = 'Edit Link';
/** Dialog title when adding a new category. */
export const PORTAL_CATEGORY_DIALOG_TITLE_ADD = 'New Category';
/** Dialog title when editing an existing category. */
export const PORTAL_CATEGORY_DIALOG_TITLE_EDIT = 'Edit Category';
/** Shared "Name" label used in category and debt dialogs. */
export const LABEL_NAME = 'Name';
/** Placeholder for the category name input field. */
export const PORTAL_CATEGORY_DIALOG_PLACEHOLDER_NAME = 'e.g. Study, Tools, Dev';
/** Label for the isPinned checkbox in the add/edit link dialog. */
export const PORTAL_LABEL_PIN_TO_DASHBOARD = 'Pin to dashboard';
/** Label for the isShared checkbox in the add link dialog. */
export const PORTAL_LABEL_SHARED_LINK = 'Shared link (visible to all users)';
/** Section header label for links visible to all users. */
export const PORTAL_SECTION_SHARED = 'Shared';
/** Section header label for links belonging to the current user. */
export const PORTAL_SECTION_MY_LINKS = 'My Links';
/** Section meta suffix for the Shared links row count. */
export const PORTAL_SECTION_SHARED_SUFFIX = 'links · visible to everyone';
/** Section meta suffix for the My Links row count. */
export const PORTAL_SECTION_MY_LINKS_SUFFIX = 'links · only you can see these';
/** Empty-state message shown when the Shared section has no links. */
export const PORTAL_SECTION_SHARED_EMPTY = 'No shared links here yet';
/** Empty-state message shown when the My Links section has no links. */
export const PORTAL_SECTION_MY_LINKS_EMPTY = 'No links here yet';
export const LINK_DIALOG_LABEL_TITLE_LOADING = 'Loading title…';
export const PORTAL_LABEL_CURRENT_MONTH = 'Current Month';
export const PORTAL_LABEL_NEXT_MONTH = 'Next Month';
export const PORTAL_LABEL_RESET = 'Reset';
export const PORTAL_LABEL_CELL_DONE = 'Done';
export const PORTAL_LABEL_CELL_TODAY = 'Today';

export const MULTI_LINK_DIALOG_TITLE = 'Add multiple links';
export const MULTI_LINK_DIALOG_SUBTITLE = "Paste a batch of URLs — we'll fetch each icon automatically.";
/** Shared "Category" label used in multi-link and debt dialogs. */
export const LABEL_CATEGORY = 'Category';
export const MULTI_LINK_LABEL_APPLIES_PREFIX = '· applies to all ';
export const MULTI_LINK_LABEL_LINK = 'link';
export const MULTI_LINK_LABEL_LINKS = 'links';
export const MULTI_LINK_LABEL_PASTE = 'Paste links';
export const MULTI_LINK_PLACEHOLDER_PASTE =
	'Paste your links here — one per line, comma, or semicolon\n\nhttps://github.com\nfigma.com\nlinear.app';
export const MULTI_LINK_LABEL_LINK_FOUND = 'link found';
export const MULTI_LINK_LABEL_LINKS_FOUND = 'links found';
export const MULTI_LINK_LABEL_EMPTY = 'Links will appear here';
export const MULTI_LINK_LABEL_EMPTY_HINT = 'Paste URLs on the left to preview them with fetched icons.';
export const PORTAL_MSG_MULTI_LINK_SAVED = 'Links saved';
export const PORTAL_MSG_SAVING_LINKS = 'Saving links...';
export const PORTAL_MSG_MULTI_LINK_SAVE_FAILED_DETAIL = 'Could not save the links. Please try again.';
export const PORTAL_SUBTITLE = 'Your links & resources command center';
export const PORTAL_LABEL_DATE_CALCULATOR = 'Date Calculator';
export const PORTAL_TABLE_HEADER_FIRST = 'First';
export const PORTAL_TABLE_HEADER_SECOND = 'Second';
export const PORTAL_TABLE_HEADER_THIRD = 'Third';
export const PORTAL_TABLE_HEADER_FOURTH = 'Fourth';
export const PORTAL_BTN_TITLE_EDIT_CATEGORY = 'Edit category';
export const PORTAL_BTN_TITLE_NEW_CATEGORY = 'New category';
/** Shared "Edit" label used in portal and patch notes. */
export const LABEL_EDIT = 'Edit';
export const ADD_LINK_LABEL_LOADING = 'fetching…';
export const ADD_LINK_LABEL_TITLE = 'Title *';
export const ADD_LINK_PLACEHOLDER_NAME = 'My favourite resource';
export const ADD_LINK_LABEL_CATEGORY = 'Category *';
export const ADD_LINK_LABEL_CATEGORY_OPTIONAL = 'Category';
export const ADD_LINK_HINT_CATEGORY_SHARED = 'Disabled because this link is shared';
export const ADD_LINK_PLACEHOLDER_CATEGORY = 'Select a category';

/* ─────────────────────────────────────────
   Reminder page constants
───────────────────────────────────────── */

/** Confirmation message shown before deleting a reminder entry. */
export const REMINDER_MSG_DELETE_CONFIRM = 'Proceed with deleting this entry?\nThis cannot be undone.';
/** Confirmation prompt shown before completing (and removing) a reminder. */
export const REMINDER_MSG_COMPLETE_CONFIRM = 'Mark this reminder as done?\nIt will be removed and counted as completed.';
/** Header title for the complete-reminder confirmation dialog. */
export const REMINDER_COMPLETE_TITLE = 'Complete';
/** Progress message shown in the blocking overlay while a reminder deletion is in flight. */
export const REMINDER_MSG_DELETING = 'Deleting reminder...';
/** Progress message shown in the blocking overlay while a reminder completion is in flight. */
export const REMINDER_MSG_COMPLETING = 'Completing reminder...';
/** Error shown when a custom tag name conflicts with an existing tag. */
export const REMINDER_MSG_TAG_DUPLICATE = 'This name already belongs to an existing tag.';
/** Placeholder for the reminder message text input. */
export const REMINDER_PLACEHOLDER_TEXT = 'What should we remind you about…';
/** Placeholder for the new-tag inline input. */
export const REMINDER_PLACEHOLDER_TAG = 'tag…';
/** Ghost button label for adding a link to a reminder card. */
export const REMINDER_ADD_LINK_LABEL = 'Add link';
/** Ghost button label for adding a date to a reminder card. */
export const REMINDER_ADD_DATE_LABEL = 'Add date';
/** Ghost button label for adding a start/end time to a reminder card. */
export const REMINDER_ADD_TIME_LABEL = 'Add time';
/** Placeholder for the start-time selector in the reminder time row. */
export const REMINDER_START_TIME_LABEL = 'Start';
/** Placeholder for the end-time selector in the reminder time row. */
export const REMINDER_END_TIME_LABEL = 'End';
/** Section label above the filter chips. */
export const REMINDER_FILTER_LABEL = 'FILTER';
/** Primary label on the due-soon stat card. */
export const REMINDER_DUE_SOON_LABEL = 'due soon';
/** Singular reminder unit used in the open-item greeting. */
export const REMINDER_GREETING_SINGULAR = 'reminder';
/** Plural reminder unit used in the open-item greeting. */
export const REMINDER_GREETING_PLURAL = 'reminders';
/** Greeting label for the count of the user's own reminders they have completed. */
export const REMINDER_GREETING_COMPLETED = 'completed';
/** Greeting label for the count of shared reminders completed across the user's link. */
export const REMINDER_GREETING_SHARED_COMPLETED = 'shared done';

/** Display name for the third reminder table — used in stat writes and the Recent Activity widget. */
export const REMINDER_TABLE_MESSAGES = 'Messages';
export const REMINDER_CATEGORY_WORK = 'Work';
export const REMINDER_CATEGORY_UTILITY = 'Utility';
export const REMINDER_CATEGORY_OTHER = 'Other';
/** Label for the chip that opens the free-text custom tag input. */
export const REMINDER_CHIP_CUSTOM = 'Custom';
/** Label for the filter button that shows only shared reminder items. */
export const REMINDER_CHIP_SHARED = 'Shared';
/** Label for the new-item toggle that marks a reminder shared on creation. */
export const REMINDER_SHARE_LABEL = 'Share';
/** Tooltip on the pending-share badge shown on armed items while the user has no connections. */
export const REMINDER_SHARE_TOOLTIP_PENDING = 'Will be shared when you connect an account';
/** Title for push notifications sent when a reminder is due in 3 days. */
export const REMINDER_NOTIF_TITLE_3DAY = 'Due in 3 days';
/** Title for push notifications sent when a reminder is due today. */
export const REMINDER_NOTIF_TITLE_TODAY = 'Due today';

/* ─────────────────────────────────────────
   Debt Sonata page constants
───────────────────────────────────────── */

export const DEBT_DIALOG_TITLE = 'New debt';
export const DEBT_DIALOG_PLACEHOLDER_NAME = 'e.g. Visa Platinum';
export const DEBT_DIALOG_LABEL_ADD = 'Add debt';
export const DEBT_DIALOG_LABEL_CANCEL = 'Cancel';
export const DEBT_DIALOG_LABEL_PERMANENT = 'Permanent account';
export const DEBT_DIALOG_LABEL_PERMANENT_DESC = 'Protected from deletion — stays until you remove the lock';
export const DEBT_TOOLTIP_UNLOCK = 'Permanent — click to unlock';
export const DEBT_TOOLTIP_MARK_PERMANENT = 'Mark as permanent';
export const DEBT_DIALOG_LABEL_CURRENCY_CNY = '¥ CNY';
export const DEBT_DIALOG_LABEL_CURRENCY_CAD = '$ CAD';
export const DEBT_EMPTY_STATE_MSG = 'No debts here. Add one to start tracking — or enjoy being debt-free.';
export const DEBT_EMPTY_STATE_BTN = 'Add a debt';
export const DEBT_LABEL_DELETE_CONFIRM = 'Delete?';
export const DEBT_CONFIRM_DELETE_PAYMENT_MSG = 'Remove this payment?';
export const DEBT_CONFIRM_DELETE_PAYMENT_HEADER = 'Remove payment';
export const DEBT_CONFIRM_DELETE_PAYMENT_BTN = 'Remove';
export const DEBT_MSG_PAYING = 'Saving payment...';
export const DEBT_MSG_DELETING_PAYMENT = 'Removing payment...';
export const DEBT_MSG_RESETTING = 'Resetting debt...';
export const DEBT_DIALOG_LABEL_EDIT = 'Set debt';
export const DEBT_DIALOG_LABEL_SAVE = 'Set';
export const DEBT_DIALOG_LABEL_BALANCE = 'New amount';
export const DEBT_DUE_LABEL_NONE = 'No due date';
export const DEBT_DUE_LABEL_TODAY = 'Due today';
export const DEBT_DUE_LABEL_TOMORROW = 'Due tomorrow';
export const DEBT_SUBTITLE = 'Where every repayment is a brushstroke — and a closing line.';
export const DEBT_STAT_LABEL_TOTAL = 'TOTAL DEBT';
export const DEBT_STAT_LABEL_DEBTS = 'DEBTS';
export const DEBT_STAT_LABEL_ACTIVE = 'ACTIVE';
export const DEBT_STAT_LABEL_PAID_OFF = 'PAID OFF';
export const DEBT_STAT_LABEL_DUE_SOON = 'DUE SOON';
export const DEBT_STAT_LABEL_OVERDUE = 'OVERDUE';
export const DEBT_STAT_LABEL_PAYMENTS = 'PAYMENTS';
export const DEBT_HEADING_YOUR_DEBTS = 'Your debts';
export const DEBT_BTN_SET = 'Set';
export const DEBT_BTN_RESET = 'Reset';
/** Label on the reset button after the user has tapped it once, confirming the restore action. */
export const DEBT_BTN_RESTORE = 'Restore?';
export const DEBT_BTN_HISTORY = 'History';
export const DEBT_HISTORY_EMPTY = 'No payments yet — chip away at it above.';
export const ADD_DEBT_LABEL_AMOUNT = 'Amount';
export const ADD_DEBT_LABEL_CURRENCY = 'Currency';
export const ADD_DEBT_LABEL_DUE_DATE = 'Due date';
export const MONTH_NAMES_SHORT: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DEBT_CATEGORY_LABEL_CARD = 'Credit card';
/** Shared "Personal" label used in debt category and reminder category. */
export const LABEL_PERSONAL = 'Personal';
export const DEBT_CATEGORY_LABEL_FINANCING = 'Financing';
export const DEBT_CATEGORY_LABEL_MORTGAGE = 'Mortgage';
export const DEBT_LABEL_PCT_CLEARED = '% cleared';
export const DEBT_LABEL_PCT_PAID = '% paid';
export const DEBT_LABEL_OF = 'of';
export const DEBT_LABEL_REMAINING_OF = 'remaining of';
export const DEBT_LABEL_PAID_IN_FULL = 'Coda · paid in full';
export const DEBT_LABEL_CUSTOM_PAY = 'Custom';
export const DEBT_DAYS_LEFT_SUFFIX = 'd left';
export const DEBT_DAYS_OVERDUE_PREFIX = '';
export const DEBT_DAYS_OVERDUE_SUFFIX = 'd overdue';

/* ─────────────────────────────────────────
   Patch Notes page constants
───────────────────────────────────────── */

export const PATCH_MSG_DELETE_CONFIRM = 'Proceed with deleting this note?';

export const STATUS_TODO = 'To Do';
export const STATUS_IN_PROGRESS = 'In Progress';
export const STATUS_COMPLETED = 'Completed';
export const STATUS_DEBUG = 'Debug';
export const STATUS_DRAFT = 'Draft';
export const STATUS_RESOLVED = 'Resolved';

export const PATCH_LABEL_PATCH_NOTES = 'Sprint Notes';
export const PATCH_LABEL_RELEASE_NOTES = 'Release Notes';
export const PATCH_SWITCH_PREFIX_SPRINT = 'Sprint';
export const PATCH_SWITCH_PREFIX_RELEASE = 'Release';
export const PATCH_SWITCH_NOTES = 'Notes';
export const PATCH_SUBTITLE_PATCH_NOTES = 'Development history and open items';
export const PATCH_SUBTITLE_RELEASE_NOTES = 'Published versions and release history';
export const PATCH_EYEBROW = 'Progress Tracker';
export const PATCH_PLACEHOLDER_SEARCH = 'Search patch notes…';
export const PATCH_TABLE_HEADER_COMPONENT = 'Component';
export const PATCH_TABLE_HEADER_ELEMENT = 'Element';
export const PATCH_TABLE_HEADER_DETAILS = 'Details';
export const PATCH_TABLE_HEADER_TIMESTAMP = 'TimeStamp';
export const PATCH_EMPTY_SEARCH = 'No patch notes match your search';
export const PATCH_LABEL_PREVIOUS_RELEASES = 'Previous releases';
export const PATCH_STAT_TOTAL = 'total';
export const PATCH_STAT_BUGS_RESOLVED = 'bugs resolved';
export const PATCH_STAT_IN_PROGRESS = 'in progress';
export const PATCH_STAT_OPEN_BUGS = 'open bugs';
export const PATCH_PAGINATION_TEMPLATE = 'Showing {first} to {last} of {totalRecords}';
export const PATCH_COL_STATUS = 'Status';
export const PATCH_BTN_CLEAR_FILTER = 'Clear Filter';
export const PATCH_DROPDOWN_ALL_PAGES = 'All Pages';
export const PATCH_DROPDOWN_ACCOUNT = 'Account';
export const PATCH_HEATMAP_TITLE = 'Activity by month';
export const PATCH_HEATMAP_LEGEND_LESS = 'Less';
export const PATCH_HEATMAP_LEGEND_MORE = 'More';
export const PATCH_HEATMAP_FOOTER_FUTURE = 'Future months dimmed';
export const PATCH_HEATMAP_FOOTER_ITEMS = 'items logged across';
export const PATCH_HEATMAP_FOOTER_YEARS = 'years';

/* ─────────────────────────────────────────
   Context menu
───────────────────────────────────────── */

export const CTX_LABEL_COPY = 'Copy';
export const CTX_LABEL_CUT = 'Cut';
export const CTX_LABEL_PASTE = 'Paste';
export const CTX_LABEL_SELECT_ALL = 'Select All';
export const CTX_LABEL_MY_ACCOUNT = 'My account';
export const CTX_LABEL_INSPECT = 'Inspect';
export const CTX_SEARCH_PLACEHOLDER = 'Search…';
export const CTX_LABEL_NO_RESULTS = 'No results';

/* ─────────────────────────────────────────
   Account page
───────────────────────────────────────── */

export const ACCOUNT_TITLE_PAGE = 'My Account';
export const ACCOUNT_LABEL_PROFILE_TAGLINE = 'Living intentionally, one entry at a time.';
export const ACCOUNT_LABEL_MEMBER_SINCE = 'Member Since';
export const ACCOUNT_LABEL_STREAK_SUFFIX = ' Day Streak';
export const ACCOUNT_LABEL_VERIFIED = 'Verified';
export const ACCOUNT_MSG_NO_EMAIL = 'No email address';
export const ACCOUNT_LABEL_IDENTITY_TITLE = 'Identity';
export const ACCOUNT_LABEL_INNER_WORLD_TITLE = 'Inner World';
export const ACCOUNT_LABEL_MILESTONES_TITLE = 'Milestones';
export const ACCOUNT_LABEL_DANGER_ZONE_TITLE = 'Danger Zone';
export const ACCOUNT_MSG_COMING_SOON = 'This will be available in a future release.';
export const ACCOUNT_LABEL_SECURITY_TITLE = 'Security';
export const ACCOUNT_LABEL_LAST_LOGIN = 'Last sign-in';
export const ACCOUNT_LABEL_USERNAME_CHANGED = 'Username last changed';
export const ACCOUNT_LABEL_PASSWORD_CHANGED = 'Password last changed';
export const ACCOUNT_LABEL_UPDATE_USERNAME = 'Update Username';
export const ACCOUNT_PLACEHOLDER_USERNAME = 'Enter your username';
export const ACCOUNT_MSG_USERNAME_UPDATED = 'Username updated';
export const ACCOUNT_LABEL_CONNECTIONS_TITLE = 'Connections';
export const ACCOUNT_LABEL_CONNECT_CODE = 'Connect code';
export const ACCOUNT_LABEL_COPY = 'Copy';
export const ACCOUNT_MSG_CODE_COPIED = 'Connect code copied';
export const ACCOUNT_LABEL_CONNECTED_TITLE = 'Connected accounts';
export const ACCOUNT_PLACEHOLDER_CONNECT_CODE = 'Enter a connect code';
export const ACCOUNT_LABEL_SEND_REQUEST = 'Send request';
export const ACCOUNT_LABEL_APPROVE = 'Approve';
export const ACCOUNT_LABEL_DECLINE = 'Decline';
export const ACCOUNT_LABEL_DISCONNECT = 'Disconnect';
export const ACCOUNT_LABEL_NO_CONNECTIONS = 'No connected accounts yet';
export const ACCOUNT_LABEL_LINK_ACCOUNT = 'Link an account';
export const ACCOUNT_LABEL_REQUESTS = 'Requests';
export const ACCOUNT_STATUS_PENDING = 'Pending';
export const ACCOUNT_STATUS_CONNECTED = 'Connected';
export const ACCOUNT_STATUS_DECLINED = 'Declined';
export const ACCOUNT_STATUS_LEFT = 'Left';
export const ACCOUNT_MSG_REQUEST_SENT = 'Request sent';
export const ACCOUNT_MSG_REQUEST_CANCELED = 'Request canceled';
export const ACCOUNT_MSG_REQUEST_FAILED = 'Could not send request';
export const ACCOUNT_MSG_INVALID_CODE = 'Invalid code';
export const ACCOUNT_MSG_SELF_CODE = 'That code is your own';
export const ACCOUNT_MSG_ALREADY_CONNECTED = 'Already connected';
export const ACCOUNT_MSG_ALREADY_REQUESTED = 'Request already sent';
export const ACCOUNT_MSG_CONNECTED = 'Accounts connected';
export const ACCOUNT_MSG_DISCONNECTED = 'Disconnected';
export const ACCOUNT_LABEL_CHANGE_PASSWORD = 'Change Password';
export const ACCOUNT_LABEL_OLD_PASSWORD = 'Current password';
export const ACCOUNT_LABEL_CONFIRM_PASSWORD = 'Confirm password';
export const ACCOUNT_LABEL_UPDATE_PASSWORD = 'Update Password';
export const ACCOUNT_LABEL_DELETE_ACCOUNT = 'Delete Account';
export const ACCOUNT_LABEL_DELETE_DESCRIPTION =
	'Permanently removes your account and all data.\nThis cannot be undone.';
export const ACCOUNT_MSG_PASSWORD_UPDATED = 'Password updated';
export const ACCOUNT_MSG_PASSWORD_TOO_SHORT = 'Password must be at least 6 characters.';
export const ACCOUNT_MSG_PASSWORD_MISMATCH = 'Passwords do not match.';
export const ACCOUNT_MSG_DELETE_CONFIRMED = 'Account deletion requested';
export const ACCOUNT_MSG_DELETING_ACCOUNT = 'Deleting account...';
export const ACCOUNT_DIALOG_DELETE_PWD_PLACEHOLDER = 'Enter your password to confirm';
export const ACCOUNT_DIALOG_DELETE_MSG =
	'This will permanently delete your account and all associated data. This action cannot be undone.';
export const ACCOUNT_STAT_LABEL_FILMS = 'Films Logged';
export const ACCOUNT_STAT_LABEL_QUOTES = 'Quotes';
export const ACCOUNT_STAT_LABEL_DEBTS = 'Debts Tracked';
export const ACCOUNT_STAT_LABEL_LINKS = 'Links Saved';
export const ACCOUNT_STAT_UNIT_FILM = 'film';
export const ACCOUNT_STAT_UNIT_QUOTE = 'quote';
export const ACCOUNT_STAT_UNIT_RECIPE = 'recipe';
export const ACCOUNT_STAT_UNIT_REMINDER = 'reminder';
export const ACCOUNT_STAT_UNIT_DEBT = 'debt';
export const ACCOUNT_STAT_UNIT_LINK = 'link';
export const ACCOUNT_MILESTONE_ACCOUNT_CREATED_TITLE = 'Account Created';
export const ACCOUNT_MILESTONE_ACCOUNT_CREATED_NOTE = 'Welcome to Inner World.';
export const ACCOUNT_MILESTONE_FILM_TITLE = 'First Film Logged';
export const ACCOUNT_MILESTONE_FILM_NOTE = 'The cinephile journey begins.';
export const ACCOUNT_MILESTONE_QUOTE_TITLE = 'First Quote Saved';
export const ACCOUNT_MILESTONE_QUOTE_NOTE = 'A mind full of words.';
export const ACCOUNT_MILESTONE_RECIPE_TITLE = 'First Recipe Created';
export const ACCOUNT_MILESTONE_RECIPE_NOTE = 'Cooking gets tracked.';
export const ACCOUNT_MILESTONE_REMINDER_TITLE = 'First Reminder Set';
export const ACCOUNT_MILESTONE_REMINDER_NOTE = 'Never miss a thing.';
export const ACCOUNT_MILESTONE_DEBT_TITLE = 'First Debt Tracked';
export const ACCOUNT_MILESTONE_DEBT_NOTE = 'Financial clarity starts here.';
export const ACCOUNT_MILESTONE_LINK_TITLE = 'First Link Saved';
export const ACCOUNT_MILESTONE_LINK_NOTE = 'The first breadcrumb.';
export const ACCOUNT_MILESTONE_STREAK_TITLE = 'First Day Active';
export const ACCOUNT_MILESTONE_STREAK_NOTE = 'Every journey starts here.';
export const ACCOUNT_DOMAIN_FILMS = ' Films Logged';
export const ACCOUNT_DOMAIN_QUOTES = ' Quotes Saved';
export const ACCOUNT_DOMAIN_RECIPES = ' Recipes Created';
export const ACCOUNT_DOMAIN_REMINDERS = ' Reminders Set';
export const ACCOUNT_DOMAIN_DEBTS = ' Debts Tracked';
export const ACCOUNT_DOMAIN_LINKS = ' Links Saved';
export const ACCOUNT_DOMAIN_STREAK = '-Day Streak';
export const ACCOUNT_STRENGTH_TOO_SHORT = 'Too short';
export const ACCOUNT_STRENGTH_WEAK = 'Weak';
export const ACCOUNT_STRENGTH_FAIR = 'Fair';
export const ACCOUNT_STRENGTH_GOOD = 'Good';
export const ACCOUNT_STRENGTH_STRONG = 'Strong';

/* ─────────────────────────────────────────
   Today page
───────────────────────────────────────── */

export const TODAY_EYEBROW = "Today's Canvas";
export const TODAY_TITLE = 'Shape your hours.';
export const TODAY_SUBTITLE = 'Drag across the timeline to claim a moment';
export const TODAY_QUICKADD_PLACEHOLDER = 'Quick add an untimed task — or drag the calendar to schedule';
export const TODAY_HINT_DRAG_UNTIMED = 'drag a block here to make it untimed';
export const TODAY_PENDING_PLACEHOLDER = 'Name this task…';
export const TODAY_PENDING_HINT = '↵ save · Esc cancel';
export const TODAY_LABEL_TASKS = 'Tasks';
export const TODAY_LABEL_TRACKED = 'Tracked';
export const TODAY_LABEL_REMINDER_READONLY = 'REMINDER · read-only';
export const TODAY_BTN_START_TRACKING = 'Start tracking';
export const TODAY_BTN_STOP_TRACKING = 'Stop';
export const TODAY_BTN_DRAG_CREATE = 'Drag to create';
export const TODAY_BTN_DRAG_MOVE = 'Drag to move';
export const TODAY_BTN_CLEAR_ALL = 'Clear all';
/** Confirm-dialog body shown before wiping every locally created Today item. */
export const TODAY_CONFIRM_CLEAR_MESSAGE =
	'This removes every item you added on Today and clears its backup. This cannot be undone.';
/** Confirm-dialog header for the clear-all action. */
export const TODAY_CONFIRM_CLEAR_HEADER = 'Clear all items';
export const TODAY_TRACKING_PREFIX = 'Tracking · ';
/** Heading shown on the mobile-blocked card for the Today planner. */
export const NAV_MOBILE_ALL_SECTIONS = 'All sections';
export const NAV_MOBILE_WELCOME = 'Welcome';
export const NAV_MOBILE_OFFLINE = 'Offline · not signed in';
export const MOBILE_BLOCKED_TITLE = 'Not Accessible on Mobile';
/** Body text shown on the mobile-blocked card explaining that the Today planner requires a wider screen. */
export const MOBILE_BLOCKED_BODY =
	'The Today planner is built for wider screens. Open it on a desktop, laptop, or tablet to access your daily view.';
export const TODAY_RECUR_LABELS: Partial<Record<string, string>> = {
	daily: 'Daily', weekdays: 'Weekdays', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly',
};

/* ─────────────────────────────────────────
   Vault page
───────────────────────────────────────── */

/** Word for accounts in the Vault header subtitle and the selected-node stat pill. */
export const VAULT_LABEL_ACCOUNTS = 'accounts';
/** Label for the email/phone count stat pill on a selected account. */
export const VAULT_LABEL_IDENTIFIERS = 'email / phone';
/** Descriptive page subtitle shown beneath the Vault title. */
export const VAULT_PAGE_SUBTITLE = 'How your accounts, emails, and phones connect';
/** Placeholder shown in the Vault search field. */
export const VAULT_SEARCH_PLACEHOLDER = 'Search';
/** Label for the graph-view toggle tab. */
export const VAULT_TAB_GRAPH = 'Graph';
/** Label for the list-view toggle tab. */
export const VAULT_TAB_LIST = 'List';
/** Label for the header Add button. */
export const VAULT_BTN_ADD = 'Add';
/** Label for the link button on a selected account in the info bar. */
export const VAULT_BTN_ADD_CONNECTIONS = 'Add new connections';
/** Placeholder text shown in the category overview bar when no account has a category yet. */
export const VAULT_OVERVIEW_EMPTY = 'No categorized accounts yet';

/** Heading of the graph legend panel. */
export const VAULT_LEGEND_TITLE = 'Legend';
/** Legend row label for the count of verified accounts. */
export const VAULT_LEGEND_VERIFIED = 'Verified';
/** Type label for a website / app account (legend row and detail bar). */
export const VAULT_TYPE_ACCOUNT = 'Website account';
/** Type label for an email address identifier (legend row and detail bar). */
export const VAULT_TYPE_EMAIL = 'Email address';
/** Type label for a phone number identifier (legend row and detail bar). */
export const VAULT_TYPE_PHONE = 'Phone number';
/** Type label for a web-link identifier (legend row and detail bar). */
export const VAULT_TYPE_LINK = 'Link';

/** Accounts type-filter chip label. */
export const VAULT_FILTER_ACCOUNTS = 'Accounts';
/** Email type-filter chip label. */
export const VAULT_FILTER_EMAIL = 'Email';
/** Phone type-filter chip label. */
export const VAULT_FILTER_PHONE = 'Phone';
/** Link type-filter chip label (also reused as the add-dialog connection-type label). */
export const VAULT_FILTER_LINK = 'Link';

/** Edit button label on a list-view account card. */
export const VAULT_LIST_EDIT = 'Edit';
/** Done button label shown while editing a list-view account card. */
export const VAULT_LIST_DONE = 'Done';
/** Title shown on the empty-state card when the vault has no accounts yet. */
export const VAULT_EMPTY_TITLE = 'Your vault is empty';
/** Body shown on the empty-state card prompting the user to add an account. */
export const VAULT_EMPTY_BODY = 'Add an account to start mapping your connections';

/** Link-mode banner text shown before the source node is picked. */
export const VAULT_BANNER_START = 'Link mode · click a node to start';
/** Link-mode banner text shown after the source node is picked. */
export const VAULT_BANNER_SECOND = 'Now click the second node to link it';
/** Cancel button label on the link-mode banner. */
export const VAULT_BANNER_CANCEL = 'Cancel';

/** Title of the add-account dialog. */
export const VAULT_DIALOG_TITLE = 'Add an account';
/** Subtitle of the add-account dialog. */
export const VAULT_DIALOG_SUBTITLE = 'Name it, then attach any connections';
/** Field label for the account name input. */
export const VAULT_DIALOG_NAME_LABEL = 'Account name';
/** Placeholder for the account name input. */
export const VAULT_DIALOG_NAME_PLACEHOLDER = 'e.g. Spotify, my bank, work laptop…';
/** Field label for the category picker. */
export const VAULT_DIALOG_CATEGORY_LABEL = 'Category';
/** Field label for the verified/not-verified toggle in the add-account dialog. */
export const VAULT_DIALOG_VERIFIED_LABEL = 'Verified';
/** Label for the new-category chip. */
export const VAULT_DIALOG_NEW_CATEGORY = 'New category';
/** Placeholder for the inline new-category name input. */
export const VAULT_DIALOG_NEW_CATEGORY_PLACEHOLDER = 'Name, then Enter';
/** Field label for the connections section. */
export const VAULT_DIALOG_CONNECTIONS_LABEL = 'Connections';
/** Optional hint appended to the connections label. */
export const VAULT_DIALOG_CONNECTIONS_OPTIONAL = '(optional)';
/** Helper hint shown beside the connections label. */
export const VAULT_DIALOG_CONNECTIONS_HINT = 'type a name — existing or new';
/** Placeholder for each connection input row. */
export const VAULT_DIALOG_CONNECTION_PLACEHOLDER = 'Search or add a connection…';
/** Label for the add-another-connection button. */
export const VAULT_DIALOG_ADD_CONNECTION = 'Add connection';
/** Submit button label on the add-account dialog. */
export const VAULT_DIALOG_SUBMIT = 'Add to map';

/** Toast shown when an account is added to the vault. */
export const VAULT_MSG_ACCOUNT_SAVED = 'Account added';
/** Toast shown when a link is created between two nodes. */
export const VAULT_MSG_LINK_ADDED = 'Link added';
/** Toast shown when a link is removed. */
export const VAULT_MSG_LINK_REMOVED = 'Link removed';
/** Toast detail shown when a vault write fails. */
export const VAULT_MSG_SAVE_FAILED_DETAIL = 'Could not save to the vault. Please try again.';
/** Block-dialog message shown while a vault write is in flight. */
export const VAULT_MSG_SAVING = 'Saving…';
/** Block-dialog message shown while a link is being removed. */
export const VAULT_MSG_REMOVING_LINK = 'Removing link…';
/** Confirm-dialog title for deleting a vault node. */
export const VAULT_MSG_DELETE_NODE_TITLE = 'Delete Account';
/** Confirm-delete message prefix for a vault node; node name is appended at the call site. */
export const VAULT_MSG_DELETE_NODE_CONFIRM_PREFIX = 'Are you sure you want to delete "';
/** Confirm-delete message suffix for a vault node — also warns that connections are removed. */
export const VAULT_MSG_DELETE_NODE_CONFIRM_SUFFIX = '"? Its connections will also be removed.';
/** Toast shown when a node is removed from the vault. */
export const VAULT_MSG_NODE_REMOVED = 'Account removed';
/** Toast detail shown when a vault node removal fails. */
export const VAULT_MSG_REMOVE_NODE_FAILED_DETAIL = 'Could not delete the account. Please try again.';
/** Confirm dialog title for deleting a custom vault category. */
export const VAULT_MSG_DELETE_CATEGORY_TITLE = 'Delete Category';
/** Confirm dialog body for deleting a custom vault category. */
export const VAULT_MSG_DELETE_CATEGORY_CONFIRM = 'Delete this category? Its accounts move to Uncategorized.';
/** Toast shown after a custom vault category is removed. */
export const VAULT_MSG_CATEGORY_REMOVED = 'Category removed';
/** Toast detail shown when a vault category removal fails. */
export const VAULT_MSG_REMOVE_CATEGORY_FAILED_DETAIL = 'Could not delete the category. Please try again.';
/** Chip label for the fallback category used when no category is chosen. */
export const VAULT_CATEGORY_OTHER_LABEL = 'Other';
/** Full category label for uncategorized accounts. */
export const VAULT_CATEGORY_UNCATEGORIZED_LABEL = 'Uncategorized';
