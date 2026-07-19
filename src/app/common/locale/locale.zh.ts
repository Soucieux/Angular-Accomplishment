export * from '../constants';

export const APP_LOCALE = 'zh-CN';

/* ─────────────────────────────────────────
   Shared user-facing messages
───────────────────────────────────────── */

export const MSG_LOGOUT_CONFIRM = '确认退出登录？';
export const DIALOG_BTN_SIGN_OUT = '退出登录';
export const DIALOG_BTN_DELETE = '删除';
export const DIALOG_BTN_CONFIRM = '确认';
export const DIALOG_BTN_CANCEL = '取消';
export const DIALOG_BTN_SAVE = '保存';
export const DIALOG_BTN_NEXT = '下一步';
export const DIALOG_BTN_BACK = '返回';
export const MSG_DELETE_FAILED = '删除失败';
export const MSG_SAVE_FAILED = '保存失败';
export const ACCESS_DENIED_TITLE = '无权访问';
export const ACCESS_DENIED_BODY = '登录以访问此页面';
export const ACCESS_DENIED_FOOTER = '错误 401 · 需要身份验证';
export const MSG_PERMISSION_DENIED = '用户没有权限';
export const MSG_UNEXPECTED_ERROR = '发生未知错误';
export const MSG_DELETING = '正在删除...';
export const MSG_SAVING = '正在保存...';
export const MSG_CLEARING = '正在清空...';
export const MSG_LOADING = '加载中…';
export const MSG_INVALID_DIALOG_TYPE = '对话框无效';
export const MSG_DIALOG_CONTAINER_NOT_FOUND = '找不到对话框位置';
export const MSG_DIALOG_ALREADY_OPEN = '对话框已经打开';
export const ERROR_DIALOG_HEADER = '错误';
export const SEARCH_COMPLETE = '搜索完成';
export const SEARCH_CANCEL = '搜索已取消';
export const RETRY_DIALOG_MSG = '连接已断开...';
export const NOTIF_ENABLED_TITLE = '推送通知已开启';
export const NOTIF_ENABLED_BODY = '你将收到来自 Vision Canvas 的通知。';

/* ─────────────────────────────────────────
   Passphrase lock (generic, common)
───────────────────────────────────────── */

export const PASSPHRASE_LOCK_SETUP_TITLE = '设置口令';
export const PASSPHRASE_LOCK_SETUP_BODY = '设置一个口令以保护此页面。之后可在账户设置中修改。';
export const PASSPHRASE_LOCK_LOCKED_TITLE = '输入口令';
export const PASSPHRASE_LOCK_LOCKED_BODY = '此页面受保护，请输入口令以继续。';
export const PASSPHRASE_LOCK_PLACEHOLDER = '请输入口令';
export const PASSPHRASE_LOCK_CONFIRM_PLACEHOLDER = '请再次输入口令';
export const PASSPHRASE_LOCK_ERROR_WRONG = '口令不正确';
export const PASSPHRASE_LOCK_ERROR_MISMATCH = '两次输入的口令不一致';
export const PASSPHRASE_LOCK_ERROR_TOO_SHORT = '口令至少需要 4 个字符';
export const PASSPHRASE_LOCK_BTN_SET = '设置口令';
export const PASSPHRASE_LOCK_BTN_UNLOCK = '解锁';
export const PASSPHRASE_LOCK_BTN_VERIFYING = '正在验证...';
export const PASSPHRASE_LOCK_FOOTER = '此页面为私密访问';
export const PASSPHRASE_LOCK_ERROR_GENERIC = '出现问题，请重试。';

/* ─────────────────────────────────────────
   History dialog constants
───────────────────────────────────────── */

export const HISTORY_MSG_UNDO_CONFIRM = '撤销此次删除？';
export const HISTORY_DIALOG_UNDO_BTN = '撤销';
export const HISTORY_DIALOG_TITLE = '历史记录';
export const HISTORY_SUBTITLE = '点击恢复已删除条目';
export const HISTORY_EMPTY = '暂无历史记录——添加或删除的影片会显示在这里。';

/* ─────────────────────────────────────────
   Auth and login constants
───────────────────────────────────────── */

export const LOGIN_MSG_SEND_CODE_FAILED = '发送验证码失败';
export const NAV_NOTIF_LABEL_ENABLE = '开启推送通知';
export const NAV_NOTIF_LABEL_DISABLE = '关闭推送通知';
export const NAV_NOTIF_TOGGLE_ERROR = '切换推送通知时出错';
export const NAV_MINIMIZE_ON_CLOSE_ENABLE = '关闭时最小化';
export const NAV_MINIMIZE_ON_CLOSE_DISABLE = '关闭时退出';
export const DIALOG_LOCALE_SWITCH_HEADER = '切换语言';
export const DIALOG_LOCALE_SWITCH_MSG = '页面将重新加载以应用更改。';
export const DIALOG_LOCALE_SWITCH_BTN = '切换并重载';
export const NAV_LABEL_MENU = '目录';
export const NAV_LABEL_HOME = '主页';
export const NAV_LABEL_TODAY = '今日';
export const NAV_LABEL_PORTAL = '链接';
export const NAV_LABEL_RESONANCE = '语录';
export const NAV_LABEL_RECIPES = '食谱';
export const NAV_LABEL_ENTERTAINMENT = '影视';
export const NAV_LABEL_REMINDER = '提醒';
export const NAV_LABEL_DEBT_SONATA = '债务';
export const NAV_LABEL_PATCH_NOTES = '日志';
export const NAV_LABEL_ABOUT = '关于';
export const NAV_LABEL_VAULT = '保险';
export const NAV_LABEL_SIGN_OUT = '退出登录';
export const NAV_LABEL_SIGN_IN = '登录';
export const NAV_ARIA_ACCOUNT = '账户';
export const NAV_ARIA_PRIMARY = '主导航';
export const NAV_ARIA_CLOSE_SECTIONS = '关闭所有板块';
export const NAV_ARIA_SHOW_SECTIONS = '显示所有板块';
export const NAV_ARIA_ACCOUNT_PREFIX = '账户：';
export const NAV_STATUS_OFFLINE = '离线';
export const LABEL_ONLINE = '在线';
export const LOGIN_LABEL_CREATE_ACCOUNT = '创建账号';
export const LOGIN_LABEL_GET_CODE = '获取验证码';
export const LOGIN_LABEL_SIGN_IN = '登录';
export const LOGIN_ERROR_USERNAME_TOO_LONG = '用户名不能超过 13 个字符。';
export const LOGIN_LABEL_PWD_REQ_LENGTH = '至少 8 位字符';
export const LOGIN_LABEL_PWD_REQ_TYPES = '至少包含以下 3 种字符类别：';
export const LOGIN_LABEL_PWD_REQ_UPPERCASE = '大写字母 (A–Z)';
export const LOGIN_LABEL_PWD_REQ_LOWERCASE = '小写字母 (a–z)';
export const LOGIN_LABEL_PWD_REQ_DIGIT = '数字 (0–9)';
export const LOGIN_LABEL_PWD_REQ_SPECIAL = '特殊字符（如 ! @ # $）';
export const LOGIN_LABEL_CODE_COUNTDOWN_SUFFIX = '秒';
export const LOGIN_MSG_CODE_SENT = '验证码已发送，请查收邮件。';
export const LOGIN_LABEL_FORGOT_PASSWORD = '忘记密码？';
export const LOGIN_LABEL_SEND_RESET_CODE = '发送重置码';
export const LOGIN_LABEL_RESET_PASSWORD = '重置密码';
export const LOGIN_LABEL_BACK_TO_SIGN_IN = '返回登录';
export const LOGIN_TOGGLE_HAS_ACCOUNT = '已经有账号了？';
export const LOGIN_TOGGLE_NO_ACCOUNT = '还没有账号？';
export const LOGIN_TOGGLE_SIGN_IN = '登录';
export const LOGIN_TOGGLE_SIGN_UP = '立即注册';
export const LOGIN_FLAVOUR_TEXT = '欢迎回到隐秘国度';
export const LOGIN_MSG_EMAIL_REQUIRED = '请输入邮箱地址。';
export const LABEL_EMAIL = '邮箱';
export const LOGIN_MSG_EMAIL_INVALID = '请输入有效的邮箱地址。';
export const LOGIN_LABEL_CODE = '验证码';
export const LOGIN_MSG_CODE_REQUIRED = '请输入验证码。';
export const LOGIN_MSG_PASSWORD_REQUIRED = '请输入密码。';
export const LABEL_NEW_PASSWORD = '新密码';
export const LABEL_USERNAME = '用户名';
export const LOGIN_MSG_USERNAME_REQUIRED = '请输入用户名。';
export const LOGIN_LABEL_PASSWORD = '密码';
export const LOGIN_LABEL_DIVIDER = '或';
export const LOGIN_BTN_GOOGLE = '使用 Google 继续登录';
export const ERROR_NO_DOCUMENT_UPDATED = '无数据更新';

