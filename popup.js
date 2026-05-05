const summarizeBtn = document.querySelector("#summarize-btn");
const clearBtn = document.querySelector("#clear");
const summaryEl = document.querySelector("#summary-list");
const insightsEl = document.querySelector("#insights-list");
const readingTimeEl = document.querySelector("#reading-time");
const loadingState = document.querySelector("#loadingState");
const resultsState = document.querySelector("#results-state");
const idleState = document.querySelector("#idle-state");
const articleTitleEl = document.querySelector("#article-title");
const errorStateEl = document.querySelector("#error-state");
let extractedContent;
let response;

// Send message to content script to run a summary of the page content when the button is clicked
summarizeBtn.addEventListener("click", summarizePage);
clearBtn.addEventListener("click", clearResults);

async function summarizePage() {
  loadingState.style.display = "block";

  if (errorStateEl.style.display === "block") {
    errorStateEl.style.display = "none";
  }

  // Get the users current active tab to run the content extraction script
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab?.id) {
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: "EXTRACT_CONTENT",
      });

      extractedContent = response;
    } else {
      console.error("No active tab found.");
    }
  } catch (err) {
    idleState.style = "display: none";
    loadingState.style.display = "none";
    errorStateEl.style.display = "block";
    console.error("Error querying active tab:", err);
    return false;
  }

  // Send the extracted content to the service worker for AI call
  try {
    response = await chrome.runtime.sendMessage({
      type: "SUMMARIZE",
      payload: extractedContent,
    });

    console.log(response);
  } catch (err) {
    idleState.style = "display: none";
    loadingState.style.display = "none";
    errorStateEl.style.display = "block";
    console.error("Error querying active tab:", err);
    return;
  }

  // Parse results from the service worker and update the popup UI
  renderResults(response.data);
}

function renderResults(data) {
  idleState.style.display = "none";

  if (!data) {
    loadingState.style.display = "none";
    errorStateEl.style.display = "block";
    return;
  }

  data.summary.forEach((summary) => {
    let bullet = document.createElement("li");
    bullet.textContent = summary;
    summaryEl.appendChild(bullet);
  });

  data.insights.forEach((insight) => {
    let bullet = document.createElement("li");
    bullet.textContent = insight;
    insightsEl.appendChild(bullet);
  });

  articleTitleEl.textContent = data.title || "";
  readingTimeEl.textContent = `${data.readingTime} mins`;

  resultsState.style.display = "block";
  loadingState.style.display = "none";
  summarizeBtn.disabled = true;
  summarizeBtn.style = "cursor: not-allowed";
}

function clearResults() {
  summaryEl.innerHTML = "";
  insightsEl.innerHTML = "";
  readingTimeEl.textContent = "";
  summarizeBtn.disabled = false;
  summarizeBtn.style = "cursor: pointer";
  idleState.style = "display: block";
  resultsState.style.display = "none";
  errorStateEl.style.display = "none";
}
