(function() {
  'use strict';

  const STORAGE_KEY = 'twitchChatPanorama_enabled';
  const PANORAMA_CLASS = 'twitch-chat-panorama-enabled';
  const CONTAINER_CLASS = 'tcp-panorama-container';
  const VIDEO_CLASS = 'tcp-video-section';
  const CHAT_CLASS = 'tcp-chat-section';

  let isEnabled = false;
  let layoutObserver = null;

  // Load saved state
  function loadState() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get([STORAGE_KEY], (result) => {
          resolve(result[STORAGE_KEY] || false);
        });
      } else if (typeof browser !== 'undefined' && browser.storage) {
        browser.storage.sync.get([STORAGE_KEY]).then((result) => {
          resolve(result[STORAGE_KEY] || false);
        });
      } else {
        resolve(localStorage.getItem(STORAGE_KEY) === 'true');
      }
    });
  }

  // Save state
  function saveState(enabled) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ [STORAGE_KEY]: enabled });
    } else if (typeof browser !== 'undefined' && browser.storage) {
      browser.storage.sync.set({ [STORAGE_KEY]: enabled });
    } else {
      localStorage.setItem(STORAGE_KEY, enabled.toString());
    }
  }

  // Find the main layout elements
  function findLayoutElements() {
    // Video player - the persistent player is the main video container
    const videoPlayer = document.querySelector('.persistent-player');

    // Chat container - look for the chat shell or right column
    const chatShell = document.querySelector('.chat-shell');
    const rightColumn = document.querySelector('.right-column') ||
                        document.querySelector('.right-column--chat-panel') ||
                        document.querySelector('[class*="right-column"]');

    // We need to find the common ancestor that contains both video and chat
    // and where they are in SEPARATE direct child branches
    let commonParent = null;
    let videoContainer = null;
    let chatContainer = null;

    if (videoPlayer && (chatShell || rightColumn)) {
      const chatElement = rightColumn || chatShell;

      // Walk up from video player to find common ancestor
      let ancestor = videoPlayer.parentElement;
      while (ancestor && ancestor !== document.body) {
        if (ancestor.contains(chatElement)) {
          // Found common ancestor, now find which direct children contain video vs chat
          for (const child of ancestor.children) {
            if (child.contains(videoPlayer) || child === videoPlayer) {
              videoContainer = child;
            }
            if (child.contains(chatElement) || child === chatElement) {
              chatContainer = child;
            }
          }
          // Only use this ancestor if video and chat are in DIFFERENT children
          if (videoContainer && chatContainer && videoContainer !== chatContainer) {
            commonParent = ancestor;
            break;
          }
          // Reset and keep searching up
          videoContainer = null;
          chatContainer = null;
        }
        ancestor = ancestor.parentElement;
      }
    }

    return {
      videoPlayer,
      chatShell,
      rightColumn: rightColumn || (chatShell ? chatShell.closest('[class*="right-column"]') : null),
      commonParent,
      videoContainer,
      chatContainer
    };
  }

  // Apply panorama layout by adding CSS classes
  function applyPanoramaLayout() {
    const elements = findLayoutElements();

    console.log('[Twitch Chat Panorama] Found elements:', {
      videoPlayer: !!elements.videoPlayer,
      chatShell: !!elements.chatShell,
      rightColumn: !!elements.rightColumn,
      commonParent: !!elements.commonParent,
      videoContainer: !!elements.videoContainer,
      chatContainer: !!elements.chatContainer
    });

    if (!elements.videoPlayer) {
      console.log('[Twitch Chat Panorama] No video player found - not on a stream page?');
      return false;
    }

    if (!elements.commonParent) {
      console.log('[Twitch Chat Panorama] Could not find parent container');
      return false;
    }

    // Add classes to the elements - CSS will handle the styling
    elements.commonParent.classList.add(CONTAINER_CLASS);

    if (elements.videoContainer) {
      elements.videoContainer.classList.add(VIDEO_CLASS);
    }

    if (elements.chatContainer) {
      elements.chatContainer.classList.add(CHAT_CLASS);
      // Force full width via inline styles to override Twitch's inline styles
      elements.chatContainer.style.setProperty('width', '100%', 'important');
      elements.chatContainer.style.setProperty('max-width', 'none', 'important');
      elements.chatContainer.style.setProperty('flex-grow', '1', 'important');
    }

    // Force full width on right-column and its children
    forceFullWidthOnChat();

    console.log('[Twitch Chat Panorama] Layout classes applied');
    console.log('[Twitch Chat Panorama] Container:', elements.commonParent.tagName, elements.commonParent.className);
    return true;
  }

  // Force full width on all chat-related elements
  function forceFullWidthOnChat() {
    const selectors = [
      '.right-column',
      '.right-column--collapsed',
      '.right-column--expanded',
      '.chat-shell',
      '.stream-chat',
      '.chat-room',
      '.tcp-chat-section',
      '.tcp-chat-section > *'
    ];

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        // Skip toggle-visibility elements
        if (el.classList.contains('right-column__toggle-visibility') ||
            el.className.includes('toggle-visibility')) {
          return;
        }
        el.style.setProperty('width', '100%', 'important');
        el.style.setProperty('max-width', 'none', 'important');
        el.style.setProperty('min-width', '0', 'important');
        el.style.setProperty('flex-grow', '1', 'important');
      });
    });

    // Remove the translateX transform from channel-root__right-column
    document.querySelectorAll('.channel-root__right-column, [class*="channel-root__right-column"]').forEach(el => {
      el.style.setProperty('transform', 'none', 'important');
      el.style.setProperty('transition', 'none', 'important');
    });

    // Hide the toggle-visibility element that covers the chat
    document.querySelectorAll('.right-column__toggle-visibility, [class*="toggle-visibility__right-column"]').forEach(el => {
      el.style.setProperty('display', 'none', 'important');
    });
  }

  // Remove panorama layout classes
  function removePanoramaLayout() {
    // Remove all our custom classes from the page
    document.querySelectorAll('.' + CONTAINER_CLASS).forEach(el => {
      el.classList.remove(CONTAINER_CLASS);
    });
    document.querySelectorAll('.' + VIDEO_CLASS).forEach(el => {
      el.classList.remove(VIDEO_CLASS);
    });
    document.querySelectorAll('.' + CHAT_CLASS).forEach(el => {
      el.classList.remove(CHAT_CLASS);
      el.style.removeProperty('width');
      el.style.removeProperty('max-width');
      el.style.removeProperty('flex-grow');
    });

    // Remove inline styles from chat elements
    const selectors = [
      '.right-column',
      '.right-column--collapsed',
      '.right-column--expanded',
      '[class*="right-column"]',
      '.chat-shell',
      '.stream-chat',
      '.chat-room'
    ];
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.style.removeProperty('width');
        el.style.removeProperty('max-width');
        el.style.removeProperty('min-width');
        el.style.removeProperty('flex-grow');
      });
    });

    // Remove transform override from channel-root__right-column
    document.querySelectorAll('.channel-root__right-column, [class*="channel-root__right-column"]').forEach(el => {
      el.style.removeProperty('transform');
      el.style.removeProperty('transition');
    });
  }

  // Apply or remove panorama mode
  function applyPanoramaMode(enabled) {
    isEnabled = enabled;

    if (enabled) {
      document.body.classList.add(PANORAMA_CLASS);
      // Also apply via JavaScript for reliability
      setTimeout(() => applyPanoramaLayout(), 100);
      setTimeout(() => applyPanoramaLayout(), 500);
      setTimeout(() => applyPanoramaLayout(), 1000);
    } else {
      document.body.classList.remove(PANORAMA_CLASS);
      removePanoramaLayout();
    }

    window.dispatchEvent(new CustomEvent('twitchChatPanoramaToggle', {
      detail: { enabled }
    }));
  }

  // Toggle panorama mode
  function toggle() {
    isEnabled = !isEnabled;
    saveState(isEnabled);
    applyPanoramaMode(isEnabled);
    return isEnabled;
  }

  // Watch for layout changes (Twitch is a SPA and rebuilds DOM)
  function watchForLayoutChanges() {
    if (layoutObserver) {
      layoutObserver.disconnect();
    }

    let debounceTimer = null;

    layoutObserver = new MutationObserver((mutations) => {
      if (isEnabled) {
        // Debounce to avoid excessive re-application
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const elements = findLayoutElements();
          // Check if we have elements and layout needs to be re-applied
          if (elements.commonParent && !elements.commonParent.classList.contains(CONTAINER_CLASS)) {
            console.log('[Twitch Chat Panorama] Re-applying layout after DOM change');
            applyPanoramaLayout();
          }
          // Always re-apply full width styles as Twitch may reset them
          forceFullWidthOnChat();
        }, 200);
      }
    });

    layoutObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }

  // Debug function to help identify structure
  function debugLayout() {
    const elements = findLayoutElements();
    console.log('[Twitch Chat Panorama] Debug Layout:');
    console.log('Video Player:', elements.videoPlayer);
    console.log('Chat Shell:', elements.chatShell);
    console.log('Right Column:', elements.rightColumn);
    console.log('Common Parent:', elements.commonParent);
    console.log('Video Container:', elements.videoContainer);
    console.log('Chat Container:', elements.chatContainer);

    if (elements.commonParent) {
      console.log('Common Parent tag:', elements.commonParent.tagName);
      console.log('Common Parent classes:', elements.commonParent.className);
      console.log('Common Parent computed display:', getComputedStyle(elements.commonParent).display);
      console.log('Common Parent computed flex-direction:', getComputedStyle(elements.commonParent).flexDirection);
      console.log('Common Parent children:', elements.commonParent.children.length);
      Array.from(elements.commonParent.children).forEach((child, i) => {
        const isVideo = child === elements.videoContainer ? ' [VIDEO]' : '';
        const isChat = child === elements.chatContainer ? ' [CHAT]' : '';
        console.log(`  Child ${i}${isVideo}${isChat}:`, child.tagName, child.className.substring(0, 60));
      });
    } else {
      console.log('Could not find common parent!');
      if (elements.videoPlayer) {
        console.log('Video player parent chain:');
        let p = elements.videoPlayer.parentElement;
        let depth = 0;
        while (p && p !== document.body && depth < 10) {
          console.log(`  ${depth}: ${p.tagName} - ${p.className.substring(0, 60)}`);
          p = p.parentElement;
          depth++;
        }
      }
    }

    return elements;
  }

  // Initialize the extension
  async function init() {
    // Wait for page to be more loaded
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Load saved state
    const savedState = await loadState();

    // Apply state
    applyPanoramaMode(savedState);

    // Watch for layout changes
    watchForLayoutChanges();

    // Watch for page navigation (Twitch is a SPA)
    let lastUrl = location.href;
    const urlObserver = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        // Re-apply on navigation
        setTimeout(() => {
          if (isEnabled) {
            applyPanoramaMode(true);
          }
        }, 1000);
      }
    });

    urlObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Listen for messages from popup
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'toggle') {
          const newState = toggle();
          sendResponse({ enabled: newState });
        } else if (request.action === 'getState') {
          sendResponse({ enabled: isEnabled });
        } else if (request.action === 'debug') {
          const elements = debugLayout();
          sendResponse({ elements: !!elements.commonParent });
        }
        return true;
      });
    } else if (typeof browser !== 'undefined' && browser.runtime) {
      browser.runtime.onMessage.addListener((request) => {
        if (request.action === 'toggle') {
          const newState = toggle();
          return Promise.resolve({ enabled: newState });
        } else if (request.action === 'getState') {
          return Promise.resolve({ enabled: isEnabled });
        } else if (request.action === 'debug') {
          const elements = debugLayout();
          return Promise.resolve({ elements: !!elements.commonParent });
        }
      });
    }

    console.log('[Twitch Chat Panorama] Extension initialized');
  }

  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose functions globally for debugging
  window.twitchChatPanorama = {
    toggle,
    debug: debugLayout,
    apply: applyPanoramaLayout,
    remove: removePanoramaLayout,
    get enabled() { return isEnabled; }
  };
})();
