import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { TimeoutService } from './timeout.service';
import { Utilities } from '../utilities/app.utilities';

describe('TimeoutService', () => {
	let service: TimeoutService;
	let mockUtilities: jasmine.SpyObj<Utilities>;

	function setup(isUserAlive: boolean): void {
		mockUtilities = jasmine.createSpyObj<Utilities>('Utilities', ['getIsUserAlive']);
		mockUtilities.getIsUserAlive.and.returnValue(isUserAlive);

		TestBed.configureTestingModule({
			providers: [TimeoutService, { provide: Utilities, useValue: mockUtilities }]
		});

		service = TestBed.inject(TimeoutService);
	}

	it('should create', () => {
		setup(true);
		expect(service).toBeTruthy();
	});

	// ── start ────────────────────────────────────────────────────────────────────

	describe('start', () => {
		it('does not invoke the callback when the user is not signed in', fakeAsync(() => {
			setup(false);
			const callback = jasmine.createSpy('callback');

			service.start('key', callback, 100);
			tick(200);

			expect(callback).not.toHaveBeenCalled();
		}));

		it('invokes the callback after the delay when the user is signed in', fakeAsync(() => {
			setup(true);
			const callback = jasmine.createSpy('callback');

			service.start('key', callback, 100);
			tick(99);
			expect(callback).not.toHaveBeenCalled();

			tick(1);
			expect(callback).toHaveBeenCalledOnceWith();
		}));

		it('clears an existing timer for the same key before starting a new one', fakeAsync(() => {
			setup(true);
			const first = jasmine.createSpy('first');
			const second = jasmine.createSpy('second');

			service.start('key', first, 100);
			tick(50);
			service.start('key', second, 100);
			tick(100);

			expect(first).not.toHaveBeenCalled();
			expect(second).toHaveBeenCalledOnceWith();
		}));

		it('runs independent timers for different keys concurrently', fakeAsync(() => {
			setup(true);
			const callbackA = jasmine.createSpy('callbackA');
			const callbackB = jasmine.createSpy('callbackB');

			service.start('a', callbackA, 100);
			service.start('b', callbackB, 200);
			tick(100);

			expect(callbackA).toHaveBeenCalledOnceWith();
			expect(callbackB).not.toHaveBeenCalled();

			tick(100);
			expect(callbackB).toHaveBeenCalledOnceWith();
		}));
	});

	// ── clear ────────────────────────────────────────────────────────────────────

	describe('clear', () => {
		it('cancels an active timer so the callback never fires', fakeAsync(() => {
			setup(true);
			const callback = jasmine.createSpy('callback');

			service.start('key', callback, 100);
			service.clear('key');
			tick(200);

			expect(callback).not.toHaveBeenCalled();
		}));

		it('is safe to call when no timer is running for the key', () => {
			setup(true);
			expect(() => service.clear('nonexistent')).not.toThrow();
		});

		it('does not affect timers registered under other keys', fakeAsync(() => {
			setup(true);
			const callback = jasmine.createSpy('callback');

			service.start('a', callback, 100);
			service.clear('b');
			tick(100);

			expect(callback).toHaveBeenCalledOnceWith();
		}));
	});
});
