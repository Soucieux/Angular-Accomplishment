import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { NotificationService } from './notification.service';
import { DatabaseService } from '../database-service/database.service';

describe('NotificationService', () => {
	let service: NotificationService;
	let mockDb: jasmine.SpyObj<DatabaseService>;

	/**
	 * Configures the testing module for the given platform with a mocked DatabaseService.
	 *
	 * @param platformId - The platform token to provide ('browser' or 'server').
	 */
	function setup(platformId: string): void {
		mockDb = jasmine.createSpyObj<DatabaseService>('DatabaseService', [
			'getTauriNotifEnabled',
			'setTauriNotifEnabled'
		]);
		mockDb.getTauriNotifEnabled.and.returnValue(Promise.resolve(false));
		mockDb.setTauriNotifEnabled.and.returnValue(Promise.resolve());

		TestBed.configureTestingModule({
			providers: [
				NotificationService,
				{ provide: DatabaseService, useValue: mockDb },
				{ provide: PLATFORM_ID, useValue: platformId }
			]
		});

		service = TestBed.inject(NotificationService);
	}

	/** Simulates the Tauri desktop runtime by attaching the global marker to window. */
	function enableTauri(): void {
		(window as unknown as Record<string, unknown>)['__TAURI__'] = {};
	}

	afterEach(() => {
		delete (window as unknown as Record<string, unknown>)['__TAURI__'];
	});

	it('should create', () => {
		setup('browser');
		expect(service).toBeTruthy();
	});

	// ── isSupported ──────────────────────────────────────────────────────────────

	describe('isSupported', () => {
		it('returns false on a server platform', () => {
			setup('server');
			expect(service.isSupported()).toBeFalse();
		});

		it('returns false in a browser without the Tauri runtime', () => {
			setup('browser');
			expect(service.isSupported()).toBeFalse();
		});

		it('returns true in a browser with the Tauri runtime', () => {
			setup('browser');
			enableTauri();
			expect(service.isSupported()).toBeTrue();
		});
	});

	// ── isSubscribed ─────────────────────────────────────────────────────────────

	describe('isSubscribed', () => {
		it('is false initially', () => {
			setup('browser');
			expect(service.isSubscribed()).toBeFalse();
		});
	});

	// ── init ─────────────────────────────────────────────────────────────────────

	describe('init', () => {
		it('does nothing outside the Tauri runtime', async () => {
			setup('browser');
			await service.init();
			expect(mockDb.getTauriNotifEnabled).not.toHaveBeenCalled();
			expect(service.isSubscribed()).toBeFalse();
		});

		it('loads the persisted preference inside the Tauri runtime', async () => {
			setup('browser');
			enableTauri();
			mockDb.getTauriNotifEnabled.and.returnValue(Promise.resolve(true));
			await service.init();
			expect(service.isSubscribed()).toBeTrue();
		});
	});

	// ── subscribe ────────────────────────────────────────────────────────────────

	describe('subscribe', () => {
		it('enables the preference and persists it', async () => {
			setup('browser');
			await service.subscribe();
			expect(service.isSubscribed()).toBeTrue();
			expect(mockDb.setTauriNotifEnabled).toHaveBeenCalledWith(true);
		});

		it('reverts the flag when persistence fails', async () => {
			setup('browser');
			mockDb.setTauriNotifEnabled.and.returnValue(Promise.reject(new Error('write failed')));
			await service.subscribe();
			expect(service.isSubscribed()).toBeFalse();
		});
	});

	// ── unsubscribe ──────────────────────────────────────────────────────────────

	describe('unsubscribe', () => {
		it('disables the preference and persists it', async () => {
			setup('browser');
			await service.unsubscribe();
			expect(service.isSubscribed()).toBeFalse();
			expect(mockDb.setTauriNotifEnabled).toHaveBeenCalledWith(false);
		});

		it('reverts the flag when persistence fails', async () => {
			setup('browser');
			mockDb.setTauriNotifEnabled.and.returnValue(Promise.reject(new Error('write failed')));
			await service.unsubscribe();
			expect(service.isSubscribed()).toBeTrue();
		});
	});
});
