(function() {
  'use strict';

  const CONFIG = {
    DEFAULT_API_URL: 'http://localhost:8000/api/v1',
    SCAN_INTERVAL: 2000
  };

  let API_URL = CONFIG.DEFAULT_API_URL;

  // Load API URL from storage
  chrome.storage.local.get(['apiUrl'], (result) => {
    if (result.apiUrl) {
      API_URL = result.apiUrl;
    }
  });

  function isTwitter() {
    return window.location.hostname.includes('twitter.com') ||
           window.location.hostname.includes('x.com');
  }

  if (!isTwitter()) return;

  const scannedTweets = new Set();

  function extractTweetData(tweetEl) {
    try {
      const textEl = tweetEl.querySelector('[data-testid="tweetText"]');
      const text = textEl?.textContent || '';
      if (text.length < 10) return null;

      const userEl = tweetEl.querySelector('[data-testid="User-Name"]');
      const usernameLink = userEl?.querySelector('a[href^="/"]');
      const username = usernameLink?.href?.split('/').pop() || '';

      const tweetLink = tweetEl.querySelector('a[href*="/status/"]');
      const tweetId = tweetLink?.href?.match(/status\/(\d+)/)?.[1] || '';

      const uniqueId = `${username}:${tweetId || text.substring(0, 50)}`;
      if (scannedTweets.has(uniqueId)) return null;
      scannedTweets.add(uniqueId);

      return { text, username, tweet_id: tweetId, element: tweetEl };
    } catch (e) { return null; }
  }

  function findTweets() {
    const tweets = [];
    document.querySelectorAll('[data-testid="tweet"]').forEach(el => {
      const data = extractTweetData(el);
      if (data) tweets.push(data);
    });
    return tweets;
  }

  async function detectTweets(tweets) {
    if (tweets.length === 0) return;

    try {
      const res = await fetch(`${API_URL}/detect/tweets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tweets: tweets.map(t => ({ text: t.text, username: t.username, tweet_id: t.tweet_id })),
          source_url: window.location.href
        })
      });

      if (!res.ok) return;
      const data = await res.json();

      if (data.success && data.results) {
        for (let i = 0; i < tweets.length && i < data.results.length; i++) {
          applyTweetResult(tweets[i], data.results[i]);
        }

        if (data.summary && data.results.length > 5) {
          window.pocHighlighter?.updateBadge({
            scanning: false,
            stats: {
              total: data.summary.total,
              ai: data.summary.ai_count + data.summary.bot_count,
              human: data.summary.total - data.summary.ai_count - data.summary.bot_count,
              mixed: 0
            }
          });
        }
      }
    } catch (e) { console.error('PoC tweet error:', e); }
  }

  function applyTweetResult(tweet, result) {
    const el = tweet.element;
    let type = 'human';
    if (result.is_bot_likely) type = 'bot';
    else if (result.classification.includes('AI')) type = 'ai';

    const textEl = el.querySelector('[data-testid="tweetText"]');
    if (textEl && !textEl.querySelector('.poc-tweet-badge')) {
      const badge = document.createElement('div');
      badge.className = `poc-tweet-badge ${type}`;
      badge.innerHTML = type === 'human'
        ? 'Likely Human'
        : `${Math.round(result.ai_probability * 100)}% AI`;
      textEl.parentElement.appendChild(badge);
    }

    el.style.borderLeft = type === 'human' ? '3px solid #10b981' : '3px solid #ef4444';
  }

  function scanTwitter() {
    const tweets = findTweets();
    if (tweets.length > 0) detectTweets(tweets);
  }

  setTimeout(scanTwitter, 2000);
  setInterval(scanTwitter, CONFIG.SCAN_INTERVAL);

  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(scanTwitter, 500);
  });
})();
