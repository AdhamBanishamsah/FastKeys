#!/bin/bash
# Script to set up privacy policy for GitHub Pages

echo "Setting up privacy policy for GitHub Pages..."

# Create docs folder if it doesn't exist
mkdir -p docs

# Copy privacy policy HTML to docs/index.html
cp privacy-policy.html docs/index.html

echo ""
echo "✓ Created docs/index.html"
echo ""
echo "Next steps:"
echo "1. Commit and push to GitHub:"
echo "   git add docs/ PRIVACY_POLICY.md"
echo "   git commit -m 'Add privacy policy for GitHub Pages'"
echo "   git push origin main"
echo ""
echo "2. Enable GitHub Pages:"
echo "   - Go to: https://github.com/AdhamBanishamsah/FastKeys/settings/pages"
echo "   - Under 'Source', select 'Deploy from a branch'"
echo "   - Select 'main' branch and '/docs' folder"
echo "   - Click 'Save'"
echo ""
echo "3. Wait 1-2 minutes, then visit:"
echo "   https://adhambanishamsah.github.io/FastKeys/"
echo ""
echo "4. Use this URL in Chrome Web Store:"
echo "   https://adhambanishamsah.github.io/FastKeys/"
echo ""
