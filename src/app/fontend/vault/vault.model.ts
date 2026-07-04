/** The kind of a vault node: an account, an email / phone / link identifier, or a private note. */
export type VaultNodeType = 'account' | 'email' | 'phone' | 'link' | 'notes';

/** A node in the vault graph — an account or an email / phone / link identifier. */
export interface VaultNode {
	id: string;
	nodeType: VaultNodeType;
	name: string;
	categories: string[];
	verified: boolean;
}

/** A link between two vault nodes. */
export interface VaultEdge {
	id: string;
	sourceId: string;
	targetId: string;
	relation: string;
}

/** A user-created custom account category. */
export interface VaultCategory {
	id: string;
	label: string;
	hex: string;
	gradient: string;
}

/** Raw vault document mapped from the database watch — the document key plus its content fields. */
export interface VaultRecord {
	key: string;
	kind: string;
	nodeType?: VaultNodeType;
	name?: string;
	/** Legacy single-category field on older node docs — migrated to `categories` on read. */
	category?: string;
	categories?: string[];
	sourceId?: string;
	targetId?: string;
	relation?: string;
	label?: string;
	hex?: string;
	gradient?: string;
	verified?: boolean;
}

/** A single connection row submitted from the add-account dialog. */
export interface VaultConnectionInput {
	value: string;
	type: VaultNodeType;
}

/** Submitted form data returned by the add-account dialog to its caller. */
export interface NewAccountData {
	name: string;
	categories: string[];
	verified: boolean;
	connections: VaultConnectionInput[];
	newCategory?: { label: string; hex: string; gradient: string };
}

/** Data passed into the add-account dialog: assignable categories plus existing account names used to reject duplicates. */
export interface AddAccountDialogData {
	categories: VaultCategoryDef[];
	existingNames: string[];
}

/** Display definition for a built-in account category — drives node fill, avatar gradient, and chip label. */
export interface VaultCategoryDef {
	key: string;
	label: string;
	categoryLabel: string;
	icon: string;
	hex: string;
	gradient: string;
}

/** Fixed display metadata for a non-account identifier (email or phone). */
export interface VaultIdentifierMeta {
	icon: string;
	hex: string;
	gradient: string;
}

/** A removable connection chip shown under an account in the list view. */
export interface VaultLinkChip {
	edgeKey: string;
	name: string;
	gradient: string;
	shapeClass: string;
}

/** Per-type node tallies shown in the graph legend. */
export interface VaultLegendCounts {
	account: number;
	email: number;
	phone: number;
	link: number;
	verified: number;
}

/** A category-overview chip shown in the info bar when nothing is selected. */
export interface VaultOverviewStat {
	key: string;
	icon: string;
	gradient: string;
	value: number;
	label: string;
	isActive: boolean;
	isCustom: boolean;
}

/** The detail shown in the info bar for the currently selected node. */
export interface VaultSelectionDetail {
	id: string;
	name: string;
	typeLabel: string;
	avatarGradient: string;
	isAccount: boolean;
	isIcon: boolean;
	icon: string;
	letter: string;
	accountCount: number;
	identifierCount: number;
}

/** Internal force-simulation node used by the graph canvas — carries display and physics state. */
export interface VaultSimNode {
	id: string;
	nodeType: VaultNodeType;
	name: string;
	categories: string[];
	hexes: string[];
	letter: string;
	verified: boolean;
	x: number;
	y: number;
	vx: number;
	vy: number;
	rad: number;
}

/** A colored category chip shown on an account row (one per assigned category). */
export interface VaultAccountCategoryChip {
	key: string;
	label: string;
	gradient: string;
}

/** A view-model row rendered for one account in the list view. */
export interface VaultAccountRow {
	id: string;
	name: string;
	letter: string;
	gradient: string;
	categoryChips: VaultAccountCategoryChip[];
	categoryKeys: string[];
	verified: boolean;
	linkCount: number;
	links: VaultLinkChip[];
	hasLinks: boolean;
	isEditing: boolean;
	isSelected: boolean;
}

/** Built-in account categories — intentionally empty; accounts use only user-created custom categories. This slot remains the single place to reintroduce presets if ever needed. */
export const VAULT_CATEGORY_DEFS: VaultCategoryDef[] = [];

