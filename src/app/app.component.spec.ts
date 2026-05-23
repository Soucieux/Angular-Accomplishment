import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { CN } from './common/app.constant';
import { Utilities } from './common/app.utilities';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AppComponent],
			providers: [provideRouter([]), MessageService]
		}).compileComponents();
	});

	it('should create the app', () => {
		const fixture = TestBed.createComponent(AppComponent);
		const app = fixture.componentInstance;
		expect(app).toBeTruthy();
	});

	// ── isCN ───────────────────────────────────────────────────────────────

	describe('isCN', () => {
		it('returns true when the current country is CN', () => {
			// Create the component first so ngOnInit fires before the spy is in place.
			const fixture = TestBed.createComponent(AppComponent);
			spyOn(Utilities, 'getCurrentCountry').and.returnValue(CN);
			expect((fixture.componentInstance as any).isCN()).toBeTrue();
		});

		it('returns false when the current country is not CN', () => {
			const fixture = TestBed.createComponent(AppComponent);
			spyOn(Utilities, 'getCurrentCountry').and.returnValue('US');
			expect((fixture.componentInstance as any).isCN()).toBeFalse();
		});
	});
});
