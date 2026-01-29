# Chrome Web Store Submission Template

This is a reusable template for submitting Chrome extensions to the Chrome Web Store. Fill in the placeholders `[YOUR_EXTENSION_NAME]`, `[YOUR_GITHUB_USERNAME]`, etc. with your specific information.

---

## 1. Single Purpose Description

**Field:** Single purpose description* (max 1,000 characters)

**Template:**
```
[YOUR_EXTENSION_NAME] is a [TYPE_OF_EXTENSION] that [MAIN_FUNCTIONALITY]. The extension [HOW_IT_WORKS]. All functionality is self-contained and operates entirely within the user's browser. [ADDITIONAL_DETAILS_IF_NEEDED].
```

**Example (Text Expander):**
```
FastKeys is a text expansion and autofill extension that allows users to create custom text templates with triggers. When users type a trigger followed by Space, Enter, or Tab, the extension automatically expands it into the full template text. The extension stores templates, tags, and user profile variables locally in the browser and inserts expanded text into web forms and text fields. All functionality is self-contained and operates entirely within the user's browser.
```

**Tips:**
- Keep it under 1,000 characters
- Be specific about what the extension does
- Mention that it's self-contained (if true)
- Explain the core functionality clearly

---

## 2. Permission Justifications

### Storage Permission

**Field:** storage justification* (max 1,000 characters)

**Template:**
```
The 'storage' permission is required to save [WHAT_DATA] locally in the browser using Chrome's storage API. This data is stored only on the user's device and is never transmitted to external servers. The extension needs this permission to [WHY_NEEDED] and enable the core [FUNCTIONALITY] functionality.
```

**Example:**
```
The 'storage' permission is required to save user-created templates, tags, and profile variables (first name, last name, email, custom variables) locally in the browser using Chrome's storage API. This data is stored only on the user's device and is never transmitted to external servers. The extension needs this permission to persist user data between browser sessions and enable the core text expansion functionality.
```

### ActiveTab Permission

**Field:** activeTab justification* (max 1,000 characters)

**Template:**
```
The 'activeTab' permission is required to [WHAT_IT_DOES] on the currently active webpage when [WHEN_IT_ACTIVATES]. This permission allows the extension to access the active tab only when [USER_ACTION]. The extension uses this to [SPECIFIC_USE_CASE].
```

**Example:**
```
The 'activeTab' permission is required to insert expanded template text into the currently active webpage when the user types a trigger. This permission allows the extension to access the active tab only when the user explicitly triggers text expansion (by typing a trigger + delimiter). The extension uses this to insert text into input fields, textareas, and contenteditable elements on web pages.
```

### Host Permission Justification

**Field:** Host permission justification* (max 1,000 characters)

**Template (if using <all_urls>):**
```
The '<all_urls>' host permission is required for the extension's core functionality: [WHY_NEEDED_EVERYWHERE]. The extension needs to [WHAT_CONTENT_SCRIPT_DOES]. This permission is necessary because [WHY_CANT_SPECIFY_SITES]. The extension only accesses pages when [USER_ACTION], and it does not collect, transmit, or analyze any webpage content or user browsing data.
```

**Example:**
```
The '<all_urls>' host permission is required for the extension's core functionality: text expansion must work on any website the user visits. The extension needs to inject a content script into web pages to detect when users type triggers and expand them into templates. This permission is necessary because users may want to use text expansion on any website (email clients, forms, text editors, etc.). The extension only accesses pages when the user actively types a trigger, and it does not collect, transmit, or analyze any webpage content or user browsing data.
```

**Template (if using specific sites):**
```
The host permission '[SPECIFIC_SITE]' is required because [WHY_THIS_SITE]. The extension needs to [WHAT_IT_DOES_ON_THIS_SITE]. This permission is necessary for [CORE_FUNCTIONALITY].
```

**Note:** If you see a warning about in-depth review for `<all_urls>`, this is normal. Your justification should clearly explain why broad permissions are necessary.

---

## 3. Remote Code

**Question:** Are you using remote code?

**Answer:** 
- [ ] **No, I am not using remote code** (Most common - select this if all code is in the package)
- [ ] Yes, I am using remote code (Only if you load external JS/WASM)

**Justification (if Yes):**
```
[EXPLAIN_WHY_REMOTE_CODE_IS_NEEDED_AND_HOW_IT_IS_SECURE]
```

**When to select "No":**
- All JavaScript is included in the extension package
- No external scripts loaded from remote servers
- No `eval()` of remote strings
- No external modules or files
- All functionality is self-contained

**When to select "Yes":**
- You load JavaScript from external URLs
- You use external WASM files
- You evaluate code from remote sources
- You dynamically load modules from external servers

**Most extensions should select "No".**

