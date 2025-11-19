/**
 * Resilient fetch utility with retry logic and fallback URLs
 * Helps make the app more resilient to API failures
 */

interface ResilientFetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  fallbackUrls?: string[];
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Fetch with retry logic and timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Resilient fetch that retries on failure
 */
export async function resilientFetch(
  url: string,
  options: ResilientFetchOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 10000,
    fallbackUrls = [],
    onRetry,
    ...fetchOptions
  } = options;

  const allUrls = [url, ...fallbackUrls];
  let lastError: Error | null = null;

  // Try each URL
  for (const currentUrl of allUrls) {
    // Retry logic for each URL
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          if (onRetry) {
            onRetry(attempt, lastError || new Error('Unknown error'));
          }
          console.log(`[ResilientFetch] Retry ${attempt}/${retries} for ${currentUrl}`);
        }

        const response = await fetchWithTimeout(currentUrl, fetchOptions, timeout);
        
        // Check if response is ok
        if (!response.ok && attempt < retries) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // If we switched URLs, log it
        if (currentUrl !== url && attempt === 0) {
          console.log(`[ResilientFetch] Using fallback URL: ${currentUrl}`);
        }

        return response;
      } catch (error: any) {
        lastError = error;
        if (attempt < retries) {
          console.warn(`[ResilientFetch] Attempt ${attempt + 1}/${retries + 1} failed for ${currentUrl}:`, error.message);
        }
      }
    }
  }

  // All URLs and retries failed
  console.error(`[ResilientFetch] All attempts failed for ${url} and ${fallbackUrls.length} fallback(s)`);
  throw lastError || new Error(`Failed to fetch ${url} after ${retries} retries`);
}

/**
 * Resilient fetch with JSON parsing
 */
export async function resilientFetchJson<T = any>(
  url: string,
  options: ResilientFetchOptions = {}
): Promise<T> {
  const response = await resilientFetch(url, options);
  
  try {
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`[ResilientFetch] Failed to parse JSON from ${url}:`, error);
    throw new Error(`Failed to parse JSON response from ${url}`);
  }
}

/**
 * Helper for poolexplorer.xyz API calls with fallback
 */
export async function fetchPoolexplorer<T = any>(
  endpoint: string,
  options: ResilientFetchOptions = {}
): Promise<T> {
  const baseUrl = 'https://poolexplorer.xyz';
  const fullUrl = endpoint.startsWith('http') ? endpoint : `${baseUrl}/${endpoint}`;
  
  // Add fallback URLs (you can add more if you have backup servers)
  const fallbackUrls: string[] = [];
  // Example: fallbackUrls.push(`https://backup.poolexplorer.xyz/${endpoint}`);
  
  return resilientFetchJson<T>(fullUrl, {
    ...options,
    fallbackUrls,
    retries: options.retries ?? 2,
    timeout: options.timeout ?? 8000,
  });
}

/**
 * Helper for CoinGecko API calls with fallback
 */
export async function fetchCoinGecko<T = any>(
  endpoint: string,
  options: ResilientFetchOptions = {}
): Promise<T> {
  const baseUrl = 'https://api.coingecko.com/api/v3';
  const fullUrl = endpoint.startsWith('http') ? endpoint : `${baseUrl}/${endpoint}`;
  
  // CoinGecko has rate limits, so we use fewer retries
  return resilientFetchJson<T>(fullUrl, {
    ...options,
    retries: options.retries ?? 1,
    timeout: options.timeout ?? 10000,
  });
}

