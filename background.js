chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { expertise, format, cells } = message;

  // For now, just log the received notebook cells
  console.log("Received notebook data:", { expertise, format, cells });

  // You can now:
  // - Summarize
  // - Classify
  // - Send to an AI API (e.g., OpenAI, local model)
});
