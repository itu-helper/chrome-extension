document.addEventListener('DOMContentLoaded', function () {
  const navbarToggle = document.getElementById('navbar-toggle');
  const saveMessage = document.querySelector('.save-message');
  const togglesContainer = document.getElementById('togglesContainer');

  // Helper to check if a given URL belongs to one of the known ITU sites
  // Falls back to the previous hardcoded domain substrings if `window.ITU_SITES` is not available
  function isRelevantSiteUrl(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url);

      if (window.ITU_SITES && typeof window.ITU_SITES.getAllSites === 'function') {
        const sites = window.ITU_SITES.getAllSites().filter(s => !s.isSeparator);
        for (const site of sites) {
          if (!site || !site.url) continue;
          try {
            const siteParsed = new URL(site.url);
            if (parsed.hostname === siteParsed.hostname) return true;
          } catch (e) {
            // If site.url isn't a full URL, fall back to substring check
          }

          // Also allow exact prefix matches (some site URLs include paths)
          if (url.startsWith(site.url)) return true;
          // Last resort: substring match for legacy support
          if (url.includes(site.url)) return true;
        }
        return false;
      }

      // Fallback to legacy hardcoded checks
      return url.includes('itu.edu.tr');
    } catch (e) {
      // Not a valid URL (e.g. chrome://). Use substring fallback
      return url.includes('itu.edu.tr');
    }
  }

  // Function to generate toggles for all sites
  function generateToggles() {
    if (window.ITU_SITES) {
      const allSites = window.ITU_SITES.getAllSites();

      allSites.forEach(site => {
        if (site.isSeparator) {
          // Create a separator element
          const separator = document.createElement('hr');
          separator.className = 'sites-separator';
          separator.dataset.type = 'separator';
          togglesContainer.appendChild(separator);
        } else {
          const toggleContainer = document.createElement('div');
          toggleContainer.className = 'toggle-container';

          // Build inner markup including the site's icon (if present)
          const iconHtml = site.icon ? `<span class="site-icon"><i class="${site.icon}"></i></span>` : '';

          toggleContainer.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
              ${iconHtml}
              <span class="site-label">${site.label}</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" class="site-toggle" data-url="${site.url}" ${site.hidden ? '' : 'checked'}>
              <span class="slider"></span>
            </label>
          `;

          togglesContainer.appendChild(toggleContainer);
        }
      });

      // After creating toggles, load saved preferences
      const siteToggles = document.querySelectorAll('.site-toggle');
      loadPreferences(siteToggles);

      // Add event listeners
      siteToggles.forEach(toggle => {
        toggle.addEventListener('change', savePreferences);
      });
    } else {
      // If ITU_SITES is not available, use the hardcoded toggles
      loadPreferences(document.querySelectorAll('.site-toggle'));
    }
  }

  // Load saved preferences
  function loadPreferences(siteToggles) {
    chrome.storage.sync.get(['navbarSites', 'showNavbar'], function (data) {
      // Get default settings if no saved preferences
      const defaultSettings = window.ITU_SITES ?
        window.ITU_SITES.getDefaultSettings() : {};

      // Use saved preferences if available, otherwise use defaults
      const siteSettings = data.navbarSites || defaultSettings;

      // Set toggle states based on settings
      siteToggles.forEach(toggle => {
        const url = toggle.dataset.url;
        // Check the URL in the saved settings
        // Default to shown unless explicitly marked as hidden
        toggle.checked = siteSettings[url] !== false;
      });

      // Set master toggle state
      if (data.showNavbar !== undefined) {
        navbarToggle.checked = data.showNavbar;
      }
    });
  }

  // Add event listener to navbar toggle
  navbarToggle.addEventListener('change', savePreferences);

  // Function to save preferences
  function savePreferences() {
    // Get the latest toggle elements
    const siteToggles = document.querySelectorAll('.site-toggle');

    // Collect site preferences
    const navbarSites = {};
    siteToggles.forEach(toggle => {
      const url = toggle.dataset.url;
      navbarSites[url] = toggle.checked;
    });

    // Save preferences to Chrome storage
    chrome.storage.sync.set({
      navbarSites: navbarSites,
      showNavbar: navbarToggle.checked
    }, function () {
      // Show save confirmation message
      saveMessage.classList.add('visible');
      setTimeout(() => {
        saveMessage.classList.remove('visible');
      }, 2000);

      // First update the current active tab to see changes immediately
      chrome.tabs.query({ active: true, currentWindow: true }, function (activeTabs) {
        const activeTab = activeTabs[0];
        if (activeTab && isRelevantSiteUrl(activeTab.url)) {
          console.log("Sending updateNavbar message to active tab:", activeTab.id);
          chrome.tabs.sendMessage(activeTab.id, {
            action: "updateNavbar",
            immediate: true,
            settings: { navbarSites, showNavbar: navbarToggle.checked }
          }).then(response => {
            console.log("Response from active tab:", response);
          }).catch(error => {
            console.error("Error updating active tab:", error);
          });
        } else {
          console.log("Active tab not eligible for navbar update");
        }

        // Then update all other tabs
        chrome.tabs.query({}, function (tabs) {
          tabs.forEach(tab => {
            // Skip the active tab as we've already updated it
            if (activeTab && tab.id === activeTab.id) return;

        if (tab.url && isRelevantSiteUrl(tab.url)) {
              console.log("Sending updateNavbar message to tab:", tab.id);
              chrome.tabs.sendMessage(tab.id, { action: "updateNavbar" })
                .catch(error => {
                  console.error("Error updating tab:", tab.id, error);
                });
            }
          });
        });
      });
    });
  }

  // Initialize toggles
  if (togglesContainer.children.length === 0) {
    generateToggles();
  } else {
    // If toggles already exist in HTML, just load preferences
    loadPreferences(document.querySelectorAll('.site-toggle'));

    // Add event listeners to existing toggles
    document.querySelectorAll('.site-toggle').forEach(toggle => {
      toggle.addEventListener('change', savePreferences);
    });
  }

  // Add handler for constant navbar toggle
  const constantNavbarToggle = document.getElementById('constant-navbar-toggle');

  // Initialize toggle state from storage
  chrome.storage.sync.get(['constantNavbar'], function (data) {
    constantNavbarToggle.checked = data.constantNavbar === true;
  });

  // Add event listener for toggle changes
  constantNavbarToggle.addEventListener('change', function () {
    chrome.storage.sync.set({ constantNavbar: this.checked });

    // Send message to content script to update navbar behavior
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "toggleConstantNavbar",
          constant: constantNavbarToggle.checked
        });
      }
    });

    // If we're toggling across all tabs, update other tabs too
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(tab => {
        if (tab.url && isRelevantSiteUrl(tab.url)) {
          chrome.tabs.sendMessage(tab.id, {
            action: "toggleConstantNavbar",
            constant: constantNavbarToggle.checked
          }).catch(error => {
            // Silently catch errors for tabs that may not have the content script
          });
        }
      });
    });

    // Show saved message
    showSavedMessage();
  });

  // Function to show saved message
  function showSavedMessage() {
    const saveMessage = document.querySelector('.save-message');
    saveMessage.classList.add('visible');

    setTimeout(function () {
      saveMessage.classList.remove('visible');
    }, 2000);
  }
  
  // Add event listener for the feedback button
  const feedbackButton = document.getElementById('feedback-button');
  if (feedbackButton) {
    feedbackButton.addEventListener('click', function() {
      chrome.tabs.create({ url: 'https://github.com/itu-helper/chrome-extension/issues/new' });
    });
  }

  // Add event listener for the reset defaults button
  const resetDefaultsButton = document.getElementById('reset-defaults-btn');
  if (resetDefaultsButton) {
    resetDefaultsButton.addEventListener('click', function () {
      // Get default settings from ITU_SITES if available
      const defaultSettings = window.ITU_SITES ? window.ITU_SITES.getDefaultSettings() : {};

      // Save default settings into storage. Also reset constantNavbar and showNavbar to defaults
      const defaultShowNavbar = true;
      const defaultConstantNavbar = false;

      chrome.storage.sync.set({
        navbarSites: defaultSettings,
        showNavbar: defaultShowNavbar,
        constantNavbar: defaultConstantNavbar
      }, function () {
        // Update the UI toggles to reflect defaults
        const siteToggles = document.querySelectorAll('.site-toggle');
        siteToggles.forEach(toggle => {
          const url = toggle.dataset.url;
          toggle.checked = defaultSettings[url] !== false;
        });

        // Update master navbar toggle
        const navbarToggleEl = document.getElementById('navbar-toggle');
        if (navbarToggleEl) navbarToggleEl.checked = defaultShowNavbar;

        // Update constant navbar toggle
        const constantNavbarToggleEl = document.getElementById('constant-navbar-toggle');
        if (constantNavbarToggleEl) constantNavbarToggleEl.checked = defaultConstantNavbar;

        // Show saved message
        showSavedMessage();

        // Notify active tab first for immediate update, then other tabs
        chrome.tabs.query({ active: true, currentWindow: true }, function (activeTabs) {
          const activeTab = activeTabs[0];
      if (activeTab && activeTab.url && isRelevantSiteUrl(activeTab.url)) {
            chrome.tabs.sendMessage(activeTab.id, {
              action: 'updateNavbar',
              immediate: true,
              settings: { navbarSites: defaultSettings, showNavbar: defaultShowNavbar }
            }).catch(() => { /* ignore */ });
          }

          // Notify other tabs
          chrome.tabs.query({}, function (tabs) {
            tabs.forEach(tab => {
              if (activeTab && tab.id === activeTab.id) return;
              if (tab.url && isRelevantSiteUrl(tab.url)) {
                chrome.tabs.sendMessage(tab.id, {
                  action: 'updateNavbar'
                }).catch(() => { /* ignore */ });
              }
            });
          });
        });
      });
    });
  }
});
