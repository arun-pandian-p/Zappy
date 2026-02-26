/**
 * Global fetch wrapper with automatic retry + timeout for resilience
 * against transient network failures ("Failed to fetch").
 */

const MAX_RETRIES = 3;
const TIMEOUT_MS = 15_000;
const RETRY_DELAYS = [1000, 2000, 4000]; // exponential backoff

function isRetryableError(err: unknown): boolean {
  if (err instanceof TypeError && err.message === 'Failed to fetch') return true;
  if (err instanceof DOMException && err.name === 'AbortError') return true;
  return false;
}

async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await originalFetch(input, {
        ...init,
        signal: init?.signal || controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      lastError = err;
      if (!isRetryableError(err) || attempt === MAX_RETRIES - 1) {
        throw err;
      }
      // Wait before retrying
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
    }
  }

  throw lastError;
}

// Store the original fetch before overriding
let originalFetch = window.fetch.bind(window);

/**
 * Call this once at app startup (in main.tsx) to install the retry wrapper.
 */
export function installFetchRetry() {
  originalFetch = window.fetch.bind(window);
  window.fetch = fetchWithRetry;
}
