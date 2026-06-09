import { DebtCategoryDef } from '../../../fontend/debt/debt.model';

/** Selectable category tile definitions for the add-debt dialog. */
export const CATEGORY_OPTIONS: DebtCategoryDef[] = [
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
	{
		key: 'home',
		icon: 'home',
		label: 'Mortgage',
		gradient: 'linear-gradient(90deg,#11998e,#38ef7d)'
	}
];
