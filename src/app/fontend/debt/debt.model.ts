/** A single recorded payment entry, tracked in-memory per session. */
export interface PaymentEntry {
	amount: number;
	balance: number;
	timestamp: string;
}

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
	gradient: string;
}

/** Short month names, January-first, for date formatting in the debt view. */
export const MONTH_NAMES_SHORT: string[] = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec'
];

/** Static category definitions used to assign icons, labels, and gradients to debt items. */
export const DEBT_CATEGORY_DEFS: DebtCategoryDef[] = [
	{
		key: 'card',
		icon: 'credit_card',
		label: 'Credit card',
		gradient: 'linear-gradient(90deg,#e91e8c,#f7971e)'
	},
	{
		key: 'person',
		icon: 'handshake',
		label: 'Personal',
		gradient: 'linear-gradient(90deg,#fda085,#f6d365)'
	},
	{
		key: 'shopping',
		icon: 'shopping_bag',
		label: 'Financing',
		gradient: 'linear-gradient(90deg,#8e54e9,#e91e8c)'
	},
	{ key: 'home', icon: 'home', label: 'Mortgage', gradient: 'linear-gradient(90deg,#11998e,#38ef7d)' }
];
