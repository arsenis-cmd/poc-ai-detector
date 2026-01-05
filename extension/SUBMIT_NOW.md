# Submit Your Extension to Chrome Web Store - Quick Guide

**Time needed:** 2-4 hours (first time), 30 minutes (if you've done it before)

---

## ⚡ FASTEST PATH TO SUBMISSION (Do These 7 Things)

### 1. Host Privacy Policy (15 minutes)

**Easiest method - GitHub Pages:**

```bash
# Create new repo or use existing
cd /path/to/your/repo

# Copy privacy policy
cp extension/PRIVACY.md docs/index.md

# Push to GitHub
git add docs/
git commit -m "Add privacy policy"
git push

# Enable GitHub Pages:
# Go to: github.com/YOUR_USERNAME/YOUR_REPO/settings/pages
# Source: Deploy from branch → main → /docs
# Wait 2 minutes
# Your URL: https://YOUR_USERNAME.github.io/YOUR_REPO/
```

**Alternative - Google Sites:**
1. Go to sites.google.com
2. Create new site
3. Copy/paste PRIVACY.md content
4. Publish
5. Copy the URL

✅ **Save this URL - you'll need it for Chrome Web Store**

---

### 2. Create Promotional Images (30-45 minutes)

**Required: Small Tile (440×280)**

Use Canva (easiest):
1. Go to canva.com (free account)
2. Create custom size: 440 × 280
3. Add:
   - Purple gradient background (#0f0c29 to #302b63)
   - Your icon
   - Text: "PoC AI Content Detector"
   - Subtitle: "Detect AI Content Instantly"
4. Download as PNG

See `CREATING_IMAGES_GUIDE.md` for detailed instructions.

---

### 3. Take Screenshots (20 minutes)

**Need 1-5 screenshots (1280×800 or 640×400 pixels)**

Minimum required (3 screenshots):

1. **Extension popup showing statistics**
   - Click extension icon
   - Screenshot the popup
   - Resize to 1280×800

2. **Settings page**
   - Right-click extension → Options
   - Screenshot settings page
   - Resize to 1280×800

3. **Live detection on a webpage**
   - Visit Twitter or a news site
   - Wait for detection
   - Screenshot showing highlights/badges
   - Resize to 1280×800

Save in: `extension/store-assets/screenshots/`

---

### 4. Update manifest.json (2 minutes)

Add your homepage URL:

```bash
cd extension
# Edit manifest.json
```

Add after line 6:
```json
"homepage_url": "https://github.com/YOUR_USERNAME/YOUR_REPO",
```

---

### 5. Run Preparation Script (2 minutes)

```bash
cd extension
./PREPARE_SUBMISSION.sh
```

This creates:
- `extension-submission/` folder with clean files
- `poc-ai-detector-v1.0.0.zip` ready to upload

✅ **Test the zip file:**
```bash
# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable Developer Mode
# 3. Click "Load unpacked"
# 4. Select extension-submission folder
# 5. Test all features
```

---

### 6. Create Chrome Web Store Account (10 minutes)

1. Go to: https://chrome.google.com/webstore/devconsole
2. Sign in with Google account
3. Pay $5 one-time registration fee
4. Complete developer profile

---

### 7. Upload to Chrome Web Store (30 minutes)

**In Chrome Web Store Developer Console:**

1. **Click "New Item"**

2. **Upload `poc-ai-detector-v1.0.0.zip`**

3. **Fill out listing:**

   **Store listing:**
   - Language: English
   - Name: `PoC AI Content Detector`
   - Summary: (copy from STORE_LISTING.md, 132 chars max)
   - Description: (copy detailed description from STORE_LISTING.md)
   - Category: Productivity
   - Language: English

   **Icon:**
   - Upload `icons/icon128.png`

   **Screenshots:**
   - Upload your 3-5 screenshots

   **Promotional images:**
   - Small tile: Upload your 440×280 image

   **Privacy:**
   - Privacy policy URL: `https://YOUR_USERNAME.github.io/YOUR_REPO/`

   **Websites:**
   - Homepage: Your GitHub repo URL
   - Support: Your GitHub issues URL or email

4. **Permissions justification:**

   When asked why you need permissions:

   ```
   activeTab: Required to read webpage content for AI detection analysis

   storage: Required to save user settings (API URL) and statistics locally

   scripting: Required to inject content detection scripts into webpages

   <all_urls>: Required to enable AI detection on any website the user visits
   ```

5. **Distribution:**
   - Visibility: Public (or Unlisted for testing)
   - Regions: All regions
   - Pricing: Free

6. **Review & Submit:**
   - Preview your listing
   - Click "Submit for review"

---

## ⏱️ After Submission

**Review time:** 1-3 business days (usually)

**What happens:**
1. Google reviews your extension (automated + manual)
2. You'll get email when review is complete
3. If approved → Goes live immediately
4. If rejected → Fix issues and resubmit

**Common reasons for rejection:**
- Missing privacy policy URL ❌
- Broken functionality ❌
- Misleading permissions ❌
- Poor quality screenshots ❌

(You should be fine if you followed all steps above ✅)

---

## 📋 Pre-Submission Checklist

Before clicking "Submit for review", verify:

- [ ] Extension works in testing (load unpacked and test)
- [ ] Privacy policy is live at public URL
- [ ] Small tile image (440×280) uploaded
- [ ] 1-5 screenshots uploaded
- [ ] manifest.json has homepage_url
- [ ] All permissions are justified
- [ ] Description is clear and accurate
- [ ] No console errors when testing
- [ ] Zip file uploaded successfully

---

## 🚨 CRITICAL: Test Before Submitting

**Do this in a clean Chrome profile:**

```bash
# 1. Create new Chrome profile
# Settings → Add person → Create

# 2. Load extension
chrome://extensions/
→ Enable Developer Mode
→ Load unpacked
→ Select extension-submission folder

# 3. Configure API
→ Click extension icon
→ Click Settings
→ Enter API URL: http://localhost:8000/api/v1
→ Test connection (make sure backend is running!)
→ Save

# 4. Test features
→ Visit Twitter/X → Wait for scans
→ Visit a news article → Check highlights
→ Click extension icon → Verify stats update
→ Check console for errors (F12)

# 5. If everything works → You're ready to submit!
```

---

## 💰 Costs

- **Chrome Web Store registration:** $5 (one-time)
- **Hosting privacy policy:** $0 (using GitHub Pages)
- **Creating images:** $0 (using free tools)

**Total: $5**

---

## 📞 Need Help?

**During submission:**
- Chrome Web Store Docs: https://developer.chrome.com/docs/webstore/
- Publishing Guide: https://developer.chrome.com/docs/webstore/publish/

**After submission:**
- Check email for review status
- Track status in Developer Console
- Fix issues if rejected (they'll tell you what's wrong)

---

## ✅ You're Ready!

You have:
- ✅ Extension code ready (emojis removed, persistent stats added)
- ✅ Settings page for API configuration
- ✅ Privacy policy written (just need to host it)
- ✅ Preparation script ready
- ✅ Documentation for creating images
- ✅ Submission checklist

**Time to submit:** 2-4 hours total

**GO! 🚀**

---

## After Your Extension is Live

**Share it:**
- Tweet about it
- Post on Reddit (r/chrome_extensions, r/ChatGPT)
- Share on Hacker News
- Add to your portfolio

**Monitor:**
- User reviews
- Support requests
- Usage statistics (via your backend)

**Iterate:**
- Fix bugs users report
- Add requested features
- Release updates (same process, but faster)

**Good luck! You've got this! 🎉**