/* ─────────────────────────────────────────
   Home page constants
───────────────────────────────────────── */

export const HOME_MSG_LOAD_STATISTICS_FAILED = '加载统计数据失败';
export const HOME_MSG_INCREMENT_VISIT_FAILED = '更新链接访问次数失败';

export const HOME_ACTIVITY_LABEL_MOVIE_ADDED = '影片已添加';
export const HOME_ACTIVITY_LABEL_MOVIE_UPDATED = '影片已更新';
export const HOME_ACTIVITY_LABEL_MOVIE_REMOVED = '影片已移除';
export const HOME_ACTIVITY_LABEL_MOVIE_SEARCHED = '已搜索影片';
export const HOME_ACTIVITY_LABEL_PATCH_ADDED = '日志已添加';
export const HOME_ACTIVITY_LABEL_PATCH_BUG = '漏洞已记录';
export const HOME_ACTIVITY_LABEL_PATCH_STATUS = '日志状态已变更';
export const HOME_ACTIVITY_LABEL_PATCH_UPDATED = '日志已编辑';
export const HOME_ACTIVITY_LABEL_PATCH_DELETED = '日志已删除';
export const HOME_ACTIVITY_LABEL_REMINDER_ADDED = '提醒已添加';
export const HOME_ACTIVITY_LABEL_REMINDER_DELETED = '提醒已移除';
export const HOME_ACTIVITY_LABEL_REMINDER_UPDATED = '提醒已更新';
export const HOME_SHARED_ACTIVITY_ADDED = '{who}添加了“{text}”';
export const HOME_SHARED_ACTIVITY_DELETED = '{who}删除了“{text}”';
export const HOME_SHARED_ACTIVITY_EDITED_ASPECT = '{who}修改了“{text}”的{aspect}';
export const HOME_SHARED_ACTIVITY_EDITED = '{who}编辑了“{text}”';
export const HOME_SHARED_ACTIVITY_SELF = '我';
export const HOME_SHARED_ACTIVITY_MEMBER_FALLBACK = '关联账户';
export const HOME_SHARED_ASPECT_TEXT = '内容';
export const HOME_SHARED_ASPECT_DATE = '日期';
export const HOME_SHARED_ASPECT_LINK = '链接';
export const HOME_SHARED_ASPECT_TAG = '标签';
export const HOME_SHARED_ASPECT_START_TIME = '开始时间';
export const HOME_SHARED_ASPECT_END_TIME = '结束时间';
export const HOME_SHARED_ASPECT_SHARED = '共享状态';
export const HOME_ACTIVITY_LABEL_RESONANCE_ADDED = '语录已添加';
export const HOME_ACTIVITY_LABEL_RESONANCE_REMOVED = '语录已移除';
export const HOME_ACTIVITY_LABEL_LINK_ADDED = '链接已添加';
export const HOME_ACTIVITY_LABEL_LINK_UPDATED = '链接已更新';
export const HOME_ACTIVITY_LABEL_LINK_REMOVED = '链接已移除';
export const HOME_ACTIVITY_LABEL_DEBT_ADDED = '债务已添加';
export const HOME_ACTIVITY_LABEL_DEBT_UPDATED = '债务已更新';
export const HOME_ACTIVITY_LABEL_DEBT_RESET = '债务已重置';
export const HOME_ACTIVITY_LABEL_DEBT_REMOVED = '债务已移除';
export const HOME_ACTIVITY_LABEL_RECIPE_ADDED = '食谱已添加';
export const HOME_ACTIVITY_LABEL_RECIPE_UPDATED = '食谱已更新';
export const HOME_ACTIVITY_LABEL_RECIPE_REMOVED = '食谱已移除';
export const HOME_ACTIVITY_LABEL_MOVIE_RATE_UPDATED = '影片评分已更新';
export const HOME_ACTIVITY_LABEL_MOVIE_GENRE_UPDATED = '影片类型已更新';
export const HOME_ACTIVITY_LABEL_MOVIE_FAVOURITE_UPDATED = '影片收藏状态已更新';
export const HOME_ACTIVITY_LABEL_LINK_CATEGORY_UPDATED = '链接类别已更新';
export const HOME_ACTIVITY_LABEL_LINK_CATEGORY_REMOVED = '链接类别已移除';
export const HOME_ACTIVITY_LABEL_DEBT_PAYMENT_REMOVED = '还款记录已删除';
export const HOME_ACTIVITY_LABEL_LINK_CATEGORY_ADDED = '链接类别已添加';
export const HOME_ACTIVITY_LABEL_DATE_CALCULATOR_UPDATED = '日期日历已更新';
export const HOME_ACTIVITY_LABEL_DEBT_LOCK_UPDATED = '债务锁已更新';
export const HOME_ACTIVITY_LABEL_VAULT_ADDED = '保险箱账户已添加';
export const HOME_ACTIVITY_LABEL_VAULT_REMOVED = '保险箱账户已移除';
export const ACTIVITY_INVALID_TABLE_TEXT = '数据库无效';

export const HOME_OVERFLOW_LABEL_REMINDERS = '前往提醒页面以查看全部';
export const HOME_OVERFLOW_LABEL_DEBT = '前往债务页面以查看全部';
export const HOME_OVERFLOW_LABEL_RECIPES = '前往食谱页面以查看全部';
export const HOME_OVERFLOW_LABEL_LINKS = '前往链接页面查以看全部';

export const HOME_WEEK_AGENDA_EMPTY_TEXT = '今日无事，好好享受。';
export const HOME_SATELLITE_TOOLTIP_STREAK = '连续记录至少一次活动的天数';
export const HOME_BRAND_SUBTITLE = '专属的内心世界';
export const HOME_FLAVOUR_LINE_1 = '有些记忆，值得留存。';
export const HOME_FLAVOUR_LINE_2 = '于是我为它们创造了一个专属小窝。';
export const ORBITAL_URGENCY_LABEL_REMINDERS = '条提醒';
export const ORBITAL_URGENCY_LABEL_DEBTS = '条债务';
export const ORBITAL_URGENCY_LABEL_VARIOUS = '多条';
export const ORBITAL_LABEL_STREAK = '连续';
export const ORBITAL_LABEL_PATCH = '日志';
export const ORBITAL_LABEL_THIS_WEEK = '本周';
export const ORBITAL_LABEL_LIFE_CLOCK = '生活时钟';
export const ORBITAL_LABEL_REMINDERS = '提醒';
export const ORBITAL_LABEL_SHORTCUTS = '快捷指令';
export const ORBITAL_LABEL_ACTIVITY = '动态';
export const ORBITAL_PANEL_EMPTY_LINKS = '暂无链接';
export const ORBITAL_PANEL_EMPTY_PAYMENTS = '暂无还款项';
export const ORBITAL_PANEL_EMPTY_GENRES = '暂无类型数据';
export const ORBITAL_PANEL_EMPTY_RECIPES = '暂无食谱';
export const ORBITAL_PANEL_EMPTY_REMINDERS = '暂无提醒';
export const ORBITAL_PANEL_EMPTY_ACTIVITY = '暂无活动记录';
export const ORBITAL_DAY_NAMES_SHORT: string[] = ['日', '一', '二', '三', '四', '五', '六'];
export const ORBITAL_QUICK_ACTION_LABELS: string[] = [
	'添加影片',
	'添加心声',
	'添加食谱',
	'添加债务',
	'添加提醒',
	'添加快捷指令'
];
export const ORBITAL_GREETING_NIGHT = '晚安';
export const ORBITAL_GREETING_MORNING = '早上好';
export const ORBITAL_GREETING_AFTERNOON = '下午好';
export const ORBITAL_GREETING_EVENING = '晚上好';
export const ORBITAL_LABEL_YEAR = '年';
export const ORBITAL_LABEL_MONTH = '月';
export const ORBITAL_LABEL_WEEK = '周';
export const ORBITAL_LABEL_DAY = '日';
export const ORBITAL_WEEK_AGENDA_DUE_HEADER = '截止';
export const ORBITAL_PANEL_BADGE_OPEN = '待办';
export const ORBITAL_PANEL_BADGE_DUE = '待还';
export const ORBITAL_TOOLTIP_ACTIVITY_7DAYS = '过去 7 天内添加的活动记录';

