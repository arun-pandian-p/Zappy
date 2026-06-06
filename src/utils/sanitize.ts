import DOMPurify from "dompurify";

/**
 * Sanitize user-supplied string inputs using DOMPurify.
 * Strips all HTML/script tags, trims whitespace, and enforces length limits.
 */
export function sanitize(input: string | null | undefined, maxLength = 5000): string {
  if (!input) return "";

  // DOMPurify strips all HTML/SVG/MathML and returns clean text
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],    // Strip ALL tags
    ALLOWED_ATTR: [],    // Strip ALL attributes
  });

  // Trim and enforce max length
  return clean.trim().slice(0, maxLength);
}

/**
 * Sanitize for display in HTML contexts (allows basic formatting tags).
 */
export function sanitizeHTML(
  input: string | null | undefined,
  maxLength = 10000
): string {
  if (!input) return "";

  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "br", "p", "ul", "ol", "li"],
    ALLOWED_ATTR: [],
  });

  return clean.trim().slice(0, maxLength);
}

/**
 * Validate and sanitize numeric input to prevent injection.
 */
export function sanitizeNumber(input: unknown, fallback = 0): number {
  const num = Number(input);
  if (!Number.isFinite(num)) return fallback;
  return num;
}

/**
 * Sanitize UUID format to prevent injection in query parameters.
 */
export function sanitizeUUID(input: string | null | undefined): string | null {
  if (!input) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(input) ? input : null;
}
