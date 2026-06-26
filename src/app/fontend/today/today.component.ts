import {
	AfterViewInit,
	Component,
	ElementRef,
	Inject,
	OnDestroy,
	OnInit,
	PLATFORM_ID,
	ViewChild,
	computed,
	effect,
	signal
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Utilities } from '../../common/utilities/app.utilities';
import { DatabaseService } from '../../backend/database-service/database.service';
import { Subscription } from 'rxjs';
import {
	APP_LOCALE,
	KEY_ENTER,
	KEY_ESCAPE,
	TODAY_BTN_ADD,
	TODAY_BTN_DRAG_CREATE,
	TODAY_BTN_DRAG_MOVE,
	TODAY_BTN_START_TRACKING,
	TODAY_BTN_STOP_TRACKING,
	TODAY_EYEBROW,
	TODAY_HINT_DRAG_UNTIMED,
	TODAY_LABEL_AM,
	TODAY_LABEL_PM,
	TODAY_LABEL_REMINDERS,
	TODAY_LABEL_TASKS,
	TODAY_LABEL_TRACKED,
	TODAY_LOCAL_TASK_ID_PREFIX,
	TODAY_PENDING_HINT,
	TODAY_PENDING_PLACEHOLDER,
	TODAY_QUICKADD_PLACEHOLDER,
	TODAY_REMOVE_ANIMATION_MS,
	TODAY_SUBTITLE,
	TODAY_TITLE,
	TODAY_TRACKING_PREFIX,
	TODAY_TRACKING_VIRTUAL_ID
} from '../../common/app.constant';
import {
	BLOCK_MIN_HEIGHT_PX,
	BLOCK_SHORT_THRESHOLD_PX,
	MINIMUM_VISUAL_MINUTES,
	PIXELS_PER_HOUR,
	RANGE_BLOCK_MIN_HEIGHT_PX,
	TRACKED_TINY_MIN_HEIGHT_PX,
	TRACKED_TINY_THRESHOLD_MIN,
	RECUR_LABELS,
	SCROLL_AHEAD_PX,
	TASK_ACCENT_DONE,
	TASK_ACCENT_MAP,
	TASK_LEAD_ICON_DONE,
	TASK_LEAD_ICON_MAP,
	TASK_SOURCE_LOCAL,
	TASK_SOURCE_REMINDER,
	TASK_SOURCE_TRACKED,
	TodayTask,
	TodayTimedBlock,
	TodayTimeRange,
	TodayTracking
} from './today.model';

@Component({
	selector: 'today',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './today.component.html',
	styleUrls: ['../../common/glass-card.css', './today.component.css']
})
export class TodayComponent implements OnInit, AfterViewInit, OnDestroy {
	@ViewChild('container') private containerRef!: ElementRef<HTMLDivElement>;
	@ViewChild('cal') private calRef!: ElementRef<HTMLDivElement>;
	@ViewChild('grid') private gridRef!: ElementRef<HTMLDivElement>;
	@ViewChild('untimedZone') private untimedZoneRef!: ElementRef<HTMLDivElement>;
	@ViewChild('pendingInput') private pendingInputRef?: ElementRef<HTMLInputElement>;
	@ViewChild('editInput') private editInputRef?: ElementRef<HTMLInputElement>;

	/* ─────────────────────────────────────────
	   Constants re-exposed for the template
	───────────────────────────────────────── */
	protected readonly TODAY_EYEBROW = TODAY_EYEBROW;
	protected readonly TODAY_TITLE = TODAY_TITLE;
	protected readonly TODAY_SUBTITLE = TODAY_SUBTITLE;
	protected readonly TODAY_QUICKADD_PLACEHOLDER = TODAY_QUICKADD_PLACEHOLDER;
	protected readonly TODAY_BTN_ADD = TODAY_BTN_ADD;
	protected readonly TODAY_HINT_DRAG_UNTIMED = TODAY_HINT_DRAG_UNTIMED;
	protected readonly TODAY_PENDING_PLACEHOLDER = TODAY_PENDING_PLACEHOLDER;
	protected readonly TODAY_PENDING_HINT = TODAY_PENDING_HINT;
	protected readonly TODAY_LABEL_REMINDERS = TODAY_LABEL_REMINDERS;
	protected readonly TODAY_LABEL_TASKS = TODAY_LABEL_TASKS;
	protected readonly TODAY_LABEL_TRACKED = TODAY_LABEL_TRACKED;
	protected readonly TODAY_BTN_START_TRACKING = TODAY_BTN_START_TRACKING;
	protected readonly TODAY_BTN_STOP_TRACKING = TODAY_BTN_STOP_TRACKING;
	protected readonly TODAY_BTN_DRAG_CREATE = TODAY_BTN_DRAG_CREATE;
	protected readonly TODAY_BTN_DRAG_MOVE = TODAY_BTN_DRAG_MOVE;
	protected readonly TODAY_TRACKING_PREFIX = TODAY_TRACKING_PREFIX;
	protected readonly PIXELS_PER_HOUR = PIXELS_PER_HOUR;
	protected readonly TASK_SOURCE_LOCAL = TASK_SOURCE_LOCAL;
	protected readonly TASK_SOURCE_REMINDER = TASK_SOURCE_REMINDER;
	protected readonly TASK_SOURCE_TRACKED = TASK_SOURCE_TRACKED;

	/* ─────────────────────────────────────────
	   Static view data
	───────────────────────────────────────── */
	protected readonly hours: ReadonlyArray<number> = Array.from({ length: 24 }, (_, h) => h);

	protected readonly quarters: ReadonlyArray<{ qmin: number; q: number }> = (() => {
		const out: Array<{ qmin: number; q: number }> = [];
		for (let h = 0; h < 24; h++) {
			for (let q = 1; q <= 3; q++) {
				const qmin = h * 60 + q * 15;
				if (qmin < 24 * 60) out.push({ qmin, q });
			}
		}
		return out;
	})();

