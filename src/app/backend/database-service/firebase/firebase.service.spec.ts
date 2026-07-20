import { DatabaseService } from '../database.service';
import { FirebaseService } from './firebase.service';
import { ACTIVITY_INVALID_TABLE_TEXT } from '../../../common/locale/locale-strings';
import {
	ACTIVITY_SOURCE_DEBT,
	ACTIVITY_SOURCE_DEFAULT,
	ACTIVITY_SOURCE_LINK,
	ACTIVITY_SOURCE_RECIPE,
	ACTIVITY_SOURCE_REMINDER,
	ACTIVITY_SOURCE_RESONANCE,
	ACTIVITY_TYPE_CATEGORY_DELETED,
	ACTIVITY_TYPE_PAYMENT_REMOVED,
	ACTIVITY_TYPE_RESET,
	DATABASE_DEBT_SONATA,
	DATABASE_QUOTES,
	DATABASE_RECIPES,
	DATABASE_REMINDER,
	DATABASE_USEFUL_LINKS,
	DEBT_VALUE_KEY_DEBT,
	DEBT_VALUE_KEY_PAID,
	DEBT_VALUE_KEY_PAYMENTS,
	HISTORY_STATUS_DELETED,
	STATS_FIELD_TOTAL_RECIPES,
	USEFUL_LINK_TYPE_CATEGORY
} from '../../../common/constants';

/**
 * FirebaseService needs live Firebase providers (Storage, Database) that require an emulator to
 * construct, so RTDB-touching methods (updateStatCount, streak, the actual writes) are not unit
 * tested here. The pure mapping and field-building logic is exercised on a prototype instance
 * created without running the constructor — good enough to lock the domain rules the plan called out.
 */
