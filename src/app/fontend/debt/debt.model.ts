/** A single recorded payment entry, tracked in-memory per session. */
export interface PaymentEntry {
	amount: number;
	balance: number;
	timestamp: string;
}

/** A debt record as read from the database, with the document key attached. */
export interface DebtItem {
	key: string;
	_openid: string;
	name: string;
	debt: number;
	original: number;
	date: string | null;
	paid: boolean;
	type?: string;
	category?: string;
	currency?: string;
	payments?: Record<number, PaymentEntry>;
}

/** The normalized upcoming-expense shape synced to the statistics document. */
export interface UpcomingExpense {
	type: string;
	name: string;
	date: string;
	debt: number;
	original: number;
	category: string;
}

/** Submitted form data returned by the add-debt dialog to its caller. */
export interface NewDebtData {
	name: string;
	amount: number;
	dueDate: string;
	isPermanent: boolean;
	category: string;
	currency: string;
	isNewCycle: boolean;
}

/** Display definition for a selectable category tile in the add-debt dialog. */
export interface DebtCategoryDef {
	key: string;
	icon: string;
	label: string;
	gradient: string;
}

/**
 * Static category definitions used to assign icons and gradients to debt items.
 * label is user-facing and varies by language — supplied from locale in the component (recipe pattern).
 */
export const DEBT_CATEGORY_DEFS: Omit<DebtCategoryDef, 'label'>[] = [
	{ key: 'card', icon: 'credit_card', gradient: 'linear-gradient(90deg,#e91e8c,#f7971e)' },
	{ key: 'person', icon: 'handshake', gradient: 'linear-gradient(90deg,#fda085,#f6d365)' },
	{ key: 'shopping', icon: 'shopping_bag', gradient: 'linear-gradient(90deg,#8e54e9,#e91e8c)' },
	{ key: 'home', icon: 'home', gradient: 'linear-gradient(90deg,#11998e,#38ef7d)' }
];
