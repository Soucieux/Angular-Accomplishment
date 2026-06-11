////////////////////// Below are shared user-facing messages /////////////////////////

/** Confirmation message shown when the user attempts to sign out. */
export const MSG_LOGOUT_CONFIRM = 'Are you sure you want to sign out?';
/** Header for the sign-out confirmation dialog. */
export const DIALOG_HEADER_SIGN_OUT = 'Sign Out';
/** Accept button label for the sign-out confirmation dialog. */
export const DIALOG_BTN_SIGN_OUT = 'Sign Out';
/** Shared delete button label used across all confirm-delete dialogs. */
export const DIALOG_BTN_DELETE = 'Delete';
/** Shared confirm button label used across all confirm dialogs. */
export const DIALOG_BTN_CONFIRM = 'Confirm';
/** Shared toast summary shown when a delete operation fails. */
export const MSG_DELETE_FAILED = 'Delete failed';
/** Shared toast summary shown when a save operation fails. */
export const MSG_SAVE_FAILED = 'Save failed';
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
export const ERROR_DIALOG_ICON_CLASS = 'pi pi-times-circle text-red-500';
export const ERROR_DIALOG_BTN_LABEL = 'OK';
export const ERROR_DIALOG_MSG_CLASS = 'error-dialog-message';
export const SEARCH_COMPLETE = 'Search complete';
export const SEARCH_CANCEL = 'Search cancelled';

////////////////////// Below are toast severity string constants //////////////////////

export const TOAST_INFO = 'info';
export const TOAST_WARN = 'warn';
export const TOAST_ERROR = 'error';
export const SEVERITY_SUCCESS = 'success';
export const SEVERITY_DANGER = 'danger';
export const SEVERITY_SECONDARY = 'secondary';
export const PATCH_SEVERITY_ICON_TODO = 'pi pi-clock';
export const PATCH_SEVERITY_ICON_IN_PROGRESS = 'pi pi-play-circle';
export const PATCH_SEVERITY_ICON_COMPLETED = 'pi pi-verified';
export const PATCH_SEVERITY_ICON_DEBUG = 'pi pi-exclamation-circle';
export const PATCH_SEVERITY_ICON_DRAFT = 'pi pi-file-edit';

////////////////////// Below are dialog type discriminator constants /////////////////

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

////////////////////// Below are history dialog and style string constants ///////////

/** History-entry status when a movie is added — appears in the history message text. */
export const HISTORY_STATUS_ADDED = 'added';
/** History-entry status when a movie is deleted — appears in the history message text. */
export const HISTORY_STATUS_DELETED = 'deleted';
export const HISTORY_MSG_UNDO_CONFIRM = 'Undo this deletion?';
export const HISTORY_DIALOG_UNDO_BTN = 'Undo';
/** Sentinel movie ID string used when a history entry has no valid numeric ID. */
export const HISTORY_MOVIE_ID_UNKNOWN = 'unknown';
/** Inline border style for an "added" history entry. */
export const HISTORY_STYLE_ADDED = 'solid green';
/** Inline border style for a "deleted" history entry. */
export const HISTORY_STYLE_DELETED = 'solid red';

////////////////////// Below are application lifecycle constants //////////////////////

/** Layout breakpoint for compact overlay nav: below this width the drawer switches to overlay mode. */
export const APP_BREAKPOINT_COMPACT = 1200;
/** Layout breakpoint for narrow viewport mode: below this width the sidebar collapses to an icon-only strip and nav labels are hidden. */
export const APP_BREAKPOINT_NARROW = 940;
export const COMPONENT_DESTROY = 'Component Destroyed';
export const UTILITIES_LOG_COUNTRY_FAILED = 'Country detection failed';
export const UTILITIES_LOG_DEFAULT_COUNTRY = 'Use default country: ';
/** Country code for mainland China — drives Cloudbase backend selection at startup. */
export const CN = 'CN';
/** Country code for all non-CN regions — drives Firebase backend selection at startup. */
export const OVERSEAS = 'INTL';
/** IANA timezone identifiers for mainland China — used by the timezone-based region detector. */
export const CN_TIMEZONES = ['Asia/Shanghai', 'Asia/Urumqi'];