/* ─────────────────────────────────────────
   Entertainment page constants
───────────────────────────────────────── */

export const ENT_MSG_DELETE_CONFIRM_PREFIX = '确认删除';
export const ENT_DIALOG_TITLE_ADD_MOVIE = '添加新影片';
export const ADD_MOVIE_SUBTITLE = '输入片名或 ID 开始搜索';
export const ADD_MOVIE_LABEL_GENRE = '类型*';
export const ENT_GENRE_LABELS: Record<string, string> = {};
export const ENT_LABEL_GENRE = '类型：';
export const ENT_LABEL_EPISODES = '集数：';
export const ENT_LABEL_YEAR = '年份：';
export const ENT_LABEL_SYNOPSIS = '简介：';
export const ENT_LABEL_CAST = '演员：';
export const ADD_MOVIE_LABEL_FAVOURITE = '喜爱';
export const ENT_DIALOG_TITLE_SEARCH = '正在获取各个影片最新评分...';
export const ENT_DIALOG_TITLE_DELETE_MOVIE = '删除影片';
export const ENT_MSG_LOADING = '正在加载影片...';
export const ENT_MSG_ADDING = '正在添加影片...';
export const ENT_MSG_RESTORING = '正在恢复影片...';

export const ENT_TOOLTIP_REFRESH = '刷新评分';
export const ENT_TOOLTIP_ADD = '添加影片';
export const ENT_TOOLTIP_HISTORY = '历史记录';
export const ENT_TITLE_PAGE = '影片';
export const ENT_SEARCH_PLACEHOLDER = '搜索影片...';
export const ENT_LABEL_FILMS = '部影片';
export const ENT_LABEL_TO_WATCH = '部待观看';
export const ENT_ARIA_DOUBAN_LINK = '在豆瓣上打开';
export const ENT_BTN_STOP = '停止';
export const ENT_BTN_DONE = '完成';
export const ADD_MOVIE_LABEL_NAME = '片名';
export const ADD_MOVIE_LABEL_NAME_REQUIRED = '片名*';
export const ADD_MOVIE_LABEL_YEAR = '年份';
export const ADD_MOVIE_LABEL_YEAR_REQUIRED = '年份*';
export const ADD_MOVIE_LABEL_ID = 'ID';
export const ADD_MOVIE_LABEL_ID_REQUIRED = 'ID*';
export const ADD_MOVIE_BTN_SEARCH = '搜索';
export const ADD_MOVIE_BTN_SUBMIT = '提交';

export const ENT_HISTORY_RATE_OPEN = '（评分：';
export const ENT_HISTORY_RATE_CLOSE = '）';
export const ENT_HISTORY_STATUS_ADDED = '添加';
export const ENT_HISTORY_STATUS_DELETED = '删除';
export const ENT_HISTORY_SEARCH_STARTED = '新的评分搜索记录于 ';
export const ENT_LOG_START_SEARCHING = '开始搜索 ';
export const ENT_LOG_RATE_PRE = '';
export const ENT_LOG_RATE_IS = ' 的评分';
export const ENT_LOG_RATE_BY = ' ';
export const ENT_LOG_RATE_TO = '</span>至 ';
export const ENT_LOG_RATE_SAME = ' 的评分未变化';
export const ENT_LOG_RATE_UP = '提升';
export const ENT_LOG_RATE_DOWN = '下降';
export const ENT_LOG_SUMMARY_HEADER = '📊 搜索结果';
export const ENT_LOG_RATE_INCREASED_LABEL = '⬆ 评分提升';
export const ENT_LOG_RATE_DECREASED_LABEL = '⬇ 评分下降';
export const ENT_LOG_NONE = '无';
export const ENT_LOG_SKIPPING = '。跳过。';

export const RATE_LABEL_EXCELLENT = '神作';
export const RATE_LABEL_GOOD = '佳片';
export const RATE_LABEL_AVERAGE = '一般';
export const RATE_LABEL_POOR = '差评';

/* ─────────────────────────────────────────
   Resonance page constants
───────────────────────────────────────── */

export const RESONANCE_MSG_DELETE_CONFIRM = '确认删除这条心声？';
export const RESONANCE_DIALOG_TITLE_DELETE = '删除心声';
export const RESONANCE_MSG_POSTED = '已发布';
export const RESONANCE_AUTHOR_ANONYMOUS = '匿名';
export const RESONANCE_LABEL_VOICES = '条心声';
export const RESONANCE_SUBTITLE = '静谧之所，每一个字都有它的份量';
export const RESONANCE_PLACEHOLDER_QUOTE = '写下值得铭记的话...';
export const RESONANCE_PLACEHOLDER_NAME = '名字（选填）';
export const RESONANCE_BTN_POST = '发布';
export const RESONANCE_EMPTY_TEXT = '还没有心声，也许你的声音会是第一个。';
export const RESONANCE_ARIA_DELETE = '删除心声';
export const RESONANCE_MSG_OVER_LIMIT_PREFIX = '你的心声超过了';
export const RESONANCE_MSG_OVER_LIMIT_SUFFIX = '个字符，请缩短后再发布。';

/* ─────────────────────────────────────────
   Recipe page constants
───────────────────────────────────────── */

export const RECIPE_DISCARD_TITLE = '放弃修改食谱';
export const RECIPE_DISCARD_MESSAGE = '放弃修改这份食谱？\n所有更改将会丢失。';
export const RECIPE_DISCARD_BTN = '放弃';
export const RECIPE_DISCARD_CHANGES_TITLE = '放弃更改';
export const RECIPE_DISCARD_CHANGES_MESSAGE = '未保存的更改将会丢失。';
export const RECIPE_DELETE_TITLE = '删除食谱';
export const RECIPE_DELETE_MESSAGE = '确认删除这份食谱？\n此操作无法撤销。';
export const RECIPE_ITYPE_DIALOG_TITLE = '管理食材类别';
export const RECIPE_MSG_INGREDIENT_UNIT_REQUIRED = '部分食材缺少单位。';
export const RECIPE_MSG_LOAD_FAILED = '加载食谱失败';
export const RECIPE_MSG_ADDED = '食谱已保存';
export const RECIPE_MSG_UPDATED = '食谱已更新';
export const RECIPE_MSG_DELETED = '食谱已删除';
export const RECIPE_MSG_SAVE_FAILED_DETAIL = '食谱保存失败，请重试。';
export const RECIPE_MSG_DELETE_FAILED_DETAIL = '食谱删除失败，请重试。';
export const RECIPE_MSG_NAME_TOO_LONG = '食谱名称不能超过 9 个汉字。';
export const RECIPE_MSG_CATEGORY_REQUIRED = '保存前请先选择类别。';

export const LABEL_ALL = '全部';
export const RECIPE_CATEGORY_CHINESE = '中餐';
export const RECIPE_CATEGORY_WESTERN = '西餐';
export const RECIPE_CATEGORY_QUICK = '简易';
export const RECIPE_CATEGORY_DESSERT = '甜点';
export const RECIPE_PLACEHOLDER_CATEGORY = '选择分类…';

