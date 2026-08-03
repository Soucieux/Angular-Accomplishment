import { ComponentRef, Injectable, Type, ViewContainerRef } from '@angular/core';
import { ConfirmDialogComponent } from './confirm/confirm.component';
import { AddDialogComponent } from './add-movie/add-movie.component';
import { LOG } from '../../common/app.logs';
import { MovieItemVO } from '../../fontend/entertainment/movieItem.vo';
import { HistoryDialogComponent } from './history/history.component';
import { SearchDialogComponent } from './search/search.component';
import { Observable, take } from 'rxjs';
import { ErrorDialogComponent } from './error/error.component';
import { BlockDialogComponent } from './block/block.component';
import { RetryDialogComponent } from './retry/retry.component';
import {
	DIALOG_ADD,
	DIALOG_ADD_ACCOUNT,
	DIALOG_BLOCK,
	DIALOG_CATEGORY,
	DIALOG_CONFIRM,
	DIALOG_DEBT,
	DIALOG_DELETE_ACCOUNT,
	DIALOG_EDIT_NON_ACCOUNT,
	DIALOG_EDIT_VAULT_CATEGORY,
	DIALOG_ERROR,
	DIALOG_HISTORY,
	DIALOG_LINK,
	DIALOG_MULTI_LINK,
	DIALOG_INGREDIENT,
	DIALOG_RETRY,
	SEARCH
} from '../../common/constants';
import {
	MSG_DIALOG_ALREADY_OPEN,
	MSG_DIALOG_CONTAINER_NOT_FOUND,
	MSG_INVALID_DIALOG_TYPE,
	MSG_PERMISSION_DENIED,
	MSG_UNEXPECTED_ERROR,
	RETRY_DIALOG_MSG
} from '../../common/locale/locale-strings';
import { MessageService } from 'primeng/api';
import { IngredientDialogComponent } from './ingredient/ingredient.component';
import { IngredientType, TypeTab } from '../../fontend/recipe/recipe.model';
import { Utilities } from '../../common/utilities/app.utilities';
import { CloudbaseService } from '../database-service/cloudbase/cloudbase.service';
import { AddDebtDialogComponent } from './add-debt/add-debt.component';
import { NewDebtData } from '../../fontend/debt/debt.model';
import { AddLinkDialogComponent } from './add-link/add-link.component';
import { MultiLinkDialogComponent } from './multi-link/multi-link.component';
import { CategoryDialogComponent } from './category/category.component';
import { AddAccountDialogComponent } from './add-account/add-account.component';
import { EditNonAccountDialogComponent } from './edit-non-account/edit-non-account.component';
import { EditVaultCategoryDialogComponent } from './edit-vault-category/edit-vault-category.component';
import { NewCategoryData, NewLinkData } from '../../fontend/portal/portal.model';
import {
	AddAccountDialogData,
	AddAccountDialogSubmitData,
	EditNonAccountData,
	EditVaultCategoryData,
	VaultBackupRow
} from '../../fontend/vault/vault.model';
import { DeleteAccountDialogComponent, DeleteConfirmText } from './delete-account/delete-account.component';
import { SessionExpiredError } from '../../common/error/session-expired.error';
import { DialogError } from '../../common/error/dialog.error';
import { UnexpectedError } from '../../common/error/unexpected.error';

@Injectable({
	providedIn: 'root'
})
export class DialogService {
	private readonly className = 'DialogService';
	private openedDialogs = new Map<string, ComponentRef<any>>();
	private readonly stackableDialogTypes = new Set([DIALOG_ERROR, DIALOG_BLOCK, DIALOG_RETRY]);

	constructor(
		private messageService: MessageService,
		private utilities: Utilities
	) {}

	// ── Dialog dispatch ──────────────────────────────────────────────────────

