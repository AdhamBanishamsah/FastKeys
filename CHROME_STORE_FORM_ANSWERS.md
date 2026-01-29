# Chrome Web Store Form Answers

## 1. Single Purpose Description

**Answer (copy this):**
```
FastKeys is a text expansion and autofill extension that allows users to create custom text templates with triggers. When users type a trigger followed by Space, Enter, or Tab, the extension automatically expands it into the full template text. The extension stores templates, tags, and user profile variables locally in the browser and inserts expanded text into web forms and text fields. All functionality is self-contained and operates entirely within the user's browser.
```

**Character count:** ~280 characters (well under 1,000 limit)

---

## 2. Permission Justifications

### Storage Justification

**Answer (copy this):**
```
The 'storage' permission is required to save user-created templates, tags, and profile variables (first name, last name, email, custom variables) locally in the browser using Chrome's storage API. This data is stored only on the user's device and is never transmitted to external servers. The extension needs this permission to persist user data between browser sessions and enable the core text expansion functionality.
```

### ActiveTab Justification

**Answer (copy this):**
```
The 'activeTab' permission is required to insert expanded template text into the currently active webpage when the user types a trigger. This permission allows the extension to access the active tab only when the user explicitly triggers text expansion (by typing a trigger + delimiter). The extension uses this to insert text into input fields, textareas, and contenteditable elements on web pages.
```

### Host Permission Justification

**Answer (copy this):**
```
The '<all_urls>' host permission is required for the extension's core functionality: text expansion must work on any website the user visits. The extension needs to inject a content script into web pages to detect when users type triggers and expand them into templates. This permission is necessary because users may want to use text expansion on any website (email clients, forms, text editors, etc.). The extension only accesses pages when the user actively types a trigger, and it does not collect, transmit, or analyze any webpage content or user browsing data.
```

**Note:** You'll see a warning about in-depth review - this is normal for extensions with `<all_urls>`. Your justification is clear and legitimate.

---

## 3. Remote Code

**Answer:** Select **"No, I am not using remote code"**

**Why:**
- All JavaScript code is included in the extension package
- No external scripts are loaded from remote servers
- No `eval()` of remote strings
- No external modules or files
- All functionality is self-contained

**Important:** The image shows "Yes" selected - you need to change this to **"No"**!

---

## 4. Data Collection Checkboxes

**Check ONLY these boxes:**

- ✅ **[ ] Personally identifiable information**
  - **Why:** The extension stores user-provided profile variables (first name, last name, email) that users choose to enter for use in templates.

**DO NOT CHECK:**
- ❌ Health information
- ❌ Financial and payment information
- ❌ Authentication information
- ❌ Personal communications
- ❌ Location
- ❌ Web history
- ❌ User activity (the extension doesn't log or monitor user activity)
- ❌ Website content (the extension doesn't read or collect webpage content)

**Important:** Only check "Personally identifiable information" because users can optionally enter their name and email in profile variables. The extension doesn't collect this automatically - users must manually enter it.

---

## 5. Certification Checkboxes

**Check ALL THREE boxes:**

- ✅ **[ ] I do not sell or transfer user data to third parties, apart from the approved use cases**
- ✅ **[ ] I do not use or transfer user data for purposes that are unrelated to my item's single purpose**
- ✅ **[ ] I do not use or transfer user data to determine creditworthiness or for lending purposes**

**Why all three are true:**
- All data is stored locally, never sent to external servers
- Data is only used for text expansion functionality
- No third-party services or data sharing
- No analytics or tracking

---

## 6. Privacy Policy URL

**Answer:**
```
https://adhambanishamsah.github.io/FastKeys/
```

**Or if you haven't set up GitHub Pages yet:**
```
https://github.com/AdhamBanishamsah/FastKeys/blob/main/PRIVACY_POLICY.md
```

**Important:** 
- The URL must be publicly accessible (no login required)
- Must use HTTPS
- Should be the HTML version (GitHub Pages) if possible, or the markdown file on GitHub

---

## Quick Checklist

- [ ] Single purpose: ~280 characters (provided above)
- [ ] Storage justification: ~200 characters (provided above)
- [ ] ActiveTab justification: ~200 characters (provided above)
- [ ] Host permission justification: ~350 characters (provided above)
- [ ] Remote code: **Select "No"** (currently shows "Yes" - change this!)
- [ ] Data collection: Check **only** "Personally identifiable information"
- [ ] Certifications: Check **all 3 boxes**
- [ ] Privacy policy URL: Your GitHub Pages URL or GitHub markdown URL

---

## Important Notes

1. **Remote Code:** Make sure to change from "Yes" to **"No"** - this is critical!
2. **Host Permission Warning:** The orange warning about in-depth review is normal for `<all_urls>`. Your justification is clear and legitimate.
3. **Data Collection:** Only check what you actually collect. Since users manually enter profile info, check "Personally identifiable information" but nothing else.
4. **Privacy Policy:** Must be publicly accessible. Set up GitHub Pages if you haven't already (see `GITHUB_PAGES_SETUP.md`).

Good luck with your submission! 🚀
