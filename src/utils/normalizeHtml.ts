// src/utils/normalizeHtml.ts
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

/**
 * Remove full-document wrappers that sometimes get stored into DB
 * (e.g. "<html><head>...</head><body>...</body></html>").
 */
export function stripHtmlDocWrapper(html = ""): string {
  let s = String(html || "");
  s = s.replace(/<\s*html[^>]*>/gi, "");
  s = s.replace(/<\/\s*html\s*>/gi, "");
  s = s.replace(/<\s*head[^>]*>[\s\S]*?<\/head\s*>/gi, "");
  s = s.replace(/<\s*body[^>]*>/gi, "");
  s = s.replace(/<\/\s*body\s*>/gi, "");
  return s.trim();
}

/**
 * Normalize & sanitize HTML server-side using jsdom + DOMPurify.
 *
 * Note: we cast the jsdom window to `any` to satisfy DOMPurify's type
 * requirement. This is fine on the server because we're intentionally
 * using a jsdom Window.
 */
const jsdom = new JSDOM("", { contentType: "text/html" });
const windowForPurify = jsdom.window;
// cast to any to avoid TS type mismatch between jsdom Window and DOMPurify's WindowLike
const DOMPurify = createDOMPurify(windowForPurify as unknown as any);

export function normalizeHtml(html = ""): string {
  const withoutWrapper = stripHtmlDocWrapper(html);
  const sanitized = DOMPurify.sanitize(withoutWrapper, {
    USE_PROFILES: { html: true },
  });
  return String(sanitized ?? "").trim();
}
