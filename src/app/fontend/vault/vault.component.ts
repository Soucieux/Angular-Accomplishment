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
	VAULT_DOT_CLASS_EMAIL,
	VAULT_DOT_CLASS_PHONE,
	VAULT_DOT_CLASS_LINK,
	VAULT_DOT_CLASS_ACCOUNT,
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
	VAULT_TYPE_ACCOUNT,
	VAULT_TYPE_EMAIL,
	VAULT_TYPE_PHONE,
	VAULT_TYPE_LINK,
	VAULT_BTN_ADD_CONNECTIONS,
	VAULT_OVERVIEW_EMPTY,
	VAULT_BANNER_SECOND,
	VAULT_BANNER_CANCEL,
	MSG_SAVE_FAILED,
	MSG_DELETING,
	DIALOG_BTN_DELETE,
	VAULT_MSG_SAVING,
	VAULT_MSG_REMOVING_LINK,
	VAULT_MSG_DELETE_NODE_TITLE,
	VAULT_MSG_DELETE_NODE_CONFIRM_PREFIX,
	VAULT_MSG_DELETE_NODE_CONFIRM_SUFFIX,
	VAULT_MSG_NODE_REMOVED,
	VAULT_MSG_REMOVE_NODE_FAILED_DETAIL,
	VAULT_MSG_DELETE_CATEGORY_TITLE,
	VAULT_MSG_DELETE_CATEGORY_CONFIRM,
	VAULT_MSG_CATEGORY_REMOVED,
	VAULT_MSG_REMOVE_CATEGORY_FAILED_DETAIL,
	VAULT_MSG_ACCOUNT_SAVED,
	VAULT_MSG_LINK_ADDED,
	VAULT_MSG_LINK_REMOVED,
	VAULT_MSG_SAVE_FAILED_DETAIL,
	VAULT_CATEGORY_OTHER_LABEL,
	VAULT_CATEGORY_UNCATEGORIZED_LABEL
} from '../../common/locale/locale-strings';
import {
	NewAccountData,
	VaultAccountRow,
	VaultCategoryDef,
	VaultEdge,
	VaultLinkChip,
	VaultNode,
	VaultNodeType,
	VaultOverviewStat,
	VaultRecord,
	VaultSelectionDetail,
	VAULT_CATEGORY_DEFS,
	VAULT_CATEGORY_OTHER,
	VAULT_EMAIL_META,
	VAULT_LINK_META,
	VAULT_PHONE_META
} from './vault.model';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { DatabaseService } from '../../backend/database-service/database.service';
import { GraphCanvasComponent } from './graph-canvas/graph-canvas.component';
import { BlockedCardComponent } from '../../common/blocked-card/blocked-card.component';