---

## 4. Data Collection

**Question:** What user data do you plan to collect from users now or in the future?

**Check ONLY the boxes that apply to your extension:**

- [ ] **Personally identifiable information** (e.g., name, address, email, age, ID number)
  - Check if: Users can enter their name, email, or other personal info
  - Example: Profile variables, user settings with personal info

- [ ] **Health information** (e.g., heart rate, medical history, symptoms)
  - Check if: Extension collects health/medical data

- [ ] **Financial and payment information** (e.g., transactions, credit cards, financial statements)
  - Check if: Extension handles financial data

- [ ] **Authentication information** (e.g., passwords, credentials, PINs)
  - Check if: Extension stores or handles passwords

- [ ] **Personal communications** (e.g., emails, texts, chat messages)
  - Check if: Extension reads or collects messages

- [ ] **Location** (e.g., region, IP address, GPS coordinates)
  - Check if: Extension collects location data

- [ ] **Web history** (list of web pages visited)
  - Check if: Extension tracks browsing history

- [ ] **User activity** (e.g., network monitoring, clicks, mouse position, scroll, keystroke logging)
  - Check if: Extension monitors or logs user activity
  - **Note:** Text expansion that only detects triggers (not logging) typically doesn't need this

- [ ] **Website content** (e.g., text, images, sounds, videos, hyperlinks)
  - Check if: Extension reads or collects webpage content

**Important:** Only check boxes for data you actually collect. If users manually enter data (like profile variables), check "Personally identifiable information" but nothing else.

---

## 5. Certifications

**Question:** I certify that the following disclosures are true:

**Check ALL THREE boxes (required):**

- [x] **I do not sell or transfer user data to third parties, apart from the approved use cases**
  - Check this if: You don't sell or share user data with third parties

- [x] **I do not use or transfer user data for purposes that are unrelated to my item's single purpose**
  - Check this if: Data is only used for the extension's stated purpose

- [x] **I do not use or transfer user data to determine creditworthiness or for lending purposes**
  - Check this if: You don't use data for credit/lending decisions

**Note:** If your extension stores data locally and doesn't send it anywhere, all three should be checked.

---

## 6. Privacy Policy URL

**Field:** Privacy policy URL* (max 2,048 characters)

**Template:**
```
https://[YOUR_GITHUB_USERNAME].github.io/[YOUR_REPO_NAME]/
```

**Or if using GitHub markdown:**
```
https://github.com/[YOUR_GITHUB_USERNAME]/[YOUR_REPO_NAME]/blob/main/PRIVACY_POLICY.md
```

**Example:**
```
https://adhambanishamsah.github.io/FastKeys/
```

**Requirements:**
- Must be publicly accessible (no login required)
- Must use HTTPS
- Should be a proper HTML page (GitHub Pages preferred)
- Must contain a complete privacy policy

---

## 7. Additional URLs (Store Listing)

### Official URL
**Answer:** Select **"None"** (or leave blank)

**When to use "Add a new site":**
- Only if you have your own domain (e.g., `yourextension.com`)
- Requires Google Search Console verification
- Not necessary for GitHub-hosted projects

### Homepage URL
**Template:**
```
https://github.com/[YOUR_GITHUB_USERNAME]/[YOUR_REPO_NAME]
```

**Example:**
```
https://github.com/AdhamBanishamsah/FastKeys
```

**Alternative (if you have a website):**
```
https://[YOUR_WEBSITE].com
```

### Support URL
**Template:**
```
https://github.com/[YOUR_GITHUB_USERNAME]/[YOUR_REPO_NAME]/issues
```

**Example:**
```
https://github.com/AdhamBanishamsah/FastKeys/issues
```

**Alternative options:**
- Main repository URL: `https://github.com/[USERNAME]/[REPO]`
- Dedicated support page: `https://[YOUR_WEBSITE].com/support`
- FAQ page: `https://[YOUR_WEBSITE].com/faq`

---

## 8. Store Listing Information

### Name
**Template:**
```
[Your Extension Name]
```

### Short Description (132 characters max)
**Template:**
```
[Brief description of what your extension does and key features]
```

**Example:**
```
Text expander and autofill extension with template management, variables, and date formatting
```

### Full Description
**Template:**
```
[Your Extension Name] is a [type of extension] that [main purpose].

Key Features:
• [Feature 1]
• [Feature 2]
• [Feature 3]
• [Feature 4]

How it works:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Perfect for:
• [Use case 1]
• [Use case 2]

Privacy:
[Privacy statement - e.g., "All data is stored locally. No data is sent to external servers."]
```

### Category
**Common choices:**
- Productivity
- Developer Tools
- Social & Communication
- Shopping
- News & Weather
- etc.

