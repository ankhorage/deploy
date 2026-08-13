const SUPPORTED = new Set([
  'ar-SA',
  'bn',
  'ca',
  'zh-Hans',
  'zh-Hant',
  'hr',
  'cs',
  'da',
  'nl-NL',
  'en-AU',
  'en-CA',
  'en-GB',
  'en-US',
  'fi',
  'fr-FR',
  'fr-CA',
  'de-DE',
  'el',
  'gu',
  'he',
  'hi',
  'hu',
  'id',
  'it',
  'ja',
  'kn',
  'ko',
  'ms',
  'ml',
  'mr',
  'no',
  'or',
  'pl',
  'pt-BR',
  'pt-PT',
  'pa',
  'ro',
  'ru',
  'sk',
  'sl',
  'es-MX',
  'es-ES',
  'sv',
  'ta',
  'te',
  'th',
  'tr',
  'uk',
  'ur',
  'vi',
]);

const LANGUAGE_DEFAULT_LOCALES: Readonly<Record<string, string>> = {
  ar: 'ar-SA',
  bn: 'bn',
  ca: 'ca',
  hr: 'hr',
  cs: 'cs',
  da: 'da',
  nl: 'nl-NL',
  fi: 'fi',
  de: 'de-DE',
  el: 'el',
  gu: 'gu',
  he: 'he',
  hi: 'hi',
  hu: 'hu',
  id: 'id',
  it: 'it',
  ja: 'ja',
  kn: 'kn',
  ko: 'ko',
  ms: 'ms',
  ml: 'ml',
  mr: 'mr',
  no: 'no',
  or: 'or',
  pl: 'pl',
  pa: 'pa',
  ro: 'ro',
  ru: 'ru',
  sk: 'sk',
  sl: 'sl',
  sv: 'sv',
  ta: 'ta',
  te: 'te',
  th: 'th',
  tr: 'tr',
  uk: 'uk',
  ur: 'ur',
  vi: 'vi',
};

export function mapAppStoreLocale(locale: string): string | null {
  if (SUPPORTED.has(locale)) return locale;
  const parsed = new Intl.Locale(locale);
  if (parsed.language === 'zh') return mapChinese(parsed);
  if (parsed.language === 'fr') return parsed.region === 'CA' ? 'fr-CA' : 'fr-FR';
  return LANGUAGE_DEFAULT_LOCALES[parsed.language] ?? null;
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