////////////////////// Below are auth and login constants ////////////////////////////

export const LOGIN_MSG_SEND_CODE_FAILED = 'Failed to send verification code';
/* Stored in localStorage to avoid the Access Denied flicker on page refresh.
    The value '1' is a lightweight presence flag — it carries no user identity,
    no token, and no permissions. It only signals that the last known session
    was authenticated so the UI can optimistically show content while Firebase /
    CloudBase re-validates the real session in the background. The flag is
    written on login and removed on logout.   */
export const LS_AUTH_HINT_KEY = 'auth_hint';
/** localStorage key used to persist the nav sidebar collapsed state across page refreshes. */
export const LS_NAV_COLLAPSED_KEY = 'nav_collapsed';
export const NAV_AVATAR_FALLBACK_INITIAL = '?';
/** Fallback background gradient for the avatar element when no user-specific colour is set. */
export const NAV_AVATAR_GRADIENT = 'linear-gradient(135deg,#d53369,#daae51)';
export const LOGIN_URL_DEFAULT_RETURN = '/';
export const LOGIN_ANIM_OUT = 'out';
export const LOGIN_ANIM_IN = 'in';
export const LOGIN_LABEL_CREATE_ACCOUNT = 'Create account';
export const LOGIN_LABEL_GET_CODE = 'Get Code';
export const LOGIN_LABEL_LOADING = '…';
export const LOGIN_LABEL_SIGN_IN = 'Sign In';
export const LOGIN_MAX_USERNAME_LENGTH = 13;
export const LOGIN_ERROR_USERNAME_TOO_LONG = 'Username must be 13 characters or fewer.';
/** CloudBase role string that identifies an admin user. */
export const ROLE_ADMIN = '管理员';
/** CloudBase error code for an invalid request argument (e.g. wrong verification code). */
export const CLOUDBASE_ERROR_INVALID_ARGUMENT = 'INVALID_ARGUMENT';
/** CloudBase error category returned when credentials are wrong. */
export const CLOUDBASE_ERROR_INVALID_CREDENTIALS = 'INVALID_CREDENTIALS';
export const ERROR_PERMISSION_DENIED = 'DATABASE_PERMISSION_DENIED';
export const ERROR_NO_DOCUMENT_UPDATED = 'DATABASE_NO_DOCUMENT_UPDATED';

////////////////////// Below are database collection name constants ///////////////////

export const DATABASE_HISTORY = 'history';
export const DATABASE_MOVIES = 'movies';
export const DATABASE_RECIPES = 'recipes';
export const DATABASE_PATCH_NOTES = 'patch_notes';
export const DATABASE_QUOTES = 'quotes';
export const DATABASE_DATE_CALCULATOR = 'date_calculator';
export const DATABASE_DEBT_SONATA = 'debt_sonata';
export const DATABASE_REMINDER = 'reminder';
export const DATABASE_STATISTICS = 'statistics';
export const DATABASE_USEFUL_LINKS = 'useful_links'; // stores both links (type:'link') and categories (type:'category')

////////////////////// Below are shared UI constants /////////////////////////////////

// Layout responsive breakpoints
export const BREAKPOINT_MOBILE = '(max-width: 800px)';

export const SEARCH = 'search';
export const SUCCESS = 'success';
export const FAILURE = 'failure';
/** Window target for opening links in a new browser tab. */
export const LINK_TARGET_BLANK = '_blank';

////////////////////// Below are activity log type discriminator constants ////////////

/* Type discriminators written into activity-log entries across all pages.
   Use HISTORY_STATUS_ADDED / HISTORY_STATUS_DELETED for 'added' / 'deleted'. */
