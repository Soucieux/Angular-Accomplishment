import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	DestroyRef,
	ElementRef,
	Inject,
	NgZone,
	OnDestroy,
	OnInit,
	PLATFORM_ID,
	ViewChild,
	ViewContainerRef
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LOG } from '../../common/app.logs';
import { Utilities } from '../../common/utilities/app.utilities';
import {
	COMPONENT_DESTROY,
	DATABASE_VAULT,
	DIALOG_ADD_ACCOUNT,
	SUCCESS,
	TOAST_ERROR,
	VAULT_KIND_NODE,
	VAULT_KIND_EDGE,
	VAULT_KIND_CATEGORY,
	VAULT_NODE_ACCOUNT,
	VAULT_NODE_EMAIL,
	VAULT_NODE_PHONE,
	VAULT_NODE_LINK,
	VAULT_VIEW_GRAPH,
	VAULT_VIEW_LIST,
	VAULT_RELATION_LINKED,
	VAULT_RELATION_MANUAL
} from '../../common/constants';
import {
	NAV_LABEL_VAULT,
	VAULT_SEARCH_PLACEHOLDER,
	VAULT_TAB_GRAPH,
	VAULT_TAB_LIST,
	VAULT_BTN_ADD,
	VAULT_LIST_EDIT,
	VAULT_LIST_DONE,
	VAULT_EMPTY_TITLE,
	VAULT_EMPTY_BODY,
	VAULT_LABEL_ACCOUNTS,
	VAULT_LABEL_IDENTIFIERS,
	VAULT_PAGE_SUBTITLE,
	VAULT_FILTER_ACCOUNTS,
	VAULT_FILTER_EMAIL,
	VAULT_FILTER_PHONE,
	VAULT_FILTER_LINK,
	VAULT_TYPE_ACCOUNT,
	VAULT_TYPE_EMAIL,
	VAULT_TYPE_PHONE,
	VAULT_TYPE_LINK,
	VAULT_BTN_ADD_CONNECTIONS,
	VAULT_BANNER_SECOND,
	VAULT_BANNER_CANCEL,
	MSG_SAVE_FAILED,
	VAULT_MSG_SAVING,
	VAULT_MSG_REMOVING_LINK,
	VAULT_MSG_ACCOUNT_SAVED,
	VAULT_MSG_LINK_ADDED,
	VAULT_MSG_LINK_REMOVED,
	VAULT_MSG_SAVE_FAILED_DETAIL
} from '../../common/locale/locale-strings';
import {
	NewAccountData,
	VaultAccountRow,
	VaultCategoryDef,
	VaultEdge,
	VaultFilterDef,
	VaultLinkChip,
	VaultNode,
	VaultNodeType,
	VaultOverviewStat,
	VaultRecord,
	VaultSelectionDetail,
	VaultTypeFilters,
	VAULT_CATEGORY_DEFS,
	VAULT_CATEGORY_OTHER,
	VAULT_EMAIL_META,
	VAULT_FILTER_DOT_ACCOUNT,
	VAULT_LINK_META,
	VAULT_PHONE_META
} from './vault.model';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { DatabaseService } from '../../backend/database-service/database.service';
import { GraphCanvasComponent } from './graph-canvas/graph-canvas.component';

