# Creating Images for Chrome Web Store

You need to create promotional images and screenshots before submitting.

---

## 🎨 Required Images

### 1. Small Promotional Tile (REQUIRED)
- **Size:** 440 × 280 pixels
- **Format:** PNG or JPEG
- **What to show:**
  - Extension name/logo
  - Key benefit (e.g., "Detect AI Content Instantly")
  - Clean, professional design
  - Use your brand colors (purple gradient from popup)

### 2. Screenshots (1-5 required, 5 recommended)
- **Size:** 1280 × 800 pixels OR 640 × 400 pixels
- **Format:** PNG or JPEG
- **What to capture:**

**Screenshot 1: Extension Popup**
```
Show the popup with:
- Statistics filled in
- Lifetime total scans visible
- Professional, clean interface
```

**Screenshot 2: Settings Page**
```
Show the settings/options page with:
- API URL configuration
- Test connection button
- Clean, modern design
```

**Screenshot 3: Twitter/X Detection**
```
Show Twitter with:
- Multiple tweets highlighted
- AI badges visible
- Clear red/green distinction
```

**Screenshot 4: Web Page Scanning**
```
Show a regular webpage with:
- Content highlighted
- Floating badge visible
- Scanning in action
```

**Screenshot 5: Statistics Dashboard**
```
Show the popup with detailed stats:
- Platform breakdown
- AI vs Human percentages
- Session activity
```

### 3. Optional (but recommended)

**Large Promotional Tile**
- **Size:** 920 × 680 pixels
- Same style as small tile but larger

**Marquee**
- **Size:** 1400 × 560 pixels
- Wide banner for featured placement

---

## 🛠️ Tools for Creating Images

### Option 1: Screenshot + Edit

**For Screenshots:**
1. Use your extension on real websites
2. Take screenshots (Cmd+Shift+4 on Mac, Win+Shift+S on Windows)
3. Resize to exact dimensions using:
   - **Preview (Mac):** Tools → Adjust Size
   - **GIMP (Free, All platforms):** Image → Scale Image
   - **Photoshop:** Image → Image Size

**For Promotional Tiles:**
1. Use design tools:
   - **Figma** (free, web-based) - Recommended
   - **Canva** (free templates)
   - **Photoshop**
   - **GIMP** (free)

### Option 2: Figma Template (Easiest)

1. Go to Figma.com (free account)
2. Create new design file
3. Set canvas size to 440×280
4. Add:
   - Background gradient (purple like your extension)
   - Extension icon
   - Text: "PoC AI Content Detector"
   - Tagline: "Detect AI Content Instantly"
5. Export as PNG

---

## 📸 Taking Great Screenshots

### Preparation:

1. **Load the extension** in a clean Chrome profile
2. **Generate some test data:**
   ```bash
   # Run backend first
   cd backend
   uvicorn app.main:app --port 8000
   ```
3. **Visit test websites:**
   - Twitter/X for tweet detection
   - A news article for web detection
   - Reddit for comment detection

4. **Make statistics look good:**
   - Scan several pages to get interesting numbers
   - Make sure counters show data (not all zeros)

### Taking the Screenshot:

**On Mac:**
```bash
# Capture selected area
Cmd + Shift + 4
# Then drag to select area

# Capture specific window
Cmd + Shift + 4, then press Space, then click window
```

**On Windows:**
```bash
# Snipping tool
Win + Shift + S

# Or use Snip & Sketch app
```

**On Linux:**
```bash
# GNOME Screenshot
gnome-screenshot -a
```

### Tips for Great Screenshots:

✅ **DO:**
- Use high resolution (1280×800 or higher, then scale down)
- Show real functionality, not mockups
- Use clean, uncluttered webpages
- Make sure text is readable
- Show your extension actually working
- Use good lighting/contrast

❌ **DON'T:**
- Include personal information
- Show broken/error states
- Use lorem ipsum or fake data (use real AI detection results)
- Make screenshots blurry
- Include browser's bookmark bar if messy
- Show NSFW content

---

## 🎯 Quick Guide: Screenshot Each Feature

### Screenshot 1: Extension Popup

**Setup:**
1. Scan a few pages to get statistics
2. Click extension icon
3. Wait for stats to load

**Capture:**
- Take screenshot of just the popup
- Make sure it shows:
  - Total scans number (not zero)
  - Session activity
  - Clean interface

**Edit:**
- Crop to popup only
- Add subtle shadow/border if needed
- Resize to 1280×800 (with whitespace around popup)

