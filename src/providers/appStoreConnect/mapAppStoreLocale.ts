const SUPPORTED = new Set([
  'ar-SA', 'bn', 'ca', 'zh-Hans', 'zh-Hant', 'hr', 'cs', 'da', 'nl-NL',
  'en-AU', 'en-CA', 'en-GB', 'en-US', 'fi', 'fr-FR', 'fr-CA', 'de-DE', 'el',
  'gu', 'he', 'hi', 'hu', 'id', 'it', 'ja', 'kn', 'ko', 'ms', 'ml', 'mr', 'no',
  'or', 'pl', 'pt-BR', 'pt-PT', 'pa', 'ro', 'ru', 'sk', 'sl', 'es-MX', 'es-ES',
  'sv', 'ta', 'te', 'th', 'tr', 'uk', 'ur', 'vi',
]);

export function mapAppStoreLocale(locale: string): string | null {
  if (SUPPORTED.has(locale)) return locale;
  const parsed = new Intl.Locale(locale);
  if (parsed.language === 'zh') return mapChinese(parsed);
  if (parsed.language === 'fr') return parsed.region === 'CA' ? 'fr-CA' : 'fr-FR';
  return uniqueLanguageLocale(parsed.language);
}

function uniqueLanguageLocale(language: string): string | null {
  switch (language) {
    case 'ar': return 'ar-SA';
    case 'bn': return 'bn';
    case 'ca': return 'ca';
    case 'hr': return 'hr';
    case 'cs': return 'cs';
    case 'da': return 'da';
    case 'nl': return 'nl-NL';
    case 'fi': return 'fi';
    case 'de': return 'de-DE';
    case 'el': return 'el';
    case 'gu': return 'gu';
    case 'he': return 'he';
    case 'hi': return 'hi';
    case 'hu': return 'hu';
    case 'id': return 'id';
    case 'it': return 'it';
    case 'ja': return 'ja';
    case 'kn': return 'kn';
    case 'ko': return 'ko';
    case 'ms': return 'ms';
    case 'ml': return 'ml';
    case 'mr': return 'mr';
    case 'no': return 'no';
    case 'or': return 'or';
    case 'pl': return 'pl';
    case 'pa': return 'pa';
    case 'ro': return 'ro';
    case 'ru': return 'ru';
    case 'sk': return 'sk';
    case 'sl': return 'sl';
    case 'sv': return 'sv';
    case 'ta': return 'ta';
    case 'te': return 'te';
    case 'th': return 'th';
    case 'tr': return 'tr';
    case 'uk': return 'uk';
    case 'ur': return 'ur';
    case 'vi': return 'vi';
    default: return null;
  }
}

function mapChinese(locale: Intl.Locale): string | null {
  if (locale.script === 'Hans' || locale.region === 'CN' || locale.region === 'SG') {
    return 'zh-Hans';
  }
  if (locale.script === 'Hant' || ['TW', 'HK', 'MO'].includes(locale.region ?? '')) {
    return 'zh-Hant';
  }
  return null;
}
