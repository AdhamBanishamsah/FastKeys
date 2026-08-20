// Inline storage utilities (content scripts can't use ES modules in MV3)
// Version: 1.0.3 - Fixed async/await in showAutofillPanel

// True once the extension is reloaded/updated while this content script instance is
// still alive on an old page. After that, every chrome.* call throws
// "Extension context invalidated" — detect it once and tear ourselves down instead
// of retrying and logging an error on every keystroke.
let extensionContextInvalidated = false;
const isExtensionContextValid = () => {
  if (extensionContextInvalidated) return false;
  try {
    if (!chrome.runtime || !chrome.runtime.id) {
      extensionContextInvalidated = true;
      return false;
    }
  } catch (e) {
    extensionContextInvalidated = true;
    return false;
  }
  return true;
};

const teardownOnInvalidatedContext = () => {
  extensionContextInvalidated = true;
  try {
    document.removeEventListener('keydown', handleKeyDown, true);
    window.removeEventListener('keydown', handleKeyDown, true);
    observer.disconnect();
  } catch (e) {
    // Best-effort cleanup; nothing else to do.
  }
  console.warn('FastKeys: extension was reloaded/updated. Refresh this page to restore text expansion.');
};

const storage = {
  async get(key) {
    try {
      const result = await chrome.storage.sync.get(key);
      return result[key];
    } catch (error) {
      console.warn('Sync storage failed, falling back to local:', error);
      const result = await chrome.storage.local.get(key);
      return result[key];
    }
  },
  async set(data) {
    try {
      await chrome.storage.sync.set(data);
    } catch (error) {
      console.warn('Sync storage failed, falling back to local:', error);
      await chrome.storage.local.set(data);
    }
  },
  async getTemplates() {
    try {
      const [syncResult, localResult] = await Promise.all([
        chrome.storage.sync.get('templates').catch(() => ({})),
        chrome.storage.local.get('templates').catch(() => ({}))
      ]);
      const syncTemplates = syncResult.templates || [];
      const localTemplates = localResult.templates || [];
      if (syncTemplates.length === 0 && localTemplates.length > 0) return localTemplates;
      if (localTemplates.length === 0) return syncTemplates;
      const merged = new Map();
      syncTemplates.forEach(t => merged.set(t.id, t));
      localTemplates.forEach(t => {
        if (!merged.has(t.id)) merged.set(t.id, t);
      });
      return Array.from(merged.values());
    } catch (error) {
      console.warn('Storage read failed, falling back to get:', error);
      const templates = await this.get('templates');
      return templates || [];
    }
  },
  async getSettings() {
    const settings = await this.get('settings');
    return settings || { profile: {} };
  },
  async saveSettings(settings) {
    await this.set({ settings });
  }
};

// Date formatting utilities with multi-language support
const translations = {
  en: { months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], hijriMonths: ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'] },
  no: { months: ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'], weekdays: ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'], hijriMonths: ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'] },
  es: { months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'], weekdays: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'], hijriMonths: ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'] },
  fr: { months: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'], weekdays: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'], hijriMonths: ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'] },
  de: { months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'], weekdays: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'], hijriMonths: ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'] },
  it: { months: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'], weekdays: ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'], hijriMonths: ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'] },
  pt: { months: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'], weekdays: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'], hijriMonths: ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'] },
  nl: { months: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'], weekdays: ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'], hijriMonths: ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'] },
  sv: { months: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], weekdays: ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'], hijriMonths: ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'] },
  da: { months: ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'], weekdays: ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'], hijriMonths: ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'] },
  ar: { months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'], weekdays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'], hijriMonths: ['محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'] }
};

const formatDateWithTemplate = (template, lang = 'en') => {
  const now = new Date();
  const t = translations[lang] || translations.en;
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const weekday = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ampm = hours >= 12 ? 'pm' : 'am';
  const displayHours12 = hours % 12 || 12;
  const monthName = t.months[month];
  const monthAbbr = monthName.slice(0, 3);
  const weekdayName = t.weekdays[weekday];
  const weekdayAbbr = weekdayName.slice(0, 3);
  const pad2 = (n) => String(n).padStart(2, '0');
  const tokens = {
    '%Y': String(year), '%y': String(year).slice(-2), '%m': pad2(month + 1), '%d': pad2(day),
    '%H': pad2(hours), '%M': pad2(minutes), '%S': pad2(seconds), '%I': pad2(displayHours12),
    '%p': ampm.toUpperCase(), '%B': monthName, '%b': monthAbbr, '%A': weekdayName, '%a': weekdayAbbr
  };
  let out = '';
  for (let i = 0; i < template.length; i++) {
    if (template[i] === '%' && template[i + 1] === '%') { out += '%'; i += 1; continue; }
    if (template[i] === '%' && template[i + 1]) {
      const two = template.slice(i, i + 2);
      if (tokens[two] !== undefined) { out += tokens[two]; i += 1; continue; }
    }
    out += template[i];
  }
  return out;
};

