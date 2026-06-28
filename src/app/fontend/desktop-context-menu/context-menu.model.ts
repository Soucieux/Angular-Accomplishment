/** A single item in the context menu. Set separator to true to render a divider before this item. */
export interface ContextMenuAction {
	label: string;
	icon: string;
	color: string;
	execute: () => void;
	separator?: true;
}
