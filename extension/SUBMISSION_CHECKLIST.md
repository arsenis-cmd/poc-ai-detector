# Chrome Web Store Submission Checklist

Complete this checklist before submitting your extension.

---

## ✅ CRITICAL REQUIREMENTS (Must Complete)

### 1. Extension Icons & Images

- [ ] **Icon files exist and are correct size**
  - `icons/icon16.png` - 16x16 pixels
  - `icons/icon48.png` - 48x48 pixels
  - `icons/icon128.png` - 128x128 pixels
  - All icons should be high quality PNG with transparent background
  - Icons should be recognizable and professional

- [ ] **Create promotional images** (required for Chrome Web Store listing)
  - Small tile: 440x280 pixels
  - Large tile: 920x680 pixels (optional but recommended)
  - Marquee: 1400x560 pixels (optional but recommended)
  - Screenshot: 1280x800 or 640x400 pixels (minimum 1, maximum 5)

**Action needed:** Create these images in `extension/store-assets/`

---

### 2. Privacy Policy

- [ ] **Host privacy policy publicly**
  - Privacy policy MUST be hosted on a public URL
  - Cannot be a PDF or downloadable file
  - Must be accessible without login
  - Options:
    - GitHub Pages (easiest)
    - Your own website
    - Google Sites

**Current file:** `extension/PRIVACY.md` exists but needs to be hosted

**Action needed:**
```bash
# Option 1: Use GitHub Pages
# 1. Create a new repo or use existing one
# 2. Go to Settings → Pages
# 3. Enable GitHub Pages
# 4. Upload PRIVACY.md as index.md
# 5. Get the URL (e.g., https://yourusername.github.io/poc-privacy)

# Option 2: Convert to HTML and host anywhere
```

---

### 3. Extension Metadata

- [ ] **Review manifest.json**
  - Name is clear and not misleading ✅ (already done: "PoC AI Content Detector")
  - Description is accurate ✅ (already done)
  - Version is set ✅ (1.0.0)
  - Author field present ✅ (already done)

- [ ] **Add homepage/support URL**

**Action needed:** Edit `manifest.json`:
```json
{
  "homepage_url": "https://github.com/yourusername/poc-ai-detector",
  // or your project website
}
```

---

### 4. Remove Development/Debug Code

- [ ] **Remove console.log statements (or keep only errors)**

**Action needed:**
```bash
# Search for console.log in all files
cd extension
grep -r "console.log" content/ popup/ background/ options/

# Decide which to keep (errors/warnings) and which to remove
```

- [ ] **Remove localhost references in comments**
  - Already configured to use settings page ✅
  - Default fallback to localhost is fine

- [ ] **Remove any test data**
  - Check `popup.js` line 4-10 for MOCK_LEADERBOARD
  - Either remove or clearly mark as demo data

---

### 5. Test Extension Thoroughly

- [ ] **Test on clean Chrome profile**
  ```bash
  # Create new Chrome profile for testing
  # Install extension fresh
  # Go through all features
  ```

- [ ] **Test all features**
  - [ ] Extension installs without errors
  - [ ] Settings page opens and saves configuration
  - [ ] API connection test works
  - [ ] Popup displays correctly
  - [ ] "Scan This Page" button works
  - [ ] Visual highlighting appears on webpages
  - [ ] Statistics update correctly
  - [ ] Total scans counter increments
  - [ ] Works on Twitter/X
  - [ ] Works on Reddit
  - [ ] Works on general websites

- [ ] **Test error scenarios**
  - [ ] What happens when backend is offline?
  - [ ] What happens with invalid API URL?
  - [ ] Does it gracefully handle network errors?

- [ ] **Cross-browser testing**
  - [ ] Test on different Chrome versions
  - [ ] Test on Chromium browsers (Edge, Brave)

---

### 6. Security & Permissions Review

- [ ] **Review permissions in manifest.json**
  - `activeTab` ✅ - Needed for scanning pages
  - `storage` ✅ - Needed for saving stats
  - `scripting` ✅ - Needed for content scripts
  - `<all_urls>` ✅ - Needed to work on any website

  All permissions are justified and documented ✅

- [ ] **Ensure no sensitive data is collected**
  - Extension only stores: API URL, scan counts ✅
  - No personal information collected ✅
  - No tracking or analytics ✅

