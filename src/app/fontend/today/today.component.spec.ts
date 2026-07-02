import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';

import { DatabaseService } from '../../backend/database-service/database.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { TodayComponent } from './today.component';
import { TodayTask } from './today.model';
import { TASK_SOURCE_LOCAL } from './today.model';

/** Builds a minimal timed task for TodayComponent layout tests. */
function makeTask(id: string, startMin: number, endMin: number): TodayTask {
	return {
		id,
		source: TASK_SOURCE_LOCAL,
		title: id,
		done: false,
		startMin,
		endMin,
		recur: 'none'
	};
}

describe('TodayComponent', () => {
	let component: TodayComponent;
	let fixture: ComponentFixture<TodayComponent>;

	beforeEach(async () => {
		const mockDb = jasmine.createSpyObj<DatabaseService>('DatabaseService', [
			'getReminderTableDetails',
			'getTodayItems',
			'saveTodayItems'
		]);
		mockDb.getReminderTableDetails.and.returnValue(of([]));
		mockDb.getTodayItems.and.resolveTo([]);
		mockDb.saveTodayItems.and.resolveTo();
		const mockDialog = jasmine.createSpyObj<DialogService>('DialogService', ['openDialog']);

		await TestBed.configureTestingModule({
			imports: [TodayComponent],
			providers: [
				{ provide: DatabaseService, useValue: mockDb },
				{ provide: DialogService, useValue: mockDialog }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(TodayComponent);
		component = fixture.componentInstance;
	});

	it('reflows the ghost and nearby blocks when the ghost lands on a busy span', () => {
		(component as any).tasks.set([makeTask('task-1', 60, 75), makeTask('task-2', 120, 150)]);
		(component as any).draggingBlockId.set('task-1');
		(component as any).draggingBlockLeftPercent = 0;
		(component as any).draggingBlockWidthPercent = 100;
		(component as any).dragMovePreview.set({ startMin: 120, endMin: 135 });

		const blocks = (component as any).timedBlocks();
		const first = blocks.find((block: any) => block.task.id === 'task-1');
		const second = blocks.find((block: any) => block.task.id === 'task-2');
		const preview = (component as any).dragMovePreviewPlacement();

		expect(first.widthPercent).toBe(100);
		expect(second.widthPercent).toBe(50);
		expect(preview.widthPercent).toBe(50);
	});

	it('expands the ghost to full width when it moves into open space', () => {
		(component as any).tasks.set([makeTask('task-1', 60, 75), makeTask('task-2', 120, 150)]);
		(component as any).draggingBlockId.set('task-1');
		(component as any).draggingBlockLeftPercent = 0;
		(component as any).draggingBlockWidthPercent = 100;
		(component as any).dragMovePreview.set({ startMin: 150, endMin: 165 });

		const blocks = (component as any).timedBlocks();
		const second = blocks.find((block: any) => block.task.id === 'task-2');
		const preview = (component as any).dragMovePreviewPlacement();

		expect(second.widthPercent).toBe(100);
		expect(preview.widthPercent).toBe(100);
	});

	it('keeps the original width when the ghost returns to its start slot', () => {
		(component as any).tasks.set([makeTask('task-1', 60, 75), makeTask('task-2', 120, 150)]);
		(component as any).draggingBlockId.set('task-1');
		(component as any).draggingBlockLeftPercent = 0;
		(component as any).draggingBlockWidthPercent = 100;
		(component as any).dragMovePreview.set({ startMin: 60, endMin: 75 });

		const blocks = (component as any).timedBlocks();
		const first = blocks.find((block: any) => block.task.id === 'task-1');
		const second = blocks.find((block: any) => block.task.id === 'task-2');
		const preview = (component as any).dragMovePreviewPlacement();

		expect(first.widthPercent).toBe(100);
		expect(second.widthPercent).toBe(100);
		expect(preview.leftPercent).toBe(0);
		expect(preview.widthPercent).toBe(100);
	});

	it('keeps the original row unchanged when the ghost moves away', () => {
		(component as any).tasks.set([makeTask('task-1', 60, 75), makeTask('task-2', 60, 75)]);
		(component as any).draggingBlockId.set('task-1');
		(component as any).draggingBlockLeftPercent = 0;
		(component as any).draggingBlockWidthPercent = 50;
		(component as any).dragMovePreview.set({ startMin: 120, endMin: 135 });

		const blocks = (component as any).timedBlocks();
		const first = blocks.find((block: any) => block.task.id === 'task-1');
		const second = blocks.find((block: any) => block.task.id === 'task-2');

		expect(first.widthPercent).toBe(50);
		expect(second.widthPercent).toBe(50);
	});

	it('keeps the dragged preview in the current slot until the next quarter-hour boundary', () => {
		expect((component as any).snapDragMoveMinutes(7)).toBe(0);
		expect((component as any).snapDragMoveMinutes(14.9)).toBe(0);
		expect((component as any).snapDragMoveMinutes(15)).toBe(15);
		expect((component as any).snapDragMoveMinutes(29.9)).toBe(15);
		expect((component as any).snapDragMoveMinutes(30)).toBe(30);
	});

	it('moves the ghost to the opposite side once the cursor crosses the block edge', () => {
		(component as any).tasks.set([makeTask('task-1', 60, 75), makeTask('task-2', 60, 75)]);
		(component as any).gridRef = {
			nativeElement: {
				getBoundingClientRect: () => ({ left: 0, width: 200 })
			}
		};
		(component as any).draggingBlockId.set('task-1');
		(component as any).draggingBlockLeftPercent = 0;
		(component as any).draggingBlockWidthPercent = 50;
		(component as any).dragMovePreview.set({ startMin: 60, endMin: 75 });
		(component as any).dragMoveClientX.set(120);

		const preview = (component as any).dragMovePreviewPlacement();
		const blocks = (component as any).timedBlocks();
		const second = blocks.find((block: any) => block.task.id === 'task-2');

		expect(preview.leftPercent).toBe(50);
		expect(preview.widthPercent).toBe(50);
		expect(second.leftPercent).toBe(0);
		expect(second.widthPercent).toBe(50);
	});

	it('focuses the pending name input after stopping a tracking session', fakeAsync(() => {
		const focusSpy = jasmine.createSpy('focus');
		(component as any).pendingInputRef = {
			nativeElement: {
				focus: focusSpy
			}
		};
		(component as any).tracking.set({ startMin: 60, startedAt: Date.now() });
		(component as any).nowMin.set(90);

		(component as any).stopTracking();
		tick();

		expect(focusSpy).toHaveBeenCalled();
	}));

	it('scrolls the calendar to the pending block after stopping a tracking session', fakeAsync(() => {
		const scrollToSpy = jasmine.createSpy('scrollTo');
		(component as any).calRef = {
			nativeElement: {
				scrollTo: scrollToSpy
			}
		};
		(component as any).pendingInputRef = {
			nativeElement: {
				focus: () => {}
			}
		};
		(component as any).tracking.set({ startMin: 120, startedAt: Date.now() });
		(component as any).nowMin.set(150);

		(component as any).stopTracking();
		tick();

		expect(scrollToSpy).toHaveBeenCalledWith({
			top: Math.max(0, (120 / 60) * 112 - 150),
			behavior: 'smooth'
		});
	}));
});
