import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const toolDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultGuideDirectory = path.resolve(toolDirectory, '..');
const sourceScripts = [
	'assets/scripts/guide-pages.js',
	'assets/scripts/guide-shared-reference.js',
	'assets/scripts/guide-scenarios.js',
	'assets/scripts/guide-complete-scenarios.js',
	'assets/scripts/guide-content.js'
];
const supportedImageExtensions = new Set(['.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);

/**
 * Gets every stored guide image as a guide-relative address.
 *
 * @param {string} directory - The image directory currently being inspected.
 * @param {string} guideDirectory - The canonical guide directory.
 * @returns {Promise<string[]>} The stored image addresses.
 */
async function getStoredImagePaths(directory, guideDirectory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const nestedPaths = await Promise.all(entries.map(async (entry) => {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) return getStoredImagePaths(entryPath, guideDirectory);
		if (!supportedImageExtensions.has(path.extname(entry.name).toLowerCase())) return [];
		return [path.relative(guideDirectory, entryPath).split(path.sep).join('/')];
	}));

	return nestedPaths.flat();
}

/**
 * Gets the language-independent structure of a localized value.
 *
 * @param {unknown} value - The value to inspect.
 * @returns {unknown} The recursive array and property structure.
 */
function getLocalizedStructure(value) {
	if (Array.isArray(value)) return value.map((item) => getLocalizedStructure(item));
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.keys(value)
				.sort()
				.map((key) => [key, getLocalizedStructure(value[key])])
		);
	}
	return typeof value;
}

/**
 * Checks whether an optional capture field contains both guide languages.
 *
 * @param {unknown} value - The localized capture value.
 * @returns {boolean} Whether English and Chinese text are both present.
 */
function hasMirroredCaptureText(value) {
	return Boolean(value && typeof value === 'object' && value.en && value.zh);
}

/**
 * Checks whether an image's bytes match the extension used by the guide.
 *
 * @param {Buffer} bytes - The image file bytes.
 * @param {string} extension - The lowercase file extension.
 * @returns {boolean} Whether the signature matches the extension.
 */
function hasMatchingImageSignature(bytes, extension) {
	if (extension === '.jpg' || extension === '.jpeg') {
		return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
	}
	if (extension === '.png') {
		return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
	}
	if (extension === '.gif') return bytes.subarray(0, 3).toString('ascii') === 'GIF';
	if (extension === '.webp') return bytes.subarray(8, 12).toString('ascii') === 'WEBP';
	if (extension === '.svg') return bytes.subarray(0, 512).toString('utf8').includes('<svg');
	return false;
}

/**
 * Loads the guide registry in the same order used by the browser.
 *
 * @param {string} guideDirectory - The canonical guide directory.
 * @returns {Promise<object[]>} The routed and guide-only page definitions.
 */
async function loadGuidePages(guideDirectory) {
	const context = vm.createContext({ window: {} });
	for (const sourceScript of sourceScripts) {
		const source = await readFile(path.join(guideDirectory, sourceScript), 'utf8');
		vm.runInContext(source, context, { filename: sourceScript });
	}
	return context.window.VISION_GUIDE_PAGES ?? [];
}

/**
 * Checks whether a capture is rendered for a scenario.
 *
 * @param {object} capture - The capture definition.
 * @param {object} scenario - The instructional scenario.
 * @param {number} scenarioIndex - The scenario's zero-based position.
 * @param {number} scenarioCount - The number of scenarios in the section.
 * @returns {boolean} Whether the capture maps to the scenario.
 */
function captureMatchesScenario(capture, scenario, scenarioIndex, scenarioCount) {
	if (scenarioCount === 1 && capture.scenario === undefined) return true;
	if (typeof capture.scenario === 'number') return capture.scenario === scenarioIndex;
	return Boolean(scenario.id) && capture.scenario === scenario.id;
}

/**
 * Audits scenario coverage, language symmetry, and every referenced image.
 *
 * @param {string} [guideDirectory=defaultGuideDirectory] - The canonical guide directory.
 * @returns {Promise<{captureCount: number, pageCount: number, scenarioCount: number}>} Coverage totals.
 */
