(() => {
	const DEFAULT_LANGUAGE = 'en';
	const CHINESE_LANGUAGE = 'zh';
	const DIRECTORY_PAGE = 'directory';
	const COMPLETE_GUIDE_PAGE = 'all';
	const REMINDER_ORDER = 3;
	const NARROW_VIEWPORT_QUERY = '(max-width: 940px)';
	const copyRegistry = window.VISION_GUIDE_COPY;
	const directoryCopyRegistry = window.VISION_GUIDE_DIRECTORY_COPY;
	const pageRegistry = window.VISION_GUIDE_PAGES ?? [];
	const guideState = {
		language: DEFAULT_LANGUAGE,
		page: DIRECTORY_PAGE,
		mobileNavigationOpen: false,
		sectionObserver: null,
		lightboxTrigger: null
	};

	/**
	 * Escapes a value before placing it into generated guide markup.
	 *
	 * @param {unknown} value - The value to escape.
	 * @returns {string} The HTML-safe string.
	 */
	function escapeMarkup(value) {
		return String(value ?? '')
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#039;');
	}

	/**
	 * Gets a nested localized value from the Reminder copy registry.
	 *
	 * @param {string} copyKey - The key identifying the localized value.
	 * @returns {string} The matching localized text, or the key when missing.
	 */
	function getLocalizedValue(copyKey) {
		const localizedCopy = copyRegistry?.[guideState.language];
		const localizedValue = copyKey
			.split('.')
			.reduce((currentValue, keyPart) => currentValue?.[keyPart], localizedCopy);
		return typeof localizedValue === 'string' ? localizedValue : copyKey;
	}

	/**
	 * Gets a page definition by its stable identifier.
	 *
	 * @param {string} pageIdentifier - The page identifier to find.
	 * @returns {object | undefined} The matching page definition.
	 */
	function getPageByIdentifier(pageIdentifier) {
		return pageRegistry.find((pageDefinition) => pageDefinition.id === pageIdentifier);
	}

	/**
	 * Gets the active-language copy for a page definition.
	 *
	 * @param {object} pageDefinition - The page whose copy is required.
	 * @returns {object} The matching localized page copy.
	 */
	function getPageCopy(pageDefinition) {
		return pageDefinition.copy?.[guideState.language] ?? pageDefinition.copy?.[DEFAULT_LANGUAGE] ?? {};
	}

	/**
	 * Builds an address for a guide page in the current language.
	 *
	 * @param {string} pageIdentifier - The page to open.
	 * @returns {string} A relative guide address.
	 */
	function buildGuideAddress(pageIdentifier) {
		return `?page=${encodeURIComponent(pageIdentifier)}&lang=${guideState.language}`;
	}

	/**
	 * Builds a reusable SVG icon reference.
	 *
	 * @param {string} iconIdentifier - The symbol identifier.
	 * @returns {string} The icon markup.
	 */
	function buildIconMarkup(iconIdentifier) {
		return `<svg aria-hidden="true"><use href="#${escapeMarkup(iconIdentifier)}"></use></svg>`;
	}

	/**
	 * Builds a real application screenshot from a page capture.
	 *
	 * @param {object} scene - The scene description.
	 * @param {string} [screenshotAddress] - Optional real application screenshot.
	 * @param {string} [screenshotAlt] - Accessible screenshot description.
	 * @param {boolean} [cropScreenshotToPage=false] - Whether to hide captured viewport whitespace.
	 * @returns {string} The screenshot markup, or an empty string when no capture exists.
	 */
	function buildProductScreenshotMarkup(scene, screenshotAddress, screenshotAlt, cropScreenshotToPage = false) {
		if (!screenshotAddress) return '';

		return `
			<figure class="product-screenshot${cropScreenshotToPage ? ' product-screenshot-page-crop' : ''}">
				<div class="product-screenshot-toolbar">
					<span class="product-scene-lights" aria-hidden="true"><i></i><i></i><i></i></span>
					<strong>${escapeMarkup(scene.label)}</strong>
					<em>${escapeMarkup(scene.badge)}</em>
				</div>
				<button class="product-screenshot-link" type="button" data-lightbox-trigger aria-label="${escapeMarkup(screenshotAlt)}">
					<img src="${escapeMarkup(screenshotAddress)}" alt="${escapeMarkup(screenshotAlt)}" decoding="async">
				</button>
				<figcaption>${escapeMarkup(scene.title)}</figcaption>
			</figure>
		`;
	}

	/**
	 * Gets localized text from a capture definition.
	 *
	 * @param {string | object} localizedText - The text or language map to resolve.
	 * @returns {string} The active-language text.
	 */
	function getCaptureText(localizedText) {
		if (typeof localizedText === 'string') return localizedText;
		return localizedText?.[guideState.language] ?? localizedText?.[DEFAULT_LANGUAGE] ?? '';
	}

	/**
	 * Builds a section gallery from screenshots captured from the running application.
	 *
	 * @param {object[]} captures - The real application captures to render.
	 * @returns {string} The capture gallery markup, or an empty string when none exist.
	 */
	function buildLiveCaptureGalleryMarkup(captures) {
		if (!captures?.length) return '';

		const captureCards = captures.map((capture, captureIndex) => {
			const captureLabel = getCaptureText(capture.label);
			const captureCaption = getCaptureText(capture.caption);
			const captureAlt = getCaptureText(capture.alt) || captureLabel;
			const captureAnnotations = capture.annotations ?? (capture.annotation ? [{
				text: capture.annotation,
				position: capture.annotationPosition ?? 'lower-left'
			}] : [{
				text: captureLabel,
				position: captureIndex % 2 === 0 ? 'lower-left' : 'lower-right',
				tone: captureIndex % 2 === 0 ? 'rose' : 'blue'
			}]);
			const annotationLayout = capture.annotationLayout ?? 'margin';
			const annotationMarkup = captureAnnotations.map((annotation) => {
				const annotationText = getCaptureText(annotation.text);
				const annotationPosition = annotation.position ?? 'lower-left';
				const annotationTone = annotation.tone ?? 'rose';
				const annotationContent = `
					<span class="capture-hand-note capture-hand-note-${escapeMarkup(annotationPosition)} capture-hand-note-${escapeMarkup(annotationTone)}">${escapeMarkup(annotationText)}</span>
					<svg class="capture-hand-arrow capture-hand-arrow-${escapeMarkup(annotationPosition)} capture-hand-arrow-${escapeMarkup(annotationTone)}" viewBox="0 0 100 70" aria-hidden="true">
						<path d="M8 56 C28 44 42 28 78 18"></path>
						<path d="M67 14 L79 18 L73 29"></path>
					</svg>
				`;

				return annotationLayout === 'margin'
					? `<div class="capture-hand-annotation">${annotationContent}</div>`
					: annotationContent;
			}).join('');
			const captureClasses = [
				'live-capture-card',
				'live-capture-card-adaptive',
				capture.layout === 'wide' ? 'live-capture-card-wide' : '',
				capture.layout === 'portrait' ? 'live-capture-card-portrait' : '',
				captureAnnotations.length ? 'live-capture-card-annotated' : '',
				annotationLayout === 'margin' ? 'live-capture-card-margin-notes' : ''
			].filter(Boolean).join(' ');

			return `
				<figure class="${captureClasses}">
					<div class="live-capture-heading">
						<span>${String(captureIndex + 1).padStart(2, '0')}</span>
						<strong>${escapeMarkup(captureLabel)}</strong>
					</div>
					<div class="live-capture-media">
						<button type="button" data-lightbox-trigger aria-label="${escapeMarkup(captureAlt)}">
							<img src="${escapeMarkup(capture.src)}" alt="${escapeMarkup(captureAlt)}" decoding="async">
						</button>
						${annotationLayout === 'margin' ? '' : annotationMarkup}
					</div>
					${annotationLayout === 'margin' ? `<div class="capture-hand-notes" aria-hidden="true">${annotationMarkup}</div>` : ''}
					${captureCaption ? `<figcaption>${escapeMarkup(captureCaption)}</figcaption>` : ''}
				</figure>
			`;
		}).join('');

		return `<div class="live-capture-gallery">${captureCards}</div>`;
	}

	/**
	 * Builds complete operating instructions for the scenarios in one guide section.
	 *
	 * @param {object[]} scenarios - The instructional scenarios to render.
	 * @param {object[]} [captures=[]] - Real application captures mapped to individual scenarios.
	 * @returns {string} The scenario-manual markup, or an empty string when unavailable.
	 */
	function buildInstructionScenarioMarkup(scenarios, captures = []) {
		if (!scenarios?.length) return '';
		const labels = guideState.language === CHINESE_LANGUAGE
			? {
				availableWhen: '可用条件',
				steps: '操作步骤',
				inputs: '输入要求',
				field: '字段',
				rule: '规则',
				example: '示例',
				result: '操作结果',
				triggers: '还会触发',
				dialogs: '对话框与页面消息',
				trigger: '触发',
				message: '内容',
				actions: '选择',
				outcome: '结果',
				issues: '问题与恢复',
				reason: '原因',
				fix: '处理'
			}
			: {
				availableWhen: 'Available when',
				steps: 'Do this',
				inputs: 'What to enter',
				field: 'Field',
				rule: 'Rule',
				example: 'Example',
				result: 'What happens',
				triggers: 'This can also trigger',
				dialogs: 'Dialogs and page messages',
				trigger: 'Trigger',
				message: 'Message',
				actions: 'Choices',
				outcome: 'Outcome',
				issues: 'If something goes wrong',
				reason: 'Why',
				fix: 'Fix'
			};

		const scenarioCards = scenarios.map((scenario, scenarioIndex) => {
			const scenarioCaptures = captures.filter((capture) => {
				if (typeof capture.scenario === 'number') return capture.scenario === scenarioIndex;
				return Boolean(scenario.id) && capture.scenario === scenario.id;
			});
			const scenarioCaptureMarkup = buildLiveCaptureGalleryMarkup(scenarioCaptures);
			const steps = (scenario.steps ?? []).map((step, stepIndex) => `
				<li>
					<span>${String(stepIndex + 1).padStart(2, '0')}</span>
					<p>${escapeMarkup(step)}</p>
				</li>
			`).join('');
			const inputs = (scenario.inputs ?? []).map((input) => `
				<div class="instruction-input-row">
					<strong>${escapeMarkup(input.name)}</strong>
					<span>${escapeMarkup(input.requirement)}</span>
					<code>${escapeMarkup(input.example ?? '—')}</code>
				</div>
			`).join('');
			const triggers = (scenario.triggers ?? []).map((trigger) => `<li>${escapeMarkup(trigger)}</li>`).join('');
			const dialogs = (scenario.dialogs ?? []).map((dialog) => `
				<div class="instruction-dialog">
					<strong>${escapeMarkup(dialog.name)}</strong>
					<dl>
						<div><dt>${escapeMarkup(labels.trigger)}</dt><dd>${escapeMarkup(dialog.trigger)}</dd></div>
						<div><dt>${escapeMarkup(labels.message)}</dt><dd>${escapeMarkup(dialog.message)}</dd></div>
						<div><dt>${escapeMarkup(labels.actions)}</dt><dd>${escapeMarkup(dialog.actions)}</dd></div>
						<div><dt>${escapeMarkup(labels.outcome)}</dt><dd>${escapeMarkup(dialog.outcome)}</dd></div>
					</dl>
				</div>
			`).join('');
			const issues = (scenario.issues ?? []).map((issue) => `
				<div class="instruction-issue">
					<strong>${escapeMarkup(issue.problem)}</strong>
					<p><span>${escapeMarkup(issue.reasonLabel ?? labels.reason)}</span>${escapeMarkup(issue.reason)}</p>
					<p><span>${escapeMarkup(issue.fixLabel ?? labels.fix)}</span>${escapeMarkup(issue.fix)}</p>
				</div>
			`).join('');

			return `
				<article class="instruction-scenario">
					<header class="instruction-scenario-header">
						<span>${String(scenarioIndex + 1).padStart(2, '0')}</span>
						<div>
							<strong>${escapeMarkup(scenario.title)}</strong>
							<p>${escapeMarkup(scenario.purpose)}</p>
						</div>
					</header>
					${scenario.availableWhen ? `
						<div class="instruction-availability">
							<strong>${escapeMarkup(scenario.availableWhenLabel ?? labels.availableWhen)}</strong>
							<span>${escapeMarkup(scenario.availableWhen)}</span>
						</div>
					` : ''}
					${scenarioCaptureMarkup ? `
						<section class="instruction-demos">
							<h3>${guideState.language === CHINESE_LANGUAGE ? '现场演示' : 'See it happen'}</h3>
							${scenarioCaptureMarkup}
						</section>
					` : ''}
					${steps ? `
						<section class="instruction-block">
							<h3>${escapeMarkup(scenario.stepsLabel ?? labels.steps)}</h3>
							<ol class="instruction-steps">${steps}</ol>
						</section>
					` : ''}
					${inputs ? `
						<section class="instruction-block">
							<h3>${escapeMarkup(scenario.inputsLabel ?? labels.inputs)}</h3>
							<div class="instruction-inputs">
								<div class="instruction-input-heading">
									<span>${escapeMarkup(scenario.fieldLabel ?? labels.field)}</span>
									<span>${escapeMarkup(scenario.ruleLabel ?? labels.rule)}</span>
									<span>${escapeMarkup(scenario.exampleLabel ?? labels.example)}</span>
								</div>
								${inputs}
							</div>
						</section>
					` : ''}
					${scenario.result ? `
						<section class="instruction-result">
							<strong>${escapeMarkup(scenario.resultLabel ?? labels.result)}</strong>
							<p>${escapeMarkup(scenario.result)}</p>
						</section>
					` : ''}
					${triggers ? `
						<section class="instruction-block instruction-triggers">
							<h3>${escapeMarkup(scenario.triggersLabel ?? labels.triggers)}</h3>
							<ul>${triggers}</ul>
						</section>
					` : ''}
					${dialogs ? `
						<section class="instruction-block instruction-dialogs">
							<h3>${escapeMarkup(scenario.dialogsLabel ?? labels.dialogs)}</h3>
							${dialogs}
						</section>
					` : ''}
					${scenario.safety ? `<p class="instruction-safety">${escapeMarkup(scenario.safety)}</p>` : ''}
					${issues ? `
						<section class="instruction-block instruction-issues">
							<h3>${escapeMarkup(scenario.issuesLabel ?? labels.issues)}</h3>
							${issues}
						</section>
					` : ''}
				</article>
			`;
		}).join('');

		return `<div class="instruction-scenarios">${scenarioCards}</div>`;
	}

	/**
	 * Builds a generated page article in the active language.
	 *
	 * @param {object} pageDefinition - The page definition to render.
	 * @returns {string} The complete article markup.
	 */
	function buildGeneratedPageMarkup(pageDefinition) {
		const pageCopy = getPageCopy(pageDefinition);
		const pagePrefix = pageDefinition.id;
		const rulesSectionNumber = pageCopy.sections.length + 1;
		const firstSection = pageCopy.sections?.[0];
		const heroFacts = pageCopy.hero.facts.map((fact) => `
			<div><strong>${escapeMarkup(fact.value)}</strong><span>${escapeMarkup(fact.label)}</span></div>
		`).join('');
		const journeySteps = pageCopy.journey.map((journeyStep, journeyIndex) => {
			const targetSection = pageCopy.sections[journeyIndex - 1];
			const targetAddress = journeyIndex === 0
				? `#${pagePrefix}-overview`
				: `#${pagePrefix}-${targetSection?.id ?? 'rules'}`;
			return `<a href="${targetAddress}"><strong>${String(journeyIndex + 1).padStart(2, '0')}</strong><span>${escapeMarkup(journeyStep)}</span></a>`;
		}).join('');
		const sections = pageCopy.sections.map((section, sectionIndex) => {
			const sectionCaptures = pageDefinition.captures?.[section.id] ?? [];
			const onlyScenarioIndex = section.scenarios.length === 1 ? 0 : undefined;
			const scenarioCaptures = sectionCaptures
				.filter((capture) => capture.scenario !== undefined || onlyScenarioIndex !== undefined)
				.map((capture) => capture.scenario === undefined
					? { ...capture, scenario: onlyScenarioIndex }
					: capture);
			const instructionScenarioMarkup = buildInstructionScenarioMarkup(
				section.scenarios,
				scenarioCaptures
			);
			const pointCards = section.points.map((point, pointIndex) => `
				<div class="generic-point">
					<span>${String(pointIndex + 1).padStart(2, '0')}</span>
					<strong>${escapeMarkup(point.title)}</strong>
					<p>${escapeMarkup(point.body)}</p>
				</div>
			`).join('');
			const sectionClasses = [
				'guide-section',
				'guide-section-stacked',
				'generic-guide-section',
				'live-walkthrough-section',
				'live-walkthrough-section-without-captures'
			].filter(Boolean).join(' ');

			return `
				<section
					class="${sectionClasses}"
					id="${pagePrefix}-${escapeMarkup(section.id)}"
					data-guide-section
					data-navigation-label-en="${escapeMarkup(pageDefinition.copy.en.sections[sectionIndex].nav)}"
					data-navigation-label-zh="${escapeMarkup(pageDefinition.copy.zh.sections[sectionIndex].nav)}">
					<div class="section-copy section-copy-wide">
						<div class="section-number">${String(sectionIndex + 1).padStart(2, '0')}</div>
						<div class="section-eyebrow">${escapeMarkup(section.kicker)}</div>
						<h2>${escapeMarkup(section.title)}</h2>
						<p>${escapeMarkup(section.summary)}</p>
					${instructionScenarioMarkup || `<div class="generic-section-points">${pointCards}</div>`}
						<div class="field-note field-note-${escapeMarkup(section.note.tone)}">
							<strong>${escapeMarkup(section.note.title)}</strong>
							<p>${escapeMarkup(section.note.body)}</p>
						</div>
					</div>
				</section>
			`;
		}).join('');
		const rules = pageCopy.rules.map((rule, ruleIndex) => `
			<div class="rule-card">
				<span>${String(ruleIndex + 1).padStart(2, '0')}</span>
				<strong>${escapeMarkup(rule.title)}</strong>
				<p>${escapeMarkup(rule.body)}</p>
			</div>
		`).join('');

		const heroScreenshotMarkup = pageDefinition.showOverviewScreenshot === true
			? buildProductScreenshotMarkup(
				pageCopy.hero.scene,
				pageDefinition.screenshot,
				`${pageCopy.navigation} application overview`,
				pageDefinition.cropScreenshotToPage
			)
			: '';

		return `
			<article class="guide-article guide-page generic-guide-page" data-guide-page="${escapeMarkup(pageDefinition.id)}" style="--page-accent-rgb: ${escapeMarkup(pageDefinition.accent)}" hidden>
				<section
					class="hero-section generic-hero-section${heroScreenshotMarkup ? '' : ' generic-hero-section-without-visual'}"
					id="${pagePrefix}-overview"
					data-guide-section
					data-navigation-label-en="Overview"
					data-navigation-label-zh="总览">
					<div class="hero-copy">
						<div class="hero-lead">
							<div class="section-eyebrow">${escapeMarkup(pageCopy.hero.eyebrow)}</div>
							<h1>${escapeMarkup(pageCopy.hero.title)}</h1>
						</div>
						<div class="hero-details">
							<p class="hero-summary">${escapeMarkup(pageCopy.hero.summary)}</p>
							<div class="hero-actions">
								<a class="primary-action" href="#${pagePrefix}-${escapeMarkup(firstSection.id)}">
									<span>${escapeMarkup(pageCopy.hero.primaryAction)}</span>
									${buildIconMarkup('icon-arrow')}
								</a>
								<a class="secondary-action" href="#${pagePrefix}-journey">${escapeMarkup(pageCopy.hero.secondaryAction)}</a>
							</div>
							<div class="hero-facts">${heroFacts}</div>
						</div>
					</div>
					${heroScreenshotMarkup ? `<div class="hero-visual">${heroScreenshotMarkup}</div>` : ''}
				</section>

				<section class="journey-section generic-journey-section" id="${pagePrefix}-journey">
					<div class="journey-copy">
						<span>${escapeMarkup(pageCopy.family)}</span>
						<strong>${escapeMarkup(pageCopy.summary)}</strong>
					</div>
					<div class="journey-steps">${journeySteps}</div>
				</section>

				${sections}

				<section
					class="guide-section guide-section-stacked rules-section generic-rules-section"
					id="${pagePrefix}-rules"
					data-guide-section
					data-navigation-label-en="Rules worth knowing"
					data-navigation-label-zh="值得知道的规则">
					<div class="section-copy section-copy-wide">
						<div class="section-number">${String(rulesSectionNumber).padStart(2, '0')}</div>
						<div class="section-eyebrow">${guideState.language === CHINESE_LANGUAGE ? '参考' : 'Reference'}</div>
						<h2>${guideState.language === CHINESE_LANGUAGE ? '值得知道的小规则' : 'Small rules worth knowing'}</h2>
						<p>${escapeMarkup(pageCopy.summary)}</p>
					</div>
					<div class="rules-grid">${rules}</div>
				</section>

				<footer class="guide-footer">
					<div class="section-eyebrow">${escapeMarkup(pageCopy.footer.eyebrow)}</div>
					<h2>${escapeMarkup(pageCopy.footer.title)}</h2>
					<p>${escapeMarkup(pageCopy.footer.body)}</p>
				</footer>
			</article>
		`;
	}

	/**
	 * Renders every generated guide article around the authored Reminder article.
	 */
	function renderGeneratedPages() {
		const pagesBeforeReminder = pageRegistry
			.filter((pageDefinition) => pageDefinition.generated && Number(pageDefinition.order) < REMINDER_ORDER)
			.map(buildGeneratedPageMarkup)
			.join('');
		const pagesAfterReminder = pageRegistry
			.filter((pageDefinition) => pageDefinition.generated && Number(pageDefinition.order) > REMINDER_ORDER)
			.map(buildGeneratedPageMarkup)
			.join('');
		const beforeContainer = document.querySelector('[data-generated-pages-before]');
		const afterContainer = document.querySelector('[data-generated-pages-after]');
		if (beforeContainer) beforeContainer.innerHTML = pagesBeforeReminder;
		if (afterContainer) afterContainer.innerHTML = pagesAfterReminder;
	}

	/**
	 * Renders the guide directory for the active language.
	 */
	function renderDirectory() {
		const directoryCopy = directoryCopyRegistry[guideState.language];
		const directoryCards = pageRegistry.map((pageDefinition) => {
			const pageCopy = getPageCopy(pageDefinition);
			return `
				<a class="directory-card" href="${buildGuideAddress(pageDefinition.id)}" data-page-link="${escapeMarkup(pageDefinition.id)}" style="--page-accent-rgb: ${escapeMarkup(pageDefinition.accent)}">
					<span class="directory-card-topline">
						<span class="directory-card-icon">${buildIconMarkup(pageDefinition.icon)}</span>
						<small>${escapeMarkup(directoryCopy.pageLabel)} ${escapeMarkup(pageDefinition.order)}</small>
					</span>
					<strong>${escapeMarkup(pageCopy.navigation)}</strong>
					<em>${escapeMarkup(pageCopy.family)}</em>
					<p>${escapeMarkup(pageCopy.summary)}</p>
					<span class="directory-card-action">${escapeMarkup(directoryCopy.openLabel)} ${buildIconMarkup('icon-arrow')}</span>
				</a>
			`;
		}).join('');
		const factCards = directoryCopy.facts.map((fact) => `
			<div><strong>${escapeMarkup(fact.value)}</strong><span>${escapeMarkup(fact.label)}</span></div>
		`).join('');
		const directoryElement = document.querySelector('[data-guide-directory]');

		if (!directoryElement) return;
		directoryElement.innerHTML = `
			<div class="directory-hero">
				<div class="section-eyebrow">${escapeMarkup(directoryCopy.eyebrow)}</div>
				<h1>${escapeMarkup(directoryCopy.title)}</h1>
				<p>${escapeMarkup(directoryCopy.summary)}</p>
				<a class="primary-action" href="${buildGuideAddress('home')}" data-page-link="home">
					<span>${escapeMarkup(directoryCopy.primaryAction)}</span>${buildIconMarkup('icon-arrow')}
				</a>
				<div class="directory-facts">${factCards}</div>
			</div>
			<div class="directory-catalogue">
				<div class="section-eyebrow">${escapeMarkup(directoryCopy.catalogueLabel)}</div>
				<h2>${escapeMarkup(directoryCopy.catalogueTitle)}</h2>
				<p>${escapeMarkup(directoryCopy.catalogueBody)}</p>
				<div class="directory-grid">${directoryCards}</div>
			</div>
		`;
	}

	/**
	 * Renders page-level navigation for the active language and page.
	 */
	function renderPageNavigation() {
		const directoryCopy = directoryCopyRegistry[guideState.language];
		const directoryLabel = guideState.language === CHINESE_LANGUAGE ? '指南目录' : 'Guide directory';
		const pageLinks = pageRegistry.map((pageDefinition) => {
			const pageCopy = getPageCopy(pageDefinition);
			const pageSelected = guideState.page === pageDefinition.id;
			return `
				<a class="page-link${pageSelected ? ' page-link-selected' : ''}" href="${buildGuideAddress(pageDefinition.id)}" data-page-link="${escapeMarkup(pageDefinition.id)}"${pageSelected ? ' aria-current="page"' : ''}>
					<span class="page-link-icon" style="--page-accent-rgb: ${escapeMarkup(pageDefinition.accent)}">${buildIconMarkup(pageDefinition.icon)}</span>
					<span class="page-link-copy"><strong>${escapeMarkup(pageCopy.navigation)}</strong><small>${escapeMarkup(pageDefinition.order)}</small></span>
				</a>
			`;
		}).join('');
		const navigationElement = document.querySelector('[data-page-navigation]');

		if (!navigationElement) return;
		navigationElement.setAttribute('aria-label', directoryCopy.completeLabel);
		navigationElement.innerHTML = `
			<a class="page-link page-link-directory${guideState.page === DIRECTORY_PAGE ? ' page-link-selected' : ''}" href="${buildGuideAddress(DIRECTORY_PAGE)}" data-page-link="${DIRECTORY_PAGE}"${guideState.page === DIRECTORY_PAGE ? ' aria-current="page"' : ''}>
				<span class="page-link-icon page-link-directory-icon">${buildIconMarkup('icon-portal')}</span>
				<span class="page-link-copy"><strong>${directoryLabel}</strong><small>00</small></span>
			</a>
			<div class="page-navigation-label">${escapeMarkup(directoryCopy.completeLabel)}</div>
			${pageLinks}
		`;
	}

	/**
	 * Gets the sections that belong to the active page.
	 *
	 * Generated articles can be normalized differently by local-file and served browsers,
	 * so page-prefixed section identifiers provide the stable ownership boundary.
	 *
	 * @returns {HTMLElement[]} The active page sections in reading order.
	 */
	function getActiveGuideSections() {
		const activeArticle = document.querySelector(`[data-guide-page="${guideState.page}"]`);
		const sectionPrefix = `${guideState.page}-`;

		return [...(activeArticle?.querySelectorAll('[data-guide-section]') ?? [])]
			.filter((guideSection) => guideSection.id.startsWith(sectionPrefix));
	}

	/**
	 * Renders section navigation for the active guide article.
	 */
	function renderChapterNavigation() {
		const chapterNavigation = document.querySelector('[data-chapter-navigation]');
		if (!chapterNavigation) return;
		if (guideState.page === DIRECTORY_PAGE || guideState.page === COMPLETE_GUIDE_PAGE) {
			chapterNavigation.innerHTML = '';
			chapterNavigation.hidden = true;
			return;
		}

		const activePageCopy = getPageCopy(getPageByIdentifier(guideState.page));
		const chaptersLabel = guideState.language === CHINESE_LANGUAGE ? '章节' : 'chapters';
		const sectionLinks = getActiveGuideSections().map((guideSection, sectionIndex) => {
			const localizedLabel = guideState.language === CHINESE_LANGUAGE
				? guideSection.dataset.navigationLabelZh
				: guideSection.dataset.navigationLabelEn;
			return `
				<a class="chapter-link${sectionIndex === 0 ? ' chapter-link-selected' : ''}" href="#${escapeMarkup(guideSection.id)}" data-section-link="${escapeMarkup(guideSection.id)}"${sectionIndex === 0 ? ' aria-current="location"' : ''}>
					<span class="chapter-link-number">${String(sectionIndex).padStart(2, '0')}</span>
					<span>${escapeMarkup(localizedLabel)}</span>
				</a>
			`;
		}).join('');
		chapterNavigation.setAttribute('aria-label', `${activePageCopy.navigation} ${chaptersLabel}`);
		chapterNavigation.hidden = false;
		chapterNavigation.innerHTML = sectionLinks;
	}

	/**
	 * Updates the browser address without persisting application state.
	 */
	function updateAddressState() {
		try {
			const guideAddress = new URL(window.location.href);
			guideAddress.searchParams.set('page', guideState.page);
			guideAddress.searchParams.set('lang', guideState.language);
			guideAddress.hash = '';
			window.history.replaceState(null, '', guideAddress);
		} catch {
			// The guide remains functional when a browser blocks local address replacement.
		}
	}

	/**
	 * Applies the selected guide page and refreshes page-specific navigation.
	 *
	 * @param {string} pageIdentifier - The page identifier to display.
	 * @param {boolean} shouldScroll - Whether to return the reader to the top.
	 */
	function applyPage(pageIdentifier, shouldScroll = false) {
		const validPage = getPageByIdentifier(pageIdentifier);
		guideState.page = pageIdentifier === COMPLETE_GUIDE_PAGE
			? COMPLETE_GUIDE_PAGE
			: validPage?.id ?? DIRECTORY_PAGE;
		const activePageDefinition = getPageByIdentifier(guideState.page);
		const activePageCopy = activePageDefinition ? getPageCopy(activePageDefinition) : null;
		const directoryCopy = directoryCopyRegistry[guideState.language];
		const allPagesVisible = guideState.page === COMPLETE_GUIDE_PAGE;
		const directoryVisible = guideState.page === DIRECTORY_PAGE;

		document.body.dataset.guidePage = guideState.page;
		document.documentElement.style.setProperty(
			'--guide-accent-rgb',
			activePageDefinition?.accent ?? '26, 109, 255'
		);
		document.querySelector('[data-guide-directory]')?.toggleAttribute('hidden', !directoryVisible);
		document.querySelectorAll('[data-guide-page]').forEach((guidePage) => {
			guidePage.toggleAttribute('hidden', !(allPagesVisible || guidePage.dataset.guidePage === guideState.page));
		});

		const editionLabel = document.querySelector('[data-edition-label]');
		if (editionLabel) {
			editionLabel.textContent = allPagesVisible
				? directoryCopy.completeLabel
				: activePageDefinition
					? `${directoryCopy.pageLabel} ${activePageDefinition.order} · ${activePageCopy.navigation}`
					: directoryCopy.catalogueLabel;
		}

		document.title = activePageCopy
			? `${activePageCopy.navigation} - Vision Canvas Field Guide`
			: guideState.language === CHINESE_LANGUAGE
				? '完整使用手记 - 愿景画布'
				: 'Complete Field Guide - Vision Canvas';
		document.querySelector('meta[name="description"]')?.setAttribute(
			'content',
			activePageCopy?.summary ?? directoryCopy.summary
		);
		renderPageNavigation();
		renderChapterNavigation();
		observeGuideSections();
		updateAddressState();
		setMobileNavigationOpen(false);
		if (shouldScroll) window.scrollTo({ top: 0, behavior: 'auto' });
		updateReadingProgress();
	}

	/**
	 * Applies all authored and generated copy for the selected language.
	 *
	 * @param {string} language - The language identifier to apply.
	 */
	function applyLanguage(language) {
		guideState.language = language === CHINESE_LANGUAGE ? CHINESE_LANGUAGE : DEFAULT_LANGUAGE;
		document.documentElement.lang = guideState.language === CHINESE_LANGUAGE ? 'zh-CN' : 'en';
		document.documentElement.dataset.language = guideState.language;

		document.querySelectorAll('[data-copy]').forEach((copyElement) => {
			copyElement.textContent = getLocalizedValue(copyElement.dataset.copy);
		});
		document.querySelectorAll('[data-copy-aria-label]').forEach((copyElement) => {
			copyElement.setAttribute('aria-label', getLocalizedValue(copyElement.dataset.copyAriaLabel));
		});
		document.querySelectorAll('[data-language-option]').forEach((languageButton) => {
			const languageSelected = languageButton.dataset.languageOption === guideState.language;
			languageButton.setAttribute('aria-pressed', String(languageSelected));
			languageButton.classList.toggle('language-button-selected', languageSelected);
		});

		renderGeneratedPages();
		renderDirectory();
		applyPage(guideState.page);
	}

	/**
	 * Gets the initial language from the address, then from the browser locale.
	 *
	 * @returns {string} The initial language identifier.
	 */
	function getInitialLanguage() {
		const requestedLanguage = new URLSearchParams(window.location.search).get('lang');
		if (requestedLanguage === DEFAULT_LANGUAGE || requestedLanguage === CHINESE_LANGUAGE) return requestedLanguage;
		return navigator.language.toLowerCase().startsWith(CHINESE_LANGUAGE)
			? CHINESE_LANGUAGE
			: DEFAULT_LANGUAGE;
	}

	/**
	 * Gets the initial page from the address.
	 *
	 * @returns {string} The initial page identifier.
	 */
	function getInitialPage() {
		const requestedPage = new URLSearchParams(window.location.search).get('page');
		if (requestedPage === COMPLETE_GUIDE_PAGE || getPageByIdentifier(requestedPage)) return requestedPage;
		return DIRECTORY_PAGE;
	}

	/**
	 * Opens or closes the narrow-viewport guide navigation.
	 *
	 * @param {boolean} mobileNavigationOpen - Whether the navigation should remain visible.
	 */
	function setMobileNavigationOpen(mobileNavigationOpen) {
		guideState.mobileNavigationOpen = mobileNavigationOpen;
		const guideSidebar = document.querySelector('[data-guide-sidebar]');
		const narrowViewport = window.matchMedia(NARROW_VIEWPORT_QUERY).matches;
		guideSidebar?.classList.toggle('guide-sidebar-open', mobileNavigationOpen);
		guideSidebar?.toggleAttribute('inert', narrowViewport && !mobileNavigationOpen);
		guideSidebar?.setAttribute('aria-hidden', String(narrowViewport && !mobileNavigationOpen));
		document.querySelectorAll('[data-menu-button]').forEach((menuButton) => {
			menuButton.setAttribute('aria-expanded', String(mobileNavigationOpen));
			menuButton.setAttribute(
				'aria-label',
				getLocalizedValue(mobileNavigationOpen ? 'accessibility.menuClose' : 'accessibility.menuOpen')
			);
		});
	}

	/**
	 * Updates the reading-progress bar from the document scroll position.
	 */
	function updateReadingProgress() {
		const scrollableDistance = document.documentElement.scrollHeight - window.innerHeight;
		const progressPercentage = scrollableDistance > 0
			? Math.min(100, Math.max(0, (window.scrollY / scrollableDistance) * 100))
			: 0;
		document.querySelector('[data-reading-progress-fill]')?.style.setProperty(
			'--reading-progress',
			`${progressPercentage}%`
		);
	}

	/**
	 * Marks the chapter link belonging to the most visible guide section.
	 *
	 * @param {string} sectionIdentifier - The section identifier to mark active.
	 */
	function setActiveNavigationLink(sectionIdentifier) {
		document.querySelectorAll('[data-section-link]').forEach((navigationLink) => {
			const linkSelected = navigationLink.dataset.sectionLink === sectionIdentifier;
			navigationLink.classList.toggle('chapter-link-selected', linkSelected);
			if (linkSelected) navigationLink.setAttribute('aria-current', 'location');
			else navigationLink.removeAttribute('aria-current');
		});
	}

	/**
	 * Observes visible sections and keeps chapter navigation synchronized.
	 */
	function observeGuideSections() {
		guideState.sectionObserver?.disconnect();
		guideState.sectionObserver = null;
		if (guideState.page === DIRECTORY_PAGE || guideState.page === COMPLETE_GUIDE_PAGE) return;
		if (!('IntersectionObserver' in window)) return;

		guideState.sectionObserver = new IntersectionObserver(
			(sectionEntries) => {
				const visibleSection = sectionEntries
					.filter((sectionEntry) => sectionEntry.isIntersecting)
					.sort((firstEntry, secondEntry) => secondEntry.intersectionRatio - firstEntry.intersectionRatio)[0];
				if (visibleSection?.target.id) setActiveNavigationLink(visibleSection.target.id);
			},
			{ rootMargin: '-18% 0px -58% 0px', threshold: [0.1, 0.35, 0.65] }
		);
		getActiveGuideSections()
			.forEach((guideSection) => guideState.sectionObserver.observe(guideSection));
	}

	/**
	 * Opens a guide image at a readable scale without leaving the current page.
	 *
	 * @param {HTMLElement} imageTrigger - The image control that opens the lightbox.
	 */
	function openImageLightbox(imageTrigger) {
		const lightbox = document.querySelector('[data-image-lightbox]');
		const sourceImage = imageTrigger.querySelector('img');
		const lightboxImage = lightbox?.querySelector('[data-lightbox-image]');
		const lightboxCaption = lightbox?.querySelector('[data-lightbox-caption]');
		if (!(lightbox instanceof HTMLDialogElement)
			|| !(sourceImage instanceof HTMLImageElement)
			|| !(lightboxImage instanceof HTMLImageElement)
			|| !(lightboxCaption instanceof HTMLElement)) return;

		guideState.lightboxTrigger = imageTrigger;
		lightboxImage.src = sourceImage.currentSrc || sourceImage.src;
		lightboxImage.alt = sourceImage.alt;
		lightboxCaption.textContent = imageTrigger.closest('figure')
			?.querySelector('figcaption')
			?.textContent
			?.trim() || sourceImage.alt;
		document.body.classList.add('image-lightbox-open');
		lightbox.showModal();
	}

	/**
	 * Closes the enlarged guide image.
	 */
	function closeImageLightbox() {
		const lightbox = document.querySelector('[data-image-lightbox]');
		if (lightbox instanceof HTMLDialogElement && lightbox.open) lightbox.close();
	}

	/**
	 * Clears lightbox content and returns focus to the originating image.
	 */
	function resetImageLightbox() {
		const lightboxImage = document.querySelector('[data-lightbox-image]');
		document.body.classList.remove('image-lightbox-open');
		if (lightboxImage instanceof HTMLImageElement) {
			lightboxImage.removeAttribute('src');
			lightboxImage.alt = '';
		}
		guideState.lightboxTrigger?.focus();
		guideState.lightboxTrigger = null;
	}

	/**
	 * Binds guide controls after the document is ready.
	 */
	function bindGuideControls() {
		document.addEventListener('click', (clickEvent) => {
			const imageTrigger = clickEvent.target.closest('[data-lightbox-trigger]');
			if (imageTrigger instanceof HTMLElement) {
				clickEvent.preventDefault();
				openImageLightbox(imageTrigger);
				return;
			}
			const pageLink = clickEvent.target.closest('[data-page-link]');
			if (pageLink) {
				clickEvent.preventDefault();
				applyPage(pageLink.dataset.pageLink, true);
				return;
			}
			if (clickEvent.target.closest('[data-section-link]') && window.matchMedia(NARROW_VIEWPORT_QUERY).matches) {
				setMobileNavigationOpen(false);
			}
		});
		document.querySelectorAll('[data-language-option]').forEach((languageButton) => {
			languageButton.addEventListener('click', () => applyLanguage(languageButton.dataset.languageOption));
		});
		document.querySelectorAll('[data-menu-button]').forEach((menuButton) => {
			menuButton.addEventListener('click', () => setMobileNavigationOpen(!guideState.mobileNavigationOpen));
		});
		const lightbox = document.querySelector('[data-image-lightbox]');
		document.querySelector('[data-lightbox-close]')?.addEventListener('click', closeImageLightbox);
		lightbox?.addEventListener('click', (clickEvent) => {
			if (clickEvent.target === lightbox) closeImageLightbox();
		});
		lightbox?.addEventListener('close', resetImageLightbox);
		document.addEventListener('keydown', (keyboardEvent) => {
			if (keyboardEvent.key === 'Escape' && lightbox?.open) closeImageLightbox();
		});
		window.addEventListener('scroll', updateReadingProgress, { passive: true });
		window.addEventListener('resize', () => {
			updateReadingProgress();
			if (!window.matchMedia(NARROW_VIEWPORT_QUERY).matches) setMobileNavigationOpen(false);
		});
	}

	/**
	 * Initializes localization, routing, controls, progress, and section tracking.
	 */
	function initializeGuide() {
		guideState.page = getInitialPage();
		guideState.language = getInitialLanguage();
		bindGuideControls();
		applyLanguage(guideState.language);
		updateReadingProgress();
	}

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeGuide);
	else initializeGuide();
})();