---

### Screenshot 2: Settings Page

**Setup:**
1. Right-click extension icon → Options
2. Fill in API URL
3. Make sure it looks clean

**Capture:**
- Full settings page
- Show the form filled in
- Test connection status

**Edit:**
- Center the settings page
- Add subtle background
- Resize to 1280×800

---

### Screenshot 3: Live Detection on Twitter

**Setup:**
1. Go to Twitter/X
2. Wait for extension to scan tweets
3. Find a feed with multiple tweets (some with AI badges)

**Capture:**
- Show multiple tweets
- Make sure AI badges are visible
- Show color-coded highlights

**Edit:**
- Blur any usernames if needed
- Highlight the extension's badges (add arrows if helpful)
- Resize to 1280×800

---

### Screenshot 4: Web Page Detection

**Setup:**
1. Visit a news article or blog
2. Wait for extension to scan
3. Look for highlighted text

**Capture:**
- Show webpage with highlights
- Include floating badge if visible
- Show multiple highlighted sections

**Edit:**
- Add annotation arrows pointing to highlights
- Add text: "AI-generated content highlighted in red"
- Resize to 1280×800

---

### Screenshot 5: Statistics Detail

**Setup:**
1. After scanning many pages
2. Open extension popup
3. Show detailed statistics

**Capture:**
- Focus on statistics
- Show platform breakdown
- Show session vs lifetime stats

---

## 🎨 Creating Promotional Tile (440×280)

### Using Figma (Free):

1. **Create new file:**
   - Go to figma.com
   - New design file
   - Press F to create frame
   - Set size: 440 × 280

2. **Design elements:**
   ```
   Background:
   - Gradient: #0f0c29 → #302b63 (from your popup)

   Logo:
   - Your icon from icons/icon128.png
   - Place in left or center

   Text:
   - Title: "PoC AI Content Detector"
   - Font: Bold, white
   - Size: 32-40px

   Tagline:
   - "Detect AI-Generated Content Instantly"
   - Font: Regular, white 60% opacity
   - Size: 18-24px

   Visual:
   - Maybe add a checkmark icon
   - Or a simple graphic showing AI detection
   ```

3. **Export:**
   - Select frame
   - Export settings → PNG
   - 2x resolution (880×560) then scale down
   - Download

### Template Layout:
```
┌─────────────────────────────────────────┐
│                                         │
│   [Icon]    PoC AI Content Detector    │
│                                         │
│             Detect AI-Generated         │
│             Content Instantly           │
│                                         │
│             ✓ Real-time Detection       │
│             ✓ Multi-Platform Support   │
│                                         │
└─────────────────────────────────────────┘
      440px wide × 280px tall
```

---

## 💾 Saving Your Images

Create a folder structure:

```
extension/
  store-assets/
    screenshots/
      screenshot-1-popup.png
      screenshot-2-settings.png
      screenshot-3-twitter.png
      screenshot-4-webpage.png
      screenshot-5-stats.png
    promotional/
      small-tile-440x280.png
      large-tile-920x680.png (optional)
      marquee-1400x560.png (optional)
```

---

## ✅ Image Checklist

Before uploading to Chrome Web Store:

- [ ] Small tile is exactly 440×280 pixels
- [ ] Screenshots are 1280×800 or 640×400 pixels
- [ ] All images are PNG or JPEG
- [ ] File sizes are reasonable (< 1MB each)
- [ ] Images show actual functionality
- [ ] No personal/sensitive information visible
- [ ] Text in images is readable
- [ ] Images look professional
- [ ] Screenshots show extension working correctly

---

## 🚀 Quick Start (5 Minutes)

If you're in a hurry:

1. **Take 3 screenshots:**
   - Extension popup with stats
   - Twitter feed with detections
   - Settings page

2. **Create simple tile in Canva:**
   - Use 440×280 template
   - Purple gradient background
   - Add title and icon
   - Export PNG

3. **Resize all images** using Preview/Paint:
   - Screenshots to 1280×800
   - Tile to exactly 440×280

4. **Upload to Chrome Web Store**

Done! 🎉

---

## Need Help?

- **Figma tutorials:** youtube.com/results?search_query=figma+tutorial
- **GIMP tutorials:** youtube.com/results?search_query=gimp+resize+image
- **Chrome Web Store image requirements:** https://developer.chrome.com/docs/webstore/images/

Good luck! Your extension will look great! 🎨