@Component({
	selector: 'vault',
	imports: [FormsModule, GraphCanvasComponent],
	templateUrl: './vault.component.html',
	styleUrls: ['./vault.component.css']
})
export class VaultComponent implements OnInit, AfterViewInit, OnDestroy {
	private readonly className = 'VaultComponent';
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	@ViewChild('vaultContent') private vaultContentRef?: ElementRef<HTMLElement>;
	protected readonly NAV_LABEL_VAULT = NAV_LABEL_VAULT;
	protected readonly VAULT_SEARCH_PLACEHOLDER = VAULT_SEARCH_PLACEHOLDER;
	protected readonly VAULT_TAB_GRAPH = VAULT_TAB_GRAPH;
	protected readonly VAULT_TAB_LIST = VAULT_TAB_LIST;
	protected readonly VAULT_BTN_ADD = VAULT_BTN_ADD;
	protected readonly VAULT_LIST_EDIT = VAULT_LIST_EDIT;
	protected readonly VAULT_LIST_DONE = VAULT_LIST_DONE;
	protected readonly VAULT_EMPTY_TITLE = VAULT_EMPTY_TITLE;
	protected readonly VAULT_EMPTY_BODY = VAULT_EMPTY_BODY;
	protected readonly VAULT_LABEL_ACCOUNTS = VAULT_LABEL_ACCOUNTS;
	protected readonly VAULT_LABEL_IDENTIFIERS = VAULT_LABEL_IDENTIFIERS;
	protected readonly VAULT_PAGE_SUBTITLE = VAULT_PAGE_SUBTITLE;
	protected readonly VAULT_BTN_ADD_CONNECTIONS = VAULT_BTN_ADD_CONNECTIONS;
	protected readonly VAULT_BANNER_SECOND = VAULT_BANNER_SECOND;
	protected readonly VAULT_BANNER_CANCEL = VAULT_BANNER_CANCEL;
	protected loading = true;
	protected view: string = VAULT_VIEW_GRAPH;
	protected query = '';
	protected editId: string | null = null;
	protected selectedId: string | null = null;
	protected filters: VaultTypeFilters = { account: true, email: true, phone: true, link: true };
	protected categoryFilter: string | null = null;
	protected linkMode = false;
	protected linkSourceId: string | null = null;
	protected saveIndicator = false;
	protected nodes: VaultNode[] = [];
	protected edges: VaultEdge[] = [];
	protected customCategories: VaultCategoryDef[] = [];
	private saveIndicatorTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		private dialogService: DialogService,
		private databaseService: DatabaseService,
		private cdr: ChangeDetectorRef,
		private ngZone: NgZone,
		private destroyRef: DestroyRef,
		protected utilities: Utilities
	) {}

	/**
	 * Subscribes to the per-user vault graph and splits each emission into nodes,
	 * edges, and custom categories. The callback runs inside ngZone.run() because
	 * CloudBase WebSocket callbacks fire outside Angular's zone.
	 */
	ngOnInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.databaseService
				.getVault()
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe((records) => this.ngZone.run(() => this.applyRecords(records)));
		}
	}

	/**
	 * Attaches the auto-hide scrollbar behaviour to the scrolling content area.
	 */
	ngAfterViewInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			Utilities.attachScrollAutoHide(this.vaultContentRef?.nativeElement);
		}
	}

	/**
	 * Clears the dialog container, cancels pending save-indicator timers, and logs destruction.
	 */
	ngOnDestroy(): void {
		this.dialogComponentContainer?.clear();
		Object.values(this.saveIndicatorTimeouts).forEach(clearTimeout);
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	// ── View and selection handlers ──────────────────────────────────────────

	/**
	 * Switches the page to the force-directed graph view.
	 */
	protected showGraphView(): void {
		this.view = VAULT_VIEW_GRAPH;
	}

	/**
	 * Switches the page to the account list view.
	 */
	protected showListView(): void {
		this.view = VAULT_VIEW_LIST;
	}

	/**
	 * Sets the selection to the value emitted by the graph, which already resolves the
	 * toggle (a node id to select, or null to clear).
	 *
	 * @param nodeId - The new selection emitted by the graph, or null to clear.
	 */
	protected onGraphNodeSelect(nodeId: string | null): void {
		this.selectedId = nodeId;
	}

	/**
	 * Toggles visibility of a node type in the graph.
	 *
	 * @param nodeType - The node type whose visibility to toggle.
	 */
	protected toggleFilter(nodeType: VaultNodeType): void {
		this.filters = { ...this.filters, [nodeType]: !this.filters[nodeType] };
	}

	/**
	 * Filters the graph and list to a category, or clears the filter when the active
	 * category is picked again. Clears the current selection so the filtered view is unobstructed.
	 *
	 * @param categoryKey - The category key to filter by.
	 */
	protected pickCategory(categoryKey: string): void {
		this.categoryFilter = this.categoryFilter === categoryKey ? null : categoryKey;
		this.selectedId = null;
	}

	/**
	 * Arms link-mode from the selected account so the next graph click creates a link.
	 * Clears any category filter so every node is reachable as a target.
	 */
	protected startLinkMode(): void {
		const account = this.findNode(this.selectedId);
		if (!account || account.nodeType !== VAULT_NODE_ACCOUNT) return;
		this.linkMode = true;
		this.linkSourceId = account.id;
		this.categoryFilter = null;
	}

	/**
	 * Exits link-mode without creating a link.
	 */
	protected cancelLinkMode(): void {
		this.linkMode = false;
		this.linkSourceId = null;
	}

	/**
	 * Toggles inline edit mode for an account card so its connection chips become removable.
	 *
	 * @param accountId - The id of the account whose edit mode to toggle.
	 * @param event - The originating click event, stopped so it does not select the card.
	 */
	protected toggleEditMode(accountId: string, event: Event): void {
		event.stopPropagation();
		this.editId = this.editId === accountId ? null : accountId;
	}

	// ── Internal data writes ─────────────────────────────────────────────────

	/**
	 * Removes a link (edge) from the vault and reports the result.
	 *
	 * @param edgeKey - The document key of the edge to remove.
	 * @param event - The originating click event, stopped so it does not select the card.
	 */
	protected removeLink(edgeKey: string, event: Event): void {
		event.stopPropagation();
		this.openBlockDialog(async () => {
			try {
				await this.databaseService.removeVaultEdge(edgeKey);
				this.triggerSaveIndicator();
				this.dialogService.showToast(SUCCESS, VAULT_MSG_LINK_REMOVED);
			} catch {
				this.dialogService.showToast(TOAST_ERROR, MSG_SAVE_FAILED, VAULT_MSG_SAVE_FAILED_DETAIL);
			}
		}, VAULT_MSG_REMOVING_LINK).catch(() => {});
	}

	/**
	 * Links the armed source account to the clicked target node, then exits link-mode
	 * keeping the source selected. Skips self-links and existing links.
	 *
	 * @param targetId - The id of the node clicked as the link target.
	 */
	protected handleLinkTarget(targetId: string): void {
		const sourceId = this.linkSourceId;
		this.linkMode = false;
		this.linkSourceId = null;
		if (!sourceId || sourceId === targetId) return;
		this.selectedId = sourceId;
		const alreadyLinked = this.edges.some(
			(edge) =>
				(edge.sourceId === sourceId && edge.targetId === targetId) ||
				(edge.sourceId === targetId && edge.targetId === sourceId)
		);
		if (alreadyLinked) return;
		this.openBlockDialog(async () => {
			try {
				await this.databaseService.addVaultEdge({
					sourceId,
					targetId,
					relation: VAULT_RELATION_MANUAL
				});
				this.triggerSaveIndicator();
				this.dialogService.showToast(SUCCESS, VAULT_MSG_LINK_ADDED);
			} catch {
				this.dialogService.showToast(TOAST_ERROR, MSG_SAVE_FAILED, VAULT_MSG_SAVE_FAILED_DETAIL);
			}
		}, VAULT_MSG_SAVING).catch(() => {});
	}

	// ── Dialog openers ───────────────────────────────────────────────────────

	/**
	 * Opens the add-account dialog and wires its submit callback to persist the new account.
	 */
	protected openAddDialog(): void {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_ADD_ACCOUNT,
			(accountData: NewAccountData) => this.handleAccountSave(accountData),
			this.customCategories
		);
	}

	/**
	 * Persists a new account plus its connections: adds the (optionally verified) account node,
	 * then for each connection reuses an existing node by name or creates a new identifier of its
	 * chosen type (email / phone / link), and links them.
	 *
	 * @param accountData - The validated form data returned by the add-account dialog.
	 */
	private handleAccountSave(accountData: NewAccountData): void {
		this.openBlockDialog(async () => {
			try {
				// Resolve the category — persist a freshly created custom category first, then use its id
				let categoryKey = accountData.category;
				if (accountData.newCategory) {
					categoryKey = await this.databaseService.addVaultCategory(accountData.newCategory);
				}

				// Add the primary account node, carrying its verified state
				const accountId = await this.databaseService.addVaultNode({
					nodeType: VAULT_NODE_ACCOUNT,
					name: accountData.name.trim(),
					category: categoryKey,
					verified: accountData.verified
				});

				// Link each connection — reuse an existing node by name, or create a new identifier of its chosen type
				const nodeIdsByName = new Map(
					this.nodes.map((node) => [node.name.trim().toLowerCase(), node.id])
				);
				for (const connection of accountData.connections) {
					const connectionName = connection.value.trim();
					if (!connectionName) continue;
					let targetId = nodeIdsByName.get(connectionName.toLowerCase());
					if (!targetId) {
						targetId = await this.databaseService.addVaultNode({
							nodeType: connection.type,
							name: connectionName,
							category: '',
							verified: false
						});
						nodeIdsByName.set(connectionName.toLowerCase(), targetId);
					}
					if (targetId !== accountId) {
						await this.databaseService.addVaultEdge({
							sourceId: accountId,
							targetId,
							relation: VAULT_RELATION_LINKED
						});
					}
				}
				this.triggerSaveIndicator();
				this.dialogService.showToast(SUCCESS, VAULT_MSG_ACCOUNT_SAVED);
			} catch {
				this.dialogService.showToast(TOAST_ERROR, MSG_SAVE_FAILED, VAULT_MSG_SAVE_FAILED_DETAIL);
			}
		}, VAULT_MSG_SAVING).catch(() => {});
	}

	// ── Private helpers ──────────────────────────────────────────────────────

	/**
	 * Splits a vault emission into typed node, edge, and category collections.
	 *
	 * @param records - The raw vault records emitted by the database watch.
	 */
	private applyRecords(records: VaultRecord[]): void {
		const nodes: VaultNode[] = [];
		const edges: VaultEdge[] = [];
		const categories: VaultCategoryDef[] = [];
		for (const record of records) {
			if (record.kind === VAULT_KIND_NODE) {
				nodes.push({
					id: record.key,
					nodeType: record.nodeType ?? VAULT_NODE_ACCOUNT,
					name: record.name ?? '',
					category: record.category ?? '',
					verified: record.verified ?? false
				});
			} else if (record.kind === VAULT_KIND_EDGE) {
				edges.push({
					id: record.key,
					sourceId: record.sourceId ?? '',
					targetId: record.targetId ?? '',
					relation: record.relation ?? ''
				});
			} else if (record.kind === VAULT_KIND_CATEGORY) {
				categories.push({
					key: record.key,
					label: record.label ?? '',
					categoryLabel: record.label ?? '',
					icon: VAULT_CATEGORY_OTHER.icon,
					hex: record.hex ?? '',
					gradient: record.gradient ?? ''
				});
			}
		}
		this.nodes = nodes;
		this.edges = edges;
		this.customCategories = categories;
		this.loading = false;
	}

	/**
	 * Opens the block dialog with the given message and executes the callback,
	 * blocking the UI until the callback settles to prevent duplicate DB calls.
	 *
	 * {@link removeLink} - Blocks while the edge-removal DB write is in-flight.
	 * {@link handleAccountSave} - Blocks while the account and its links are persisted.
	 *
	 * @param callback - The async operation to run while the dialog is open.
	 * @param message - The loading message to display in the block dialog.
	 * @returns A promise that resolves when the callback completes.
	 */
	private openBlockDialog(callback: () => Promise<void>, message: string): Promise<void> {
		return this.dialogService.openDialog(this.dialogComponentContainer, 'block', callback, message);
	}

	/**
	 * Shows the save-confirmation indicator and hides it after one second.
	 * Clears any active timeout before restarting so rapid saves do not flash.
	 */
	private triggerSaveIndicator(): void {
		this.saveIndicator = true;
		this.cdr.detectChanges();
		if (this.saveIndicatorTimeouts[DATABASE_VAULT])
			clearTimeout(this.saveIndicatorTimeouts[DATABASE_VAULT]);
		this.saveIndicatorTimeouts[DATABASE_VAULT] = setTimeout(() => {
			this.saveIndicator = false;
			this.cdr.detectChanges();
		}, 1000);
	}

	/**
	 * Gets the display definition for a category key, resolving built-in categories first,
	 * then user-created custom categories, then the uncategorized fallback.
	 *
	 * @param categoryKey - The category key stored on an account node.
	 * @returns The matching category definition.
	 */
	private getCategoryDef(categoryKey: string): VaultCategoryDef {
		return (
			VAULT_CATEGORY_DEFS.find((categoryDef) => categoryDef.key === categoryKey) ??
			this.customCategories.find((categoryDef) => categoryDef.key === categoryKey) ??
			VAULT_CATEGORY_OTHER
		);
	}

	/**
	 * Gets the display gradient for a node — its category gradient for accounts,
	 * or the fixed identifier gradient for emails and phones.
	 *
	 * @param node - The node to resolve a gradient for.
	 * @returns The CSS gradient string.
	 */
	private getNodeGradient(node: VaultNode): string {
		if (node.nodeType === VAULT_NODE_EMAIL) return VAULT_EMAIL_META.gradient;
		if (node.nodeType === VAULT_NODE_PHONE) return VAULT_PHONE_META.gradient;
		if (node.nodeType === VAULT_NODE_LINK) return VAULT_LINK_META.gradient;
		return this.getCategoryDef(node.category).gradient;
	}

	/**
	 * Gets the CSS class that shapes a connection chip's dot by node type.
	 *
	 * @param nodeType - The type of the connected node.
	 * @returns The dot shape CSS class name.
	 */
	private getNodeShapeClass(nodeType: VaultNodeType): string {
		if (nodeType === VAULT_NODE_EMAIL) return 'vault-dot-email';
		if (nodeType === VAULT_NODE_PHONE) return 'vault-dot-phone';
		if (nodeType === VAULT_NODE_LINK) return 'vault-dot-link';
		return 'vault-dot-account';
	}

	/**
	 * Builds the list-view row view-model for a single account, including its connection chips.
	 *
	 * @param account - The account node to build a row for.
	 * @returns The account row view-model.
	 */
	private buildAccountRow(account: VaultNode): VaultAccountRow {
		const links: VaultLinkChip[] = this.edges
			.filter((edge) => edge.sourceId === account.id || edge.targetId === account.id)
			.map((edge) => {
				const otherId = edge.sourceId === account.id ? edge.targetId : edge.sourceId;
				const other = this.nodes.find((node) => node.id === otherId);
				return {
					edgeKey: edge.id,
					name: other?.name ?? '',
					gradient: other ? this.getNodeGradient(other) : VAULT_CATEGORY_OTHER.gradient,
					shapeClass: this.getNodeShapeClass(other?.nodeType ?? VAULT_NODE_ACCOUNT)
				};
			});
		return {
			id: account.id,
			name: account.name,
			letter: (account.name[0] ?? '').toUpperCase(),
			gradient: this.getNodeGradient(account),
			categoryLabel: this.getCategoryDef(account.category).categoryLabel,
			verified: account.verified,
			linkCount: links.length,
			links,
			hasLinks: links.length > 0,
			isEditing: this.editId === account.id,
			isSelected: this.selectedId === account.id
		};
	}

	/**
	 * Gets the set of node ids directly connected to the given node.
	 *
	 * @param nodeId - The id of the node to find neighbours for.
	 * @returns The set of connected node ids.
	 */
	private neighborsOf(nodeId: string): Set<string> {
		const neighbours = new Set<string>();
		this.edges.forEach((edge) => {
			if (edge.sourceId === nodeId) neighbours.add(edge.targetId);
			if (edge.targetId === nodeId) neighbours.add(edge.sourceId);
		});
		return neighbours;
	}

	/**
	 * Gets the human-readable type label for a node type.
	 *
	 * @param nodeType - The node type to label.
	 * @returns The display label for the type.
	 */
	private typeLabel(nodeType: VaultNodeType): string {
		if (nodeType === VAULT_NODE_EMAIL) return VAULT_TYPE_EMAIL;
		if (nodeType === VAULT_NODE_PHONE) return VAULT_TYPE_PHONE;
		if (nodeType === VAULT_NODE_LINK) return VAULT_TYPE_LINK;
		return VAULT_TYPE_ACCOUNT;
	}

	/**
	 * Gets the Material Symbols icon for an email, phone, or link identifier node.
	 *
	 * @param nodeType - The identifier node type.
	 * @returns The icon ligature name.
	 */
	private getIdentifierIcon(nodeType: VaultNodeType): string {
		if (nodeType === VAULT_NODE_EMAIL) return VAULT_EMAIL_META.icon;
		if (nodeType === VAULT_NODE_LINK) return VAULT_LINK_META.icon;
		return VAULT_PHONE_META.icon;
	}

	/**
	 * Finds a node by id in the current node list.
	 *
	 * @param nodeId - The id of the node to find, or null.
	 * @returns The matching node, or undefined when not found.
	 */
	private findNode(nodeId: string | null): VaultNode | undefined {
		return nodeId ? this.nodes.find((node) => node.id === nodeId) : undefined;
	}

	// ── Template helpers ─────────────────────────────────────────────────────

	/**
	 * Returns true when the graph view is active.
	 *
	 * @returns Whether the current view is the graph view.
	 */
	protected get isGraphView(): boolean {
		return this.view === VAULT_VIEW_GRAPH;
	}

	/**
	 * Returns true when the list view is active.
	 *
	 * @returns Whether the current view is the list view.
	 */
	protected get isListView(): boolean {
		return this.view === VAULT_VIEW_LIST;
	}

	/**
	 * Gets the number of account nodes in the vault.
	 *
	 * @returns The account count.
	 */
	protected get accountCount(): number {
		return this.nodes.filter((node) => node.nodeType === VAULT_NODE_ACCOUNT).length;
	}

	/**
	 * Returns true when the vault contains at least one account.
	 *
	 * @returns Whether any account exists.
	 */
	protected get hasAccounts(): boolean {
		return this.accountCount > 0;
	}

	/**
	 * Gets the account rows for the list view, filtered by the search query and
	 * category filter, sorted by connection count (most-connected first).
	 *
	 * @returns The filtered, sorted account row view-models.
	 */
	protected get accountRows(): VaultAccountRow[] {
		const query = this.query.trim().toLowerCase();
		return this.nodes
			.filter((node) => node.nodeType === VAULT_NODE_ACCOUNT)
			.filter((node) => !this.categoryFilter || node.category === this.categoryFilter)
			.filter((node) => !query || node.name.toLowerCase().includes(query))
			.map((account) => this.buildAccountRow(account))
			.sort((a, b) => b.linkCount - a.linkCount);
	}

	/**
	 * Gets the info-bar detail for the selected node: its identity, type, and the
	 * counts of connected accounts versus email/phone identifiers.
	 *
	 * @returns The selection detail, or null when nothing is selected.
	 */
	protected get selectionDetail(): VaultSelectionDetail | null {
		const node = this.findNode(this.selectedId);
		if (!node) return null;
		let accountCount = 0;
		let identifierCount = 0;
		this.neighborsOf(node.id).forEach((neighbourId) => {
			const other = this.nodes.find((candidate) => candidate.id === neighbourId);
			if (!other) return;
			if (other.nodeType === VAULT_NODE_ACCOUNT) accountCount++;
			else identifierCount++;
		});
		const isAccount = node.nodeType === VAULT_NODE_ACCOUNT;
		return {
			name: node.name,
			typeLabel: this.typeLabel(node.nodeType),
			avatarGradient: this.getNodeGradient(node),
			isAccount,
			isIcon: !isAccount,
			icon: isAccount ? '' : this.getIdentifierIcon(node.nodeType),
			letter: (node.name[0] ?? '').toUpperCase(),
			accountCount,
			identifierCount
		};
	}

	/**
	 * Gets the per-category overview chips shown in the info bar when nothing is selected.
	 * Only categories that have at least one account appear.
	 *
	 * @returns The overview stat chips.
	 */
	protected get overviewStats(): VaultOverviewStat[] {
		const counts: Record<string, number> = {};
		this.nodes.forEach((node) => {
			if (node.nodeType === VAULT_NODE_ACCOUNT) {
				counts[node.category] = (counts[node.category] ?? 0) + 1;
			}
		});
		return [...VAULT_CATEGORY_DEFS, ...this.customCategories]
			.filter((categoryDef) => counts[categoryDef.key])
			.map((categoryDef) => ({
				key: categoryDef.key,
				icon: categoryDef.icon,
				gradient: categoryDef.gradient,
				value: counts[categoryDef.key],
				label: categoryDef.categoryLabel,
				isActive: this.categoryFilter === categoryDef.key
			}));
	}

	/**
	 * Gets the type-filter chips for the graph, each with its node count and — for
	 * email and phone — the list of identifier names shown in the hover popover.
	 *
	 * @returns The type-filter chip definitions.
	 */
	protected get filterDefs(): VaultFilterDef[] {
		const definitions: { type: VaultNodeType; label: string; dotColor: string; icon: string }[] = [
			{
				type: VAULT_NODE_ACCOUNT,
				label: VAULT_FILTER_ACCOUNTS,
				dotColor: VAULT_FILTER_DOT_ACCOUNT,
				icon: 'link'
			},
			{
				type: VAULT_NODE_EMAIL,
				label: VAULT_FILTER_EMAIL,
				dotColor: VAULT_EMAIL_META.hex,
				icon: VAULT_EMAIL_META.icon
			},
			{
				type: VAULT_NODE_PHONE,
				label: VAULT_FILTER_PHONE,
				dotColor: VAULT_PHONE_META.hex,
				icon: VAULT_PHONE_META.icon
			},
			{
				type: VAULT_NODE_LINK,
				label: VAULT_FILTER_LINK,
				dotColor: VAULT_LINK_META.hex,
				icon: VAULT_LINK_META.icon
			}
		];
		return definitions.map((definition) => {
			const matching = this.nodes.filter((node) => node.nodeType === definition.type);
			const items = definition.type === VAULT_NODE_ACCOUNT ? [] : matching.map((node) => node.name);
			return {
				type: definition.type,
				label: definition.label,
				count: matching.length,
				dotColor: definition.dotColor,
				icon: definition.icon,
				isActive: this.filters[definition.type],
				items,
				hasItems: items.length > 0
			};
		});
	}
}
