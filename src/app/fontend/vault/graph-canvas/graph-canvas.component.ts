import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	EventEmitter,
	Inject,
	Input,
	NgZone,
	OnChanges,
	OnDestroy,
	Output,
	PLATFORM_ID,
	SimpleChanges,
	ViewChild
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
	VAULT_NODE_ACCOUNT,
	VAULT_NODE_EMAIL,
	VAULT_NODE_PHONE,
	VAULT_NODE_LINK,
	VAULT_FILTER_KEY_VERIFIED
} from '../../../common/constants';
import {
	VAULT_LEGEND_TITLE,
	VAULT_LEGEND_VERIFIED,
	VAULT_TYPE_ACCOUNT,
	VAULT_TYPE_EMAIL,
	VAULT_TYPE_PHONE,
	VAULT_TYPE_LINK
} from '../../../common/locale/locale-strings';
import {
	VaultCategoryDef,
	VaultEdge,
	VaultLegendCounts,
	VaultNode,
	VaultSimNode,
	VAULT_CATEGORY_DEFS,
	VAULT_CATEGORY_OTHER,
	VAULT_EDGE_RESTING_COLOR,
	VAULT_EMAIL_META,
	VAULT_LABEL_COLOR_ACCOUNT,
	VAULT_LABEL_COLOR_IDENTIFIER,
	VAULT_LABEL_COLOR_SELECTED,
	VAULT_LEVEL_COLORS,
	VAULT_LINK_META,
	VAULT_NODE_STROKE,
	VAULT_PHONE_META
} from '../vault.model';

/** SVG namespace used for all imperatively-created graph elements. */
const SVG_NS = 'http://www.w3.org/2000/svg';

@Component({
	selector: 'graph-canvas',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './graph-canvas.component.html',
	styleUrls: ['./graph-canvas.component.css']
})
export class GraphCanvasComponent implements AfterViewInit, OnChanges, OnDestroy {
	@ViewChild('svg', { static: true }) private svgRef!: ElementRef<SVGSVGElement>;
	@ViewChild('pan', { static: true }) private panRef!: ElementRef<SVGGElement>;
	@ViewChild('edges', { static: true }) private edgeGroupRef!: ElementRef<SVGGElement>;
	@ViewChild('nodes', { static: true }) private nodeGroupRef!: ElementRef<SVGGElement>;
	@Output() nodeSelect = new EventEmitter<string | null>();
	@Output() linkTarget = new EventEmitter<string>();
	@Output() filterToggle = new EventEmitter<string>();
	@Input() nodes: VaultNode[] = [];
	@Input() edges: VaultEdge[] = [];
	@Input() customCategories: VaultCategoryDef[] = [];
	@Input() selectedId: string | null = null;
	@Input() query = '';
	@Input() typeFilter: string | null = null;
	@Input() categoryFilter: string | null = null;
	@Input() linkMode = false;
	@Input() linkSourceId: string | null = null;
	protected readonly VAULT_LEGEND_TITLE = VAULT_LEGEND_TITLE;
	protected readonly VAULT_LEGEND_VERIFIED = VAULT_LEGEND_VERIFIED;
	protected readonly VAULT_TYPE_ACCOUNT = VAULT_TYPE_ACCOUNT;
	protected readonly VAULT_TYPE_EMAIL = VAULT_TYPE_EMAIL;
	protected readonly VAULT_TYPE_PHONE = VAULT_TYPE_PHONE;
	protected readonly VAULT_TYPE_LINK = VAULT_TYPE_LINK;
	protected readonly VAULT_NODE_ACCOUNT = VAULT_NODE_ACCOUNT;
	protected readonly VAULT_NODE_EMAIL = VAULT_NODE_EMAIL;
	protected readonly VAULT_NODE_PHONE = VAULT_NODE_PHONE;
	protected readonly VAULT_NODE_LINK = VAULT_NODE_LINK;
	protected readonly VAULT_FILTER_KEY_VERIFIED = VAULT_FILTER_KEY_VERIFIED;

	// ── Force-simulation tuning ──────────────────────────────────────────────
	private readonly accountRadius = 22;
	private readonly identifierRadius = 9;
	private readonly borderResting = 2.5;
	private readonly borderSelected = 4;
	private readonly borderConnected = 3;
	private readonly repulsionStrength = 6200;
	private readonly minSpacingGap = 64;
	private readonly overlapPush = 0.16;
	private readonly linkTargetLength = 160;
	private readonly linkStrength = 0.015;
	private readonly centeringStrength = 0.0011;
	private readonly velocityDamping = 0.82;
	private readonly boundaryPadding = 40;
	private readonly settleFrames = 260;
	private readonly maxReachLevel = 2;
	private readonly verifiedBadgeColor = '#0d9488';

