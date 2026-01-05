const DEFAULT_API_URL = 'http://localhost:8000/api/v1';

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});

async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['apiUrl']);
    const apiUrl = result.apiUrl || DEFAULT_API_URL;
    document.getElementById('api-url').value = apiUrl;
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('Failed to load settings', 'error');
  }
}

function setupEventListeners() {
  document.getElementById('save-btn').addEventListener('click', saveSettings);
  document.getElementById('test-btn').addEventListener('click', testConnection);
}

async function saveSettings() {
  const apiUrl = document.getElementById('api-url').value.trim();

  if (!apiUrl) {
    showStatus('Please enter an API URL', 'error');
    return;
  }

  // Remove trailing slash if present
  const cleanUrl = apiUrl.replace(/\/$/, '');

  try {
    await chrome.storage.local.set({ apiUrl: cleanUrl });
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('Failed to save settings', 'error');
  }
}

async function testConnection() {
  const apiUrl = document.getElementById('api-url').value.trim().replace(/\/$/, '');
  const btn = document.getElementById('test-btn');

  if (!apiUrl) {
    showStatus('Please enter an API URL', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Testing...';

  try {
    const response = await fetch(`${apiUrl}/stats`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      showStatus('Connection successful! Server is responding.', 'success');
    } else {
      showStatus(`Server responded with status ${response.status}`, 'error');
    }
  } catch (error) {
    console.error('Connection test failed:', error);
    showStatus('Connection failed. Make sure the server is running and the URL is correct.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Test Connection';
  }
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';

  if (type === 'success') {
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }
}
