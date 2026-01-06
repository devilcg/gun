const PRICE_META_SELECTORS = [
  "meta[property='product:price:amount']",
  "meta[name='twitter:data1']",
  "meta[name='price']"
];

const NAME_META_SELECTORS = [
  "meta[property='og:title']",
  "meta[name='twitter:title']",
  "meta[name='title']"
];

const IMAGE_META_SELECTORS = [
  "meta[property='og:image']",
  "meta[name='twitter:image']"
];

const PRODUCT_NAME_SELECTORS = [
  "[data-testid='product_name']",
  "h1",
  "h2",
  ".product_name",
  ".product_title"
];

const PRICE_SELECTORS = [
  "[data-testid='product_price']",
  "[data-testid='product_price_value']",
  ".price",
  ".product_price",
  ".price_num"
];

const IMAGE_SELECTORS = [
  "img[data-testid='product_image']",
  ".product_image img",
  "img"
];

function getMetaContent(selectors) {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    const content = el?.getAttribute("content");
    if (content) {
      return content.trim();
    }
  }
  return "";
}

function getTextContent(selectors) {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    const text = el?.textContent?.trim();
    if (text) {
      return text;
    }
  }
  return "";
}

function normalizePrice(value) {
  if (!value) {
    return "";
  }

  const matched = value.replace(/[^\d]/g, "");
  return matched || value;
}

function collectImages() {
  const urls = new Set();
  const metaImage = getMetaContent(IMAGE_META_SELECTORS);
  if (metaImage) {
    urls.add(metaImage);
  }

  for (const selector of IMAGE_SELECTORS) {
    document.querySelectorAll(selector).forEach((img) => {
      const src = img.getAttribute("src") || img.getAttribute("data-src");
      if (src && src.startsWith("http")) {
        urls.add(src);
      }
    });
  }

  return Array.from(urls).slice(0, 5);
}

function collectProductData() {
  const name = getTextContent(PRODUCT_NAME_SELECTORS) || getMetaContent(NAME_META_SELECTORS);
  const priceText = getTextContent(PRICE_SELECTORS) || getMetaContent(PRICE_META_SELECTORS);
  const price = normalizePrice(priceText);
  const images = collectImages();

  return {
    name,
    price,
    images,
    sourceUrl: window.location.href
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "collect-product") {
    sendResponse({ status: "ok", payload: collectProductData() });
  }
});
