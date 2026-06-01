import { ComponentRef, Injectable, Type, ViewContainerRef } from '@angular/core';
import { ConfirmDialogComponent } from './confirm/confirm.component';
import { AddDialogComponent } from './add/add.component';
import { LOG } from '../../common/app.logs';
import { MovieItemVO } from '../../fontend/entertainment/movieItem.vo';
import { HistoryDialogComponent } from './history/history.component';
import { SearchDialogComponent } from './search/search.component';
import { Observable, take } from 'rxjs';
import { ErrorDialogComponent } from './error/error.component';
import { BlockDialogComponent } from './block/block.component';
import {
	DIALOG_ADD,
	DIALOG_BLOCK,
	DIALOG_CONFIRM,
	DIALOG_DEBT,
	DIALOG_ERROR,
	DIALOG_HISTORY,
	DIALOG_RECIPE_TYPE,
	ERROR_PERMISSION_DENIED,
	MSG_PERMISSION_DENIED,
	MSG_UNEXPECTED_ERROR,
	SEARCH
} from '../../common/app.constant';
import { MessageService } from 'primeng/api';
import { RecipeTypeDialogComponent } from './recipe-type/recipe-type.component';
import { IngredientType, TypeTab } from '../../fontend/recipe/recipe.model';
import { Utilities } from '../../common/app.utilities';
import { AddDebtDialogComponent } from './debt/debt.component';
import { NewDebtData } from '../../fontend/debt/debt.model';
@Injectable({
	providedIn: 'root'
})
export class DialogService {
	private readonly className = 'DialogService';
	private openedDialogs = new Map<string, ComponentRef<any>>();

	constructor(private messageService: MessageService) {}

	/**
	 * Get the dialog component based on the dialog type
	 *
	 * @param dialogType - The type of dialog to get
	 * @returns The dialog component
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
			case DIALOG_RECIPE_TYPE:
				return RecipeTypeDialogComponent;
			case DIALOG_DEBT:
				return AddDebtDialogComponent;
			default:
				throw new Error('Invalid dialog type');
		}
	}

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
		dialogType: 'recipe-type',
		applyCallback: (newIds: Set<IngredientType>) => void,
		data: { masterTabs: TypeTab[]; enabledTypeIds: Set<IngredientType> }
	): void;

	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'debt',
		submitCallback: (data: NewDebtData) => void,
		prefillData: Partial<NewDebtData> | null
	): void;

	/**
	 * Open a dialog
	 *
	 * @param dialogContainerRef - The container where dialogs should be attached
	 * @param dialogType - The type of dialog to open
	 * @param dataOrCallback1 - First callback to call or any data to pass
	 * @param dataOrCallback2 - Second callback to call or any data to pass
	 */
	public openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: string,
		dataOrCallback1: any,
		dataOrCallback2?: any
	): void | Promise<void> {
		// Guard: a null container means the component host is not initialized yet
		if (!dialogContainerRef) {
			const error = new Error('Dialog container not found');
			LOG.error(this.className, error.message);
			throw error;
		}

		// Block and error dialogs are allowed to stack (multiple can be open at once);
		// all other dialog types enforce a single-instance rule to prevent duplicates.
		if (this.openedDialogs.has(dialogType)) {
			if (dialogType === DIALOG_ERROR || dialogType === DIALOG_BLOCK) return;
			const error = new Error('Dialog already opened');
			LOG.error(this.className, error.message);
			throw error;
		}

		try {
			const dialogComponent = this.getDialogComponent(dialogType);
			// Dynamically instantiate the dialog component inside the provided container,
			// giving it access to the container's injector and change detection.
			const dialogComponentRef = dialogContainerRef.createComponent(dialogComponent);

			let blockPromise: Promise<void> | undefined;

			// SEARCH and error dialogs only need one callback/data argument;
			// block dialogs return a promise so callers can await task completion;
			// all other dialogs receive two arguments (prefill/callback or two callbacks).
			if (dialogType === SEARCH || dialogType === DIALOG_ERROR) {
				dialogComponentRef.instance.openDialog(dataOrCallback1);
			} else if (dialogType === DIALOG_BLOCK) {
				blockPromise = dialogComponentRef.instance.openDialog(dataOrCallback1, dataOrCallback2);
			} else {
				dialogComponentRef.instance.openDialog(dataOrCallback1, dataOrCallback2);
			}

			// When the dialog emits its closed event, remove it from the tracking map
			// and destroy the component to prevent memory leaks.
			dialogComponentRef.instance.closed$.pipe(take(1)).subscribe(() => {
				this.openedDialogs.delete(dialogType);
				dialogComponentRef.destroy();
			});

			this.openedDialogs.set(dialogType, dialogComponentRef);

			// Return the promise for block dialogs so callers can await the task
			// and handle any errors that occur during execution.
			if (blockPromise) {
				return blockPromise;
			}
		} catch (error) {
			LOG.error(this.className, (error as Error).message);
			throw error;
		}
	}

	/**
	 * Show a permission-denied error dialog.
	 *
	 * @param container - The ViewContainerRef to attach the dialog to.
	 */
	public showPermissionError(container: ViewContainerRef) {
		this.openDialog(container, DIALOG_ERROR, MSG_PERMISSION_DENIED);
	}

	/**
	 * Show a generic unexpected-error dialog.
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
		if (error instanceof Error && error.message === ERROR_PERMISSION_DENIED) {
			this.showPermissionError(container);
		} else {
			this.showUnexpectedError(container);
		}
	}

	/**
	 * Show a PrimeNG toast notification.
	 *
	 * @param severity - Visual style: 'success' | 'info' | 'warn' | 'error'.
	 * @param summary - Short title shown in the toast.
	 * @param detail - Optional longer message shown below the title.
	 */
	public showToast(severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail?: string) {
		this.messageService.add({ severity, summary, detail });
	}
}