const formatDate = (format = 'long', lang = 'en', customFormats = null) => {
  if (customFormats && typeof customFormats[format] === 'string') {
    return formatDateWithTemplate(customFormats[format], lang);
  }
  const t = translations[lang] || translations.en;
  const getOrdinalSuffix = (day) => {
    if (lang === 'ar') return '';
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return lang === 'no' || lang === 'da' ? '.' : 'st';
      case 2: return lang === 'no' || lang === 'da' ? '.' : 'nd';
      case 3: return lang === 'no' || lang === 'da' ? '.' : 'rd';
      default: return 'th';
    }
  };
  const formatMonth = (month) => t.months[month];
  const formatWeekday = (day) => t.weekdays[day];
  const gregorianToHijri = (date) => {
    const gregorianEpoch = new Date(622, 6, 16);
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
  const formatHijriMonth = (month) => t.hijriMonths[month - 1] || '';
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
  if (format.startsWith('hijri_')) {
    const hijri = gregorianToHijri(now);
    const hijriMonthName = formatHijriMonth(hijri.month);
    switch (format) {
      case 'hijri_long': return `${hijri.day} ${hijriMonthName} ${hijri.year}`;
      case 'hijri_short': return `${hijri.day.toString().padStart(2, '0')}/${hijri.month.toString().padStart(2, '0')}/${hijri.year}`;
      case 'hijri_full': return `${hijri.day} ${hijriMonthName} ${hijri.year} AH`;
      case 'hijri_weekday': return `${formatWeekday(weekday)} ${hijri.day} ${hijriMonthName} ${hijri.year}`;
      default: return `${hijri.day} ${hijriMonthName} ${hijri.year}`;
    }
  }
  const monthName = formatMonth(month);
  const weekdayName = formatWeekday(weekday);
  const ordinal = getOrdinalSuffix(day);
  switch (format) {
    case 'long': return `${monthName} ${day}${ordinal}, ${year}`;
    case 'short': return `${(month + 1).toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
    case 'iso': return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    case 'weekday_long': return `${weekdayName} ${monthName} ${day}${ordinal}, ${year}`;
    case 'long_time': return `${monthName} ${day}${ordinal}, ${year}, ${displayHours}:${displayMinutes} ${ampm}`;
    case 'short_time': return `${(month + 1).toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year} ${displayHours}:${displayMinutes} ${ampm.toUpperCase()}`;
    case 'time_only': return `${displayHours}:${displayMinutes} ${ampm}`;
    case 'month_year': return `${monthName} ${year}`;
    case 'day_month': return `${day} ${monthName}`;
    default: return `${monthName} ${day}${ordinal}, ${year}`;
  }
};

// Template processing
const processTemplate = async (templateBody, profile = {}) => {
  let processed = templateBody;
  
  // Replace date variables
  processed = processed.replace(/\{\{date:(\w+)\}\}/g, (match, format) => formatDate(format, language, customDateFormats));
  processed = processed.replace(/\{\{date\}\}/g, () => formatDate('long', language, customDateFormats));
  
  // Replace standard profile variables
  processed = processed.replace(/\{\{first_name\}\}/g, profile.first_name || '{{first_name}}');
  processed = processed.replace(/\{\{last_name\}\}/g, profile.last_name || '{{last_name}}');
  processed = processed.replace(/\{\{email\}\}/g, profile.email || '{{email}}');
  
  // Replace custom variables
  if (profile.custom) {
    Object.keys(profile.custom).forEach(varName => {
      const regex = new RegExp(`\\{\\{${varName}\\}\\}`, 'g');
      processed = processed.replace(regex, profile.custom[varName] || `{{${varName}}}`);
    });
  }
  
  // Replace any other variables that might exist in profile (fallback)
  Object.keys(profile).forEach(key => {
    if (key !== 'custom' && !['first_name', 'last_name', 'email'].includes(key)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processed = processed.replace(regex, profile[key] || `{{${key}}}`);
    }
  });
  
  return processed;
};

let templates = [];
let profile = {};
let language = 'en';
let customDateFormats = {};

const loadTemplates = async () => {
  templates = await storage.getTemplates();
  const settings = await storage.getSettings();
  profile = settings.profile || {};
  language = settings.language || 'en';
  customDateFormats = settings.customDateFormats || {};
};

const saveProfile = async (newProfile) => {
  // Merge profile, preserving existing custom variables
  profile = { ...profile };
  if (newProfile.custom) {
    profile.custom = { ...(profile.custom || {}), ...newProfile.custom };
  }
  // Merge other fields
  Object.keys(newProfile).forEach(key => {
    if (key !== 'custom') {
      profile[key] = newProfile[key];
    }
  });
  
  const settings = await storage.getSettings();
  settings.profile = profile;
  await storage.saveSettings(settings);
};

const isTriggerBoundary = (text, triggerIndex) => {
  if (triggerIndex === 0) return true;
  const charBefore = text[triggerIndex - 1];
  return /\s|[.,!?;:]/.test(charBefore);
};

const findTrigger = (text, cursorPos) => {
  for (const template of templates) {
    const trigger = template.trigger;
    // Try multiple positions around cursor
    const searchPositions = [cursorPos, cursorPos - 1, cursorPos - 2];
    
    for (const searchPos of searchPositions) {
      if (searchPos < 0) continue;
      
      const index = text.lastIndexOf(trigger, searchPos);
      if (index !== -1 && isTriggerBoundary(text, index)) {
        const endIndex = index + trigger.length;
        // Check if trigger ends at or near cursor
        if (endIndex === cursorPos || endIndex === cursorPos - 1 || endIndex === cursorPos - 2) {
          return { template, startIndex: index, endIndex };
        }
      }
    }
  }
  return null;
};

const insertText = (element, text, isHTML = false) => {
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    element.value = value.slice(0, start) + text + value.slice(end);
    element.selectionStart = element.selectionEnd = start + text.length;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (isEditableRichElement(element)) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      if (isHTML) {
        try {
          document.execCommand('insertHTML', false, text);
        } catch (e) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = text;
          const fragment = document.createDocumentFragment();
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
          }
          range.insertNode(fragment);
        }
      } else {
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
};

/**
 * Find the best document/window to render floating UI (the autofill panel) into.
 * If the current frame is nested inside same-origin ancestor frames (e.g. a small
 * Kendo Editor iframe), walk up to the top-most accessible ancestor so the panel
 * gets the full page viewport instead of being squeezed into a tiny iframe. Returns
 * the accumulated offset needed to translate a rect from the current frame's
 * coordinates into the chosen host document's coordinates. Falls back to the local
 * document if any ancestor is cross-origin.
 */
const getPanelRenderContext = () => {
  let win = window;
  let offsetX = 0;
  let offsetY = 0;
  while (win !== win.top) {
    let frame;
    let parentWin;
    try {
      frame = win.frameElement;
      parentWin = win.parent;
      // Accessing .document on a cross-origin window throws.
      void parentWin.document;
    } catch (e) {
      break;
    }
    if (!frame) break;
    const frameRect = frame.getBoundingClientRect();
    offsetX += frameRect.left;
    offsetY += frameRect.top;
    win = parentWin;
  }
  return { doc: win.document, win, offsetX, offsetY };
};

const showAutofillPanel = async (element, template, variables) => {
  // Get language from settings first (outside Promise)
  const settings = await storage.getSettings();
  const lang = settings.language || 'en';
  
  return new Promise((resolve) => {
    const getVariableValue = (varName) => {
      // Check standard fields
      if (varName === 'first_name') return profile.first_name || '';
      if (varName === 'last_name') return profile.last_name || '';
      if (varName === 'email') return profile.email || '';
      // Check custom variables
      if (profile.custom && profile.custom[varName]) return profile.custom[varName];
      // Check other profile fields
      return profile[varName] || '';
    };
    
    const formatVariableName = (varName) => {
      return varName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };
    
    // Simple translations for autofill panel
    const translations = {
      en: { fillInfo: 'Fill in missing information', insert: 'Insert', cancel: 'Cancel' },
      no: { fillInfo: 'Fyll inn manglende informasjon', insert: 'Sett inn', cancel: 'Avbryt' },
      es: { fillInfo: 'Completa la información faltante', insert: 'Insertar', cancel: 'Cancelar' },
      fr: { fillInfo: 'Remplir les informations manquantes', insert: 'Insérer', cancel: 'Annuler' },
      de: { fillInfo: 'Fehlende Informationen ausfüllen', insert: 'Einfügen', cancel: 'Abbrechen' },
      it: { fillInfo: 'Compila le informazioni mancanti', insert: 'Inserisci', cancel: 'Annulla' },
      pt: { fillInfo: 'Preencha as informações faltantes', insert: 'Inserir', cancel: 'Cancelar' },
      nl: { fillInfo: 'Vul ontbrekende informatie in', insert: 'Invoegen', cancel: 'Annuleren' },
      sv: { fillInfo: 'Fyll i saknad information', insert: 'Infoga', cancel: 'Avbryt' },
      da: { fillInfo: 'Udfyld manglende oplysninger', insert: 'Indsæt', cancel: 'Annuller' },
      ar: { fillInfo: 'املأ المعلومات المفقودة', insert: 'إدراج', cancel: 'إلغاء' }
    };
    const t = translations[lang] || translations.en;
    
    const panel = document.createElement('div');
    panel.className = 'magical-autofill-panel';
    const themeChoice = settings.theme || 'system';
    const effectiveTheme = themeChoice === 'system'
      ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : themeChoice;
    panel.setAttribute('data-theme', effectiveTheme);
    panel.innerHTML = `
      <h4>${t.fillInfo}</h4>
      <div class="magical-autofill-content">
        ${variables.map(v => `
          <div class="form-group">
            <label for="magical-${v}">${formatVariableName(v)}</label>
            <input type="text"
                   id="magical-${v}"
                   name="magical-field-${v}-${Date.now()}"
                   placeholder="Enter ${formatVariableName(v).toLowerCase()}"
                   value="${getVariableValue(v)}"
                   autocomplete="off"
                   autocorrect="off"
                   autocapitalize="off"
                   spellcheck="false"
                   data-lpignore="true"
                   data-1p-ignore="true"
                   data-form-type="other">
          </div>
        `).join('')}
      </div>
      <div class="button-group">
        <button type="button" id="magical-submit">${t.insert}</button>
        <button type="button" class="secondary" id="magical-cancel">${t.cancel}</button>
      </div>
    `;

    // Render into the top-most accessible document so the panel gets the full page
    // viewport, not a cramped iframe (e.g. a small Kendo Editor comment box).
    const renderCtx = getPanelRenderContext();
    const hostDoc = renderCtx.doc;
    const hostWin = renderCtx.win;

    hostDoc.body.appendChild(panel);
    const rect = element.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const scrollX = hostWin.scrollX;
    const scrollY = hostWin.scrollY;
    const viewportH = hostWin.innerHeight;
    const viewportW = hostWin.innerWidth;
    const gap = 8;
    let top = rect.bottom + renderCtx.offsetY + scrollY + gap;
    let left = rect.left + renderCtx.offsetX + scrollX;
    if (top + panelRect.height > scrollY + viewportH - gap) {
      top = rect.top + renderCtx.offsetY + scrollY - panelRect.height - gap;
    }
    if (top < scrollY + gap) top = scrollY + gap;
    if (left + panelRect.width > scrollX + viewportW - gap) {
      left = scrollX + viewportW - panelRect.width - gap;
    }
    if (left < scrollX + gap) left = scrollX + gap;
    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;

    const submitBtn = panel.querySelector('#magical-submit');
    const cancelBtn = panel.querySelector('#magical-cancel');

    let outsideClickHandler = null;
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      if (outsideClickHandler) {
        hostDoc.removeEventListener('click', outsideClickHandler);
        outsideClickHandler = null;
      }
      if (panel.parentNode) {
        panel.parentNode.removeChild(panel);
      }
    };

    submitBtn.addEventListener('click', async () => {
      const newProfile = { custom: profile.custom || {} };
      variables.forEach(v => {
        const input = panel.querySelector(`#magical-${v}`);
        const value = input.value.trim();

        // Save to appropriate location
        if (v === 'first_name' || v === 'last_name' || v === 'email') {
          newProfile[v] = value;
        } else {
          // Custom variable
          if (!newProfile.custom) newProfile.custom = {};
          newProfile.custom[v] = value;
        }
      });
      await saveProfile(newProfile);
      cleanup();
      resolve(newProfile);
    });

    cancelBtn.addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    // Close on outside click
    setTimeout(() => {
      outsideClickHandler = (e) => {
        if (!panel.contains(e.target)) {
          cleanup();
          resolve(null);
        }
      };
      hostDoc.addEventListener('click', outsideClickHandler);
    }, 100);
  });
};

