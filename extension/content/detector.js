(function() {
  'use strict';

  const CONFIG = {
    DEFAULT_API_URL: 'http://localhost:8000/api/v1',
    MIN_TEXT_LENGTH: 20,
    MAX_BATCH_SIZE: 30,
    SCAN_DELAY: 1000
  };

  let API_URL = CONFIG.DEFAULT_API_URL;

  // Load API URL from storage
  chrome.storage.local.get(['apiUrl'], (result) => {
    if (result.apiUrl) {
      API_URL = result.apiUrl;
    }
  });

  const state = {
    scannedElements: new WeakSet(),
    results: new Map(),
    isScanning: false,
    stats: { total: 0, ai: 0, human: 0, mixed: 0, bot: 0 }
  };

  function debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  function getTextContent(el) {
    let text = '';
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) text += node.textContent;
    }
    return text.trim() || el.textContent?.trim() || '';
  }

  function detectPlatform() {
    const host = window.location.hostname;
    if (host.includes('twitter.com') || host.includes('x.com')) return 'twitter';
    if (host.includes('reddit.com')) return 'reddit';
    if (host.includes('linkedin.com')) return 'linkedin';
    return 'web';
  }

  function findContentElements() {
    const elements = [];
    const platform = detectPlatform();

    const selectors = {
      twitter: ['[data-testid="tweetText"]'],
      reddit: ['.Comment__body', '[data-testid="comment"]'],
      web: ['article p', 'main p', '.post-content p', 'p']
    };

    for (const selector of (selectors[platform] || selectors.web)) {
      try {
        document.querySelectorAll(selector).forEach(el => {
          if (!state.scannedElements.has(el)) {
            const text = getTextContent(el);
            if (text.length >= CONFIG.MIN_TEXT_LENGTH) {
              elements.push({ element: el, text, platform });
            }
          }
        });
      } catch (e) {}
    }
    return elements;
  }

  async function detectBatch(items) {
    try {
      const res = await fetch(`${API_URL}/detect/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            content: item.text.substring(0, 2000),
            content_type: 'text',
            source_url: window.location.href,
            source_platform: item.platform
          }))
        })
      });
      return res.ok ? await res.json() : null;
    } catch (e) {
      console.error('PoC API error:', e);
      return null;
    }
  }

  async function updateStats(result) {
    state.stats.total++;

    if (result.classification.includes('AI')) state.stats.ai++;
    else if (result.classification.includes('HUMAN')) state.stats.human++;
    else state.stats.mixed++;

    // Update chrome storage for popup
    try {
      const storage = await chrome.storage.local.get(['globalStats', 'userStats', 'totalScans']);

      const globalStats = storage.globalStats || { total: 0, bots: 0 };
      globalStats.total++;
      if (result.classification.includes('AI')) globalStats.bots++;

      const userStats = storage.userStats || { scanned: 0, bots: 0, exposed: 0 };
      userStats.scanned++;
      if (result.classification.includes('AI')) userStats.bots++;

      // Increment lifetime scan counter
      const totalScans = (storage.totalScans || 0) + 1;

      await chrome.storage.local.set({ globalStats, userStats, totalScans });

      // Notify popup if open
      chrome.runtime.sendMessage({ type: 'STATS_UPDATED' }).catch(() => {});
    } catch (e) {
      // Ignore storage errors
    }
  }

  function applyResults(items, results) {
    if (!results?.results) return;

    for (let i = 0; i < items.length && i < results.results.length; i++) {
      const item = items[i];
      const result = results.results[i];
      if (!result.success) continue;

      state.scannedElements.add(item.element);
      updateStats(result);

      window.pocHighlighter?.highlightElement(item.element, result);
    }
  }

  async function scanPage() {
    if (state.isScanning) return;
    state.isScanning = true;
    window.pocHighlighter?.updateBadge({ scanning: true, stats: state.stats });

    try {
      const elements = findContentElements();
      if (elements.length === 0) {
        state.isScanning = false;
        window.pocHighlighter?.updateBadge({ scanning: false, stats: state.stats });
        return;
      }

      for (let i = 0; i < elements.length; i += CONFIG.MAX_BATCH_SIZE) {
        const batch = elements.slice(i, i + CONFIG.MAX_BATCH_SIZE);
        const results = await detectBatch(batch);
        if (results) {
          applyResults(batch, results);
          window.pocHighlighter?.updateBadge({ scanning: true, stats: state.stats });
        }
        if (i + CONFIG.MAX_BATCH_SIZE < elements.length) {
          await new Promise(r => setTimeout(r, 200));
        }
      }
    } catch (e) {
      console.error('PoC scan error:', e);
    }

    state.isScanning = false;
    window.pocHighlighter?.updateBadge({ scanning: false, stats: state.stats });
  }

  function observeContent() {
    new MutationObserver(debounce(() => !state.isScanning && scanPage(), 500))
      .observe(document.body, { childList: true, subtree: true });
  }

  // Message listener for popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_STATS') {
      sendResponse(state.stats);
      return true;
    }
    if (message.type === 'SCAN_PAGE') {
      scanPage();
      sendResponse({ success: true });
      return true;
    }
  });

  window.pocDetector = { scan: scanPage, getStats: () => state.stats };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(scanPage, CONFIG.SCAN_DELAY));
  } else {
    setTimeout(scanPage, CONFIG.SCAN_DELAY);
  }

  observeContent();
})();