export const ACTIVITY_TYPE_UPDATED = 'updated';
export const ACTIVITY_TYPE_RESET = 'reset';
export const ACTIVITY_TYPE_BUG_LOGGED = 'bugLogged';
export const ACTIVITY_TYPE_STATUS_CHANGED = 'statusChanged';
export const ACTIVITY_TYPE_EDITED = 'edited';
/** Source tag written into every recentActivities entry — identifies the originating page. */
export const ACTIVITY_SOURCE_MOVIE = 'movie';
export const ACTIVITY_SOURCE_REMINDER = 'reminder';
export const ACTIVITY_SOURCE_RESONANCE = 'resonance';
export const ACTIVITY_SOURCE_PATCH = 'patch';
export const ACTIVITY_SOURCE_LINK = 'link';
export const ACTIVITY_SOURCE_DEBT = 'debt';
export const ACTIVITY_SOURCE_RECIPE = 'recipe';

////////////////////// Below are statistics document field name constants /////////////

/* Single source of truth for every key read from or written to the statistics
   document. Use these constants everywhere — never inline the raw string. */
export const STATS_FIELD_RECENT_ACTIVITIES = 'recentActivities';
export const STATS_FIELD_REMINDER_UPCOMING = 'reminderUpcoming';
export const STATS_FIELD_REMINDER_TOTAL = 'reminderTotal';
export const STATS_FIELD_PATCH_NOTES_TOTAL = 'patchNotesTotal';
export const STATS_FIELD_DEBT_UPCOMING = 'debtUpcoming';
/** Total count of all unpaid debts — written separately because debtUpcoming is capped at 20. */
export const STATS_FIELD_DEBT_TOTAL = 'debtTotal';
export const STATS_FIELD_TOTAL_RECIPES = 'totalRecipes';
export const STATS_FIELD_RECIPE_LIST = 'recipeList';
export const STATS_FIELD_GENRE = 'genre';

////////////////////// Below are statistics display cap constants /////////////////////

/* All list-based stat arrays (recentActivities, reminderUpcoming, debtUpcoming,
   recipeList) are capped at this many items on every write. Counters (reminderTotal,
   debtTotal, totalRecipes) are always the uncapped true total. */
export const STATS_CAP_ACTIVITY_LOG = 20;

////////////////////// Below are home page constants /////////////////////////////////

export const HOME_MSG_LOAD_STATISTICS_FAILED = 'Failed to load statistics';
export const HOME_MSG_INCREMENT_VISIT_FAILED = 'Failed to increment link visit';
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

export const HOME_ACTIVITY_LABEL_MOVIE_ADDED = 'Movie Added';
export const HOME_ACTIVITY_LABEL_MOVIE_UPDATED = 'Movie Updated';
export const HOME_ACTIVITY_LABEL_MOVIE_REMOVED = 'Movie Removed';
export const HOME_ACTIVITY_LABEL_MOVIE_SEARCHED = 'Movie Searched';
export const HOME_ACTIVITY_LABEL_PATCH_ADDED = 'Patch Added';
export const HOME_ACTIVITY_LABEL_PATCH_BUG = 'Bug Logged';
export const HOME_ACTIVITY_LABEL_PATCH_STATUS = 'Status Changed';
export const HOME_ACTIVITY_LABEL_PATCH_UPDATED = 'Patch Edited';
export const HOME_ACTIVITY_LABEL_PATCH_DELETED = 'Patch Deleted';
export const HOME_ACTIVITY_LABEL_REMINDER_ADDED = 'Reminder Added';
export const HOME_ACTIVITY_LABEL_REMINDER_DELETED = 'Reminder Deleted';
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

