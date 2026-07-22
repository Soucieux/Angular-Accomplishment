import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import {
	DIALOG_BTN_CANCEL,
	DIALOG_BTN_DELETE,
	DIALOG_BTN_SAVE,
	LABEL_NAME,
	PORTAL_CATEGORY_DIALOG_PLACEHOLDER_NAME,
	PORTAL_CATEGORY_DIALOG_TITLE_ADD,
	PORTAL_CATEGORY_DIALOG_TITLE_EDIT
} from '../../../common/locale/locale-strings';
import { NewCategoryData } from '../../../fontend/portal/portal.model';

@Component({
	selector: 'category-dialog',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [DialogModule, FormsModule],
	templateUrl: './category.component.html',
	styleUrl: './category.component.scss'
})
export class CategoryDialogComponent {
	@Output() closed$ = new EventEmitter<void>();

	protected readonly PORTAL_CATEGORY_DIALOG_TITLE_ADD = PORTAL_CATEGORY_DIALOG_TITLE_ADD;
	protected readonly PORTAL_CATEGORY_DIALOG_TITLE_EDIT = PORTAL_CATEGORY_DIALOG_TITLE_EDIT;
	protected readonly LABEL_NAME = LABEL_NAME;
	protected readonly PORTAL_CATEGORY_DIALOG_PLACEHOLDER_NAME = PORTAL_CATEGORY_DIALOG_PLACEHOLDER_NAME;
	protected readonly DIALOG_BTN_CANCEL = DIALOG_BTN_CANCEL;
	protected readonly DIALOG_BTN_SAVE = DIALOG_BTN_SAVE;
	protected readonly DIALOG_BTN_DELETE = DIALOG_BTN_DELETE;

	protected isEditMode = false;
	protected visible = false;
	protected name = '';
	protected editTitle = PORTAL_CATEGORY_DIALOG_TITLE_EDIT;
	private submitCallback?: (data: NewCategoryData) => void | Promise<void>;
	protected deleteCallback?: () => void;

	/**
	 * Returns true when the name field contains at least one non-whitespace character.
	 *
	 * @returns Whether the form is in a submittable state.
	 */
	protected get isValid(): boolean {
		return this.name.trim().length > 0;
	}

	/**
	 * Opens the dialog in add mode (null prefill) or edit mode (object prefill).
	 * Stores the submit callback and optional delete callback.
	 *
	 * @param submitCallback - The callback invoked with the validated form data on submit.
	 * @param options - Configuration object for the dialog session.
	 * @param options.prefillData - Prefill values for edit mode, or null for add mode.
	 * @param options.onDelete - Optional callback invoked when the user triggers deletion.
	 * @param options.editTitle - Optional edit-mode title override for non-category reuse of this
	 * dialog (e.g. renaming a vault node); defaults to the category edit title.
	 */
	public openDialog(
		submitCallback: (data: NewCategoryData) => void | Promise<void>,
		options: {
			prefillData: Partial<NewCategoryData> | null;
			onDelete?: () => void;
			editTitle?: string;
		}
	): void {
		this.submitCallback = submitCallback;
		this.deleteCallback = options.onDelete;
		this.isEditMode = options.prefillData !== null;
		this.name = options.prefillData?.name ?? '';
		this.editTitle = options.editTitle ?? PORTAL_CATEGORY_DIALOG_TITLE_EDIT;
		this.visible = true;
	}

	/**
	 * Validates the form, invokes the submit callback with the collected category name,
	 * then closes the dialog.
	 */
	protected async onSubmit(): Promise<void> {
		if (!this.isValid) return;
		/* Await the caller's work so the dialog stays open under the blocking overlay and both
		   close together when the save settles (consistent with the undo flow). */
		await this.submitCallback?.({ name: this.name.trim() });
		this.onDialogClosed();
	}

	/**
	 * Closes the dialog first so it is dismissed before the portal opens the
	 * confirm dialog, then invokes the delete callback.
	 */
	protected onDeleteRequested(): void {
		this.onDialogClosed();
		this.deleteCallback?.();
	}

	/**
	 * Closes the dialog and emits the closed event so DialogService can
	 * destroy the component and remove it from the open-dialogs map.
	 */
	protected onDialogClosed(): void {
		this.visible = false;
		this.closed$.emit();
	}
}
