window.VISION_GUIDE_DIRECTORY_COPY = {
	en: {
		eyebrow: 'Vision Canvas · complete field notes',
		title: 'A calm manual for every corner of the canvas.',
		summary: 'Choose a page to learn its purpose, the shortest path through its main work, and the small rules that keep your data safe.',
		primaryAction: 'Open Home notes',
		catalogueLabel: 'Thirteen page guides + shared messages',
		catalogueTitle: 'Start where you are working',
		catalogueBody: 'Each guide mirrors the current application and keeps platform, permission, and responsive differences close to the action they affect. Reopen this directory from the app’s book button: lower-right on desktop, or at the top of All sections on mobile.',
		openLabel: 'Open field notes',
		pageLabel: 'Page',
		completeLabel: 'Complete guide',
		facts: [
			{ value: '13', label: 'routed pages documented' },
			{ value: '2', label: 'fully mirrored languages' },
			{ value: '1', label: 'shared interactive handbook' }
		]
	},
	zh: {
		eyebrow: '愿景画布 · 完整使用手记',
		title: '一份覆盖画布每个角落的从容手册。',
		summary: '选择一个页面，了解它的用途、完成核心任务的最短路径，以及保护数据安全的小规则。',
		primaryAction: '打开主页手记',
		catalogueLabel: '十三个页面指南 + 通用消息',
		catalogueTitle: '从你正在使用的页面开始',
		catalogueBody: '每份指南都对应当前应用，并把平台、权限和响应式差异放在真正会影响操作的位置。可从应用内的书本按钮重新打开本目录：桌面端位于右下角，移动端位于「全部页面」面板顶部。',
		openLabel: '打开使用手记',
		pageLabel: '页面',
		completeLabel: '完整指南',
		facts: [
			{ value: '13', label: '个路由页面已记录' },
			{ value: '2', label: '种语言完整对应' },
			{ value: '1', label: '本共享互动手册' }
		]
	}
};

