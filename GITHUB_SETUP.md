# Push to GitHub & Enable GitHub Pages

Follow these steps to push your code to GitHub and enable the privacy policy website.

---

## Step 1: Create GitHub Repository

1. **Go to GitHub**: https://github.com/new

2. **Create new repository:**
   - Repository name: `poc-ai-detector` (or your preferred name)
   - Description: `AI content detector Chrome extension`
   - Visibility: **Public** (required for GitHub Pages)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

3. **Click "Create repository"**

---

## Step 2: Push Your Code

Copy and run these commands in your terminal:

```bash
# Navigate to project
cd /Users/arsenispapachristos/Desktop/SDK_PoC/poc-mvp

# Add GitHub as remote (REPLACE 'yourusername' with your GitHub username!)
git remote add origin https://github.com/yourusername/poc-ai-detector.git

# Push code to GitHub
git branch -M main
git push -u origin main
```

**Replace `yourusername` with your actual GitHub username!**

Example: If your username is `john`, use:
```bash
git remote add origin https://github.com/john/poc-ai-detector.git
```

---

## Step 3: Enable GitHub Pages

1. **Go to your repository on GitHub**:
   `https://github.com/yourusername/poc-ai-detector`

2. **Click "Settings"** (top menu)

3. **Click "Pages"** (left sidebar)

4. **Under "Source":**
   - Branch: Select `main`
   - Folder: Select `/docs`
   - Click **Save**

5. **Wait 1-2 minutes** for deployment

6. **Your privacy policy will be live at:**
   ```
   https://yourusername.github.io/poc-ai-detector/
   ```

---

## Step 4: Update Links

Now that you know your GitHub Pages URL, update these files:

### 1. Update `docs/index.html`

Replace all instances of `yourusername` with your actual username:
- Lines with `https://github.com/yourusername/poc-ai-detector`
- Email: `support@example.com` (change to your email)

### 2. Update `README.md`

Replace:
- `yourusername` with your GitHub username
- Privacy policy links

### 3. Update `extension/manifest.json`

Add your GitHub repo URL:
```json
{
  "homepage_url": "https://github.com/yourusername/poc-ai-detector"
}
```

---

## Step 5: Test Your Website

1. **Visit**: `https://yourusername.github.io/poc-ai-detector/`

2. **Verify:**
   - Privacy policy loads correctly
   - All sections are visible
   - Links work
   - Looks professional

3. **Copy this URL** - you'll need it for Chrome Web Store!

---

## Step 6: Update and Push Changes

After updating the files:

```bash
cd /Users/arsenispapachristos/Desktop/SDK_PoC/poc-mvp

git add .
git commit -m "Update links with actual GitHub username"
git push
```

---

## Your Privacy Policy URL

**Use this in Chrome Web Store submission:**
```
https://yourusername.github.io/poc-ai-detector/
```

Replace `yourusername` with your actual GitHub username!

---

## Troubleshooting

### "Permission denied" when pushing

**Solution**: Set up SSH key or use Personal Access Token

**Quick fix** - Use HTTPS with token:
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Select `repo` scope
4. Copy token
5. When pushing, use token as password

### GitHub Pages not working

**Check:**
1. Repository is public
2. Source is set to `main` branch, `/docs` folder
3. Wait 2-3 minutes after enabling
4. Check https://github.com/yourusername/poc-ai-detector/settings/pages for status

### 404 Error on GitHub Pages

**Solutions:**
1. Make sure `/docs/index.html` exists in your repo
2. Check branch name is `main` (not `master`)
3. Verify "Source" is set to `/docs` folder
4. Wait a few minutes and hard refresh (Cmd+Shift+R)

---

## Quick Reference

**Your GitHub repo:**
```
https://github.com/yourusername/poc-ai-detector
```

**Your privacy policy:**
```
https://yourusername.github.io/poc-ai-detector/
```

**Chrome Web Store needs:**
- Privacy Policy URL ← Use GitHub Pages URL
- Homepage URL ← Use GitHub repo URL
- Support URL ← Use GitHub Issues URL

---

## Next Steps

After GitHub setup is complete:

1. ✅ Copy your GitHub Pages URL
2. ✅ Use it in Chrome Web Store submission
3. ✅ Continue with extension submission (see `extension/SUBMIT_NOW.md`)

**You're ready to submit to Chrome Web Store!** 🚀
