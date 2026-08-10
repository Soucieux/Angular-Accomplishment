import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditGuide } from './audit-guide.mjs';

const toolDirectory = path.dirname(fileURLToPath(import.meta.url));
const guideDirectory = path.resolve(toolDirectory, '..');
const portableDirectory = path.join(guideDirectory, 'portable');
const portableFile = path.join(portableDirectory, 'accomplishment-field-guide.html');
const mimeTypes = new Map([
	['.gif', 'image/gif'],
	['.jpeg', 'image/jpeg'],
	['.jpg', 'image/jpeg'],
	['.png', 'image/png'],
	['.svg', 'image/svg+xml'],
	['.webp', 'image/webp']
]);

/**
 * Gets an asset as a data address suitable for a self-contained document.
 *
 * @param {string} relativeAssetPath - The guide-relative asset path.
 * @returns {Promise<string>} The encoded data address.
 */
async function getAssetDataAddress(relativeAssetPath) {
	const assetPath = path.join(guideDirectory, relativeAssetPath);
	const assetBytes = await readFile(assetPath);
	const mimeType = mimeTypes.get(path.extname(assetPath).toLowerCase());
	if (!mimeType) throw new Error(`Unsupported portable asset: ${relativeAssetPath}`);
	return `data:${mimeType};base64,${assetBytes.toString('base64')}`;
}

/**
 * Inlines every local image reference in the document.
 *
 * @param {string} documentMarkup - The guide markup to transform.
 * @returns {Promise<string>} The markup containing embedded image data.
 */
async function inlineDocumentImages(documentMarkup) {
	const imageReferences = new Set(
		[...documentMarkup.matchAll(/assets\/images\/[^'"\s)]+\.(?:gif|jpe?g|png|svg|webp)/gi)]
			.map((imageReference) => imageReference[0])
	);
	let inlinedMarkup = documentMarkup;

	for (const relativeAssetPath of imageReferences) {
		const dataAddress = await getAssetDataAddress(relativeAssetPath);
		inlinedMarkup = inlinedMarkup.replaceAll(relativeAssetPath, dataAddress);
	}

	return inlinedMarkup;
}

/**
 * Builds the portable guide from the canonical web source.
 */
async function buildPortableGuide() {
	await auditGuide(guideDirectory);
	let portableMarkup = await readFile(path.join(guideDirectory, 'index.html'), 'utf8');
	const stylesheet = await readFile(path.join(guideDirectory, 'assets/styles/guide.css'), 'utf8');
	const scriptPaths = [
		'assets/scripts/guide-pages.js',
		'assets/scripts/guide-shared-reference.js',
		'assets/scripts/guide-scenarios.js',
		'assets/scripts/guide-complete-scenarios.js',
		'assets/scripts/guide-content.js',
		'assets/scripts/guide.js'
	];

	portableMarkup = portableMarkup.replace(
		/<link rel="stylesheet" href="assets\/styles\/guide\.css(?:\?v=\d+)?" \/>/,
		`<style>\n${stylesheet.replaceAll('</style>', '<\\/style>')}\n\t\t</style>`
	);

	for (const scriptPath of scriptPaths) {
		const scriptSource = await readFile(path.join(guideDirectory, scriptPath), 'utf8');
		const escapedScriptPath = scriptPath.replaceAll('/', '\\/').replaceAll('.', '\\.');
		portableMarkup = portableMarkup.replace(
			new RegExp(`<script defer src="${escapedScriptPath}(?:\\?v=\\d+)?"><\\/script>`),
			`<script>\n${scriptSource.replaceAll('</script>', '<\\/script>')}\n\t\t</script>`
		);
	}

	portableMarkup = await inlineDocumentImages(portableMarkup);
	portableMarkup = portableMarkup.replace(
		'<meta name="color-scheme" content="light" />',
		'<meta name="color-scheme" content="light" />\n\t\t<meta name="application-name" content="Vision Canvas Field Guide · Offline" />'
	);

	await mkdir(portableDirectory, { recursive: true });
	await writeFile(portableFile, portableMarkup, 'utf8');
}

await buildPortableGuide();
