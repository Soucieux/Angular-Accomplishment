import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { OrbitalComponent } from './orbital.component';
import { OrbitalStore } from './orbital.store';
import { AuthService } from '../../../backend/authentication-service/auth.service';
import { DatabaseService } from '../../../backend/database-service/database.service';
import { PortalCategory, PortalLink } from '../../portal/portal.model';

function makeLink(id: string, category: string, isPinned = false): PortalLink {
	return { _id: id, _openid: 'uid1', title: id, url: 'https://example.com', category, isPinned };
}

function makeCategory(id: string, color: string): PortalCategory {
	return { _id: id, name: id, color, order: 0 };
}

describe('OrbitalComponent', () => {
	let component: OrbitalComponent;
	let fixture: ComponentFixture<OrbitalComponent>;

	beforeEach(async () => {
		const mockAuth = jasmine.createSpyObj('AuthService', [], {
			currentUser$: of(null)
		});

		const mockRouter = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

		const mockDb = jasmine.createSpyObj<DatabaseService>('DatabaseService', ['getUserStats']);
		mockDb.getUserStats.and.returnValue(of(null));

		await TestBed.configureTestingModule({
			imports: [OrbitalComponent],
			providers: [
				OrbitalStore,
				{ provide: AuthService, useValue: mockAuth },
				{ provide: Router, useValue: mockRouter },
				{ provide: DatabaseService, useValue: mockDb }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(OrbitalComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	// ── pinnedLinks ──────────────────────────────────────────────────────────────

	describe('pinnedLinks', () => {
		it('returns only pinned links', () => {
			component.links = [
				makeLink('a', 'dev', true),
				makeLink('b', 'dev', false),
				makeLink('c', 'dev', true)
			];
			// pinnedLinks is recomputed in ngOnChanges when the links input changes.
			(component as any).ngOnChanges({ links: {} });
			expect((component as any).pinnedLinks.length).toBe(2);
		});

		it('caps the result at 6 even when more are pinned', () => {
			component.links = Array.from({ length: 10 }, (_, i) => makeLink(`l${i}`, 'dev', true));
			(component as any).ngOnChanges({ links: {} });
			expect((component as any).pinnedLinks.length).toBe(6);
		});

		it('returns an empty array when no links are pinned', () => {
			component.links = [makeLink('a', 'dev', false)];
			expect((component as any).pinnedLinks.length).toBe(0);
		});
	});

	// ── getLinkColor ─────────────────────────────────────────────────────────────

	describe('getLinkColor', () => {
		beforeEach(() => {
			component.dashCategories = [makeCategory('cat1', '#ff0000')];
		});

		it('returns the category color when the link category matches', () => {
			const link = makeLink('l1', 'cat1');
			expect((component as any).getLinkColor(link)).toBe('#ff0000');
		});

		it('returns the fallback color when no category matches', () => {
			const link = makeLink('l1', 'unknown');
			const result = (component as any).getLinkColor(link);
			expect(typeof result).toBe('string');
			expect(result.length).toBeGreaterThan(0);
		});
	});

	// ── getIconBackground ─────────────────────────────────────────────────────────

	describe('getIconBackground', () => {
		it('returns a CSS rgba string at 20% opacity', () => {
			const result = (component as any).getIconBackground('#ff0000');
			expect(result).toContain('rgba');
			expect(result).toContain('0.2');
		});
	});

	// ── getUserDisplayName ────────────────────────────────────────────────────────

	describe('getUserDisplayName', () => {
		it('returns an empty string for a null user', () => {
			expect((component as any).getUserDisplayName(null)).toBe('');
		});

		it('returns the display name when the user object has one', () => {
			const result = (component as any).getUserDisplayName({ displayName: 'Alice' });
			expect(result).toBe('Alice');
		});
	});
});
