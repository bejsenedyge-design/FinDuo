/**
 * FinTrack i18n & Formatting Helpers
 * Depends on: config.js (LANGS)
 */

/** Translate a key for the current language */
function t(key) {
  return (LANGS[window._lang] || LANGS['ru'])[key]
      || LANGS['ru'][key]
      || key;
}

/** Format a number as KZT currency */
function fmoney(n) {
  return new Intl.NumberFormat('ru-KZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n) + ' ₸';
}

/** Format a date for the current locale */
function fdate(isoString) {
  const lang = window._lang || 'ru';
  const locale = lang === 'ru' ? 'ru-RU' : lang === 'kz' ? 'kk-KZ' : 'en-US';
  return new Date(isoString).toLocaleDateString(locale, {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}
