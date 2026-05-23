import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockDialogComponent } from './block.component';

describe('BlockDialogComponent', () => {
	let component: BlockDialogComponent;
	let fixture: ComponentFixture<BlockDialogComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [BlockDialogComponent]
		}).compileComponents();

		fixture = TestBed.createComponent(BlockDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	// ── openDialog ─────────────────────────────────────────────────────────

	describe('openDialog', () => {
		it('sets visible to true and stores the message before the task runs', async () => {
			let visibleDuringTask = false;
			let messageDuringTask = '';
			const task = async () => {
				visibleDuringTask = (component as any).visible;
				messageDuringTask = (component as any).message;
			};
			await component.openDialog(task, 'Loading…');
			expect(visibleDuringTask).toBeTrue();
			expect(messageDuringTask).toBe('Loading…');
		});

		it('sets visible to false after the task completes', async () => {
			await component.openDialog(() => Promise.resolve(), 'msg');
			expect((component as any).visible).toBeFalse();
		});

		it('emits closed$ after the task completes', async () => {
			let emitted = false;
			component.closed$.subscribe(() => (emitted = true));
			await component.openDialog(() => Promise.resolve(), 'msg');
			expect(emitted).toBeTrue();
		});

		it('closes and emits even when the task throws', async () => {
			let emitted = false;
			component.closed$.subscribe(() => (emitted = true));
			try {
				await component.openDialog(() => Promise.reject(new Error('fail')), 'msg');
			} catch {}
			expect((component as any).visible).toBeFalse();
			expect(emitted).toBeTrue();
		});
	});

	// ── onDialogClosed ─────────────────────────────────────────────────────

	describe('onDialogClosed', () => {
		it('sets visible to false', () => {
			(component as any).visible = true;
			(component as any).onDialogClosed();
			expect((component as any).visible).toBeFalse();
		});

		it('emits the closed$ event', () => {
			let emitted = false;
			component.closed$.subscribe(() => (emitted = true));
			(component as any).onDialogClosed();
			expect(emitted).toBeTrue();
		});
	});
});