const expandTrigger = async (element, template, delimiter, skipTriggerCheck = false) => {
  // Helper to check if variable has a value
  const hasVariableValue = (varName) => {
    if (varName === 'date') return true; // Date is always available
    if (varName === 'first_name') return !!profile.first_name;
    if (varName === 'last_name') return !!profile.last_name;
    if (varName === 'email') return !!profile.email;
    if (profile.custom && profile.custom[varName]) return true;
    return !!profile[varName];
  };
  
  // If called from popup, skip trigger check and just insert
  if (skipTriggerCheck) {
    // Process template directly without looking for trigger
    const variables = template.bodyHtml.match(/\{\{(\w+)(?::\w+)?\}\}/g) || [];
    const uniqueVars = [...new Set(variables.map(v => {
      const match = v.match(/\{\{(\w+)/);
      return match ? match[1] : null;
    }).filter(Boolean))];
    const needsInput = uniqueVars.filter(v => v !== 'date' && !hasVariableValue(v));

    let finalProfile = profile;
    if (needsInput.length > 0) {
      const inputProfile = await showAutofillPanel(element, template, needsInput);
      if (!inputProfile) return false;
      finalProfile = { ...profile, ...inputProfile };
    }

    const isHTML = isEditableRichElement(element);
    const processedBody = await processTemplate(
      isHTML ? template.bodyHtml : template.bodyText,
      finalProfile
    );

    // Insert directly at cursor position (no delimiter when inserting from popup)
    return await insertProcessedContent(element, processedBody, '', isHTML);
  }

  // Get trigger match before processing (for keyboard expansion)
  const isRich = isEditableRichElement(element);
  let textBefore;
  let cursorPos;
  if (isRich) {
    const rich = getTextAndCursorFromContentEditable(element);
    textBefore = rich.text;
    cursorPos = rich.cursorPos;
  } else {
    textBefore = element.value || '';
    cursorPos = element.selectionStart != null ? element.selectionStart : textBefore.length;
  }

  const triggerMatch = findTrigger(textBefore, cursorPos);
  if (!triggerMatch) return false;

  // Check for variables that need input
  const variables = template.bodyHtml.match(/\{\{(\w+)(?::\w+)?\}\}/g) || [];
  const uniqueVars = [...new Set(variables.map(v => {
    const match = v.match(/\{\{(\w+)/);
    return match ? match[1] : null;
  }).filter(Boolean))];
  const needsInput = uniqueVars.filter(v => v !== 'date' && !hasVariableValue(v));

  let finalProfile = profile;
  if (needsInput.length > 0) {
    const inputProfile = await showAutofillPanel(element, template, needsInput);
    if (!inputProfile) return false;
    finalProfile = { ...profile, ...inputProfile };
  }

  // Process template
  const isHTML = isEditableRichElement(element);
  const processedBody = await processTemplate(
    isHTML ? template.bodyHtml : template.bodyText,
    finalProfile
  );

  const { startIndex, endIndex } = triggerMatch;

  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    const value = element.value;
    
    // Check if delimiter was already inserted in the value
    let delimiterAlreadyInserted = false;
    if (delimiter === ' ' && value[endIndex] === ' ') {
      delimiterAlreadyInserted = true;
    } else if (delimiter === '\n' && value[endIndex] === '\n') {
      delimiterAlreadyInserted = true;
    }
    
    let newValue = value.slice(0, startIndex) + processedBody;
    
    // Add delimiter back (only if not already there)
    if (!delimiterAlreadyInserted) {
      if (delimiter === ' ') {
        newValue += ' ';
      } else if (delimiter === '\n') {
        newValue += '\n';
      }
    }
    
    // Remove the trigger and delimiter from original
    const delimiterLength = delimiter === 'Tab' ? 0 : (delimiterAlreadyInserted ? 1 : 0);
    newValue += value.slice(endIndex + delimiterLength);

    // Set value using multiple methods for compatibility
    element.value = newValue;
    
    // Force update for React/Vue and other frameworks
    try {
      const descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(element, newValue);
      }
    } catch (e) {
      // Fallback if descriptor not available
    }
    
    const newCursorPos = startIndex + processedBody.length + (delimiter === ' ' || delimiter === '\n' ? 1 : 0);
    
    // Set cursor position
    if (element.setSelectionRange) {
      element.setSelectionRange(newCursorPos, newCursorPos);
    }
    element.selectionStart = element.selectionEnd = newCursorPos;
    
    // Dispatch multiple events for better compatibility
    element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Trigger React/Vue updates
    const event = new Event('input', { bubbles: true });
    Object.defineProperty(event, 'target', { value: element, enumerable: true });
    element.dispatchEvent(event);
  } else if (isEditableRichElement(element)) {
    const selection = window.getSelection();
    
    // For Power Apps and complex editors, ensure we have a valid selection
    if (selection.rangeCount === 0) {
      // Try to create a range at the end of the element
      try {
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        // If that fails, try to find any text node
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          null
        );
        const textNode = walker.nextNode();
        if (textNode) {
          const range = document.createRange();
          range.selectNodeContents(textNode);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          return false;
        }
      }
    }
    
    if (selection.rangeCount === 0) return false;
    
    const range = selection.getRangeAt(0);
    
    // Ensure range is within the element (for Power Apps nested structures)
    if (!element.contains(range.commonAncestorContainer)) {
      // Range is outside, create new range at end
      try {
        const newRange = document.createRange();
        newRange.selectNodeContents(element);
        newRange.collapse(false);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } catch (e) {
        return false;
      }
    }
    
    // Try to find and replace the trigger in the DOM
    // First, try to find the text node containing the trigger
    const textBefore = element.innerText || element.textContent || '';
    const triggerIndex = textBefore.lastIndexOf(template.trigger, cursorPos - 1);
    
    if (triggerIndex === -1) return false;
    
    // Find the actual DOM nodes that contain the trigger
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node;
    let offset = 0;
    let triggerNode = null;
    let triggerNodeStart = 0;
    let triggerNodeEnd = 0;
    
    while ((node = walker.nextNode())) {
      const nodeText = node.textContent;
      const nodeStart = offset;
      const nodeEnd = offset + nodeText.length;
      
      if (triggerIndex >= nodeStart && triggerIndex < nodeEnd) {
        triggerNode = node;
        triggerNodeStart = nodeStart;
        triggerNodeEnd = nodeEnd;
        break;
      }
      offset = nodeEnd;
    }
    
    if (triggerNode) {
      const localTriggerStart = triggerIndex - triggerNodeStart;
      const localTriggerEnd = localTriggerStart + template.trigger.length;
      const text = triggerNode.textContent;
      const before = text.substring(0, localTriggerStart);
      const after = text.substring(localTriggerEnd);
      
      // Replace trigger with processed content
      if (isHTML) {
        triggerNode.textContent = before;
        
        // Insert HTML content
        try {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = processedBody;
          const fragment = document.createDocumentFragment();
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
          }
          
          if (triggerNode.parentNode) {
            triggerNode.parentNode.insertBefore(fragment, triggerNode.nextSibling);
            
            // Add delimiter
            if (delimiter === ' ') {
              const spaceNode = document.createTextNode(' ');
              triggerNode.parentNode.insertBefore(spaceNode, triggerNode.nextSibling);
            } else if (delimiter === '\n') {
              const br = document.createElement('br');
              triggerNode.parentNode.insertBefore(br, triggerNode.nextSibling);
            }
            
            // Add remaining text
            if (after) {
              const afterNode = document.createTextNode(after);
              triggerNode.parentNode.insertBefore(afterNode, triggerNode.nextSibling);
            }
            
            // Set cursor position after inserted content
            const lastInserted = triggerNode.nextSibling;
            if (lastInserted) {
              const newRange = document.createRange();
              if (lastInserted.nodeType === Node.TEXT_NODE) {
                newRange.setStart(lastInserted, lastInserted.textContent.length);
              } else {
                newRange.setStartAfter(lastInserted);
              }
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          }
        } catch (e) {
          // Fallback: use execCommand or plain text
          try {
            // Delete the trigger first
            const deleteRange = document.createRange();
            deleteRange.setStart(triggerNode, localTriggerStart);
            deleteRange.setEnd(triggerNode, localTriggerEnd);
            deleteRange.deleteContents();
            
            // Insert processed content
            if (isHTML) {
              document.execCommand('insertHTML', false, processedBody + (delimiter === ' ' ? ' ' : delimiter === '\n' ? '<br>' : ''));
            } else {
              const textContent = processedBody.replace(/<[^>]*>/g, '');
              document.execCommand('insertText', false, textContent + (delimiter === ' ' ? ' ' : delimiter === '\n' ? '\n' : ''));
            }
          } catch (e2) {
            // Last resort: plain text replacement
            triggerNode.textContent = before + processedBody.replace(/<[^>]*>/g, '') + (delimiter === ' ' ? ' ' : delimiter === '\n' ? '\n' : '') + after;
            const newPos = before.length + processedBody.replace(/<[^>]*>/g, '').length + (delimiter === ' ' || delimiter === '\n' ? 1 : 0);
            const newRange = document.createRange();
            newRange.setStart(triggerNode, newPos);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      } else {
        triggerNode.textContent = before + processedBody + (delimiter === ' ' ? ' ' : delimiter === '\n' ? '\n' : '') + after;
        const newPos = before.length + processedBody.length + (delimiter === ' ' || delimiter === '\n' ? 1 : 0);
        const newRange = document.createRange();
        newRange.setStart(triggerNode, newPos);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
      
      element.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // Fallback: use execCommand to replace
      try {
        // Select and delete the trigger, then insert
        const textBefore = element.innerText || element.textContent || '';
        const triggerIndex = textBefore.lastIndexOf(template.trigger);
        
        if (triggerIndex !== -1) {
          // Try to use execCommand
          if (isHTML) {
            document.execCommand('insertHTML', false, processedBody + (delimiter === ' ' ? ' ' : delimiter === '\n' ? '<br>' : ''));
          } else {
            document.execCommand('insertText', false, processedBody + (delimiter === ' ' ? ' ' : delimiter === '\n' ? '\n' : ''));
          }
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } catch (e) {
        console.warn('Failed to insert template in contenteditable:', e);
        return false;
      }
    }
  }

  return true;
};

const insertProcessedContent = async (element, processedBody, delimiter, isHTML) => {
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    const start = element.selectionStart !== null && element.selectionStart !== undefined 
      ? element.selectionStart 
      : element.value.length;
    const end = element.selectionEnd !== null && element.selectionEnd !== undefined 
      ? element.selectionEnd 
      : element.value.length;
    const value = element.value || '';
    const newValue = value.slice(0, start) + processedBody + 
                     (delimiter === ' ' ? ' ' : delimiter === '\n' ? '\n' : '') + 
                     value.slice(end);
    
    // Set value using multiple methods for compatibility
    element.value = newValue;
    
    // Force update for React/Vue and other frameworks
    try {
      const descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(element, newValue);
      }
    } catch (e) {
      // Fallback if descriptor not available
    }
    
    const newCursorPos = start + processedBody.length + (delimiter === ' ' || delimiter === '\n' ? 1 : 0);
    
    // Set cursor position with multiple methods
    if (element.setSelectionRange) {
      try {
        element.setSelectionRange(newCursorPos, newCursorPos);
      } catch (e) {
        // Some browsers may throw
      }
    }
    if (element.selectionStart !== undefined) {
      element.selectionStart = element.selectionEnd = newCursorPos;
    }
    
    // Dispatch multiple events for better compatibility
    element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Trigger React/Vue updates with proper target
    try {
      const reactEvent = new Event('input', { bubbles: true });
      Object.defineProperty(reactEvent, 'target', { value: element, enumerable: true });
      element.dispatchEvent(reactEvent);
    } catch (e) {
      // Fallback
    }
    
    return true;
  } else if (isEditableRichElement(element)) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return false;
    
    const range = selection.getRangeAt(0);
    
    try {
      if (isHTML) {
        // Try execCommand first
        try {
          document.execCommand('insertHTML', false, processedBody + (delimiter === ' ' ? ' ' : delimiter === '\n' ? '<br>' : ''));
        } catch (e) {
          // Fallback to manual insertion
          range.deleteContents();
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = processedBody;
          const fragment = document.createDocumentFragment();
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
          }
          range.insertNode(fragment);
          
          if (delimiter === ' ') {
            const spaceNode = document.createTextNode(' ');
            range.setStartAfter(fragment.lastChild || fragment);
            range.insertNode(spaceNode);
            range.setStartAfter(spaceNode);
          } else if (delimiter === '\n') {
            const br = document.createElement('br');
            range.setStartAfter(fragment.lastChild || fragment);
            range.insertNode(br);
            range.setStartAfter(br);
          }
        }
      } else {
        const textNode = document.createTextNode(processedBody + (delimiter === ' ' ? ' ' : delimiter === '\n' ? '\n' : ''));
        range.deleteContents();
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
      }
      
      selection.removeAllRanges();
      selection.addRange(range);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    } catch (e) {
      console.error('Failed to insert content:', e);
      return false;
    }
  }
  return false;
};

const getContentEditableElement = (element) => {
  // Kendo Editor and similar: iframe with designMode. Body is the editable root.
  if (document.designMode === 'on' && document.body && (element === document.body || document.body.contains(element))) {
    return document.body;
  }
  // Check if element itself is contenteditable
  if (element && element.isContentEditable) {
    return element;
  }
  // Check parent elements
  let current = element;
  while (current && current !== document.body) {
    if (current.isContentEditable || current.getAttribute('contenteditable') === 'true') {
      return current;
    }
    current = current.parentElement;
  }
  return null;
};

/** True if element should use rich (contenteditable/designMode) insertion rather than input/textarea. */
const isEditableRichElement = (element) => {
  if (!element) return false;
  if (element === document.body && document.designMode === 'on') return true;
  return !!element.isContentEditable || element.getAttribute('contenteditable') === 'true';
};

const getTextAndCursorFromContentEditable = (element) => {
  const selection = window.getSelection();
  
  // For Power Apps and complex editors, ensure we have a selection
  if (selection.rangeCount === 0) {
    // Try to create a range at the end
    try {
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } catch (e) {
      // Fallback: get all text and position at end
      const text = element.innerText || element.textContent || '';
      return { text, cursorPos: text.length };
    }
  }
  
  if (selection.rangeCount === 0) {
    const text = element.innerText || element.textContent || '';
    return { text, cursorPos: text.length };
  }
  
  const range = selection.getRangeAt(0);
  
  // Check if range is within the element (for Power Apps nested structures)
  if (!element.contains(range.commonAncestorContainer)) {
    // Range is outside, create new range at end
    try {
      const newRange = document.createRange();
      newRange.selectNodeContents(element);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);
      const text = element.innerText || element.textContent || '';
      return { text, cursorPos: text.length };
    } catch (e) {
      const text = element.innerText || element.textContent || '';
      return { text, cursorPos: text.length };
    }
  }
  
  const textNode = range.startContainer;
  
  // If we're in a text node, use it directly
  if (textNode.nodeType === Node.TEXT_NODE) {
    // Need to get full text of element, not just text node
    const text = element.innerText || element.textContent || '';
    // Calculate cursor position in full text
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    const cursorPos = preCaretRange.toString().length;
    return { text, cursorPos };
  }
  
  // Otherwise, we need to find the text position in the entire element
  // Walk through all text nodes to find cursor position
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  );
  
  let text = '';
  let cursorPos = 0;
  let found = false;
  let node;
  
  while ((node = walker.nextNode())) {
    const nodeText = node.textContent;
    const nodeStart = text.length;
    const nodeEnd = text.length + nodeText.length;
    
    if (node === textNode || node.contains(textNode)) {
      // Found the node containing cursor
      if (node === textNode) {
        cursorPos = nodeStart + range.startOffset;
      } else {
        // Cursor is in a child of this text node's parent
        cursorPos = nodeStart;
      }
      found = true;
    }
    
    text += nodeText;
    
    if (found) break;
  }
  
  // If we didn't find it, calculate using range
  if (!found) {
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    text = element.innerText || element.textContent || '';
    cursorPos = preCaretRange.toString().length;
  }
  
  return { text, cursorPos };
};

