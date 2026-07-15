const DEFAULT_API_BASE_URL = 'https://localhost:7273'
const SHORTEN_PATH = '/UrlShortener/shorten'

function getApiBaseUrl() {
  return import.meta.env.VITE_URL_SHORTENER_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL
}

function normalizeAlias(customAlias) {
  return typeof customAlias === 'string' && customAlias.trim() ? customAlias.trim() : null
}

async function readErrorMessage(response) {
  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    return `The API returned ${response.status}.`
  }

  try {
    const errorBody = await response.json()

    if (typeof errorBody === 'string' && errorBody.trim()) {
      return errorBody
    }

    return (
      errorBody?.detail ||
      errorBody?.title ||
      errorBody?.message ||
      `The API returned ${response.status}.`
    )
  } catch {
    return `The API returned ${response.status}.`
  }
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
    throw new Error(await readErrorMessage(response))
  }

  const payload = await response.json()

  if (!payload || typeof payload.shortUrl !== 'string') {
    throw new Error('The API returned an unexpected response shape.')
  }

  return payload
}
