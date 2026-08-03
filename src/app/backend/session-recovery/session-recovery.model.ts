export type AuthValidationStatus = 'valid' | 'expired' | 'unknown';

export type RecoveryStatus = 'recovered' | 'expired' | 'offline';

export type RecoveryTrigger = 'startup' | 'resume' | 'online' | 'watch-error' | 'write-error';