export const RECIPE_EYEBROW = '私人烹饪厨房';
export const RECIPE_SUBTITLE = '你的私人烹饪厨房';
export const RECIPE_PLACEHOLDER_SEARCH = '搜索食谱…';
export const RECIPE_EMPTY_SEARCH = '没有符合搜索条件的食谱';
export const RECIPE_BTN_VIEW = '查看食谱 →';
export const RECIPE_ARIA_DEC_SERVINGS = '减少份量';
export const RECIPE_ARIA_INC_SERVINGS = '增加份量';
export const RECIPE_PLACEHOLDER_TITLE = '未命名食谱…';
export const RECIPE_PLACEHOLDER_INGREDIENT = '食材名称';
export const RECIPE_PLACEHOLDER_QTY = '用量';
export const RECIPE_PLACEHOLDER_UNIT = '单位 *';
export const RECIPE_SUFFIX_MIN = '分钟';
export const RECIPE_SUFFIX_SERVINGS = '份';
export const RECIPE_BTN_ADD = '添加食谱';
export const RECIPE_BTN_EDIT = '编辑食谱';
export const RECIPE_BTN_SAVE = '保存食谱';
export const RECIPE_BTN_SAVE_CHANGES = '保存更改';
export const RECIPE_LABEL_SERVES = '人份';
export const RECIPE_LABEL_INGREDIENTS = '食材';
export const RECIPE_LABEL_STEPS = '步骤';
export const RECIPE_LABEL_NOTES = '备注与小贴士';
export const RECIPE_BTN_ADD_INGREDIENT = '+ 添加食材';
export const RECIPE_BTN_ADD_SUBPOINT = '+ 添加细项';
export const RECIPE_BTN_ADD_STEP = '+ 添加步骤';
export const RECIPE_BADGE_EXAMPLE = '示例';
export const RECIPE_TOOLTIP_REMOVE = '移除';
export const RECIPE_TOOLTIP_REMOVE_STEP = '移除步骤';
export const RECIPE_TOOLTIP_MANAGE_TYPES = '管理食材类型';
export const RECIPE_TOOLTIP_DRAG_REORDER = '拖动以重新排序';
export const RECIPE_PLACEHOLDER_STEP = '描述这一步…';
export const RECIPE_PLACEHOLDER_SUBPOINT = '细项（选填）';
export const RECIPE_PLACEHOLDER_NOTES = '心得、调整，或下次要记住的事…';
export const RECIPE_EDITOR_TYPE_SELECTED = '已选';
export const RECIPE_EDITOR_TYPE_HINT = '选择在食谱编辑器中显示的食材类型，至少需选择一项。';
export const INGREDIENT_BTN_APPLY = '应用';
export const RECIPE_ITYPE_LABELS: Record<string, string> = {
	veg: '蔬菜',
	meat: '肉类',
	seas: '调料',
	dairy: '乳制品',
	grain: '谷物',
	liq: '液态',
	spice: '香料',
	seafood: '海鲜',
	egg: '蛋类',
	nut: '坚果',
	fruit: '水果',
	oil: '油',
	herb: '香草',
	fungi: '菌类',
	sweet: '甜味剂',
	condiment: '调味品'
};

/* ─────────────────────────────────────────
   Portal page constants
───────────────────────────────────────── */

export const PORTAL_MSG_LINK_UPDATED = '链接已更新';
export const PORTAL_MSG_LINK_SAVED = '链接已保存';
export const PORTAL_MSG_SAVING_LINK = '正在保存链接...';
export const PORTAL_MSG_SAVING_CATEGORY = '正在保存类别...';
export const PORTAL_MSG_LINK_SAVE_FAILED_DETAIL = '无法保存链接，请重试。';
export const PORTAL_MSG_LINK_DELETED = '链接已删除';
export const PORTAL_MSG_LINK_DELETE_FAILED_DETAIL = '无法删除链接，请重试。';
export const PORTAL_MSG_NAME_REQUIRED = '请填写名称';
export const PORTAL_MSG_CATEGORY_UPDATED = '类别已更新';
export const PORTAL_MSG_CATEGORY_ADDED = '类别已添加';
export const PORTAL_MSG_CATEGORY_SAVE_FAILED_DETAIL = '无法保存类别，请重试。';
export const PORTAL_MSG_CATEGORY_DELETED = '类别已删除';
export const PORTAL_MSG_CATEGORY_DELETE_FAILED_DETAIL = '无法删除类别，请重试。';
export const PORTAL_MSG_DELETE_LINK_TITLE = '删除链接';
export const PORTAL_MSG_DELETE_CATEGORY_TITLE = '删除类别';
export const PORTAL_MSG_DELETE_LINK_CONFIRM_PREFIX = '确认要删除"';
export const PORTAL_MSG_DELETE_LINK_CONFIRM_SUFFIX = '"？';
export const PORTAL_MSG_DELETE_CATEGORY_CONFIRM_PREFIX = '确认删除类别"';
export const PORTAL_MSG_DELETE_CATEGORY_CONFIRM_SUFFIX = '"？该类别下的链接将变为未分类。';
export const PORTAL_MSG_LOAD_LINKS_FAILED = '加载链接失败';
export const PORTAL_MSG_LOAD_CATEGORIES_FAILED = '加载链接类别失败';
export const PORTAL_MSG_SAVE_LINK_FAILED = '保存链接失败';
export const PORTAL_MSG_SAVE_CATEGORY_FAILED = '保存类别失败';
export const PORTAL_MSG_RESET_CONFIRM = '确认重置日期？';
export const PORTAL_BTN_BATCH = '批量添加';
export const PORTAL_BTN_ADD_LINK = '添加链接';
export const LABEL_ADD_LINK = '添加链接';
export const BTN_ADD = '添加';

export const PORTAL_DIALOG_TITLE_ADD_LINK = '添加链接';
export const PORTAL_DIALOG_TITLE_EDIT_LINK = '编辑链接';
export const PORTAL_CATEGORY_DIALOG_TITLE_ADD = '新建类别';
export const PORTAL_CATEGORY_DIALOG_TITLE_EDIT = '编辑类别';
export const LABEL_NAME = '名称';
export const PORTAL_CATEGORY_DIALOG_PLACEHOLDER_NAME = '例如：学习、工具、开发';
export const PORTAL_LABEL_PIN_TO_DASHBOARD = '固定到首页';
export const PORTAL_LABEL_SHARED_LINK = '共享链接（所有用户可见）';
export const PORTAL_SECTION_SHARED = '共享';
export const PORTAL_SECTION_MY_LINKS = '我的链接';
export const PORTAL_SECTION_SHARED_SUFFIX = '条链接 · 所有人可见';
export const PORTAL_SECTION_MY_LINKS_SUFFIX = '条链接 · 仅你可见';
export const PORTAL_SECTION_SHARED_EMPTY = '暂无共享链接';
export const PORTAL_SECTION_MY_LINKS_EMPTY = '暂无链接';
export const LINK_DIALOG_LABEL_TITLE_LOADING = '正在加载标题…';
export const PORTAL_LABEL_CURRENT_MONTH = '本月';
export const PORTAL_LABEL_NEXT_MONTH = '下月';
export const PORTAL_LABEL_RESET = '重置';
export const PORTAL_LABEL_CELL_DONE = '完成';
export const PORTAL_LABEL_CELL_TODAY = '今天';

export const MULTI_LINK_DIALOG_TITLE = '批量添加链接';
export const MULTI_LINK_DIALOG_SUBTITLE = '粘贴多个网址——我们将自动获取各网站图标。';
export const LABEL_CATEGORY = '类别';
export const MULTI_LINK_LABEL_APPLIES_PREFIX = '· 应用到全部 ';
export const MULTI_LINK_LABEL_LINK = '条链接';
export const MULTI_LINK_LABEL_LINKS = '条链接';
export const MULTI_LINK_LABEL_PASTE = '粘贴链接';
export const MULTI_LINK_PLACEHOLDER_PASTE =
	'在此粘贴链接——行、逗号或分号分隔每一条\n\nhttps://github.com\nfigma.com\nlinear.app';
