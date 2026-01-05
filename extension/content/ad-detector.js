// Ad Detection and Attention Tracking
let API_BASE = 'http://localhost:8000';

// Load API URL from storage
chrome.storage.local.get(['apiUrl'], (result) => {
  if (result.apiUrl) {
    API_BASE = result.apiUrl.replace('/api/v1', '');
  }
});

class AdDetector {
  constructor() {
    this.detectedAds = new Map();
    this.trackingAds = new Map();
    this.verifiedImpressions = new Set();
    this.scrollTimeout = null;
    this.isScrolling = false;
    this.lastScrollTime = Date.now();
  }

  init() {
    console.log('[AdDetector] Initializing...');

    // Detect platform
    this.platform = this.detectPlatform();
    console.log('[AdDetector] Platform:', this.platform);

    if (this.platform === 'twitter') {
      this.startTwitterAdDetection();
    } else if (this.platform === 'reddit') {
      this.startRedditAdDetection();
    } else if (this.platform === 'youtube') {
      this.startYouTubeAdDetection();
    } else if (this.platform === 'meta') {
      this.startInstagramFacebookAdDetection();
    } else if (this.platform === 'linkedin') {
      this.startLinkedInAdDetection();
    } else {
      this.startGenericAdDetection();
    }

    // Track scrolling
    this.trackScrolling();

    // Check for ads in viewport every 500ms
    setInterval(() => this.checkAdsInViewport(), 500);
  }

