// Twitter/Reddit Account Analyzer
(function() {
  'use strict';

  let API_BASE = 'http://localhost:8000';
  const analyzedProfiles = new Set();

  // Load API URL from storage
  chrome.storage.local.get(['apiUrl'], (result) => {
    if (result.apiUrl) {
      API_BASE = result.apiUrl.replace('/api/v1', '');
    }
  });

  class AccountAnalyzer {
    constructor() {
      this.platform = this.detectPlatform();
      this.currentProfile = null;
      this.scannedTweets = new Set();
      this.totalAnalyzed = 0;
      this.aiCount = 0;
      this.isScanning = false;
    }

    detectPlatform() {
      const hostname = window.location.hostname;
      if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
      if (hostname.includes('reddit.com')) return 'reddit';
      return null;
    }

    init() {
      if (!this.platform) return;

      console.log('[AccountAnalyzer] Initializing for', this.platform);

      if (this.platform === 'twitter') {
        this.watchTwitterProfiles();
      } else if (this.platform === 'reddit') {
        this.watchRedditProfiles();
      }
    }

    watchTwitterProfiles() {
      // Watch for profile views
      const checkProfilePage = () => {
        // Check if on profile page (exclude paths with slashes like /username/status/123)
        const isProfilePage = window.location.pathname.match(/^\/[^\/]+$/) ||
                              window.location.pathname.match(/^\/[^\/]+\/?(with_replies|media|likes)?$/);

        if (isProfilePage) {
          const username = window.location.pathname.split('/')[1];

          if (username && username !== 'home' && username !== 'explore') {
            // Check if this is a new profile
            if (this.currentProfile !== username) {
              console.log('[AccountAnalyzer] New profile detected:', username);
              this.currentProfile = username;
              this.scannedTweets.clear();
              this.totalAnalyzed = 0;
              this.aiCount = 0;

              // Initial scan
              setTimeout(() => this.scanProfileTweets(), 3000);

              // Set up continuous scanning for new tweets
              this.watchForNewTweets();
            }
          }
        } else {
          // Reset when leaving profile
          this.currentProfile = null;
        }
      };

      // Check on navigation
      checkProfilePage();

      // Watch for URL changes (SPA navigation)
      let lastUrl = location.href;
      new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
          lastUrl = url;
          checkProfilePage();
        }
      }).observe(document, { subtree: true, childList: true });
    }

    watchForNewTweets() {
      // Watch for new tweets being added to the timeline
      const observer = new MutationObserver(() => {
        if (!this.isScanning && this.currentProfile) {
          this.scanProfileTweets();
        }
      });

      const timeline = document.querySelector('[data-testid="primaryColumn"]');
      if (timeline) {
        observer.observe(timeline, { childList: true, subtree: true });
      }
    }

    async scanProfileTweets() {
      if (this.isScanning || !this.currentProfile) return;

      this.isScanning = true;

      try {
        // Collect tweets that haven't been scanned yet
        const newTweets = [];
        const tweetElements = document.querySelectorAll('[data-testid="tweet"]');

        for (const tweet of tweetElements) {
          // Create unique ID for tweet
          const tweetId = tweet.querySelector('time')?.getAttribute('datetime') ||
                         tweet.querySelector('[data-testid="tweetText"]')?.innerText.substring(0, 50);

          if (tweetId && !this.scannedTweets.has(tweetId)) {
            const textElement = tweet.querySelector('[data-testid="tweetText"]');
            if (textElement && textElement.innerText) {
              newTweets.push({
                id: tweetId,
                text: textElement.innerText
              });
              this.scannedTweets.add(tweetId);
            }
          }
        }

        if (newTweets.length === 0) {
          console.log('[AccountAnalyzer] No new tweets to scan');
          this.isScanning = false;
          return;
        }

        console.log('[AccountAnalyzer] Scanning', newTweets.length, 'new tweets for', this.currentProfile);

        // Send for AI analysis
        const response = await fetch(`${API_BASE}/api/v1/detect/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: newTweets.map(t => ({
              content: t.text,
              content_type: 'text',
              platform: 'twitter'
            }))
          })
        });

        if (response.ok) {
          const data = await response.json();
          const results = data.results || [];

          // Update counts
          const newAiCount = results.filter(r => r && r.classification && r.classification.includes('AI')).length;
          this.aiCount += newAiCount;
          this.totalAnalyzed += newTweets.length;

          console.log('[AccountAnalyzer] Total analyzed:', this.totalAnalyzed, 'AI:', this.aiCount);

          // Update badge
          this.updateProfileBadge();
        }
      } catch (error) {
        console.error('[AccountAnalyzer] Scan error:', error);
      }

      this.isScanning = false;
    }

    updateProfileBadge() {
      const aiPercentage = this.totalAnalyzed > 0 ? Math.round((this.aiCount / this.totalAnalyzed) * 100) : 0;

      // Find existing badge and update it
      const existingBadge = document.querySelector('.poc-account-badge');
      if (existingBadge) {
        const valueElement = existingBadge.querySelector('.poc-stat-value');
        const labelElement = existingBadge.querySelectorAll('.poc-stat-value')[1];

        if (valueElement) {
          valueElement.textContent = `${aiPercentage}%`;
        }
        if (labelElement) {
          labelElement.textContent = this.totalAnalyzed;
        }

        // Update account type
        let accountType = 'Human';
        let accountClass = 'human';
        let icon = 'H';

        if (aiPercentage > 70) {
          accountType = 'Likely Bot';
          accountClass = 'bot';
          icon = 'B';
        } else if (aiPercentage > 40) {
          accountType = 'AI-Assisted';
          accountClass = 'ai-assisted';
          icon = 'A';
        }

        const typeElement = existingBadge.querySelector('.poc-account-type');
        const iconElement = existingBadge.querySelector('.poc-account-icon');

        if (typeElement) typeElement.textContent = accountType;
        if (iconElement) iconElement.textContent = icon;

        // Update classes
        existingBadge.classList.remove('poc-bot', 'poc-human', 'poc-ai-assisted');
        existingBadge.classList.add(`poc-${accountClass}`);
      } else {
        // Create initial badge
        this.displayTwitterAccountAnalysis(this.currentProfile);
      }
    }

    displayTwitterAccountAnalysis(username) {
      // Use current stats
      const aiPercentage = this.totalAnalyzed > 0 ? Math.round((this.aiCount / this.totalAnalyzed) * 100) : 0;

      // Determine account type
      let accountType = 'Human';
      let accountClass = 'human';
      let icon = 'H';

      if (aiPercentage > 70) {
        accountType = 'Likely Bot';
        accountClass = 'bot';
        icon = 'B';
      } else if (aiPercentage > 40) {
        accountType = 'AI-Assisted';
        accountClass = 'ai-assisted';
        icon = 'A';
      }

      // Check posting frequency (bot indicator)
      const postingElement = document.querySelector('[href$="/with_replies"]');
      let tweetCount = 0;
      if (postingElement) {
        const match = postingElement.textContent.match(/[\d,]+/);
        if (match) {
          tweetCount = parseInt(match[0].replace(/,/g, ''));
        }
      }

      // Create analysis badge
      const badge = document.createElement('div');
      badge.className = `poc-account-badge poc-${accountClass}`;
      badge.innerHTML = `
        <div class="poc-account-header">
          <span class="poc-account-icon">${icon}</span>
          <span class="poc-account-type">${accountType}</span>
        </div>
        <div class="poc-account-stats">
          <div class="poc-account-stat">
            <span class="poc-stat-value">${aiPercentage}%</span>
            <span class="poc-stat-label">AI Content</span>
          </div>
          <div class="poc-account-stat">
            <span class="poc-stat-value">${this.totalAnalyzed}</span>
            <span class="poc-stat-label">Analyzed</span>
          </div>
        </div>
      `;

      this.addAccountBadgeStyles();

      // Try multiple selectors to find the right place to insert badge
      const insertBadge = () => {
        // Check if badge already exists
        if (document.querySelector('.poc-account-badge')) {
          console.log('[AccountAnalyzer] Badge already exists');
          return true;
        }

        // Try different selectors
        const selectors = [
          '[data-testid="UserName"]',
          '[data-testid="UserDescription"]',
          '[data-testid="UserProfileHeader_Items"]'
        ];

        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            const container = element.closest('[data-testid="UserProfileHeader_Items"]')?.parentElement ||
                            element.parentElement?.parentElement ||
                            element.parentElement;

            if (container) {
              console.log('[AccountAnalyzer] Inserting badge using selector:', selector);
              container.appendChild(badge);
              return true;
            }
          }
        }

        return false;
      };

      // Try to insert immediately
      if (!insertBadge()) {
        // Retry after delays
        setTimeout(() => {
          if (!insertBadge()) {
            console.log('[AccountAnalyzer] Failed to find profile header, trying one more time...');
            setTimeout(insertBadge, 2000);
          }
        }, 1000);
      }

      console.log(`[AccountAnalyzer] ${username}: ${accountType} (${aiPercentage}% AI)`);
    }

    watchRedditProfiles() {
      // Similar implementation for Reddit
      console.log('[AccountAnalyzer] Reddit profile analysis coming soon');
    }

    addAccountBadgeStyles() {
      if (document.getElementById('poc-account-badge-styles')) return;

      const style = document.createElement('style');
      style.id = 'poc-account-badge-styles';
      style.textContent = `
        .poc-account-badge {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
          backdrop-filter: blur(10px);
          color: white;
          padding: 14px 18px;
          border-radius: 16px;
          margin-top: 12px;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          border: 1px solid rgba(139, 92, 246, 0.4);
        }

        .poc-account-badge.poc-bot {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%);
          border-color: rgba(239, 68, 68, 0.5);
          box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
        }

        .poc-account-badge.poc-human {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%);
          border-color: rgba(16, 185, 129, 0.5);
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
        }

        .poc-account-badge.poc-ai-assisted {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%);
          border-color: rgba(245, 158, 11, 0.5);
          box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
        }

        .poc-account-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .poc-account-icon {
          font-size: 20px;
        }

        .poc-account-type {
          font-size: 14px;
          font-weight: 600;
        }

        .poc-account-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .poc-account-stat {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(5px);
          padding: 10px;
          border-radius: 10px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .poc-stat-value {
          display: block;
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 4px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .poc-stat-label {
          display: block;
          font-size: 11px;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `;

      document.head.appendChild(style);
    }
  }

  // Initialize
  const analyzer = new AccountAnalyzer();
  setTimeout(() => analyzer.init(), 2000);
})();
