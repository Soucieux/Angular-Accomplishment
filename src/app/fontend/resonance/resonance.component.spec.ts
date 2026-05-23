import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../backend/authentication-service/auth.service';
import { DatabaseService } from '../../backend/database-service/database.service';
import { ResonanceComponent } from './resonance.component';

describe('ResonanceComponent', () => {
	let component: ResonanceComponent;
	let fixture: ComponentFixture<ResonanceComponent>;

	beforeEach(async () => {
		const mockDb = jasmine.createSpyObj('DatabaseService', ['getQuotes']);
		mockDb.getQuotes.and.returnValue(of([]));

		const mockAuth = jasmine.createSpyObj('AuthService', ['signInAnonymously', 'signOut']);
		mockAuth.signInAnonymously.and.returnValue(Promise.resolve());
		mockAuth.signOut.and.returnValue(Promise.resolve());

		await TestBed.configureTestingModule({
			imports: [ResonanceComponent],
			providers: [
				MessageService,
				{ provide: DatabaseService, useValue: mockDb },
				{ provide: AuthService, useValue: mockAuth }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(ResonanceComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	// ── isOverLimit ────────────────────────────────────────────────────────

	describe('isOverLimit', () => {
		it('returns false when the quote text is within the limit', () => {
			(component as any).newQuoteText = 'short text';
			expect((component as any).isOverLimit).toBeFalse();
		});

		it('returns true when the quote text exceeds maxQuoteLength', () => {
			(component as any).newQuoteText = 'x'.repeat((component as any).maxQuoteLength + 1);
			expect((component as any).isOverLimit).toBeTrue();
		});

		it('returns false when the text length is exactly at the limit', () => {
			(component as any).newQuoteText = 'x'.repeat((component as any).maxQuoteLength);
			expect((component as any).isOverLimit).toBeFalse();
		});
	});
});
