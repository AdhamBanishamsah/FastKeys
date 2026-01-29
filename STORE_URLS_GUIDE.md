# Chrome Web Store - URL Fields Guide

## Field-by-Field Guide

### 1. Official URL
**Answer:** Select **"None"** (or leave as is)

**Why:**
- This field is for verified domains that you own and have verified with Google Search Console
- It's optional for most extensions
- You don't need to verify a domain unless you have a dedicated website for your extension
- Your GitHub repository doesn't need to be verified here

**When to use "Add a new site":**
- Only if you have your own domain (e.g., `fastkeys.com`) and want to verify it
- This requires Google Search Console verification
- Not necessary for GitHub-hosted projects

---

### 2. Homepage URL
**Answer:** 
```
https://github.com/AdhamBanishamsah/FastKeys
```

**Why:**
- This is the main landing page for your extension
- GitHub repository URL is perfect here
- Users can find the source code, documentation, and project information
- This is a standard practice for open-source extensions

**Alternative (if you set up GitHub Pages):**
If you create a nice landing page on GitHub Pages, you could use:
```
https://adhambanishamsah.github.io/FastKeys/
```
But the GitHub repository URL is perfectly fine and more common.

---

### 3. Support URL
**Answer:**
```
https://github.com/AdhamBanishamsah/FastKeys/issues
```

**Why:**
- This is where users can get help and report issues
- GitHub Issues is the standard support channel for open-source projects
- Users can:
  - Report bugs
  - Ask questions
  - Request features
  - Get help from the community

**Alternative options:**
- If you prefer, you can use the main repository URL: `https://github.com/AdhamBanishamsah/FastKeys`
- Or create a dedicated support page on GitHub Pages with FAQs

---

## Summary - Quick Copy

**Official URL:** 
- Select "None" (or leave blank)

**Homepage URL:**
```
https://github.com/AdhamBanishamsah/FastKeys
```

**Support URL:**
```
https://github.com/AdhamBanishamsah/FastKeys/issues
```

---

## Notes

- All URLs must be publicly accessible (no authentication required)
- URLs should use HTTPS (GitHub automatically provides this)
- Make sure your GitHub repository is public (not private)
- These URLs help users find more information and get support
- Chrome Web Store reviewers may check these URLs during review

---

## Optional: Create a Better Homepage

If you want a more polished homepage, you could:

1. Create a `docs/index.html` with project information
2. Enable GitHub Pages (see `GITHUB_PAGES_SETUP.md`)
3. Use: `https://adhambanishamsah.github.io/FastKeys/`

But the GitHub repository URL is perfectly acceptable and commonly used!
