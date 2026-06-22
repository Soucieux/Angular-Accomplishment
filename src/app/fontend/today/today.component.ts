import {
	AfterViewInit,
	Component,
	ElementRef,
	OnDestroy,
	OnInit,
	ViewChild,
	computed,
	signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Utilities } from '../../common/utilities/app.utilities';
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
} from '../../common/app.constant';
import {
	BLOCK_MIN_HEIGHT_PX,
	BLOCK_SHORT_THRESHOLD_PX,
	MINIMUM_VISUAL_MINUTES,
	PIXELS_PER_HOUR,
	RANGE_BLOCK_MIN_HEIGHT_PX,
	RECUR_LABELS,
	SAMPLE_TASKS,
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
	TodayTracking,
} from './today.model';

@Component({
	selector: 'today',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './today.component.html',
	styleUrls: ['../../common/glass-card.css', './today.component.css'],
})
export class TodayComponent implements OnInit, AfterViewInit, OnDestroy {
	@ViewChild('cal') private calRef!: ElementRef<HTMLDivElement>;
	@ViewChild('grid') private gridRef!: ElementRef<HTMLDivElement>;

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
	protected readonly isDragCreateEnabled = signal(true);
	protected readonly isDragMoveEnabled = signal(true);
	protected readonly dragMovePreview = signal<TodayTimeRange | null>(null);
	protected readonly dragCreateRange = signal<TodayTimeRange | null>(null);
	protected readonly pendingBlock = signal<TodayTimeRange | null>(null);
	protected readonly pendingName = signal('');
	protected readonly tracking = signal<TodayTracking | null>(null);
	private readonly nowMin = signal(8 * 60);
	private readonly draggingBlockId = signal<string | null>(null);
	private readonly removingIds = signal<string[]>([]);
	private readonly pendingSource = signal<TodayTask['source'] | null>(null);
	private tasks = signal<TodayTask[]>(SAMPLE_TASKS);

	/* ─────────────────────────────────────────
	   Derived view-models
	───────────────────────────────────────── */

	/** Timed task blocks with full layout and display data. */
	protected readonly timedBlocks = computed((): TodayTimedBlock[] => {
		const layout = this.blockLayout();
		return this.tasks()
			.filter(t => t.startMin != null)
			.map(t => {
				const isDone = t.source === TASK_SOURCE_LOCAL && t.done;
				const pos = layout[t.id] ?? { col: 0, total: 1 };
				const top = this.minutesToPixels(t.startMin!);
				const endMin = t.endMin ?? (t.startMin! + MINIMUM_VISUAL_MINUTES);
				const height = Math.max(BLOCK_MIN_HEIGHT_PX, (endMin - t.startMin!) / 60 * PIXELS_PER_HOUR - 2);
				const widthPercent = 100 / pos.total;
				const leftPercent = pos.col * widthPercent;
				return {
					task: t,
					isDragging: this.draggingBlockId() === t.id,
					isRemoving: this.removingIds().includes(t.id),
					accent: isDone ? TASK_ACCENT_DONE : TASK_ACCENT_MAP[t.source],
					top,
					height,
					widthPercent,
					leftPercent,
					isShort: height < BLOCK_SHORT_THRESHOLD_PX,
					isNarrow: pos.total > 1,
					draggable: (t.source === TASK_SOURCE_LOCAL || t.source === TASK_SOURCE_TRACKED) && this.isDragMoveEnabled(),
					isEditing: this.editingId() === t.id,
					leadIcon: isDone ? TASK_LEAD_ICON_DONE : TASK_LEAD_ICON_MAP[t.source],
					timeLabel: this.formatMinutes(t.startMin!) + ' – ' + this.formatMinutes(endMin),
					durationLabel: this.formatDuration(endMin - t.startMin!),
					hasRecurrence: t.recur !== 'none',
					recurrenceLabel: RECUR_LABELS[t.recur] ?? '',
				};
			});
	});

