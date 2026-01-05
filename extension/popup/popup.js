const DEFAULT_API = 'http://localhost:8000/api/v1';
let API = DEFAULT_API;

// Load API URL from storage
chrome.storage.local.get(['apiUrl'], (result) => {
  if (result.apiUrl) {
    API = result.apiUrl;
  }
});

// Mock leaderboard data (replace with API call later)
const MOCK_LEADERBOARD = [
  { username: 'ai_spam_bot_2024', botPercent: 94, scanned: 847 },
  { username: 'crypto_shill_x', botPercent: 89, scanned: 623 },
  { username: 'engagement_farmer', botPercent: 87, scanned: 512 },
  { username: 'reply_guy_bot', botPercent: 82, scanned: 391 },
  { username: 'content_stealer', botPercent: 78, scanned: 284 }
];

document.addEventListener('DOMContentLoaded', async () => {
  // Load global stats
  loadGlobalStats();

  // Load user stats
  loadUserStats();

  // Load leaderboard
  loadLeaderboard();

  // Set up button handlers
  setupButtons();

  // Listen for updates from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'STATS_UPDATED') {
      loadGlobalStats();
      loadUserStats();
    }
  });
});

async function loadGlobalStats() {
  try {
    // Get stats from storage
    const result = await chrome.storage.local.get(['globalStats']);
    const stats = result.globalStats || { total: 0, bots: 0 };

    // Animate update
    const totalEl = document.getElementById('total-scanned');
    const botPercentEl = document.getElementById('bot-percent');

    totalEl.textContent = formatNumber(stats.total);
    totalEl.classList.add('animate');
    setTimeout(() => totalEl.classList.remove('animate'), 500);

    const botPercent = stats.total > 0 ? Math.round((stats.bots / stats.total) * 100) : 0;
    botPercentEl.textContent = `${botPercent}%`;
    botPercentEl.classList.add('animate');
    setTimeout(() => botPercentEl.classList.remove('animate'), 500);
  } catch (error) {
    console.error('Error loading global stats:', error);
  }
}

async function loadUserStats() {
  try {
    const result = await chrome.storage.local.get(['userStats', 'totalScans']);
    const stats = result.userStats || { scanned: 0, bots: 0, exposed: 0 };
    const totalScans = result.totalScans || 0;

    document.getElementById('user-scanned').textContent = stats.scanned;
    document.getElementById('user-bots').textContent = stats.bots;
    document.getElementById('user-exposed').textContent = stats.exposed;
    document.getElementById('total-scans').textContent = formatNumber(totalScans);
  } catch (error) {
    console.error('Error loading user stats:', error);
  }
}

async function loadLeaderboard() {
  const leaderboardEl = document.getElementById('leaderboard');

  try {
    // Try to fetch from API first
    // const response = await fetch(`${API}/leaderboard`);
    // const data = await response.json();
    // const leaderboard = data.top_bots;

    // For now, use mock data
    const leaderboard = MOCK_LEADERBOARD;

    if (leaderboard.length === 0) {
      leaderboardEl.innerHTML = '<li class="empty-state">No bots exposed yet today</li>';
      return;
    }

    leaderboardEl.innerHTML = leaderboard.map((bot, index) => `
      <li class="leaderboard-item" data-username="${bot.username}">
        <div class="leaderboard-rank ${index === 0 ? 'top' : ''}">#${index + 1}</div>
        <div class="leaderboard-info">
          <div class="leaderboard-username">@${bot.username}</div>
          <div class="leaderboard-meta">${formatNumber(bot.scanned)} analyzed</div>
        </div>
        <div class="leaderboard-score">${bot.botPercent}%</div>
      </li>
    `).join('');

    // Add click handlers to open Twitter profiles
    document.querySelectorAll('.leaderboard-item').forEach(item => {
      item.addEventListener('click', () => {
        const username = item.dataset.username;
        chrome.tabs.create({ url: `https://twitter.com/${username}` });
      });
    });
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    leaderboardEl.innerHTML = '<li class="empty-state">Failed to load leaderboard</li>';
  }
}

function setupButtons() {
  document.getElementById('scan-btn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'SCAN_PAGE' });
    } catch (error) {
      // If content script not loaded, inject it
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/detector.js', 'content/highlighter.js', 'content/twitter.js', 'content/account-analyzer.js']
        });

        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content/styles.css']
        });

        // Wait a bit for scripts to initialize
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, { type: 'SCAN_PAGE' });
        }, 500);
      } catch (injectError) {
        console.error('Error injecting content scripts:', injectError);
      }
    }
  });

  document.getElementById('settings-btn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Update stats periodically
setInterval(() => {
  loadGlobalStats();
  loadUserStats();
}, 5000);
