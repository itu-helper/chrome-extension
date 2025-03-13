// This script controls the visibility of navbar items based on user preferences

(function() {
  // Function to update the navbar based on saved preferences
  function updateNavbar() {
    chrome.storage.sync.get(['navbarSites', 'showNavbar'], function(data) {
      // Check if navbar should be shown at all
      const navbar = document.querySelector('#itu-navbar');
      if (!navbar) return;
      
      // Get default settings if available
      const defaultSettings = window.ITU_SITES ? 
                             window.ITU_SITES.getDefaultSettings() : {};
      
      // Use saved preferences if available, otherwise use defaults
      const siteSettings = data.navbarSites || defaultSettings;
      
      // Master toggle check
      if (data.showNavbar === false) {
        navbar.style.display = 'none';
        // Also hide the buffer
        const buffer = document.querySelector('#itu-navbar-buffer');
        if (buffer) buffer.style.display = 'none';
        
        // Remove body padding when navbar is hidden
        document.body.style.paddingTop = '0';
        return;
      } else {
        navbar.style.display = '';
        // Show the buffer
        const buffer = document.querySelector('#itu-navbar-buffer');
        if (buffer) buffer.style.display = '';
        
        // Restore body padding when navbar is shown
        setTimeout(() => {
          const exactHeight = navbar.offsetHeight;
          document.body.style.paddingTop = exactHeight + 'px';
        }, 50);
      }
      
      // Update individual site links
      const navLinks = navbar.querySelectorAll('a');
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        // Try to find a match in the settings or in site data
        let shouldShow = true;
        
        if (window.ITU_SITES) {
          // Try to find the matching site in our data
          const site = window.ITU_SITES.getSiteByUrl(href);
          if (site) {
            // Check user preferences first, then fall back to default
            if (siteSettings[site.url] === false) {
              shouldShow = false;
            }
          }
        } else {
          // Without ITU_SITES data, just check the URL directly against settings
          for (const url in siteSettings) {
            // Use a more flexible matching approach
            const normalizedHref = href.endsWith('/') ? href.slice(0, -1) : href;
            const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
            
            if (normalizedHref === normalizedUrl || 
                normalizedHref.startsWith(normalizedUrl + '/') ||
                normalizedUrl.startsWith(normalizedHref + '/') ||
                (normalizedHref.includes(new URL(normalizedUrl).hostname))) {
              // Found a match in settings
              if (siteSettings[url] === false) {
                shouldShow = false;
              }
              break;
            }
          }
        }
        
        // Apply visibility setting
        link.style.display = shouldShow ? '' : 'none';
      });
    });
  }
  
  // Update navbar when page loads
  // Wait for the navbar to be created
  const checkForNavbar = setInterval(() => {
    const navbar = document.querySelector('#itu-navbar');
    if (navbar) {
      clearInterval(checkForNavbar);
      updateNavbar();
    }
  }, 100);
  
  // Listen for changes to preferences
  chrome.storage.onChanged.addListener(function(changes) {
    if (changes.navbarSites || changes.showNavbar) {
      updateNavbar();
    }
  });
  
  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "updateNavbar") {
      updateNavbar();
      sendResponse({ success: true });
    }
    return true; // Keep the message channel open for async response
  });
})();
