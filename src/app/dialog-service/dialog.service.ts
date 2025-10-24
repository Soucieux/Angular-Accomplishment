import { ComponentRef, Injectable, Type, ViewContainerRef } from '@angular/core';
import { DeleteDialogComponent } from './delete-dialog/delete.dialog.component';
import { AddDialogComponent } from './add-dialog/add.dialog.component';
import { LOG } from '../log';
import { MovieItemVO } from '../entertainment/movie.item.vo';
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
			case 'delete':
				return DeleteDialogComponent;
			case 'add':
				return AddDialogComponent;
			default:
				throw new Error('Invalid dialog type');
		}
	}

	// Overload methods to call correct dialog component
	openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'delete',
		message: string,
		acceptCallback: () => void
	): void;

	openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'add',
		message: string,
		submitCallback: (movie: MovieItemVO) => void,
		searchCallback?: (movie: MovieItemVO) => void
	): void;

	/**
	 * Open a dialog
	 *
	 * @param dialogContainerRef - The container where dialogs should be attached
	 * @param dialogType - The type of dialog to open
	 * @param message - The message to display in the dialog
	 * @param callback1 - The callback to call
	 */
	openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: string,
		message: string,
		callback1: any,
		callback2?: any
	): void {
		if (!dialogContainerRef) {
			const error = new Error('Dialog container not found');
			LOG.error(this.className, error.message);
			throw error;
		}

		if (this.openedDialogs.has(dialogType)) {
			const error = new Error('Dialog already opened');
			LOG.error(this.className, error.message);
			throw error;
		}

		try {
			// Create dialog component
			const dialogComponent = this.getDialogComponent(dialogType);
			const dialogComponentRef = dialogContainerRef.createComponent(dialogComponent);

			// Open up corresponding dialog and pass callbacks
			if (dialogType === 'delete') {
				dialogComponentRef.instance.openDialog(message, callback1);
			} else if (dialogType === 'add') {
				dialogComponentRef.instance.openDialog(callback1, callback2);
			}

			// Subscribe to dialog closed event
			dialogComponentRef.instance.closed$.subscribe(() => {
				this.openedDialogs.delete(dialogType);
				dialogComponentRef.destroy();
			});

			// Record dialog component in opened dialogs map
			this.openedDialogs.set(dialogType, dialogComponentRef);
		} catch (error) {
			LOG.error(this.className, (error as Error).message);
			throw error;
		}
	}
}
