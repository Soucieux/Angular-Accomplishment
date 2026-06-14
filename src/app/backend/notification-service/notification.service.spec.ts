import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { of } from 'rxjs';

import { NotificationService } from './notification.service';
import { DatabaseService } from '../database-service/database.service';

describe('NotificationService', () => {
	let service: NotificationService;
	let mockSwPush: jasmine.SpyObj<SwPush>;
	let mockDb: jasmine.SpyObj<DatabaseService>;

	function setup(platformId: string): void {
		mockSwPush = jasmine.createSpyObj<SwPush>('SwPush', ['requestSubscription', 'unsubscribe'], {
			subscription: of(null),
			isEnabled: false
		});
		mockDb = jasmine.createSpyObj<DatabaseService>('DatabaseService', [
			'addPushSubscription',
			'deletePushSubscription'
		]);
		mockDb.addPushSubscription.and.returnValue(Promise.resolve());
		mockDb.deletePushSubscription.and.returnValue(Promise.resolve());

		TestBed.configureTestingModule({
			providers: [
				NotificationService,
				{ provide: SwPush, useValue: mockSwPush },
				{ provide: DatabaseService, useValue: mockDb },
				{ provide: PLATFORM_ID, useValue: platformId }
			]
		});

		service = TestBed.inject(NotificationService);
	}

	it('should create', () => {
		setup('browser');
		expect(service).toBeTruthy();
	});

	// ── isSupported ─────────────────────────────────────────────────────────────

	describe('isSupported', () => {
		it('returns false on a server platform', () => {
			setup('server');
			expect(service.isSupported()).toBeFalse();
		});

		it('returns false when swPush.isEnabled is false', () => {
			setup('browser');
			expect(service.isSupported()).toBeFalse();
		});
	});

	// ── getPermission ────────────────────────────────────────────────────────────

	describe('getPermission', () => {
		it('returns denied on a server platform', () => {
			setup('server');
			expect(service.getPermission()).toBe('denied');
		});
	});

	// ── isSubscribed$ ─────────────────────────────────────────────────────────────

	describe('isSubscribed$', () => {
		it('emits false when subscription is null', (done) => {
			setup('browser');
			service.isSubscribed$.subscribe((value) => {
				expect(value).toBeFalse();
				done();
			});
		});

		it('emits true when an active subscription exists', (done) => {
			const swPushWithSub = jasmine.createSpyObj<SwPush>(
				'SwPush',
				['requestSubscription', 'unsubscribe'],
				{ subscription: of({} as PushSubscription), isEnabled: false }
			);
			const db = jasmine.createSpyObj<DatabaseService>('DatabaseService', [
				'addPushSubscription',
				'deletePushSubscription'
			]);

			TestBed.configureTestingModule({
				providers: [
					NotificationService,
					{ provide: SwPush, useValue: swPushWithSub },
					{ provide: DatabaseService, useValue: db },
					{ provide: PLATFORM_ID, useValue: 'browser' }
				]
			});

			const svc = TestBed.inject(NotificationService);
			svc.isSubscribed$.subscribe((value) => {
				expect(value).toBeTrue();
				done();
			});
		});
	});
});
