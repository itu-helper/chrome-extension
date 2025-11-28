chrome.runtime.onInstalled.addListener((details) => {
    console.log("Extension installed!");
    
    // Open onboarding page only on first install
    if (details.reason === 'install') {
        chrome.tabs.create({
            url: chrome.runtime.getURL('src/onboarding/onboarding.html')
        });
    }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'pdfDetected' && sender.tab) {
        // Set badge to indicate PDF mode
        chrome.action.setBadgeText({ text: 'PDF', tabId: sender.tab.id });
        chrome.action.setBadgeBackgroundColor({ color: '#c99208', tabId: sender.tab.id });
        
        // Store that this tab is showing a PDF
        chrome.storage.session.set({ [`pdfTab_${sender.tab.id}`]: true });
    }
    return true;
});

// Clear PDF state when tab is updated or closed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading') {
        // Clear badge when navigating away
        chrome.action.setBadgeText({ text: '', tabId: tabId });
        chrome.storage.session.remove(`pdfTab_${tabId}`);
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.session.remove(`pdfTab_${tabId}`);
});