/** Shared entertainment teal colour for all non-deleted movie activity entries. */
export const HOME_ACTIVITY_COLOR_MOVIE = '#11998e';
export const HOME_ACTIVITY_COLOR_NEUTRAL = '#94a3b8';
export const HOME_ACTIVITY_COLOR_PATCH = '#8e54e9';
export const HOME_ACTIVITY_COLOR_REMINDER = '#f59e0b';
export const HOME_ACTIVITY_COLOR_RESONANCE = '#fda085';
export const HOME_ACTIVITY_COLOR_LINK = '#60a5fa';
export const HOME_ACTIVITY_COLOR_DEBT = '#06b6d4';
export const HOME_ACTIVITY_COLOR_RECIPE = '#22c55e';
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
/** Material icon name for a reminder item in the week-agenda strip — matches the reminders widget header. */
export const HOME_AGENDA_ICON_REMINDER = 'notifications';
/** Overflow-row label for the reminders panel. */
export const HOME_OVERFLOW_LABEL_REMINDERS = 'View all in Reminders';
/** Overflow-row label for the debt panel. */
export const HOME_OVERFLOW_LABEL_DEBT = 'View all in Debt Sonata';
/** Overflow-row label for the recipes panel. */
export const HOME_OVERFLOW_LABEL_RECIPES = 'View all in Recipes';
/** Overflow-row label for the shortcuts panel. */
export const HOME_OVERFLOW_LABEL_LINKS = 'View all in Shortcuts';
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
/** Route path for the quick-action button that opens the nexus page. */
export const HOME_QUICK_ACTION_ROUTE_NEXUS = '/nexus';
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
export const HOME_WEEK_AGENDA_GRADIENT_TODAY = 'var(--grad-brand)';
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
export const HOME_WEEK_AGENDA_EMPTY_TEXT = 'Nothing due — an open day.';
export const HOME_RING_GRADIENT_ID_PREFIX = 'rg';
export const HOME_RING_TRACK_DEFAULT = 'rgba(255,255,255,0.12)';
export const HOME_CONCENTRIC_TRACK_DEFAULT = 'rgba(255,255,255,0.10)';
/** Concentric ring diameter in pixels on viewports wider than the narrow breakpoint. */
export const HOME_CONCENTRIC_SIZE_DEFAULT = 400;
export const HOME_ORBITAL_PANEL_SCROLL_SELECTOR = '.orbital-panel-scroll';
/** SimpleChanges key for the stats @Input on OrbitalComponent. */
export const HOME_ORBITAL_CHANGES_KEY_STATS = 'stats';
/** Chinese portion of the activity panel footer quote (narrow viewport only). */
export const HOME_ACTIVITY_FOOTER_ZH = '往日已成历史';
/** English portion of the activity panel footer quote (narrow viewport only). */
export const HOME_ACTIVITY_FOOTER_EN = 'Yesterday is history';

////////////////////// Below are entertainment page constants ////////////////////////

/** Prefix for the delete-movie confirm message; movie name is appended at the call site. */
export const ENT_MSG_DELETE_CONFIRM_PREFIX = 'Are you sure you want to delete ';
export const ENT_DIALOG_TITLE_DELETE_MOVIE = 'Delete Movie';
export const ENT_MSG_ADDING = 'Adding movie...';
export const ENT_MSG_RESTORING = 'Restoring movie...';
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
/** Number of progress-bar blocks per category card. */
export const ENT_CORK_BLOCKS = 8;
/** ID of the programmatically injected View Transition style element. */
export const ENT_VTA_STYLE_ID = 'ent-vta-styles';
/** CSS view-transition-class value applied to movie cards being filtered out. */
export const ENT_VT_CLASS_LEAVING = 'vt-leaving';
/** CSS view-transition-class value applied to movie cards being filtered in. */
export const ENT_VT_CLASS_ENTERING = 'vt-entering';

export const RATE_LABEL_EXCELLENT = 'Excellent';
export const RATE_LABEL_GOOD = 'Good';
export const RATE_LABEL_AVERAGE = 'Average';
export const RATE_LABEL_POOR = 'Poor';
export const GENRE_FAVOURITE = '特别关注';
export const NO_RATE = '-1';
export const RATE_DECREASED = 'decreased';
export const RATE_INCREASED = 'increased';

////////////////////// Below are Resonance page constants ////////////////////////////

export const RESONANCE_MSG_DELETE_CONFIRM = 'Are you sure you want to delete this quote?';
export const RESONANCE_DIALOG_TITLE_DELETE = 'Delete Quote';
export const RESONANCE_MSG_POSTED = 'Posted';
export const RESONANCE_AUTHOR_ANONYMOUS = 'Anonymous';
export const RESONANCE_LABEL_VOICES = 'voices';
/** Maximum character count allowed for a new quote submission. */
export const RESONANCE_MAX_QUOTE_LENGTH = 500;
export const RESONANCE_SKELETON_COUNT = 6;