/**
 * Fallback category for accounts whose category is unknown or freshly typed without one chosen.
 * Technical metadata only — `label` / `categoryLabel` hold the key as a placeholder; the localized
 * "Other" / "Uncategorized" display text is resolved in the component from locale (recipe pattern).
 */
export const VAULT_CATEGORY_OTHER: VaultCategoryDef = {
	key: 'other',
	label: 'other',
	categoryLabel: 'other',
	icon: 'category',
	hex: '#94a3b8',
	gradient: 'linear-gradient(135deg, #94a3b8, #64748b)'
};

/** Fixed display metadata for email identifier nodes (blue circle). */
export const VAULT_EMAIL_META: VaultIdentifierMeta = {
	icon: 'mail',
	hex: '#1a8dff',
	gradient: 'linear-gradient(135deg, #1a6dff, #00d2ff)'
};

/** Fixed display metadata for phone identifier nodes (green diamond). */
export const VAULT_PHONE_META: VaultIdentifierMeta = {
	icon: 'call',
	hex: '#8fce2f',
	gradient: 'linear-gradient(135deg, #a3e635, #84cc16)'
};

/** Fixed display metadata for link identifier nodes (violet hexagon). */
export const VAULT_LINK_META: VaultIdentifierMeta = {
	icon: 'link',
	hex: '#8b5cf6',
	gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)'
};

/** Fixed display metadata for private notes nodes (slate note) — shown in the list, not the map. */
export const VAULT_NOTES_META: VaultIdentifierMeta = {
	icon: 'sticky_note_2',
	hex: '#64748b',
	gradient: 'linear-gradient(135deg, #94a3b8, #475569)'
};

/** Selectable connection types in the add-account dialog (value + icon; labels are localized at the call site). */
export const VAULT_CONNECTION_TYPES: { value: VaultNodeType; icon: string }[] = [
	{ value: 'email', icon: 'mail' },
	{ value: 'phone', icon: 'call' },
	{ value: 'link', icon: 'link' },
	{ value: 'notes', icon: 'sticky_note_2' }
];

/** Random color swatches assigned to a new custom category on creation. */
export const VAULT_CATEGORY_SWATCHES: { hex: string; gradient: string }[] = [
	{ hex: '#06b6d4', gradient: 'linear-gradient(135deg, #22d3ee, #0891b2)' },
	{ hex: '#8b5cf6', gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)' },
	{ hex: '#ec4899', gradient: 'linear-gradient(135deg, #f472b6, #db2777)' },
	{ hex: '#f59e0b', gradient: 'linear-gradient(135deg, #fbbf24, #d97706)' },
	{ hex: '#22c55e', gradient: 'linear-gradient(135deg, #4ade80, #16a34a)' },
	{ hex: '#3b82f6', gradient: 'linear-gradient(135deg, #60a5fa, #2563eb)' }
];

/** Distinct icons cycled across custom categories so each one reads differently in the overview. */
export const VAULT_CATEGORY_ICONS = [
	'label',
	'work',
	'favorite',
	'star',
	'sell',
	'school',
	'sports_esports',
	'flight',
	'restaurant',
	'pets',
	'music_note',
	'fitness_center'
];

/** BFS hop-level highlight colors: index 0 = selected, 1 = direct, 2 = second-degree, 3+ = beyond. */
export const VAULT_LEVEL_COLORS = ['#b02257', '#d53369', '#e8961a', '#0d9488'];
/** Stroke color for the white ring around every graph node. */
export const VAULT_NODE_STROKE = '#ffffff';
/** Icon color for the glyph inside a non-account identifier node — dark for contrast on the fill. */
export const VAULT_GLYPH_COLOR_IDENTIFIER = '#1e293b';
/** Edge color when the edge is not part of the selected node's highlighted web. */
export const VAULT_EDGE_RESTING_COLOR = '#cbb5be';
/** Label color under an account node. */
export const VAULT_LABEL_COLOR_ACCOUNT = '#334155';
/** Label color under an email or phone identifier node. */
export const VAULT_LABEL_COLOR_IDENTIFIER = '#7c6c74';
/** Label color for the currently selected node. */
export const VAULT_LABEL_COLOR_SELECTED = '#b02257';
