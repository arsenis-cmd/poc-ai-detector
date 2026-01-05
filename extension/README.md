# PoC AI Content Detector - Chrome Extension

A powerful Chrome extension that detects AI-generated content and bot activity on any webpage in real-time.

## Features

✓ **Real-Time AI Detection** - Automatically scans webpage content as you browse
✓ **Visual Highlighting** - Color-coded indicators (red for AI, green for human)
✓ **Multi-Platform Support** - Enhanced detection for Twitter/X, Reddit, LinkedIn
✓ **Persistent Statistics** - Track your total scans across all sessions
✓ **Configurable Backend** - Connect to your own API server (local or hosted)
✓ **Privacy-Focused** - All data stored locally on your device
✓ **Professional UI** - Clean, polished interface without distractions

## Installation

### For Development/Testing

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `extension` directory
6. The extension icon will appear in your toolbar

### Initial Setup

1. Click the extension icon in your toolbar
2. Click "Settings" button
3. Enter your backend API server URL (default: `http://localhost:8000/api/v1`)
4. Click "Test Connection" to verify it's working
5. Click "Save Settings"

**Running the Backend Locally:**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Usage

### First-Time Setup

After installation, configure your API server:
1. Click the extension icon
2. Click "Settings"
3. Enter your API server URL
4. Test and save

### Automatic Scanning

- Visit any webpage and the extension will automatically scan content
- Red highlights indicate AI-generated content
- Green highlights indicate human-written content
- A floating badge shows real-time scanning progress

### Extension Popup

Click the extension icon to view:
- **Lifetime Total**: Your total AI scans across all sessions
- **Session Activity**: Scans from your current browser session
- **Live Stats**: Global detection statistics
- Manual "Scan This Page" button

### Platform-Specific Features

**Twitter/X:**
- Individual tweet analysis with AI probability
- Bot account detection
- Inline badges showing detection results

**Reddit:**
- Comment analysis
- Post detection
- Thread-level insights

**General Web:**
- Article content detection
- Blog post analysis
- Forum content scanning

## File Structure

```
extension/
├── manifest.json              # Extension configuration
├── background/
│   └── service-worker.js     # Background service worker
├── content/
│   ├── detector.js           # Main content scanning logic
│   ├── highlighter.js        # Visual highlighting of results
│   ├── twitter.js            # Twitter-specific detection
│   └── styles.css            # Styles for highlights and badges
├── popup/
│   ├── popup.html            # Extension popup UI
│   ├── popup.js              # Popup interaction logic
│   └── popup.css             # (inline in popup.html)
└── icons/
    ├── icon16.png            # Extension icon (16x16)
    ├── icon48.png            # Extension icon (48x48)
    └── icon128.png           # Extension icon (128x128)
```

## API Integration

The extension communicates with the backend API:
- `POST /api/v1/detect` - Single content detection
- `POST /api/v1/detect/batch` - Batch detection for multiple elements
- `POST /api/v1/detect/tweets` - Twitter-specific detection

## Configuration

### API Server Setup

The extension requires a backend server for AI detection. You have two options:

**Option 1: Run Locally**
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```
Then configure the extension to use: `http://localhost:8000/api/v1`

**Option 2: Use Hosted Server**

Deploy the backend to your preferred hosting service and configure the extension with your hosted URL.

### Settings Page

Access via extension popup → Settings button:
- **API Server URL**: Your backend endpoint
- **Test Connection**: Verify server is responding
- All settings saved locally to your browser

## Troubleshooting

**Extension not scanning:**
1. Open Settings and test your API connection
2. Verify the backend server is running
3. Check browser console for errors (F12 → Console)
4. Try manually clicking "Scan This Page"

**Connection failed:**
- Ensure your API server URL is correct
- Verify the server is running and accessible
- Check for CORS issues (backend should allow extension origin)

**No highlights appearing:**
- Page must have sufficient text content (minimum 20 characters)
- Wait a few seconds for scanning to complete
- Some websites may have dynamic content that loads later

**Statistics not updating:**
- Scans are stored in browser local storage
- Clearing browser data will reset statistics
- Total scans persist across browser restarts

## Development

To modify the extension:
1. Make changes to the files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the PoC extension card
4. Reload the page you're testing on

## Privacy & Security

- All detection happens via API calls to your local backend
- No data is sent to external servers
- Content is only analyzed, never stored by the extension