- [ ] **Content Security Policy**
  - No inline scripts ✅
  - All scripts are in separate files ✅

---

### 7. Code Quality & Cleanup

- [ ] **Remove unused files**
  - Check if all content scripts are necessary
  - Current files: detector.js, highlighter.js, twitter.js, ad-detector.js, account-analyzer.js, expose-bot.js, companion.js
  - Are all of these being used?

**Action needed:** Review which scripts are essential for v1.0

- [ ] **Minify code (optional but recommended)**
  ```bash
  # Optional: Minify JavaScript files to reduce size
  npm install -g terser
  terser popup/popup.js -o popup/popup.min.js
  # Update manifest.json to use minified versions
  ```

- [ ] **Check file sizes**
  - Extension should be < 20MB total
  - Individual files < 5MB

---

### 8. Legal & Compliance

- [ ] **Ensure you have rights to all code**
  - If using any third-party libraries, check licenses
  - Add LICENSE file to extension folder

- [ ] **Add license file**

**Action needed:**
```bash
# Create extension/LICENSE
# Use MIT, Apache 2.0, or your preferred license
```

- [ ] **Trademark check**
  - Extension name doesn't infringe trademarks
  - "PoC AI Content Detector" seems generic enough ✅

---

### 9. Chrome Web Store Account Setup

- [ ] **Create Chrome Web Store Developer account**
  - Go to: https://chrome.google.com/webstore/devconsole
  - Sign in with Google account
  - Pay one-time $5 registration fee
  - Complete developer profile

- [ ] **Prepare payment method**
  - If planning to charge for extension (not applicable for free)

---

### 10. Prepare Store Listing Content

- [ ] **Write detailed description**
  - Use `STORE_LISTING.md` as template ✅
  - Highlight key features
  - Include setup instructions
  - Mention backend requirement

- [ ] **Create screenshots** (1-5 images required)

**Action needed:** Take screenshots showing:
  1. Extension popup with statistics
  2. Settings page with API configuration
  3. Visual highlighting on a webpage (Twitter example)
  4. Visual highlighting on a webpage (Reddit example)
  5. Scan results and detection badges

  Save as: `extension/store-assets/screenshot-1.png`, etc.

- [ ] **Prepare promotional content**
  - Category: "Productivity" ✅
  - Language: English ✅
  - Short description (132 chars max)

---

## 🔧 RECOMMENDED (Strongly Advised)

### 11. Add User Documentation

- [ ] **Create in-extension help**
  - Add "Help" or "?" button in popup
  - Link to documentation

- [ ] **Update README.md**
  - Clear installation instructions ✅ (already done)
  - Backend setup guide ✅ (already done)

---

### 12. Analytics & Monitoring (Optional)

- [ ] **Set up error tracking**
  - Consider adding Sentry or similar
  - Or simple error logging to your backend

- [ ] **Usage analytics** (if desired)
  - Only if disclosed in privacy policy
  - Consider Google Analytics with anonymization

---

### 13. Version Control & Backup

- [ ] **Git commit all changes**
  ```bash
  git add .
  git commit -m "v1.0.0 - Ready for Chrome Web Store submission"
  git tag v1.0.0
  git push origin main --tags
  ```

- [ ] **Create release build**
  ```bash
  cd extension
  # Remove unnecessary files
  rm -rf .git .DS_Store
  cd ..
  # Create zip file
  zip -r poc-ai-detector-v1.0.0.zip extension/
  ```

---

## 📦 FINAL SUBMISSION STEPS

### 14. Package Extension

- [ ] **Create clean directory**
  ```bash
  # Copy only necessary files
  mkdir extension-package
  cp -r extension/manifest.json extension-package/
  cp -r extension/icons extension-package/
  cp -r extension/popup extension-package/
  cp -r extension/content extension-package/
  cp -r extension/background extension-package/
  cp -r extension/options extension-package/
  # Add README, PRIVACY, LICENSE
  cp extension/README.md extension-package/
  cp extension/PRIVACY.md extension-package/
  ```

- [ ] **Zip the extension**
  ```bash
  cd extension-package
  zip -r ../poc-ai-detector-v1.0.0.zip .
  # DO NOT include parent folder in zip
  # Structure should be: manifest.json at root, not extension/manifest.json
  ```

