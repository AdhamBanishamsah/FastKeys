#!/bin/bash
# Script to create a Chrome Web Store package

echo "Creating FastKeys Chrome Web Store package..."

# Remove old package if exists
rm -f fastkeys.zip

# Create ZIP excluding unnecessary files
zip -r fastkeys.zip . \
  -x "*.md" \
  -x "project.md" \
  -x ".git/*" \
  -x ".DS_Store" \
  -x "*.swp" \
  -x "*.swo" \
  -x "*~" \
  -x "GITHUB_*.md" \
  -x "PRE_PUBLISH_CHECKLIST.md" \
  -x "create-package.sh" \
  -x ".cursor/*" \
  -x "node_modules/*" \
  -x ".vscode/*" \
  -x ".idea/*"

echo ""
echo "✓ Package created: fastkeys.zip"
echo ""
echo "Next steps:"
echo "1. Test the package by loading it as an unpacked extension"
echo "2. Go to https://chrome.google.com/webstore/devconsole"
echo "3. Click 'New Item' and upload fastkeys.zip"
echo "4. Fill in store listing information"
echo "5. Submit for review"