////////////////////// Below are recipe page constants ///////////////////////////////

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

/** List view id for the recipe page router. */
export const RECIPE_VIEW_LIST = 'list';
/** Detail view id for the recipe page router. */
export const RECIPE_VIEW_DETAIL = 'detail';
/** Add (editor) view id for the recipe page router. */
export const RECIPE_VIEW_ADD = 'add';
export const RECIPE_EDITING_MODE_CREATE = 'create';
export const RECIPE_EDITING_MODE_EDIT = 'edit';

export const RECIPE_CATEGORY_ALL = 'All';
export const RECIPE_CATEGORY_CHINESE = 'Chinese';
export const RECIPE_CATEGORY_WESTERN = 'Western';
export const RECIPE_CATEGORY_QUICK = 'Quick';
export const RECIPE_CATEGORY_DESSERT = 'Dessert';

export const RECIPE_ITYPE_VEGETABLE = 'veg';
export const RECIPE_ITYPE_MEAT = 'meat';

////////////////////// Below are recipe band CSS class name constants ////////////////

/* Each band pairs with a RECIPE_CATEGORY_* constant above and a full CSS
   section in recipe.component.css.  When adding a new band:
     1. Add RECIPE_CATEGORY_<NAME> above
     2. Add RECIPE_BAND_<NAME> here
     3. Register the new case in Utilities.recipeBandClass()
     4. Add RECIPE_CATEGORY_<NAME> to RECIPE_CATEGORIES and RECIPE_EDITOR_CATEGORIES
        in recipe.model.ts
     5. Add all CSS rules in recipe.component.css (see the palette comment block) */
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

////////////////////// Below are Portal page constants ////////////////////////////////

export const NEXUS_MSG_LINK_UPDATED = 'Link updated';
export const NEXUS_MSG_LINK_SAVED = 'Link saved';
export const NEXUS_MSG_SAVING_LINK = 'Saving link...';
export const NEXUS_MSG_SAVING_CATEGORY = 'Saving category...';
export const NEXUS_MSG_LINK_SAVE_FAILED_DETAIL = 'Could not save the link. Please try again.';
export const NEXUS_MSG_LINK_DELETED = 'Link deleted';
export const NEXUS_MSG_LINK_DELETE_FAILED_DETAIL = 'Could not delete the link. Please try again.';
export const NEXUS_MSG_NAME_REQUIRED = 'Name required';
export const NEXUS_MSG_CATEGORY_UPDATED = 'Category updated';
export const NEXUS_MSG_CATEGORY_ADDED = 'Category added';
export const NEXUS_MSG_CATEGORY_SAVE_FAILED_DETAIL = 'Could not save the category. Please try again.';
export const NEXUS_MSG_CATEGORY_DELETED = 'Category deleted';
export const NEXUS_MSG_CATEGORY_DELETE_FAILED_DETAIL = 'Could not delete the category. Please try again.';
export const NEXUS_MSG_DELETE_LINK_TITLE = 'Delete Link';
export const NEXUS_MSG_DELETE_CATEGORY_TITLE = 'Delete Category';
/** Confirm-delete message prefix for a Portal link; link title is appended at the call site. */
export const NEXUS_MSG_DELETE_LINK_CONFIRM_PREFIX = 'Are you sure you want to delete "';
/** Confirm-delete message suffix for a Portal link. */
export const NEXUS_MSG_DELETE_LINK_CONFIRM_SUFFIX = '"?';
/** Confirm-delete message prefix for a Portal category; category name is appended at the call site. */
export const NEXUS_MSG_DELETE_CATEGORY_CONFIRM_PREFIX = 'Are you sure you want to delete category "';
/** Confirm-delete message suffix for a Portal category. */
export const NEXUS_MSG_DELETE_CATEGORY_CONFIRM_SUFFIX =
	'"? Links in this category will become uncategorised.';