export const MULTI_LINK_LABEL_LINK_FOUND = '条链接已识别';
export const MULTI_LINK_LABEL_LINKS_FOUND = '条链接已识别';
export const MULTI_LINK_LABEL_EMPTY = '链接将显示在此处';
export const MULTI_LINK_LABEL_EMPTY_HINT = '在左侧粘贴网址，即可在此预览带图标的链接。';
export const PORTAL_MSG_MULTI_LINK_SAVED = '链接已保存';
export const PORTAL_MSG_SAVING_LINKS = '正在保存链接...';
export const PORTAL_MSG_MULTI_LINK_SAVE_FAILED_DETAIL = '无法保存链接，请重试。';
export const PORTAL_SUBTITLE = '你的链接与资源指令中心';
export const PORTAL_LABEL_DATE_CALCULATOR = '日期日历';
export const PORTAL_TABLE_HEADER_FIRST = '一';
export const PORTAL_TABLE_HEADER_SECOND = '二';
export const PORTAL_TABLE_HEADER_THIRD = '三';
export const PORTAL_TABLE_HEADER_FOURTH = '四';
export const PORTAL_BTN_TITLE_EDIT_CATEGORY = '编辑类别';
export const PORTAL_BTN_TITLE_NEW_CATEGORY = '新建类别';
export const LABEL_EDIT = '编辑';
export const ADD_LINK_LABEL_LOADING = '获取中…';
export const ADD_LINK_LABEL_TITLE = '标题 *';
export const ADD_LINK_PLACEHOLDER_NAME = '我喜欢的资源';
export const ADD_LINK_LABEL_CATEGORY = '类别 *';
export const ADD_LINK_LABEL_CATEGORY_OPTIONAL = '类别';
export const ADD_LINK_HINT_CATEGORY_SHARED = '因为这是共享链接，已禁用';
export const ADD_LINK_PLACEHOLDER_CATEGORY = '请选择类别';

/* ─────────────────────────────────────────
   Reminder page constants
───────────────────────────────────────── */

export const REMINDER_MSG_DELETE_CONFIRM = '确认删除此条目？\n此操作无法撤销。';
export const REMINDER_MSG_COMPLETE_CONFIRM = '将此提醒标记为已完成？\n它将被移除并计入已完成。';
export const REMINDER_COMPLETE_TITLE = '完成';
export const REMINDER_MSG_DELETING = '正在删除提醒...';
export const REMINDER_MSG_COMPLETING = '正在完成提醒...';
export const REMINDER_MSG_TAG_DUPLICATE = '该名称已被其他标签使用。';
export const REMINDER_PLACEHOLDER_TEXT = '提醒我关于…';
export const REMINDER_PLACEHOLDER_TAG = '标签…';
export const REMINDER_ADD_LINK_LABEL = '添加链接';
export const REMINDER_ADD_DATE_LABEL = '添加日期';
export const REMINDER_ADD_TIME_LABEL = '添加时间';
export const REMINDER_START_TIME_LABEL = '开始';
export const REMINDER_END_TIME_LABEL = '结束';
export const REMINDER_FILTER_LABEL = '筛选';
export const REMINDER_DUE_SOON_LABEL = '即将到期';
export const REMINDER_GREETING_SINGULAR = '条提醒';
export const REMINDER_GREETING_PLURAL = '条提醒';
export const REMINDER_GREETING_COMPLETED = '已完成';
export const REMINDER_GREETING_SHARED_COMPLETED = '共享已完成';

export const REMINDER_TABLE_MESSAGES = '消息';
export const REMINDER_CATEGORY_WORK = '工作';
export const REMINDER_CATEGORY_UTILITY = '日常';
export const REMINDER_CATEGORY_OTHER = '其他';
export const REMINDER_CHIP_CUSTOM = '自定义';
export const REMINDER_CHIP_SHARED = '共享';
export const REMINDER_SHARE_LABEL = '共享';
export const REMINDER_SHARE_TOOLTIP_PENDING = '关联账户后将开始共享';
export const REMINDER_NOTIF_TITLE_3DAY = '3 天后截止';
export const REMINDER_NOTIF_TITLE_TODAY = '今日截止';

/* ─────────────────────────────────────────
   Debt Sonata page constants
───────────────────────────────────────── */

export const DEBT_DIALOG_TITLE = '新增债务';
export const DEBT_DIALOG_PLACEHOLDER_NAME = '例如：白金信用卡';
export const DEBT_DIALOG_LABEL_ADD = '添加债务';
export const DEBT_DIALOG_LABEL_CANCEL = '取消';
export const DEBT_DIALOG_LABEL_PERMANENT = '永久账户';
export const DEBT_DIALOG_LABEL_PERMANENT_DESC = '不可删除——解锁后方可移除';
export const DEBT_TOOLTIP_UNLOCK = '永久——点击解锁';
export const DEBT_TOOLTIP_MARK_PERMANENT = '标记为永久';
export const DEBT_DIALOG_LABEL_CURRENCY_CNY = '¥ 人民币';
export const DEBT_DIALOG_LABEL_CURRENCY_CAD = '$ 加元';
export const DEBT_EMPTY_STATE_MSG = '暂无债务记录。添加一条开始追踪——或好好享受零债务。';
export const DEBT_EMPTY_STATE_BTN = '添加债务';
export const DEBT_LABEL_DELETE_CONFIRM = '确认删除？';
export const DEBT_CONFIRM_DELETE_PAYMENT_MSG = '确认删除此还款记录？';
export const DEBT_CONFIRM_DELETE_PAYMENT_HEADER = '删除还款记录';
export const DEBT_CONFIRM_DELETE_PAYMENT_BTN = '删除';
export const DEBT_MSG_PAYING = '正在保存还款记录...';
export const DEBT_MSG_DELETING_PAYMENT = '正在删除还款记录...';
export const DEBT_MSG_DELETING = '正在删除债务...';
export const DEBT_MSG_RESETTING = '正在重置债务...';
export const DEBT_DIALOG_LABEL_EDIT = '设置债务';
export const DEBT_DIALOG_LABEL_SAVE = '设置';
export const DEBT_DIALOG_LABEL_BALANCE = '新金额';
export const DEBT_DUE_LABEL_NONE = '无到期日';
export const DEBT_DUE_LABEL_TODAY = '今日到期';
export const DEBT_DUE_LABEL_TOMORROW = '明日到期';
export const DEBT_SUBTITLE = '每一次还款都是一笔，走向终点的线。';
export const DEBT_STAT_LABEL_TOTAL = '总债务';
export const DEBT_STAT_LABEL_DEBTS = '债务数';
export const DEBT_STAT_LABEL_ACTIVE = '进行中';
export const DEBT_STAT_LABEL_PAID_OFF = '已还清';
export const DEBT_STAT_LABEL_DUE_SOON = '即将到期';
export const DEBT_STAT_LABEL_OVERDUE = '已逾期';
export const DEBT_STAT_LABEL_PAYMENTS = '还款次数';
export const DEBT_HEADING_YOUR_DEBTS = '我的债务';
export const DEBT_BTN_SET = '设置';
export const DEBT_BTN_RESET = '重置';
export const DEBT_BTN_RESTORE = '恢复？';
export const DEBT_BTN_HISTORY = '记录';
export const DEBT_HISTORY_EMPTY = '暂无还款记录——在上方开始还款吧。';
export const ADD_DEBT_LABEL_AMOUNT = '金额';
export const ADD_DEBT_LABEL_CURRENCY = '货币';
export const ADD_DEBT_LABEL_DUE_DATE = '到期日';
export const MONTH_NAMES_SHORT: string[] = [
	'1月',
	'2月',
	'3月',
	'4月',
	'5月',
	'6月',
	'7月',
	'8月',
	'9月',
	'10月',
	'11月',
	'12月'
];
export const DEBT_CATEGORY_LABEL_CARD = '信用卡';
export const LABEL_PERSONAL = '个人';
export const DEBT_CATEGORY_LABEL_FINANCING = '分期';
export const DEBT_CATEGORY_LABEL_MORTGAGE = '房贷';
export const DEBT_LABEL_PCT_CLEARED = '% 已还清';
export const DEBT_LABEL_PCT_PAID = '% 已还清';
export const DEBT_LABEL_OF = '共';
export const DEBT_LABEL_REMAINING_OF = '共';
export const DEBT_LABEL_PAID_IN_FULL = '终章 · 已还清';
export const DEBT_LABEL_CUSTOM_PAY = '自定义';
export const DEBT_DAYS_LEFT_SUFFIX = '天后截止';
export const DEBT_DAYS_OVERDUE_PREFIX = '已逾期';
export const DEBT_DAYS_OVERDUE_SUFFIX = '天';

