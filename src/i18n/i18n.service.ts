import { Injectable } from '@nestjs/common';
import enTranslations from './locales/en.json' with { type: 'json' };
import arTranslations from './locales/ar.json' with { type: 'json' };

export type SupportedLanguage = 'en' | 'ar';

@Injectable()
export class I18nService {
  private readonly locales: Record<SupportedLanguage, Record<string, any>> = {
    en: enTranslations,
    ar: arTranslations,
  };

  /**
   * Resolves language from query param or Accept-Language header.
   */
  resolveLanguage(headerOrQuery?: string | null): SupportedLanguage {
    if (!headerOrQuery) return 'en';
    const normalized = headerOrQuery.toLowerCase();
    if (normalized.includes('ar')) return 'ar';
    return 'en';
  }

  /**
   * Translates a dot-notated key for the specified language.
   * e.g. translate('health.title', 'ar')
   */
  translate(key: string, lang: SupportedLanguage = 'en', params?: Record<string, string | number>): string {
    const dictionary = this.locales[lang] || this.locales.en;
    const parts = key.split('.');
    let current: any = dictionary;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        // Fallback to English dictionary
        current = this.lookupFallback(key);
        break;
      }
    }

    if (typeof current !== 'string') {
      return key;
    }

    if (params) {
      return Object.entries(params).reduce(
        (acc, [paramKey, paramVal]) => acc.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramVal)),
        current,
      );
    }

    return current;
  }

  private lookupFallback(key: string): string {
    const parts = key.split('.');
    let current: any = this.locales.en;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return key;
      }
    }
    return typeof current === 'string' ? current : key;
  }
}
