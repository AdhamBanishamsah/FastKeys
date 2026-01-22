const getOrdinalSuffix = (day) => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

const formatMonth = (month) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
};

const formatWeekday = (day) => {
  const weekdays = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];
  return weekdays[day];
};

export const formatDate = (format = 'long') => {
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

  switch (format) {
    case 'long':
      return `${formatMonth(month)} ${day}${getOrdinalSuffix(day)}, ${year}`;
    case 'short':
      return `${(month + 1).toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
    case 'weekday_long':
      return `${formatWeekday(weekday)} ${formatMonth(month)} ${day}${getOrdinalSuffix(day)}, ${year}`;
    case 'long_time':
      return `${formatMonth(month)} ${day}${getOrdinalSuffix(day)}, ${year}, ${displayHours}:${displayMinutes} ${ampm}`;
    default:
      return `${formatMonth(month)} ${day}${getOrdinalSuffix(day)}, ${year}`;
  }
};