/* ─────────────────────────────────────────
   Patch Notes page constants
───────────────────────────────────────── */

export const PATCH_MSG_DELETE_CONFIRM = '确认删除此条目？';

export const STATUS_TODO = '待开始';
export const STATUS_IN_PROGRESS = '进行中';
export const STATUS_COMPLETED = '已完成';
export const STATUS_DEBUG = '修补中';
export const STATUS_DRAFT = '草稿';
export const STATUS_RESOLVED = '已修复';

export const PATCH_LABEL_PATCH_NOTES = '迭代日志';
export const PATCH_LABEL_RELEASE_NOTES = '发行日志';
export const PATCH_SWITCH_PREFIX_SPRINT = '迭代';
export const PATCH_SWITCH_PREFIX_RELEASE = '发行';
export const PATCH_SWITCH_NOTES = '日志';
export const PATCH_SUBTITLE_PATCH_NOTES = '开发进程与待办事项';
export const PATCH_SUBTITLE_RELEASE_NOTES = '已发布版本与发行历史';
export const PATCH_EYEBROW = '进度追踪';
export const PATCH_PLACEHOLDER_SEARCH = '搜索日志…';
export const PATCH_TABLE_HEADER_COMPONENT = '模块';
export const PATCH_TABLE_HEADER_ELEMENT = '元素';
export const PATCH_TABLE_HEADER_DETAILS = '详情';
export const PATCH_TABLE_HEADER_TIMESTAMP = '时间戳';
export const PATCH_EMPTY_SEARCH = '没有符合搜索条件的日志';
export const PATCH_LABEL_PREVIOUS_RELEASES = '历史发行';
export const PATCH_STAT_TOTAL = '总计';
export const PATCH_STAT_BUGS_RESOLVED = '漏洞已修复';
export const PATCH_STAT_IN_PROGRESS = '进行中';
export const PATCH_STAT_OPEN_BUGS = '漏洞待修复';
export const PATCH_PAGINATION_TEMPLATE = '显示第 {first} 至 {last} 条，共 {totalRecords} 条';
export const PATCH_COL_STATUS = '状态';
export const PATCH_BTN_CLEAR_FILTER = '清除筛选';
export const PATCH_DROPDOWN_ALL_PAGES = '全页面';
export const PATCH_DROPDOWN_ACCOUNT = '账户';
export const PATCH_HEATMAP_TITLE = '月度活动';
export const PATCH_HEATMAP_LEGEND_LESS = '少';
export const PATCH_HEATMAP_LEGEND_MORE = '多';
export const PATCH_HEATMAP_FOOTER_FUTURE = '未来月份已置灰';
export const PATCH_HEATMAP_FOOTER_ITEMS = '条记录横跨';
export const PATCH_HEATMAP_FOOTER_YEARS = '年';

/* ─────────────────────────────────────────
   Context menu
───────────────────────────────────────── */

export const CTX_LABEL_COPY = '复制';
export const CTX_LABEL_CUT = '剪切';
export const CTX_LABEL_PASTE = '粘贴';
export const CTX_LABEL_SELECT_ALL = '全选';
export const CTX_LABEL_MY_ACCOUNT = '我的账户';
export const CTX_LABEL_INSPECT = '检查';
export const CTX_SEARCH_PLACEHOLDER = '搜索…';
export const CTX_LABEL_NO_RESULTS = '无结果';

/* ─────────────────────────────────────────
   Account page
───────────────────────────────────────── */

export const ACCOUNT_TITLE_PAGE = '我的账户';
export const ACCOUNT_LABEL_PROFILE_TAGLINE = '有意识地生活，一个瞬间一条记录。';
export const ACCOUNT_LABEL_MEMBER_SINCE = '会员于';
export const ACCOUNT_LABEL_STREAK_SUFFIX = ' 天连续签到';
export const ACCOUNT_LABEL_VERIFIED = '已验证';
export const ACCOUNT_MSG_NO_EMAIL = '未绑定邮箱';
export const ACCOUNT_LABEL_IDENTITY_TITLE = '账号设置';
export const ACCOUNT_LABEL_INNER_WORLD_TITLE = '专属领域';
export const ACCOUNT_LABEL_MILESTONES_TITLE = '里程碑';
export const ACCOUNT_LABEL_DANGER_ZONE_TITLE = '危险区域';
export const ACCOUNT_MSG_COMING_SOON = '此功能将在未来版本中上线。';
export const ACCOUNT_LABEL_SECURITY_TITLE = '安全';
export const ACCOUNT_LABEL_LAST_LOGIN = '上次登录';
export const ACCOUNT_LABEL_USERNAME_CHANGED = '上次修改用户名';
export const ACCOUNT_LABEL_PASSWORD_CHANGED = '上次修改密码';
export const ACCOUNT_LABEL_UPDATE_USERNAME = '更新用户名';
export const ACCOUNT_PLACEHOLDER_USERNAME = '请输入用户名';
export const ACCOUNT_MSG_USERNAME_UPDATED = '用户名已更新';
export const ACCOUNT_LABEL_CONNECTIONS_TITLE = '关联';
export const ACCOUNT_LABEL_CONNECTIONS_HINT = '仅限提醒页面';
export const ACCOUNT_LABEL_CONNECT_CODE = '关联码';
export const ACCOUNT_LABEL_COPY = '复制';
export const ACCOUNT_MSG_CODE_COPIED = '关联码已复制';
export const ACCOUNT_LABEL_CONNECTED_TITLE = '已关联账户';
export const ACCOUNT_PLACEHOLDER_CONNECT_CODE = '输入关联码';
export const ACCOUNT_LABEL_SEND_REQUEST = '发送请求';
export const ACCOUNT_LABEL_APPROVE = '同意';
export const ACCOUNT_LABEL_DECLINE = '拒绝';
export const ACCOUNT_LABEL_DISCONNECT = '断开关联';
export const ACCOUNT_LABEL_NO_CONNECTIONS = '暂无已关联账户';
export const ACCOUNT_LABEL_LINK_ACCOUNT = '关联账户';
export const ACCOUNT_LABEL_REQUESTS = '请求';
export const ACCOUNT_STATUS_PENDING = '待处理';
export const ACCOUNT_STATUS_CONNECTED = '已关联';
export const ACCOUNT_STATUS_DECLINED = '已拒绝';
export const ACCOUNT_STATUS_LEFT = '已离开';
export const ACCOUNT_MSG_REQUEST_SENT = '请求已发送';
export const ACCOUNT_MSG_REQUEST_CANCELED = '请求已取消';
export const ACCOUNT_MSG_REQUEST_FAILED = '无法发送请求';
export const ACCOUNT_MSG_INVALID_CODE = '无效的关联码';
export const ACCOUNT_MSG_SELF_CODE = '这是你自己的关联码';
export const ACCOUNT_MSG_ALREADY_CONNECTED = '已经关联';
export const ACCOUNT_MSG_ALREADY_REQUESTED = '请求已发送';
export const ACCOUNT_MSG_CONNECTED = '账户已关联';
export const ACCOUNT_MSG_DISCONNECTED = '已断开关联';
export const ACCOUNT_LABEL_CHANGE_PASSWORD = '修改密码';
export const ACCOUNT_LABEL_OLD_PASSWORD = '当前密码';
export const ACCOUNT_LABEL_CONFIRM_PASSWORD = '确认密码';
export const ACCOUNT_LABEL_UPDATE_PASSWORD = '更新密码';
export const ACCOUNT_LABEL_DELETE_ACCOUNT = '删除账号';
export const ACCOUNT_LABEL_DELETE_DESCRIPTION = '永久删除你的账号及所有数据。\n此操作无法撤销。';
export const ACCOUNT_MSG_PASSWORD_UPDATED = '密码已更新';
export const ACCOUNT_MSG_PASSWORD_TOO_SHORT = '密码至少需要 6 位字符。';
export const ACCOUNT_MSG_PASSWORD_MISMATCH = '两次密码输入不一致。';
export const ACCOUNT_MSG_DELETE_CONFIRMED = '账号删除请求已提交';
export const ACCOUNT_MSG_DELETING_ACCOUNT = '正在删除账号...';
export const ACCOUNT_DIALOG_DELETE_PWD_PLACEHOLDER = '请输入密码以确认';
export const ACCOUNT_DIALOG_DELETE_MSG = '此操作将永久删除你的账号及所有相关数据。此操作无法撤销。';
export const ACCOUNT_DIALOG_DELETE_GOOGLE_MSG =
	'此操作将永久删除你的账号及所有相关数据。系统可能会要求你重新选择 Google 账号以确认。此操作无法撤销。';