export const NEXUS_MSG_LOAD_LINKS_FAILED = 'Failed to load useful links';
export const NEXUS_MSG_LOAD_CATEGORIES_FAILED = 'Failed to load link categories';
export const NEXUS_MSG_SAVE_LINK_FAILED = 'Failed to save link';
export const NEXUS_MSG_SAVE_CATEGORY_FAILED = 'Failed to save category';
export const NEXUS_MSG_RESET_CONFIRM = 'Proceed with resetting the dates?';

/** Type value for a link document in the useful_links collection. */
export const USEFUL_LINK_TYPE_LINK = 'link';
/** Type value for a category document in the useful_links collection. */
export const USEFUL_LINK_TYPE_CATEGORY = 'category';

/** Dialog title when adding a new link. */
export const NEXUS_DIALOG_TITLE_ADD_LINK = 'Add Link';
/** Dialog title when editing an existing link. */
export const NEXUS_DIALOG_TITLE_EDIT_LINK = 'Edit Link';
/** Label for the isPinned checkbox in the add/edit link dialog. */
export const NEXUS_LABEL_PIN_TO_DASHBOARD = 'Pin to dashboard';
export const LINK_DIALOG_LABEL_CANCEL = 'Cancel';
export const LINK_DIALOG_LABEL_SAVE = 'Save';
export const LINK_DIALOG_LABEL_ADD = 'Add Link';
export const LINK_DIALOG_LABEL_TITLE_LOADING = 'Loading title…';
/** Sentinel value for the "show all categories" filter in the Portal links panel. */
export const NEXUS_CATEGORY_ALL = 'all';
/** Default colour applied to new and un-styled link categories. */
export const NEXUS_DEFAULT_CATEGORY_COLOR = '#d53369';
export const NEXUS_DIALOG_RESET_BTN = 'Reset';
export const NEXUS_LABEL_CURRENT_MONTH = 'Current Month';
export const NEXUS_LABEL_NEXT_MONTH = 'Next Month';
export const NEXUS_LABEL_RESET = 'Reset';
export const NEXUS_LABEL_CELL_CONFIRM = 'Confirm';
export const NEXUS_LABEL_CELL_DONE = 'Done';
export const NEXUS_LABEL_CELL_TODAY = 'Today';
export const NEXUS_LABEL_CONFIRMED = 'confirmed';

////////////////////// Below are Reminder page constants /////////////////////////////

/** Confirmation message shown before deleting a reminder entry. */
export const REMINDER_MSG_DELETE_CONFIRM = 'Proceed with deleting this entry?\nThis cannot be undone.';
/** Placeholder for the reminder message text input. */
export const REMINDER_PLACEHOLDER_TEXT = 'What should we remind you about…';
/** Placeholder for the link URL input inside the link popover. */
export const REMINDER_PLACEHOLDER_LINK = 'https://';
/** Placeholder for the new-tag inline input. */
export const REMINDER_PLACEHOLDER_TAG = 'tag…';
/** Ghost button label for adding a link to a reminder card. */
export const REMINDER_ADD_LINK_LABEL = 'Add link';
/** Ghost button label for adding a date to a reminder card. */
export const REMINDER_ADD_DATE_LABEL = 'Add date';
/** Confirm button label on the new-reminder composer. */
export const REMINDER_ADD_BTN_LABEL = 'Add';
/** "All" filter chip label in the Reminder filter bar. */
export const REMINDER_FILTER_ALL = 'All';
/** Section label above the filter chips. */
export const REMINDER_FILTER_LABEL = 'FILTER';
/** Primary label on the due-soon stat card. */
export const REMINDER_DUE_SOON_LABEL = 'due soon';
/** Chinese subtitle on the due-soon stat card. */
export const REMINDER_DUE_SOON_SUBTITLE = '未来七天';
/** Singular reminder unit used in the open-item greeting. */
export const REMINDER_GREETING_SINGULAR = 'reminder';
/** Plural reminder unit used in the open-item greeting. */
export const REMINDER_GREETING_PLURAL = 'reminders';
/** English segment of the open-item greeting suffix. */
export const REMINDER_AWAIT_SUFFIX_EN = 'await ·';
/** Chinese segment of the open-item greeting suffix. */
export const REMINDER_AWAIT_SUFFIX_CN = '静候处理';
/** Chinese segment of the page subtitle. */
export const REMINDER_SUBTITLE_CN = '日程 ·';
/** English segment of the page subtitle. */
export const REMINDER_SUBTITLE_EN = 'things to do, dated or not';

