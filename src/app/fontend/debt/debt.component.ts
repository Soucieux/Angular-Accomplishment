import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Inject,
	NgZone,
	OnDestroy,
	OnInit,
	PLATFORM_ID,
	ViewChild,
	ViewContainerRef
} from '@angular/core';
import { AsyncPipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SkeletonModule } from 'primeng/skeleton';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LOG } from '../../common/app.logs';
import { Utilities } from '../../common/utilities/app.utilities';
import { CloudbaseService } from '../../backend/database-service/cloudbase/cloudbase.service';
import { SessionExpiredError } from '../../common/error/session-expired.error';
import {
	COMPONENT_DESTROY,
	DATABASE_DEBT_SONATA,
	DEBT_PROMPT_TIMEOUT_MS,
	DEBT_CURRENCY_CAD,
	DEBT_CURRENCY_CNY,
	DEBT_CUSTOM_INPUT_PLACEHOLDER,
	DEBT_PRESET_LARGE,
	DEBT_PRESET_SMALL,
	DEBT_TYPE_TEMP,
	DEBT_TYPE_PERMANENT,
	DEBT_ITEM_EXPENSE,
	DEBT_VALUE_KEY_CATEGORY,
	DEBT_VALUE_KEY_CURRENCY,
	DEBT_VALUE_KEY_DATE,
	DEBT_VALUE_KEY_DEBT,
	DEBT_VALUE_KEY_ORIGINAL,
	DEBT_VALUE_KEY_PAID,
	DEBT_VALUE_KEY_TYPE,
	DIALOG_DEBT,
	STATS_CAP_ACTIVITY_LOG,
	STATS_FIELD_TOTAL_DEBTS,
	STATS_FIELD_DEBT_UPCOMING,
	DEBT_CURRENCY_SYMBOL_CNY,
	DEBT_CURRENCY_SYMBOL_CAD,
	DEBT_DUE_CLASS_OVERDUE,
	DEBT_DUE_CLASS_SOON,
	DEBT_DUE_ICON_OVERDUE,
	DEBT_DUE_ICON_DEFAULT,
	DEBT_SKELETON_COUNT,
	DEBT_SKELETON_ROWS,
	DEBT_MIN_COLUMNS,
	SKELETON_MIN_COLUMN_ROWS,
	DEBT_VALUE_KEY_PAYMENTS,
	TIMEOUT_KEY_DEBT
} from '../../common/constants';
import {
	DEBT_BTN_SET,
	DEBT_BTN_RESET,
	DEBT_BTN_RESTORE,
	DEBT_BTN_HISTORY,
	DEBT_EMPTY_STATE_BTN,
	DEBT_EMPTY_STATE_MSG,
	DEBT_LABEL_DELETE_CONFIRM,
	DEBT_DUE_LABEL_NONE,
	DEBT_DUE_LABEL_TODAY,
	DEBT_DUE_LABEL_TOMORROW,
	DEBT_MSG_PAYING,
	DEBT_MSG_DELETING_PAYMENT,
	DEBT_MSG_DELETING,
	MSG_SAVING,
	DEBT_MSG_RESETTING,
	DEBT_CONFIRM_DELETE_PAYMENT_MSG,
	DEBT_CONFIRM_DELETE_PAYMENT_HEADER,
	DEBT_CONFIRM_DELETE_PAYMENT_BTN,
	DEBT_SUBTITLE,
	DEBT_STAT_LABEL_TOTAL,
	DEBT_STAT_LABEL_DEBTS,
	DEBT_STAT_LABEL_ACTIVE,
	DEBT_STAT_LABEL_PAID_OFF,
	DEBT_STAT_LABEL_DUE_SOON,
	DEBT_STAT_LABEL_OVERDUE,
	DEBT_STAT_LABEL_PAYMENTS,
	DEBT_HEADING_YOUR_DEBTS,
	DEBT_HISTORY_EMPTY,
	MONTH_NAMES_SHORT,
	DEBT_CATEGORY_LABELS,
	DEBT_DIALOG_TITLE,
	NAV_LABEL_DEBT_SONATA,
	DEBT_LABEL_PCT_CLEARED,
	DEBT_LABEL_PCT_PAID,
	DEBT_LABEL_OF,
	DEBT_LABEL_REMAINING_OF,
	DEBT_LABEL_PAID_IN_FULL,
	DEBT_LABEL_CUSTOM_PAY,
	DEBT_DAYS_LEFT_SUFFIX,
	COUNTDOWN_DAYS_OVERDUE_PREFIX,
	COUNTDOWN_DAYS_OVERDUE_SUFFIX,
	DEBT_TOOLTIP_UNLOCK,
	DEBT_TOOLTIP_MARK_PERMANENT
} from '../../common/locale/locale-strings';
import {
	DEBT_CATEGORY_DEFS,
	DebtCategoryDef,
	DebtItem,
	NewDebtData,
	PaymentEntry,
	UpcomingExpense
} from './debt.model';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { TimeoutService } from '../../common/timeout/timeout.service';
import { DatabaseService } from '../../backend/database-service/database.service';
import { BlockedCardComponent } from '../../common/blocked-card/blocked-card.component';
@Component({
	selector: 'debt',
	imports: [AsyncPipe, FormsModule, SkeletonModule, BlockedCardComponent],
	templateUrl: './debt.component.html',
	styleUrls: ['./debt.component.css']
})
export class DebtComponent implements OnInit, AfterViewInit, OnDestroy {
	private readonly className = 'DebtComponent';
	@ViewChild('dialogComponentContainer', { read: ViewContainerRef })
	// This value is automatically assigned to ViewContainerRef (a predefined keyword) after view is initialized
	private dialogComponentContainer!: ViewContainerRef;
	protected readonly DATABASE_DEBT_SONATA = DATABASE_DEBT_SONATA;
	protected readonly DEBT_CURRENCY_CNY = DEBT_CURRENCY_CNY;
	protected readonly DEBT_PRESET_SMALL = DEBT_PRESET_SMALL;
	protected readonly DEBT_PRESET_LARGE = DEBT_PRESET_LARGE;
	protected readonly DEBT_BTN_SET = DEBT_BTN_SET;
	protected readonly DEBT_BTN_RESET = DEBT_BTN_RESET;
	protected readonly DEBT_BTN_RESTORE = DEBT_BTN_RESTORE;
	protected readonly DEBT_BTN_HISTORY = DEBT_BTN_HISTORY;
	protected readonly DEBT_EMPTY_STATE_MSG = DEBT_EMPTY_STATE_MSG;
	protected readonly DEBT_EMPTY_STATE_BTN = DEBT_EMPTY_STATE_BTN;
	protected readonly DEBT_CUSTOM_INPUT_PLACEHOLDER = DEBT_CUSTOM_INPUT_PLACEHOLDER;
	protected readonly DEBT_TOOLTIP_UNLOCK = DEBT_TOOLTIP_UNLOCK;
	protected readonly DEBT_TOOLTIP_MARK_PERMANENT = DEBT_TOOLTIP_MARK_PERMANENT;
	protected readonly DEBT_LABEL_DELETE_CONFIRM = DEBT_LABEL_DELETE_CONFIRM;
	protected readonly DEBT_CONFIRM_DELETE_PAYMENT_MSG = DEBT_CONFIRM_DELETE_PAYMENT_MSG;
	protected readonly DEBT_CONFIRM_DELETE_PAYMENT_HEADER = DEBT_CONFIRM_DELETE_PAYMENT_HEADER;
	protected readonly DEBT_CONFIRM_DELETE_PAYMENT_BTN = DEBT_CONFIRM_DELETE_PAYMENT_BTN;
	protected readonly NAV_LABEL_DEBT_SONATA = NAV_LABEL_DEBT_SONATA;
	protected readonly DEBT_SUBTITLE = DEBT_SUBTITLE;
	protected readonly DEBT_STAT_LABEL_TOTAL = DEBT_STAT_LABEL_TOTAL;
	protected readonly DEBT_STAT_LABEL_DEBTS = DEBT_STAT_LABEL_DEBTS;
	protected readonly DEBT_STAT_LABEL_ACTIVE = DEBT_STAT_LABEL_ACTIVE;
	protected readonly DEBT_STAT_LABEL_PAID_OFF = DEBT_STAT_LABEL_PAID_OFF;
	protected readonly DEBT_STAT_LABEL_DUE_SOON = DEBT_STAT_LABEL_DUE_SOON;
	protected readonly DEBT_STAT_LABEL_OVERDUE = DEBT_STAT_LABEL_OVERDUE;
	protected readonly DEBT_STAT_LABEL_PAYMENTS = DEBT_STAT_LABEL_PAYMENTS;
	protected readonly DEBT_HEADING_YOUR_DEBTS = DEBT_HEADING_YOUR_DEBTS;
	protected readonly DEBT_HISTORY_EMPTY = DEBT_HISTORY_EMPTY;
	protected readonly DEBT_DIALOG_TITLE = DEBT_DIALOG_TITLE;
	protected readonly DEBT_LABEL_PCT_CLEARED = DEBT_LABEL_PCT_CLEARED;
	protected readonly DEBT_LABEL_PCT_PAID = DEBT_LABEL_PCT_PAID;
	protected readonly DEBT_LABEL_OF = DEBT_LABEL_OF;
	protected readonly DEBT_LABEL_REMAINING_OF = DEBT_LABEL_REMAINING_OF;
	protected readonly DEBT_LABEL_PAID_IN_FULL = DEBT_LABEL_PAID_IN_FULL;
	protected readonly DEBT_LABEL_CUSTOM_PAY = DEBT_LABEL_CUSTOM_PAY;
	protected loading = true;
	protected skeletonCount = DEBT_SKELETON_COUNT;
	protected isHoverCapable!: boolean;
	protected updatedDebtSonataItems: DebtItem[] = [];
	protected originalDebtSonataItems!: DebtItem[];
	protected expandedItems: Record<string, boolean> = {};
	protected balanceBumpItems: Record<string, boolean> = {};
	protected isPromptedReset: Record<string, boolean> = {};
	protected isPromptedDelete: Record<string, boolean> = {};
	protected customInputState: Record<string, string | null> = {};
	protected saveIndicator = false;
	protected debtItems$!: Observable<DebtItem[]>;
	private upcomingExpenses: UpcomingExpense[] = [];
	private paymentsData: Record<string, Record<number, PaymentEntry>> = {};
	private activeWriteKeys = new Set<string>();
	private promptedResetTimers: Record<string, ReturnType<typeof setTimeout>> = {};
	private promptedDeleteTimers: Record<string, ReturnType<typeof setTimeout>> = {};
	private balanceBumpTimers: Record<string, ReturnType<typeof setTimeout>> = {};
	private saveIndicatorTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};
	private syncStatTimer: ReturnType<typeof setTimeout> | null = null;
	private gridResizeObserver?: ResizeObserver;
	private readonly categoryDefs: DebtCategoryDef[] = DEBT_CATEGORY_DEFS.map((categoryDef) => ({
		...categoryDef,
		label: DEBT_CATEGORY_LABELS[categoryDef.key] ?? ''
	}));

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		private dialogService: DialogService,
		private timeoutService: TimeoutService,
		private databaseService: DatabaseService,
		private cdr: ChangeDetectorRef,
		private ngZone: NgZone,
		private elementRef: ElementRef,
		protected utilities: Utilities
	) {}

	/**
	 * Initialises the component: checks hover capability and builds the Account
	 * Expenses observable. The tap side-effect populates the display and
	 * original-value arrays and syncs upcoming items to the statistics collection.
	 * Items in activeWriteKeys are shielded from overwrite to prevent the
	 * optimistic-update flip caused by CloudBase echoing stale data mid-write.
	 * The tap body runs inside ngZone.run() because CloudBase WebSocket callbacks
	 * fire outside Angular's zone. The async pipe in the template manages the
	 * subscription lifecycle and triggers change detection — no explicit
	 * detectChanges() call is needed or safe here.
	 */
	ngOnInit() {
		if (isPlatformBrowser(this.platformId)) {
			this.timeoutService.start(TIMEOUT_KEY_DEBT, () => {
				this.dialogService.showLoadingTimeout(this.dialogComponentContainer);
			});

			// Step 1 : Check device hover capability
			this.isHoverCapable = this.utilities.checkIfHoverCapable();

			/* Step 2 : Handle auto-open-dialog state from router navigation.
			   history.state retains the router state passed via Router.navigate({ state: ... }).
			   Immediately clear the state so a page refresh does not re-trigger the dialog. */
			if (history.state?.openAddDialog) {
				history.replaceState({}, '');
				setTimeout(() => this.openNewDebtDialog(), 0);
			}

			// Step 3 : Build the Account Expenses observable with tap side-effects
			this.debtItems$ = this.databaseService.getDebtSonataTableDetails().pipe(
				tap((rows) => {
					this.ngZone.run(() => {
						this.originalDebtSonataItems = structuredClone(rows);
						const currentByKey = new Map(
							this.updatedDebtSonataItems.map((item) => [item.key, item])
						);
						this.updatedDebtSonataItems = rows.map((row) =>
							this.activeWriteKeys.has(row.key)
								? (currentByKey.get(row.key) ?? structuredClone(row))
								: structuredClone(row)
						);
						this.timeoutService.clear(TIMEOUT_KEY_DEBT);
						this.loading = false;
						this.paymentsData = rows.reduce(
							(acc: Record<string, Record<number, PaymentEntry>>, item) => ({
								...acc,
								[item.key]: this.activeWriteKeys.has(item.key)
									? (this.paymentsData[item.key] ?? {})
									: (item.payments ?? {})
							}),
							{}
						);
						this.upcomingExpenses = rows
							.filter((item) => item.date && !item.paid)
							.map((item) => this.toUpcomingExpense(item));
						this.syncStatistics();
					});
				})
			);
		}
	}

	/**
	 * Measures the responsive grid on first render and re-measures on container resize so the
	 * skeleton loader fills the same number of columns and rows the real cards will occupy.
	 */
	ngAfterViewInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.updateSkeletonCount();

			// ResizeObserver fires outside Angular's zone; re-enter so the skeletonCount change is detected.
			this.gridResizeObserver = new ResizeObserver(() =>
				this.ngZone.run(() => this.updateSkeletonCount())
			);
			this.gridResizeObserver.observe(this.elementRef.nativeElement);
		}
	}

	/**
	 * Unsubscribes from the Account Expenses subscription and clears all
	 * prompted-button and balance-bump timers.
	 */
	ngOnDestroy() {
		this.gridResizeObserver?.disconnect();
		this.timeoutService.clear(TIMEOUT_KEY_DEBT);
		this.dialogComponentContainer?.clear();
		Object.values(this.promptedResetTimers).forEach(clearTimeout);
		Object.values(this.promptedDeleteTimers).forEach(clearTimeout);
		Object.values(this.balanceBumpTimers).forEach(clearTimeout);
		LOG.info(this.className, COMPONENT_DESTROY);
	}

	// ── Preset chip payment interaction handlers ─────────────────────────────

	/**
	 * Subtracts the given amount from the item's debt balance and persists
	 * the change, including writing the payment entry to the DB.
	 * The balance may go negative (overpayment is allowed).
	 * Auto-marks the item as paid when the balance reaches zero or below.
	 * Opens a block dialog during the DB write to prevent duplicate submissions.
	 * Briefly scales the balance display via the is-bump CSS class for 360 ms.
	 *
	 * @param entryKey - The unique key of the Account Expenses entry to pay.
	 * @param amount - The positive amount to subtract from the current balance.
	 */
	protected async payDebt(entryKey: string, amount: number): Promise<void> {
		if (
			!this.dialogService.ensurePermission(
				this.dialogComponentContainer,
				this.findUpdatedItem(entryKey)?._openid ?? ''
			)
		)
			return;
		const item = this.findUpdatedItem(entryKey);
		if (!item || amount <= 0 || this.isPayDisabled(item)) return;
		// Step 1 : Compute new balance and build the payment entry
		const currentDebt: number = item.debt ?? 0;
		const newDebt = Utilities.roundToTwoDecimals(currentDebt - amount);
		const isPaidOff = this.isDebtFullySettled(newDebt);
		const currentPayments = this.paymentsData[entryKey] ?? {};
		const keys = Object.keys(currentPayments);
		const nextIndex = keys.length === 0 ? 0 : Math.max(...keys.map(Number)) + 1;
		const newEntry: PaymentEntry = {
			amount,
			balance: newDebt,
			timestamp: Utilities.getCurrentFormattedTime(true)
		};
		// Step 2 : Persist payment and balance update via block dialog
		await this.dialogService.runBlocking(this.dialogComponentContainer, DEBT_MSG_PAYING, async () => {
			/* Apply mutations synchronously before any DB write — immune to subscription replacements.
			   activeWriteKeys shields this entry from subscription overwrites until the write settles. */
			this.activeWriteKeys.add(entryKey);
			item.debt = newDebt;
			if (isPaidOff) item.paid = true;
			try {
				const paymentFields: Record<string, unknown> = {
					[DEBT_VALUE_KEY_DEBT]: newDebt,
					[DEBT_VALUE_KEY_PAYMENTS]: { ...currentPayments, [nextIndex]: newEntry }
				};
				if (isPaidOff) paymentFields[DEBT_VALUE_KEY_PAID] = true;
				await this.databaseService.updateDebtFields(entryKey, paymentFields);
				this.triggerSaveIndicator();
			} catch (error) {
				this.dialogService.handleError(this.dialogComponentContainer, error);
			} finally {
				this.activeWriteKeys.delete(entryKey);
			}
		});
		this.paymentsData = {
			...this.paymentsData,
			[entryKey]: { ...currentPayments, [nextIndex]: newEntry }
		};
		// Step 3 : Trigger the balance-bump animation, then clear the flag after the CSS transition completes
		this.balanceBumpItems = { ...this.balanceBumpItems, [entryKey]: true };
		this.cdr.detectChanges();
		if (this.balanceBumpTimers[entryKey]) clearTimeout(this.balanceBumpTimers[entryKey]);
		this.balanceBumpTimers[entryKey] = setTimeout(() => {
			this.balanceBumpItems = { ...this.balanceBumpItems, [entryKey]: false };
			this.cdr.detectChanges();
		}, 360);
		this.resyncUpcomingFromLocalData();
	}

	/**
	 * Shows the custom-amount chip input for the given entry, clearing any previous
	 * value, then focuses the input after Angular renders it into the DOM.
	 *
	 * @param entryKey - The unique key of the entry to show custom input for.
	 */
	protected toggleCustomInput(entryKey: string): void {
		this.customInputState = { ...this.customInputState, [entryKey]: '' };
		setTimeout(() => {
			document.querySelector<HTMLInputElement>(`[data-pay-key="${entryKey}"]`)?.focus();
		}, 0);
	}

	/**
	 * Reads the custom input value for the given entry, submits a payment
	 * if the parsed amount is positive, then closes the custom input.
	 *
	 * @param entryKey - The unique key of the entry to pay with a custom amount.
	 */
	protected submitCustomPay(entryKey: string): void {
		if (this.customInputState[entryKey] == null) return;
		const raw = this.customInputState[entryKey] ?? '';
		const amount = parseFloat(raw);
		if (amount > 0) {
			this.payDebt(entryKey, amount);
		}
		this.cancelCustomPay(entryKey);
	}

	/**
	 * Closes the custom-amount chip input for the given entry without
	 * submitting a payment.
	 *
	 * @param entryKey - The unique key of the entry whose custom input to close.
	 */
	protected cancelCustomPay(entryKey: string): void {
		this.customInputState = { ...this.customInputState, [entryKey]: null };
	}

	// ── Two-step confirm interaction handlers ────────────────────────────────

	/**
	 * First call prompts the Reset button; second call within 2.6 s executes
	 * the reset. Prompted state auto-dismisses after the timeout.
	 *
	 * @param entryKey - The unique key of the entry to reset.
	 */
	protected promptOrConfirmReset(entryKey: string): void {
		if (
			!this.dialogService.ensurePermission(
				this.dialogComponentContainer,
				this.findUpdatedItem(entryKey)?._openid ?? ''
			)
		)
			return;
		if (this.isPromptedReset[entryKey]) {
			clearTimeout(this.promptedResetTimers[entryKey]);
			this.isPromptedReset = { ...this.isPromptedReset, [entryKey]: false };
			this.resetDebt(entryKey);
		} else {
			this.isPromptedReset = { ...this.isPromptedReset, [entryKey]: true };
			this.promptedResetTimers[entryKey] = setTimeout(() => {
				this.isPromptedReset = { ...this.isPromptedReset, [entryKey]: false };
				this.cdr.detectChanges();
			}, DEBT_PROMPT_TIMEOUT_MS);
		}
	}

	/**
	 * First call prompts the Delete button; second call within 2.6 s removes
	 * the entry from CloudBase. Prompted state auto-dismisses after the timeout.
	 *
	 * @param entryKey - The unique key of the entry to delete.
	 */
	protected promptOrConfirmDelete(entryKey: string): void {
		if (
			!this.dialogService.ensurePermission(
				this.dialogComponentContainer,
				this.findUpdatedItem(entryKey)?._openid ?? ''
			)
		)
			return;
		if (this.isPromptedDelete[entryKey]) {
			clearTimeout(this.promptedDeleteTimers[entryKey]);
			this.isPromptedDelete = { ...this.isPromptedDelete, [entryKey]: false };
			this.removeDebt(entryKey);
		} else {
			this.isPromptedDelete = { ...this.isPromptedDelete, [entryKey]: true };
			this.promptedDeleteTimers[entryKey] = setTimeout(() => {
				this.isPromptedDelete = { ...this.isPromptedDelete, [entryKey]: false };
				this.cdr.detectChanges();
			}, DEBT_PROMPT_TIMEOUT_MS);
		}
	}

	/**
	 * Reverts any pending Reset or Delete confirmation to its first state when the user clicks
	 * anywhere outside the button that owns it, so the prompt clears at once instead of waiting for
	 * the auto-dismiss timeout. The button just clicked (if any) keeps whatever state its handler set.
	 *
	 * @param event - The document-level click event.
	 */
	@HostListener('document:click', ['$event'])
	protected onDocumentClick(event: Event): void {
		const target = event.target as HTMLElement | null;
		const keepResetKey = target?.closest('[data-prompt-reset]')?.getAttribute('data-prompt-reset') ?? null;
		const keepDeleteKey =
			target?.closest('[data-prompt-delete]')?.getAttribute('data-prompt-delete') ?? null;
		this.dismissPromptsExcept(keepResetKey, keepDeleteKey);
	}

	/**
	 * Clears every prompted Reset and Delete state (and its auto-dismiss timer) except the entries
	 * whose buttons were just clicked, reassigning the state maps only when something actually changed
	 * so unrelated clicks do not churn change detection.
	 *
	 * @param keepResetKey - The reset entry key to leave untouched, or null to clear them all.
	 * @param keepDeleteKey - The delete entry key to leave untouched, or null to clear them all.
	 */
	private dismissPromptsExcept(keepResetKey: string | null, keepDeleteKey: string | null): void {
		const nextReset = { ...this.isPromptedReset };
		const nextDelete = { ...this.isPromptedDelete };
		let changed = false;
		for (const key of Object.keys(nextReset)) {
			if (nextReset[key] && key !== keepResetKey) {
				clearTimeout(this.promptedResetTimers[key]);
				nextReset[key] = false;
				changed = true;
			}
		}
		for (const key of Object.keys(nextDelete)) {
			if (nextDelete[key] && key !== keepDeleteKey) {
				clearTimeout(this.promptedDeleteTimers[key]);
				nextDelete[key] = false;
				changed = true;
			}
		}
		if (changed) {
			this.isPromptedReset = nextReset;
			this.isPromptedDelete = nextDelete;
		}
	}

	// ── History panel interaction handlers ───────────────────────────────────

	/**
	 * Toggles the payment history panel for the given entry open or closed.
	 *
	 * @param entryKey - The unique key of the entry to expand or collapse.
	 */
	protected toggleHistory(entryKey: string): void {
		this.expandedItems = {
			...this.expandedItems,
			[entryKey]: !this.expandedItems[entryKey]
		};

		// Attach auto-hide scroll behaviour once the newly expanded panel has rendered
		if (isPlatformBrowser(this.platformId) && this.expandedItems[entryKey]) {
			setTimeout(() => {
				document
					.querySelectorAll<HTMLElement>('.history-panel')
					.forEach((el) => Utilities.attachScrollAutoHide(el));
			});
		}
	}

	/**
	 * Returns true when the current user owns the given debt item.
	 * Delegates to the CloudBase ownership check, which also covers admin rights.
	 *
	 * @param item - The debt entry to check ownership for.
	 * @returns True if the current user is permitted to act on the item.
	 */
	protected isOwner(item: DebtItem): boolean {
		return CloudbaseService.checkPermission(item._openid);
	}

	/**
	 * Handles a click on a history row. Opens a confirmation dialog for owners;
	 * silently ignores the click for non-owners.
	 *
	 * @param item - The debt entry that owns the payment history row.
	 * @param entry - The indexed payment entry the user clicked.
	 */
	protected onHistoryRowClick(item: DebtItem, entry: { index: number; value: PaymentEntry }): void {
		if (!this.isOwner(item)) return;
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			'confirm',
			// Fire-and-forget so the confirm closes at once; only the block overlay lingers, then
			// vanishes alone (never `() => this.deletePaymentEntry(...)`, which the confirm would await).
			() => {
				this.deletePaymentEntry(item.key, entry.index).catch(() => {});
			},
			[
				DEBT_CONFIRM_DELETE_PAYMENT_MSG,
				DEBT_CONFIRM_DELETE_PAYMENT_HEADER,
				DEBT_CONFIRM_DELETE_PAYMENT_BTN
			]
		);
	}

	/**
	 * Removes the payment at the given index from the debt entry, refunds its
	 * amount to the balance, and persists both changes via a block dialog.
	 *
	 * @param entryKey - The unique key of the debt entry that owns the payment.
	 * @param index - The integer key of the payment to remove in the payments record.
	 */
	protected async deletePaymentEntry(entryKey: string, index: number): Promise<void> {
		const item = this.findUpdatedItem(entryKey);
		if (!item) return;
		const currentItem = this.paymentsData[entryKey];

		// Step 1 : Compute restored balance and filtered payment history
		const originalDebt = item.debt;
		const updatedDebt = item.debt + currentItem[index].amount;

		// Filter out the selected entry from history
		const remainingPayments: Record<number, PaymentEntry> = Object.fromEntries(
			Object.entries(currentItem).filter(([paymentKey]) => Number(paymentKey) !== index)
		) as Record<number, PaymentEntry>;

		// Step 2 : Persist removal via block dialog to prevent duplicate DB calls
		await this.dialogService.runBlocking(this.dialogComponentContainer, DEBT_MSG_DELETING_PAYMENT, async () => {
			this.activeWriteKeys.add(entryKey);

			item.debt = updatedDebt;
			this.paymentsData = { ...this.paymentsData, [entryKey]: remainingPayments };

			try {
				await this.databaseService.removeSingleHistoryFromDebt(
					entryKey,
					index,
					updatedDebt,
					item.name
				);
			} catch (error) {
				// Rollback
				item.debt = originalDebt;
				this.paymentsData = { ...this.paymentsData, [entryKey]: currentItem };
				this.dialogService.handleError(this.dialogComponentContainer, error);
			} finally {
				this.activeWriteKeys.delete(entryKey);
			}
		});

		// Step 3 : Refresh the open history panel — paymentsData changed inside the block dialog
		this.cdr.detectChanges();
	}

	// ── Dialog opener methods for user-triggered dialogs ─────────────────────

	/**
	 * Opens the add-debt dialog and wires the submit callback to persist
	 * the new entry to CloudBase.
	 */
	protected openNewDebtDialog(): void {
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_DEBT,
			(debtData: NewDebtData) => this.addNewDebt(debtData),
			null
		);
	}

	/**
	 * Opens the Set-debt dialog pre-filled with the entry's current total amount,
	 * due date, and currency. Wires the submit callback to persist the new total
	 * to CloudBase via {@link setDebtForNewCycle}.
	 *
	 * @param entryKey - The unique key of the entry to set.
	 */
	protected openSetDebtDialog(entryKey: string): void {
		if (
			!this.dialogService.ensurePermission(
				this.dialogComponentContainer,
				this.findUpdatedItem(entryKey)?._openid ?? ''
			)
		)
			return;
		const item = this.findUpdatedItem(entryKey);
		if (!item) return;
		/* Prefill with the total ceiling (original), not the current balance — the Set
		   dialog edits the total amount, and the balance is derived from it and the
		   existing payments. */
		const prefillData: Partial<NewDebtData> = {
			amount: item.original ?? item.debt ?? 0,
			dueDate: item.date ?? '',
			currency: this.isCnyCurrency(item) ? DEBT_CURRENCY_CNY : DEBT_CURRENCY_CAD
		};
		this.dialogService.openDialog(
			this.dialogComponentContainer,
			DIALOG_DEBT,
			(data: NewDebtData) => this.setDebtForNewCycle(entryKey, data),
			prefillData
		);
	}

	// ── Internal data methods for CloudBase writes ───────────────────────────

	/**
	 * Creates a new debt record in CloudBase from the data returned by the add-debt dialog.
	 * The write runs behind a blocking overlay so a duplicate submission cannot fire twice.
	 *
	 * @param debtData - The validated form data submitted from the add-debt dialog.
	 */
	private addNewDebt(debtData: NewDebtData): Promise<void> {
		return this.dialogService.runBlocking(this.dialogComponentContainer, MSG_SAVING, async () => {
			try {
				await this.databaseService.addNewRecordToDebt({
					name: debtData.name,
					[DEBT_VALUE_KEY_DEBT]: debtData.amount,
					[DEBT_VALUE_KEY_ORIGINAL]: debtData.amount,
					[DEBT_VALUE_KEY_DATE]: debtData.dueDate,
					[DEBT_VALUE_KEY_PAID]: this.isDebtFullySettled(debtData.amount),
					[DEBT_VALUE_KEY_TYPE]: debtData.isPermanent ? DEBT_TYPE_PERMANENT : DEBT_TYPE_TEMP,
					[DEBT_VALUE_KEY_CATEGORY]: debtData.category,
					[DEBT_VALUE_KEY_CURRENCY]: debtData.currency
				});
				this.triggerSaveIndicator();
			} catch (error) {
				this.dialogService.handleError(this.dialogComponentContainer, error);
			}
		});
	}

	/**
	 * Toggles the lock state of a debt entry between 'goal' and 'permanent'.
	 * Permanent debts are protected from deletion. Rolls back on failure.
	 *
	 * @param entryKey - The unique key of the entry to toggle.
	 */
	protected async toggleLock(entryKey: string): Promise<void> {
		// Re-entry guard: ignore repeat clicks while this entry's lock write is already in flight.
		if (this.activeWriteKeys.has(entryKey)) return;
		if (
			!this.dialogService.ensurePermission(
				this.dialogComponentContainer,
				this.findUpdatedItem(entryKey)?._openid ?? ''
			)
		)
			return;
		const item = this.findUpdatedItem(entryKey);
		if (!item) return;
		const newType =
			(item.type ?? DEBT_TYPE_TEMP) === DEBT_TYPE_PERMANENT ? DEBT_TYPE_TEMP : DEBT_TYPE_PERMANENT;
		item[DEBT_VALUE_KEY_TYPE] = newType;
		await this.updateTableSingleValue(entryKey, DEBT_VALUE_KEY_TYPE);
	}

	/**
	 * Resets the debt balance to its original amount. Paid state is derived from
	 * the original amount via {@link isDebtFullySettled} — if the original amount
	 * is zero or below, the entry is marked as paid rather than unpaid.
	 *
	 * @param entryKey - The unique key of the entry to reset.
	 */
	private async resetDebt(entryKey: string): Promise<void> {
		const item = this.findUpdatedItem(entryKey);
		const original = this.findOriginalItem(entryKey);
		if (!item || !original) return;

		// Step 1: Resolve the target amount and guard against a no-op write
		/* original.original is the true ceiling; item.original is the in-session fallback for
		   records that arrived before the field was written to the server. */
		const originalAmount: number = original.original ?? item.original ?? 0;

		// Guard: skip DB write when debt is already at original and no payments exist
		const hasPayments = Object.keys(this.paymentsData[entryKey] ?? {}).length > 0;
		if (!hasPayments && (item.debt ?? 0) === originalAmount) return;

		// Step 2: Snapshot rollback targets before the block dialog opens — subscription callbacks may replace arrays mid-await
		const newPaid = this.isDebtFullySettled(originalAmount);
		const previousDebt = item.debt ?? 0;
		const previousPaid = item.paid ?? false;
		const previousPayments = { ...(this.paymentsData[entryKey] ?? {}) };

		// Step 3: Apply local mutation, persist to DB, and roll back on failure
		await this.dialogService.runBlocking(this.dialogComponentContainer, DEBT_MSG_RESETTING, async () => {
			this.activeWriteKeys.add(entryKey);
			item.debt = originalAmount;
			item.paid = newPaid;
			try {
				await this.databaseService.resetDebtRecord(
					entryKey,
					originalAmount,
					newPaid,
					item.name ?? ''
				);
				this.triggerSaveIndicator();
			} catch (error) {
				item.debt = previousDebt;
				item.paid = previousPaid;
				this.paymentsData = { ...this.paymentsData, [entryKey]: previousPayments };
				this.dialogService.handleError(this.dialogComponentContainer, error);
			} finally {
				this.activeWriteKeys.delete(entryKey);
			}
		});

		// Step 4: Wipe the in-session payment cache and refresh upcoming stats after the write settles
		this.paymentsData = { ...this.paymentsData, [entryKey]: {} };
		this.resyncUpcomingFromLocalData();
		this.cdr.detectChanges();
	}

	/**
	 * Removes the entry from the CloudBase collection. The realtime
	 * subscription will update the display arrays automatically.
	 *
	 * @param entryKey - The unique key of the entry to remove.
	 */
	private async removeDebt(entryKey: string): Promise<void> {
		const item = this.findUpdatedItem(entryKey);
		const debtName = item?.name ?? '';
		// The block dialog overlay guards against a duplicate delete from a rapid second confirm tap.
		await this.dialogService.runBlocking(this.dialogComponentContainer, DEBT_MSG_DELETING, async () => {
			try {
				await this.databaseService.removeRecordFromDebtTable(
					entryKey,
					debtName,
					item?._openid ?? ''
				);
			} catch (error) {
				this.dialogService.handleError(this.dialogComponentContainer, error);
			}
		});
	}

	/**
	 * Reads the updated value for the given field and writes it to CloudBase.
	 * Skips the write when the value has not changed. Rolls back the local change
	 * on permission error before showing the dialog.
	 *
	 * All values are captured before the first await so that a realtime subscription
	 * callback mid-flight cannot corrupt the comparison or rollback targets.
	 *
	 * {@link toggleLock} - Persists the toggled goal/permanent type.
	 *
	 * @param entryKey - The unique key of the entry to update.
	 * @param valueKey - The field name inside the entry's object.
	 */
	private async updateTableSingleValue(entryKey: string, valueKey: keyof DebtItem): Promise<void> {
		const updatedItem = this.findUpdatedItem(entryKey);
		const originalItem = this.findOriginalItem(entryKey);
		if (!updatedItem || !originalItem) return;

		// Step 1: Capture old and new values before the first await to prevent subscription callbacks from corrupting the comparison
		const updatedValue = updatedItem[valueKey];
		const oldValue = originalItem[valueKey];

		// Step 2: Guard the entry against subscription overwrites for the duration of the DB write
		this.activeWriteKeys.add(entryKey);
		try {
			// Step 3: Skip the round-trip when the value has not changed — avoids unnecessary DB writes on toggle flicker
			if (updatedValue !== oldValue) {
				await this.databaseService.updateSingleValueForDebtTable(
					entryKey,
					valueKey,
					updatedValue,
					updatedItem.name
				);
				this.triggerSaveIndicator();
			}
		} catch (error) {
			/* Restore the previous value only if the session expired — other errors indicate a server failure
			   and the local state is still the intended value the user wanted. */
			if (error instanceof SessionExpiredError) {
				(updatedItem as Record<keyof DebtItem, unknown>)[valueKey] = oldValue;
			}
			this.dialogService.handleError(this.dialogComponentContainer, error);
		} finally {
			this.activeWriteKeys.delete(entryKey);
		}
	}

	/**
	 * Returns true when the given amount should be treated as fully settled.
	 * Any amount at or below zero is considered paid off.
	 * Single source of truth for the settled threshold used across all write paths.
	 *
	 * {@link payDebt} - Checks the balance remaining after a chip payment.
	 * {@link addNewDebt} - Checks the amount on a newly created record.
	 * {@link setDebtForNewCycle} - Checks the balance recomputed from the new total in the Set dialog.
	 * {@link resetDebt} - Checks the original amount restored by the reset action.
	 *
	 * @param amount - The debt amount to evaluate.
	 * @returns Whether the amount qualifies as fully settled.
	 */
	private isDebtFullySettled(amount: number): boolean {
		return amount <= 0;
	}

	/**
	 * Finds an item in the updated (working) copy of the Account Expenses table.
	 *
	 * @param entryKey - The unique key of the item to find.
	 * @returns The matching item, or undefined if not found.
	 */
	private findUpdatedItem(entryKey: string): DebtItem | undefined {
		return (this.updatedDebtSonataItems ?? []).find((item) => item.key === entryKey);
	}

	/**
	 * Finds an item in the original (server-state) copy of the Account Expenses table.
	 *
	 * @param entryKey - The unique key of the item to find.
	 * @returns The matching item, or undefined if not found.
	 */
	private findOriginalItem(entryKey: string): DebtItem | undefined {
		return (this.originalDebtSonataItems ?? []).find((item) => item.key === entryKey);
	}

	/**
	 * Writes the latest upcoming expenses to the statistics collection.
	 * Called after subscription emits. Fire-and-forget.
	 */
	private syncStatistics(): void {
		/* Debounce via a zero-delay timer so that rapid subscription callbacks (e.g. batch DB writes)
		   coalesce into one stat update rather than hammering the statistics collection on every emission. */
		if (this.syncStatTimer !== null) clearTimeout(this.syncStatTimer);
		this.syncStatTimer = setTimeout(() => {
			this.syncStatTimer = null;

			// Cap the upcoming list to the activity-log limit — the stats collection has a fixed document size
			this.databaseService
				.updateUserStatsFields({
					[STATS_FIELD_DEBT_UPCOMING]: this.upcomingExpenses.slice(0, STATS_CAP_ACTIVITY_LOG),
					[STATS_FIELD_TOTAL_DEBTS]: this.upcomingExpenses.length
				})
				.catch(() => {});
		}, 0);
	}

	/**
	 * Maps a raw database row to the upcoming-expense shape used by the statistics sync.
	 *
	 * @param item - The raw debt record from the database.
	 * @returns The normalized upcoming-expense object.
	 */
	private toUpcomingExpense(item: DebtItem): UpcomingExpense {
		return {
			type: DEBT_ITEM_EXPENSE,
			name: item.name,
			date: item.date ?? '',
			debt: item.debt ?? 0,
			original: item.original ?? 0,
			category: item.category ?? ''
		};
	}

	/**
	 * Recomputes upcoming expenses from local data and syncs to statistics
	 * without waiting for a CloudBase subscription callback.
	 */
	private resyncUpcomingFromLocalData(): void {
		this.upcomingExpenses = (this.updatedDebtSonataItems ?? [])
			.filter((item) => item.date && !item.paid)
			.map((item) => this.toUpcomingExpense(item));
		this.syncStatistics();
	}

	/**
	 * Shows the save-confirmation indicator and hides it after one second.
	 * Clears any active timeout before restarting so rapid saves do not flash.
	 */
	private triggerSaveIndicator(): void {
		// Step 1: Show the indicator immediately and force a paint — the component uses OnPush so explicit detectChanges is required
		this.saveIndicator = true;
		this.cdr.detectChanges();

		// Step 2: Cancel any in-flight hide timer so rapid consecutive saves do not race-dismiss the indicator early
		if (this.saveIndicatorTimeouts[DATABASE_DEBT_SONATA])
			clearTimeout(this.saveIndicatorTimeouts[DATABASE_DEBT_SONATA]);

		// Step 3: Schedule the hide after 1 s and trigger another paint when it fires
		this.saveIndicatorTimeouts[DATABASE_DEBT_SONATA] = setTimeout(() => {
			this.saveIndicator = false;
			this.cdr.detectChanges();
		}, 1000);
	}

	/**
	 * Gets a stable category index for the given item based on a
	 * hash of the item's name, ensuring the same name always maps to the
	 * same category gradient regardless of sort order.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns The index into {@link categoryDefs} for the item's deterministic category.
	 */
	private getCategoryIndexForItem(item: DebtItem): number {
		const name: string = item.name ?? '';

		// Step 1: Compute a polynomial rolling hash over the item name characters
		/* Multiplier 31 is a standard prime used in Java's String.hashCode — small enough
		   to limit magnitude growth while spreading character codes across the range.
		   The bitwise OR 0 truncates to a signed 32-bit integer on every iteration to
		   prevent the accumulator from exceeding safe integer bounds mid-loop. */
		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = (hash * 31 + name.charCodeAt(i)) | 0;
		}

		// Step 2: Map the hash to a valid categoryDefs index — Math.abs guards against negative signed-int results
		return Math.abs(hash) % this.categoryDefs.length;
	}

	/**
	 * Computes the due-date status for a date string.
	 *
	 * @param dateStr - An ISO date string or falsy value.
	 * @returns Object with overdue and soon boolean flags.
	 */
	private getDueStatus(dateStr: string | null | undefined): { overdue: boolean; soon: boolean } {
		if (!dateStr) return { overdue: false, soon: false };
		const diff = Utilities.getDaysUntilNumber(dateStr) ?? 0;
		return { overdue: diff < 0, soon: diff >= 0 && diff <= 14 };
	}

	/**
	 * Applies the Set-debt dialog submission as a total-amount correction: sets the
	 * original ceiling to the entered amount and recomputes the current balance as
	 * the new total minus the payments already made, so every total-derived value
	 * (progress bar, percent paid, paid-off badge, currency summary) follows the new
	 * total. When the total changes, each history entry's stored running-balance
	 * snapshot is also recomputed against the new total — the payment amounts and
	 * timestamps themselves are left untouched, only the displayed balance shifts.
	 * Persists currency and due date when they changed. Clearing the payment history
	 * entirely is still the Reset button's job, not this dialog's.
	 *
	 * Both `item` and `original` are captured before any await so that realtime
	 * subscription callbacks (which replace updatedDebtSonataItems and
	 * originalDebtSonataItems mid-flight) cannot corrupt the comparison values.
	 * All comparisons use `original.*` against `data.*` directly.
	 *
	 * @param entryKey - The unique key of the entry to update.
	 * @param data - The validated form data returned by the Set dialog.
	 */
	private async setDebtForNewCycle(entryKey: string, data: NewDebtData): Promise<void> {
		const item = this.findUpdatedItem(entryKey);
		const original = this.findOriginalItem(entryKey);
		if (!item || !original) return;

		/* Step 1 : Recompute the balance from the new total and the payments already made.
		   Rounded to 2 decimals to avoid floating-point drift, matching payDebt. When the
		   total itself changed, every history entry's stored balance is now stale against
		   the new total, so recompute the whole running sequence too. */
		const currentPayments = this.paymentsData[entryKey] ?? {};
		const paymentsPaid = Object.values(currentPayments).reduce(
			(sum, entry) => sum + (entry.amount ?? 0),
			0
		);
		const newDebt = Utilities.roundToTwoDecimals(data.amount - paymentsPaid);
		const newPaid = this.isDebtFullySettled(newDebt);
		const totalChanged = data.amount !== original.original;
		const newPayments =
			totalChanged && Object.keys(currentPayments).length > 0
				? this.recomputeHistoryBalances(currentPayments, data.amount)
				: null;

		// Step 2 : Build a single update object with only changed fields — one round-trip instead of several.
		const fields = this.buildDebtCycleDiff(data, original, newDebt, newPaid, newPayments);
		if (Object.keys(fields).length === 0) return;

		// Step 3 : Persist inside a block dialog — the overlay guards against duplicate submissions.
		await this.dialogService.runBlocking(this.dialogComponentContainer, MSG_SAVING, async () => {
			/* Apply mutations synchronously before the write so the UI reflects the intended
			   state regardless of subscription timing. activeWriteKeys shields this entry from
			   subscription overwrites until the write settles. */
			this.activeWriteKeys.add(entryKey);
			if (data.currency !== original[DEBT_VALUE_KEY_CURRENCY])
				item[DEBT_VALUE_KEY_CURRENCY] = data.currency;
			item[DEBT_VALUE_KEY_ORIGINAL] = data.amount;
			item[DEBT_VALUE_KEY_DEBT] = newDebt;
			item[DEBT_VALUE_KEY_PAID] = newPaid;
			if (data.dueDate !== original.date) item[DEBT_VALUE_KEY_DATE] = data.dueDate;
			if (newPayments) this.paymentsData = { ...this.paymentsData, [entryKey]: newPayments };
			try {
				await this.databaseService.updateDebtFields(entryKey, fields, item.name ?? '');
				this.triggerSaveIndicator();
			} catch (error) {
				this.dialogService.handleError(this.dialogComponentContainer, error);
			} finally {
				this.activeWriteKeys.delete(entryKey);
			}
		});
		this.resyncUpcomingFromLocalData();
		this.cdr.detectChanges();
	}

	/**
	 * Builds the set of changed fields to persist for a total-amount correction.
	 * Compares incoming data against the original record and returns only the fields
	 * whose values differ — so callers issue a single round-trip update instead of several.
	 *
	 * {@link setDebtForNewCycle} - The sole caller; applies the returned diff to the database.
	 *
	 * @param data - The new values supplied by the user via the Set dialog (amount = new total).
	 * @param original - The unmodified debt record as last received from the database.
	 * @param newDebt - The balance recomputed as the new total minus payments already made.
	 * @param newPaid - Whether the recomputed balance is fully settled.
	 * @param newPayments - The recomputed payment history when the total changed, or null when
	 * the total is unchanged and history has nothing to recompute.
	 * @returns A record of field keys to new values, containing only changed fields.
	 */
	private buildDebtCycleDiff(
		data: NewDebtData,
		original: DebtItem,
		newDebt: number,
		newPaid: boolean,
		newPayments: Record<number, PaymentEntry> | null
	): Record<string, unknown> {
		const fields: Record<string, unknown> = {};

		// Currency is compared first because the currency symbol affects how all monetary values display
		if (data.currency !== original[DEBT_VALUE_KEY_CURRENCY])
			fields[DEBT_VALUE_KEY_CURRENCY] = data.currency;

		// The entered amount is the new total ceiling; the balance follows as total − payments so far.
		if (data.amount !== original.original) fields[DEBT_VALUE_KEY_ORIGINAL] = data.amount;
		if (newDebt !== (original.debt ?? 0)) fields[DEBT_VALUE_KEY_DEBT] = newDebt;
		if ((original.paid ?? false) !== newPaid) fields[DEBT_VALUE_KEY_PAID] = newPaid;
		if (data.dueDate !== original.date) fields[DEBT_VALUE_KEY_DATE] = data.dueDate;
		if (newPayments) fields[DEBT_VALUE_KEY_PAYMENTS] = newPayments;
		return fields;
	}

	/**
	 * Recomputes every history entry's stored balance as a running total starting
	 * from the new ceiling, walking the entries in chronological (index) order.
	 * Each entry's amount and timestamp are preserved — only the balance snapshot,
	 * which is stale once the ceiling it was computed against changes, is replaced.
	 *
	 * {@link setDebtForNewCycle} - The sole caller; recomputes history when the total changes.
	 *
	 * @param payments - The entry's current payment history, keyed by insertion index.
	 * @param newTotal - The new total ceiling to recompute the running balance from.
	 * @returns A new payments record with every entry's balance recalculated.
	 */
	private recomputeHistoryBalances(
		payments: Record<number, PaymentEntry>,
		newTotal: number
	): Record<number, PaymentEntry> {
		const orderedKeys = Object.keys(payments)
			.map(Number)
			.sort((a, b) => a - b);
		let runningBalance = newTotal;
		const recomputed: Record<number, PaymentEntry> = {};
		for (const key of orderedKeys) {
			runningBalance = Utilities.roundToTwoDecimals(runningBalance - payments[key].amount);
			recomputed[key] = { ...payments[key], balance: runningBalance };
		}
		return recomputed;
	}

	/**
	 * Recomputes the skeleton-card count from the grid's actual rendered column count, so the loading
	 * placeholder matches the columns the browser shows — desktop auto-fill and mobile overrides
	 * alike — times the row count, which grows to {@link SKELETON_MIN_COLUMN_ROWS} when the grid is
	 * at its minimum column count so a narrow screen still fills.
	 *
	 * {@link ngAfterViewInit} - Runs it on first render and on every container resize.
	 */
	private updateSkeletonCount(): void {
		const host = this.elementRef.nativeElement as HTMLElement;
		const grid = host.querySelector('.debts-grid') as HTMLElement | null;
		if (!grid) return;
		const columns = Utilities.countGridColumns(grid);
		if (!columns) return;

		// At the page's minimum (mobile) column count use taller rows so a narrow screen still fills.
		const rows = columns === DEBT_MIN_COLUMNS ? SKELETON_MIN_COLUMN_ROWS : DEBT_SKELETON_ROWS;
		this.skeletonCount = columns * rows;
		this.cdr.markForCheck();
	}

	// ── Template helper methods ───────────────────────────────────────────────

	/**
	 * Returns the array of indices used to render skeleton loading cards, sized to the responsive
	 * per-row count so the placeholder fills the same rows the real cards will.
	 *
	 * @returns Array of 0-based indices with length equal to the current skeleton count.
	 */
	protected get skeletonItems(): number[] {
		return Array.from({ length: this.skeletonCount }, (_, i) => i);
	}

	/**
	 * Groups Account Expenses items by currency (CNY for Chinese names,
	 * CAD otherwise) and computes totals and progress for the summary bar.
	 *
	 * @returns An array of per-currency summary objects.
	 */
	protected get currencyGroups(): {
		code: string;
		symbol: string;
		owed: number;
		original: number;
		paid: number;
		pct: number;
	}[] {
		// Step 1: Accumulate owed and original totals per currency — two-pass avoided by mutating in-place here
		const groups: Record<string, { owed: number; original: number }> = {};
		for (const item of this.updatedDebtSonataItems ?? []) {
			const code = this.isCnyCurrency(item) ? 'CNY' : 'CAD';
			if (!groups[code]) groups[code] = { owed: 0, original: 0 };
			groups[code].owed += item.debt ?? 0;
			groups[code].original += item.original ?? 0;
		}

		// Step 2: Derive paid amount and progress percentage per currency group
		/* paidAmount is clamped to 0 to avoid a negative "paid" value when overpayments push debt below zero.
		   pct is clamped to 100 so the progress bar never overflows its container. */
		return Object.entries(groups).map(([code, group]) => {
			const paidAmount = Math.max(0, group.original - group.owed);
			const pct =
				group.original > 0 ? Math.min(100, Math.round((paidAmount / group.original) * 100)) : 0;
			return {
				code,
				symbol: code === 'CNY' ? DEBT_CURRENCY_SYMBOL_CNY : DEBT_CURRENCY_SYMBOL_CAD,
				owed: group.owed,
				original: group.original,
				paid: paidAmount,
				pct
			};
		});
	}

	/**
	 * Counts Account Expenses items that are not yet paid.
	 *
	 * @returns The number of unpaid items.
	 */
	protected get activeCount(): number {
		return (this.updatedDebtSonataItems ?? []).filter((item) => !item.paid).length;
	}

	/**
	 * Counts Account Expenses items that have been marked as paid.
	 *
	 * @returns The number of paid items.
	 */
	protected get paidCount(): number {
		return (this.updatedDebtSonataItems ?? []).filter((item) => item.paid).length;
	}

	/**
	 * Counts active items whose due date falls within the next 14 days.
	 *
	 * @returns The count of items due within 14 days.
	 */
	protected get dueSoonCount(): number {
		return (this.updatedDebtSonataItems ?? []).filter((item) => {
			if (item.paid) return false;
			const status = this.getDueStatus(item.date);
			return status.soon && !status.overdue;
		}).length;
	}

	/**
	 * Counts active items whose due date has already passed.
	 *
	 * @returns The count of overdue items.
	 */
	protected get overdueCount(): number {
		return (this.updatedDebtSonataItems ?? []).filter((item) => {
			if (item.paid) return false;
			return this.getDueStatus(item.date).overdue;
		}).length;
	}

	/**
	 * Gets the total number of payments recorded in-session across all items.
	 *
	 * @returns The sum of all history entry counts.
	 */
	protected get totalPayments(): number {
		return Object.values(this.paymentsData).reduce(
			(sum, history) => sum + Object.keys(history).length,
			0
		);
	}

	/**
	 * Gets the category definition for the given item, assigned
	 * deterministically via a hash of the item's name.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns The DebtCategoryDef containing icon, label, and gradient.
	 */
	protected getCategoryForItem(item: DebtItem): DebtCategoryDef {
		if (item[DEBT_VALUE_KEY_CATEGORY]) {
			const stored = this.categoryDefs.find(
				(categoryDef) => categoryDef.key === item[DEBT_VALUE_KEY_CATEGORY]
			);
			if (stored) return stored;
		}
		return this.categoryDefs[this.getCategoryIndexForItem(item)];
	}

	/**
	 * Gets a human-readable due-date label for display in the due chip.
	 * Shows "Nd overdue", "N days left", "Due today/tomorrow", or a
	 * formatted month-day-year string for dates further than 30 days out.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns The due label string.
	 */
	protected getDueLabelForItem(item: DebtItem): string {
		const dateStr: string | null | undefined = item.date;
		if (!dateStr) return DEBT_DUE_LABEL_NONE;

		// Step 1: Resolve the signed day-difference — null means the date string is unparseable
		const diffDays = Utilities.getDaysUntilNumber(dateStr);
		if (diffDays === null) return DEBT_DUE_LABEL_NONE;

		// Step 2: Return the most specific short label for near-term dates
		if (diffDays < 0)
			return `${COUNTDOWN_DAYS_OVERDUE_PREFIX}${Math.abs(diffDays)}${COUNTDOWN_DAYS_OVERDUE_SUFFIX}`;
		if (diffDays === 0) return DEBT_DUE_LABEL_TODAY;
		if (diffDays === 1) return DEBT_DUE_LABEL_TOMORROW;
		if (diffDays <= 30) return `${diffDays}${DEBT_DAYS_LEFT_SUFFIX}`;

		/* Step 3: More than 30 days out — switch to a full calendar date so the chip does not
		   show an unwieldy "183d left" string that is hard to read at a glance.
		   Append 'T00:00' to force local-midnight parsing; omitting the time token causes
		   Date to interpret the string as UTC, shifting the displayed date by the local timezone offset. */
		const due = new Date(dateStr + 'T00:00');
		const m = MONTH_NAMES_SHORT[due.getMonth()];
		return `${m} ${due.getDate()}, ${due.getFullYear()}`;
	}

	/**
	 * Gets the Material Symbols icon name for the given item's due chip.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns The icon ligature string.
	 */
	protected getDueIconForItem(item: DebtItem): string {
		const status = this.getDueStatus(item.date);
		if (status.overdue) return DEBT_DUE_ICON_OVERDUE;
		return DEBT_DUE_ICON_DEFAULT;
	}

	/**
	 * Gets the CSS modifier class for the given item's due chip.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns 'is-over', 'is-soon', or empty string.
	 */
	protected getDueClassForItem(item: DebtItem): string {
		const status = this.getDueStatus(item.date);
		if (status.overdue) return DEBT_DUE_CLASS_OVERDUE;
		if (status.soon) return DEBT_DUE_CLASS_SOON;
		return '';
	}

	/**
	 * Formats an amount as a currency string with 0–2 decimal places.
	 * Places the minus sign before the symbol for negative values (e.g. -¥50).
	 * Uses ¥ for Chinese items, $ for all others.
	 *
	 * @param amount - The numeric value to format.
	 * @param isChinese - Whether to use the ¥ symbol.
	 * @returns A formatted currency string.
	 */
	protected formatMoney(amount: number, isChinese: boolean): string {
		return Utilities.formatMoney(amount, isChinese);
	}

	/**
	 * Delegates to Utilities to format an amount as a compact currency string
	 * (e.g. $1k for 1000). Used for the preset chip labels.
	 *
	 * @param amount - The numeric value to format.
	 * @param isChinese - Whether to use the ¥ symbol.
	 * @returns A compact currency label string.
	 */
	protected formatCompact(amount: number, isChinese: boolean): string {
		return Utilities.formatCompactMoney(amount, isChinese);
	}

	/**
	 * Computes the repayment progress percentage for a single item.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns A whole-number percentage between 0 and 100.
	 */
	protected getDebtProgress(item: DebtItem): number {
		const original: number = item.original ?? 0;
		if (original <= 0) return item.paid ? 100 : 0;
		const repaid = Math.max(0, original - (item.debt ?? 0));
		return Math.min(100, Math.round((repaid / original) * 100));
	}

	/**
	 * Delegates to Utilities to get the short month-day label from a payment timestamp string.
	 *
	 * @param timestamp - The payment timestamp in `'YYYY.MM.DD HH:mm:ss'` format.
	 * @returns A formatted date string such as "Jun 13".
	 */
	protected formatTimestampDate(timestamp: string): string {
		return Utilities.getTimestampMonthDay(timestamp);
	}

	/**
	 * Delegates to Utilities to get the HH:mm portion from a payment timestamp string.
	 *
	 * @param timestamp - The payment timestamp in `'YYYY.MM.DD HH:mm:ss'` format.
	 * @returns A formatted time string such as "09:27".
	 */
	protected formatTimestampTime(timestamp: string): string {
		return Utilities.getTimestampTime(timestamp);
	}

	/**
	 * Returns true when the given item is marked as a permanent account,
	 * meaning it is protected from deletion until unlocked.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns Whether the item has type 'permanent'.
	 */
	protected isItemPermanent(item: DebtItem): boolean {
		return item.type === DEBT_TYPE_PERMANENT;
	}

	/**
	 * Returns true when the item's currency is CNY. Uses the stored currency
	 * field as the authoritative source; falls back to Chinese-character detection
	 * on the item name for legacy records that pre-date explicit currency selection.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns Whether the item's currency is CNY.
	 */
	protected isCnyCurrency(item: DebtItem): boolean {
		const stored = item[DEBT_VALUE_KEY_CURRENCY];
		if (stored) return stored === DEBT_CURRENCY_CNY;
		return Utilities.checkIfChinese(item.name ?? '');
	}

	/**
	 * Returns true when the payment chips for the given item should be disabled.
	 * Chips are disabled when the item is marked paid or when the remaining balance
	 * is zero or negative — there is nothing left to subtract.
	 *
	 * @param item - The Account Expenses item (schema-less CloudBase document).
	 * @returns Whether the payment chips should be in a disabled state.
	 */
	protected isPayDisabled(item: DebtItem): boolean {
		return item.paid || item.debt <= 0;
	}

	/**
	 * Gets the indexed payment history entries for the given entry key,
	 * preserving the integer index so the delete action can target the
	 * correct field in the payments record.
	 *
	 * @param key - The unique key of the entry.
	 * @returns An array of objects containing the integer index and the payment entry value.
	 */
	protected getHistoryEntries(key: string): { index: number; value: PaymentEntry }[] {
		return Object.entries(this.paymentsData[key] ?? {}).map(([i, v]) => ({ index: +i, value: v }));
	}
}
