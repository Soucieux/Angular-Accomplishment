import { ComponentRef, Injectable, Type, ViewContainerRef } from '@angular/core';
import { ConfirmDialogComponent } from './confirm/confirm.component';
import { AddDialogComponent } from './add/add.component';
import { LOG } from '../../common/app.logs';
import { MovieItemVO } from '../../common/movieitem.vo';
import { HistoryDialogComponent } from './history/history.component';
import { SearchDialogComponent } from './search/search.component';
import { Observable } from 'rxjs';
import { ErrorDialogComponent } from './error/error.component';
import { BlockDialogComponent } from './block/block.component';
import { SEARCH } from '../../common/app.constant';
@Injectable({
	providedIn: 'root'
})
export class DialogService {
	private readonly className = 'DialogService';
	private openedDialogs = new Map<string, ComponentRef<any>>();

	constructor() {}

	/**
	 * Get the dialog component based on the dialog type
	 *
	 * @param dialogType - The type of dialog to get
	 * @returns The dialog component
	 */
	getDialogComponent(dialogType: string): Type<any> {
		switch (dialogType) {
			case 'confirm':
				return ConfirmDialogComponent;
			case 'add':
				return AddDialogComponent;
			case 'history':
				return HistoryDialogComponent;
			case SEARCH:
				return SearchDialogComponent;
			case 'error':
				return ErrorDialogComponent;
			case 'block':
				return BlockDialogComponent;
			default:
				throw new Error('Invalid dialog type');
		}
	}

	// Overload methods to call correct dialog component
	openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'block',
		task: () => Promise<void>,
		message: string
	): Promise<void>;

	openDialog(dialogContainerRef: ViewContainerRef, dialogType: 'search', acceptCallback: () => void): void;

	openDialog(dialogContainerRef: ViewContainerRef, dialogType: 'error', errorMessage: string): void;

	openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'confirm',
		acceptCallback: () => void,
		data: any[]
	): void;

	openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'add',
		submitCallback: (movie: MovieItemVO) => void,
		searchCallback: (movie: MovieItemVO) => void
	): void;

	openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'history',
		revertDataCallback: (movie: MovieItemVO) => void,
		data: Observable<any>
	): void;

	/**
	 * Open a dialog
	 *
	 * @param dialogContainerRef - The container where dialogs should be attached
	 * @param dialogType - The type of dialog to open
	 * @param dataOrCallback1 - First callback to call or any data to pass
	 * @param dataOrCallback2 - Second callback to call or any data to pass
	 */
	openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: string,
		dataOrCallback1: any,
		dataOrCallback2?: any
	): any {
		if (!dialogContainerRef) {
			const error = new Error('Dialog container not found');
			LOG.error(this.className, error.message);
			throw error;
		}

		if (this.openedDialogs.has(dialogType)) {
			if (dialogType === 'error' || dialogType === 'block') return;
			const error = new Error('Dialog already opened');
			LOG.error(this.className, error.message);
			throw error;
		}

		try {
			const dialogComponent = this.getDialogComponent(dialogType);
			const dialogComponentRef = dialogContainerRef.createComponent(dialogComponent);

			let blockPromise: Promise<void> | undefined;

			// Open up corresponding dialog and pass callbacks
			if (dialogType === SEARCH || dialogType === 'error') {
				dialogComponentRef.instance.openDialog(dataOrCallback1);
			} else if (dialogType === 'block') {
				blockPromise = dialogComponentRef.instance.openDialog(dataOrCallback1, dataOrCallback2);
			} else {
				dialogComponentRef.instance.openDialog(dataOrCallback1, dataOrCallback2);
			}

			dialogComponentRef.instance.closed$.subscribe(() => {
				this.openedDialogs.delete(dialogType);
				dialogComponentRef.destroy();
			});

			this.openedDialogs.set(dialogType, dialogComponentRef);

			// Return the promise for block dialogs so callers can await errors
			if (blockPromise) {
				return blockPromise;
			}
		} catch (error) {
			LOG.error(this.className, (error as Error).message);
			throw error;
		}
	}

	showPermissionError(container: ViewContainerRef) {
		this.openDialog(container, 'error', 'User does not have permission');
	}

	showUnexpectedError(container: ViewContainerRef) {
		this.openDialog(container, 'error', 'Unexpected error occurred');
	}
}