@Component({
	selector: 'vault',
	imports: [FormsModule, GraphCanvasComponent, BlockedCardComponent],
	templateUrl: './vault.component.html',
	styleUrls: ['../../common/glass-card.css', './vault.component.css']
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
	protected readonly VAULT_OVERVIEW_EMPTY = VAULT_OVERVIEW_EMPTY;
	protected readonly VAULT_BANNER_SECOND = VAULT_BANNER_SECOND;
	protected readonly VAULT_BANNER_CANCEL = VAULT_BANNER_CANCEL;
	protected readonly VAULT_MSG_DELETE_NODE_TITLE = VAULT_MSG_DELETE_NODE_TITLE;
	protected loading = true;
	protected view: typeof VAULT_VIEW_GRAPH | typeof VAULT_VIEW_LIST = VAULT_VIEW_GRAPH;
	protected query = '';
	protected editId: string | null = null;
	protected selectedId: string | null = null;
	// The account whose category picker is expanded in the list view, or null when none is open.
	protected categoryPickerId: string | null = null;
	protected typeFilter: string | null = null;
	protected categoryFilter: string | null = null;
	protected linkMode = false;
	protected linkSourceId: string | null = null;
	protected saveIndicator = false;
	protected nodes: VaultNode[] = [];
	protected edges: VaultEdge[] = [];
	protected customCategories: VaultCategoryDef[] = [];
	// Custom-category keys, precomputed when customCategories is assigned so the overview getter
	// tests membership without allocating a Set on every change-detection pass.
	private customCategoryKeys = new Set<string>();
	/** Uncategorized fallback def — model metadata plus the locale-resolved display labels (recipe pattern). */
	private readonly otherCategory: VaultCategoryDef = {
		...VAULT_CATEGORY_OTHER,
		label: VAULT_CATEGORY_OTHER_LABEL,
		categoryLabel: VAULT_CATEGORY_UNCATEGORIZED_LABEL
	};
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
	 * CloudBase WebSocket callbacks fire outside Angular's zone, and calls
	 * detectChanges() so the first snapshot paints immediately — without it the graph
	 * and category bar stay blank at load until a user interaction forces a tick.
	 */
	ngOnInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.databaseService
				.getVault()
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe((records) =>
					this.ngZone.run(() => {
						this.applyRecords(records);
						this.cdr.detectChanges();
					})
				);
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
	 * Isolates the graph to a single node type — or verified accounts — clearing the
	 * filter when the given key is already active.
	 *
	 * @param key - The filter key to isolate, or clear when already active.
	 */
	protected toggleFilter(key: string): void {
		this.typeFilter = this.typeFilter === key ? null : key;
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

	/**
	 * Toggles the inline category picker for an account card (list view). Clicking the category
	 * label expands the category options to the right; clicking it again collapses them.
	 *
	 * @param accountId - The id of the account whose category picker to toggle.
	 * @param event - The originating click event, stopped so it does not select the card.
	 */
	protected toggleCategoryPicker(accountId: string, event: Event): void {
		event.stopPropagation();
		this.categoryPickerId = this.categoryPickerId === accountId ? null : accountId;
	}

	/**
	 * Assigns the chosen category to the account, then collapses the picker. Skips the write when the
	 * category is unchanged. On success flashes the save indicator; on failure shows an error toast.
	 *
	 * @param accountId - The id of the account being categorized.
	 * @param categoryKey - The category key to assign.
	 * @param currentKey - The account's current category key, to skip a no-op write.
	 * @param event - The originating click event, stopped so it does not select the card.
	 */
	protected assignCategory(accountId: string, categoryKey: string, currentKey: string, event: Event): void {
		event.stopPropagation();
		this.categoryPickerId = null;
		if (categoryKey === currentKey) return;
		this.databaseService
			.updateVaultNodeCategory(accountId, categoryKey)
			.then(() => this.triggerSaveIndicator())
			.catch(() =>
				this.dialogService.showToast(TOAST_ERROR, MSG_SAVE_FAILED, VAULT_MSG_SAVE_FAILED_DETAIL)
			);
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
		this.dialogService.runBlocking(this.dialogComponentContainer, VAULT_MSG_REMOVING_LINK, async () => {
			try {
				await this.databaseService.removeVaultEdge(edgeKey);
				this.triggerSaveIndicator();
				this.dialogService.showToast(SUCCESS, VAULT_MSG_LINK_REMOVED);
			} catch {
				this.dialogService.showToast(TOAST_ERROR, MSG_SAVE_FAILED, VAULT_MSG_SAVE_FAILED_DETAIL);
			}
		});
	}

	/**
	 * Opens the confirm dialog for deleting a vault node, reachable from either the
	 * graph selection or a list-view card. On confirm, removes the node and every
	 * edge attached to it, then clears the graph selection if it pointed at this node.
	 *
	 * @param nodeId - The id of the node to delete.
	 * @param event - The originating click event, stopped so it does not affect selection.
	 */
	protected openDeleteNodeDialog(nodeId: string, event: Event): void {
		event.stopPropagation();
		const node = this.findNode(nodeId);
		if (!node) return;
		const connectedEdgeIds = this.edges
			.filter((edge) => edge.sourceId === node.id || edge.targetId === node.id)
			.map((edge) => edge.id);
		this.dialogService.confirmThenBlock(
			this.dialogComponentContainer,
			[
				VAULT_MSG_DELETE_NODE_CONFIRM_PREFIX + node.name + VAULT_MSG_DELETE_NODE_CONFIRM_SUFFIX,
				VAULT_MSG_DELETE_NODE_TITLE,
				DIALOG_BTN_DELETE
			],
			MSG_DELETING,
			async () => {
				try {
					await this.databaseService.removeVaultNode(node.id, connectedEdgeIds, node.name);
					if (this.selectedId === node.id) this.selectedId = null;
					this.triggerSaveIndicator();
					this.dialogService.showToast(SUCCESS, VAULT_MSG_NODE_REMOVED);
				} catch {
					this.dialogService.showToast(
						TOAST_ERROR,
						MSG_SAVE_FAILED,
						VAULT_MSG_REMOVE_NODE_FAILED_DETAIL
					);
				}
			}
		);
	}

	/**
	 * Opens a confirmation dialog to delete a custom category. On confirm, every account in that
	 * category is reassigned to Uncategorized and the category record is removed. Mirrors the
	 * node-delete flow (confirm then direct write with toast feedback).
	 *
	 * @param categoryKey - The document id of the custom category to delete.
	 * @param event - The originating click event, stopped so it does not toggle the category filter.
	 */
	protected deleteCategory(categoryKey: string, event: Event): void {
		event.stopPropagation();
		const accountIds = this.nodes
			.filter((node) => node.nodeType === VAULT_NODE_ACCOUNT && node.category === categoryKey)
			.map((node) => node.id);
		this.dialogService.confirmThenBlock(
			this.dialogComponentContainer,
			[VAULT_MSG_DELETE_CATEGORY_CONFIRM, VAULT_MSG_DELETE_CATEGORY_TITLE, DIALOG_BTN_DELETE],
			MSG_DELETING,
			async () => {
				try {
					await this.databaseService.removeVaultCategory(categoryKey, accountIds);
					if (this.categoryFilter === categoryKey) this.categoryFilter = null;
					this.triggerSaveIndicator();
					this.dialogService.showToast(SUCCESS, VAULT_MSG_CATEGORY_REMOVED);
				} catch {
					this.dialogService.showToast(
						TOAST_ERROR,
						MSG_SAVE_FAILED,
						VAULT_MSG_REMOVE_CATEGORY_FAILED_DETAIL
					);
				}
			}
		);
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
		this.dialogService.runBlocking(this.dialogComponentContainer, VAULT_MSG_SAVING, async () => {
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
		});
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
		this.dialogService.runBlocking(this.dialogComponentContainer, VAULT_MSG_SAVING, async () => {
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
		});
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
		this.customCategoryKeys = new Set(categories.map((categoryDef) => categoryDef.key));
		this.loading = false;
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
			this.otherCategory
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
		if (nodeType === VAULT_NODE_EMAIL) return VAULT_DOT_CLASS_EMAIL;
		if (nodeType === VAULT_NODE_PHONE) return VAULT_DOT_CLASS_PHONE;
		if (nodeType === VAULT_NODE_LINK) return VAULT_DOT_CLASS_LINK;
		return VAULT_DOT_CLASS_ACCOUNT;
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
			category: account.category,
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
			id: node.id,
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
		// otherCategory is appended so accounts assigned to Uncategorized ('other') get their own chip.
		return [...VAULT_CATEGORY_DEFS, ...this.customCategories, this.otherCategory]
			.filter((categoryDef) => counts[categoryDef.key])
			.map((categoryDef) => ({
				key: categoryDef.key,
				icon: categoryDef.icon,
				gradient: categoryDef.gradient,
				value: counts[categoryDef.key],
				label: categoryDef.categoryLabel,
				isActive: this.categoryFilter === categoryDef.key,
				// Only user-created categories are deletable — built-ins and Uncategorized are not.
				isCustom: this.customCategoryKeys.has(categoryDef.key)
			}));
	}

	/**
	 * Gets the categories a user can assign to an account from the inline picker: every custom
	 * category plus Uncategorized (so an account can also be moved back to Uncategorized).
	 *
	 * @returns The assignable category options.
	 */
	protected get assignableCategories(): { key: string; label: string; gradient: string }[] {
		return [...this.customCategories, this.otherCategory].map((categoryDef) => ({
			key: categoryDef.key,
			label: categoryDef.categoryLabel,
			gradient: categoryDef.gradient
		}));
	}

}