	/** Untimed local tasks shown in the anytime lane. */
	protected readonly untimedTasks = computed(() =>
		this.tasks().filter(t => t.source === TASK_SOURCE_LOCAL && t.startMin == null)
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
		return track ? Math.max(2, this.minutesToPixels(this.nowMin()) - this.minutesToPixels(track.startMin)) : 0;
	});

	/** Elapsed time string, updated every second via the clock signal. */
	protected readonly trackElapsedLabel = computed(() => {
		const _ = this.clock();
		const track = this.tracking();
		return track ? this.formatElapsed((Date.now() - track.startedAt) / 1000) : '';
	});

	/** Returns true when the pending block was created by stopping a tracking session. */
	protected readonly isPendingFromTracking = computed(() =>
		this.pendingSource() === TASK_SOURCE_TRACKED
	);

	/** Formatted current date, updated every second via the clock signal. */
	protected readonly dateLabel = computed(() => {
		const _ = this.clock();
		return new Date().toLocaleDateString(APP_LOCALE, { weekday: 'long', month: 'long', day: 'numeric' });
	});

	/** Column layout positions for all timed blocks, using visual-extent packing. */
	private readonly blockLayout = computed((): Record<string, { col: number; total: number }> => {
		const layoutMap: Record<string, { col: number; total: number }> = {};
		const timedTasks = this.tasks()
			.filter(t => t.startMin != null)
			.sort((a, b) => a.startMin! - b.startMin!);

		let cluster: TodayTask[] = [];
		let clusterEndMinute = -1;

		const flushCluster = () => {
			const sorted = [...cluster].sort(
				(a, b) => (a.ord ?? a.startMin!) - (b.ord ?? b.startMin!)
			);
			const columnEnds: number[] = [];
			sorted.forEach(task => {
				let col = columnEnds.findIndex(end => task.startMin! >= end);
				if (col < 0) {
					col = columnEnds.length;
					columnEnds.push(this.visualEndMinute(task));
				} else {
					columnEnds[col] = this.visualEndMinute(task);
				}
				layoutMap[task.id] = { col, total: 1 };
			});
			const columnCount = columnEnds.length;
			sorted.forEach(task => { layoutMap[task.id] = { col: layoutMap[task.id].col, total: columnCount }; });
		};

		timedTasks.forEach(task => {
			if (cluster.length && task.startMin! >= clusterEndMinute) {
				flushCluster();
				cluster = [];
				clusterEndMinute = -1;
			}
			cluster.push(task);
			clusterEndMinute = Math.max(clusterEndMinute, this.visualEndMinute(task));
		});
		if (cluster.length) flushCluster();

		return layoutMap;
	});

	private clockInterval: ReturnType<typeof setInterval> | undefined;
	private activeDragId: string | null = null;
	private dragCreateStartMinute = 0;
	private dragCleanup: (() => void) | null = null;

	/**
	 * Starts the clock tick and schedules a 1-second interval to keep it current.
	 */
	ngOnInit(): void {
		this.tick();
		this.clockInterval = setInterval(() => this.tick(), 1000);
	}

	/**
	 * Scrolls the calendar to the current time and attaches the auto-hide scrollbar.
	 */
	ngAfterViewInit(): void {
		const calEl = this.calRef?.nativeElement;
		if (calEl) {
			const now = new Date();
			const nowMinutes = now.getHours() * 60 + now.getMinutes();
			calEl.scrollTop = Math.max(0, this.minutesToPixels(nowMinutes) - SCROLL_AHEAD_PX);
			Utilities.attachScrollAutoHide(calEl);
		}
	}

	/**
	 * Clears the clock interval and removes any active drag event listeners.
	 */
	ngOnDestroy(): void {
		clearInterval(this.clockInterval);
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
		this.tasks.update(ts => [
			...ts,
			{ id: TODAY_LOCAL_TASK_ID_PREFIX + Date.now(), source: TASK_SOURCE_LOCAL, title, done: false, startMin: null, endMin: null, recur: 'none' },
		]);
		this.quickAddDraft.set('');
	}

	/**
	 * Toggles the done state of a local task.
	 *
	 * @param id - The ID of the task to toggle.
	 */
	protected toggleTaskDone(id: string): void {
		this.tasks.update(ts =>
			ts.map(t => (t.id === id && t.source === TASK_SOURCE_LOCAL) ? { ...t, done: !t.done } : t)
		);
	}

	/**
	 * Removes a task with an exit animation.
	 *
	 * @param id - The ID of the task to remove (reminders cannot be removed).
	 */
	protected removeTask(id: string): void {
		this.removingIds.update(r => [...r, id]);
		setTimeout(() => {
			this.tasks.update(ts => ts.filter(t => !(t.id === id && t.source !== TASK_SOURCE_REMINDER)));
			this.removingIds.update(r => r.filter(x => x !== id));
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
		this.tasks.update(ts =>
			ts.map(t => t.id === id ? { ...t, title: value || t.title } : t)
		);
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
		if (this.pendingBlock()) { this.cancelPendingBlock(); return; }
		if (this.dragCreateRange()) { this.dragCreateRange.set(null); return; }

		const cal = this.calRef.nativeElement;
		const startMin = Math.max(
			0,
			Math.min(24 * 60 - 15, this.snapMinutes((event.clientY - cal.getBoundingClientRect().top + cal.scrollTop) / PIXELS_PER_HOUR * 60))
		);
		this.dragCreateStartMinute = startMin;
		this.dragCreateRange.set({ startMin, endMin: startMin + 30 });

		const onMouseMove = (moveEvent: MouseEvent) => {
			const calRect = cal.getBoundingClientRect();
			const relY = moveEvent.clientY - calRect.top + cal.scrollTop;
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
		this.dragCleanup = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
	}

	/**
	 * Saves the pending block as a new task using the current pending name and source.
	 * Clears the pending state if the name is empty.
	 */
	protected savePendingBlock(): void {
		const block = this.pendingBlock();
		if (!block) return;
		const name = this.pendingName().trim();
		if (!name) { this.clearPendingState(); return; }
		const source = this.pendingSource() ?? TASK_SOURCE_LOCAL;
		this.tasks.update(ts => [
			...ts,
			{ id: TODAY_LOCAL_TASK_ID_PREFIX + Date.now(), source, title: name, done: false, startMin: block.startMin, endMin: block.endMin, recur: 'none' },
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
		this.pendingBlock.set({ startMin, endMin });
		this.pendingName.set('');
		this.pendingSource.set(TASK_SOURCE_TRACKED);
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
		const task = this.tasks().find(t => t.id === id);
		if (!task || task.startMin == null) return;
		const startMin = task.startMin;
		const cal = this.calRef.nativeElement;

		const onMouseMove = (moveEvent: MouseEvent) => {
			const calRect = cal.getBoundingClientRect();
			const relY = moveEvent.clientY - calRect.top + cal.scrollTop;
			const endMin = Math.max(startMin + 15, Math.min(24 * 60, this.snapMinutes((relY / PIXELS_PER_HOUR) * 60)));
			this.tasks.update(ts =>
				ts.map(t => (t.id === id && t.source !== TASK_SOURCE_REMINDER) ? { ...t, endMin } : t)
			);
		};
		const onMouseUp = () => {
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
			this.dragCleanup = null;
		};
		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
		this.dragCleanup = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
	}

	/* ─────────────────────────────────────────
	   Drag-to-move (HTML5 drag) actions
	───────────────────────────────────────── */

	/**
	 * Records the dragged block ID and marks it as dragging.
	 *
	 * @param id - The ID of the block being dragged.
	 */
	protected onBlockDragStart(id: string): void {
		this.activeDragId = id;
		this.draggingBlockId.set(id);
	}

	/**
	 * Clears the dragging state when the drag gesture ends.
	 */
	protected onBlockDragEnd(): void {
		this.activeDragId = null;
		this.draggingBlockId.set(null);
		this.dragMovePreview.set(null);
	}

	/**
	 * Prevents default drag behaviour on the untimed zone to allow drop.
	 *
	 * @param event - The dragover event.
	 */
	protected onUntimedZoneDragOver(event: DragEvent): void {
		event.preventDefault();
	}

	/**
	 * Drops a timed block onto the untimed zone, removing its schedule.
	 *
	 * @param event - The drop event on the untimed zone.
	 */
	protected onUntimedZoneDrop(event: DragEvent): void {
		event.preventDefault();
		const id = this.activeDragId;
		if (!id) return;
		this.tasks.update(ts =>
			ts.map(t => (t.id === id && t.source === TASK_SOURCE_LOCAL) ? { ...t, startMin: null, endMin: null } : t)
		);
		this.activeDragId = null;
		this.draggingBlockId.set(null);
	}

	/**
	 * Updates the drag-move preview position as the block is dragged over the grid.
	 *
	 * @param event - The dragover event on the calendar grid.
	 */
	protected onGridDragOver(event: DragEvent): void {
		event.preventDefault();
		const id = this.activeDragId;
		if (!id) return;
		const cal = this.calRef.nativeElement;
		const relY = event.clientY - cal.getBoundingClientRect().top + cal.scrollTop;
		const newStart = Math.max(0, Math.min(24 * 60 - 15, this.snapMinutes((relY / PIXELS_PER_HOUR) * 60)));
		const task = this.tasks().find(t => t.id === id);
		const duration = (task && task.startMin != null) ? (task.endMin! - task.startMin) : 60;
		let start = newStart, end = start + duration;
		if (end > 1440) { end = 1440; start = end - duration; }
		const preview = this.dragMovePreview();
		if (!preview || preview.startMin !== start) this.dragMovePreview.set({ startMin: start, endMin: end });
	}

	/**
	 * Commits the drag-move drop, rescheduling the block to its new position.
	 *
	 * @param event - The drop event on the calendar grid.
	 */
	protected onGridDrop(event: DragEvent): void {
		event.preventDefault();
		const id = this.activeDragId;
		if (!id) return;
		const cal = this.calRef.nativeElement;
		const relY = event.clientY - cal.getBoundingClientRect().top + cal.scrollTop;
		const newStart = Math.max(0, Math.min(24 * 60 - 15, this.snapMinutes((relY / PIXELS_PER_HOUR) * 60)));
		this.rescheduleDraggedBlock(id, newStart, event.clientX);
		this.activeDragId = null;
		this.draggingBlockId.set(null);
		this.dragMovePreview.set(null);
	}

	/* ─────────────────────────────────────────
	   Toggle actions
	───────────────────────────────────────── */

	/**
	 * Toggles the drag-to-create mode. Cancels any in-progress gesture on disable.
	 */
	protected onDragCreateChange(): void {
		this.isDragCreateEnabled.update(v => !v);
		this.dragCreateRange.set(null);
		this.pendingBlock.set(null);
		this.pendingName.set('');
	}

	/**
	 * Toggles the drag-to-move mode. Clears the drag preview on disable.
	 */
	protected onDragMoveChange(): void {
		this.isDragMoveEnabled.update(v => !v);
		this.draggingBlockId.set(null);
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
	 */
	private tick(): void {
		const now = new Date();
		this.clock.set(now.toLocaleTimeString(APP_LOCALE, { hour: 'numeric', minute: '2-digit' }));
		this.nowMin.set(now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60);
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
	 * Gets the visual end minute of a task, enforcing the minimum visual height.
	 *
	 * @param task - The task whose visual end minute is needed.
	 * @returns The later of the task's real end minute and start + MINIMUM_VISUAL_MINUTES.
	 */
	private visualEndMinute(task: TodayTask): number {
		const start = task.startMin ?? 0;
		const end = task.endMin ?? start;
		return Math.max(end, start + MINIMUM_VISUAL_MINUTES);
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
		const allTasks = this.tasks();
		const target = allTasks.find(t => t.id === id);
		if (!target || target.source === TASK_SOURCE_REMINDER) return;
		const duration = target.startMin != null ? (target.endMin! - target.startMin) : 60;
		let start = newStart, end = start + duration;
		if (end > 1440) { end = 1440; start = end - duration; }

		const orderKey = (t: TodayTask) => t.ord ?? t.startMin!;
		const visualEnd = Math.max(end, start + MINIMUM_VISUAL_MINUTES);
		const peers = allTasks
			.filter(t => t.id !== id && t.startMin != null && t.startMin < visualEnd && start < this.visualEndMinute(t))
			.sort((a, b) => orderKey(a) - orderKey(b));

		let ord: number;
		const grid = this.gridRef?.nativeElement;
		if (!peers.length || !grid || clientX == null) {
			ord = start;
		} else {
			const gridRect = grid.getBoundingClientRect();
			const columnCount = peers.length + 1;
			const columnWidth = gridRect.width / columnCount;
			let slot = Math.round((clientX - gridRect.left) / columnWidth - 0.5);
			slot = Math.max(0, Math.min(peers.length, slot));
			if (slot === 0) ord = orderKey(peers[0]) - 1;
			else if (slot >= peers.length) ord = orderKey(peers[peers.length - 1]) + 1;
			else ord = (orderKey(peers[slot - 1]) + orderKey(peers[slot])) / 2;
		}
		this.tasks.update(ts => ts.map(t => t.id === id ? { ...t, startMin: start, endMin: end, ord } : t));
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
		const hh = (h % 12) || 12;
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
		const hh = (h % 12) || 12;
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
}
