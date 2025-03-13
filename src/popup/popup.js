document.addEventListener('DOMContentLoaded', function() {
  const navbarToggle = document.getElementById('navbar-toggle');
  const saveMessage = document.querySelector('.save-message');
  const togglesContainer = document.getElementById('togglesContainer');
  
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
          toggleContainer.innerHTML = `
            <span class="site-label">${site.label}</span>
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
    chrome.storage.sync.get(['navbarSites', 'showNavbar'], function(data) {
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
    }, function() {
      // Show save confirmation message
      saveMessage.classList.add('visible');
      setTimeout(() => {
        saveMessage.classList.remove('visible');
      }, 2000);
      
      // First update the current active tab to see changes immediately
      chrome.tabs.query({active: true, currentWindow: true}, function(activeTabs) {
        const activeTab = activeTabs[0];
        if (activeTab && (activeTab.url.includes('itu.edu.tr') || 
            activeTab.url.includes('ari24.com') || 
            activeTab.url.includes('notkutusu.com'))) {
          console.log("Sending updateNavbar message to active tab:", activeTab.id);
          chrome.tabs.sendMessage(activeTab.id, { 
            action: "updateNavbar",
            immediate: true,
            settings: {navbarSites, showNavbar: navbarToggle.checked}
          }).then(response => {
            console.log("Response from active tab:", response);
          }).catch(error => {
            console.error("Error updating active tab:", error);
          });
        } else {
          console.log("Active tab not eligible for navbar update");
        }
        
        // Then update all other tabs
        chrome.tabs.query({}, function(tabs) {
          tabs.forEach(tab => {
            // Skip the active tab as we've already updated it
            if (activeTab && tab.id === activeTab.id) return;
            
            if (tab.url && (tab.url.includes('itu.edu.tr') || 
                tab.url.includes('ari24.com') || 
                tab.url.includes('notkutusu.com'))) {
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
});