### Language
- English (and others if you support them)

---

## 9. Common Permission Justifications

### If you use `storage`:
```
The 'storage' permission is required to save [user data/settings] locally in the browser using Chrome's storage API. This data is stored only on the user's device and is never transmitted to external servers.
```

### If you use `activeTab`:
```
The 'activeTab' permission is required to [insert content/access page] when the user [performs action]. This permission allows the extension to access the active tab only when the user explicitly [triggers action].
```

### If you use `<all_urls>`:
```
The '<all_urls>' host permission is required for the extension's core functionality: [why it needs to work everywhere]. The extension needs to [what content script does]. This permission is necessary because [why you can't specify sites]. The extension only accesses pages when [user action], and it does not collect, transmit, or analyze any webpage content or user browsing data.
```

### If you use `tabs`:
```
The 'tabs' permission is required to [list tabs/access tab info] for [specific functionality]. The extension uses this to [what it does with tab info].
```

### If you use `bookmarks`:
```
The 'bookmarks' permission is required to [read/create bookmarks] for [functionality]. The extension uses this to [specific use case].
```

---

## 10. Checklist Before Submission

- [ ] Single purpose description written (under 1,000 chars)
- [ ] All permission justifications written (under 1,000 chars each)
- [ ] Remote code question answered correctly
- [ ] Data collection checkboxes selected appropriately
- [ ] All 3 certification boxes checked
- [ ] Privacy policy URL ready and accessible
- [ ] Homepage URL provided
- [ ] Support URL provided
- [ ] Store listing description ready
- [ ] Screenshots prepared
- [ ] Promotional tiles created
- [ ] Extension package (ZIP) created and tested

---

## 11. Tips for Faster Approval

1. **Be specific**: Vague justifications lead to questions
2. **Match permissions to functionality**: Don't request permissions you don't need
3. **Clear privacy policy**: Make it easy to understand what data you collect
4. **Test thoroughly**: Fix bugs before submission
5. **Complete all fields**: Don't leave anything blank
6. **Be honest**: Accurate disclosures prevent rejections

---

## 12. Common Mistakes to Avoid

❌ **Don't:**
- Request permissions you don't actually use
- Leave permission justifications vague
- Check data collection boxes you don't need
- Use remote code without justification
- Submit without testing
- Leave fields blank

✅ **Do:**
- Be specific in justifications
- Only check data collection boxes that apply
- Test your extension thoroughly
- Provide clear, honest answers
- Match permissions to actual functionality

---

## Quick Reference

**Copy-paste ready sections:**

### Single Purpose (Generic)
```
[Extension Name] is a [type] extension that [main function]. The extension [how it works]. All functionality is self-contained and operates entirely within the user's browser.
```

### Storage Permission (Generic)
```
The 'storage' permission is required to save [data type] locally in the browser using Chrome's storage API. This data is stored only on the user's device and is never transmitted to external servers. The extension needs this permission to [purpose].
```

### ActiveTab Permission (Generic)
```
The 'activeTab' permission is required to [action] on the currently active webpage when [trigger]. This permission allows the extension to access the active tab only when the user explicitly [user action]. The extension uses this to [use case].
```

### Host Permission - All URLs (Generic)
```
The '<all_urls>' host permission is required for the extension's core functionality: [why everywhere]. The extension needs to [what script does]. This permission is necessary because [why can't specify sites]. The extension only accesses pages when [user action], and it does not collect, transmit, or analyze any webpage content or user browsing data.
```

---

## Post-approval: Enhanced Safe Browsing warning

After your extension is **approved** and listed on the Chrome Web Store, some users may see a **"Proceed with caution"** dialog when they try to install it. The message says: *"This extension is not trusted by Enhanced Safe Browsing."*

**What it means:**
- This is **not** a rejection or a store policy violation. Your extension passed review.
- The dialog comes from **Chrome’s Enhanced Safe Browsing** (a user safety feature), not from the store review team.
- It often appears for **new extensions** or extensions with **few installs**, because Chrome doesn’t yet have enough reputation signals.

**What users can do:**
- They can click **"Continue to install"** to install the extension. The warning is informational.

**What you can do:**
- There is **no change you can make** (permissions, manifest, or listing) that will remove this warning. It is controlled entirely by Chrome’s safety systems.
- The warning typically **fades over time** as the extension gains installs and positive engagement.

**Summary:** Approval = you’re good. The install-time warning is normal for new/low-install extensions and usually goes away as the extension gains reputation.

---

## Notes

- Character limits are enforced - stay under limits
- All fields marked with * are required
- Review typically takes 1-3 business days
- In-depth review for `<all_urls>` is normal and expected
- Be prepared to answer follow-up questions if asked

---

**Good luck with your submission!** 🚀
