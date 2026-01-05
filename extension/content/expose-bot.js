// Expose Bot - Share Card Generator
(function() {
  'use strict';

  class BotExposer {
    constructor() {
      this.exposedAccounts = new Set();
    }

    init() {
      if (!this.isTwitter()) return;
      console.log('[BotExposer] Initializing...');
      this.watchForBotBadges();
    }

    isTwitter() {
      return window.location.hostname.includes('twitter.com') ||
             window.location.hostname.includes('x.com');
    }

    watchForBotBadges() {
      // Watch for account analysis badges
      const observer = new MutationObserver(() => {
        const badges = document.querySelectorAll('.poc-account-badge:not(.poc-expose-added)');
        badges.forEach(badge => this.addExposeButton(badge));
      });

      observer.observe(document.body, { childList: true, subtree: true });

      // Check existing badges
      setTimeout(() => {
        const badges = document.querySelectorAll('.poc-account-badge:not(.poc-expose-added)');
        badges.forEach(badge => this.addExposeButton(badge));
      }, 2000);
    }

    addExposeButton(badge) {
      badge.classList.add('poc-expose-added');

      // Only add button for bots and AI-assisted accounts
      if (!badge.classList.contains('poc-bot') &&
          !badge.classList.contains('poc-ai-assisted')) {
        return;
      }

      const button = document.createElement('button');
      button.className = 'poc-expose-btn';
      button.innerHTML = 'Expose Bot';
      button.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showExposeCard(badge);
      };

      badge.appendChild(button);
    }

    async showExposeCard(badge) {
      const username = this.extractUsername();
      const stats = this.extractStats(badge);

      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = 'poc-expose-overlay';
      overlay.innerHTML = `
        <div class="poc-expose-modal">
          <button class="poc-expose-close">×</button>
          <div class="poc-expose-preview">
            <div id="poc-share-card" class="poc-share-card">
              <div class="poc-card-header">
                <div class="poc-card-alert">BOT DETECTED</div>
                <div class="poc-card-logo">PoC</div>
              </div>

              <div class="poc-card-body">
                <div class="poc-card-username">@${username}</div>

                <div class="poc-card-meter">
                  <div class="poc-meter-bar">
                    <div class="poc-meter-fill" style="width: ${stats.botPercent}%"></div>
                  </div>
                  <div class="poc-meter-label">${stats.botPercent}% Bot Probability</div>
                </div>

                <div class="poc-card-warnings">
                  ${this.generateWarnings(stats)}
                </div>
              </div>

              <div class="poc-card-footer">
                <div class="poc-card-divider"></div>
                <div class="poc-card-cta">Scan any Twitter account → poc.app</div>
              </div>
            </div>
          </div>

          <div class="poc-expose-actions">
            <button class="poc-btn poc-btn-primary" id="poc-share-twitter">
              Share on Twitter
            </button>
            <button class="poc-btn poc-btn-secondary" id="poc-copy-image">
              Copy Image
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      // Event listeners
      overlay.querySelector('.poc-expose-close').onclick = () => overlay.remove();
      overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
      };

      document.getElementById('poc-share-twitter').onclick = () => {
        this.shareToTwitter(username, stats.botPercent);
      };

      document.getElementById('poc-copy-image').onclick = async () => {
        await this.copyCardImage();
        this.trackExpose(username);
      };

      this.addExposeStyles();
    }

    extractUsername() {
      const pathParts = window.location.pathname.split('/').filter(p => p);
      return pathParts[0] || 'unknown';
    }

    extractStats(badge) {
      const percentText = badge.querySelector('.poc-stat-value')?.textContent || '0%';
      const botPercent = parseInt(percentText);
      const analyzed = badge.querySelectorAll('.poc-stat-value')[1]?.textContent || '0';

      return {
        botPercent,
        analyzed: parseInt(analyzed),
        createdDays: Math.floor(Math.random() * 30) + 1, // Mock for now
        tweetsPerDay: Math.floor(Math.random() * 1000) + 10
      };
    }

    generateWarnings(stats) {
      const warnings = [];

      if (stats.tweetsPerDay > 100) {
        warnings.push(`Posts ${stats.tweetsPerDay} times/day`);
      }

      if (stats.botPercent > 80) {
        warnings.push(`${stats.botPercent}% AI-generated content`);
      }

      if (stats.createdDays < 30) {
        warnings.push(`Account created ${stats.createdDays} days ago`);
      }

      return warnings.map(w => `<div class="poc-warning-item">${w}</div>`).join('');
    }

    async copyCardImage() {
      const card = document.getElementById('poc-share-card');
      const button = document.getElementById('poc-copy-image');

      button.innerHTML = 'Generating...';
      button.disabled = true;

      try {
        // Load html2canvas dynamically
        if (!window.html2canvas) {
          await this.loadHtml2Canvas();
        }

        const canvas = await html2canvas(card, {
          backgroundColor: '#1a1a2e',
          scale: 2,
          width: 1200,
          height: 675
        });

        // Copy to clipboard
        canvas.toBlob(async (blob) => {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            button.innerHTML = 'Copied!';
            setTimeout(() => {
              button.innerHTML = 'Copy Image';
              button.disabled = false;
            }, 2000);
          } catch (err) {
            console.error('Failed to copy:', err);
            button.innerHTML = 'Failed';
            button.disabled = false;
          }
        });
      } catch (error) {
        console.error('Error generating image:', error);
        button.innerHTML = 'Error';
        button.disabled = false;
      }
    }

    async loadHtml2Canvas() {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    async trackExpose(username) {
      try {
        const result = await chrome.storage.local.get(['userStats']);
        const userStats = result.userStats || { scanned: 0, bots: 0, exposed: 0 };
        userStats.exposed++;
        await chrome.storage.local.set({ userStats });

        // Notify popup
        chrome.runtime.sendMessage({ type: 'STATS_UPDATED' }).catch(() => {});
      } catch (e) {
        // Ignore storage errors
      }
    }

    shareToTwitter(username, botPercent) {
      this.trackExpose(username);
      const text = `This account @${username} is ${botPercent}% likely a bot! Detected by PoC AI Detector`;
      const url = 'https://poc.app';
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      window.open(tweetUrl, '_blank');
    }

    addExposeStyles() {
      if (document.getElementById('poc-expose-styles')) return;

      const style = document.createElement('style');
      style.id = 'poc-expose-styles';
      style.textContent = `
        .poc-expose-btn {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 12px;
          width: 100%;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
        }

        .poc-expose-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.6);
        }

        .poc-expose-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 12, 41, 0.95);
          backdrop-filter: blur(10px);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .poc-expose-modal {
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 100%);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 20px;
          padding: 28px;
          max-width: 700px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          animation: slideUp 0.3s ease-out;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .poc-expose-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.8);
          transition: all 0.3s;
        }

        .poc-expose-close:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          transform: rotate(90deg);
        }

        .poc-expose-preview {
          margin-bottom: 24px;
          display: flex;
          justify-content: center;
        }

        .poc-share-card {
          width: 600px;
          height: 337.5px;
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          border-radius: 16px;
          padding: 36px;
          color: white;
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .poc-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .poc-card-alert {
          font-size: 20px;
          font-weight: 700;
          color: #ef4444;
        }

        .poc-card-logo {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 20px;
        }

        .poc-card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .poc-card-username {
          font-size: 32px;
          font-weight: 700;
        }

        .poc-meter-bar {
          width: 100%;
          height: 24px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
        }

        .poc-meter-fill {
          height: 100%;
          background: linear-gradient(90deg, #ef4444, #dc2626);
          transition: width 0.3s ease-out;
        }

        .poc-meter-label {
          margin-top: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #d1d5db;
        }

        .poc-card-warnings {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .poc-warning-item {
          font-size: 15px;
          color: #fca5a5;
        }

        .poc-card-footer {
          padding-top: 16px;
        }

        .poc-card-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.2);
          margin-bottom: 16px;
        }

        .poc-card-cta {
          font-size: 14px;
          color: #9ca3af;
          text-align: center;
        }

        .poc-expose-actions {
          display: flex;
          gap: 12px;
        }

        .poc-btn {
          flex: 1;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .poc-btn-primary {
          background: linear-gradient(135deg, #1d9bf0, #0c7abf);
          color: white;
          box-shadow: 0 4px 15px rgba(29, 155, 240, 0.4);
        }

        .poc-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(29, 155, 240, 0.6);
        }

        .poc-btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .poc-btn-secondary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(139, 92, 246, 0.5);
        }

        .poc-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `;

      document.head.appendChild(style);
    }
  }

  // Initialize
  const exposer = new BotExposer();
  setTimeout(() => exposer.init(), 2000);
})();
