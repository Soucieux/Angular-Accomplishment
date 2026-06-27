export * from '../constants';

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
export const NAV_LABEL_SIGN_OUT = 'Sign out';
export const NAV_LABEL_SIGN_IN = 'Sign in';
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
export const ORBITAL_PANEL_EMPTY_LINKS = 'No links yet';
export const ORBITAL_PANEL_EMPTY_PAYMENTS = 'No upcoming payments';
export const ORBITAL_PANEL_EMPTY_GENRES = 'No genre data yet';
export const ORBITAL_PANEL_EMPTY_RECIPES = 'No recipes yet';
export const ORBITAL_DAY_NAMES_SHORT: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const ORBITAL_QUICK_ACTION_LABELS: string[] = ['Add Movie', 'Add Quote', 'Add Recipe', 'Add Debt', 'Add Reminder', 'Add Shortcut'];
export const ORBITAL_GREETING_NIGHT = 'Good night';
export const ORBITAL_GREETING_MORNING = 'Good morning';
export const ORBITAL_GREETING_AFTERNOON = 'Good afternoon';
export const ORBITAL_GREETING_EVENING = 'Good evening';

/* ─────────────────────────────────────────
   Entertainment page constants
───────────────────────────────────────── */

/** Prefix for the delete-movie confirm message; movie name is appended at the call site. */
export const ENT_MSG_DELETE_CONFIRM_PREFIX = 'Are you sure you want to delete ';
export const ENT_DIALOG_TITLE_ADD_MOVIE = 'Add New Movie';
export const ADD_MOVIE_SUBTITLE = 'Enter either Name or ID to start searching';
export const ADD_MOVIE_LABEL_GENRE = 'Genre*';
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
export const ADD_LINK_PLACEHOLDER_NAME = 'My favourite resource';
export const ADD_LINK_LABEL_CATEGORY = 'Category *';
export const ADD_LINK_PLACEHOLDER_CATEGORY = 'Select a category';

/* ─────────────────────────────────────────
   Reminder page constants
───────────────────────────────────────── */

/** Confirmation message shown before deleting a reminder entry. */
export const REMINDER_MSG_DELETE_CONFIRM = 'Proceed with deleting this entry?\nThis cannot be undone.';
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
/** Section label above the filter chips. */
export const REMINDER_FILTER_LABEL = 'FILTER';
/** Primary label on the due-soon stat card. */
export const REMINDER_DUE_SOON_LABEL = 'due soon';
/** Singular reminder unit used in the open-item greeting. */
export const REMINDER_GREETING_SINGULAR = 'reminder';
/** Plural reminder unit used in the open-item greeting. */
export const REMINDER_GREETING_PLURAL = 'reminders';

/** Display name for the third reminder table — used in stat writes and the Recent Activity widget. */
export const REMINDER_TABLE_MESSAGES = 'Messages';
export const REMINDER_CATEGORY_WORK = 'Work';
export const REMINDER_CATEGORY_UTILITY = 'Utility';
export const REMINDER_CATEGORY_OTHER = 'Other';
/** Label for the chip that opens the free-text custom tag input. */
export const REMINDER_CHIP_CUSTOM = 'Custom';
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
export const DEBT_HISTORY_EMPTY = 'No payments yet — chip away at it above.';
export const ADD_DEBT_LABEL_AMOUNT = 'Amount';
export const ADD_DEBT_LABEL_CURRENCY = 'Currency';
export const ADD_DEBT_LABEL_DUE_DATE = 'Due date';
export const DEBT_MONTHS: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DEBT_CATEGORY_LABEL_CARD = 'Credit card';
/** Shared "Personal" label used in debt category and reminder category. */
export const LABEL_PERSONAL = 'Personal';
export const DEBT_CATEGORY_LABEL_FINANCING = 'Financing';

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

/* ─────────────────────────────────────────
   Account page
───────────────────────────────────────── */

export const ACCOUNT_TITLE_PAGE = 'My Account';
export const ACCOUNT_LABEL_PROFILE_TAGLINE = 'Living intentionally, one entry at a time.';
export const ACCOUNT_LABEL_MEMBER_SINCE = 'Member Since';
export const ACCOUNT_LABEL_STREAK_SUFFIX = ' Day Streak';
export const ACCOUNT_LABEL_VERIFIED = 'Verified';
export const ACCOUNT_MSG_NO_EMAIL = 'No email address';
export const ACCOUNT_LABEL_IDENTITY_TITLE = 'Identity & Security';
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
export const TODAY_BTN_START_TRACKING = 'Start tracking';
export const TODAY_BTN_STOP_TRACKING = 'Stop';
export const TODAY_BTN_DRAG_CREATE = 'Drag to create';
export const TODAY_BTN_DRAG_MOVE = 'Drag to move';
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