window.VISION_GUIDE_PAGES = [
	{
		id: 'home',
		order: '01',
		icon: 'icon-home',
		accent: '213, 51, 105',
		generated: true,
		captures: {
			arrival: [
				{
					src: 'assets/images/home/home-signed-out-cover.jpg',
					scenario: 0,
					layout: 'wide',
					label: { en: 'Home before sign-in', zh: '登录前的主页' },
					alt: { en: 'Real signed-out Home editorial cover with Vision Canvas title and bilingual introduction', zh: '真实的登录前主页封面，显示愿景画布标题与双语介绍' },
					caption: { en: 'The public Home is an editorial introduction; its feature names are orientation cues, not dashboard controls.', zh: '公开主页是一段编辑式介绍；其中的功能名称用于说明方向，并不是仪表盘控件。' }
				},
				{
					src: 'assets/images/home/dashboard-live.png',
					scenario: 1,
					layout: 'wide',
					label: { en: 'Signed-in loading fallback', zh: '登录后的载入后备状态' },
					alt: { en: 'Real Home page remaining on its loading state after authenticated navigation', zh: '真实的主页，在已登录导航后仍停留于载入状态' },
					caption: { en: 'This authenticated session remained on Home’s real loading fallback; the guide does not replace it with a reconstructed dashboard.', zh: '本次已登录会话停留在主页真实载入后备状态；指南不会用重建的仪表盘替代它。' }
				},
				{
					src: 'assets/images/home/home-greeting.png',
					scenario: 1,
					layout: 'wide',
					label: { en: 'The private dashboard is ready', zh: '私人仪表盘已就绪' },
					alt: { en: 'Signed-in Home greeting with account name and full date', zh: '登录后的主页问候语、账户名称与完整日期' },
					caption: { en: 'The account name and date appear only after the authenticated dashboard is available.', zh: '账户名称与日期只会在已验证的仪表盘可用后出现。' }
				},
				{
					src: 'assets/images/home/home-brand.png',
					scenario: 1,
					label: { en: 'Dashboard brand anchor', zh: '仪表盘品牌锚点' },
					alt: { en: 'Vision Canvas brand on the signed-in Home dashboard', zh: '登录后主页仪表盘中的 VISION CANVAS 品牌标识' },
					caption: { en: 'VISION CANVAS remains the stable page identity while the surrounding values update.', zh: '周围数值不断更新时，「VISION CANVAS」仍是稳定的页面标识。' }
				}
			],
			clock: [
				{
					src: 'assets/images/home/home-life-clock.png',
					scenario: 0,
					label: { en: 'Time at the centre', zh: '中心显示当前时间' },
					alt: { en: 'Home life clock with live time and four progress rings', zh: '主页生活时钟、实时时间与四个进度环' },
					caption: { en: 'The clock and seconds update automatically; the rings are indicators, not controls.', zh: '时钟与秒数会自动更新；进度环只是指示器，并非操作控件。' }
				},
				{
					src: 'assets/images/home/home-satellites-populated.png',
					scenario: 1,
					layout: 'wide',
					label: { en: 'Four sources, four counting rules', zh: '四个来源，四种计数规则' },
					alt: { en: 'Streak, Patch, Resonance, and This Week satellites with live values', zh: '带实时数值的连续、日志、心声与本周卫星' },
					caption: { en: 'Streak and This Week are activity-derived; Patch and Resonance are collection totals.', zh: '「连续」与「本周」来自动态；「日志」与「心声」是集合总数。' }
				},
				{
					src: 'assets/images/home/home-streak-tooltip.png',
					scenario: 1,
					label: { en: 'What counts as a streak day', zh: '连续天数的计算方式' },
					alt: { en: 'Streak satellite tooltip explaining consecutive activity days', zh: '连续卫星提示说明连续活动天数的计算方式' },
					caption: { en: 'A day contributes only when at least one supported activity was logged.', zh: '一天只有记录至少一项支持的活动时，才会计入连续天数。' }
				},
				{
					src: 'assets/images/home/home-this-week-tooltip.png',
					scenario: 1,
					label: { en: 'The seven-day activity window', zh: '过去七天的动态窗口' },
					alt: { en: 'This Week satellite tooltip explaining the past seven days', zh: '本周卫星提示说明统计过去七天的动态' },
					caption: { en: 'This value is a recent activity count, capped by the twenty-row source feed.', zh: '该数值是近期动态计数，并受二十行来源列表上限影响。' }
				},
				{
					src: 'assets/images/home/home-narrow-rings-and-cards.png',
					scenario: 2,
					layout: 'portrait',
					label: { en: 'Narrow layout shows rings and cards', zh: '窄屏同时显示进度环与进度卡' },
					alt: { en: 'Narrow Home layout showing the progress rings and all four progress cards together', zh: '窄屏主页同时显示进度环与年、月、周、日四张进度卡' },
					caption: { en: 'Current behavior adds the four cards below the rings instead of replacing the rings.', zh: '当前行为是在进度环下方新增四张卡，而不是用卡片替换进度环。' },
					annotations: [{ text: { en: 'Current narrow-screen duplication', zh: '当前窄屏重复显示' }, position: 'lower-right', tone: 'amber' }]
				}
			],
			panels: [
				{
					src: 'assets/images/home/home-week-agenda-empty.png',
					scenario: 0,
					label: { en: 'Selected day with nothing due', zh: '选中日期没有到期项目' },
					alt: { en: 'Home week agenda empty state for the selected day', zh: '主页周议程在选中日期的空状态' },
					caption: { en: 'An empty selected day stays readable instead of leaving a blank panel.', zh: '选中日期没有项目时会显示清楚的空状态，而不是留下空白面板。' }
				},
				{
					src: 'assets/images/home/home-week-agenda-populated.png',
					scenario: 0,
					layout: 'wide',
					label: { en: 'A dated reminder enters the agenda', zh: '带日期提醒进入周议程' },
					alt: { en: 'Home week agenda showing a Guide Demo reminder due on the selected day', zh: '主页周议程显示选中日期到期的 Guide Demo 提醒' },
					caption: { en: 'The agenda previews the source record; editing still belongs to Reminder.', zh: '周议程只预览来源记录；编辑仍在「提醒」页面完成。' }
				},
				{
					src: 'assets/images/home/home-week-agenda-previous-day.png',
					scenario: 0,
					layout: 'wide',
					label: { en: 'Select an earlier day', zh: '选择较早的日期' },
					alt: { en: 'Home week agenda showing an overdue reminder on the selected previous day', zh: '主页周议程显示选中较早日期中的过期提醒' },
					caption: { en: 'Selecting Saturday changes only the agenda preview and reveals the item stored on that date.', zh: '选择星期六只会改变议程预览，并显示保存在该日期的项目。' }
				},
				{
					src: 'assets/images/home/home-reminders-empty.png',
					scenario: 1,
					label: { en: 'No dated reminders', zh: '没有带日期的提醒' },
					alt: { en: 'Empty Home Reminders widget with zero open reminders', zh: '待办数为零的主页提醒空组件' },
					caption: { en: 'The panel states that no reminders are available.', zh: '面板会明确说明当前没有提醒。' }
				},
				{
					src: 'assets/images/home/home-reminders-today-tomorrow.png',
					scenario: 1,
					label: { en: 'Today and tomorrow, sorted', zh: '今日与明日，按日期排序' },
					alt: { en: 'Populated Home Reminders widget with Guide Demo items due today and tomorrow', zh: '主页提醒组件显示今日和明日到期的 Guide Demo 项目' },
					caption: { en: 'The badge is the full open count; rows are ordered by date.', zh: '徽标是完整待办数；各行按日期排列。' }
				},
				{
					src: 'assets/images/home/home-reminders-overdue.png',
					scenario: 1,
					label: { en: 'Overdue, today, then tomorrow', zh: '过期、今日、明日依次排列' },
					alt: { en: 'Home Reminders widget with red overdue, today, and upcoming rows', zh: '主页提醒组件显示红色过期、今日与即将到期的项目' },
					caption: { en: 'Overdue dates turn red while eligible rows remain in ascending date order.', zh: '过期日期会显示为红色；符合条件的行仍按日期升序排列。' }
				},
				{
					src: 'assets/images/home/home-shortcuts-empty.png',
					scenario: 2,
					label: { en: 'No personal shortcuts', zh: '没有个人快捷指令' },
					alt: { en: 'Empty Home Shortcuts widget', zh: '主页快捷指令空组件' },
					caption: { en: 'Shared Portal links do not fill this personal panel.', zh: '共享链接不会填入这个个人面板。' }
				},
				{
					src: 'assets/images/home/home-shortcuts-populated.png',
					scenario: 2,
					label: { en: 'A personal Portal link appears', zh: '个人链接会显示在这里' },
					alt: { en: 'Populated Home Shortcuts widget with a Guide Demo personal link', zh: '主页快捷指令组件显示 Guide Demo 个人链接' },
					caption: { en: 'Selecting the row opens the URL and requests a visit-count update.', zh: '点击这一行会打开网址，并请求更新访问次数。' }
				},
				{
					src: 'assets/images/home/home-debt-empty.png',
					scenario: 3,
					label: { en: 'No upcoming payments', zh: '没有即将到期的还款项' },
					alt: { en: 'Empty Home Debt Sonata widget', zh: '主页债务空组件' },
					caption: { en: 'A calm empty message replaces the progress list.', zh: '没有符合条件的债务时，会用清晰空状态替代进度列表。' }
				},
				{
					src: 'assets/images/home/home-debt-populated.png',
					scenario: 3,
					label: { en: 'Payment progress and due date', zh: '还款进度与到期日期' },
					alt: { en: 'Home Debt Sonata widget showing ten percent paid and due tomorrow', zh: '主页债务组件显示已还百分之十并于明日到期' },
					caption: { en: 'The sample was created on Debt Sonata, then paid down once to expose the progress calculation.', zh: '示例先在「债务」创建，再记录一次还款，以展示进度计算。' }
				},
				{
					src: 'assets/images/home/home-debt-overdue-upcoming.png',
					scenario: 3,
					label: { en: 'Overdue red, upcoming orange', zh: '过期为红色，即将到期为橙色' },
					alt: { en: 'Home Debt Sonata widget with one overdue debt and one due tomorrow', zh: '主页债务组件显示一项过期债务与一项明日到期债务' },
					caption: { en: 'Both rows keep their own paid percentage while the due label communicates urgency.', zh: '两行分别保留自己的已还百分比，同时由到期标签表达紧迫性。' }
				},
				{
					src: 'assets/images/home/home-entertainment-populated.png',
					scenario: 4,
					label: { en: 'Top five genre bars', zh: '前五个类型条' },
					alt: { en: 'Home Entertainment widget with total and five ranked genre bars', zh: '主页影视组件显示总数与五个按排名排列的类型条' },
					caption: { en: 'Bar widths are relative to the leading genre, not percentages of the full library.', zh: '条形宽度相对于第一名计算，不是占整个片库的百分比。' }
				},
				{
					src: 'assets/images/home/home-recipes-populated.png',
					scenario: 5,
					label: { en: 'Recipe names and localized categories', zh: '食谱名称与本地化类别' },
					alt: { en: 'Home Recipes widget with recipe names and categories', zh: '主页食谱组件显示食谱名称与类别' },
					caption: { en: 'The badge is the recipe total while the panel presents a compact source list.', zh: '徽标显示食谱总数；面板呈现紧凑的来源列表。' }
				},
				{
					src: 'assets/images/home/home-activity-latest.png',
					scenario: 6,
					label: { en: 'Guide Demo actions become activity', zh: 'Guide Demo 操作进入动态' },
					alt: { en: 'Home Activity widget showing reminder, debt, link, and category events', zh: '主页动态组件显示提醒、债务、链接与类别事件' },
					caption: { en: 'The unified feed keeps only the newest supported events and is capped at twenty rows.', zh: '统一动态只保留最新的支持事件，并最多显示二十行。' }
				},
				{
					src: 'assets/images/home/home-activity-footer.png',
					scenario: 6,
					layout: 'wide',
					label: { en: 'The dashboard closing line', zh: '仪表盘的收尾文案' },
					alt: { en: 'Bilingual Yesterday is history footer below the Home activity panels', zh: '主页动态面板下方中英文「往日已成历史」页尾' },
					caption: { en: 'The bilingual footer is decorative and has no action or hidden link.', zh: '这条双语页尾只是装饰，没有操作或隐藏链接。' }
				}
			],
			routes: [
				{
					src: 'assets/images/home/home-urgency-mixed-due.png',
					scenario: 0,
					layout: 'wide',
					label: { en: 'Reminder and debt urgency together', zh: '提醒与债务紧迫信息同时出现' },
					alt: { en: 'Home urgency strip combining two reminders due today with a debt due tomorrow', zh: '主页紧迫条同时汇总今日两项提醒与明日一项债务' },
					caption: { en: 'Multiple reminders collapse to a count; the debt keeps its nearest due label.', zh: '多项提醒会折叠为数量；债务保留最近到期标签。' }
				},
				{
					src: 'assets/images/home/home-urgency-overdue.png',
					scenario: 0,
					layout: 'wide',
					label: { en: 'Overdue summaries lead the strip', zh: '紧迫条优先显示过期摘要' },
					alt: { en: 'Home urgency strip with grouped overdue reminders and debts', zh: '主页紧迫条显示分组后的过期提醒与债务' },
					caption: { en: 'Counts replace individual names when several records qualify; Various means their dates differ.', zh: '多项记录符合条件时会用数量替代名称；「多条」表示日期不同。' }
				},
				{
					src: 'assets/images/home/home-quick-actions.png',
					scenario: 1,
					layout: 'wide',
					label: { en: 'Six creation shortcuts', zh: '六个创建快捷入口' },
					alt: { en: 'All six Home quick-action buttons', zh: '主页全部六个快捷操作按钮' },
					caption: { en: 'Each route opens the destination page that owns the form, validation, and save result.', zh: '每个入口都会打开负责表单、校验与保存结果的目标页面。' }
				},
				{
					src: 'assets/images/home/home-pinned-shortcut.png',
					scenario: 2,
					label: { en: 'Pinned personal shortcut', zh: '已置顶的个人快捷指令' },
					alt: { en: 'Pinned Guide Demo personal Portal link on Home', zh: '主页显示已置顶的 Guide Demo 个人链接' },
					caption: { en: 'Only personal links marked as pinned enter this row; shared links are excluded.', zh: '只有标记为置顶的个人链接会进入这一行；共享链接会被排除。' }
				}
			]
		},
		copy: {
			en: {
				navigation: 'Home',
				family: 'Orientation and overview',
				summary: 'Enter through the editorial cover, then use the orbital dashboard to scan time, urgency, activity, and the rest of the app.',
				hero: {
					eyebrow: 'Home · orientation and overview',
					title: 'Read the whole canvas before choosing the next move.',
					summary: 'Home changes with your session. Signed out, it is an editorial entrance; signed in, it becomes a live orbital dashboard built from the work stored across Vision Canvas.',
					primaryAction: 'Enter the dashboard',
					secondaryAction: 'See the dashboard loop',
					facts: [
						{ value: '4', label: 'life-clock progress rings' },
						{ value: '6', label: 'live dashboard panels' },
						{ value: '3 days', label: 'urgency-strip horizon' }
					],
					scene: {
						type: 'dashboard',
						label: 'Orbital dashboard',
						title: 'Your day at a glance',
						badge: 'Live',
						items: [
							{ title: 'Life clock', body: 'Year · month · week · day', value: '09:42' },
							{ title: 'Reminders', body: 'Due and overdue', value: '3' },
							{ title: 'Activity', body: 'Recent changes', value: '7d' },
							{ title: 'This week', body: 'Agenda and quick routes', value: 'Open' }
						]
					}
				},
				journey: ['Arrive', 'Read time', 'Scan panels', 'Follow urgency', 'Open a page'],
				sections: [
					{
						id: 'arrival', nav: 'Two entrances', kicker: 'Session state', title: 'Home knows whether you are ready to work.',
						summary: 'The signed-out view is a quiet bilingual cover. Once authentication settles, Home replaces it with the dashboard rather than layering controls over the welcome scene.',
						points: [
							{ title: 'Signed out', body: 'Use the editorial cover to understand the app before signing in.' },
							{ title: 'Signed in', body: 'Live counts, links, reminders, debt, recipes, and activity fill the orbital layout.' },
							{ title: 'Loading', body: 'The dashboard waits for authentication and statistics before revealing the full scene.' }
						],
						note: { title: 'The transition is intentional', body: 'Home does not show private dashboard data until the session and data layer are ready.', tone: 'rose' },
						scene: { type: 'split', label: 'Session-aware entry', title: 'Cover to dashboard', badge: 'Auth', items: [
							{ title: 'Editorial cover', body: 'Public, bilingual, calm', value: '01' },
							{ title: 'Orbital view', body: 'Private, live, actionable', value: '02' }
						] }
					},
					{
						id: 'clock', nav: 'Read the life clock', kicker: 'Time and progress', title: 'Use the centre to orient, not to schedule.',
						summary: 'The central clock shows the current time while concentric rings describe how far the year, month, week, and day have progressed.',
						points: [
							{ title: 'Desktop rings', body: 'Four concentric measures surround the clock without becoming controls.' },
							{ title: 'Narrow progress cards', body: 'Compact cards appear below the rings; the current layout keeps both copies of the same four values.' },
							{ title: 'Greeting and date', body: 'The header combines the current part of day, account name, and long date.' }
						],
						note: { title: 'Orientation, not a calendar', body: 'Open Today when you need to place or move work in time.', tone: 'blue' },
						scene: { type: 'orbit', label: 'Life-clock core', title: 'Progress around now', badge: 'Time', items: [
							{ title: 'Year', body: 'Long horizon', value: '61%' },
							{ title: 'Month', body: 'Current cycle', value: '26%' },
							{ title: 'Week', body: 'Seven-day rhythm', value: '71%' },
							{ title: 'Day', body: 'Today so far', value: '40%' }
						] }
					},
					{
						id: 'panels', nav: 'Use live panels', kicker: 'Dashboard panels', title: 'Treat each panel as a doorway with context.',
						summary: 'The bento panels preview reminders, saved links, debt, entertainment genres, recipes, recent activity, and the week agenda.',
						points: [
							{ title: 'Open by heading', body: 'Interactive panel headings route to their source page.' },
							{ title: 'Open by item', body: 'Saved links open directly; lists show up to twenty useful items.' },
							{ title: 'Read empty states', body: 'A calm message replaces a blank panel when the source has no data.' }
						],
						note: { title: 'Counts have different scopes', body: 'Public collections use global totals; private panels use the active account and its allowed shared data.', tone: 'violet' },
						scene: { type: 'cards', label: 'Live bento panels', title: 'Context before navigation', badge: '6 panels', items: [
							{ title: 'Reminders', body: 'Open and overdue', value: '3' },
							{ title: 'Debt Sonata', body: 'Progress and due dates', value: '2' },
							{ title: 'Recipes', body: 'Recent cookbook entries', value: '12' },
							{ title: 'Activity', body: 'Private and shared changes', value: 'Now' }
						] }
					},
					{
						id: 'routes', nav: 'Move with purpose', kicker: 'Urgency and shortcuts', title: 'Let urgency narrow the next decision.',
						summary: 'The desktop urgency strip surfaces items due within three days. Quick-action pills and pinned links provide the shortest route when you already know where to go.',
						points: [
							{ title: 'Urgent strip', body: 'Summarizes reminders and debts close enough to need attention.' },
							{ title: 'Quick actions', body: 'Open frequent destinations without searching the navigation.' },
							{ title: 'Pinned links', body: 'Use colour-coded shortcuts for external destinations.' }
						],
						note: { title: 'Narrow layouts reflow', body: 'Panels stack and the urgency strip hides, while the current implementation keeps both the rings and the four progress cards.', tone: 'amber' },
						scene: { type: 'workflow', label: 'Next-action path', title: 'Notice, choose, open', badge: '3 days', items: [
							{ title: 'Notice', body: 'Read the urgency summary', value: '01' },
							{ title: 'Choose', body: 'Pick the relevant source', value: '02' },
							{ title: 'Open', body: 'Continue in the owning page', value: '03' }
						] }
					}
				],
				rules: [
					{ title: 'Dashboard privacy', body: 'Private panels appear only after sign-in.' },
					{ title: 'Urgency window', body: 'The strip focuses on items due within three days.' },
					{ title: 'Shared activity', body: 'Connected-account reminder activity can join the recent feed.' },
					{ title: 'Panel limits', body: 'Overflow routes you to the source page for the full list.' }
				],
				footer: { eyebrow: 'End of Home · Page 01', title: 'Orient first. Choose second. Continue in context.', body: 'Use Home as the map, then finish the work in the page that owns it.' }
			},
			zh: {
				navigation: '主页',
				family: '定位与总览',
				summary: '从编辑式封面进入，再用轨道仪表盘查看时间、紧迫事项、活动和应用其余部分。',
				hero: {
					eyebrow: '主页 · 定位与总览',
					title: '先读懂整张画布，再决定下一步。',
					summary: '主页会随登录状态改变。未登录时，它是一张编辑式封面；登录后，它会成为由愿景画布各处数据组成的实时轨道仪表盘。',
					primaryAction: '进入仪表盘',
					secondaryAction: '查看仪表盘流程',
					facts: [
						{ value: '4', label: '个生命时钟进度环' },
						{ value: '6', label: '个实时仪表盘面板' },
						{ value: '3 天', label: '紧迫事项观察窗口' }
					],
					scene: {
						type: 'dashboard', label: '轨道仪表盘', title: '一眼看清今天', badge: '实时',
						items: [
							{ title: '生命时钟', body: '年 · 月 · 周 · 日', value: '09:42' },
							{ title: '提醒', body: '即将到期与逾期', value: '3' },
							{ title: '活动', body: '最近的变化', value: '7天' },
							{ title: '本周', body: '日程与快捷入口', value: '打开' }
						]
					}
				},
				journey: ['抵达', '读取时间', '浏览面板', '跟随紧迫事项', '打开页面'],
				sections: [
					{
						id: 'arrival', nav: '两种入口', kicker: '登录状态', title: '主页知道你是否已经准备好开始。',
						summary: '未登录视图是一张安静的双语封面。身份确认后，主页会直接切换为仪表盘，而不是把私人控件叠在欢迎场景上。',
						points: [
							{ title: '未登录', body: '先通过编辑式封面理解应用，再进行登录。' },
							{ title: '已登录', body: '实时统计、链接、提醒、债务、食谱和活动进入轨道布局。' },
							{ title: '载入中', body: '仪表盘会等待身份和统计数据就绪，再显示完整场景。' }
						],
						note: { title: '这次切换是有意为之', body: '会话和数据层就绪之前，主页不会显示私人仪表盘数据。', tone: 'rose' },
						scene: { type: 'split', label: '会话感知入口', title: '从封面到仪表盘', badge: '身份', items: [
							{ title: '编辑式封面', body: '公开、双语、安静', value: '01' },
							{ title: '轨道视图', body: '私人、实时、可操作', value: '02' }
						] }
					},
					{
						id: 'clock', nav: '读取生命时钟', kicker: '时间与进度', title: '用中心定位，而不是排程。',
						summary: '中心时钟显示当前时间，四个同心环则说明今年、本月、本周和今天已经走过多少。',
						points: [
							{ title: '桌面进度环', body: '四项进度环绕时钟展示，本身不是操作控件。' },
							{ title: '窄屏进度卡', body: '紧凑卡片会显示在进度环下方；当前布局会保留同一组四项数值的两种显示。' },
							{ title: '问候与日期', body: '顶部结合当前时段、账户名称和完整日期。' }
						],
						note: { title: '用于定位，不是日历', body: '需要把工作放进时间轴或移动时间时，请打开「今日」。', tone: 'blue' },
						scene: { type: 'orbit', label: '生命时钟核心', title: '围绕此刻的进度', badge: '时间', items: [
							{ title: '年', body: '长期视野', value: '61%' },
							{ title: '月', body: '当前周期', value: '26%' },
							{ title: '周', body: '七日节奏', value: '71%' },
							{ title: '日', body: '今天至今', value: '40%' }
						] }
					},
					{
						id: 'panels', nav: '使用实时面板', kicker: '仪表盘面板', title: '把每个面板当作带有上下文的入口。',
						summary: '便当式面板预览提醒、保存的链接、债务、影视类型、食谱、最近活动和本周日程。',
						points: [
							{ title: '点击标题', body: '可交互的面板标题会前往对应来源页面。' },
							{ title: '点击条目', body: '保存的链接可直接打开；列表最多展示二十项有用内容。' },
							{ title: '阅读空状态', body: '来源没有数据时，会显示平静说明，而不是留下一块空白。' }
						],
						note: { title: '统计范围并不完全相同', body: '公开集合使用全局总数；私人面板使用当前账户及其允许查看的共享数据。', tone: 'violet' },
						scene: { type: 'cards', label: '实时便当面板', title: '导航前先获得上下文', badge: '6 个面板', items: [
							{ title: '提醒', body: '未完成与逾期', value: '3' },
							{ title: '债务', body: '进度与到期日', value: '2' },
							{ title: '食谱', body: '最近的菜谱记录', value: '12' },
							{ title: '活动', body: '私人和共享变化', value: '现在' }
						] }
					},
					{
						id: 'routes', nav: '有目的地移动', kicker: '紧迫事项与快捷方式', title: '让紧迫程度缩小下一步的选择。',
						summary: '桌面紧迫条会显示三天内到期的事项。已经知道目的地时，快捷操作胶囊和置顶链接提供最短路径。',
						points: [
							{ title: '紧迫条', body: '汇总近到期的提醒与债务。' },
							{ title: '快捷操作', body: '无需翻找导航即可打开常用目的地。' },
							{ title: '置顶链接', body: '用带颜色的快捷入口打开外部目的地。' }
						],
						note: { title: '窄屏会重新排列', body: '面板会纵向堆叠，紧迫条会隐藏；当前实现仍同时保留进度环和四张进度卡。', tone: 'amber' },
						scene: { type: 'workflow', label: '下一步路径', title: '注意、选择、打开', badge: '3 天', items: [
							{ title: '注意', body: '阅读紧迫摘要', value: '01' },
							{ title: '选择', body: '选择相关来源', value: '02' },
							{ title: '打开', body: '在所属页面继续', value: '03' }
						] }
					}
				],
				rules: [
					{ title: '仪表盘隐私', body: '私人面板只在登录后出现。' },
					{ title: '紧迫窗口', body: '紧迫条专注三天内到期的事项。' },
					{ title: '共享活动', body: '关联账户的提醒活动可以合并进最近动态。' },
					{ title: '面板上限', body: '内容超出后，请前往来源页面查看完整列表。' }
				],
				footer: { eyebrow: '主页结束 · 页面 01', title: '先定位，再选择，最后在上下文中继续。', body: '把主页当作地图，再到真正拥有这项工作的页面完成它。' }
			}
		}
	},
	{
		id: 'today', order: '02', icon: 'icon-calendar', accent: '22, 163, 74', generated: true,
		captures: {
			anytime: [
				{
					scenario: 2, src: 'assets/images/today/today-orientation-live.png', layout: 'wide',
					annotations: [{ text: { en: 'Date and live clock orient the current board', zh: '日期与实时时钟用于定位当前画布' }, position: 'upper-right', tone: 'green' }, { text: { en: 'There is no previous/next day control', zh: '本页没有上一天／下一天控件' }, position: 'lower-left', tone: 'blue' }],
					annotationLayout: 'margin',
					label: { en: '00 · Read Today before editing', zh: '00 · 编辑前先阅读「今日」' },
					alt: { en: 'Focused real Today header with title, orientation text, current date, and live clock', zh: '真实「今日」页首局部，显示标题、说明、当前日期与实时时钟' },
					caption: { en: 'Today is one account-level working board, not a date picker. The calendar spans 24 hours and opens near the real-time now line.', zh: '「今日」是一块账户级工作画布，不是日期选择器；日历覆盖 24 小时，并在打开时靠近实时当前时间线。' }
				},
				{
					scenario: 0, src: 'assets/images/today/today-quick-add-filled-live.png', layout: 'wide',
					annotations: [{ text: { en: 'Type here, then press Enter or Add', zh: '在这里输入，再按回车或「添加」' }, position: 'upper-left', tone: 'green' }],
					annotationLayout: 'margin',
					label: { en: '01 · Quick Add a local item', zh: '01 · 快速添加本地事件' },
					alt: { en: 'Focused real Today Quick Add field with a valid local task title', zh: '真实「今日」快速添加输入框局部，已填写有效本地事件标题' },
					caption: { en: 'A blank or spaces-only draft does nothing and opens no validation dialog.', zh: '空白或只有空格的草稿不会新增，也不会打开校验对话框。' }
				},
				{
					scenario: 0, src: 'assets/images/today/today-anytime-created-live.png', layout: 'compact',
					annotations: [{ text: { en: 'Completion · title · edit · remove', zh: '完成 · 标题 · 编辑 · 移除' }, position: 'lower-left', tone: 'blue' }],
					annotationLayout: 'margin',
					label: { en: '02 · Created in Anytime', zh: '02 · 已加入无时间事件区' },
					alt: { en: 'Focused real Today Anytime chip after Quick Add', zh: '真实「今日」无时间事件胶囊局部，显示快速添加后的结果' },
					caption: { en: 'The input clears after creation. The circle toggles completion; the pencil and × manage the item.', zh: '创建后输入框会清空；圆圈切换完成状态，铅笔与 × 用于管理事件。' }
				},
				{
					scenario: 1, src: 'assets/images/today/today-anytime-completed-live.png', layout: 'compact',
					label: { en: '03 · Toggle completion', zh: '03 · 切换完成状态' },
					alt: { en: 'Focused real Today local item in completed state', zh: '真实「今日」本地事件局部，显示完成状态' },
					caption: { en: 'Only Today-owned local items expose completion. Select the circle again to reopen the item.', zh: '只有「今日」拥有的本地事件可以完成；再次点击圆圈可恢复未完成。' }
				},
				{
					scenario: 1, src: 'assets/images/today/today-anytime-rename-edit-live.png', layout: 'compact',
					label: { en: '04 · Rename inline', zh: '04 · 行内重命名' },
					alt: { en: 'Focused real Today local item with its inline title editor open', zh: '真实「今日」本地事件局部，行内标题编辑器已打开' },
					caption: { en: 'Enter or blur saves; Escape cancels. Submitting a blank edit restores the previous title.', zh: '回车或失焦保存，Esc 取消；提交空白编辑会恢复原标题。' }
				},
				{
					scenario: 1, src: 'assets/images/today/today-anytime-renamed-live.png', layout: 'compact',
					label: { en: '05 · Renamed result', zh: '05 · 重命名结果' },
					alt: { en: 'Focused real Today local item after its title is renamed', zh: '真实「今日」本地事件局部，显示重命名后的标题' },
					caption: { en: 'Remove deletes one local item without a confirmation; Clear All is the confirmed bulk path.', zh: '移除单个本地事件不会确认；「清空全部」才是带确认的批量路径。' }
				}
			],
			draw: [
				{
					scenario: 2, src: 'assets/images/today/today-mode-controls-live.png', layout: 'compact',
					annotation: { en: 'Turn this on before drawing', zh: '拖画前先打开这里' }, annotationPosition: 'upper-right',
					label: { en: '01 · Choose a drag mode', zh: '01 · 选择拖拽模式' },
					alt: { en: 'Focused real Today toolbar showing Drag to create enabled beside Drag to move', zh: '真实「今日」工具栏局部，显示已开启「拖拽以创建」及旁边的「拖拽以移动」' },
					caption: { en: 'Drag to create and Drag to move are mutually exclusive. Changing mode cancels unfinished gesture state.', zh: '「拖拽以创建」与「拖拽以移动」互斥；切换模式会取消未完成的手势状态。' }
				},
				{
					scenario: 0, src: 'assets/images/today/today-timed-pending-live.png', layout: 'wide',
					annotations: [{ text: { en: 'Review the exact range before saving', zh: '保存前检查准确时间范围' }, position: 'lower-left', tone: 'amber' }],
					annotationLayout: 'margin',
					label: { en: '02 · Name the pending range', zh: '02 · 为待定时间范围命名' },
					alt: { en: 'Focused real Today timed block with its name field active', zh: '真实「今日」时间块局部，名称输入框已激活' },
					caption: { en: 'The range snaps to 15 minutes. Enter saves a non-blank name; Escape, blank submission, or an empty-grid cancellation discards it.', zh: '范围按 15 分钟吸附；回车保存非空名称，Esc、空白提交或点击网格空白处都会丢弃。' }
				},
				{
					scenario: 1, src: 'assets/images/today/today-timed-created-live.png', layout: 'wide',
					label: { en: '03 · Saved local time block', zh: '03 · 已保存本地时间块' },
					alt: { en: 'Focused real Today local time block showing title, range, duration, actions, and resize grip', zh: '真实「今日」本地时间块局部，显示标题、范围、时长、操作与缩放把手' },
					caption: { en: 'The block shows title, start–end, duration, edit/delete actions, completion, and the bottom resize grip.', zh: '时间块显示标题、起止时间、时长、编辑／删除、完成状态及底部缩放把手。' }
				}
			],
			adjust: [
				{
					scenario: 2, src: 'assets/images/today/today-timed-overlap-live.png', layout: 'wide',
					label: { en: '01 · Overlapping blocks share columns', zh: '01 · 重叠时间块共享列' },
					alt: { en: 'Focused real Today timeline with two overlapping local blocks in separate columns', zh: '真实「今日」时间轴局部，两个重叠本地时间块分列显示' },
					caption: { en: 'A narrower card means time overlap, not a shorter duration.', zh: '卡片变窄表示时间重叠，并不代表时长缩短。' }
				},
				{
					scenario: 0, src: 'assets/images/today/today-move-mode-live.png', layout: 'compact',
					label: { en: '02 · Enable Drag to move', zh: '02 · 开启「拖拽以移动」' },
					alt: { en: 'Focused real Today toolbar with Drag to move enabled', zh: '真实「今日」工具栏局部，已开启「拖拽以移动」' },
					caption: { en: 'Only local blocks respond. Reminder and tracked blocks stay fixed.', zh: '只有本地时间块会响应；提醒与计时时间块保持固定。' }
				},
				{
					scenario: 0, src: 'assets/images/today/today-timed-moved-live.png', layout: 'wide',
					label: { en: '03 · Move to a new time', zh: '03 · 移动到新时间' },
					alt: { en: 'Focused real Today local block after moving to a later time', zh: '真实「今日」本地时间块局部，已移动到较晚时间' },
					caption: { en: 'Release commits the snapped position and recalculates overlaps.', zh: '松开后提交吸附位置，并重新计算重叠布局。' }
				},
				{
					scenario: 1, src: 'assets/images/today/today-timed-resized-live.png', layout: 'wide',
					label: { en: '04 · Resize the end', zh: '04 · 调整结束时间' },
					alt: { en: 'Focused real Today local block after its bottom grip extends the duration', zh: '真实「今日」本地时间块局部，底部把手已延长时长' },
					caption: { en: 'The grip changes only the end time, with a 15-minute minimum and the day boundary as limits.', zh: '缩放把手只改变结束时间，最短 15 分钟，且不能越过当天边界。' }
				},
				{
					scenario: 0, src: 'assets/images/today/today-timed-to-anytime-live.png', layout: 'wide',
					annotations: [{ text: { en: 'Drop here to remove timing', zh: '拖到这里以移除时间' }, position: 'lower-right', tone: 'green' }],
					annotationLayout: 'margin',
					label: { en: '05 · Return a block to Anytime', zh: '05 · 把时间块放回无时间事件区' },
					alt: { en: 'Focused real Today Anytime lane after a scheduled local block is returned', zh: '真实「今日」无时间事件区局部，排程后的本地时间块已被放回' },
					caption: { en: 'The same local record remains, but its start and end are removed.', zh: '同一条本地记录会保留，但开始与结束时间会被移除。' }
				}
			],
			track: [
				{
					scenario: 0, src: 'assets/images/today/today-tracking-control-live.png', layout: 'compact',
					label: { en: '01 · Start and watch elapsed time', zh: '01 · 开始并观察经过时间' },
					alt: { en: 'Focused real Today toolbar showing the running Stop control and elapsed time', zh: '真实「今日」工具栏局部，显示运行中的「停止」按钮与经过时间' },
					caption: { en: 'Start tracking changes to Stop and displays the live elapsed counter.', zh: '「开始计时」会变为「停止」，并显示实时经过时间。' }
				},
				{
					scenario: 0, src: 'assets/images/today/today-tracking-band-live.png', layout: 'wide',
					label: { en: '02 · Live band on the current minute', zh: '02 · 当前分钟的实时计时带' },
					alt: { en: 'Focused real Today live tracking band growing from the current minute', zh: '真实「今日」实时计时带局部，从当前分钟开始增长' },
					caption: { en: 'The band records actual elapsed time; it is not a saved block until Stop, name, and Enter are completed.', zh: '计时带记录实际耗时；完成「停止」、命名和回车前，它还不是已保存时间块。' }
				},
				{
					scenario: 0, src: 'assets/images/today/today-tracking-pending-live.png', layout: 'wide',
					annotation: { en: 'Stop creates a pending block — name it or lose it', zh: '停止后生成待定块——命名保存，否则丢弃' }, annotationPosition: 'upper-right',
					label: { en: '03 · Stop, then name', zh: '03 · 停止后命名' },
					alt: { en: 'Focused real Today stopped tracking range with the pending name field', zh: '真实「今日」已停止计时范围局部，显示待定名称输入框' },
					caption: { en: 'Enter saves a non-blank name. Escape or a blank name discards the measured session without a validation dialog.', zh: '回车保存非空名称；Esc 或空白名称会丢弃实测时段，且不会显示校验对话框。' }
				},
				{
					scenario: 0, src: 'assets/images/today/today-tracked-tiny-live.png', layout: 'wide',
					label: { en: '04 · Short-session limitation', zh: '04 · 短时段限制' },
					alt: { en: 'Focused real Today timeline where a one-minute tracked block is visually compressed into the current-time line', zh: '真实「今日」时间轴局部，一分钟计时时间块在当前时间线处被压缩' },
					caption: { en: 'Observed limitation: a one-minute saved session can be effectively hidden by the current-time line and has no item-level controls.', zh: '已观察到的限制：一分钟的已保存时段可能被当前时间线遮住，且没有单项操作控件。' }
				},
				{
					scenario: 1, src: 'assets/images/today/today-clear-confirmation-live.png', layout: 'compact',
					annotation: { en: 'Only Today-owned items are removed', zh: '只删除「今日」自己拥有的项目' }, annotationPosition: 'lower-left',
					label: { en: '05 · Clear All confirmation', zh: '05 · 「清空全部」确认' },
					alt: { en: 'Dialog-focused crop of the real Today Clear All confirmation', zh: '真实今天全部清除确认框的对话框聚焦裁切' },
					caption: { en: 'Cancel changes nothing. Clear all removes local and tracked items plus their backup, but preserves Reminder-owned data.', zh: '「取消」不会改变任何内容；「清空全部」会移除本地与计时项目及其备份，但保留「提醒」拥有的数据。' }
				},
				{
					scenario: 1, src: 'assets/images/today/today-cleared-live.png', layout: 'wide',
					label: { en: '06 · Cleared result', zh: '06 · 清空后的结果' },
					alt: { en: 'Focused real Today Quick Add and empty Anytime lane after confirmed clearing', zh: '真实「今日」快速添加与空白无时间事件区局部，显示确认清空后的结果' },
					caption: { en: 'Revisit Today after clearing if backup removal may have failed; no local autosave error dialog is provided.', zh: '若备份清理可能失败，请重新进入「今日」核对；本地自动保存不会显示错误对话框。' }
				}
			],
			limits: [
				{
					scenario: 0, src: 'assets/images/today/today-unsupported-width-live.png', layout: 'wide',
					annotations: [{ text: { en: 'No controls are hidden below this card', zh: '此卡片下方没有隐藏的规划控件' }, position: 'lower-left', tone: 'amber' }],
					annotationLayout: 'margin',
					label: { en: '01 · Unsupported narrow layout', zh: '01 · 不支持的窄屏布局' },
					alt: { en: 'Focused real Today Not Accessible on Mobile card at the narrow breakpoint', zh: '真实「今日」窄屏断点局部，显示「不支持手机端查看」卡片' },
					caption: { en: 'At 940px or less, use a desktop, laptop, tablet, or wider window. The message changes no data.', zh: '宽度不超过 940px 时，请使用桌面端、笔记本、平板或加宽窗口；此消息不会改变数据。' }
				}
			]
		},
		copy: {
			en: {
				navigation: 'Today', family: 'Daily planning', summary: 'Build a desktop day from untimed tasks, timed blocks, live tracking, and read-only reminders.',
				hero: {
					eyebrow: 'Today · daily planning', title: 'Shape the day directly on the clock.',
					summary: 'Today is a desktop planner with an anytime lane above a minute-aware calendar. Add loose tasks quickly, draw time blocks, move or resize local work, and record what actually happened.',
					primaryAction: 'Start in the anytime lane', secondaryAction: 'See the planning loop',
					facts: [
						{ value: '24h', label: 'scrollable calendar range' },
						{ value: '15 min', label: 'default snap interval' },
						{ value: '≤940px', label: 'planner is intentionally blocked' }
					],
					scene: { type: 'calendar', label: 'Today planner', title: 'Anytime + timeline', badge: 'Desktop', items: [
						{ title: 'Anytime', body: 'Untimed work', value: '3' },
						{ title: '09:00', body: 'Focused work', value: '90m' },
						{ title: '11:30', body: 'Read-only reminder', value: '30m' },
						{ title: 'Now', body: 'Live position', value: '•' }
					] }
				},
				journey: ['Capture', 'Place', 'Move', 'Track', 'Recover'],
				sections: [
					{
						id: 'anytime', nav: 'Capture loose work', kicker: 'Anytime lane', title: 'Keep unscheduled work above the clock.',
						summary: 'Type a task in Quick Add and confirm it with Enter or Add. Local items can be completed, renamed, removed, or dragged into the calendar when move mode is on.',
						points: [
							{ title: 'Quick Add', body: 'Creates a local untimed task without opening a dialog.' },
							{ title: 'Inline edit', body: 'Rename with Enter or blur; Escape cancels the current edit.' },
							{ title: 'Move to time', body: 'Drag a local chip into the calendar to give it a start and end.' }
						],
						note: { title: 'Reminder chips are read-only', body: 'Edit or complete reminders on the Reminder page, which owns their data.', tone: 'blue' },
						scene: { type: 'cards', label: 'Anytime lane', title: 'Loose tasks stay visible', badge: 'Quick add', items: [
							{ title: 'Send the brief', body: 'Local · editable', value: '○' },
							{ title: 'Renew membership', body: 'Reminder · locked', value: 'Locked' },
							{ title: 'Plan tomorrow', body: 'Local · draggable', value: 'Move' }
						] }
					},
					{
						id: 'draw', nav: 'Draw time blocks', kicker: 'Drag to create', title: 'Draw the time first, then name the work.',
						summary: 'Enable Drag Create, draw over the calendar, and enter a title in the pending block. The ghost range shows the snapped start and end before anything is saved.',
						points: [
							{ title: 'Enable create mode', body: 'The grid only creates blocks while the explicit toggle is on.' },
							{ title: 'Draw a range', body: 'The range snaps to the planner interval and previews its exact times.' },
							{ title: 'Name or cancel', body: 'Enter saves the block; Escape dismisses the pending range.' }
						],
						note: { title: 'The now line is only a guide', body: 'It follows real time and scrolls into view when the planner opens.', tone: 'green' },
						scene: { type: 'workflow', label: 'Create a block', title: 'Toggle, draw, name', badge: '15 min', items: [
							{ title: 'Toggle', body: 'Enable Drag Create', value: '01' },
							{ title: 'Draw', body: 'Select the time range', value: '02' },
							{ title: 'Name', body: 'Confirm the pending block', value: '03' }
						] }
					},
					{
						id: 'adjust', nav: 'Move and resize', kicker: 'Direct manipulation', title: 'Change the plan without rebuilding it.',
						summary: 'Enable Drag Move to reposition local blocks or return them to the anytime lane. Resize handles change duration, while overlap layout keeps simultaneous work readable.',
						points: [
							{ title: 'Move mode', body: 'Only local blocks can move; tracked and reminder blocks stay fixed.' },
							{ title: 'Resize grip', body: 'Only local blocks expose a grip for changing the end time.' },
							{ title: 'Overlap columns', body: 'Blocks sharing time divide the available width automatically.' }
						],
						note: { title: 'Modes prevent accidental edits', body: 'Create and move are deliberate toggles rather than permanent pointer behavior.', tone: 'violet' },
						scene: { type: 'timeline', label: 'Adjust the plan', title: 'Move across time or back to anytime', badge: 'Local only', items: [
							{ title: '08:30', body: 'Original position', value: 'A' },
							{ title: '10:00', body: 'Moved position', value: 'B' },
							{ title: 'Anytime', body: 'Remove timing', value: 'C' }
						] }
					},
					{
						id: 'track', nav: 'Track real work', kicker: 'Live tracking', title: 'Record what happened, not only what was planned.',
						summary: 'Start Tracking to open a live band at the current time. Stop it to create a pending tracked block, name the session, and keep its measured duration.',
						points: [
							{ title: 'Start', body: 'A live band grows from the current minute and shows elapsed time.' },
							{ title: 'Stop', body: 'The measured range becomes a pending block ready to name.' },
							{ title: 'Review', body: 'Tracked blocks use teal; blocks of 15 minutes or more can be renamed or removed, but not moved or resized.' }
						],
						note: { title: 'Clear All protects reminders', body: 'The destructive action removes local Today work only; injected reminders remain with their source.', tone: 'red' },
							scene: { type: 'timeline', label: 'Tracking session', title: 'Actual time becomes a block', badge: 'Live', items: [
							{ title: 'Start', body: '10:12', value: 'Start' },
							{ title: 'Elapsed', body: 'Focused session', value: '42m' },
								{ title: 'Stop', body: '10:54', value: 'Stop' }
							] }
					},
					{
						id: 'limits', nav: 'Recover missing states', kicker: 'Layout and refresh boundaries', title: 'Know when the planner is unavailable or source data is stale.',
						summary: 'Today deliberately blocks widths of 940px or less. Reminder items arrive through a separate current-date subscription, so a connection interruption can leave the Today board visible without the expected source item.',
						points: [
							{ title: 'Narrow layout', body: 'Use a wider window or a desktop, laptop, or tablet; planner controls are not hidden behind the message.' },
							{ title: 'Missing Reminder', body: 'Verify the item and its date on Reminder, restore the connection, then revisit Today.' },
							{ title: 'Silent local persistence', body: 'Today does not show a write-error dialog for local autosave; reload and inspect restored state.' }
						],
						note: { title: 'Use the shared error reference for connection dialogs', body: 'Connection Lost, session expiry, permission, and unexpected failures are documented once in Messages & Errors. Today-specific recovery stays here.', tone: 'amber' },
						scene: { type: 'workflow', label: 'Recovery check', title: 'Verify source, reconnect, revisit', badge: 'No guessing', items: [
							{ title: 'Verify', body: 'Check the owning page', value: '01' },
							{ title: 'Reconnect', body: 'Restore session or network', value: '02' },
							{ title: 'Revisit', body: 'Confirm the rendered state', value: '03' }
						] }
					}
				],
				rules: [
					{ title: 'Desktop planner', body: 'Narrow viewports show a deliberate desktop-required card.' },
					{ title: 'Source ownership', body: 'Reminder items are visible but read-only in Today.' },
					{ title: 'Edit confirmation', body: 'Enter or blur saves inline edits; Escape cancels.' },
					{ title: 'Local clearing', body: 'Clear All removes local tasks and tracked blocks, not reminders.' }
				],
				footer: { eyebrow: 'End of Today · Page 02', title: 'Capture loosely. Place deliberately. Track honestly.', body: 'Today is the working surface for one day; Reminder remains the source for reminder data.' }
			},
			zh: {
				navigation: '今日', family: '每日规划', summary: '用随时任务、时间块、实时追踪和只读提醒构建桌面上的一天。',
				hero: {
					eyebrow: '今天 · 每日规划', title: '直接在时钟上塑造今天。',
					summary: '「今日」是桌面日程工具，分钟级时间轴上方放着随时任务区。快速记录松散任务、画出时间块、移动或调整本地工作，并记录真正发生的事情。',
					primaryAction: '从随时任务区开始', secondaryAction: '查看规划流程',
					facts: [
						{ value: '24 小时', label: '可滚动日历范围' },
						{ value: '15 分钟', label: '默认吸附间隔' },
						{ value: '≤940px', label: '有意不开放规划器' }
					],
					scene: { type: 'calendar', label: '今天规划器', title: '随时任务 + 时间轴', badge: '桌面', items: [
						{ title: '随时任务', body: '未安排时间的工作', value: '3' },
						{ title: '09:00', body: '专注工作', value: '90分' },
						{ title: '11:30', body: '只读提醒', value: '30分' },
						{ title: '现在', body: '实时位置', value: '•' }
					] }
				},
				journey: ['记录', '放置', '移动', '计时', '恢复'],
				sections: [
					{
						id: 'anytime', nav: '记录松散工作', kicker: '随时任务区', title: '把未排程的工作留在时钟上方。',
						summary: '在快速添加中输入任务，用回车或添加确认。本地任务可以完成、重命名、删除，也可以在移动模式开启后拖进日历。',
						points: [
							{ title: '快速添加', body: '无需打开对话框即可创建本地随时任务。' },
							{ title: '行内编辑', body: '回车或失焦保存重命名，Esc 取消当前编辑。' },
							{ title: '移动到时间轴', body: '把本地胶囊拖进日历，为它赋予开始和结束时间。' }
						],
						note: { title: '提醒胶囊只读', body: '请在拥有提醒数据的「提醒」页面编辑或完成它们。', tone: 'blue' },
						scene: { type: 'cards', label: '随时任务区', title: '松散任务保持可见', badge: '快速添加', items: [
							{ title: '发送简报', body: '本地 · 可编辑', value: '○' },
							{ title: '续订会员', body: '提醒 · 已锁定', value: '锁' },
							{ title: '规划明天', body: '本地 · 可拖动', value: '移动' }
						] }
					},
					{
						id: 'draw', nav: '画出时间块', kicker: '拖拽以创建', title: '先画出时间，再给工作命名。',
						summary: '打开「拖拽以创建」，在日历上画出范围，再在待定时间块中输入标题。保存前，幽灵范围会显示吸附后的准确开始与结束时间。',
						points: [
							{ title: '开启创建模式', body: '只有明确打开「拖拽以创建」时，网格才会创建时间块。' },
							{ title: '画出范围', body: '范围会按规划间隔吸附并预览准确时间。' },
							{ title: '命名或取消', body: '回车保存，Esc 放弃待定范围。' }
						],
						note: { title: '当前时间线只是引导', body: '它随真实时间移动，并在规划器打开时自动滚动到视野内。', tone: 'green' },
						scene: { type: 'workflow', label: '创建时间块', title: '开关、拖画、命名', badge: '15 分钟', items: [
							{ title: '开关', body: '开启拖拽以创建', value: '01' },
							{ title: '拖画', body: '选择时间范围', value: '02' },
							{ title: '命名', body: '确认待定时间块', value: '03' }
						] }
					},
					{
						id: 'adjust', nav: '移动与缩放', kicker: '直接操作', title: '无需重建，就能改变计划。',
						summary: '开启「拖拽以移动」来重新放置本地时间块，或把它们放回无时间事件区。缩放把手调整时长，重叠布局让同时发生的工作仍然清楚。',
						points: [
							{ title: '移动模式', body: '只有本地时间块可以拖动；追踪与提醒时间块保持固定。' },
							{ title: '缩放把手', body: '只有本地时间块会显示用于调整结束时间的把手。' },
							{ title: '重叠列', body: '共享同一时段的时间块会自动分配宽度。' }
						],
						note: { title: '模式可以防止误操作', body: '创建和移动都是明确开关，而不是指针永久行为。', tone: 'violet' },
						scene: { type: 'timeline', label: '调整计划', title: '在时间轴移动或回到随时任务', badge: '仅本地', items: [
							{ title: '08:30', body: '原始位置', value: 'A' },
							{ title: '10:00', body: '移动后位置', value: 'B' },
							{ title: '随时任务', body: '移除时间', value: 'C' }
						] }
					},
					{
						id: 'track', nav: '记录真实工作', kicker: '实时计时', title: '记录真正发生的事，而不只记录计划。',
						summary: '点击「开始计时」后，当前时间会出现一条实时增长的计时带。点击「停止」后，它会变成待定计时时间块，等待命名并保留实测时长。',
						points: [
							{ title: '开始', body: '「开始计时」会让实时带从当前分钟增长，并显示经过时间。' },
							{ title: '停止', body: '「停止」会把测得范围变成等待命名的时间块。' },
							{ title: '回看', body: '计时时间块使用青绿色；不少于 15 分钟时可重命名或删除，但不能移动或缩放。' }
						],
						note: { title: '「清空全部」会保护提醒', body: '破坏性操作只移除本地「今日」数据；提醒仍留在来源中。', tone: 'red' },
						scene: { type: 'timeline', label: '追踪时段', title: '真实时间变成时间块', badge: '实时', items: [
							{ title: '开始', body: '10:12', value: '开始' },
							{ title: '经过', body: '专注时段', value: '42分' },
							{ title: '停止', body: '10:54', value: '停止' }
							] }
					},
					{
						id: 'limits', nav: '恢复缺失状态', kicker: '布局与刷新边界', title: '识别规划器不可用或来源数据未更新的情况。',
						summary: '宽度不超过 940px 时，「今日」会明确阻止使用。提醒通过独立的当前日期订阅进入，因此连接中断时，画布可能仍可见，但预期的提醒来源项目没有出现。',
						points: [
							{ title: '窄屏布局', body: '加宽窗口，或使用桌面端、笔记本或平板；消息卡片后面没有隐藏规划控件。' },
							{ title: '提醒缺失', body: '先在「提醒」核对项目与日期，恢复连接，再重新进入「今日」。' },
							{ title: '静默本地持久化', body: '本地自动保存不会显示写入错误对话框；请重新载入并检查恢复状态。' }
						],
						note: { title: '连接对话框请查看通用错误参考', body: '「连接已断开...」、会话过期、权限和未知错误统一记录在「通用消息与错误」；「今日」专用恢复留在这里。', tone: 'amber' },
						scene: { type: 'workflow', label: '恢复检查', title: '核对来源、恢复连接、重新进入', badge: '不要猜测', items: [
							{ title: '核对', body: '检查所属页面', value: '01' },
							{ title: '恢复连接', body: '恢复会话或网络', value: '02' },
							{ title: '重新进入', body: '确认渲染状态', value: '03' }
							] }
					}
				],
				rules: [
					{ title: '桌面规划器', body: '窄屏会显示明确的桌面设备提示卡。' },
					{ title: '来源所有权', body: '提醒项目在「今日」可见但只读。' },
					{ title: '编辑确认', body: '回车或失焦保存，Esc 取消。' },
					{ title: '本地清除', body: '「清空全部」只移除本地事件和计时时间块，不移除提醒。' }
				],
				footer: { eyebrow: '今天结束 · 页面 02', title: '轻松记录，认真放置，如实追踪。', body: '「今日」负责一天的工作表面；「提醒」仍然拥有提醒数据。' }
			}
		}
	},
	{
		id: 'reminder', order: '03', icon: 'icon-bell', accent: '213, 51, 105', generated: false,
		copy: {
			en: { navigation: 'Reminder', family: 'Capture and follow-through', summary: 'Capture, schedule, edit, share, complete, and remove reminders without leaving the card grid.' },
			zh: { navigation: '提醒', family: '记录与执行', summary: '无需离开卡片网格，即可记录、排程、编辑、共享、完成和删除提醒。' }
		}
	},
	{
		id: 'portal', order: '04', icon: 'icon-portal', accent: '132, 204, 22', generated: true,
		captures: {
			library: [
				{ src: 'assets/images/portal/library-live.jpg', layout: 'wide', label: { en: 'Shared and personal library', zh: '共享与个人链接库' }, alt: { en: 'Real Portal page with shared link cards and the personal section', zh: '真实的链接页面，显示共享链接卡片和个人分区' }, caption: { en: 'The running app keeps shared resources above the separate personal library.', zh: '运行中的应用把共享资源放在独立个人库上方。' } },
				{ src: 'assets/images/portal/empty-library-live.jpg', layout: 'wide', label: { en: 'Library loading boundary', zh: '链接库载入边界' }, alt: { en: 'Real Portal page before shared link records finish loading', zh: '真实的链接页面，共享链接记录尚未载入完成' }, caption: { en: 'The real initial state preserves both ownership sections while records arrive.', zh: '记录载入时，真实初始状态仍保留两个所有权分区。' } }
			],
			categories: [
				{ src: 'assets/images/portal/category-dialog-live.jpg', layout: 'wide', label: { en: 'Category editor', zh: '类别编辑器' }, alt: { en: 'Real Portal category dialog', zh: '真实的链接类别对话框' }, caption: { en: 'Category management stays in a focused dialog beside the filter context.', zh: '类别管理留在筛选上下文旁的聚焦对话框中。' } }
			],
			links: [
				{ src: 'assets/images/portal/add-link-dialog-live.jpg', layout: 'wide', label: { en: 'Add one link', zh: '添加单个链接' }, alt: { en: 'Real Portal Add Link dialog', zh: '真实的链接添加链接对话框' }, caption: { en: 'Single-link entry exposes the fields and ownership choice together.', zh: '单链接录入同时展示字段和所有权选择。' } },
				{ src: 'assets/images/portal/batch-links-dialog-live.jpg', layout: 'wide', label: { en: 'Batch link entry', zh: '批量链接录入' }, alt: { en: 'Real Portal batch-add dialog', zh: '真实的链接批量添加对话框' }, caption: { en: 'The batch path accepts an existing list without repeating the single-entry shell.', zh: '批量路径可接收现有清单，无需重复单条录入界面。' } }
			],
			calculator: [
				{
					src: 'assets/images/portal/admin-calculator-unavailable-live.jpg', scenario: 0, presentation: 'side-by-side',
					label: { en: 'Standard-account Portal toolbar', zh: '普通账户的链接工具栏' },
					alt: { en: 'Focused real Portal toolbar for a standard account, with no administrator date calculator control', zh: '聚焦真实链接工具栏；普通账户不会显示管理员日期计算器控件' },
					caption: { en: 'This real standard-account state demonstrates the permission boundary: the administrator-only calculator is absent rather than disabled.', zh: '这个真实普通账户状态展示权限边界：仅管理员可见的日期计算器会直接隐藏，而不是显示为不可用。' },
					annotationLayout: 'margin',
					annotations: [
						{ text: { en: 'No calculator here = this account is not an administrator', zh: '这里没有计算器＝当前账户不是管理员' }, position: 'lower-left', tone: 'rose' }
					]
				}
			]
		},
		copy: {
			en: {
				navigation: 'Portal', family: 'Links and date tools', summary: 'Organize personal and shared links by category, then use the admin date calculator when calendar arithmetic matters.',
				hero: {
					eyebrow: 'Portal · links and date tools', title: 'Turn a pile of links into a useful launch surface.',
					summary: 'Portal separates shared resources from your own library, gives every link a recognizable card, and keeps category management close to filtering. Administrators also receive a compact date calculator.',
					primaryAction: 'Organize the link library', secondaryAction: 'See the Portal loop',
					facts: [
						{ value: '2', label: 'shared and personal sections' },
						{ value: 'Batch', label: 'multi-link creation path' },
						{ value: 'Admin', label: 'date calculator access' }
					],
					scene: { type: 'cards', label: 'Link library', title: 'Shared above, personal below', badge: 'Categories', items: [
						{ title: 'OpenAI', body: 'Research · shared', value: '12' },
						{ title: 'Design archive', body: 'Reference · personal', value: '4' },
						{ title: 'Travel board', body: 'Planning · personal', value: '1' },
						{ title: 'Add links', body: 'Single or batch', value: '+' }
					] }
				},
				journey: ['Choose a category', 'Scan ownership', 'Open a link', 'Add or edit', 'Review visits'],
				sections: [
					{
						id: 'library', nav: 'Read the library', kicker: 'Shared and personal', title: 'Ownership stays visible before you act.',
						summary: 'Shared links always occupy their own section above My Links. Empty states remain visible, so a filter never makes ownership ambiguous.',
						points: [
							{ title: 'Shared section', body: 'Resources shared with the wider workspace appear first.' },
							{ title: 'My Links', body: 'Your personal library stays separate and always offers an add path.' },
							{ title: 'Permission-aware actions', body: 'Owners edit their links; administrators can manage shared records.' }
						],
						note: { title: 'Filtering never mixes ownership', body: 'The selected category is applied independently to both sections.', tone: 'green' },
						scene: { type: 'split', label: 'Ownership split', title: 'Shared ≠ personal', badge: 'Safe actions', items: [
							{ title: 'Shared', body: 'Workspace resources', value: '5' },
							{ title: 'My Links', body: 'Your editable library', value: '8' }
						] }
					},
					{
						id: 'categories', nav: 'Filter by category', kicker: 'Category strip', title: 'Use categories as a visible working context.',
						summary: 'The horizontal category strip shows a count for All and every custom category. Select one to narrow both sections; edit or add categories directly from the strip.',
						points: [
							{ title: 'All', body: 'Returns both link sections to their complete state.' },
							{ title: 'Category counts', body: 'Every tab shows how many matching links it contains.' },
							{ title: 'Manage in place', body: 'Edit a category from its tab or add another from the plus control.' }
						],
						note: { title: 'Categories are ownership-scoped', body: 'Deleting a category uses the current owner scope required by the data rules.', tone: 'amber' },
						scene: { type: 'workflow', label: 'Filter context', title: 'All, category, clear', badge: 'Visible', items: [
							{ title: 'All', body: '13 links', value: '13' },
							{ title: 'Research', body: '5 links', value: '5' },
							{ title: 'Travel', body: '3 links', value: '3' }
						] }
					},
					{
						id: 'links', nav: 'Add and open links', kicker: 'Link cards', title: 'Recognize the destination before opening it.',
						summary: 'Cards combine a title, domain, visit count, colour, and cached brand image. Add one link for careful entry or use Batch when the list already exists.',
						points: [
							{ title: 'Single add', body: 'Enter URL, title, category, and sharing choice in one focused dialog.' },
							{ title: 'Batch add', body: 'Create several links in one pass without repeating the shell.' },
							{ title: 'Open and count', body: 'Opening a card increments its visit count and launches the destination.' }
						],
						note: { title: 'Brand images have fallbacks', body: 'Cached brand logos fall back to a live lookup, then to the link initial.', tone: 'blue' },
						scene: { type: 'cards', label: 'Card anatomy', title: 'Logo, title, domain, visits', badge: 'Fallback-safe', items: [
							{ title: 'Brand mark', body: 'Cached when available', value: '◎' },
							{ title: 'Domain', body: 'Normalized host name', value: '.com' },
							{ title: 'Visits', body: 'Updated on open', value: '12' }
						] }
					},
					{
						id: 'calculator', nav: 'Use the date calculator', kicker: 'Administrator tool', title: 'Keep repetitive calendar arithmetic compact.',
						summary: 'Administrators can expand the current or next month, edit numeric cells, mark dates confirmed, read the total, or restore the calculated defaults.',
						points: [
							{ title: 'Current or next month', body: 'A segmented control switches the working month.' },
							{ title: 'Confirm cells', body: 'Charged and today states remain visually distinct.' },
							{ title: 'Reset safely', body: 'Restoring defaults requires confirmation before overwriting edits.' }
						],
						note: { title: 'Admin only', body: 'The calculator is hidden when the current account does not have administrator rights.', tone: 'red' },
						scene: { type: 'table', label: 'Date calculator', title: 'Current month', badge: 'Admin', items: [
							{ title: 'Week 1', body: 'Four editable values', value: 'Done' },
							{ title: 'Week 2', body: 'Today highlighted', value: 'Now' },
							{ title: 'Confirmed', body: 'Progress footer', value: '14/20' }
						] }
					}
				],
				rules: [
					{ title: 'Two ownership sections', body: 'Shared and personal links never collapse into one undifferentiated grid.' },
					{ title: 'Real brand fallback', body: 'Cards fall back from cache to proxy to an initial.' },
					{ title: 'Visit counts', body: 'Opening a link records another visit.' },
					{ title: 'Calculator permission', body: 'Only administrators see and edit the date calculator.' }
				],
				footer: { eyebrow: 'End of Portal · Page 04', title: 'Sort the path. Recognize the destination. Open with confidence.', body: 'Portal keeps launch points useful by preserving category and ownership context.' }
			},
			zh: {
				navigation: '链接', family: '链接与日期工具', summary: '按类别整理个人和共享链接，并在需要日期运算时使用管理员日期计算器。',
				hero: {
					eyebrow: '链接 · 链接与日期工具', title: '把一堆链接变成真正有用的启动台。',
					summary: '「链接」把共享资源与个人收藏分开，为每个链接提供易识别的卡片，并让类别管理紧挨筛选操作。管理员还会看到紧凑的日期计算器。',
					primaryAction: '整理链接库', secondaryAction: '查看链接流程',
					facts: [
						{ value: '2', label: '个共享与个人分区' },
						{ value: '批量', label: '多链接创建路径' },
						{ value: '管理员', label: '日期计算器权限' }
					],
					scene: { type: 'cards', label: '链接库', title: '共享在上，个人在下', badge: '类别', items: [
						{ title: 'OpenAI', body: '研究 · 共享', value: '12' },
						{ title: '设计档案', body: '参考 · 个人', value: '4' },
						{ title: '旅行看板', body: '规划 · 个人', value: '1' },
						{ title: '添加链接', body: '单个或批量', value: '+' }
					] }
				},
				journey: ['选择类别', '确认所有权', '打开链接', '添加或编辑', '查看访问次数'],
				sections: [
					{
						id: 'library', nav: '阅读链接库', kicker: '共享与个人', title: '操作前，所有权始终清楚可见。',
						summary: '共享链接始终单独位于「我的链接」上方。即使没有匹配项，空状态也会保留，因此筛选不会让所有权变得含糊。',
						points: [
							{ title: '共享分区', body: '与更大工作空间共享的资源首先出现。' },
							{ title: '我的链接', body: '个人收藏保持独立，并始终提供添加入口。' },
							{ title: '权限感知操作', body: '所有者编辑自己的链接；管理员可以管理共享记录。' }
						],
						note: { title: '筛选不会混合所有权', body: '选中的类别会分别应用于两个分区。', tone: 'green' },
						scene: { type: 'split', label: '所有权分区', title: '共享 ≠ 个人', badge: '安全操作', items: [
							{ title: '共享', body: '工作空间资源', value: '5' },
							{ title: '我的链接', body: '可编辑的个人库', value: '8' }
						] }
					},
					{
						id: 'categories', nav: '按类别筛选', kicker: '类别条', title: '把类别当作可见的工作上下文。',
						summary: '横向类别条会显示「全部」和每个自定义类别的数量。选择一个类别会同时缩小两个分区，也可直接在类别条编辑或新增类别。',
						points: [
							{ title: '全部', body: '让两个链接分区回到完整状态。' },
							{ title: '类别计数', body: '每个标签显示匹配链接数量。' },
							{ title: '原地管理', body: '从类别标签编辑，或用加号新增类别。' }
						],
						note: { title: '类别受所有权范围约束', body: '删除类别时会使用数据规则要求的当前所有者范围。', tone: 'amber' },
						scene: { type: 'workflow', label: '筛选上下文', title: '全部、类别、清除', badge: '可见', items: [
							{ title: '全部', body: '13 个链接', value: '13' },
							{ title: '研究', body: '5 个链接', value: '5' },
							{ title: '旅行', body: '3 个链接', value: '3' }
						] }
					},
					{
						id: 'links', nav: '添加与打开链接', kicker: '链接卡片', title: '打开前先认出目的地。',
						summary: '卡片结合标题、域名、访问次数、颜色和缓存品牌图。仔细录入时添加一个链接，已有清单时使用批量添加。',
						points: [
							{ title: '单个添加', body: '在专注对话框中输入网址、标题、类别和共享选择。' },
							{ title: '批量添加', body: '一次创建多个链接，无需重复打开外壳。' },
							{ title: '打开并计数', body: '打开卡片会增加访问次数并启动目的地。' }
						],
						note: { title: '品牌图有多级后备', body: '缓存品牌标志会回退到实时查询，最后回退到链接首字母。', tone: 'blue' },
						scene: { type: 'cards', label: '卡片结构', title: '标志、标题、域名、访问', badge: '后备安全', items: [
							{ title: '品牌标志', body: '可用时读取缓存', value: '◎' },
							{ title: '域名', body: '规范化主机名', value: '.com' },
							{ title: '访问', body: '打开时更新', value: '12' }
						] }
					},
					{
						id: 'calculator', nav: '使用日期计算器', kicker: '管理员工具', title: '让重复的日期运算保持紧凑。',
						summary: '管理员可以展开本月或下月，编辑数字单元格、标记已确认日期、读取总数，或恢复计算后的默认值。',
						points: [
							{ title: '本月或下月', body: '分段控件切换工作月份。' },
							{ title: '确认单元格', body: '已确认和今天保持不同视觉状态。' },
							{ title: '安全重置', body: '覆盖编辑前，恢复默认值需要确认。' }
						],
						note: { title: '仅限管理员', body: '当前账户没有管理员权限时，计算器完全隐藏。', tone: 'red' },
						scene: { type: 'table', label: '日期计算器', title: '本月', badge: '管理员', items: [
							{ title: '第一周', body: '四个可编辑值', value: '完成' },
							{ title: '第二周', body: '今天已高亮', value: '现在' },
							{ title: '已确认', body: '底部进度', value: '14/20' }
						] }
					}
				],
				rules: [
					{ title: '两个所有权分区', body: '共享与个人链接不会合并成无法区分的网格。' },
					{ title: '真实品牌后备', body: '卡片会从缓存回退到代理，再回退到首字母。' },
					{ title: '访问次数', body: '每次打开链接都会记录新的访问。' },
					{ title: '计算器权限', body: '只有管理员可以查看和编辑日期计算器。' }
				],
				footer: { eyebrow: '链接结束 · 页面 04', title: '整理路径，认清目的地，自信打开。', body: '「链接」通过保留类别和所有权上下文，让启动点持续有用。' }
			}
		}
	},
	{
		id: 'vault', order: '05', icon: 'icon-vault', accent: '71, 85, 105', generated: true,
		captures: {
			access: [
				{ src: 'assets/images/vault/locked-live.jpg', layout: 'wide', label: { en: 'Protected Vault entry', zh: '受保护的保险箱入口' }, alt: { en: 'Real Vault page asking for the account passphrase', zh: '真实的保险箱页面，要求输入账户口令' }, caption: { en: 'This account is protected; the guide does not request, reveal, or enter the private passphrase.', zh: '此账户受口令保护；指南不会索取、展示或输入私人口令。' } }
			],
			add: [
				{ src: 'assets/images/vault/vault-add-dialog-live.png', layout: 'portrait', label: { en: 'Choose the record type first', zh: '先选择记录类型' }, alt: { en: 'Real Vault Add dialog offering Account, Non-account, and Category record types', zh: '真实的保险箱添加对话框，提供账户、非账户和类别三种记录类型' }, caption: { en: 'The first step decides which fields and relationships become available next.', zh: '第一步决定下一步会出现哪些字段与关系。' } }
			],
			graph: [
				{ src: 'assets/images/vault/vault-graph-populated-live.png', layout: 'wide', label: { en: 'Read the legend and a real node together', zh: '同时阅读图例与真实节点' }, alt: { en: 'Real Vault Graph with legend counts and a temporary account node', zh: '真实的保险箱关系图，显示图例计数与临时账户节点' }, caption: { en: 'The map uses the legend to identify node families; open space belongs to the relationship canvas rather than the guide layout.', zh: '关系图使用图例识别节点类型；留白属于关系画布本身，而不是指南排版。' } }
			],
			list: [
				{ src: 'assets/images/vault/vault-list-populated-live.png', layout: 'wide', label: { en: 'Edit the precise record in List', zh: '在列表中精确编辑记录' }, alt: { en: 'Real Vault List with category count and a temporary account record', zh: '真实的保险箱列表，显示类别计数与临时账户记录' }, caption: { en: 'List keeps category, relationship count, edit, and delete controls attached to the exact record.', zh: '列表把类别、关系数量、编辑与删除控件都放在对应记录旁。' } },
				{ src: 'assets/images/vault/vault-edit-node-live.png', layout: 'portrait', label: { en: 'Editing a non-account record', zh: '编辑非账户记录' }, alt: { en: 'Real Edit non-account dialog showing the name field with its type icon, the backups section, and Delete, Cancel, and Save', zh: '真实的「编辑非账户」对话框，显示带类型图标的名称字段、备份区域，以及删除、取消与保存' }, caption: { en: 'An email or phone opens its own editor rather than the account form: a name, the type icon, and the records that back it up. Delete sits apart from Cancel and Save so it is never the accidental click.', zh: '邮箱或电话会打开专属编辑器，而不是账户表单：包含名称、类型图标，以及为其提供备份的记录。「删除」与「取消」「保存」分开摆放，避免误触。' } },
				{ src: 'assets/images/vault/vault-edit-category-live.png', layout: 'portrait', label: { en: 'Renaming a custom category', zh: '重命名自定义类别' }, alt: { en: 'Real Edit category dialog showing the category name field, an icon control, and Delete, Cancel, and Save', zh: '真实的「编辑类别」对话框，显示类别名称字段、图标控件，以及删除、取消与保存' }, caption: { en: 'Only categories you created can be edited — the built-in ones and Uncategorized have no editor. Deleting one releases the accounts filed under it rather than removing them.', zh: '只有你自己创建的类别可以编辑 —— 内置类别与「未分类」没有编辑器。删除某个类别只会释放归入其中的账户，而不会删除这些账户。' } },
				{ src: 'assets/images/vault/vault-empty-live.png', layout: 'wide', label: { en: 'An empty vault', zh: '空的保险箱' }, alt: { en: 'Real Vault list view on a new account, showing the empty-state card and its Add button', zh: '真实的保险箱列表视图，新账户下显示空状态卡片及其添加按钮' }, caption: { en: 'A new vault opens on this card rather than a blank canvas: the hub mark, what the page is for, and the Add control that creates the first record.', zh: '新建的保险箱打开时显示这张卡片而非空白画布：中心图标、页面用途说明，以及用于创建第一条记录的添加控件。' } }
			]
		},
		copy: {
			en: {
				navigation: 'Vault', family: 'Account relationship map', summary: 'Protect account identifiers behind a passphrase, then manage them as a graph or an editable list.',
				hero: {
					eyebrow: 'Vault · account relationship map', title: 'See how accounts, identifiers, and backups connect.',
					summary: 'Vault is a protected map for accounts, email addresses, phone numbers, links, and notes. The graph reveals relationships; the list owns detailed editing and category work.',
					primaryAction: 'Unlock the Vault', secondaryAction: 'See the map-and-list loop',
					facts: [
						{ value: '2', label: 'graph and list views' },
						{ value: '5', label: 'preset category families' },
						{ value: '1 hop', label: 'selection trace depth' }
					],
					scene: { type: 'graph', label: 'Vault map', title: 'Relationships, not folders', badge: 'Protected', items: [
						{ title: 'Accounts', body: 'Segmented tiles', value: '4' },
						{ title: 'Email', body: 'Circular identifier', value: '2' },
						{ title: 'Phone', body: 'Diamond identifier', value: '1' },
						{ title: 'Backup', body: 'Dashed connection', value: '3' }
					] }
				},
				journey: ['Unlock', 'Choose a view', 'Add an identifier', 'Trace or edit', 'Lock by cadence'],
				sections: [
					{
						id: 'access', nav: 'Unlock and choose a view', kicker: 'Protected entry', title: 'Passphrase access comes before the map.',
						summary: 'The first visit creates a Vault passphrase. Later visits respect the cadence selected on Account: always ask, wait for a chosen window, or remain unlocked until reload.',
						points: [
							{ title: 'First visit', body: 'Create and confirm a per-user Vault passphrase.' },
							{ title: 'Returning visit', body: 'Verify the passphrase unless the active cadence still grants access.' },
							{ title: 'Choose Graph or List', body: 'Desktop can use both; narrow screens direct graph work to the List view.' }
						],
						note: { title: 'The passphrase protects access, not the data itself', body: 'Removing a forgotten passphrase from Account keeps every Vault record.', tone: 'red' },
						scene: { type: 'split', label: 'Protected workspace', title: 'Passphrase to view', badge: 'Cadence', items: [
							{ title: 'Graph', body: 'Trace relationships', value: 'Map' },
							{ title: 'List', body: 'Edit precise values', value: 'Edit' }
						] }
					},
					{
						id: 'add', nav: 'Add accounts and identifiers', kicker: 'Two-step creation', title: 'Choose what the new node represents before filling it in.',
						summary: 'The Add dialog starts with Account or a standalone identifier. Accounts can hold several categories and connections; email, phone, and notes identifiers link to another node as a backup.',
						points: [
							{ title: 'Account', body: 'Add a name, multiple categories, verification state, and connections.' },
							{ title: 'Identifier', body: 'Add email, phone, or notes as a standalone node.' },
							{ title: 'Duplicate guard', body: 'Account names are checked before the record is accepted.' }
						],
						note: { title: 'Categories can overlap', body: 'An account with several categories appears as a segmented graph tile.', tone: 'blue' },
						scene: { type: 'workflow', label: 'Add-node wizard', title: 'Type, details, connections', badge: '2 steps', items: [
							{ title: 'Choose type', body: 'Account or identifier', value: '01' },
							{ title: 'Fill details', body: 'Name and categories', value: '02' },
							{ title: 'Connect', body: 'Link related nodes', value: '03' }
						] }
					},
					{
						id: 'graph', nav: 'Trace the graph', kicker: 'Relationship view', title: 'Select one node to quiet the rest of the map.',
						summary: 'Selecting a node highlights its first-degree links and dims unrelated nodes. The legend filters by node type or Verified, categories filter the map, and search softens non-matches.',
						points: [
							{ title: 'Trace direct links', body: 'Selection shows the relationships immediately connected to one node.' },
							{ title: 'Filter from the legend', body: 'Account, email, phone, and Verified work as toggle filters.' },
							{ title: 'Link mode', body: 'Choose an account source, then select the target node to connect.' }
						],
						note: { title: 'Graph actions stay focused', body: 'Accounts only link from the map; detailed account editing belongs to List view.', tone: 'violet' },
						scene: { type: 'graph', label: 'Selection trace', title: 'Direct links remain bright', badge: '1 hop', items: [
							{ title: 'Selected', body: 'Primary account', value: 'A' },
							{ title: 'Direct', body: 'Email and phone', value: '1' },
							{ title: 'Unrelated', body: 'Dimmed context', value: 'None' }
						] }
					},
					{
						id: 'list', nav: 'Edit in the list', kicker: 'Detailed management', title: 'Use the list when the value itself must change.',
						summary: 'List cards own inline account names, verification, multi-category assignment, note creation, connection removal, and account deletion. Non-account names open a dedicated edit dialog.',
						points: [
							{ title: 'Edit and Done', body: 'Toggle a card into editing before changing its name, categories, or notes.' },
							{ title: 'Free-form notes', body: 'Notes remain connected to the account but stay off the graph.' },
							{ title: 'Protected removal', body: 'Delete and category removal ask for confirmation and clean dependent connections.' }
						],
						note: { title: 'Verified is both status and filter', body: 'The badge marks an account and the overview chip can isolate every verified account.', tone: 'green' },
						scene: { type: 'cards', label: 'List card anatomy', title: 'Identity, categories, connections', badge: 'Editable', items: [
							{ title: 'Name', body: 'Inline edit', value: 'Edit' },
							{ title: 'Categories', body: 'Multi-select', value: '3' },
							{ title: 'Connections', body: 'Removable chips', value: '5' },
							{ title: 'Notes', body: 'List-only context', value: '+' }
						] }
					}
				],
				rules: [
					{ title: 'Passphrase cadence', body: 'Account controls how soon Vault asks again.' },
					{ title: 'Graph on desktop', body: 'Narrow screens use List view for readable management.' },
					{ title: 'Direct trace', body: 'Selection highlights first-degree links only.' },
					{ title: 'Notes stay off-map', body: 'Free-form notes are preserved in List view without graph clutter.' }
				],
				footer: { eyebrow: 'End of Vault · Page 05', title: 'Protect the entrance. Map the relationship. Edit at the right level.', body: 'Use Graph for understanding and List for precise changes.' }
			},
			zh: {
				navigation: '保险', family: '账户关系图', summary: '用口令保护账户标识，再通过关系图或可编辑列表进行管理。',
				hero: {
					eyebrow: '保险箱 · 账户关系图', title: '看清账户、标识和备份之间如何连接。',
					summary: '「保险箱」是一张受保护的账户、邮箱、电话、链接和备注关系图。图谱用于理解关系，列表负责细致编辑和类别管理。',
					primaryAction: '解锁保险箱', secondaryAction: '查看图谱与列表流程',
					facts: [
						{ value: '2', label: '种图谱与列表视图' },
						{ value: '5', label: '个预设类别家族' },
						{ value: '1 跳', label: '选择追踪深度' }
					],
					scene: { type: 'graph', label: '保险箱地图', title: '关系，而不是文件夹', badge: '受保护', items: [
						{ title: '账户', body: '分段方块', value: '4' },
						{ title: '邮箱', body: '圆形标识', value: '2' },
						{ title: '电话', body: '菱形标识', value: '1' },
						{ title: '备份', body: '虚线连接', value: '3' }
					] }
				},
				journey: ['解锁', '选择视图', '添加标识', '追踪或编辑', '按节奏重新锁定'],
				sections: [
					{
						id: 'access', nav: '解锁并选择视图', kicker: '受保护入口', title: '进入图谱之前先通过口令。',
						summary: '首次访问会创建保险箱口令。后续访问遵循「账户」中的节奏设置：始终询问、等待指定窗口，或在重新载入前保持解锁。',
						points: [
							{ title: '首次访问', body: '创建并确认当前用户的保险箱口令。' },
							{ title: '再次访问', body: '除非当前节奏仍允许访问，否则需要验证口令。' },
							{ title: '选择图谱或列表', body: '桌面可使用两者；窄屏会把图谱操作引导到列表。' }
						],
						note: { title: '口令保护访问，不删除数据', body: '从「账户」移除忘记的口令时，所有保险箱记录都会保留。', tone: 'red' },
						scene: { type: 'split', label: '受保护工作区', title: '从口令到视图', badge: '节奏', items: [
							{ title: '图谱', body: '追踪关系', value: '地图' },
							{ title: '列表', body: '精确编辑', value: '编辑' }
						] }
					},
					{
						id: 'add', nav: '添加账户与标识', kicker: '两步创建', title: '先选择新节点代表什么，再填写内容。',
						summary: '添加对话框先选择账户或独立标识。账户可以拥有多个类别和连接；邮箱、电话和备注标识会作为备份连接到另一个节点。',
						points: [
							{ title: '账户', body: '添加名称、多个类别、验证状态和连接。' },
							{ title: '标识', body: '把邮箱、电话或备注添加为独立节点。' },
							{ title: '重复保护', body: '接受记录前会检查账户名称。' }
						],
						note: { title: '类别可以重叠', body: '拥有多个类别的账户在图谱中显示为分段方块。', tone: 'blue' },
						scene: { type: 'workflow', label: '添加节点向导', title: '类型、详情、连接', badge: '2 步', items: [
							{ title: '选择类型', body: '账户或标识', value: '01' },
							{ title: '填写详情', body: '名称与类别', value: '02' },
							{ title: '建立连接', body: '连接相关节点', value: '03' }
						] }
					},
					{
						id: 'graph', nav: '追踪关系图', kicker: '关系视图', title: '选择一个节点，让地图其余部分安静下来。',
						summary: '选择节点会高亮一度连接，并淡化无关节点。图例按节点类型或已验证筛选，类别过滤地图，搜索则弱化不匹配项。',
						points: [
							{ title: '追踪直接连接', body: '选择只显示与一个节点直接相连的关系。' },
							{ title: '从图例筛选', body: '账户、邮箱、电话和已验证都可切换筛选。' },
							{ title: '连接模式', body: '先选账户来源，再选择目标节点建立连接。' }
						],
						note: { title: '图谱操作保持专注', body: '账户在地图上只负责连接；详细编辑属于列表视图。', tone: 'violet' },
						scene: { type: 'graph', label: '选择追踪', title: '直接连接保持明亮', badge: '1 跳', items: [
							{ title: '已选择', body: '主账户', value: 'A' },
							{ title: '直接连接', body: '邮箱与电话', value: '1' },
							{ title: '无关节点', body: '淡化背景', value: '无' }
						] }
					},
					{
						id: 'list', nav: '在列表编辑', kicker: '详细管理', title: '需要改变具体值时，使用列表。',
						summary: '列表卡片负责账户名称、验证、多类别分配、备注创建、连接移除和账户删除。非账户名称会打开专用编辑对话框。',
						points: [
							{ title: '编辑与完成', body: '先把卡片切换到编辑状态，再修改名称、类别或备注。' },
							{ title: '自由备注', body: '备注保持与账户连接，但不会出现在图谱上。' },
							{ title: '受保护删除', body: '删除节点和类别前会确认，并清理依赖连接。' }
						],
						note: { title: '已验证既是状态也是筛选', body: '徽章标记账户，总览胶囊也能隔离所有已验证账户。', tone: 'green' },
						scene: { type: 'cards', label: '列表卡片结构', title: '身份、类别、连接', badge: '可编辑', items: [
							{ title: '名称', body: '行内编辑', value: '编辑' },
							{ title: '类别', body: '多选', value: '3' },
							{ title: '连接', body: '可移除胶囊', value: '5' },
							{ title: '备注', body: '仅列表上下文', value: '+' }
						] }
					}
				],
				rules: [
					{ title: '口令节奏', body: '「账户」控制保险箱何时再次询问口令。' },
					{ title: '桌面图谱', body: '窄屏使用列表进行清楚管理。' },
					{ title: '直接追踪', body: '选择只高亮一度连接。' },
					{ title: '备注不进图', body: '自由备注保留在列表，不给图谱增加杂讯。' }
				],
				footer: { eyebrow: '保险箱结束 · 页面 05', title: '保护入口，理解关系，在正确层级编辑。', body: '用图谱理解，用列表精确改变。' }
			}
		}
	},
	{
		id: 'entertainment', order: '06', icon: 'icon-film', accent: '74, 222, 128', generated: true,
		captures: {
			browse: [
				{ src: 'assets/images/entertainment/library-live.jpg', layout: 'wide', label: { en: 'Loaded movie library', zh: '已载入电影库' }, alt: { en: 'Real Entertainment page with movie cards and genre filters', zh: '真实的娱乐页面，显示电影卡片和类型筛选' }, caption: { en: 'The live collection exposes filters, counts, and poster cards on one surface.', zh: '真实片库在同一界面展示筛选、数量和海报卡片。' } },
				{ src: 'assets/images/entertainment/favourites-filter-live.jpg', layout: 'wide', label: { en: 'Favourites filter selected', zh: '已选择收藏筛选' }, alt: { en: 'Real Entertainment page with the Favourites filter selected and matching movie cards visible', zh: '真实的娱乐页面，已选择收藏筛选并显示匹配的电影卡片' }, caption: { en: 'The selected filter remains highlighted while the matching library cards stay in context.', zh: '所选筛选保持高亮，匹配的片库卡片继续显示在上下文中。' } },
				{ src: 'assets/images/entertainment/zero-result-live.jpg', layout: 'wide', label: { en: 'A selected filter can return zero cards', zh: '所选筛选可能返回零张卡片' }, alt: { en: 'Real Entertainment page with Favourites selected, a zero count, and no movie cards', zh: '真实的娱乐页面，已选择收藏，数量为零且没有电影卡片' }, caption: { en: 'The highlighted Favourites card and its zero count explain the empty poster area; choose another genre or clear the search to recover.', zh: '高亮的「收藏」卡及其零计数解释了空白海报区；选择其他类型或清除搜索即可恢复。' } },
				{ src: 'assets/images/entertainment/loading-library-live.jpg', layout: 'wide', label: { en: 'Library loading state', zh: '片库载入状态' }, alt: { en: 'Real Entertainment page while the movie collection loads', zh: '真实的娱乐页面，电影集合正在载入' }, caption: { en: 'The initial state communicates that the collection is still arriving.', zh: '初始状态明确说明片库仍在载入。' } }
			],
			add: [
				{ src: 'assets/images/entertainment/add-movie-dialog-live.jpg', layout: 'wide', label: { en: 'Movie lookup dialog', zh: '电影查找对话框' }, alt: { en: 'Real Entertainment Add Movie dialog', zh: '真实的娱乐页面添加电影对话框' }, caption: { en: 'Lookup begins in a focused dialog before any film is added.', zh: '添加任何电影前，先在聚焦对话框中查找。' } },
				{ src: 'assets/images/entertainment/add-required-fields-live.jpg', layout: 'portrait', label: { en: 'Required fields gate the lookup', zh: '必填字段限制查找' }, alt: { en: 'Real Add Movie dialog with empty fields and both Search and Submit greyed out', zh: '真实的添加电影对话框，字段为空且查找与提交按钮均为灰色' }, caption: { en: 'The dialog prevents an invalid submission rather than reporting one: Search and Submit stay disabled until the form is valid, which is why a genre must be chosen before either responds.', zh: '该对话框以阻止无效提交代替事后报错：表单有效前，查找与提交始终禁用，因此必须先选择类型，两个按钮才会响应。' } }
			],
			manage: [
				{ src: 'assets/images/entertainment/library-live.jpg', layout: 'wide', label: { en: 'Card-level controls', zh: '卡片级控件' }, alt: { en: 'Real movie cards with their available actions', zh: '真实电影卡片及其可用操作' }, caption: { en: 'Lightweight management stays attached to the item it affects.', zh: '轻量管理操作紧贴受影响的电影卡片。' } },
				{ src: 'assets/images/home/home-entertainment-populated.png', layout: 'wide', label: { en: 'The library reaches Home', zh: '片库结果抵达主页' }, alt: { en: 'Real Home Entertainment panel showing the film total and its top genre bars', zh: '真实的主页娱乐面板，显示影片总数与主要类型分布条' }, caption: { en: 'Card-level changes are not local: the film total and genre distribution reappear on the Home dashboard.', zh: '卡片级的改动并非局部：影片总数与类型分布会重新出现在主页仪表盘上。' } },
				{ src: 'assets/images/entertainment/delete-confirm-live.jpg', layout: 'portrait', label: { en: 'Removing a film asks first', zh: '删除影片前先确认' }, alt: { en: 'Real Delete Movie confirmation naming the film, with Cancel and Delete', zh: '真实的删除电影确认框，写明影片名称，并提供取消与删除' }, caption: { en: 'The confirmation names the exact film before anything is removed, and Cancel is the default way out. This capture was dismissed, not accepted.', zh: '确认框在删除前写明具体影片，取消是默认的退出方式。本次拍摄已取消，未执行删除。' } }
			],
			refresh: [
				{ src: 'assets/images/entertainment/refresh-progress-live.png', scenario: 0, layout: 'portrait', label: { en: 'Refresh stays cancellable', zh: '刷新过程可随时停止' }, alt: { en: 'Real Entertainment refresh progress dialog with Stop control', zh: '真实的娱乐页面刷新进度对话框，显示停止控件' }, caption: { en: 'The blocking progress dialog prevents duplicate refreshes and keeps Stop available while ratings are checked.', zh: '阻塞式进度对话框会防止重复刷新，并在检查评分时保留「停止」操作。' } },
				{ src: 'assets/images/entertainment/history-dialog-live.jpg', scenario: 1, layout: 'wide', label: { en: 'Update history', zh: '更新历史' }, alt: { en: 'Real Entertainment history dialog', zh: '真实的娱乐页面历史对话框' }, caption: { en: 'The history surface explains library maintenance without changing the collection.', zh: '历史界面说明片库维护情况，而不会改变集合。' } }
			]
		},
		copy: {
			en: {
				navigation: 'Entertainment', family: 'Films and series', summary: 'Search, add, filter, rate, favorite, edit, and remove films or television series with rich metadata.',
				hero: {
					eyebrow: 'Entertainment · films and series', title: 'Keep the watchlist visual without losing the metadata.',
					summary: 'Entertainment combines a corkboard-like genre index with poster cards. Search the existing library, look up a new title, review its metadata, and keep favorite or history signals close to the card.',
					primaryAction: 'Browse the watchlist', secondaryAction: 'See the library loop',
					facts: [
						{ value: '4', label: 'rating colour bands' },
						{ value: '3', label: 'search, add, and history actions' },
						{ value: '2', label: 'metadata retrieval paths' }
					],
					scene: { type: 'cards', label: 'Poster library', title: 'Genre, rating, detail', badge: 'Visual', items: [
						{ title: 'Arrival', body: 'Drama · 8.4', value: '8.4' },
						{ title: 'Spirited Away', body: 'Animation · 9.1', value: '9.1' },
						{ title: 'The Bear', body: 'Series · 8.7', value: '8.7' },
						{ title: 'No rating', body: 'Stored consistently', value: 'None' }
					] }
				},
				journey: ['Filter', 'Search', 'Add', 'Review metadata', 'Favorite or edit'],
				sections: [
					{
						id: 'browse', nav: 'Browse and filter', kicker: 'Genre corkboard', title: 'Start with the genre that matches your mood.',
						summary: 'Genre cards show live counts and act as the visible filter. Text search narrows titles inside the selected genre, while the poster grid keeps rating and release context on every item.',
						points: [
							{ title: 'Genre cards', body: 'Select one corkboard card to filter the poster grid.' },
							{ title: 'Title search', body: 'Use the desktop search field to narrow existing items.' },
							{ title: 'Card hover', body: 'Swap metadata for synopsis and cast without opening another view.' }
						],
						note: { title: 'The selected genre is visible', body: 'Rotation and colour settle when a genre becomes the active working context.', tone: 'green' },
						scene: { type: 'cards', label: 'Genre filter', title: 'Counts become navigation', badge: 'Corkboard', items: [
							{ title: 'Drama', body: 'Selected', value: '14' },
							{ title: 'Comedy', body: 'Available', value: '8' },
							{ title: 'Animation', body: 'Available', value: '6' }
						] }
					},
					{
						id: 'add', nav: 'Look up and add', kicker: 'Metadata search', title: 'Let lookup do the repetitive typing.',
						summary: 'Add opens a metadata form for title or provider identifier. The lookup fills genre, cast, release date, rating, and cover image; a scrape fallback repairs missing rating or first-release data.',
						points: [
							{ title: 'Search by title and year', body: 'Use a human-friendly query when the provider identifier is unknown.' },
							{ title: 'Search by identifier', body: 'Use the direct route when the source item is already known.' },
							{ title: 'Review before save', body: 'Confirm the returned details before adding the item to the library.' }
						],
						note: { title: 'Missing ratings stay neutral', body: 'A title with no rating from either source stores one consistent no-rating state.', tone: 'blue' },
						scene: { type: 'workflow', label: 'Metadata path', title: 'Query, enrich, save', badge: 'Fallback', items: [
							{ title: 'Query', body: 'Title, year, or ID', value: '01' },
							{ title: 'Enrich', body: 'API plus scrape fallback', value: '02' },
							{ title: 'Save', body: 'Image and metadata', value: '03' }
						] }
					},
					{
						id: 'manage', nav: 'Edit and favorite', kicker: 'Card actions', title: 'Keep lightweight changes on the poster card.',
						summary: 'Edit changes the genre in place. The star toggles favorite state, the source button opens the external record, and Delete asks for confirmation before removing the item.',
						points: [
							{ title: 'Edit genre', body: 'Switch the category with the compact dropdown, then confirm.' },
							{ title: 'Favorite', body: 'Toggle the star without leaving the current filter.' },
							{ title: 'Delete', body: 'Removal is permission-checked, confirmed, and added to history.' }
						],
						note: { title: 'Permissions follow ownership', body: 'Only the owner or an authorized administrator can change or remove an item.', tone: 'red' },
						scene: { type: 'cards', label: 'Poster actions', title: 'Source, edit, favorite, delete', badge: 'Inline', items: [
							{ title: 'Source', body: 'Open external record', value: 'Open' },
							{ title: 'Genre', body: 'Edit in place', value: 'Edit' },
							{ title: 'Favorite', body: 'Personal signal', value: 'Star' },
							{ title: 'Delete', body: 'Confirmed removal', value: 'Ask' }
						] }
					},
					{
						id: 'refresh', nav: 'Refresh and review history', kicker: 'Library maintenance', title: 'Repair metadata deliberately, then read what changed.',
						summary: 'The refresh action updates ratings and missing data through a progress dialog. History records additions and deletions with timestamps so library changes remain explainable.',
						points: [
							{ title: 'Refresh', body: 'Runs the metadata update path across the current library.' },
							{ title: 'Progress and cancel', body: 'The search dialog reports work and supports a controlled stop.' },
							{ title: 'History', body: 'Review added and removed titles with their recorded times.' }
						],
						note: { title: 'Refresh is not ordinary browsing', body: 'Use it when metadata is missing or stale, not every time the page opens.', tone: 'amber' },
						scene: { type: 'timeline', label: 'Maintenance history', title: 'Lookup changes remain traceable', badge: 'Timestamped', items: [
							{ title: 'Added', body: 'Arrival', value: '10:12' },
							{ title: 'Refreshed', body: 'Ratings updated', value: '10:18' },
							{ title: 'Removed', body: 'Duplicate title', value: '11:03' }
						] }
					}
				],
				rules: [
					{ title: 'Genre is the filter', body: 'The corkboard selection controls the visible poster grid.' },
					{ title: 'Rating bands', body: 'Four colour ranges make strong and weak scores readable at a glance.' },
					{ title: 'Scrape fallback', body: 'Missing provider rating or release data can be backfilled.' },
					{ title: 'History', body: 'Additions and deletions remain timestamped.' }
				],
				footer: { eyebrow: 'End of Entertainment · Page 06', title: 'Browse visually. Enrich carefully. Keep changes traceable.', body: 'The poster grid stays light because metadata work happens through focused actions.' }
			},
			zh: {
				navigation: '影视', family: '电影与剧集', summary: '用丰富元数据搜索、添加、筛选、评分、收藏、编辑和删除电影或剧集。',
				hero: {
					eyebrow: '影视 · 电影与剧集', title: '让片单保持视觉感，同时不丢失元数据。',
					summary: '「影视」把软木板式类型索引和海报卡片结合起来。搜索现有片库、查找新标题、检查元数据，并把收藏和历史信号留在卡片附近。',
					primaryAction: '浏览片单', secondaryAction: '查看片库流程',
					facts: [
						{ value: '4', label: '个评分颜色区间' },
						{ value: '3', label: '项搜索、添加与历史操作' },
						{ value: '2', label: '条元数据获取路径' }
					],
					scene: { type: 'cards', label: '海报片库', title: '类型、评分、详情', badge: '视觉化', items: [
						{ title: '降临', body: '剧情 · 8.4', value: '8.4' },
						{ title: '千与千寻', body: '动画 · 9.1', value: '9.1' },
						{ title: '熊家餐馆', body: '剧集 · 8.7', value: '8.7' },
						{ title: '暂无评分', body: '一致保存', value: '无' }
					] }
				},
				journey: ['筛选', '搜索', '添加', '检查元数据', '收藏或编辑'],
				sections: [
					{
						id: 'browse', nav: '浏览与筛选', kicker: '类型软木板', title: '从符合当下心情的类型开始。',
						summary: '类型卡显示实时数量，也就是可见筛选器。文字搜索会在所选类型内缩小标题，海报网格则为每项保留评分和上映背景。',
						points: [
							{ title: '类型卡', body: '选择一张软木板卡片来筛选海报网格。' },
							{ title: '标题搜索', body: '使用桌面搜索框缩小现有项目。' },
							{ title: '卡片悬停', body: '无需打开新视图即可切换到简介和演员信息。' }
						],
						note: { title: '所选类型清楚可见', body: '类型成为当前上下文时，旋转和颜色会稳定下来。', tone: 'green' },
						scene: { type: 'cards', label: '类型筛选', title: '数量变成导航', badge: '软木板', items: [
							{ title: '剧情', body: '已选择', value: '14' },
							{ title: '喜剧', body: '可选择', value: '8' },
							{ title: '动画', body: '可选择', value: '6' }
						] }
					},
					{
						id: 'add', nav: '查找并添加', kicker: '元数据搜索', title: '让查找完成重复输入。',
						summary: '添加会打开标题或提供方标识表单。查找会填入类型、演员、首映日期、评分和封面；抓取后备会修补缺少的评分或首映数据。',
						points: [
							{ title: '按标题和年份搜索', body: '不知道提供方标识时，使用自然查询。' },
							{ title: '按标识搜索', body: '已经知道来源项目时，使用直接路径。' },
							{ title: '保存前检查', body: '加入片库前确认返回的详情。' }
						],
						note: { title: '缺少评分保持中性', body: '两个来源都没有评分时，会保存为一致的无评分状态。', tone: 'blue' },
						scene: { type: 'workflow', label: '元数据路径', title: '查询、丰富、保存', badge: '后备', items: [
							{ title: '查询', body: '标题、年份或标识', value: '01' },
							{ title: '丰富', body: 'API 加抓取后备', value: '02' },
							{ title: '保存', body: '图片和元数据', value: '03' }
						] }
					},
					{
						id: 'manage', nav: '编辑与收藏', kicker: '卡片操作', title: '把轻量变化留在海报卡片上。',
						summary: '编辑会原地更改类型。星标切换收藏，来源按钮打开外部记录，删除则在移除项目前要求确认。',
						points: [
							{ title: '编辑类型', body: '用紧凑下拉框切换类别，再确认。' },
							{ title: '收藏', body: '无需离开当前筛选即可切换星标。' },
							{ title: '删除', body: '移除会检查权限、要求确认并写入历史。' }
						],
						note: { title: '权限遵循所有权', body: '只有所有者或授权管理员可以改变或删除项目。', tone: 'red' },
						scene: { type: 'cards', label: '海报操作', title: '来源、编辑、收藏、删除', badge: '行内', items: [
							{ title: '来源', body: '打开外部记录', value: '打开' },
							{ title: '类型', body: '原地编辑', value: '编辑' },
							{ title: '收藏', body: '个人信号', value: '星标' },
							{ title: '删除', body: '确认移除', value: '询问' }
						] }
					},
					{
						id: 'refresh', nav: '刷新与查看历史', kicker: '片库维护', title: '有意修复元数据，再阅读发生了什么。',
						summary: '刷新操作通过进度对话框更新评分和缺失数据。历史以时间戳记录添加与删除，让片库变化保持可解释。',
						points: [
							{ title: '刷新', body: '对当前片库运行元数据更新路径。' },
							{ title: '进度与取消', body: '搜索对话框报告工作，也支持受控停止。' },
							{ title: '历史', body: '查看添加和删除的标题及记录时间。' }
						],
						note: { title: '刷新不是普通浏览', body: '只有元数据缺失或陈旧时才使用，不必每次打开页面都运行。', tone: 'amber' },
						scene: { type: 'timeline', label: '维护历史', title: '查找变化仍可追踪', badge: '带时间戳', items: [
							{ title: '已添加', body: '降临', value: '10:12' },
							{ title: '已刷新', body: '评分已更新', value: '10:18' },
							{ title: '已删除', body: '重复标题', value: '11:03' }
						] }
					}
				],
				rules: [
					{ title: '类型就是筛选', body: '软木板选择控制可见海报网格。' },
					{ title: '评分区间', body: '四个颜色范围让高低评分一眼可见。' },
					{ title: '抓取后备', body: '缺失的提供方评分或上映数据可以补齐。' },
					{ title: '历史', body: '添加和删除始终保留时间戳。' }
				],
				footer: { eyebrow: '影视结束 · 页面 06', title: '视觉浏览，仔细丰富，让变化可追踪。', body: '海报网格之所以轻盈，是因为元数据工作通过专注操作完成。' }
			}
		}
	},
	{
		id: 'recipe', order: '07', icon: 'icon-recipe', accent: '213, 51, 105', generated: true,
		captures: {
			browse: [
				{ src: 'assets/images/recipe/library-live.jpg', layout: 'wide', label: { en: 'Cookbook library', zh: '食谱库' }, alt: { en: 'Real Recipes page with the loaded cookbook', zh: '真实的食谱页面，显示已载入的食谱库' }, caption: { en: 'Category, search, and recipe cards form the real browsing surface.', zh: '类别、搜索和食谱卡片构成真实浏览界面。' } },
				{ src: 'assets/images/recipe/empty-search-live.jpg', layout: 'wide', label: { en: 'No search matches', zh: '搜索无匹配' }, alt: { en: 'Real Recipes page showing an empty search result', zh: '真实的食谱页面，显示空搜索结果' }, caption: { en: 'The empty result keeps the active query and recovery path visible.', zh: '空结果仍保留当前查询和返回路径。' } },
				{ src: 'assets/images/home/home-recipes-populated.png', layout: 'wide', label: { en: 'The cookbook reaches Home', zh: '食谱库抵达主页' }, alt: { en: 'Real Home Recipes panel listing recipe names with their localized categories', zh: '真实的主页食谱面板，列出食谱名称与对应的本地化类别' }, caption: { en: 'Saved recipes are not confined to this page: names and categories reappear in the Home Recipes panel.', zh: '已保存的食谱不局限于本页：名称与类别会重新出现在主页食谱面板中。' } }
			],
			cook: [
				{ src: 'assets/images/recipe/detail-live.jpg', layout: 'wide', label: { en: 'Recipe detail', zh: '食谱详情' }, alt: { en: 'Real recipe detail with ingredients and metadata', zh: '真实的食谱详情，显示食材和元数据' }, caption: { en: 'The detail view keeps the dish context beside the practical ingredient list.', zh: '详情页让菜品上下文与实用食材清单并列。' } },
				{ src: 'assets/images/recipe/steps-live.jpg', layout: 'wide', label: { en: 'Ordered cooking steps', zh: '有序烹饪步骤' }, alt: { en: 'Real recipe detail scrolled to its instruction steps', zh: '真实的食谱详情，已滚动到制作步骤' }, caption: { en: 'Instructions remain numbered and readable as a cooking sequence.', zh: '说明保持编号，并按烹饪顺序清楚可读。' } }
			],
			editor: [
				{ src: 'assets/images/recipe/editor-live.jpg', layout: 'wide', label: { en: 'Blank recipe editor', zh: '空白食谱编辑器' }, alt: { en: 'Real Add Recipe editor before any data is saved', zh: '真实的添加食谱编辑器，尚未保存任何数据' }, caption: { en: 'The editor exposes the complete structure while remaining safely unsaved.', zh: '编辑器完整展示结构，同时保持未保存的安全状态。' } },
				{ src: 'assets/images/recipe/delete-confirm-live.jpg', layout: 'portrait', label: { en: 'Deleting a recipe asks first', zh: '删除食谱前先确认' }, alt: { en: 'Real Delete Recipe confirmation stating the action cannot be undone', zh: '真实的删除食谱确认框，说明该操作无法撤销' }, caption: { en: 'Deletion is guarded by a confirmation that states plainly it cannot be undone. This capture was dismissed, not accepted.', zh: '删除由确认框守护，并明确说明操作无法撤销。本次拍摄已取消，未执行删除。' } },
				{ src: 'assets/images/recipe/permission-dialog-live.jpg', layout: 'wide', label: { en: 'Edit permission boundary', zh: '编辑权限边界' }, alt: { en: 'Real permission dialog shown when editing is unavailable', zh: '真实的权限对话框，显示当前不可编辑' }, caption: { en: 'The running app makes the account boundary explicit instead of pretending every user can edit.', zh: '运行中的应用明确展示账户权限边界，而不是假装所有用户都能编辑。' } }
			],
			reorder: [
				{ src: 'assets/images/recipe/reorder-live.jpg', layout: 'wide', label: { en: 'Instruction ordering controls', zh: '步骤排序控件' }, alt: { en: 'Real recipe editor showing instruction-step ordering controls', zh: '真实的食谱编辑器，显示制作步骤排序控件' }, caption: { en: 'Step controls sit with the instruction list before the recipe is saved.', zh: '保存食谱前，步骤控件与说明清单放在一起。' } }
			]
		},
		copy: {
			en: {
				navigation: 'Recipe', family: 'Personal cookbook', summary: 'Browse, scale, cook, add, and edit recipes with ingredient groups, automatic step pills, and drag-to-reorder instructions.',
				hero: {
					eyebrow: 'Recipe · personal cookbook', title: 'Move from a recipe card to a cookable sequence.',
					summary: 'Recipe separates discovery, cooking, and editing into three focused views. Category colour follows the dish, servings scale quantities live, and ingredient names remain visible inside the steps.',
					primaryAction: 'Browse the cookbook', secondaryAction: 'See the cooking loop',
					facts: [
						{ value: '3', label: 'list, detail, and editor views' },
						{ value: '7', label: 'ingredient type families' },
						{ value: 'Live', label: 'servings scaling' }
					],
					scene: { type: 'cards', label: 'Cookbook', title: 'Category bands and ingredient cues', badge: 'Bilingual', items: [
						{ title: 'Mapo tofu', body: 'Chinese · 35 min', value: '4' },
						{ title: 'Pasta verde', body: 'Western · 25 min', value: '2' },
						{ title: 'Miso soup', body: 'Japanese · 15 min', value: '3' },
						{ title: 'Add recipe', body: 'Open the editor', value: '+' }
					] }
				},
				journey: ['Find a dish', 'Open detail', 'Scale servings', 'Cook the steps', 'Edit the source'],
				sections: [
					{
						id: 'browse', nav: 'Browse the cookbook', kicker: 'List view', title: 'Filter by category, then search by name.',
						summary: 'Recipe cards combine category colour, ingredient-type badges, cooking time, and servings. The grid paginates according to its visible columns and collapses to a single-column rhythm on narrow screens.',
						points: [
							{ title: 'Search', body: 'Narrow the cookbook by recipe name.' },
							{ title: 'Category chips', body: 'Keep one cuisine or return to the complete list.' },
							{ title: 'Responsive pages', body: 'The number of cards per page follows the actual grid width.' }
						],
						note: { title: 'Colour carries context', body: 'The selected recipe band continues into detail and editor views.', tone: 'rose' },
						scene: { type: 'cards', label: 'Recipe list', title: 'Find by name or category', badge: 'Paged', items: [
							{ title: 'Chinese', body: 'Rose band', value: '8' },
							{ title: 'Western', body: 'Amber band', value: '6' },
							{ title: 'Japanese', body: 'Green band', value: '4' }
						] }
					},
					{
						id: 'cook', nav: 'Cook from detail', kicker: 'Detail view', title: 'Keep ingredients beside the ordered work.',
						summary: 'The detail view pairs a collapsible ingredient panel with numbered steps. Increase or decrease servings to scale quantities, select steps as they finish, and keep notes below the working area.',
						points: [
							{ title: 'Scale servings', body: 'Plus and minus update visible ingredient quantities from the base recipe.' },
							{ title: 'Ingredient groups', body: 'Vegetable, meat, seafood, dairy, grain, liquid, and spice keep roles visible.' },
							{ title: 'Finish steps', body: 'Select a step to mark it done without editing the recipe.' }
						],
						note: { title: 'Ingredient pills connect the panels', body: 'Names that appear in a step are highlighted automatically from the ingredient list.', tone: 'green' },
						scene: { type: 'split', label: 'Cooking layout', title: 'Ingredients beside steps', badge: 'Live scale', items: [
							{ title: 'Ingredients', body: 'Grouped and scaled', value: '4 servings' },
							{ title: 'Steps', body: 'Numbered and checkable', value: '6 steps' }
						] }
					},
					{
						id: 'editor', nav: 'Build the recipe', kicker: 'Add and edit', title: 'Give the dish structure before polishing the wording.',
						summary: 'The editor validates title, category, quantities, and units while keeping ingredients and steps side by side. Add or manage ingredient types, append subpoints, and keep notes with the source.',
						points: [
							{ title: 'Recipe identity', body: 'Set name, cook time, base servings, and category.' },
							{ title: 'Ingredient editor', body: 'Add name, quantity, unit, and type for every ingredient.' },
							{ title: 'Step editor', body: 'Add instructions and optional subpoints in a clear order.' }
						],
						note: { title: 'Validation stays near the source', body: 'A missing category or ingredient unit is shown before the save is attempted.', tone: 'red' },
						scene: { type: 'form', label: 'Recipe editor', title: 'Identity + ingredients + steps', badge: 'Validated', items: [
							{ title: 'Title', body: 'Required and length-limited', value: 'Required' },
							{ title: 'Ingredients', body: 'Quantity needs a unit', value: 'Typed' },
							{ title: 'Category', body: 'Drives the band', value: 'Choose' }
						] }
					},
					{
						id: 'reorder', nav: 'Reorder and save', kicker: 'Instruction flow', title: 'Drag steps until the sequence matches the kitchen.',
						summary: 'The drag handle moves a step above or below another without changing its text. Save creates or updates the recipe; Delete is available in edit mode when the cookbook contains more than the protected example.',
						points: [
							{ title: 'Drag by the handle', body: 'Drop above or below the highlighted step target.' },
							{ title: 'Automatic pills', body: 'Saving tokenizes matching ingredient names inside step text.' },
							{ title: 'Protected example', body: 'The final example recipe is not casually removed from an otherwise empty cookbook.' }
						],
						note: { title: 'Save returns to detail', body: 'After persistence, the updated recipe becomes the selected detail view.', tone: 'blue' },
						scene: { type: 'timeline', label: 'Step order', title: 'Drag, place, save', badge: 'Reorder', items: [
							{ title: 'Prepare', body: 'Cut and measure', value: '01' },
							{ title: 'Cook', body: 'Heat and combine', value: '02' },
							{ title: 'Finish', body: 'Season and serve', value: '03' }
						] }
					}
				],
				rules: [
					{ title: 'Three views', body: 'List discovers, Detail cooks, Editor changes the source.' },
					{ title: 'Base servings', body: 'Visible quantities scale from the stored base amount.' },
					{ title: 'Ingredient pills', body: 'Matching ingredient names are highlighted inside steps.' },
					{ title: 'Grid-aware pagination', body: 'Page size follows the number of visible columns.' }
				],
				footer: { eyebrow: 'End of Recipe · Page 07', title: 'Find the dish. Scale the ingredients. Follow the sequence.', body: 'Editing keeps the source structured so cooking can stay calm.' }
			},
			zh: {
				navigation: '食谱', family: '个人食谱库', summary: '通过食材分组、自动步骤胶囊和拖动排序，浏览、缩放、烹饪、添加和编辑食谱。',
				hero: {
					eyebrow: '食谱 · 个人食谱库', title: '从一张食谱卡走向真正可执行的烹饪顺序。',
					summary: '「食谱」把发现、烹饪和编辑分成三个专注视图。类别颜色跟随菜品，份量会实时缩放，食材名称也会在步骤中保持可见。',
					primaryAction: '浏览食谱库', secondaryAction: '查看烹饪流程',
					facts: [
						{ value: '3', label: '种列表、详情和编辑视图' },
						{ value: '7', label: '个食材类型家族' },
						{ value: '实时', label: '份量缩放' }
					],
					scene: { type: 'cards', label: '食谱库', title: '类别色带与食材提示', badge: '双语', items: [
						{ title: '麻婆豆腐', body: '中餐 · 35 分钟', value: '4' },
						{ title: '绿色意面', body: '西餐 · 25 分钟', value: '2' },
						{ title: '味噌汤', body: '日餐 · 15 分钟', value: '3' },
						{ title: '添加食谱', body: '打开编辑器', value: '+' }
					] }
				},
				journey: ['找到菜品', '打开详情', '缩放份量', '执行步骤', '编辑来源'],
				sections: [
					{
						id: 'browse', nav: '浏览食谱库', kicker: '列表视图', title: '先按类别筛选，再按名称搜索。',
						summary: '食谱卡结合类别颜色、食材类型徽章、烹饪时间和份量。网格会按可见列数分页，并在窄屏折叠成单列节奏。',
						points: [
							{ title: '搜索', body: '按食谱名称缩小食谱库。' },
							{ title: '类别胶囊', body: '保留一种菜系或回到完整列表。' },
							{ title: '响应式分页', body: '每页卡片数量跟随实际网格宽度。' }
						],
						note: { title: '颜色携带上下文', body: '所选食谱的色带会延续到详情和编辑视图。', tone: 'rose' },
						scene: { type: 'cards', label: '食谱列表', title: '按名称或类别查找', badge: '分页', items: [
							{ title: '中餐', body: '玫红色带', value: '8' },
							{ title: '西餐', body: '琥珀色带', value: '6' },
							{ title: '日餐', body: '绿色色带', value: '4' }
						] }
					},
					{
						id: 'cook', nav: '从详情烹饪', kicker: '详情视图', title: '让食材始终待在有序步骤旁边。',
						summary: '详情视图把可折叠食材面板与编号步骤并排。增加或减少份量以缩放用量，完成步骤时勾选，并把备注留在工作区下方。',
						points: [
							{ title: '缩放份量', body: '加减控件根据基础食谱更新可见食材数量。' },
							{ title: '食材分组', body: '蔬菜、肉类、海鲜、乳制品、谷物、液体和香料保持角色清楚。' },
							{ title: '完成步骤', body: '选择步骤即可标记完成，不会编辑食谱。' }
						],
						note: { title: '食材胶囊连接两个面板', body: '步骤中出现的食材名称会根据食材表自动高亮。', tone: 'green' },
						scene: { type: 'split', label: '烹饪布局', title: '食材在步骤旁边', badge: '实时缩放', items: [
							{ title: '食材', body: '分组并缩放', value: '4 人份' },
							{ title: '步骤', body: '编号并可勾选', value: '6 步' }
						] }
					},
					{
						id: 'editor', nav: '构建食谱', kicker: '添加与编辑', title: '先给菜品结构，再润色文字。',
						summary: '编辑器验证标题、类别、数量和单位，同时把食材与步骤并排。可添加或管理食材类型、附加子步骤，并让备注跟随来源。',
						points: [
							{ title: '食谱身份', body: '设置名称、烹饪时间、基础份量和类别。' },
							{ title: '食材编辑器', body: '为每项食材添加名称、数量、单位和类型。' },
							{ title: '步骤编辑器', body: '按清楚顺序添加说明和可选子点。' }
						],
						note: { title: '验证靠近来源', body: '缺少类别或食材单位会在尝试保存前显示。', tone: 'red' },
						scene: { type: 'form', label: '食谱编辑器', title: '身份 + 食材 + 步骤', badge: '已验证', items: [
							{ title: '标题', body: '必填且限制长度', value: '必填' },
							{ title: '食材', body: '有数量就需要单位', value: '分类' },
							{ title: '类别', body: '驱动色带', value: '选择' }
						] }
					},
					{
						id: 'reorder', nav: '排序并保存', kicker: '说明流程', title: '拖动步骤，直到顺序符合厨房。',
						summary: '拖动把手可把步骤移到另一项上方或下方，不改变文字。保存会创建或更新食谱；在编辑模式且食谱库不只剩受保护示例时，可使用删除。',
						points: [
							{ title: '从把手拖动', body: '放到高亮目标步骤上方或下方。' },
							{ title: '自动胶囊', body: '保存时会把步骤中匹配的食材名称标记为胶囊。' },
							{ title: '受保护示例', body: '食谱库近乎空时，最后一份示例不会被随意删除。' }
						],
						note: { title: '保存后回到详情', body: '持久化完成后，更新后的食谱会成为当前详情。', tone: 'blue' },
						scene: { type: 'timeline', label: '步骤顺序', title: '拖动、放置、保存', badge: '排序', items: [
							{ title: '准备', body: '切配与称量', value: '01' },
							{ title: '烹饪', body: '加热与混合', value: '02' },
							{ title: '完成', body: '调味与装盘', value: '03' }
						] }
					}
				],
				rules: [
					{ title: '三种视图', body: '列表用于发现，详情用于烹饪，编辑器改变来源。' },
					{ title: '基础份量', body: '可见数量从保存的基础用量缩放。' },
					{ title: '食材胶囊', body: '匹配食材名称会在步骤中高亮。' },
					{ title: '网格感知分页', body: '页面大小跟随可见列数。' }
				],
				footer: { eyebrow: '食谱结束 · 页面 07', title: '找到菜品，缩放食材，依次完成。', body: '编辑保持来源结构化，让烹饪过程保持从容。' }
			}
		}
	},
	{
		id: 'resonance', order: '08', icon: 'icon-quote', accent: '245, 158, 11', generated: true,
		captures: {
			read: [
				{
					src: 'assets/images/resonance/wall-loading-live.jpg', scenario: 0, layout: 'wide',
					label: { en: 'Quote wall loading state', zh: '语录墙载入状态' },
					alt: { en: 'Focused real Resonance skeleton cards while the public quote subscription starts', zh: '真实语录页面在公开语录订阅启动时显示的聚焦骨架卡' },
					caption: { en: 'Skeleton cards mean the wall is still connecting; wait for cards or the empty invitation before deciding that no quotes exist.', zh: '骨架卡表示语录墙仍在连接；应等待语录卡或空状态提示出现，再判断是否没有内容。' },
					annotationLayout: 'margin',
					annotations: [
						{ text: { en: 'Loading is not an empty wall', zh: '载入中不等于语录墙为空' }, position: 'lower-left', tone: 'blue' }
					]
				},
				{
					src: 'assets/images/resonance/wall-live.jpg', scenario: 1, layout: 'wide',
					label: { en: 'Read one real quote card', zh: '阅读一张真实语录卡' },
					alt: { en: 'Focused real Resonance quote card with author and relative time', zh: '聚焦真实语录语录卡，显示作者与相对时间' },
					caption: { en: 'The crop keeps only the card anatomy needed for reading: voice count, identity, time, and quote.', zh: '裁切只保留阅读所需的卡片结构：声音数量、身份、时间与语录。' },
					annotationLayout: 'margin',
					annotations: [
						{ text: { en: 'Name + initial identify the voice', zh: '名字与首字母标记声音' }, position: 'lower-left', tone: 'rose' },
						{ text: { en: 'Time stays relative and readable', zh: '时间以相对方式保持易读' }, position: 'lower-right', tone: 'blue' }
					]
				},
				{ src: 'assets/images/resonance/moderation-control-live.jpg', scenario: 1, layout: 'wide', label: { en: 'The administrator delete control', zh: '管理员删除控件' }, alt: { en: 'Real quote card meta row showing author, date, and the administrator delete control', zh: '真实的语录卡片信息行，显示作者、日期与管理员删除控件' }, caption: { en: 'The control sits in the meta row beside the author and date, and only administrators ever render it. It stays hidden until the pointer is over the card, so a resting card looks identical for every reader.', zh: '该控件位于信息行中，与作者和日期并列，且只对管理员渲染。指针移到卡片上之前它始终隐藏，因此静止状态下每位读者看到的卡片完全相同。' } },
				{ src: 'assets/images/resonance/moderation-confirm-live.jpg', scenario: 1, layout: 'portrait', label: { en: 'Removing a quote asks first', zh: '删除语录前先确认' }, alt: { en: 'Real Delete Quote confirmation with Cancel and Delete', zh: '真实的删除语录确认框，提供取消与删除' }, caption: { en: 'An administrator removing a quote passes through this confirmation first; Cancel is the default way out. This capture was dismissed, not accepted.', zh: '管理员删除语录前会先经过此确认框，取消是默认的退出方式。本次拍摄已取消，未执行删除。' } }
			],
			post: [
				{
					src: 'assets/images/resonance/composer-ready-live.jpg', scenario: 0, layout: 'wide',
					label: { en: 'Signed-in composer', zh: '已登录编辑器' },
					alt: { en: 'Focused real Resonance composer for a signed-in account', zh: '聚焦真实语录编辑器，显示已登录账户状态' },
					caption: { en: 'A signed-in post uses the account identity automatically, so no visitor-name field appears.', zh: '已登录发布会自动使用账户身份，因此不会出现访客名字栏。' },
					annotationLayout: 'margin',
					annotations: [
						{ text: { en: 'Write first — identity comes from the session', zh: '先写内容——身份来自当前会话' }, position: 'lower-left', tone: 'rose' }
					]
				},
				{
					src: 'assets/images/resonance/visitor-ready-live.jpg', scenario: 1, layout: 'wide',
					label: { en: 'Visitor composer', zh: '访客编辑器' },
					alt: { en: 'Focused real Resonance visitor composer with an optional name', zh: '聚焦真实语录访客编辑器，显示选填名字' },
					caption: { en: 'A visitor can add a display name or leave it blank and be shown as Anonymous.', zh: '访客可以填写显示名字，也可以留空并显示为「匿名」。' },
					annotationLayout: 'margin',
					annotations: [
						{ text: { en: 'Optional name, maximum 50 characters', zh: '名字选填，最多 50 个字符' }, position: 'lower-right', tone: 'blue' }
					]
				},
				{
					src: 'assets/images/resonance/composer-ready-live.jpg', scenario: 2, presentation: 'side-by-side',
					label: { en: 'Enter and Shift+Enter', zh: 'Enter 与 Shift+Enter' },
					alt: { en: 'Focused real Resonance composer used to demonstrate keyboard submission and line breaks', zh: '聚焦真实语录编辑器，用于说明键盘发布与换行' },
					caption: { en: 'Enter follows the guarded Post path; Shift+Enter keeps the cursor in the textarea and inserts a new line.', zh: '按 Enter 会进入受保护的发布流程；按 Shift+Enter 会留在输入框并插入新行。' },
					annotationLayout: 'margin',
					annotations: [
						{ text: { en: 'Enter = Post · Shift+Enter = new line', zh: 'Enter＝发布 · Shift+Enter＝换行' }, position: 'lower-left', tone: 'rose' }
					]
				},
				{ src: 'assets/images/resonance/post-success-live.jpg', scenario: 2, layout: 'wide', label: { en: 'Confirmation after a quote posts', zh: '语录发布后的确认提示' }, alt: { en: 'Real Resonance submit footer showing the character count reset to zero, a Posted chip, and the Post button', zh: '真实的语录提交栏，显示字数已归零、「已发布」标签与「发布」按钮' }, caption: { en: 'The count returns to 0 / 500 and a Posted chip appears beside the button. The chip clears itself after a moment, so it confirms the write without leaving anything to dismiss.', zh: '字数回到 0 / 500，按钮旁出现「已发布」标签。该标签稍后自动消失，因此它在确认写入的同时不留下需要手动关闭的内容。' } }
			],
			feedback: [
				{
					src: 'assets/images/resonance/visitor-composer-live.jpg', scenario: 0, layout: 'wide',
					label: { en: 'Blank composer', zh: '空白编辑器' },
					alt: { en: 'Focused real Resonance visitor composer with Post disabled', zh: '聚焦真实语录访客编辑器，发布按钮不可用' },
					caption: { en: 'A blank draft has no separate error dialog: the zero count and disabled Post control are the feedback.', zh: '空白草稿不会弹出独立错误对话框：零计数与不可用的「发布」就是反馈。' },
					annotationLayout: 'margin',
					annotations: [
						{ text: { en: 'Blank text keeps Post unavailable', zh: '文字为空时无法发布' }, position: 'lower-right', tone: 'blue' }
					]
				},
				{
					src: 'assets/images/resonance/character-limit-focused-live.jpg', scenario: 1, layout: 'wide',
					label: { en: 'Character-limit feedback', zh: '字符上限反馈' },
					alt: { en: 'Focused real Resonance composer showing the 500-character validation message', zh: '聚焦真实语录编辑器，显示 500 字符校验信息' },
					caption: { en: 'At 501 characters the real inline warning appears and Post remains unavailable.', zh: '达到 501 个字符时，真实行内警告出现，并且「发布」保持不可用。' },
					annotationLayout: 'margin',
					annotations: [
						{ text: { en: 'Warning + count explain why Post is blocked', zh: '警告与计数说明为何无法发布' }, position: 'lower-left', tone: 'rose' }
					]
				},
				{
					src: 'assets/images/messages/connection-lost-live.png', scenario: 2, presentation: 'side-by-side',
					label: { en: 'Submission recovery boundary', zh: '发布恢复边界' },
					alt: { en: 'Real shared retry dialog used when a Resonance submission cannot safely continue', zh: '语录发布无法安全继续时使用的真实通用重试对话框' },
					caption: { en: 'A failed post never shows Posted. Restore the session or connection, close or retry the named dialog, then confirm the quote is absent before submitting again.', zh: '发布失败时不会显示「已发布」。先恢复会话或连接，关闭或重试对应对话框，再确认语录并未出现后重新提交。' },
					annotationLayout: 'margin',
					annotations: [
						{ text: { en: 'Recover first; check the wall before retrying', zh: '先恢复；重试前检查语录墙' }, position: 'lower-left', tone: 'red' }
					]
				}
			],
			moderate: [
				{
					src: 'assets/images/resonance/wall-live.jpg', scenario: 0, presentation: 'side-by-side',
					label: { en: 'Standard-reader card controls', zh: '普通读者的卡片控件' },
					alt: { en: 'Focused real Resonance card without an administrator delete control', zh: '聚焦真实语录卡；普通账户没有管理员删除控件' },
					caption: { en: 'Ordinary readers see the quote anatomy but no delete control. Only an administrator receives Delete Quote and its confirmation.', zh: '普通读者会看到语录卡结构，但看不到删除控件。只有管理员会看到「删除语录」及其确认框。' },
					annotationLayout: 'margin',
					annotations: [
						{ text: { en: 'No delete control = no moderation permission', zh: '没有删除控件＝没有管理权限' }, position: 'lower-left', tone: 'rose' }
					]
				},
				{
					src: 'assets/images/messages/connection-lost-live.png', scenario: 1, presentation: 'side-by-side',
					label: { en: 'Moderation failure recovery', zh: '管理失败恢复' },
					alt: { en: 'Real shared recovery dialog representing a failed protected Resonance removal', zh: '表示语录受保护删除失败的真实通用恢复对话框' },
					caption: { en: 'During Delete, the blocking layer prevents duplicates. If removal fails, dismiss the error, confirm the quote remains, then retry or cancel the still-open confirmation.', zh: '删除期间，阻塞层会防止重复请求。若删除失败，关闭错误，确认语录仍存在，再重试或取消仍打开的确认框。' },
					annotationLayout: 'margin',
					annotations: [
						{ text: { en: 'Failure is not deletion — verify the card', zh: '失败不等于已删除——检查卡片' }, position: 'lower-left', tone: 'red' }
					]
				}
			]
		},
		copy: {
			en: {
				navigation: 'Resonance', family: 'Quote wall', summary: 'Read public voices, add a signed or anonymous quote, and keep moderation limited to administrators.',
				hero: {
					eyebrow: 'Resonance · quote wall', title: 'Give a thought enough space to keep sounding.',
					summary: 'Resonance is a public, low-friction wall for short quotations. Signed-in people post with their account identity; visitors can contribute a name while the same character limit and visual rhythm protect the wall.',
					primaryAction: 'Write a quote', secondaryAction: 'See the posting loop',
					facts: [
						{ value: 'Public', label: 'anonymous browsing' },
						{ value: '500', label: 'character ceiling' },
						{ value: 'Admin', label: 'removal permission' }
					],
					scene: { type: 'cards', label: 'Quote wall', title: 'Many voices, one rhythm', badge: 'Public', items: [
						{ title: 'Maya', body: 'A short remembered line', value: 'Now' },
						{ title: 'Anonymous', body: 'A visitor contribution', value: '2h' },
						{ title: 'Lin', body: 'A thought worth keeping', value: '1d' }
					] }
				},
				journey: ['Read', 'Write', 'Name the voice', 'Post', 'Return later'],
				sections: [
					{
						id: 'read', nav: 'Read the wall', kicker: 'Public browsing', title: 'The wall remains readable without an account.',
						summary: 'Cards enter with gentle stagger, varied warm gradients, author initials, and relative time. An empty state explains the wall before the first voice arrives.',
						points: [
							{ title: 'No sign-in gate', body: 'Visitors can read every public quote immediately.' },
							{ title: 'Author context', body: 'Each card shows a name or account identity and an initial.' },
							{ title: 'Relative time', body: 'Recent posts read in human time rather than raw timestamps.' }
						],
						note: { title: 'Public does not mean unstructured', body: 'The character limit and fixed card anatomy preserve a calm reading rhythm.', tone: 'amber' },
						scene: { type: 'cards', label: 'Card anatomy', title: 'Voice, time, quote', badge: 'Readable', items: [
							{ title: 'Initial', body: 'Visual identity', value: 'L' },
							{ title: 'Name', body: 'Account or visitor', value: 'Lin' },
							{ title: 'Time', body: 'Relative label', value: '5m' }
						] }
					},
					{
						id: 'post', nav: 'Post a quote', kicker: 'Submission', title: 'Write the line first; identity follows the session.',
						summary: 'Type into the quote area and watch the character count. Signed-in posts use the account automatically; signed-out visitors receive a name field and can still post directly.',
						points: [
							{ title: 'Signed in', body: 'The active account supplies the displayed author identity.' },
							{ title: 'Signed out', body: 'Enter a visitor name before posting the public quote.' },
							{ title: 'Keyboard submit', body: 'Enter follows the same guarded submission path as the Post button.' }
						],
						note: { title: 'The button waits for valid text', body: 'Blank, over-limit, or already-submitting states cannot send another write.', tone: 'green' },
						scene: { type: 'form', label: 'Quote composer', title: 'Text + optional name', badge: '500 max', items: [
							{ title: 'Quote', body: 'Required', value: '312/500' },
							{ title: 'Name', body: 'Visitors only', value: 'Optional' },
							{ title: 'Post', body: 'Guarded write', value: 'Ready' }
						] }
					},
					{
						id: 'feedback', nav: 'Read feedback', kicker: 'Submission state', title: 'Let the composer show whether the post is possible.',
						summary: 'The count changes colour when the text crosses the limit. During submission, the input and button wait; after success, a small Posted signal confirms the wall received the quote.',
						points: [
							{ title: 'Character count', body: 'Shows the current length against the maximum.' },
							{ title: 'In flight', body: 'Disables the composer while one post is being written.' },
							{ title: 'Success', body: 'A compact confirmation appears without interrupting reading.' }
						],
						note: { title: 'One action, one write', body: 'The in-flight state prevents rapid clicks from creating duplicate quotes.', tone: 'blue' },
						scene: { type: 'workflow', label: 'Submission feedback', title: 'Valid, posting, posted', badge: 'Guarded', items: [
							{ title: 'Valid', body: 'Within the limit', value: '01' },
							{ title: 'Posting', body: 'Controls wait', value: '02' },
							{ title: 'Posted', body: 'Wall refreshes', value: '03' }
						] }
					},
					{
						id: 'moderate', nav: 'Moderate carefully', kicker: 'Administrator action', title: 'Removal stays rare, visible, and confirmed.',
						summary: 'Only administrators see the delete control. Selecting it opens the standard confirmation flow before the public record is removed.',
						points: [
							{ title: 'Hidden by default', body: 'Ordinary readers and contributors never receive a removal action.' },
							{ title: 'Administrator gate', body: 'The control appears only after the role is known.' },
							{ title: 'Confirmation', body: 'The destructive write runs only after explicit acceptance.' }
						],
						note: { title: 'There is no personal edit mode', body: 'Resonance favors deliberate posting and administrator moderation over silent rewriting.', tone: 'red' },
						scene: { type: 'split', label: 'Permission boundary', title: 'Read and post / administer', badge: 'Role-aware', items: [
							{ title: 'Everyone', body: 'Read and contribute', value: 'Public' },
							{ title: 'Administrator', body: 'Confirm removal', value: 'Delete' }
						] }
					}
				],
				rules: [
					{ title: 'Anonymous reading', body: 'The wall is visible without authentication.' },
					{ title: 'Visitor identity', body: 'Signed-out contributors can provide a display name.' },
					{ title: 'Character ceiling', body: 'Over-limit text cannot be posted.' },
					{ title: 'Administrator removal', body: 'Only administrators receive the confirmed delete action.' }
				],
				footer: { eyebrow: 'End of Resonance · Page 08', title: 'Read openly. Post deliberately. Moderate sparingly.', body: 'The wall stays welcoming because contribution is easy and destructive power is narrow.' }
			},
			zh: {
				navigation: '语录', family: '语录墙', summary: '阅读公开声音，添加署名或匿名语录，并把管理权限限制在管理员。',
				hero: {
					eyebrow: '语录 · 语录墙', title: '给一个念头足够空间，让它继续回响。',
					summary: '「语录」是一面低门槛的公开短语录墙。已登录用户以账户身份发布，访客可以留下名字；统一字数限制和视觉节奏保护整面墙。',
					primaryAction: '写下语录', secondaryAction: '查看发布流程',
					facts: [
						{ value: '公开', label: '匿名浏览' },
						{ value: '500', label: '字数上限' },
						{ value: '管理员', label: '删除权限' }
					],
					scene: { type: 'cards', label: '语录墙', title: '许多声音，一种节奏', badge: '公开', items: [
						{ title: 'Maya', body: '一句被记住的话', value: '现在' },
						{ title: '匿名', body: '访客贡献', value: '2小时' },
						{ title: 'Lin', body: '值得保存的念头', value: '1天' }
					] }
				},
				journey: ['阅读', '写下', '标记声音', '发布', '稍后回来'],
				sections: [
					{
						id: 'read', nav: '阅读语录墙', kicker: '公开浏览', title: '没有账户也能阅读整面墙。',
						summary: '卡片以轻柔错峰进入，使用不同暖色渐变、作者首字母和相对时间。第一条声音出现前，空状态会说明这里是什么。',
						points: [
							{ title: '无需登录', body: '访客可以立即阅读所有公开语录。' },
							{ title: '作者上下文', body: '每张卡显示名字或账户身份及首字母。' },
							{ title: '相对时间', body: '最近发布使用自然时间，而不是原始时间戳。' }
						],
						note: { title: '公开不等于无结构', body: '字数限制和固定卡片结构保持平静阅读节奏。', tone: 'amber' },
						scene: { type: 'cards', label: '卡片结构', title: '声音、时间、语录', badge: '易读', items: [
							{ title: '首字母', body: '视觉身份', value: 'L' },
							{ title: '名字', body: '账户或访客', value: 'Lin' },
							{ title: '时间', body: '相对标签', value: '5分' }
						] }
					},
					{
						id: 'post', nav: '发布语录', kicker: '提交', title: '先写内容，身份跟随会话。',
						summary: '在语录区输入并观察字数。已登录发布自动使用账户；未登录访客会看到名字栏，也仍可直接发布。',
						points: [
							{ title: '已登录', body: '当前账户提供显示作者身份。' },
							{ title: '未登录', body: '发布公开语录前输入访客名字。' },
							{ title: '键盘提交', body: '回车与发布按钮走同一条受保护提交路径。' }
						],
						note: { title: '按钮会等待有效文字', body: '空白、超限或正在提交时，不会发起第二次写入。', tone: 'green' },
						scene: { type: 'form', label: '语录编辑器', title: '文字 + 可选名字', badge: '最多 500', items: [
							{ title: '语录', body: '必填', value: '312/500' },
							{ title: '名字', body: '仅访客', value: '可选' },
							{ title: '发布', body: '受保护写入', value: '就绪' }
						] }
					},
					{
						id: 'feedback', nav: '读取反馈', kicker: '提交状态', title: '让编辑器说明现在是否可以发布。',
						summary: '文字超过上限时，计数会改变颜色。提交期间输入和按钮等待；成功后，小型「已发布」信号确认语录已进入墙面。',
						points: [
							{ title: '字数计数', body: '显示当前长度和最大值。' },
							{ title: '写入中', body: '单次发布写入期间禁用编辑器。' },
							{ title: '成功', body: '不打断阅读地显示紧凑确认。' }
						],
						note: { title: '一个动作，一次写入', body: '写入中状态会阻止快速点击造成重复语录。', tone: 'blue' },
						scene: { type: 'workflow', label: '提交反馈', title: '有效、发布中、已发布', badge: '受保护', items: [
							{ title: '有效', body: '未超过上限', value: '01' },
							{ title: '发布中', body: '控件等待', value: '02' },
							{ title: '已发布', body: '墙面刷新', value: '03' }
						] }
					},
					{
						id: 'moderate', nav: '谨慎管理', kicker: '管理员操作', title: '删除保持少见、可见且经过确认。',
						summary: '只有管理员看到删除控件。选择后会先打开标准确认流程，再移除公开记录。',
						points: [
							{ title: '默认隐藏', body: '普通读者和贡献者不会得到删除操作。' },
							{ title: '管理员门槛', body: '角色确认后，控件才会出现。' },
							{ title: '确认', body: '只有明确接受后才会运行破坏性写入。' }
						],
						note: { title: '没有个人编辑模式', body: '「语录」偏向认真发布和管理员管理，而不是悄悄改写。', tone: 'red' },
						scene: { type: 'split', label: '权限边界', title: '阅读和发布 / 管理', badge: '角色感知', items: [
							{ title: '所有人', body: '阅读与贡献', value: '公开' },
							{ title: '管理员', body: '确认删除', value: '删除' }
						] }
					}
				],
				rules: [
					{ title: '匿名阅读', body: '无需身份验证即可查看墙面。' },
					{ title: '访客身份', body: '未登录贡献者可以提供显示名称。' },
					{ title: '字数上限', body: '超过限制的文字无法发布。' },
					{ title: '管理员删除', body: '只有管理员获得确认删除操作。' }
				],
				footer: { eyebrow: '语录结束 · 页面 08', title: '公开阅读，认真发布，克制管理。', body: '贡献容易而破坏权限狭窄，因此整面墙保持友好。' }
			}
		}
	},
	{
		id: 'debt', order: '09', icon: 'icon-debt', accent: '13, 148, 136', generated: true,
		captures: {
			summary: [
				{ src: 'assets/images/debt/debt-overview-populated.png', scenario: 0, layout: 'wide', label: { en: 'Currency totals, six counts, and two due states', zh: '货币总额、六项统计与两种到期状态' }, alt: { en: 'Real Debt Sonata summary with CAD totals, portfolio counts, a due-tomorrow debt, and an overdue debt', zh: '真实债务页面总览，显示加元总额、组合统计、明日到期债务与已逾期债务' }, caption: { en: 'The summary and cards use the same live records: CAD remains separate, one payment contributes to the total, and urgency is visible before any action.', zh: '总览与卡片使用同一批实时记录：加元独立汇总，一次还款计入总数，操作前即可看见紧迫程度。' } },
				{ src: 'assets/images/debt/debt-card-anatomy.png', scenario: 0, presentation: 'side-by-side', label: { en: 'Read one complete debt card', zh: '读懂一张完整债务卡' }, alt: { en: 'Real Debt Sonata card with category, due status, balance, progress, payment chips, Set, Reset, lock, delete, and History controls', zh: '真实债务卡，显示分类、到期状态、余额、进度、还款、设置、重置、锁定、删除与记录控件' }, caption: { en: 'Everything needed for the active ledger stays on one card; the due chip and progress values are calculated from its stored date, original amount, balance, and history.', zh: '当前账本所需信息集中在一张卡上；到期标签与进度来自保存的日期、原始金额、余额和还款记录。' } },
				{ src: 'assets/images/home/home-debt-populated.png', scenario: 0, layout: 'wide', label: { en: 'The ledger reaches Home', zh: '账本抵达主页' }, alt: { en: 'Real Home Debt Sonata panel showing payment progress bars and due dates', zh: '真实的主页债务面板，显示还款进度条与到期日' }, caption: { en: 'The same records drive the dashboard: payment progress and due urgency reappear in the Home Debt Sonata panel.', zh: '同一批记录同时驱动仪表盘：还款进度与到期紧迫程度会重新出现在主页债务面板中。' } }
			],
			create: [
				{ src: 'assets/images/debt/debt-create-empty.png', scenario: 0, presentation: 'side-by-side', label: { en: 'Empty form keeps Add debt disabled', zh: '空白表单会禁用「添加债务」' }, alt: { en: 'Real New debt dialog before required name and amount are entered', zh: '真实「新增债务」对话框，尚未填写必需的名称与金额' }, caption: { en: 'Name, a non-negative amount, and an explicit currency choice are required. Category and due date start with visible defaults; Permanent account starts off.', zh: '名称、非负金额与明确选择的货币为必填项；分类和到期日显示默认值，「永久账户」初始关闭。' } },
				{ src: 'assets/images/debt/debt-create-complete.png', scenario: 0, presentation: 'side-by-side', label: { en: 'Complete every creation choice', zh: '完整填写全部新增选项' }, alt: { en: 'Real New debt dialog filled with a guide name, Financing category, CAD amount, due date, and Permanent account enabled', zh: '真实「新增债务」对话框，已填写演示名称、分期分类、加元金额、到期日并启用永久账户' }, caption: { en: 'The enabled Add debt action would save exactly these visible choices; this demonstration was canceled without creating the record.', zh: '启用后的「添加债务」会按画面所示选项保存；本次演示已取消，没有创建记录。' } },
				{ src: 'assets/images/debt/debt-edit-new-cycle.png', scenario: 0, presentation: 'side-by-side', label: { en: 'Set amount and deliberately start a New cycle', zh: '设置金额并有意识地开启「新周期」' }, alt: { en: 'Real Set debt dialog with locked currency and New cycle enabled', zh: '真实「设置债务」对话框，货币不可修改且「新周期」已启用' }, caption: { en: 'Set edits the total and due date. New cycle is the larger operation: it replaces the active balance and clears payment history.', zh: '「设置」可修改总额与到期日；「新周期」影响更大，会替换当前余额并清空还款记录。' } }
			],
			pay: [
				{ src: 'assets/images/debt/debt-custom-payment.png', scenario: 0, presentation: 'side-by-side', label: { en: 'Enter an exact custom payment', zh: '输入精确的自定义还款金额' }, alt: { en: 'Real active Debt card with the Custom payment input containing 125', zh: '真实债务卡已打开「自定义」还款输入，并填写 125' }, caption: { en: 'A positive number submits on Enter or blur. Blank, zero, negative, and non-numeric values simply close without a payment.', zh: '正数会在回车或失焦时提交；空白、零、负数与非数字只会关闭输入，不会产生还款。' } },
				{ src: 'assets/images/debt/debt-paid-overshoot-bug.png', scenario: 0, presentation: 'side-by-side', label: { en: 'Paid off can retain a negative overpayment balance', zh: '还清后仍可能保留负数超额还款余额' }, alt: { en: 'Real paid-off Debt card showing a negative balance after a preset payment exceeded the remaining amount', zh: '真实已还清债务卡，预设还款超过剩余金额后显示负数余额' }, caption: { en: 'Current behavior intentionally allows overpayment: zero or below marks the card Paid off and disables further payment chips. Remove the payment or Reset if the negative balance was accidental.', zh: '当前行为允许超额还款：余额为零或负数时标记「已还清」并禁用继续还款。如负数并非预期，可删除该还款记录或使用「重置」。' } }
			],
			history: [
				{ src: 'assets/images/debt/debt-history-expanded.png', scenario: 0, presentation: 'side-by-side', label: { en: 'Each history row proves amount and resulting balance', zh: '每条记录都说明还款金额与结果余额' }, alt: { en: 'Real expanded Debt history with two payment rows, timestamps, amounts, and resulting balances', zh: '真实展开的债务还款记录，显示两条时间、金额与结果余额' }, caption: { en: 'History is newest-in-storage order and remains attached to its debt card. Owners can select a row to remove a mistaken payment.', zh: '还款记录按存储顺序显示并始终属于对应债务卡；所有者可选择某行删除错误还款。' } },
				{ src: 'assets/images/debt/debt-history-empty.png', scenario: 0, presentation: 'side-by-side', label: { en: 'An expanded ledger can have no payments yet', zh: '展开的账本也可能尚无还款记录' }, alt: { en: 'Real Debt card with an expanded empty History panel', zh: '真实债务卡展开空白「记录」面板' }, caption: { en: 'History 0 opens a clear empty message rather than an absent or broken panel.', zh: '「记录 0」会打开明确的空白提示，不表示面板缺失或损坏。' } },
				{ src: 'assets/images/debt/debt-remove-payment-confirmation.png', scenario: 0, presentation: 'side-by-side', label: { en: 'Removing a payment asks first', zh: '删除还款记录前会先确认' }, alt: { en: 'Real Remove payment confirmation dialog with Cancel and Remove actions', zh: '真实「删除还款记录」确认对话框，包含「取消」与「删除」' }, caption: { en: 'Cancel preserves the ledger. Remove refunds the amount to the balance and deletes only the selected history entry.', zh: '「取消」保留账本；「删除」把该金额退回余额，只移除所选还款记录。' } },
				{ src: 'assets/images/debt/debt-reset-confirmation.png', scenario: 1, presentation: 'side-by-side', label: { en: 'Reset requires a second click on Restore?', zh: '「重置」需要再次点击「恢复？」' }, alt: { en: 'Real Debt card with the Reset control changed to Restore question mark', zh: '真实债务卡中「重置」已变为「恢复？」' }, caption: { en: 'The warning lasts about 2.6 seconds and clears on an outside click. A second click restores the original balance and clears history.', zh: '警示约持续 2.6 秒，点击外部会立即清除；再次点击会恢复原始余额并清空记录。' } },
				{ src: 'assets/images/debt/debt-delete-confirmation.png', scenario: 1, presentation: 'side-by-side', label: { en: 'Delete also uses a two-click warning', zh: '「删除」同样使用两次点击警示' }, alt: { en: 'Real Debt card with its delete icon changed to Delete question mark', zh: '真实债务卡中的删除图标已变为「确认删除？」' }, caption: { en: 'The second click permanently removes the debt and its history; clicking elsewhere cancels the prompt.', zh: '再次点击会永久移除债务及其记录；点击其他位置会取消警示。' } },
				{ src: 'assets/images/debt/debt-permanent-protection.png', scenario: 1, presentation: 'side-by-side', label: { en: 'Permanent protection hides Delete', zh: '永久保护会隐藏「删除」' }, alt: { en: 'Real Debt card with a closed lock and no delete control', zh: '真实债务卡显示闭合锁定，且没有删除控件' }, caption: { en: 'Unlock the card before deletion is even offered. The guide restored this demonstration card to its original unlocked state.', zh: '必须先解锁，页面才会提供删除；指南完成演示后已把此卡恢复为原来的未锁定状态。' } }
			]
		},
		copy: {
			en: {
				navigation: 'Debt Sonata', family: 'Debt and payment ledger', summary: 'Track balances in CNY or CAD, apply payments, review history, and start a clean cycle without losing the shape of the debt.',
				hero: {
					eyebrow: 'Debt Sonata · debt and payment ledger', title: 'Turn every payment into visible forward motion.',
					summary: 'Debt Sonata pairs a currency-aware summary with individual ledgers. Each card shows balance, progress, due state, payment shortcuts, permanence, and a complete payment history.',
					primaryAction: 'Read the summary', secondaryAction: 'See the payment loop',
					facts: [
						{ value: '2', label: 'CNY and CAD summaries' },
						{ value: '3', label: 'preset, custom, and reset paths' },
						{ value: 'Full', label: 'payment history per debt' }
					],
					scene: { type: 'dashboard', label: 'Debt summary', title: 'Owed, paid, due', badge: '2 currencies', items: [
						{ title: 'CNY owed', body: 'Across active debts', value: '¥8,200' },
						{ title: 'CAD owed', body: 'Across active debts', value: '$1,240' },
						{ title: 'Due soon', body: 'Needs attention', value: '2' },
						{ title: 'Paid off', body: 'Completed ledgers', value: '4' }
					] }
				},
				journey: ['Add a debt', 'Read progress', 'Apply payment', 'Review history', 'Reset or close'],
				sections: [
					{
						id: 'summary', nav: 'Read the summary', kicker: 'Currency overview', title: 'Separate currencies before comparing progress.',
						summary: 'The summary groups original, paid, and remaining amounts by CNY and CAD. Counts for active, paid off, due soon, overdue, and payments explain the portfolio without converting currencies.',
						points: [
							{ title: 'Currency groups', body: 'Each currency has its own total and progress bar.' },
							{ title: 'Status counts', body: 'Active, paid off, due soon, and overdue stay distinct.' },
							{ title: 'Payment total', body: 'The summary counts recorded payment events, not only debts.' }
						],
						note: { title: 'No hidden conversion', body: 'CNY and CAD remain separate so exchange rates never distort the stored ledger.', tone: 'green' },
						scene: { type: 'split', label: 'Currency groups', title: 'CNY beside CAD', badge: 'No conversion', items: [
							{ title: 'CNY', body: 'Original and remaining', value: '68%' },
							{ title: 'CAD', body: 'Original and remaining', value: '42%' }
						] }
					},
					{
						id: 'create', nav: 'Create or edit a debt', kicker: 'Ledger identity', title: 'Define the obligation before recording payments.',
						summary: 'New Debt captures name, category, amount, currency, due date, and permanence. Set edits the same source, while New Cycle replaces the balance and clears prior payment history deliberately.',
						points: [
							{ title: 'Category and currency', body: 'Choose the visual family and monetary unit.' },
							{ title: 'Due date', body: 'Enables due-soon and overdue states across Debt and Home.' },
							{ title: 'New Cycle', body: 'Resets balance and history for a genuinely new obligation period.' }
						],
						note: { title: 'A cycle reset is larger than an edit', body: 'Use it only when the prior payment history should no longer belong to the active balance.', tone: 'red' },
						scene: { type: 'form', label: 'Debt editor', title: 'Identity + balance + timing', badge: 'Validated', items: [
							{ title: 'Name', body: 'Required', value: 'Card' },
							{ title: 'Balance', body: 'Currency-aware', value: '¥3,200' },
							{ title: 'New Cycle', body: 'Optional reset', value: 'Off' }
						] }
					},
					{
						id: 'pay', nav: 'Apply payments', kicker: 'Progress action', title: 'Use the fastest payment path that stays accurate.',
						summary: 'Preset chips subtract common amounts immediately. Custom opens a compact input for an exact value. Every accepted payment updates the balance, percentage, summary, and history together.',
						points: [
							{ title: 'Preset chips', body: 'Apply the small or large configured amount with one action.' },
							{ title: 'Custom amount', body: 'Enter an exact value and confirm with Enter or blur.' },
							{ title: 'Paid-off state', body: 'A zero balance becomes a ribboned completed card and disables further pay actions.' }
						],
						note: { title: 'Payments cannot pass zero', body: 'The balance is rounded and constrained so progress cannot drift below a settled debt.', tone: 'blue' },
						scene: { type: 'workflow', label: 'Payment path', title: 'Choose, subtract, record', badge: 'Atomic', items: [
							{ title: 'Choose', body: 'Preset or custom', value: '01' },
							{ title: 'Subtract', body: 'Update balance', value: '02' },
							{ title: 'Record', body: 'Append history', value: '03' }
						] }
					},
					{
						id: 'history', nav: 'Review and protect history', kicker: 'Ledger controls', title: 'Use history to explain every balance change.',
						summary: 'Expand History to read each payment amount, time, and resulting balance. Owners can remove a mistaken payment, which recomputes later balances. Reset and Delete use two-step prompts; permanent debts hide deletion.',
						points: [
							{ title: 'History rows', body: 'Show amount, timestamp, and balance after the payment.' },
							{ title: 'Remove a mistake', body: 'Owner-only removal recalculates all later history balances.' },
							{ title: 'Permanent lock', body: 'Protect recurring obligations from casual deletion until unlocked.' }
						],
						note: { title: 'Reset and Delete are different', body: 'Reset restores the original balance; Delete removes the entire debt and its history.', tone: 'amber' },
						scene: { type: 'timeline', label: 'Payment history', title: 'Amount and resulting balance', badge: 'Owner-aware', items: [
							{ title: 'Aug 01', body: '−¥500', value: '¥2,700' },
							{ title: 'Aug 08', body: '−¥300', value: '¥2,400' },
							{ title: 'Aug 15', body: '−¥400', value: '¥2,000' }
						] }
					}
				],
				rules: [
					{ title: 'Currencies stay separate', body: 'CNY and CAD are summarized independently.' },
					{ title: 'History drives trust', body: 'Each payment stores the resulting balance and time.' },
					{ title: 'Permanent debts', body: 'Locked debts cannot be deleted until permanence is removed.' },
					{ title: 'New Cycle', body: 'A new cycle clears payment history and resets the active balance.' }
				],
				footer: { eyebrow: 'End of Debt Sonata · Page 09', title: 'Name the obligation. Record the motion. Keep the ledger explainable.', body: 'Every payment should change both the balance you see and the history that proves it.' }
			},
			zh: {
				navigation: '债务', family: '债务与还款账本', summary: '追踪人民币或加元余额、记录还款、查看历史，并在不丢失债务结构的前提下开启新周期。',
				hero: {
					eyebrow: '债务 · 债务与还款账本', title: '让每一次还款都变成可见的前进。',
					summary: '「债务」把货币感知总览与独立账本结合起来。每张卡显示余额、进度、到期状态、还款快捷方式、永久保护和完整历史。',
					primaryAction: '阅读总览', secondaryAction: '查看还款流程',
					facts: [
						{ value: '2', label: '组人民币与加元总览' },
						{ value: '3', label: '种预设、自定义与重置路径' },
						{ value: '完整', label: '每笔债务的还款历史' }
					],
					scene: { type: 'dashboard', label: '债务总览', title: '欠款、已付、到期', badge: '2 种货币', items: [
						{ title: '人民币欠款', body: '所有活跃债务', value: '¥8,200' },
						{ title: '加元欠款', body: '所有活跃债务', value: '$1,240' },
						{ title: '即将到期', body: '需要关注', value: '2' },
						{ title: '已还清', body: '完成的账本', value: '4' }
					] }
				},
				journey: ['添加债务', '读取进度', '记录还款', '查看历史', '重置或结束'],
				sections: [
					{
						id: 'summary', nav: '阅读总览', kicker: '货币总览', title: '比较进度前，先把货币分开。',
						summary: '总览按人民币和加元分别汇总原始金额、已还和剩余。活跃、已还清、即将到期、逾期和还款次数说明整体情况，但不会转换货币。',
						points: [
							{ title: '货币分组', body: '每种货币都有独立总额和进度条。' },
							{ title: '状态计数', body: '活跃、已还清、即将到期和逾期保持独立。' },
							{ title: '还款总数', body: '总览统计已记录还款事件，而不只是债务数量。' }
						],
						note: { title: '没有隐藏换算', body: '人民币与加元保持独立，汇率不会扭曲保存的账本。', tone: 'green' },
						scene: { type: 'split', label: '货币分组', title: '人民币与加元并列', badge: '不换算', items: [
							{ title: '人民币', body: '原始与剩余', value: '68%' },
							{ title: '加元', body: '原始与剩余', value: '42%' }
						] }
					},
					{
						id: 'create', nav: '创建或编辑债务', kicker: '账本身份', title: '记录还款前，先定义义务。',
						summary: '新债务包含名称、类别、金额、货币、到期日和永久保护。设置会编辑同一来源；新周期则有意替换余额并清空之前的还款历史。',
						points: [
							{ title: '类别与货币', body: '选择视觉家族和金额单位。' },
							{ title: '到期日', body: '为债务和主页启用即将到期与逾期状态。' },
							{ title: '新周期', body: '为真正的新义务周期重置余额和历史。' }
						],
						note: { title: '周期重置大于普通编辑', body: '只有之前的还款历史不再属于当前余额时才使用。', tone: 'red' },
						scene: { type: 'form', label: '债务编辑器', title: '身份 + 余额 + 时间', badge: '已验证', items: [
							{ title: '名称', body: '必填', value: '信用卡' },
							{ title: '余额', body: '货币感知', value: '¥3,200' },
							{ title: '新周期', body: '可选重置', value: '关闭' }
						] }
					},
					{
						id: 'pay', nav: '记录还款', kicker: '进度操作', title: '使用既快速又准确的还款路径。',
						summary: '预设胶囊立即减去常用金额。自定义会打开紧凑输入框记录准确值。每次有效还款会同时更新余额、百分比、总览和历史。',
						points: [
							{ title: '预设胶囊', body: '一次操作应用小额或大额预设。' },
							{ title: '自定义金额', body: '输入准确值，用回车或失焦确认。' },
							{ title: '已还清状态', body: '零余额变成带缎带完成卡，并禁用后续还款。' }
						],
						note: { title: '还款不会越过零', body: '余额会四舍五入并限制，进度不会漂移到结清值以下。', tone: 'blue' },
						scene: { type: 'workflow', label: '还款路径', title: '选择、减少、记录', badge: '原子操作', items: [
							{ title: '选择', body: '预设或自定义', value: '01' },
							{ title: '减少', body: '更新余额', value: '02' },
							{ title: '记录', body: '追加历史', value: '03' }
						] }
					},
					{
						id: 'history', nav: '查看并保护历史', kicker: '账本控制', title: '用历史解释每一次余额变化。',
						summary: '展开历史查看每次还款金额、时间和结果余额。所有者可以删除错误还款，后续余额会重新计算。重置和删除使用两步提示；永久债务隐藏删除。',
						points: [
							{ title: '历史行', body: '显示还款后的金额、时间戳和余额。' },
							{ title: '删除错误', body: '仅所有者删除会重新计算所有后续历史余额。' },
							{ title: '永久锁', body: '在解锁前保护周期性义务不被随意删除。' }
						],
						note: { title: '重置和删除不同', body: '重置恢复原始余额；删除移除整笔债务及其历史。', tone: 'amber' },
						scene: { type: 'timeline', label: '还款历史', title: '金额与结果余额', badge: '所有者感知', items: [
							{ title: '8 月 1 日', body: '−¥500', value: '¥2,700' },
							{ title: '8 月 8 日', body: '−¥300', value: '¥2,400' },
							{ title: '8 月 15 日', body: '−¥400', value: '¥2,000' }
						] }
					}
				],
				rules: [
					{ title: '货币保持独立', body: '人民币与加元分别汇总。' },
					{ title: '历史建立信任', body: '每次还款保存结果余额和时间。' },
					{ title: '永久债务', body: '解除永久状态前，锁定债务不能删除。' },
					{ title: '新周期', body: '新周期会清除还款历史并重置当前余额。' }
				],
				footer: { eyebrow: '债务结束 · 页面 09', title: '命名义务，记录变化，让账本可以解释。', body: '每次还款都应改变眼前余额，也改变能够证明它的历史。' }
			}
		}
	},
	{
		id: 'account', order: '10', icon: 'icon-account', accent: '30, 58, 138', generated: true,
		captures: {
			profile: [
				{ src: 'assets/images/account/account-loading-primary.jpg', scenario: 0, layout: 'wide', label: { en: 'Profile ready, account data pending', zh: '资料已显示，账户数据仍在载入' }, alt: { en: 'Real Account profile and primary cards while statistics remain skeletons', zh: '真实账户页，资料已显示，而主要统计卡仍为骨架状态' }, caption: { en: 'The profile and Cadence control can appear before the live user-stat document fills Identity and Inner World.', zh: '实时用户统计文档填充「账号设置」和「专属领域」前，资料与「节奏」控件可能先出现。' } },
				{ src: 'assets/images/account/account-loading-secondary.jpg', scenario: 0, layout: 'wide', label: { en: 'History and connections still pending', zh: '历史与关联仍在载入' }, alt: { en: 'Real Account Milestones, Security, and Connections cards in skeleton state', zh: '真实账户页中的里程碑、安全与关联卡片骨架状态' }, caption: { en: 'These cards share the same live document dependency and have no Account-specific retry button.', zh: '这些卡片依赖同一份实时文档，账户页没有专用重试按钮。' } },
				{ src: 'assets/images/account/account-profile-cadence.jpg', scenario: 0, layout: 'wide', label: { en: 'Identity at the top', zh: '顶部身份资料' }, alt: { en: 'Real Account profile header with initials, display name, tagline, membership month, streak, and Cadence', zh: '真实账户页顶部，显示首字母、显示名、标语、加入月份、连续天数与节奏' }, caption: { en: 'No photo is stored, so the current account uses its IP initials fallback.', zh: '当前账户没有保存照片，因此头像使用「IP」首字母后备。' } },
				{ src: 'assets/images/account/account-inner-world.jpg', scenario: 0, label: { en: 'All six Inner World counts', zh: '专属领域的全部六项统计' }, alt: { en: 'Real Account Inner World card with film, quote, recipe, reminder, debt, and link values', zh: '真实账户专属领域卡，显示影片、心声、食谱、提醒、债务和链接数值' }, caption: { en: 'Zero, singular, and plural values are rendered from the same six account counters.', zh: '零值、单数与复数都来自同一组六项账户计数。' } },
				{ src: 'assets/images/account/account-milestones.jpg', scenario: 0, label: { en: 'Milestones in newest-first order', zh: '按时间倒序排列的里程碑' }, alt: { en: 'Real Account milestone card with first debt, first link, reminder, streak, and account-created entries', zh: '真实账户里程碑卡，显示首笔债务、首条链接、提醒、连续活动与账户创建记录' }, caption: { en: 'Known milestones include localized notes; counted milestones can appear without a note.', zh: '已知里程碑会显示本地化说明；计数型里程碑可能没有说明。' } },
				{ src: 'assets/images/account/account-security.jpg', scenario: 0, label: { en: 'Security dates and em-dash fallback', zh: '安全日期与破折号后备' }, alt: { en: 'Real Account Security card showing last sign-in and absent username and password change dates', zh: '真实账户安全卡，显示上次登录日期，并用破折号表示缺少用户名和密码修改日期' }, caption: { en: 'A missing credential-change timestamp is shown as an em dash, not as an error.', zh: '缺少凭据修改日期时显示破折号，不表示错误。' } },
				{ src: 'assets/images/account/account-narrow-loaded.jpg', scenario: 0, layout: 'portrait', label: { en: 'Narrow loaded stack', zh: '窄屏已载入顺序' }, alt: { en: 'Real narrow Account page with loaded Identity, Inner World, and Milestones cards', zh: '真实窄屏账户页，显示已载入的账号设置、专属领域与里程碑卡片' }, caption: { en: 'The cards keep their full controls and reading order instead of shrinking into an unreadable desktop grid.', zh: '各卡片保留完整控件与阅读顺序，不会缩成难以阅读的桌面网格。' } }
			],
			identity: [
				{ src: 'assets/images/account/account-identity.jpg', scenario: 0, label: { en: 'CloudBase identity controls', zh: 'CloudBase 账号设置控件' }, alt: { en: 'Real Account Identity card with username, verified email, and three password fields', zh: '真实账户设置卡，显示用户名、已验证邮箱与三个密码字段' }, caption: { en: 'Username supports Enter or Update; email is read-only; password tools appear only for CloudBase sessions.', zh: '用户名可用回车或「更新用户名」提交；邮箱只读；密码工具只在 CloudBase 会话显示。' } },
				{ src: 'assets/images/account/account-password-strong-visible.jpg', scenario: 0, label: { en: 'Strong meter with visible new password', zh: '显示新密码时的强度计' }, alt: { en: 'Real Account password editor with a visible demonstration value and all four strength segments active', zh: '真实账户密码编辑器，显示演示值并点亮全部四段强度条' }, caption: { en: 'Each eye toggles only its own field; length thresholds drive Too short, Weak, Fair, Good, and Strong.', zh: '每个眼睛按钮只切换对应字段；长度阈值依次产生「太短、弱、一般、良好、强」。' } },
				{ src: 'assets/images/account/account-password-too-short-form.jpg', scenario: 0, label: { en: 'Too-short password state', zh: '密码过短状态' }, alt: { en: 'Focused real Account password editor showing a too-short new password', zh: '聚焦真实账户密码编辑器，显示新密码过短状态' }, caption: { en: 'The strength label identifies the local problem before the current password is checked.', zh: '强度标签会在检查当前密码前指出本地问题。' } },
				{ src: 'assets/images/account/account-password-too-short-toast.jpg', scenario: 0, label: { en: 'Too-short password message', zh: '密码过短消息' }, alt: { en: 'Focused real Account toast stating that the password must be at least six characters', zh: '聚焦真实账户提示，说明密码至少需要六位字符' }, caption: { en: 'The request is stopped locally and the password fields remain available for correction.', zh: '请求会在本地停止，密码字段会保留以便修正。' } },
				{ src: 'assets/images/account/account-password-mismatch-form.jpg', scenario: 0, label: { en: 'Confirmation mismatch state', zh: '确认密码不一致状态' }, alt: { en: 'Focused real Account password editor with a strong new password and mismatched confirmation', zh: '聚焦真实账户密码编辑器，显示强新密码与不一致的确认值' }, caption: { en: 'A Strong meter does not bypass the separate confirmation requirement. Correct the confirmation value before submitting.', zh: '强度计显示「强」也不会跳过独立的确认要求；提交前请修正确认值。' } }
			],
			connections: [
				{ src: 'assets/images/account/account-connections-left.png', scenario: 0, presentation: 'side-by-side', label: { en: 'Code, empty input, and a Left record', zh: '关联码、空输入与已离开记录' }, alt: { en: 'Real Account Connections card with connect code, empty link field, and an administrator Left row', zh: '真实账户关联卡，显示关联码、空白关联输入与管理员已离开记录' }, caption: { en: 'Left is a retained relationship state; selecting its close control clears only this local historical row.', zh: '「已离开」是保留的关系状态；点击关闭只会清理本地历史行。' } },
				{ src: 'assets/images/account/account-connect-code-copied.jpg', scenario: 0, label: { en: 'Connect code copied', zh: '关联码已复制' }, alt: { en: 'Real success toast confirming that the Account connect code was copied', zh: '真实成功提示，确认账户关联码已复制' }, caption: { en: 'Copy uses the current account code and does not create a request.', zh: '复制只使用当前账户关联码，不会创建请求。' } },
				{ src: 'assets/images/account/account-connect-self-input.jpg', scenario: 0, label: { en: 'Enter the account’s own code', zh: '输入自己的关联码' }, alt: { en: 'Real Connections card with the current account code entered in the link field', zh: '真实关联卡，在关联输入框中填写当前账户自己的代码' }, caption: { en: 'This is a safe validation demonstration; no relationship is created.', zh: '这是安全的校验演示，不会创建关联关系。' } },
				{ src: 'assets/images/account/account-connect-self-error.jpg', scenario: 0, label: { en: 'Own-code warning', zh: '自己的关联码警告' }, alt: { en: 'Real warning toast stating that the entered connect code belongs to the current account', zh: '真实警告提示，说明输入的关联码属于当前账户' }, caption: { en: 'The code stays in the field so it can be corrected.', zh: '代码会保留在输入框，便于修正。' } },
				{ src: 'assets/images/account/account-connect-invalid-input.jpg', scenario: 0, label: { en: 'Enter a code that does not exist', zh: '输入不存在的关联码' }, alt: { en: 'Real Connections card with an invalid demonstration connect code entered', zh: '真实关联卡，输入无效的演示关联码' }, caption: { en: 'Submitting a non-existent code uses the same warning surface as the captured own-code error and adds no outgoing request.', zh: '提交不存在的代码会使用与已捕捉「自己的关联码」相同的警告位置，且不会新增传出请求。' } }
			],
			safety: [
				{ src: 'assets/images/account/cadence-live.jpg', scenario: 0, label: { en: 'Current Vault access cadence', zh: '当前保险箱访问节奏' }, alt: { en: 'Real Account Cadence control set to Always require', zh: '真实账户节奏控件，当前设置为每次都需要' }, caption: { en: 'The walkthrough lists every selectable minute window and Until I reload; the temporary demonstration was restored to Always require.', zh: '操作说明列出全部分钟选项与「直到重新加载」；临时演示后已恢复为「每次都需要」。' } },
				{ src: 'assets/images/account/account-danger-zone.jpg', scenario: 1, layout: 'wide', label: { en: 'Two unequal danger actions', zh: '两项后果不同的危险操作' }, alt: { en: 'Real Account Danger Zone with disabled Vault passphrase deletion and enabled account deletion', zh: '真实账户危险区域，保险箱口令删除不可用，而账户删除可用' }, caption: { en: 'Vault recovery is disabled until a passphrase exists; account deletion remains available and permanent.', zh: '没有保险箱口令时恢复按钮不可用；删除账户仍可用且后果永久。' } },
				{ src: 'assets/images/account/account-delete-dialog-empty.jpg', scenario: 1, label: { en: 'Deletion starts disabled', zh: '删除按钮初始不可用' }, alt: { en: 'Real Delete Account dialog with an empty password field and disabled Delete button', zh: '真实删除账户对话框，密码为空且删除按钮不可用' }, caption: { en: 'Cancel closes the dialog without a request; entering a password only enables the final action.', zh: '「取消」会直接关闭且不发请求；输入密码只会启用最终操作。' } },
				{ src: 'assets/images/account/account-delete-wrong-password.jpg', scenario: 1, label: { en: 'Wrong password stays in context', zh: '错误密码在原对话框内提示' }, alt: { en: 'Real Delete Account dialog showing Current password is incorrect after a protected attempt', zh: '真实删除账户对话框，在受保护尝试后显示当前密码不正确' }, caption: { en: 'The account remains intact and the dialog returns to Cancel or retry.', zh: '账户保持不变，对话框恢复为可取消或重试状态。' } }
			]
		},
		copy: {
			en: {
				navigation: 'Account', family: 'Identity and security', summary: 'Manage identity, password, connected accounts, Vault cadence, personal statistics, and destructive account actions.',
				hero: {
					eyebrow: 'Account · identity and security', title: 'Keep identity, access, and shared boundaries in one place.',
					summary: 'Account combines the profile you present, the credentials you protect, the statistics you have built, and the connections or destructive actions that need the clearest safeguards.',
					primaryAction: 'Review identity', secondaryAction: 'See the account loop',
					facts: [
						{ value: '6', label: 'Inner World statistics' },
						{ value: '7', label: 'Vault cadence choices' },
						{ value: 'CloudBase', label: 'connected-account support' }
					],
					scene: { type: 'dashboard', label: 'Account hub', title: 'Profile, security, connections', badge: 'Private', items: [
						{ title: 'Identity', body: 'Username and email', value: 'Verified' },
						{ title: 'Inner World', body: 'Live personal counts', value: '6' },
						{ title: 'Connections', body: 'Reminder sharing', value: 'Scoped' },
						{ title: 'Cadence', body: 'Vault unlock window', value: '7 modes' }
					] }
				},
				journey: ['Review profile', 'Update credentials', 'Read history', 'Manage connections', 'Set safeguards'],
				sections: [
					{
						id: 'profile', nav: 'Read the account hub', kicker: 'Profile and Inner World', title: 'Start with what the account already knows.',
						summary: 'The profile header shows identity, membership date, and activity streak. Inner World summarizes movies, reminders, debts, recipes, quotes, and other stored work, while milestones and security logs explain the account over time.',
						points: [
							{ title: 'Profile', body: 'Avatar or initials, display name, membership date, and streak.' },
							{ title: 'Inner World', body: 'Live counts from the account’s major collections.' },
							{ title: 'Milestones and security', body: 'Timeline events and credential-change dates remain visible.' }
						],
						note: { title: 'Skeletons protect the layout', body: 'The hub keeps its card geometry while account statistics are still loading.', tone: 'blue' },
						scene: { type: 'cards', label: 'Inner World statistics', title: 'The account as a living record', badge: 'Live', items: [
							{ title: 'Films', body: 'Saved titles', value: 'Count' },
							{ title: 'Reminders', body: 'Captured work', value: 'Count' },
							{ title: 'Recipes', body: 'Cookbook entries', value: 'Count' },
							{ title: 'Milestones', body: 'Account history', value: 'History' }
						] }
					},
					{
						id: 'identity', nav: 'Update identity and password', kicker: 'Credentials', title: 'Change one credential through one guarded path.',
						summary: 'Username updates are available to the current account. CloudBase username/password sessions also receive old, new, and confirmation password fields with visibility controls and a live strength meter.',
						points: [
							{ title: 'Username', body: 'Enter a new value and confirm with Enter or Update.' },
							{ title: 'Password', body: 'Provide the current password, a strong replacement, and confirmation.' },
							{ title: 'Google accounts', body: 'Firebase sessions have no local password section to change.' }
						],
						note: { title: 'Strength is guidance, not decoration', body: 'The meter and label react to the new password before submission.', tone: 'green' },
						scene: { type: 'form', label: 'Credential update', title: 'Identity + guarded password', badge: 'Session-aware', items: [
							{ title: 'Username', body: 'Editable', value: 'Update' },
							{ title: 'Email', body: 'Verified display', value: 'Read only' },
							{ title: 'Password', body: 'CloudBase sessions', value: 'Strong' }
						] }
					},
					{
						id: 'connections', nav: 'Manage connected accounts', kicker: 'CloudBase sharing', title: 'Connect accounts only when Reminder sharing is intended.',
						summary: 'CloudBase sessions expose a share code, request flow, and connected-member list. Send a code, approve or decline incoming requests, remove outgoing requests, or unlink and reconnect members.',
						points: [
							{ title: 'Share code', body: 'Copy the account code or enter another account’s code.' },
							{ title: 'Request states', body: 'Incoming, outgoing, connected, declined, and leave states stay explicit.' },
							{ title: 'Reminder scope', body: 'Connections share Reminder items, not every collection in the app.' }
						],
						note: { title: 'Unavailable on Firebase', body: 'Google/Firebase sessions hide the entire connected-account card.', tone: 'amber' },
						scene: { type: 'workflow', label: 'Connection request', title: 'Code, approve, share', badge: 'CloudBase', items: [
							{ title: 'Send code', body: 'Create outgoing request', value: '01' },
							{ title: 'Approve', body: 'Accept the relationship', value: '02' },
							{ title: 'Share', body: 'Reminder data only', value: '03' }
						] }
					},
					{
						id: 'safety', nav: 'Set cadence and danger actions', kicker: 'Access safeguards', title: 'Put reversible access choices above irreversible deletion.',
						summary: 'Cadence chooses how long Vault stays unlocked after leaving. The danger zone can remove a forgotten Vault passphrase while keeping Vault data, or permanently delete the entire account through a guarded confirmation.',
						points: [
							{ title: 'Vault cadence', body: 'Always require, fixed-minute window, or until reload.' },
							{ title: 'Remove Vault passphrase', body: 'Keeps Vault records and allows a new passphrase next visit.' },
							{ title: 'Delete account', body: 'Requires the strongest confirmation and removes the user account.' }
						],
						note: { title: 'These actions are deliberately unequal', body: 'Passphrase removal recovers access; account deletion is permanent.', tone: 'red' },
						scene: { type: 'split', label: 'Danger boundary', title: 'Recover access / remove account', badge: 'Confirmed', items: [
							{ title: 'Passphrase', body: 'Data remains', value: 'Recover' },
							{ title: 'Account', body: 'Permanent deletion', value: 'Delete' }
						] }
					}
				],
				rules: [
					{ title: 'Backend-aware cards', body: 'Password and connection tools appear only where the active backend supports them.' },
					{ title: 'Connections scope', body: 'Connected accounts share Reminder data only.' },
					{ title: 'Cadence', body: 'Vault access can expire immediately, after minutes, or on reload.' },
					{ title: 'Passphrase recovery', body: 'Removing the passphrase keeps Vault data.' }
				],
				footer: { eyebrow: 'End of Account · Page 10', title: 'Know the identity. Guard the credential. Make sharing explicit.', body: 'Account keeps personal history and dangerous actions in one clearly bounded hub.' }
			},
			zh: {
				navigation: '账户', family: '身份与安全', summary: '管理身份、密码、关联账户、保险箱节奏、个人统计和破坏性账户操作。',
				hero: {
					eyebrow: '账户 · 身份与安全', title: '把身份、访问和共享边界放在同一个地方。',
					summary: '「账户」结合你展示的资料、需要保护的凭据、已经积累的统计，以及需要最清楚防护的关联和破坏性操作。',
					primaryAction: '查看身份', secondaryAction: '查看账户流程',
					facts: [
						{ value: '6', label: '项专属领域统计' },
						{ value: '7', label: '种保险箱节奏选择' },
						{ value: 'CloudBase', label: '关联账户支持' }
					],
					scene: { type: 'dashboard', label: '账户中心', title: '资料、安全、关联', badge: '私人', items: [
						{ title: '身份', body: '用户名与邮箱', value: '已验证' },
						{ title: '专属领域', body: '实时个人计数', value: '6' },
						{ title: '关联', body: '提醒共享', value: '限定范围' },
						{ title: '节奏', body: '保险箱解锁窗口', value: '7 种模式' }
					] }
				},
				journey: ['查看资料', '更新凭据', '阅读历史', '管理关联', '设置保护'],
				sections: [
					{
						id: 'profile', nav: '阅读账户中心', kicker: '资料与专属领域', title: '先看看账户已经知道什么。',
						summary: '资料顶部显示身份、加入日期和活动连续天数。专属领域汇总影视、提醒、债务、食谱、语录等工作；里程碑和安全日志解释账户如何走到今天。',
						points: [
							{ title: '资料', body: '头像或首字母、显示名、加入日期和连续天数。' },
							{ title: '专属领域', body: '账户主要集合的实时数量。' },
							{ title: '里程碑与安全', body: '时间线事件和凭据变更日期保持可见。' }
						],
						note: { title: '骨架保护布局', body: '账户统计仍在载入时，中心会保持卡片几何。', tone: 'blue' },
						scene: { type: 'cards', label: '专属领域统计', title: '把账户视作活的记录', badge: '实时', items: [
							{ title: '影视', body: '保存的标题', value: '数量' },
							{ title: '提醒', body: '记录的工作', value: '数量' },
							{ title: '食谱', body: '菜谱条目', value: '数量' },
							{ title: '里程碑', body: '账户历史', value: '历史' }
						] }
					},
					{
						id: 'identity', nav: '更新身份与密码', kicker: '凭据', title: '通过一条受保护路径改变一项凭据。',
						summary: '当前账户可以更新用户名。CloudBase 用户名密码会话还会看到旧密码、新密码和确认字段，以及可见性控件和实时强度计。',
						points: [
							{ title: '用户名', body: '输入新值，用回车或更新确认。' },
							{ title: '密码', body: '提供当前密码、强度足够的新密码和确认。' },
							{ title: 'Google 账户', body: 'Firebase 会话没有可更改的本地密码区。' }
						],
						note: { title: '强度是引导，不是装饰', body: '提交前，强度条和标签会响应新密码。', tone: 'green' },
						scene: { type: 'form', label: '凭据更新', title: '身份 + 受保护密码', badge: '会话感知', items: [
							{ title: '用户名', body: '可编辑', value: '更新' },
							{ title: '邮箱', body: '验证显示', value: '只读' },
							{ title: '密码', body: 'CloudBase 会话', value: '强' }
						] }
					},
					{
						id: 'connections', nav: '管理关联账户', kicker: 'CloudBase 共享', title: '只有需要共享提醒时才连接账户。',
						summary: 'CloudBase 会话显示共享码、请求流程和关联成员列表。发送代码、批准或拒绝传入请求、移除传出请求，或解除后重新连接成员。',
						points: [
							{ title: '共享码', body: '复制账户代码或输入另一账户的代码。' },
							{ title: '请求状态', body: '传入、传出、已连接、已拒绝和离开保持明确。' },
							{ title: '提醒范围', body: '关联只共享提醒，不共享应用每一个集合。' }
						],
						note: { title: 'Firebase 不可用', body: 'Google/Firebase 会话会隐藏整个关联账户卡。', tone: 'amber' },
						scene: { type: 'workflow', label: '关联请求', title: '代码、批准、共享', badge: 'CloudBase', items: [
							{ title: '发送代码', body: '创建传出请求', value: '01' },
							{ title: '批准', body: '接受关系', value: '02' },
							{ title: '共享', body: '仅提醒数据', value: '03' }
						] }
					},
					{
						id: 'safety', nav: '设置节奏与危险操作', kicker: '访问保护', title: '把可恢复访问选项放在不可逆删除之前。',
						summary: '节奏选择离开后保险箱保持解锁多久。危险区可以移除忘记的保险箱口令并保留数据，也可以通过严密确认永久删除整个账户。',
						points: [
							{ title: '保险箱节奏', body: '始终询问、固定分钟窗口或直到重载。' },
							{ title: '移除保险箱口令', body: '保留保险箱记录，并允许下次访问设置新口令。' },
							{ title: '删除账户', body: '要求最强确认并移除用户账户。' }
						],
						note: { title: '这些操作有意不对等', body: '口令移除用于恢复访问；账户删除是永久操作。', tone: 'red' },
						scene: { type: 'split', label: '危险边界', title: '恢复访问 / 删除账户', badge: '已确认', items: [
							{ title: '口令', body: '数据保留', value: '恢复' },
							{ title: '账户', body: '永久删除', value: '删除' }
						] }
					}
				],
				rules: [
					{ title: '后端感知卡片', body: '密码和关联工具只在当前后端支持时出现。' },
					{ title: '关联范围', body: '关联账户只共享提醒数据。' },
					{ title: '节奏', body: '保险箱访问可立即、数分钟后或重载时过期。' },
					{ title: '口令恢复', body: '移除口令会保留保险箱数据。' }
				],
				footer: { eyebrow: '账户结束 · 页面 10', title: '理解身份，保护凭据，明确共享。', body: '「账户」把个人历史和危险操作放进边界清楚的中心。' }
			}
		}
	},
	{
		id: 'login', order: '11', icon: 'icon-login', accent: '202, 138, 4', generated: true,
		captures: {
			entry: [
				{
					src: 'assets/images/login/entrance-live.jpg',
					presentation: 'side-by-side',
					label: { en: 'The lamp-lit entrance', zh: '灯下入口' },
					alt: { en: 'The real signed-out Login entrance before the lamp is pulled', zh: '真实的未登录页面，拉灯前的入口状态' },
					caption: { en: 'The page begins as a deliberate invitation rather than exposing every form at once.', zh: '页面先给出明确邀请，而不是一次展示所有表单。' }
				}
			],
			signin: [
				{
					src: 'assets/images/login/sign-in-live.jpg',
					presentation: 'side-by-side',
					label: { en: 'Returning-member form', zh: '回归用户表单' },
					alt: { en: 'The real Login sign-in form with username, password, and Google access', zh: '真实的登录表单，包含用户名、密码和 Google 登录入口' },
					caption: { en: 'Only the credential pair and supported alternative access are visible.', zh: '页面只展示凭据组合和当前环境支持的替代登录方式。' }
				},
				{
					src: 'assets/images/login/validation-live.jpg',
					presentation: 'side-by-side',
					label: { en: 'Inline validation feedback', zh: '行内校验反馈' },
					alt: { en: 'The real Login form showing required-field validation feedback', zh: '真实的登录表单，显示必填字段校验反馈' },
					caption: { en: 'Validation stays beside the action so the next correction is obvious.', zh: '校验反馈留在操作附近，让下一步修改清楚可见。' }
				},
				{
					src: 'assets/images/login/sign-in-error-live.jpg',
					presentation: 'side-by-side',
					label: { en: 'Rejected credentials', zh: '凭据被拒绝' },
					alt: { en: 'The real Login form behind an error dialog reading that the username or password is incorrect', zh: '真实的登录表单，前方错误对话框提示用户名或密码不正确' },
					caption: { en: 'A rejected sign-in returns one dialog that names neither field as the wrong one, so an onlooker learns nothing about which half exists. Confirm returns to the form with the entry intact.', zh: '登录被拒绝时只弹出一个对话框，不指明哪一项有误，旁观者无法据此判断账号是否存在。点击「确认」返回表单，已输入内容保持不变。' }
				}
			],
			signup: [
				{
					src: 'assets/images/login/sign-up-live.jpg',
					presentation: 'side-by-side',
					label: { en: 'Account-creation requirements', zh: '账户创建要求' },
					alt: { en: 'The real Sign Up form with email verification and password requirements', zh: '真实的注册表单，包含邮箱验证和密码要求' },
					caption: { en: 'Email verification and credential rules remain visible throughout the creation path.', zh: '邮箱验证和凭据规则在创建过程中始终保持可见。' }
				}
			],
			recovery: [
				{
					src: 'assets/images/login/forgot-password-live.jpg',
					presentation: 'side-by-side',
					label: { en: 'Password-recovery start', zh: '密码恢复起点' },
					alt: { en: 'The real Forgot Password form asking for the account email', zh: '真实的忘记密码表单，要求输入账户邮箱' },
					caption: { en: 'Recovery begins with identity, then continues only after the verification path is available.', zh: '恢复流程先确认身份，只有验证路径可用后才继续。' }
				}
			]
		},
		copy: {
			en: {
				navigation: 'Login', family: 'Access', summary: 'Enter, create, or recover an account through a focused lamp-lit gateway.',
				hero: {
					eyebrow: 'Login · Access', title: 'Pull the light on, then choose the right way in.',
					summary: 'Login uses one calm entry point for returning members, new accounts, password recovery, and supported Google sign-in. Each mode keeps only the fields and decisions needed for that job.',
					primaryAction: 'Choose a path', secondaryAction: 'See the access flow',
					facts: [
						{ value: '3', label: 'email access paths' },
						{ value: '1', label: 'verification-code step' },
						{ value: 'Web', label: 'Google sign-in surface' }
					],
					scene: { type: 'split', label: 'Lamp-lit gateway', title: 'Sign in or begin again', badge: 'Secure access', items: [
						{ title: 'Welcome back', body: 'Email + password', value: 'Sign in' },
						{ title: 'New account', body: 'Verify + create', value: 'Sign up' }
					] }
				},
				journey: ['Turn on the lamp', 'Choose a mode', 'Prove identity', 'Resolve feedback', 'Enter the app'],
				sections: [
					{
						id: 'entry', nav: 'Choose the access path', kicker: 'First decision', title: 'Start with intent, not with a wall of fields.',
						summary: 'The default form welcomes returning members. Sign up and forgot password are deliberate mode changes, so the page can explain the next requirement without mixing competing tasks.',
						points: [
							{ title: 'Sign in', body: 'Use an existing email and password to return.' },
							{ title: 'Sign up', body: 'Verify an email address, then create the account.' },
							{ title: 'Forgot password', body: 'Move into a guided recovery sequence.' }
						],
						note: { title: 'The lamp is a cue', body: 'The pull switch turns the scene from atmospheric to ready without changing the account state.', tone: 'amber' },
						scene: { type: 'cards', label: 'Access modes', title: 'One gateway, three intentions', badge: 'Focused', items: [
							{ title: 'Return', body: 'Known credentials', value: 'Sign in' },
							{ title: 'Begin', body: 'Email verification', value: 'Sign up' },
							{ title: 'Recover', body: 'Reset credentials', value: 'Restore' }
						] }
					},
					{
						id: 'signin', nav: 'Sign in', kicker: 'Returning members', title: 'Submit the smallest complete credential pair.',
						summary: 'Enter the account email and password, reveal the password only when useful, and submit. Loading and error states stay inside the form so the next action remains obvious.',
						points: [
							{ title: 'Email', body: 'Use the address attached to the account.' },
							{ title: 'Password', body: 'Visibility can be toggled before submission.' },
							{ title: 'Feedback', body: 'Authentication errors remain close to the action that produced them.' }
						],
						note: { title: 'Successful access redirects', body: 'After authentication, the gateway hands the session back to the application.', tone: 'green' },
						scene: { type: 'form', label: 'Returning member', title: 'Email + password', badge: 'Ready', items: [
							{ title: 'Email', body: 'Account address', value: 'Required' },
							{ title: 'Password', body: 'Protected input', value: 'Required' },
							{ title: 'Submit', body: 'Authenticate session', value: 'Enter' }
						] }
					},
					{
						id: 'signup', nav: 'Create an account', kicker: 'New members', title: 'Verify the inbox before the account is created.',
						summary: 'Sign up begins with an email code. Once the code is accepted, create a username and a password that satisfies the visible requirements, confirm it, then submit the new account.',
						points: [
							{ title: 'Send code', body: 'Request a time-limited verification code for the email.' },
							{ title: 'Verify', body: 'Enter the code before completing account details.' },
							{ title: 'Create credentials', body: 'Meet the password rules and confirm the same value.' }
						],
						note: { title: 'Requirements are live', body: 'Password guidance changes as the candidate password becomes valid.', tone: 'blue' },
						scene: { type: 'workflow', label: 'Account creation', title: 'Email, code, credentials', badge: 'Verified', items: [
							{ title: 'Email', body: 'Request verification', value: '01' },
							{ title: 'Code', body: 'Confirm ownership', value: '02' },
							{ title: 'Account', body: 'Create credentials', value: '03' }
						] }
					},
					{
						id: 'recovery', nav: 'Recover access', kicker: 'Password reset', title: 'Treat recovery as its own short, explicit journey.',
						summary: 'Forgot password collects the account email, verifies the reset path, and guides the member toward a new credential. Google sign-in is offered only on compatible web or PWA surfaces, not inside the native Tauri app.',
						points: [
							{ title: 'Identify', body: 'Start with the email address for the affected account.' },
							{ title: 'Reset', body: 'Follow the verification path before choosing a replacement password.' },
							{ title: 'Surface awareness', body: 'Google access is hidden where the native shell cannot support it.' }
						],
						note: { title: 'Availability is contextual', body: 'A missing Google button in the desktop app is intentional, not a loading failure.', tone: 'violet' },
						scene: { type: 'timeline', label: 'Recovery sequence', title: 'Identify, verify, restore', badge: 'Guided', items: [
							{ title: 'Identify account', body: 'Enter email', value: '01' },
							{ title: 'Verify request', body: 'Use recovery proof', value: '02' },
							{ title: 'Return', body: 'Sign in again', value: '03' }
						] }
					}
				],
				rules: [
					{ title: 'One intent at a time', body: 'Each access mode reveals only the controls its journey needs.' },
					{ title: 'Verify before creation', body: 'Email ownership is confirmed before account details are accepted.' },
					{ title: 'Visible validation', body: 'Password and request feedback stays beside the active form.' },
					{ title: 'Native boundary', body: 'Google sign-in is available on web and PWA surfaces, not Tauri.' }
				],
				footer: { eyebrow: 'End of Login · Page 11', title: 'Light the path. Prove identity. Enter with confidence.', body: 'Login turns several sensitive access jobs into distinct, understandable sequences.' }
			},
			zh: {
				navigation: '登录', family: '访问', summary: '通过聚焦的灯下入口登录、创建或恢复账户。',
				hero: {
					eyebrow: '登录 · 访问', title: '拉亮灯，然后选择正确的进入方式。',
					summary: '「登录」用一个安静入口服务回归用户、新账户、密码恢复和支持环境中的 Google 登录。每种模式只保留当前任务需要的字段和决定。',
					primaryAction: '选择路径', secondaryAction: '查看访问流程',
					facts: [
						{ value: '3', label: '条邮箱访问路径' },
						{ value: '1', label: '个验证码步骤' },
						{ value: 'Web', label: 'Google 登录界面' }
					],
					scene: { type: 'split', label: '灯下入口', title: '登录或重新开始', badge: '安全访问', items: [
						{ title: '欢迎回来', body: '邮箱 + 密码', value: '登录' },
						{ title: '新账户', body: '验证 + 创建', value: '注册' }
					] }
				},
				journey: ['打开灯', '选择模式', '证明身份', '处理反馈', '进入应用'],
				sections: [
					{
						id: 'entry', nav: '选择访问路径', kicker: '第一个决定', title: '从意图开始，而不是先给出一墙字段。',
						summary: '默认表单欢迎回归用户。注册和忘记密码是明确的模式切换，因此页面可以解释下一步要求，而不把互相竞争的任务混在一起。',
						points: [
							{ title: '登录', body: '使用已有邮箱和密码返回。' },
							{ title: '注册', body: '验证邮箱地址，然后创建账户。' },
							{ title: '忘记密码', body: '进入引导式恢复流程。' }
						],
						note: { title: '灯是一种提示', body: '拉绳把场景从氛围状态切换到准备状态，不会改变账户数据。', tone: 'amber' },
						scene: { type: 'cards', label: '访问模式', title: '一个入口，三种意图', badge: '聚焦', items: [
							{ title: '返回', body: '已有凭据', value: '登录' },
							{ title: '开始', body: '邮箱验证', value: '注册' },
							{ title: '恢复', body: '重置凭据', value: '找回' }
						] }
					},
					{
						id: 'signin', nav: '登录', kicker: '回归用户', title: '提交最小而完整的一组凭据。',
						summary: '输入账户邮箱和密码，只在有帮助时显示密码，然后提交。载入和错误状态都留在表单内，让下一步始终清楚。',
						points: [
							{ title: '邮箱', body: '使用与账户关联的地址。' },
							{ title: '密码', body: '提交前可以切换可见性。' },
							{ title: '反馈', body: '认证错误会留在触发它的操作附近。' }
						],
						note: { title: '成功后会跳转', body: '认证完成后，入口会把会话交还给应用。', tone: 'green' },
						scene: { type: 'form', label: '回归用户', title: '邮箱 + 密码', badge: '准备好', items: [
							{ title: '邮箱', body: '账户地址', value: '必填' },
							{ title: '密码', body: '受保护输入', value: '必填' },
							{ title: '提交', body: '认证会话', value: '进入' }
						] }
					},
					{
						id: 'signup', nav: '创建账户', kicker: '新用户', title: '创建账户前，先验证收件箱。',
						summary: '注册从邮箱验证码开始。验证码通过后，创建用户名和符合可见要求的密码，再次确认，然后提交新账户。',
						points: [
							{ title: '发送验证码', body: '为邮箱请求限时验证码。' },
							{ title: '验证', body: '完成账户详情之前输入验证码。' },
							{ title: '创建凭据', body: '满足密码规则，并确认相同内容。' }
						],
						note: { title: '要求会实时变化', body: '候选密码逐渐有效时，密码指引会同步响应。', tone: 'blue' },
						scene: { type: 'workflow', label: '账户创建', title: '邮箱、验证码、凭据', badge: '已验证', items: [
							{ title: '邮箱', body: '请求验证', value: '01' },
							{ title: '验证码', body: '确认所有权', value: '02' },
							{ title: '账户', body: '创建凭据', value: '03' }
						] }
					},
					{
						id: 'recovery', nav: '恢复访问', kicker: '密码重置', title: '把恢复当作一条独立、简短、明确的旅程。',
						summary: '忘记密码会收集账户邮箱、验证重置路径，并引导用户设置新凭据。Google 登录只在兼容的 Web 或 PWA 界面提供，不会出现在原生 Tauri 应用中。',
						points: [
							{ title: '识别', body: '先输入受影响账户的邮箱地址。' },
							{ title: '重置', body: '通过验证路径后，再选择替代密码。' },
							{ title: '界面感知', body: '原生外壳不支持时，Google 入口会被隐藏。' }
						],
						note: { title: '可用性取决于环境', body: '桌面应用里没有 Google 按钮是有意设计，不是载入失败。', tone: 'violet' },
						scene: { type: 'timeline', label: '恢复顺序', title: '识别、验证、恢复', badge: '引导式', items: [
							{ title: '识别账户', body: '输入邮箱', value: '01' },
							{ title: '验证请求', body: '使用恢复证明', value: '02' },
							{ title: '返回', body: '重新登录', value: '03' }
						] }
					}
				],
				rules: [
					{ title: '一次一个意图', body: '每种访问模式只展示该旅程需要的控件。' },
					{ title: '创建前验证', body: '接受账户详情前，先确认邮箱所有权。' },
					{ title: '可见验证', body: '密码和请求反馈留在当前表单旁边。' },
					{ title: '原生边界', body: 'Google 登录适用于 Web 和 PWA，不适用于 Tauri。' }
				],
				footer: { eyebrow: '登录结束 · 页面 11', title: '照亮路径，证明身份，安心进入。', body: '「登录」把多个敏感的访问任务拆成独立、易懂的流程。' }
			}
		}
	},
	{
		id: 'patch', order: '12', icon: 'icon-patch', accent: '139, 92, 246', generated: true,
		captures: {
			modes: [
				{ src: 'assets/images/patch/sprint-ledger-live.jpg', layout: 'wide', label: { en: 'Sprint Notes ledger', zh: '冲刺记录账本' }, alt: { en: 'Real Patch Notes Sprint view with loaded change records', zh: '真实的补丁记录冲刺视图，显示已载入的变更记录' }, caption: { en: 'Sprint Notes presents granular records in the running table.', zh: '冲刺记录在真实表格中呈现细粒度变更。' } },
				{ src: 'assets/images/patch/release-story-live.jpg', layout: 'wide', label: { en: 'Published release story', zh: '已发布版本故事' }, alt: { en: 'Real Patch Notes Release view with the latest published release', zh: '真实的补丁记录版本视图，显示最新发布版本' }, caption: { en: 'Release Notes regroup the same history into a readable product narrative.', zh: '版本记录把同一段历史重新组织为易读的产品叙事。' } },
				{ src: 'assets/images/patch/loading-skeleton-live.jpg', layout: 'wide', label: { en: 'Sprint ledger loading', zh: '冲刺账本加载中' }, alt: { en: 'Real Sprint Notes table showing skeleton rows beneath the live column headers', zh: '真实的冲刺记录表格，在实际列标题下显示骨架行' }, caption: { en: 'The table keeps its real header and column widths while the records download, so nothing shifts when they arrive.', zh: '记录下载期间表格保留真实的标题与列宽，因此数据到达时布局不会跳动。' } },
				{ src: 'assets/images/patch/release-loading-live.jpg', layout: 'wide', label: { en: 'Release hero loading', zh: '版本头图加载中' }, alt: { en: 'Real Release Notes hero drawn as skeleton blocks for badge, title, date, summary, and sections', zh: '真实的版本记录头图以骨架块呈现徽标、标题、日期、摘要与分节' }, caption: { en: 'Switching to Release Notes first shows the shape it will fill: badge, title, date, summary, then the coloured section blocks.', zh: '切换到版本记录时先显示其最终结构：徽标、标题、日期、摘要，随后是彩色分节块。' } },
				{ src: 'assets/images/patch/release-expanded-live.jpg', layout: 'wide', label: { en: 'Expanded previous release', zh: '展开的历史版本' }, alt: { en: 'Real Release Notes row expanded to show New, Improved, Fixed, and Notes sections with their entries', zh: '真实的版本记录行展开后显示新增、改进、修复与备注分节及其条目' }, caption: { en: 'Selecting an earlier release opens its full record in place: the counts stay in the header row while New, Improved, Fixed, and Notes list every change.', zh: '选择历史版本即可就地展开其完整记录：数量保留在标题行，新增、改进、修复与备注则列出全部变更。' } }
			],
			find: [
				{ src: 'assets/images/patch/search-live.jpg', layout: 'wide', label: { en: 'Search narrowed to Reminder', zh: '搜索缩小到提醒' }, alt: { en: 'Real Sprint Notes table filtered by the search term Reminder', zh: '真实的冲刺记录表格，按 Reminder 搜索词筛选' }, caption: { en: 'Search narrows over one thousand records while retaining their table context.', zh: '搜索在保留表格上下文的同时缩小上千条记录。' } },
				{ src: 'assets/images/patch/status-filter-live.jpg', layout: 'wide', label: { en: 'Status filter menu', zh: '状态筛选菜单' }, alt: { en: 'Real Sprint Notes status filter with all available states', zh: '真实的冲刺记录状态筛选，显示全部可用状态' }, caption: { en: 'The live filter exposes To Do, In Progress, Completed, Draft, Debug, and Resolved.', zh: '真实筛选展示待办、进行中、已完成、草稿、调试和已解决状态。' } },
				{ src: 'assets/images/patch/empty-search-live.jpg', layout: 'wide', label: { en: 'Search with no matches', zh: '搜索无匹配结果' }, alt: { en: 'Real Sprint Notes table showing the empty-result row with its note icon and message', zh: '真实的冲刺记录表格，显示带便签图标与提示文字的空结果行' }, caption: { en: 'A query matching nothing keeps the table and its add row in place, stating the outcome instead of emptying the page.', zh: '无匹配的查询仍保留表格与新增行，直接说明结果而非清空页面。' } }
			],
			signals: [
				{ src: 'assets/images/patch/sprint-ledger-live.jpg', layout: 'wide', label: { en: 'Patch totals and resolved count', zh: '补丁总数与已解决数量' }, alt: { en: 'Real Sprint Notes header with total records and bug-resolution signals', zh: '真实的冲刺记录页头，显示记录总数和缺陷解决信号' }, caption: { en: 'The header summarizes scale and current status before the detailed ledger.', zh: '页头在详细账本前概括规模和当前状态。' } },
				{ src: 'assets/images/patch/heatmap-live.jpg', layout: 'wide', label: { en: 'Read the activity heatmap', zh: '读懂活动热力图' }, alt: { en: 'Real Patch heatmap popover with a less-to-more legend and a year by month grid of logged counts', zh: '真实的补丁热力图浮层，显示由少到多的图例以及按年份与月份排列的记录数量网格' }, caption: { en: 'Opening the total chip explains the rhythm behind the records: colour depth is volume, future months stay dimmed, and the footer states the span being summarized.', zh: '打开总数标签即可看见记录背后的节奏：颜色深浅代表数量，未来月份保持暗色，页脚说明所汇总的时间跨度。' } }
			],
			manage: [
				{ src: 'assets/images/patch/status-filter-live.jpg', layout: 'wide', label: { en: 'Maintainer controls in context', zh: '上下文中的维护控件' }, alt: { en: 'Real Sprint Notes table with status filtering and row edit controls', zh: '真实的冲刺记录表格，显示状态筛选和行编辑控件' }, caption: { en: 'Filtering and row-level edit controls remain attached to the record surface; saving was not invoked.', zh: '筛选和行级编辑控件紧贴记录界面；本次未触发保存。' } },
				{ src: 'assets/images/patch/inline-edit-live.jpg', layout: 'wide', label: { en: 'Row editor open', zh: '行编辑器已打开' }, alt: { en: 'Real Sprint Notes row in edit mode with a details textarea, status dropdown, and confirm and delete buttons', zh: '真实的冲刺记录行处于编辑状态，包含详情文本框、状态下拉菜单以及确认与删除按钮' }, caption: { en: 'Editing happens in place: a details textarea and status dropdown replace the read-only cells, with confirm and delete beside them. Nothing was saved for this capture.', zh: '编辑就地进行：详情文本框与状态下拉菜单取代只读单元格，确认与删除按钮位于其旁。本次拍摄未保存任何内容。' } },
				{ src: 'assets/images/patch/add-row-live.jpg', layout: 'wide', label: { en: 'New-record footer row', zh: '新增记录页脚行' }, alt: { en: 'Real Sprint Notes footer row with component select, element field, details textarea, status select, and Add button', zh: '真实的冲刺记录页脚行，包含组件选择、元素字段、详情文本框、状态选择与新增按钮' }, caption: { en: 'The footer form appears on the final page and mirrors the table columns, so a new record is entered in the same shape it will be read.', zh: '页脚表单出现在最后一页并与表格列一一对应，因此新记录以其将被阅读的形式录入。' } }
			]
		},
		copy: {
			en: {
				navigation: 'Patch Notes', family: 'Change history', summary: 'Search granular patches or read releases as a coherent story of the product.',
				hero: {
					eyebrow: 'Patch Notes · Change history', title: 'Read one change closely, or step back and see the release.',
					summary: 'Patch Notes has two deliberate reading scales. Patch view is a searchable operational ledger; Release view gathers changes into a curated edition with a hero, summary, and expandable history.',
					primaryAction: 'Browse changes', secondaryAction: 'Understand both views',
					facts: [
						{ value: '2', label: 'reading modes' },
						{ value: '5', label: 'patch filters' },
						{ value: '1', label: 'activity heatmap' }
					],
					scene: { type: 'split', label: 'Change journal', title: 'Patch ledger / release story', badge: 'Living history', items: [
						{ title: 'Patch', body: 'Search, filter, inspect', value: 'Detailed' },
						{ title: 'Release', body: 'Highlights and editions', value: 'Curated' }
					] }
				},
				journey: ['Choose a scale', 'Find a change', 'Read its context', 'Inspect activity', 'Follow the release'],
				sections: [
					{
						id: 'modes', nav: 'Choose Patch or Release', kicker: 'Two reading scales', title: 'Use Patch for evidence and Release for narrative.',
						summary: 'Patch view answers exactly what changed, where, and when. Release view explains the larger edition: headline improvements, grouped highlights, and the sequence of earlier releases.',
						points: [
							{ title: 'Patch view', body: 'Granular records with component, element, details, status, and time.' },
							{ title: 'Release view', body: 'A hero release and a browsable archive of prior editions.' },
							{ title: 'Shared history', body: 'Both views interpret the same product evolution at different scales.' }
						],
						note: { title: 'The toggle changes the question', body: 'Switch modes according to whether you need an audit trail or an overview.', tone: 'violet' },
						scene: { type: 'cards', label: 'Reading modes', title: 'Detail beside direction', badge: '2 views', items: [
							{ title: 'What changed?', body: 'Patch record', value: 'Patch' },
							{ title: 'What shipped?', body: 'Edition story', value: 'Release' }
						] }
					},
					{
						id: 'find', nav: 'Find a patch', kicker: 'Search and filters', title: 'Narrow a long history without losing its structure.',
						summary: 'Search across patch content, then filter by component, element, status, or time. Pagination keeps the ledger readable while the result count makes the current scope explicit.',
						points: [
							{ title: 'Search', body: 'Find words across the visible patch record.' },
							{ title: 'Facet filters', body: 'Combine component, element, status, and date constraints.' },
							{ title: 'Pagination', body: 'Move through matching records without rendering the whole history at once.' }
						],
						note: { title: 'Filters describe the current lens', body: 'Clear or adjust them before assuming an older change is absent.', tone: 'blue' },
						scene: { type: 'table', label: 'Patch ledger', title: 'Component · element · status', badge: 'Filtered', items: [
							{ title: 'Reminder', body: 'Card completion', value: 'Done' },
							{ title: 'Vault', body: 'Graph filters', value: 'Done' },
							{ title: 'Recipe', body: 'Serving scale', value: 'Done' }
						] }
					},
					{
						id: 'signals', nav: 'Read activity signals', kicker: 'Stats and heatmap', title: 'See the rhythm behind the individual records.',
						summary: 'Summary statistics show the size and status of the patch set. The activity heatmap reveals when work landed, making clusters and quiet periods visible without replacing the underlying entries.',
						points: [
							{ title: 'Totals', body: 'Read high-level counts before drilling into rows.' },
							{ title: 'Status mix', body: 'Understand how records are distributed across workflow states.' },
							{ title: 'Heatmap', body: 'Scan contribution density over time.' }
						],
						note: { title: 'A heatmap is a locator', body: 'Use it to spot periods worth inspecting, then return to the patch details.', tone: 'green' },
						scene: { type: 'calendar', label: 'Activity field', title: 'Change density by day', badge: 'Year view', items: [
							{ title: 'Recent', body: 'Dense improvement cycle', value: 'High' },
							{ title: 'Earlier', body: 'Foundation work', value: 'Steady' },
							{ title: 'Quiet', body: 'Stable interval', value: 'Low' }
						] }
					},
					{
						id: 'manage', nav: 'Curate the record', kicker: 'Maintainer actions', title: 'Keep the history useful as the product moves.',
						summary: 'Authorized maintainers can add, edit, and remove patch records. In Release view, the current edition leads with a hero while earlier editions expand on demand, preserving chronology without overwhelming the page.',
						points: [
							{ title: 'Add', body: 'Record the component, element, details, status, and timestamp.' },
							{ title: 'Edit or delete', body: 'Correct the ledger through explicit maintainer controls.' },
							{ title: 'Release archive', body: 'Expand earlier editions only when their detail is needed.' }
						],
						note: { title: 'History needs curation', body: 'A concise, accurate entry is more valuable than a vague volume of change text.', tone: 'amber' },
						scene: { type: 'timeline', label: 'Release archive', title: 'Current edition above prior releases', badge: 'Chronological', items: [
							{ title: 'Current', body: 'Hero and highlights', value: 'Open' },
							{ title: 'Previous', body: 'Expandable edition', value: 'Archive' },
							{ title: 'Foundation', body: 'Earliest release', value: 'Archive' }
						] }
					}
				],
				rules: [
					{ title: 'Patch is granular', body: 'Use it when the exact component, element, status, or date matters.' },
					{ title: 'Release is editorial', body: 'Use it to understand the edition as a coherent product step.' },
					{ title: 'Filters compound', body: 'Several active filters can narrow the ledger more than expected.' },
					{ title: 'Edits are privileged', body: 'Record-management actions belong to authorized maintainers.' }
				],
				footer: { eyebrow: 'End of Patch Notes · Page 12', title: 'Track the detail. Preserve the story.', body: 'Patch Notes makes product change both inspectable and memorable.' }
			},
			zh: {
				navigation: '日志', family: '变更历史', summary: '搜索细粒度补丁，或把版本当作完整的产品故事阅读。',
				hero: {
					eyebrow: '日志 · 变更历史', title: '可以细读一个变化，也可以退一步看整个版本。',
					summary: '「日志」提供两种刻意区分的阅读尺度。「补丁」是可搜索的操作台账；「版本」把变化整理成有主视觉、摘要和可展开历史的完整一期。',
					primaryAction: '浏览变化', secondaryAction: '理解两种视图',
					facts: [
						{ value: '2', label: '种阅读模式' },
						{ value: '5', label: '项补丁筛选' },
						{ value: '1', label: '张活动热力图' }
					],
					scene: { type: 'split', label: '变更日志', title: '补丁台账 / 版本故事', badge: '持续生长的历史', items: [
						{ title: '补丁', body: '搜索、筛选、检查', value: '详细' },
						{ title: '版本', body: '亮点与每一期', value: '策展' }
					] }
				},
				journey: ['选择尺度', '找到变化', '阅读上下文', '检查活动', '追随版本'],
				sections: [
					{
						id: 'modes', nav: '选择补丁或版本', kicker: '两种阅读尺度', title: '用补丁寻找证据，用版本理解叙事。',
						summary: '「补丁」回答具体改了什么、在哪里、何时发生。「版本」解释更大的一期：标题级改进、分组亮点和旧版本顺序。',
						points: [
							{ title: '补丁视图', body: '包含组件、元素、详情、状态和时间的细粒度记录。' },
							{ title: '版本视图', body: '主版本视觉和可浏览的历史版本档案。' },
							{ title: '共享历史', body: '两种视图以不同尺度解释同一段产品演化。' }
						],
						note: { title: '切换会改变问题', body: '根据需要审计轨迹还是总体理解来选择模式。', tone: 'violet' },
						scene: { type: 'cards', label: '阅读模式', title: '细节与方向并列', badge: '2 个视图', items: [
							{ title: '改了什么？', body: '补丁记录', value: '补丁' },
							{ title: '发布了什么？', body: '每期故事', value: '版本' }
						] }
					},
					{
						id: 'find', nav: '查找补丁', kicker: '搜索与筛选', title: '缩小漫长历史，同时保留它的结构。',
						summary: '跨补丁内容搜索，再按组件、元素、状态或时间筛选。分页保持台账可读，结果数量则明确当前范围。',
						points: [
							{ title: '搜索', body: '在可见补丁记录中寻找文字。' },
							{ title: '维度筛选', body: '组合组件、元素、状态和日期约束。' },
							{ title: '分页', body: '浏览匹配记录，无需一次渲染全部历史。' }
						],
						note: { title: '筛选定义当前视角', body: '判断旧变化不存在前，先清除或调整筛选。', tone: 'blue' },
						scene: { type: 'table', label: '补丁台账', title: '组件 · 元素 · 状态', badge: '已筛选', items: [
							{ title: '提醒', body: '卡片完成', value: '完成' },
							{ title: '保险箱', body: '图谱筛选', value: '完成' },
							{ title: '食谱', body: '份量缩放', value: '完成' }
						] }
					},
					{
						id: 'signals', nav: '阅读活动信号', kicker: '统计与热力图', title: '看见单条记录背后的节奏。',
						summary: '摘要统计展示补丁集的规模和状态。活动热力图揭示工作何时落地，让密集与安静时期变得可见，但不会取代底层条目。',
						points: [
							{ title: '总数', body: '深入行记录前，先阅读高层数量。' },
							{ title: '状态组合', body: '理解记录如何分布在各工作流状态。' },
							{ title: '热力图', body: '扫描一段时间内的贡献密度。' }
						],
						note: { title: '热力图是定位器', body: '用它找到值得检查的时期，再回到补丁详情。', tone: 'green' },
						scene: { type: 'calendar', label: '活动场', title: '按日查看变化密度', badge: '年度视图', items: [
							{ title: '近期', body: '密集改进周期', value: '高' },
							{ title: '早期', body: '基础工作', value: '稳定' },
							{ title: '安静', body: '稳定间隔', value: '低' }
						] }
					},
					{
						id: 'manage', nav: '维护记录', kicker: '维护者操作', title: '让历史在产品前进时仍然有用。',
						summary: '有权限的维护者可以添加、编辑和删除补丁记录。在版本视图中，当前一期以主视觉领先，较早版本按需展开，既保留时间顺序又不压垮页面。',
						points: [
							{ title: '添加', body: '记录组件、元素、详情、状态和时间戳。' },
							{ title: '编辑或删除', body: '通过明确的维护控件修正台账。' },
							{ title: '版本档案', body: '只有需要细节时才展开早期版本。' }
						],
						note: { title: '历史需要策展', body: '简洁准确的条目，比大量含糊变更文字更有价值。', tone: 'amber' },
						scene: { type: 'timeline', label: '版本档案', title: '当前一期位于旧版本之上', badge: '时间顺序', items: [
							{ title: '当前', body: '主视觉与亮点', value: '展开' },
							{ title: '上一期', body: '可展开版本', value: '档案' },
							{ title: '奠基期', body: '最早版本', value: '档案' }
						] }
					}
				],
				rules: [
					{ title: '补丁是细粒度的', body: '当具体组件、元素、状态或日期重要时使用。' },
					{ title: '版本是编辑化的', body: '用它把一期理解为完整的产品步伐。' },
					{ title: '筛选会叠加', body: '多个活动筛选可能让台账比预期更窄。' },
					{ title: '编辑需要权限', body: '记录管理操作属于获授权的维护者。' }
				],
				footer: { eyebrow: '日志结束 · 页面 12', title: '追踪细节，保存故事。', body: '「日志」让产品变化既可检查，也可记忆。' }
			}
		}
	},
	{
		id: 'about', order: '13', icon: 'icon-about', accent: '14, 116, 144', generated: true,
		captures: {
			orientation: [
				{ src: 'assets/images/about/orientation-stats-live.jpg', layout: 'wide', label: { en: 'Product and creator orientation', zh: '产品与创作者定位' }, alt: { en: 'Real About page with its purpose statement and current timeline', zh: '真实的关于页面，显示定位说明和当前时间线' }, caption: { en: 'The page opens with the product’s personal purpose before presenting the history behind it.', zh: '页面先说明产品的个人目的，再呈现背后的历史。' } }
			],
			status: [
				{ src: 'assets/images/about/about-status-live.png', layout: 'wide', label: { en: 'Read the freshness signal', zh: '阅读内容新鲜度提示' }, alt: { en: 'Real About page status chip showing its last updated month', zh: '真实的关于页面状态标签，显示最近更新月份' }, caption: { en: 'The green dot and month describe the About content’s freshness; they are informational, not interactive.', zh: '绿色圆点与月份说明「关于」内容的新鲜度；它们是信息提示，不是交互控件。' } }
			],
			stats: [
				{ src: 'assets/images/about/orientation-stats-live.jpg', layout: 'wide', label: { en: 'Quick experience figures', zh: '快速经历数字' }, alt: { en: 'Real About page with its six summary statistics', zh: '真实的关于页面，显示六项概览统计' }, caption: { en: 'Six compact figures establish the scale of the experience described below.', zh: '六项紧凑数字建立下方经历的规模感。' } }
			],
			milestones: [
				{ src: 'assets/images/about/about-milestones-01-03-live.jpg', layout: 'wide', label: { en: 'Milestones 1–3 · current work to graduate study', zh: '里程碑 1–3 · 当前工作至硕士学习' }, alt: { en: 'Real About timeline showing Self-employed, Software Developer, and Master Student milestones', zh: '真实的关于页时间线，显示自由职业者、软件开发人员和硕士生里程碑' }, caption: { en: 'The first half records current independent work, the preceding software role, and graduate study with dates, places, and full notes always visible.', zh: '前半段记录当前独立工作、此前的软件职位与硕士学习；日期、地点和完整说明始终可见。' } },
				{ src: 'assets/images/about/about-milestones-04-06-live.jpg', layout: 'wide', label: { en: 'Milestones 4–6 · undergraduate and co-op foundations', zh: '里程碑 4–6 · 本科与带薪实习基础' }, alt: { en: 'Real About timeline showing final-year Bachelor Student, Co-op Student, and earlier Bachelor Student milestones', zh: '真实的关于页时间线，显示本科毕业年、带薪实习与早期本科生里程碑' }, caption: { en: 'The second half completes the chronology with final-year study, the CRA co-op period, and the earlier undergraduate foundation.', zh: '后半段用本科毕业年、CRA 带薪实习阶段和早期本科学习补完整段时间顺序。' } },
				{ src: 'assets/images/about/about-milestone-hover-live.jpg', layout: 'wide', label: { en: 'Hover emphasis beside plain neighbours', zh: '悬停强调与普通相邻条目对比' }, alt: { en: 'Real About timeline with the middle milestone hovered, its node filled and its card shifted, between two unhovered milestones', zh: '真实的关于页时间线，中间里程碑处于悬停状态，节点填充、卡片位移，上下为未悬停的里程碑' }, caption: { en: 'The hovered milestone fills its node and shifts its card; the entries above and below stay flat. Title, period, place, and notes stay readable in all three, so the emphasis adds nothing and hides nothing.', zh: '悬停的里程碑节点被填充、卡片发生位移；上下条目保持平面。三者的标题、时间、地点与说明始终可读，因此强调既不增加也不隐藏信息。' } }
			]
		},
		copy: {
			en: {
				navigation: 'About', family: 'Product story', summary: 'Read the system status, product scale, and milestone history in one calm overview.',
				hero: {
					eyebrow: 'About · Product story', title: 'See what the application is, how it is doing, and how it arrived here.',
					summary: 'About is a read-only orientation page. It combines a current status signal, concise experience statistics, and a chronological milestone timeline so the project can explain itself without becoming another control surface.',
					primaryAction: 'Read the overview', secondaryAction: 'Follow the timeline',
					facts: [
						{ value: 'Live', label: 'system status' },
						{ value: '3', label: 'quick-stat lenses' },
						{ value: '1', label: 'chronological timeline' }
					],
					scene: { type: 'timeline', label: 'Project signal', title: 'Status, scale, milestones', badge: 'Read-only', items: [
						{ title: 'Foundation', body: 'Core collections', value: 'Then' },
						{ title: 'Expansion', body: 'Connected workflows', value: 'Growth' },
						{ title: 'Current', body: 'Living system', value: 'Now' }
					] }
				},
				journey: ['Start with the overview', 'Read the mission', 'Check the signal', 'Scan the scale', 'Read every milestone'],
				sections: [
					{
						id: 'orientation', nav: 'Understand the product', kicker: 'Orientation', title: 'Begin with the purpose before counting the parts.',
						summary: 'The opening explains Accomplishment as a personal system for remembering, organizing, and reflecting. It frames the collections as one connected life interface rather than a bundle of unrelated utilities.',
						points: [
							{ title: 'Purpose', body: 'Keep daily memory and practical work in one deliberate system.' },
							{ title: 'Character', body: 'Editorial warmth sits beside operational clarity.' },
							{ title: 'Scope', body: 'Several page types contribute to the same personal record.' }
						],
						note: { title: 'This page does not configure the app', body: 'It provides context, provenance, and confidence before you return to active work.', tone: 'blue' },
						scene: { type: 'orbit', label: 'Product constellation', title: 'Many collections, one memory', badge: 'Accomplishment', items: [
							{ title: 'Remember', body: 'Reminders and Today', value: 'Daily' },
							{ title: 'Collect', body: 'Vault, Portal, Recipe', value: 'Reference' },
							{ title: 'Reflect', body: 'Resonance and history', value: 'Meaning' }
						] }
					},
					{
						id: 'status', nav: 'Check system status', kicker: 'Current signal', title: 'Read health at a glance without a dashboard detour.',
						summary: 'A compact status block communicates whether the experience is operating normally. It is intentionally prominent enough to notice and quiet enough not to compete with the product story.',
						points: [
							{ title: 'State', body: 'A direct health label communicates the current condition.' },
							{ title: 'Context', body: 'Supporting copy explains what that state means for the visitor.' },
							{ title: 'Read-only', body: 'There is no control to change system state from this page.' }
						],
						note: { title: 'Status is a promise of clarity', body: 'If the signal changes, the language should be as direct as the color.', tone: 'green' },
						scene: { type: 'cards', label: 'System health', title: 'Current operating signal', badge: 'Online', items: [
							{ title: 'Application', body: 'Available', value: 'Healthy' },
							{ title: 'Collections', body: 'Ready to open', value: 'Active' }
						] }
					},
					{
						id: 'stats', nav: 'Scan quick stats', kicker: 'Product scale', title: 'Use a few numbers to establish proportion, not performance theater.',
						summary: 'Quick-stat cards summarize meaningful dimensions of the product. They provide a compact sense of breadth before the milestone timeline supplies chronology and detail.',
						points: [
							{ title: 'Concise', body: 'Only a small set of useful measurements earns a card.' },
							{ title: 'Labeled', body: 'Every number states what is being counted.' },
							{ title: 'Contextual', body: 'Stats support the story instead of acting as goals.' }
						],
						note: { title: 'Numbers need nouns', body: 'A count without a clear label does not help someone understand the product.', tone: 'amber' },
						scene: { type: 'dashboard', label: 'Quick stats', title: 'A compact view of scale', badge: 'At a glance', items: [
							{ title: 'Pages', body: 'Distinct workflows', value: '13' },
							{ title: 'Languages', body: 'Guide editions', value: '2' },
							{ title: 'Timeline', body: 'Milestone narrative', value: '1' }
						] }
					},
					{
						id: 'milestones', nav: 'Read every milestone', kicker: 'Chronological history', title: 'Follow the experiences that shaped the system.',
						summary: 'The timeline keeps every title, period, place, and explanation visible. Read all six entries in order; pointer hover only emphasizes the current card and node and never hides or reveals information.',
						points: [
							{ title: 'Scroll', body: 'Move through all six entries from current work to the earliest degree period.' },
							{ title: 'Read', body: 'Keep each title, date, location, category, and explanation together.' },
							{ title: 'Emphasis', body: 'On pointer devices, hover gently highlights a node and card without changing the content.' }
						],
						note: { title: 'Touch users lose no information', body: 'Hover is decorative emphasis only; every milestone remains fully readable without it.', tone: 'violet' },
						scene: { type: 'timeline', label: 'Milestone path', title: 'Foundation to living system', badge: 'Chronological', items: [
							{ title: 'Foundation', body: 'Core identity and collections', value: '01' },
							{ title: 'Connection', body: 'Shared and linked workflows', value: '02' },
							{ title: 'Refinement', body: 'A cohesive visual system', value: '03' }
						] }
					}
				],
				rules: [
					{ title: 'Read-only by design', body: 'About explains the system and does not modify it.' },
					{ title: 'Status stays explicit', body: 'Health should be understandable through words as well as color.' },
					{ title: 'Stats provide proportion', body: 'They summarize scale without turning the page into analytics.' },
					{ title: 'Milestones carry detail', body: 'The timeline is where the short overview becomes a product history.' }
				],
				footer: { eyebrow: 'End of About · Page 13', title: 'Know the system, then return to it with context.', body: 'About closes the guide with status, scale, and the path that made the product recognizable.' }
			},
			zh: {
				navigation: '关于', family: '产品故事', summary: '在一个安静总览中阅读系统状态、产品规模和里程碑历史。',
				hero: {
					eyebrow: '关于 · 产品故事', title: '了解应用是什么、现在如何，以及如何走到这里。',
					summary: '「关于」是一个只读的定位页面。它结合当前状态信号、简洁经历统计和按时间排列的里程碑时间线，让项目解释自己，而不会变成另一个控制界面。',
					primaryAction: '阅读总览', secondaryAction: '跟随时间线',
					facts: [
						{ value: 'Live', label: '系统状态' },
						{ value: '3', label: '个快速统计视角' },
						{ value: '1', label: '条时间顺序线' }
					],
					scene: { type: 'timeline', label: '项目信号', title: '状态、规模、里程碑', badge: '只读', items: [
						{ title: '奠基', body: '核心集合', value: '过去' },
						{ title: '扩展', body: '连接的工作流', value: '成长' },
						{ title: '当前', body: '持续生长的系统', value: '现在' }
					] }
				},
				journey: ['从总览开始', '阅读使命', '检查信号', '扫描规模', '读完每个里程碑'],
				sections: [
					{
						id: 'orientation', nav: '理解产品', kicker: '定位', title: '先理解目的，再清点组成部分。',
						summary: '开篇说明 Accomplishment 是一套用于记忆、组织与反思的个人系统。它把各个集合框定为一个连接的生活界面，而不是一包互不相关的工具。',
						points: [
							{ title: '目的', body: '把日常记忆和实际工作放进一套有意设计的系统。' },
							{ title: '性格', body: '编辑式温度与操作清晰度并存。' },
							{ title: '范围', body: '多种页面类型共同组成同一份个人记录。' }
						],
						note: { title: '这个页面不配置应用', body: '它提供上下文、来历与信心，然后让你回到主动工作。', tone: 'blue' },
						scene: { type: 'orbit', label: '产品星系', title: '多个集合，一份记忆', badge: 'Accomplishment', items: [
							{ title: '记住', body: '提醒与今日', value: '日常' },
							{ title: '收集', body: '保险箱、链接、食谱', value: '参考' },
							{ title: '反思', body: '语录与历史', value: '意义' }
						] }
					},
					{
						id: 'status', nav: '检查系统状态', kicker: '当前信号', title: '一眼读取健康度，无需绕进仪表盘。',
						summary: '紧凑的状态区会说明体验是否正常运行。它足够醒目，能被注意到，又足够安静，不会与产品故事争夺注意力。',
						points: [
							{ title: '状态', body: '直接的健康标签传达当前情况。' },
							{ title: '上下文', body: '辅助文字解释该状态对访问者意味着什么。' },
							{ title: '只读', body: '这个页面没有用于改变系统状态的控件。' }
						],
						note: { title: '状态承诺清晰', body: '如果信号变化，文字应当和颜色一样直接。', tone: 'green' },
						scene: { type: 'cards', label: '系统健康', title: '当前运行信号', badge: '在线', items: [
							{ title: '应用', body: '可以访问', value: '健康' },
							{ title: '集合', body: '可以打开', value: '活动' }
						] }
					},
					{
						id: 'stats', nav: '扫描快速统计', kicker: '产品规模', title: '用少量数字建立比例感，而不是制造表演。',
						summary: '快速统计卡总结产品有意义的维度。它们先提供紧凑的广度感，再由里程碑时间线补充时间顺序和细节。',
						points: [
							{ title: '简洁', body: '只有少量有用的度量值得成为卡片。' },
							{ title: '有标签', body: '每个数字都说明它在数什么。' },
							{ title: '有上下文', body: '统计支持故事，而不是成为目标。' }
						],
						note: { title: '数字需要名词', body: '没有清楚标签的数量，无法帮助人理解产品。', tone: 'amber' },
						scene: { type: 'dashboard', label: '快速统计', title: '紧凑的规模视图', badge: '一眼了解', items: [
							{ title: '页面', body: '独立工作流', value: '13' },
							{ title: '语言', body: '指南版本', value: '2' },
							{ title: '时间线', body: '里程碑叙事', value: '1' }
						] }
					},
					{
						id: 'milestones', nav: '阅读每个里程碑', kicker: '时间顺序历史', title: '跟随塑造这套系统的经历。',
						summary: '时间线始终显示每条经历的标题、时期、地点和说明。按顺序读完六条记录；指针悬停只会强调当前卡片与节点，不会隐藏或显示信息。',
						points: [
							{ title: '滚动', body: '从当前工作一路阅读到最早的学位阶段，共六条记录。' },
							{ title: '阅读', body: '把每条记录的标题、日期、地点、类别和说明放在一起理解。' },
							{ title: '强调', body: '在指针设备上，悬停只会轻微突出节点和卡片，不改变内容。' }
						],
						note: { title: '触摸用户不会丢失信息', body: '悬停只是装饰性强调；没有悬停时，每条里程碑仍然完整可读。', tone: 'violet' },
						scene: { type: 'timeline', label: '里程碑路径', title: '从奠基到持续生长的系统', badge: '按时间排列', items: [
							{ title: '奠基', body: '核心身份与集合', value: '01' },
							{ title: '连接', body: '共享与关联工作流', value: '02' },
							{ title: '打磨', body: '统一的视觉系统', value: '03' }
						] }
					}
				],
				rules: [
					{ title: '刻意只读', body: '「关于」解释系统，不修改系统。' },
					{ title: '状态保持明确', body: '健康度应当通过文字和颜色同时被理解。' },
					{ title: '统计提供比例', body: '它们总结规模，而不会把页面变成分析面板。' },
					{ title: '里程碑承载细节', body: '时间线让简短总览成为一段产品历史。' }
				],
				footer: { eyebrow: '关于结束 · 页面 13', title: '理解系统，然后带着上下文回到其中。', body: '「关于」用状态、规模和形成产品的路径为指南收尾。' }
			}
		}
	}
];