/** Type value for a Messages item in the reminder upcoming list. */
export const REMINDER_ITEM_MESSAGE = 'message';

/** CloudBase content entry key for the reminder message text. */
export const REMINDER_VALUE_KEY_TEXT = 'text';
/** CloudBase content entry key for the reminder date. */
export const REMINDER_VALUE_KEY_DATE = 'date';
/** CloudBase content entry key for the reminder link URL. */
export const REMINDER_VALUE_KEY_LINK = 'link';
/** CloudBase content entry key for the reminder tag. */
export const REMINDER_VALUE_KEY_TAG = 'tag';

/** Display name for the date calculator table — used in stat writes and the Recent Activity widget. */
export const REMINDER_TABLE_DATE_CALCULATOR = 'Date Calculator';
/** Display name for the third reminder table — used in stat writes and the Recent Activity widget. */
export const REMINDER_TABLE_MESSAGES = 'Messages';
/** Items shown per page in the Reminder grid (default: 2 columns × 7 rows). */
export const REMINDER_ITEMS_PER_PAGE = 14;
/** Fixed number of rows per page in the Reminder grid — page size scales as itemsPerRow × this. */
export const REMINDER_ROWS_PER_PAGE = 7;
/** Reminder category label — Personal (used as the default tag for new items). */
export const REMINDER_CATEGORY_PERSONAL = 'Personal';
/** Fallback accent color for unrecognized or absent categories — matches the Reminder section accent. */
export const REMINDER_CATEGORY_COLOR_DEFAULT = '#1a6dff';
/** Number of days ahead treated as "due soon". */
export const REMINDER_DUE_SOON_WINDOW_DAYS = 7;

////////////////////// Below are Debt Sonata page constants //////////////////////////

export const DEBT_SKELETON_COUNT = 6;
export const DEBT_DIALOG_TITLE = 'New debt';
export const DEBT_DIALOG_PLACEHOLDER_NAME = 'e.g. Visa Platinum';
export const DEBT_DIALOG_PLACEHOLDER_AMOUNT = '0';
export const DEBT_DIALOG_LABEL_ADD = 'Add debt';
export const DEBT_DIALOG_LABEL_CANCEL = 'Cancel';
export const DEBT_DIALOG_LABEL_PERMANENT = 'Permanent account';
export const DEBT_DIALOG_LABEL_PERMANENT_DESC = 'Protected from deletion — stays until you remove the lock';
export const DEBT_DIALOG_LABEL_CURRENCY_CNY = '¥ CNY';
export const DEBT_DIALOG_LABEL_CURRENCY_CAD = '$ CAD';
export const DEBT_EMPTY_STATE_MSG = 'No debts here. Add one to start tracking — or enjoy being debt-free.';
export const DEBT_EMPTY_STATE_BTN = 'Add a debt';
export const DEBT_LABEL_DELETE_CONFIRM = 'Delete?';
export const DEBT_CUSTOM_INPUT_PLACEHOLDER = '−0.00';
export const DEBT_DIALOG_LABEL_EDIT = 'Set debt';
export const DEBT_DIALOG_LABEL_SAVE = 'Set';
export const DEBT_DIALOG_LABEL_BALANCE = 'New amount';
export const DEBT_DUE_LABEL_NONE = 'No due date';
export const DEBT_DUE_LABEL_TODAY = 'Due today';
export const DEBT_DUE_LABEL_TOMORROW = 'Due tomorrow';

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

////////////////////// Below are patch notes page constants //////////////////////////

export const PATCH_MSG_DELETE_CONFIRM = 'Proceed with deleting this note?';

export const STATUS_TODO = 'To Do';
export const STATUS_IN_PROGRESS = 'In Progress';
export const STATUS_COMPLETED = 'Completed';
export const STATUS_DEBUG = 'Debug';
export const STATUS_DRAFT = 'Draft';
export const STATUS_RESOLVED = 'Resolved';
