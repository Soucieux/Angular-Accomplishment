export interface AiTool {
	id: string;
	name: string;
	logo: string;
	url: string;
}

/** Shape of a useful-link document returned from the useful_links collection. */
export interface NexusLink {
	_id: string;
	url: string;
	title: string;
	category: string;
	visitCount?: number;
	lastVisited?: string;
	createdAt?: string;
}

/** Shape of a link-category document returned from the useful_links collection. */
export interface NexusCategory {
	_id: string;
	name: string;
	color?: string;
	order?: number;
}

/** Brand accent colours for the initial-letter fallback circle, keyed by tool ID. */
export const NEXUS_LOGO_FALLBACK_COLORS: Record<string, string> = {
	chatgpt: '#10a37f',
	perplexity: '#20b2aa',
	grok: '#1d1d1d',
	mistral: '#ff6600',
	youcom: '#7856ff',
	deepseek: '#4d6bfe',
	gemini: '#4285f4',
	kimi: '#ff4757',
	claude: '#cc785c',
	metaai: '#0866ff'
};

/** All AI tools shown in the launcher — one click opens the tool's homepage. */
export const NEXUS_AI_TOOLS: AiTool[] = [
	{ id: 'claude',     name: 'Claude',     logo: 'https://icon.horse/icon/claude.ai',           url: 'https://claude.ai' },
	{ id: 'chatgpt',    name: 'ChatGPT',    logo: 'https://icon.horse/icon/chatgpt.com',          url: 'https://chatgpt.com' },
	{ id: 'perplexity', name: 'Perplexity', logo: 'https://icon.horse/icon/perplexity.ai',        url: 'https://www.perplexity.ai' },
	{ id: 'gemini',     name: 'Gemini',     logo: 'https://icon.horse/icon/gemini.google.com',    url: 'https://gemini.google.com/app' },
	{ id: 'grok',       name: 'Grok',       logo: 'https://icon.horse/icon/grok.com',             url: 'https://grok.com' },
	{ id: 'deepseek',   name: 'DeepSeek',   logo: 'https://icon.horse/icon/deepseek.com',         url: 'https://chat.deepseek.com' },
	{ id: 'mistral',    name: 'Mistral',    logo: 'https://icon.horse/icon/mistral.ai',           url: 'https://chat.mistral.ai' },
	{ id: 'kimi',       name: 'KIMI',       logo: 'https://icon.horse/icon/kimi.com',             url: 'https://www.kimi.com/en' },
	{ id: 'youcom',     name: 'You.com',    logo: 'https://icon.horse/icon/you.com',              url: 'https://you.com' },
	{ id: 'metaai',     name: 'Meta AI',    logo: 'https://icon.horse/icon/meta.ai',              url: 'https://www.meta.ai' }
];
