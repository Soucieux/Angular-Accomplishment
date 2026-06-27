export * from '../constants';

/* ─────────────────────────────────────────
   Shared user-facing messages
───────────────────────────────────────── */

export const MSG_LOGOUT_CONFIRM = '确认退出登录？';
export const DIALOG_HEADER_SIGN_OUT = '退出登录';
export const DIALOG_BTN_SIGN_OUT = '退出登录';
export const DIALOG_BTN_DELETE = '删除';
export const DIALOG_BTN_CONFIRM = '确认';
export const MSG_DELETE_FAILED = '删除失败';
export const MSG_SAVE_FAILED = '保存失败';
export const ACCESS_DENIED_TITLE = '无权访问';
export const ACCESS_DENIED_BODY = '你没有权限访问此页面';
export const MSG_PERMISSION_DENIED = '用户没有权限';
export const MSG_UNEXPECTED_ERROR = '发生未知错误';
export const MSG_INVALID_DIALOG_TYPE = '对话框无效';
export const MSG_DIALOG_CONTAINER_NOT_FOUND = '找不到对话框位置';
export const MSG_DIALOG_ALREADY_OPEN = '对话框已经打开';
export const ERROR_DIALOG_HEADER = '错误';
export const ERROR_DIALOG_BTN_LABEL = '确认';
export const SEARCH_COMPLETE = '搜索完成';
export const SEARCH_CANCEL = '搜索已取消';
export const RETRY_DIALOG_MSG = '连接已断开...';
export const NOTIF_ENABLED_TITLE = '推送通知已开启';
export const NOTIF_ENABLED_BODY = '你将收到来自 Vision Canvas 的通知。';

/* ─────────────────────────────────────────
   History dialog constants
───────────────────────────────────────── */

export const HISTORY_MSG_UNDO_CONFIRM = '撤销此次删除？';
export const HISTORY_DIALOG_UNDO_BTN = '撤销';
export const HISTORY_DIALOG_TITLE = '操作记录';
export const HISTORY_SUBTITLE = '点击恢复已删除条目';

/* ─────────────────────────────────────────
   Auth and login constants
───────────────────────────────────────── */

export const LOGIN_MSG_SEND_CODE_FAILED = '发送验证码失败';
export const NAV_NOTIF_LABEL_ENABLE = '开启推送通知';
export const NAV_NOTIF_LABEL_DISABLE = '关闭推送通知';
export const NAV_NOTIF_TOGGLE_ERROR = '切换推送通知时出错';
export const NAV_LABEL_MENU = '目录';
export const NAV_LABEL_HOME = '主页';
export const NAV_LABEL_TODAY = '今日';
export const NAV_LABEL_PORTAL = '链接';
export const NAV_LABEL_RESONANCE = '语录';
export const NAV_LABEL_RECIPES = '食谱';
export const NAV_LABEL_ENTERTAINMENT = '影视';
export const NAV_LABEL_REMINDER = '提醒';
export const NAV_LABEL_DEBT_SONATA = '债务';
export const NAV_LABEL_PATCH_NOTES = '开发日志';
export const NAV_LABEL_ABOUT = '关于';
export const NAV_LABEL_SIGN_OUT = '退出登录';
export const NAV_LABEL_SIGN_IN = '登录';
export const NAV_STATUS_ONLINE = '在线';
export const NAV_STATUS_OFFLINE = '离线';
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
export const LOGIN_FLAVOUR_TEXT = '欢迎回到隐秘国度';
export const LOGIN_LABEL_EMAIL = '邮箱';
export const LOGIN_MSG_EMAIL_REQUIRED = '请输入邮箱地址。';
export const LOGIN_MSG_EMAIL_INVALID = '请输入有效的邮箱地址。';
export const LOGIN_LABEL_CODE = '验证码';
export const LOGIN_MSG_CODE_REQUIRED = '请输入验证码。';
export const LOGIN_LABEL_NEW_PASSWORD = '新密码';
export const LOGIN_MSG_PASSWORD_REQUIRED = '请输入密码。';
export const LOGIN_LABEL_USERNAME = '用户名';
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

