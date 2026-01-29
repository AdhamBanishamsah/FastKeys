# Quick Reference - Publishing FastKeys

## 🚀 Fast Track to Publishing

### 1. Privacy Policy (5 min)
```bash
# Set up GitHub Pages
mkdir -p docs
cp privacy-policy.html docs/index.html
git add docs/
git commit -m "Add privacy policy"
git push origin main
```
Then enable GitHub Pages in repo settings → Pages → `/docs` folder
**URL**: `https://adhambanishamsah.github.io/FastKeys/`

### 2. Create Package (1 min)
```bash
./create-package.sh
```

### 3. Create Images (30-60 min)
- Small tile: 440x280px
- Large tile: 920x680px
- Screenshots: 1280x800px (at least 1)

See `SCREENSHOTS_GUIDE.md` for details.

### 4. Submit (10 min)
1. Go to https://chrome.google.com/webstore/devconsole
2. New Item → Upload `fastkeys.zip`
3. Fill form (use `STORE_LISTING.md`)
4. Add privacy policy URL
5. Upload images
6. Submit!

## 📋 Store Listing Quick Copy

**Name:** FastKeys

**Short Description:**
```
Text expander and autofill extension with template management, variables, and date formatting
```

**Category:** Productivity

**Privacy Policy URL:** 
```
https://adhambanishamsah.github.io/FastKeys/
```
(Update after setting up GitHub Pages)

**Full Description:** See `STORE_LISTING.md`

## ✅ Final Checklist

- [ ] Privacy policy URL ready
- [ ] Images created (tiles + screenshots)
- [ ] Package tested
- [ ] Store listing filled
- [ ] Submitted!

## 📁 Files You Need

- `fastkeys.zip` - Your package
- Promotional tiles (2 images)
- Screenshots (1-5 images)
- Privacy policy URL

That's it! 🎉
