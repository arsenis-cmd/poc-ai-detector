#!/bin/bash
# Prepare Chrome Extension for Submission
# Run this script before submitting to Chrome Web Store

set -e  # Exit on error

echo "🚀 Preparing PoC AI Content Detector for Chrome Web Store submission..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo -e "${RED}❌ Error: manifest.json not found. Please run this script from the extension directory.${NC}"
    exit 1
fi

echo "✅ Found manifest.json"

# Create submission directory
SUBMISSION_DIR="../extension-submission"
rm -rf "$SUBMISSION_DIR"
mkdir -p "$SUBMISSION_DIR"

echo "📁 Created submission directory: $SUBMISSION_DIR"

# Copy necessary files
echo "📋 Copying extension files..."

cp manifest.json "$SUBMISSION_DIR/"
cp -r icons "$SUBMISSION_DIR/"
cp -r popup "$SUBMISSION_DIR/"
cp -r content "$SUBMISSION_DIR/"
cp -r background "$SUBMISSION_DIR/"
cp -r options "$SUBMISSION_DIR/"

# Copy documentation
cp README.md "$SUBMISSION_DIR/"
cp PRIVACY.md "$SUBMISSION_DIR/"

# Create LICENSE if it doesn't exist
if [ ! -f "LICENSE" ]; then
    echo -e "${YELLOW}⚠️  No LICENSE file found. Creating MIT license...${NC}"
    cat > "$SUBMISSION_DIR/LICENSE" << 'EOF'
MIT License

Copyright (c) 2024 PoC Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
else
    cp LICENSE "$SUBMISSION_DIR/"
fi

# Remove development files
echo "🧹 Cleaning up development files..."
find "$SUBMISSION_DIR" -name ".DS_Store" -delete
find "$SUBMISSION_DIR" -name "*.map" -delete
find "$SUBMISSION_DIR" -name "*.test.js" -delete

# Check for console.log statements
echo ""
echo "🔍 Checking for console.log statements..."
CONSOLE_LOGS=$(grep -r "console.log" "$SUBMISSION_DIR" --include="*.js" | grep -v "console.error" | grep -v "console.warn" || true)

if [ ! -z "$CONSOLE_LOGS" ]; then
    echo -e "${YELLOW}⚠️  Found console.log statements:${NC}"
    echo "$CONSOLE_LOGS"
    echo ""
    echo -e "${YELLOW}Consider removing these before submission (or leave for debugging)${NC}"
else
    echo -e "${GREEN}✅ No console.log statements found${NC}"
fi

# Check file sizes
echo ""
echo "📊 Checking file sizes..."
LARGE_FILES=$(find "$SUBMISSION_DIR" -type f -size +1M || true)
if [ ! -z "$LARGE_FILES" ]; then
    echo -e "${YELLOW}⚠️  Large files detected (>1MB):${NC}"
    ls -lh $LARGE_FILES
else
    echo -e "${GREEN}✅ All files are reasonably sized${NC}"
fi

# Calculate total size
TOTAL_SIZE=$(du -sh "$SUBMISSION_DIR" | cut -f1)
echo "📦 Total extension size: $TOTAL_SIZE"

# Create zip file
VERSION=$(grep '"version"' manifest.json | cut -d'"' -f4)
ZIP_NAME="poc-ai-detector-v${VERSION}.zip"

echo ""
echo "📦 Creating zip file: $ZIP_NAME"

cd "$SUBMISSION_DIR"
zip -r "../$ZIP_NAME" . -x "*.git*" "*.DS_Store" > /dev/null

cd ..
ZIP_SIZE=$(du -sh "$ZIP_NAME" | cut -f1)

echo -e "${GREEN}✅ Zip file created: $ZIP_NAME ($ZIP_SIZE)${NC}"

# Verify zip contents
echo ""
echo "📋 Zip contents:"
unzip -l "$ZIP_NAME" | head -20

# Final checklist
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📝 PRE-SUBMISSION CHECKLIST"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check for required files
declare -A checklist
checklist["manifest.json exists"]=$([ -f "$SUBMISSION_DIR/manifest.json" ] && echo "✅" || echo "❌")
checklist["icons/icon16.png exists"]=$([ -f "$SUBMISSION_DIR/icons/icon16.png" ] && echo "✅" || echo "❌")
checklist["icons/icon48.png exists"]=$([ -f "$SUBMISSION_DIR/icons/icon48.png" ] && echo "✅" || echo "❌")
checklist["icons/icon128.png exists"]=$([ -f "$SUBMISSION_DIR/icons/icon128.png" ] && echo "✅" || echo "❌")
checklist["README.md exists"]=$([ -f "$SUBMISSION_DIR/README.md" ] && echo "✅" || echo "❌")
checklist["PRIVACY.md exists"]=$([ -f "$SUBMISSION_DIR/PRIVACY.md" ] && echo "✅" || echo "❌")

for item in "${!checklist[@]}"; do
    echo -e "${checklist[$item]} $item"
done

echo ""
echo -e "${YELLOW}⚠️  MANUAL TASKS REMAINING:${NC}"
echo ""
echo "  1. ⚠️  Host PRIVACY.md at a public URL (required!)"
echo "      - Use GitHub Pages, Google Sites, or your website"
echo "      - Add URL to Chrome Web Store listing"
echo ""
echo "  2. ⚠️  Create promotional images:"
echo "      - Small tile: 440x280 pixels (required)"
echo "      - Screenshots: 1280x800 pixels (1-5 images)"
echo "      - Save in store-assets/ folder"
echo ""
echo "  3. ⚠️  Test extension on clean Chrome profile"
echo "      - Install $ZIP_NAME as unpacked extension"
echo "      - Test all features"
echo "      - Verify no errors in console"
echo ""
echo "  4. ⚠️  Add homepage_url to manifest.json"
echo "      - Your GitHub repo or project website"
echo ""
echo "  5. ✅ Create Chrome Web Store Developer account (\$5 fee)"
echo "      - https://chrome.google.com/webstore/devconsole"
echo ""
echo "  6. ✅ Upload $ZIP_NAME to Chrome Web Store"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ Package ready: $ZIP_NAME${NC}"
echo -e "${GREEN}✅ Submission files ready in: $SUBMISSION_DIR${NC}"
echo ""
echo "See SUBMISSION_CHECKLIST.md for complete submission guide."
echo ""
