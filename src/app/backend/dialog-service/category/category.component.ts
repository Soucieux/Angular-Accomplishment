import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import {
	PORTAL_CATEGORY_DIALOG_LABEL_CANCEL,
	PORTAL_CATEGORY_DIALOG_LABEL_DELETE,
	PORTAL_CATEGORY_DIALOG_LABEL_NAME,
	PORTAL_CATEGORY_DIALOG_LABEL_SAVE,
	PORTAL_CATEGORY_DIALOG_PLACEHOLDER_NAME,
	PORTAL_CATEGORY_DIALOG_TITLE_ADD,
	PORTAL_CATEGORY_DIALOG_TITLE_EDIT
} from '../../../common/app.constant';
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
	protected readonly PORTAL_CATEGORY_DIALOG_LABEL_NAME = PORTAL_CATEGORY_DIALOG_LABEL_NAME;
	protected readonly PORTAL_CATEGORY_DIALOG_PLACEHOLDER_NAME = PORTAL_CATEGORY_DIALOG_PLACEHOLDER_NAME;
	protected readonly PORTAL_CATEGORY_DIALOG_LABEL_CANCEL = PORTAL_CATEGORY_DIALOG_LABEL_CANCEL;
	protected readonly PORTAL_CATEGORY_DIALOG_LABEL_SAVE = PORTAL_CATEGORY_DIALOG_LABEL_SAVE;
	protected readonly PORTAL_CATEGORY_DIALOG_LABEL_DELETE = PORTAL_CATEGORY_DIALOG_LABEL_DELETE;

	protected isEditMode = false;
	protected visible = false;
	protected name = '';
	private submitCallback?: (data: NewCategoryData) => void;
	private deleteCallback?: () => void;

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
	 */
	public openDialog(
		submitCallback: (data: NewCategoryData) => void,
		options: { prefillData: Partial<NewCategoryData> | null; onDelete?: () => void }
	): void {
		this.submitCallback = submitCallback;
		this.deleteCallback = options.onDelete;
		this.isEditMode = options.prefillData !== null;
		this.name = options.prefillData?.name ?? '';
		this.visible = true;
	}

	/**
	 * Validates the form, closes the dialog, then invokes the submit callback
	 * with the collected category name.
	 */
	protected onSubmit(): void {
		if (!this.isValid) return;
		this.onDialogClosed();
		this.submitCallback?.({ name: this.name.trim() });
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