export const HOME_OVERFLOW_LABEL_REMINDERS = '前往提醒页面以查看全部';
export const HOME_OVERFLOW_LABEL_DEBT = '前往债务页面以查看全部';
export const HOME_OVERFLOW_LABEL_RECIPES = '前往食谱页面以查看全部';
export const HOME_OVERFLOW_LABEL_LINKS = '前往链接页面查以看全部';

export const HOME_WEEK_AGENDA_EMPTY_TEXT = '今日无事，好好享受。';
export const HOME_SATELLITE_TOOLTIP_STREAK = '连续记录至少一次活动的天数';
export const HOME_BRAND_SUBTITLE = '专属的内心世界';
export const HOME_FLAVOUR_LINE_1 = '有些记忆，值得留存。';
export const HOME_FLAVOUR_LINE_2 = '于是我为它们创造了一个专属小窝。';
export const HOME_CHIP_PORTAL = '链接';
export const HOME_CHIP_RESONANCE = '语录';
export const HOME_CHIP_RECIPES = '食谱';
export const HOME_CHIP_ENTERTAINMENT = '影视';
export const HOME_CHIP_REMINDER = '提醒';
export const HOME_CHIP_DEBT_SONATA = '债务';

export const ORBITAL_URGENCY_LABEL_REMINDERS = '条提醒';
export const ORBITAL_URGENCY_LABEL_DEBTS = '条债务';
export const ORBITAL_URGENCY_LABEL_VARIOUS = '多条';
export const ORBITAL_LABEL_STREAK = '连续';
export const ORBITAL_LABEL_PATCH = '日志';
export const ORBITAL_LABEL_VOICES = '语录';
export const ORBITAL_LABEL_THIS_WEEK = '本周';
export const ORBITAL_LABEL_LIFE_CLOCK = '生活时钟';
export const ORBITAL_LABEL_REMINDERS = '提醒';
export const ORBITAL_LABEL_SHORTCUTS = '快捷指令';
export const ORBITAL_LABEL_DEBT_SONATA = '债务';
export const ORBITAL_LABEL_ENTERTAINMENT = '影视';
export const ORBITAL_LABEL_RECIPES = '食谱';
export const ORBITAL_LABEL_ACTIVITY = '动态';
export const ORBITAL_PANEL_EMPTY_LINKS = '暂无链接';
export const ORBITAL_PANEL_EMPTY_PAYMENTS = '暂无还款项';
export const ORBITAL_PANEL_EMPTY_GENRES = '暂无类型数据';
export const ORBITAL_PANEL_EMPTY_RECIPES = '暂无食谱';

/* ─────────────────────────────────────────
   Entertainment page constants
───────────────────────────────────────── */

export const ENT_MSG_DELETE_CONFIRM_PREFIX = '确认删除';
export const ENT_DIALOG_TITLE_ADD_MOVIE = '添加新影片';
export const ADD_MOVIE_SUBTITLE = '输入片名或 ID 开始搜索';
export const ADD_MOVIE_LABEL_GENRE = '类型*';
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

export const RATE_LABEL_EXCELLENT = '神作';
export const RATE_LABEL_GOOD = '佳片';
export const RATE_LABEL_AVERAGE = '一般';
export const RATE_LABEL_POOR = '差评';

/* ─────────────────────────────────────────
   Resonance page constants
───────────────────────────────────────── */

export const RESONANCE_MSG_DELETE_CONFIRM = '确认删除这条留言？';
export const RESONANCE_DIALOG_TITLE_DELETE = '删除留言';
export const RESONANCE_MSG_POSTED = '已发布';
export const RESONANCE_AUTHOR_ANONYMOUS = '匿名';
export const RESONANCE_LABEL_VOICES = '条心声';
export const RESONANCE_TITLE_PAGE = '语录';
export const RESONANCE_SUBTITLE = '静谧之所，每一个字都有它的份量';
export const RESONANCE_PLACEHOLDER_QUOTE = '写下值得铭记的话...';
export const RESONANCE_PLACEHOLDER_NAME = '名字（选填）';
export const RESONANCE_BTN_POST = '发布';
export const RESONANCE_EMPTY_TEXT = '还没有人留言，也许你的声音会是第一个。';
export const RESONANCE_ARIA_DELETE = '删除留言';

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