  detectPlatform() {
    const hostname = window.location.hostname;

    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return 'twitter';
    } else if (hostname.includes('reddit.com')) {
      return 'reddit';
    } else if (hostname.includes('youtube.com')) {
      return 'youtube';
    } else if (hostname.includes('facebook.com') || hostname.includes('instagram.com')) {
      return 'meta';
    } else if (hostname.includes('linkedin.com')) {
      return 'linkedin';
    }
    return 'generic';
  }

  trackScrolling() {
    let scrollEndTimeout;

    window.addEventListener('scroll', () => {
      this.isScrolling = true;
      this.lastScrollTime = Date.now();

      clearTimeout(scrollEndTimeout);
      scrollEndTimeout = setTimeout(() => {
        this.isScrolling = false;
        console.log('[AdDetector] Scrolling stopped');
      }, 150);
    });
  }

  startTwitterAdDetection() {
    console.log('[AdDetector] Starting Twitter ad detection...');

    // Detect ads on page load
    setTimeout(() => this.detectTwitterAds(), 2000);

    // Detect new ads as they load (when scrolling)
    const observer = new MutationObserver(() => {
      this.detectTwitterAds();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  detectTwitterAds() {
    // Twitter promoted tweets have specific indicators
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');

    tweets.forEach(tweet => {
      // Check if already processed
      if (tweet.hasAttribute('data-poc-ad-tracked')) return;

      // Look for "Promoted" or "Ad" label
      const isPromoted = tweet.innerText.includes('Promoted') ||
                        tweet.innerText.includes('Ad') ||
                        tweet.querySelector('[data-testid="promotedIndicator"]');

      if (isPromoted) {
        const adId = this.generateAdId(tweet);

        if (!this.detectedAds.has(adId)) {
          console.log('[AdDetector] Found Twitter ad:', adId);

          const adData = {
            id: adId,
            element: tweet,
            platform: 'twitter',
            type: 'promoted_tweet',
            detectedAt: Date.now(),
            url: this.extractTweetUrl(tweet),
            content: this.extractTweetContent(tweet)
          };

          this.detectedAds.set(adId, adData);
          this.highlightAd(tweet, 'twitter');
          tweet.setAttribute('data-poc-ad-tracked', 'true');
          tweet.setAttribute('data-poc-ad-id', adId);
        }
      }
    });
  }

  startRedditAdDetection() {
    console.log('[AdDetector] Starting Reddit ad detection...');

    const checkForAds = () => {
      const posts = document.querySelectorAll('[data-testid="post-container"]');

      posts.forEach(post => {
        if (post.hasAttribute('data-poc-ad-tracked')) return;

        const isAd = post.querySelector('[data-click-id="promoted"]') ||
                     post.innerText.includes('Promoted') ||
                     post.querySelector('.promotedlink');

        if (isAd) {
          const adId = this.generateAdId(post);

          if (!this.detectedAds.has(adId)) {
            console.log('[AdDetector] Found Reddit ad:', adId);

            const adData = {
              id: adId,
              element: post,
              platform: 'reddit',
              type: 'promoted_post',
              detectedAt: Date.now(),
              url: window.location.href,
              content: post.innerText.substring(0, 200)
            };

            this.detectedAds.set(adId, adData);
            this.highlightAd(post, 'reddit');
            post.setAttribute('data-poc-ad-tracked', 'true');
            post.setAttribute('data-poc-ad-id', adId);
          }
        }
      });
    };

    setTimeout(checkForAds, 2000);
    const observer = new MutationObserver(checkForAds);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  startYouTubeAdDetection() {
    console.log('[AdDetector] Starting YouTube ad detection...');

    // YouTube ads are typically in the video player or overlay
    // This is more complex - simplified version
    const checkForAds = () => {
      const adOverlay = document.querySelector('.ytp-ad-overlay-container');
      const adPlayer = document.querySelector('.video-ads');

      if ((adOverlay && adOverlay.children.length > 0) ||
          (adPlayer && adPlayer.children.length > 0)) {
        console.log('[AdDetector] YouTube ad playing');
        // Handle video ads differently
      }
    };

    setInterval(checkForAds, 1000);
  }

  startInstagramFacebookAdDetection() {
    const isInstagram = window.location.hostname.includes('instagram.com');
    console.log(`[AdDetector] Starting ${isInstagram ? 'Instagram' : 'Facebook'} ad detection...`);

    const checkForAds = () => {
      if (isInstagram) {
        // Instagram sponsored posts
        const articles = document.querySelectorAll('article');

        articles.forEach(article => {
          if (article.hasAttribute('data-poc-ad-tracked')) return;

          // Instagram shows "Sponsored" text in a specific location
          const sponsoredText = article.innerText.toLowerCase();
          const isSponsored = sponsoredText.includes('sponsored') ||
                             sponsoredText.includes('sp0ns0red'); // Sometimes obfuscated

          if (isSponsored) {
            const adId = this.generateAdId(article);

            if (!this.detectedAds.has(adId)) {
              console.log('[AdDetector] Found Instagram sponsored post:', adId);

              const adData = {
                id: adId,
                element: article,
                platform: 'instagram',
                type: 'sponsored_post',
                detectedAt: Date.now(),
                url: window.location.href,
                content: this.extractInstagramPostContent(article)
              };

              this.detectedAds.set(adId, adData);
              this.highlightAd(article, 'instagram');
              article.setAttribute('data-poc-ad-tracked', 'true');
              article.setAttribute('data-poc-ad-id', adId);
            }
          }
        });
      } else {
        // Facebook sponsored posts
        const posts = document.querySelectorAll('[role="article"]');

        posts.forEach(post => {
          if (post.hasAttribute('data-poc-ad-tracked')) return;

          // Facebook shows "Sponsored" label
          const sponsoredLabel = post.querySelector('a[href*="ads/about"]') ||
                                post.querySelector('[aria-label*="Sponsored"]');

          if (sponsoredLabel || post.innerText.toLowerCase().includes('sponsored')) {
            const adId = this.generateAdId(post);

            if (!this.detectedAds.has(adId)) {
              console.log('[AdDetector] Found Facebook sponsored post:', adId);

              const adData = {
                id: adId,
                element: post,
                platform: 'facebook',
                type: 'sponsored_post',
                detectedAt: Date.now(),
                url: window.location.href,
                content: post.innerText.substring(0, 200)
              };

              this.detectedAds.set(adId, adData);
              this.highlightAd(post, 'facebook');
              post.setAttribute('data-poc-ad-tracked', 'true');
              post.setAttribute('data-poc-ad-id', adId);
            }
          }
        });
      }
    };

    setTimeout(checkForAds, 2000);
    const observer = new MutationObserver(checkForAds);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  startLinkedInAdDetection() {
    console.log('[AdDetector] Starting LinkedIn ad detection...');

    const checkForAds = () => {
      const posts = document.querySelectorAll('.feed-shared-update-v2');

      posts.forEach(post => {
        if (post.hasAttribute('data-poc-ad-tracked')) return;

        // LinkedIn shows "Promoted" label
        const promotedLabel = post.querySelector('.feed-shared-actor__sub-description') ||
                             post.querySelector('[data-test-link*="promoted"]');

        const isPromoted = promotedLabel?.innerText?.toLowerCase().includes('promoted') ||
                          post.innerText.toLowerCase().includes('promoted');

        if (isPromoted) {
          const adId = this.generateAdId(post);

          if (!this.detectedAds.has(adId)) {
            console.log('[AdDetector] Found LinkedIn promoted post:', adId);

            const adData = {
              id: adId,
              element: post,
              platform: 'linkedin',
              type: 'promoted_post',
              detectedAt: Date.now(),
              url: window.location.href,
              content: post.innerText.substring(0, 200)
            };

            this.detectedAds.set(adId, adData);
            this.highlightAd(post, 'linkedin');
            post.setAttribute('data-poc-ad-tracked', 'true');
            post.setAttribute('data-poc-ad-id', adId);
          }
        }
      });
    };

    setTimeout(checkForAds, 2000);
    const observer = new MutationObserver(checkForAds);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  startGenericAdDetection() {
    console.log('[AdDetector] Starting generic ad detection...');

    const checkForAds = () => {
      // Common ad selectors
      const adSelectors = [
        '[class*="ad-"]',
        '[id*="ad-"]',
        '[class*="advertisement"]',
        '[class*="sponsored"]',
        'ins.adsbygoogle',
        'iframe[src*="doubleclick"]',
        'iframe[src*="googlesyndication"]'
      ];

      adSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);

        elements.forEach(el => {
          if (el.hasAttribute('data-poc-ad-tracked')) return;
          if (el.offsetWidth < 100 || el.offsetHeight < 100) return; // Skip small ads

          const adId = this.generateAdId(el);

          if (!this.detectedAds.has(adId)) {
            console.log('[AdDetector] Found generic ad:', adId);

            const adData = {
              id: adId,
              element: el,
              platform: 'generic',
              type: 'display_ad',
              detectedAt: Date.now(),
              url: window.location.href,
              content: ''
            };

            this.detectedAds.set(adId, adData);
            this.highlightAd(el, 'generic');
            el.setAttribute('data-poc-ad-tracked', 'true');
            el.setAttribute('data-poc-ad-id', adId);
          }
        });
      });
    };

    setTimeout(checkForAds, 2000);
    const observer = new MutationObserver(checkForAds);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  highlightAd(element, platform) {
    // Add visual indicator that ad is being tracked
    const indicator = document.createElement('div');
    indicator.className = 'poc-ad-indicator';
    indicator.innerHTML = `
      <div class="poc-ad-label">
        <span class="poc-ad-icon">●</span>
        <span class="poc-ad-text">Tracking Attention</span>
      </div>
      <div class="poc-ad-progress" id="poc-ad-progress-${element.getAttribute('data-poc-ad-id')}">
        <div class="poc-ad-progress-bar"></div>
      </div>
    `;

    element.style.position = 'relative';
    element.appendChild(indicator);

    this.addAdIndicatorStyles();
  }

  addAdIndicatorStyles() {
    if (document.getElementById('poc-ad-indicator-styles')) return;

    const style = document.createElement('style');
    style.id = 'poc-ad-indicator-styles';
    style.textContent = `
      .poc-ad-indicator {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(102, 126, 234, 0.95);
        padding: 8px 12px;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
      }

      .poc-ad-label {
        display: flex;
        align-items: center;
        gap: 6px;
        color: white;
        font-size: 12px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .poc-ad-icon {
        font-size: 14px;
      }

      .poc-ad-progress {
        margin-top: 6px;
        background: rgba(255, 255, 255, 0.3);
        height: 4px;
        border-radius: 2px;
        overflow: hidden;
      }

      .poc-ad-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%);
        width: 0%;
        transition: width 0.3s ease;
      }

      .poc-ad-indicator.verified {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        animation: pulse 1s ease;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }

      .poc-ad-verified-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        color: white;
        font-size: 11px;
      }
    `;

    document.head.appendChild(style);
  }

  checkAdsInViewport() {
    this.detectedAds.forEach((adData, adId) => {
      const element = adData.element;

      if (!element || !document.contains(element)) {
        this.detectedAds.delete(adId);
        return;
      }

      const isInViewport = this.isElementInViewport(element);
      const isUserAttending = !this.isScrolling && isInViewport;

      if (isUserAttending) {
        // Start or continue tracking
        if (!this.trackingAds.has(adId)) {
          console.log('[AdDetector] Started tracking ad:', adId);
          this.trackingAds.set(adId, {
            startTime: Date.now(),
            totalTime: 0,
            lastUpdate: Date.now()
          });
        } else {
          // Update tracking time
          const tracking = this.trackingAds.get(adId);
          const now = Date.now();
          const deltaTime = (now - tracking.lastUpdate) / 1000;
          tracking.totalTime += deltaTime;
          tracking.lastUpdate = now;

          // Update progress bar
          const progress = Math.min((tracking.totalTime / 3) * 100, 100);
          this.updateProgressBar(adId, progress);

          // Verify impression if threshold reached (3 seconds)
          if (tracking.totalTime >= 3 && !this.verifiedImpressions.has(adId)) {
            this.verifyImpression(adData, tracking.totalTime);
          }
        }
      } else {
        // User scrolled away or not in viewport
        if (this.trackingAds.has(adId)) {
          const tracking = this.trackingAds.get(adId);

          // If not verified yet, pause tracking
          if (!this.verifiedImpressions.has(adId)) {
            console.log('[AdDetector] Paused tracking ad:', adId, 'Time:', tracking.totalTime.toFixed(2) + 's');
          }
        }
      }
    });
  }

  isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    // At least 50% of the element must be visible
    const vertInView = (rect.top <= windowHeight * 0.5) && ((rect.top + rect.height) >= windowHeight * 0.5);
    const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0);

    return vertInView && horInView;
  }

  updateProgressBar(adId, progress) {
    const progressElement = document.getElementById(`poc-ad-progress-${adId}`);
    if (progressElement) {
      const bar = progressElement.querySelector('.poc-ad-progress-bar');
      if (bar) {
        bar.style.width = `${progress}%`;
      }
    }
  }

  async verifyImpression(adData, attentionTime) {
    const adId = adData.id;

    if (this.verifiedImpressions.has(adId)) return;

    console.log('[AdDetector] VERIFIED IMPRESSION:', adId, 'Time:', attentionTime.toFixed(2) + 's');
    this.verifiedImpressions.add(adId);

    // Update UI to show verified
    const indicator = adData.element.querySelector('.poc-ad-indicator');
    if (indicator) {
      indicator.classList.add('verified');
      indicator.querySelector('.poc-ad-label').innerHTML = `
        <span class="poc-ad-verified-badge">
          <span>✓</span>
          <span>Verified Impression!</span>
        </span>
      `;
    }

    // Send to backend
    try {
      const response = await fetch(`${API_BASE}/api/v1/impressions/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad_id: adId,
          platform: adData.platform,
          ad_type: adData.type,
          attention_time: attentionTime,
          url: adData.url,
          timestamp: new Date().toISOString(),
          verification_method: 'scroll_and_viewport'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[AdDetector] Impression recorded:', result);

        // Optional: Redirect or reward user
        if (result.redirect_url) {
          this.offerRedirect(adData, result.redirect_url);
        }
      }
    } catch (error) {
      console.error('[AdDetector] Failed to record impression:', error);
    }

    // Show notification
    this.showVerificationNotification(adData, attentionTime);
  }

  showVerificationNotification(adData, attentionTime) {
    const notification = document.createElement('div');
    notification.className = 'poc-verification-notification';
    notification.innerHTML = `
      <div class="poc-notif-icon">✓</div>
      <div class="poc-notif-content">
        <div class="poc-notif-title">Verified Impression!</div>
        <div class="poc-notif-text">You viewed this ad for ${attentionTime.toFixed(1)}s</div>
        <div class="poc-notif-reward">+10 PoC tokens earned</div>
      </div>
    `;

    document.body.appendChild(notification);

    // Add styles
    if (!document.getElementById('poc-verification-notif-styles')) {
      const style = document.createElement('style');
      style.id = 'poc-verification-notif-styles';
      style.textContent = `
        .poc-verification-notification {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          color: white;
          padding: 16px 20px;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(67, 233, 123, 0.4);
          z-index: 2147483647;
          display: flex;
          align-items: center;
          gap: 12px;
          animation: slideInUp 0.3s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        @keyframes slideInUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .poc-notif-icon {
          font-size: 32px;
        }

        .poc-notif-title {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .poc-notif-text {
          font-size: 12px;
          opacity: 0.9;
        }

        .poc-notif-reward {
          font-size: 12px;
          font-weight: 600;
          margin-top: 4px;
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          display: inline-block;
        }
      `;
      document.head.appendChild(style);
    }

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideInUp 0.3s ease reverse';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  offerRedirect(adData, redirectUrl) {
    // Optional: Show modal asking if user wants to visit the ad
    const modal = document.createElement('div');
    modal.className = 'poc-redirect-modal';
    modal.innerHTML = `
      <div class="poc-redirect-overlay"></div>
      <div class="poc-redirect-content">
        <h3>Visit Advertiser?</h3>
        <p>You've verified your attention. Would you like to learn more?</p>
        <div class="poc-redirect-buttons">
          <button class="poc-redirect-btn-yes">Yes, take me there</button>
          <button class="poc-redirect-btn-no">No thanks</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.poc-redirect-btn-yes').addEventListener('click', () => {
      window.open(redirectUrl, '_blank');
      modal.remove();
    });

    modal.querySelector('.poc-redirect-btn-no').addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('.poc-redirect-overlay').addEventListener('click', () => {
      modal.remove();
    });
  }

  generateAdId(element) {
    // Generate unique ID for ad based on content or position
    const text = element.innerText.substring(0, 100);
    const rect = element.getBoundingClientRect();
    const unique = `${text}-${rect.top}-${rect.left}`;
    return this.hashCode(unique);
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'ad_' + Math.abs(hash).toString(36);
  }

  extractTweetUrl(tweet) {
    const link = tweet.querySelector('a[href*="/status/"]');
    return link ? link.href : window.location.href;
  }

  extractTweetContent(tweet) {
    const textElement = tweet.querySelector('[data-testid="tweetText"]');
    return textElement ? textElement.innerText : '';
  }

  extractInstagramPostContent(article) {
    // Try to get post caption
    const captionElements = article.querySelectorAll('h1, span');
    for (const el of captionElements) {
      if (el.innerText && el.innerText.length > 20 && !el.innerText.toLowerCase().includes('sponsored')) {
        return el.innerText.substring(0, 200);
      }
    }
    return article.innerText.substring(0, 200);
  }
}

// Initialize ad detector
const adDetector = new AdDetector();
setTimeout(() => adDetector.init(), 1500);