- [ ] **Verify zip file**
  - Unzip in a temp location
  - Load unpacked in Chrome
  - Test again

---

### 15. Chrome Web Store Submission

- [ ] **Login to Chrome Web Store Developer Console**
  - https://chrome.google.com/webstore/devconsole

- [ ] **Click "New Item"**

- [ ] **Upload zip file**

- [ ] **Fill out store listing**
  - **Product name:** PoC AI Content Detector
  - **Summary:** (132 chars) From STORE_LISTING.md
  - **Description:** Full description from STORE_LISTING.md
  - **Category:** Productivity
  - **Language:** English
  - **Icon:** Upload 128x128 icon
  - **Screenshots:** Upload 1-5 screenshots
  - **Promotional images:** Upload small tile (required)
  - **Privacy policy URL:** Your hosted privacy policy URL
  - **Homepage URL:** Your GitHub or website
  - **Support URL:** GitHub issues or support email

- [ ] **Select visibility**
  - Public (anyone can find and install)
  - Unlisted (only people with link can install)
  - Private (for testing, limited to specific users)

- [ ] **Pricing**
  - Free (recommended for v1.0)

- [ ] **Permissions justification**
  - Chrome will ask why you need each permission
  - Use justifications from STORE_LISTING.md

- [ ] **Preview listing**
  - Check how it looks
  - Fix any issues

- [ ] **Submit for review**

---

### 16. After Submission

- [ ] **Wait for review** (typically 1-3 business days)

- [ ] **Monitor email** for review status

- [ ] **If rejected:**
  - Read rejection reason carefully
  - Fix issues
  - Resubmit

- [ ] **If approved:**
  - Extension goes live
  - Share the Chrome Web Store link
  - Monitor user reviews

---

## 🚨 COMMON REJECTION REASONS (Avoid These)

### Things Chrome Will Reject For:

1. ❌ **No privacy policy URL** - MUST have public URL
2. ❌ **Misleading permissions** - Must justify all permissions
3. ❌ **Broken functionality** - Must work as described
4. ❌ **Inline scripts** - All JS must be in files (you're good ✅)
5. ❌ **Remote code execution** - No eval(), no remote scripts
6. ❌ **Cryptocurrency mining** - Obviously not applicable
7. ❌ **Spam/malware** - Make sure extension is clean
8. ❌ **Deceptive behavior** - Must be transparent
9. ❌ **Unclear functionality** - Must clearly state what it does
10. ❌ **Poor quality screenshots** - Must show actual functionality

---

## 📋 QUICK ACTION LIST (Do These First)

**Priority 1 - Must Do:**
1. ✅ Remove all emojis (DONE)
2. ✅ Implement persistent scan counter (DONE)
3. ✅ Add settings page (DONE)
4. ⚠️ Create and host privacy policy URL
5. ⚠️ Create promotional images and screenshots
6. ⚠️ Review and remove unnecessary content scripts
7. ⚠️ Test thoroughly on clean Chrome profile

**Priority 2 - Should Do:**
8. ⚠️ Add homepage_url to manifest.json
9. ⚠️ Review console.log statements
10. ⚠️ Create LICENSE file
11. ⚠️ Take quality screenshots

**Priority 3 - Nice to Have:**
12. ⚠️ Minify code
13. ⚠️ Add analytics/error tracking
14. ⚠️ Create promotional tiles

---

## 📞 NEED HELP?

- **Chrome Web Store Policies:** https://developer.chrome.com/docs/webstore/program-policies/
- **Publishing Tutorial:** https://developer.chrome.com/docs/webstore/publish/
- **Best Practices:** https://developer.chrome.com/docs/webstore/best_practices/

---

## ✅ FINAL CHECKLIST

Before clicking "Submit for Review":

- [ ] Extension works perfectly in testing
- [ ] All required images uploaded
- [ ] Privacy policy URL is live and accessible
- [ ] Description accurately describes functionality
- [ ] All permissions justified
- [ ] No console errors or warnings
- [ ] Screenshots show real functionality
- [ ] Support/homepage URLs work
- [ ] Zip file contains only necessary files
- [ ] Tested on fresh Chrome profile

**Ready to submit? Good luck! 🚀**
