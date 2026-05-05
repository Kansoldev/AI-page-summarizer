let tab;
let extractedContent;
let response;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "EXTRACT_CONTENT") return false;

  const data = extractPageContent();
  sendResponse(data);

  return true; // keeps the message channel open for async use
});

function extractPageContent() {
  /**
   * Candidate selectors to get the main article content
   * This is not exhaustive but covers many common patterns.
   * The script will try these in order and use the first one that matches.
   */

  const CONTENT_SELECTORS = [
    "article",
    '[role="article"]',
    ".article-body",
    ".post-body",
    ".post-content",
    ".entry-content",
    ".content-body",
    "#article-body",
    "#post-body",
    "main",
    ".prose",
  ];

  /**
   * Selectors to strip from extracted content.
   * These are common "noise" elements that are often present in articles but not part of the main text.
   */
  const NOISE_SELECTORS = [
    "nav",
    "header",
    "footer",
    "aside",
    ".comments",
    "#comments",
    ".comment-section",
    ".sidebar",
    ".advertisement",
    ".ad",
    ".promo",
    "script",
    "style",
    "noscript",
    ".related-posts",
    ".recommended",
    '[role="complementary"]',
    '[role="navigation"]',
    ".newsletter-signup",
    ".social-share",
  ];

  function getTextFromEl(el) {
    // Clone so we don't mutate the page
    const clone = el.cloneNode(true);

    // Remove noise nodes
    NOISE_SELECTORS.forEach((sel) => {
      clone.querySelectorAll(sel).forEach((n) => n.remove());
    });

    return clone.innerText || clone.textContent || "";
  }

  // 1. Try structured selectors
  let bodyEl = null;

  for (const sel of CONTENT_SELECTORS) {
    const el = document.querySelector(sel);

    if (el) {
      bodyEl = el;
      break;
    }
  }

  // 2. Fallback: largest text block heuristic
  if (!bodyEl) {
    const candidates = Array.from(document.querySelectorAll("div, section"));

    bodyEl = candidates.reduce((best, el) => {
      const len = (el.innerText || el.textContent || "").trim().length;

      return len >
        ((best?.innerText || best?.textContent || "").trim().length || 0)
        ? el
        : best;
    }, null);
  }

  const rawText = bodyEl
    ? getTextFromEl(bodyEl)
    : document.body.innerText || "";

  // Normalise whitespace
  const text = rawText
    .replace(/\t/g, " ")
    .replace(/[ ]{3,}/g, "  ")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();

  // Extract title
  const title =
    document.querySelector("h1")?.textContent?.trim() ||
    document.querySelector('meta[property="og:title"]')?.content ||
    document.title ||
    "";

  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  return { title, text, wordCount };
}
