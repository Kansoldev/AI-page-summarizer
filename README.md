# AI Page Summarizer Chrome Extension

A lightweight Chrome extension that summarizes web pages using AI while running locally on the user’s machine for speed, privacy, and control.

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Kansoldev/AI-page-summarizer
```

Alternatively, you can download the repo from GitHub directly, and extract the zip folder using your extractor of choice

### 2. Load The Extension in Chrome

1. Open Chrome and go to: **chrome://extensions**
2. Enable **Developer Mode** (top right)
3. Click **Load unpacked**
4. Select the project folder

### 3. Pin the extension

Open up your chrome extensios menu, and pin the extension as part of your extensions

### 4. Run the extension

Navigate to any article page (dev.to, hashnode, medium etc), click the extension and click on the **Summarize this page** button to summarize the page content

---

## Architecture Explanation

The extension follows a simple modular architecture:

### 1. Content Script

- Injected into web pages
- Extracts readable text from the DOM
- Sends content to the service worker (`service-worker.js`)

### 2. Background Script (Service Worker)

- Acts as the central controller
- Handles API requests
- Manages communication between components

### 3. Popup UI

- Triggered when the user clicks the extension icon
- Displays summarized content
- Sends user actions (e.g. "Extract page content") to the background script

### 4. Popup JS

- This triggers any functionality that runs when the popup is displayed as the user clicks on the popup

---

## AI Integration Explanation

The extension integrates with the Gemini AI model (specifically gemini 2.5 flash) to generate summaries.

### Flow:

1. Extract page content (cleaned text)
2. Trim or chunk content to fit token limits
3. Send request to AI API with a prompt like:
   ```
   "Summarize this content in 3–5 bullet points:"
   ```
4. Receive and format response
5. Display result in popup UI

### Key Considerations:

- **Token limits** — Long pages may require chunking
- **Prompt design** — Directly affects summary quality
- **Latency** — Minimized by local processing + efficient requests

---

## Security Decisions

Security was a core design priority:

### 1. API Key Protection

- API keys are **never exposed in the frontend**
  The API key that connects to the GEMINI API is hosted on a server on render to protect against unrestricted access

### 2. Minimal Permissions

- Uses only required Chrome permissions (e.g. `activeTab`, `scripting`)
- Avoids broad host permissions

### 3. Data Privacy

- Page content is only processed when user explicitly triggers summarization
- No background tracking or automatic scraping

### 4. Request Control

- All API calls are routed through a controlled layer (background or backend)
- Prevents abuse and unauthorized usage

---

## Trade-offs

### 1. Local vs Remote Processing

**Choice:** Remote processing

- ✅ Better privacy and control
- ❌ Slightly more complex setup

### 2. API Key Handling

**Choice:** Avoid embedding keys in client

- ✅ More secure
- ❌ Requires backend or extra configuration

---

### 3. Performance vs Accuracy

**Choice:** Limit input size for faster responses

- ✅ Faster summaries
- ❌ May lose some context on very long pages

---

### 4. Simplicity vs Scalability

**Choice:** Lightweight architecture

- ✅ Easy to understand and maintain
- ❌ Not optimized for large-scale multi-user systems
