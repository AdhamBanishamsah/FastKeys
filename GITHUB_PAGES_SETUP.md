# Hosting Privacy Policy on GitHub Pages

This guide will help you host the privacy policy HTML file on GitHub Pages so you can provide a URL for Chrome Web Store.

## Option 1: Simple Method (Recommended)

### Step 1: Create a `docs` folder in your repository
```bash
mkdir docs
cp privacy-policy.html docs/index.html
```

### Step 2: Enable GitHub Pages
1. Go to your GitHub repository: https://github.com/AdhamBanishamsah/FastKeys
2. Click **Settings** → **Pages** (left sidebar)
3. Under "Source", select **Deploy from a branch**
4. Select **main** branch and **/docs** folder
5. Click **Save**

### Step 3: Access Your Privacy Policy
Your privacy policy will be available at:
```
https://adhambanishamsah.github.io/FastKeys/
```

**Use this URL in Chrome Web Store listing!**

## Option 2: Using `gh-pages` Branch

### Step 1: Create gh-pages branch
```bash
git checkout -b gh-pages
git add privacy-policy.html
git mv privacy-policy.html index.html
git commit -m "Add privacy policy for GitHub Pages"
git push origin gh-pages
```

### Step 2: Enable GitHub Pages
1. Go to repository Settings → Pages
2. Select **gh-pages** branch
3. Select **/ (root)** folder
4. Click **Save**

### Step 3: Access Your Privacy Policy
```
https://adhambanishamsah.github.io/FastKeys/
```

## Option 3: Use Existing Repository's README

If you prefer, you can also:
1. Copy the privacy policy content to your repository's README.md
2. Or create a `PRIVACY.md` file
3. Link to it: `https://github.com/AdhamBanishamsah/FastKeys/blob/main/PRIVACY_POLICY.md`

However, GitHub Pages (Option 1 or 2) provides a cleaner, standalone page.

## Quick Setup Script

Run this to set up GitHub Pages quickly:

```bash
# Create docs folder and copy privacy policy
mkdir -p docs
cp privacy-policy.html docs/index.html

# Commit and push
git add docs/
git commit -m "Add privacy policy for GitHub Pages"
git push origin main

# Then enable GitHub Pages in repository settings
```

## Testing

After enabling GitHub Pages, wait 1-2 minutes, then visit:
- https://adhambanishamsah.github.io/FastKeys/

You should see your privacy policy page.

## Updating the Privacy Policy

To update the privacy policy:
1. Edit `privacy-policy.html` or `docs/index.html`
2. Commit and push changes
3. GitHub Pages will automatically update (may take 1-2 minutes)

## Alternative: Use GitHub Raw Content

If you don't want to set up GitHub Pages, you can use the raw markdown file:
```
https://raw.githubusercontent.com/AdhamBanishamsah/FastKeys/main/PRIVACY_POLICY.md
```

However, Chrome Web Store prefers a proper HTML page, so GitHub Pages is recommended.
