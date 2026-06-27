import { Injectable } from '@angular/core';
import { LS_LOCALE_KEY } from '../constants';
import { ACTIVE_LOCALE } from './locale-strings';

@Injectable({
	providedIn: 'root'
})
export class LocaleService {
	/** Currently active locale key for this session, resolved at module load by locale-strings. */
	readonly currentLocale: 'en' | 'zh' = ACTIVE_LOCALE;

	/**
	 * Persists the chosen locale to localStorage then reloads the page so all
	 * components pick up the new locale strings on the next load.
	 *
	 * @param locale - The locale key to apply: 'en' or 'zh'.
	 */
	public applyLocale(locale: 'en' | 'zh'): void {
		localStorage.setItem(LS_LOCALE_KEY, locale);
		window.location.reload();
	}
}
