import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deleteShortenedUrl,
  findShortenedUrl,
  getApiBaseUrl,
  listShortenedUrls,
  shortenUrl,
} from './urlShortenerApi'

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: async () => body,
  }
}

function textResponse(status) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'text/plain' },
    json: async () => {
      throw new Error('not json')
    },
  }
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('getApiBaseUrl', () => {
  it('falls back to the default when no env override is set', () => {
    vi.stubEnv('VITE_URL_SHORTENER_API_BASE_URL', '')
    expect(getApiBaseUrl()).toBe('https://localhost:7273')
  })

  it('uses a trimmed env override when set', () => {
    vi.stubEnv('VITE_URL_SHORTENER_API_BASE_URL', '  http://api.local:8081  ')
    expect(getApiBaseUrl()).toBe('http://api.local:8081')
  })

  it('falls back to the default when the env override is whitespace only', () => {
    vi.stubEnv('VITE_URL_SHORTENER_API_BASE_URL', '   ')
    expect(getApiBaseUrl()).toBe('https://localhost:7273')
  })
})

describe('shortenUrl', () => {
  it('posts fullUrl and a trimmed customAlias, returns the payload on success', async () => {
    fetch.mockResolvedValue(jsonResponse(201, { shortUrl: 'https://localhost:7273/my-alias' }))

    const result = await shortenUrl({ fullUrl: 'https://example.com', customAlias: '  my-alias  ' })

    expect(fetch).toHaveBeenCalledWith(
      'https://localhost:7273/shorten',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ fullUrl: 'https://example.com', customAlias: 'my-alias' }),
      }),
    )
    expect(result).toEqual({ shortUrl: 'https://localhost:7273/my-alias' })
  })

  it('normalizes a blank customAlias to null', async () => {
    fetch.mockResolvedValue(jsonResponse(201, { shortUrl: 'https://localhost:7273/random' }))

    await shortenUrl({ fullUrl: 'https://example.com', customAlias: '   ' })

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ fullUrl: 'https://example.com', customAlias: null }),
      }),
    )
  })

  it('throws the API detail message on a JSON error response', async () => {
    fetch.mockResolvedValue(jsonResponse(400, { detail: 'Invalid input or alias already taken' }))

    await expect(shortenUrl({ fullUrl: 'not-a-url' })).rejects.toThrow(
      'Invalid input or alias already taken',
    )
  })

  it('throws a plain string error body as-is', async () => {
    fetch.mockResolvedValue(jsonResponse(400, 'Invalid input or alias already taken'))

    await expect(shortenUrl({ fullUrl: 'not-a-url' })).rejects.toThrow(
      'Invalid input or alias already taken',
    )
  })

  it('falls back to a generic message for a non-JSON error response', async () => {
    fetch.mockResolvedValue(textResponse(500))

    await expect(shortenUrl({ fullUrl: 'https://example.com' })).rejects.toThrow(
      'The API returned 500.',
    )
  })

  it('throws when the success payload is missing shortUrl', async () => {
    fetch.mockResolvedValue(jsonResponse(201, { alias: 'foo' }))

    await expect(shortenUrl({ fullUrl: 'https://example.com' })).rejects.toThrow(
      'The API returned an unexpected response shape.',
    )
  })
})

describe('listShortenedUrls', () => {
  it('returns the array payload on success', async () => {
    const urls = [{ alias: 'a', fullUrl: 'https://example.com/a', shortUrl: 'https://localhost:7273/a' }]
    fetch.mockResolvedValue(jsonResponse(200, urls))

    await expect(listShortenedUrls()).resolves.toEqual(urls)
  })

  it('throws when the payload is not an array', async () => {
    fetch.mockResolvedValue(jsonResponse(200, { not: 'an array' }))

    await expect(listShortenedUrls()).rejects.toThrow('The API returned an unexpected response shape.')
  })

  it('throws on a non-ok response', async () => {
    fetch.mockResolvedValue(textResponse(500))

    await expect(listShortenedUrls()).rejects.toThrow('The API returned 500.')
  })
})

describe('findShortenedUrl', () => {
  it('throws without calling fetch when alias is blank', async () => {
    await expect(findShortenedUrl('   ')).rejects.toThrow(
      'An alias is required to look up a shortened URL.',
    )
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns the matching entry', async () => {
    const urls = [
      { alias: 'a', fullUrl: 'https://example.com/a', shortUrl: 'https://localhost:7273/a' },
      { alias: 'b', fullUrl: 'https://example.com/b', shortUrl: 'https://localhost:7273/b' },
    ]
    fetch.mockResolvedValue(jsonResponse(200, urls))

    await expect(findShortenedUrl('b')).resolves.toEqual(urls[1])
  })

  it('returns null when no entry matches', async () => {
    fetch.mockResolvedValue(jsonResponse(200, []))

    await expect(findShortenedUrl('missing')).resolves.toBeNull()
  })
})

describe('deleteShortenedUrl', () => {
  it('throws without calling fetch when alias is blank', async () => {
    await expect(deleteShortenedUrl('')).rejects.toThrow(
      'An alias is required to delete a shortened URL.',
    )
    expect(fetch).not.toHaveBeenCalled()
  })

  it('URL-encodes the alias and resolves on success', async () => {
    fetch.mockResolvedValue({ ok: true, status: 204, headers: { get: () => '' } })

    await expect(deleteShortenedUrl('my alias')).resolves.toBeUndefined()

    expect(fetch).toHaveBeenCalledWith(
      'https://localhost:7273/my%20alias',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('throws on a non-ok response', async () => {
    fetch.mockResolvedValue(textResponse(404))

    await expect(deleteShortenedUrl('missing')).rejects.toThrow('The API returned 404.')
  })
})