export const RECIPE_CATEGORY_ALL = '全部';
export const RECIPE_CATEGORY_CHINESE = '中餐';
export const RECIPE_CATEGORY_WESTERN = '西餐';
export const RECIPE_CATEGORY_QUICK = '简易';
export const RECIPE_CATEGORY_DESSERT = '甜点';

export const RECIPE_EYEBROW = '私人烹饪厨房';
export const RECIPE_TITLE_PAGE = '食谱';
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
export const INGREDIENT_BTN_CANCEL = '取消';
export const INGREDIENT_BTN_APPLY = '应用';

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

export const PORTAL_DIALOG_TITLE_ADD_LINK = '添加链接';
export const PORTAL_DIALOG_TITLE_EDIT_LINK = '编辑链接';
export const PORTAL_CATEGORY_DIALOG_TITLE_ADD = '新建类别';
export const PORTAL_CATEGORY_DIALOG_TITLE_EDIT = '编辑类别';
export const PORTAL_CATEGORY_DIALOG_LABEL_NAME = '名称';
export const PORTAL_CATEGORY_DIALOG_PLACEHOLDER_NAME = '例如：学习、工具、开发';
export const PORTAL_CATEGORY_DIALOG_LABEL_CANCEL = '取消';
export const PORTAL_CATEGORY_DIALOG_LABEL_SAVE = '保存';
export const PORTAL_CATEGORY_DIALOG_LABEL_DELETE = '删除';
export const PORTAL_LABEL_PIN_TO_DASHBOARD = '固定到首页';
export const PORTAL_LABEL_SHARED_LINK = '共享链接（所有用户可见）';
export const PORTAL_SECTION_SHARED = '共享';
export const PORTAL_SECTION_MY_LINKS = '我的链接';
export const PORTAL_SECTION_SHARED_SUFFIX = '条链接 · 所有人可见';
export const PORTAL_SECTION_MY_LINKS_SUFFIX = '条链接 · 仅你可见';
export const PORTAL_SECTION_SHARED_EMPTY = '暂无共享链接';
export const PORTAL_SECTION_MY_LINKS_EMPTY = '暂无链接';
export const LINK_DIALOG_LABEL_CANCEL = '取消';
export const LINK_DIALOG_LABEL_SAVE = '保存';
export const LINK_DIALOG_LABEL_ADD = '添加链接';
export const LINK_DIALOG_LABEL_TITLE_LOADING = '正在加载标题…';
export const PORTAL_DIALOG_RESET_BTN = '重置';
export const PORTAL_LABEL_CURRENT_MONTH = '本月';
export const PORTAL_LABEL_NEXT_MONTH = '下月';
export const PORTAL_LABEL_RESET = '重置';
export const PORTAL_LABEL_CELL_CONFIRM = '确认';
export const PORTAL_LABEL_CELL_DONE = '完成';
export const PORTAL_LABEL_CELL_TODAY = '今天';

export const MULTI_LINK_DIALOG_TITLE = '批量添加链接';
export const MULTI_LINK_DIALOG_SUBTITLE = '粘贴多个网址——我们将自动获取各网站图标。';
export const MULTI_LINK_LABEL_CATEGORY = '类别';
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
export const MULTI_LINK_LABEL_CANCEL = '取消';
export const MULTI_LINK_LABEL_ADD_PREFIX = '添加 ';
export const PORTAL_MSG_MULTI_LINK_SAVED = '链接已保存';
export const PORTAL_MSG_SAVING_LINKS = '正在保存链接...';
export const PORTAL_MSG_MULTI_LINK_SAVE_FAILED_DETAIL = '无法保存链接，请重试。';
export const PORTAL_TITLE_PAGE = '链接';
export const PORTAL_SUBTITLE = '你的链接与资源指令中心';
export const PORTAL_LABEL_DATE_CALCULATOR = '日期日历';
export const PORTAL_TABLE_HEADER_FIRST = '一';
export const PORTAL_TABLE_HEADER_SECOND = '二';
export const PORTAL_TABLE_HEADER_THIRD = '三';
export const PORTAL_TABLE_HEADER_FOURTH = '四';
export const PORTAL_BTN_TITLE_EDIT_CATEGORY = '编辑类别';
export const PORTAL_BTN_TITLE_NEW_CATEGORY = '新建类别';
export const PORTAL_BTN_TITLE_EDIT = '编辑';
export const PORTAL_BTN_TITLE_DELETE = '删除';
export const ADD_LINK_LABEL_LOADING = '获取中…';
export const ADD_LINK_PLACEHOLDER_NAME = '我喜欢的资源';
export const ADD_LINK_LABEL_CATEGORY = '类别 *';
export const ADD_LINK_PLACEHOLDER_CATEGORY = '请选择类别';

