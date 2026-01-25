# GitHub Authentication Setup

## Option 1: Personal Access Token (Recommended for HTTPS)

1. **Create a Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Name it: "FastKeys Local"
   - Select scope: `repo` (full control of private repositories)
   - Click "Generate token"
   - **Copy the token immediately** (you won't see it again!)

2. **Push using the token:**
   ```bash
   git push -u origin main
   ```
   - Username: `AdhamBanishamsah`
   - Password: **Paste your Personal Access Token** (not your GitHub password)

## Option 2: Use GitHub CLI (gh)

If you have GitHub CLI installed:
```bash
gh auth login
git push -u origin main
```

## Option 3: Configure Git Credential Helper

To save your credentials:
```bash
git config --global credential.helper osxkeychain
```

Then when you push, enter your username and Personal Access Token, and it will be saved.

## Verify Repository Exists

Make sure the repository is accessible:
- Visit: https://github.com/AdhamBanishamsah/FastKeys
- If you see a 404, the repository might not exist or might be private
- If it's private, you'll need authentication to push
