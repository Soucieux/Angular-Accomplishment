import { NEXUS_TOOL_TYPE_CLIPBOARD, NEXUS_TOOL_TYPE_DIRECT } from '../../common/app.constant';

export interface AiTool {
	id: string;
	name: string;
	logo: string;
	type: typeof NEXUS_TOOL_TYPE_DIRECT | typeof NEXUS_TOOL_TYPE_CLIPBOARD;
	url: string;
	selected: boolean;
}

export interface SearchHistoryEntry {
	query: string;
	aiIds: string[];
	timestamp: string;
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

/** AI tools that open the query URL directly in a new tab. */
export const NEXUS_DIRECT_TOOLS: AiTool[] = [
	{
		id: 'chatgpt',
		name: 'ChatGPT',
		logo: 'https://icon.horse/icon/chatgpt.com',
		url: 'https://chatgpt.com/?q=',
		type: NEXUS_TOOL_TYPE_DIRECT,
		selected: false
	},
	{
		id: 'perplexity',
		name: 'Perplexity',
		logo: 'https://icon.horse/icon/perplexity.ai',
		url: 'https://www.perplexity.ai/search?q=',
		type: NEXUS_TOOL_TYPE_DIRECT,
		selected: false
	},
	{
		id: 'grok',
		name: 'Grok',
		logo: 'https://icon.horse/icon/grok.com',
		url: 'https://grok.com/?q=',
		type: NEXUS_TOOL_TYPE_DIRECT,
		selected: false
	},
	{
		id: 'mistral',
		name: 'Mistral',
		logo: 'https://icon.horse/icon/mistral.ai',
		url: 'https://chat.mistral.ai/chat?q=',
		type: NEXUS_TOOL_TYPE_DIRECT,
		selected: false
	},
	{
		id: 'youcom',
		name: 'You.com',
		logo: 'https://icon.horse/icon/you.com',
		url: 'https://you.com/search?fromSearchBar=true&tbm=youchat&q=',
		type: NEXUS_TOOL_TYPE_DIRECT,
		selected: false
	}
];

/** AI tools that copy the query to the clipboard and open the tool URL. */
export const NEXUS_CLIPBOARD_TOOLS: AiTool[] = [
	{
		id: 'deepseek',
		name: 'DeepSeek',
		logo: 'https://icon.horse/icon/deepseek.com',
		url: 'https://chat.deepseek.com',
		type: NEXUS_TOOL_TYPE_CLIPBOARD,
		selected: false
	},
	{
		id: 'gemini',
		name: 'Gemini',
		logo: 'https://icon.horse/icon/gemini.google.com',
		url: 'https://gemini.google.com/app',
		type: NEXUS_TOOL_TYPE_CLIPBOARD,
		selected: false
	},
	{
		id: 'kimi',
		name: 'KIMI',
		logo: 'https://icon.horse/icon/kimi.com',
		url: 'https://www.kimi.com/en',
		type: NEXUS_TOOL_TYPE_CLIPBOARD,
		selected: false
	},
	{
		id: 'claude',
		name: 'Claude',
		logo: 'https://icon.horse/icon/claude.ai',
		url: 'https://claude.ai',
		type: NEXUS_TOOL_TYPE_CLIPBOARD,
		selected: false
	},
	{
		id: 'metaai',
		name: 'Meta AI',
		logo: 'https://icon.horse/icon/meta.ai',
		url: 'https://www.meta.ai',
		type: NEXUS_TOOL_TYPE_CLIPBOARD,
		selected: false
	}
];
