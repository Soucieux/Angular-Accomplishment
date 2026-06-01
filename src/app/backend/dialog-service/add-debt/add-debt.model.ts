/** Submitted form data returned by the add-debt dialog to its caller. */
export interface NewDebtData {
	name: string;
	amount: number;
	dueDate: string;
	isPermanent: boolean;
	category: string;
	currency: string;
}

/** Display definition for a selectable category tile in the add-debt dialog. */
export interface DebtCategoryDef {
	key: string;
	icon: string;
	label: string;
	grad: string;
}
