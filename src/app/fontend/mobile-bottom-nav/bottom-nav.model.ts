export interface NavItem {
	/** Stable identifier emitted by (navigate) and bound to [activeId]. */
	id: string;
	/** Visible label (also used as the accessible name). */
	label: string;
	/** Material Symbols ligature name, e.g. 'home_app_logo', 'neurology'. */
	icon: string;
	/** Optional per-item gradient (any CSS background). Falls back to the brand rose. */
	gradient?: string;
	/** Optional badge — a count (number) or short string. Renders a dot in the dock
	 *  and a pill in the expanded grid. */
	badge?: number | string;
}