/* ─────────────────────────────────────────
   Reminder page constants
───────────────────────────────────────── */

export const REMINDER_MSG_DELETE_CONFIRM = '确认删除此条目？\n此操作无法撤销。';
export const REMINDER_MSG_TAG_DUPLICATE = '该名称已被其他标签使用。';
export const REMINDER_PLACEHOLDER_TEXT = '提醒我关于…';
export const REMINDER_PLACEHOLDER_TAG = '标签…';
export const REMINDER_ADD_LINK_LABEL = '添加链接';
export const REMINDER_ADD_DATE_LABEL = '添加日期';
export const REMINDER_ADD_TIME_LABEL = '添加时间';
export const REMINDER_ADD_BTN_LABEL = '添加';
export const REMINDER_FILTER_ALL = '全部';
export const REMINDER_FILTER_LABEL = '筛选';
export const REMINDER_DUE_SOON_LABEL = '即将到期';
export const REMINDER_GREETING_SINGULAR = '条提醒';
export const REMINDER_GREETING_PLURAL = '条提醒';

export const REMINDER_TABLE_MESSAGES = '消息';
export const REMINDER_CATEGORY_PERSONAL = '个人';
export const REMINDER_CHIP_CUSTOM = '自定义';
export const REMINDER_TITLE_PAGE = '提醒';
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
export const DEBT_MSG_RESETTING = '正在重置债务...';
export const DEBT_DIALOG_LABEL_EDIT = '设置债务';
export const DEBT_DIALOG_LABEL_SAVE = '设置';
export const DEBT_DIALOG_LABEL_BALANCE = '新金额';
export const DEBT_DUE_LABEL_NONE = '无到期日';
export const DEBT_DUE_LABEL_TODAY = '今日到期';
export const DEBT_DUE_LABEL_TOMORROW = '明日到期';
export const DEBT_TITLE_PAGE = '债务';
export const DEBT_SUBTITLE = '每一次还款都是一笔，走向终点的线。';
export const DEBT_STAT_LABEL_TOTAL = '总债务';
export const DEBT_STAT_LABEL_DEBTS = '债务数';
export const DEBT_STAT_LABEL_ACTIVE = '进行中';
export const DEBT_STAT_LABEL_PAID_OFF = '已还清';
export const DEBT_STAT_LABEL_DUE_SOON = '即将到期';
export const DEBT_STAT_LABEL_OVERDUE = '已逾期';
export const DEBT_STAT_LABEL_PAYMENTS = '还款次数';
export const DEBT_HEADING_YOUR_DEBTS = '我的债务';
export const DEBT_RIBBON_PAID_OFF = '已还清';
export const DEBT_HISTORY_EMPTY = '暂无还款记录——在上方开始还款吧。';
export const ADD_DEBT_LABEL_NAME = '名称';
export const ADD_DEBT_LABEL_CATEGORY = '类别';
export const ADD_DEBT_LABEL_AMOUNT = '金额';
export const ADD_DEBT_LABEL_CURRENCY = '货币';
export const ADD_DEBT_LABEL_DUE_DATE = '到期日';

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

export const PATCH_LABEL_PATCH_NOTES = 'Sprint 日志';
export const PATCH_LABEL_RELEASE_NOTES = '发行日志';
export const PATCH_SWITCH_PREFIX_SPRINT = 'Sprint';
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
export const PATCH_TABLE_HEADER_EDIT = '编辑';
export const PATCH_EMPTY_SEARCH = '没有符合搜索条件的日志';
export const PATCH_LABEL_PREVIOUS_RELEASES = '历史发行';

/* ─────────────────────────────────────────
   Context menu
───────────────────────────────────────── */

