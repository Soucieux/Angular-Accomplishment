/** The kind of a vault node: a website/app account, or an email / phone / link identifier. */
export type VaultNodeType = 'account' | 'email' | 'phone' | 'link';

/** A node in the vault graph — an account or an email / phone / link identifier. */
export interface VaultNode {
	id: string;
	nodeType: VaultNodeType;
	name: string;
	category: string;
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
	category?: string;
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
	category: string;
	verified: boolean;
	connections: VaultConnectionInput[];
	newCategory?: { label: string; hex: string; gradient: string };
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

/** Visibility toggles for the node types in the graph. */
export interface VaultTypeFilters {
	account: boolean;
	email: boolean;
	phone: boolean;
	link: boolean;
}

/** A category-overview chip shown in the info bar when nothing is selected. */
export interface VaultOverviewStat {
	key: string;
	icon: string;
	gradient: string;
	value: number;
	label: string;
	isActive: boolean;
}

/** A type-filter chip with an optional identifier popover, floating over the graph. */
export interface VaultFilterDef {
	type: VaultNodeType;
	label: string;
	count: number;
	dotColor: string;
	icon: string;
	isActive: boolean;
	items: string[];
	hasItems: boolean;
}

/** The detail shown in the info bar for the currently selected node. */
export interface VaultSelectionDetail {
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
	category: string;
	hex: string;
	letter: string;
	verified: boolean;
	x: number;
	y: number;
	vx: number;
	vy: number;
	rad: number;
}

/** A view-model row rendered for one account in the list view. */
export interface VaultAccountRow {
	id: string;
	name: string;
	letter: string;
	gradient: string;
	categoryLabel: string;
	verified: boolean;
	linkCount: number;
	links: VaultLinkChip[];
	hasLinks: boolean;
	isEditing: boolean;
	isSelected: boolean;
}

/** Built-in account categories — intentionally empty; accounts use only user-created custom categories. This slot remains the single place to reintroduce presets if ever needed. */
export const VAULT_CATEGORY_DEFS: VaultCategoryDef[] = [];

/** Fallback category for accounts whose category is unknown or freshly typed without one chosen. */
export const VAULT_CATEGORY_OTHER: VaultCategoryDef = {
	key: 'other',
	label: 'Other',
	categoryLabel: 'Uncategorized',
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

/** Selectable connection types in the add-account dialog (value + icon; labels are localized at the call site). */
export const VAULT_CONNECTION_TYPES: { value: VaultNodeType; icon: string }[] = [
	{ value: 'email', icon: 'mail' },
	{ value: 'phone', icon: 'call' },
	{ value: 'link', icon: 'link' }
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

/** BFS hop-level highlight colors: index 0 = selected, 1 = direct, 2 = second-degree, 3+ = beyond. */
export const VAULT_LEVEL_COLORS = ['#b02257', '#d53369', '#e8961a', '#0d9488'];
/** Stroke color for the white ring around every graph node. */
export const VAULT_NODE_STROKE = '#ffffff';
/** Edge color when the edge is not part of the selected node's highlighted web. */
export const VAULT_EDGE_RESTING_COLOR = '#cbb5be';
/** Label color under an account node. */
export const VAULT_LABEL_COLOR_ACCOUNT = '#334155';
/** Label color under an email or phone identifier node. */
export const VAULT_LABEL_COLOR_IDENTIFIER = '#7c6c74';
/** Label color for the currently selected node. */
export const VAULT_LABEL_COLOR_SELECTED = '#b02257';
/** Dot color on the Accounts type-filter chip. */
export const VAULT_FILTER_DOT_ACCOUNT = '#ff8c2e';
