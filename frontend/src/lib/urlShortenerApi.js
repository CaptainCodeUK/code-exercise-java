const DEFAULT_API_BASE_URL = 'https://localhost:7273'
const SHORTEN_PATH = '/UrlShortener/shorten'

function getApiBaseUrl() {
  return import.meta.env.VITE_URL_SHORTENER_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL
}

function normalizeAlias(customAlias) {
  return typeof customAlias === 'string' && customAlias.trim() ? customAlias.trim() : null
}

export async function shortenUrl({ fullUrl, customAlias }, { signal } = {}) {
  const response = await fetch(`${getApiBaseUrl()}${SHORTEN_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      fullUrl,
      customAlias: normalizeAlias(customAlias),
    }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`The API returned ${response.status}.`)
  }

  const payload = await response.json()

  if (!payload || typeof payload.shortUrl !== 'string') {
    throw new Error('The API returned an unexpected response shape.')
  }

  return payload
}