	/* ─────────────────────────────────────────
	   Reactive state
	───────────────────────────────────────── */
	protected readonly clock = signal('');
	protected readonly quickAddDraft = signal('');
	protected readonly editingId = signal<string | null>(null);
	protected readonly editingDraft = signal('');
	protected readonly isDragCreateEnabled = signal(false);
	protected readonly isDragMoveEnabled = signal(false);
	protected readonly dragMovePreview = signal<TodayTimeRange | null>(null);
	protected readonly dragCreateRange = signal<TodayTimeRange | null>(null);
	protected readonly pendingBlock = signal<TodayTimeRange | null>(null);
	protected readonly pendingName = signal('');
	protected readonly tracking = signal<TodayTracking | null>(null);
	private readonly nowMin = signal(8 * 60);
	private readonly draggingBlockId = signal<string | null>(null);
	private draggingBlockStartMin = 0;
	private draggingBlockEndMin = 0;
	protected readonly dragMoveClientX = signal<number | null>(null);
	protected readonly dragMoveClientY = signal<number | null>(null);
	protected readonly dragMoveIsOverUntimed = signal<boolean>(false);
	protected draggingBlockLeftPercent = 0;
	protected draggingBlockWidthPercent = 100;
	private readonly removingIds = signal<string[]>([]);
	private readonly pendingSource = signal<TodayTask['source'] | null>(null);
	private tasks = signal<TodayTask[]>([]);
	private remindersSub: Subscription | undefined;
	/** Live layout state for the dragged ghost and the blocks it reflows. */
	private readonly dragMoveLayoutState = computed(() => this.buildDragMoveLayoutState());
	/** Geometry of the dragged ghost while it is previewed. */
	protected readonly dragMovePreviewPlacement = computed(
		() => this.dragMoveLayoutState()?.previewPlacement ?? null
	);

	/* ─────────────────────────────────────────
	   Derived view-models
	───────────────────────────────────────── */

	/** True while a drag-move gesture is active. */
	protected readonly isDragMoveActive = computed(() => this.draggingBlockId() !== null);

	/** Title of the block currently being drag-moved, used in the floating ghost label. */
	protected readonly draggedTitle = computed(() => {
		const id = this.draggingBlockId();
		return id ? (this.tasks().find((t) => t.id === id)?.title ?? '') : '';
	});

	/** Timed task blocks with full layout and display data. */
	protected readonly timedBlocks = computed((): TodayTimedBlock[] => {
		const baseLayout = this.blockLayout();
		const liveLayout = this.dragMoveLayoutState()?.layoutMap ?? {};
		const draggingBlockId = this.draggingBlockId();
		return this.tasks()
			.filter((t) => t.startMin != null)
			.map((t) => {
				const isDone = t.source === TASK_SOURCE_LOCAL && t.done;
				const isDragging = draggingBlockId === t.id;
				const pos = liveLayout[t.id] ?? baseLayout[t.id] ?? { col: 0, total: 1 };
				const top = this.minutesToPixels(t.startMin!);
				const isTiny =
					t.source === TASK_SOURCE_TRACKED &&
					t.endMin != null &&
					t.endMin - t.startMin! < TRACKED_TINY_THRESHOLD_MIN;
				const endMin = isTiny ? t.endMin! : (t.endMin ?? t.startMin! + MINIMUM_VISUAL_MINUTES);
				const minHeight = isTiny ? TRACKED_TINY_MIN_HEIGHT_PX : BLOCK_MIN_HEIGHT_PX;
				const height = Math.max(minHeight, ((endMin - t.startMin!) / 60) * PIXELS_PER_HOUR - 2);
				const widthPercent = 100 / pos.total;
				const leftPercent = pos.col * widthPercent;
				return {
					task: t,
					isDragging,
					isRemoving: this.removingIds().includes(t.id),
					accent: isDone ? TASK_ACCENT_DONE : TASK_ACCENT_MAP[t.source],
					top,
					height,
					widthPercent,
					leftPercent,
					isShort: height < BLOCK_SHORT_THRESHOLD_PX,
					isTiny,
					isNarrow: pos.total > 1,
					draggable:
						t.source === TASK_SOURCE_LOCAL &&
						this.isDragMoveEnabled(),
					isEditing: this.editingId() === t.id,
					leadIcon: isDone ? TASK_LEAD_ICON_DONE : TASK_LEAD_ICON_MAP[t.source],
					timeLabel: this.formatMinutes(t.startMin!) + ' – ' + this.formatMinutes(endMin),
					durationLabel: this.formatDuration(endMin - t.startMin!),
					hasRecurrence: t.recur !== 'none',
					recurrenceLabel: RECUR_LABELS[t.recur] ?? ''
				};
			});
	});

	/** Untimed local tasks shown in the anytime lane. */
	protected readonly untimedTasks = computed(() =>
		this.tasks().filter((t) => t.source === TASK_SOURCE_LOCAL && t.startMin == null)
	);

	/** Pixel top offset of the current-time indicator. */
	protected readonly nowLineTop = computed(() =>
		Math.max(0, Math.min(24 * PIXELS_PER_HOUR, this.minutesToPixels(this.nowMin())))
	);

	/** Pixel top offset of the live tracking band. */
	protected readonly trackBandTop = computed(() => {
		const track = this.tracking();
		return track ? this.minutesToPixels(track.startMin) : 0;
	});

	/** Pixel height of the live tracking band. */
	protected readonly trackBandHeight = computed(() => {
		const track = this.tracking();
		return track
			? Math.max(2, this.minutesToPixels(this.nowMin()) - this.minutesToPixels(track.startMin))
			: 0;
	});

	/** CSS left value for the live tracking band, adjusted for column overlap. */
	protected readonly trackBandLeft = computed(() =>
		this.colLeft(this.blockLayoutResult().trackingPos)
	);

	/** CSS width value for the live tracking band, adjusted for column overlap. */
	protected readonly trackBandWidth = computed(() =>
		this.colWidth(this.blockLayoutResult().trackingPos)
	);

	/** CSS left value for the pending name-entry block, adjusted for column overlap. */
	protected readonly pendingBlockLeft = computed(() =>
		this.colLeft(this.blockLayoutResult().pendingBlockPos)
	);

	/** CSS width value for the pending name-entry block, adjusted for column overlap. */
	protected readonly pendingBlockWidth = computed(() =>
		this.colWidth(this.blockLayoutResult().pendingBlockPos)
	);