export const ACCOUNT_LABEL_DELETE_VAULT_PASSPHRASE = '删除保险箱口令';
export const ACCOUNT_LABEL_DELETE_VAULT_DESCRIPTION = '忘记保险箱口令时可将其删除。\n你的保险箱数据会被保留。';
export const ACCOUNT_DIALOG_DELETE_VAULT_MSG =
	'此操作将删除你的保险箱口令，你可在下次访问时重新设置。你的保险箱数据不会被删除。';
export const ACCOUNT_MSG_VAULT_PASSPHRASE_REMOVED = '保险箱口令已删除';
export const CADENCE_TITLE = '节奏';
export const CADENCE_VAULT_PASSPHRASE_LABEL = '保险箱口令';
export const CADENCE_GRACE_ALWAYS = '每次都需要';
export const CADENCE_GRACE_UNTIL_RELOAD = '直到重新加载';
export const CADENCE_GRACE_MINUTE_SUFFIX = ' 分钟';
export const CADENCE_MSG_GRACE_SAVED = '保险箱访问时限已保存';
export const ACCOUNT_STAT_LABEL_FILMS = '已记录影片';
export const ACCOUNT_STAT_LABEL_QUOTES = '心声';
export const ACCOUNT_STAT_LABEL_DEBTS = '已追踪债务';
export const ACCOUNT_STAT_LABEL_LINKS = '已保存链接';
export const ACCOUNT_STAT_UNIT_FILM = '部';
export const ACCOUNT_STAT_UNIT_QUOTE = '条';
export const ACCOUNT_STAT_UNIT_RECIPE = '份';
export const ACCOUNT_STAT_UNIT_REMINDER = '条';
export const ACCOUNT_STAT_UNIT_DEBT = '笔';
export const ACCOUNT_STAT_UNIT_LINK = '条';
export const ACCOUNT_MILESTONE_ACCOUNT_CREATED_TITLE = '账户已创建';
export const ACCOUNT_MILESTONE_ACCOUNT_CREATED_NOTE = '欢迎来到专属领域。';
export const ACCOUNT_MILESTONE_FILM_TITLE = '记录的首部电影';
export const ACCOUNT_MILESTONE_FILM_NOTE = '影迷之旅正式开启。';
export const ACCOUNT_MILESTONE_QUOTE_TITLE = '分享的首条心声';
export const ACCOUNT_MILESTONE_QUOTE_NOTE = '思绪开始留存。';
export const ACCOUNT_MILESTONE_RECIPE_TITLE = '制作的首份食谱';
export const ACCOUNT_MILESTONE_RECIPE_NOTE = '开始记录美食。';
export const ACCOUNT_MILESTONE_REMINDER_TITLE = '记录的首条提醒';
export const ACCOUNT_MILESTONE_REMINDER_NOTE = '从此不再遗漏。';
export const ACCOUNT_MILESTONE_DEBT_TITLE = '追踪的首笔债务';
export const ACCOUNT_MILESTONE_DEBT_NOTE = '财务清晰从这里开始。';
export const ACCOUNT_MILESTONE_LINK_TITLE = '保存的首条链接';
export const ACCOUNT_MILESTONE_LINK_NOTE = '第一块路标。';
export const ACCOUNT_MILESTONE_STREAK_TITLE = '首次活跃';
export const ACCOUNT_MILESTONE_STREAK_NOTE = '每段旅程都从这里出发。';
export const ACCOUNT_DOMAIN_FILMS = ' 部影片';
export const ACCOUNT_DOMAIN_QUOTES = ' 条心声';
export const ACCOUNT_DOMAIN_RECIPES = ' 份食谱';
export const ACCOUNT_DOMAIN_REMINDERS = ' 条提醒';
export const ACCOUNT_DOMAIN_DEBTS = ' 笔债务';
export const ACCOUNT_DOMAIN_LINKS = ' 条链接';
export const ACCOUNT_DOMAIN_STREAK = ' 天连续签到';
export const ACCOUNT_STRENGTH_TOO_SHORT = '太短';
export const ACCOUNT_STRENGTH_WEAK = '弱';
export const ACCOUNT_STRENGTH_FAIR = '一般';
export const ACCOUNT_STRENGTH_GOOD = '良好';
export const ACCOUNT_STRENGTH_STRONG = '强';

/* ─────────────────────────────────────────
   Today page
───────────────────────────────────────── */

export const TODAY_EYEBROW = '今日画布';
export const TODAY_TITLE = '塑造你的时间';
export const TODAY_SUBTITLE = '在时间轴上拖拽来规划属于你的每一刻';
export const TODAY_QUICKADD_PLACEHOLDER = '快速添加无时间事件——或拖拽日历来计划';
export const TODAY_HINT_DRAG_UNTIMED = '拖到此处来移除事件上的时间';
export const TODAY_PENDING_PLACEHOLDER = '为事件命名…';
export const TODAY_PENDING_HINT = '↵ 保存 · Esc 取消';
export const TODAY_LABEL_TASKS = '事件';
export const TODAY_LABEL_TRACKED = '计时';
export const TODAY_LABEL_REMINDER_READONLY = '提醒 · 只读';
export const TODAY_BTN_START_TRACKING = '开始计时';
export const TODAY_BTN_STOP_TRACKING = '停止';
export const TODAY_BTN_DRAG_CREATE = '拖拽以创建';
export const TODAY_BTN_DRAG_MOVE = '拖拽以移动';
export const TODAY_BTN_CLEAR_ALL = '清空全部';
export const TODAY_CONFIRM_CLEAR_MESSAGE = '这将删除你在「今日」添加的所有项目并清除其备份，此操作无法撤销。';
export const TODAY_CONFIRM_CLEAR_HEADER = '清空所有项目';
export const TODAY_TRACKING_PREFIX = '计时中 · ';
export const NAV_MOBILE_ALL_SECTIONS = '全部页面';
export const NAV_MOBILE_WELCOME = '欢迎';
export const NAV_MOBILE_OFFLINE = '离线 · 未登录';
export const MOBILE_BLOCKED_TITLE = '不支持手机端查看';
export const MOBILE_BLOCKED_BODY = '今日规划需要更宽的屏幕，请使用桌面端、笔记本或平板访问。';
export const TODAY_RECUR_LABELS: Partial<Record<string, string>> = {
	daily: '每天',
	weekdays: '工作日',
	weekly: '每周',
	monthly: '每月',
	yearly: '每年'
};

/* ─────────────────────────────────────────
   Vault page
───────────────────────────────────────── */

