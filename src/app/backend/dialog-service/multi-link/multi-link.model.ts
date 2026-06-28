import { Utilities } from '../../../common/utilities/app.utilities';

/** Status of favicon fetch for a single parsed link. */
export type LinkStatus = 'loading' | 'ready' | 'error';

/** A parsed, enrichable link shown in the preview list. */
export interface BulkLink {
	id: string;
	url: string;
	host: string;
	name: string;
	nameEdited: boolean;
	status: LinkStatus;
	icon: string;
	color: string;
}

/** Per-item dot palette from the design system. */
const DOT_PALETTE = [
	'#e91e8c', '#f97316', '#4776e6', '#8e54e9',
	'#0d9488', '#38bdf8', '#d53369', '#22c55e', '#f59e0b',
];

let sequence = 0;

/**
 * Normalizes a raw string into a URL with host, or null if it is not a URL.
 *
 * @param raw - The raw string to normalize.
 * @returns The normalized href and host, or null.
 */
export function normalizeUrl(raw: string): { href: string; host: string } | null {
	const trimmed = (raw || '').trim();
	if (!trimmed) return null;
	const normalized = Utilities.normalizeUrl(trimmed);
	try {
		const parsedUrl = new URL(normalized);
		if (!parsedUrl.hostname.includes('.')) return null;
		return { href: parsedUrl.href, host: parsedUrl.hostname.replace(/^www\./, '') };
	} catch {
		return null;
	}
}

/**
 * Derives a title-cased name from a hostname.
 *
 * @param host - The hostname to derive a name from.
 * @returns The derived display name.
 */
export function titleFromHost(host: string): string {
	const core = host.split('.').slice(-2, -1)[0] || host;
	return Utilities.capitalizeFirstLetterWithOthersUnchanged(core) ?? core;
}

/**
 * Derives a deterministic colour for a hostname.
 *
 * @param host - The hostname to derive a colour for.
 * @returns A hex colour string from the palette.
 */
export function colorForHost(host: string): string {
	let hash = 0;
	for (let i = 0; i < host.length; i++) hash = (hash * 31 + host.charCodeAt(i)) >>> 0;
	return DOT_PALETTE[hash % DOT_PALETTE.length];
}

/**
 * Gets the favicon URL for a hostname via Google's public favicon service.
 *
 * @param host - The hostname to fetch the favicon for.
 * @param size - The desired favicon size in pixels.
 * @returns The favicon URL.
 */
export function faviconUrl(host: string, size = 64): string {
	return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size}`;
}

/**
 * Creates a new BulkLink entry from a normalized URL.
 *
 * @param href - The normalized URL.
 * @param host - The extracted hostname.
 * @returns A new BulkLink in loading state.
 */
function createLink(href: string, host: string): BulkLink {
	return {
		id: 'lnk-' + sequence++,
		url: href,
		host,
		name: titleFromHost(host),
		nameEdited: false,
		status: 'loading',
		icon: faviconUrl(host),
		color: colorForHost(host),
	};
}

/**
 * Parses pasted text into links, splitting on newlines, commas, semicolons,
 * and whitespace. Reconciles against previous links so already-fetched icons
 * and name edits survive re-parsing. De-dupes by normalized href.
 *
 * @param text - The raw pasted text.
 * @param previousLinks - The previous link array for reconciliation.
 * @returns The parsed and deduplicated link array.
 */
export function parseLinks(text: string, previousLinks: BulkLink[]): BulkLink[] {
	const byUrl = new Map(previousLinks.map((link) => [link.url, link]));
	const seen = new Set<string>();
	const out: BulkLink[] = [];
	for (const line of text.split(/[\n,;\s]+/)) {
		const normalized = normalizeUrl(line);
		if (!normalized || seen.has(normalized.href)) continue;
		seen.add(normalized.href);
		out.push(byUrl.get(normalized.href) ?? createLink(normalized.href, normalized.host));
	}
	return out;
}
