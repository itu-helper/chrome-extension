chrome.runtime.onInstalled.addListener((details) => {
    console.log("Extension installed!");
    
    // Open onboarding page only on first install
    if (details.reason === 'install') {
        chrome.tabs.create({
            url: chrome.runtime.getURL('src/onboarding/onboarding.html')
        });
    }
});
