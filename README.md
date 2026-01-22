# FastKeys

A Chrome Extension (Manifest V3) that provides text expansion and autofill functionality with template management.

## Features

- **Template Management**: Create, edit, delete, and organize text templates with triggers
- **Text Expansion**: Automatically expand triggers (e.g., `_vpn`) while typing in web pages
- **Rich Text Editor**: Full-featured editor with formatting options and HTML support
- **Variable Support**: Insert placeholders like `{{first_name}}`, `{{email}}`, and `{{date}}` with various date formats
- **Autofill Panel**: Prompts for missing information when expanding templates with variables
- **Tag System**: Organize templates with tags
- **Export/Import**: Share templates by exporting to JSON and importing them back
- **Quick Insert Popup**: Fast access to templates via extension popup
- **Keyboard Shortcut**: Ctrl+Shift+M (Cmd+Shift+M on Mac) to open popup

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the extension folder
5. The extension should now be installed and ready to use

## Icons

Place your extension icons in the `icons/` folder:
- `icon16.png` - 16x16 pixels (toolbar icon)
- `icon48.png` - 48x48 pixels (extension management page)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

All icons should be PNG format. If you don't have icons yet, the extension will work without them, but Chrome will show a default icon.

## Usage

### Creating Templates

1. Click the extension icon or right-click → Options
2. Click "Create" → "New Template"
3. Enter a trigger (e.g., `_vpn`)
4. Use the rich text editor to create your template
5. Insert variables using the "Insert Variable" dropdown
6. Insert dates using the "Insert Date" dropdown
7. Click "Save"

### Using Templates

- **Automatic Expansion**: Type a trigger (e.g., `_vpn`) followed by Space, Tab, or Enter in any text field
- **Popup Insert**: Click the extension icon, search for a template, and click to insert
- **Keyboard Shortcut**: Press Ctrl+Shift+M to open the popup

### Variables

Supported variables:
- `{{first_name}}` - First name
- `{{last_name}}` - Last name
- `{{email}}` - Email address
- `{{date}}` - Current date (default format: "January 22nd, 2026")
- `{{date:long}}` - "January 22nd, 2026"
- `{{date:short}}` - "01/22/2026"
- `{{date:weekday_long}}` - "Thursday January 22nd, 2026"
- `{{date:long_time}}` - "January 22nd, 2026, 11:09 am"

### Tags

- Click "Tags" to manage tags
- Create, edit, or delete tags
- Assign tags to templates for better organization

### Export/Import

- **Export**: Select templates and click "Share" to export as JSON
- **Import**: Click "Create" → "Import Templates" to import from a JSON file

## Project Structure

```
FastKeys/
├── manifest.json
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── background/
│   └── service_worker.js
├── content/
│   ├── contentScript.js
│   └── injectOverlay.css
├── options/
│   ├── options.html
│   ├── options.css
│   └── options.js
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
└── lib/
    ├── storage.js
    ├── templating.js
    ├── dateFormat.js
    └── uuid.js
```

## Known Limitations

1. **execCommand Deprecation**: Some modern web editors (like Gmail's new composer) may block `document.execCommand('insertHTML')`. The extension falls back to the Range API, but complex HTML insertion may not work perfectly in all editors.

2. **Content Script Modules**: Content scripts in Manifest V3 cannot use ES modules directly. The content script has inline utilities to work around this limitation.

3. **Storage Sync Limits**: Chrome's sync storage has size limits. If you have many large templates, the extension will fall back to local storage.

4. **ContentEditable Complexity**: Different websites implement contenteditable differently. Some may require additional handling for proper text insertion.

## Development

This extension uses vanilla JavaScript with no build step required. All files are ready to use as-is.

- Options page uses ES modules (supported in HTML pages)
- Content script uses inline code (ES modules not supported in MV3 content scripts)
- Background service worker uses ES modules

## License

This project is provided as-is for personal use.