export const VAULT_LABEL_ACCOUNTS = '账户';
export const VAULT_LABEL_IDENTIFIERS = '标识项';
export const VAULT_PAGE_SUBTITLE = '你的账户、邮箱与电话如何相互关联';
export const VAULT_SEARCH_PLACEHOLDER = '搜索';
export const VAULT_SEARCH_CLEAR = '清除搜索';
export const VAULT_TAB_GRAPH = '图谱';
export const VAULT_TAB_LIST = '列表';
export const VAULT_BTN_ADD = '添加';
export const VAULT_BTN_ADD_CONNECTIONS = '添加新关联';
export const VAULT_BTN_EDIT_NAME = '编辑名称';
export const VAULT_NODE_NAME_DIALOG_TITLE = '编辑名称';
export const VAULT_EDIT_NON_ACCOUNT_TITLE = '编辑非账户';
export const VAULT_OVERVIEW_EMPTY = '暂无已分类账户';
export const VAULT_GRAPH_MOBILE_BLOCKED_BODY = '关系图谱需要更宽的屏幕，可切换到列表视图，或使用桌面端、笔记本或平板访问。';

export const VAULT_LEGEND_TITLE = '图例';
export const VAULT_LEGEND_VERIFIED = '已验证';
export const VAULT_LEGEND_BACKUP = '备用';
export const VAULT_TYPE_ACCOUNT = '账户';
export const VAULT_TYPE_EMAIL = '邮箱地址';
export const VAULT_TYPE_PHONE = '电话号码';
export const VAULT_TYPE_LINK = '链接';
export const VAULT_TYPE_NOTES = '备注';

export const VAULT_FILTER_ACCOUNTS = '账户';
export const VAULT_FILTER_EMAIL = '邮箱';
export const VAULT_FILTER_PHONE = '电话';
export const VAULT_FILTER_LINK = '链接';
export const VAULT_FILTER_NOTES = '备注';

export const VAULT_LIST_EDIT = '编辑';
export const VAULT_LIST_DONE = '完成';
export const VAULT_EMPTY_TITLE = '保险箱还是空的';
export const VAULT_EMPTY_BODY = '添加一个账户，开始梳理你的关联';

export const VAULT_BANNER_START = '关联模式 · 点击一个节点开始';
export const VAULT_BANNER_SECOND = '再点击第二个节点完成关联';
export const VAULT_BANNER_CANCEL = '取消';

export const VAULT_DIALOG_TITLE = '添加账户';
export const VAULT_DIALOG_TITLE_START = '添加到保险库';
export const VAULT_DIALOG_TITLE_IDENTIFIER_EMAIL = '添加邮箱';
export const VAULT_DIALOG_TITLE_IDENTIFIER_PHONE = '添加电话号码';
export const VAULT_DIALOG_TITLE_CATEGORY = '新建类别';
export const VAULT_EDIT_CATEGORY_TITLE = '编辑类别';
export const VAULT_DIALOG_SUBTITLE = '命名后即可附加任意关联';
export const VAULT_DIALOG_KIND_LABEL = '您要添加什么？';
export const VAULT_DIALOG_KIND_ACCOUNT_LABEL = '账户';
export const VAULT_DIALOG_KIND_ACCOUNT_HINT = '网站、应用或设备登录';
export const VAULT_DIALOG_KIND_OTHER_LABEL = '非账户';
export const VAULT_DIALOG_KIND_OTHER_HINT = '电子邮件或电话及其备用';
export const VAULT_DIALOG_KIND_CATEGORY_LABEL = '类别';
export const VAULT_DIALOG_KIND_CATEGORY_HINT = '创建一个新类别';
export const VAULT_DIALOG_TYPE_LABEL = '类型';
export const VAULT_DIALOG_IDENTIFIER_NAME_LABEL = '名称';
export const VAULT_DIALOG_PLACEHOLDER_EMAIL = '例如 jane@email.com';
export const VAULT_DIALOG_PLACEHOLDER_PHONE = '例如 +1 555 0100';
export const VAULT_DIALOG_DUPLICATE_NODE = '已存在同名条目';
export const VAULT_DIALOG_NAME_LABEL = '账户名称';
export const VAULT_DIALOG_NAME_PLACEHOLDER = '例如 Spotify、我的银行、工作电脑…';
export const VAULT_DIALOG_CATEGORY_NAME_LABEL = '类别名称';
export const VAULT_DIALOG_CATEGORY_LABEL = '类别（可多选）';
export const VAULT_DIALOG_VERIFIED_LABEL = '已验证';
export const VAULT_DIALOG_NEW_CATEGORY = '新类别';
export const VAULT_DIALOG_NEW_CATEGORY_PLACEHOLDER = '输入名称后回车';
export const VAULT_DIALOG_ICON_SEARCH_PLACEHOLDER = '搜索图标';
export const VAULT_DIALOG_ICON_RESULT_CAP_HINT = '仅显示部分匹配结果 — 搜索或选择类别以缩小范围';
export const VAULT_DIALOG_DUPLICATE_NAME = '已存在同名账户';
export const VAULT_CATEGORY_DUPLICATE_NAME = '已存在同名类别';
export const VAULT_DIALOG_CONNECTIONS_LABEL = '关联';
export const VAULT_DIALOG_CONNECTIONS_OPTIONAL = '（可选）';
export const VAULT_DIALOG_CONNECTIONS_HINT = '输入名称 — 已有或新建';
export const VAULT_DIALOG_CONNECTION_PLACEHOLDER = '搜索或添加关联…';
export const VAULT_DIALOG_ADD_CONNECTION = '添加关联';
export const VAULT_DIALOG_BACKUPS_LABEL = '备用';
export const VAULT_DIALOG_BACKUPS_HINT = '为此条目添加备用邮箱或电话号码';
export const VAULT_DIALOG_BACKUP_PLACEHOLDER = '邮箱地址或电话号码…';
export const VAULT_DIALOG_ADD_BACKUP = '添加备用';
export const VAULT_DIALOG_SUBMIT = '加入图谱';
export const VAULT_DIALOG_SUBMIT_CATEGORY = '创建类别';

export const VAULT_MSG_ACCOUNT_SAVED = '账户已添加';
export const VAULT_MSG_NODE_SAVED = '已添加到保险库';
export const VAULT_MSG_LINK_ADDED = '关联已添加';
export const VAULT_MSG_LINK_REMOVED = '关联已移除';
export const VAULT_MSG_IDENTIFIER_UPDATED = '标识已更新';
export const VAULT_MSG_SAVE_FAILED_DETAIL = '无法保存到保险箱，请重试。';
export const VAULT_MSG_SAVING = '保存中…';
export const VAULT_MSG_REMOVING_LINK = '移除关联中…';
export const VAULT_NOTE_PLACEHOLDER = '添加备注…';
export const VAULT_MSG_ADDING_NOTE = '添加备注中…';
export const VAULT_MSG_NOTE_ADDED = '备注已添加';
export const VAULT_MSG_DELETE_NODE_TITLE = '删除账户';
export const VAULT_MSG_DELETE_NODE_CONFIRM_PREFIX = '确认要删除"';
export const VAULT_MSG_DELETE_NODE_CONFIRM_SUFFIX = '"？其关联也将一并移除。';
export const VAULT_MSG_NODE_REMOVED = '账户已移除';
export const VAULT_MSG_REMOVE_NODE_FAILED_DETAIL = '无法删除账户，请重试。';
export const VAULT_MSG_DELETE_CATEGORY_TITLE = '删除类别';
export const VAULT_MSG_DELETE_CATEGORY_CONFIRM = '删除此类别？其账户将移至未分类。';
export const VAULT_MSG_CATEGORY_REMOVED = '类别已移除';
export const VAULT_MSG_CATEGORY_UPDATED = '类别已更新';
export const VAULT_MSG_CATEGORY_ADDED = '类别已添加';
export const VAULT_MSG_REMOVE_CATEGORY_FAILED_DETAIL = '无法删除类别，请重试。';
export const VAULT_CATEGORY_OTHER_LABEL = '其他';
export const VAULT_CATEGORY_UNCATEGORIZED_LABEL = '未分类';
export const VAULT_CATEGORY_TRANSPORT_LABEL = '交通';
export const VAULT_CATEGORY_FINANCE_LABEL = '财务';
export const VAULT_CATEGORY_SOCIAL_LABEL = '社交';
export const VAULT_CATEGORY_SHOPPING_LABEL = '购物';
export const VAULT_CATEGORY_GENERAL_LABEL = '通用';
