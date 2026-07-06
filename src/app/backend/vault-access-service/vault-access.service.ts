import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DatabaseService } from '../database-service/database.service';
import { CloudbaseService } from '../database-service/cloudbase/cloudbase.service';
import {
	STATS_FIELD_VAULT_GRACE,
	VAULT_GRACE_ALWAYS,
	VAULT_GRACE_UNTIL_RELOAD
} from '../../common/constants';

/**
 * Tracks whether the Vault passphrase gate can be skipped for a grace window after an unlock —
 * the "Cadence" preference set on the account page. All state is in-memory only, so a full page
 * reload always re-locks the vault; nothing about the unlock is ever persisted. The grace window
 * slides from the moment the user last left the vault.
 */
@Injectable({ providedIn: 'root' })
export class VaultAccessService {
	/** Live copy of the user's grace preference in minutes (0 = always require, -1 = until reload). */
	private graceMinutes = VAULT_GRACE_ALWAYS;
	/** True once the vault has been unlocked at least once in this app session. */
	private unlockedThisSession = false;
	/** Timestamp (ms) when the user last left the vault, or null if they never have. */
	private lastLeftAt: number | null = null;

	constructor(
		@Inject(PLATFORM_ID) private readonly platformId: object,
		private readonly databaseService: DatabaseService
	) {
		/* Keep graceMinutes in sync with the live user stats document so a change on the account page
		   takes effect on the next vault entry. Browser-only: getUserStats is a CloudbaseService op
		   (inline cast) not available during server-side prerendering. */
		if (isPlatformBrowser(this.platformId)) {
			(this.databaseService as CloudbaseService).getUserStats().subscribe((doc) => {
				if (!doc) return;
				this.graceMinutes = (doc[STATS_FIELD_VAULT_GRACE] as number) ?? VAULT_GRACE_ALWAYS;
			});
		}
	}

	/**
	 * Decides whether the passphrase gate can be skipped on this vault entry. Always false until the
	 * vault has been unlocked once this session, so the first visit always prompts. Otherwise skips
	 * when set to "until reload", or when still within the minute window since the user last left.
	 *
	 * @returns True to skip the passphrase gate, false to show it.
	 */
	public shouldSkipPassphrase(): boolean {
		if (!this.unlockedThisSession) return false;
		if (this.graceMinutes === VAULT_GRACE_UNTIL_RELOAD) return true;
		if (this.graceMinutes === VAULT_GRACE_ALWAYS) return false;
		return this.lastLeftAt !== null && Date.now() - this.lastLeftAt <= this.graceMinutes * 60_000;
	}

	/**
	 * Records that the vault has been unlocked this session, enabling the grace window.
	 */
	public markUnlocked(): void {
		this.unlockedThisSession = true;
	}

	/**
	 * Stamps the moment the user left the vault, from which the minute grace window is measured.
	 */
	public markLeft(): void {
		this.lastLeftAt = Date.now();
	}
}
