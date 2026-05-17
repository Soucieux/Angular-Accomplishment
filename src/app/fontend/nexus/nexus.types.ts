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
