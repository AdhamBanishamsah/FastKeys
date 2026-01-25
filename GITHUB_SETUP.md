# Connecting to GitHub

## Quick Setup Commands

After creating a repository on GitHub, run these commands:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/FastKeys.git

# Rename branch to main (GitHub's default)
git branch -M main

# Push your code to GitHub
git push -u origin main
```

## Alternative: Using SSH

If you prefer SSH (and have SSH keys set up):

```bash
git remote add origin git@github.com:YOUR_USERNAME/FastKeys.git
git branch -M main
git push -u origin main
```

## What's Already Done

✅ Git repository initialized
✅ .gitignore created
✅ Initial commit made
✅ All files committed

## Next Steps

1. Create repository on GitHub.com
2. Copy the repository URL
3. Run the commands above with your repository URL
4. Your code will be pushed to GitHub!

## Future Updates

After making changes, use:

```bash
git add .
git commit -m "Description of changes"
git push
```