export async function auditGuide(guideDirectory = defaultGuideDirectory) {
	const pages = await loadGuidePages(guideDirectory);
	const errors = [];
	const referencedImages = new Set();
	const storedImages = await getStoredImagePaths(path.join(guideDirectory, 'assets/images'), guideDirectory);
	let scenarioCount = 0;
	for (const sourcePath of ['index.html', ...sourceScripts]) {
		const source = await readFile(path.join(guideDirectory, sourcePath), 'utf8');
		for (const imageReference of source.matchAll(/assets\/images\/[^'"\s)]+\.(?:gif|jpe?g|png|svg|webp)/gi)) {
			referencedImages.add(imageReference[0]);
		}
	}

	for (const page of pages.filter((candidate) => candidate.generated)) {
		const englishSections = page.copy?.en?.sections ?? [];
		const chineseSections = page.copy?.zh?.sections ?? [];
		if (JSON.stringify(getLocalizedStructure(page.copy?.en)) !== JSON.stringify(getLocalizedStructure(page.copy?.zh))) {
			errors.push(`${page.id}: English and Chinese content structure differs.`);
		}
		const chineseSectionIds = chineseSections.map((section) => section.id).join('|');
		const englishSectionIds = englishSections.map((section) => section.id).join('|');
		if (englishSectionIds !== chineseSectionIds) {
			errors.push(`${page.id}: English and Chinese section order differs.`);
		}

		for (const section of englishSections) {
			const scenarios = section.scenarios ?? [];
			const chineseScenarioCount = chineseSections.find((candidate) => candidate.id === section.id)?.scenarios?.length ?? 0;
			const captures = page.captures?.[section.id] ?? [];
			if (!scenarios.length) errors.push(`${page.id}/${section.id}: no operating scenarios.`);
			if (scenarios.length !== chineseScenarioCount) {
				errors.push(`${page.id}/${section.id}: English and Chinese scenario counts differ.`);
			}

			for (const [scenarioIndex, scenario] of scenarios.entries()) {
				scenarioCount += 1;
				if (!captures.some((capture) => captureMatchesScenario(capture, scenario, scenarioIndex, scenarios.length))) {
					errors.push(`${page.id}/${section.id}/${scenarioIndex}: no rendered real-app capture.`);
				}
			}

			for (const capture of captures) {
				if (capture.crop) errors.push(`${page.id}/${section.id}: CSS crop metadata is not allowed.`);
				if (!capture.src?.startsWith('assets/images/')) {
					errors.push(`${page.id}/${section.id}: invalid capture path ${capture.src ?? '(missing)'}.`);
					continue;
				}
				if (!scenarios.some((scenario, scenarioIndex) => captureMatchesScenario(capture, scenario, scenarioIndex, scenarios.length))) {
					errors.push(`${page.id}/${section.id}: capture ${capture.src} is not mapped to an operating scenario.`);
				}
				for (const field of ['alt', 'caption', 'label']) {
					if (capture[field] !== undefined && !hasMirroredCaptureText(capture[field])) {
						errors.push(`${page.id}/${section.id}: capture ${capture.src} has incomplete ${field} localization.`);
					}
				}
				for (const annotation of capture.annotations ?? []) {
					if (!hasMirroredCaptureText(annotation.text)) {
						errors.push(`${page.id}/${section.id}: capture ${capture.src} has incomplete annotation localization.`);
					}
				}
				referencedImages.add(capture.src);
			}
		}
	}

	for (const relativeImagePath of storedImages) {
		if (!referencedImages.has(relativeImagePath)) {
			errors.push(`${relativeImagePath}: stored image is not referenced by the canonical guide.`);
		}
	}

	const imagePathsByHash = new Map();
	for (const relativeImagePath of new Set([...referencedImages, ...storedImages])) {
		try {
			const imagePath = path.join(guideDirectory, relativeImagePath);
			const bytes = await readFile(imagePath);
			const extension = path.extname(imagePath).toLowerCase();
			if (!hasMatchingImageSignature(bytes, extension)) {
				errors.push(`${relativeImagePath}: file signature does not match ${extension}.`);
			}
			const imageHash = createHash('sha256').update(bytes).digest('hex');
			const duplicatePath = imagePathsByHash.get(imageHash);
			if (duplicatePath && duplicatePath !== relativeImagePath) {
				errors.push(`${relativeImagePath}: duplicates the bytes stored at ${duplicatePath}.`);
			} else {
				imagePathsByHash.set(imageHash, relativeImagePath);
			}
		} catch (error) {
			errors.push(`${relativeImagePath}: ${error.message}`);
		}
	}

	if (errors.length) {
		throw new Error(`Guide audit failed:\n- ${errors.join('\n- ')}`);
	}

	return {
		captureCount: referencedImages.size,
		pageCount: pages.filter((page) => page.generated).length,
		scenarioCount
	};
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedFile === fileURLToPath(import.meta.url)) {
	const totals = await auditGuide();
	console.log(`Guide audit passed: ${totals.pageCount} generated chapters, ${totals.scenarioCount} scenarios, ${totals.captureCount} real-app images.`);
}
