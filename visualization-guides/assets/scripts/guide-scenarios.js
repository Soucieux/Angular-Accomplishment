(() => {
	const scenarios = {
		home: {
			en: {
				arrival: [
					{
						title: 'Read the signed-out editorial cover',
						purpose: 'Recognize the public Home state before looking for private widgets.',
						availableWhen: 'No active account session exists.',
						steps: ['Read 愿景画布, the established year, VISION CANVAS, and A PERSONAL INNER WORLD.', 'Read both bilingual memory lines and the 留存 watermark.', 'Use the colophon as a feature list: Portal, Resonance, Recipes, Entertainment, Reminder, and Debt Sonata.', 'Use Sign in from the navigation when private counts and actions are needed.'],
						result: 'The cover is read-only. It never shows account counts, links, reminders, debts, recipes, activity, or quick actions.'
					},
					{
						title: 'Enter the signed-in dashboard and distinguish its loading paths',
						purpose: 'Wait for the session, statistics, Portal links, categories, and shared activity to reach a usable state.',
						availableWhen: 'An authenticated session is active.',
						steps: ['Allow the 600 ms cover-to-dashboard transition to finish.', 'Wait for the orbital loading state until combined statistics arrive.', 'Allow Portal links to resolve; their skeleton fallback is released after four seconds even if the link stream fails.', 'Use Retry only after restoring the connection when Connection Lost... appears.'],
						result: 'Statistics populate the dashboard. Portal link or category failures do not deliberately block every other widget.',
						dialogs: [{ name: 'Connection Lost...', trigger: 'Critical Home data does not arrive before the shared timeout.', message: 'The shared retry dialog blocks the current route.', actions: 'Retry.', outcome: 'Retry reloads the current application route; it does not prove that a prior request succeeded.' }],
						issues: [{ problem: 'Statistics fail without a second page-specific dialog', reason: 'The statistics error is logged and loading ends; link and shared-activity failures are also handled silently.', fix: 'Revisit Home after restoring the session or connection and compare the values with their source pages.' }]
					}
				],
				clock: [
					{
						title: 'Read the greeting, name, date, and live clock',
						purpose: 'Use the centre of Home as current-time orientation, not as an editable planner.',
						steps: ['Read Good night, Good morning, Good afternoon, or Good evening according to the current hour.', 'Read the account display name and long current date.', 'Read hours and minutes, the live seconds value, and LIFE CLOCK.'],
						result: 'The values update automatically and change no account data.',
						issues: [{ problem: 'Need to schedule or move work', reason: 'The greeting and clock are indicators only.', fix: 'Use Today for local time blocks or Reminder for scheduled reminders.' }]
					},
					{
						title: 'Interpret all four satellites',
						purpose: 'Read each number with the source and counting rule that produced it.',
						steps: ['Streak is consecutive days with at least one activity logged; use its tooltip for the same rule.', 'Patch is the total patch-note count.', 'Resonance is the total quote count.', 'This Week counts activity entries dated within the past seven days; use its tooltip to confirm the window.'],
						result: 'Satellites summarize statistics and are not navigation or editing controls.',
						issues: [{ problem: 'This Week never exceeds 20', reason: 'The recent-activity source array is capped at 20, so this value saturates for very active weeks.', fix: 'Treat it as a recent-feed count rather than an unlimited historical total.' }]
					},
					{
						title: 'Read Year, Month, Week, and Day progress at either breakpoint',
						purpose: 'Understand the four percentages without mistaking them for goals or due dates.',
						steps: ['On desktop, follow the four concentric labelled rings around the clock.', 'Read each label together with its percentage: Year, Month, Week, and Day.', 'On narrow layouts, read the four progress cards below the still-visible concentric rings.', 'Allow both copies of the values to update as the calendar and clock advance.'],
						result: 'Rings and cards report the same four time-progress metrics; neither surface is interactive.',
						issues: [{ problem: 'The four values appear twice on a narrow screen', reason: 'The current responsive CSS reveals the progress cards without hiding the concentric drawing.', fix: 'Read either copy; they describe the same values. Treat the duplication as a current layout quirk.' }]
					}
				],
				panels: [
					{
						title: 'Use the Monday-to-Sunday week agenda',
						purpose: 'See this week’s dated reminders and debts without editing either source.',
						steps: ['Read all seven day labels and numbers from Monday through Sunday.', 'Distinguish today, past days, and the currently selected day styling.', 'Select a day to read its Due list.', 'Read reminder and debt icons, names, and stored date tags; read Nothing due — an open day. when the selected day has no items.'],
						result: 'Day selection changes only the visible agenda. Edits still belong to Reminder or Debt Sonata.'
					},
					{
						title: 'Read every Reminders panel state',
						purpose: 'Understand the true open count, upcoming rows, colors, empty text, and overflow.',
						steps: ['Read the badge as the full open reminder count, not the number of visible rows.', 'Read rows in ascending calendar-date order.', 'Use red due text for overdue items and blue for other dated items.', 'Read No reminders yet when no eligible dated rows exist.', 'When the twenty-row source cap is reached, use View all in Reminders or select the Reminders heading.'],
						result: 'The heading and overflow route open Reminder; Home does not complete, edit, or delete a reminder.'
					},
					{
						title: 'Read and open every Shortcuts panel state',
						purpose: 'Use personal Portal links without confusing them with shared links or pinned links.',
						steps: ['Read the badge as the number of personal links loaded for the account.', 'Read No links yet when none are available.', 'Match each row dot to its Portal category color; uncategorized links use the fallback color.', 'Select a row to open its URL in a new tab and request a visit-count increment.', 'At the twenty-row cap, use View all in Shortcuts or select the Shortcuts heading.'],
						result: 'The destination opens even when the background visit-count update later fails.',
						issues: [{ problem: 'Visit count does not change', reason: 'The increment failure is logged without a user-visible Home dialog.', fix: 'Do not reopen repeatedly. Continue using the destination and verify the count later in Portal.' }]
					},
					{
						title: 'Read every Debt Sonata panel state',
						purpose: 'Interpret the full due count, nearest dated accounts, progress, category color, and due urgency.',
						steps: ['Read the badge as the full unpaid-debt count.', 'Read No upcoming payments when no dated debt rows are eligible.', 'Read rows in ascending due-date order.', 'Read each percentage as paid progress: (original − remaining) ÷ original; a missing or zero original amount displays 0%.', 'Use red due text for overdue accounts and orange for other dated accounts.', 'At twenty rows, use View all in Debt Sonata or select the heading.'],
						result: 'Home never records a payment, resets a cycle, changes a lock, or deletes a debt.'
					},
					{
						title: 'Read the Entertainment total and genre distribution',
						purpose: 'Understand how the Home genre bars summarize the library.',
						steps: ['Read the badge as the total film count.', 'Read No genre data yet when there are no positive genre counts.', 'Read up to the five highest non-Favourite genres, sorted from largest to smallest.', 'Treat the longest bar as 100%; every other bar is relative to that top genre, not to the entire library.', 'Select Entertainment to open the source library.'],
						result: 'Genre colors cycle by rank and do not represent status or rating.'
					},
					{
						title: 'Read the Recipes total and compact list',
						purpose: 'See recipe names and localized categories while keeping cooking and editing on the source page.',
						steps: ['Read the badge as the total recipe count.', 'Read No recipes yet when the compact source list is empty.', 'Read each recipe name with its localized stored category.', 'At twenty rows, use View all in Recipes or select the Recipes heading.'],
						result: 'Home does not open a recipe detail or change servings; the heading routes to Recipes.'
					},
					{
						title: 'Interpret every Activity row and shared-account variant',
						purpose: 'Read the newest personal and connected-account events without treating the feed as a complete audit log.',
						steps: ['Read the icon, localized activity label, detail, and relative time together.', 'Recognize movie add/update/remove/search/rating/genre/favourite events; patch add/bug/status/edit/delete; reminder add/update/remove; quote add/remove; link add/update/remove/category add/update/remove/date-calculator update; debt add/update/reset/remove/payment removal/lock update; recipe add/update/remove; and Vault account add/remove.', 'Read violet shared rows as connected-account reminder activity.', 'For shared edits, read the changed content, date, link, tag, start time, end time, or sharing aspect.', 'Read No activity yet when no supported entry exists.'],
						result: 'Unknown or malformed activity entries are skipped. Personal and shared activity is sorted newest first and capped at 20 rows.',
						issues: [{ problem: 'An older event is missing', reason: 'The unified Home feed is a twenty-row recent summary, not an unlimited ledger.', fix: 'Use the owning page or Patch Notes history when a deeper audit exists.' }]
					}
				],
				routes: [
					{
						title: 'Read the three-day urgency strip',
						purpose: 'Identify reminders and debts due soon or already overdue before opening the source page.',
						steps: ['Look for dated reminder and debt rows whose days-until-due value is three or less.', 'For one item in a group, read its truncated name and due label.', 'For multiple items, read the count and nearest due label; Various appears when their dates differ.', 'When both source types qualify, read the reminder and debt summaries together.'],
						result: 'The urgency strip is hidden on narrow/mobile layouts and absent when no source item qualifies.',
						issues: [{ problem: 'No urgency strip appears', reason: 'No eligible dated row is within the window, or the current layout intentionally hides the strip.', fix: 'Use the week agenda and source panels instead.' }]
					},
					{
						title: 'Use all six quick actions and know their arrival state',
						purpose: 'Jump directly to the correct creation surface without guessing what the destination will open.',
						steps: ['Add Movie opens Entertainment with its add dialog request.', 'Add Quote opens Resonance at its composer.', 'Add Recipe opens Recipes in the add view.', 'Add Debt opens Debt Sonata with its add dialog request.', 'Add Reminder opens Reminder at the composer.', 'Add Shortcut opens Portal with its multi-link dialog request.'],
						result: 'The destination page owns all fields, validation, permissions, saving, cancellation, and errors.'
					},
					{
						title: 'Open up to six pinned personal Portal links',
						purpose: 'Use the quick-access row without confusing pinned, shared, and category behavior.',
						steps: ['Home includes only personal links whose isPinned value is true.', 'Read at most the first six eligible links.', 'Match each dot to the Portal category color, or the fallback color when the category is unavailable.', 'Select a recognized link to open it in a new tab and request a visit-count increment.'],
						result: 'Shared links are excluded. Pinning order and additional pinned links must be managed in Portal.',
						safety: 'Home summarizes and routes. Complete, edit, pay, restore, share, or delete only on the page that owns the record.'
					}
				]
			},
			zh: {
				arrival: [
					{ title: '阅读未登录时的编辑式封面', purpose: '寻找私人组件前，先识别主页的公开状态。', availableWhen: '当前没有有效账户会话。', steps: ['阅读「愿景画布」、创立年份、「VISION CANVAS」与「专属的内心世界」。', '阅读两组中英文记忆文案与「留存」水印。', '把页尾功能列读作「链接、心声、食谱、影视、提醒、债务」。', '需要私人统计与操作时，从导航使用登录。'], result: '公开封面只读，不显示账户统计、链接、提醒、债务、食谱、动态或快捷操作。' },
					{ title: '进入登录后的仪表盘并区分载入路径', purpose: '等待会话、统计、链接、类别和共享动态进入可用状态。', availableWhen: '已经建立身份验证会话。', steps: ['等待 600 毫秒封面到仪表盘的过渡结束。', '合并统计到达前，先等待轨道载入状态。', '允许链接完成载入；即使链接流失败，四秒后也会解除其骨架后备。', '出现「连接已断开...」时，先恢复网络，再使用「重试」。'], result: '统计会填充仪表盘；链接或类别失败不会刻意阻塞全部其他组件。', dialogs: [{ name: '连接已断开...', trigger: '关键主页数据在共享超时前没有到达。', message: '共享重试对话框会阻塞当前路由。', actions: '重试。', outcome: '重试会重新载入当前应用路由，但不会证明之前请求已经成功。' }], issues: [{ problem: '统计失败后没有第二个页面专用对话框', reason: '统计错误只会记录并结束载入；链接与共享动态失败也会静默处理。', fix: '恢复会话或网络后重新进入主页，并与来源页面对照数值。' }] }
				],
				clock: [
					{ title: '读取问候、姓名、日期与实时钟', purpose: '把主页中心当作当前时间定位，而不是可编辑规划器。', steps: ['按当前小时读取「晚安、早上好、下午好、晚上好」之一。', '读取账户显示名与完整日期。', '读取小时分钟、实时秒数与「生活时钟」。'], result: '数值会自动更新，不改变账户数据。', issues: [{ problem: '需要安排或移动工作', reason: '问候与时钟只提供指示。', fix: '本地时间块使用「今日」，定时提醒使用「提醒」。' }] },
					{ title: '解释全部四颗卫星', purpose: '把每个数字与来源及计数规则一起理解。', steps: ['「连续」表示至少记录一次活动的连续天数；其提示使用同一规则。', '「日志」是日志总数。', '「心声」是语录总数。', '「本周」统计过去 7 天内添加的活动记录；其提示说明同一时间窗口。'], result: '卫星只汇总统计，不负责导航或编辑。', issues: [{ problem: '「本周」永远不超过 20', reason: '最近动态来源数组最多保留 20 条，所以高频一周会在 20 饱和。', fix: '把它理解为近期动态计数，而不是无限历史总数。' }] },
					{ title: '在两种断点读取年、月、周、日进度', purpose: '理解四项百分比，不把它们误当作目标或截止日期。', steps: ['桌面端读取时钟周围四个带标签的同心进度环。', '把「年、月、周、日」分别与百分比一起阅读。', '窄屏时读取仍然可见的进度环，以及其下方四张进度卡。', '让两组数值随日期与时间推进自动更新。'], result: '进度环与进度卡显示同样四项指标，都不可操作。', issues: [{ problem: '窄屏把四项数值显示了两次', reason: '当前响应式样式会显示进度卡，但没有隐藏同心进度图。', fix: '读取任意一组即可；两组表示同一数值。请把重复显示视为当前布局问题。' }] }
				],
				panels: [
					{ title: '使用周一到周日的周议程', purpose: '无需编辑来源，就能查看本周带日期的提醒与债务。', steps: ['从周一到周日读取七个日期标签和数字。', '区分今日、过去日期与当前选中日期的样式。', '选择一天，读取其「截止」列表。', '读取提醒／债务图标、名称与日期标签；无项目时读取「今日无事，好好享受。」'], result: '日期选择只改变可见议程；编辑仍在「提醒」或「债务」。' },
					{ title: '读取「提醒」面板的所有状态', purpose: '理解真实待办数、日期行、颜色、空状态与溢出入口。', steps: ['徽标是完整待办提醒数，不等于可见行数。', '日期行按日历升序排列。', '过期日期使用红色，其他带日期项目使用蓝色。', '没有符合条件的日期行时读取「暂无提醒」。', '来源达到 20 行上限时，使用「前往提醒页面以查看全部」或点击「提醒」标题。'], result: '标题与溢出入口前往「提醒」；主页不会完成、编辑或删除提醒。' },
					{ title: '读取并打开「快捷指令」面板的所有状态', purpose: '使用个人链接，同时区分共享链接与置顶链接。', steps: ['徽标是当前载入的个人链接数量。', '没有内容时读取「暂无链接」。', '每行圆点对应链接类别颜色；找不到类别时使用后备色。', '点击一行在新标签页打开网址，并请求增加访问次数。', '达到 20 行上限时，使用「前往链接页面查以看全部」或点击「快捷指令」标题。'], result: '即使后台访问次数更新失败，目标网址仍会打开。', issues: [{ problem: '访问次数没有变化', reason: '更新失败只会记录，不显示主页对话框。', fix: '不要连续重复打开；继续使用目标，并稍后在「链接」核对。' }] },
					{ title: '读取「债务」面板的所有状态', purpose: '解释完整待还数、最近日期、进度、类别颜色与紧迫性。', steps: ['徽标是完整未还债务数。', '没有带日期债务行时读取「暂无还款项」。', '各行按到期日升序排列。', '百分比表示已还进度：（原始金额−剩余金额）÷原始金额；缺少或为零的原始金额显示 0%。', '过期项目使用红色日期，其他带日期项目使用橙色。', '达到 20 行时，使用「前往债务页面以查看全部」或点击标题。'], result: '主页不会记录还款、重置周期、改变锁定或删除债务。' },
					{ title: '读取「影视」总数与类型分布', purpose: '理解主页类型条如何汇总片库。', steps: ['徽标是影片总数。', '没有正数类型统计时读取「暂无类型数据」。', '最多读取五个非「收藏」类型，并按数量从高到低排列。', '最长条为 100%；其他条相对第一名计算，不是占整个片库的百分比。', '点击「影视」进入来源片库。'], result: '类型颜色按排名循环，不表示状态或评分。' },
					{ title: '读取「食谱」总数与紧凑列表', purpose: '查看食谱名和本地化类别，同时把烹饪与编辑留在来源页面。', steps: ['徽标是食谱总数。', '紧凑来源列表为空时读取「暂无食谱」。', '每行同时读取食谱名与已存类别的本地化名称。', '达到 20 行时，使用「前往食谱页面以查看全部」或点击标题。'], result: '主页不打开食谱详情，也不调整份量；标题会进入「食谱」。' },
					{ title: '解释每条「动态」与关联账户变体', purpose: '读取最新个人与关联账户事件，同时不把近期列表当作完整审计日志。', steps: ['把图标、本地化活动标签、详情与相对时间一起读取。', '识别影片新增／更新／移除／搜索／评分／类型／收藏，日志新增／漏洞／状态／编辑／删除，提醒新增／更新／移除，心声新增／移除，链接新增／更新／移除／类别新增／更新／移除／日期日历更新，债务新增／更新／重置／移除／还款记录删除／锁更新，食谱新增／更新／移除，以及保险箱账户新增／移除。', '紫色共享行表示关联账户的提醒动态。', '共享编辑会写明内容、日期、链接、标签、开始时间、结束时间或共享状态。', '没有支持的记录时读取「暂无活动记录」。'], result: '未知或格式错误的动态会被跳过；个人与共享动态按最新优先合并，最多 20 行。', issues: [{ problem: '较旧事件缺失', reason: '主页统一动态是 20 行近期摘要，不是无限台账。', fix: '需要深度审计时使用所属页面或日志历史。' }] }
				],
				routes: [
					{ title: '读取三天紧迫条', purpose: '打开来源页面前，识别即将到期或已经过期的提醒与债务。', steps: ['寻找距离到期天数不超过 3 的提醒与债务日期行。', '一个类别只有一项时，读取截短名称与其日期标签。', '同类多项时读取数量与最近日期；日期不同时会显示「多条」。', '两类都符合时，把提醒与债务摘要一起读取。'], result: '紧迫条在窄屏／手机隐藏；没有符合来源项目时也不显示。', issues: [{ problem: '没有显示紧迫条', reason: '没有带日期项目进入窗口，或当前布局刻意隐藏。', fix: '改用周议程与来源面板。' }] },
					{ title: '使用全部六项快捷操作，并预期正确抵达状态', purpose: '直接进入创建界面，不猜测目标页面会打开什么。', steps: ['「添加影片」进入「影视」并请求打开添加对话框。', '「添加心声」进入「心声」输入区。', '「添加食谱」进入「食谱」添加视图。', '「添加债务」进入「债务」并请求打开添加对话框。', '「添加提醒」进入「提醒」输入区。', '「添加快捷指令」进入「链接」并请求打开多链接对话框。'], result: '全部字段、校验、权限、保存、取消与错误都由目标页面负责。' },
					{ title: '打开最多六条置顶个人链接', purpose: '使用快速访问行，同时区分置顶、共享与类别行为。', steps: ['主页只包含 isPinned 为 true 的个人链接。', '最多读取前六条符合条件的链接。', '每个圆点对应链接类别颜色；类别不可用时采用后备色。', '确认目标后点击，在新标签页打开，并请求增加访问次数。'], result: '共享链接会被排除；置顶顺序和更多置顶链接必须在「链接」管理。', safety: '主页只负责汇总和跳转；完成、编辑、还款、恢复、共享或删除必须在记录所属页面执行。' }
				]
			}
		},
		today: {
			en: {
				anytime: [
					{
						title: 'Quick-add an untimed local task',
						purpose: 'Use Anytime for work that does not yet need a position on the clock.',
						availableWhen: 'The desktop planner is available above the narrow-screen cutoff. On widths of 940px or less, Today shows a desktop-required page message instead.',
						steps: ['Type a title in Quick Add.', 'Press Enter or select Add; both perform the same action.', 'Find the new item in Anytime and confirm that the input has cleared.'],
						inputs: [{ name: 'Task title', requirement: 'Must contain a non-space character. Leading and trailing spaces are removed.', example: 'Prepare meeting notes' }],
						result: 'A local task is created and included in the account-level Today backup; it is not tied to a selected calendar date.',
						issues: [{ problem: 'Nothing is added', reason: 'The field was empty or contained spaces only.', fix: 'Enter a visible title. Today intentionally ignores a blank draft and does not show an error dialog.' }]
					},
					{
						title: 'Rename, complete, remove, or schedule an Anytime item',
						purpose: 'Manage Today-owned tasks directly and recognize the controls that are intentionally unavailable for Reminder items.',
						steps: ['Select a local title to edit it.', 'Press Enter or leave the field to save; press Escape to cancel.', 'Select the completion circle to toggle a local task.', 'Use Remove to delete a local or tracked item after its exit animation.', 'When Drag Move is enabled, drag a local task from Anytime onto the clock.'],
						inputs: [{ name: 'Edited title', requirement: 'A blank edit restores the previous title instead of deleting the item.', example: 'Prepare final meeting notes' }],
						result: 'Local changes save to Today. A scheduled local task gains a start and end time.',
						safety: 'Reminder-sourced items are read-only here: Today does not rename, complete, move, resize, or remove them.',
						issues: [{ problem: 'Controls do not appear or have no effect', reason: 'The item comes from Reminder rather than Today.', fix: 'Open Reminder and change the source item there.' }]
					},
					{
						title: 'Understand restoration, date scope, and source refresh',
						purpose: 'Know which items belong to Today, why a Reminder item can change without being edited here, and why there is no day picker.',
						steps: ['Return to Today to restore its account-level local and tracked backup.', 'Treat Reminder rows as subscribed source data rather than Today backup data.', 'After the date changes at midnight, allow Today to refresh only the Reminder subscription.', 'Use the displayed date and clock as orientation; Today has no previous-day, next-day, or date-picker control.'],
						result: 'Today-owned items remain on the saved board across dates; Reminder-owned items refresh for the actual current date.',
						issues: [{ problem: 'A local write or backup synchronization fails', reason: 'Today does not expose a user-visible write-error dialog for this local autosave path.', fix: 'Do not assume the change reached durable storage. Revisit the page and verify the item; retry the edit if the restored state is older.' }]
					}
				],
				draw: [
					{
						title: 'Draw a valid timed block',
						purpose: 'Create a local time range directly in an empty part of the day grid.',
						steps: ['Turn on Drag Create; Drag Move turns off automatically.', 'Press on empty grid space and drag vertically.', 'Release to create a pending range.', 'Review the snapped start and end before naming it.'],
						inputs: [{ name: 'Time range', requirement: 'Snaps to 15-minute increments, stays inside the day, and has a minimum duration of 15 minutes.', example: '09:00–10:30' }],
						result: 'A pending block appears at the normalized time range; it is not saved until it has a valid name.',
						issues: [{ problem: 'Dragging does not start', reason: 'Drag Create is off, the gesture began on an existing block, or another pending block already exists.', fix: 'Enable Drag Create and begin on empty grid space. If a pending block exists, finish or cancel it first.' }]
					},
					{
						title: 'Save or discard the pending block',
						purpose: 'Finish the temporary block without accidentally storing an unnamed item.',
						steps: ['Type a non-blank name and press Enter to save.', 'Press Escape to cancel instead.', 'You can also click empty grid space while a pending block exists to discard it.'],
						inputs: [{ name: 'Block name', requirement: 'Must contain a non-space character; surrounding spaces are removed.', example: 'Focused writing' }],
						result: 'A valid name creates a local timed block. Escape, an empty-grid cancellation, or a blank submission removes the pending block.',
						issues: [{ problem: 'The pending block disappears', reason: 'Its name was blank, Escape was pressed, or the grid was used to cancel it.', fix: 'Draw the range again and enter a non-blank name. This cancellation has no error dialog.' }]
					},
					{
						title: 'Switch creation and movement modes safely',
						purpose: 'Avoid leaving a ghost gesture or pending block when changing the planner operation.',
						steps: ['Turn on Drag Create only while drawing new blocks.', 'Turn on Drag Move only while repositioning existing work.', 'Expect the other mode to turn off and unfinished drag or pending state to clear.'],
						result: 'The modes remain mutually exclusive and the planner returns to a clean interaction state.',
						issues: [{ problem: 'An unfinished operation vanished', reason: 'Changing modes deliberately cancels pending creation, move, or resize state.', fix: 'Choose the intended mode first, then repeat the operation.' }]
					}
				],
				adjust: [
					{
						title: 'Move a local block',
						purpose: 'Reposition local planned work without recreating it.',
						steps: ['Turn on Drag Move.', 'Drag a local block vertically to a new time.', 'To remove its timing, drag the local block over Anytime and release.'],
						result: 'The local time is clamped within the day and the overlap layout recalculates.',
						issues: [{ problem: 'A block stays fixed', reason: 'Drag Move is off, or the block is tracked or Reminder-owned.', fix: 'Enable Drag Move for a local block. Tracked blocks are fixed; reschedule a Reminder on the Reminder page.' }]
					},
					{
						title: 'Resize and rename a timed block',
						purpose: 'Correct the duration or label while preserving the same local record.',
						steps: ['Use the resize grip on a local block.', 'Drag the end while watching the preview.', 'Select the title to rename; Enter or blur saves and Escape cancels.'],
						inputs: [{ name: 'Duration', requirement: 'The end cannot pass the day boundary or move before the minimum 15-minute duration.', example: '45 minutes' }, { name: 'Title', requirement: 'A blank edit restores the previous title.', example: 'Design review' }],
						result: 'The normalized end time and title autosave, and overlapping blocks reflow.',
						issues: [{ problem: 'Resize stops early', reason: 'The pointer reached the minimum duration or the end of the day.', fix: 'Release within the permitted range; create a separate block if work crosses the day boundary.' }]
					},
					{
						title: 'Read overlaps and gesture previews',
						purpose: 'Understand why blocks narrow or temporarily shift while work overlaps.',
						steps: ['Create or move blocks so their ranges overlap.', 'Read the side-by-side columns rather than assuming one block was shortened.', 'During a move or resize, use the ghost preview as the proposed location.', 'Release to commit or abandon the gesture to keep the previous range.'],
						result: 'Connected overlaps share columns and reflow after every committed time change.',
						issues: [{ problem: 'A block becomes narrow', reason: 'Another block overlaps part of its time range.', fix: 'Move one range if more width is needed; the narrow layout does not change either duration.' }]
					}
				],
				track: [
					{
						title: 'Track actual work and name the result',
						purpose: 'Record elapsed work from the current minute instead of estimating a range in advance.',
						steps: ['Select Start Tracking.', 'Let the live band and elapsed label run.', 'Select Stop Tracking to create a pending tracked range.', 'Enter a non-blank name and press Enter, or press Escape to discard it.'],
						inputs: [{ name: 'Tracked name', requirement: 'Required after stopping; surrounding spaces are removed.', example: 'Research session' }],
						result: 'The saved tracked block is at least one minute long. At 15 minutes or more it exposes rename and remove controls; it never exposes move, resize, or completion controls.',
						issues: [{ problem: 'The stopped session is not saved', reason: 'Stopping only creates a pending block; a blank name discards it.', fix: 'Enter a visible name before pressing Enter. No validation dialog appears for a blank name.' }, { problem: 'A tracked band under 15 minutes has no edit or remove controls', reason: 'The current tiny-band template renders only its floating label.', fix: 'Use Clear All to remove it, or treat the missing item-level controls as a current page limitation.' }]
					},
					{
						title: 'Clear Today-owned work with confirmation',
						purpose: 'Reset local and tracked items without deleting Reminder-sourced blocks.',
						steps: ['Select Clear All.', 'Read the confirmation and choose Cancel if any Today-owned item must remain.', 'Choose Clear all only when the local day and its backup should be removed.'],
						result: 'Cancel changes nothing. Clear all removes local and tracked items and asks storage to clear the Today backup; Reminder items remain.',
						dialogs: [{ name: 'Clear All confirmation', trigger: 'Selecting Clear All.', message: 'This removes every item you added on Today and clears its backup. This cannot be undone.', actions: 'Cancel or Clear all.', outcome: 'Cancel preserves everything; Clear all removes only Today-owned local and tracked items.' }],
						safety: 'The confirmed removal cannot be undone from Today. Verify the source badges before continuing.',
						issues: [{ problem: 'Backup deletion fails after confirmation', reason: 'The storage failure is deliberately swallowed and no error dialog is shown; the autosave effect attempts to synchronize the cleared state.', fix: 'Revisit Today and verify the cleared items did not return. Repeat Clear All if the old local state is restored.' }]
					}
				],
				limits: [
					{
						title: 'Recognize Today page messages and refresh boundaries',
						purpose: 'Distinguish an unavailable layout, source refresh, and actual user errors.',
						steps: ['On a phone or narrow window, read the desktop-required message rather than searching for hidden planner controls.', 'Use a wider desktop viewport to operate Today.', 'If Today remains open through midnight, allow it to refresh Reminder items for the new date.'],
						result: 'Desktop restores the planner. Midnight changes the source date and refreshes Reminder data.',
						dialogs: [{ name: 'Desktop-required page message', trigger: 'Opening Today at 940px wide or less.', message: 'Today is intentionally unavailable at this layout size and requires desktop space.', actions: 'Open the app on desktop or widen the viewport.', outcome: 'No data changes; the planner appears once the supported layout is available.' }],
						issues: [{ problem: 'A current-date Reminder item does not appear', reason: 'The separate Reminder subscription did not refresh, its date does not match the device date, or the connection failed.', fix: 'Verify the source item and date on Reminder, recover the connection, then revisit Today.' }, { problem: 'Looking for a Today error dialog after a normal local write', reason: 'This page has no user-visible error dialog for its local autosave operations.', fix: 'Verify restored state after navigation or reload. Do not infer success solely from the absence of a dialog.' }]
					}
				]
			},
			zh: {
				anytime: [
					{ title: '快速添加未排程的本地事件', purpose: '把暂时不需要放到时间轴的工作加入无时间事件区。', availableWhen: '桌面尺寸可使用规划器；宽度不超过 940px 时，「今日」会显示需要桌面的页面提示。', steps: ['在「快速添加无时间事件——或拖拽日历来计划」中输入标题。', '按回车或点击「添加」；两者执行相同操作。', '在无时间事件区确认新项目，并检查输入框已清空。'], inputs: [{ name: '事件标题', requirement: '必须包含非空格字符；首尾空格会被移除。', example: '准备会议笔记' }], result: '创建本地事件并加入账户级「今日」备份；它不绑定到某个可选择的日历日期。', issues: [{ problem: '没有新增任何项目', reason: '输入为空或只有空格。', fix: '输入可见标题；「今日」会刻意忽略空白草稿，并且不会显示错误对话框。' }] },
					{ title: '重命名、完成、移除或排程无时间事件', purpose: '直接管理「今日」拥有的事件，并识别提醒项目刻意不可用的控件。', steps: ['点击本地标题进入编辑。', '按回车或离开输入框保存；按 Esc 取消。', '点击完成圆圈切换本地事件状态。', '使用移除控件，在退出动画后删除本地或计时项目。', '开启「拖拽以移动」后，把本地事件从无时间事件区拖到时间轴。'], inputs: [{ name: '编辑后标题', requirement: '空白编辑会恢复原标题，而不是删除项目。', example: '准备最终会议笔记' }], result: '本地修改保存到「今日」；排程后的本地事件会获得开始与结束时间。', safety: '提醒来源的项目在这里只读：「今日」不会重命名、完成、移动、缩放或移除它们。', issues: [{ problem: '控件没有出现或没有效果', reason: '项目来自「提醒」，不属于「今日」。', fix: '打开「提醒」，在来源页面修改。' }] },
					{ title: '理解恢复、日期范围与来源刷新', purpose: '分清哪些项目属于「今日」、提醒为何会自行变化，以及本页为何没有日期选择器。', steps: ['重新进入「今日」时，恢复账户级的本地与计时备份。', '把提醒行视为订阅的来源数据，而不是「今日」备份。', '跨过午夜后，「今日」只刷新提醒订阅。', '用页面日期与时钟定位当前时间；本页没有上一天、下一天或日期选择器。'], result: '「今日」拥有的项目会跨日期保留在同一块已保存画布；提醒项目按真实当前日期刷新。', issues: [{ problem: '本地写入或备份同步失败', reason: '此本地自动保存路径不会显示用户可见的写入错误对话框。', fix: '不要仅凭页面变化判断已经持久保存；重新进入页面检查，若恢复为旧状态则重试编辑。' }] }
				],
				draw: [
					{ title: '画出有效时间块', purpose: '直接在当天时间网格的空白位置创建本地时间段。', steps: ['打开「拖拽以创建」；「拖拽以移动」会自动关闭。', '在网格空白处按下并纵向拖动。', '松开，生成待定范围。', '命名前检查吸附后的开始与结束时间。'], inputs: [{ name: '时间范围', requirement: '按 15 分钟吸附，限制在当天，最短 15 分钟。', example: '09:00–10:30' }], result: '规范化的时间范围会出现待定时间块；输入有效名称前尚未保存。', issues: [{ problem: '拖动没有开始', reason: '创建模式未开启、手势从已有时间块开始，或已有待定时间块。', fix: '开启「拖拽以创建」并从网格空白处开始；如已有待定块，请先完成或取消。' }] },
					{ title: '保存或丢弃待定时间块', purpose: '完成临时时间块，避免误存无名称项目。', steps: ['输入非空名称并按回车保存。', '若要取消，按 Esc。', '已有待定块时，也可点击网格空白处将其丢弃。'], inputs: [{ name: '时间块名称', requirement: '必须包含非空格字符；首尾空格会被移除。', example: '专注写作' }], result: '有效名称会创建本地时间块；Esc、点击空白取消或提交空白名称都会移除待定块。', issues: [{ problem: '待定时间块消失', reason: '名称为空、按下 Esc，或使用网格取消。', fix: '重新拖画并输入非空名称；此类取消不会显示错误对话框。' }] },
					{ title: '安全切换创建与移动模式', purpose: '切换规划操作时，不保留幽灵手势或待定时间块。', steps: ['只在新建时间块时打开「拖拽以创建」。', '只在重新定位已有项目时打开「拖拽以移动」。', '预期另一个模式关闭，并清除未完成拖动或待定状态。'], result: '两种模式保持互斥，规划器回到干净的交互状态。', issues: [{ problem: '未完成操作消失', reason: '切换模式会刻意取消待定创建、移动或缩放状态。', fix: '先选择目标模式，再重新执行操作。' }] }
				],
				adjust: [
					{ title: '移动本地时间块', purpose: '无需重建即可重新安排本地计划工作。', steps: ['打开「拖拽以移动」。', '纵向拖动本地时间块到新时间。', '如要取消排程，把本地时间块拖到无时间事件区后松开。'], result: '本地时间会限制在当天，并重新计算重叠布局。', issues: [{ problem: '时间块保持不动', reason: '「拖拽以移动」未开启，或时间块属于计时／提醒。', fix: '本地时间块请开启「拖拽以移动」；计时块固定不动；提醒时间请在「提醒」改期。' }] },
					{ title: '缩放并重命名本地时间块', purpose: '保留同一条本地记录，同时修正时长或标题。', steps: ['使用本地时间块的缩放把手。', '拖动结束边界并观察预览。', '点击标题重命名；回车或失焦保存，Esc 取消。'], inputs: [{ name: '时长', requirement: '结束时间不能越过当天边界，也不能短于 15 分钟。', example: '45 分钟' }, { name: '标题', requirement: '空白编辑会恢复旧标题。', example: '设计评审' }], result: '规范化后的结束时间和标题会自动保存，重叠时间块重新排列。', issues: [{ problem: '缩放提前停止', reason: '指针达到最短时长或当天结束边界。', fix: '在允许范围内松开；跨日工作请另建时间块。' }] },
					{ title: '读取重叠与手势预览', purpose: '理解时间块为何在重叠时变窄，或拖动过程中暂时位移。', steps: ['创建或移动多个时间范围，使其发生重叠。', '把并排列视为同时发生的工作，不要误以为时间块被缩短。', '移动或缩放时，把幽灵预览视为建议位置。', '松开提交；放弃手势则保留原范围。'], result: '相连的重叠范围共享列，并在每次确认时间变化后重新排列。', issues: [{ problem: '时间块变窄', reason: '另一个时间块与其部分时间重叠。', fix: '如需更多宽度，请移动其中一个范围；变窄不会改变任何时长。' }] }
				],
				track: [
					{ title: '计时实际工作并命名结果', purpose: '从当前分钟记录实际耗时，而不是预先估算范围。', steps: ['点击「开始计时」。', '让实时带与耗时标签运行。', '点击「停止」，生成待定计时范围。', '输入非空名称并按回车；或按 Esc 丢弃。'], inputs: [{ name: '计时名称', requirement: '停止后必填；首尾空格会被移除。', example: '研究时段' }], result: '保存后的计时时间块至少一分钟；达到 15 分钟时可重命名或移除，但始终不能移动、缩放或标记完成。', issues: [{ problem: '停止后的时段没有保存', reason: '「停止」只会生成待定块；空白名称会将其丢弃。', fix: '按回车前输入可见名称；空白名称不会弹出校验对话框。' }, { problem: '不足 15 分钟的计时带没有编辑或移除控件', reason: '当前微型时间带模板只渲染浮动标签。', fix: '使用「清空全部」移除，或把缺少单项控件视为当前页面限制。' }] },
					{ title: '通过确认清除「今日」拥有的工作', purpose: '重置本地与计时项目，同时不删除提醒来源的时间块。', steps: ['点击「清空全部」。', '阅读确认；如果任何「今日」项目需要保留，请选择「取消」。', '只有要移除当天本地数据与备份时，才选择「清空全部」。'], result: '「取消」不会改变内容；「清空全部」会移除本地和计时项目，并请求清理「今日」备份；提醒项目保留。', dialogs: [{ name: '清空所有项目', trigger: '点击「清空全部」。', message: '这将删除你在「今日」添加的所有项目并清除其备份，此操作无法撤销。', actions: '取消或清空全部。', outcome: '取消保留所有内容；清空全部只移除「今日」拥有的本地与计时项目。' }], safety: '确认后的移除无法从「今日」撤销；继续前请检查来源标记。', issues: [{ problem: '确认后备份删除失败', reason: '存储失败会被刻意吞掉，不显示错误对话框；自动保存会尝试同步清空后的状态。', fix: '重新进入「今日」，检查已清除项目是否返回；若旧本地状态恢复，请再次执行「清空全部」。' }] }
				],
				limits: [
					{ title: '识别「今日」的页面消息与刷新边界', purpose: '区分不支持的布局、来源刷新和真正的用户错误。', steps: ['在手机或窄窗口中阅读「不支持手机端查看」，不要寻找被隐藏的规划控件。', '使用更宽的桌面视口操作「今日」。', '页面跨过午夜时，让它刷新新日期的提醒项目。'], result: '桌面布局会恢复规划器；午夜会改变来源日期并刷新提醒数据。', dialogs: [{ name: '不支持手机端查看', trigger: '在宽度不超过 940px 时打开「今日」。', message: '今日规划需要更宽的屏幕，请使用桌面端、笔记本或平板访问。', actions: '使用支持的设备，或加宽视口。', outcome: '不会改变数据；支持的布局可用后规划器出现。' }], issues: [{ problem: '当前日期的提醒没有出现', reason: '独立提醒订阅未刷新、来源日期与设备日期不一致，或连接失败。', fix: '在「提醒」核对来源项目与日期，恢复连接，再重新进入「今日」。' }, { problem: '普通本地写入后寻找错误对话框', reason: '此页面的本地自动保存没有用户可见的错误对话框。', fix: '导航离开或重新载入后检查恢复状态；不要仅凭没有对话框就判断保存成功。' }] }
				]
			}
		},
		portal: {
			en: {
				library: [{ title: 'Read ownership before acting on a link', purpose: 'Portal separates shared links from links owned by the active account.', steps: ['Wait for link and category skeletons to finish.', 'Read Shared and My Links as separate sections.', 'Select a card body to open its destination.', 'Use edit or delete only on cards that show those actions.'], result: 'Opening a link increments its visit count. A failed favicon falls back to the card’s built-in visual.', issues: [{ problem: 'Edit or delete controls are absent', reason: 'The link is shared from another account or the current session lacks ownership.', fix: 'Use the owning account to change it; shared links remain openable.' }] }],
				categories: [{ title: 'Filter, create, rename, and remove categories', purpose: 'The category strip changes the working set without changing link ownership.', steps: ['Choose All or a category chip to filter both shared and personal sections.', 'Use the plus control to open Add Category.', 'Enter a category name and color, then save.', 'Use the category edit control to rename, recolor, or request deletion.'], inputs: [{ name: 'Name', requirement: 'Required and must satisfy the dialog validation.', example: 'Research' }, { name: 'Color', requirement: 'Choose the visual used by its link cards.', example: 'Blue' }], result: 'Counts and visible sections update immediately after the category write.', safety: 'Deleting a category is confirmed and also handles its dependent links according to the dialog warning.', issues: [{ problem: 'A category cannot be changed', reason: 'It is not owned by the current account or a write failed.', fix: 'Use the owner account and retry after resolving the error dialog.' }] }],
				links: [{ title: 'Add one link, add a batch, edit, open, or delete', purpose: 'Link dialogs collect the destination and how it should appear in the library.', steps: ['Choose Add Link for one destination or Batch for multiple links.', 'Enter the URL and review any loaded title or icon.', 'Choose the category and sharing options offered by the dialog.', 'Save, then select the card body to open; use card actions to edit or delete.'], inputs: [{ name: 'URL', requirement: 'Required; normalized before storage.', example: 'https://example.com' }, { name: 'Title', requirement: 'Use the loaded title or replace it with a recognizable label.', example: 'Project reference' }, { name: 'Category', requirement: 'Choose the card’s Portal category.', example: 'Research' }], result: 'The card joins My Links; supported shared links also appear to connected members.', issues: [{ problem: 'Metadata or favicon does not load', reason: 'The destination did not expose usable page data or blocked the request.', fix: 'Enter a clear title manually; the card can still be saved with a fallback visual.' }, { problem: 'Batch contains an invalid entry', reason: 'At least one row is incomplete or invalid.', fix: 'Correct or remove the affected row before confirming the batch.' }] }],
				calculator: [{ title: 'Use the administrator date calculator', purpose: 'The collapsible calculator tracks compact monthly day values and confirmation state.', availableWhen: 'Visible only to an administrator account.', steps: ['Expand Date Calculator.', 'Choose Current month or Next month.', 'Enter allowed numeric day values and leave the cell or press Enter.', 'Use the cell button to mark a value confirmed.', 'Use Reset only after reading its confirmation dialog.'], inputs: [{ name: 'Day value', requirement: 'Numeric and constrained by field dependencies and valid day limits.', example: '15' }], result: 'Valid values save individually; confirmed count and cell state update.', issues: [{ problem: 'Cell is disabled or value reverts', reason: 'A dependency rule, month boundary, or invalid value prevents the write.', fix: 'Review neighboring values and enter a valid day from 1 to 31.' }], safety: 'Reset restores calculator defaults and is protected by confirmation.' }]
			},
			zh: {
				library: [{ title: '操作前先确认链接所有权', purpose: '链接会把共享链接与当前账户拥有的链接分开。', steps: ['等待链接与分类骨架载入结束。', '分别阅读「共享」与「我的链接」。', '点击卡片主体打开目的地。', '只有显示操作按钮的卡片才能编辑或删除。'], result: '打开链接会增加访问次数；图标载入失败时会使用卡片后备视觉。', issues: [{ problem: '没有编辑或删除按钮', reason: '链接来自其他账户，或当前会话没有所有权。', fix: '使用所属账户修改；共享链接仍可正常打开。' }] }],
				categories: [{ title: '筛选、新建、重命名与删除分类', purpose: '分类条只改变工作集合，不改变链接所有权。', steps: ['选择「全部」或分类胶囊，同时筛选共享与个人区域。', '点击加号打开新增分类。', '输入名称和颜色后保存。', '使用分类编辑控件重命名、改色或请求删除。'], inputs: [{ name: '名称', requirement: '必填，并通过对话框校验。', example: '研究' }, { name: '颜色', requirement: '决定所属链接卡片的视觉。', example: '蓝色' }], result: '分类写入后，数量与可见区域会立即更新。', safety: '删除分类需要确认，并会按警告处理其依赖链接。', issues: [{ problem: '无法修改分类', reason: '当前账户不是所有者，或写入失败。', fix: '使用所属账户，并在解决错误对话框后重试。' }] }],
				links: [{ title: '添加单个或批量链接，并编辑、打开或删除', purpose: '链接对话框负责收集目的地和卡片显示方式。', steps: ['单个目的地使用「添加链接」，多个使用「批量」。', '输入网址并检查载入的标题或图标。', '选择对话框提供的分类与共享选项。', '保存后点击卡片主体打开；使用卡片操作编辑或删除。'], inputs: [{ name: '网址', requirement: '必填；保存前会规范化。', example: 'https://example.com' }, { name: '标题', requirement: '使用载入标题或改成易识别名称。', example: '项目参考' }, { name: '分类', requirement: '选择链接分类。', example: '研究' }], result: '卡片会加入「我的链接」；受支持的共享链接也会出现在关联成员处。', issues: [{ problem: '元数据或图标未载入', reason: '目标页面未提供可用数据，或阻止请求。', fix: '手动输入清楚标题；仍可使用后备视觉保存。' }, { problem: '批量中存在无效项目', reason: '至少一行不完整或无效。', fix: '确认前修正或移除对应行。' }] }],
				calculator: [{ title: '使用管理员日期计算器', purpose: '可折叠计算器用于记录紧凑的月度日期值与确认状态。', availableWhen: '仅管理员账户可见。', steps: ['展开日期计算器。', '选择本月或下月。', '输入允许的日期数字，失焦或按回车。', '使用单元格按钮标记已确认。', '阅读确认对话框后才使用重置。'], inputs: [{ name: '日期值', requirement: '数字；受字段依赖与有效日期范围限制。', example: '15' }], result: '有效值会逐项保存，并更新已确认数量与单元格状态。', issues: [{ problem: '单元格禁用或数值恢复', reason: '依赖规则、月份边界或无效值阻止写入。', fix: '检查相邻值，并输入 1 至 31 的有效日期。' }], safety: '重置会恢复计算器默认值，并受确认对话框保护。' }]
			}
		},
		resonance: {
			en: {
				read: [
					{
						title: 'Recognize loading, empty, and populated walls',
						purpose: 'Separate a wall that is still connecting from a wall that genuinely has no public quotes.',
						availableWhen: 'Resonance can be opened without a named account. The page establishes an anonymous session before subscribing when no app session exists.',
						steps: ['Wait while skeleton cards occupy the quote grid.', 'If the subscription returns no quotes, read the empty-state invitation.', 'When quotes exist, use the voice-count pill and card grid as the current public wall.'],
						result: 'A successful subscription shows either the empty invitation or the newest public quote cards.',
						issues: [{ problem: 'The wall looks empty after a connection failure', reason: 'The quote stream converts a retrieval error into an empty list and does not open an error dialog.', fix: 'Check the connection and revisit Resonance before assuming the public wall has no quotes.' }]
					},
					{
						title: 'Read a quote card and its identity fallback',
						purpose: 'Understand every value shown on a published card without looking for hidden controls.',
						steps: ['Read the author initial and display name together.', 'Treat a missing author, or the legacy stored value Anonymous, as the localized Anonymous identity.', 'Read the timestamp as a relative-time label.', 'Read the complete quote text below the metadata row.'],
						result: 'Reading a card changes no data. Card gradients and slight tilts repeat by position only and do not indicate status.',
						issues: [{ problem: 'A card has no edit or personal delete action', reason: 'Resonance does not provide contributor editing, and removal is reserved for administrators.', fix: 'Post a corrected quote as a new entry; ask an administrator to remove an inappropriate or mistaken public quote.' }]
					}
				],
				post: [
					{
						title: 'Post with a signed-in account identity',
						purpose: 'Publish a short quote under the name already attached to the active account.',
						availableWhen: 'A named account session is active; the visitor-name field is therefore absent.',
						steps: ['Type the quote in the main textarea.', 'Keep the live count at or below 500 characters.', 'Select Post, or press Enter without Shift.', 'Wait for the write to finish before trying another submission.'],
						inputs: [{ name: 'Quote', requirement: 'Required after trimming; maximum 500 characters.', example: 'Small words can carry a long way.' }],
						result: 'The account username becomes the displayed author, the quote is stored with the current timestamp, and the form clears.',
						issues: [{ problem: 'Post remains unavailable', reason: 'The quote is blank, over 500 characters, or another submission is already running.', fix: 'Enter visible text, shorten it to the limit, or wait for the current write to settle.' }]
					},
					{
						title: 'Post as a visitor with or without a name',
						purpose: 'Contribute without a named account while controlling the public display name.',
						availableWhen: 'No named account session is active and the visitor-name field is visible.',
						steps: ['Type the public quote.', 'Optionally enter a visitor name.', 'Select Post or press Enter without Shift.', 'Leave the name blank when the card should use the localized Anonymous label.'],
						inputs: [{ name: 'Quote', requirement: 'Required after trimming; maximum 500 characters.', example: 'Notice what keeps returning.' }, { name: 'Visitor name', requirement: 'Optional; the input accepts at most 50 characters.', example: 'Visitor' }],
						result: 'The entered visitor name is stored, or an empty author is displayed later as Anonymous.',
						issues: [{ problem: 'An unwanted Anonymous label appears', reason: 'The visitor-name field was left blank or contained spaces only.', fix: 'Enter a visible visitor name before posting. Existing posts cannot be edited on this page.' }]
					},
					{
						title: 'Choose between posting and adding a line break',
						purpose: 'Use the textarea keyboard behavior deliberately.',
						steps: ['Press Enter alone to follow the same guarded path as the Post button.', 'Press Shift+Enter when the quote needs a new line.', 'Check the count again after adding line breaks.'],
						result: 'Bare Enter attempts submission; Shift+Enter keeps editing and inserts a newline.',
						issues: [{ problem: 'Enter does nothing', reason: 'The text is blank, over the limit, or a submission is already in flight.', fix: 'Correct the draft or wait, then use Enter or Post again.' }]
					}
				],
				feedback: [
					{
						title: 'Read valid, posting, and posted states',
						purpose: 'Know whether the draft is ready, actively writing, or already accepted.',
						steps: ['Use the live count to confirm the draft is within 500 characters.', 'After submission starts, expect the textarea to disable and the Post button to show loading.', 'After success, look for the compact Posted chip and cleared inputs.', 'The Posted chip dismisses itself after about two seconds.'],
						result: 'Only one write can run at a time, preventing rapid clicks or Enter presses from duplicating a quote.',
						issues: [{ problem: 'The Posted chip disappears', reason: 'It is intentionally temporary and clears after about two seconds.', fix: 'Confirm success from the cleared form and the refreshed wall rather than expecting a permanent banner.' }]
					},
					{
						title: 'Correct blank and over-limit drafts',
						purpose: 'Resolve client-side validation before any database request occurs.',
						steps: ['For a blank or spaces-only draft, enter visible text; no dialog is expected.', 'At 501 characters or more, read the inline warning and changed count.', 'Shorten the draft to 500 characters or fewer.', 'Confirm that Post becomes available again.'],
						result: 'Blank and over-limit drafts never start a write.',
						issues: [{ problem: 'Looking for a validation dialog', reason: 'Blank input is ignored and the character-limit problem is shown inline beside the composer.', fix: 'Use the count and inline warning; no separate validation dialog opens.' }]
					},
					{
						title: 'Recover from submission errors',
						purpose: 'Distinguish an expired session from another database failure.',
						steps: ['If the session-expired retry dialog appears, use its retry action to reload and return to sign-in.', 'For another failure, close the standard Unexpected error occurred dialog.', 'Confirm the draft is still present, then retry only after the session or connection is healthy.'],
						result: 'A failed write does not show Posted and the composer becomes available again.',
						dialogs: [{ name: 'Session-expired retry', trigger: 'The database reports an expired session during posting.', message: 'Your session has expired. Please sign in again.', actions: 'Retry/reload.', outcome: 'The app reloads and returns through authentication.' }, { name: 'Unexpected error', trigger: 'Any other posting failure.', message: 'Unexpected error occurred.', actions: 'Close the dialog.', outcome: 'No success is reported; correct the connection or session and retry.' }],
						issues: [{ problem: 'The draft appears ready again after an error', reason: 'The in-flight flag is always cleared when the request settles, even when it fails.', fix: 'Do not treat an enabled Post button as proof that the previous write succeeded; check the wall before retrying.' }]
					}
				],
				moderate: [
					{
						title: 'Recognize the administrator-only removal control',
						purpose: 'Keep destructive power separate from ordinary reading and contribution.',
						availableWhen: 'The active role has full administrator rights. Ordinary readers and contributors never see the delete control.',
						steps: ['Find the delete control in the card metadata row.', 'Select it to open Delete Quote.', 'Read the quoted-record warning.', 'Choose Cancel to preserve the quote or Delete to continue.'],
						result: 'Cancel changes nothing. Delete starts a blocking Deleting... overlay before the database removal.',
						dialogs: [{ name: 'Delete Quote confirmation', trigger: 'An administrator selects a quote card’s delete control.', message: 'Are you sure you want to delete this quote?', actions: 'Cancel or Delete.', outcome: 'Cancel preserves the record; Delete begins the protected removal.' }],
						safety: 'Resonance has no restore or undo control for a successfully removed quote.'
					},
					{
						title: 'Read deletion success and failure correctly',
						purpose: 'Understand the stacked confirmation and blocking states used by moderation.',
						steps: ['After accepting, leave the confirmation in place under the Deleting... overlay.', 'On success, expect the overlay and confirmation to close together and the wall to refresh.', 'On failure, close the Unexpected error dialog and review the still-available confirmation before retrying or cancelling.'],
						result: 'A successful removal deletes the public record once; the blocking overlay prevents duplicate requests.',
						dialogs: [{ name: 'Deleting status', trigger: 'The administrator accepts Delete.', message: 'Deleting...', actions: 'Wait; there is no second action while the write runs.', outcome: 'Success closes both layers and removes the quote.' }, { name: 'Unexpected error', trigger: 'The removal request fails.', message: 'Unexpected error occurred.', actions: 'Close the error, then retry or cancel the confirmation.', outcome: 'The quote remains and the confirmation does not claim success.' }],
						issues: [{ problem: 'No delete control is visible', reason: 'The active account is not an administrator or the role has not resolved.', fix: 'Do not attempt a workaround. Use an authorized administrator account for moderation.' }]
					}
				]
			},
			zh: {
				read: [
					{ title: '识别载入中、空白与已有内容的语录墙', purpose: '区分仍在连接的语录墙与真正没有公开语录的空状态。', availableWhen: '无需实名账户即可打开「语录」。没有应用会话时，页面会先建立匿名会话，再订阅语录。', steps: ['语录网格显示骨架卡时先等待。', '订阅返回零条语录时，阅读空状态邀请。', '存在语录时，以数量胶囊和卡片网格作为当前公开墙。'], result: '订阅成功后，会显示空状态邀请或最新公开语录卡。', issues: [{ problem: '连接失败后语录墙看起来为空', reason: '语录流会把读取错误转换为空数组，并且不会弹出错误对话框。', fix: '先检查连接并重新进入「语录」，不要直接认定公开墙没有语录。' }] },
					{ title: '阅读语录卡与身份后备显示', purpose: '无需寻找隐藏控件，也能理解已发布卡片上的每个值。', steps: ['一起读取作者首字母和显示名字。', '作者为空或旧记录保存为 Anonymous 时，会使用当前语言的「匿名」。', '把时间戳读取为相对时间标签。', '在元数据行下阅读完整语录。'], result: '阅读卡片不会改变数据；渐变和轻微倾斜只按位置循环，不代表状态。', issues: [{ problem: '卡片没有编辑或个人删除操作', reason: '「语录」不提供贡献者编辑，删除仅限管理员。', fix: '把修正内容作为新语录发布；错误或不当公开语录请联系管理员删除。' }] }
				],
				post: [
					{ title: '使用已登录账户身份发布', purpose: '用当前账户已有名字发布短语录。', availableWhen: '当前存在实名账户会话，因此不会显示访客名字栏。', steps: ['在主文字区输入语录。', '让实时计数保持在 500 个字符以内。', '点击「发布」，或在未按 Shift 时按回车。', '等待写入结束后再尝试下一次发布。'], inputs: [{ name: '语录', requirement: '去除首尾空格后必填；最多 500 个字符。', example: '短短一句话，也能走很远。' }], result: '账户用户名成为显示作者，语录与当前时间一起保存，表单随后清空。', issues: [{ problem: '「发布」保持不可用', reason: '语录为空、超过 500 个字符，或已有一次提交正在运行。', fix: '输入可见文字、缩短到限制内，或等待当前写入结束。' }] },
					{ title: '访客填写或省略名字后发布', purpose: '没有实名账户时仍可贡献，并决定公开显示名字。', availableWhen: '当前没有实名账户会话，并且访客名字栏可见。', steps: ['输入公开语录。', '按需填写访客名字。', '点击「发布」或在未按 Shift 时按回车。', '希望卡片显示「匿名」时，可以把名字留空。'], inputs: [{ name: '语录', requirement: '去除首尾空格后必填；最多 500 个字符。', example: '留意那些不断回来的念头。' }, { name: '访客名字', requirement: '选填；输入最多接受 50 个字符。', example: '访客' }], result: '填写的访客名字会被保存；空作者之后会显示为「匿名」。', issues: [{ problem: '出现不想要的「匿名」', reason: '名字栏为空或只有空格。', fix: '发布前输入可见名字；此页无法编辑已有语录。' }] },
					{ title: '在发布与换行之间正确选择', purpose: '有意识地使用文字区键盘行为。', steps: ['单独按回车会走与「发布」按钮相同的受保护路径。', '需要新行时按 Shift+Enter。', '加入换行后重新检查字符计数。'], result: '单独回车会尝试提交；Shift+Enter 会继续编辑并插入换行。', issues: [{ problem: '按回车没有反应', reason: '文字为空、超限，或提交仍在进行。', fix: '修正草稿或等待，然后再次按回车或点击「发布」。' }] }
				],
				feedback: [
					{ title: '读取有效、发布中与已发布状态', purpose: '判断草稿是可发布、正在写入，还是已经被接受。', steps: ['用实时计数确认草稿不超过 500 个字符。', '提交开始后，文字区会禁用，「发布」按钮显示载入。', '成功后查看紧凑的「已发布」胶囊与清空后的输入。', '「已发布」胶囊约两秒后自行消失。'], result: '同一时间只允许一次写入，避免快速点击或连续回车造成重复语录。', issues: [{ problem: '「已发布」胶囊消失', reason: '它刻意只短暂显示，约两秒后清除。', fix: '通过已清空表单和刷新的语录墙确认成功，不要等待永久提示。' }] },
					{ title: '修正空白与超限草稿', purpose: '在发起任何数据库请求前解决客户端校验。', steps: ['草稿为空或只有空格时，输入可见文字；不会弹出对话框。', '达到 501 个字符或更多时，读取行内警告与改变后的计数。', '把草稿缩短到 500 个字符以内。', '确认「发布」重新可用。'], result: '空白和超限草稿不会开始写入。', issues: [{ problem: '寻找校验对话框', reason: '空白会被忽略，字符超限会直接显示在编辑器旁。', fix: '查看计数和行内警告；不会另外弹出校验对话框。' }] },
					{ title: '从发布错误中恢复', purpose: '区分会话过期与其他数据库失败。', steps: ['出现会话过期重试对话框时，使用重试操作重新载入并回到登录。', '其他失败时，关闭标准「发生未知错误」对话框。', '确认草稿仍在，然后只在会话或连接恢复后重试。'], result: '失败写入不会显示「已发布」，编辑器会恢复可用。', dialogs: [{ name: '会话过期重试', trigger: '发布期间数据库报告会话过期。', message: '会话已过期，需要重新登录。', actions: '重试／重新载入。', outcome: '应用重新载入并重新进入身份验证。' }, { name: '未知错误', trigger: '其他发布失败。', message: '发生未知错误。', actions: '关闭对话框。', outcome: '不会报告成功；修复连接或会话后重试。' }], issues: [{ problem: '错误后「发布」又可点击', reason: '请求无论成功或失败，结束时都会清除写入中状态。', fix: '按钮可用不代表上次写入成功；重试前先检查语录墙。' }] }
				],
				moderate: [
					{ title: '识别仅管理员可见的删除控件', purpose: '把破坏性权限与普通阅读、贡献清楚分开。', availableWhen: '当前角色拥有完整管理员权限；普通读者和贡献者不会看到删除控件。', steps: ['在卡片元数据行找到删除控件。', '点击后打开「删除心声」。', '阅读当前记录删除警告。', '选择取消保留语录，或选择删除继续。'], result: '取消不会改变内容；删除会先显示「正在删除...」阻塞层，再执行数据库移除。', dialogs: [{ name: '删除心声确认', trigger: '管理员点击语录卡删除控件。', message: '确认删除这条心声？', actions: '取消或删除。', outcome: '取消保留记录；删除开始受保护移除。' }], safety: '成功删除后，「语录」没有恢复或撤销控件。' },
					{ title: '正确读取删除成功与失败', purpose: '理解管理操作使用的堆叠确认与阻塞状态。', steps: ['确认后，让确认框保留在「正在删除...」阻塞层下方。', '成功时，阻塞层与确认框会一起关闭，语录墙刷新。', '失败时，关闭「发生未知错误」，然后在仍可用的确认框中决定重试或取消。'], result: '成功只删除一次公开记录；阻塞层会阻止重复请求。', dialogs: [{ name: '正在删除状态', trigger: '管理员确认删除。', message: '正在删除...', actions: '等待；写入期间没有第二个操作。', outcome: '成功会关闭两层并移除语录。' }, { name: '未知错误', trigger: '移除请求失败。', message: '发生未知错误。', actions: '关闭错误后重试或取消确认。', outcome: '语录保留，确认框不会报告假成功。' }], issues: [{ problem: '看不到删除控件', reason: '当前账户不是管理员，或角色尚未解析。', fix: '不要绕过权限；使用获授权管理员账户进行管理。' }] }
				]
			}
		},
		debt: {
			en: {
				summary: [
					{
						title: 'Read every summary value and currency group',
						purpose: 'Understand the portfolio before changing an individual ledger.',
						steps: ['While data is loading, read the summary and card skeletons as pending values, not zero debt.', 'When no records exist, read No debts here. Add one to start tracking — or enjoy being debt-free. and use Add a debt.', 'Read Total debt separately for CNY and CAD; the page never converts one currency into the other.', 'For each currency, read the remaining total, currency label, cleared percentage, paid amount, and original total.', 'Read Debts, Active, Paid off, Due soon, Overdue, and Payments as six different counts.', 'Treat a missing currency group as no records in that currency, not a loading failure.'],
						result: 'The populated summary is a live projection of the same records shown below. Active and paid-off counts are mutually exclusive; Payments counts history entries.',
						issues: [{ problem: 'Skeletons never resolve', reason: 'The debt or payment stream did not complete for the current session.', fix: 'Restore the session or connection and revisit Debt Sonata; shared session and unexpected failures use the Messages & Errors reference.' }]
					},
					{
						title: 'Read every active, due, overdue, and paid card field',
						purpose: 'Use one card as the complete ledger surface.',
						steps: ['Read the category icon, name, localized category, and optional due chip.', 'Read Today, Due tomorrow, days left, or days overdue from the stored due date; paid cards omit the due chip.', 'Read the remaining balance against the original total, then confirm the percentage and paid amount below the progress bar.', 'Use −100, −1k, Custom, Set, Reset, lock, Delete, and History according to the later scenarios.', 'On a paid card, read the Paid off ribbon and Coda · paid in full; payment chips remain disabled.', 'At 940 px or less, read a single card column and the currency summary; the six-count panel, lock, and Delete controls are hidden, so use a wider viewport for protection or deletion.'],
						result: 'The card combines identity, urgency, balance, actions, protection, and history without requiring a separate detail page.',
						issues: [{ problem: 'Currency looks inferred rather than stored', reason: 'Legacy rows without a currency fall back to detecting Chinese characters in the name.', fix: 'Use Set only for amount and date; create a new correctly-currency-tagged record when the legacy inference is wrong.' }]
					}
				],
				create: [
					{
						title: 'Create a debt with every field and validation state',
						purpose: 'Define the ledger identity, amount, currency, timing, and deletion protection once.',
						steps: ['Select New debt.', 'Enter a visible name and a non-negative amount.', 'Choose Credit card, Personal, Financing, or Mortgage.', 'Choose ¥ CNY or $ CAD; no currency is selected when the dialog first opens.', 'Keep or change the due date, which starts thirty days ahead.', 'Optionally enable Permanent account, then select Add debt; Cancel creates nothing.'],
						inputs: [{ name: 'Name', requirement: 'Required after trimming surrounding spaces.', example: 'Visa Platinum' }, { name: 'Amount', requirement: 'Required numeric value greater than or equal to zero.', example: '275' }, { name: 'Category', requirement: 'One of the four visible categories; Credit card is the initial category.', example: 'Financing' }, { name: 'Currency', requirement: 'Required; explicitly choose CNY or CAD.', example: '$ CAD' }, { name: 'Due date', requirement: 'Optional after editing; the initial value is thirty days ahead.', example: '2026-09-08' }],
						result: 'A valid submission stays under Saving... until the write settles, then the dialog closes and the summary and grid update.',
						issues: [{ problem: 'Add debt remains disabled', reason: 'Name is blank, amount is missing or below zero, or no currency was selected.', fix: 'Correct all three required conditions; zero is accepted and immediately creates a paid-off ledger.' }, { problem: 'The selected category or currency is wrong', reason: 'The creation dialog saves the visible selection and Set cannot later change either value.', fix: 'Cancel and correct it before saving, or delete and recreate the disposable record after checking its history.' }]
					},
					{
						title: 'Set the total or deliberately start a New cycle',
						purpose: 'Distinguish an amount/date correction from replacing the active ledger cycle.',
						steps: ['Select Set on the target card.', 'Read the original total in New amount; currency is visible but disabled.', 'Change the non-negative total and due date as needed.', 'Leave New cycle off to preserve history and derive the remaining balance from the new total minus recorded payments.', 'Enable New cycle only when the new amount should become the full remaining balance and all prior payment history should be cleared.', 'Select Set to save or Cancel to leave the record unchanged.'],
						inputs: [{ name: 'New amount', requirement: 'Required numeric value greater than or equal to zero.', example: '1500' }, { name: 'Due date', requirement: 'Optional; clearing it removes due-soon and overdue status.', example: '2026-08-10' }],
						result: 'Without New cycle, paid progress is recalculated against the retained payments. With New cycle, balance becomes the entered amount and history becomes empty.',
						issues: [{ problem: 'Name, category, currency, or permanence cannot be edited here', reason: 'Set intentionally exposes only total, due date, and New cycle.', fix: 'Use the card lock for permanence. Recreate the record only when its immutable identity is wrong.' }]
					}
				],
				pay: [
					{
						title: 'Apply a preset or exact custom payment once',
						purpose: 'Reduce the remaining balance and append an explainable payment row.',
						steps: ['Select −100 or −1k for an immediate preset payment.', 'For another amount, select Custom, enter a positive number, then press Enter or leave the field.', 'Wait for Saving payment... to close before touching another payment control on that card.', 'Confirm the balance, percentage, summary totals, Payments count, and History count all update.', 'Open History to verify the stored amount, time, and resulting balance.'],
						inputs: [{ name: 'Custom payment', requirement: 'A parseable number greater than zero; blank, zero, negative, or non-numeric input is ignored.', example: '125' }],
						result: 'One accepted action subtracts the amount, rounds the balance to two decimals, appends one history entry, and briefly animates the balance.',
						issues: [{ problem: 'Custom closes without changing anything', reason: 'The value did not parse to a positive number.', fix: 'Reopen Custom and enter a plain positive numeric value.' }, { problem: 'A second rapid action is ignored', reason: 'The entry remains protected while its current write is active.', fix: 'Wait for Saving payment... and the refreshed values before continuing.' }]
					},
					{
						title: 'Recognize paid-off and overpayment behavior',
						purpose: 'Understand what happens when a payment reaches or passes zero.',
						steps: ['Apply a payment equal to the remaining balance for a zero result.', 'If a preset or custom payment exceeds the remaining balance, read the negative balance as the retained overpayment amount.', 'Read Paid off and Coda · paid in full once the balance is zero or below.', 'Confirm all three payment controls are disabled.', 'Use History removal or Reset when the overpayment was accidental.'],
						result: 'Current Debt Sonata intentionally permits overpayment instead of clamping at zero; the stored negative balance remains visible while the card is paid off.',
						issues: [{ problem: 'The paid card shows a negative number', reason: 'Preset and custom payments subtract their full amount even when it is larger than the remaining balance.', fix: 'Remove the mistaken payment row to refund it, or use Reset when the whole ledger should return to its original amount.' }]
					}
				],
				history: [
					{
						title: 'Expand populated and empty payment history',
						purpose: 'Explain the current balance from its stored payment rows.',
						steps: ['Select History and read its count before the panel opens.', 'For every row, read date, time, negative payment amount, arrow, and resulting balance together.', 'Select History again to collapse the panel.', 'When the count is zero, open it and read No payments yet — start chipping away above.'],
						result: 'History belongs to one card and can scroll independently when it grows; an empty ledger remains an explicit usable state.'
					},
					{
						title: 'Remove one mistaken payment and understand the limitation',
						purpose: 'Refund one payment without resetting or deleting the entire debt.',
						availableWhen: 'The current account owns the debt or has administrator rights; non-owners cannot open the confirmation.',
						steps: ['Expand History and select the exact payment row.', 'Read Remove payment and Remove this payment?.', 'Choose Cancel to preserve it or Remove to continue.', 'Wait for Deleting payment... to close.', 'Confirm the selected amount was added back to the current balance and the row disappeared.'],
						result: 'Only the selected history entry is removed and its amount is refunded to the current balance.',
						dialogs: [{ name: 'Remove payment', trigger: 'An owner selects a payment-history row.', message: 'Remove this payment?', actions: 'Cancel or Remove.', outcome: 'Cancel changes nothing; Remove starts the protected deletion.' }],
						issues: [{ problem: 'Later row balances no longer match the recomputed current balance', reason: 'Current code removes and refunds the selected entry but does not recalculate the stored resulting-balance values in later history rows.', fix: 'Prefer removing the newest mistaken payment. If an older row must be removed, treat the later row balances as a current known limitation or Reset the cycle.' }]
					},
					{
						title: 'Reset, delete, and protect a debt without confusing the outcomes',
						purpose: 'Use the right irreversible or restorative control.',
						steps: ['Select Reset once and read Restore?; select it again within about 2.6 seconds to restore the original balance and clear all history.', 'Select the delete icon once and read Delete?; select it again within the same window to remove the debt and its history permanently.', 'Click anywhere outside either prompt to cancel it immediately.', 'Select the open lock to mark the debt Permanent; read the closed lock and confirm Delete disappears.', 'Select the closed lock to restore ordinary deletion eligibility.'],
						result: 'Reset keeps the debt identity but returns the ledger to its starting amount. Delete removes the full record. Permanent protection prevents deletion until unlocked.',
						safety: 'Neither Reset nor Delete has an undo screen. Verify the target card and history before the second click.',
						issues: [{ problem: 'Delete is missing', reason: 'The card is marked Permanent.', fix: 'Select the closed lock, wait for the lock update to finish, then use the two-click delete path.' }, { problem: 'Restore? or Delete? changed back before the second click', reason: 'The prompt timed out or an outside click canceled it.', fix: 'Start the two-click sequence again only after rechecking the target.' }, { problem: 'A protected write fails', reason: 'Permission, session, or database handling rejected Reset, Delete, or the lock update.', fix: 'Close the routed shared error, inspect the live card for rollback, restore the session or connection, and retry once.' }]
					}
				]
			},
			zh: {
				summary: [
					{ title: '读取全部总览数值与货币分组', purpose: '修改单笔账本前，先理解整个债务组合。', steps: ['数据载入时，把总览与卡片骨架理解为数值待定，不是零债务。', '没有记录时，读取「暂无债务记录。添加一条开始追踪——或好好享受零债务。」并使用「添加债务」。', '分别读取人民币与加元的「总债务」；页面不会在两种货币之间换算。', '每种货币都读取剩余总额、货币标签、「% 已还清」、已还金额与原始总额。', '把「债务数、进行中、已还清、即将到期、已逾期、还款次数」理解为六项不同统计。', '没有某种货币分组表示该货币没有记录，不表示载入失败。'], result: '总览使用下方卡片的同一批实时记录；「进行中」与「已还清」互斥，「还款次数」统计记录条目。', issues: [{ problem: '骨架一直不消失', reason: '当前会话的债务或还款数据流没有完成。', fix: '恢复会话或连接后重新进入「债务」；共享会话与未知错误请参阅「消息与错误」。' }] },
					{ title: '读取进行中、到期、逾期与已还清卡片', purpose: '把一张卡片当作完整账本界面。', steps: ['读取分类图标、名称、本地化分类与可选到期标签。', '根据保存日期读取「今日到期、明日到期、天后截止」或「天逾期」；已还清卡片不显示到期标签。', '读取剩余余额与原始总额，再核对进度条下的百分比和已还金额。', '按后续场景使用「−100、−1k、自定义、设置、重置、锁定、删除、记录」。', '已还清卡片会显示「已还清」缎带与「终章 · 已还清」，并禁用还款控件。', '宽度不超过 940 像素时，卡片变为单列，只保留货币总览；六项统计、锁定与删除控件会隐藏，因此保护或删除需要更宽视口。'], result: '一张卡片同时包含身份、紧迫程度、余额、操作、保护与记录，不需要单独详情页。', issues: [{ problem: '货币似乎不是保存值', reason: '旧记录缺少货币时，会根据名称是否含中文推断。', fix: '「设置」只能修改金额与日期；旧记录推断错误时，应在核对记录后新建货币正确的条目。' }] }
				],
				create: [
					{ title: '使用全部字段与校验状态新增债务', purpose: '一次定义账本名称、金额、货币、时间与删除保护。', steps: ['点击「新增债务」。', '输入可见名称与大于或等于零的金额。', '选择「信用卡、个人、分期、房贷」。', '选择「¥ 人民币」或「$ 加元」；对话框初始不会选择货币。', '保留或修改默认的三十天后到期日。', '按需启用「永久账户」，再点击「添加债务」；「取消」不会创建内容。'], inputs: [{ name: '名称', requirement: '去除首尾空格后必填。', example: '白金信用卡' }, { name: '金额', requirement: '必填数字，且大于或等于零。', example: '275' }, { name: '分类', requirement: '四项可见分类之一；初始为「信用卡」。', example: '分期' }, { name: '货币', requirement: '必填；必须明确选择人民币或加元。', example: '$ 加元' }, { name: '到期日', requirement: '修改后可清空；初始为三十天后。', example: '2026-09-08' }], result: '有效提交会停留在「正在保存」阻塞层下方，写入完成后关闭对话框并刷新总览与卡片。', issues: [{ problem: '「添加债务」仍为禁用', reason: '名称为空、金额缺失或小于零，或尚未选择货币。', fix: '修正三个必需条件；零金额也会被接受，并立即生成「已还清」账本。' }, { problem: '分类或货币选错', reason: '新增对话框会保存可见选择，而「设置」之后无法修改两者。', fix: '保存前取消并修正；若已保存，请核对记录后删除并重建这条演示数据。' }] },
					{ title: '设置总额，或有意识地开启「新周期」', purpose: '区分金额／日期修正与替换当前账本周期。', steps: ['点击目标卡片的「设置」。', '在「新金额」读取原始总额；货币可见但禁用。', '按需修改非负总额与到期日。', '关闭「新周期」时保留记录，并用新总额减去已有还款推导剩余余额。', '只有新金额应成为完整剩余余额且旧记录应清空时，才开启「新周期」。', '点击「设置」保存，或点击「取消」保持不变。'], inputs: [{ name: '新金额', requirement: '必填数字，且大于或等于零。', example: '1500' }, { name: '到期日', requirement: '选填；清空会移除即将到期与逾期状态。', example: '2026-08-10' }], result: '关闭「新周期」会基于保留的还款重新计算进度；开启后，余额变为输入金额且记录清空。', issues: [{ problem: '这里不能改名称、分类、货币或永久状态', reason: '「设置」刻意只提供总额、到期日与「新周期」。', fix: '永久状态使用卡片锁；只有不可变身份错误时才重建记录。' }] }
				],
				pay: [
					{ title: '只执行一次预设或精确自定义还款', purpose: '减少剩余余额，并追加一条可以解释的还款记录。', steps: ['点击「−100」或「−1k」立即使用预设金额。', '其他金额点击「自定义」，输入正数后按回车或离开输入框。', '等待「正在保存还款记录...」关闭，再操作同一卡片的其他还款控件。', '确认余额、百分比、总览、「还款次数」与「记录」数量全部更新。', '打开「记录」，核对保存的金额、时间与结果余额。'], inputs: [{ name: '自定义还款', requirement: '可解析且大于零的数字；空白、零、负数或非数字会被忽略。', example: '125' }], result: '一次有效操作会扣减金额、把余额四舍五入到两位小数、追加一条记录，并短暂播放余额动画。', issues: [{ problem: '「自定义」关闭但没有变化', reason: '输入无法解析为正数。', fix: '重新打开「自定义」，输入普通正数。' }, { problem: '第二次快速操作被忽略', reason: '当前写入期间，该条目仍受保护。', fix: '等待「正在保存还款记录...」与刷新后的数值，再继续。' }] },
					{ title: '识别「已还清」与超额还款行为', purpose: '理解还款达到或低于零时的结果。', steps: ['还款金额等于剩余余额时，结果为零。', '预设或自定义金额大于剩余余额时，把负数理解为保留的超额还款值。', '余额为零或负数后读取「已还清」与「终章 · 已还清」。', '确认三项还款控件全部禁用。', '超额还款并非预期时，使用删除记录或「重置」。'], result: '当前「债务」允许超额还款，不会把余额限制在零；保存的负数会在「已还清」卡片上继续显示。', issues: [{ problem: '已还清卡片显示负数', reason: '预设与自定义会完整扣除输入金额，即使它大于剩余余额。', fix: '删除错误还款记录以退回金额；整个账本应恢复原始金额时使用「重置」。' }] }
				],
				history: [
					{ title: '展开有内容与空白的还款记录', purpose: '使用已保存的还款行解释当前余额。', steps: ['点击「记录」，先读取按钮上的数量。', '每行一起读取日期、时间、负数还款金额、箭头与结果余额。', '再次点击「记录」折叠面板。', '数量为零时仍可展开，并读取「暂无还款记录——在上方开始还款吧。」。'], result: '记录只属于当前卡片；条目较多时面板独立滚动，空白账本也是明确可用状态。' },
					{ title: '删除一条错误还款并理解当前限制', purpose: '退回单次还款，而不重置或删除整笔债务。', availableWhen: '当前账户拥有该债务，或拥有管理员权限；非所有者无法打开确认。', steps: ['展开「记录」并选择准确的还款行。', '读取「删除还款记录」与「确认删除此还款记录？」。', '选择「取消」保留，或选择「删除」继续。', '等待「正在删除还款记录...」关闭。', '确认所选金额退回当前余额，且该行消失。'], result: '只删除所选记录，并把它的金额退回当前余额。', dialogs: [{ name: '删除还款记录', trigger: '所有者选择一条还款记录。', message: '确认删除此还款记录？', actions: '取消或删除。', outcome: '取消不改变内容；删除会开始受保护移除。' }], issues: [{ problem: '后续行的余额与重新计算的当前余额不一致', reason: '当前代码会删除并退回所选金额，但不会重新计算后续记录中已保存的结果余额。', fix: '优先删除最新的错误还款；必须删除较早记录时，把后续余额视为当前已知限制，或重置整个周期。' }] },
					{ title: '不要混淆「重置、删除、永久保护」的结果', purpose: '选择正确的恢复或不可逆操作。', steps: ['第一次点击「重置」会显示「恢复？」；约 2.6 秒内再次点击，恢复原始余额并清空全部记录。', '第一次点击删除图标会显示「确认删除？」；同一时间内再次点击，永久移除债务及记录。', '点击两项警示之外的位置会立即取消。', '点击打开的锁，把债务设为「永久」；读取闭合锁，并确认删除消失。', '点击闭合锁，恢复普通删除资格。'], result: '「重置」保留债务身份但让账本回到起始金额；「删除」移除完整记录；永久保护会在解锁前禁止删除。', safety: '「重置」与「删除」都没有撤销页面；第二次点击前必须核对目标卡片与记录。', issues: [{ problem: '删除控件不见了', reason: '卡片已标记为永久。', fix: '点击闭合锁，等待锁状态更新，再使用两次点击删除流程。' }, { problem: '「恢复？」或「确认删除？」自动变回原状', reason: '提示超时，或点击外部取消了提示。', fix: '重新核对目标后，再开始两次点击流程。' }, { problem: '受保护写入失败', reason: '权限、会话或数据库处理拒绝了重置、删除或锁更新。', fix: '关闭转交的共享错误，查看实时卡片是否回滚，恢复会话或连接后只重试一次。' }] }
				]
			}
		},
		account: {
			en: {
				profile: [
					{
						title: 'Distinguish the profile shell from the live account document',
						purpose: 'Know which Account regions are ready and which are still waiting for statistics, milestones, security dates, and connections.',
						availableWhen: 'An authenticated account session exists. Without one, the protected route returns to sign-in instead of showing Account.',
						steps: ['Read the avatar, display name, tagline, Cadence title, and current Vault Passphrase choice as the session-level shell.', 'Treat grey bars in the profile chips, Identity, Inner World, Milestones, Security, and Connections as loading skeletons.', 'Wait for the live user document to replace all of those skeletons together.', 'If they never resolve, restore the connection and revisit Account; there is no Account-specific Retry control.'],
						result: 'A resolved document fills every dependent card. The profile shell appearing first does not prove that account statistics are available.',
						issues: [{ problem: 'Skeletons remain indefinitely', reason: 'The live statistics subscription ignores a missing document and has no visible error callback or timeout.', fix: 'Reopen Account after the session and connection recover; compare collection totals with their source pages.' }]
					},
					{
						title: 'Read the profile, all six statistics, milestones, and security dates',
						purpose: 'Interpret every value in the loaded account summary without treating it as an editing surface.',
						steps: ['Use the stored photo when present; otherwise read one or two upper-case initials, with ? as the final name fallback.', 'Read the title-cased display name, Living intentionally, one entry at a time., Member Since month, and Day Streak.', 'Read Films Logged, Quotes, Recipes, Reminders, Debts Tracked, and Links Saved; English uses the singular unit only when the value is exactly 1.', 'Read Milestones newest first. Named first-use milestones include localized notes; counted keys such as 10 Recipes Created have no note; unrecognized keys are omitted.', 'Read Last sign-in, Username last changed, and Password last changed. A missing date is an em dash.'],
						result: 'The six values and history cards are read-only projections of the current account document.',
						issues: [{ problem: 'A source collection and Account total disagree', reason: 'The page asks the database to reconcile totals, but that repair is asynchronous and failures are silent.', fix: 'Allow the page to remain open briefly, then revisit it; do not manually duplicate records to force a count.' }]
					},
					{
						title: 'Follow the one-column Account order on narrow screens',
						purpose: 'Keep every control readable when the six-column desktop grid collapses.',
						steps: ['At 940 px and below, read Profile, Cadence, Identity, Inner World, Milestones, Security, Connections when available, and Danger Zone in document order.', 'Use the compact navigation rail or menu without expecting cards to remain side by side.', 'On coarse-pointer devices at 900 px and below, allow the extra bottom padding to clear the floating dock.'],
						result: 'Controls retain their full labels and fields; only the grid and danger rows stack.',
						issues: [{ problem: 'A narrow desktop window has less bottom space than a phone', reason: 'The additional 80 px clearance is intentionally limited to coarse pointers.', fix: 'This is expected responsive behavior, not missing content.' }]
					}
				],
				identity: [
					{
						title: 'Update the username and read the email state',
						purpose: 'Change the public display name while recognizing which identity values are read-only.',
						steps: ['Enter the intended username; leading and trailing spaces are removed.', 'Press Enter in the field or select Update Username. Repeated submissions are ignored while the credential write is running.', 'On success, read Username updated; the profile identity refreshes and Username last changed is recorded separately.', 'Read the email beside Verified when one exists, or No email address when neither supported user field contains one.'],
						inputs: [{ name: 'Username', requirement: 'The component trims the value but performs no local required, length, or format validation; the active identity provider decides whether to accept it.', example: 'Guide Demo' }],
						result: 'CloudBase updates its username; Firebase updates the Google/Firebase display name. Email remains read-only on this page.',
						dialogs: [{ name: 'Unexpected error occurred', trigger: 'The provider rejects the username, the session is unavailable, or any update call fails.', message: 'Unexpected error occurred.', actions: 'Close the dialog.', outcome: 'No success is reported; correct the value or session before retrying.' }],
						issues: [{ problem: 'An empty or invalid username has no inline explanation', reason: 'Account sends the trimmed value directly and converts every provider failure to the generic error dialog.', fix: 'Enter a visible, conventional display name and retry only after confirming the session is online.' }]
					},
					{
						title: 'Use all three visibility controls and every strength level',
						purpose: 'Prepare a CloudBase password change without exposing or confusing the three credential fields.',
						availableWhen: 'The active session uses CloudBase. Firebase/Google sessions hide the entire Change Password group.',
						steps: ['Enter Current password, New password, and Confirm password.', 'Use each eye independently; toggling one field does not reveal the other two.', 'Read Too short below 6 characters, Weak from 6, Fair from 8, Good from 10, and Strong from 12.', 'Treat the four coloured segments as length guidance only; the provider may still reject a value.'],
						inputs: [{ name: 'Current password', requirement: 'Required by CloudBase reauthentication.', example: 'Your existing account password' }, { name: 'New password', requirement: 'At least 6 characters locally; provider strength rules still apply.', example: 'A private 12+ character value' }, { name: 'Confirm password', requirement: 'Must exactly match New password.', example: 'Repeat the same private value' }],
						result: 'The meter updates immediately and writes nothing until Enter or Update Password is used.',
						safety: 'Guide screenshots use demonstration text only. Never reveal a real password in a shared guide.'
					},
					{
						title: 'Resolve every password validation and request outcome',
						purpose: 'Tell local validation, typed provider errors, success, and generic failure apart.',
						steps: ['Below 6 characters, read Password must be at least 6 characters.; no network request starts.', 'When confirmation differs, read Passwords do not match.; strength alone cannot bypass confirmation.', 'With valid local fields, Enter from any password field or Update Password starts one guarded request.', 'If the current password is wrong or the provider rejects strength, close the contextual error dialog and correct the field.', 'On success, read Password updated; all three fields clear and Password last changed is recorded separately.'],
						result: 'Only provider success changes the credential. A statistics-date write failure does not suppress the success toast.',
						dialogs: [{ name: 'Current password is incorrect.', trigger: 'CloudBase rejects the existing password.', message: 'Current password is incorrect.', actions: 'Close, correct Current password, and retry.', outcome: 'The password is unchanged.' }, { name: 'New password is not strong enough.', trigger: 'CloudBase rejects the replacement strength after local validation.', message: 'New password is not strong enough.', actions: 'Close and choose a stronger value.', outcome: 'The password is unchanged.' }, { name: 'Unexpected error occurred', trigger: 'Any unrecognized provider, session, or connection failure.', message: 'Unexpected error occurred.', actions: 'Close and restore the session or connection.', outcome: 'No success is claimed.' }],
						issues: [{ problem: 'The contextual password error stays English in Chinese mode', reason: 'The current typed error classes contain hard-coded English messages instead of locale.zh.ts strings.', fix: 'Follow the English error meaning shown; this is a current localization defect.' }]
					}
				],
				connections: [
					{
						title: 'Read and copy the CloudBase connect code',
						purpose: 'Share the code only when another account should participate in Reminder sharing.',
						availableWhen: 'The active session uses CloudBase. Firebase/Google sessions hide Connections completely.',
						steps: ['Read Reminder page only as the scope boundary.', 'Read the seven-character Connect code, or an em dash while it is unavailable.', 'Select Copy and read Connect code copied.', 'Read No connected accounts yet when the connected-member list is empty.', 'Treat a Left row as retained relationship history, not an active connection.'],
						result: 'Copying changes no relationship and sends no request.',
						dialogs: [{ name: 'Unexpected error occurred', trigger: 'Clipboard access fails.', message: 'Unexpected error occurred.', actions: 'Close and copy manually if the code is visible.', outcome: 'No connection is created.' }]
					},
					{
						title: 'Send a code and correct every page-owned rejection',
						purpose: 'Create one outgoing request only for a valid, different, unconnected account.',
						steps: ['Enter a code and press Enter or select Send request.', 'Blank or whitespace-only input does nothing.', 'While the request runs, Send request and every connection action are disabled by one shared busy guard.', 'Correct Invalid code, That code is your own, Already connected, or Request already sent.', 'For any unrecognized or thrown failure, read Could not send request.'],
						inputs: [{ name: 'Connect code', requirement: 'Trimmed, non-empty code belonging to a different CloudBase account.', example: 'A code shared by the intended person' }],
						result: 'Success clears the input, adds a pending outgoing row through the live document, and shows Request sent. A failed code remains available to correct.',
						issues: [{ problem: 'The button is enabled again after a warning', reason: 'The busy guard clears whenever the request settles, including failure.', fix: 'Correct the cause before resubmitting; enabled does not mean the previous request succeeded.' }]
					},
					{
						title: 'Handle incoming and outgoing request states',
						purpose: 'Move a relationship deliberately through Pending, Connected, Declined, or cancellation.',
						steps: ['For an incoming row, select Approve to connect or Decline to refuse.', 'For an outgoing row, read Pending, Connected, or Declined.', 'Select the close control on Pending to withdraw the request from both accounts and read Request canceled.', 'Select close on a resolved Connected or Declined outgoing row to clear only the local request record.', 'Wait for the live document to update the list before starting another connection action.'],
						result: 'Approval shows Accounts connected. Decline has no success toast. Failures use Unexpected error occurred.',
						issues: [{ problem: 'Incoming, pending, or approved examples are absent from this test account', reason: 'Those states require coordinated data from a second disposable CloudBase account.', fix: 'Use these source-derived steps; never fabricate another person’s relationship record for a screenshot.' }]
					},
					{
						title: 'Disconnect, retain Left, then clear the local row',
						purpose: 'Understand the two-step meaning of the same close control on connected-member rows.',
						steps: ['On an active Connected row, select close to disconnect both sides and read Disconnected.', 'The stored relationship becomes Left rather than silently disappearing.', 'On a Left row, select close again to clear only this account’s historical record.', 'When no active or retained rows remain, read No connected accounts yet.'],
						result: 'Disconnect changes both accounts; clearing Left changes only the current account list.',
						safety: 'Do not remove a real connection merely to produce guide imagery. The captured Left record demonstrates the retained state safely.',
						dialogs: [{ name: 'Unexpected error occurred', trigger: 'Disconnecting or clearing a connection fails.', message: 'Unexpected error occurred.', actions: 'Close and inspect the still-visible live row before retrying.', outcome: 'Do not assume the relationship changed.' }]
					}
				],
				safety: [
					{
						title: 'Choose and save every Vault access cadence',
						purpose: 'Control how soon an unlocked Vault requires its separate passphrase again.',
						steps: ['Open Vault Passphrase under Cadence.', 'Choose Always require, 1 min, 3 min, 5 min, 10 min, 30 min, or Until I reload.', 'Read Vault access timing saved after the current write succeeds.', 'If choices are changed rapidly, allow the page to serialize them in order.'],
						result: 'The preference affects future Vault access expiry; it does not create, reveal, change, or delete the passphrase.',
						dialogs: [{ name: 'Unexpected error occurred', trigger: 'Saving the cadence preference fails.', message: 'Unexpected error occurred.', actions: 'Close and select the intended value again after the connection recovers.', outcome: 'The displayed selection may not be the persisted value until the live document confirms it.' }]
					},
					{
						title: 'Recover a forgotten Vault passphrase without deleting Vault data',
						purpose: 'Use the narrower recovery action only when the account password can prove identity.',
						availableWhen: 'Delete Vault Passphrase is enabled only when the Vault passphrase lock exists; otherwise its Delete button is disabled.',
						steps: ['Select Delete beside Delete Vault Passphrase.', 'Read that the passphrase will be removed and Vault data will not be deleted.', 'Enter the current account password; an empty value cannot submit.', 'Cancel to preserve the passphrase, or submit and correct an inline password error.', 'On success, read Vault passphrase removed; the button disables and the next Vault visit returns to passphrase setup.'],
						result: 'Only the passphrase lock is removed. Vault accounts, identifiers, categories, relationships, and notes remain.',
						dialogs: [{ name: 'Delete Vault Passphrase', trigger: 'The enabled recovery Delete control is selected.', message: 'This removes your vault passphrase so you can set a new one on your next visit. Your vault data will not be deleted.', actions: 'Cancel or Delete after entering the account password.', outcome: 'Cancel preserves access settings; success removes only the lock.' }, { name: 'Inline password or unexpected error', trigger: 'Password verification or passphrase-lock removal fails.', message: 'Current password is incorrect., a rate-limit message, or Unexpected error occurred.', actions: 'Correct, wait, or cancel.', outcome: 'Vault data and the existing passphrase remain.' }],
						issues: [{ problem: 'The recovery dialog is not reproducible on the current test account yet', reason: 'Its Vault passphrase has not been created; the control correctly remains disabled.', fix: 'Capture the enabled dialog during the later Vault chapter, then return here without deleting the lock.' }]
					},
					{
						title: 'Cancel or safely diagnose permanent account deletion',
						purpose: 'Understand the irreversible path without deleting the disposable capture account before the guide is finished.',
						steps: ['Select Delete Account and read the permanent-data warning.', 'For CloudBase, enter the current password; Delete remains disabled while the field is empty.', 'Cancel to close without a request. A wrong password returns to the same dialog with Current password is incorrect.', 'After a valid confirmation, a blocking Deleting account... state prevents duplicate interaction while the provider removes the account.', 'For Firebase/Google, confirm the plain warning and complete the Google reauthentication popup instead of entering a local password.'],
						result: 'Success expires the local session and leaves Account. The guide deliberately stops before valid confirmation.',
						dialogs: [{ name: 'Delete Account', trigger: 'CloudBase Delete Account is selected.', message: 'This will permanently delete your account and all associated data. This action cannot be undone.', actions: 'Cancel or enter the account password and Delete.', outcome: 'Cancel changes nothing; valid Delete begins the blocking removal.' }, { name: 'Google delete confirmation', trigger: 'Firebase/Google Delete Account is selected.', message: 'The localized permanent warning also explains that Google account selection may be requested.', actions: 'Cancel or confirm, then reauthenticate.', outcome: 'Only successful provider deletion removes the account.' }, { name: 'Deletion errors', trigger: 'The password is wrong, attempts are rate-limited, the session expires, or another failure occurs.', message: 'Inline Current password is incorrect., a rate-limit message, a session-expired Retry dialog, or Unexpected error occurred.', actions: 'Correct, wait, sign in again, or cancel according to the message.', outcome: 'The dialog never reports success for a failed deletion.' }],
						safety: 'Account deletion removes the account and all associated data and cannot be undone. Never complete it while other guide chapters still depend on the test account.',
						issues: [{ problem: 'Wrong-password and rate-limit text remains English in Chinese mode', reason: 'Those typed error classes currently use hard-coded English strings.', fix: 'Follow the meaning shown and treat it as a current localization defect.' }]
					}
				]
			},
			zh: {
				profile: [
					{ title: '区分资料外壳与实时账户文档', purpose: '判断账户页哪些区域已经可用，哪些仍在等待统计、里程碑、安全日期与关联数据。', availableWhen: '已有有效账户会话；未登录时，受保护路由会返回登录，而不是显示账户页。', steps: ['把头像、显示名、「有意识地生活，一个瞬间一条记录。」、「节奏」标题和当前「保险箱口令」选项读作会话层外壳。', '资料标签、「账号设置」、「专属领域」、「里程碑」、「安全」与「关联」中的灰条表示载入骨架。', '等待实时用户文档一次性替换这些骨架。', '若一直没有完成，请恢复连接后重新进入账户页；本页没有专用「重试」控件。'], result: '文档成功返回后会填充所有依赖卡片。资料外壳先出现，并不代表账户统计已可用。', issues: [{ problem: '骨架一直不消失', reason: '实时统计订阅会忽略缺失文档，也没有可见错误回调或超时。', fix: '会话与连接恢复后重新进入账户页，并与各来源页面核对集合总数。' }] },
					{ title: '读取资料、六项统计、里程碑与安全日期', purpose: '完整理解已载入账户摘要中的所有数值，不把它误当成编辑区域。', steps: ['有已存照片时显示照片；否则显示一至两个大写首字母，最终姓名后备为「?」。', '读取首字母大写的显示名、「有意识地生活，一个瞬间一条记录。」、「会员于」月份与「天连续签到」。', '读取「已记录影片、心声、食谱、提醒、已追踪债务、已保存链接」六项数值；中文单位直接来自 locale.zh.ts。', '里程碑按新到旧排列。已知首次事件带本地化说明；「10 份食谱」等计数事件没有说明；未知键不会显示。', '读取「上次登录、上次修改用户名、上次修改密码」；没有日期时显示破折号。'], result: '六项数值与历史卡片都是当前账户文档的只读投影。', issues: [{ problem: '来源集合与账户总数不一致', reason: '页面会异步请求校准统计，但校准失败会静默处理。', fix: '让页面保持打开片刻后重新进入；不要为了强制计数而重复创建记录。' }] },
					{ title: '在窄屏按单列顺序阅读账户页', purpose: '六列桌面网格折叠后，仍让全部控件保持清楚可读。', steps: ['宽度不超过 940 像素时，依次读取资料、节奏、账号设置、专属领域、里程碑、安全、可用时的关联与危险区域。', '使用紧凑导航栏或菜单，不再期待卡片并排显示。', '宽度不超过 900 像素且使用粗指针设备时，额外底部留白用于避开悬浮底栏。'], result: '字段与标签保持完整，只改变网格和危险操作的排列。', issues: [{ problem: '窄桌面窗口的底部留白比手机少', reason: '额外 80 像素只对粗指针设备启用。', fix: '这是预期响应式行为，不表示内容缺失。' }] }
				],
				identity: [
					{ title: '更新用户名并读取邮箱状态', purpose: '修改公开显示名，同时识别只读身份值。', steps: ['输入目标用户名；前后空格会被移除。', '在字段中按回车或点击「更新用户名」；凭据写入进行时会忽略重复提交。', '成功后读取「用户名已更新」；资料身份会刷新，「上次修改用户名」会另行记录。', '存在邮箱时在其旁读取「已验证」；两个支持字段都没有邮箱时读取「未绑定邮箱」。'], inputs: [{ name: '用户名', requirement: '组件只会去除前后空格，没有本地必填、长度或格式校验；是否接受由当前身份提供方决定。', example: 'Guide Demo' }], result: 'CloudBase 更新用户名；Firebase 更新 Google/Firebase 显示名。邮箱在本页保持只读。', dialogs: [{ name: '发生未知错误', trigger: '提供方拒绝用户名、会话不可用或更新调用失败。', message: '发生未知错误', actions: '关闭对话框。', outcome: '不会报告成功；修正数值或会话后再试。' }], issues: [{ problem: '空白或无效用户名没有行内说明', reason: '账户页会直接发送去空格后的值，并把所有提供方失败转成通用错误。', fix: '输入可见且常规的显示名，并确认会话在线后再试。' }] },
					{ title: '使用三个可见性控件与全部强度等级', purpose: '准备 CloudBase 密码修改，同时避免暴露或混淆三个凭据字段。', availableWhen: '当前为 CloudBase 会话；Firebase/Google 会话会隐藏整个「修改密码」区域。', steps: ['输入「当前密码、新密码、确认密码」。', '三个眼睛按钮各自独立；切换一个字段不会显示另外两个。', '不足 6 位显示「太短」，6 位起为「弱」，8 位起为「一般」，10 位起为「良好」，12 位起为「强」。', '四段颜色条只提供长度引导；身份提供方仍可能拒绝该值。'], inputs: [{ name: '当前密码', requirement: 'CloudBase 重新验证身份时必填。', example: '现有账户密码' }, { name: '新密码', requirement: '本地至少 6 位；仍需符合提供方强度规则。', example: '仅自己知道的 12 位以上内容' }, { name: '确认密码', requirement: '必须与新密码完全一致。', example: '重复相同私密内容' }], result: '强度计即时变化；按回车或点击「更新密码」前不会写入。', safety: '指南截图只使用演示文字；共享指南中绝不显示真实密码。' },
					{ title: '处理全部密码校验与请求结果', purpose: '区分本地校验、提供方明确错误、成功与通用失败。', steps: ['不足 6 位时读取「密码至少需要 6 位字符。」；不会发起网络请求。', '确认值不同时读取「两次密码输入不一致。」；强度不能绕过确认。', '本地字段有效后，在任一密码字段按回车或点击「更新密码」，只会启动一次受保护请求。', '当前密码错误或提供方拒绝强度时，关闭对应错误并修正字段。', '成功后读取「密码已更新」；三个字段清空，并另行记录「上次修改密码」。'], result: '只有提供方成功才改变凭据；统计日期写入失败不会压制成功提示。', dialogs: [{ name: 'Current password is incorrect.', trigger: 'CloudBase 拒绝现有密码。', message: 'Current password is incorrect.', actions: '关闭、修正当前密码后再试。', outcome: '密码保持不变。' }, { name: 'New password is not strong enough.', trigger: '通过本地校验后，CloudBase 仍拒绝新密码强度。', message: 'New password is not strong enough.', actions: '关闭并选择更强的值。', outcome: '密码保持不变。' }, { name: '发生未知错误', trigger: '其他提供方、会话或连接失败。', message: '发生未知错误', actions: '关闭并恢复会话或连接。', outcome: '不会报告成功。' }], issues: [{ problem: '中文模式仍显示英文密码错误', reason: '当前明确错误类使用硬编码英文，没有使用 locale.zh.ts。', fix: '按屏幕英文含义处理；这是当前本地化缺陷。' }] }
				],
				connections: [
					{ title: '读取并复制 CloudBase 关联码', purpose: '只有希望另一账户参与提醒共享时，才共享关联码。', availableWhen: '当前为 CloudBase 会话；Firebase/Google 会话会完全隐藏「关联」。', steps: ['把「仅限提醒页面」读作共享范围边界。', '读取七位「关联码」；尚不可用时显示破折号。', '点击「复制」并读取「关联码已复制」。', '关联成员为空时读取「暂无已关联账户」。', '把「已离开」行理解为保留的关系历史，而不是有效关联。'], result: '复制不会改变关系，也不会发送请求。', dialogs: [{ name: '发生未知错误', trigger: '剪贴板访问失败。', message: '发生未知错误', actions: '关闭；代码可见时可手动复制。', outcome: '不会创建关联。' }] },
					{ title: '发送代码并修正所有页面专用拒绝', purpose: '只为有效、不同且尚未关联的账户创建一条传出请求。', steps: ['输入代码后按回车或点击「发送请求」。', '空白或只有空格时不会操作。', '请求进行时，「发送请求」与全部关联操作由同一个忙碌保护禁用。', '分别修正「无效的关联码、这是你自己的关联码、已经关联、请求已发送」。', '其他未知或抛出失败会显示「无法发送请求」。'], inputs: [{ name: '关联码', requirement: '去除空格后非空，且属于另一个 CloudBase 账户。', example: '目标联系人提供的关联码' }], result: '成功会清空输入，通过实时文档加入待处理传出行，并显示「请求已发送」；失败代码会保留以便修正。', issues: [{ problem: '警告后按钮重新可用', reason: '请求无论成功或失败，结束后都会解除忙碌保护。', fix: '再次提交前先修正原因；按钮可用不表示上次请求成功。' }] },
					{ title: '处理传入与传出请求状态', purpose: '有意识地让关系进入「待处理、已关联、已拒绝」或取消。', steps: ['传入行可点击「同意」建立关联，或点击「拒绝」。', '传出行会显示「待处理、已关联、已拒绝」。', '待处理行点击关闭，会从双方撤回请求并显示「请求已取消」。', '已关联或已拒绝的传出行点击关闭，只清理本地请求记录。', '等待实时文档更新列表后，再开始下一项关联操作。'], result: '同意会显示「账户已关联」；拒绝没有成功提示；失败显示「发生未知错误」。', issues: [{ problem: '此测试账户没有传入、待处理或已同意示例', reason: '这些状态需要第二个可丢弃 CloudBase 账户协同产生。', fix: '使用这里由源码得出的步骤；不要为了截图伪造他人的关系记录。' }] },
					{ title: '断开、保留「已离开」，再清理本地行', purpose: '理解已关联成员行上同一个关闭控件的两步含义。', steps: ['有效「已关联」行点击关闭，会断开双方并显示「已断开关联」。', '已存关系会先变为「已离开」，不会静默消失。', '「已离开」行再次点击关闭，只清理当前账户的历史记录。', '没有有效或保留行时读取「暂无已关联账户」。'], result: '断开会改变双方；清理「已离开」只改变当前账户列表。', safety: '不要为了指南图片移除真实关联；已捕捉的「已离开」记录可安全说明该状态。', dialogs: [{ name: '发生未知错误', trigger: '断开或清理关联失败。', message: '发生未知错误', actions: '关闭，并检查仍可见的实时行后再试。', outcome: '不要假定关系已经改变。' }] }
				],
				safety: [
					{ title: '选择并保存全部保险箱访问节奏', purpose: '控制已解锁保险箱何时再次要求独立口令。', steps: ['打开「节奏」中的「保险箱口令」。', '选择「每次都需要、1 分钟、3 分钟、5 分钟、10 分钟、30 分钟、直到重新加载」。', '当前写入成功后读取「保险箱访问时限已保存」。', '快速连续改变时，等待页面按顺序保存。'], result: '该偏好影响之后的保险箱访问过期，不会创建、显示、修改或删除口令。', dialogs: [{ name: '发生未知错误', trigger: '保存节奏偏好失败。', message: '发生未知错误', actions: '关闭；连接恢复后重新选择目标值。', outcome: '实时文档确认前，当前显示选项不一定已经持久化。' }] },
					{ title: '忘记保险箱口令时恢复访问并保留数据', purpose: '只有账户密码能够证明身份时，才使用范围更小的恢复操作。', availableWhen: '只有已存在保险箱口令锁时，「删除保险箱口令」才可用；否则其「删除」按钮禁用。', steps: ['点击「删除保险箱口令」旁的「删除」。', '确认文案说明口令会被删除，而保险箱数据不会删除。', '输入当前账户密码；空值无法提交。', '点击「取消」保留口令，或提交后修正行内密码错误。', '成功后读取「保险箱口令已删除」；按钮禁用，下次访问保险箱会返回口令设置。'], result: '只移除口令锁；保险箱账户、标识、分类、关系与备注全部保留。', dialogs: [{ name: '删除保险箱口令', trigger: '点击已启用的恢复删除控件。', message: '此操作将删除你的保险箱口令，你可在下次访问时重新设置。你的保险箱数据不会被删除。', actions: '取消，或输入账户密码后删除。', outcome: '取消保留访问设置；成功只移除口令锁。' }, { name: '行内密码或未知错误', trigger: '密码验证或口令锁删除失败。', message: '英文当前密码错误、限流信息或「发生未知错误」。', actions: '修正、等待或取消。', outcome: '保险箱数据和现有口令保持不变。' }], issues: [{ problem: '当前测试账户还无法复现恢复对话框', reason: '尚未创建保险箱口令，因此控件正确保持禁用。', fix: '稍后制作保险箱章节时捕捉已启用对话框，再返回此处，且不要删除口令锁。' }] },
					{ title: '取消或安全诊断永久删除账户', purpose: '理解不可逆路径，同时在指南完成前保留可丢弃测试账户。', steps: ['点击「删除账号」，阅读永久删除全部数据的警告。', 'CloudBase 会话需输入当前密码；字段为空时「删除」禁用。', '点击「取消」不会发请求；密码错误时原对话框会显示英文当前密码不正确。', '有效确认后，「正在删除账号...」阻塞层会在提供方删除账户时防止重复操作。', 'Firebase/Google 会话使用普通确认，再完成 Google 重新验证弹窗，不输入本地密码。'], result: '成功会让本地会话过期并离开账户页；指南会在有效确认前停止。', dialogs: [{ name: '删除账号', trigger: '点击 CloudBase 的「删除账号」。', message: '此操作将永久删除你的账号及所有相关数据。此操作无法撤销。', actions: '取消，或输入账户密码后删除。', outcome: '取消不改变任何内容；有效删除会开始阻塞移除。' }, { name: 'Google 删除确认', trigger: '点击 Firebase/Google 的「删除账号」。', message: '本地化永久警告还会说明系统可能要求重新选择 Google 账号。', actions: '取消或确认后重新验证。', outcome: '只有提供方成功删除才会移除账户。' }, { name: '删除错误', trigger: '密码错误、尝试被限流、会话过期或其他失败。', message: '行内英文密码错误、英文限流信息、会话过期重试或「发生未知错误」。', actions: '按消息修正、等待、重新登录或取消。', outcome: '失败删除不会报告成功。' }], safety: '删除账户会永久移除账户及全部相关数据，无法撤销。其他指南章节仍依赖测试账户时，绝不能完成删除。', issues: [{ problem: '中文模式的密码错误与限流仍为英文', reason: '对应明确错误类当前使用硬编码英文。', fix: '按屏幕英文含义处理；这是当前本地化缺陷。' }] }
				]
			}
		},
		vault: {
			en: {
				access: [{ title: 'Unlock Vault and choose the usable view', purpose: 'Vault protects account-relationship data behind a separate passphrase cadence.', availableWhen: 'The app session must be active. First use creates a Vault passphrase; later visits may ask for it again.', steps: ['Create and confirm a passphrase on first use, or enter the existing passphrase.', 'After unlock, choose Graph or List on desktop.', 'On mobile, use List; Graph shows a desktop-required notice.', 'Use Account settings if the passphrase is forgotten.'], result: 'Unlocking grants access for the configured cadence; it does not change Vault records.', safety: 'Removing a forgotten Vault passphrase from Account does not delete Vault records, but access should still be treated as private.', issues: [{ problem: 'Passphrase is rejected', reason: 'It is incorrect, too short during setup, or the confirmation does not match.', fix: 'Correct the input; if forgotten, use the Vault passphrase recovery control in Account.' }] }],
				add: [{ title: 'Add an account, identifier, or category', purpose: 'The add dialog first asks what kind of node you are creating, then collects its details and relationships.', steps: ['Select Add and choose Account, Identifier, or Category.', 'For Account, enter a unique name, choose categories, and optionally mark Verified.', 'For Identifier, choose Email, Phone, or Other and enter its value.', 'Add connection or backup names when the dialog offers them, then submit.'], inputs: [{ name: 'Account name', requirement: 'Required and unique among account nodes.', example: 'Primary account' }, { name: 'Identifier', requirement: 'Required value matching the selected identifier meaning.', example: 'name@example.com' }, { name: 'Categories', requirement: 'Optional; an account may belong to multiple categories.', example: 'Personal + Finance' }], result: 'New nodes and requested relationships join the graph and list; category summaries recalculate.', issues: [{ problem: 'Duplicate warning', reason: 'An account name or node value already exists.', fix: 'Reuse/edit the existing node or enter a distinct value.' }, { problem: 'Named connection is not found', reason: 'The target account or identifier does not exist under that name.', fix: 'Create the target first or correct the name before saving.' }] }],
				graph: [{ title: 'Trace and connect relationships in Graph', purpose: 'Graph is for understanding direct relationships; detailed value editing belongs in List.', availableWhen: 'Desktop layout with Vault unlocked and at least one account.', steps: ['Select a node to show its details and quiet unrelated nodes.', 'Use account, identifier, verified, or category filters to narrow the map.', 'With an account selected, choose Add connections.', 'Select a target node to create the edge, or Cancel link mode.'], result: 'A direct edge is added and the selected account detail refreshes.', safety: 'Free-form notes are intentionally list-only and do not appear in Graph.', issues: [{ problem: 'Cannot start a connection', reason: 'The selected source is not an account, or link mode has no source.', fix: 'Select an account first, then choose Add connections.' }, { problem: 'Target does not connect', reason: 'The relationship already exists or the write failed.', fix: 'Check existing edges and retry only after resolving the error.' }] }],
				list: [{ title: 'Edit precise Vault data in List', purpose: 'List exposes account identity, categories, verified state, connections, notes, and protected deletion.', steps: ['Choose List and find an account by search or category.', 'Select Edit to enable account controls.', 'Rename with Enter or blur; toggle categories and Verified as needed.', 'Remove individual connections, or enter a note and press Enter/Add.', 'Select Done to leave edit mode.', 'Use Delete only after reading the node-deletion confirmation.'], inputs: [{ name: 'Name', requirement: 'Non-blank and unique.', example: 'Work account' }, { name: 'Note', requirement: 'Non-blank free-form value; list-only.', example: 'Recovery details stored offline' }], result: 'Writes are queued in order, the save indicator flashes, and graph/list summaries stay synchronized.', safety: 'Deleting a node permanently removes dependent connections. Deleting a custom category may also clean it from accounts.', issues: [{ problem: 'Edit reverts or is blocked', reason: 'The value is blank/duplicate or a queued write failed.', fix: 'Correct the value, wait for the current save to settle, then retry.' }] }]
			},
			zh: {
				access: [{ title: '解锁保险箱并选择可用视图', purpose: '保险箱使用独立口令节奏保护账户关系数据。', availableWhen: '应用会话必须有效；首次使用会创建保险箱口令，之后可能再次要求输入。', steps: ['首次使用时创建并确认口令；之后输入已有口令。', '解锁后，桌面可选择图谱或列表。', '手机请使用列表；图谱会显示需要桌面的提示。', '忘记口令时使用「账户」中的相关设置。'], result: '解锁会按配置节奏授予访问，不会改变保险箱记录。', safety: '从账户移除忘记的保险箱口令不会删除保险箱记录，但访问仍应视为私人。', issues: [{ problem: '口令被拒绝', reason: '口令错误、设置时过短，或两次确认不一致。', fix: '修正输入；若已忘记，使用账户页的保险箱口令恢复控件。' }] }],
				add: [{ title: '添加账户、标识或分类', purpose: '新增对话框会先询问节点类型，再收集详情与关系。', steps: ['点击新增，选择账户、标识或分类。', '账户需输入唯一名称、选择分类，并可标记已验证。', '标识需选择邮箱、电话或其他，并输入对应值。', '对话框提供时，可添加连接或备份名称，然后提交。'], inputs: [{ name: '账户名称', requirement: '必填，且在账户节点中唯一。', example: '主要账户' }, { name: '标识', requirement: '必填，并符合所选标识的含义。', example: 'name@example.com' }, { name: '分类', requirement: '可选；账户可属于多个分类。', example: '个人 + 财务' }], result: '新节点与请求的关系会加入图谱和列表，分类总览随之重算。', issues: [{ problem: '出现重复提示', reason: '账户名称或节点值已存在。', fix: '复用或编辑已有节点，或输入不同值。' }, { problem: '找不到命名连接', reason: '目标账户或标识不存在，或名称不正确。', fix: '先创建目标，或修正名称后再保存。' }] }],
				graph: [{ title: '在图谱中追踪并建立关系', purpose: '图谱用于理解直接关系；具体值编辑属于列表。', availableWhen: '桌面布局、保险箱已解锁，且至少有一个账户。', steps: ['选择节点，显示详情并淡化无关节点。', '使用账户、标识、已验证或分类筛选缩小地图。', '选中账户后点击「添加连接」。', '选择目标节点建立边，或取消连接模式。'], result: '新增直接关系，并刷新所选账户详情。', safety: '自由备注刻意只在列表显示，不进入图谱。', issues: [{ problem: '无法开始连接', reason: '来源不是账户，或连接模式没有来源。', fix: '先选择账户，再点击「添加连接」。' }, { problem: '目标没有连接', reason: '关系已存在，或写入失败。', fix: '检查已有边，并在解决错误后重试。' }] }],
				list: [{ title: '在列表中编辑精确的保险箱数据', purpose: '列表展示账户身份、分类、验证状态、连接、备注与受保护删除。', steps: ['选择列表，通过搜索或分类找到账户。', '点击编辑以启用账户控件。', '回车或失焦保存名称，并按需切换分类和验证状态。', '移除单个连接，或输入备注并按回车／添加。', '点击完成退出编辑模式。', '只有阅读节点删除确认后才执行删除。'], inputs: [{ name: '名称', requirement: '非空且唯一。', example: '工作账户' }, { name: '备注', requirement: '非空自由文字；只在列表显示。', example: '恢复资料离线保存' }], result: '写入会按顺序排队，保存指示器闪现，图谱与列表摘要保持同步。', safety: '删除节点会永久移除依赖关系；删除自定义分类也可能从账户中清理该分类。', issues: [{ problem: '编辑恢复或被阻止', reason: '数值为空／重复，或排队写入失败。', fix: '修正数值，等待当前保存结束后重试。' }] }]
			}
		}
	};

	for (const [pageId, localizedScenarios] of Object.entries(scenarios)) {
		const pageDefinition = window.VISION_GUIDE_PAGES.find((page) => page.id === pageId);
		if (!pageDefinition) continue;
		for (const language of ['en', 'zh']) {
			const pageScenarios = localizedScenarios[language];
			for (const section of pageDefinition.copy[language].sections) {
				section.scenarios = pageScenarios[section.id] ?? [];
			}
		}
	}
})();