	/** Elapsed time string, updated every second via the nowMin signal. */
	protected readonly trackElapsedLabel = computed(() => {
		const _ = this.nowMin();
		const track = this.tracking();
		return track ? this.formatElapsed((Date.now() - track.startedAt) / 1000) : '';
	});

	/** Returns true when the pending block was created by stopping a tracking session. */
	protected readonly isPendingFromTracking = computed(() => this.pendingSource() === TASK_SOURCE_TRACKED);

	/** Formatted current date, updated every second via the clock signal. */
	protected readonly dateLabel = computed(() => {
		const _ = this.clock();
		return new Date().toLocaleDateString(APP_LOCALE, { weekday: 'long', month: 'long', day: 'numeric' });
	});

	/**
	 * Builds column layout for all timed tasks, injecting a virtual ghost entry for the live
	 * tracking band or the pending name-entry block when either is active.
	 * The ghost uses its actual time range so only genuinely overlapping tasks are displaced.
	 *
	 * @returns The per-task layout map, the tracking band placement, and the pending block placement.
	 */
	private readonly blockLayoutResult = computed((): {
		taskLayout: Record<string, { col: number; total: number }>;
		trackingPos: { col: number; total: number } | null;
		pendingBlockPos: { col: number; total: number } | null;
	} => {
		const tracking = this.tracking();
		const pending = this.pendingBlock();
		const entries = this.tasks()
			.filter((t) => t.startMin != null)
			.map((task) => ({ task, isGhost: false as const }));
		const ghostRange = tracking
			? { startMin: tracking.startMin, endMin: this.nowMin() }
			: pending ?? null;
		if (ghostRange) {
			const result = this.buildTimedLayout([
				{ task: this.buildVirtualTask(ghostRange.startMin, ghostRange.endMin), isGhost: true },
				...entries,
			]);
			return {
				taskLayout: result.layoutMap,
				trackingPos: tracking ? result.ghostPlacement : null,
				pendingBlockPos: pending ? result.ghostPlacement : null,
			};
		}
		return { taskLayout: this.buildTimedLayout(entries).layoutMap, trackingPos: null, pendingBlockPos: null };
	});

	/** Column layout positions for all timed blocks, using visual-extent packing. */
	private readonly blockLayout = computed(() => this.blockLayoutResult().taskLayout);

	private clockInterval: ReturnType<typeof setInterval> | undefined;
	private currentDateStr = '';
	private dragCreateStartMinute = 0;
	private dragCleanup: (() => void) | null = null;

	/** Focuses the edit input whenever an untimed chip enters edit mode. */
	protected readonly focusEditInput = effect(() => {
		const id = this.editingId();
		if (id) {
			setTimeout(() => this.editInputRef?.nativeElement?.focus());
		}
	});

	/** Focuses the pending block input whenever a new pending block is created. */
	protected readonly focusPendingInput = effect(() => {
		const block = this.pendingBlock();
		if (block) {
			setTimeout(() => {
				this.pendingInputRef?.nativeElement?.focus();
				if (this.pendingSource() === TASK_SOURCE_TRACKED) {
					const calEl = this.calRef?.nativeElement;
					if (calEl) {
						const top = this.minutesToPixels(block.startMin);
						const targetScroll = Math.max(0, top - SCROLL_AHEAD_PX);
						calEl.scrollTo({ top: targetScroll, behavior: 'smooth' });
					}
				}
			});
		}
	});

	constructor(
		@Inject(PLATFORM_ID) private readonly platformId: object,
		private readonly databaseService: DatabaseService
	) {}

	/**
	 * Starts the clock tick, subscribes to today's reminders, and schedules a
	 * 1-second interval to keep the clock current.
	 */
	ngOnInit(): void {
		this.tick();
		this.clockInterval = setInterval(() => this.tick(), 1000);
		if (isPlatformBrowser(this.platformId)) {
			this.refreshReminderSub();
		}
	}

	/**
	 * Scrolls the calendar to the current time and attaches the auto-hide scrollbar.
	 */
	ngAfterViewInit(): void {
		const calEl = this.calRef?.nativeElement;
		if (calEl) {
			Utilities.attachScrollAutoHide(calEl);
			const now = new Date();
			const nowMinutes = now.getHours() * 60 + now.getMinutes();
			calEl.scrollTop = Math.max(0, this.minutesToPixels(nowMinutes) - SCROLL_AHEAD_PX);
			calEl.dispatchEvent(new Event('scroll'));
		}
	}

	/**
	 * Clears the clock interval, unsubscribes from the reminders stream, and removes
	 * any active drag event listeners.
	 */
	ngOnDestroy(): void {
		clearInterval(this.clockInterval);
		this.remindersSub?.unsubscribe();
		this.dragCleanup?.();
	}

	/* ─────────────────────────────────────────
	   Quick-add / untimed task actions
	───────────────────────────────────────── */

	/**
	 * Adds a new untimed local task from the quick-add input when Enter is pressed.
	 *
	 * @param event - The keyboard event from the quick-add input.
	 */
	protected onQuickAddKeyDown(event: KeyboardEvent): void {
		if (event.key !== KEY_ENTER) return;
		this.addUntimed();
	}

	/**
	 * Adds a new untimed local task from the current quick-add draft value.
	 * Clears the input on success.
	 */
	protected addUntimed(): void {
		const title = this.quickAddDraft().trim();
		if (!title) return;
		this.tasks.update((ts) => [
			...ts,
			{
				id: TODAY_LOCAL_TASK_ID_PREFIX + Date.now(),
				source: TASK_SOURCE_LOCAL,
				title,
				done: false,
				startMin: null,
				endMin: null,
				recur: 'none'
			}
		]);
		this.quickAddDraft.set('');
	}

	/**
	 * Toggles the done state of a local task.
	 *
	 * @param id - The ID of the task to toggle.
	 */
	protected toggleTaskDone(id: string): void {
		this.tasks.update((ts) =>
			ts.map((t) => (t.id === id && t.source === TASK_SOURCE_LOCAL ? { ...t, done: !t.done } : t))
		);
	}

