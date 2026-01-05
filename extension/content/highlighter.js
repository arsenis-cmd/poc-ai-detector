(function() {
  'use strict';

  let floatingBadge = null;

  function createFloatingBadge() {
    if (floatingBadge) return floatingBadge;

    const badge = document.createElement('div');
    badge.id = 'poc-floating-badge';
    badge.className = 'collapsed';
    badge.innerHTML = `
      <button class="poc-close">×</button>
      <div class="poc-collapsed-icon">
        <div class="poc-logo-mini">P</div>
      </div>
      <div class="poc-expanded-content">
        <div class="poc-header">
          <div class="poc-logo">P</div>
          <span>PoC Scanner</span>
        </div>
        <div class="poc-content">
          <div class="poc-scanning">
            <div class="poc-spinner"></div>
            <span>Scanning...</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(badge);

    // Close button
    badge.querySelector('.poc-close').onclick = () => badge.style.display = 'none';

    // Hover to expand/collapse
    badge.addEventListener('mouseenter', () => {
      badge.classList.remove('collapsed');
      badge.classList.add('expanded');
    });

    badge.addEventListener('mouseleave', () => {
      badge.classList.remove('expanded');
      badge.classList.add('collapsed');
    });

    floatingBadge = badge;
    return badge;
  }

  function updateBadge({ scanning, stats }) {
    const badge = createFloatingBadge();
    const content = badge.querySelector('.poc-content');

    if (scanning && stats.total === 0) {
      badge.classList.add('scanning');
      badge.classList.remove('complete');
      content.innerHTML = `<div style="display:flex;align-items:center;gap:8px;color:#6b7280;font-size:12px"><div class="poc-spinner"></div><span>Scanning...</span></div>`;
      return;
    }

    badge.classList.remove('scanning');
    badge.classList.add('complete');

    const total = stats.total || 1;
    const aiPct = Math.round((stats.ai / total) * 100);
    const humanPct = Math.round((stats.human / total) * 100);

    content.innerHTML = `
      <div class="poc-stats">
        <div class="poc-stat">
          <div class="poc-stat-value ai">${aiPct}%</div>
          <div class="poc-stat-label">AI</div>
        </div>
        <div class="poc-stat">
          <div class="poc-stat-value human">${humanPct}%</div>
          <div class="poc-stat-label">Human</div>
        </div>
      </div>
      <div style="margin-top:8px;font-size:11px;color:#6b7280;text-align:center">${stats.total} scanned</div>
    `;
  }

  async function checkForClaims(text) {
    try {
      const storage = await chrome.storage.local.get(['apiUrl']);
      const apiUrl = storage.apiUrl || 'http://localhost:8000/api/v1';

      const response = await fetch(`${apiUrl}/factcheck/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        const data = await response.json();
        // Only return conclusive verdicts (TRUE or FALSE)
        return data.results.filter(r => r.verdict === 'TRUE' || r.verdict === 'FALSE');
      }
    } catch (error) {
      console.log('[PoC] Fact-check error:', error);
    }
    return [];
  }

  async function highlightElement(element, result) {
    // Add scanning animation
    element.classList.add('poc-scanning');

    // Wait for scan animation
    await new Promise(resolve => setTimeout(resolve, 500));

    element.classList.remove('poc-scanning');
    element.classList.add('poc-highlight');

    let type = 'mixed';
    if (result.classification.includes('AI')) type = 'ai';
    else if (result.classification.includes('HUMAN')) type = 'human';

    element.classList.add(`poc-${type}`);

    // Add inline badge for important elements
    const isImportant = element.closest('[data-testid="tweet"]') ||
                        element.closest('.Comment') ||
                        element.closest('article');

    if (isImportant && !element.querySelector('.poc-inline-badge')) {
      const badge = document.createElement('span');
      badge.className = `poc-inline-badge poc-badge poc-${type}`;

      const aiPercent = Math.round(result.ai_probability * 100);
      let badgeContent = `${aiPercent}% AI`;

      // Check for fact-checkable claims
      const text = element.textContent || '';
      if (text.length > 50 && text.length < 500) {
        const claims = await checkForClaims(text);

        if (claims.length > 0) {
          const falseClaims = claims.filter(c => c.verdict === 'FALSE');

          if (falseClaims.length > 0) {
            badgeContent += ` | FALSE CLAIM`;
            badge.classList.add('poc-false-claim');
            badge.title = falseClaims[0].explanation;
          } else if (claims.some(c => c.verdict === 'TRUE')) {
            badgeContent += ` | Verified`;
            badge.classList.add('poc-verified');
          }
        }
      }

      badge.textContent = badgeContent;
      element.appendChild(badge);
    }
  }

  window.pocHighlighter = { updateBadge, highlightElement, createFloatingBadge };
})();
