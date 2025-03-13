// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log("Message received in content script:", message);
  
  if (message.action === "updateNavbar") {
    console.log("Updating navbar without refresh");
    
    // If settings are provided in the message, use them directly
    if (message.settings) {
      console.log("Using settings from message:", message.settings);
      if (typeof updateITUNavbar === 'function') {
        updateITUNavbar(message.settings);
        sendResponse({success: true, message: "Navbar updated with provided settings"});
      } else {
        console.log("updateITUNavbar function not found");
        sendResponse({success: false, message: "updateITUNavbar function not found"});
      }
    } else {
      // Otherwise get settings from storage
      chrome.storage.sync.get(['navbarSites', 'showNavbar'], function(data) {
        console.log("Navbar settings retrieved from storage:", data);
        
        if (typeof updateITUNavbar === 'function') {
          console.log("Calling updateITUNavbar function");
          updateITUNavbar(data);
          sendResponse({success: true, message: "Navbar updated with storage settings"});
        } else {
          console.log("updateITUNavbar function not found, no reload will happen");
          sendResponse({success: false, message: "updateITUNavbar function not found"});
        }
      });
    }
    
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
