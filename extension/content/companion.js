// AI Companion - Friend-like commentary on what you're viewing
let API_BASE = 'http://localhost:8000';

// Load API URL from storage
chrome.storage.local.get(['apiUrl'], (result) => {
  if (result.apiUrl) {
    API_BASE = result.apiUrl.replace('/api/v1', '');
  }
});

class Companion {
  constructor() {
    this.sidebar = null;
    this.comments = [];
    this.isVisible = false;
    this.currentContext = {};
  }

  init() {
    this.createSidebar();
    this.attachEventListeners();

    // Get companion comment every 10 seconds
    setInterval(() => this.getComment(), 10000);

    // Initial comment after 2 seconds
    setTimeout(() => this.getComment(), 2000);
  }

  createSidebar() {
    // Create companion sidebar
    this.sidebar = document.createElement('div');
    this.sidebar.id = 'poc-companion-sidebar';
    this.sidebar.innerHTML = `
      <div class="poc-companion-header">
        <div class="poc-companion-title">
          <span class="poc-companion-icon">AI</span>
          <span>Your AI Companion</span>
        </div>
        <button class="poc-companion-close" id="poc-companion-close">×</button>
      </div>
      <div class="poc-companion-content">
        <div class="poc-companion-intro">
          <p>Hey! I'm watching with you</p>
          <p class="poc-companion-subtitle">I'll share my thoughts as you browse...</p>
        </div>
        <div id="poc-companion-comments"></div>
      </div>
      <div class="poc-companion-footer">
        <button id="poc-fact-check-btn" class="poc-action-btn">
          Fact Check This Page
        </button>
      </div>
    `;

    document.body.appendChild(this.sidebar);
    this.addStyles();
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #poc-companion-sidebar {
        position: fixed;
        top: 0;
        right: -380px;
        width: 360px;
        height: 100vh;
        background: #ffffff;
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
        z-index: 2147483646;
        transition: right 0.3s ease;
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      #poc-companion-sidebar.visible {
        right: 0;
      }

      .poc-companion-header {
        background: #ffffff;
        border-bottom: 1px solid #e5e7eb;
        padding: 16px 20px;
        color: #111827;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .poc-companion-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 16px;
      }

      .poc-companion-icon {
        font-size: 20px;
      }

      .poc-companion-close {
        background: #f3f4f6;
        border: none;
        color: #6b7280;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 20px;
        line-height: 1;
        transition: all 0.2s;
      }

      .poc-companion-close:hover {
        background: #e5e7eb;
        color: #111827;
      }