	/**
	 * Removes a task with an exit animation.
	 *
	 * @param id - The ID of the task to remove (reminders cannot be removed).
	 */
	protected removeTask(id: string): void {
		this.removingIds.update((r) => [...r, id]);
		setTimeout(() => {
			this.tasks.update((ts) => ts.filter((t) => !(t.id === id && t.source !== TASK_SOURCE_REMINDER)));
			this.removingIds.update((r) => r.filter((x) => x !== id));
		}, TODAY_REMOVE_ANIMATION_MS);
	}

	/* ─────────────────────────────────────────
	   Block edit actions
	───────────────────────────────────────── */

	/**
	 * Begins inline editing of a block's title.
	 *
	 * @param id - The ID of the block to edit.
	 * @param title - The current title pre-populated into the edit input.
	 */
	protected beginBlockEdit(id: string, title: string): void {
		this.editingId.set(id);
		this.editingDraft.set(title);
	}

	/**
	 * Saves the current edit draft to the task and closes the edit field.
	 * Falls back to the previous title if the draft is empty.
	 */
	protected saveBlockEdit(): void {
		const id = this.editingId();
		const value = this.editingDraft().trim();
		this.tasks.update((ts) => ts.map((t) => (t.id === id ? { ...t, title: value || t.title } : t)));
		this.clearBlockEdit();
	}

	/**
	 * Cancels the current block edit without saving.
	 */
	protected cancelBlockEdit(): void {
		this.clearBlockEdit();
	}

	/* ─────────────────────────────────────────
	   Drag-to-create actions
	───────────────────────────────────────── */

	/**
	 * Starts a drag-to-create gesture on the calendar grid.
	 * Attaches temporary mousemove/mouseup listeners that update the creating range.
	 *
	 * @param event - The mousedown event on the grid.
	 */
	protected onGridDragCreate(event: MouseEvent): void {
		if (!this.isDragCreateEnabled()) return;
		if ((event.target as Element).closest?.('.tp-block')) return;
		if (this.pendingBlock()) {
			this.cancelPendingBlock();
			return;
		}
		if (this.dragCreateRange()) {
			this.dragCreateRange.set(null);
			return;
		}

		const cal = this.calRef.nativeElement;
		const grid = this.gridRef.nativeElement;
		const startMin = Math.max(
			0,
			Math.min(
				24 * 60 - 15,
				this.snapDragMoveMinutes(
					((event.clientY - grid.getBoundingClientRect().top) / PIXELS_PER_HOUR) * 60
				)
			)
		);
		this.dragCreateStartMinute = startMin;
		this.dragCreateRange.set({ startMin, endMin: startMin + 15 });

		const onMouseMove = (moveEvent: MouseEvent) => {
			const relY = moveEvent.clientY - grid.getBoundingClientRect().top;
			const endMin = Math.max(
				this.dragCreateStartMinute + 15,
				Math.min(24 * 60, this.snapMinutes((relY / PIXELS_PER_HOUR) * 60))
			);
			const current = this.dragCreateRange();
			if (current) this.dragCreateRange.set({ startMin: current.startMin, endMin });
		};
		const onMouseUp = () => {
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
			this.dragCleanup = null;
			const range = this.dragCreateRange();
			if (range && range.endMin - range.startMin >= 15) {
				this.dragCreateRange.set(null);
				this.pendingBlock.set(range);
				this.pendingName.set('');
			} else {
				this.dragCreateRange.set(null);
			}
		};
		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
		this.dragCleanup = () => {
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
		};
	}

	/**
	 * Saves the pending block as a new task using the current pending name and source.
	 * Clears the pending state if the name is empty.
	 */
	protected savePendingBlock(): void {
		const block = this.pendingBlock();
		if (!block) return;
		const name = this.pendingName().trim();
		if (!name) {
			this.clearPendingState();
			return;
		}
		const source = this.pendingSource() ?? TASK_SOURCE_LOCAL;
		this.tasks.update((ts) => [
			...ts,
			{
				id: TODAY_LOCAL_TASK_ID_PREFIX + Date.now(),
				source,
				title: name,
				done: false,
				startMin: block.startMin,
				endMin: block.endMin,
				recur: 'none'
			}
		]);
		this.clearPendingState();
	}

	/**
	 * Cancels the pending block and any in-progress drag-create gesture.
	 */
	protected cancelPendingBlock(): void {
		this.clearPendingState();
		this.dragCreateRange.set(null);
	}

	/**
	 * Handles Enter/Escape key presses in the pending block name input.
	 *
	 * @param event - The keyboard event from the pending name input.
	 */
	protected onPendingNameKeyDown(event: KeyboardEvent): void {
		if (event.key === KEY_ENTER) this.savePendingBlock();
		else if (event.key === KEY_ESCAPE) this.cancelPendingBlock();
	}

	/* ─────────────────────────────────────────
	   Live tracking actions
	───────────────────────────────────────── */

	/**
	 * Starts a live tracking session anchored to the current minute.
	 * Has no effect if a session is already active.
	 */
	protected beginTracking(): void {
		if (this.tracking()) return;
		this.tracking.set({ startMin: this.nowMin(), startedAt: Date.now() });
		this.pendingBlock.set(null);
		this.dragCreateRange.set(null);
	}

	/**
	 * Stops the active tracking session and opens a pending block so the user can name the interval.
	 * Has no effect if no session is active.
	 */
	protected stopTracking(): void {
		const track = this.tracking();
		if (!track) return;
		const startMin = Math.round(track.startMin);
		let endMin = Math.round(this.nowMin());
		if (endMin <= startMin) endMin = startMin + 1;
		this.tracking.set(null);
		this.pendingSource.set(TASK_SOURCE_TRACKED);
		this.pendingBlock.set({ startMin, endMin });
		this.pendingName.set('');
	}

	/* ─────────────────────────────────────────
	   Block resize actions
	───────────────────────────────────────── */

