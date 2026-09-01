import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { BehaviorSubject, ReplaySubject, Subject, firstValueFrom } from 'rxjs';
import { skip } from 'rxjs/operators';

import {
	CLOUDBASE_ERROR_INVALID_CREDENTIALS,
	CLOUDBASE_ERR_PERMISSION_DENIED,
	DATABASE_REMINDER,
	DATABASE_USERS,
	STATS_FIELD_SHARED_REV,
	STATS_FIELD_SHARED_WITH,
	ROLE_ADMIN
} from '../../../common/constants';
import { SessionExpiredError } from '../../../common/error/session-expired.error';
import { UnexpectedError } from '../../../common/error/unexpected.error';
import { CloudbaseService } from './cloudbase.service';

describe('CloudbaseService', () => {
	const makeRecoveryService = (): any => {
		const service = Object.create(CloudbaseService.prototype);
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
		service.sessionClearedSubject = new Subject<void>();
		service.tempUrlCache = new Map<string, string>();
		service.userStats$ = undefined;
		service.reminderDetails$ = undefined;
		return service;
	};

	beforeEach(() => {
		// Reset static subjects so each test starts with a clean observable state.
		(CloudbaseService as any)._authReady$ = new ReplaySubject<boolean>(1);
		(CloudbaseService as any)._loginState$ = new BehaviorSubject<boolean>(false);
		// Reset static scalar fields without going through setUseId (which would emit onto _authReady$).
		(CloudbaseService as any).userId = undefined;
		(CloudbaseService as any).userRole = undefined;
		(CloudbaseService as any).userName = undefined;
	});

	// ── User identity ──────────────────────────────────────────────────────────

	describe('setUseId / getUserId', () => {
		it('stores and retrieves a user ID', () => {
			// Arrange / Act
			CloudbaseService.setUseId('user-123');

			// Assert
			expect(CloudbaseService.getUserId()).toBe('user-123');
		});

		it('stores an empty string when cleared', () => {
			// Arrange
			CloudbaseService.setUseId('user-123');

			// Act
			CloudbaseService.setUseId('');

			// Assert
			expect(CloudbaseService.getUserId()).toBe('');
		});
	});

	// ── Role and permissions ───────────────────────────────────────────────────

	describe('userHasAllRights', () => {
		it('returns true when role array contains ROLE_ADMIN', () => {
			// Arrange / Act
			CloudbaseService.setUserRole([ROLE_ADMIN]);

			// Assert
			expect(CloudbaseService.userHasAllRights()).toBeTrue();
		});

		it('returns true when role array contains ROLE_ADMIN alongside other roles', () => {
			// Arrange / Act
			CloudbaseService.setUserRole(['internaluser', ROLE_ADMIN]);

			// Assert
			expect(CloudbaseService.userHasAllRights()).toBeTrue();
		});

		it('returns false when role array does not contain ROLE_ADMIN', () => {
			// Arrange / Act
			CloudbaseService.setUserRole(['viewer']);

			// Assert
			expect(CloudbaseService.userHasAllRights()).toBeFalse();
		});

		it('returns false when role array is empty', () => {
			// Arrange / Act
			CloudbaseService.setUserRole([]);

			// Assert
			expect(CloudbaseService.userHasAllRights()).toBeFalse();
		});

		it('returns false when role has not been set', () => {
			expect(CloudbaseService.userHasAllRights()).toBeFalse();
		});
	});

	// ── User name ──────────────────────────────────────────────────────────────

	describe('setUserName / getUserName', () => {
		it('stores and retrieves a user name', () => {
			// Arrange / Act
			CloudbaseService.setUserName('Alice');

			// Assert
			expect(CloudbaseService.getUserName()).toBe('Alice');
		});
	});

	// ── loginState$ ────────────────────────────────────────────────────────────

	describe('loginState$', () => {
		it('emits false as the initial value', (done) => {
			// loginState$ is backed by a BehaviorSubject — always emits current state on subscribe.
			CloudbaseService.loginState$.subscribe((value) => {
				expect(value).toBeFalse();
				done();
			});
		});

		it('emits true after setLoginState(true)', (done) => {
			// Skip the initial BehaviorSubject emission so we only assert on the new value.
			CloudbaseService.loginState$.pipe(skip(1)).subscribe((value) => {
				expect(value).toBeTrue();
				done();
			});

			CloudbaseService.setLoginState(true);
		});

		it('emits false after setLoginState(false)', (done) => {
			CloudbaseService.setLoginState(true);

			CloudbaseService.loginState$.pipe(skip(1)).subscribe((value) => {
				expect(value).toBeFalse();
				done();
			});

			CloudbaseService.setLoginState(false);
		});
	});

	// ── authReady$ ─────────────────────────────────────────────────────────────

	describe('authReady$', () => {
		it('emits when setUseId is called with a non-empty user ID', (done) => {
			CloudbaseService.authReady$.subscribe(() => {
				expect(CloudbaseService.getUserId()).toBe('user-456');
				done();
			});

			CloudbaseService.setUseId('user-456');
		});

		it('does not emit when setUseId is called with an empty string', fakeAsync(() => {
			let emitted = false;

			CloudbaseService.authReady$.subscribe(() => {
				emitted = true;
			});

			CloudbaseService.setUseId('');
			tick(100);

			expect(emitted).toBeFalse();
		}));

		it('emits when markAuthReady is called directly', (done) => {
			CloudbaseService.authReady$.subscribe(() => {
				expect(true).toBeTrue();
				done();
			});

			CloudbaseService.markAuthReady();
		});
	});

	// ── Realtime recovery ──────────────────────────────────────────────────────

	describe('realtime recovery', () => {
		it('reports fresh state immediately when no realtime listeners are active', () => {
			const service = makeRecoveryService();
			let snapshotCount = 0;
			service.getFreshSnapshot$().subscribe(() => snapshotCount++);

			service.restartRealtimeStreams();

			expect(snapshotCount).toBe(1);
		});

		it('reports data-layer readiness only after a protected read succeeds', async () => {
			const service = makeRecoveryService();
			spyOn(service, 'checkConnection').and.resolveTo();
			CloudbaseService.setUseId('user-123');

			const isReady = await firstValueFrom(service.getIsDataLayerReady$());

			expect(isReady).toBeTrue();
			expect(service.checkConnection).toHaveBeenCalledOnceWith();
		});

		it('checks the authenticated user collection with a real read', async () => {
			const service = makeRecoveryService();
			const get = jasmine.createSpy('get').and.resolveTo({ data: [] });
			const limit = jasmine.createSpy('limit').and.returnValue({ get });
			const where = jasmine.createSpy('where').and.returnValue({ limit });
			service.database = { collection: jasmine.createSpy('collection').and.returnValue({ where }) };
			spyOn(service, 'getUserStatsFilter').and.returnValue({ _openid: 'user-123' });
			CloudbaseService.setUseId('user-123');

			await service.checkConnection();

			expect(where).toHaveBeenCalledWith({ _openid: 'user-123' });
			expect(limit).toHaveBeenCalledWith(1);
			expect(get).toHaveBeenCalled();
		});

		it('waits for authenticated identity readiness before probing the database', async () => {
			const service = makeRecoveryService();
			const get = jasmine.createSpy('get').and.resolveTo({ data: [] });
			service.database = {
				collection: jasmine.createSpy('collection').and.returnValue({
					where: () => ({ limit: () => ({ get }) })
				})
			};
			spyOn(service, 'getUserStatsFilter').and.returnValue({ _openid: 'user-123' });

			const connectionPromise = service.checkConnection();
			await Promise.resolve();
			expect(get).not.toHaveBeenCalled();

			CloudbaseService.setUseId('user-123');
			await connectionPromise;

			expect(get).toHaveBeenCalledOnceWith();
		});

		it('maps an explicit credential failure from the connection check to session expiry', async () => {
			const service = makeRecoveryService();
			const get = jasmine
				.createSpy('get')
				.and.rejectWith({ category: CLOUDBASE_ERROR_INVALID_CREDENTIALS });
			service.database = {
				collection: jasmine.createSpy('collection').and.returnValue({
					where: () => ({ limit: () => ({ get }) })
				})
			};
			spyOn(service, 'getUserStatsFilter').and.returnValue({ _openid: 'user-123' });
			CloudbaseService.setUseId('user-123');

			await expectAsync(service.checkConnection()).toBeRejectedWithError(SessionExpiredError);
		});

		it('maps an unknown connection failure to the retryable typed fallback', async () => {
			const service = makeRecoveryService();
			const networkError = new Error('network unavailable');
			const get = jasmine.createSpy('get').and.rejectWith(networkError);
			service.database = {
				collection: jasmine.createSpy('collection').and.returnValue({
					where: () => ({ limit: () => ({ get }) })
				})
			};
			spyOn(service, 'getUserStatsFilter').and.returnValue({ _openid: 'user-123' });
			CloudbaseService.setUseId('user-123');

			await expectAsync(service.checkConnection()).toBeRejectedWithError(UnexpectedError);
		});

		it('does not classify a generic permission denial as confirmed expiry', async () => {
			const service = makeRecoveryService();
			const permissionError = { code: CLOUDBASE_ERR_PERMISSION_DENIED };
			const get = jasmine.createSpy('get').and.rejectWith(permissionError);
			service.database = {
				collection: jasmine.createSpy('collection').and.returnValue({
					where: () => ({ limit: () => ({ get }) })
				})
			};
			spyOn(service, 'getUserStatsFilter').and.returnValue({ _openid: 'user-123' });
			CloudbaseService.setUseId('user-123');

			await expectAsync(service.checkConnection()).toBeRejectedWithError(UnexpectedError);
		});

		it('does not convert a database permission result into session expiry', () => {
			const service = makeRecoveryService();

			expect(() =>
				service.throwIfCloudbaseError({ code: CLOUDBASE_ERR_PERMISSION_DENIED })
			).toThrowError(UnexpectedError);
		});

		it('closes and recreates an active watcher when realtime streams restart', () => {
			const service = makeRecoveryService();
			const close = jasmine.createSpy('close');
			const watch = jasmine.createSpy('watch').and.returnValues({ close }, { close });
			service.database = {
				collection: jasmine.createSpy('collection').and.returnValue({ watch })
			};
			CloudbaseService.setUseId('user-123');

			service.getHistory().subscribe();
			service.restartRealtimeStreams();

			expect(watch).toHaveBeenCalledTimes(2);
			expect(close).toHaveBeenCalledTimes(1);
		});

		it('closes an abandoned generic watcher and excludes it from the next recovery', () => {
			const service = makeRecoveryService();
			const close = jasmine.createSpy('close');
			const watch = jasmine.createSpy('watch').and.returnValue({ close });
			service.database = {
				collection: jasmine.createSpy('collection').and.returnValue({ watch })
			};
			CloudbaseService.setUseId('user-123');
			const history$ = service.getHistory();
			const firstConsumer = history$.subscribe();
			const secondConsumer = history$.subscribe();

			expect(watch).toHaveBeenCalledTimes(1);
			firstConsumer.unsubscribe();
			expect(close).not.toHaveBeenCalled();

			secondConsumer.unsubscribe();
			let freshSnapshotCount = 0;
			service.getFreshSnapshot$().subscribe(() => freshSnapshotCount++);
			service.restartRealtimeStreams();

			expect(close).toHaveBeenCalledTimes(1);
			expect(watch).toHaveBeenCalledTimes(1);
			expect(freshSnapshotCount).toBe(1);
		});

		it('ignores a late snapshot from the watcher generation that was replaced', () => {
			const service = makeRecoveryService();
			const watchOptions: any[] = [];
			service.database = {
				collection: jasmine.createSpy('collection').and.returnValue({
					watch: (options: any) => {
						watchOptions.push(options);
						return { close: () => undefined };
					}
				})
			};
			CloudbaseService.setUseId('user-123');
			let freshSnapshotCount = 0;
			service.getFreshSnapshot$().subscribe(() => freshSnapshotCount++);
			service.getHistory().subscribe();

			service.restartRealtimeStreams();
			watchOptions[0].onChange({ docs: [] });
			expect(freshSnapshotCount).toBe(0);

			watchOptions[1].onChange({ docs: [] });
			expect(freshSnapshotCount).toBe(1);
		});

		it('waits for every restarted watcher before reporting fresh state', () => {
			const service = makeRecoveryService();
			const watchOptions: any[] = [];
			service.database = {
				collection: jasmine.createSpy('collection').and.returnValue({
					watch: (options: any) => {
						watchOptions.push(options);
						return { close: () => undefined };
					}
				})
			};
			CloudbaseService.setUseId('user-123');
			let freshSnapshotCount = 0;
			service.getFreshSnapshot$().subscribe(() => freshSnapshotCount++);
			service.getHistory().subscribe();
			service.getQuotes().subscribe();

			service.restartRealtimeStreams();
			watchOptions[2].onChange({ docs: [] });
			expect(freshSnapshotCount).toBe(0);

			watchOptions[3].onChange({ docs: [] });
			expect(freshSnapshotCount).toBe(1);
		});

		it('closes and recreates the custom movie watcher when realtime streams restart', () => {
			const service = makeRecoveryService();
			const close = jasmine.createSpy('close');
			const watch = jasmine.createSpy('watch').and.returnValues({ close }, { close });
			service.database = {
				collection: jasmine.createSpy('collection').and.returnValue({ watch })
			};
			CloudbaseService.setUseId('user-123');

			service.getMovieList().subscribe();
			service.restartRealtimeStreams();

			expect(watch).toHaveBeenCalledTimes(2);
			expect(close).toHaveBeenCalledTimes(1);
		});

		it('closes an abandoned movie watcher and excludes it from the next recovery', () => {
			const service = makeRecoveryService();
			const close = jasmine.createSpy('close');
			const watch = jasmine.createSpy('watch').and.returnValue({ close });
			service.database = {
				collection: jasmine.createSpy('collection').and.returnValue({ watch })
			};
			CloudbaseService.setUseId('user-123');
			const subscription = service.getMovieList().subscribe();

			subscription.unsubscribe();
			let freshSnapshotCount = 0;
			service.getFreshSnapshot$().subscribe(() => freshSnapshotCount++);
			service.restartRealtimeStreams();

			expect(close).toHaveBeenCalledTimes(1);
			expect(watch).toHaveBeenCalledTimes(1);
			expect(freshSnapshotCount).toBe(1);
		});

		it('does not treat a closed movie generation as a fresh snapshot', fakeAsync(() => {
			const service = makeRecoveryService();
			const watchOptions: any[] = [];
			service.database = {
				collection: jasmine.createSpy('collection').and.returnValue({
					watch: (options: any) => {
						watchOptions.push(options);
						return { close: () => undefined };
					}
				})
			};
			let resolveFirst!: (movies: any[]) => void;
			let resolveSecond!: (movies: any[]) => void;
			spyOn(service, 'resolveMovieCoverUrls').and.returnValues(
				new Promise<any[]>((resolve) => (resolveFirst = resolve)),
				new Promise<any[]>((resolve) => (resolveSecond = resolve))
			);
			CloudbaseService.setUseId('user-123');
			let freshSnapshotCount = 0;
			service.getFreshSnapshot$().subscribe(() => freshSnapshotCount++);
			service.getMovieList().subscribe();
			const movieDocument = { title: 'Movie', year: 2026, firstReleaseDate: '2026.01.01' };

			watchOptions[0].onChange({ docs: [movieDocument] });
			service.restartRealtimeStreams();
			resolveFirst([]);
			flushMicrotasks();

			expect(freshSnapshotCount).toBe(0);

			watchOptions[1].onChange({ docs: [movieDocument] });
			resolveSecond([]);
			flushMicrotasks();

			expect(freshSnapshotCount).toBe(1);
		}));

		it('surfaces watcher errors centrally without terminating recovery', () => {
			const service = makeRecoveryService();
			const watcherError = new Error('watch failed');
			let watchOptions: any;
			service.database = {
				collection: jasmine.createSpy('collection').and.returnValue({
					watch: (options: any) => {
						watchOptions = options;
						return { close: () => undefined };
					}
				})
			};
			CloudbaseService.setUseId('user-123');
			let emittedError: unknown;
			service.getWatchErrors$().subscribe((error: unknown) => (emittedError = error));
			service.getHistory().subscribe();

			watchOptions.onError(watcherError);

			expect(emittedError).toBe(watcherError);
		});

		it('surfaces a synchronous generic watcher initialization failure and retries later', () => {
			const service = makeRecoveryService();
			const watcherError = new Error('watch initialization failed');
			let watchAttempt = 0;
			const watch = jasmine.createSpy('watch').and.callFake(() => {
				if (watchAttempt++ === 0) throw watcherError;
				return { close: () => undefined };
			});
			service.database = {
				collection: jasmine.createSpy('collection').and.returnValue({ watch })
			};
			CloudbaseService.setUseId('user-123');
			let emittedError: unknown;
			let consumerError: unknown;
			service.getWatchErrors$().subscribe((error: unknown) => (emittedError = error));
			service.getHistory().subscribe({ error: (error: unknown) => (consumerError = error) });

			expect(emittedError).toBe(watcherError);
			expect(consumerError).toBeUndefined();

			service.restartRealtimeStreams();
			expect(watch).toHaveBeenCalledTimes(2);
		});

		it('surfaces a synchronous movie watcher initialization failure and retries later', () => {
			const service = makeRecoveryService();
			const watcherError = new Error('movie watch initialization failed');
			let watchAttempt = 0;
			const watch = jasmine.createSpy('watch').and.callFake(() => {
				if (watchAttempt++ === 0) throw watcherError;
				return { close: () => undefined };
			});
			service.database = {
				collection: jasmine.createSpy('collection').and.returnValue({ watch })
			};
			CloudbaseService.setUseId('user-123');
			let emittedError: unknown;
			let consumerError: unknown;
			service.getWatchErrors$().subscribe((error: unknown) => (emittedError = error));
			service.getMovieList().subscribe({ error: (error: unknown) => (consumerError = error) });

			expect(emittedError).toBe(watcherError);
			expect(consumerError).toBeUndefined();

			service.restartRealtimeStreams();
			expect(watch).toHaveBeenCalledTimes(2);
		});

		it('surfaces write errors separately while preserving the caller-facing error', () => {
			const service = makeRecoveryService();
			const writeError = new Error('write failed');
			let emittedError: unknown;
			service.getWriteErrors$().subscribe((error: unknown) => (emittedError = error));

			expect(() => service.rethrowCaught(writeError)).toThrowError(UnexpectedError);
			expect(emittedError).toBe(writeError);
		});

		it('does not report a proxy-read error as a database write failure', () => {
			const service = makeRecoveryService();
			const readError = new Error('proxy read failed');
			let emittedError: unknown;
			service.getWriteErrors$().subscribe((error: unknown) => (emittedError = error));

			expect(() => service.rethrowReadError(readError)).toThrowError(UnexpectedError);
			expect(emittedError).toBeUndefined();
		});

		it('rejects and reports a failed public user-statistics write', async () => {
			const service = makeRecoveryService();
			const writeError = new Error('user statistics write failed');
			service.database = {
				collection: jasmine.createSpy('collection').and.returnValue({
					where: () => ({ update: () => Promise.reject(writeError) })
				})
			};
			spyOn(service, 'getUserStatsFilter').and.returnValue({ _openid: 'user-123' });
			let emittedError: unknown;
			service.getWriteErrors$().subscribe((error: unknown) => (emittedError = error));

			await expectAsync(service.updateUserStatsFields({ preference: true })).toBeRejectedWithError(
				UnexpectedError
			);
			expect(emittedError).toBe(writeError);
		});

		it('rejects and reports a failed public global-statistics write', async () => {
			const service = makeRecoveryService();
			const writeError = new Error('global statistics write failed');
			service.statId = 'statistics-1';
			service.database = {
				collection: jasmine.createSpy('collection').and.returnValue({
					doc: () => ({ update: () => Promise.reject(writeError) })
				})
			};
			let emittedError: unknown;
			service.getWriteErrors$().subscribe((error: unknown) => (emittedError = error));

			await expectAsync(service.updateStatisticsFields({ total: 1 })).toBeRejectedWithError(
				UnexpectedError
			);
			expect(emittedError).toBe(writeError);
		});

		it('evicts replayed data and closes watchers when session state clears', () => {
			const service = makeRecoveryService();
			const close = jasmine.createSpy('close');
			let watchOptions: any;
			service.database = {
				collection: jasmine.createSpy('collection').and.returnValue({
					watch: (options: any) => {
						watchOptions = options;
						return { close };
					}
				})
			};
			CloudbaseService.setUseId('user-123');
			const history$ = service.getHistory();
			const firstValues: any[] = [];
			history$.subscribe((value: any[]) => firstValues.push(value));
			watchOptions.onChange({ docs: [{ _id: 'history-1' }] });

			service.clearSessionState();
			const replayedValues: any[] = [];
			history$.subscribe((value: any[]) => replayedValues.push(value));

			expect(firstValues.length).toBe(1);
			expect(close).toHaveBeenCalled();
			expect(replayedValues).toEqual([]);
		});

		it('emits a recovery snapshot signal from inside Angular zone', () => {
			const service = makeRecoveryService();
			let watchOptions: any;
			service.database = {
				collection: jasmine.createSpy('collection').and.returnValue({
					watch: (options: any) => {
						watchOptions = options;
						return { close: () => undefined };
					}
				})
			};
			CloudbaseService.setUseId('user-123');
			let snapshotCount = 0;
			service.getFreshSnapshot$().subscribe(() => snapshotCount++);
			service.getHistory().subscribe();
			service.restartRealtimeStreams();

			watchOptions.onChange({ docs: [] });

			expect(snapshotCount).toBe(1);
		});

		it('clears the shared-reminder branch before a different user snapshot arrives', fakeAsync(() => {
			const service = makeRecoveryService();
			const ownedReminderSubject = new Subject<any[]>();
			const userStatisticsSubject = new Subject<any>();
			spyOn(service, 'watchCollection').and.callFake((collectionName: string) =>
				collectionName === DATABASE_REMINDER
					? ownedReminderSubject.asObservable()
					: userStatisticsSubject.asObservable()
			);
			spyOn(service, 'getSharedReminders').and.returnValues(
				Promise.resolve([{ key: 'old-shared' }]),
				Promise.resolve([{ key: 'new-shared' }])
			);
			CloudbaseService.setUseId('old-user');
			const reminderValues: any[][] = [];
			service.getReminderTableDetails().subscribe((items: any[]) => reminderValues.push(items));
			ownedReminderSubject.next([]);
			userStatisticsSubject.next({
				[STATS_FIELD_SHARED_WITH]: ['member-1'],
				[STATS_FIELD_SHARED_REV]: 1
			});
			flushMicrotasks();
			expect(reminderValues.at(-1)).toEqual([{ key: 'old-shared' }]);

			service.clearSessionState();
			CloudbaseService.setUseId('new-user');
			ownedReminderSubject.next([{ key: 'new-owned' }]);
			expect(reminderValues.at(-1)).toEqual([{ key: 'new-owned' }]);

			userStatisticsSubject.next({
				[STATS_FIELD_SHARED_WITH]: ['member-1'],
				[STATS_FIELD_SHARED_REV]: 1
			});
			flushMicrotasks();
			expect(service.getSharedReminders).toHaveBeenCalledTimes(2);
			expect(reminderValues.at(-1)).toEqual([
				{ key: 'new-owned' },
				{ key: 'new-shared' }
			]);
		}));

		it('retries shared reminders after one transient fetch failure', fakeAsync(() => {
			const service = makeRecoveryService();
			const ownedReminderSubject = new Subject<any[]>();
			const userStatisticsSubject = new Subject<any>();
			spyOn(service, 'watchCollection').and.callFake((collectionName: string) =>
				collectionName === DATABASE_REMINDER
					? ownedReminderSubject.asObservable()
					: userStatisticsSubject.asObservable()
			);
			spyOn(service, 'getSharedReminders').and.returnValues(
				Promise.reject(new Error('temporary failure')),
				Promise.resolve([{ key: 'shared-retry' }])
			);
			CloudbaseService.setUseId('user-123');
			const reminderValues: any[][] = [];
			service.getReminderTableDetails().subscribe((items: any[]) => reminderValues.push(items));
			ownedReminderSubject.next([]);
			userStatisticsSubject.next({
				[STATS_FIELD_SHARED_WITH]: ['member-1'],
				[STATS_FIELD_SHARED_REV]: 1
			});
			flushMicrotasks();
			expect(reminderValues.at(-1)).toEqual([]);

			userStatisticsSubject.next({
				[STATS_FIELD_SHARED_WITH]: ['member-1'],
				[STATS_FIELD_SHARED_REV]: 2
			});
			flushMicrotasks();
			expect(service.getSharedReminders).toHaveBeenCalledTimes(2);
			expect(reminderValues.at(-1)).toEqual([{ key: 'shared-retry' }]);
		}));
	});

	describe('proxyFetch', () => {
		it('calls the fetchUrl Cloud Function without a dead local endpoint attempt', async () => {
			const service = makeRecoveryService();
			const browserFetch = spyOn(globalThis, 'fetch').and.rejectWith(
				new Error('local endpoint should not be called')
			);
			const callFunction = jasmine.createSpy('callFunction').and.resolveTo({
				result: {
					success: true,
					content: '<title>Example</title>',
					contentType: 'text/html'
				}
			});
			service.cloudbase = { callFunction };

			const result = await service.proxyFetch('https://example.com');

			expect(browserFetch).not.toHaveBeenCalled();
			expect(callFunction).toHaveBeenCalledOnceWith({
				name: 'fetchUrl',
				data: jasmine.objectContaining({ url: 'https://example.com' })
			});
			expect(result).toEqual({
				content: '<title>Example</title>',
				contentType: 'text/html'
			});
		});
	});
});
