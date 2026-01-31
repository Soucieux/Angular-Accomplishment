import { ComponentRef, Injectable, Type, ViewContainerRef } from '@angular/core';
import { ConfirmDialogComponent } from './confirm/confirm.component';
import { AddDialogComponent } from './add/add.component';
import { LOG } from '../../app.logs';
import { MovieItemVO } from '../../entertainment/entertainment.movieitem.vo';
import { HistoryDialogComponent } from './history/history.component';
import { SearchDialogComponent } from './search/search.component';
import { Observable } from 'rxjs';
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
			case 'search':
				return SearchDialogComponent;
			default:
				throw new Error('Invalid dialog type');
		}
	}

	// Overload methods to call correct dialog component
	openDialog(dialogContainerRef: ViewContainerRef, dialogType: 'search', acceptCallback: () => void): void;

	openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: 'confirm',
		acceptCallback: () => void,
		data: string[],
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
		revertDataCallback: () => void,
		data: Observable<any>
	): void;

	/**
	 * Open a dialog
	 *
	 * @param dialogContainerRef - The container where dialogs should be attached
	 * @param dialogType - The type of dialog to open
	 * @param callback - The callback to call
	 * @param dataOrCallback - Second callback to call or any data to pass
	 */
	openDialog(
		dialogContainerRef: ViewContainerRef,
		dialogType: string,
		callback: any,
		dataOrCallback?: any
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
			if (dialogType === 'search') {
				dialogComponentRef.instance.openDialog(callback);
			} else{
				dialogComponentRef.instance.openDialog(callback, dataOrCallback);
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
