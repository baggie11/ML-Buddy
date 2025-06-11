chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getSelection") {
    const selection = window.getSelection().toString();
    sendResponse({ selection });
  } else if (msg.action === "getPageContent") {
    const bodyText = document.body.innerText;
    sendResponse({ content: bodyText });
  }
});
