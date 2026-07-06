import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { VAULT_NODE_PHONE } from '../../../common/constants';
import {
	DIALOG_BTN_CANCEL,
	DIALOG_BTN_SAVE,
	DIALOG_BTN_DELETE,
	VAULT_EDIT_NON_ACCOUNT_TITLE,
	VAULT_DIALOG_BACKUPS_LABEL,
	VAULT_DIALOG_BACKUPS_HINT,
	VAULT_DIALOG_BACKUP_PLACEHOLDER,
	VAULT_DIALOG_ADD_BACKUP,
	VAULT_FILTER_EMAIL,
	VAULT_FILTER_PHONE
} from '../../../common/locale/locale-strings';
import {
	EditNonAccountData,
	VaultBackupRow,
	VaultConnectionInput,
	VAULT_BACKUP_CONNECTION_TYPES
} from '../../../fontend/vault/vault.model';
import { VaultNodeNameFieldComponent } from '../vault-node-name-field/vault-node-name-field.component';
import { VaultConnectionRowsComponent } from '../vault-connection-rows/vault-connection-rows.component';

/**
 * Dialog for editing a non-account vault node: its name, and the backup email/phone links it owns.
 * Built from the same vault-node-name-field / vault-connection-rows components as the add-account
 * dialog's non-account step, so the two read as the same pattern. Replaces the generic category
 * dialog's reuse for this call site — that dialog stays generic and is still used for portal category
 * editing and elsewhere.
 */
@Component({
	selector: 'edit-non-account-dialog',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [DialogModule, VaultNodeNameFieldComponent, VaultConnectionRowsComponent],
	templateUrl: './edit-non-account.component.html',
	styleUrl: './edit-non-account.component.scss'
})
export class EditNonAccountDialogComponent {
	@Output() closed$ = new EventEmitter<void>();

	protected readonly VAULT_EDIT_NON_ACCOUNT_TITLE = VAULT_EDIT_NON_ACCOUNT_TITLE;
	protected readonly VAULT_DIALOG_BACKUPS_LABEL = VAULT_DIALOG_BACKUPS_LABEL;
	protected readonly VAULT_DIALOG_BACKUPS_HINT = VAULT_DIALOG_BACKUPS_HINT;
	protected readonly VAULT_DIALOG_BACKUP_PLACEHOLDER = VAULT_DIALOG_BACKUP_PLACEHOLDER;
	protected readonly VAULT_DIALOG_ADD_BACKUP = VAULT_DIALOG_ADD_BACKUP;
	protected readonly DIALOG_BTN_CANCEL = DIALOG_BTN_CANCEL;
	protected readonly DIALOG_BTN_SAVE = DIALOG_BTN_SAVE;
	protected readonly DIALOG_BTN_DELETE = DIALOG_BTN_DELETE;
	/** Backup type options restricted to email/phone — a note has no "backup". */
	protected readonly backupTypeOptions = VAULT_BACKUP_CONNECTION_TYPES.map((entry) => ({
		value: entry.value,
		label: entry.value === VAULT_NODE_PHONE ? VAULT_FILTER_PHONE : VAULT_FILTER_EMAIL,
		icon: entry.icon
	}));

	protected visible = false;
	protected name = '';
	/** The node's fixed type icon, shown read-only next to the name — this dialog only renames, it never changes an existing node's type. */
	protected nodeIcon = '';
	/** Backups already saved on this node, shown as removable rows; entries the user removes move to {@link removedBackupEdgeKeys}. */
	protected existingBackups: VaultBackupRow[] = [];
	/** Newly typed backup rows not yet saved. */
	protected addedBackups: VaultConnectionInput[] = [];
	private removedBackupEdgeKeys: string[] = [];
	private submitCallback?: (data: EditNonAccountData) => void;
	protected deleteCallback?: () => void;

	// ── Dialog lifecycle ─────────────────────────────────────────────────────

	/**
	 * Opens the dialog prefilled with the node's current name, its fixed type icon, and the backup
	 * links it already owns.
	 *
	 * @param submitCallback - The callback invoked with the collected form data on submit.
	 * @param data - The node's current name, its display icon, its existing backup rows, and an
	 * optional delete callback.
	 */
	public openDialog(
		submitCallback: (data: EditNonAccountData) => void,
		data: { name: string; icon: string; backups: VaultBackupRow[]; onDelete?: () => void }
	): void {
		this.submitCallback = submitCallback;
		this.deleteCallback = data.onDelete;
		this.name = data.name;
		this.nodeIcon = data.icon;
		this.existingBackups = data.backups;
		this.addedBackups = [];
		this.removedBackupEdgeKeys = [];
		this.visible = true;
	}

	/**
	 * Closes the dialog and emits the closed event so DialogService can destroy the component and
	 * remove it from the open-dialogs map.
	 */
	protected onDialogClosed(): void {
		this.visible = false;
		this.closed$.emit();
	}

	// ── User action handlers ─────────────────────────────────────────────────

	/**
	 * Removes an already-saved backup row from the visible list and queues its edge for deletion on submit.
	 *
	 * @param edgeKey - The key of the backup edge to remove.
	 */
	protected removeExistingBackup(edgeKey: string): void {
		this.existingBackups = this.existingBackups.filter((backup) => backup.edgeKey !== edgeKey);
		this.removedBackupEdgeKeys = [...this.removedBackupEdgeKeys, edgeKey];
	}

	/**
	 * Validates the form, closes the dialog, then invokes the submit callback with the trimmed name and
	 * any added/removed backup links.
	 */
	protected onSubmit(): void {
		if (!this.isValid) return;
		const addedBackups = this.addedBackups.filter((backup) => backup.value.trim().length > 0);
		const removedBackupEdgeKeys = this.removedBackupEdgeKeys;
		this.onDialogClosed();
		this.submitCallback?.({ name: this.name.trim(), addedBackups, removedBackupEdgeKeys });
	}

	/**
	 * Closes the dialog first so it is dismissed before the caller opens its own confirm dialog, then
	 * invokes the delete callback.
	 */
	protected onDeleteRequested(): void {
		this.onDialogClosed();
		this.deleteCallback?.();
	}

	// ── Template helpers ──────────────────────────────────────────────────────

	/**
	 * Returns true when the name field contains at least one non-whitespace character.
	 *
	 * @returns Whether the form is in a submittable state.
	 */
	protected get isValid(): boolean {
		return this.name.trim().length > 0;
	}
}
