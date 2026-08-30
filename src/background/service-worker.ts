chrome.runtime.onInstalled.addListener((details) => {
  console.log('[TrackMark Looper] Extension installed/updated:', details.reason);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'PONG', timestamp: Date.now() });
    return true;
  }
  return false;
});
