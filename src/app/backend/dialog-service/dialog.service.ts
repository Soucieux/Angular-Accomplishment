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
	DIALOG_BLOCK,
	DIALOG_CATEGORY,
	DIALOG_CONFIRM,
	DIALOG_DEBT,
	DIALOG_DELETE_ACCOUNT,
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
import { AddDebtDialogComponent } from './add-debt/add-debt.component';
import { NewDebtData } from '../../fontend/debt/debt.model';
import { AddLinkDialogComponent } from './add-link/add-link.component';
import { MultiLinkDialogComponent } from './multi-link/multi-link.component';
import { CategoryDialogComponent } from './category/category.component';
import { NewCategoryData, NewLinkData } from '../../fontend/portal/portal.model';
import { DeleteAccountDialogComponent } from './delete-account/delete-account.component';
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

	constructor(private messageService: MessageService) {}

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
		data: any[]
	): void;

	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'add',
		submitCallback: (movie: MovieItemVO) => void,
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
		submitCallback: (data: NewDebtData) => void,
		prefillData: Partial<NewDebtData> | null
	): void;

	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'link',
		submitCallback: (data: NewLinkData) => void,
		prefillData: Partial<NewLinkData> | null
	): void;

	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'multi-link',
		submitCallback: (links: NewLinkData[]) => void,
		categories: string[]
	): void;

	public openDialog(dialogContainerRef: ViewContainerRef, dialogType: 'retry', message: string): void;

	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'delete-account',
		submitCallback: (password: string) => Promise<void>
	): void;

	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'category',
		submitCallback: (data: NewCategoryData) => void,
		options: { prefillData: Partial<NewCategoryData> | null; onDelete?: () => void }
	): void;

	/**
	 * Opens a dialog.
	 *
	 * @param dialogContainerRef - The container where dialogs should be attached.
	 * @param dialogType - The type of dialog to open.
	 * @param dataOrCallback1 - First callback to call or any data to pass.
	 * @param dataOrCallback2 - Second callback to call or any data to pass.
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
			if (this.stackableDialogTypes.has(dialogType)) return;
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
				dialogComponentRef.instance.openDialog(dataOrCallback1);
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
		if (Utilities.checkPermission(openid)) return true;
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

	/**
	 * Shows a PrimeNG toast notification.
	 *
	 * @param severity - Visual style: 'success' | 'info' | 'warn' | 'error'.
	 * @param summary - Short title shown in the toast.
	 * @param detail - Optional longer message shown below the title.
	 */
	public showToast(severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail?: string) {
		this.messageService.add({ severity, summary, detail });
	}

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
			default:
				throw new DialogError(MSG_INVALID_DIALOG_TYPE);
		}
	}

	/**
	 * Shows a permission-denied error dialog.
	 *
	 * @param container - The ViewContainerRef to attach the dialog to.
	 */
	private showPermissionError(container: ViewContainerRef) {
		this.openDialog(container, DIALOG_ERROR, MSG_PERMISSION_DENIED);
	}
}
