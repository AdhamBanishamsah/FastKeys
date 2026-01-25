// Language translations
const translations = {
  en: {
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    hijriMonths: ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah']
  },
  no: {
    months: ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'],
    weekdays: ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'],
    hijriMonths: ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah']
  },
  es: {
    months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    weekdays: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    hijriMonths: ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah']
  },
  fr: {
    months: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
    weekdays: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
    hijriMonths: ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah']
  },
  de: {
    months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    weekdays: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    hijriMonths: ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah']
  },
  it: {
    months: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
    weekdays: ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'],
    hijriMonths: ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah']
  },
  pt: {
    months: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
    weekdays: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'],
    hijriMonths: ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah']
  },
  nl: {
    months: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
    weekdays: ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],
    hijriMonths: ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah']
  },
  sv: {
    months: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'],
    weekdays: ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'],
    hijriMonths: ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah']
  },
  da: {
    months: ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'],
    weekdays: ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'],
    hijriMonths: ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah']
  },
  ar: {
    months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    weekdays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    hijriMonths: ['محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة']
  }
};

const getOrdinalSuffix = (day, lang = 'en') => {
  if (lang === 'ar') return ''; // Arabic doesn't use ordinal suffixes
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return lang === 'no' || lang === 'da' ? '.' : 'st';
    case 2: return lang === 'no' || lang === 'da' ? '.' : 'nd';
    case 3: return lang === 'no' || lang === 'da' ? '.' : 'rd';
    default: return 'th';
  }
};

const formatMonth = (month, lang = 'en') => {
  const t = translations[lang] || translations.en;
  return t.months[month];
};

const formatWeekday = (day, lang = 'en') => {
  const t = translations[lang] || translations.en;
  return t.weekdays[day];
};

// Hijri (Islamic) Calendar Conversion
const gregorianToHijri = (date) => {
  const gregorianEpoch = new Date(622, 6, 16); // July 16, 622 CE
  const diffTime = date - gregorianEpoch;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  let hijriYear = Math.floor(diffDays / 354.367) + 1;
  let remainingDays = diffDays % 354.367;
  
  let hijriMonth = Math.floor(remainingDays / 29.5) + 1;
  let hijriDay = Math.floor(remainingDays % 29.5) + 1;
  
  const hijriMonthLengths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
  if (hijriDay > hijriMonthLengths[(hijriMonth - 1) % 12]) {
    hijriDay = hijriMonthLengths[(hijriMonth - 1) % 12];
  }
  
  if (hijriMonth > 12) hijriMonth = 12;
  if (hijriDay < 1) hijriDay = 1;
  if (hijriDay > 30) hijriDay = 30;
  
  return { year: hijriYear, month: hijriMonth, day: hijriDay };
};

const formatHijriMonth = (month, lang = 'en') => {
  const t = translations[lang] || translations.en;
  return t.hijriMonths[month - 1] || '';
};

/** Strftime-style tokens: %Y %y %m %d %H %M %S %I %p %B %b %A %a. Literal %% = %. */
export const formatDateWithTemplate = (template, lang = 'en') => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const weekday = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ampm = hours >= 12 ? 'pm' : 'am';
  const displayHours12 = hours % 12 || 12;
  const t = translations[lang] || translations.en;
  const monthName = t.months[month];
  const monthAbbr = monthName.slice(0, 3);
  const weekdayName = t.weekdays[weekday];
  const weekdayAbbr = weekdayName.slice(0, 3);
  const pad2 = (n) => String(n).padStart(2, '0');

  const tokens = {
    '%Y': String(year),
    '%y': String(year).slice(-2),
    '%m': pad2(month + 1),
    '%d': pad2(day),
    '%H': pad2(hours),
    '%M': pad2(minutes),
    '%S': pad2(seconds),
    '%I': pad2(displayHours12),
    '%p': ampm.toUpperCase(),
    '%B': monthName,
    '%b': monthAbbr,
    '%A': weekdayName,
    '%a': weekdayAbbr
  };

  let out = '';
  for (let i = 0; i < template.length; i++) {
    if (template[i] === '%' && template[i + 1] === '%') {
      out += '%';
      i += 1;
      continue;
    }
    if (template[i] === '%' && template[i + 1]) {
      const two = template.slice(i, i + 2);
      if (tokens[two] !== undefined) {
        out += tokens[two];
        i += 1;
        continue;
      }
    }
    out += template[i];
  }
  return out;
};

export const formatDate = (format = 'long', lang = 'en', customFormats = null) => {
  if (customFormats && typeof customFormats[format] === 'string') {
    return formatDateWithTemplate(customFormats[format], lang);
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const weekday = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');

  // Hijri date formats
  if (format.startsWith('hijri_')) {
    const hijri = gregorianToHijri(now);
    const hijriMonthName = formatHijriMonth(hijri.month, lang);
    
    switch (format) {
      case 'hijri_long':
        return `${hijri.day} ${hijriMonthName} ${hijri.year}`;
      case 'hijri_short':
        return `${hijri.day.toString().padStart(2, '0')}/${hijri.month.toString().padStart(2, '0')}/${hijri.year}`;
      case 'hijri_full':
        return `${hijri.day} ${hijriMonthName} ${hijri.year} AH`;
      case 'hijri_weekday':
        return `${formatWeekday(weekday, lang)} ${hijri.day} ${hijriMonthName} ${hijri.year}`;
      default:
        return `${hijri.day} ${hijriMonthName} ${hijri.year}`;
    }
  }

  // Gregorian date formats
  const monthName = formatMonth(month, lang);
  const weekdayName = formatWeekday(weekday, lang);
  const ordinal = getOrdinalSuffix(day, lang);
  
  switch (format) {
    case 'long':
      return `${monthName} ${day}${ordinal}, ${year}`;
    case 'short':
      return `${(month + 1).toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
    case 'iso':
      return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    case 'weekday_long':
      return `${weekdayName} ${monthName} ${day}${ordinal}, ${year}`;
    case 'long_time':
      return `${monthName} ${day}${ordinal}, ${year}, ${displayHours}:${displayMinutes} ${ampm}`;
    case 'short_time':
      return `${(month + 1).toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year} ${displayHours}:${displayMinutes} ${ampm.toUpperCase()}`;
    case 'time_only':
      return `${displayHours}:${displayMinutes} ${ampm}`;
    case 'month_year':
      return `${monthName} ${year}`;
    case 'day_month':
      return `${day} ${monthName}`;
    default:
      return `${monthName} ${day}${ordinal}, ${year}`;
  }
};