	protected legendCounts: VaultLegendCounts = { account: 0, email: 0, phone: 0, link: 0, verified: 0 };

	private simNodes: VaultSimNode[] = [];
	private nodeById: Record<string, VaultSimNode> = {};
	private nodeGroupEls: SVGGElement[] = [];
	private nodeShapeEls: SVGElement[] = [];
	private nodeLabelEls: SVGTextElement[] = [];
	private edgeEls: SVGLineElement[] = [];
	private camera = { scale: 1, x: 0, y: 0 };
	private animationFrame: number | null = null;
	private frameCount = 0;
	private dragNode: VaultSimNode | null = null;
	private dragMoved = false;
	private resizeObserver?: ResizeObserver;
	private panMoveHandler?: (event: PointerEvent) => void;
	private panUpHandler?: () => void;
	private viewReady = false;

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		private ngZone: NgZone
	) {}

	/**
	 * Builds the graph once the SVG host has a measurable size, then binds pan/zoom
	 * and a resize observer. The whole interaction layer runs outside Angular so the
	 * animation loop never triggers change detection.
	 */
	ngAfterViewInit(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		this.ngZone.runOutsideAngular(() => {
			const start = (): void => {
				const svg = this.svgRef.nativeElement;
				if (svg.clientWidth < 60 || svg.clientHeight < 60) {
					requestAnimationFrame(start);
					return;
				}
				this.viewReady = true;
				this.buildSimulation();
				this.buildSvg();
				this.bindPan();
				this.observeResize();
				this.kickSimulation();
			};
			requestAnimationFrame(start);
		});
	}

	/**
	 * Rebuilds the graph when the node or edge inputs change, or re-applies the
	 * visual highlight when only the selection or search query changes.
	 *
	 * @param changes - The set of changed input properties.
	 */
	ngOnChanges(changes: SimpleChanges): void {
		// Tally the legend counts whenever the node set changes — independent of viewReady so the
		// legend is correct on first render, before the simulation view has measured its size.
		if (changes['nodes']) this.updateLegendCounts();
		if (!this.viewReady) return;
		if (changes['nodes'] || changes['edges'] || changes['customCategories']) {
			this.buildSimulation();
			this.buildSvg();
			this.kickSimulation();
		} else if (
			changes['selectedId'] ||
			changes['query'] ||
			changes['typeFilter'] ||
			changes['categoryFilter'] ||
			changes['linkMode'] ||
			changes['linkSourceId']
		) {
			this.applyVisual();
		}
	}

	/**
	 * Cancels the animation loop and tears down the resize and pan listeners.
	 */
	ngOnDestroy(): void {
		if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
		this.resizeObserver?.disconnect();
		if (this.panMoveHandler) window.removeEventListener('pointermove', this.panMoveHandler);
		if (this.panUpHandler) window.removeEventListener('pointerup', this.panUpHandler);
	}

	// ── Zoom controls ────────────────────────────────────────────────────────

	/**
	 * Zooms the graph in around its centre.
	 */
	protected zoomIn(): void {
		const rect = this.svgRef.nativeElement.getBoundingClientRect();
		this.zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.15);
	}

	/**
	 * Zooms the graph out around its centre.
	 */
	protected zoomOut(): void {
		const rect = this.svgRef.nativeElement.getBoundingClientRect();
		this.zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 0.87);
	}

	/**
	 * Resets the camera to its default position and re-runs the layout.
	 */
	protected resetView(): void {
		this.camera = { scale: 1, x: 0, y: 0 };
		this.applyCamera();
		this.layoutInitialPositions();
		this.kickSimulation();
	}

	/**
	 * Emits a request to isolate the clicked legend row's type, or clear it when that
	 * type is already the active filter.
	 *
	 * @param key - The filter key the clicked legend row controls.
	 */
	protected toggleFilterRow(key: string): void {
		this.filterToggle.emit(key);
	}

	// ── Simulation + rendering ───────────────────────────────────────────────

	/**
	 * Rebuilds the simulation node list from the current inputs, preserving the
	 * positions of nodes that already existed so the graph does not jump on each update.
	 */
	private buildSimulation(): void {
		const previousById = this.nodeById;
		this.simNodes = this.nodes.map((node) => {
			const existing = previousById[node.id];
			return {
				id: node.id,
				nodeType: node.nodeType,
				name: node.name,
				category: node.category,
				hex: this.getNodeHex(node),
				letter: (node.name[0] ?? '').toUpperCase(),
				verified: node.verified,
				x: existing?.x ?? 0,
				y: existing?.y ?? 0,
				vx: 0,
				vy: 0,
				rad: node.nodeType === VAULT_NODE_ACCOUNT ? this.accountRadius : this.identifierRadius
			};
		});
		this.nodeById = {};
		this.simNodes.forEach((node) => (this.nodeById[node.id] = node));

		// Place any brand-new nodes (no remembered position) around the centre
		const hasUnplaced = this.simNodes.some((node) => node.x === 0 && node.y === 0);
		if (hasUnplaced) this.layoutInitialPositions();
	}

	/**
	 * Lays out every node on a jittered circle centred in the SVG viewport.
	 */
	private layoutInitialPositions(): void {
		const width = this.viewportWidth();
		const height = this.viewportHeight();
		const centreX = width / 2;
		const centreY = height / 2;
		const count = Math.max(1, this.simNodes.length);
		this.simNodes.forEach((node, index) => {
			const angle = (index / count) * Math.PI * 2;
			const radius = Math.min(width, height) * 0.42;
			node.x = centreX + Math.cos(angle) * radius;
			node.y = centreY + Math.sin(angle) * radius;
			node.vx = 0;
			node.vy = 0;
		});
	}

	/**
	 * Runs one frame of the force simulation: node repulsion, edge springs, a gentle
	 * pull to centre, velocity damping, and viewport clamping. Schedules the next frame
	 * until the layout settles, unless a node is being dragged.
	 */
	private stepSimulation(): void {
		const width = this.viewportWidth();
		const height = this.viewportHeight();
		const centreX = width / 2;
		const centreY = height / 2;
		const nodes = this.simNodes;

		for (let i = 0; i < nodes.length; i++) {
			const first = nodes[i];
			for (let j = i + 1; j < nodes.length; j++) {
				const second = nodes[j];
				const deltaX = first.x - second.x;
				const deltaY = first.y - second.y;
				const distanceSquared = deltaX * deltaX + deltaY * deltaY || 1;
				const distance = Math.sqrt(distanceSquared);
				const minDistance = first.rad + second.rad + this.minSpacingGap;
				let force = this.repulsionStrength / distanceSquared;
				if (distance < minDistance) force += (minDistance - distance) * this.overlapPush;
				const forceX = (deltaX / distance) * force;
				const forceY = (deltaY / distance) * force;
				first.vx += forceX;
				first.vy += forceY;
				second.vx -= forceX;
				second.vy -= forceY;
			}
			first.vx += (centreX - first.x) * this.centeringStrength;
			first.vy += (centreY - first.y) * this.centeringStrength;
		}

		this.edges.forEach((edge) => {
			const source = this.nodeById[edge.sourceId];
			const target = this.nodeById[edge.targetId];
			if (!source || !target) return;
			const deltaX = target.x - source.x;
			const deltaY = target.y - source.y;
			const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) || 1;
			const force = (distance - this.linkTargetLength) * this.linkStrength;
			const forceX = (deltaX / distance) * force;
			const forceY = (deltaY / distance) * force;
			source.vx += forceX;
			source.vy += forceY;
			target.vx -= forceX;
			target.vy -= forceY;
		});

		nodes.forEach((node) => {
			if (node === this.dragNode) return;
			node.vx *= this.velocityDamping;
			node.vy *= this.velocityDamping;
			node.x += node.vx;
			node.y += node.vy;
			node.x = Math.max(this.boundaryPadding, Math.min(width - this.boundaryPadding, node.x));
			node.y = Math.max(this.boundaryPadding, Math.min(height - this.boundaryPadding, node.y));
		});

		this.renderPositions();
		this.frameCount++;
		if (this.frameCount < this.settleFrames || this.dragNode) {
			this.animationFrame = requestAnimationFrame(() => this.stepSimulation());
		} else {
			this.animationFrame = null;
		}
	}

	/**
	 * Restarts the settle countdown and ensures the animation loop is running.
	 */
	private kickSimulation(): void {
		this.frameCount = 0;
		if (this.animationFrame === null) {
			this.animationFrame = requestAnimationFrame(() => this.stepSimulation());
		}
	}

	/**
	 * Creates the SVG element for every node and edge, wiring node pointer handlers,
	 * then applies the current visual highlight.
	 */
	private buildSvg(): void {
		const svg = this.svgRef.nativeElement;
		if (!svg.querySelector('defs')) {
			const defs = document.createElementNS(SVG_NS, 'defs');
			defs.innerHTML =
				'<filter id="vault-tile-shadow" x="-60%" y="-60%" width="220%" height="220%">' +
				'<feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="rgba(60,30,50,0.28)"/></filter>';
			svg.insertBefore(defs, svg.firstChild);
		}

		const edgeGroup = this.edgeGroupRef.nativeElement;
		const nodeGroup = this.nodeGroupRef.nativeElement;
		edgeGroup.innerHTML = '';
		nodeGroup.innerHTML = '';

		this.edgeEls = this.edges.map(() => {
			const line = document.createElementNS(SVG_NS, 'line');
			line.setAttribute('stroke-linecap', 'round');
			edgeGroup.appendChild(line);
			return line;
		});

		this.nodeGroupEls = [];
		this.nodeShapeEls = [];
		this.nodeLabelEls = [];
		this.simNodes.forEach((node) => {
			const group = document.createElementNS(SVG_NS, 'g');
			group.setAttribute('class', 'vault-node');
			const shape = this.createNodeShape(node);
			const glyph = this.createNodeGlyph(node);
			const label = this.createNodeLabel(node);
			group.appendChild(shape);
			group.appendChild(glyph);
			group.appendChild(label);
			if (node.verified && node.nodeType === VAULT_NODE_ACCOUNT) {
				group.appendChild(this.createVerifiedBadge(node));
			}
			group.addEventListener('pointerdown', (event) => this.onNodeDown(event, node));
			nodeGroup.appendChild(group);
			this.nodeGroupEls.push(group);
			this.nodeShapeEls.push(shape);
			this.nodeLabelEls.push(label);
		});

		this.applyVisual();
	}

	/**
	 * Creates the filled shape for a node — a rounded tile for accounts, a circle for
	 * email, and a diamond for phone identifiers.
	 *
	 * @param node - The simulation node to build a shape for.
	 * @returns The created SVG shape element.
	 */
	private createNodeShape(node: VaultSimNode): SVGElement {
		if (node.nodeType === VAULT_NODE_ACCOUNT) {
			const size = node.rad * 2;
			const rect = document.createElementNS(SVG_NS, 'rect');
			rect.setAttribute('width', String(size));
			rect.setAttribute('height', String(size));
			rect.setAttribute('x', String(-node.rad));
			rect.setAttribute('y', String(-node.rad));
			rect.setAttribute('rx', String(node.rad * 0.62));
			rect.setAttribute('fill', node.hex);
			rect.setAttribute('stroke', VAULT_NODE_STROKE);
			rect.setAttribute('stroke-width', String(this.borderResting));
			rect.setAttribute('filter', 'url(#vault-tile-shadow)');
			return rect;
		}
		if (node.nodeType === VAULT_NODE_EMAIL) {
			const circle = document.createElementNS(SVG_NS, 'circle');
			circle.setAttribute('r', String(node.rad));
			circle.setAttribute('fill', node.hex);
			circle.setAttribute('stroke', VAULT_NODE_STROKE);
			circle.setAttribute('stroke-width', '2');
			return circle;
		}
		if (node.nodeType === VAULT_NODE_PHONE) {
			const diamond = document.createElementNS(SVG_NS, 'polygon');
			const reach = node.rad * 1.2;
			diamond.setAttribute('points', `0,${-reach} ${reach},0 0,${reach} ${-reach},0`);
			diamond.setAttribute('fill', node.hex);
			diamond.setAttribute('stroke', VAULT_NODE_STROKE);
			diamond.setAttribute('stroke-width', '2');
			return diamond;
		}
		// link → hexagon (flat-top)
		const hexagon = document.createElementNS(SVG_NS, 'polygon');
		const radius = node.rad * 1.15;
		const corners: string[] = [];
		for (let corner = 0; corner < 6; corner++) {
			const angle = (Math.PI / 3) * corner - Math.PI / 2;
			corners.push(`${(Math.cos(angle) * radius).toFixed(2)},${(Math.sin(angle) * radius).toFixed(2)}`);
		}
		hexagon.setAttribute('points', corners.join(' '));
		hexagon.setAttribute('fill', node.hex);
		hexagon.setAttribute('stroke', VAULT_NODE_STROKE);
		hexagon.setAttribute('stroke-width', '2');
		return hexagon;
	}

	/**
	 * Creates a small verified check badge anchored to the top-right of an account tile.
	 *
	 * @param node - The account node to badge.
	 * @returns The badge SVG group.
	 */
	private createVerifiedBadge(node: VaultSimNode): SVGGElement {
		const badge = document.createElementNS(SVG_NS, 'g');
		const offset = node.rad * 0.72;
		badge.setAttribute('transform', `translate(${offset},${-offset})`);
		badge.style.pointerEvents = 'none';
		const circle = document.createElementNS(SVG_NS, 'circle');
		circle.setAttribute('r', String(node.rad * 0.42));
		circle.setAttribute('fill', this.verifiedBadgeColor);
		circle.setAttribute('stroke', VAULT_NODE_STROKE);
		circle.setAttribute('stroke-width', '1.5');
		const check = document.createElementNS(SVG_NS, 'text');
		check.setAttribute('text-anchor', 'middle');
		check.setAttribute('dominant-baseline', 'central');
		check.setAttribute('fill', '#fff');
		check.setAttribute('font-family', 'Material Symbols Outlined');
		check.setAttribute('font-size', String(Math.round(node.rad * 0.55)));
		check.style.fontFeatureSettings = "'liga'";
		check.textContent = 'check';
		badge.appendChild(circle);
		badge.appendChild(check);
		return badge;
	}

	/**
	 * Creates the centred glyph for a node — the account's initial letter, or a
	 * Material Symbols icon for email and phone identifiers.
	 *
	 * @param node - The simulation node to build a glyph for.
	 * @returns The created SVG text element.
	 */
	private createNodeGlyph(node: VaultSimNode): SVGTextElement {
		const glyph = document.createElementNS(SVG_NS, 'text');
		glyph.setAttribute('text-anchor', 'middle');
		glyph.setAttribute('dominant-baseline', 'central');
		glyph.setAttribute('fill', '#fff');
		glyph.style.pointerEvents = 'none';
		if (node.nodeType === VAULT_NODE_ACCOUNT) {
			glyph.setAttribute('font-size', String(Math.round(node.rad * 0.95)));
			glyph.setAttribute('font-weight', '800');
			glyph.textContent = node.letter;
		} else {
			glyph.setAttribute('font-size', String(Math.round(node.rad * 1.25)));
			glyph.setAttribute('font-weight', '700');
			glyph.setAttribute('font-family', 'Material Symbols Outlined');
			glyph.style.fontFeatureSettings = "'liga'";
			glyph.textContent =
				node.nodeType === VAULT_NODE_EMAIL
					? VAULT_EMAIL_META.icon
					: node.nodeType === VAULT_NODE_LINK
						? VAULT_LINK_META.icon
						: VAULT_PHONE_META.icon;
		}
		return glyph;
	}

	/**
	 * Creates the name label rendered beneath a node.
	 *
	 * @param node - The simulation node to label.
	 * @returns The created SVG text element.
	 */
	private createNodeLabel(node: VaultSimNode): SVGTextElement {
		const isAccount = node.nodeType === VAULT_NODE_ACCOUNT;
		const label = document.createElementNS(SVG_NS, 'text');
		label.setAttribute('text-anchor', 'middle');
		label.setAttribute('font-size', isAccount ? '11.5' : '10');
		label.setAttribute('font-weight', isAccount ? '700' : '500');
		label.setAttribute('fill', isAccount ? VAULT_LABEL_COLOR_ACCOUNT : VAULT_LABEL_COLOR_IDENTIFIER);
		label.setAttribute('y', String(node.rad + 15));
		label.style.pointerEvents = 'none';
		label.textContent = node.name;
		return label;
	}

	/**
	 * Writes the latest simulated positions into the node and edge SVG elements.
	 */
	private renderPositions(): void {
		this.nodeGroupEls.forEach((group, index) => {
			const node = this.simNodes[index];
			group.setAttribute('transform', `translate(${node.x},${node.y})`);
		});
		this.edgeEls.forEach((line, index) => {
			const edge = this.edges[index];
			const source = this.nodeById[edge.sourceId];
			const target = this.nodeById[edge.targetId];
			if (!source || !target) return;
			line.setAttribute('x1', String(source.x));
			line.setAttribute('y1', String(source.y));
			line.setAttribute('x2', String(target.x));
			line.setAttribute('y2', String(target.y));
		});
	}

	/**
	 * Applies the selection highlight and search dimming. When a node is selected,
	 * its web is traced by hop distance (direct = rose, second-degree = amber) and
	 * everything beyond two hops dims out.
	 */
	private applyVisual(): void {
		if (!this.nodeShapeEls.length) return;
		const selectedId = this.selectedId;
		const levels = selectedId ? this.levelsFrom(selectedId) : null;
		const query = this.query.trim().toLowerCase();

		// Category filter: that category's accounts plus their first-degree neighbours
		let categoryBase: Set<string> | null = null;
		let categoryVisible: Set<string> | null = null;
		if (this.categoryFilter) {
			categoryBase = new Set<string>();
			this.simNodes.forEach((node) => {
				if (node.nodeType === VAULT_NODE_ACCOUNT && node.category === this.categoryFilter) {
					categoryBase?.add(node.id);
				}
			});
			categoryVisible = new Set<string>(categoryBase);
			this.edges.forEach((edge) => {
				if (categoryBase?.has(edge.sourceId)) categoryVisible?.add(edge.targetId);
				if (categoryBase?.has(edge.targetId)) categoryVisible?.add(edge.sourceId);
			});
		}

		this.nodeShapeEls.forEach((shape, index) => {
			const node = this.simNodes[index];
			const group = this.nodeGroupEls[index];
			const label = this.nodeLabelEls[index];
			group.style.display = this.matchFilter(node, categoryVisible) ? '' : 'none';
			const reach =
				selectedId && levels
					? levels[node.id] !== undefined && levels[node.id] <= this.maxReachLevel
					: true;
			let dim = false;
			// While arming a link, keep every node full-colour so any target is easy to pick
			if (selectedId && !this.linkMode) dim = !reach;
			if (query && !node.name.toLowerCase().includes(query) && !(selectedId && reach)) dim = true;
			group.style.opacity = dim ? '0.16' : '1';

			const isAccount = node.nodeType === VAULT_NODE_ACCOUNT;
			const baseWidth = isAccount ? this.borderResting : 2;
			if (selectedId && levels && reach) {
				const level = levels[node.id];
				shape.setAttribute('stroke', level === 0 ? VAULT_NODE_STROKE : this.levelColor(level));
				shape.setAttribute(
					'stroke-width',
					String(level === 0 ? this.borderSelected : this.borderConnected)
				);
			} else {
				shape.setAttribute('stroke', VAULT_NODE_STROKE);
				shape.setAttribute('stroke-width', String(baseWidth));
			}
			const isSelected = node.id === selectedId;
			label.setAttribute('font-weight', isSelected ? '800' : isAccount ? '700' : '500');
			label.setAttribute(
				'fill',
				isSelected
					? VAULT_LABEL_COLOR_SELECTED
					: selectedId && levels && reach
						? this.levelColor(levels[node.id])
						: isAccount
							? VAULT_LABEL_COLOR_ACCOUNT
							: VAULT_LABEL_COLOR_IDENTIFIER
			);
		});

		this.edgeEls.forEach((line, index) => {
			const edge = this.edges[index];
			const source = this.nodeById[edge.sourceId];
			const target = this.nodeById[edge.targetId];
			let visible =
				!!source &&
				!!target &&
				this.matchFilter(source, categoryVisible) &&
				this.matchFilter(target, categoryVisible);
			if (visible && categoryBase)
				visible = categoryBase.has(edge.sourceId) || categoryBase.has(edge.targetId);
			line.style.display = visible ? '' : 'none';
			const sourceLevel = levels ? levels[edge.sourceId] : undefined;
			const targetLevel = levels ? levels[edge.targetId] : undefined;
			const reach =
				!!selectedId &&
				sourceLevel !== undefined &&
				targetLevel !== undefined &&
				Math.max(sourceLevel, targetLevel) <= this.maxReachLevel;
			const level = reach ? Math.max(sourceLevel ?? 0, targetLevel ?? 0) : 0;
			line.setAttribute('stroke', reach ? this.levelColor(level) : VAULT_EDGE_RESTING_COLOR);
			line.setAttribute('stroke-width', reach ? (level <= 1 ? '2.6' : '1.8') : '1.2');
			line.setAttribute('opacity', reach ? '0.85' : selectedId ? '0.08' : '0.45');
		});
	}

	/**
	 * Returns true when a node should be visible given the active type filter and the
	 * category filter. The type filter isolates a single node type — or, for the verified
	 * key, only verified accounts — while a category filter restricts visibility to that
	 * category's accounts and their first-degree neighbours.
	 *
	 * @param node - The simulation node to test.
	 * @param categoryVisible - The set of node ids visible under the active category filter, or null.
	 * @returns Whether the node should be shown.
	 */
	private matchFilter(node: VaultSimNode, categoryVisible: Set<string> | null): boolean {
		if (this.typeFilter === VAULT_FILTER_KEY_VERIFIED) {
			if (!(node.nodeType === VAULT_NODE_ACCOUNT && node.verified)) return false;
		} else if (this.typeFilter && node.nodeType !== this.typeFilter) {
			return false;
		}
		if (this.categoryFilter) return categoryVisible ? categoryVisible.has(node.id) : false;
		return true;
	}

	// ── Interaction ──────────────────────────────────────────────────────────

	/**
	 * Handles a pointer-down on a node: starts a drag, and on release without movement
	 * toggles the node's selection (emitting the new selection to the parent).
	 *
	 * @param event - The originating pointer event.
	 * @param node - The simulation node under the pointer.
	 */
	private onNodeDown(event: PointerEvent, node: VaultSimNode): void {
		event.stopPropagation();
		if (this.linkMode) {
			// In link mode a click links the armed source to the clicked node — no dragging
			if (node.id !== this.linkSourceId) this.ngZone.run(() => this.linkTarget.emit(node.id));
			return;
		}
		this.dragNode = node;
		this.dragMoved = false;
		const move = (moveEvent: PointerEvent): void => {
			const point = this.toLocalPoint(moveEvent.clientX, moveEvent.clientY);
			node.x = point.x;
			node.y = point.y;
			node.vx = 0;
			node.vy = 0;
			this.dragMoved = true;
			this.kickSimulation();
		};
		const up = (): void => {
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerup', up);
			this.dragNode = null;
			if (!this.dragMoved) {
				const next = this.selectedId === node.id ? null : node.id;
				this.ngZone.run(() => this.nodeSelect.emit(next));
			}
			this.kickSimulation();
		};
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', up);
	}

	/**
	 * Binds background panning and wheel zoom on the SVG. Pressing on empty canvas
	 * clears any current selection and begins a pan.
	 */
	private bindPan(): void {
		const svg = this.svgRef.nativeElement;
		let panning = false;
		let startX = 0;
		let startY = 0;
		let originX = 0;
		let originY = 0;
		svg.addEventListener('pointerdown', (event) => {
			if ((event.target as Element).closest('.vault-node')) return;
			panning = true;
			startX = event.clientX;
			startY = event.clientY;
			originX = this.camera.x;
			originY = this.camera.y;
			svg.style.cursor = 'grabbing';
			if (this.selectedId) this.ngZone.run(() => this.nodeSelect.emit(null));
		});
		this.panMoveHandler = (event: PointerEvent): void => {
			if (!panning) return;
			this.camera.x = originX + (event.clientX - startX);
			this.camera.y = originY + (event.clientY - startY);
			this.applyCamera();
		};
		this.panUpHandler = (): void => {
			panning = false;
			svg.style.cursor = 'grab';
		};
		window.addEventListener('pointermove', this.panMoveHandler);
		window.addEventListener('pointerup', this.panUpHandler);
		svg.addEventListener(
			'wheel',
			(event) => {
				event.preventDefault();
				this.zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1.1 : 0.9);
			},
			{ passive: false }
		);
	}

	/**
	 * Converts client coordinates into the simulation's local coordinate space,
	 * accounting for the current pan and zoom.
	 *
	 * @param clientX - The pointer X position in client space.
	 * @param clientY - The pointer Y position in client space.
	 * @returns The point in local simulation coordinates.
	 */
	private toLocalPoint(clientX: number, clientY: number): { x: number; y: number } {
		const rect = this.svgRef.nativeElement.getBoundingClientRect();
		return {
			x: (clientX - rect.left - this.camera.x) / this.camera.scale,
			y: (clientY - rect.top - this.camera.y) / this.camera.scale
		};
	}

	/**
	 * Zooms the camera toward a client-space focal point by the given factor.
	 *
	 * @param clientX - The focal X position in client space.
	 * @param clientY - The focal Y position in client space.
	 * @param factor - The multiplicative zoom factor (>1 zooms in).
	 */
	private zoomAt(clientX: number, clientY: number, factor: number): void {
		const rect = this.svgRef.nativeElement.getBoundingClientRect();
		const pointX = clientX - rect.left;
		const pointY = clientY - rect.top;
		const nextScale = Math.max(0.4, Math.min(2.5, this.camera.scale * factor));
		this.camera.x = pointX - (pointX - this.camera.x) * (nextScale / this.camera.scale);
		this.camera.y = pointY - (pointY - this.camera.y) * (nextScale / this.camera.scale);
		this.camera.scale = nextScale;
		this.applyCamera();
	}

	/**
	 * Applies the current camera transform to the pan group.
	 */
	private applyCamera(): void {
		this.panRef.nativeElement.setAttribute(
			'transform',
			`translate(${this.camera.x},${this.camera.y}) scale(${this.camera.scale})`
		);
	}

	/**
	 * Recentres all nodes when the SVG host changes size so the layout stays centred.
	 */
	private observeResize(): void {
		let lastWidth = this.viewportWidth();
		let lastHeight = this.viewportHeight();
		this.resizeObserver = new ResizeObserver(() => {
			const width = this.viewportWidth();
			const height = this.viewportHeight();
			if (width < 60 || height < 60) return;
			const shiftX = (width - lastWidth) / 2;
			const shiftY = (height - lastHeight) / 2;
			if (Math.abs(shiftX) > 0.5 || Math.abs(shiftY) > 0.5) {
				this.simNodes.forEach((node) => {
					node.x += shiftX;
					node.y += shiftY;
				});
				this.kickSimulation();
			}
			lastWidth = width;
			lastHeight = height;
		});
		this.resizeObserver.observe(this.svgRef.nativeElement);
	}

	// ── Graph helpers ────────────────────────────────────────────────────────

	/**
	 * Computes the hop distance from a node to every reachable node via breadth-first search.
	 *
	 * @param startId - The id of the node to measure distances from.
	 * @returns A map of node id to its hop level (0 for the start node).
	 */
	private levelsFrom(startId: string): Record<string, number> {
		const adjacency: Record<string, string[]> = {};
		this.edges.forEach((edge) => {
			(adjacency[edge.sourceId] = adjacency[edge.sourceId] ?? []).push(edge.targetId);
			(adjacency[edge.targetId] = adjacency[edge.targetId] ?? []).push(edge.sourceId);
		});
		const levels: Record<string, number> = { [startId]: 0 };
		let frontier = [startId];
		while (frontier.length) {
			const next: string[] = [];
			frontier.forEach((nodeId) =>
				(adjacency[nodeId] ?? []).forEach((neighbourId) => {
					if (levels[neighbourId] === undefined) {
						levels[neighbourId] = levels[nodeId] + 1;
						next.push(neighbourId);
					}
				})
			);
			frontier = next;
		}
		return levels;
	}

	/**
	 * Gets the highlight color for a hop level.
	 *
	 * @param level - The hop level (0 = selected, 1 = direct, 2 = second-degree).
	 * @returns The hex color for that level.
	 */
	private levelColor(level: number): string {
		return VAULT_LEVEL_COLORS[Math.min(level, VAULT_LEVEL_COLORS.length - 1)];
	}

	/**
	 * Tallies the legend counts — per node type plus verified accounts — in a single pass over the
	 * current nodes. Called from ngOnChanges when the node set changes, so the template binds a stored
	 * object instead of re-scanning the nodes on every change-detection pass.
	 */
	private updateLegendCounts(): void {
		const counts: VaultLegendCounts = { account: 0, email: 0, phone: 0, link: 0, verified: 0 };
		for (const node of this.nodes) {
			if (node.nodeType === VAULT_NODE_ACCOUNT) {
				counts.account++;
				if (node.verified) counts.verified++;
			} else if (node.nodeType === VAULT_NODE_EMAIL) {
				counts.email++;
			} else if (node.nodeType === VAULT_NODE_PHONE) {
				counts.phone++;
			} else if (node.nodeType === VAULT_NODE_LINK) {
				counts.link++;
			}
		}
		this.legendCounts = counts;
	}

	/**
	 * Gets the solid fill color for a node — its category color for accounts, or the
	 * fixed identifier color for emails and phones.
	 *
	 * @param node - The node to resolve a color for.
	 * @returns The hex fill color.
	 */
	private getNodeHex(node: VaultNode): string {
		if (node.nodeType === VAULT_NODE_EMAIL) return VAULT_EMAIL_META.hex;
		if (node.nodeType === VAULT_NODE_PHONE) return VAULT_PHONE_META.hex;
		if (node.nodeType === VAULT_NODE_LINK) return VAULT_LINK_META.hex;
		const builtIn = VAULT_CATEGORY_DEFS.find((categoryDef) => categoryDef.key === node.category);
		if (builtIn) return builtIn.hex;
		const custom = this.customCategories.find((categoryDef) => categoryDef.key === node.category);
		return custom ? custom.hex : VAULT_CATEGORY_OTHER.hex;
	}

	/**
	 * Gets the current SVG host width, falling back to a safe default before layout.
	 *
	 * @returns The host width in pixels.
	 */
	private viewportWidth(): number {
		return this.svgRef.nativeElement.clientWidth || 900;
	}

	/**
	 * Gets the current SVG host height, falling back to a safe default before layout.
	 *
	 * @returns The host height in pixels.
	 */
	private viewportHeight(): number {
		return this.svgRef.nativeElement.clientHeight || 600;
	}
}
