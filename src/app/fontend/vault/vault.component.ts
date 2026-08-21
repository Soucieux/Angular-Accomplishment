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
	QueryList,
	ViewChild,
	ViewChildren,
	ViewContainerRef
} from '@angular/core';
import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LOG } from '../../common/app.logs';
import { Utilities } from '../../common/utilities/app.utilities';
import {
	COMPONENT_DESTROY,
	DATABASE_VAULT,
	DIALOG_ADD_ACCOUNT,
	DIALOG_EDIT_NON_ACCOUNT,
	DIALOG_EDIT_VAULT_CATEGORY,
	SUCCESS,
	TOAST_ERROR,
	VAULT_KIND_NODE,
	VAULT_KIND_EDGE,
	VAULT_KIND_CATEGORY,
	VAULT_DIALOG_KIND_CATEGORY,
	VAULT_NODE_ACCOUNT,
	VAULT_NODE_EMAIL,
	VAULT_DOT_CLASS_EMAIL,
	VAULT_DOT_CLASS_PHONE,
	VAULT_DOT_CLASS_LINK,
	VAULT_DOT_CLASS_ACCOUNT,
	VAULT_DOT_CLASS_NOTES,
	VAULT_NODE_PHONE,
	VAULT_NODE_LINK,
	VAULT_NODE_NOTES,
	VAULT_NODE_LEGACY_PASSWORD,
	VAULT_VIEW_GRAPH,
	VAULT_VIEW_LIST,
	VAULT_RELATION_LINKED,
	VAULT_RELATION_MANUAL,
	VAULT_RELATION_BACKUP,
	VAULT_FILTER_KEY_VERIFIED,
	VAULT_ICON_VERIFIED,
	VAULT_GRADIENT_VERIFIED,
	TIMEOUT_KEY_VAULT,
	VAULT_LOG_APPLY_FAILED,
	PASSPHRASE_LOCK_KEY_VAULT
} from '../../common/constants';
import {
	NAV_LABEL_VAULT,
	VAULT_SEARCH_PLACEHOLDER,
	VAULT_SEARCH_CLEAR,
	VAULT_TAB_GRAPH,
	VAULT_TAB_LIST,
	VAULT_BTN_ADD,
	VAULT_LIST_EDIT,
	VAULT_LIST_DONE,
	VAULT_DIALOG_VERIFIED_LABEL,
	VAULT_EMPTY_TITLE,
	VAULT_EMPTY_BODY,
	VAULT_LABEL_ACCOUNTS,
	VAULT_LABEL_IDENTIFIERS,
	VAULT_PAGE_SUBTITLE,
	VAULT_TYPE_ACCOUNT,
	VAULT_TYPE_EMAIL,
	VAULT_TYPE_PHONE,
	VAULT_TYPE_LINK,
	VAULT_TYPE_NOTES,
	VAULT_BTN_ADD_CONNECTIONS,
	VAULT_BTN_EDIT_NAME,
	VAULT_GRAPH_MOBILE_BLOCKED_BODY,
	MOBILE_BLOCKED_TITLE,
	VAULT_BANNER_SECOND,
	VAULT_BANNER_CANCEL,
	MSG_SAVE_FAILED,
	MSG_DELETING,
	DIALOG_BTN_DELETE,
	MSG_LOADING,
	VAULT_MSG_SAVING,
	VAULT_MSG_REMOVING_LINK,
	VAULT_NOTE_PLACEHOLDER,
	VAULT_MSG_ADDING_NOTE,
	VAULT_MSG_NOTE_ADDED,
	VAULT_MSG_DELETE_NODE_TITLE,
	VAULT_MSG_DELETE_NODE_CONFIRM_PREFIX,
	VAULT_MSG_DELETE_NODE_CONFIRM_SUFFIX,
	VAULT_MSG_NODE_REMOVED,
	VAULT_MSG_REMOVE_NODE_FAILED_DETAIL,
	VAULT_MSG_DELETE_CATEGORY_TITLE,
	VAULT_MSG_DELETE_CATEGORY_CONFIRM,
	VAULT_MSG_CATEGORY_REMOVED,
	VAULT_MSG_CATEGORY_UPDATED,
	VAULT_CATEGORY_DUPLICATE_NAME,
	VAULT_MSG_REMOVE_CATEGORY_FAILED_DETAIL,
	VAULT_MSG_ACCOUNT_SAVED,
	VAULT_MSG_NODE_SAVED,
	VAULT_MSG_CATEGORY_ADDED,
	VAULT_MSG_LINK_ADDED,
	VAULT_MSG_LINK_REMOVED,
	VAULT_MSG_IDENTIFIER_UPDATED,
	VAULT_MSG_SAVE_FAILED_DETAIL,
	VAULT_CATEGORY_OTHER_LABEL,
	VAULT_CATEGORY_UNCATEGORIZED_LABEL,
	VAULT_LEGEND_VERIFIED,
	vaultCategoryLabel
} from '../../common/locale/locale-strings';
import {
	AddAccountDialogSubmitData,
	EditNonAccountData,
	EditVaultCategoryData,
	NewAccountData,
	NewVaultCategoryData,
	VaultAccountRow,
	VaultBackupRow,
	VaultCategoryDef,
	VaultConnectionInput,
	VaultEdge,
	VaultLinkChip,
	VaultNode,
	VaultNodeType,
	VaultOverviewStat,
	VaultRecord,
	VaultSelectionAccount,
	VaultSelectionDetail,
	VaultSelectionIdentifier,
	VAULT_CARD_ENTRANCE_BASE_DELAY_MS,
	VAULT_CARD_ENTRANCE_MAX_DELAY_MS,
	VAULT_CARD_ENTRANCE_STEP_MS,
	VAULT_CATEGORY_DEFS,
	VAULT_CATEGORY_ICONS,
	VAULT_CATEGORY_OTHER,
	VAULT_EMAIL_META,
	VAULT_LINK_META,
	VAULT_NOTES_META,
	VAULT_PHONE_META
} from './vault.model';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { DatabaseService } from '../../backend/database-service/database.service';
import { TimeoutService } from '../../common/timeout/timeout.service';
import { VaultAccessService } from '../../backend/vault-access-service/vault-access.service';
import { GraphCanvasComponent } from './graph-canvas/graph-canvas.component';
import { BlockedCardComponent } from '../../common/blocked-card/blocked-card.component';
import { PassphraseLockComponent } from '../../common/passphrase-lock/passphrase-lock.component';

