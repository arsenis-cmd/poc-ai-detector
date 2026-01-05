#!/bin/bash

echo "🚀 PoC AI Detector - GitHub Setup"
echo "=================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Error: Not a git repository"
    exit 1
fi

# Get GitHub username
echo "What is your GitHub username?"
read -p "Username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ Error: GitHub username cannot be empty"
    exit 1
fi

REPO_NAME="poc-ai-detector"
GITHUB_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
PAGES_URL="https://${GITHUB_USERNAME}.github.io/${REPO_NAME}/"

echo ""
echo "📋 Configuration:"
echo "  GitHub Username: $GITHUB_USERNAME"
echo "  Repository:      $GITHUB_URL"
echo "  Privacy Policy:  $PAGES_URL"
echo ""

# Confirm
read -p "Is this correct? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

echo ""
echo "📝 Step 1: Updating files with your GitHub username..."

# Update docs/index.html
if [ -f docs/index.html ]; then
    sed -i '' "s/yourusername/$GITHUB_USERNAME/g" docs/index.html
    sed -i '' "s/support@example.com/support@example.com/g" docs/index.html
    echo "  ✅ Updated docs/index.html"
fi

# Update README.md
if [ -f README.md ]; then
    sed -i '' "s/yourusername/$GITHUB_USERNAME/g" README.md
    echo "  ✅ Updated README.md"
fi

echo ""
echo "📦 Step 2: Committing changes..."
git add .
git commit -m "Update links with GitHub username: $GITHUB_USERNAME" || echo "  (No changes to commit)"

echo ""
echo "🔗 Step 3: Adding GitHub remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "$GITHUB_URL"
git branch -M main

echo ""
echo "⬆️  Step 4: Pushing to GitHub..."
echo ""
echo "⚠️  If this is your first push, you may need to:"
echo "  1. Create the repository on GitHub first: https://github.com/new"
echo "  2. Repository name: $REPO_NAME"
echo "  3. Make it PUBLIC (required for GitHub Pages)"
echo "  4. Don't initialize with README, .gitignore, or license"
echo ""
read -p "Have you created the repository on GitHub? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please create the repository first, then run this script again."
    echo "Go to: https://github.com/new"
    exit 1
fi

echo ""
echo "Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Code pushed to GitHub"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎉 Next Steps:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1. Enable GitHub Pages:"
    echo "   Go to: https://github.com/$GITHUB_USERNAME/$REPO_NAME/settings/pages"
    echo "   - Source: main branch"
    echo "   - Folder: /docs"
    echo "   - Click Save"
    echo ""
    echo "2. Wait 2-3 minutes, then visit:"
    echo "   $PAGES_URL"
    echo ""
    echo "3. Use this URL for Chrome Web Store Privacy Policy:"
    echo "   $PAGES_URL"
    echo ""
    echo "4. Repository URL:"
    echo "   https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📄 See GITHUB_SETUP.md for detailed instructions"
    echo ""
else
    echo ""
    echo "❌ Error pushing to GitHub"
    echo ""
    echo "Common solutions:"
    echo "  1. Make sure the repository exists on GitHub"
    echo "  2. Check your GitHub credentials"
    echo "  3. Try using SSH instead of HTTPS"
    echo ""
    echo "See GITHUB_SETUP.md for troubleshooting"
fi
