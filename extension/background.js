const FOCUS_STYLE_ID = "skpine-focus-style";
const ALLOWED_DOMAINS = ["shopping.naver.com"];
const SKU_PINE_BASE_URL = "https://skupine.ai/search";

function toggleFocusMode() {
  const style = document.getElementById(FOCUS_STYLE_ID);
  if (style) {
    style.remove();
    document.documentElement.classList.remove("skpine-focus");
    return "focus-off";
  }

  const styleEl = document.createElement("style");
  styleEl.id = FOCUS_STYLE_ID;
  styleEl.textContent = `
    .skpine-focus *:not(video):not(img) {
      transition: filter 0.2s ease, opacity 0.2s ease;
    }
    .skpine-focus main,
    .skpine-focus article,
    .skpine-focus [role='main'] {
      opacity: 1;
      filter: none;
    }
    .skpine-focus body > *:not(main):not(article):not([role='main']) {
      opacity: 0.35;
      filter: blur(2px);
    }
  `;
  document.head.appendChild(styleEl);
  document.documentElement.classList.add("skpine-focus");
  return "focus-on";
}

function isAllowedUrl(url) {
  if (!url || !url.startsWith("http")) {
    return false;
  }

  const urlObj = new URL(url);
  return ALLOWED_DOMAINS.some(
    (domain) => urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
  );
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "toggle-focus") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      const tabUrl = tabs[0]?.url;
      if (!tabId) {
        sendResponse({ status: "no-tab" });
        return;
      }

      if (!isAllowedUrl(tabUrl)) {
        sendResponse({ status: "not-allowed" });
        return;
      }

      chrome.scripting.executeScript(
        {
          target: { tabId },
          func: toggleFocusMode
        },
        (results) => {
          const result = results?.[0]?.result ?? "unknown";
          sendResponse({ status: result });
        }
      );
    });
    return true;
  }

  if (message?.type === "analyze-product") {
    const payload = message?.payload;
    if (!payload?.name) {
      sendResponse({ status: "missing-data" });
      return false;
    }

    const searchParams = new URLSearchParams();
    searchParams.set("name", payload.name);
    if (payload.price) {
      searchParams.set("price", payload.price);
    }
    if (payload.images?.length) {
      searchParams.set("images", payload.images.join(","));
    }
    if (payload.sourceUrl) {
      searchParams.set("source", payload.sourceUrl);
    }

    chrome.tabs.create({ url: `${SKU_PINE_BASE_URL}?${searchParams.toString()}` }, () => {
      sendResponse({ status: "opened" });
    });
    return true;
  }
});