@Component({
	selector: 'vault',
	imports: [FormsModule, NgTemplateOutlet, GraphCanvasComponent, BlockedCardComponent, PassphraseLockComponent],
	templateUrl: './vault.component.html',
	styleUrls: ['../../common/glass-card.css', './vault.component.css']
})
export class VaultComponent implements OnInit, AfterViewInit, OnDestroy {
	private readonly className = 'VaultComponent';
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	@ViewChild('vaultContent') private vaultContentRef?: ElementRef<HTMLElement>;
	@ViewChildren('connectionPopover') private connectionPopoverRefs!: QueryList<ElementRef<HTMLElement>>;
	protected readonly NAV_LABEL_VAULT = NAV_LABEL_VAULT;
	protected readonly VAULT_SEARCH_PLACEHOLDER = VAULT_SEARCH_PLACEHOLDER;
	protected readonly VAULT_SEARCH_CLEAR = VAULT_SEARCH_CLEAR;
	protected readonly VAULT_TAB_GRAPH = VAULT_TAB_GRAPH;
	protected readonly VAULT_TAB_LIST = VAULT_TAB_LIST;
	protected readonly VAULT_BTN_ADD = VAULT_BTN_ADD;
	protected readonly VAULT_LIST_EDIT = VAULT_LIST_EDIT;
	protected readonly VAULT_LIST_DONE = VAULT_LIST_DONE;
	protected readonly VAULT_DIALOG_VERIFIED_LABEL = VAULT_DIALOG_VERIFIED_LABEL;
	protected readonly VAULT_NOTE_PLACEHOLDER = VAULT_NOTE_PLACEHOLDER;
	protected readonly VAULT_EMPTY_TITLE = VAULT_EMPTY_TITLE;
	protected readonly VAULT_EMPTY_BODY = VAULT_EMPTY_BODY;
	protected readonly VAULT_LABEL_ACCOUNTS = VAULT_LABEL_ACCOUNTS;
	protected readonly VAULT_LABEL_IDENTIFIERS = VAULT_LABEL_IDENTIFIERS;
	protected readonly VAULT_PAGE_SUBTITLE = VAULT_PAGE_SUBTITLE;
	protected readonly VAULT_BTN_ADD_CONNECTIONS = VAULT_BTN_ADD_CONNECTIONS;
	protected readonly VAULT_BTN_EDIT_NAME = VAULT_BTN_EDIT_NAME;
	protected readonly VAULT_GRAPH_MOBILE_BLOCKED_BODY = VAULT_GRAPH_MOBILE_BLOCKED_BODY;
	protected readonly MOBILE_BLOCKED_TITLE = MOBILE_BLOCKED_TITLE;
	protected readonly VAULT_BANNER_SECOND = VAULT_BANNER_SECOND;
	protected readonly VAULT_BANNER_CANCEL = VAULT_BANNER_CANCEL;
	protected readonly VAULT_MSG_DELETE_NODE_TITLE = VAULT_MSG_DELETE_NODE_TITLE;
	protected readonly MSG_LOADING = MSG_LOADING;
	protected readonly VAULT_CATEGORY_UNCATEGORIZED_LABEL = VAULT_CATEGORY_UNCATEGORIZED_LABEL;
	protected readonly PASSPHRASE_LOCK_KEY_VAULT = PASSPHRASE_LOCK_KEY_VAULT;
	protected isUnlocked = false;
	protected loading = true;
	protected view: typeof VAULT_VIEW_GRAPH | typeof VAULT_VIEW_LIST = VAULT_VIEW_GRAPH;
	protected query = '';
	protected editId: string | null = null;
	protected noteDraft = '';
	protected nameDraft = '';
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
	/* The map excludes notes nodes (and edges touching them) so private notes never render on the
	   graph; the full nodes/edges above still drive the list view where notes stay visible. */
	protected mapNodes: VaultNode[] = [];
	protected mapEdges: VaultEdge[] = [];
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
	/** Built-in preset categories with their placeholder labels resolved to localized text (recipe pattern). */
	private readonly presetCategories: VaultCategoryDef[] = VAULT_CATEGORY_DEFS.map((categoryDef) => ({
		...categoryDef,
		label: vaultCategoryLabel(categoryDef.key),
		categoryLabel: vaultCategoryLabel(categoryDef.key)
	}));
	private saveIndicatorTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};
	/* Serializes vault DB mutations so rapid edit-mode actions (verified, category, note, connection)
	   persist one-at-a-time in the order triggered — no write races another or is lost. */
	private vaultWriteQueue: Promise<unknown> = Promise.resolve();

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		private dialogService: DialogService,
		private databaseService: DatabaseService,
		private timeoutService: TimeoutService,
		private vaultAccessService: VaultAccessService,
		private cdr: ChangeDetectorRef,
		private ngZone: NgZone,
		private destroyRef: DestroyRef,
		protected utilities: Utilities
	) {}

	/**
	 * Starts the loading-timeout guard, then subscribes to the per-user vault graph and
	 * splits each emission into nodes, edges, and custom categories. The first emission
	 * clears the guard; if none arrives within the loading window the retry dialog is shown.
	 * The callback runs inside ngZone.run() because CloudBase WebSocket callbacks fire
	 * outside Angular's zone, and calls detectChanges() so the first snapshot paints
	 * immediately — without it the graph and category bar stay blank at load until a user
	 * interaction forces a tick. Also skips the passphrase gate up front when the Cadence
	 * grace window is still open (see {@link VaultAccessService.shouldSkipPassphrase}).
	 */
	ngOnInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			if (this.vaultAccessService.shouldSkipPassphrase()) {
				this.isUnlocked = true;
			}
			this.timeoutService.start(TIMEOUT_KEY_VAULT, () => {
				this.dialogService.showLoadingTimeout(this.dialogComponentContainer);
			});
			this.databaseService
				.getVault()
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe((records) =>
					this.ngZone.run(() => {
						this.timeoutService.clear(TIMEOUT_KEY_VAULT);
						/* Guard the render so a single bad snapshot cannot throw out of the subscription and
						   tear the watch down — that would silently stop every later live update until refresh. */
						try {
							this.applyRecords(records);
							this.cdr.detectChanges();
							/* Re-wire the auto-hide scrollbars now the content is rendered — ngAfterViewInit
							   can run before the content exists; these idempotent calls catch that case. */
							Utilities.attachScrollAutoHide(this.vaultContentRef?.nativeElement);
							this.attachConnectionPopoverScrollbars();
						} catch (error: unknown) {
							LOG.error(this.className, VAULT_LOG_APPLY_FAILED, error as Error);
						}
					})
				);
		}
	}

	/**
	 * Attaches the auto-hide scrollbar behaviour to the scrolling content area and the
	 * connection-count popovers.
	 */
	ngAfterViewInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			Utilities.attachScrollAutoHide(this.vaultContentRef?.nativeElement);
			this.attachConnectionPopoverScrollbars();
		}
	}

	/**
	 * Clears the dialog container, cancels the loading-timeout guard and pending
	 * save-indicator timers, stamps the Cadence grace window's start (leaving the vault),
	 * and logs destruction.
	 */
	ngOnDestroy(): void {
		this.dialogComponentContainer?.clear();
		this.timeoutService.clear(TIMEOUT_KEY_VAULT);
		Object.values(this.saveIndicatorTimeouts).forEach(clearTimeout);
		this.vaultAccessService.markLeft();
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	// ── Passphrase lock handler ───────────────────────────────────────────────

	/**
	 * Marks the page as unlocked once the passphrase gate reports success, revealing the real content
	 * and recording the unlock so the Cadence grace window can skip the gate on later visits.
	 */
	protected onVaultUnlocked(): void {
		this.isUnlocked = true;
		this.vaultAccessService.markUnlocked();
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
		// Only the category filter carries into the list view; drop the graph selection, type filter,
		// and any in-progress link mode so the list starts clean.
		this.selectedId = null;
		this.typeFilter = null;
		this.linkMode = false;
		this.linkSourceId = null;
	}

	/**
	 * Clears the search query.
	 */
	protected clearQuery(): void {
		this.query = '';
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
	 * @param event - The originating event, stopped so it does not select the card.
	 */
	protected toggleEditMode(accountId: string, event: Event): void {
		event.stopPropagation();
		this.editId = this.editId === accountId ? null : accountId;
		// Close any open category picker and reset the inline drafts so nothing carries over between
		// cards; seed the name draft with the account's current name when opening edit mode.
		this.categoryPickerId = null;
		this.noteDraft = '';
		this.nameDraft = this.editId === accountId ? (this.findNode(accountId)?.name ?? '') : '';
	}

	/**
	 * Commits the drafted account name and quits edit mode — the Enter-key finish for the inline
	 * list-view rename. Blur stays save-only ({@link updateAccountName}) so clicking another
	 * edit-mode control does not close the card.
	 *
	 * @param accountId - The id of the account being renamed.
	 * @param event - The originating event, passed through to the edit-mode toggle.
	 */
	protected completeNameEdit(accountId: string, event: Event): void {
		this.updateAccountName(accountId);
		this.toggleEditMode(accountId, event);
	}

	/**
	 * Persists the edited account name from the inline list-view name field (edit mode).
	 *
	 * @param accountId - The id of the account being renamed.
	 */
	protected updateAccountName(accountId: string): void {
		this.renameNode(accountId, this.nameDraft);
	}

	/**
	 * Adds the drafted note as a private notes node linked to the account (edit mode only). The note
	 * then renders as a connection chip and, like all notes, stays off the graph map. Runs inside a
	 * block dialog so the write cannot be double-submitted. On success flashes the save indicator and
	 * clears the draft; on failure shows an error toast.
	 *
	 * @param accountId - The id of the account the note is attached to.
	 */
	protected addNote(accountId: string): void {
		const value = this.noteDraft.trim();
		if (!value) return;
		this.dialogService.runBlocking(this.dialogComponentContainer, VAULT_MSG_ADDING_NOTE, async () => {
			try {
				await this.enqueueVaultWrite(async () => {
					const noteId = await this.databaseService.addVaultNode({
						nodeType: VAULT_NODE_NOTES,
						name: value,
						categories: [],
						verified: false
					});
					await this.databaseService.addVaultEdge({
						sourceId: accountId,
						targetId: noteId,
						relation: VAULT_RELATION_LINKED
					});
				});
				this.noteDraft = '';
				this.cdr.detectChanges();
				this.triggerSaveIndicator();
				this.dialogService.showToast(SUCCESS, VAULT_MSG_NOTE_ADDED);
			} catch {
				this.dialogService.showToast(TOAST_ERROR, MSG_SAVE_FAILED, VAULT_MSG_SAVE_FAILED_DETAIL);
			}
		});
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
		// Category assignment is an edit-mode-only action; the chips read as static until Edit is on.
		if (this.editId !== accountId) return;
		this.categoryPickerId = this.categoryPickerId === accountId ? null : accountId;
	}

	/**
	 * Adds or removes a category on an account from the inline picker, then persists the full new
	 * list. The picker stays open so several categories can be toggled in one session. Unselecting the
	 * last account that used a custom category removes that category too. On success flashes the save
	 * indicator; on failure shows an error toast.
	 *
	 * @param accountId - The id of the account being categorized.
	 * @param categoryKey - The category key to toggle on the account.
	 * @param currentKeys - The account's current category keys.
	 * @param event - The originating click event, stopped so it does not select the card.
	 */
	protected toggleAccountCategory(
		accountId: string,
		categoryKey: string,
		currentKeys: string[],
		event: Event
	): void {
		event.stopPropagation();
		const isRemoval = currentKeys.includes(categoryKey);
		const nextKeys = isRemoval
			? currentKeys.filter((key) => key !== categoryKey)
			: [...currentKeys, categoryKey];

		/* Apply the toggle to local state immediately so the chips and picker update on the first
		   click; the live DB watch re-emits the authoritative state moments later. */
		this.patchLocalNode(accountId, { categories: nextKeys });
		this.enqueueVaultWrite(() => this.databaseService.updateVaultNodeCategories(accountId, nextKeys))
			.then(() => {
				this.triggerSaveIndicator();
				// Unselecting the last account that used a custom category leaves it orphaned — drop it.
				if (isRemoval) this.removeOrphanedCategories([categoryKey], accountId).catch(() => {});
			})
			.catch(() => {
				// Revert the optimistic change and surface the failure.
				this.patchLocalNode(accountId, { categories: currentKeys });
				this.cdr.detectChanges();
				this.dialogService.showToast(TOAST_ERROR, MSG_SAVE_FAILED, VAULT_MSG_SAVE_FAILED_DETAIL);
			});
	}

	/**
	 * Toggles the account's verified flag from the inline list-view control (edit mode). Applies the
	 * change to local state immediately so the badge updates on the first click, then persists it; on
	 * failure reverts the optimistic change and shows an error toast.
	 *
	 * @param accountId - The id of the account being toggled.
	 * @param currentVerified - The account's current verified state.
	 * @param event - The originating click event, stopped so it does not select the card.
	 */
	protected toggleAccountVerified(accountId: string, currentVerified: boolean, event: Event): void {
		event.stopPropagation();
		const nextVerified = !currentVerified;
		this.patchLocalNode(accountId, { verified: nextVerified });
		this.enqueueVaultWrite(() => this.databaseService.updateVaultNodeVerified(accountId, nextVerified))
			.then(() => this.triggerSaveIndicator())
			.catch(() => {
				// Revert the optimistic change and surface the failure.
				this.patchLocalNode(accountId, { verified: currentVerified });
				this.cdr.detectChanges();
				this.dialogService.showToast(TOAST_ERROR, MSG_SAVE_FAILED, VAULT_MSG_SAVE_FAILED_DETAIL);
			});
	}

	// ── Removal handlers ─────────────────────────────────────────────────────

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
				await this.enqueueVaultWrite(() => this.databaseService.removeVaultEdge(edgeKey));
				this.triggerSaveIndicator();
				this.dialogService.showToast(SUCCESS, VAULT_MSG_LINK_REMOVED);
			} catch {
				this.dialogService.showToast(TOAST_ERROR, MSG_SAVE_FAILED, VAULT_MSG_SAVE_FAILED_DETAIL);
			}
		});
	}

	/**
	 * Opens the confirm dialog for deleting a vault node from a list-view card.
	 *
	 * @param nodeId - The id of the node to delete.
	 * @param event - The originating click event, stopped so it does not affect selection.
	 */
	protected openDeleteNodeDialog(nodeId: string, event: Event): void {
		event.stopPropagation();
		this.deleteNode(nodeId);
	}

	/**
	 * Opens the confirm dialog for deleting a vault node. On confirm, removes the node and every edge
	 * attached to it, drops any custom category the node was the last account to use, then clears the
	 * graph selection if it pointed at this node.
	 *
	 * {@link openDeleteNodeDialog} - Triggered from a list-view card's delete button.
	 * {@link openEditNodeNameDialog} - Triggered from the non-account node-name dialog's delete button.
	 *
	 * @param nodeId - The id of the node to delete.
	 */
	private deleteNode(nodeId: string): void {
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
					// Drop any custom category this node was the last account to use.
					this.removeOrphanedCategories(node.categories, node.id).catch(() => {});
					if (this.selectedId === node.id) this.selectedId = null;
					this.triggerSaveIndicator();
					this.dialogService.showToast(SUCCESS, VAULT_MSG_NODE_REMOVED);
				} catch (error: unknown) {
					this.dialogService.showToast(
						TOAST_ERROR,
						MSG_SAVE_FAILED,
						VAULT_MSG_REMOVE_NODE_FAILED_DETAIL
					);
					throw error;
				}
			}
		);
	}

	/**
	 * Opens a confirmation dialog to delete a custom category. On confirm, the category key is pulled
	 * from every account that carried it and the category record is removed. Mirrors the node-delete
	 * flow (confirm then direct write with toast feedback). Invoked from the edit dialog's delete action.
	 *
	 * @param categoryKey - The document id of the custom category to delete.
	 */
	private deleteCategoryByKey(categoryKey: string): void {
		const accountUpdates = this.nodes
			.filter((node) => node.nodeType === VAULT_NODE_ACCOUNT && node.categories.includes(categoryKey))
			.map((node) => ({
				id: node.id,
				categories: node.categories.filter((key) => key !== categoryKey)
			}));
		this.dialogService.confirmThenBlock(
			this.dialogComponentContainer,
			[VAULT_MSG_DELETE_CATEGORY_CONFIRM, VAULT_MSG_DELETE_CATEGORY_TITLE, DIALOG_BTN_DELETE],
			MSG_DELETING,
			async () => {
				try {
					await this.databaseService.removeVaultCategory(categoryKey, accountUpdates);
					if (this.categoryFilter === categoryKey) this.categoryFilter = null;
					this.triggerSaveIndicator();
					this.dialogService.showToast(SUCCESS, VAULT_MSG_CATEGORY_REMOVED);
				} catch (error: unknown) {
					this.dialogService.showToast(
						TOAST_ERROR,
						MSG_SAVE_FAILED,
						VAULT_MSG_REMOVE_CATEGORY_FAILED_DETAIL
					);
					throw error;
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
	 * Opens the add-account dialog and wires its submit callback to persist either the new account
	 * (or non-account identifier) or a standalone custom category, depending on the chosen kind.
	 */
	protected openAddDialog(): void {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_ADD_ACCOUNT,
			(data: AddAccountDialogSubmitData) =>
				data.kind === VAULT_DIALOG_KIND_CATEGORY ? this.handleCategorySave(data) : this.handleAccountSave(data),
			{
				categories: [...this.presetCategories, ...this.customCategories],
				existingNames: this.nodes.map((node) => node.name)
			}
		);
	}

	/**
	 * Persists a new node plus its connections: adds the primary node of the chosen type (account or a
	 * non-account identifier), then for each connection reuses an existing node by name or creates a new
	 * identifier of its chosen type, and links them — a `linked` edge from an account, a `backup` edge
	 * from a non-account identifier.
	 *
	 * @param accountData - The validated form data returned by the add-account dialog.
	 */
	private handleAccountSave(accountData: NewAccountData): Promise<void> {
		return this.dialogService.runBlocking(this.dialogComponentContainer, VAULT_MSG_SAVING, async () => {
			try {
				const isAccount = accountData.nodeType === VAULT_NODE_ACCOUNT;
				// Resolve categories — persist a freshly created custom category first, then append its id
				const categories = [...accountData.categories];
				if (accountData.newCategory) {
					const newCategoryId = await this.databaseService.addVaultCategory(
						accountData.newCategory
					);
					categories.push(newCategoryId);
				}

				// Add the primary node of the chosen type, carrying its verified state
				const primaryId = await this.databaseService.addVaultNode({
					nodeType: accountData.nodeType,
					name: Utilities.capitalizeFirstLetterOnEachWord(accountData.name.trim()),
					categories,
					verified: accountData.verified
				});

				const relation = isAccount ? VAULT_RELATION_LINKED : VAULT_RELATION_BACKUP;
				await this.linkConnectionsByName(primaryId, accountData.connections, relation);
				this.triggerSaveIndicator();
				this.dialogService.showToast(SUCCESS, isAccount ? VAULT_MSG_ACCOUNT_SAVED : VAULT_MSG_NODE_SAVED);
			} catch {
				this.dialogService.showToast(TOAST_ERROR, MSG_SAVE_FAILED, VAULT_MSG_SAVE_FAILED_DETAIL);
			}
		});
	}

	/**
	 * Resolves each connection to an existing node by name (case-insensitive, trimmed), or creates a
	 * new identifier node of its chosen type, then links it from the source node with the given
	 * relation — skipping empty values and self-links. Shared by {@link handleAccountSave} (account or
	 * identifier connections) and {@link handleNonAccountEdit} (backup links), which only differ in
	 * their source node and relation.
	 *
	 * @param sourceId - The id of the node each connection is linked from.
	 * @param connections - The connection rows to resolve and link.
	 * @param relation - The edge relation to write for each new link.
	 */
	private async linkConnectionsByName(
		sourceId: string,
		connections: VaultConnectionInput[],
		relation: string
	): Promise<void> {
		const nodeIdsByName = new Map(this.nodes.map((node) => [node.name.trim().toLowerCase(), node.id]));
		for (const connection of connections) {
			const connectionName = Utilities.capitalizeFirstLetterOnEachWord(connection.value.trim());
			if (!connectionName) continue;
			let targetId = nodeIdsByName.get(connectionName.toLowerCase());
			if (!targetId) {
				targetId = await this.databaseService.addVaultNode({
					nodeType: connection.type,
					name: connectionName,
					categories: [],
					verified: false
				});
				nodeIdsByName.set(connectionName.toLowerCase(), targetId);
			}
			if (targetId !== sourceId) {
				await this.databaseService.addVaultEdge({ sourceId, targetId, relation });
			}
		}
	}

	/**
	 * Persists a newly created standalone category (no account attached).
	 *
	 * @param data - The validated category data returned by the add-account dialog.
	 */
	private handleCategorySave(data: NewVaultCategoryData): Promise<void> {
		return this.dialogService.runBlocking(this.dialogComponentContainer, VAULT_MSG_SAVING, async () => {
			try {
				await this.databaseService.addVaultCategory({
					label: data.label,
					hex: data.hex,
					gradient: data.gradient,
					icon: data.icon
				});
				this.triggerSaveIndicator();
				this.dialogService.showToast(SUCCESS, VAULT_MSG_CATEGORY_ADDED);
			} catch {
				this.dialogService.showToast(TOAST_ERROR, MSG_SAVE_FAILED, VAULT_MSG_SAVE_FAILED_DETAIL);
			}
		});
	}

	/**
	 * Opens the dedicated edit-category dialog for a custom category, prefilled with its current name and icon,
	 * wiring submit to update both and delete to remove it.
	 *
	 * @param stat - The overview chip whose custom category is being edited.
	 * @param event - The originating click event, stopped so it does not toggle the category filter.
	 */
	protected openEditCategoryDialog(stat: VaultOverviewStat, event: Event): void {
		event.stopPropagation();
		const categoryDef = this.getCategoryDef(stat.key);
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_EDIT_VAULT_CATEGORY,
			(data: EditVaultCategoryData) => this.handleCategoryEdit(data, stat.key),
			{ name: categoryDef.categoryLabel, icon: categoryDef.icon, onDelete: () => this.deleteCategoryByKey(stat.key) }
		);
	}

	/**
	 * Renames a custom category and/or changes its icon. Skips the write entirely when neither changed, rejects a
	 * name collision with another category via toast, flashes the save indicator on success, and shows an error
	 * toast on failure.
	 *
	 * @param data - The validated label and icon from the edit dialog.
	 * @param categoryKey - The document id of the category being edited.
	 */
	private async handleCategoryEdit(data: EditVaultCategoryData, categoryKey: string): Promise<void> {
		const name = data.label.trim();
		const current = this.getCategoryDef(categoryKey);
		if (!name || (name === current.categoryLabel && data.icon === current.icon)) return;
		// Reject an edit that would collide with another preset or custom category's name.
		const nameKey = name.toLowerCase();
		const isDuplicate = [...this.presetCategories, ...this.customCategories].some(
			(categoryDef) =>
				categoryDef.key !== categoryKey && categoryDef.categoryLabel.trim().toLowerCase() === nameKey
		);
		if (isDuplicate) {
			this.dialogService.showToast(TOAST_ERROR, VAULT_CATEGORY_DUPLICATE_NAME);
			return;
		}
		await this.dialogService.runBlocking(this.dialogComponentContainer, VAULT_MSG_SAVING, async () => {
			try {
				await this.databaseService.updateVaultCategory(categoryKey, { label: name, icon: data.icon });
				this.triggerSaveIndicator();
				this.dialogService.showToast(SUCCESS, VAULT_MSG_CATEGORY_UPDATED);
			} catch {
				this.dialogService.showToast(TOAST_ERROR, MSG_SAVE_FAILED, VAULT_MSG_SAVE_FAILED_DETAIL);
			}
		});
	}

	/**
	 * Opens the dedicated edit-non-account dialog for a non-account node, prefilled with its current
	 * name and the backup links it already owns, and wired to delete the node — this dialog is the only
	 * place a non-account node can be renamed, backed up, or removed, since the map view no longer has
	 * its own delete button.
	 *
	 * @param detail - The selection detail for the non-account node being edited.
	 * @param event - The originating click event, stopped so it does not bubble to the card/graph.
	 */
	protected openEditNodeNameDialog(detail: VaultSelectionDetail, event: Event): void {
		event.stopPropagation();
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_EDIT_NON_ACCOUNT,
			(data: EditNonAccountData) => this.handleNonAccountEdit(data, detail.id),
			{
				name: detail.name,
				icon: detail.icon,
				backups: this.buildBackupRows(detail.id),
				onDelete: () => this.deleteNode(detail.id)
			}
		);
	}

	/**
	 * Builds the list of backup links a non-account node owns (edges where it is the source and the
	 * relation is backup), for display as removable rows in its edit dialog. Only backups this node
	 * points to are shown — if this node is itself the target of another node's backup edge, that
	 * relationship is managed from the other node's dialog, not surfaced here.
	 *
	 * @param nodeId - The id of the node whose owned backup links to collect.
	 * @returns The node's backup rows, resolved to their target's name, type, and icon.
	 */
	private buildBackupRows(nodeId: string): VaultBackupRow[] {
		return this.edges
			.filter((edge) => edge.sourceId === nodeId && edge.relation === VAULT_RELATION_BACKUP)
			.map((edge) => {
				const target = this.findNode(edge.targetId);
				const isPhone = target?.nodeType === VAULT_NODE_PHONE;
				return {
					edgeKey: edge.id,
					name: target?.name ?? '',
					type: isPhone ? VAULT_NODE_PHONE : VAULT_NODE_EMAIL,
					icon: isPhone ? VAULT_PHONE_META.icon : VAULT_EMAIL_META.icon
				};
			});
	}

	/**
	 * Renames a non-account node to the submitted name (fire-and-forget, own error handling), then — if
	 * any backup links were added or removed — persists those under a blocking overlay, since that step
	 * can involve several writes (new identifier nodes plus their backup edges, or edge removals) and
	 * deserves explicit save feedback the plain rename does not need.
	 *
	 * @param data - The validated form data from the edit-non-account dialog.
	 * @param nodeId - The id of the node being edited.
	 */
	private async handleNonAccountEdit(data: EditNonAccountData, nodeId: string): Promise<void> {
		this.renameNode(nodeId, data.name);
		if (data.addedBackups.length === 0 && data.removedBackupEdgeKeys.length === 0) return;

		await this.dialogService.runBlocking(this.dialogComponentContainer, VAULT_MSG_SAVING, async () => {
			try {
				await this.enqueueVaultWrite(async () => {
					await this.linkConnectionsByName(nodeId, data.addedBackups, VAULT_RELATION_BACKUP);
					for (const edgeKey of data.removedBackupEdgeKeys) {
						await this.databaseService.removeVaultEdge(edgeKey);
					}
				});
				this.triggerSaveIndicator();
				this.dialogService.showToast(SUCCESS, VAULT_MSG_IDENTIFIER_UPDATED);
			} catch {
				this.dialogService.showToast(TOAST_ERROR, MSG_SAVE_FAILED, VAULT_MSG_SAVE_FAILED_DETAIL);
			}
		});
	}

	// ── Private helpers ──────────────────────────────────────────────────────

	/**
	 * Attaches the auto-hide scrollbar behaviour to every rendered connection-count popover.
	 */
	private attachConnectionPopoverScrollbars(): void {
		this.connectionPopoverRefs?.forEach((ref) => Utilities.attachScrollAutoHide(ref.nativeElement));
	}

	/**
	 * Splits a vault emission into typed node, edge, and category collections, then derives the
	 * notes-free map lists (mapNodes / mapEdges) the graph renders.
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
					// Normalize legacy 'password' nodes (pre-rename) to 'notes' so old docs display correctly.
					nodeType:
						record.nodeType === VAULT_NODE_LEGACY_PASSWORD
							? VAULT_NODE_NOTES
							: (record.nodeType ?? VAULT_NODE_ACCOUNT),
					name: record.name ?? '',
					/* Migration: prefer the categories array; fall back to a legacy single category
					   (dropping the old 'other' sentinel, which now maps to an empty list = Uncategorized). */
					categories:
						record.categories ??
						(record.category && record.category !== VAULT_CATEGORY_OTHER.key
							? [record.category]
							: []),
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
					icon: record.icon ?? this.categoryIconForKey(record.key),
					hex: record.hex ?? '',
					gradient: record.gradient ?? ''
				});
			}
		}
		this.nodes = nodes;
		this.edges = edges;
		/* Derive the map's view: drop notes nodes and any edge that touches one, so private
		   notes never reach the graph while the full lists still feed the list view. */
		const notesNodeIds = new Set(
			nodes.filter((node) => node.nodeType === VAULT_NODE_NOTES).map((node) => node.id)
		);
		this.mapNodes = nodes.filter((node) => node.nodeType !== VAULT_NODE_NOTES);
		this.mapEdges = edges.filter(
			(edge) => !notesNodeIds.has(edge.sourceId) && !notesNodeIds.has(edge.targetId)
		);
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
	 * Gets a stable, distinct display icon for a custom category by hashing its document id into the
	 * icon palette. Keyed by the id (not list position) so a category keeps its icon as others are
	 * added or removed; used when mapping category records so each one reads differently in the overview.
	 *
	 * @param categoryKey - The document id of the custom category.
	 * @returns The Material Symbols icon name for the category.
	 */
	private categoryIconForKey(categoryKey: string): string {
		let hash = 0;
		for (let index = 0; index < categoryKey.length; index++) {
			hash = (hash * 31 + categoryKey.charCodeAt(index)) >>> 0;
		}
		return VAULT_CATEGORY_ICONS[hash % VAULT_CATEGORY_ICONS.length];
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
			this.presetCategories.find((categoryDef) => categoryDef.key === categoryKey) ??
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
		if (node.nodeType === VAULT_NODE_NOTES) return VAULT_NOTES_META.gradient;
		return this.getCategoryDef(node.categories[0] ?? '').gradient;
	}

	/**
	 * Gets the type tag's background for the selection detail — the node type's legend color, so the tag
	 * matches how that type is shown in the legend. Accounts use the default (uncategorized) account color
	 * — a real map color, since accounts have no single color — rather than their per-category avatar
	 * color; identifiers reuse their fixed type gradient.
	 *
	 * @param node - The selected node.
	 * @returns The CSS background string matching the legend.
	 */
	private typeGradient(node: VaultNode): string {
		return node.nodeType === VAULT_NODE_ACCOUNT
			? VAULT_CATEGORY_OTHER.gradient
			: this.getNodeGradient(node);
	}

	/**
	 * Gets the list-view avatar background for an account — its single category gradient for one (or
	 * no) category, or an equal-segment conic gradient across every category's color when it has two
	 * or more, mirroring the segmented tile on the graph map.
	 *
	 * @param account - The account node to build an avatar background for.
	 * @returns The CSS background string.
	 */
	private getAccountAvatarBackground(account: VaultNode): string {
		if (account.categories.length < 2) return this.getNodeGradient(account);
		const count = account.categories.length;
		const segments = account.categories
			.map((categoryKey, index) => {
				const hex = this.getCategoryDef(categoryKey).hex;
				const start = ((index / count) * 100).toFixed(2);
				const end = (((index + 1) / count) * 100).toFixed(2);
				return `${hex} ${start}% ${end}%`;
			})
			.join(', ');
		return `conic-gradient(${segments})`;
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
		if (nodeType === VAULT_NODE_NOTES) return VAULT_DOT_CLASS_NOTES;
		return VAULT_DOT_CLASS_ACCOUNT;
	}

	/**
	 * Builds the list-view row view-model for a single account, including its connection chips.
	 *
	 * @param account - The account node to build a row for.
	 * @param nodesById - Every node keyed by id, used to resolve each edge's far end.
	 * @returns The account row view-model.
	 */
	private buildAccountRow(account: VaultNode, nodesById: Map<string, VaultNode>): VaultAccountRow {
		const links: VaultLinkChip[] = this.edges
			.filter((edge) => edge.sourceId === account.id || edge.targetId === account.id)
			.map((edge) => {
				const otherId = edge.sourceId === account.id ? edge.targetId : edge.sourceId;
				const other = nodesById.get(otherId);
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
			letter: Utilities.getInitials(account.name),
			gradient: this.getAccountAvatarBackground(account),
			categoryChips: account.categories.map((categoryKey) => {
				const categoryDef = this.getCategoryDef(categoryKey);
				return { key: categoryKey, label: categoryDef.categoryLabel, gradient: categoryDef.gradient };
			}),
			categoryKeys: account.categories,
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
		if (nodeType === VAULT_NODE_NOTES) return VAULT_TYPE_NOTES;
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
		if (nodeType === VAULT_NODE_NOTES) return VAULT_NOTES_META.icon;
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

	/**
	 * Returns true when an account passes the active category filter — every account when no filter
	 * is set, verified accounts under the Verified filter, accounts with no categories under the
	 * Uncategorized filter, or accounts whose category list contains the filtered key.
	 *
	 * @param node - The account node to test against the current category filter.
	 * @returns Whether the account is visible under the category filter.
	 */
	private matchesCategoryFilter(node: VaultNode): boolean {
		if (!this.categoryFilter) return true;
		if (this.categoryFilter === VAULT_FILTER_KEY_VERIFIED) return node.verified;
		if (this.categoryFilter === VAULT_CATEGORY_OTHER.key) return node.categories.length === 0;
		return node.categories.includes(this.categoryFilter);
	}

	/**
	 * Returns true when a card shows text containing the search query — its account name, any
	 * connection value (an email address, a phone number, or a note), or any category chip label.
	 * Every value the card renders is searchable, so a note fragment or a phone number finds each
	 * account carrying it.
	 *
	 * @param row - The account row to test against the search query.
	 * @param query - The trimmed, lower-cased search query.
	 * @returns Whether the card shows text containing the query.
	 */
	private matchesQuery(row: VaultAccountRow, query: string): boolean {
		if (row.name.toLowerCase().includes(query)) return true;
		if (row.links.some((link) => link.name.toLowerCase().includes(query))) return true;
		return row.categoryChips.some((chip) => chip.label.toLowerCase().includes(query));
	}

	/**
	 * Applies a partial patch to one node in local state (immutably) so the view reflects a change
	 * before the database watch re-emits. Backs the optimistic inline category picker, the inline
	 * verified toggle, and node renaming.
	 *
	 * @param nodeId - The id of the node to update.
	 * @param patch - The node fields to overwrite locally.
	 */
	private patchLocalNode(nodeId: string, patch: Partial<VaultNode>): void {
		this.nodes = this.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node));
	}

	/**
	 * Chains a vault DB mutation onto the serial write queue so rapid edit-mode actions run one-at-a-time
	 * in the order triggered — none races another on the same document or is lost. The chain survives a
	 * failed write (a rejection does not stall the queue) so every later write still runs.
	 *
	 * {@link renameNode} - Persists a node name change.
	 * {@link toggleAccountVerified} - Persists a verified-flag toggle.
	 * {@link toggleAccountCategory} - Persists a category add/remove.
	 * {@link removeOrphanedCategories} - Drops categories left unused by a toggle or delete.
	 * {@link removeLink} - Removes a connection (or note) edge.
	 * {@link addNote} - Adds a note node and its edge.
	 *
	 * @param operation - The database mutation to run once the prior queued writes settle.
	 * @returns A promise that settles with the operation's own result.
	 */
	private enqueueVaultWrite<ResultType>(operation: () => Promise<ResultType>): Promise<ResultType> {
		const run = this.vaultWriteQueue.then(operation, operation);
		this.vaultWriteQueue = run.catch(() => {});
		return run;
	}

	/**
	 * Renames a node to the given name if it actually changed: applies the change to local state
	 * immediately, then saves — reverting and toasting on failure.
	 *
	 * {@link updateAccountName} - Commits the inline-edited account name from the list view.
	 * {@link handleNonAccountEdit} - Commits the dialog-edited name (and any backup links) for a non-account node.
	 *
	 * @param nodeId - The id of the node being renamed.
	 * @param nextName - The candidate new name, trimmed and capitalized on each word (English text) before comparison and storage.
	 */
	private renameNode(nodeId: string, nextName: string): void {
		const formattedName = Utilities.capitalizeFirstLetterOnEachWord(nextName.trim());
		const currentName = this.findNode(nodeId)?.name ?? '';
		if (!formattedName || formattedName === currentName) return;
		this.patchLocalNode(nodeId, { name: formattedName });
		this.enqueueVaultWrite(() => this.databaseService.updateVaultNodeName(nodeId, formattedName))
			.then(() => this.triggerSaveIndicator())
			.catch(() => {
				// Revert the optimistic change and surface the failure.
				this.patchLocalNode(nodeId, { name: currentName });
				this.cdr.detectChanges();
				this.dialogService.showToast(TOAST_ERROR, MSG_SAVE_FAILED, VAULT_MSG_SAVE_FAILED_DETAIL);
			});
	}

	/**
	 * Removes every custom category in the candidate keys that no remaining node still references, so
	 * a category is discarded once its last account is deleted or unselects it. Only user-created
	 * custom categories are removable — the Uncategorized fallback is never a stored record. Clears the
	 * active category filter when it pointed at a removed category. Each removal reuses
	 * {@link DatabaseService.removeVaultCategory} with no account updates, since an orphaned category
	 * has no accounts left to strip.
	 *
	 * {@link deleteNode} - Cleans up a deleted node's now-unused categories.
	 * {@link toggleAccountCategory} - Cleans up a category an account just unselected.
	 *
	 * @param candidateKeys - The category keys that may have become orphaned.
	 * @param excludeNodeId - The id of the node just deleted or re-categorized, excluded from the usage scan.
	 * @returns A promise that resolves when every orphaned category is removed.
	 */
	private async removeOrphanedCategories(candidateKeys: string[], excludeNodeId: string): Promise<void> {
		const orphanKeys = candidateKeys.filter(
			(key) =>
				this.customCategoryKeys.has(key) &&
				!this.nodes.some((node) => node.id !== excludeNodeId && node.categories.includes(key))
		);
		if (this.categoryFilter && orphanKeys.includes(this.categoryFilter)) this.categoryFilter = null;
		await this.enqueueVaultWrite(() =>
			Promise.all(orphanKeys.map((key) => this.databaseService.removeVaultCategory(key, [])))
		);
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
	 * Gets the account rows for the list view, narrowed by the category filter first and then by
	 * the search query — which matches every value a card shows, not only the account name — and
	 * sorted by connection count (most-connected first). The card currently in edit mode is kept
	 * regardless of the category filter, so editing its category (which persists immediately)
	 * does not make it vanish before Done.
	 *
	 * @returns The filtered, sorted account row view-models.
	 */
	protected get accountRows(): VaultAccountRow[] {
		const query = this.query.trim().toLowerCase();

		/* Keyed once per read rather than scanning the node list for every edge — each row resolves
		   its connections through this map, and a typed query now builds every category-passing row. */
		const nodesById = new Map(this.nodes.map((node) => [node.id, node]));

		/* The query filter runs after the row is built, not before: connection values and
		   category labels live on the built row, and the search matches those too. */
		return this.nodes
			.filter((node) => node.nodeType === VAULT_NODE_ACCOUNT)
			.filter((node) => node.id === this.editId || this.matchesCategoryFilter(node))
			.map((account) => this.buildAccountRow(account, nodesById))
			.filter((row) => !query || this.matchesQuery(row, query))
			.sort((a, b) => b.linkCount - a.linkCount);
	}

	/**
	 * Gets the info-bar detail for the selected node: its identity, type, and the
	 * connected accounts versus email/phone identifiers, each listed for their
	 * stat-pill hover popover.
	 *
	 * @returns The selection detail, or null when nothing is selected.
	 */
	protected get selectionDetail(): VaultSelectionDetail | null {
		const node = this.findNode(this.selectedId);
		if (!node) return null;
		const connectedAccounts: VaultSelectionAccount[] = [];
		const identifiers: VaultSelectionIdentifier[] = [];
		this.neighborsOf(node.id).forEach((neighbourId) => {
			const other = this.nodes.find((candidate) => candidate.id === neighbourId);
			// Skip private notes nodes so they never contribute to the selection counts.
			if (!other || other.nodeType === VAULT_NODE_NOTES) return;
			if (other.nodeType === VAULT_NODE_ACCOUNT) {
				connectedAccounts.push({
					name: other.name,
					letter: Utilities.getInitials(other.name),
					gradient: this.getNodeGradient(other)
				});
				return;
			}
			identifiers.push({
				name: other.name,
				icon: this.getIdentifierIcon(other.nodeType),
				gradient: this.getNodeGradient(other)
			});
		});
		const isAccount = node.nodeType === VAULT_NODE_ACCOUNT;
		return {
			id: node.id,
			name: node.name,
			typeLabel: this.typeLabel(node.nodeType),
			avatarGradient: this.getNodeGradient(node),
			typeGradient: this.typeGradient(node),
			isAccount,
			isIcon: !isAccount,
			icon: isAccount ? '' : this.getIdentifierIcon(node.nodeType),
			letter: Utilities.getInitials(node.name),
			accountCount: connectedAccounts.length,
			connectedAccounts,
			identifierCount: identifiers.length,
			identifiers
		};
	}

	/**
	 * Gets the per-category overview chips shown in the info bar when nothing is selected, plus a
	 * trailing Verified chip tallying verified accounts. Only categories (and Verified) that have at
	 * least one matching account appear.
	 *
	 * @returns The overview stat chips.
	 */
	protected get overviewStats(): VaultOverviewStat[] {
		const counts: Record<string, number> = {};
		let verifiedCount = 0;
		this.nodes.forEach((node) => {
			if (node.nodeType !== VAULT_NODE_ACCOUNT) return;
			if (node.verified) verifiedCount++;
			// An account counts toward each of its categories; one with none goes to the Uncategorized bucket.
			if (node.categories.length === 0) {
				counts[this.otherCategory.key] = (counts[this.otherCategory.key] ?? 0) + 1;
				return;
			}
			node.categories.forEach((categoryKey) => {
				counts[categoryKey] = (counts[categoryKey] ?? 0) + 1;
			});
		});
		// Presets, then custom categories, then the Uncategorized fallback — only those with any account.
		const categoryStats = [...this.presetCategories, ...this.customCategories, this.otherCategory]
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
		// Verified is a cross-cutting pseudo-category, not a real one — appended last, same click-to-filter behavior via categoryFilter.
		if (!verifiedCount) return categoryStats;
		return [
			...categoryStats,
			{
				key: VAULT_FILTER_KEY_VERIFIED,
				icon: VAULT_ICON_VERIFIED,
				gradient: VAULT_GRADIENT_VERIFIED,
				value: verifiedCount,
				label: VAULT_LEGEND_VERIFIED,
				isActive: this.categoryFilter === VAULT_FILTER_KEY_VERIFIED,
				isCustom: false
			}
		];
	}

	/**
	 * Gets the categories a user can toggle on an account from the inline picker — every preset and
	 * custom category. Toggling all of them off leaves the account Uncategorized (an empty category list).
	 *
	 * @returns The assignable category options.
	 */
	protected get assignableCategories(): { key: string; label: string; gradient: string }[] {
		return [...this.presetCategories, ...this.customCategories].map((categoryDef) => ({
			key: categoryDef.key,
			label: categoryDef.categoryLabel,
			gradient: categoryDef.gradient
		}));
	}

	/**
	 * Computes an account card's entrance-animation delay, staggered by its position in the list.
	 *
	 * @param index - The zero-based row index.
	 * @returns The animation delay in milliseconds, capped at VAULT_CARD_ENTRANCE_MAX_DELAY_MS.
	 */
	protected cardEntranceDelay(index: number): number {
		return Math.min(
			VAULT_CARD_ENTRANCE_MAX_DELAY_MS,
			VAULT_CARD_ENTRANCE_BASE_DELAY_MS + index * VAULT_CARD_ENTRANCE_STEP_MS
		);
	}
}