	/**
	 * Starts a pointer-driven resize of a local task block.
	 * Attaches temporary mousemove/mouseup listeners and updates endMin live.
	 *
	 * @param id - The ID of the block being resized.
	 * @param event - The mousedown event on the resize handle.
	 */
	protected onBlockResizeStart(id: string, event: MouseEvent): void {
		event.stopPropagation();
		event.preventDefault();
		const task = this.tasks().find((t) => t.id === id);
		if (!task || task.startMin == null) return;
		const startMin = task.startMin;
		const cal = this.calRef.nativeElement;

		const onMouseMove = (moveEvent: MouseEvent) => {
			const calRect = cal.getBoundingClientRect();
			const relY = moveEvent.clientY - calRect.top + cal.scrollTop;
			const endMin = Math.max(
				startMin + 15,
				Math.min(24 * 60, this.snapMinutes((relY / PIXELS_PER_HOUR) * 60))
			);
			this.tasks.update((ts) =>
				ts.map((t) => (t.id === id && t.source !== TASK_SOURCE_REMINDER ? { ...t, endMin } : t))
			);
		};
		const onMouseUp = () => {
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
			this.dragCleanup = null;
		};
		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
		this.dragCleanup = () => {
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
		};
	}

	/* ─────────────────────────────────────────
	   Drag-to-move (pointer) actions
	───────────────────────────────────────── */

	/**
	 * Starts a pointer-driven move of a local or tracked task block.
	 * Attaches temporary mousemove and mouseup listeners to update the preview live and commit on release.
	 * Stops propagation so the grid's drag-create handler does not fire simultaneously.
	 *
	 * @param event - The mousedown event on the block.
	 * @param id - The ID of the block being moved.
	 */
	protected onBlockMoveStart(event: MouseEvent, id: string): void {
		event.preventDefault();
		event.stopPropagation();
		const task = this.tasks().find((t) => t.id === id);
		if (!task) return;
		const duration = task.startMin != null ? task.endMin! - task.startMin : 60;
		const cal = this.calRef.nativeElement;
		const layout = this.timedBlocks().find((b) => b.task.id === id);
		this.draggingBlockStartMin = task.startMin ?? 0;
		this.draggingBlockEndMin = task.endMin ?? this.draggingBlockStartMin + duration;
		this.draggingBlockLeftPercent = layout?.leftPercent ?? 0;
		this.draggingBlockWidthPercent = layout?.widthPercent ?? 100;
		this.draggingBlockId.set(id);

		const getStartMinute = (e: MouseEvent): number => {
			const relY = e.clientY - cal.getBoundingClientRect().top + cal.scrollTop;
			return Math.max(0, Math.min(24 * 60 - 15, this.snapDragMoveMinutes((relY / PIXELS_PER_HOUR) * 60)));
		};

		const onMouseMove = (moveEvent: MouseEvent) => {
			const calRect = cal.getBoundingClientRect();
			const isAboveCal = moveEvent.clientY < calRect.top;
			const cRect = this.containerRef.nativeElement.getBoundingClientRect();
			this.dragMoveClientX.set(moveEvent.clientX - cRect.left);
			this.dragMoveClientY.set(moveEvent.clientY - cRect.top);
			this.dragMoveIsOverUntimed.set(isAboveCal);
			if (isAboveCal) return;
			let start = getStartMinute(moveEvent);
			let end = start + duration;
			if (end > 1440) {
				end = 1440;
				start = end - duration;
			}
			const preview = this.dragMovePreview();
			if (!preview || preview.startMin !== start) {
				this.dragMovePreview.set({ startMin: start, endMin: end });
			}
		};

		const onMouseUp = (upEvent: MouseEvent) => {
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
			this.dragCleanup = null;
			const untimedEl = this.untimedZoneRef?.nativeElement;
			if (untimedEl) {
				const rect = untimedEl.getBoundingClientRect();
				if (
					upEvent.clientX >= rect.left &&
					upEvent.clientX <= rect.right &&
					upEvent.clientY >= rect.top &&
					upEvent.clientY <= rect.bottom
				) {
					this.tasks.update((ts) =>
						ts.map((t) =>
							t.id === id && t.source === TASK_SOURCE_LOCAL
								? { ...t, startMin: null, endMin: null }
								: t
						)
					);
					this.draggingBlockId.set(null);
					this.dragMoveClientX.set(null);
					this.dragMoveClientY.set(null);
					this.dragMoveIsOverUntimed.set(false);
					this.dragMovePreview.set(null);
					return;
				}
			}
			const newStart = getStartMinute(upEvent);
			this.rescheduleDraggedBlock(id, newStart, upEvent.clientX);
			this.draggingBlockId.set(null);
			this.dragMoveClientX.set(null);
			this.dragMoveClientY.set(null);
			this.dragMoveIsOverUntimed.set(false);
			this.dragMovePreview.set(null);
		};

		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
		this.dragCleanup = () => {
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
		};
	}

	/* ─────────────────────────────────────────
	   Toggle actions
	───────────────────────────────────────── */

	/**
	 * Toggles the drag-to-create mode. Disables drag-to-move when enabling, and cancels any in-progress gesture.
	 */
	protected onDragCreateChange(): void {
		const enabling = !this.isDragCreateEnabled();
		this.isDragCreateEnabled.set(enabling);
		if (enabling) {
			this.isDragMoveEnabled.set(false);
			this.draggingBlockId.set(null);
			this.dragMovePreview.set(null);
		}
		this.dragCreateRange.set(null);
		this.pendingBlock.set(null);
		this.pendingName.set('');
	}

	/**
	 * Toggles the drag-to-move mode. Disables drag-to-create when enabling, and clears any in-progress state.
	 */
	protected onDragMoveChange(): void {
		const enabling = !this.isDragMoveEnabled();
		this.isDragMoveEnabled.set(enabling);
		if (enabling) {
			this.isDragCreateEnabled.set(false);
			this.dragCreateRange.set(null);
			this.pendingBlock.set(null);
			this.pendingName.set('');
		}
		this.dragCleanup?.();
		this.dragCleanup = null;
		this.draggingBlockId.set(null);
		this.dragMoveClientX.set(null);
		this.dragMoveClientY.set(null);
		this.dragMoveIsOverUntimed.set(false);
		this.dragMovePreview.set(null);
	}

	/* ─────────────────────────────────────────
	   Private helpers
	───────────────────────────────────────── */

	/**
	 * Resets the block-edit signals to their idle state.
	 */
	private clearBlockEdit(): void {
		this.editingId.set(null);
		this.editingDraft.set('');
	}

	/**
	 * Resets the pending-block signals to their idle state.
	 */
	private clearPendingState(): void {
		this.pendingBlock.set(null);
		this.pendingName.set('');
		this.pendingSource.set(null);
	}

