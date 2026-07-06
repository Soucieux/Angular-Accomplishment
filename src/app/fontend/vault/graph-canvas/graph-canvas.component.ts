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
	VAULT_FILTER_KEY_VERIFIED,
	VAULT_RELATION_BACKUP
} from '../../../common/constants';
import {
	VAULT_LEGEND_TITLE,
	VAULT_LEGEND_VERIFIED,
	VAULT_LEGEND_BACKUP,
	VAULT_TYPE_ACCOUNT,
	VAULT_TYPE_EMAIL,
	VAULT_TYPE_PHONE
} from '../../../common/locale/locale-strings';
import {
	VaultCategoryDef,
	VaultEdge,
	VaultLegendCounts,
	VaultNode,
	VaultSimNode,
	VAULT_BACKUP_ARROW_GAP,
	VAULT_BACKUP_ARROW_MARKER_ID,
	VAULT_BACKUP_LINK_COLOR,
	VAULT_BACKUP_LINK_WIDTH,
	VAULT_CATEGORY_DEFS,
	VAULT_CATEGORY_OTHER,
	VAULT_EDGE_BACKUP_DASH,
	VAULT_EDGE_RESTING_COLOR,
	VAULT_EMAIL_META,
	VAULT_GLYPH_COLOR_IDENTIFIER,
	VAULT_GRAPH_ENTRANCE_STYLE_ID,
	VAULT_LABEL_COLOR_ACCOUNT,
	VAULT_LABEL_COLOR_IDENTIFIER,
	VAULT_LABEL_COLOR_SELECTED,
	VAULT_LEVEL_COLORS,
	VAULT_LINK_META,
	VAULT_NODE_ENTRANCE_MAX_DELAY_MS,
	VAULT_NODE_ENTRANCE_STEP_MS,
	VAULT_NODE_STROKE,
	VAULT_PHONE_META
} from '../vault.model';
import { Utilities } from '../../../common/utilities/app.utilities';

/** SVG namespace used for all imperatively-created graph elements. */
const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Entrance-animation CSS for the graph's imperatively-created node and edge elements, injected
 * directly into <head> at runtime via {@link Utilities.injectGlobalStyleOnce}. It cannot live in
 * the component stylesheet because Angular's ViewEncapsulation.Emulated prefixes every selector
 * with a scoping attribute that only elements created through Angular's own template renderer
 * receive — nodes and edges here are built via raw document.createElementNS calls, so a scoped
 * rule would never match them (the same issue documented in entertainment.component.ts for
 * ::view-transition-* pseudo-elements).
 */
