const API_URL = "http://localhost:8000/summarize";

// Rough average adult reading speed (WPM – words per minute).
const WPM = 238;

/*
  Maximum amount of article text to send to the API.
  This helps to keep prompt tokens manageable while preserving full meaning.
*/
const MAX_CONTENT_CHARS = 12000;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "SUMMARIZE") return false;

  handleSummarize(message.payload)
    .then((data) => sendResponse({ data }))
    .catch((err) => sendResponse({ error: err.message || "Unknown error" }));

  // Must return true to keep the message channel open for async response
  return true;
});

async function handleSummarize(payload) {
  const { title = "", text = "", wordCount = 0 } = payload;

  if (!text || wordCount < 50) {
    throw new Error("Article content is too short to summarise.");
  }

  // Truncate gracefully at sentence boundary if needed
  const contentSnippet = truncateAtSentence(text, MAX_CONTENT_CHARS);

  // Estimate reading time for the full article
  const readingTime = Math.max(1, Math.round(wordCount / WPM));

  // Call the AI
  const aiResult = await callGeminiAPI(title, contentSnippet);

  // Merge computed fields
  return { ...aiResult, title, readingTime };
}

async function callGeminiAPI(title, content) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, content }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const detail = errBody?.error?.message || response.statusText;

    if (response.status === 500)
      throw new Error("Error occured generating summary. Try again later.");

    throw new Error(`API error ${response.status}: ${detail}`);
  }

  const data = await response.json();

  return parseAIResponse(data || "");
}

function truncateAtSentence(text, maxChars) {
  if (text.length <= maxChars) return text;

  const slice = text.slice(0, maxChars);

  // Find last sentence-ending punctuation
  const lastPeriod = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
  );

  return lastPeriod > maxChars * 0.7 ? slice.slice(0, lastPeriod + 1) : slice;
}

function parseAIResponse(data) {
  let parsed;
  parsed = JSON.parse(data.result || {});

  return {
    summary: parsed.summary || [],
    insights: parsed.insights || [],
  };
}