describe('FirebaseService', () => {
	// Bypass the constructor: getRecentActivitySubtitle and the debt field builders use no instance
	// state beyond the collaborators we stub, so an uninitialized prototype instance is sufficient.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const makeService = (): any => Object.create(FirebaseService.prototype);

	it('extends DatabaseService', () => {
		expect(FirebaseService.prototype instanceof DatabaseService).toBeTrue();
	});

	describe('getRecentActivitySubtitle', () => {
		it('maps quotes to the author subtitle', () => {
			const result = makeService().getRecentActivitySubtitle(DATABASE_QUOTES, { author: 'Seneca' });
			expect(result).toEqual({ source: ACTIVITY_SOURCE_RESONANCE, author: 'Seneca' });
		});

		it('maps debt to the name subtitle', () => {
			const result = makeService().getRecentActivitySubtitle(DATABASE_DEBT_SONATA, { name: 'Car loan' });
			expect(result).toEqual({ source: ACTIVITY_SOURCE_DEBT, name: 'Car loan' });
		});

		it('maps reminder to the text subtitle', () => {
			const result = makeService().getRecentActivitySubtitle(DATABASE_REMINDER, { text: 'Pay rent' });
			expect(result).toEqual({ source: ACTIVITY_SOURCE_REMINDER, text: 'Pay rent' });
		});

		it('maps recipes to the name subtitle', () => {
			const result = makeService().getRecentActivitySubtitle(DATABASE_RECIPES, { name: 'Ramen' });
			expect(result).toEqual({ source: ACTIVITY_SOURCE_RECIPE, name: 'Ramen' });
		});

		it('maps a category record in the links collection to its name', () => {
			const result = makeService().getRecentActivitySubtitle(DATABASE_USEFUL_LINKS, {
				type: USEFUL_LINK_TYPE_CATEGORY,
				name: 'Work'
			});
			expect(result).toEqual({ source: ACTIVITY_SOURCE_LINK, domain: 'Work' });
		});

		it('maps a deletion record in the links collection to its previous domain', () => {
			const result = makeService().getRecentActivitySubtitle(DATABASE_USEFUL_LINKS, {
				type: HISTORY_STATUS_DELETED,
				domain: 'example.com'
			});
			expect(result).toEqual({ source: ACTIVITY_SOURCE_LINK, domain: 'example.com' });
		});

		it('falls back to the default source for an unknown table', () => {
			const result = makeService().getRecentActivitySubtitle('nope', {});
			expect(result).toEqual({ source: ACTIVITY_SOURCE_DEFAULT, text: ACTIVITY_INVALID_TABLE_TEXT });
		});

		it('coerces missing subtitle fields to an empty string', () => {
			const result = makeService().getRecentActivitySubtitle(DATABASE_QUOTES, {});
			expect(result).toEqual({ source: ACTIVITY_SOURCE_RESONANCE, author: '' });
		});
	});

	describe('removeSingleHistoryFromDebt', () => {
		it('nulls the payment at the given index and writes the recomputed debt', async () => {
			const service = makeService();
			const spy = spyOn(service, 'updateTableExistingFields').and.returnValue(Promise.resolve());

			await service.removeSingleHistoryFromDebt('debt-1', 2, 50, 'Car loan');

			expect(spy).toHaveBeenCalledWith(DATABASE_DEBT_SONATA, {
				entryKey: 'debt-1',
				fields: {
					[`${DEBT_VALUE_KEY_PAYMENTS}/2`]: null,
					[DEBT_VALUE_KEY_DEBT]: 50
				},
				source: ACTIVITY_SOURCE_DEBT,
				type: ACTIVITY_TYPE_PAYMENT_REMOVED,
				name: 'Car loan'
			});
		});
	});

	describe('resetDebtRecord', () => {
		it('restores the original amount and clears all payment history', async () => {
			const service = makeService();
			const spy = spyOn(service, 'updateTableExistingFields').and.returnValue(Promise.resolve());

			await service.resetDebtRecord('debt-1', 1000, false, 'Car loan');

			expect(spy).toHaveBeenCalledWith(DATABASE_DEBT_SONATA, {
				entryKey: 'debt-1',
				fields: {
					[DEBT_VALUE_KEY_DEBT]: 1000,
					[DEBT_VALUE_KEY_PAID]: false,
					[DEBT_VALUE_KEY_PAYMENTS]: null
				},
				source: ACTIVITY_SOURCE_DEBT,
				type: ACTIVITY_TYPE_RESET,
				name: 'Car loan'
			});
		});
	});

	describe('removeRecipe', () => {
		it('deletes the recipe, logs the deletion, and decrements the recipe count', async () => {
			const service = makeService();
			// decrementOwnStatCount compares the owner against the signed-in uid, so both are stubbed.
			service.firebaseAuth = { currentUser: { uid: 'owner-1' } };
			const removeSpy = spyOn(service, 'removeSingleItemFromDatabase').and.returnValue(Promise.resolve());
			const logSpy = spyOn(service, 'appendToActivityLog').and.returnValue(Promise.resolve());
			const countSpy = spyOn(service, 'updateStatCount').and.returnValue(Promise.resolve());
			const userCountSpy = spyOn(service, 'updateUserStatCount').and.returnValue(Promise.resolve());

			await service.removeRecipe('recipe-1', 'Ramen', 'owner-1');

			expect(removeSpy).toHaveBeenCalledWith(DATABASE_RECIPES, 'recipe-1');
			expect(logSpy).toHaveBeenCalledWith({
				source: ACTIVITY_SOURCE_RECIPE,
				type: HISTORY_STATUS_DELETED,
				name: 'Ramen'
			});
			expect(countSpy).toHaveBeenCalledWith(STATS_FIELD_TOTAL_RECIPES, -1);
			expect(userCountSpy).toHaveBeenCalledWith(STATS_FIELD_TOTAL_RECIPES, -1);
		});
	});

	describe('removeLinkCategory', () => {
		it('deletes the category and logs it without changing any count', async () => {
			const service = makeService();
			const removeSpy = spyOn(service, 'removeSingleItemFromDatabase').and.returnValue(Promise.resolve());
			const logSpy = spyOn(service, 'appendToActivityLog').and.returnValue(Promise.resolve());
			const countSpy = spyOn(service, 'updateStatCount').and.returnValue(Promise.resolve());

			await service.removeLinkCategory('cat-1', 'Work');

			expect(removeSpy).toHaveBeenCalledWith(DATABASE_USEFUL_LINKS, 'cat-1');
			expect(logSpy).toHaveBeenCalledWith({
				source: ACTIVITY_SOURCE_LINK,
				domain: 'Work',
				type: ACTIVITY_TYPE_CATEGORY_DELETED
			});
			expect(countSpy).not.toHaveBeenCalled();
		});
	});
});
