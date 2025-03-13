// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log("Message received in content script:", message);
  
  if (message.action === "updateNavbar") {
    console.log("Updating navbar without refresh");
    
    // Get the current settings from storage
    chrome.storage.sync.get(['navbarSites', 'showNavbar'], function(data) {
      console.log("Navbar settings retrieved:", data);
      
      // If we have a global update function defined, use it
      if (typeof updateITUNavbar === 'function') {
        console.log("Calling updateITUNavbar function");
        updateITUNavbar(data);
      } else {
        console.log("updateITUNavbar function not found, reloading page");
        // If no update function is available, reload the page
        window.location.reload();
      }
    });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
});

// Function that the main content script should call to expose the navbar updater
function initNavbarUpdater(updateFunction) {
  console.log("Navbar updater initialized");
  window.updateITUNavbar = updateFunction;
}

// Export the initializer if using modules
if (typeof module !== 'undefined') {
  module.exports = { initNavbarUpdater };
}

// Add this to the global scope
window.initNavbarUpdater = initNavbarUpdater;

// Use local Font Awesome styles:
const fontAwesomeStyle = document.createElement('link');
fontAwesomeStyle.rel = 'stylesheet';
fontAwesomeStyle.href = chrome.runtime.getURL('assets/fontawesome/css/all.min.css');
document.head.appendChild(fontAwesomeStyle);

// Add this to your content script where you initialize the navbar:

// Function to update the navbar without page reload
function updateITUNavbar(settings) {
  // Your logic to rebuild or update the navbar with new settings
  // For example:
  const navbar = document.getElementById('itu-helper-navbar');
  if (navbar) {
    // Remove existing navbar
    navbar.remove();
  }
  
  // Then rebuild it with new settings
  buildITUNavbar(settings);
}

// Register the updater function
if (typeof window.initNavbarUpdater === 'function') {
  window.initNavbarUpdater(updateITUNavbar);
} else {
  window.updateITUNavbar = updateITUNavbar;
}