const statusEl = document.getElementById("status");
const noteInput = document.getElementById("quick-note");
const toggleButton = document.getElementById("toggle-focus");
const analyzeButton = document.getElementById("analyze-product");
const saveButton = document.getElementById("save-note");
const allowedDomains = ["shopping.naver.com", "brand.naver.com"];

function setStatus(message) {
  statusEl.textContent = message;
}

function isAllowedUrl(url) {
  if (!url || !url.startsWith("http")) {
    return false;
  }

  const urlObj = new URL(url);
  return allowedDomains.some(
    (domain) => urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
  );
}

function updateToggleState() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabUrl = tabs[0]?.url;
    if (!isAllowedUrl(tabUrl)) {
      toggleButton.disabled = true;
      analyzeButton.disabled = true;
      setStatus("네이버 쇼핑/브랜드 상세 페이지에서만 사용할 수 있어요.");
      return;
    }

    toggleButton.disabled = false;
    analyzeButton.disabled = false;
    setStatus("");
  });
}

chrome.storage.local.get(["skpineNote"], (result) => {
  if (result?.skpineNote) {
    noteInput.value = result.skpineNote;
  }
});

updateToggleState();

toggleButton.addEventListener("click", () => {
  setStatus("집중 모드를 전환 중...");
  chrome.runtime.sendMessage({ type: "toggle-focus" }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus("집중 모드 전환에 실패했습니다.");
      return;
    }

    if (response?.status === "focus-on") {
      setStatus("집중 모드를 켰습니다.");
    } else if (response?.status === "focus-off") {
      setStatus("집중 모드를 껐습니다.");
    } else if (response?.status === "not-allowed") {
      setStatus("네이버 쇼핑/브랜드 도메인에서만 사용할 수 있어요.");
    } else {
      setStatus("탭을 찾을 수 없습니다.");
    }
  });
});

saveButton.addEventListener("click", () => {
  const note = noteInput.value.trim();
  chrome.storage.local.set({ skpineNote: note }, () => {
    setStatus(note ? "메모를 저장했습니다." : "메모를 비웠습니다.");
  });
});

analyzeButton.addEventListener("click", () => {
  setStatus("상품 정보를 가져오는 중...");
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (!tabId) {
      setStatus("탭을 찾을 수 없습니다.");
      return;
    }

    chrome.tabs.sendMessage(tabId, { type: "collect-product" }, (response) => {
      if (chrome.runtime.lastError || !response?.payload?.name) {
        setStatus("상품 정보를 가져올 수 없습니다.");
        return;
      }

      chrome.runtime.sendMessage(
        { type: "analyze-product", payload: response.payload },
        (analysisResponse) => {
          if (analysisResponse?.status === "opened") {
            setStatus("skupine.ai에서 최저가를 분석합니다.");
          } else {
            setStatus("분석 페이지를 열 수 없습니다.");
          }
        }
      );
    });
  });
});
