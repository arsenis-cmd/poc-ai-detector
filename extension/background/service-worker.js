let API_URL = 'http://localhost:8000/api/v1';

// Load API URL from storage
chrome.storage.local.get(['apiUrl'], (result) => {
  if (result.apiUrl) {
    API_URL = result.apiUrl;
  }
});

let globalStats = { totalScans: 0, aiDetected: 0, humanDetected: 0 };

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_STATS') {
    globalStats.totalScans += message.stats.total || 0;
    globalStats.aiDetected += message.stats.ai || 0;
    globalStats.humanDetected += message.stats.human || 0;
    updateBadge(sender.tab.id, message.stats);
  }

  if (message.type === 'GET_STATS') {
    sendResponse(globalStats);
  }
});

function updateBadge(tabId, stats) {
  const total = stats.total || 0;
  const ai = stats.ai || 0;
  if (total === 0) {
    chrome.action.setBadgeText({ text: '', tabId });
    return;
  }
  const aiPct = Math.round((ai / total) * 100);
  chrome.action.setBadgeText({ text: `${aiPct}%`, tabId });
  chrome.action.setBadgeBackgroundColor({ color: aiPct > 50 ? '#ef4444' : '#10b981', tabId });
}