export const CTX_LABEL_COPY = '复制';
export const CTX_LABEL_CUT = '剪切';
export const CTX_LABEL_PASTE = '粘贴';
export const CTX_LABEL_SELECT_ALL = '全选';
export const CTX_LABEL_MY_ACCOUNT = '我的账户';
export const CTX_LABEL_SIGN_OUT = '退出登录';
export const CTX_LABEL_SIGN_IN = '登录';
export const CTX_LABEL_INSPECT = '检查';
export const CTX_SEARCH_PLACEHOLDER = '搜索…';

/* ─────────────────────────────────────────
   Account page
───────────────────────────────────────── */

export const ACCOUNT_TITLE_PAGE = '我的账户';
export const ACCOUNT_LABEL_PROFILE_TAGLINE = '有意识地生活，一个瞬间一条记录。';
export const ACCOUNT_LABEL_MEMBER_SINCE = '会员于';
export const ACCOUNT_LABEL_STREAK_SUFFIX = ' 天连续签到';
export const ACCOUNT_LABEL_VERIFIED = '已验证';
export const ACCOUNT_MSG_NO_EMAIL = '未绑定邮箱';
export const ACCOUNT_LABEL_IDENTITY_TITLE = '账号与安全';
export const ACCOUNT_LABEL_INNER_WORLD_TITLE = '专属领域';
export const ACCOUNT_LABEL_MILESTONES_TITLE = '里程碑';
export const ACCOUNT_LABEL_DANGER_ZONE_TITLE = '危险区域';
export const ACCOUNT_MSG_COMING_SOON = '此功能将在未来版本中上线。';
export const ACCOUNT_LABEL_USERNAME = '用户名';
export const ACCOUNT_LABEL_SECURITY_TITLE = '安全';
export const ACCOUNT_LABEL_LAST_LOGIN = '上次登录';
export const ACCOUNT_LABEL_USERNAME_CHANGED = '上次修改用户名';
export const ACCOUNT_LABEL_PASSWORD_CHANGED = '上次修改密码';
export const ACCOUNT_LABEL_UPDATE_USERNAME = '更新用户名';
export const ACCOUNT_PLACEHOLDER_USERNAME = '请输入用户名';
export const ACCOUNT_MSG_USERNAME_UPDATED = '用户名已更新';
export const ACCOUNT_LABEL_EMAIL = '邮箱';
export const ACCOUNT_LABEL_CHANGE_PASSWORD = '修改密码';
export const ACCOUNT_LABEL_OLD_PASSWORD = '当前密码';
export const ACCOUNT_LABEL_NEW_PASSWORD = '新密码';
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
export const ACCOUNT_DIALOG_DELETE_HEADER = '删除账号';
export const ACCOUNT_DIALOG_DELETE_BTN = '删除';
export const ACCOUNT_DIALOG_DELETE_CANCEL_BTN = '取消';

/* ─────────────────────────────────────────
   Today page
───────────────────────────────────────── */

export const TODAY_EYEBROW = '今日画布';
export const TODAY_TITLE = '塑造你的时间。';
export const TODAY_SUBTITLE = '在时间轴上拖拽来规划属于你的每一刻';
export const TODAY_QUICKADD_PLACEHOLDER = '快速添加无时间事件——或拖拽日历来计划';
export const TODAY_BTN_ADD = '添加';
export const TODAY_HINT_DRAG_UNTIMED = '拖到此处来移除事件上的时间';
export const TODAY_PENDING_PLACEHOLDER = '为事件命名…';
export const TODAY_PENDING_HINT = '↵ 保存 · Esc 取消';
export const TODAY_LABEL_REMINDERS = '提醒';
export const TODAY_LABEL_TASKS = '事件';
export const TODAY_LABEL_TRACKED = '已追踪';
export const TODAY_BTN_START_TRACKING = '开始追踪';
export const TODAY_BTN_STOP_TRACKING = '停止';
export const TODAY_BTN_DRAG_CREATE = '拖拽以创建';
export const TODAY_BTN_DRAG_MOVE = '拖拽以移动';
export const TODAY_TRACKING_PREFIX = '追踪中 · ';
export const MOBILE_BLOCKED_TITLE = '不支持手机端查看';
export const MOBILE_BLOCKED_BODY = '今日规划需要较宽屏幕才能正常使用。请在桌面端、笔记本或平板上访问。';