	/**
	 * Updates the clock signal and the current-minute signal from the real wall clock.
	 * When the date changes past midnight, re-subscribes to reminders for the new day.
	 */
	private tick(): void {
		const now = new Date();
		this.clock.set(now.toLocaleTimeString(APP_LOCALE, { hour: 'numeric', minute: '2-digit' }));
		this.nowMin.set(now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60);
		const newDateStr = Utilities.formatDateForStorage(now);
		if (this.currentDateStr && newDateStr !== this.currentDateStr) {
			this.refreshReminderSub();
		}
	}

	/**
	 * Unsubscribes any existing reminder stream, sets the current date string,
	 * then opens a fresh subscription filtered to today's date only.
	 */
	private refreshReminderSub(): void {
		this.remindersSub?.unsubscribe();
		this.currentDateStr = Utilities.formatDateForStorage(new Date());
		this.remindersSub = this.databaseService.getReminderTableDetails().subscribe((records) => {
			const reminderTasks: TodayTask[] = records
				.filter((r) => {
					const recDate = r.date != null ? Utilities.coerceDateToString(r.date) : null;
					return recDate === this.currentDateStr;
				})
				.map((r) => ({
					id: r.key ?? '',
					source: TASK_SOURCE_REMINDER,
					title: r.text ?? '',
					done: false,
					startMin: r.startTime ? Utilities.parseTimeToMinutes(r.startTime as string) : null,
					endMin: r.endTime ? Utilities.parseTimeToMinutes(r.endTime as string) : null,
					recur: 'none' as const
				}));
			this.tasks.update((ts) => [
				...ts.filter((t) => t.source !== TASK_SOURCE_REMINDER),
				...reminderTasks
			]);
		});
	}

	/**
	 * Snaps a minute value to the nearest 15-minute interval.
	 *
	 * @param minutes - The raw minute value to snap.
	 * @returns The nearest multiple of 15.
	 */
	private snapMinutes(minutes: number): number {
		return Math.round(minutes / 15) * 15;
	}

	/**
	 * Floors a minute value to the lower 15-minute slot boundary.
	 * Used for drag-move previews and drag-create start positions so the
	 * clicked time is always contained within the resulting block.
	 *
	 * @param minutes - The raw minute value to floor.
	 * @returns The lower 15-minute boundary.
	 */
	private snapDragMoveMinutes(minutes: number): number {
		return Math.floor(minutes / 15) * 15;
	}

	/**
	 * Converts a column position into the CSS left value used by overlay elements.
	 *
	 * @param pos - The column position, or null when the element takes full width.
	 * @returns The calc() string for the CSS left property.
	 */
	private colLeft(pos: { col: number; total: number } | null): string {
		const leftPercent = pos ? pos.col * (100 / pos.total) : 0;
		return `calc(${leftPercent}% + 4px)`;
	}

	/**
	 * Converts a column position into the CSS width value used by overlay elements.
	 *
	 * @param pos - The column position, or null when the element takes full width.
	 * @returns The calc() string for the CSS width property.
	 */
	private colWidth(pos: { col: number; total: number } | null): string {
		const widthPercent = pos ? 100 / pos.total : 100;
		return `calc(${widthPercent}% - 8px)`;
	}

	/**
	 * Builds a synthetic tracked task used as a ghost in the column layout engine.
	 *
	 * @param startMin - The start minute of the ghost range.
	 * @param endMin - The end minute of the ghost range.
	 * @returns A TodayTask configured as a layout ghost with sentinel ord and ID.
	 */
	private buildVirtualTask(startMin: number, endMin: number): TodayTask {
		return {
			id: TODAY_TRACKING_VIRTUAL_ID,
			source: TASK_SOURCE_TRACKED,
			title: '',
			done: false,
			startMin,
			endMin,
			recur: 'none',
			ord: -1e9,
		};
	}

	/**
	 * Gets the visual end minute of a task for layout overlap detection.
	 * Tracked tasks with an explicit end use their real end time; all others are padded to
	 * MINIMUM_VISUAL_MINUTES so short blocks (rendered at BLOCK_MIN_HEIGHT_PX) protect their column slot.
	 *
	 * @param task - The task whose visual end minute is needed.
	 * @returns The effective end minute used for cluster and column placement.
	 */
	private visualEndMinute(task: TodayTask): number {
		const start = task.startMin ?? 0;
		if (task.source === TASK_SOURCE_TRACKED && task.endMin != null) {
			return task.endMin;
		}
		const end = task.endMin ?? start;
		return Math.max(end, start + MINIMUM_VISUAL_MINUTES);
	}

	/**
	 * Returns true when the drag cursor is still inside the original block bounds.
	 *
	 * @param clientX - The viewport X coordinate of the cursor during the drag.
	 * @returns True when the cursor remains inside the original block footprint.
	 */
	private isCursorWithinOriginalBlock(clientX: number): boolean {
		const grid = this.gridRef?.nativeElement;
		if (!grid) return false;
		const rect = grid.getBoundingClientRect();
		const left = rect.left + rect.width * (this.draggingBlockLeftPercent / 100);
		const right = left + rect.width * (this.draggingBlockWidthPercent / 100);
		return clientX >= left && clientX <= right;
	}

	/**
	 * Computes the live insertion slot for the ghost among overlapping peers.
	 *
	 * @param peers - The overlapping peer blocks excluding the dragged block.
	 * @param clientX - The viewport X coordinate of the cursor during the drag.
	 * @returns The slot index that the ghost should occupy.
	 */
	private resolveGhostSlot(peers: TodayTask[], clientX: number | null): number {
		const grid = this.gridRef?.nativeElement;
		if (!grid || clientX == null || !peers.length) return 0;
		const rect = grid.getBoundingClientRect();
		const columnCount = peers.length + 1;
		const columnWidth = rect.width / columnCount;
		let slot = Math.round((clientX - rect.left) / columnWidth - 0.5);
		return Math.max(0, Math.min(peers.length, slot));
	}

