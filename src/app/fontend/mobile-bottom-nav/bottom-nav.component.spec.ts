import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID, WritableSignal, signal } from '@angular/core';

import { BottomNavComponent } from './bottom-nav.component';
import { NotificationService } from '../../backend/notification-service/notification.service';
import { NavItem } from './bottom-nav.model';

function makeNavItem(id: string, label = id): NavItem {
	return { id, label, icon: 'home' };
}

interface BottomNavComponentTestAccess {
	gridOpen: WritableSignal<boolean>;
	doOpenGuide(): void;
}

describe('BottomNavComponent', () => {
	let component: BottomNavComponent;
	let fixture: ComponentFixture<BottomNavComponent>;
	let mockNotif: jasmine.SpyObj<NotificationService>;

	beforeEach(async () => {
		mockNotif = jasmine.createSpyObj<NotificationService>(
			'NotificationService',
			['isSupported', 'subscribe', 'unsubscribe'],
			{ isSubscribed: signal(false) }
		);
		mockNotif.isSupported.and.returnValue(false);

		await TestBed.configureTestingModule({
			imports: [BottomNavComponent],
			providers: [
				{ provide: PLATFORM_ID, useValue: 'server' },
				{ provide: NotificationService, useValue: mockNotif }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(BottomNavComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	// ── primary ──────────────────────────────────────────────────────────────────

	describe('primary', () => {
		it('falls back to the first four items when primaryIds is empty', () => {
			component.items = [
				makeNavItem('a'),
				makeNavItem('b'),
				makeNavItem('c'),
				makeNavItem('d'),
				makeNavItem('e')
			];
			component.primaryIds = [];
			expect((component as any).primary.map((i: NavItem) => i.id)).toEqual(['a', 'b', 'c', 'd']);
		});

		it('returns items in the order specified by primaryIds', () => {
			component.items = [makeNavItem('a'), makeNavItem('b'), makeNavItem('c')];
			component.primaryIds = ['c', 'a'];
			expect((component as any).primary.map((i: NavItem) => i.id)).toEqual(['c', 'a']);
		});

		it('omits ids that do not match any item', () => {
			component.items = [makeNavItem('a')];
			component.primaryIds = ['a', 'unknown'];
			expect((component as any).primary.length).toBe(1);
		});
	});

	// ── initial ──────────────────────────────────────────────────────────────────

	describe('initial', () => {
		it('returns the uppercase first letter of the user name', () => {
			component.userName = 'alice';
			expect((component as any).initial).toBe('A');
		});

		it('returns the fallback initial when userName is empty', () => {
			component.userName = '';
			expect((component as any).initial).toBeTruthy();
		});
	});

	// ── select ───────────────────────────────────────────────────────────────────

	describe('select', () => {
		it('updates activeId and emits navigate', () => {
			let navigateEmit: string | undefined;
			component.navigate.subscribe((id: string) => (navigateEmit = id));

			(component as any).select('home');

			expect(component.activeId).toBe('home');
			expect(navigateEmit).toBe('home');
		});
	});

	// ── toggleGrid ───────────────────────────────────────────────────────────────

	describe('toggleGrid', () => {
		it('opens the grid when it was closed', () => {
			(component as any).gridOpen.set(false);
			(component as any).toggleGrid();
			expect((component as any).gridOpen()).toBeTrue();
		});

		it('closes the grid when it was open', () => {
			(component as any).gridOpen.set(true);
			(component as any).toggleGrid();
			expect((component as any).gridOpen()).toBeFalse();
		});

		it('closes the account popover when the grid opens', () => {
			(component as any).accountOpen.set(true);
			(component as any).gridOpen.set(false);
			(component as any).toggleGrid();
			expect((component as any).accountOpen()).toBeFalse();
		});
	});

	// ── toggleAccount ─────────────────────────────────────────────────────────────

	describe('toggleAccount', () => {
		it('opens the account popover when it was closed', () => {
			(component as any).accountOpen.set(false);
			(component as any).toggleAccount();
			expect((component as any).accountOpen()).toBeTrue();
		});

		it('closes the grid when the account popover opens', () => {
			(component as any).gridOpen.set(true);
			(component as any).accountOpen.set(false);
			(component as any).toggleAccount();
			expect((component as any).gridOpen()).toBeFalse();
		});
	});

	// ── closeAll ─────────────────────────────────────────────────────────────────

	describe('closeAll', () => {
		it('sets both gridOpen and accountOpen to false', () => {
			(component as any).gridOpen.set(true);
			(component as any).accountOpen.set(true);
			(component as any).closeAll();
			expect((component as any).gridOpen()).toBeFalse();
			expect((component as any).accountOpen()).toBeFalse();
		});
	});

	/* ─────────────────────────────────────────
	   Guide launcher
	───────────────────────────────────────── */

	describe('doOpenGuide', () => {
		it('closes the grid and emits the guide request', () => {
			const testComponent = component as unknown as BottomNavComponentTestAccess;
			let guideEmitted = false;
			component.openGuide.subscribe(() => (guideEmitted = true));
			testComponent.gridOpen.set(true);

			testComponent.doOpenGuide();

			expect(testComponent.gridOpen()).toBeFalse();
			expect(guideEmitted).toBeTrue();
		});
	});

	// ── doSignIn / doSignOut ──────────────────────────────────────────────────────

	describe('doSignIn', () => {
		it('closes the account popover and emits signIn', () => {
			(component as any).accountOpen.set(true);
			let signInEmitted = false;
			component.signIn.subscribe(() => (signInEmitted = true));
			(component as any).doSignIn();
			expect((component as any).accountOpen()).toBeFalse();
			expect(signInEmitted).toBeTrue();
		});
	});

	describe('doSignOut', () => {
		it('closes the account popover and emits signOut', () => {
			(component as any).accountOpen.set(true);
			let signOutEmitted = false;
			component.signOut.subscribe(() => (signOutEmitted = true));
			(component as any).doSignOut();
			expect((component as any).accountOpen()).toBeFalse();
			expect(signOutEmitted).toBeTrue();
		});
	});
});
