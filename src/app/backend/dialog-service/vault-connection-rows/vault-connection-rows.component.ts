import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { VAULT_NODE_EMAIL } from '../../../common/constants';
import { VAULT_DIALOG_CONNECTIONS_OPTIONAL } from '../../../common/locale/locale-strings';
import {
	VaultBackupRow,
	VaultConnectionInput,
	VaultNodeType,
	VAULT_CONNECTION_TYPES
} from '../../../fontend/vault/vault.model';

/**
 * Shared connections/backups section: a header with label + hint, a list of rows (already-saved
 * read-only rows plus freely-editable new rows), and an add-row button. Used by the add-account
 * dialog's account-kind connections, its non-account-kind backups, and the edit-non-account dialog's
 * backups — the three read as the same pattern, differing only in wording, type options, and whether
 * any read-only rows exist.
 */
@Component({
	selector: 'vault-connection-rows',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [FormsModule, Select],
	templateUrl: './vault-connection-rows.component.html',
	styleUrl: './vault-connection-rows.component.scss'
})
export class VaultConnectionRowsComponent {
	protected readonly VAULT_DIALOG_CONNECTIONS_OPTIONAL = VAULT_DIALOG_CONNECTIONS_OPTIONAL;

	@Input() sectionLabel = '';
	@Input() sectionHint = '';
	@Input() addButtonLabel = '';
	@Input() rowPlaceholder = '';
	/** Panel style class from the caller's own dialog stylesheet, so the caller's existing `::ng-deep` option-sizing rule still applies. */
	@Input() panelStyleClass = '';
	@Input() typeOptions: { value: VaultNodeType; label: string }[] = [];

	/** Already-saved rows shown read-only (name only, no type/value editing) — empty for a creation flow. */
	@Input() readonlyRows: VaultBackupRow[] = [];
	@Output() removeReadonlyRow = new EventEmitter<string>();

	/** Not-yet-saved rows, fully editable. */
	@Input() editableRows: VaultConnectionInput[] = [];
	@Output() editableRowsChange = new EventEmitter<VaultConnectionInput[]>();

	/** Enforces at least one (possibly blank) editable row, matching the add-account dialog's always-visible first row. */
	@Input() enforceMinOneRow = false;

	// ── User action handlers ─────────────────────────────────────────────────

	/**
	 * Replaces the type of the editable row at the given index, immutably.
	 *
	 * @param index - The index of the row being changed.
	 * @param type - The newly selected connection type.
	 */
	protected onRowTypeChange(index: number, type: VaultNodeType): void {
		this.emitRows(
			this.editableRows.map((row, rowIndex) => (rowIndex === index ? { ...row, type } : row))
		);
	}

	/**
	 * Replaces the value of the editable row at the given index, immutably.
	 *
	 * @param index - The index of the row being changed.
	 * @param value - The newly typed value.
	 */
	protected onRowValueChange(index: number, value: string): void {
		this.emitRows(
			this.editableRows.map((row, rowIndex) => (rowIndex === index ? { ...row, value } : row))
		);
	}

	/**
	 * Appends a blank editable row (defaulting to email).
	 */
	protected addRow(): void {
		this.emitRows([...this.editableRows, { value: '', type: VAULT_NODE_EMAIL }]);
	}

	/**
	 * Removes the editable row at the given index. When {@link enforceMinOneRow} is set and removing
	 * would leave none, a single blank row replaces it instead of leaving the list empty.
	 *
	 * @param index - The index of the row to remove.
	 */
	protected removeRow(index: number): void {
		const remaining = this.editableRows.filter((_, rowIndex) => rowIndex !== index);
		this.emitRows(
			this.enforceMinOneRow && remaining.length === 0
				? [{ value: '', type: VAULT_NODE_EMAIL }]
				: remaining
		);
	}

	// ── Private helpers ───────────────────────────────────────────────────────

	/**
	 * Emits the next editable-rows array to the caller.
	 *
	 * @param rows - The new editable-rows array.
	 */
	private emitRows(rows: VaultConnectionInput[]): void {
		this.editableRowsChange.emit(rows);
	}

	// ── Template helpers ──────────────────────────────────────────────────────

	/**
	 * Gets the Material Symbols icon for a connection type.
	 *
	 * @param type - The connection node type.
	 * @returns The icon ligature name.
	 */
	protected iconForType(type: VaultNodeType): string {
		const match = VAULT_CONNECTION_TYPES.find((entry) => entry.value === type);
		return match ? match.icon : VAULT_CONNECTION_TYPES[0].icon;
	}

	/**
	 * Tracks editable rows by their index so @for re-renders only changed rows.
	 *
	 * @param index - The row index supplied by the @for loop.
	 * @returns The index used as the track key.
	 */
	protected trackByIndex(index: number): number {
		return index;
	}
}
