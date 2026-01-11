(function() {
  'use strict';

  const STORAGE_KEY = 'twitchChatPanorama_enabled';

  const toggle = document.getElementById('toggle');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const previewSide = document.getElementById('preview-side');
  const previewPanorama = document.getElementById('preview-panorama');

  // Get the browser API
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

  // Update UI based on state
  function updateUI(enabled) {
    toggle.checked = enabled;

    if (enabled) {
      statusDot.classList.add('active');
      statusText.textContent = 'Panorama mode is active';
      previewSide.classList.remove('active');
      previewPanorama.classList.add('active');
    } else {
      statusDot.classList.remove('active');
      statusText.textContent = 'Side-by-side mode is active';
      previewSide.classList.add('active');
      previewPanorama.classList.remove('active');
    }
  }

  // Get current state from storage
  async function getState() {
    return new Promise((resolve) => {
      browserAPI.storage.sync.get([STORAGE_KEY], (result) => {
        resolve(result[STORAGE_KEY] || false);
      });
    });
  }

  // Save state to storage
  function saveState(enabled) {
    browserAPI.storage.sync.set({ [STORAGE_KEY]: enabled });
  }

  // Send message to content script
  async function sendMessageToTab(message) {
    try {
      const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });

      if (tab && tab.url && tab.url.includes('twitch.tv')) {
        browserAPI.tabs.sendMessage(tab.id, message, (response) => {
          if (browserAPI.runtime.lastError) {
            console.log('Could not send message to content script');
          } else if (response) {
            updateUI(response.enabled);
          }
        });
      }
    } catch (error) {
      console.log('Error sending message:', error);
    }
  }

  // Toggle handler
  async function handleToggle() {
    const newState = toggle.checked;
    saveState(newState);
    updateUI(newState);

    // Try to toggle in content script
    sendMessageToTab({ action: 'toggle' });
  }

  // Preview click handlers
  function handlePreviewClick(enabled) {
    toggle.checked = enabled;
    saveState(enabled);
    updateUI(enabled);
    sendMessageToTab({ action: 'toggle' });
  }

  // Initialize
  async function init() {
    // Get saved state
    const savedState = await getState();
    updateUI(savedState);

    // Add event listeners
    toggle.addEventListener('change', handleToggle);

    previewSide.addEventListener('click', () => handlePreviewClick(false));
    previewPanorama.addEventListener('click', () => handlePreviewClick(true));

    // Try to get state from content script
    sendMessageToTab({ action: 'getState' });
  }

  init();
})();