	/**
	 * Collects the timed task IDs that overlap the ghost preview span.
	 *
	 * @param startMin - The snapped ghost start minute.
	 * @param endMin - The snapped ghost end minute.
	 * @param draggedId - The ID of the task currently being dragged.
	 * @returns The overlapping task IDs that should reflow with the ghost.
	 */
	private collectGhostOverlapIds(startMin: number, endMin: number, draggedId: string): string[] {
		const ghostEnd = Math.max(endMin, startMin + MINIMUM_VISUAL_MINUTES);
		const tasks = this.tasks().filter((t) => t.id !== draggedId && t.startMin != null);
		const selected = new Set<string>();
		const queue: TodayTask[] = [];

		const overlaps = (aStart: number, aEnd: number, b: TodayTask): boolean =>
			aStart < this.visualEndMinute(b) && b.startMin! < aEnd;

		// Step 1: Seed — collect tasks that directly overlap the ghost span
		tasks.forEach((task) => {
			if (overlaps(startMin, ghostEnd, task)) {
				selected.add(task.id);
				queue.push(task);
			}
		});

		// Step 2: BFS — expand to transitive overlaps (tasks that overlap a seeded task)
		while (queue.length) {
			const current = queue.shift()!;
			const currentEnd = this.visualEndMinute(current);
			tasks.forEach((task) => {
				if (!selected.has(task.id) && overlaps(current.startMin!, currentEnd, task)) {
					selected.add(task.id);
					queue.push(task);
				}
			});
		}

		return [...selected];
	}

	/**
	 * Packs timed entries into overlap columns and keeps track of the ghost entry placement.
	 *
	 * @param entries - The timed entries to pack into column groups.
	 * @returns The packed real-task layout and optional ghost placement.
	 */
	private buildTimedLayout(entries: Array<{ task: TodayTask; isGhost: boolean }>): {
		layoutMap: Record<string, { col: number; total: number }>;
		ghostPlacement: { col: number; total: number } | null;
	} {
		const layoutMap: Record<string, { col: number; total: number }> = {};
		const timedEntries = [...entries].sort((a, b) => a.task.startMin! - b.task.startMin!);
		let cluster: Array<{ task: TodayTask; isGhost: boolean }> = [];
		let clusterEndMinute = -1;
		let ghostPlacement: { col: number; total: number } | null = null;

		const flushCluster = (): void => {
			const sorted = [...cluster].sort(
				(a, b) => (a.task.ord ?? a.task.startMin!) - (b.task.ord ?? b.task.startMin!)
			);
			const columnEnds: number[] = [];
			sorted.forEach((entry) => {
				let col = columnEnds.findIndex((end) => entry.task.startMin! >= end);
				if (col < 0) {
					col = columnEnds.length;
					columnEnds.push(this.visualEndMinute(entry.task));
				} else {
					columnEnds[col] = this.visualEndMinute(entry.task);
				}
				if (entry.isGhost) ghostPlacement = { col, total: 1 };
				else layoutMap[entry.task.id] = { col, total: 1 };
			});
			const columnCount = columnEnds.length;
			sorted.forEach((entry) => {
				if (entry.isGhost) {
					if (ghostPlacement) ghostPlacement = { col: ghostPlacement.col, total: columnCount };
				} else {
					layoutMap[entry.task.id] = { col: layoutMap[entry.task.id].col, total: columnCount };
				}
			});
		};

		timedEntries.forEach((entry) => {
			if (cluster.length && entry.task.startMin! >= clusterEndMinute) {
				flushCluster();
				cluster = [];
				clusterEndMinute = -1;
			}
			cluster.push(entry);
			clusterEndMinute = Math.max(clusterEndMinute, this.visualEndMinute(entry.task));
		});
		if (cluster.length) flushCluster();

		return { layoutMap, ghostPlacement };
	}

	/**
	 * Builds the live layout state for the dragged ghost and the blocks it reflows.
	 *
	 * @returns The live layout map and preview geometry when a drag ghost is active.
	 */
	private buildDragMoveLayoutState(): {
		layoutMap: Record<string, { col: number; total: number }>;
		previewPlacement: {
			top: number;
			height: number;
			leftPercent: number;
			widthPercent: number;
		} | null;
	} | null {
		// Step 1: Guard — bail early when no drag is active
		const draggedId = this.draggingBlockId();
		const preview = this.dragMovePreview();
		const clientX = this.dragMoveClientX();
		if (!draggedId || !preview) return null;
		const dragged = this.tasks().find((t) => t.id === draggedId);
		if (!dragged) return null;
		const isUntimed = dragged.startMin == null;

		// Step 2: At-origin shortcut — ghost hasn't moved yet; reuse the committed layout as-is
		// Untimed tasks have no calendar origin, so skip this shortcut for them.
		const isAtOrigin =
			!isUntimed &&
			preview.startMin === this.draggingBlockStartMin &&
			preview.endMin === this.draggingBlockEndMin &&
			(clientX == null || this.isCursorWithinOriginalBlock(clientX));
		if (isAtOrigin) {
			return {
				layoutMap: this.blockLayout(),
				previewPlacement: {
					top: this.minutesToPixels(preview.startMin),
					height: this.previewBlockHeight(preview),
					leftPercent: this.draggingBlockLeftPercent,
					widthPercent: this.draggingBlockWidthPercent
				}
			};
		}

		// Step 3: No-overlap shortcut — ghost is alone in its slot; full-width single column
		const overlapIds = this.collectGhostOverlapIds(preview.startMin, preview.endMin, draggedId);
		if (!overlapIds.length) {
			return {
				layoutMap: {},
				previewPlacement: {
					top: this.minutesToPixels(preview.startMin),
					height: this.previewBlockHeight(preview),
					leftPercent: 0,
					widthPercent: 100
				}
			};
		}

		// Step 4: Full reflow — pack ghost alongside its overlapping peers and derive placement
		const overlapSet = new Set(overlapIds);
		const overlapTasks = this.tasks()
			.filter((t) => overlapSet.has(t.id))
			.sort((a, b) => (a.ord ?? a.startMin!) - (b.ord ?? b.startMin!));
		const ghostOrd = (() => {
			const slot = this.resolveGhostSlot(overlapTasks, clientX);
			const orderKey = (t: TodayTask) => t.ord ?? t.startMin!;
			if (!overlapTasks.length) return preview.startMin;
			if (slot <= 0) return orderKey(overlapTasks[0]) - 1;
			if (slot >= overlapTasks.length) return orderKey(overlapTasks[overlapTasks.length - 1]) + 1;
			return (orderKey(overlapTasks[slot - 1]) + orderKey(overlapTasks[slot])) / 2;
		})();
		const overlapEntries = overlapTasks.map((task) => ({ task, isGhost: false }));
		const layoutState = this.buildTimedLayout([
			...overlapEntries,
			{
				task: { ...dragged, startMin: preview.startMin, endMin: preview.endMin, ord: ghostOrd },
				isGhost: true
			}
		]);
		const ghostPlacement = layoutState.ghostPlacement;
		if (!ghostPlacement) return null;

		return {
			layoutMap: layoutState.layoutMap,
			previewPlacement: {
				top: this.minutesToPixels(preview.startMin),
				height: this.previewBlockHeight(preview),
				leftPercent: (ghostPlacement.col * 100) / ghostPlacement.total,
				widthPercent: 100 / ghostPlacement.total
			}
		};
	}

