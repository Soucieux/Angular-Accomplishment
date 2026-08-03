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
	FIREBASE_ERROR_ID_TOKEN_EXPIRED,
	HISTORY_STATUS_DELETED,
	STATS_FIELD_TOTAL_RECIPES,
	USEFUL_LINK_TYPE_CATEGORY
} from '../../../common/constants';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { SessionExpiredError } from '../../../common/error/session-expired.error';
import { UnexpectedError } from '../../../common/error/unexpected.error';

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

	const makeRecoveryService = (): any => {
		const service = makeService();
		service.ngZone = { run: (callback: () => void) => callback() };
		service.realtimeStateSubject = new BehaviorSubject<number | null>(0);
		service.watchErrorsSubject = new Subject<unknown>();
		service.writeErrorsSubject = new Subject<unknown>();
		service.freshSnapshotSubject = new Subject<void>();
		service.activeRealtimeListenerCount = 0;
		service.realtimeRecoveryState = {
			generation: null,
			expectedListenerCount: 0,
			eligibleListenerIds: new Set<number>(),
			acknowledgedListenerIds: new Set<number>(),
			nextListenerId: 0
		};
		return service;
	};

	it('extends DatabaseService', () => {
		expect(FirebaseService.prototype instanceof DatabaseService).toBeTrue();
	});

	describe('realtime recovery', () => {
		it('reports fresh state immediately when no realtime listeners are active', () => {
			const service = makeRecoveryService();
			let snapshotCount = 0;
			service.getFreshSnapshot$().subscribe(() => snapshotCount++);

			service.restartRealtimeStreams();

			expect(snapshotCount).toBe(1);
		});

		it('rejects the connection check when no authenticated user exists', async () => {
			const service = makeRecoveryService();
			service.firebaseAuth = { currentUser: null };

			await expectAsync(service.checkConnection()).toBeRejectedWithError(SessionExpiredError);
		});

		it('maps an unavailable live connection to the retryable typed fallback', async () => {
			const service = makeRecoveryService();
			const offlineError = new Error('offline');
			service.firebaseAuth = { currentUser: { uid: 'user-123' } };
			service.getIsDataLayerReady$ = () => throwError(() => offlineError);

			await expectAsync(service.checkConnection()).toBeRejectedWithError(UnexpectedError);
		});

		it('maps a provider-confirmed expired token during the protected read to session expiry', async () => {
			const service = makeRecoveryService();
			service.firebaseAuth = { currentUser: { uid: 'user-123' } };
			service.getIsDataLayerReady$ = () => of(true);
			spyOn(service, 'readAuthenticatedUser').and.rejectWith({
				code: FIREBASE_ERROR_ID_TOKEN_EXPIRED
			});

			await expectAsync(service.checkConnection()).toBeRejectedWithError(SessionExpiredError);
		});

		it('closes and recreates active listeners when realtime streams restart', () => {
			const service = makeRecoveryService();
			service.firebaseAuth = { currentUser: { uid: 'user-123' } };
			const unsubscribe = jasmine.createSpy('unsubscribe');
			service.createValueListener = jasmine
				.createSpy('createValueListener')
				.and.returnValue(unsubscribe);

			service.observeValue({}, (snapshot: any) => snapshot.val()).subscribe();
			service.restartRealtimeStreams();

			expect(service.createValueListener).toHaveBeenCalledTimes(2);
			expect(unsubscribe).toHaveBeenCalledTimes(1);
		});

		it('ignores a late snapshot from the listener generation that was replaced', () => {
			const service = makeRecoveryService();
			const valueCallbacks: Array<(snapshot: any) => void> = [];
			service.createValueListener = (
				_: unknown,
				generation: number,
				valueCallback: (snapshot: any, listenerId: number) => void
			) => {
				const listenerId = service.registerRealtimeListener(generation);
				valueCallbacks.push((snapshot: any) => valueCallback(snapshot, listenerId));
				return () => service.unregisterRealtimeListener(generation, listenerId);
			};
			let freshSnapshotCount = 0;
			service.getFreshSnapshot$().subscribe(() => freshSnapshotCount++);
			service.observeValue({}, (snapshot: any) => snapshot.val()).subscribe();

			service.restartRealtimeStreams();
			valueCallbacks[0]({ val: () => 'stale' });
			expect(freshSnapshotCount).toBe(0);

			valueCallbacks[1]({ val: () => 'fresh' });
			expect(freshSnapshotCount).toBe(1);
		});

		it('waits for every restarted listener before reporting fresh state', () => {
			const service = makeRecoveryService();
			const valueCallbacks: Array<(snapshot: any) => void> = [];
			service.createValueListener = (
				_: unknown,
				generation: number,
				valueCallback: (snapshot: any, listenerId: number) => void
			) => {
				const listenerId = service.registerRealtimeListener(generation);
				valueCallbacks.push((snapshot: any) => valueCallback(snapshot, listenerId));
				return () => service.unregisterRealtimeListener(generation, listenerId);
			};
			let freshSnapshotCount = 0;
			service.getFreshSnapshot$().subscribe(() => freshSnapshotCount++);
			service.observeValue({}, (snapshot: any) => snapshot.val()).subscribe();
			service.observeValue({}, (snapshot: any) => snapshot.val()).subscribe();

			service.restartRealtimeStreams();
			valueCallbacks[2]({ val: () => 'first' });
			expect(freshSnapshotCount).toBe(0);

			valueCallbacks[3]({ val: () => 'second' });
			expect(freshSnapshotCount).toBe(1);
		});

		it('stops active listeners when session state clears', () => {
			const service = makeRecoveryService();
			service.firebaseAuth = { currentUser: { uid: 'user-123' } };
			const unsubscribe = jasmine.createSpy('unsubscribe');
			service.createValueListener = jasmine
				.createSpy('createValueListener')
				.and.returnValue(unsubscribe);

			service.observeValue({}, (snapshot: any) => snapshot.val()).subscribe();
			service.clearSessionState();

			expect(unsubscribe).toHaveBeenCalledTimes(1);
		});

		it('surfaces listener errors and emits fresh snapshots centrally', () => {
			const service = makeRecoveryService();
			service.firebaseAuth = { currentUser: { uid: 'user-123' } };
			let valueCallback: ((snapshot: any) => void) | undefined;
			let errorCallback: ((error: Error) => void) | undefined;
			service.createValueListener = (
				_: unknown,
				generation: number,
				onValueCallback: (snapshot: any, listenerId: number) => void,
				onErrorCallback: (error: Error) => void
			) => {
				const listenerId = service.registerRealtimeListener(generation);
				valueCallback = (snapshot: any) => onValueCallback(snapshot, listenerId);
				errorCallback = onErrorCallback;
				return () => service.unregisterRealtimeListener(generation, listenerId);
			};
			const emittedErrors: unknown[] = [];
			let freshSnapshotCount = 0;
			service.getWatchErrors$().subscribe((error: unknown) => emittedErrors.push(error));
			service.getFreshSnapshot$().subscribe(() => freshSnapshotCount++);
			service.observeValue({}, (snapshot: any) => snapshot.val()).subscribe();

			service.restartRealtimeStreams();
			valueCallback?.({ val: () => ({}) });
			const listenerError = new Error('listener failed');
			errorCallback?.(listenerError);

			expect(freshSnapshotCount).toBe(1);
			expect(emittedErrors).toEqual([listenerError]);
		});

		it('surfaces a synchronous listener initialization failure and retries later', () => {
			const service = makeRecoveryService();
			const emittedErrors: unknown[] = [];
			let consumerError: unknown;
			service.getWatchErrors$().subscribe((error: unknown) => emittedErrors.push(error));
			service.observeValue({}, () => undefined).subscribe({
				error: (error: unknown) => (consumerError = error)
			});

			expect(emittedErrors.length).toBe(1);
			expect(consumerError).toBeUndefined();

			service.restartRealtimeStreams();
			expect(emittedErrors.length).toBe(2);
			expect(consumerError).toBeUndefined();
		});

		it('rejects and reports a public user-statistics write without an authenticated user', async () => {
			const service = makeRecoveryService();
			service.firebaseAuth = { currentUser: null };
			let emittedError: unknown;
			service.getWriteErrors$().subscribe((error: unknown) => (emittedError = error));

			await expectAsync(service.updateUserStatsFields({ preference: true })).toBeRejectedWithError(
				SessionExpiredError
			);
			expect(emittedError).toEqual(jasmine.any(SessionExpiredError));
		});

		it('rejects and reports a failed public user-statistics write', async () => {
			const service = makeRecoveryService();
			service.firebaseAuth = { currentUser: { uid: 'user-123' } };
			service.db = {};
			let emittedError: unknown;
			service.getWriteErrors$().subscribe((error: unknown) => (emittedError = error));

			await expectAsync(service.updateUserStatsFields({ preference: true })).toBeRejectedWithError(
				UnexpectedError
			);
			expect(emittedError).toBeDefined();
		});

		it('rejects and reports a failed public global-statistics write', async () => {
			const service = makeRecoveryService();
			service.statisticsRef = {};
			let emittedError: unknown;
			service.getWriteErrors$().subscribe((error: unknown) => (emittedError = error));

			await expectAsync(service.updateStatisticsFields({ total: 1 })).toBeRejectedWithError(
				UnexpectedError
			);
			expect(emittedError).toBeDefined();
		});
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