const VAULT_GRAPH_ENTRANCE_CSS = `
.vault-node-visual{transform-origin:center;animation:vaultNodeSettle .42s cubic-bezier(.16,1,.3,1) both}
@keyframes vaultNodeSettle{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
.vault-edge-materialize{animation:vaultEdgeMaterialize .55s ease .3s backwards}
@keyframes vaultEdgeMaterialize{from{opacity:0}to{opacity:1}}
`;

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
	protected readonly VAULT_LEGEND_BACKUP = VAULT_LEGEND_BACKUP;
	protected readonly VAULT_TYPE_ACCOUNT = VAULT_TYPE_ACCOUNT;
	protected readonly VAULT_TYPE_EMAIL = VAULT_TYPE_EMAIL;
	protected readonly VAULT_TYPE_PHONE = VAULT_TYPE_PHONE;
	protected readonly VAULT_NODE_ACCOUNT = VAULT_NODE_ACCOUNT;
	protected readonly VAULT_NODE_EMAIL = VAULT_NODE_EMAIL;
	protected readonly VAULT_NODE_PHONE = VAULT_NODE_PHONE;
	protected readonly VAULT_FILTER_KEY_VERIFIED = VAULT_FILTER_KEY_VERIFIED;

	// ── Force-simulation tuning ──────────────────────────────────────────────
	private readonly accountRadius = 22;
	private readonly identifierRadius = 17;
	private readonly borderResting = 2.5;
	private readonly borderSelected = 4;
	private readonly borderConnected = 3;
	private readonly repulsionStrength = 2200;
	private readonly minSpacingGap = 64;
	private readonly overlapPush = 0.16;
	private readonly linkTargetLength = 190;
	private readonly linkStrength = 0.015;
	private readonly centeringStrength = 0.0016;
	private readonly velocityDamping = 0.82;
	/* Node-count base scale: at or below baseScaleNodeThreshold nodes the map opens at 1:1; above it
	   the resting scale steps down once per baseScaleNodeStep extra nodes, boosted by baseScaleBoost
	   and floored at minBaseScale, so a crowded graph is narrowed to fit without shrinking too far. */
	private readonly baseScaleNodeThreshold = 30;
	private readonly baseScaleNodeStep = 10;
	// Two zoom-in clicks (1.15² ≈ 1.3225) — the size confirmed correct for a 61-node graph.
	private readonly baseScaleBoost = 1.3225;
	private readonly minBaseScale = 0.66;
	private readonly settleFrames = 260;
	private readonly maxReachLevel = 2;
	private readonly verifiedBadgeColor = '#0d9488';

	protected legendCounts: VaultLegendCounts = { account: 0, email: 0, phone: 0, verified: 0, backup: 0 };

	private simNodes: VaultSimNode[] = [];
	private nodeById: Record<string, VaultSimNode> = {};
	private nodeGroupEls: SVGGElement[] = [];
	private nodeShapeEls: SVGElement[] = [];
	private nodeLabelEls: SVGTextElement[] = [];
	private edgeEls: SVGLineElement[] = [];
	private renderEdges: VaultEdge[] = [];
	private mutualBackupEdgeIds = new Set<string>();
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
				Utilities.injectGlobalStyleOnce(VAULT_GRAPH_ENTRANCE_STYLE_ID, VAULT_GRAPH_ENTRANCE_CSS);
				this.buildSimulation();
				this.buildSvg();
				this.bindPan();
				this.observeResize();
				this.applyBaseScale();
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
		/* Tally the legend counts whenever the node or edge set changes (backup count is edge-based) —
		   independent of viewReady so the legend is correct on first render, before the simulation view
		   has measured its size. */
		if (changes['nodes'] || changes['edges']) this.updateLegendCounts();
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
		this.layoutInitialPositions();
		this.applyBaseScale();
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
				categories: node.categories,
				hexes: this.getNodeHexes(node),
				letter: Utilities.getInitials(node.name),
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
	 * pull to centre, and velocity damping. Schedules the next frame until the layout
	 * settles, unless a node is being dragged.
	 */
	private stepSimulation(): void {
		const width = this.viewportWidth();
		const height = this.viewportHeight();
		const centreX = width / 2;
		const centreY = height / 2;
		const nodes = this.simNodes;

		// Repel every node pair (with a minimum-spacing push), then pull each toward the viewport centre
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

		// Edge springs pull linked nodes toward the target link length
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

		// Damp velocity and integrate positions; the dragged node is placed by the pointer handler
		nodes.forEach((node) => {
			if (node === this.dragNode) return;
			node.vx *= this.velocityDamping;
			node.vy *= this.velocityDamping;
			node.x += node.vx;
			node.y += node.vy;
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
	 * Gets the resting camera scale for the current node count. At or below the threshold the map opens
	 * at 1:1; above it the scale steps down once per baseScaleNodeStep extra nodes, boosted by
	 * baseScaleBoost so a crowded graph stays readable, capped at 1:1 and floored at minBaseScale.
	 *
	 * @returns The base scale the map opens and resets at.
	 */
	private baseScale(): number {
		const count = this.simNodes.length;
		if (count <= this.baseScaleNodeThreshold) return 1;
		/* Quantise the count up to the next baseScaleNodeStep bucket so the zoom-out steps in on each
		   increment of ten nodes rather than shifting on every single node added. */
		const steppedCount =
			this.baseScaleNodeThreshold +
			Math.ceil((count - this.baseScaleNodeThreshold) / this.baseScaleNodeStep) * this.baseScaleNodeStep;
		const boostedScale = Math.sqrt(this.baseScaleNodeThreshold / steppedCount) * this.baseScaleBoost;
		return Math.min(1, Math.max(this.minBaseScale, boostedScale));
	}

	/**
	 * Sets the camera to the resting base scale, centred on the viewport, so the whole graph opens
	 * framed — at 1:1 for a small graph and zoomed out for a crowded one. Used on first render and reset.
	 */
	private applyBaseScale(): void {
		const scale = this.baseScale();
		const width = this.viewportWidth();
		const height = this.viewportHeight();
		this.camera = { scale, x: (width / 2) * (1 - scale), y: (height / 2) * (1 - scale) };
		this.applyCamera();
	}

	/**
	 * Collapses a mutual backup pair — two nodes that each declare the other as backup — into a
	 * single rendered edge, so the map draws one double-headed dashed line instead of two dashed
	 * lines on the same segment (whose opposite dash phases interleave into what reads as solid).
	 * The raw {@link edges} input keeps both directed edges for the layout springs, hop-distance
	 * search, and legend count — only the drawn set is deduplicated.
	 */
	private computeRenderEdges(): void {
		// Record every directed backup edge so a reverse-direction lookup is O(1) below.
		const backupPairs = new Set<string>();
		this.edges.forEach((edge) => {
			if (edge.relation === VAULT_RELATION_BACKUP) backupPairs.add(`${edge.sourceId}>${edge.targetId}`);
		});

		const seenMutualPairs = new Set<string>();
		const mutualIds = new Set<string>();
		const renderEdges: VaultEdge[] = [];

		// Keep every non-backup edge and every one-directional backup edge unchanged; for a mutual
		// pair, keep only the first-seen direction and mark it for a double-headed arrow.
		this.edges.forEach((edge) => {
			if (edge.relation !== VAULT_RELATION_BACKUP) {
				renderEdges.push(edge);
				return;
			}
			const isMutual = backupPairs.has(`${edge.targetId}>${edge.sourceId}`);
			if (!isMutual) {
				renderEdges.push(edge);
				return;
			}
			const pairKey = [edge.sourceId, edge.targetId].sort().join('|');
			if (seenMutualPairs.has(pairKey)) return;
			seenMutualPairs.add(pairKey);
			mutualIds.add(edge.id);
			renderEdges.push(edge);
		});
		this.renderEdges = renderEdges;
		this.mutualBackupEdgeIds = mutualIds;
	}

	/**
	 * Computes a node's entrance delay, staggered by its position in the simulation's node
	 * list so the network settles in node-by-node rather than all at once.
	 *
	 * @param index - The zero-based index of the node in {@link simNodes}.
	 * @returns The animation delay in milliseconds, capped at VAULT_NODE_ENTRANCE_MAX_DELAY_MS.
	 */
	private nodeEntranceDelay(index: number): number {
		return Math.min(VAULT_NODE_ENTRANCE_MAX_DELAY_MS, index * VAULT_NODE_ENTRANCE_STEP_MS);
	}

	/**
	 * Creates the SVG element for every node and edge — including their staggered entrance —
	 * wiring node pointer handlers, then applies the current visual highlight.
	 */
	private buildSvg(): void {
		this.computeRenderEdges();
		const svg = this.svgRef.nativeElement;
		if (!svg.querySelector('defs')) {
			const defs = document.createElementNS(SVG_NS, 'defs');
			// The clip masks the segmented category wedges to the account tile's rounded-square outline.
			const clipRadius = this.accountRadius;
			const clipCornerRadius = clipRadius * 0.62;
			/* Build the filter and clipPath with createElementNS (not innerHTML) so both land in the SVG
			   namespace — WebKit ignores innerHTML-parsed clipPaths, which drops the multi-category fill. */
			const shadow = this.createSvgElement('feDropShadow', {
				dx: '0',
				dy: '3',
				stdDeviation: '4',
				'flood-color': 'rgba(60,30,50,0.28)'
			});
			const filter = this.createSvgElement('filter', {
				id: 'vault-tile-shadow',
				x: '-60%',
				y: '-60%',
				width: '220%',
				height: '220%'
			});
			filter.appendChild(shadow);
			const clipRect = this.createSvgElement('rect', {
				x: String(-clipRadius),
				y: String(-clipRadius),
				width: String(clipRadius * 2),
				height: String(clipRadius * 2),
				rx: String(clipCornerRadius)
			});
			const clipPath = this.createSvgElement('clipPath', { id: 'vault-account-clip' });
			clipPath.appendChild(clipRect);
			/* Bold triangular arrowhead for backup edges. refX/refY sit at the triangle's tip (10,5 in the
			   10x10 viewBox) so the marker's reference point — where it aligns to the line's endpoint —
			   is the tip itself, not the marker's bounding-box corner. userSpaceOnUse keeps its on-screen
			   size fixed regardless of the line's stroke-width. */
			const backupArrowShape = this.createSvgElement('path', {
				d: 'M 0 0 L 10 5 L 0 10 Z',
				fill: VAULT_BACKUP_LINK_COLOR
			});
			const backupArrowMarker = this.createSvgElement('marker', {
				id: VAULT_BACKUP_ARROW_MARKER_ID,
				viewBox: '0 0 10 10',
				refX: '10',
				refY: '5',
				markerWidth: '14',
				markerHeight: '14',
				markerUnits: 'userSpaceOnUse',
				orient: 'auto-start-reverse'
			});
			backupArrowMarker.appendChild(backupArrowShape);
			defs.appendChild(filter);
			defs.appendChild(clipPath);
			defs.appendChild(backupArrowMarker);
			svg.insertBefore(defs, svg.firstChild);
		}

		const edgeGroup = this.edgeGroupRef.nativeElement;
		const nodeGroup = this.nodeGroupRef.nativeElement;
		edgeGroup.innerHTML = '';
		nodeGroup.innerHTML = '';

		this.edgeEls = this.renderEdges.map((edge) => {
			const line = document.createElementNS(SVG_NS, 'line');
			line.setAttribute('stroke-linecap', 'round');

			// Fades in once the graph first builds — see the CSS rule for why its fill-mode is
			// "backwards" rather than "both" (applyVisual() must regain control of opacity after).
			line.setAttribute('class', 'vault-edge-materialize');

			// A backup edge (non-account identifier → its backup) reads distinctly as a bold dashed,
			// arrowed line — see applyVisual() for its always-on styling and renderPositions() for the
			// shortened endpoint that keeps the arrowhead visible outside the target node's circle.
			if (edge.relation === VAULT_RELATION_BACKUP) {
				line.setAttribute('stroke-dasharray', VAULT_EDGE_BACKUP_DASH);
				line.setAttribute('marker-end', `url(#${VAULT_BACKUP_ARROW_MARKER_ID})`);

				// Mutual backup pair (each node backs up the other) — one line, arrowed at both ends,
				// instead of two overlapping dashed lines whose opposite phases read as a solid line.
				if (this.mutualBackupEdgeIds.has(edge.id)) {
					line.setAttribute('marker-start', `url(#${VAULT_BACKUP_ARROW_MARKER_ID})`);
				}
			}
			edgeGroup.appendChild(line);
			return line;
		});

		this.nodeGroupEls = [];
		this.nodeShapeEls = [];
		this.nodeLabelEls = [];
		this.simNodes.forEach((node, index) => {
			const group = document.createElementNS(SVG_NS, 'g');
			group.setAttribute('class', 'vault-node');

			/* Set inline so it survives view-encapsulation scoping (the group is created imperatively):
			   every node reads as clickable — to select, or to pick as a link target in link-mode. */
			group.style.cursor = 'pointer';

			/* Link-mode hover halo — a ring child revealed via opacity. An SVG-native element renders
			   reliably in WebKit, where a CSS filter on a <g> does not. Sits behind the node shape. */
			const hoverRing = document.createElementNS(SVG_NS, 'circle');
			hoverRing.setAttribute('r', String(node.rad + 6));
			hoverRing.setAttribute('fill', 'none');
			hoverRing.setAttribute('stroke', this.verifiedBadgeColor);
			hoverRing.setAttribute('stroke-width', '3');
			hoverRing.style.opacity = '0';
			hoverRing.style.transition = 'opacity 0.15s ease';
			hoverRing.style.pointerEvents = 'none';
			group.appendChild(hoverRing);

			/* The node's visual content settles in with a plain fade + gentle scale on this inner
			   wrapper rather than the outer group — the outer group's position transform is
			   overwritten every frame by renderPositions(), which would fight a CSS transform set
			   on that same element. */
			const visual = document.createElementNS(SVG_NS, 'g');
			visual.setAttribute('class', 'vault-node-visual');
			visual.style.animationDelay = `${this.nodeEntranceDelay(index)}ms`;

			// Segmented category fill sits beneath the (transparent-filled) tile shape for multi-category accounts.
			const fill = this.createNodeFill(node);
			if (fill) visual.appendChild(fill);
			const shape = this.createNodeShape(node);
			const glyph = this.createNodeGlyph(node);
			const label = this.createNodeLabel(node);
			visual.appendChild(shape);
			visual.appendChild(glyph);
			visual.appendChild(label);
			if (node.verified && node.nodeType === VAULT_NODE_ACCOUNT) {
				visual.appendChild(this.createVerifiedBadge(node));
			}
			group.appendChild(visual);

			group.addEventListener('pointerdown', (event) => this.onNodeDown(event, node));
			// Link-mode hover: reveal the halo on the node under the cursor so it reads as a link target.
			group.addEventListener('pointerenter', () => {
				if (this.linkMode) hoverRing.style.opacity = '1';
			});
			group.addEventListener('pointerleave', () => {
				hoverRing.style.opacity = '0';
			});
			nodeGroup.appendChild(group);
			this.nodeGroupEls.push(group);
			this.nodeShapeEls.push(shape);
			this.nodeLabelEls.push(label);
		});

		this.applyVisual();
	}

	/**
	 * Creates an SVG element in the SVG namespace with the given attributes set — used to build the
	 * defs (filter, clipPath) reliably instead of via innerHTML.
	 *
	 * @param tag - The SVG tag name to create.
	 * @param attributes - The attribute name/value pairs to set on the element.
	 * @returns The created SVG element.
	 */
	private createSvgElement(tag: string, attributes: Record<string, string>): SVGElement {
		const element = document.createElementNS(SVG_NS, tag);
		for (const [name, value] of Object.entries(attributes)) {
			element.setAttribute(name, value);
		}
		return element;
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
			/* A single-category (or uncategorized) account keeps a solid tile; two or more categories
			   leave the tile transparent so the segmented wedge fill beneath shows through. */
			rect.setAttribute('fill', node.hexes.length >= 2 ? 'none' : node.hexes[0]);
			/* Capture pointer events across the whole tile — a multi-category tile is fill:none, so
			   without this its centre would not register hover/clicks. */
			rect.setAttribute('pointer-events', 'all');
			rect.setAttribute('stroke', VAULT_NODE_STROKE);
			rect.setAttribute('stroke-width', String(this.borderResting));
			rect.setAttribute('filter', 'url(#vault-tile-shadow)');
			return rect;
		}
		if (node.nodeType === VAULT_NODE_EMAIL) {
			const circle = document.createElementNS(SVG_NS, 'circle');
			circle.setAttribute('r', String(node.rad));
			circle.setAttribute('fill', node.hexes[0]);
			circle.setAttribute('stroke', VAULT_NODE_STROKE);
			circle.setAttribute('stroke-width', '2');
			return circle;
		}
		if (node.nodeType === VAULT_NODE_PHONE) {
			const diamond = document.createElementNS(SVG_NS, 'polygon');
			const reach = node.rad * 1.2;
			diamond.setAttribute('points', `0,${-reach} ${reach},0 0,${reach} ${-reach},0`);
			diamond.setAttribute('fill', node.hexes[0]);
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
		hexagon.setAttribute('fill', node.hexes[0]);
		hexagon.setAttribute('stroke', VAULT_NODE_STROKE);
		hexagon.setAttribute('stroke-width', '2');
		return hexagon;
	}

	/**
	 * Creates the segmented category fill for an account with two or more categories — a group of
	 * pie wedges, one per category color, clipped to the account tile's rounded-square outline.
	 * Returns null for identifiers and single-category accounts, which fill via their solid shape.
	 *
	 * @param node - The simulation node to build a segmented fill for.
	 * @returns The clipped wedge group, or null when no segmented fill is needed.
	 */
	private createNodeFill(node: VaultSimNode): SVGGElement | null {
		if (node.nodeType !== VAULT_NODE_ACCOUNT || node.hexes.length < 2) return null;
		const group = document.createElementNS(SVG_NS, 'g');
		group.setAttribute('clip-path', 'url(#vault-account-clip)');
		group.style.pointerEvents = 'none';
		// Radius overshoots the tile so wedges reach into the rounded corners before the clip trims them.
		const radius = node.rad * 1.7;
		const count = node.hexes.length;
		for (let index = 0; index < count; index++) {
			const startAngle = (index / count) * Math.PI * 2 - Math.PI / 2;
			const endAngle = ((index + 1) / count) * Math.PI * 2 - Math.PI / 2;
			const startX = (Math.cos(startAngle) * radius).toFixed(2);
			const startY = (Math.sin(startAngle) * radius).toFixed(2);
			const endX = (Math.cos(endAngle) * radius).toFixed(2);
			const endY = (Math.sin(endAngle) * radius).toFixed(2);
			const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
			const wedge = document.createElementNS(SVG_NS, 'path');
			wedge.setAttribute(
				'd',
				`M 0 0 L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`
			);
			wedge.setAttribute('fill', node.hexes[index]);
			group.appendChild(wedge);
		}
		return group;
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
		const badgeRadius = node.rad * 0.42;
		const circle = document.createElementNS(SVG_NS, 'circle');
		circle.setAttribute('r', String(badgeRadius));
		circle.setAttribute('fill', this.verifiedBadgeColor);
		circle.setAttribute('stroke', VAULT_NODE_STROKE);
		circle.setAttribute('stroke-width', '1.5');
		/* A geometric tick centred on the badge origin, drawn as a path rather than a Material Symbols
		   glyph so the check always sits inside the circle, free of font-baseline positioning quirks. */
		const check = document.createElementNS(SVG_NS, 'path');
		check.setAttribute(
			'd',
			`M ${-badgeRadius * 0.42} ${badgeRadius * 0.02} ` +
				`L ${-badgeRadius * 0.12} ${badgeRadius * 0.34} ` +
				`L ${badgeRadius * 0.46} ${-badgeRadius * 0.34}`
		);
		check.setAttribute('fill', 'none');
		check.setAttribute('stroke', '#fff');
		check.setAttribute('stroke-width', String(badgeRadius * 0.26));
		check.setAttribute('stroke-linecap', 'round');
		check.setAttribute('stroke-linejoin', 'round');
		badge.appendChild(circle);
		badge.appendChild(check);
		return badge;
	}

	/**
	 * Creates the centred glyph for a node — the account's initial letter as SVG text, or a
	 * Material Symbols icon (email / phone / link) delegated to {@link createIdentifierGlyph}.
	 *
	 * @param node - The simulation node to build a glyph for.
	 * @returns The account letter text element, or the identifier icon foreignObject.
	 */
	private createNodeGlyph(node: VaultSimNode): SVGElement {
		if (node.nodeType !== VAULT_NODE_ACCOUNT) return this.createIdentifierGlyph(node);
		const glyph = document.createElementNS(SVG_NS, 'text');
		glyph.setAttribute('text-anchor', 'middle');
		glyph.setAttribute('dominant-baseline', 'central');
		glyph.setAttribute('fill', '#fff');
		glyph.style.pointerEvents = 'none';
		// Shrink the glyph when two initials are shown so both fit inside the tile.
		const initialScale = Array.from(node.letter).length >= 2 ? 0.62 : 0.95;
		glyph.setAttribute('font-size', String(Math.round(node.rad * initialScale)));
		glyph.setAttribute('font-weight', '800');
		glyph.textContent = node.letter;
		return glyph;
	}

	/**
	 * Creates the identifier icon (email / phone / link) as an HTML span inside a foreignObject so the
	 * Material Symbols glyph is flex-centred within the node shape. Rendering it as SVG <text> mis-measured
	 * the ligature width and pushed the icon outside the shape; flexbox recentres it regardless of font load.
	 *
	 * @param node - The identifier node to build a centred icon for.
	 * @returns The foreignObject wrapping the centred icon.
	 */
	private createIdentifierGlyph(node: VaultSimNode): SVGForeignObjectElement {
		const size = node.rad * 2;
		const wrapper = document.createElementNS(SVG_NS, 'foreignObject');
		wrapper.setAttribute('x', String(-node.rad));
		wrapper.setAttribute('y', String(-node.rad));
		wrapper.setAttribute('width', String(size));
		wrapper.setAttribute('height', String(size));
		wrapper.style.pointerEvents = 'none';
		const icon = document.createElement('span');
		icon.className = 'material-symbols-outlined';
		icon.style.display = 'flex';
		icon.style.width = '100%';
		icon.style.height = '100%';
		icon.style.alignItems = 'center';
		icon.style.justifyContent = 'center';
		icon.style.lineHeight = '1';
		// Identifier icons sit on lighter fills, so a dark glyph reads more clearly than white.
		icon.style.color = VAULT_GLYPH_COLOR_IDENTIFIER;
		icon.style.fontSize = `${Math.round(node.rad * 1.3)}px`;
		icon.textContent =
			node.nodeType === VAULT_NODE_EMAIL
				? VAULT_EMAIL_META.icon
				: node.nodeType === VAULT_NODE_LINK
					? VAULT_LINK_META.icon
					: VAULT_PHONE_META.icon;
		wrapper.appendChild(icon);
		return wrapper;
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
		label.setAttribute('font-size', isAccount ? '12.5' : '11');
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
			const edge = this.renderEdges[index];
			const source = this.nodeById[edge.sourceId];
			const target = this.nodeById[edge.targetId];
			if (!source || !target) return;
			line.setAttribute('x1', String(source.x));
			line.setAttribute('y1', String(source.y));
			if (edge.relation === VAULT_RELATION_BACKUP) {
				/* Nodes render on top of edges (edges group, then nodes group), so a marker at the raw
				   center-to-center endpoint would be hidden underneath the target's opaque circle. Pull
				   the endpoint back to just outside the target's radius so the arrowhead is visible. */
				const dx = target.x - source.x;
				const dy = target.y - source.y;
				const distance = Math.hypot(dx, dy) || 1;
				const pullBack = target.rad + VAULT_BACKUP_ARROW_GAP;
				line.setAttribute('x2', String(target.x - (dx / distance) * pullBack));
				line.setAttribute('y2', String(target.y - (dy / distance) * pullBack));

				// Mutual pair — the start end also carries an arrowhead, so pull it back off the
				// source node's radius too, matching the target-side treatment above.
				if (this.mutualBackupEdgeIds.has(edge.id)) {
					const sourcePullBack = source.rad + VAULT_BACKUP_ARROW_GAP;
					line.setAttribute('x1', String(source.x + (dx / distance) * sourcePullBack));
					line.setAttribute('y1', String(source.y + (dy / distance) * sourcePullBack));
				}
			} else {
				line.setAttribute('x2', String(target.x));
				line.setAttribute('y2', String(target.y));
			}
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
			const filter = this.categoryFilter;
			const isUncategorized = filter === VAULT_CATEGORY_OTHER.key;
			const isVerifiedFilter = filter === VAULT_FILTER_KEY_VERIFIED;
			categoryBase = new Set<string>();
			this.simNodes.forEach((node) => {
				if (node.nodeType !== VAULT_NODE_ACCOUNT) return;
				const inCategory = isVerifiedFilter
					? node.verified
					: isUncategorized
						? node.categories.length === 0
						: node.categories.includes(filter);
				if (inCategory) categoryBase?.add(node.id);
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
			const edge = this.renderEdges[index];
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

			if (edge.relation === VAULT_RELATION_BACKUP) {
				/* Always rendered at full bold strength — never dimmed by selection or hop-level state —
				   so a backup link stays legible in a map full of nodes without anything selected. Filter
				   visibility above still applies (a backup edge to a filtered-out node still hides). */
				line.setAttribute('stroke', VAULT_BACKUP_LINK_COLOR);
				line.setAttribute('stroke-width', VAULT_BACKUP_LINK_WIDTH);
				line.setAttribute('opacity', '1');
				return;
			}

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
	 * Binds background panning and wheel zoom on the SVG. Pressing on empty canvas begins a pan and
	 * clears any current selection — except in link-mode, where the selected source node is kept so a
	 * stray canvas click while adding a connection does not cancel the selection.
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
			if (this.selectedId && !this.linkMode) this.ngZone.run(() => this.nodeSelect.emit(null));
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
	 * Converts a point in viewport (SVG-host) space into the simulation's world coordinate space,
	 * accounting for the current pan and zoom. Single source of truth for the inverse camera
	 * transform — used by pointer hit-testing and by the view-containment bounds.
	 *
	 * @param viewportX - The X position in viewport space (0 = left edge of the SVG host).
	 * @param viewportY - The Y position in viewport space (0 = top edge of the SVG host).
	 * @returns The point in world coordinates.
	 */
	private screenToWorld(viewportX: number, viewportY: number): { x: number; y: number } {
		return {
			x: (viewportX - this.camera.x) / this.camera.scale,
			y: (viewportY - this.camera.y) / this.camera.scale
		};
	}

	/**
	 * Converts client (page) coordinates into world coordinates by subtracting the SVG host's offset
	 * and delegating to {@link screenToWorld}.
	 *
	 * @param clientX - The pointer X position in client space.
	 * @param clientY - The pointer Y position in client space.
	 * @returns The point in world coordinates.
	 */
	private toLocalPoint(clientX: number, clientY: number): { x: number; y: number } {
		const rect = this.svgRef.nativeElement.getBoundingClientRect();
		return this.screenToWorld(clientX - rect.left, clientY - rect.top);
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
		const nextScale = Utilities.clamp(this.camera.scale * factor, 0.4, 2.5);
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
	 * Tallies the legend counts — per node type plus verified accounts and backup links — in a single
	 * pass over the current nodes, plus a pass over edges for the edge-based backup count. Called from
	 * ngOnChanges when the node or edge set changes, so the template binds a stored object instead of
	 * re-scanning on every change-detection pass.
	 */
	private updateLegendCounts(): void {
		const counts: VaultLegendCounts = { account: 0, email: 0, phone: 0, verified: 0, backup: 0 };
		for (const node of this.nodes) {
			if (node.nodeType === VAULT_NODE_ACCOUNT) {
				counts.account++;
				if (node.verified) counts.verified++;
			} else if (node.nodeType === VAULT_NODE_EMAIL) {
				counts.email++;
			} else if (node.nodeType === VAULT_NODE_PHONE) {
				counts.phone++;
			}
		}
		for (const edge of this.edges) {
			if (edge.relation === VAULT_RELATION_BACKUP) counts.backup++;
		}
		this.legendCounts = counts;
	}

	/**
	 * Gets the fill colors for a node — one hex per category for accounts (driving the segmented
	 * fill), or a single fixed identifier color for email, phone, and link nodes. An account with no
	 * categories falls back to the single Uncategorized grey.
	 *
	 * @param node - The node to resolve colors for.
	 * @returns The hex fill colors (always at least one).
	 */
	private getNodeHexes(node: VaultNode): string[] {
		if (node.nodeType === VAULT_NODE_EMAIL) return [VAULT_EMAIL_META.hex];
		if (node.nodeType === VAULT_NODE_PHONE) return [VAULT_PHONE_META.hex];
		if (node.nodeType === VAULT_NODE_LINK) return [VAULT_LINK_META.hex];
		const hexes = node.categories.map((categoryKey) => this.resolveCategoryHex(categoryKey));
		return hexes.length > 0 ? hexes : [VAULT_CATEGORY_OTHER.hex];
	}

	/**
	 * Gets the fill color for a single category key, resolving built-in categories first, then
	 * user-created custom categories, then the Uncategorized grey fallback.
	 *
	 * @param categoryKey - The category key to resolve a color for.
	 * @returns The hex fill color.
	 */
	private resolveCategoryHex(categoryKey: string): string {
		const builtIn = VAULT_CATEGORY_DEFS.find((categoryDef) => categoryDef.key === categoryKey);
		if (builtIn) return builtIn.hex;
		const custom = this.customCategories.find((categoryDef) => categoryDef.key === categoryKey);
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
