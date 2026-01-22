# Publishing FastKeys to Chrome Web Store

## Prerequisites

1. **Chrome Web Store Developer Account**
   - Go to https://chrome.google.com/webstore/devconsole
   - Sign in with your Google account
   - Pay the one-time $5 registration fee (if not already paid)

2. **Prepare Your Extension**
   - Ensure all files are ready
   - Test thoroughly
   - Prepare store listing assets

## Required Assets for Chrome Web Store

### 1. Store Listing Images

Create these images (all PNG format):

- **Small promotional tile**: 440x280 pixels
- **Large promotional tile**: 920x680 pixels  
- **Marquee promotional tile** (optional): 1400x560 pixels
- **Screenshots**: At least 1, up to 5 screenshots (1280x800 or 640x400 pixels)

### 2. Store Listing Information

You'll need to provide:

- **Name**: FastKeys (or your preferred name)
- **Summary**: Short description (132 characters max)
- **Description**: Full description of features
- **Category**: Productivity
- **Language**: English (and others if you want)
- **Privacy Policy URL**: Required for extensions that handle user data
- **Support URL**: Optional but recommended

### 3. Privacy Policy

Since your extension:
- Stores user data (templates, profile variables)
- Uses `chrome.storage.sync` and `chrome.storage.local`
- Accesses all websites (`<all_urls>`)

You **must** create a privacy policy that explains:
- What data is collected (templates, profile variables)
- How it's stored (locally in Chrome storage)
- That data is not sent to external servers
- User control over their data

## Publishing Steps

1. **Create a ZIP file** of your extension:
   ```bash
   # Exclude unnecessary files
   zip -r fastkeys.zip . -x "*.md" "project.md" ".git/*" ".DS_Store"
   ```

2. **Go to Chrome Web Store Developer Dashboard**
   - Visit https://chrome.google.com/webstore/devconsole
   - Click "New Item"

3. **Upload Your Extension**
   - Upload the ZIP file
   - Fill in all required store listing information
   - Upload screenshots and promotional images
   - Add privacy policy URL

4. **Submit for Review**
   - Chrome will review your extension (usually 1-3 business days)
   - They may request changes or clarification

## About Credits/Attribution

### Do You Need to Add Credits?

**Generally NO**, because:
- This extension was built from scratch based on your requirements
- All code is original
- No external libraries or dependencies are used
- No third-party code was copied

### Optional: Add Credits Section

If you want to add credits (optional), you could add:

1. **In the Options Page**:
   - Add an "About" section in the Settings tab
   - Credit yourself as the developer
   - Add version information

2. **In manifest.json**:
   - Already has your name/description

3. **In README.md**:
   - Already documents the project

### If You Used AI Assistance

- You don't need to credit AI tools in the extension itself
- The code is yours to use and publish
- Chrome Web Store doesn't require AI tool attribution

## Privacy Policy Template

Since you need a privacy policy, here's a basic template:

```
Privacy Policy for FastKeys

Last updated: [Date]

FastKeys is a Chrome extension that provides text expansion functionality.

Data Collection:
- FastKeys stores templates, tags, and profile variables locally in your browser
- All data is stored using Chrome's storage API (chrome.storage.sync or chrome.storage.local)
- No data is transmitted to external servers
- No data is collected about your browsing habits

Data Storage:
- All templates and settings are stored locally in your Chrome browser
- Data may sync across your devices if you're signed into Chrome with sync enabled
- You can delete all data at any time by uninstalling the extension

Data Usage:
- Your templates and data are only used to provide the text expansion functionality
- We do not access, read, or transmit your template content to any external service

Your Rights:
- You have full control over your data
- You can export your data using the "Export All" feature
- You can delete templates at any time
- Uninstalling the extension removes all stored data

Contact:
[Your email or support URL]
```

## Checklist Before Publishing

- [ ] Test extension thoroughly
- [ ] Create store listing images (screenshots, promotional tiles)
- [ ] Write privacy policy and host it online
- [ ] Prepare store description
- [ ] Create ZIP file (excluding .md files, .git, etc.)
- [ ] Test ZIP file by loading it as unpacked extension
- [ ] Submit to Chrome Web Store
- [ ] Respond to any review feedback

## Tips

1. **Screenshots**: Show the main features - template editor, popup, tag management
2. **Description**: Highlight key features like text expansion, variables, tags
3. **Privacy Policy**: Must be publicly accessible (can use GitHub Pages, your website, etc.)
4. **Version**: Start with 1.0.0 for initial release
5. **Testing**: Test on multiple websites before submitting

Good luck with your publication!