	/**
	 * Reschedules a dragged block to a new start time, computing its column order
	 * from the drop X position relative to overlapping peers.
	 *
	 * @param id - The ID of the block to reschedule.
	 * @param newStart - The snapped start minute for the new position.
	 * @param clientX - The viewport X coordinate of the drop, used for column placement.
	 */
	private rescheduleDraggedBlock(id: string, newStart: number, clientX: number | null): void {
		// Step 1: Guard and compute the clamped time range (preserves original duration)
		const allTasks = this.tasks();
		const target = allTasks.find((t) => t.id === id);
		if (!target || target.source === TASK_SOURCE_REMINDER) return;
		const duration = target.startMin != null ? target.endMin! - target.startMin : 60;
		let start = newStart,
			end = start + duration;
		if (end > 1440) {
			end = 1440;
			start = end - duration;
		}

		// Step 2: Collect overlapping peers and resolve the column slot from drop position
		const orderKey = (t: TodayTask) => t.ord ?? t.startMin!;
		const visualEnd = Math.max(end, start + MINIMUM_VISUAL_MINUTES);
		const peers = allTasks
			.filter(
				(t) =>
					t.id !== id &&
					t.startMin != null &&
					t.startMin < visualEnd &&
					start < this.visualEndMinute(t)
			)
			.sort((a, b) => orderKey(a) - orderKey(b));

		let ord: number;
		if (!peers.length || clientX == null) {
			ord = start;
		} else {
			const slot = this.resolveGhostSlot(peers, clientX);
			if (slot === 0) ord = orderKey(peers[0]) - 1;
			else if (slot >= peers.length) ord = orderKey(peers[peers.length - 1]) + 1;
			else ord = (orderKey(peers[slot - 1]) + orderKey(peers[slot])) / 2;
		}

		// Step 3: Commit the new position and column order to the task signal
		this.tasks.update((ts) =>
			ts.map((t) => (t.id === id ? { ...t, startMin: start, endMin: end, ord } : t))
		);
	}

	/**
	 * Formats elapsed seconds as MM:SS.
	 *
	 * @param seconds - The elapsed time in seconds.
	 * @returns A formatted MM:SS string.
	 */
	private formatElapsed(seconds: number): string {
		const s = Math.floor(seconds);
		return `${Utilities.padTwoDigits(Math.floor(s / 60))}:${Utilities.padTwoDigits(s % 60)}`;
	}

	/**
	 * Formats a duration in minutes as a human-readable string (e.g. "1h 30min").
	 *
	 * @param minutes - The duration in minutes.
	 * @returns A human-readable duration string.
	 */
	private formatDuration(minutes: number): string {
		if (minutes < 60) return minutes + 'min';
		const hours = Math.floor(minutes / 60);
		const remainder = minutes % 60;
		return remainder ? `${hours}h ${remainder}min` : `${hours}h`;
	}

	/* ─────────────────────────────────────────
	   Template helpers
	───────────────────────────────────────── */

	/**
	 * Converts a minute value to its pixel offset on the timeline.
	 *
	 * @param minutes - The time value in minutes from midnight.
	 * @returns The pixel distance from the top of the calendar grid.
	 */
	protected minutesToPixels(minutes: number): number {
		return (minutes / 60) * PIXELS_PER_HOUR;
	}

	/**
	 * Formats a minute value as a 12-hour time string (e.g. "9:30 AM").
	 *
	 * @param minutes - The time value in minutes from midnight.
	 * @returns A formatted time string.
	 */
	protected formatMinutes(minutes: number): string {
		const h = Math.floor(minutes / 60);
		const mm = Math.round(minutes % 60);
		const ap = h < 12 ? TODAY_LABEL_AM : TODAY_LABEL_PM;
		const hh = h % 12 || 12;
		return `${hh}:${Utilities.padTwoDigits(mm)} ${ap}`;
	}

	/**
	 * Formats an hour index as a short 12-hour label (e.g. "9 AM").
	 *
	 * @param h - The 0-based hour index (0–23).
	 * @returns A short hour label string.
	 */
	protected formatHourLabel(h: number): string {
		const ap = h < 12 ? TODAY_LABEL_AM : TODAY_LABEL_PM;
		const hh = h % 12 || 12;
		return `${hh} ${ap}`;
	}

	/**
	 * Gets the pixel height for a drag-create or pending range block.
	 *
	 * @param range - The time range being visualised.
	 * @returns The pixel height, at least RANGE_BLOCK_MIN_HEIGHT_PX.
	 */
	protected rangeBlockHeight(range: TodayTimeRange): number {
		return Math.max(
			RANGE_BLOCK_MIN_HEIGHT_PX,
			this.minutesToPixels(range.endMin) - this.minutesToPixels(range.startMin)
		);
	}

	/**
	 * Gets the pixel height for the drag-move preview ghost, matching the committed block height formula.
	 *
	 * @param range - The time range being previewed.
	 * @returns The pixel height, mirroring max(BLOCK_MIN_HEIGHT_PX, raw − 2) used by committed blocks.
	 */
	protected previewBlockHeight(range: TodayTimeRange): number {
		const raw = this.minutesToPixels(range.endMin) - this.minutesToPixels(range.startMin);
		return Math.max(BLOCK_MIN_HEIGHT_PX, raw - 2);
	}
}