	// Overload methods to call correct dialog component
	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'block',
		task: () => Promise<void>,
		message: string
	): Promise<void>;

	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'search',
		acceptCallback: () => void
	): void;

	public openDialog(dialogContainerRef: ViewContainerRef, dialogType: 'error', errorMessage: string): void;

	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'confirm',
		acceptCallback: () => void,
		data: string[]
	): void;

	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'add',
		submitCallback: (movie: MovieItemVO) => void | Promise<void>,
		searchCallback: (movie: MovieItemVO) => void
	): void;

	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'history',
		revertDataCallback: (movie: MovieItemVO) => void,
		data: Observable<any>
	): void;

	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'ingredient',
		applyCallback: (newIds: Set<IngredientType>) => void,
		data: { masterTabs: TypeTab[]; enabledTypeIds: Set<IngredientType> }
	): void;

	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'debt',
		submitCallback: (data: NewDebtData) => void | Promise<void>,
		prefillData: Partial<NewDebtData> | null
	): void;

	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'link',
		submitCallback: (data: NewLinkData) => void | Promise<void>,
		prefillData: Partial<NewLinkData> | null
	): void;

	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'multi-link',
		submitCallback: (links: NewLinkData[]) => void | Promise<void>,
		categories: string[]
	): void;

	public openDialog(dialogContainerRef: ViewContainerRef, dialogType: 'retry', message: string): void;

	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'delete-account',
		submitCallback: (password: string) => Promise<void>,
		text?: DeleteConfirmText
	): void;

	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'category',
		submitCallback: (data: NewCategoryData) => void | Promise<void>,
		options: {
			prefillData: Partial<NewCategoryData> | null;
			onDelete?: () => void;
			editTitle?: string;
		}
	): void;

	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'edit-non-account',
		submitCallback: (data: EditNonAccountData) => void | Promise<void>,
		data: { name: string; icon: string; backups: VaultBackupRow[]; onDelete?: () => void }
	): void;

	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'edit-vault-category',
		submitCallback: (data: EditVaultCategoryData) => void | Promise<void>,
		dialogData: { name: string; icon: string; onDelete?: () => void }
	): void;

	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'add-account',
		submitCallback: (data: AddAccountDialogSubmitData) => void | Promise<void>,
		dialogData: AddAccountDialogData
	): void;

	/**
	 * Opens a dialog.
	 *
	 * @param dialogContainerRef - The container where dialogs should be attached.
	 * @param dialogType - The type of dialog to open.
	 * @param dataOrCallback1 - First callback to call or any data to pass.
	 * @param dataOrCallback2 - Second callback to call or any data to pass.
	 * @returns A promise that resolves when a 'block' dialog's task settles; undefined for every other dialog type.
	 */
	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: string,
		dataOrCallback1: any,
		dataOrCallback2?: any
	): void | Promise<void> {

		// Step 1: Guard — a null container means the component host is not yet initialized
		if (!dialogContainerRef) {
			const error = new DialogError(MSG_DIALOG_CONTAINER_NOT_FOUND);
			LOG.error(this.className, error.message);
			throw error;
		}

		/*
		 * Step 2: Enforce single-instance rule per dialog type.
		 * Stackable types (block, error, retry) are silently skipped when already open;
		 * all other types throw to surface the duplicate-open bug to the caller.
		 */
		if (this.openedDialogs.has(dialogType)) {
			if (this.stackableDialogTypes.has(dialogType)) {
				/* Block callers await the result (see runBlocking) — a resolved promise keeps that
				   safe, whereas plain undefined breaks the declared Promise return contract. */
				return dialogType === DIALOG_BLOCK ? Promise.resolve() : undefined;
			}
			const error = new DialogError(MSG_DIALOG_ALREADY_OPEN);
			LOG.error(this.className, error.message);
			throw error;
		}

		try {
			// Step 3: Dynamically instantiate the component inside the provided container
			const dialogComponent = this.getDialogComponent(dialogType);
			const dialogComponentRef = dialogContainerRef.createComponent(dialogComponent);

			let blockPromise: Promise<void> | undefined;

			/*
			 * Step 4: Wire arguments to the dialog instance.
			 * Search/error/retry take only one argument; block returns a Promise so
			 * the caller can await task completion; all others receive two arguments.
			 */
			if (dialogType === SEARCH || dialogType === DIALOG_ERROR || dialogType === DIALOG_RETRY) {
				dialogComponentRef.instance.openDialog(dataOrCallback1);
			} else if (dialogType === DIALOG_BLOCK) {
				blockPromise = dialogComponentRef.instance.openDialog(dataOrCallback1, dataOrCallback2);
			} else if (dialogType === DIALOG_DELETE_ACCOUNT) {
				dialogComponentRef.instance.openDialog(dataOrCallback1, dataOrCallback2);
				dialogComponentRef.instance.sessionExpired$.pipe(take(1)).subscribe(() => {
					this.showSessionExpired(dialogContainerRef);
				});
			} else {
				dialogComponentRef.instance.openDialog(dataOrCallback1, dataOrCallback2);
			}

			/* Step 5: Subscribe to the closed$ event to remove the tracking entry and
			   destroy the component ref — omitting destroy() would leak the DOM node. */
			dialogComponentRef.instance.closed$.pipe(take(1)).subscribe(() => {
				this.openedDialogs.delete(dialogType);
				dialogComponentRef.destroy();
			});

			this.openedDialogs.set(dialogType, dialogComponentRef);

			// Step 6: Expose the block promise so callers can await long-running tasks
			if (blockPromise) {
				return blockPromise;
			}
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : MSG_UNEXPECTED_ERROR;
			LOG.error(this.className, message);

			// Re-propagate already-typed dialog errors as-is; wrap everything else in the typed fallback
			if (error instanceof DialogError) throw error;
			throw new UnexpectedError();
		}
	}

	// ── Blocking and confirm helpers ─────────────────────────────────────────

	/**
	 * Opens a confirm dialog and, on accept, runs the given async work behind a blocking overlay.
	 * The overlay opens on top of the confirm dialog while the confirm stays visible underneath;
	 * when the work resolves the overlay and the confirm dialog close together (consistent with the
	 * history "undo" flow). The modal overlay blocks re-clicks and a repeat trigger while it is up
	 * is silently skipped (stackable rule), so the work can never double-fire. Rejected work closes
	 * the overlay and propagates to the confirm callback, which keeps the confirm dialog open.
	 *
	 * @param container - The ViewContainerRef to attach the dialogs to.
	 * @param confirmData - The confirm dialog display data (fixed three-element array).
	 * @param confirmData[0] - The message to display in the dialog body.
	 * @param confirmData[1] - The header title of the dialog.
	 * @param confirmData[2] - The accept button label.
	 * @param blockMessage - The message shown on the blocking overlay while the work runs.
	 * @param work - The async DB work to run after the user confirms.
	 */
	public confirmThenBlock(
		container: ViewContainerRef,
		confirmData: [string, string, string],
		blockMessage: string,
		work: () => Promise<void>
	): void {
		/* Await the overlay inside the confirm's accept callback so the confirm dialog stays open
		   under the overlay and both close together when the work resolves. A rejected write
		   propagates and prevents the confirm dialog from reporting false success. */
		this.openDialog(container, 'confirm', async () => {
			await this.runBlocking(container, blockMessage, work);
		}, confirmData);
	}

	/**
	 * Runs the given async work behind a blocking overlay that auto-removes when the work
	 * resolves. A repeat call while the overlay is up is silently skipped (stackable rule),
	 * which makes this the standard duplicate-click guard for dialog-triggered DB writes.
	 * A rejected task closes the overlay and propagates to the owning dialog or caller.
	 *
	 * @param container - The ViewContainerRef to attach the overlay to.
	 * @param blockMessage - The message shown on the blocking overlay while the work runs.
	 * @param work - The async DB work to run behind the overlay.
	 * @returns A promise that resolves when the work completes and rejects when it fails.
	 */
	public runBlocking(container: ViewContainerRef, blockMessage: string, work: () => Promise<void>): Promise<void> {
		return this.openDialog(container, 'block', work, blockMessage);
	}

	// ── Prebuilt dialog openers ──────────────────────────────────────────────

	/**
	 * Shows the loading-timeout retry dialog with the standard message.
	 *
	 * @param container - The ViewContainerRef to attach the dialog to.
	 */
	public showLoadingTimeout(container: ViewContainerRef): void {
		this.openDialog(container, 'retry', RETRY_DIALOG_MSG);
	}

	/**
	 * Shows the session-expired retry dialog. Calling window.location.reload()
	 * via the retry button redirects the user back to the login page.
	 *
	 * @param container - The ViewContainerRef to attach the dialog to.
	 */
	public showSessionExpired(container: ViewContainerRef): void {
		this.openDialog(container, 'retry', new SessionExpiredError().message);
	}

	/**
	 * Shows a generic unexpected-error dialog.
	 *
	 * @param container - The ViewContainerRef to attach the dialog to.
	 */
	public showUnexpectedError(container: ViewContainerRef) {
		this.openDialog(container, DIALOG_ERROR, MSG_UNEXPECTED_ERROR);
	}

	/**
	 * Shows a permission-denied error dialog.
	 *
	 * @param container - The ViewContainerRef to attach the dialog to.
	 */
	public showPermissionError(container: ViewContainerRef) {
		this.openDialog(container, DIALOG_ERROR, MSG_PERMISSION_DENIED);
	}

	// ── Permission and error handling ────────────────────────────────────────

	/**
	 * Front-end permission guard. Checks whether the current user owns the
	 * entity (or is an admin) before any database call is attempted, and shows
	 * the permission-denied dialog when the check fails. Lets the caller
	 * short-circuit with `if (!ensurePermission(...)) return;`.
	 *
	 * @param container - The ViewContainerRef to attach the dialog to.
	 * @param openid - The owner ID stored on the entity being modified.
	 * @returns true when the user is permitted, false (dialog shown) otherwise.
	 */
	public ensurePermission(container: ViewContainerRef, openid: string): boolean {
		if (CloudbaseService.checkPermission(openid)) return true;
		this.showPermissionError(container);
		return false;
	}

	/**
	 * Centralised catch-block handler. Shows the permission-denied dialog when the
	 * error signals a permission failure, or the unexpected-error dialog otherwise.
	 * Callers can replace the repeated if/else pattern with a single call.
	 *
	 * @param container - The ViewContainerRef to attach the dialog to.
	 * @param error - The caught error value.
	 */
	public handleError(container: ViewContainerRef, error: unknown): void {
		if (error instanceof SessionExpiredError) {
			this.showSessionExpired(container);
		} else {
			this.showUnexpectedError(container);
		}
	}

	// ── Toast ────────────────────────────────────────────────────────────────

	/**
	 * Shows a PrimeNG toast notification. Suppressed entirely on mobile so no
	 * toast surfaces on phones, where the floating dock leaves no room for them.
	 *
	 * @param severity - Visual style: 'success' | 'info' | 'warn' | 'error'.
	 * @param summary - Short title shown in the toast.
	 * @param detail - Optional longer message shown below the title.
	 */
	public showToast(severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail?: string) {
		if (this.utilities.isMobile()) return;
		this.messageService.add({ severity, summary, detail });
	}

	// ── Private helpers ──────────────────────────────────────────────────────

	/**
	 * Gets the dialog component based on the dialog type.
	 *
	 * @param dialogType - The type of dialog to get.
	 * @returns The dialog component for the given type.
	 * @throws DialogError if the dialog type is not recognised.
	 */
	private getDialogComponent(dialogType: string): Type<any> {
		switch (dialogType) {
			case DIALOG_CONFIRM:
				return ConfirmDialogComponent;
			case DIALOG_ADD:
				return AddDialogComponent;
			case DIALOG_HISTORY:
				return HistoryDialogComponent;
			case SEARCH:
				return SearchDialogComponent;
			case DIALOG_ERROR:
				return ErrorDialogComponent;
			case DIALOG_BLOCK:
				return BlockDialogComponent;
			case DIALOG_INGREDIENT:
				return IngredientDialogComponent;
			case DIALOG_DEBT:
				return AddDebtDialogComponent;
			case DIALOG_LINK:
				return AddLinkDialogComponent;
			case DIALOG_MULTI_LINK:
				return MultiLinkDialogComponent;
			case DIALOG_RETRY:
				return RetryDialogComponent;
			case DIALOG_DELETE_ACCOUNT:
				return DeleteAccountDialogComponent;
			case DIALOG_CATEGORY:
				return CategoryDialogComponent;
			case DIALOG_ADD_ACCOUNT:
				return AddAccountDialogComponent;
			case DIALOG_EDIT_NON_ACCOUNT:
				return EditNonAccountDialogComponent;
			case DIALOG_EDIT_VAULT_CATEGORY:
				return EditVaultCategoryDialogComponent;
			default:
				throw new DialogError(MSG_INVALID_DIALOG_TYPE);
		}
	}
}
