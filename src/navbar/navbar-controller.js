// This script controls the visibility of navbar items based on user preferences

(function () {
  // Function to update the navbar based on saved preferences
  function updateNavbar() {
    chrome.storage.sync.get(['navbarSites', 'showNavbar'], function (data) {
      // If updateITUNavbar is defined (from content.js), use it directly
      if (typeof window.updateITUNavbar === 'function') {
        window.updateITUNavbar(data);
        return;
      }

      // Legacy update approach for backwards compatibility
      const navbar = document.querySelector('#itu-navbar');
      if (!navbar) return;

      // Get default settings if available
      const defaultSettings = window.ITU_SITES ?
        window.ITU_SITES.getDefaultSettings() : {};

      // Use saved preferences if available, otherwise use defaults
      const siteSettings = data.navbarSites || defaultSettings;

      // Master toggle check
      const buffer = document.querySelector('#itu-navbar-buffer');
      if (data.showNavbar === false) {
        navbar.style.display = 'none';
        // Collapse buffer (buffer provides spacing)
        if (buffer) {
          buffer.style.setProperty('height', '0', 'important');
          buffer.style.setProperty('display', 'none', 'important');
        }

        // Clear any body padding left by compatibility CSS
        document.body.style.setProperty('padding-top', '0', 'important');
        return;
      } else {
        navbar.style.display = '';
        // Show the buffer and set its height to the navbar height
        if (buffer) buffer.style.removeProperty('display');

        setTimeout(() => {
          const exactHeight = navbar.offsetHeight || 50;
          if (buffer) buffer.style.setProperty('height', exactHeight + 'px', 'important');
          // Ensure body padding is cleared to avoid double spacing
          document.body.style.setProperty('padding-top', '0', 'important');
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
  chrome.storage.onChanged.addListener(function (changes) {
    if (changes.navbarSites || changes.showNavbar) {
      updateNavbar();
    }
  });

  // We don't need to add another message listener here as content.js already has one
})();
