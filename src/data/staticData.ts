import countriesLib from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import currencyCodes from 'currency-codes';

countriesLib.registerLocale(enLocale);

const countriesObj = countriesLib.getNames('en', { select: 'official' });
export const COUNTRIES: string[] = Object.values(countriesObj).sort();

export const CURRENCIES = currencyCodes.data
  .filter((c) => c.currency && c.code)
  .map((c) => ({
    code: c.code,
    symbol: c.currency,
    name: c.currency,
  }))
  .filter((c, index, self) => self.findIndex((x) => x.code === c.code) === index)
  .sort((a, b) => a.code.localeCompare(b.code));

export const LANGUAGES = [
  'Afrikaans', 'Albanian', 'Arabic', 'Armenian', 'Azerbaijani', 'Basque',
  'Belarusian', 'Bengali', 'Bosnian', 'Bulgarian', 'Catalan', 'Chinese (Simplified)',
  'Chinese (Traditional)', 'Croatian', 'Czech', 'Danish', 'Dutch', 'English',
  'Estonian', 'Finnish', 'French', 'Galician', 'Georgian', 'German', 'Greek',
  'Gujarati', 'Haitian Creole', 'Hebrew', 'Hindi', 'Hungarian', 'Icelandic',
  'Indonesian', 'Irish', 'Italian', 'Japanese', 'Kannada', 'Kazakh', 'Korean',
  'Latvian', 'Lithuanian', 'Macedonian', 'Malay', 'Maltese', 'Marathi',
  'Mongolian', 'Nepali', 'Norwegian', 'Persian', 'Polish', 'Portuguese',
  'Romanian', 'Russian', 'Serbian', 'Slovak', 'Slovenian', 'Spanish',
  'Swahili', 'Swedish', 'Tamil', 'Telugu', 'Thai', 'Turkish', 'Ukrainian',
  'Urdu', 'Uzbek', 'Vietnamese', 'Welsh',
];