const handleKeyDown = async (e) => {
  if (!isExtensionContextValid()) {
    teardownOnInvalidatedContext();
    return;
  }
  if (templates.length === 0) return;
  let element = e.target;
  if (!element || typeof element.tagName !== 'string') return;
  if (element.type === 'password') return;
  
  // Check if it's a standard input/textarea (including nested elements)
  let isStandardInput = element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
  
  // If not directly an input/textarea, check if we're inside one
  if (!isStandardInput) {
    let parent = element;
    while (parent && parent !== document.body) {
      if (parent.tagName === 'INPUT' || parent.tagName === 'TEXTAREA') {
        element = parent;
        isStandardInput = true;
        break;
      }
      parent = parent.parentElement;
    }
  }
  
  // Check for contenteditable (including body elements)
  const contentEditableElement = getContentEditableElement(element);
  const isContentEditable = !!contentEditableElement;
  
  if (!isStandardInput && !isContentEditable) return;
  
  // Use the contenteditable element if found, otherwise use the original
  const targetElement = isContentEditable ? contentEditableElement : element;

  let delimiter = null;
  if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
    delimiter = ' ';
  } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
    delimiter = '\n';
  } else if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {
    delimiter = 'Tab';
  }

  if (!delimiter) return;
  
  // For textareas, also check if the key was already processed
  // Some sites might prevent default, so we need to work with the current value
  if (isStandardInput && e.defaultPrevented) {
    // If default was prevented, the space/enter might not have been inserted yet
    // We'll work with the value as it is
  }

  try {
    let text, cursorPos;
    
    if (isContentEditable) {
      const result = getTextAndCursorFromContentEditable(targetElement);
      text = result.text;
      cursorPos = result.cursorPos;
    } else {
      // For standard inputs, get value and cursor position
      text = targetElement.value || '';
      
      // For space/enter/tab, the character might already be in the value
      // or might be about to be inserted. We need to account for this.
      let actualCursorPos;
      
      // Try multiple methods to get cursor position
      if (targetElement.selectionStart !== undefined && targetElement.selectionStart !== null) {
        actualCursorPos = targetElement.selectionStart;
      } else if (targetElement.selectionEnd !== undefined && targetElement.selectionEnd !== null) {
        actualCursorPos = targetElement.selectionEnd;
      } else {
        // Fallback: try to get selection via document selection
        try {
          const selection = document.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (range.startContainer === targetElement || targetElement.contains(range.startContainer)) {
              // Calculate position in textarea
              const textBefore = text.substring(0, range.startOffset);
              actualCursorPos = textBefore.length;
            } else {
              actualCursorPos = text.length;
            }
          } else {
            actualCursorPos = text.length;
          }
        } catch (err) {
          actualCursorPos = text.length;
        }
      }
      
      // If the delimiter key was pressed, check if it's already in the text
      // Some browsers/sites insert it immediately, others don't
      if (delimiter === ' ' && text[actualCursorPos - 1] === ' ') {
        // Space already inserted, cursor is after it
        cursorPos = actualCursorPos - 1;
      } else if (delimiter === '\n' && text[actualCursorPos - 1] === '\n') {
        // Newline already inserted
        cursorPos = actualCursorPos - 1;
      } else {
        // Delimiter not yet inserted, use current position
        cursorPos = actualCursorPos;
      }
    }

    const triggerMatch = findTrigger(text, cursorPos);
    if (triggerMatch) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation(); // Prevent other handlers
      await expandTrigger(targetElement, triggerMatch.template, delimiter);
      return false;
    }
  } catch (error) {
    console.error('Error in handleKeyDown:', error);
  }
};

