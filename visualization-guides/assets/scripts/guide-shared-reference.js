(() => {
	window.VISION_GUIDE_PAGES.push({
		id: 'messages',
		order: '14',
		icon: 'icon-alert',
		accent: '185, 28, 28',
		generated: true,
		captures: {
			access: [{
				scenario: 0,
				src: 'assets/images/login/sign-in-live.jpg',
				presentation: 'side-by-side',
				label: { en: 'Signed-out recovery route', zh: '退出登录后的恢复入口' },
				caption: { en: 'Fresh navigation to a protected route returns the signed-out visitor to Login. Sign in, then revisit the intended page.', zh: '退出登录后新访问受保护路由，会回到登录页。完成登录后，再重新进入目标页面。' },
				alt: { en: 'Focused real Login form shown after a signed-out protected-route visit', zh: '退出登录后访问受保护路由时显示的真实聚焦登录表单' },
				annotations: [{ text: { en: 'Authenticate here, then reopen the protected page', zh: '先在这里验证身份，再重新打开受保护页面' }, position: 'lower-left', tone: 'rose' }],
				annotationLayout: 'margin'
			}],
			confirm: [{
				scenario: 0,
				src: 'assets/images/reminder/complete-dialog-live.jpg',
				presentation: 'side-by-side',
				label: { en: 'Real protected-write confirmation', zh: '真实受保护写入确认框' },
				caption: { en: 'The shared pattern names the consequence and offers Cancel plus one explicit action. The owning page supplies the exact wording.', zh: '通用模式会写明后果，并提供「取消」与一个明确操作；具体措辞由所属页面提供。' },
				alt: { en: 'Focused real confirmation dialog from a protected Reminder write', zh: '提醒受保护写入中显示的真实聚焦确认对话框' },
				annotations: [{ text: { en: 'Read the consequence before the colored action', zh: '执行彩色操作前先阅读后果' }, position: 'lower-left', tone: 'amber' }],
				annotationLayout: 'margin'
			}],
			errors: [{
				scenario: 0,
				src: 'assets/images/recipe/permission-dialog-live.jpg',
				presentation: 'side-by-side',
				label: { en: 'Real permission boundary', zh: '真实权限边界' },
				caption: { en: 'A permission error stops the requested action. Closing the dialog acknowledges the message; it does not turn the failed write into success.', zh: '权限错误会停止请求的操作。关闭对话框只表示已阅读消息，并不会让失败的写入变成成功。' },
				alt: { en: 'Focused real permission error dialog from the running app', zh: '运行中应用的真实聚焦权限错误对话框' },
				annotations: [{ text: { en: 'Stop or use an authorized account', zh: '停止操作，或使用获授权账户' }, position: 'lower-left', tone: 'red' }],
				annotationLayout: 'margin'
			}],
			retry: [{
				scenario: 0,
				src: 'assets/images/messages/connection-lost-live.png',
				layout: 'wide',
				label: { en: 'Connection Lost retry dialog', zh: '「连接已断开...」重试对话框' },
				caption: {
					en: 'The running app blocks the page until Retry reloads the current route.',
					zh: '真实应用会阻塞当前页面，直到使用「重试」重新载入当前路由。'
				},
				alt: {
					en: 'Real Connection Lost retry dialog from the running app',
					zh: '真实应用中的连接断开重试对话框'
				},
				annotations: [{
					text: { en: 'Restore the prerequisite, then retry once', zh: '先恢复前置条件，再只重试一次' },
					position: 'lower-left',
					tone: 'blue'
				}],
				annotationLayout: 'margin'
			}],
			feedback: [{
				scenario: 0,
				src: 'assets/images/account/account-connect-code-copied.jpg',
				presentation: 'side-by-side',
				label: { en: 'Desktop feedback plus changed control', zh: '桌面反馈与已改变控件' },
				caption: { en: 'Desktop feedback may be brief, so the changed button, card, row, count, or route remains the durable result to inspect.', zh: '桌面反馈可能短暂出现，因此应继续检查已改变的按钮、卡片、行、数量或路由，把它作为持久结果。' },
				alt: { en: 'Focused real Account feedback after copying a connect code', zh: '复制连接码后账户页显示的真实聚焦反馈' },
				annotations: [{ text: { en: 'Toast is temporary; changed state is the evidence', zh: 'Toast 是暂时的；状态变化才是证据' }, position: 'lower-left', tone: 'green' }],
				annotationLayout: 'margin'
			}]
		},
		copy: {
			en: {
				navigation: 'Messages & Errors',
				family: 'Shared app behavior',
				summary: 'Recognize the messages, confirmations, blocking states, retries, and feedback patterns reused across pages.',
				hero: {
					eyebrow: 'Shared reference · messages and errors',
					title: 'Read the app’s common signals once, then apply them everywhere.',
					summary: 'This is a guide-only reference, not an application route. It collects behavior implemented by the shared dialog and feedback services; errors that belong to one feature remain in that page’s notes.',
					primaryAction: 'Read shared signals',
					secondaryAction: 'Open error recovery',
					facts: [
						{ value: 'Login', label: 'fresh signed-out route' },
						{ value: '5', label: 'shared signal families' },
						{ value: 'Desktop', label: 'toast feedback surface' }
					],
					scene: { type: 'workflow', label: 'Shared signal path', title: 'Notice, interpret, recover', badge: 'Reference', items: [
						{ title: 'Notice', body: 'Card, dialog, blocker, or toast', value: '01' },
						{ title: 'Interpret', body: 'Authentication, permission, request, or result', value: '02' },
						{ title: 'Recover', body: 'Cancel, retry, sign in, or revisit', value: '03' }
					] }
				},
				journey: ['Access', 'Confirm', 'Wait', 'Recover', 'Verify result'],
				sections: [
					{ id: 'access', nav: 'Recover access', kicker: 'Authentication boundary', title: 'A fresh signed-out visit returns to Login.', summary: 'When a protected route is opened without a valid session, the current app redirects to Login before private page data is shown. A protected page that was already mounted can instead replace its content with an access-denied card when the session becomes invalid.', points: [{ title: 'Fresh navigation', body: 'The router returns the visitor to Login.' }, { title: 'Already-mounted page', body: 'An access card can replace private content after session loss.' }, { title: 'Recovery', body: 'Sign in, then revisit the intended route.' }], note: { title: 'Authentication is not feature permission', body: 'Signing in establishes identity; page-specific roles can still hide or reject privileged actions.', tone: 'red' }, scene: { type: 'cards', label: 'Access boundary', title: 'Private content stays hidden', badge: 'Auth', items: [{ title: 'Signed out', body: 'Login route', value: 'Stop' }, { title: 'Signed in', body: 'Requested page', value: 'Continue' }] } },
					{ id: 'confirm', nav: 'Confirm and block', kicker: 'Protected writes', title: 'Destructive or important writes ask first, then block duplicates.', summary: 'A confirmation offers Cancel and the page-specific action. After approval, a blocking layer such as Saving..., Deleting..., or Clearing... prevents a second request.', points: [{ title: 'Cancel', body: 'Closes the confirmation without changing data.' }, { title: 'Approve', body: 'Starts exactly the action named by the dialog.' }, { title: 'Block', body: 'Wait until the blocking layer closes before continuing.' }], note: { title: 'Read the page-specific wording', body: 'Consequences and undo behavior remain documented on the owning page.', tone: 'amber' }, scene: { type: 'workflow', label: 'Protected write', title: 'Ask, block, finish', badge: 'No duplicates', items: [{ title: 'Confirm', body: 'Choose Cancel or action', value: '01' }, { title: 'Block', body: 'Saving / Deleting / Clearing', value: '02' }, { title: 'Finish', body: 'Success or recoverable error', value: '03' }] } },
					{ id: 'errors', nav: 'Permission and unexpected errors', kicker: 'Shared error dialog', title: 'Distinguish a permission boundary from an unexpected failure.', summary: 'Shared permission checks report User does not have permission. Other unclassified service failures use Unexpected error occurred.', points: [{ title: 'Permission', body: 'The active account is not allowed to perform that operation.' }, { title: 'Unexpected', body: 'The request failed without a page-specific recovery message.' }, { title: 'Close', body: 'Closing an error never means the requested write succeeded.' }], note: { title: 'Verify the result before retrying', body: 'Return to the relevant list or card and confirm its state, especially after a network interruption.', tone: 'red' }, scene: { type: 'split', label: 'Shared errors', title: 'Permission / unexpected', badge: 'Error', items: [{ title: 'Permission', body: 'Stop or change account', value: 'Denied' }, { title: 'Unexpected', body: 'Check session and connection', value: 'Retry' }] } },
					{ id: 'retry', nav: 'Reconnect and reauthenticate', kicker: 'Retry dialog', title: 'A retry surface means the current request cannot safely continue.', summary: 'Connection timeout uses Connection Lost.... Session expiry uses the session-expired message and returns the app to authentication when retried.', points: [{ title: 'Connection', body: 'Restore connectivity before selecting retry.' }, { title: 'Session', body: 'Expect to sign in again before returning to private work.' }, { title: 'Drafts', body: 'Check whether the page kept local input before re-entering it.' }], note: { title: 'Retry is not success', body: 'It restarts recovery; confirm the intended record or result afterward.', tone: 'blue' }, scene: { type: 'workflow', label: 'Recovery', title: 'Restore, retry, confirm', badge: 'Reconnect', items: [{ title: 'Restore', body: 'Connection or session', value: '01' }, { title: 'Retry', body: 'Use the dialog action', value: '02' }, { title: 'Confirm', body: 'Inspect the owning page', value: '03' }] } },
					{ id: 'feedback', nav: 'Read feedback', kicker: 'Toast and inline status', title: 'Treat feedback as confirmation, not as the data itself.', summary: 'Desktop may show success, information, warning, or error toasts. Mobile suppresses shared toasts, so cards, dialogs, disabled controls, and refreshed data become the primary evidence.', points: [{ title: 'Success', body: 'Confirms that the operation reported completion.' }, { title: 'Warning or error', body: 'Read the message and use the owning page’s recovery steps.' }, { title: 'Mobile', body: 'Do not wait for a toast that the responsive service intentionally suppresses.' }], note: { title: 'Look at the changed object', body: 'The most reliable confirmation is the updated card, row, count, or route state.', tone: 'green' }, scene: { type: 'cards', label: 'Feedback surfaces', title: 'Desktop toast / mobile state', badge: 'Responsive', items: [{ title: 'Desktop', body: 'Toast plus updated data', value: 'Visible' }, { title: 'Mobile', body: 'Updated data without shared toast', value: 'Quiet' }] } }
				],
				rules: [{ title: 'Page errors stay local', body: 'Validation, duplicate, and destructive-action details remain in the page that owns them.' }, { title: 'Closing is not success', body: 'An error dialog only acknowledges the message.' }, { title: 'Blocking prevents repeats', body: 'Do not navigate or submit again while a protected write is active.' }, { title: 'Mobile feedback differs', body: 'Shared toast notifications are intentionally suppressed on mobile.' }],
				footer: { eyebrow: 'End of Shared Reference', title: 'Name the signal, recover deliberately, then verify the result.', body: 'Return to the owning page for the exact feature, data, and rollback rules.' }
			},
			zh: {
				navigation: '通用消息与错误',
				family: '应用共享行为',
				summary: '识别多个页面共用的消息、确认、阻塞状态、重试和反馈模式。',
				hero: {
					eyebrow: '通用参考 · 消息与错误', title: '先读懂一次通用信号，再应用到所有页面。',
					summary: '这是指南专用参考，不是应用路由。它汇总共享对话框与反馈服务的行为；只属于某项功能的错误仍保留在对应页面。',
					primaryAction: '阅读通用信号', secondaryAction: '打开错误恢复',
					facts: [{ value: '登录', label: '新访问的退出登录状态' }, { value: '5', label: '类共享信号' }, { value: '桌面', label: 'Toast 反馈界面' }],
					scene: { type: 'workflow', label: '通用信号路径', title: '注意、理解、恢复', badge: '参考', items: [{ title: '注意', body: '卡片、对话框、阻塞层或 Toast', value: '01' }, { title: '理解', body: '身份、权限、请求或结果', value: '02' }, { title: '恢复', body: '取消、重试、登录或返回', value: '03' }] }
				},
				journey: ['访问', '确认', '等待', '恢复', '核对结果'],
				sections: [
					{ id: 'access', nav: '恢复访问', kicker: '身份边界', title: '退出登录后新访问受保护路由会回到登录页。', summary: '没有有效会话时打开受保护路由，当前应用会在显示私人数据前跳转到登录页。若受保护页面已经挂载，会话随后失效时，页面也可能用「无权访问」卡片替换私人内容。', points: [{ title: '新访问', body: '路由会把访客带回登录页。' }, { title: '已挂载页面', body: '会话失效后，访问卡片可能替换私人内容。' }, { title: '恢复', body: '完成登录，再重新进入目标路由。' }], note: { title: '身份验证不等于功能权限', body: '登录只建立身份；页面专用角色仍可能隐藏或拒绝高权限操作。', tone: 'red' }, scene: { type: 'cards', label: '访问边界', title: '私人内容保持隐藏', badge: '身份', items: [{ title: '未登录', body: '登录路由', value: '停止' }, { title: '已登录', body: '请求页面', value: '继续' }] } },
					{ id: 'confirm', nav: '确认与阻塞', kicker: '受保护写入', title: '重要或破坏性写入会先询问，再防止重复。', summary: '确认框提供「取消」与页面专用操作。批准后，「正在保存...」「正在删除...」或「正在清除...」等阻塞层会阻止第二次请求。', points: [{ title: '取消', body: '关闭确认，不改变数据。' }, { title: '批准', body: '只开始对话框所写的操作。' }, { title: '阻塞', body: '等待阻塞层关闭后再继续。' }], note: { title: '阅读页面专用措辞', body: '后果和撤销规则仍在所属页面中说明。', tone: 'amber' }, scene: { type: 'workflow', label: '受保护写入', title: '询问、阻塞、结束', badge: '防止重复', items: [{ title: '确认', body: '选择取消或操作', value: '01' }, { title: '阻塞', body: '保存／删除／清除', value: '02' }, { title: '结束', body: '成功或可恢复错误', value: '03' }] } },
					{ id: 'errors', nav: '权限与未知错误', kicker: '通用错误对话框', title: '区分权限边界与未知失败。', summary: '共享权限检查显示「用户没有权限」。其他未分类的服务失败使用「发生未知错误」。', points: [{ title: '权限', body: '当前账户不能执行该操作。' }, { title: '未知错误', body: '请求失败，且没有页面专用恢复消息。' }, { title: '关闭', body: '关闭错误不代表写入成功。' }], note: { title: '重试前核对结果', body: '返回相关列表或卡片确认状态，网络中断后尤其如此。', tone: 'red' }, scene: { type: 'split', label: '通用错误', title: '权限／未知错误', badge: '错误', items: [{ title: '权限', body: '停止或更换账户', value: '拒绝' }, { title: '未知错误', body: '检查会话与网络', value: '重试' }] } },
					{ id: 'retry', nav: '重连与重新验证', kicker: '重试对话框', title: '重试界面表示当前请求无法安全继续。', summary: '连接超时使用「连接已断开...」。会话过期会显示对应消息，重试时返回身份验证。', points: [{ title: '连接', body: '选择重试前先恢复网络。' }, { title: '会话', body: '返回私人工作前需要重新登录。' }, { title: '草稿', body: '重新输入前先检查页面是否保留本地内容。' }], note: { title: '重试不等于成功', body: '它只重新启动恢复流程；之后仍需核对目标记录或结果。', tone: 'blue' }, scene: { type: 'workflow', label: '恢复', title: '恢复、重试、核对', badge: '重新连接', items: [{ title: '恢复', body: '网络或会话', value: '01' }, { title: '重试', body: '使用对话框操作', value: '02' }, { title: '核对', body: '检查所属页面', value: '03' }] } },
					{ id: 'feedback', nav: '读取反馈', kicker: 'Toast 与行内状态', title: '把反馈当作确认，而不是数据本身。', summary: '桌面端可能显示成功、信息、警告或错误 Toast。移动端会抑制共享 Toast，因此卡片、对话框、禁用控件和刷新后的数据才是主要证据。', points: [{ title: '成功', body: '确认操作已报告完成。' }, { title: '警告或错误', body: '阅读消息，并使用所属页面的恢复步骤。' }, { title: '移动端', body: '不要等待响应式服务刻意不显示的 Toast。' }], note: { title: '查看真正改变的对象', body: '更新后的卡片、行、数量或路由状态才是最可靠的确认。', tone: 'green' }, scene: { type: 'cards', label: '反馈界面', title: '桌面 Toast／移动状态', badge: '响应式', items: [{ title: '桌面', body: 'Toast 加更新后数据', value: '可见' }, { title: '移动端', body: '无共享 Toast 的更新数据', value: '安静' }] } }
				],
				rules: [{ title: '页面错误留在页面', body: '校验、重复项和破坏性操作细节保留在所属页面。' }, { title: '关闭不等于成功', body: '错误对话框只表示已阅读消息。' }, { title: '阻塞防止重复', body: '受保护写入进行时不要再次导航或提交。' }, { title: '移动反馈不同', body: '移动端刻意抑制共享 Toast 通知。' }],
				footer: { eyebrow: '通用参考结束', title: '识别信号，有意恢复，再核对结果。', body: '返回所属页面查看具体功能、数据与回退规则。' }
			}
		}
	});

})();
