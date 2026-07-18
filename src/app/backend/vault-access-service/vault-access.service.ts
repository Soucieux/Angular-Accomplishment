import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DatabaseService } from '../database-service/database.service';
import { Utilities } from '../../common/utilities/app.utilities';
import {
	LS_VAULT_UNLOCKED_KEY,
	STATS_FIELD_VAULT_GRACE,
	STATS_FIELD_VAULT_LAST_LEFT,
	VAULT_GRACE_ALWAYS,
	VAULT_GRACE_UNTIL_RELOAD
} from '../../common/constants';

/**
 * Tracks whether the Vault passphrase gate can be skipped for a grace window after an unlock —
 * the "Cadence" preference set on the account page. Two different state pieces, persisted two
 * different ways: whether this specific device has ever unlocked the vault before is a
 * per-device bootstrap flag in localStorage (mirroring the auth-hint cache pattern), so a brand
 * new device always prompts once regardless of the Cadence preference. The moment the vault was
 * last left, from which the minute-based grace window slides, lives on the user's CloudBase stats
 * document instead — shared live across every device that has already bootstrapped, so leaving
 * the vault on one device slides the grace window for all of them, not just that one device.
 * Only "always require" (VAULT_GRACE_ALWAYS) re-prompts unconditionally regardless of any of this.
 */
@Injectable({ providedIn: 'root' })
export class VaultAccessService {
	/** Live copy of the user's grace preference in minutes (0 = always require, -1 = until reload). */
	private graceMinutes = VAULT_GRACE_ALWAYS;
	/** True once this device has unlocked the vault at least once, restored from localStorage. */
	private hasUnlockedBefore = false;
	/** True once unlocked during this page load — "until reload" is intentionally never persisted. */
	private unlockedThisPageLoad = false;
	/** Timestamp (ms) the vault was last left, on any device — read live from the user's stats document. */
	private lastLeftAt: number | null = null;

	constructor(
		@Inject(PLATFORM_ID) private readonly platformId: object,
		private readonly databaseService: DatabaseService,
		private readonly utilities: Utilities
	) {
		/* Keep graceMinutes and lastLeftAt in sync with the live user stats document so a change on
		   the account page, or a "left the vault" stamp from another device, takes effect immediately.
		   Browser-only: the database providers are registered in the browser bootstrap, not during SSR. */
		if (isPlatformBrowser(this.platformId)) {
			this.hasUnlockedBefore = localStorage.getItem(LS_VAULT_UNLOCKED_KEY) === '1';

			/* Clears the persisted unlock the moment the session goes cold, so a different user
			   signing in on the same browser never inherits a stale skip-the-gate state. */
			this.utilities.getIsUserAlive$().subscribe((isAlive) => {
				if (!isAlive) this.clearUnlock();
			});

			this.databaseService.getUserStats().subscribe((doc) => {
				if (!doc) return;
				this.graceMinutes = (doc[STATS_FIELD_VAULT_GRACE] as number) ?? VAULT_GRACE_ALWAYS;
				this.lastLeftAt = (doc[STATS_FIELD_VAULT_LAST_LEFT] as number) ?? null;
			});
		}
	}

	/**
	 * Decides whether the passphrase gate can be skipped on this vault entry. Always false until
	 * this device has unlocked the vault once, so a brand new device always prompts. Otherwise skips
	 * when set to "until reload" and still within this same page load, or when still within the
	 * minute window since the vault was last left on any device.
	 *
	 * @returns True to skip the passphrase gate, false to show it.
	 */
	public shouldSkipPassphrase(): boolean {
		if (!this.hasUnlockedBefore) return false;
		if (this.graceMinutes === VAULT_GRACE_ALWAYS) return false;
		if (this.graceMinutes === VAULT_GRACE_UNTIL_RELOAD) return this.unlockedThisPageLoad;
		return this.lastLeftAt !== null && Date.now() - this.lastLeftAt <= this.graceMinutes * 60_000;
	}

	/**
	 * Records that the vault has been unlocked: marks this device as bootstrapped, persisting the
	 * flag to localStorage so a future page reload does not force the gate back open, and enables
	 * the in-memory "until reload" grace for the remainder of this page load.
	 */
	public markUnlocked(): void {
		this.hasUnlockedBefore = true;
		this.unlockedThisPageLoad = true;
		if (isPlatformBrowser(this.platformId)) {
			localStorage.setItem(LS_VAULT_UNLOCKED_KEY, '1');
		}
	}

	/**
	 * Stamps the moment the user left the vault, from which the minute grace window is measured, and
	 * writes it to the user's CloudBase stats document so every bootstrapped device shares the same
	 * window. Updates the local copy immediately so this device does not wait on the round-trip.
	 */
	public markLeft(): void {
		this.lastLeftAt = Date.now();
		if (isPlatformBrowser(this.platformId)) {
			this.databaseService
				.updateUserStatsFields({ [STATS_FIELD_VAULT_LAST_LEFT]: this.lastLeftAt })
				.catch(() => {});
		}
	}

	/**
	 * Clears the persisted unlock state, in memory and in localStorage, so a future entry always
	 * shows the passphrase gate again. Triggered on sign-out to prevent a different user on the
	 * same device from inheriting an unlocked vault.
	 */
	private clearUnlock(): void {
		this.hasUnlockedBefore = false;
		this.unlockedThisPageLoad = false;
		if (isPlatformBrowser(this.platformId)) {
			localStorage.removeItem(LS_VAULT_UNLOCKED_KEY);
		}
	}
}
