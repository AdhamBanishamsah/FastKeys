import { formatDate } from './dateFormat.js';

export const processTemplate = async (templateBody, profile = {}) => {
  let processed = templateBody;

  // Replace date variables
  processed = processed.replace(/\{\{date:(\w+)\}\}/g, (match, format) => {
    return formatDate(format);
  });
  processed = processed.replace(/\{\{date\}\}/g, () => formatDate('long'));

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

export const extractVariables = (templateBody) => {
  const variables = new Set();
  const regex = /\{\{(\w+)(?::(\w+))?\}\}/g;
  let match;

  while ((match = regex.exec(templateBody)) !== null) {
    if (match[1] === 'date') {
      variables.add('date');
    } else {
      variables.add(match[1]);
    }
  }

  return Array.from(variables);
};

export const htmlToText = (html) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};