// Listen for messages from popup (only main frame handles insert to avoid multiple responses)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'insertTemplate') {
    if (window !== window.top) return false;
    // Handle async response properly
    (async () => {
      try {
        // Find the active element - try multiple methods
        let activeElement = document.activeElement;
        let targetDoc = document;
        let targetWindow = window;
        
        // Check if activeElement is an iframe (Kendo Editor, etc.)
        if (activeElement && activeElement.tagName === 'IFRAME') {
          try {
            // Try to access iframe's document (same-origin only)
            const iframeDoc = activeElement.contentDocument || activeElement.contentWindow?.document;
            if (iframeDoc) {
              targetDoc = iframeDoc;
              targetWindow = activeElement.contentWindow;
              // Check for designMode body (Kendo Editor)
              if (iframeDoc.designMode === 'on' && iframeDoc.body) {
                activeElement = iframeDoc.body;
              } else {
                // Check for contenteditable in iframe
                const iframeContentEditable = iframeDoc.querySelector('[contenteditable="true"]') || 
                                             (iframeDoc.body?.isContentEditable ? iframeDoc.body : null);
                if (iframeContentEditable) {
                  activeElement = iframeContentEditable;
                } else {
                  // Check for textarea/input in iframe
                  const iframeInput = iframeDoc.querySelector('textarea, input[type="text"], input:not([type])');
                  if (iframeInput) {
                    activeElement = iframeInput;
                  }
                }
              }
            }
          } catch (e) {
            // Cross-origin iframe - can't access
            console.warn('Cannot access iframe content (may be cross-origin):', e);
          }
        }
        
        // If activeElement is not an input, try to find contenteditable ancestor
        if (activeElement && !isEditableRichElement(activeElement) && 
            activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
          // Check if we're inside a contenteditable element
          let parent = activeElement.parentElement;
          while (parent && parent !== targetDoc.body) {
            if (isEditableRichElement(parent)) {
              activeElement = parent;
              break;
            }
            parent = parent.parentElement;
          }
        }
        
        // Also try finding any focused contenteditable or designMode body
        if (!activeElement || (!isEditableRichElement(activeElement) && 
            activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA')) {
          // Check for designMode body in current document
          if (targetDoc.designMode === 'on' && targetDoc.body) {
            activeElement = targetDoc.body;
          } else {
            // Try to find contenteditable elements
            const contentEditables = targetDoc.querySelectorAll('[contenteditable="true"]');
            if (contentEditables.length > 0) {
              // Use the first one or one that contains selection
              const selection = targetWindow.getSelection();
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                for (const elem of contentEditables) {
                  if (elem.contains(range.commonAncestorContainer)) {
                    activeElement = elem;
                    break;
                  }
                }
              }
              if (!activeElement || (!isEditableRichElement(activeElement) && 
                  activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA')) {
                activeElement = contentEditables[0];
              }
            }
          }
        }
        
        if (activeElement && (activeElement.tagName === 'INPUT' || 
                             activeElement.tagName === 'TEXTAREA' || 
                             isEditableRichElement(activeElement))) {
          try {
            const result = await expandTrigger(activeElement, message.template, ' ', true);
            sendResponse({ success: result });
          } catch (error) {
            console.error('Error expanding trigger:', error);
            sendResponse({ success: false, error: error.message });
          }
        } else {
          sendResponse({ success: false, error: 'No active input field' });
        }
      } catch (error) {
        console.error('Error in message handler:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    return true; // Keep channel open for async response
  }
  return false; // No async response for other messages
});

// Track last value to detect changes
const elementValueTracker = new WeakMap();

// Handle input events as fallback (for sites that prevent keydown)
const handleInput = async (e) => {
  if (!isExtensionContextValid()) return;
  const element = e.target;
  if (!element || (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA')) return;
  if (element.type === 'password') return;
  if (templates.length === 0) return;
  
  const currentValue = element.value || '';
  const lastValue = elementValueTracker.get(element) || '';
  elementValueTracker.set(element, currentValue);
  
  // Only process if value actually changed
  if (currentValue === lastValue) return;
  
  // Check if a space or newline was just added
  if (currentValue.length > lastValue.length) {
    const addedChar = currentValue[currentValue.length - 1];
    if (addedChar === ' ' || addedChar === '\n') {
      const cursorPos = element.selectionStart !== null && element.selectionStart !== undefined 
        ? element.selectionStart 
        : currentValue.length;
      
      // Check for trigger ending just before the delimiter
      const textBefore = currentValue.substring(0, cursorPos - 1);
      const triggerMatch = findTrigger(textBefore, textBefore.length);
      
      if (triggerMatch && !element._magicalExpanding) {
        element._magicalExpanding = true;
        // Small delay to ensure the delimiter is in place
        setTimeout(async () => {
          try {
            const delimiter = addedChar;
            await expandTrigger(element, triggerMatch.template, delimiter);
          } finally {
            element._magicalExpanding = false;
          }
        }, 50);
      }
    }
  }
};

// Monitor textarea value changes directly (for React/Vue controlled inputs)
const monitorElementValue = (element) => {
  if (element._magicalValueMonitor) return; // Already monitoring
  
  let lastValue = element.value || '';
  let lastCursorPos = element.selectionStart || 0;
  elementValueTracker.set(element, lastValue);
  
  const checkValue = () => {
    if (!document.contains(element)) {
      if (element._magicalValueMonitor) {
        clearInterval(element._magicalValueMonitor);
        element._magicalValueMonitor = null;
      }
      return;
    }
    
    const currentValue = element.value || '';
    const currentCursorPos = element.selectionStart !== null && element.selectionStart !== undefined 
      ? element.selectionStart 
      : currentValue.length;
    
    if (currentValue !== lastValue && !element._magicalExpanding) {
      // Value changed - check if a trigger was just completed
      if (currentValue.length > lastValue.length) {
        // Check if space or newline was added
        const addedText = currentValue.substring(lastValue.length);
        if (addedText.endsWith(' ') || addedText.endsWith('\n')) {
          const delimiter = addedText[addedText.length - 1];
          const textBefore = currentValue.substring(0, currentCursorPos - 1);
          const triggerMatch = findTrigger(textBefore, textBefore.length);
          
          if (triggerMatch) {
            element._magicalExpanding = true;
            setTimeout(async () => {
              try {
                await expandTrigger(element, triggerMatch.template, delimiter);
              } catch (error) {
                console.error('Error expanding trigger:', error);
              } finally {
                element._magicalExpanding = false;
              }
            }, 100);
          }
        }
      }
      
      lastValue = currentValue;
      lastCursorPos = currentCursorPos;
      elementValueTracker.set(element, lastValue);
    }
  };
  
  // Check more frequently for better responsiveness
  const interval = setInterval(checkValue, 50);
  element._magicalValueMonitor = interval;
  
  // Also check on focus and input
  element.addEventListener('focus', checkValue);
  element.addEventListener('input', checkValue);
  
  // Clean up when element is removed
  const observer = new MutationObserver((mutations) => {
    if (!document.contains(element)) {
      clearInterval(interval);
      element._magicalValueMonitor = null;
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
};

// Attach listener directly to textarea/input elements
const attachDirectListeners = () => {
  // Find all textareas and inputs
  const inputs = document.querySelectorAll('textarea, input[type="text"], input:not([type])');
  inputs.forEach(input => {
    if (input.type === 'password') return;
    
    // Skip if already attached
    if (input._magicalAttached) return;
    input._magicalAttached = true;
    
    // Remove existing listeners if any
    if (input._magicalKeydownListener) {
      input.removeEventListener('keydown', input._magicalKeydownListener, true);
    }
    if (input._magicalInputListener) {
      input.removeEventListener('input', input._magicalInputListener, true);
    }
    
    // Add keydown listener
    const keydownListener = (e) => {
      handleKeyDown(e);
    };
    input._magicalKeydownListener = keydownListener;
    input.addEventListener('keydown', keydownListener, true);
    
    // Add input listener as fallback
    const inputListener = (e) => {
      handleInput(e);
    };
    input._magicalInputListener = inputListener;
    input.addEventListener('input', inputListener, true);
    
    // Also monitor value directly for React/Vue controlled inputs
    monitorElementValue(input);
  });
  
  // Attach to contenteditable elements (Power Apps, etc.)
  const contentEditables = document.querySelectorAll('[contenteditable="true"], [contenteditable=""]');
  contentEditables.forEach(element => {
    // Skip if already attached
    if (element._magicalAttached) return;
    element._magicalAttached = true;
    
    // Remove existing listeners if any
    if (element._magicalKeydownListener) {
      element.removeEventListener('keydown', element._magicalKeydownListener, true);
    }
    if (element._magicalInputListener) {
      element.removeEventListener('input', element._magicalInputListener, true);
    }
    
    // Add keydown listener
    const keydownListener = (e) => {
      handleKeyDown(e);
    };
    element._magicalKeydownListener = keydownListener;
    element.addEventListener('keydown', keydownListener, true);
    
    // Add input listener
    const inputListener = (e) => {
      handleInput(e);
    };
    element._magicalInputListener = inputListener;
    element.addEventListener('input', inputListener, true);
    
    // Monitor for Power Apps and other complex editors
    monitorElementValue(element);
  });
};

// Watch for new textareas/inputs being added to the page
const observer = new MutationObserver((mutations) => {
  let shouldReattach = false;
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) { // Element node
        if (node.tagName === 'TEXTAREA' || 
            (node.tagName === 'INPUT' && (node.type === 'text' || !node.type))) {
          shouldReattach = true;
        }
        // Check for contenteditable elements (Power Apps, etc.)
        if (node.isContentEditable || node.getAttribute?.('contenteditable') === 'true') {
          shouldReattach = true;
        }
        // Also check children
        if (node.querySelectorAll) {
          const inputs = node.querySelectorAll('textarea, input[type="text"], input:not([type]), [contenteditable="true"]');
          if (inputs.length > 0) {
            shouldReattach = true;
          }
        }
      }
    });
  });
  
  if (shouldReattach) {
    setTimeout(attachDirectListeners, 100);
  }
});

// Initialize
(async () => {
  // Run in main frame or in Kendo Editor iframes only (editable iframe with .k-content / .k-editable-area).
  // Skip all other iframes (ads, embeds, etc.) to avoid wasted work.
  const isMainFrame = (window === window.top);
  const frameEl = typeof window.frameElement !== 'undefined' ? window.frameElement : null;
  
  // Check if this is a Kendo Editor iframe:
  // 1. Iframe has class="k-content" or is inside .k-editable-area
  // 2. OR iframe document has designMode="on" (Kendo sets this)
  const hasKendoClass = frameEl && (
    frameEl.classList?.contains('k-content') ||
    (typeof frameEl.closest === 'function' && frameEl.closest('.k-editable-area'))
  );
  const hasDesignMode = !isMainFrame && document.designMode === 'on';
  const isKendoIframe = !isMainFrame && (hasKendoClass || hasDesignMode);
  
  if (!isMainFrame && !isKendoIframe) {
    return;
  }

  await loadTemplates();

  // Use capture phase to catch events before page scripts
  document.addEventListener('keydown', handleKeyDown, true);

  // Also listen on window for better coverage
  window.addEventListener('keydown', handleKeyDown, true);

  // Attach listeners directly to existing inputs (and Kendo designMode body)
  attachDirectListeners();

  // Watch for dynamically added inputs
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Also try attaching when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachDirectListeners);
  }
  
  // Special handling for specific problematic textareas
  const attachToSpecificTextarea = () => {
    const specificTextarea = document.getElementById('trygWriteToClaimHandlerInputField');
    if (specificTextarea && !specificTextarea._magicalAttached) {
      specificTextarea._magicalAttached = true;
      
      // Add all listeners
      const keydownListener = (e) => handleKeyDown(e);
      const inputListener = (e) => handleInput(e);
      
      specificTextarea.addEventListener('keydown', keydownListener, true);
      specificTextarea.addEventListener('input', inputListener, true);
      
      // Monitor value directly
      monitorElementValue(specificTextarea);
      
      // Also watch for value property changes (for React/Vue)
      let lastValue = specificTextarea.value || '';
      const valueObserver = new MutationObserver(() => {
        const currentValue = specificTextarea.value || '';
        if (currentValue !== lastValue) {
          lastValue = currentValue;
          // Trigger input handler
          const fakeEvent = { target: specificTextarea };
          handleInput(fakeEvent);
        }
      });
      
      // Watch the textarea for attribute changes
      valueObserver.observe(specificTextarea, {
        attributes: true,
        attributeFilter: ['value']
      });
      
      // Also check on focus/blur
      specificTextarea.addEventListener('focus', () => {
        monitorElementValue(specificTextarea);
      });
    }
  };
  
  // Try to attach to specific textarea immediately and periodically
  attachToSpecificTextarea();
  setInterval(attachToSpecificTextarea, 1000);
  
  // Power Apps specific: Monitor for Power Apps formula bars and canvas elements
  const attachToPowerAppsElements = () => {
    // Look for Power Apps formula bar (often has specific classes or attributes)
    const powerAppsInputs = document.querySelectorAll(
      '[role="textbox"], ' +
      '[data-automation-id*="formula"], ' +
      '[class*="formula"], ' +
      '[class*="FormulaBar"], ' +
      'div[contenteditable="true"]:not([class*="magical"])'
    );
    
    powerAppsInputs.forEach(input => {
      if (input._magicalAttached) return;
      input._magicalAttached = true;
      
      const keydownListener = (e) => {
        handleKeyDown(e);
      };
      input._magicalKeydownListener = keydownListener;
      input.addEventListener('keydown', keydownListener, true);
      
      const inputListener = (e) => {
        handleInput(e);
      };
      input._magicalInputListener = inputListener;
      input.addEventListener('input', inputListener, true);
      
      monitorElementValue(input);
    });
  };
  
  // Attach to Power Apps elements periodically
  attachToPowerAppsElements();
  setInterval(attachToPowerAppsElements, 2000);
  
  // Reload templates when storage changes - listen for templates specifically
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (changes.templates || areaName === 'sync' || areaName === 'local') {
      // Templates changed - reload them
      loadTemplates().then(() => {
        console.log('Templates reloaded from storage');
      }).catch(err => {
        console.error('Error reloading templates:', err);
      });
    }
  });
})();
