// scripts/background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchHtml') {
        fetch(request.url)
            .then(res => res.text())
            .then(html => sendResponse({ success: true, html }))
            .catch(err => sendResponse({ success: false, error: err.message }));

        return true;
    }
});