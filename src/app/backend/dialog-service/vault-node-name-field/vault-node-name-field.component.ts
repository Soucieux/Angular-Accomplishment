import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { VAULT_DIALOG_IDENTIFIER_NAME_LABEL } from '../../../common/locale/locale-strings';
import { VaultNodeType } from '../../../fontend/vault/vault.model';

/**
 * Shared name + type row for a non-account vault node: an editable type dropdown (used when creating
 * a new node) or a read-only type icon badge (used when editing an existing node, whose type never
 * changes), followed by the name input and its duplicate-name error. Used by the add-account dialog's
 * non-account step and the edit-non-account dialog so the two read as the same pattern.
 */
@Component({
	selector: 'vault-node-name-field',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [FormsModule, Select],
	templateUrl: './vault-node-name-field.component.html',
	styleUrl: './vault-node-name-field.component.scss'
})
export class VaultNodeNameFieldComponent {
	protected readonly VAULT_DIALOG_IDENTIFIER_NAME_LABEL = VAULT_DIALOG_IDENTIFIER_NAME_LABEL;

	@Input() name = '';
	@Output() nameChange = new EventEmitter<string>();
	@Input() namePlaceholder = '';
	@Input() isDuplicateName = false;
	@Input() duplicateNameMessage = '';

	/** Whether the type shows as an editable dropdown (creating a node) or a fixed read-only badge (editing one). */
	@Input() typeEditable = false;
	/** Icon shown in the read-only badge when {@link typeEditable} is false. */
	@Input() typeIcon = '';
	@Input() nodeType!: VaultNodeType;
	@Output() nodeTypeChange = new EventEmitter<VaultNodeType>();
	@Input() typeOptions: { value: VaultNodeType; label: string }[] = [];
	/** Panel style class from the caller's own dialog stylesheet, so the caller's existing `::ng-deep` option-sizing rule still applies. */
	@Input() panelStyleClass = '';

	@Output() submit = new EventEmitter<void>();
}