      .poc-companion-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background: #f9fafb;
      }

      .poc-companion-intro {
        background: #ffffff;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 20px;
        border: 1px solid #e5e7eb;
      }

      .poc-companion-intro p {
        margin: 0;
        color: #111827;
        font-size: 15px;
      }

      .poc-companion-subtitle {
        color: #6b7280;
        font-size: 13px !important;
        margin-top: 8px !important;
      }

      #poc-companion-comments {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .poc-comment {
        background: #ffffff;
        border-radius: 12px;
        padding: 14px;
        color: #111827;
        font-size: 14px;
        line-height: 1.5;
        border-left: 3px solid;
        animation: slideIn 0.3s ease;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .poc-comment.curious {
        border-color: #3b82f6;
      }

      .poc-comment.skeptical {
        border-color: #f59e0b;
      }

      .poc-comment.impressed {
        border-color: #10b981;
      }

      .poc-comment.concerned {
        border-color: #ef4444;
      }

      .poc-comment.funny {
        border-color: #f59e0b;
      }

      .poc-comment-emoji {
        font-size: 16px;
        margin-right: 8px;
      }

      .poc-comment-time {
        font-size: 11px;
        color: #9ca3af;
        margin-top: 8px;
      }

      .poc-companion-footer {
        padding: 16px 20px;
        border-top: 1px solid #e5e7eb;
        background: #ffffff;
      }

      .poc-action-btn {
        width: 100%;
        background: #3b82f6;
        color: white;
        border: none;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .poc-action-btn:hover {
        background: #2563eb;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }

      .poc-action-btn span {
        margin-right: 6px;
      }

      /* Fact check results */
      .poc-factcheck-results {
        margin-top: 16px;
      }

      .poc-factcheck-item {
        background: #ffffff;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 10px;
        border-left: 3px solid;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .poc-factcheck-item.TRUE {
        border-color: #10b981;
      }

      .poc-factcheck-item.FALSE {
        border-color: #ef4444;
      }

      .poc-factcheck-item.MISLEADING {
        border-color: #f59e0b;
      }

      .poc-factcheck-item.UNVERIFIABLE {
        border-color: #6b7280;
      }

      .poc-factcheck-claim {
        color: #111827;
        font-size: 13px;
        margin-bottom: 6px;
        font-weight: 500;
      }

      .poc-factcheck-verdict {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        margin-bottom: 6px;
      }

      .poc-factcheck-verdict.TRUE {
        background: #d1fae5;
        color: #065f46;
      }

      .poc-factcheck-verdict.FALSE {
        background: #fee2e2;
        color: #991b1b;
      }

      .poc-factcheck-verdict.MISLEADING {
        background: #fef3c7;
        color: #92400e;
      }

      .poc-factcheck-verdict.UNVERIFIABLE {
        background: #f3f4f6;
        color: #374151;
      }

      .poc-factcheck-explanation {
        color: #6b7280;
        font-size: 12px;
        line-height: 1.4;
      }
    `;
    document.head.appendChild(style);
  }

  attachEventListeners() {
    document.getElementById('poc-companion-close').addEventListener('click', () => {
      this.hide();
    });

    document.getElementById('poc-fact-check-btn').addEventListener('click', () => {
      this.factCheckPage();
    });

    // Toggle with keyboard shortcut (Alt+C)
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'c') {
        this.toggle();
      }
    });
  }

  show() {
    this.sidebar.classList.add('visible');
    this.isVisible = true;
  }

  hide() {
    this.sidebar.classList.remove('visible');
    this.isVisible = false;
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  async getComment() {
    try {
      const url = window.location.href;
      const title = document.title;
      const pageText = document.body.innerText.substring(0, 1000);

      const response = await fetch(`${API_BASE}/api/v1/companion/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          page_title: title,
          page_text: pageText
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.addComment(data);

        // Auto-show sidebar when first comment arrives
        if (this.comments.length === 1) {
          this.show();
        }
      }
    } catch (error) {
      console.log('[Companion] Comment fetch error:', error);
    }
  }

  addComment(data) {
    const commentsContainer = document.getElementById('poc-companion-comments');
    const comment = document.createElement('div');
    comment.className = `poc-comment ${data.tone}`;

    const now = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    comment.innerHTML = `
      <div>
        <span class="poc-comment-emoji">${data.emoji}</span>
        ${data.message}
      </div>
      <div class="poc-comment-time">${now}</div>
    `;

    commentsContainer.appendChild(comment);
    this.comments.push(data);

    // Scroll to bottom
    commentsContainer.scrollTop = commentsContainer.scrollHeight;

    // Keep only last 10 comments
    if (this.comments.length > 10) {
      commentsContainer.firstChild.remove();
      this.comments.shift();
    }
  }

  async factCheckPage() {
    const btn = document.getElementById('poc-fact-check-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>⏳</span> Checking facts...';
    btn.disabled = true;

    try {
      const pageText = document.body.innerText;
      const response = await fetch(`${API_BASE}/api/v1/factcheck/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pageText })
      });

      if (response.ok) {
        const data = await response.json();
        this.showFactCheckResults(data);
      }
    } catch (error) {
      console.error('[Companion] Fact-check error:', error);
      alert('Fact-check failed. Make sure the backend is running.');
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }

  showFactCheckResults(data) {
    const commentsContainer = document.getElementById('poc-companion-comments');

    // Add summary comment
    const summaryEmoji = data.false_count > 0 ? '!' : data.misleading_count > 0 ? '?' : '✓';
    this.addComment({
      message: data.summary,
      tone: data.false_count > 0 ? 'concerned' : 'curious',
      emoji: summaryEmoji
    });

    if (data.results.length === 0) {
      return;
    }

    // Add fact-check results
    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'poc-factcheck-results';

    data.results.forEach(result => {
      const item = document.createElement('div');
      item.className = `poc-factcheck-item ${result.verdict}`;
      item.innerHTML = `
        <div class="poc-factcheck-claim">"${result.claim}"</div>
        <div class="poc-factcheck-verdict ${result.verdict}">${result.verdict}</div>
        <div class="poc-factcheck-explanation">${result.explanation}</div>
      `;
      resultsDiv.appendChild(item);
    });

    commentsContainer.appendChild(resultsDiv);
    commentsContainer.scrollTop = commentsContainer.scrollHeight;
  }
}

// Initialize companion
const companion = new Companion();
setTimeout(() => companion.init(), 1000);
